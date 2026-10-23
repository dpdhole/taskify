import type {
  Admission,
  CompatibilityGate,
  GateClock,
} from './compatibility-gate';

export interface SessionIdentity {
  uid: string;
  displayName?: string;
  email?: string;
}
export type SessionReason =
  | 'none'
  | 'configuration'
  | 'persistence'
  | 'network'
  | 'restoration'
  | 'logout'
  | 'logout-timeout'
  | 'timeout'
  | 'cancelled'
  | 'popup-blocked'
  | 'account-conflict'
  | 'provider-configuration'
  | 'provider-unavailable';
export class SessionError extends Error {
  readonly reason: SessionReason;
  constructor(reason: SessionReason) {
    super(reason);
    this.reason = reason;
  }
}
export type SignInProvider = 'google' | 'microsoft';
export type SignInTransport = 'popup' | 'redirect';
export interface AuthPort {
  signIn?(provider: SignInProvider, transport: SignInTransport): Promise<void>;
  initialize(): Promise<void>;
  observe(
    next: (identity: SessionIdentity | null) => void,
    error: () => void,
  ): () => void;
  signOut(): Promise<void>;
  dispose(): void;
}
export interface SessionState {
  status:
    | 'restoring'
    | 'signed-out'
    | 'signed-in'
    | 'signing-in'
    | 'signing-out'
    | 'error'
    | 'disposed';
  identity: SessionIdentity | null;
  generation: number;
  reason: SessionReason;
  protectedReady: boolean;
  canLogout: boolean;
  canSignIn: boolean;
  provider: SignInProvider | null;
}
export interface SessionAdmission {
  uid: string;
  generation: number;
  compatibility: Admission;
}
export type SessionController = ReturnType<typeof createSessionController>;

