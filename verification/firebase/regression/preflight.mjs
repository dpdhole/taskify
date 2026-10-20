// Input-integrity preparation only. Does not start emulators or execute security tests.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const frozen=JSON.parse(fs.readFileSync(path.join(here,'frozen-inputs.json'),'utf8'));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
assert.equal(frozen.format,'taskify-security-regression-inputs-v1');
for(const entry of frozen.inputs){
 const resolved=path.resolve(root,entry.path);
 const relative=path.relative(root,resolved);
 assert.ok(!relative.startsWith('..')&&!path.isAbsolute(relative),'Input must stay within verification/firebase');
 assert.equal(hash(fs.readFileSync(resolved)),entry.sha256,`Input changed: ${entry.path}`);
}
const rules=folder=>fs.readFileSync(path.join(root,folder,'firestore.rules'));
assert.equal(hash(rules('gate3/purge-recovery')),frozen.candidateSha256);
assert.deepEqual(rules('gate3/purge-recovery'),rules('gate4/auth-query'));
for(const folder of ['gate2/entities','gate3/purge-recovery','gate4/auth-query']){
 const config=JSON.parse(fs.readFileSync(path.join(root,folder,'firebase.json'),'utf8'));
 assert.equal(config.emulators.firestore.host,'127.0.0.1');
 assert.equal(config.functions,undefined,'No Functions config');
 for(const emulator of Object.values(config.emulators))if(emulator&&typeof emulator==='object'&&'host' in emulator)assert.equal(emulator.host,'127.0.0.1');
 for(const rewrite of config.hosting?.rewrites??[]){assert.equal(rewrite.function,undefined);assert.equal(rewrite.run,undefined)}
 const pkg=JSON.parse(fs.readFileSync(path.join(root,folder,'package.json'),'utf8'));
 assert.match(pkg.scripts.test,/--project demo-taskify-gate[234]\b/);
 assert.match(fs.readFileSync(path.join(root,folder,'run.ps1'),'utf8'),/--project demo-taskify-gate[234]\b/);
}
const combined=path.join(here,'combined');
let combinedInputs=0;
if(fs.existsSync(path.join(combined,'run-inputs.json'))){
 const run=JSON.parse(fs.readFileSync(path.join(combined,'run-inputs.json'),'utf8'));
 assert.equal(run.project,'demo-taskify-regression');
 for(const entry of run.inputs){
  const resolved=path.resolve(combined,entry.path),relative=path.relative(combined,resolved);
  assert.ok(!relative.startsWith('..')&&!path.isAbsolute(relative));
  assert.equal(hash(fs.readFileSync(resolved)),entry.sha256,`Combined input changed: ${entry.path}`);
  combinedInputs++;
 }
 assert.deepEqual(fs.readFileSync(path.join(combined,'firestore.rules')),rules('gate3/purge-recovery'));
}
console.log(JSON.stringify({status:'REGRESSION_INPUTS_VERIFIED',historicalInputs:frozen.inputs.length,combinedInputs,candidateSha256:frozen.candidateSha256,securityTestsExecutedByPreflight:0},null,2));
