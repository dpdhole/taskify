import { createServer, loadEnv } from 'vite';
import path from 'node:path';
import { createTokenProbe } from './token-probe.mjs';
const args = process.argv.slice(2);
const fenceFirst = args.length === 1 && args[0] === '--fence-first';
if (args.length && !fenceFirst) throw Error('Unexpected harness arguments');
const port = fenceFirst ? 5184 : 5182;
const root = process.cwd();
const local = loadEnv('auth', root, 'VITE_TASKIFY_');
const env = local.VITE_TASKIFY_API_KEY
  ? local
  : loadEnv(
      'auth',
      path.resolve(root, '../taskify-slice-implementation'),
      'VITE_TASKIFY_',
    );
const config = {
  projectId: env.VITE_TASKIFY_PROJECT_ID,
  apiKey: env.VITE_TASKIFY_API_KEY,
  appId: env.VITE_TASKIFY_APP_ID,
  authDomain: env.VITE_TASKIFY_AUTH_DOMAIN,
};
if (config.projectId !== 'taskify-dev-dpdhole' || !config.apiKey)
  throw Error('Approved public Auth configuration required in .env.auth.local');
const server = await createServer({
  configFile: false,
  root,
  define: { __T7_CONFIG__: JSON.stringify(config) },
  plugins: [
    {
      name: 't7-memory-token-probe',
      configureServer(server) {
        server.middlewares.use(
          createTokenProbe({ origin: `http://localhost:${port}`, fenceFirst }),
        );
      },
    },
  ],
  // A page reload discards the original token and offline client.
  server: { host: '127.0.0.1', port, strictPort: true, hmr: false },
  logLevel: 'info',
});
await server.listen();
server.printUrls();