export function createSessionController(
  auth: AuthPort,
  gate: CompatibilityGate,
  clock: GateClock,
  clearAccountState: () => void,
  deadlineMs = 15000,
) {
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0)
    throw Error('Invalid session deadline');
  let state: SessionState = {
    status: 'restoring',
    identity: null,
    generation: 0,
    reason: 'none',
    protectedReady: false,
    canLogout: false,
    canSignIn: false,
    provider: null,
  };
  let observed: SessionIdentity | null = null;
  let observationReceived = false;
  let initialized = false;
  let disposed = false;
  let cycle = 0;
  let stop: (() => void) | undefined;
  let cancelDeadline: (() => void) | undefined;
  let stopLogout: (() => void) | undefined;
  let logout: { sdkConfirmed: boolean; observerConfirmed: boolean } | undefined;
  let quarantine = false;
  let signOutPending: number | undefined;
  let signOutSequence = 0;
  let initializationFailed = false;
  let signInPending = false;
  let signInSequence = 0;
  const subscribers = new Set<(state: SessionState) => void>();
  function emit() {
    state = {
      ...state,
      protectedReady:
        state.status === 'signed-in' &&
        initialized &&
        !quarantine &&
        gate.getState().status === 'ready',
      canSignIn:
        !disposed &&
        initialized &&
        !signInPending &&
        !quarantine &&
        !logout &&
        !signOutPending &&
        state.status === 'signed-out' &&
        gate.getState().status === 'ready' &&
        Boolean(auth.signIn),
      canLogout:
        !disposed &&
        !signOutPending &&
        !logout &&
        (observed !== null || quarantine || signInPending),
    };
    for (const subscriber of subscribers) subscriber(state);
  }
  function invalidate() {
    state = {
      ...state,
      identity: null,
      protectedReady: false,
      generation: state.generation + 1,
    };
    clearAccountState();
  }
  function fail(reason: SessionReason) {
    cancelDeadline?.();
    stopLogout?.();
    stopLogout = undefined;
    invalidate();
    state = { ...state, status: 'error', reason };
    emit();
  }
  function restore() {
    if (
      !initialized ||
      !observationReceived ||
      quarantine ||
      logout ||
      signInPending
    )
      return;
    cancelDeadline?.();
    state = {
      ...state,
      status: observed ? 'signed-in' : 'signed-out',
      identity: observed,
      reason: 'none',
    };
    emit();
  }
  function confirmLogout() {
    if (!logout?.sdkConfirmed || !logout.observerConfirmed) return;
    cancelDeadline?.();
    logout = undefined;
    stopLogout?.();
    stopLogout = undefined;
    quarantine = false;
    state = { ...state, status: 'signed-out', identity: null, reason: 'none' };
    emit();
  }
  function start() {
    if (disposed || quarantine || signOutPending || signInPending) return;
    cycle++;
    const epoch = cycle;
    stop?.();
    cancelDeadline?.();
    initialized = false;
    observationReceived = false;
    initializationFailed = false;
    invalidate();
    state = { ...state, status: 'restoring', reason: 'none' };
    emit();
    cancelDeadline = clock.schedule(() => {
      if (!disposed && cycle === epoch) {
        cycle++;
        stop?.();
        stop = undefined;
        fail('timeout');
      }
    }, deadlineMs);
    try {
      stop = auth.observe(
        (identity) => {
          if (disposed || cycle !== epoch) return;
          const next = identity ? Object.freeze({ ...identity }) : null;
          if (next && (!next.uid || typeof next.uid !== 'string')) {
            initialized = false;
            initializationFailed = true;
            fail('restoration');
            return;
          }
          if (next?.uid !== observed?.uid) invalidate();
          observed = next;
          observationReceived = true;
          if (logout) {
            logout.observerConfirmed = next === null;
            confirmLogout();
          } else if (!quarantine) restore();
          emit();
        },
        () => {
          if (!disposed && cycle === epoch) {
            initialized = false;
            initializationFailed = true;
            if (!quarantine) fail('restoration');
          }
        },
      );
      void auth.initialize().then(
        () => {
          if (!disposed && cycle === epoch && !initializationFailed) {
            initialized = true;
            restore();
          }
        },
        (error: unknown) => {
          if (!disposed && cycle === epoch) {
            initialized = false;
            if (!quarantine)
              fail(
                error instanceof SessionError ? error.reason : 'restoration',
              );
          }
        },
      );
    } catch {
      if (!disposed && cycle === epoch) fail('restoration');
    }
  }
  const stopGate = gate.subscribe(() => {
    if (!disposed) emit();
  });
  function isCurrent(ticket: SessionAdmission) {
    return (
      !disposed &&
      state.protectedReady &&
      ticket.uid === state.identity?.uid &&
      ticket.generation === state.generation &&
      gate.isCurrent(ticket.compatibility)
    );
  }
  return {
    getState: () => state,
    subscribe(listener: (value: SessionState) => void) {
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    },
    start,
    retry: start,
    async signIn(provider: SignInProvider, transport: SignInTransport) {
      if (
        disposed ||
        !initialized ||
        signInPending ||
        quarantine ||
        logout ||
        signOutPending ||
        state.status !== 'signed-out' ||
        gate.getState().status !== 'ready' ||
        !auth.signIn
      )
        return;
      gate.admit();
      const attempt = ++signInSequence;
      signInPending = true;
      invalidate();
      state = { ...state, status: 'signing-in', reason: 'none', provider };
      emit();
      try {
        await auth.signIn(provider, transport);
        if (disposed || attempt !== signInSequence) return;
        signInPending = false;
        restore();
      } catch (error: unknown) {
        if (disposed || attempt !== signInSequence) return;
        signInPending = false;
        restore();
        if (!observed) {
          state = {
            ...state,
            reason:
              error instanceof SessionError
                ? error.reason
                : 'provider-unavailable',
          };
          emit();
        }
      } finally {
        if (attempt !== signInSequence) signInPending = false;
        if (!disposed) emit();
      }
    },
    async signOut() {
      if (
        disposed ||
        signOutPending ||
        logout ||
        (!observed && !quarantine && !signInPending)
      )
        return;
      signInSequence++;
      const signOutId = ++signOutSequence;
      signOutPending = signOutId;
      quarantine = true;
      invalidate();
      state = { ...state, status: 'signing-out', reason: 'none' };
      const operation = {
        sdkConfirmed: false,
        observerConfirmed: observationReceived && observed === null,
      };
      logout = operation;
      emit();
      cancelDeadline?.();
      cancelDeadline = clock.schedule(() => {
        if (!disposed && logout === operation) {
          logout = undefined;
          signOutPending = undefined;
          fail('logout-timeout');
        }
      }, deadlineMs);
      try {
        const release = auth.observe(
          (identity) => {
            if (disposed || logout !== operation) return;
            if (identity?.uid !== observed?.uid) invalidate();
            observed = identity ? Object.freeze({ ...identity }) : null;
            observationReceived = true;
            operation.observerConfirmed = observed === null;
            confirmLogout();
            emit();
          },
          () => {
            if (!disposed && logout === operation) {
              logout = undefined;
              fail('logout');
            }
          },
        );
        if (logout === operation) stopLogout = release;
        else {
          release();
          return;
        }
        await auth.signOut();
        if (disposed || logout !== operation) return;
        operation.sdkConfirmed = true;
        confirmLogout();
      } catch {
        if (!disposed && logout === operation) {
          logout = undefined;
          fail('logout');
        }
      } finally {
        if (signOutPending === signOutId) signOutPending = undefined;
        if (!disposed) emit();
      }
    },
    admit(): SessionAdmission {
      if (!state.protectedReady || !state.identity)
        throw Error('Authenticated session is closed');
      return Object.freeze({
        uid: state.identity.uid,
        generation: state.generation,
        compatibility: gate.admit(),
      });
    },
    isCurrent,
    submit<T>(ticket: SessionAdmission, operation: () => T): T {
      if (!isCurrent(ticket)) throw Error('Session admission expired');
      return operation();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cycle++;
      stop?.();
      cancelDeadline?.();
      stopLogout?.();
      stopGate();
      auth.dispose();
      invalidate();
      state = { ...state, status: 'disposed', canLogout: false };
      emit();
      subscribers.clear();
    },
  };
}
