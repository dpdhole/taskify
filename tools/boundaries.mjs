import ts from 'typescript';
import path from 'node:path';
const allowed = {
  domain: ['domain'],
  application: ['application', 'domain'],
  state: ['state', 'application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  ui: ['ui', 'state', 'application', 'domain'],
  app: ['app', 'ui', 'state', 'application', 'domain', 'infrastructure'],
};
const external = {
  domain: [],
  application: [],
  state: ['zustand/vanilla'],
  infrastructure: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
  ui: ['react', 'react/jsx-runtime', 'zustand', 'react-router'],
  app: ['react', 'react/jsx-runtime', 'react-dom/client', 'react-router'],
};
export function inspectSource(file, text) {
  const layer = file.replaceAll('\\', '/').split('/')[1];
  if (!allowed[layer]) return ['Unknown source layer: ' + file];
  const errors = [];
  const imports = [];
  const tree = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      if (ts.isStringLiteral(node.moduleSpecifier))
        imports.push(node.moduleSpecifier.text);
      else errors.push('Nonliteral dependency in ' + file);
    }
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) imports.push(arg.text);
      else errors.push('Nonliteral dependency in ' + file);
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  for (const target of imports) {
    if (target.startsWith('.')) {
      const resolved = path.posix.normalize(
        path.posix.join(path.posix.dirname(file), target),
      );
      const targetLayer = resolved.split('/')[1];
      if (!resolved.startsWith('src/') || !allowed[layer].includes(targetLayer))
        errors.push(file + ' cannot import ' + target);
    } else if (!external[layer].includes(target))
      errors.push(file + ' cannot import ' + target);
  }
  return errors;
}
