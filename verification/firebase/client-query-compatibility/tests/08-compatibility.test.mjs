import {test,before,after} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';import 'firebase/compat/firestore';
import {query} from '../views.mjs';import {dateFields,priorityOrder} from '../query-engine.mjs';
import {encodeDefinition,loadDefinition,createGate,checkCompatibility,upgradeDefinition} from '../compatibility.mjs';
import {encodeQuery} from '../query-codec.mjs';
let env;const clients=[];const db=(uid='owner')=>{const d=env.authenticatedContext(uid).firestore();clients.push(d);return d};
const ts=()=>firebase.firestore.FieldValue.serverTimestamp();
const contract={serverRelease:2,contractVersion:1,minimumAppRelease:2,readSchemas:[1,2],writeSchemas:[2]};
const app={release:2,readSchemas:[1,2],writeSchema:2};
const full={...query('Lifecycle','Category'),includeClosed:true,includeDeleted:true,dateBuckets:[7,30,90],filters:{Category:{c1:true},Location:{ids:{l1:true},includeUnspecified:true},Priority:priorityOrder,Pause:['None','Timed','Expired','Indefinite'],...Object.fromEntries(Object.keys(dateFields).map(k=>[k,{presence:'set',from:20000,until:21000}]))}};
const deny=p=>assert.rejects(p,e=>e.code==='permission-denied');
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-taskify-client-query',firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{const d=ctx.firestore();await d.doc('configuration/compatibility').set(contract);for(const id of ['focus','allTasks','broken'])await d.doc('users/owner/savedViews/'+id).set({ownerUid:'owner',name:id,query:query(),showOnHome:true,version:0,createdAt:firebase.firestore.Timestamp.now(),updatedAt:firebase.firestore.Timestamp.now()});});});
after(async()=>{await Promise.all(clients.map(d=>d.terminate()));await env.cleanup();});
test('compatible boot reads server contract; old app, unknown schema and unavailable contract block all gated work',async()=>{
 const d=db(),gate=createGate(app);let actions=0;await assert.rejects(gate.run(()=>actions++),/BOOT_BLOCKED/);
 await gate.refresh(async()=>(await d.doc('configuration/compatibility').get()).data());await gate.run(()=>actions++);assert.equal(actions,1);
 for(const c of [{...contract,minimumAppRelease:3},{...contract,readSchemas:[1,2,3]},{...contract,writeSchemas:[3]},null,{...contract,contractVersion:2}]){await assert.rejects(gate.refresh(async()=>c));assert.equal(gate.ready,false);await assert.rejects(gate.run(()=>actions++),/BOOT_BLOCKED/);}
 await assert.rejects(gate.refresh(async()=>{throw Error('NETWORK')}));assert.equal(actions,1);
 assert.throws(()=>checkCompatibility(contract,{...app,release:1}),/UPDATE_REQUIRED/);
});
test('resume/reconnect recheck disables previously compatible session after minimum release increases',async()=>{
 const gate=createGate(app);await gate.refresh(async()=>contract);assert.equal(gate.ready,true);await assert.rejects(gate.refresh(async()=>({...contract,minimumAppRelease:3})),/UPDATE_REQUIRED/);await assert.rejects(gate.run(()=>{}),/BOOT_BLOCKED/);
});
test('browser cannot change compatibility contract; unauthenticated read denied',async()=>{
 await deny(db().doc('configuration/compatibility').update({minimumAppRelease:0}));await deny(db('other').doc('configuration/compatibility').delete());await deny(env.unauthenticatedContext().firestore().doc('configuration/compatibility').get());
});
test('full query saves, reloads, renames and reconfigures without losing any filter',async()=>{
 const d=db(),ref=d.doc('users/owner/savedViews/focus');await ref.update({...encodeDefinition(full),version:1,updatedAt:ts()});assert.deepEqual(loadDefinition((await ref.get()).data()),{ok:true,query:full});
 await ref.update({name:'Full query',version:2,updatedAt:ts()});const changed={...full,sortDirection:'desc'};await ref.update({...encodeDefinition(changed),version:3,updatedAt:ts()});assert.deepEqual(loadDefinition((await ref.get()).data()).query,changed);
 await deny(ref.update({...encodeDefinition(full),version:3,updatedAt:ts()}));assert.equal((await ref.get()).data().version,3);
});
test('accepted boundary: owner can store malformed bounded payload; client refuses it without fallback results',async()=>{
 const d=db(),ref=d.doc('users/owner/savedViews/broken');let version=0;
 for(const payload of ['{',JSON.stringify({...query(),filters:{Pause:['Unknown']}}),JSON.stringify({...query(),filters:{Due:{presence:'set',from:9,until:2}}}),JSON.stringify({...query(),search:'secret'}),JSON.stringify({...query(),taskIds:['foreign']})]){
  await ref.update({querySchemaVersion:2,query:payload,version:++version,updatedAt:ts()});const result=loadDefinition((await ref.get()).data());assert.equal(result.ok,false);assert.equal(result.query,null);
 }
 await ref.update({...encodeDefinition(full),version:++version,updatedAt:ts()});assert.equal(loadDefinition((await ref.get()).data()).ok,true);
});
test('envelope rejects oversize, future schema, foreign owner, immutable timestamps and protected All Tasks',async()=>{
 const d=db(),ref=d.doc('users/owner/savedViews/focus'),patch={...encodeDefinition(full),version:4,updatedAt:ts()};
 for(const mutation of [{query:'x'.repeat(32769)},{querySchemaVersion:3},{ownerUid:'other'},{createdAt:ts()},{query:42}])await deny(ref.update({...patch,...mutation}));
 await deny(db('other').doc(ref.path).update(patch));await deny(d.doc('users/owner/savedViews/allTasks').update({...patch,version:1}));
});
test('safe legacy upgrade preserves meaning and metadata; repeated upgrade is a no-op',async()=>{
 const d=db(),ref=d.doc('users/owner/savedViews/legacy');await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(ref.path).set({ownerUid:'owner',name:'Legacy',query:query(),showOnHome:true,version:0,createdAt:firebase.firestore.Timestamp.now(),updatedAt:firebase.firestore.Timestamp.now()}));
 const original=(await ref.get()).data();assert.equal(await upgradeDefinition(d,ref,ts),true);const upgraded=(await ref.get()).data();assert.deepEqual(loadDefinition(upgraded).query,query());assert.equal(upgraded.version,1);assert.equal(upgraded.name,original.name);assert.ok(upgraded.createdAt.isEqual(original.createdAt));assert.equal(await upgradeDefinition(d,ref,ts),false);assert.equal((await ref.get()).data().version,1);
});
test('unknown newer and malformed legacy definitions are not silently migrated',async()=>{
 assert.equal(loadDefinition({querySchemaVersion:3,query:JSON.stringify(full)}).ok,false);
 const d=db(),ref=d.doc('users/owner/savedViews/badLegacy');await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(ref.path).set({query:{bad:true},version:5}));await assert.rejects(upgradeDefinition(d,ref,ts),/MANUAL_CORRECTION_REQUIRED/);assert.equal((await ref.get()).data().version,5);
});
test('Save As creates full-query View only with atomic order append; failed creation leaves no partial state',async()=>{
 const d=db(),ref=d.doc('users/owner/savedViews/saveAs'),order=d.doc('users/owner/orders/savedViews');
 await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(order.path).set({ownerUid:'owner',ids:['allTasks','focus'],version:1}));
 const record={ownerUid:'owner',name:'Saved full query',...encodeDefinition(full),showOnHome:true,version:0,createdAt:ts(),updatedAt:ts()};
 await deny(ref.set(record));assert.equal((await ref.get()).exists,false);assert.equal((await order.get()).data().version,1);
 const batch=d.batch();batch.set(ref,record);batch.update(order,{ids:['allTasks','focus','saveAs'],version:2});await batch.commit();assert.deepEqual(loadDefinition((await ref.get()).data()).query,full);
});
test('concurrent upgrades commit at most once and preserve concurrent-safe version integrity',async()=>{
 const a=db(),b=db(),path='users/owner/savedViews/racingLegacy';await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(path).set({ownerUid:'owner',name:'Race',query:query(),showOnHome:true,version:0,createdAt:firebase.firestore.Timestamp.now(),updatedAt:firebase.firestore.Timestamp.now()}));
 const outcomes=await Promise.allSettled([upgradeDefinition(a,a.doc(path),ts),upgradeDefinition(b,b.doc(path),ts)]);
 assert.equal(outcomes.filter(r=>r.status==='fulfilled'&&r.value===true).length,1);
 for(const result of outcomes)if(result.status==='rejected')assert.ok(['permission-denied','aborted'].includes(result.reason.code));
 const final=(await a.doc(path).get()).data();assert.equal(final.version,1);assert.deepEqual(loadDefinition(final).query,query());
});
test('complete compact legacy query upgrades losslessly; future schema migration refuses writes',async()=>{
 const d=db(),ref=d.doc('users/owner/savedViews/fullLegacy'),future=d.doc('users/owner/savedViews/future');
 await env.withSecurityRulesDisabled(async ctx=>{const base={ownerUid:'owner',name:'Full legacy',showOnHome:true,version:9,createdAt:firebase.firestore.Timestamp.now(),updatedAt:firebase.firestore.Timestamp.now()};await ctx.firestore().doc(ref.path).set({...base,query:encodeQuery(full)});await ctx.firestore().doc(future.path).set({...base,querySchemaVersion:3,query:JSON.stringify(full)});});
 assert.equal(await upgradeDefinition(d,ref,ts),true);assert.deepEqual(loadDefinition((await ref.get()).data()).query,full);assert.equal((await ref.get()).data().version,10);
 await assert.rejects(upgradeDefinition(d,future,ts),/MANUAL_CORRECTION_REQUIRED/);assert.equal((await future.get()).data().version,9);
});
