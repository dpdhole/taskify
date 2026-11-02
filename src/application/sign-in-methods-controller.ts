import { SessionError } from './session-controller';
import type {
  SessionController,
  SignInProvider,
  SignInTransport,
  SessionReason,
} from './session-controller';
import type { GateClock } from './compatibility-gate';
export interface SignInMethodsSnapshot {
  uid: string;
  verificationReturn?: { provider: SignInProvider; reason: SessionReason };
  providers: readonly SignInProvider[];
}
export interface SignInMethodsReader {
  readSignInMethods(uid: string): Promise<SignInMethodsSnapshot>;
  reauthenticate?(
    uid: string,
    provider: SignInProvider,
    transport: SignInTransport,
  ): Promise<{ uid: string }>;
  cancelReauthentication?(): void;
  hasVerificationReturn?(): boolean;
}
export interface SignInMethodsState {
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
    });
    for (const listener of listeners) listener(state);
  }
  function invalidateProof() {
    proofSequence++;
    if (proofPending) reader.cancelReauthentication?.();
  }
  function close() {
    if (disposed) return;
    sequence++;
    invalidateProof();
    cancelDeadline?.();
    binding = undefined;
    publish({ status: 'closed', providers: [], reason: 'none' });
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
      sequence++;
      invalidateProof();
      cancelDeadline?.();
      publish({
        status: 'unavailable',
        providers: [],
        reason: 'compatibility',
      });
    }
  });
  async function refresh() {
    if (disposed || state.status === 'checking' || proofPending) return;
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
      if (disposed || operation !== sequence || !session.isCurrent(ticket))
        return;
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
    } catch (error) {
      if (disposed || operation !== sequence || !session.isCurrent(ticket))
        return;
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
      state.status !== 'ready' ||
      !state.providers.includes(provider) ||
      !reader.reauthenticate ||
      !session.getState().protectedReady
    )
      return;
    const ticket = session.admit();
    const attempt = ++proofSequence;
    proofPending = true;
    publish({
      ...state,
      proof: { status: 'verifying', provider, reason: 'none' },
    });
    try {
      const result = await reader.reauthenticate(
        ticket.uid,
        provider,
        transport,
      );
      if (disposed || attempt !== proofSequence) return;
      const current = session.getState();
      if (result.uid !== ticket.uid) throw new SessionError('wrong-account');
      if (
        current.identity?.uid !== ticket.uid ||
        current.generation !== ticket.generation ||
        !current.protectedReady
      )
        return;
      session.admit();
      publish({
        ...state,
        proof: { status: 'verified', provider, reason: 'none' },
      });
    } catch (error) {
      if (disposed || attempt !== proofSequence || state.status !== 'ready')
        return;
      publish({
        ...state,
        proof: {
          status: 'error',
          provider,
          reason:
            error instanceof SessionError
              ? error.reason
              : 'provider-unavailable',
        },
      });
    } finally {
      proofPending = false;
      if (!disposed)
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
    dispose() {
      if (disposed) return;
      close();
      disposed = true;
      sequence++;
      cancelDeadline?.();
      stopSession();
      listeners.clear();
    },
  };
}
