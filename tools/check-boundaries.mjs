import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { inspectSource } from './boundaries.mjs';
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? walk(path.join(dir, e.name))
        : /\.tsx?$/.test(e.name)
          ? [path.join(dir, e.name).replaceAll('\\', '/')]
          : [],
    );
}
const files = walk('src'),
  errors = files.flatMap((f) => inspectSource(f, fs.readFileSync(f, 'utf8')));
const graph = new Map();
for (const f of files) {
  const imports = [];
  const tree = ts.createSourceFile(
    f,
    fs.readFileSync(f, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  function visit(n) {
    if (
      (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) &&
      n.moduleSpecifier &&
      ts.isStringLiteral(n.moduleSpecifier) &&
      n.moduleSpecifier.text.startsWith('.')
    ) {
      const base = path.posix.normalize(
        path.posix.join(path.posix.dirname(f), n.moduleSpecifier.text),
      );
      const target = files.find(
        (x) => x === base || x === base + '.ts' || x === base + '.tsx',
      );
      if (target) imports.push(target);
    }
    ts.forEachChild(n, visit);
  }
  visit(tree);
  graph.set(f, imports);
}
const seen = new Set(),
  active = new Set();
function cycle(f) {
  if (active.has(f)) {
    errors.push('Dependency cycle at ' + f);
    return;
  }
  if (seen.has(f)) return;
  seen.add(f);
  active.add(f);
  for (const next of graph.get(f) ?? []) cycle(next);
  active.delete(f);
}
for (const f of files) cycle(f);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    'Source boundaries and cycles verified: ' + files.length + ' files',
  );
