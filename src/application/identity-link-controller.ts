import { SessionError } from './session-controller';
import type {
  SessionController,
  SessionReason,
  SignInProvider,
  SignInTransport,
} from './session-controller';
import type {
  SignInMethodsReader,
  SignInMethodsSnapshot,
  LinkReturn,
} from './identity-ports';
import type { GateClock } from './compatibility-gate';
export interface IdentityLinkState {
  stage:
    | 'idle'
    | 'confirming'
    | 'proving'
    | 'ready-to-link'
    | 'linking'
    | 'checking'
    | 'linked'
    | 'unchanged'
    | 'uncertain'
    | 'error'
    | 'cancelling';
  target: SignInProvider | null;
  existing: SignInProvider | null;
  reason: SessionReason;
  pending: boolean;
}
export function createIdentityLinkController(
  port: SignInMethodsReader,
  session: SessionController,
  clock: GateClock,
  onSnapshot: (snapshot: SignInMethodsSnapshot) => void,
  deadlineMs = 15000,
) {
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0)
    throw Error('Invalid link deadline');
  let state: IdentityLinkState = {
    stage: 'idle',
    target: null,
    existing: null,
    reason: 'none',
    pending: false,
  };
  let binding: { uid: string; generation: number } | undefined;
  let operation = 0,
    disposed = false,
    submitted = false;
  let proofId: string | undefined;
  let transport: SignInTransport = 'popup';
  let rejectWait: (() => void) | undefined;
  const listeners = new Set<(state: IdentityLinkState) => void>();
  function publish(next: Partial<IdentityLinkState>) {
    state = Object.freeze({ ...state, ...next });
    for (const fn of listeners) fn(state);
  }
  function current(id: number) {
    const s = session.getState();
    return (
      !disposed &&
      id === operation &&
      s.status === 'signed-in' &&
      s.identity?.uid === binding?.uid &&
      s.generation === binding?.generation
    );
  }
  function invalidate() {
    operation++;
    proofId = undefined;
    rejectWait?.();
    port.cancelLink?.();
  }
  function close() {
    invalidate();
    submitted = false;
    publish({ stage: 'idle', target: null, existing: null, reason: 'none' });
  }
  async function bounded<T>(
    work: Promise<T>,
    reason: SessionReason,
  ): Promise<T> {
    let stop: (() => void) | undefined;
    try {
      return await Promise.race([
        work,
        new Promise<never>((_resolve, reject) => {
          stop = clock.schedule(
            () => reject(new SessionError(reason)),
            deadlineMs,
          );
        }),
      ]);
    } finally {
      stop?.();
    }
  }
  async function ready(id: number) {
    if (!current(id)) throw new SessionError('cancelled');
    if (!session.getState().protectedReady) {
      let unsubscribe: (() => void) | undefined;
      await bounded(
        new Promise<void>((resolve, reject) => {
          const stop = session.subscribe(() => {
            if (!current(id)) {
              stop();
              reject(new SessionError('cancelled'));
            } else if (session.getState().protectedReady) {
              stop();
              resolve();
            }
          });
          unsubscribe = stop;
          rejectWait = () => {
            stop();
            reject(new SessionError('cancelled'));
          };
        }),
        'compatibility',
      ).finally(() => {
        unsubscribe?.();
        rejectWait = undefined;
      });
    }
    if (!current(id) || !session.getState().protectedReady)
      throw new SessionError('cancelled');
  }
  async function snapshot(id: number) {
    await ready(id);
    const admission = session.admit();
    const result = await bounded(
      port.readSignInMethods(admission.uid),
      'network',
    );
    if (!current(id) || !session.isCurrent(admission))
      throw new SessionError('compatibility');
    if (
      result.uid !== admission.uid ||
      !Array.isArray(result.providers) ||
      result.providers.some((p) => p !== 'google' && p !== 'microsoft')
    )
      throw new SessionError('restoration');
    onSnapshot(result);
    return result;
  }
  const reasonOf = (e: unknown): SessionReason =>
    e instanceof SessionError ? e.reason : 'provider-unavailable';
  function bind() {
    const ticket = session.admit();
    binding = { uid: ticket.uid, generation: ticket.generation };
    return ticket;
  }
  async function reconcile(id: number, reason: SessionReason, retry = false) {
    publish({ stage: 'checking', reason });
    try {
      const value = await snapshot(id);
      if (!current(id)) return;
      const linked = value.providers.includes(state.target!);
      const definite = [
        'link-conflict',
        'cancelled',
        'popup-blocked',
        'provider-configuration',
        'proof-expired',
        'wrong-account',
      ].includes(reason);
      publish({
        stage: linked
          ? reason === 'link-conflict'
            ? 'error'
            : 'linked'
          : retry || definite
            ? 'unchanged'
            : 'uncertain',
        reason: linked
          ? reason === 'link-conflict'
            ? 'link-conflict'
            : 'none'
          : reason === 'none'
            ? 'link-uncertain'
            : reason,
      });
    } catch (error) {
      if (current(id)) publish({ stage: 'uncertain', reason: reasonOf(error) });
    }
  }
  async function returned(value: LinkReturn) {
    const ticket = bind();
    if (ticket.uid !== value.uid) {
      port.cancelLink?.();
      return;
    }
    const id = ++operation;
    transport = 'redirect';
    submitted = value.stage === 'checking';
    proofId = value.proofId;
    publish({
      stage: value.stage === 'checking' ? 'checking' : 'proving',
      target: value.target,
      existing: value.existing,
      reason: value.reason,
      pending: true,
    });
    try {
      if (value.stage === 'checking') await reconcile(id, value.reason);
      else if (value.stage === 'error') {
        await snapshot(id);
        if (current(id)) publish({ stage: 'error', reason: value.reason });
      } else {
        const result = await snapshot(id);
        if (!current(id)) return;
        if (result.providers.includes(value.target)) {
          port.cancelLink?.();
          proofId = undefined;
          publish({ stage: 'linked' });
        } else if (!value.proofId || !result.providers.includes(value.existing))
          throw new SessionError('proof-expired');
        else publish({ stage: 'ready-to-link', reason: 'none' });
      }
    } catch (error) {
      if (current(id))
        publish({
          stage: submitted ? 'uncertain' : 'error',
          reason: reasonOf(error),
        });
    } finally {
      publish({ pending: false });
    }
  }
  const stopSession = session.subscribe((s) => {
    if (disposed) return;
    if (state.stage === 'idle') {
      if (!state.pending && s.protectedReady) {
        const value = port.takeLinkReturn?.();
        if (value) void returned(value);
      }
      return;
    }
    if (
      s.status !== 'signed-in' ||
      s.identity?.uid !== binding?.uid ||
      s.generation !== binding?.generation
    ) {
      close();
      return;
    }
    if (!s.protectedReady && !submitted) {
      const gate = session.getCompatibilityState();
      if (
        gate.reason !== 'hidden' &&
        gate.status !== 'checking' &&
        gate.reason !== 'server-unverified'
      ) {
        invalidate();
        publish({ stage: 'error', reason: 'compatibility' });
      }
    }
  });
  return {
    getState: () => state,
    subscribe(fn: (s: IdentityLinkState) => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    request(target: SignInProvider, providers: readonly SignInProvider[]) {
      if (
        disposed ||
        state.pending ||
        !port.proveLink ||
        !port.submitLink ||
        !session.getState().protectedReady ||
        providers.length === 0
      )
        return;
      invalidate();
      bind();
      submitted = false;
      publish({
        stage: providers.includes(target) ? 'linked' : 'confirming',
        target,
        existing: null,
        reason: 'none',
      });
    },
    async prove(
      existing: SignInProvider,
      selectedTransport: SignInTransport,
      providers: readonly SignInProvider[],
    ) {
      if (
        disposed ||
        state.pending ||
        !port.proveLink ||
        state.stage !== 'confirming' ||
        !state.target ||
        !providers.includes(existing) ||
        existing === state.target ||
        !session.getState().protectedReady
      )
        return;
      const ticket = bind(),
        id = ++operation;
      const target = state.target;
      transport = selectedTransport;
      submitted = false;
      publish({ stage: 'proving', existing, pending: true, reason: 'none' });
      try {
        const result = await port.proveLink(
          ticket.uid,
          target,
          existing,
          transport,
        );
        if (!current(id)) return;
        if (result.uid !== ticket.uid || !result.proofId)
          throw new SessionError('wrong-account');
        proofId = result.proofId;
        const status = await snapshot(id);
        if (!current(id)) return;
        if (status.providers.includes(target)) {
          port.cancelLink?.();
          proofId = undefined;
          publish({ stage: 'linked' });
        } else if (!status.providers.includes(existing))
          throw new SessionError('proof-expired');
        else publish({ stage: 'ready-to-link' });
      } catch (error) {
        if (current(id)) {
          proofId = undefined;
          port.cancelLink?.();
          publish({ stage: 'error', reason: reasonOf(error) });
        }
      } finally {
        publish({ pending: false });
      }
    },
    async submit() {
      if (
        disposed ||
        state.pending ||
        state.stage !== 'ready-to-link' ||
        !proofId ||
        !state.target ||
        !port.submitLink ||
        !session.getState().protectedReady
      )
        return;
      const id = operation;
      const ticket = session.admit();
      if (
        ticket.uid !== binding?.uid ||
        ticket.generation !== binding.generation
      ) {
        close();
        return;
      }
      const granted = proofId;
      proofId = undefined;
      submitted = true;
      publish({ stage: 'linking', pending: true, reason: 'none' });
      let reason: SessionReason = 'none';
      try {
        try {
          const result = await port.submitLink(
            ticket.uid,
            state.target,
            granted,
            transport,
          );
          if (result.uid !== ticket.uid) reason = 'link-uncertain';
        } catch (error) {
          reason = reasonOf(error);
        }
        if (current(id)) await reconcile(id, reason);
      } finally {
        publish({ pending: false });
      }
    },
    async check() {
      if (
        disposed ||
        state.pending ||
        state.stage !== 'uncertain' ||
        !session.getState().protectedReady
      )
        return;
      const id = operation;
      publish({ pending: true });
      try {
        await reconcile(id, state.reason, true);
      } finally {
        publish({ pending: false });
      }
    },
    cancel() {
      if (state.stage === 'idle') return;
      if (submitted && state.pending) {
        port.cancelLink?.();
        publish({ stage: 'cancelling', reason: 'link-uncertain' });
      } else close();
    },
    close,
    dispose() {
      if (disposed) return;
      close();
      disposed = true;
      stopSession();
      listeners.clear();
    },
  };
}
