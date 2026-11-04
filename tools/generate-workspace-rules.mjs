import fs from 'node:fs';
import ts from 'typescript';
const policyFile = 'src/domain/workspace-policy.ts';
const tree = ts.createSourceFile(
  policyFile,
  fs.readFileSync(policyFile, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);
const values = {};
for (const statement of tree.statements)
  if (ts.isVariableStatement(statement))
    for (const declaration of statement.declarationList.declarations) {
      let value = declaration.initializer;
      if (value && ts.isAsExpression(value)) value = value.expression;
      if (value && ts.isArrayLiteralExpression(value))
        values[declaration.name.getText(tree)] = value.elements.map(
          (element) => element.text,
        );
      else if (value && ts.isNumericLiteral(value))
        values[declaration.name.getText(tree)] = Number(value.text);
    }
const zones = values.WORKSPACE_TIMEZONES;
if (!Array.isArray(zones) || zones.length < 400)
  throw Error('Invalid pinned timezone policy');
const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const patterns = [];
let entries = [];
let length = 0;
for (const zone of zones) {
  const escaped = escape(zone);
  if (length + escaped.length + 1 > 3000) {
    patterns.push('^(?:' + entries.join('|') + ')$');
    entries = [];
    length = 0;
  }
  entries.push(escaped);
  length += escaped.length + 1;
}
if (entries.length) patterns.push('^(?:' + entries.join('|') + ')$');
const timezoneCheck = patterns
  .map((pattern) => 'value.matches(' + JSON.stringify(pattern) + ')')
  .join(' || ');
let rules = fs
  .readFileSync('tests/support/provisioning-stage-probe.rules', 'utf8')
  .replace(/\r\n/g, '\n');
rules = rules.replace(
  '// LOCAL STAGE-INTEGRITY PROBE ONLY. Not a production/deployment policy.\n// Fixed seed recipe, fixture-only explicit UTC settings. No ordinary management writes.',
  '// Generated Slice5 initialization policy. Run npm run generate:workspace-rules.\n// Owner reads and exact template1 provisioning only; management/deletion-request writes denied.\n// No deployment is performed by generation or local tests.',
);
rules = rules.replace(
  /function allowed\(family\) \{[^\n]+\}/,
  `function allowed(family) {
    let c=get(/databases/$(database)/documents/runtime/compatibility).data;
    return c.contractFormatVersion==1 && c.environmentId==request.auth.token.aud &&
      c.revision is int && c.revision>0 && c.serverRelease is int && c.serverRelease>0 &&
      c.recordFamilies[family].presentSchemaVersions.hasAny([1]) &&
      c.recordFamilies[family].allowedWriteSchemaVersions.hasAny([1]);
  }`,
);
const photo = '^https://[^\\s/?#@]+(?:[/?#][^\\s]*)?$';
const profile = `function profileShape(p) {
    return p.keys().hasOnly(['schemaVersion','recordVersion','createdAt','updatedAt','displayName','photoUrl']) &&
      p.keys().hasAll(['schemaVersion','recordVersion','createdAt','updatedAt']) && meta(p) &&
      (!('displayName' in p) || (p.displayName is string && p.displayName.size()>0 && p.displayName==p.displayName.trim() && p.displayName.toUtf8().size()<=${values.PROFILE_NAME_MAX_BYTES})) &&
      (!('photoUrl' in p) || (p.photoUrl is string && p.photoUrl.toUtf8().size()<=${values.PROFILE_PHOTO_MAX_BYTES} && p.photoUrl.matches(${JSON.stringify(photo)})));
  }
  function validTimezone(value) { return value is string && (${timezoneCheck}); }
  `;
rules = rules.replace(
  'function baseAfter(uid)',
  profile + 'function baseAfter(uid)',
);
rules = rules.replace(
  "p.keys().hasOnly(['schemaVersion','recordVersion','createdAt','updatedAt']) && p.keys().hasAll(['schemaVersion','recordVersion','createdAt','updatedAt']) && meta(p)",
  'profileShape(p)',
);
rules = rules.replace("s.timezone=='UTC'", 'validTimezone(s.timezone)');
rules = rules.replace(
  "allow read: if owner(uid) && kind in ['profile'",
  "allow read: if unfenced(uid) && kind in ['profile'",
);
rules = rules.replace(
  "allow read: if owner(uid) && kind in ['categories','locations']",
  "allow read: if unfenced(uid) && kind in ['categories','locations']",
);
// Readable line wrapping of branches/boolean clauses; generated literals stay exact.
rules = rules
  .replace(/ && /g, ' &&\n      ')
  .replace(/ : id==/g, ' :\n      id==')
  .replace(/ : stage==/g, ' :\n      stage==');
const target = 'firestore.workspace.rules';
if (process.argv.includes('--check')) {
  if (
    !fs.existsSync(target) ||
    fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n') !== rules
  )
    throw Error(
      'Workspace Rules out of date; run npm run generate:workspace-rules',
    );
  console.log('Workspace Rules match pinned policy and tested template');
} else {
  fs.writeFileSync(target, rules);
  console.log(
    'Generated workspace Rules; ' +
      zones.length +
      ' supported timezone IDs/aliases',
  );
}
