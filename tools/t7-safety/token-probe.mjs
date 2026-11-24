import { randomUUID } from 'node:crypto';
import { baseCommitRequest } from './base-commit.mjs';
import { holdBaseCommit, verifyFenceForRelease } from './held-commit.mjs';

const project = 'taskify-dev-dpdhole';
const route = '/__t7_probe';
const maxBodyBytes = 16 * 1024;
const retentionMs = 2 * 60 * 60 * 1000;

function tokenExpiry(token, uid) {
  if (typeof token !== 'string' || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token))
    return null;
  try {
    // These claims constrain the destination and retention. Firestore verifies the token.
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url'));
    const expiry = claims.exp * 1000;
    return claims.aud === project &&
      claims.iss === `https://securetoken.google.com/${project}` &&
      claims.sub === uid &&
      Number.isSafeInteger(expiry) &&
      expiry > Date.now() &&
      expiry <= Date.now() + 3_900_000
      ? expiry
      : null;
  } catch {
    return null;
  }
}

async function body(req) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBodyBytes) throw Error('oversize');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createTokenProbe({
  origin,
  fetchRead = fetch,
  fenceFirst = false,
}) {
  const runs = new Map();
  const host = new URL(origin).host;
  const respond = (res, status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(JSON.stringify(data));
  };

  return async (req, res, next) => {
    if (req.url !== route) return next();
    if (
      req.method !== 'POST' ||
      req.headers.host !== host ||
      req.headers.origin !== origin ||
      req.headers['x-t7-probe'] !== '1' ||
      req.headers['content-type'] !== 'application/json'
    )
      return respond(res, 403, { code: 'probe-origin-denied' });

    try {
      const request = await body(req);
      if (request.action === 'capture') {
        const { uid, token } = request;
        const expiry =
          typeof uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(uid)
            ? tokenExpiry(token, uid)
            : null;
        if (!expiry) return respond(res, 400, { code: 'invalid-capture' });
        if (runs.size >= 8) return respond(res, 409, { code: 'capture-limit' });
        const runId = randomUUID();
        const timer = setTimeout(
          () => {
            runs.get(runId)?.held?.cancel();
            runs.delete(runId);
          },
          expiry + retentionMs - Date.now(),
        );
        timer.unref();
        runs.set(runId, { token, uid, expiry, timer });
        return respond(res, 200, { runId });
      }

      const run = runs.get(request.runId);
      if (!run) return respond(res, 404, { code: 'capture-unavailable' });
      if (request.action === 'release') {
        clearTimeout(run.timer);
        run.held?.cancel();
        runs.delete(request.runId);
        return respond(res, 200, { released: true });
      }
      if (fenceFirst && request.action === 'hold-commit') {
        if (
          run.jobId ||
          typeof request.jobId !== 'string' ||
          !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(
            request.jobId,
          )
        )
          return respond(res, 400, { code: 'invalid-held-commit' });
        run.jobId = request.jobId;
        run.held = await holdBaseCommit({ uid: run.uid, token: run.token });
        return respond(res, 200, {
          openedAt: run.held.openedAt,
          jobId: run.jobId,
        });
      }
      if (fenceFirst && request.action === 'finish-commit') {
        if (!run.held || run.jobId !== request.jobId || run.released)
          return respond(res, 400, { code: 'invalid-held-commit' });
        run.released = true;
        try {
          const fenceUpdateTime = await verifyFenceForRelease(
            run.uid,
            run.jobId,
            run.token,
            fetchRead,
          );
          const outcome = await run.held.finish();
          return respond(res, 200, {
            ...outcome,
            fenceUpdateTime,
            jobId: run.jobId,
          });
        } finally {
          run.held.cancel();
        }
      }
      const writeBaseline = request.action === 'write-baseline';
      const writeAfterExpiry = request.action === 'write-after-expiry';
      const write = writeBaseline || writeAfterExpiry;
      if (write) {
        if (
          (writeBaseline &&
            (run.writeBaselineAttempted || Date.now() >= run.expiry)) ||
          (writeAfterExpiry &&
            (!run.writeBaselineAccepted ||
              run.writeAfterExpiryAttempted ||
              Date.now() < run.expiry))
        )
          return respond(res, 409, { code: 'write-probe-precondition' });
        // Mark before sending. An ambiguous response must not trigger a blind retry.
        if (writeBaseline) run.writeBaselineAttempted = true;
        else run.writeAfterExpiryAttempted = true;
      }
      if (request.action !== 'probe' && !write)
        return respond(res, 400, { code: 'invalid-probe-action' });

      const response = await fetchRead(
        `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents${write ? ':commit' : `/users/${run.uid}/profile/main`}`,
        {
          method: write ? 'POST' : 'GET',
          headers: {
            Authorization: `Bearer ${run.token}`,
            'Content-Type': 'application/json',
          },
          ...(write
            ? { body: JSON.stringify(baseCommitRequest(project, run.uid)) }
            : {}),
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
        },
      );
      let status = 'unclassified';
      if (writeBaseline && response.ok) run.writeBaselineAccepted = true;
      if (response.ok) {
        await response.body?.cancel();
        status = 'OK';
      } else {
        const error = await response.json().catch(() => null);
        if (
          ['PERMISSION_DENIED', 'UNAUTHENTICATED', 'NOT_FOUND'].includes(
            error?.error?.status,
          )
        )
          status = error.error.status;
      }
      return respond(res, 200, {
        uid: run.uid,
        tokenExpiry: new Date(run.expiry).toISOString(),
        httpStatus: response.status,
        status,
        ...(write
          ? { records: 4, phase: writeBaseline ? 'baseline' : 'after-expiry' }
          : {}),
        localClockAfterTokenExpiry: Date.now() >= run.expiry,
      });
    } catch {
      return respond(res, 400, { code: 'probe-request-failed' });
    }
  };
}
