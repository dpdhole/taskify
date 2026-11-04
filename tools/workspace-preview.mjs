import { APP_VERSION } from '../src/app/client-capabilities.ts';
/** Invoked only inside the checked demo emulator runner; no cloud target. */
import fs from 'node:fs';
import { decodeContract } from '../src/domain/compatibility.ts';
import { spawn } from 'node:child_process';
import ts from 'typescript';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc } from 'firebase/firestore';

if (
  process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
  process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099'
)
  throw Error('Checked loopback Auth and Firestore required');
const projectId = 'demo-taskify-provisioning-stage';
const source = ts.createSourceFile(
  'workspace-seeds.ts',
  fs.readFileSync('src/domain/workspace-families.ts', 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const declaration = source.statements
  .filter(ts.isVariableStatement)
  .flatMap((statement) => [...statement.declarationList.declarations])
  .find((item) => item.name.getText(source) === 'WORKSPACE_SCHEMA_FAMILIES');
const initializer = declaration?.initializer;
if (
  !initializer ||
  !ts.isAsExpression(initializer) ||
  !ts.isArrayLiteralExpression(initializer.expression)
)
  throw Error('Workspace family declaration changed');
const families = initializer.expression.elements.map((element) => {
  if (!ts.isStringLiteral(element)) throw Error('Expected literal family');
  return element.text;
});
const environment = await initializeTestEnvironment({
  projectId,
  firestore: {
    host: '127.0.0.1',
    port: 8080,
    rules: fs.readFileSync('firestore.workspace.rules', 'utf8'),
  },
});
try {
  await environment.withSecurityRulesDisabled((context) =>
    setDoc(
      doc(context.firestore(), 'runtime/compatibility'),
      decodeContract({
        contractFormatVersion: 1,
        revision: 1,
        environmentId: projectId,
        serverRelease: 1,
        minAppVersion: APP_VERSION,
        maxAppVersion: APP_VERSION,
        recordFamilies: Object.fromEntries(
          ['compatibilityProbe', ...families].map((family) => [
            family,
            {
              presentSchemaVersions: [1],
              allowedWriteSchemaVersions: [1],
            },
          ]),
        ),
      }),
    ),
  );
} finally {
  await environment.cleanup();
}
console.log(
  '\nLOCAL SYNTHETIC PREVIEW — no real provider credentials. Data lasts until this runner stops.',
);
console.log(
  'Open http://127.0.0.1:5177/tests/support/workspace.html?sdkAuth=1',
);
console.log(
  'Use the emulator account form with a made-up email, e.g. owner@example.invalid.',
);
const child = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--mode',
    'session-test',
    '--host',
    '127.0.0.1',
    '--port',
    '5177',
    '--strictPort',
  ],
  { stdio: 'inherit', env: process.env },
);
const stop = () => child.kill('SIGINT');
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
child.once('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  process.exitCode = code ?? 1;
});
