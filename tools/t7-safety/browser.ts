import { baseCommitRequest, baseReinitializationBatch } from './probes';
import { createDeletionRequestAdapter } from '../../src/infrastructure/firebase/deletion-request-adapter';
import {
  decodeContract,
  evaluateCompatibility,
} from '../../src/domain/compatibility';
import { clientCapabilities } from '../../src/app/client-capabilities';
import { deletionProofIsRecent } from '../../src/domain/account-deletion';
import type { DeletionProof } from '../../src/application/account-deletion-port';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
  getIdToken,
  getIdTokenResult,
} from 'firebase/auth';
import type { Auth, IdTokenResult, User } from 'firebase/auth';
import {
  initializeFirestore,
  memoryLocalCache,
  doc,
  getDocFromServer,
  getDocFromCache,
  onSnapshot,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { decodeBrowserClientConfig } from '../../src/infrastructure/firebase/browser-client';
declare const __T7_CONFIG__: unknown;
type Client = { auth: Auth; db: Firestore };
const clients: Partial<Record<'online' | 'offline', Client>> = {};
const events: { at: string; kind: string; data: unknown }[] = [];
let pinnedUid = '',
  baseline = false,
  armed = false,
  removed = false,
  queued = false;
let queueTiming: 'before-fence' | 'after-removal' | null = null;
const probeStorageKey = 'taskify:t7:probe-run';
let probeRunId = sessionStorage.getItem(probeStorageKey);
const recoveredProbeOnly = probeRunId !== null;
let anchor: { seconds: number; nanoseconds: number } | null = null;
let deadline: { seconds: number; nanoseconds: number } | null = null;
let tokenExpiry = '';
let sequence = 0;
let overlapProof: DeletionProof | undefined;
let overlapStarted = false;
let captureOnly = false;
const project = 'taskify-dev-dpdhole';
const fenceFirstMode = location.port === '5184';
const el = (id: string) => document.getElementById(id)!;
const input = (id: string) => (el(id) as HTMLInputElement).value.trim();
const errorCode = (e: unknown) => {
  const code = (e as { code?: unknown })?.code;
  return typeof code === 'string' &&
    [
      'permission-denied',
      'unauthenticated',
      'unavailable',
      'auth/user-token-expired',
      'auth/invalid-user-token',
      'auth/user-disabled',
      'auth/user-not-found',
      'auth/popup-closed-by-user',
      'auth/popup-blocked',
      'capture-unavailable',
      'probe-request-failed',
    ].includes(code)
    ? code
    : 'unclassified';
};
function log(kind: string, data: unknown = {}) {
  events.push({ at: new Date().toISOString(), kind, data });
  el('status').textContent = JSON.stringify(
    {
      uid: pinnedUid,
      baseline,
      armed,
      removed,
      queued,
      queueTiming,
      tokenExpiry,
      authAbsentObservedAt: anchor,
      retireNotBefore: deadline,
      recoveredProbeOnly,
      captureOnly,
      t7Passed: false,
      events,
    },
    null,
    2,
  );
}
async function tokenProbe<T>(request: Record<string, string>) {
  const response = await fetch('/__t7_probe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-T7-Probe': '1' },
    body: JSON.stringify(request),
    cache: 'no-store',
  });
  if (!response.ok) {
    const code =
      response.status === 404 ? 'capture-unavailable' : 'probe-request-failed';
    throw Object.assign(new Error(code), { code });
  }
  return (await response.json()) as T;
}
function client(kind: 'online' | 'offline') {
  const c = clients[kind];
  if (!c || !pinnedUid || c.auth.currentUser?.uid !== pinnedUid)
    throw Error('Expected UID not connected');
  return c;
}
function action(id: string, work: () => Promise<void>) {
  (el(id) as HTMLButtonElement).onclick = () => {
    void work().catch((e) =>
      log('action-stopped', { action: id, code: errorCode(e) }),
    );
  };
}
for (const kind of ['online', 'offline'] as const)
  action(kind, async () => {
    if (clients[kind]) throw Error('Client already connected');
    const expected = input('uid');
    if (pinnedUid && expected !== pinnedUid)
      throw Error('Expected UID required');
    const app = initializeApp(
      decodeBrowserClientConfig(__T7_CONFIG__, location.hostname),
      `t7-${kind}-${++sequence}`,
    );
    const auth = getAuth(app);
    await setPersistence(auth, inMemoryPersistence);
    const provider =
      input('provider') === 'google'
        ? new GoogleAuthProvider()
        : new OAuthProvider('microsoft.com');
    await signInWithPopup(auth, provider);
    if (auth.currentUser?.uid !== expected) {
      log('uid-mismatch', {
        client: kind,
        expected,
        signedInUid: auth.currentUser?.uid,
      });
      return;
    }
    pinnedUid = expected;
    clients[kind] = {
      auth,
      db: initializeFirestore(app, { localCache: memoryLocalCache() }),
    };
    log('client-connected', { client: kind, uidMatches: true });
  });
