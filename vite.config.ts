import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
function files(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? files(path.join(dir, e.name))
        : [path.join(dir, e.name)],
    );
}
export default defineConfig(({ mode }) => {
  const proof = mode === 'foundation';
  const compatibility = mode === 'compatibility';
  const outDir = proof
    ? 'dist-proof'
    : compatibility
      ? 'dist-compatibility'
      : 'dist';
  const entry = proof
    ? 'foundation.html'
    : compatibility
      ? 'compatibility.html'
      : 'index.html';
  const hash = crypto.createHash('sha256');
  for (const file of [
    ...files('src'),
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'index.html',
    'firebase.hosting.json',
  ].sort())
    hash.update(file).update(fs.readFileSync(file));
  hash.update(JSON.stringify(loadEnv(mode, process.cwd(), 'VITE_TASKIFY_')));
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const sourceDirty = Boolean(
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  );
  const builtAt = new Date().toISOString();
  const appVersion = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    .version as string;
  const buildId =
    execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], {
      encoding: 'utf8',
    }).trim() +
    '-' +
    hash.digest('hex').slice(0, 16);
  return {
    define: {
      'import.meta.env.VITE_TASKIFY_BUILD_ID': JSON.stringify(buildId),
    },
    plugins: [
      react(),
      {
        name: 'proof-isolation',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] ?? '';
            const legacy =
              url === '/foundation.html' ||
              /\/src\/(ui\/Proof|application\/probe-session|domain\/probe|infrastructure\/(memory\/probe-reader|firebase\/(probe-reader|local-config))|state\/probe-store)/.test(
                url,
              ) ||
              url.includes('/src/app/proof');
            const harness =
              url === '/compatibility.html' ||
              /compatibility-harness|CompatibilityHarness|protected-consumers|memory\/contract-reader/.test(
                url,
              );
            if ((!proof && legacy) || (!compatibility && harness)) {
              res.statusCode = 404;
              res.end('Not available');
              return;
            }
            if ((proof || compatibility) && (url === '/' || url === '/inspect'))
              req.url = '/' + entry;
            next();
          });
        },
        generateBundle() {
          fs.mkdirSync(outDir, { recursive: true });
          fs.writeFileSync(
            path.join(outDir, 'module-graph.json'),
            JSON.stringify(
              [...this.getModuleIds()]
                .map((id) =>
                  path.relative(process.cwd(), id).replaceAll('\\', '/'),
                )
                .sort(),
              null,
              2,
            ),
          );
        },
        closeBundle() {
          fs.writeFileSync(
            path.join(outDir, 'release.json'),
            JSON.stringify(
              { appVersion, buildId, commit, sourceDirty, builtAt },
              null,
              2,
            ) + '\n',
          );
          if (proof || compatibility)
            fs.renameSync(
              path.join(outDir, entry),
              path.join(outDir, 'index.html'),
            );
        },
      },
    ],
    optimizeDeps: { entries: [entry] },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    build: { outDir, rollupOptions: { input: entry } },
  };
});
