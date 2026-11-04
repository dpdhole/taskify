import type { SessionAdmission, SessionController } from './session-controller';
import type { GateClock } from './compatibility-gate';
import { WorkspaceError } from './workspace-port';
import type {
  WorkspacePort,
  WorkspaceInitialInput,
  WorkspaceReason,
} from './workspace-port';
import { workspaceStages } from '../domain/workspace-stages';
export interface WorkspaceState {
  status:
    | 'idle'
    | 'waiting'
    | 'checking'
    | 'initializing'
    | 'ready'
    | 'error'
    | 'fenced'
    | 'timezone-required'
    | 'profile-invalid';
  phase: string;
  reason: WorkspaceReason | null;
  pending: boolean;
  profileName: string | null;
  timezone: string | null;
}
export function createWorkspaceController(
  port: WorkspacePort,
  session: SessionController,
  clock: GateClock,
  browserTimezone: () => string | undefined,
  deadlineMs = 20000,
) {
  if (!Number.isFinite(deadlineMs) || deadlineMs <= 0)
    throw Error('Invalid workspace deadline');
  let state: WorkspaceState = {
    status: 'idle',
    phase: '',
    reason: null,
    pending: false,
    profileName: null,
    timezone: null,
  };
  let binding: { uid: string; generation: number } | undefined;
  let input: WorkspaceInitialInput = {};
  let nonce = 0,
    active = false,
    disposed = false,
    fenceClear = false,
    requested = true,
    lastReady = false;
  let fenceSequence = 0;
  let stopFence: (() => void) | undefined;
  const listeners = new Set<(state: WorkspaceState) => void>();
  function publish(next: Partial<WorkspaceState>) {
    state = Object.freeze({ ...state, ...next });
    for (const listener of listeners) listener(state);
  }
  function reset() {
    nonce++;
    fenceSequence++;
    stopFence?.();
    stopFence = undefined;
    binding = undefined;
    fenceClear = false;
    input = {};
    requested = true;
    lastReady = false;
    publish({
      status: 'idle',
      phase: '',
      reason: null,
      pending: active,
      profileName: null,
      timezone: null,
    });
  }
  function queue() {
    void Promise.resolve().then(() => {
      if (!disposed) kick();
    });
  }
  function watch() {
    if (!binding || stopFence || !session.getState().protectedReady) return;
    const owner = binding;
    const token = ++fenceSequence;
    try {
      stopFence = port.watchFence(
        owner.uid,
        (exists, authoritative) => {
          if (disposed || binding !== owner || token !== fenceSequence) return;
          if (exists) {
            fenceClear = false;
            nonce++;
            publish({
              status: 'fenced',
              reason: 'fenced',
              phase: '',
              profileName: null,
              timezone: null,
            });
          } else if (!authoritative) {
            fenceClear = false;
            nonce++;
            publish({ status: 'waiting', reason: 'unavailable', phase: '' });
          } else {
            fenceClear = true;
            if (state.status === 'fenced' || state.status === 'waiting')
              requested = true;
            queue();
          }
        },
        () => {
          if (disposed || binding !== owner || token !== fenceSequence) return;
          fenceClear = false;
          nonce++;
          publish({ status: 'error', reason: 'unavailable', phase: '' });
        },
      );
    } catch {
      fenceClear = false;
      publish({ status: 'error', reason: 'unavailable', phase: '' });
    }
  }
  async function run(ticket: SessionAdmission) {
    const owner = binding!,
      id = ++nonce;
    const current = () =>
      !disposed &&
      binding === owner &&
      nonce === id &&
      fenceClear &&
      session.isCurrent(ticket);
    active = true;
    requested = false;
    publish({
      status: 'checking',
      pending: true,
      reason: null,
      phase: 'Checking your workspace',
    });
    let submitted = false;
    let cancelDeadline = () => {};
    async function bounded<T>(work: () => Promise<T>): Promise<T> {
      cancelDeadline();
      cancelDeadline = clock.schedule(() => {
        if (!disposed && binding === owner && nonce === id) {
          nonce++;
          publish({
            status: 'error',
            reason: submitted ? 'uncertain' : 'unavailable',
            phase: '',
          });
        }
      }, deadlineMs);
      try {
        return await work();
      } finally {
        cancelDeadline();
      }
    }
    try {
      const inspect = await bounded(() => port.inspect(owner.uid, current));
      if (!current()) return;
      if (!inspect.complete) {
        for (
          let index = inspect.nextStage;
          index < workspaceStages.length;
          index++
        ) {
          if (!current()) throw new WorkspaceError('revoked');
          const kind = workspaceStages[index]!.kind;
          publish({
            status: 'initializing',
            phase:
              kind === 'base'
                ? 'Creating your profile and settings'
                : kind === 'categories'
                  ? 'Preparing your categories'
                  : kind === 'locations'
                    ? 'Preparing your locations'
                    : 'Preparing your saved views',
          });
          submitted = true;
          await bounded(() => port.stage(owner.uid, index, input, current));
          if (!current()) return;
        }
        publish({ phase: 'Verifying your workspace' });
        submitted = true;
        await bounded(() => port.finalize(owner.uid, current));
        if (!current()) return;
      }
      const confirmed = inspect.complete
        ? inspect
        : await bounded(() => port.inspect(owner.uid, current));
      if (!current()) return;
      if (!confirmed.complete) throw new WorkspaceError('uncertain');
      const profile = confirmed.profile;
      publish({
        status: 'ready',
        phase: '',
        reason: null,
        profileName:
          profile &&
          'displayName' in profile &&
          typeof profile.displayName === 'string'
            ? profile.displayName
            : null,
        timezone: confirmed.timezone ?? null,
      });
    } catch (error) {
      if (disposed || binding !== owner || nonce !== id) return;
      const reason =
        error instanceof WorkspaceError
          ? error.reason
          : submitted
            ? 'uncertain'
            : 'unavailable';
      if (reason === 'revoked') {
        publish({ status: 'waiting', reason, phase: '' });
        requested = true;
      } else
        publish({
          status:
            reason === 'fenced'
              ? 'fenced'
              : reason === 'timezone-required'
                ? 'timezone-required'
                : reason === 'profile-invalid'
                  ? 'profile-invalid'
                  : 'error',
          reason,
          phase: '',
          profileName: null,
          timezone: null,
        });
    } finally {
      cancelDeadline();
      active = false;
      if (!disposed) {
        publish({ pending: false });
        queue();
      }
    }
  }
  function kick() {
    if (
      disposed ||
      active ||
      !binding ||
      !requested ||
      !session.getState().protectedReady ||
      !fenceClear
    )
      return;
    if (state.status === 'fenced') return;
    let ticket: SessionAdmission;
    try {
      ticket = session.admit();
    } catch {
      return;
    }
    void run(ticket);
  }
  function sync() {
    if (disposed) return;
    const s = session.getState();
    if (s.status !== 'signed-in' || !s.identity) {
      if (binding) reset();
      return;
    }
    if (
      binding?.uid !== s.identity.uid ||
      binding.generation !== s.generation
    ) {
      reset();
      binding = { uid: s.identity.uid, generation: s.generation };
      let timezone: string | undefined;
      try {
        timezone = browserTimezone();
      } catch {
        timezone = undefined;
      }
      input = {
        ...(timezone ? { timezone } : {}),
        profile: {
          ...(s.identity.displayName
            ? { displayName: s.identity.displayName }
            : {}),
          ...(s.identity.photoUrl ? { photoUrl: s.identity.photoUrl } : {}),
        },
      };
      publish({ status: 'waiting', phase: '', reason: null });
    }
    if (!s.protectedReady) {
      if (lastReady) {
        nonce++;
        requested = true;
      }
      lastReady = false;
      publish({ status: 'waiting', phase: '', reason: 'revoked' });
      return;
    }
    lastReady = true;
    watch();
    queue();
  }
  const stopSession = session.subscribe(sync);
  sync();
  return {
    getState: () => state,
    subscribe(listener: (state: WorkspaceState) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    clearAccountState: reset,
    retry() {
      if (disposed || active || !binding) return;
      nonce++;
      requested = true;
      stopFence?.();
      stopFence = undefined;
      fenceClear = false;
      publish({ status: 'waiting', reason: null });
      watch();
    },
    selectTimezone(timezone: string) {
      input = { ...input, timezone };
      this.retry();
    },
    continueWithoutProfile() {
      input = { ...input, profile: {} };
      this.retry();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      nonce++;
      stopSession();
      stopFence?.();
      listeners.clear();
      port.dispose();
    },
  };
}
export type WorkspaceController = ReturnType<typeof createWorkspaceController>;
