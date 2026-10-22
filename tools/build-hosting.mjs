import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sourceDirty = Boolean(git('status', '--porcelain'));
if (sourceDirty && !process.argv.includes('--allow-dirty-local'))
  throw Error('Commit reviewed inputs before preparing a publication artifact');
if (process.version !== 'v24.21.0') throw Error('Use pinned Node 24.21.0');
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
  stdio: 'inherit',
});
// Keep local bundle diagnostics out of the publish directory itself.
fs.unlinkSync('dist/module-graph.json');
const release = {
  buildId: new Date().toISOString().replaceAll(/[:.]/g, '-'),
  commit: git('rev-parse', 'HEAD'),
  sourceDirty,
};
fs.writeFileSync('dist/release.json', JSON.stringify(release, null, 2) + '\n');
const hash = (file) =>
  crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = [
  'index.html',
  'release.json',
  ...fs.readdirSync('dist/assets').map((f) => 'assets/' + f),
];
const evidence = {
  release,
  publishable: !sourceDirty,
  configSha256: hash('firebase.hosting.json'),
  files: Object.fromEntries(files.map((f) => [f, hash('dist/' + f)])),
};
fs.mkdirSync('.local/hosting-preflight', { recursive: true });
fs.writeFileSync(
  '.local/hosting-preflight/artifact.json',
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence, null, 2));
