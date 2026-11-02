import { SessionError } from './session-controller';
import type {
  SessionController,
  SignInProvider,
  SignInTransport,
  SessionReason,
} from './session-controller';
import type { GateClock } from './compatibility-gate';
export type {
  SignInMethodsSnapshot,
  SignInMethodsReader,
} from './identity-ports';
import type { SignInMethodsReader } from './identity-ports';
import { createIdentityLinkController } from './identity-link-controller';
import type { IdentityLinkState } from './identity-link-controller';
export interface SignInMethodsState {
  link?: IdentityLinkState;
  status: 'closed' | 'checking' | 'ready' | 'unavailable';
  providers: readonly SignInProvider[];
  reason: 'none' | 'network' | 'session' | 'compatibility' | 'verification';
  verificationPending?: boolean;
  proof?: {
    status: 'verifying' | 'cancelling' | 'verified' | 'error';
    provider: SignInProvider;
    reason: SessionReason;
  };
}
export type SignInMethodsController = ReturnType<
  typeof createSignInMethodsController
>;
export function createSignInMethodsController(
  reader: SignInMethodsReader,
  session: SessionController,
  clock: GateClock,
  deadlineMs = 15000,
) {
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0)
    throw Error('Invalid methods deadline');
  let state: SignInMethodsState = {
    status: 'closed',
    providers: [],
    reason: 'none',
  };
  let disposed = false;
  let sequence = 0;
  let proofSequence = 0;
  let proofPending = false;
  let recoveryBudget = 1;
  let visibilityInterrupted = false;
  let resumeProof: (() => void) | undefined;
  let rejectProofWait: (() => void) | undefined;
  let binding: { uid: string; generation: number } | undefined;
  let cancelDeadline: (() => void) | undefined;
  const listeners = new Set<(state: SignInMethodsState) => void>();
  function publish(next: SignInMethodsState) {
    state = Object.freeze({
      status: next.status,
      reason: next.reason,
      providers: Object.freeze([...next.providers]),
      ...(next.proof ? { proof: Object.freeze({ ...next.proof }) } : {}),
      ...(proofPending ? { verificationPending: true } : {}),
      ...(linking.getState().stage !== 'idle' || linking.getState().pending
        ? { link: linking.getState() }
        : {}),
    });
    for (const listener of listeners) listener(state);
  }
  const linking = createIdentityLinkController(
    reader,
    session,
    clock,
    (snapshot) => {
      const current = session.getState();
      if (
        disposed ||
        !current.protectedReady ||
        current.identity?.uid !== snapshot.uid
      )
        return;
      binding = { uid: snapshot.uid, generation: current.generation };
      sequence++;
      cancelDeadline?.();
      publish({
        status: 'ready',
        providers: [...new Set(snapshot.providers)],
        reason: 'none',
      });
      const suggestion = session.getState().linkSuggestion;
      if (suggestion && snapshot.providers.includes(suggestion))
        session.clearLinkSuggestion();
    },
    deadlineMs,
  );
  const stopLink = linking.subscribe((link) => {
    if (disposed) return;
    if (
      state.status === 'closed' &&
      link.stage !== 'idle' &&
      session.getState().protectedReady
    ) {
      const ticket = session.admit();
      binding = { uid: ticket.uid, generation: ticket.generation };
      publish({ status: 'checking', providers: [], reason: 'none' });
    } else if (['linking', 'checking', 'cancelling'].includes(link.stage)) {
      publish({ status: 'checking', providers: [], reason: 'none' });
    } else if (link.stage === 'uncertain') {
      publish({ status: 'unavailable', providers: [], reason: 'verification' });
    } else if (
      state.status === 'checking' &&
      !link.pending &&
      ['error', 'uncertain'].includes(link.stage)
    ) {
      publish({ status: 'unavailable', providers: [], reason: 'verification' });
    } else publish({ ...state });
  });
  function invalidateProof() {
    proofSequence++;
    rejectProofWait?.();
    if (proofPending) reader.cancelReauthentication?.();
  }
  function close() {
    if (disposed) return;
    sequence++;
    invalidateProof();
    linking.close();
    cancelDeadline?.();
    binding = undefined;
    publish({ status: 'closed', providers: [], reason: 'none' });
  }
  function recoverStatusWhenReady() {
    const current = session.getState();
    if (
      !proofPending &&
      !linking.getState().pending &&
      state.status === 'unavailable' &&
      state.reason === 'compatibility' &&
      current.protectedReady &&
      current.identity?.uid === binding?.uid &&
      current.generation === binding?.generation
    ) {
      if (recoveryBudget > 0) {
        recoveryBudget--;
        void refresh(false);
      } else
        publish({
          status: 'unavailable',
          providers: [],
          reason: 'verification',
        });
    }
  }
  const stopSession = session.subscribe((current) => {
    if (disposed) return;
    if (state.status === 'closed') {
      if (
        current.protectedReady &&
        !proofPending &&
        reader.hasVerificationReturn?.()
      )
        void refresh();
      return;
    }
    if (
      current.status !== 'signed-in' ||
      current.identity?.uid !== binding?.uid ||
      current.generation !== binding?.generation
    ) {
      close();
      return;
    }
    if (!current.protectedReady) {
      const gate = session.getCompatibilityState();
      const visibilityPause =
        proofPending &&
        (gate.reason === 'hidden' ||
          gate.status === 'checking' ||
          gate.reason === 'server-unverified');
      sequence++;
      if (visibilityPause) visibilityInterrupted = true;
      else invalidateProof();
      cancelDeadline?.();
      publish({
        status: 'unavailable',
        providers: [],
        reason: 'compatibility',
        ...(visibilityPause && state.proof ? { proof: state.proof } : {}),
      });
    } else {
      resumeProof?.();
      recoverStatusWhenReady();
    }
  });
  async function refresh(explicit = true) {
    if (
      disposed ||
      state.status === 'checking' ||
      proofPending ||
      linking.getState().pending
    )
      return;
    if (explicit && linking.getState().stage !== 'idle') linking.close();
    if (explicit) recoveryBudget = 1;
    const current = session.getState();
    if (current.status !== 'signed-in' || !current.identity) {
      close();
      return;
    }
    binding = { uid: current.identity.uid, generation: current.generation };
    if (!current.protectedReady) {
      publish({
        status: 'unavailable',
        providers: [],
        reason: 'compatibility',
      });
      return;
    }
    invalidateProof();
    const ticket = session.admit();
    const operation = ++sequence;
    publish({ status: 'checking', providers: [], reason: 'none' });
    cancelDeadline?.();
    cancelDeadline = clock.schedule(() => {
      if (disposed || operation !== sequence) return;
      sequence++;
      publish({ status: 'unavailable', providers: [], reason: 'verification' });
    }, deadlineMs);
    try {
      const snapshot = await reader.readSignInMethods(ticket.uid);
      if (disposed || operation !== sequence) return;
      if (!session.isCurrent(ticket)) {
        publish({
          status: 'unavailable',
          providers: [],
          reason: 'verification',
        });
        return;
      }
      if (
        snapshot.uid !== ticket.uid ||
        !Array.isArray(snapshot.providers) ||
        snapshot.providers.some((p) => p !== 'google' && p !== 'microsoft')
      )
        throw Error('Invalid methods result');
      publish({
        status: 'ready',
        providers: [...new Set(snapshot.providers)],
        reason: 'none',
        ...(snapshot.verificationReturn &&
        snapshot.providers.includes(snapshot.verificationReturn.provider)
          ? {
              proof: {
                provider: snapshot.verificationReturn.provider,
                reason: snapshot.verificationReturn.reason,
                status:
                  snapshot.verificationReturn.reason === 'none'
                    ? ('verified' as const)
                    : ('error' as const),
              },
            }
          : {}),
      });
      const suggestion = session.getState().linkSuggestion;
      if (suggestion && snapshot.providers.includes(suggestion))
        session.clearLinkSuggestion();
    } catch (error) {
      if (disposed || operation !== sequence) return;
      if (!session.isCurrent(ticket)) {
        publish({
          status: 'unavailable',
          providers: [],
          reason: 'verification',
        });
        return;
      }
      publish({
        status: 'unavailable',
        providers: [],
        reason:
          error instanceof SessionError && error.reason === 'network'
            ? 'network'
            : 'verification',
      });
    } finally {
      if (operation === sequence) cancelDeadline?.();
    }
  }
  async function verify(provider: SignInProvider, transport: SignInTransport) {
    if (
      disposed ||
      proofPending ||
      linking.getState().stage !== 'idle' ||
      linking.getState().pending ||
      state.status !== 'ready' ||
      !state.providers.includes(provider) ||
      !reader.reauthenticate ||
      !session.getState().protectedReady
    )
      return;
    const ticket = session.admit();
    const attempt = ++proofSequence;
    visibilityInterrupted = false;
    proofPending = true;
    publish({
      ...state,
      proof: { status: 'verifying', provider, reason: 'none' },
    });
    const currentAttempt = () =>
      !disposed &&
      attempt === proofSequence &&
      session.getState().identity?.uid === ticket.uid &&
      session.getState().generation === ticket.generation;
    async function waitForReadiness() {
      if (!currentAttempt()) throw new SessionError('cancelled');
      if (session.getState().protectedReady) return;
      await new Promise<void>((resolve, reject) => {
        resumeProof = () => {
          if (session.getState().protectedReady) resolve();
        };
        rejectProofWait = () => reject(new SessionError('cancelled'));
        resumeProof();
      }).finally(() => {
        resumeProof = undefined;
        rejectProofWait = undefined;
      });
      if (!currentAttempt()) throw new SessionError('cancelled');
    }
    try {
      let reason: SessionReason = 'none';
      try {
        const result = await reader.reauthenticate(
          ticket.uid,
          provider,
          transport,
        );
        if (result.uid !== ticket.uid) reason = 'wrong-account';
      } catch (error) {
        reason =
          error instanceof SessionError ? error.reason : 'provider-unavailable';
      }
      if (!currentAttempt()) return;
      await waitForReadiness();
      let providers = state.providers;
      if (visibilityInterrupted) {
        // Identity proof is nonmutating. A visibility pause never grants reuse of
        // the old protected ticket: reload under fresh admission after returning.
        for (let checks = 0; ; checks++) {
          if (checks === 2) throw new SessionError('restoration');
          await waitForReadiness();
          if (!session.getState().protectedReady) continue;
          const admission = session.admit();
          const snapshot = await reader.readSignInMethods(ticket.uid);
          if (!currentAttempt()) return;
          if (!session.isCurrent(admission)) continue;
          if (
            snapshot.uid !== ticket.uid ||
            !Array.isArray(snapshot.providers) ||
            snapshot.providers.some((p) => p !== 'google' && p !== 'microsoft')
          )
            throw new SessionError('restoration');
          providers = [...new Set(snapshot.providers)];
          break;
        }
      }
      if (!currentAttempt() || !session.getState().protectedReady) return;
      session.admit();
      publish({
        status: 'ready',
        providers,
        reason: 'none',
        proof: {
          status: reason === 'none' ? 'verified' : 'error',
          provider,
          reason,
        },
      });
    } catch (error) {
      if (currentAttempt())
        publish({
          status: 'unavailable',
          providers: [],
          reason:
            error instanceof SessionError && error.reason === 'network'
              ? 'network'
              : 'verification',
        });
    } finally {
      resumeProof = undefined;
      rejectProofWait = undefined;
      proofPending = false;
      if (!disposed) {
        publish({
          ...state,
          ...(state.proof?.status === 'cancelling'
            ? {
                proof: {
                  status: 'error' as const,
                  provider,
                  reason: 'cancelled' as const,
                },
              }
            : {}),
        });
        recoverStatusWhenReady();
      }
    }
  }
  function cancelVerification() {
    if (disposed || !proofPending || !state.proof) return;
    invalidateProof();
    publish({
      ...state,
      proof: { ...state.proof, status: 'cancelling', reason: 'cancelled' },
    });
  }
  return {
    getState: () => state,
    subscribe(listener: (value: SignInMethodsState) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    open: refresh,
    refresh,
    verify,
    cancelVerification,
    close,
    requestLink(target: SignInProvider) {
      if (!proofPending && state.status === 'ready')
        linking.request(target, state.providers);
    },
    proveLink(existing: SignInProvider, transport: SignInTransport) {
      return linking.prove(existing, transport, state.providers);
    },
    submitLink: () => linking.submit(),
    checkLink: () => linking.check(),
    cancelLink: () => linking.cancel(),
    dispose() {
      if (disposed) return;
      close();
      disposed = true;
      sequence++;
      cancelDeadline?.();
      stopSession();
      stopLink();
      linking.dispose();
      listeners.clear();
    },
  };
}
