import type { SessionController } from './session-controller';
import { deletionId, deletionProofIsRecent } from '../domain/account-deletion';
import type { GateClock } from './compatibility-gate';
import { DeletionError } from './account-deletion-port';
import type {
  DeletionProof,
  DeletionProofPort,
  DeletionRequestPort,
  DeletionStatus,
} from './account-deletion-port';
import type {
  AccountDeletionControl,
  DeletionProvider,
} from '../domain/account-deletion';
export interface AccountDeletionState {
  status:
    | 'idle'
    | 'checking'
    | 'confirming'
    | 'proving'
    | 'proof-ready'
    | 'submitting'
    | 'uncertain'
    | 'requested'
    | 'blocked';
  uid: string | null;
  providers: readonly DeletionProvider[];
  control: AccountDeletionControl | null;
  reason: string;
}
/** Account-bound flow. Fence existence wins over every proof or local confirmation. */
export function createAccountDeletionController(
  requests: DeletionRequestPort,
  proof: DeletionProofPort,
  session: SessionController,
  clock: GateClock,
  jobId: () => string,
  online: () => boolean,
  deadlineMs = 20000,
) {
  let state: AccountDeletionState = {
    status: 'idle',
    uid: null,
    providers: [],
    control: null,
    reason: '',
  };
  let owner: { uid: string; generation: number } | undefined;
  let sequence = 0,
    disposed = false,
    active = false,
    submitted = false,
    resumeChecked = false;
  let granted: DeletionProof | undefined;
  let activity = 0;
  let stopWatch: (() => void) | undefined;
  let stopTimer: (() => void) | undefined;
  const listeners = new Set<(state: AccountDeletionState) => void>();
  function emit(patch: Partial<AccountDeletionState>) {
    state = { ...state, ...patch };
    for (const fn of listeners) fn(state);
  }
  function reset() {
    sequence++;
    activity++;
    active = false;
    stopWatch?.();
    stopWatch = undefined;
    stopTimer?.();
    stopTimer = undefined;
    proof.cancel();
    owner = undefined;
    granted = undefined;
    submitted = false;
    resumeChecked = false;
    emit({
      status: 'idle',
      uid: null,
      providers: [],
      control: null,
      reason: '',
    });
  }
  function bound(binding = owner) {
    const s = session.getState();
    return (
      !disposed &&
      Boolean(
        binding &&
        owner === binding &&
        s.status === 'signed-in' &&
        s.identity?.uid === binding.uid &&
        s.generation === binding.generation,
      )
    );
  }
  function ready() {
    return bound() && session.getState().protectedReady && online();
  }
  function accept(value: DeletionStatus) {
    if (value.exists) {
      sequence++;
      granted = undefined;
      submitted = true;
      proof.cancel();
      emit({
        status: 'requested',
        control: value.control,
        providers: [],
        reason: value.control ? '' : 'unsupported',
      });
    }
  }
  async function deadline<T>(work: Promise<T>): Promise<T> {
    let stop = () => {};
    try {
      return await Promise.race([
        work,
        new Promise<never>((_r, reject) => {
          stop = clock.schedule(
            () => reject(new DeletionError('unavailable')),
            deadlineMs,
          );
          stopTimer = stop;
        }),
      ]);
    } finally {
      stop();
      stopTimer = undefined;
    }
  }
  async function reconcile() {
    if (!owner || !bound()) return;
    const binding = owner,
      attempt = ++sequence;
    try {
      const result = await deadline(requests.read(binding.uid));
      if (!bound(binding) || attempt !== sequence) return;
      if (result.exists) accept(result);
      else if (submitted)
        emit({
          status: 'uncertain',
          reason:
            'Intent outcome is unresolved. Refresh status; do not repeat deletion.',
        });
      else emit({ status: 'idle', reason: '' });
    } catch {
      if (bound(binding) && attempt === sequence)
        emit({
          status: submitted ? 'uncertain' : 'blocked',
          reason: 'Status could not be verified. Refresh status or Logout.',
        });
    }
  }
  async function resumeProof(binding: NonNullable<typeof owner>) {
    if (resumeChecked || !ready() || submitted) return;
    resumeChecked = true;
    const attempt = sequence;
    try {
      const returned = await proof.resume(binding.uid);
      if (
        returned &&
        (returned.uid !== binding.uid ||
          !deletionProofIsRecent(returned.authTime, {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0,
          }))
      )
        throw new DeletionError('proof-invalid');
      if (returned) deletionId(returned.jobId);
      if (returned && bound(binding) && attempt === sequence && !submitted) {
        granted = returned;
        emit({
          status: 'proof-ready',
          providers: [returned.provider],
          reason: '',
        });
      }
    } catch {
      if (bound(binding) && attempt === sequence && !submitted)
        emit({
          status: 'blocked',
          reason:
            'Provider verification could not be confirmed. Start again or Logout.',
        });
    }
  }
  function sync() {
    const s = session.getState();
    if (s.status !== 'signed-in' || !s.identity) {
      if (owner && (s.status === 'signed-out' || s.status === 'signing-out'))
        requests.forget?.(owner.uid);
      if (owner) {
        reset();
      }
      return;
    }
    if (
      !owner ||
      owner.uid !== s.identity.uid ||
      owner.generation !== s.generation
    ) {
      // Do not cancel an unconsumed redirect marker when binding the first account.
      if (owner) {
        if (owner.uid !== s.identity.uid) requests.forget?.(owner.uid);
        reset();
      }
      owner = { uid: s.identity.uid, generation: s.generation };
      submitted = requests.hasPending?.(owner.uid) ?? false;
      const binding = owner;
      emit({ uid: binding.uid, status: 'checking' });
      try {
        stopWatch = requests.watch(
          binding.uid,
          (value, authoritative) => {
            if (!bound(binding)) return;
            if (value.exists && authoritative) accept(value);
            else if (value.exists) {
              sequence++;
              submitted = true;
              granted = undefined;
              proof.cancel();
              emit({
                status: 'uncertain',
                control: null,
                reason:
                  'Deletion status is awaiting cloud confirmation. Refresh status or Logout.',
              });
            } else if (authoritative && state.status === 'checking') {
              emit({
                status: submitted ? 'uncertain' : 'idle',
                reason: submitted
                  ? 'Previous submission outcome is unresolved. Refresh status or Logout.'
                  : '',
              });
              void resumeProof(binding);
            }
          },
          () => {
            if (bound(binding) && state.status !== 'requested')
              emit({
                status: submitted ? 'uncertain' : 'blocked',
                reason:
                  'Deletion status is unavailable. Refresh status or Logout.',
              });
          },
        );
      } catch {
        emit({
          status: submitted ? 'uncertain' : 'blocked',
          reason: 'Deletion status is unavailable. Refresh status or Logout.',
        });
      }
    }
    if (
      !s.protectedReady &&
      ['confirming', 'proof-ready'].includes(state.status)
    )
      emit({ reason: 'Waiting for verified connectivity and compatibility.' });
    if (ready() && owner && state.status === 'idle') void resumeProof(owner);
  }
  const stopSession = session.subscribe(sync);
  sync();
  return {
    getState: () => state,
    subscribe(fn: (state: AccountDeletionState) => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    async open() {
      if (!ready() || active || submitted) return;
      const binding = owner!,
        attempt = ++sequence;
      const work = ++activity;
      active = true;
      emit({ status: 'checking', reason: '' });
      try {
        const value = await deadline(requests.read(binding.uid));
        if (!bound(binding) || attempt !== sequence) return;
        if (value.exists) {
          accept(value);
          return;
        }
        const providers = await deadline(proof.providers(binding.uid));
        if (bound(binding) && attempt === sequence)
          emit({
            status: providers.length ? 'confirming' : 'blocked',
            providers,
            reason: providers.length
              ? ''
              : 'No supported linked sign-in method could be verified.',
          });
      } catch {
        if (bound(binding) && attempt === sequence)
          emit({
            status: 'blocked',
            reason:
              'Account verification is unavailable. Refresh status or Logout.',
          });
      } finally {
        if (work === activity) active = false;
      }
    },
    async prove(
      typed: string,
      provider: DeletionProvider,
      transport: 'popup' | 'redirect',
    ) {
      if (
        !ready() ||
        active ||
        submitted ||
        typed !== 'DELETE' ||
        state.status !== 'confirming' ||
        !state.providers.includes(provider)
      )
        return;
      const binding = owner!,
        attempt = ++sequence;
      const work = ++activity;
      active = true;
      emit({ status: 'proving', reason: '' });
      try {
        const id = jobId();
        const result = await proof.prove(binding.uid, id, provider, transport);
        if (
          result.uid !== binding.uid ||
          result.jobId !== id ||
          result.provider !== provider ||
          !deletionProofIsRecent(result.authTime, {
            seconds: Math.floor(Date.now() / 1000),
            nanoseconds: 0,
          })
        )
          throw new DeletionError('proof-invalid');
        if (bound(binding) && attempt === sequence && !submitted) {
          granted = result;
          emit({ status: 'proof-ready' });
        }
      } catch (error) {
        if (bound(binding) && attempt === sequence && !submitted)
          emit({
            status: 'confirming',
            reason:
              error instanceof DeletionError && error.reason === 'popup-blocked'
                ? 'Popup blocked. Allow popups or use redirect verification.'
                : 'Verification failed or was cancelled. No deletion request was sent.',
          });
      } finally {
        if (work === activity) active = false;
      }
    },
    async submit() {
      if (
        !ready() ||
        active ||
        submitted ||
        !granted ||
        state.status !== 'proof-ready'
      )
        return;
      const binding = owner!,
        attempt = ++sequence,
        evidence = granted;
      const ticket = session.admit();
      if (
        !deletionProofIsRecent(evidence.authTime, {
          seconds: Math.floor(Date.now() / 1000),
          nanoseconds: 0,
        })
      ) {
        granted = undefined;
        emit({
          status: 'confirming',
          reason: 'Verification expired. Verify your provider again.',
        });
        return;
      }
      if (ticket.compatibility.revision < 3) {
        emit({
          status: 'blocked',
          reason: 'Delete Account requires a compatible service release.',
        });
        return;
      }
      submitted = true;
      const work = ++activity;
      active = true;
      granted = undefined;
      emit({ status: 'submitting', reason: '' });
      try {
        const result = await deadline(
          requests.request(
            evidence,
            ticket.compatibility.revision,
            () => bound(binding) && session.isCurrent(ticket) && online(),
          ),
        );
        if (!bound(binding) || attempt !== sequence) return;
        if (result.exists) accept(result);
        else
          emit({
            status: 'uncertain',
            reason: 'Intent acknowledgement was not verified. Refresh status.',
          });
      } catch {
        if (bound(binding) && attempt === sequence)
          emit({
            status: 'uncertain',
            reason:
              'Intent acknowledgement was not verified. Refresh status or Logout.',
          });
      } finally {
        if (work === activity) active = false;
      }
    },
    cancel() {
      if (submitted) return;
      sequence++;
      activity++;
      active = false;
      proof.cancel();
      granted = undefined;
      emit({ status: 'idle', providers: [], reason: '' });
    },
    refresh: reconcile,
    dispose() {
      disposed = true;
      stopSession();
      reset();
      proof.dispose();
      requests.dispose();
      listeners.clear();
    },
  };
}
export type AccountDeletionController = ReturnType<
  typeof createAccountDeletionController
>;
