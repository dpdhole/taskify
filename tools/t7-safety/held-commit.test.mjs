import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { holdBaseCommit, verifyFenceForRelease } from './held-commit.mjs';
import { baseCommitRequest } from './base-commit.mjs';

const uid = 'synthetic-held-commit';
const jobId = '11111111-1111-4111-8111-111111111111';
const updateTime = '2026-11-07T10:00:01.000000Z';
const token = 'synthetic-token';

test('holds an incomplete wire request until the exact fence is verified', async () => {
  let received = Buffer.alloc(0);
  let ended = false;
  let resolvePartial;
  const partial = new Promise((resolve) => {
    resolvePartial = resolve;
  });
  const server = createServer((req, res) => {
    req.on('data', (chunk) => {
      received = Buffer.concat([received, chunk]);
      if (received.length === Number(req.headers['content-length']) - 1)
        resolvePartial();
    });
    req.on('end', () => {
      ended = true;
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            status: 'PERMISSION_DENIED',
            message: 'synthetic private detail',
          },
        }),
      );
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  const expected = Buffer.from(
    JSON.stringify(baseCommitRequest('taskify-dev-dpdhole', uid)),
  );
  let held;
  try {
    held = await holdBaseCommit({
      uid,
      token,
      openRequest: (url, options, callback) => {
        assert.match(
          url,
          /^https:\/\/firestore\.googleapis\.com\/.*\/documents:commit$/,
        );
        assert.equal(options.headers.Authorization, `Bearer ${token}`);
        return request(`http://127.0.0.1:${address.port}`, options, callback);
      },
    });
    await partial;
    assert.equal(ended, false);
    assert.deepEqual(received, expected.subarray(0, -1));
    const fence = (id) => async () =>
      new Response(
        JSON.stringify({
          updateTime,
          fields: {
            jobId: { stringValue: id },
            state: { stringValue: 'requested' },
          },
        }),
      );
    await assert.rejects(
      verifyFenceForRelease(uid, jobId, token, fence('wrong-job')),
      /expected-requested-fence/,
    );
    assert.equal(ended, false);
    assert.equal(
      await verifyFenceForRelease(uid, jobId, token, fence(jobId)),
      updateTime,
    );
    assert.deepEqual(await held.finish(), {
      httpStatus: 403,
      status: 'PERMISSION_DENIED',
      fullBodySent: true,
    });
    assert.equal(ended, true);
    assert.deepEqual(received, expected);
  } finally {
    held?.cancel();
    await new Promise((resolve) => server.close(resolve));
  }
});
