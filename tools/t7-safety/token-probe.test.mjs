import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { createTokenProbe } from './token-probe.mjs';
import { baseCommitRequest } from './base-commit.mjs';

test('requires a successful same-token baseline, expiry and one attempt per write phase', async () => {
  const originalNow = Date.now;
  let now = originalNow();
  Date.now = () => now;
  const uid = 'synthetic-write-canary';
  const expiry = Math.floor(now / 1000) + 3600;
  const claims = Buffer.from(
    JSON.stringify({
      aud: 'taskify-dev-dpdhole',
      iss: 'https://securetoken.google.com/taskify-dev-dpdhole',
      sub: uid,
      exp: expiry,
    }),
  ).toString('base64url');
  const token = `header.${claims}.signature`;
  const requests = [];
  const middleware = createTokenProbe({
    origin: 'http://localhost:5182',
    fetchRead: async (url, options) => {
      requests.push({ url, options });
      return new Response(
        JSON.stringify(
          requests.length === 1
            ? { commitTime: 'synthetic' }
            : {
                error: { status: 'UNAUTHENTICATED', message: 'private detail' },
              },
        ),
        { status: requests.length === 1 ? 200 : 401 },
      );
    },
  });
  async function call(data, origin = 'http://localhost:5182') {
    const req = Readable.from([Buffer.from(JSON.stringify(data))]);
    Object.assign(req, {
      url: '/__t7_probe',
      method: 'POST',
      headers: {
        host: 'localhost:5182',
        origin,
        'x-t7-probe': '1',
        'content-type': 'application/json',
      },
    });
    let status;
    let result;
    await middleware(
      req,
      {
        writeHead(code) {
          status = code;
        },
        end(body) {
          result = JSON.parse(body);
        },
      },
      () => assert.fail('unexpected route'),
    );
    return { status, result };
  }
  let runId;
  try {
    runId = (await call({ action: 'capture', uid, token })).result.runId;
    assert.ok(runId);
    assert.equal(
      (await call({ action: 'write-after-expiry', runId })).status,
      409,
    );
    assert.equal(
      (await call({ action: 'write-baseline', runId }, 'http://example.com'))
        .status,
      403,
    );
    const baseline = await call({ action: 'write-baseline', runId });
    assert.equal(baseline.result.httpStatus, 200);
    assert.equal((await call({ action: 'write-baseline', runId })).status, 409);
    assert.equal(
      (await call({ action: 'write-after-expiry', runId })).status,
      409,
    );
    now = expiry * 1000 + 1;
    const outcome = await call({
      action: 'write-after-expiry',
      runId,
      uid: 'another-uid',
    });
    assert.equal(outcome.result.httpStatus, 401);
    assert.equal(outcome.result.status, 'UNAUTHENTICATED');
    assert.equal(outcome.result.uid, uid);
    assert.equal(JSON.stringify(outcome).includes('private detail'), false);
    assert.equal(JSON.stringify(outcome).includes(token), false);
    assert.equal(
      (await call({ action: 'write-after-expiry', runId })).status,
      409,
    );
    assert.equal(requests.length, 2);
    for (const { url, options } of requests) {
      assert.equal(
        url,
        'https://firestore.googleapis.com/v1/projects/taskify-dev-dpdhole/databases/(default)/documents:commit',
      );
      assert.equal(options.headers.Authorization, `Bearer ${token}`);
      assert.deepEqual(
        JSON.parse(options.body),
        baseCommitRequest('taskify-dev-dpdhole', uid),
      );
    }
  } finally {
    if (runId) await call({ action: 'release', runId });
    Date.now = originalNow;
  }
});
