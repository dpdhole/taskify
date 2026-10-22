import fs from 'node:fs';
import assert from 'node:assert/strict';
for (const dir of ['dist', 'dist-proof']) {
  const graph = JSON.parse(fs.readFileSync(dir + '/module-graph.json', 'utf8'));
  const bad = graph.filter((id) =>
    /@grpc\/|firebase-admin|@google-cloud\/|@opentelemetry\/|node_modules\/(braces|uuid)\/|index\.node\.|tests\//.test(
      id,
    ),
  );
  assert.deepEqual(bad, [], dir + ' contains forbidden modules');
  if (dir === 'dist')
    assert.deepEqual(
      graph.filter((id) =>
        /src\/(domain|application|infrastructure|state)\/|ProofView|app\/proof/.test(
          id,
        ),
      ),
      [],
      'ordinary build includes proof',
    );
  else
    assert.ok(
      graph.some((id) => /firestore\/dist\/index\.esm\.js/.test(id)),
      'browser Firestore entry absent',
    );
  console.log(dir + ': ' + graph.length + ' modules; isolation verified');
}
