import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const proof = mode === 'foundation';
  const outDir = proof ? 'dist-proof' : 'dist';
  return {
    plugins: [
      react(),
      {
        name: 'foundation-isolation',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url?.split('?')[0] ?? '';
            if (
              !proof &&
              (url === '/foundation.html' ||
                /\/src\/(application|domain|infrastructure|state|ui\/Proof)/.test(
                  url,
                ) ||
                url.includes('/src/app/proof'))
            ) {
              res.statusCode = 404;
              res.end('Not available');
              return;
            }
            if (proof && (url === '/' || url === '/inspect'))
              req.url = '/foundation.html';
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
          // The proof gets its own SPA entry; ordinary output never includes it.
          if (proof)
            fs.renameSync(
              path.join(outDir, 'foundation.html'),
              path.join(outDir, 'index.html'),
            );
        },
      },
    ],
    optimizeDeps: { entries: [proof ? 'foundation.html' : 'index.html'] },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
    build: {
      outDir,
      rollupOptions: { input: proof ? 'foundation.html' : 'index.html' },
    },
  };
});
