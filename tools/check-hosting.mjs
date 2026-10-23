import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { chromium } from '@playwright/test';

const origin = 'http://127.0.0.1:5002';
const evidence = JSON.parse(
  fs.readFileSync('.local/hosting-preflight/artifact.json', 'utf8'),
);
const sha = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(
  sha(fs.readFileSync('firebase.hosting.json')),
  evidence.configSha256,
  'Rebuild after changing the Hosting policy',
);
const root = await fetch(origin);
assert.equal(root.status, 200);
assert.match(root.headers.get('cache-control'), /no-cache/);
assert.equal(root.headers.get('x-content-type-options'), 'nosniff');
assert.equal(root.headers.get('referrer-policy'), 'no-referrer');
assert.match(
  root.headers.get('content-security-policy'),
  /connect-src https:\/\/firestore\.googleapis\.com/,
);
const policy = root.headers.get('content-security-policy');
assert.ok(policy.includes('https://identitytoolkit.googleapis.com'));
assert.ok(policy.includes('https://securetoken.googleapis.com'));
assert.ok(
  policy.includes(
    "frame-src 'self' https://taskify-dev-dpdhole.firebaseapp.com",
  ),
);
assert.ok(policy.includes("script-src 'self' https://apis.google.com"));
assert.ok(!policy.includes('unsafe-inline') && !policy.includes('*'));
assert.equal(
  sha(Buffer.from(await root.arrayBuffer())),
  evidence.files['index.html'],
);
for (const route of ['/inspect', '/tasks/example']) {
  const res = await fetch(origin + route);
  assert.equal(
    sha(Buffer.from(await res.arrayBuffer())),
    evidence.files['index.html'],
  );
}
for (const [file, hash] of Object.entries(evidence.files)) {
  const res = await fetch(origin + '/' + file);
  assert.equal(res.status, 200);
  assert.equal(sha(Buffer.from(await res.arrayBuffer())), hash);
  assert.match(
    res.headers.get('cache-control'),
    file.startsWith('assets/') ? /immutable/ : /no-cache/,
  );
}
for (const file of [
  'module-graph.json',
  'foundation.html',
  'compatibility.html',
  'tests/support/compatibility-write.rules',
  '.env',
  'tests/support/firestore.rules',
  'assets/nonexistent.js.map',
]) {
  const res = await fetch(origin + '/' + file);
  // SPA fallback is permitted, but internal files must never be served.
  assert.ok(
    res.status === 404 ||
      sha(Buffer.from(await res.arrayBuffer())) ===
        evidence.files['index.html'],
  );
}
const browser = await chromium.launch();
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 800 } });
    const errors = [];
    const requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('request', (request) => requests.push(request.url()));
    await page.goto(origin + '/tasks/example');
    await page.getByRole('heading', { name: 'Taskify', exact: true }).waitFor();
    await page.reload();
    await page
      .getByText('Sign-in and Tasks are not available in this build.')
      .waitFor();
    if (process.argv.includes('--expect-compatible'))
      await page
        .getByText('Compatibility verified.', { exact: false })
        .waitFor({ timeout: 30000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    assert.ok(
      requests.every((url) => {
        const parsed = new URL(url);
        return (
          parsed.origin === origin ||
          parsed.origin === 'https://firestore.googleapis.com'
        );
      }),
    );
    await page.getByText(evidence.release.buildId, { exact: false }).waitFor();
    assert.ok(
      requests.every(
        (url) =>
          !/foundation|compatibility-harness|module-graph/.test(
            new URL(url).pathname,
          ),
      ),
    );
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(
  'Hosting configuration: hashes, fallback, cache/security headers, exclusions and 390/1280px browser checks passed. LOCAL ONLY.',
);
