import { request as httpsRequest } from 'node:https';
import { baseCommitRequest } from './base-commit.mjs';

const project = 'taskify-dev-dpdhole';
const documents = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;

export async function holdBaseCommit({
  uid,
  token,
  openRequest = httpsRequest,
}) {
  const payload = Buffer.from(JSON.stringify(baseCommitRequest(project, uid)));
  let finish;
  let sent = false;
  let settled = false;
  let timer;
  const result = new Promise((resolve) => {
    finish = resolve;
  });
  function settle(outcome) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    finish({ ...outcome, fullBodySent: sent });
  }
  const request = openRequest(
    `${documents}:commit`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
      },
    },
    (response) => {
      const chunks = [];
      let bytes = 0;
      response.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > 16384) response.destroy();
        else chunks.push(chunk);
      });
      response.on('error', () => settle({ status: 'transport-unknown' }));
      response.on('end', () => {
        let status = 'unclassified';
        try {
          const reason = JSON.parse(Buffer.concat(chunks).toString('utf8'))
            .error?.status;
          if (
            [
              'PERMISSION_DENIED',
              'UNAUTHENTICATED',
              'FAILED_PRECONDITION',
              'ABORTED',
            ].includes(reason)
          )
            status = reason;
        } catch {
          /* No raw response details. */
        }
        settle({
          httpStatus: response.statusCode,
          status: response.statusCode === 200 ? 'OK' : status,
        });
      });
    },
  );
  request.on('error', () => settle({ status: 'transport-unknown' }));
  timer = setTimeout(() => {
    settle({ status: 'transport-unknown' });
    request.destroy(Error('probe-timeout'));
  }, 30000);
  timer.unref();
  const openedAt = await Promise.race([
    new Promise((resolve) =>
      request.write(payload.subarray(0, -1), (error) =>
        resolve(error ? null : new Date().toISOString()),
      ),
    ),
    result.then(() => null),
  ]);
  if (!openedAt) {
    request.destroy();
    throw Error('commit-transport-not-open');
  }
  return {
    openedAt,
    async finish() {
      if (!settled && !sent) {
        sent = true;
        request.end(payload.subarray(-1));
      }
      return result;
    },
    cancel() {
      request.destroy();
    },
  };
}

/** Release only after observing the exact, still-requested fence in Firestore. */
export async function verifyFenceForRelease(
  uid,
  jobId,
  token,
  fetchRead = fetch,
) {
  const response = await fetchRead(`${documents}/accountDeletion/${uid}`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
  const snapshot = await response.json().catch(() => null);
  if (
    !response.ok ||
    snapshot?.fields?.jobId?.stringValue !== jobId ||
    snapshot?.fields?.state?.stringValue !== 'requested' ||
    typeof snapshot.updateTime !== 'string'
  )
    throw Error('expected-requested-fence-not-observed');
  return snapshot.updateTime;
}