async function assertEmptyUnfencedWorkspace(c: Client) {
  for (const suffix of [
    'initialization/workspace',
    'profile/main',
    'settings/main',
    'initializationStages/base',
  ])
    if (
      (
        await getDocFromServer(doc(c.db, `users/${pinnedUid}/${suffix}`))
      ).exists()
    )
      throw Error('Requires empty disposable workspace');
  if (
    (await getDocFromServer(doc(c.db, `accountDeletion/${pinnedUid}`))).exists()
  )
    throw Error('Account fenced');
}
action('baseline', async () => {
  if (armed || baseline) throw Error('Baseline already completed or armed');
  const c = client('online');
  await assertEmptyUnfencedWorkspace(c);
  await baseReinitializationBatch(c.db, pinnedUid).commit();
  baseline = true;
  log('baseline-valid-base-batch-accepted', { records: 4 });
});
async function captureOriginalToken(user: User, original?: IdTokenResult) {
  if (probeRunId || user.uid !== pinnedUid)
    throw Error('Capture already exists or UID mismatch');
  const token = original ?? (await getIdTokenResult(user));
  const capture = await tokenProbe<{ runId: string }>({
    action: 'capture',
    uid: pinnedUid,
    token: token.token,
  });
  sessionStorage.setItem(probeStorageKey, capture.runId);
  probeRunId = capture.runId;
  tokenExpiry = token.expirationTime;
  log('original-token-captured', {
    issuedAt: token.issuedAtTime,
    expiresAt: token.expirationTime,
    authTime: token.authTime,
  });
  return token;
}

action('capture-write-baseline', async () => {
  const c = client('online');
  await assertEmptyUnfencedWorkspace(c);
  await captureOriginalToken(c.auth.currentUser!);
  captureOnly = true;
  const result = await tokenProbe<{ httpStatus: number; status: string }>({
    action: 'write-baseline',
    runId: probeRunId!,
  });
  baseline = result.httpStatus === 200 && result.status === 'OK';
  log('captured-token-write-baseline', result);
});

action('canary-capture', async () => {
  if (baseline || armed || queued || overlapStarted || captureOnly)
    throw Error('Requires a separate initialized disposable workspace');
  const online = client('online');
  const user = online.auth.currentUser!;
  const fence = await getDocFromServer(
    doc(online.db, `accountDeletion/${pinnedUid}`),
  );
  let baselineDetails: Record<string, unknown>;
  if (fence.exists()) {
    const jobId = input('job');
    if (fence.data().jobId !== jobId || fence.data().state !== 'requested')
      throw Error('Exact requested job required for a fenced capture');
    const original = await getIdTokenResult(user);
    const read = await fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/accountDeletion/${pinnedUid}`,
      {
        headers: { Authorization: `Bearer ${original.token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await read.json().catch(() => null);
    if (
      read.status !== 200 ||
      data?.fields?.jobId?.stringValue !== jobId ||
      data?.fields?.state?.stringValue !== 'requested'
    )
      throw Error('Original token did not read the exact requested fence');
    await captureOriginalToken(user, original);
    baselineDetails = {
      fenceServerRead: true,
      jobId,
      httpStatus: 200,
      captureAfterIntent: true,
    };
  } else {
    const profile = await getDocFromServer(
      doc(online.db, `users/${pinnedUid}/profile/main`),
    );
    const initialization = await getDocFromServer(
      doc(online.db, `users/${pinnedUid}/initialization/workspace`),
    );
    if (!profile.exists() || initialization.data()?.status !== 'complete')
      throw Error('Disposable workspace must be ready');
    await captureOriginalToken(user);
    baselineDetails = { profileServerRead: true, initializationComplete: true };
  }
  captureOnly = true;
  for (const button of document.querySelectorAll('button'))
    button.disabled = !['watch', 'raw', 'export', 'release'].includes(
      button.id,
    );
  log('canary-capture-ready', {
    ...baselineDetails,
    captureEndsAt: new Date(Date.parse(tokenExpiry) + 7200000).toISOString(),
  });
});

async function armClients() {
  if (armed || probeRunId) throw Error('Capture already exists');
  const online = client('online'),
    offline = client('offline');
  const u = online.auth.currentUser!;
  await captureOriginalToken(u);
  onSnapshot(
    doc(online.db, `users/${pinnedUid}/profile/main`),
    { includeMetadataChanges: true },
    (s) =>
      log('preexisting-profile-stream', {
        exists: s.exists(),
        fromCache: s.metadata.fromCache,
        pendingWrites: s.metadata.hasPendingWrites,
      }),
    (e) => log('preexisting-profile-stream-error', { code: errorCode(e) }),
  );
  await getDocFromServer(doc(offline.db, `users/${pinnedUid}/profile/main`));
  await getIdToken(offline.auth.currentUser!);
  await disableNetwork(offline.db);
  armed = true;
  log('offline-client-disconnected');
}
action('arm', async () => {
  if (!baseline) throw Error('Successful real baseline required');
  await armClients();
});
function queueBase(c: Client, timing: 'before-fence' | 'after-removal') {
  queued = true;
  queueTiming = timing;
  void baseReinitializationBatch(c.db, pinnedUid)
    .commit()
    .then(
      () => log('FAIL-queued-write-admitted', { timing }),
      (e) => log('queued-write-rejected', { code: errorCode(e), timing }),
    );
}
action('queue-before-fence', async () => {
  if (baseline || armed || queued)
    throw Error('Requires a fresh empty workspace');
  const online = client('online');
  const offline = client('offline');
  await assertEmptyUnfencedWorkspace(online);
  await assertEmptyUnfencedWorkspace(offline);
  await armClients();
  queueBase(offline, 'before-fence');
  const pending = await getDocFromCache(
    doc(offline.db, `users/${pinnedUid}/initialization/workspace`),
  );
  if (!pending.exists() || !pending.metadata.hasPendingWrites)
    throw Error('Expected a pending local initialization write');
  await assertEmptyUnfencedWorkspace(online);
  log('pre-fence-queue-confirmed', {
    records: 4,
    localPendingWrites: true,
    serverBaseAbsent: true,
    serverFenceAbsent: true,
  });
});
function watchJob(job: string) {
  if (!armed && !overlapStarted && !captureOnly)
    throw Error('Arm before deletion');
  const c = client('online');
  if (!/^[0-9a-f-]{36}$/i.test(job)) throw Error('Exact job UUID required');
  onSnapshot(
    doc(c.db, `accountDeletion/${pinnedUid}`),
    (s) => {
      if (s.metadata.fromCache || !s.exists()) return;
      const d = s.data();
      if (d.jobId !== job) {
        log('job-mismatch');
        return;
      }
      log('job-server-state', { state: d.state });
      if (
        d.state === 'awaiting_retirement' &&
        d.authAbsentObservedAt &&
        d.retireNotBefore
      ) {
        anchor = {
          seconds: d.authAbsentObservedAt.seconds,
          nanoseconds: d.authAbsentObservedAt.nanoseconds,
        };
        deadline = {
          seconds: d.retireNotBefore.seconds,
          nanoseconds: d.retireNotBefore.nanoseconds,
        };
        removed = true;
        log('trusted-absence-anchor-observed', {
          authAbsentObservedAt: anchor,
          retireNotBefore: deadline,
        });
      }
    },
    (e) => log('job-stream-error', { code: errorCode(e) }),
  );
}
action('watch', async () => watchJob(input('job')));

action('prove-overlap', async () => {
  if (
    input('confirm-overlap') !== 'DELETE' ||
    overlapStarted ||
    armed ||
    baseline ||
    queued
  )
    throw Error('Typed confirmation and an empty workspace are required');
  const online = client('online');
  client('offline');
  overlapProof = undefined;
  await assertEmptyUnfencedWorkspace(online);
  const provider =
    input('provider') === 'google' ? 'google.com' : 'microsoft.com';
  const user = online.auth.currentUser!;
  if (!user.providerData.some((method) => method.providerId === provider))
    throw Error('Provider is not linked to this UID');
  const oauth =
    provider === 'google.com'
      ? new GoogleAuthProvider()
      : new OAuthProvider(provider);
  oauth.setCustomParameters(
    provider === 'google.com'
      ? { prompt: 'select_account' }
      : { tenant: 'common', prompt: 'select_account' },
  );
  const proof = await reauthenticateWithPopup(user, oauth);
  const token = await getIdTokenResult(proof.user, true);
  const authTime = token.claims.auth_time;
  if (
    proof.operationType !== 'reauthenticate' ||
    proof.user.uid !== pinnedUid ||
    online.auth.currentUser?.uid !== pinnedUid ||
    proof.providerId !== provider ||
    token.signInProvider !== provider ||
    typeof authTime !== 'number'
  )
    throw Error('Provider proof did not match');
  overlapProof = {
    uid: pinnedUid,
    jobId: crypto.randomUUID(),
    provider,
    authTime,
  };
  log('overlap-provider-proof-ready', { jobId: overlapProof.jobId, provider });
});

action('run-overlap', async () => {
  const proof = overlapProof;
  if (
    !proof ||
    overlapStarted ||
    armed ||
    baseline ||
    queued ||
    input('confirm-overlap') !== 'DELETE'
  )
    throw Error('Fresh provider proof and explicit confirmation required');
  const online = client('online');
  const writer = client('offline');
  overlapStarted = true;
  let dispatched = false;
  const requests = createDeletionRequestAdapter(online.db);
  const current = () =>
    online.auth.currentUser?.uid === proof.uid && navigator.onLine;
  try {
    await assertEmptyUnfencedWorkspace(online);
    const policy = decodeContract(
      (await getDocFromServer(doc(online.db, 'runtime/compatibility'))).data(),
    );
    if (
      policy.revision < 3 ||
      policy.serverRelease < 3 ||
      evaluateCompatibility(
        policy,
        clientCapabilities(project, 't7-live-overlap', true),
      )
    )
      throw Error('Incompatible release');
    const originalToken = await captureOriginalToken(writer.auth.currentUser!);
    const capture = { runId: probeRunId! };
    if (
      !current() ||
      writer.auth.currentUser?.uid !== proof.uid ||
      !deletionProofIsRecent(proof.authTime, {
        seconds: Math.floor(Date.now() / 1000),
        nanoseconds: 0,
      })
    )
      throw Error('Session or proof expired');

    const submitIntent = (pending: () => boolean) => {
      log('live-intent-dispatched', {
        jobId: proof.jobId,
        commitStillPending: pending(),
      });
      return requests
        .request(proof, policy.revision, current)
        .then((result) => {
          if (!result.exists || result.control?.jobId !== proof.jobId) {
            log('live-intent-unverified');
            return;
          }
          log('live-intent-verified', {
            jobId: proof.jobId,
            state: result.control.state,
            requestedAt: result.control.requestedAt,
            commitStillPending: pending(),
          });
        })
        .catch(() => log('live-intent-outcome-unknown'));
    };
    watchJob(proof.jobId);
    dispatched = true;
    if (fenceFirstMode) {
      const held = await tokenProbe<{ openedAt: string; jobId: string }>({
        action: 'hold-commit',
        runId: capture.runId,
        jobId: proof.jobId,
      });
      log('live-commit-partially-sent', held);
      await submitIntent(() => true);
      const outcome = await tokenProbe({
        action: 'finish-commit',
        runId: capture.runId,
        jobId: proof.jobId,
      });
      log('live-held-commit-response', outcome);
      return;
    }
    const writes = baseCommitRequest(project, proof.uid);
    let commitSettled = false;
    log('live-commit-dispatched', { records: 4, jobId: proof.jobId });
    const commit = fetch(
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents:commit`,
      {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${originalToken.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(writes),
      },
    )
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        const commitTime =
          response.ok &&
          typeof data?.commitTime === 'string' &&
          /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(data.commitTime)
            ? data.commitTime
            : null;
        const status = [
          'PERMISSION_DENIED',
          'UNAUTHENTICATED',
          'FAILED_PRECONDITION',
          'ABORTED',
        ].includes(data?.error?.status)
          ? data.error.status
          : 'unclassified';
        log('live-commit-response', {
          httpStatus: response.status,
          commitTime,
          status: response.ok ? 'OK' : status,
        });
      })
      .catch(() => log('live-commit-outcome-unknown'))
      .finally(() => {
        commitSettled = true;
      });
    await Promise.all([commit, submitIntent(() => !commitSettled)]);
  } finally {
    requests.dispose();
    overlapProof = undefined;
    if (!dispatched) overlapStarted = false;
  }
});

action('online-write', async () => {
  if (!removed) throw Error('Wait for confirmed removal');
  const c = client('online');
  try {
    await baseReinitializationBatch(c.db, pinnedUid).commit();
    log('FAIL-online-reinitialization-admitted');
  } catch (e) {
    log('online-reinitialization-rejected', { code: errorCode(e) });
  }
});
action('queue', async () => {
  if (!armed || !removed || queued)
    throw Error('Wait for server-confirmed removal before queuing');
  queueBase(client('offline'), 'after-removal');
  log('reinitialization-queued-after-removal');
});
action('reconnect', async () => {
  if (!queued || !removed) throw Error('Queue and wait for confirmed removal');
  await enableNetwork(client('offline').db);
  log('offline-client-reconnected');
});
action('raw', async () => {
  if (!probeRunId) throw Error('No captured original token');
  const result = await tokenProbe<{
    uid: string;
    tokenExpiry: string;
    httpStatus: number;
    status: string;
    localClockAfterTokenExpiry: boolean;
  }>({ action: 'probe', runId: probeRunId });
  if (recoveredProbeOnly) {
    pinnedUid = result.uid;
    tokenExpiry = result.tokenExpiry;
  }
  log('captured-token-server-read', result);
});
action('raw-write', async () => {
  if (!probeRunId) throw Error('No captured original token');
  const result = await tokenProbe({
    action: 'write-after-expiry',
    runId: probeRunId,
  });
  log('captured-token-server-write', result);
});

action('release', async () => {
  if (probeRunId) {
    try {
      await tokenProbe({ action: 'release', runId: probeRunId });
    } catch (error) {
      if (errorCode(error) !== 'capture-unavailable') throw error;
    }
  }
  sessionStorage.removeItem(probeStorageKey);
  location.reload();
});
action('refresh', async () => {
  if (!removed) throw Error('Wait for confirmed removal');
  const c = client('online');
  try {
    await getIdToken(c.auth.currentUser!, true);
    log('refresh-accepted-after-removal');
  } catch (e) {
    log('refresh-rejected-after-removal', { code: errorCode(e) });
  }
});
action('export', async () => {
  const report = {
    project: 'taskify-dev-dpdhole',
    uid: pinnedUid,
    baseline,
    armed,
    removed,
    queued,
    queueTiming,
    tokenExpiry,
    authAbsentObservedAt: anchor,
    retireNotBefore: deadline,
    recoveredProbeOnly,
    captureOnly,
    t7Passed: false,
    retirementEnabled: false,
    events,
    limits: [
      'No fence retirement performed',
      'Offline replay probe. In-flight server requests require separate evidence.',
      'No automatic classification of overall T7 safety',
    ],
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'taskify-t7-observations.json';
  a.click();
  URL.revokeObjectURL(url);
});

if (recoveredProbeOnly) {
  for (const button of document.querySelectorAll('button'))
    button.disabled = !['raw', 'raw-write', 'export', 'release'].includes(
      button.id,
    );
  log('capture-reference-restored', {
    note: 'Probe the original capture. The page reload ended the original SDK clients.',
  });
}

if (fenceFirstMode)
  el('overlap-mode').textContent =
    'Fence-first relay mode. The commit starts before admission and finishes after the relay verifies the fence.';
