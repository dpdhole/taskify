import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {prepareName} from '../names.mjs';
import {kinds,zeros,touches,ts,root,inv,job,addInventory,begin,removeOne,finish,purge,encode,decode,exportTask} from '../operations.mjs';
let env,serial=0;const uid='owner',other='intruder';
const db=(user=uid)=>env.authenticatedContext(user).firestore();
const deny=p=>assert.rejects(p,e=>e.code==='permission-denied');
const read=async id=>(await db().doc(root(uid,id)).get()).data();
const base=()=>({ownerUid:uid,categoryId:'uncategorized',locationId:null,lastEffect:null,linkCount:0,title:'Purge proof',reference:'',lifecycle:'Draft',pauseReason:null,pausedUntil:null,plannedStart:null,due:null,actualStart:null,actualEnd:null,closureOutcome:null,deletedAt:null,version:0,lastEventId:'',createdAt:ts(),updatedAt:ts()});
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-taskify-query-workload',firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});
 await env.clearFirestore();
 await db().doc(`users/${uid}`).set({ownerUid:uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});
 await db().doc(`users/${uid}/orders/categories`).set({ownerUid:uid,ids:[],version:0});
 const n=prepareName('Uncategorized'),client=db(),batch=client.batch();
 batch.set(client.doc(`users/${uid}/categories/uncategorized`),{ownerUid:uid,name:n.name,nameKey:n.nameKey,icon:'label',archived:false,version:0,createdAt:ts(),updatedAt:ts()});
 batch.set(client.doc(`users/${uid}/nameKeys/categories/keys/${n.digest}`),{ownerUid:uid,entityId:'uncategorized',nameKey:n.nameKey});
 batch.set(client.doc(`users/${uid}/orders/categories`),{ownerUid:uid,ids:['uncategorized'],version:1});await batch.commit();
});
after(async()=>{if(env)await env.cleanup()});
async function create(){const id=`gate3-${++serial}`;await db().doc(root(uid,id)).set(base());return id}
async function change(id,type,{omitInventory=false,patch={},stale}={}) {
 const client=db(),a=stale??await read(id),b={...a,version:a.version+1,lastEventId:`v${a.version+1}`,updatedAt:ts(),...patch};
 if(type==='Delete')b.deletedAt=ts();if(type==='Restore')b.deletedAt=null;
 if(type==='Start'){b.lifecycle='InProgress';b.actualStart=ts()}
 const e={ownerUid:uid,actorUid:uid,taskId:id,fromVersion:a.version,toVersion:b.version,type,comment:'',before:a,after:b,createdAt:ts(),effectBefore:null,effectAfter:null};
 const batch=client.batch();batch.set(client.doc(root(uid,id)),b);batch.set(client.doc(`${root(uid,id)}/activityEvents/${b.lastEventId}`),e);
 if(!omitInventory)await addInventory(client,batch,uid,id,{activityEvents:{id:b.lastEventId,delta:1}});await batch.commit();
}
async function addChild(id,kind='todos') {
 const client=db(),a=await read(id),cid=`child-${++serial}`,qualifies=kind!=='todos';
 const d={ownerUid:uid,taskId:id,createdAt:ts(),updatedAt:ts(),taskVersion:a.version+1,...(kind==='todos'?{title:'Todo',closed:false,closedAt:null,order:0}:kind==='discussionEntries'?{text:'Comment'}:{title:'Link',url:'https://example.com'})};
 const b={...a,version:a.version+1,lastEventId:`v${a.version+1}`,updatedAt:ts(),lastEffect:{kind,id:cid,action:'create',version:a.version+1},
  lifecycle:qualifies&&a.lifecycle==='Draft'&&a.pauseReason===null?'InProgress':a.lifecycle,
  actualStart:qualifies&&a.actualStart===null&&(a.lifecycle==='InProgress'||a.pauseReason===null)?ts():a.actualStart,
  linkCount:a.linkCount+(kind==='discussionLinks'?1:0)};
 const e={ownerUid:uid,actorUid:uid,taskId:id,fromVersion:a.version,toVersion:b.version,type:'Entity',comment:'',before:a,after:b,createdAt:ts(),effectBefore:null,effectAfter:kind==='discussionEntries'?null:d};
 const batch=client.batch();batch.set(client.doc(root(uid,id)),b);batch.set(client.doc(`${root(uid,id)}/activityEvents/${b.lastEventId}`),e);batch.set(client.doc(`${root(uid,id)}/${kind}/${cid}`),d);
 await addInventory(client,batch,uid,id,{activityEvents:{id:b.lastEventId,delta:1},[kind]:{id:cid,delta:1}});await batch.commit();return cid;
}
async function sample(){const id=await create();for(const kind of ['todos','discussionEntries','discussionLinks'])await addChild(id,kind);return id}

test('inventory is atomic with event/child creation; direct or forged counters rejected',async()=>{
 const id=await create();await deny(change(id,'Start',{omitInventory:true}));assert.equal((await read(id)).version,0);
 await change(id,'Start');await addChild(id);const i=(await db().doc(inv(uid,id)).get()).data();assert.deepEqual(i.counts,{todos:1,discussionEntries:0,discussionLinks:0,activityEvents:2});
 await deny(db().doc(inv(uid,id)).update({counts:zeros(),rev:i.rev+1,updatedAt:ts()}));
 await deny(db().doc(inv(uid,id)).delete());
});
test('soft Delete/Restore retains full hierarchy before irreversible purge starts',async()=>{
 const id=await sample();await change(id,'Delete');await change(id,'Restore');assert.equal((await read(id)).deletedAt,null);
 for(const kind of ['todos','discussionEntries','discussionLinks'])assert.equal((await db().collection(`${root(uid,id)}/${kind}`).get()).size,1);
 await deny(db().doc(root(uid,id)).delete());await deny(begin(db(),uid,id));
});
test('purge freezes edits, cannot complete early, and is cancellable only before any deletion',async()=>{
 const id=await sample();await change(id,'Delete');await begin(db(),uid,id);
 await deny(change(id,'Restore'));await deny(finish(db(),uid,id));await db().doc(job(uid,id)).delete();await change(id,'Restore');
 await change(id,'Delete');await begin(db(),uid,id);const first=(await db().collection(`${root(uid,id)}/todos`).get()).docs[0];await removeOne(db(),uid,id,'todos',first.id);
 await deny(db().doc(job(uid,id)).delete());await deny(change(id,'Restore'));
});
test('normal Activity events remain immutable and children cannot be hard-deleted outside purge',async()=>{
 const id=await sample();const e=db().doc(`${root(uid,id)}/activityEvents/v1`);await deny(e.delete());await deny(e.update({comment:'rewrite'}));
 await deny(removeOne(db(),uid,id,'todos',(await db().collection(`${root(uid,id)}/todos`).get()).docs[0].id));
});
test('interruption after partial child deletion resumes idempotently and removes every known child',async()=>{
 const id=await sample();await change(id,'Delete');await assert.rejects(purge(db(),uid,id,{failAfter:2}),e=>e.code==='INJECTED');
 assert.equal((await db().doc(job(uid,id)).get()).data().phase,'draining');assert.ok(await read(id));await purge(db(),uid,id);
 assert.equal((await db().doc(root(uid,id)).get()).exists,false);assert.deepEqual((await db().doc(inv(uid,id)).get()).data().counts,zeros());
 assert.equal((await db().doc(job(uid,id)).get()).data().phase,'complete');assert.equal((await purge(db(),uid,id)).alreadyComplete,true);
 await env.withSecurityRulesDisabled(async ctx=>{for(const kind of kinds)assert.equal((await ctx.firestore().collection(`${root(uid,id)}/${kind}`).get()).size,0)});
});
test('tombstone prevents ID reuse and completed hierarchy is inaccessible even to the owner',async()=>{
 const id=await sample();await change(id,'Delete');await purge(db(),uid,id);await deny(db().doc(root(uid,id)).set(base()));
 for(const kind of kinds)await deny(db().collection(`${root(uid,id)}/${kind}`).get());await deny(db().doc(job(uid,id)).delete());
});
test('ownership covers purge jobs, inventory, orphan cleanup and child enumeration',async()=>{
 const id=await sample();await change(id,'Delete');await begin(db(),uid,id);
 for(const client of [db(other),env.unauthenticatedContext().firestore()]){
  await deny(client.doc(job(uid,id)).get());await deny(client.doc(inv(uid,id)).get());await deny(client.doc(job(uid,id)).update({phase:'complete'}));
  for(const kind of kinds)await deny(client.collection(`${root(uid,id)}/${kind}`).get());
 }
});
test('Firestore does not cascade: privileged parent removal leaves children; marked orphan purge resumes safely',async()=>{
 const id=await sample();await change(id,'Delete');await begin(db(),uid,id);
 await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(root(uid,id)).delete());
 assert.equal((await db().collection(`${root(uid,id)}/todos`).get()).size,1); // Explicit owner cleanup access under a draining marker.
 await purge(db(),uid,id);assert.equal((await db().doc(job(uid,id)).get()).data().phase,'complete');
 const orphan=await sample();await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(root(uid,orphan)).delete());
 for(const kind of kinds)await deny(db().collection(`${root(uid,orphan)}/${kind}`).get());
});


import {checksum,preflight,operatorRestore} from '../operator-recovery.mjs';

test('export round trip preserves nested nanosecond timestamps and counts',async()=>{
 const id=await sample();const a=await exportTask(db(),uid,id,{pageSize:1});const text=JSON.stringify(a);const decoded=preflight(text,checksum(text),uid);
 assert.deepEqual(decoded.task,await read(id));assert.equal(a.records.length,6);
 const nanosecond=new firebase.firestore.Timestamp(100,123456789);assert.ok(decode(encode(nanosecond)).isEqual(nanosecond));
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/sample-backup.json',text);fs.writeFileSync('artifacts/sample-backup.sha256',checksum(text));
});

test('comment edits advance inventory revision and force export retry even without a Task version change',async()=>{
 const id=await sample();const cid=(await db().collection(`${root(uid,id)}/discussionEntries`).get()).docs[0].id;
 const taskBefore=await read(id);const a=await exportTask(db(),uid,id,{interleave:async attempt=>{
  if(attempt!==1)return;const client=db(),batch=client.batch();batch.update(client.doc(`${root(uid,id)}/discussionEntries/${cid}`),{text:'Changed during export',updatedAt:ts()});
  await addInventory(client,batch,uid,id,{discussionEntries:{id:cid,delta:0}});await batch.commit();
 }});
 assert.equal(a.attempts,2);assert.equal((await read(id)).version,taskBefore.version);
 assert.equal(decode(a.records.find(r=>r.kind==='discussionEntries').data).text,'Changed during export');
});

test('rapidly changing exports fail rather than emitting an inconsistent snapshot',async()=>{
 const id=await sample();await assert.rejects(exportTask(db(),uid,id,{retries:2,interleave:async attempt=>{
  const a=await read(id);await db().doc(root(uid,id)).update({title:`Change-${attempt}`,version:a.version+1,updatedAt:ts()});
 }}),e=>e.code==='SNAPSHOT_CHANGED');
 await change(id,'Delete');await begin(db(),uid,id);await assert.rejects(exportTask(db(),uid,id),/Purge marker/);
});

test('local archive validation rejects corruption, cross-user/path injection, duplicates and missing records before restore',async()=>{
 const id=await sample();const a=await exportTask(db(),uid,id);const text=JSON.stringify(a);await assert.rejects(operatorRestore(env,text+' ',checksum(text),uid),/CHECKSUM/);
 for(const edit of [x=>x.ownerUid=other,x=>x.taskId='../other',x=>x.records.push(x.records[0]),x=>x.records[0].id='nested/path',x=>x.records.pop()]){
  const bad=JSON.parse(text);edit(bad);const raw=JSON.stringify(bad);assert.throws(()=>preflight(raw,checksum(raw),uid));
 }
 await assert.rejects(operatorRestore(env,text,checksum(text),uid),/LIVE_TASK_EXISTS/);
});

test('ordinary browser import cannot recreate historical Task/events or undo a completed purge',async()=>{
 const id=await sample();const a=await exportTask(db(),uid,id);await change(id,'Delete');await purge(db(),uid,id);
 await deny(db().doc(root(uid,id)).set(decode(a.task)));
 const e=a.records.find(r=>r.kind==='activityEvents');await deny(db().doc(`${root(uid,id)}/activityEvents/${e.id}`).set(decode(e.data)));
});

test('operator recovery is resumable, publishes root last, preserves source records and rejects stale clients',async()=>{
 const id=await sample();const old=await read(id),a=await exportTask(db(),uid,id),text=JSON.stringify(a),sha=checksum(text);
 await change(id,'Delete');const frozen=await read(id);await purge(db(),uid,id);
 await assert.rejects(operatorRestore(env,text,sha,uid,{failAfter:2}),e=>e.code==='INJECTED_OPERATOR');assert.equal((await db().doc(root(uid,id)).get()).exists,false);
 for(const kind of kinds)await deny(db().collection(`${root(uid,id)}/${kind}`).get());
 const report=await operatorRestore(env,text,sha,uid);assert.ok(report.newVersion>frozen.version);assert.deepEqual((await read(id)).createdAt,old.createdAt);
 for(const r of a.records)assert.deepEqual((await db().doc(`${root(uid,id)}/${r.kind}/${r.id}`).get()).data(),decode(r.data));
 assert.equal((await db().doc(inv(uid,id)).get()).data().counts.activityEvents,a.records.filter(r=>r.kind==='activityEvents').length+1);
 await deny(change(id,'Delete',{stale:old}));assert.equal((await operatorRestore(env,text,sha,uid)).alreadyRestored,true);
 await change(id,'Delete');await change(id,'Restore'); // Normal secured operation resumes after controlled publication.
 fs.writeFileSync('artifacts/recovery-evidence.json',JSON.stringify(report,null,2));
});

test('failed finalization and lost acknowledgement retries do not double-delete or decrement counters',async()=>{
 const id=await sample();await change(id,'Delete');await begin(db(),uid,id);
 const todo=(await db().collection(`${root(uid,id)}/todos`).get()).docs[0];await removeOne(db(),uid,id,'todos',todo.id);
 const rev=(await db().doc(inv(uid,id)).get()).data().rev;assert.equal(await removeOne(db(),uid,id,'todos',todo.id),false);assert.equal((await db().doc(inv(uid,id)).get()).data().rev,rev);
 await deny(finish(db(),uid,id));await purge(db(),uid,id);await finish(db(),uid,id);assert.deepEqual((await db().doc(inv(uid,id)).get()).data().counts,zeros());
});

test('parent and purge marker cannot be completed by forged zero counts, timestamps or state transitions',async()=>{
 const id=await sample();await change(id,'Delete');const j=await begin(db(),uid,id);
 for(const patch of [{phase:'complete',completedAt:ts(),version:1},{taskVersion:999},{ownerUid:other},{startedAt:ts()},{inventoryRev:999}])await deny(db().doc(job(uid,id)).update(patch));
 const i=(await db().doc(inv(uid,id)).get()).data();await deny(db().doc(inv(uid,id)).set({...i,counts:zeros(),rev:i.rev+1,updatedAt:ts()}));
 await deny(db().doc(root(uid,id)).delete());assert.equal((await db().doc(job(uid,id)).get()).data().phase,j.phase);
});

import {cutoffIndia,eligible} from '../cleanup.mjs';

test('strict account-wide cleanup age checks equality, closed/deleted independence and month-end clamping',()=>{
 const now=Date.parse('2028-03-31T10:30:00Z'),cutoff=cutoffIndia(now,{unit:'months',n:1});assert.equal(new Date(cutoff).toISOString(),'2028-02-29T10:30:00.000Z');
 assert.equal(new Date(cutoffIndia(Date.parse('2027-03-31T10:30:00Z'),{unit:'months',n:1})).toISOString(),'2027-02-28T10:30:00.000Z');
 assert.equal(cutoffIndia(now,{unit:'days',n:1}),now-86400000);
 const T=ms=>firebase.firestore.Timestamp.fromMillis(ms);
 const data=[{id:'equal',lifecycle:'Closed',actualEnd:T(cutoff),deletedAt:null},{id:'older',lifecycle:'Closed',actualEnd:T(cutoff-1),deletedAt:null},
 {id:'deleted-open',lifecycle:'Draft',actualEnd:null,deletedAt:T(cutoff-1)},{id:'deleted-closed',lifecycle:'Closed',actualEnd:T(cutoff-1),deletedAt:T(cutoff-1)}];
 assert.deepEqual(eligible(data,'trash',cutoff).map(x=>x.id),['older']);assert.deepEqual(eligible(data,'purge',cutoff).map(x=>x.id),['deleted-open','deleted-closed']);
});

test('racing purge workers and repeated acknowledged steps do not duplicate mandatory effects',async()=>{
 const id=await sample();await change(id,'Delete');const results=await Promise.allSettled([purge(db(),uid,id),purge(db(),uid,id)]);
 assert.ok(results.some(r=>r.status==='fulfilled'));if(results.some(r=>r.status==='rejected'))await purge(db(),uid,id);
 assert.deepEqual((await db().doc(inv(uid,id)).get()).data().counts,zeros());assert.equal((await db().doc(job(uid,id)).get()).data().phase,'complete');
 await purge(db(),uid,id);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/purge-race.json',JSON.stringify(results.map(r=>({status:r.status,error:r.reason?.code})),null,2));
});

test('interrupted operator restore refuses switching archives and keeps staged records hidden',async()=>{
 const id=await sample(),a=await exportTask(db(),uid,id),text=JSON.stringify(a),sha=checksum(text);await change(id,'Delete');await purge(db(),uid,id);
 await assert.rejects(operatorRestore(env,text,sha,uid,{failAfter:1}),e=>e.code==='INJECTED_OPERATOR');
 const different=JSON.parse(text);different.attempts=99;const raw=JSON.stringify(different);await assert.rejects(operatorRestore(env,raw,checksum(raw),uid),/DIFFERENT_ARCHIVE/);
 assert.equal((await db().doc(root(uid,id)).get()).exists,false);await operatorRestore(env,text,sha,uid);
});

test('large synthetic hierarchy exceeds 500 records and drains through bounded resumable writes',async()=>{
 const id=await create(),at=firebase.firestore.Timestamp.now(),totalTodos=252,totalEvents=253;
 // This is an explicitly privileged scale fixture, not evidence of client creation security.
 await env.withSecurityRulesDisabled(async ctx=>{
  const client=ctx.firestore();let batch=client.batch(),writes=0;const flush=async()=>{if(writes){await batch.commit();batch=client.batch();writes=0}};
  for(let n=1;n<=totalTodos;n++){batch.set(client.doc(`${root(uid,id)}/todos/t${n}`),{ownerUid:uid,taskId:id,title:`Todo ${n}`,closed:false,closedAt:null,order:n,createdAt:at,updatedAt:at,taskVersion:n});writes++;if(writes===200)await flush()}
  for(let n=1;n<=totalEvents;n++){batch.set(client.doc(`${root(uid,id)}/activityEvents/v${n}`),{ownerUid:uid,actorUid:uid,taskId:id,fromVersion:n-1,toVersion:n,type:'Fixture',comment:'Synthetic scale fixture',createdAt:at});writes++;if(writes===200)await flush()}
  await flush();await client.doc(root(uid,id)).set({...base(),createdAt:at,updatedAt:at,deletedAt:at,version:totalEvents,lastEventId:`v${totalEvents}`});
  await client.doc(inv(uid,id)).set({ownerUid:uid,taskId:id,counts:{todos:totalTodos,discussionEntries:0,discussionLinks:0,activityEvents:totalEvents},touches:{...touches(),activityEvents:`v${totalEvents}`},rev:totalEvents,updatedAt:at});
 });
 await assert.rejects(purge(db(),uid,id,{failAfter:260,pageSize:17}),e=>e.code==='INJECTED');
 const middle=(await db().doc(inv(uid,id)).get()).data();assert.equal(Object.values(middle.counts).reduce((a,b)=>a+b,0),245);
 const result=await purge(db(),uid,id,{pageSize:17});assert.equal(result.removed,245);assert.deepEqual((await db().doc(inv(uid,id)).get()).data().counts,zeros());
 fs.writeFileSync('artifacts/large-purge-evidence.json',JSON.stringify({fixture:'privileged synthetic',initialRecords:505,interruptedAfter:260,resumedDeletes:result.removed,completed:true,perDeleteDocuments:2},null,2));
});

// Cross-gate inventory probes use an otherwise valid Start pair and vary one inventory property.
async function startWithInventory(id,mutate=()=>{}){
 const client=db(),a=await read(id),eid=`v${a.version+1}`,b={...a,lifecycle:'InProgress',actualStart:ts(),version:a.version+1,lastEventId:eid,updatedAt:ts()};
 const e={ownerUid:uid,actorUid:uid,taskId:id,fromVersion:a.version,toVersion:b.version,type:'Start',comment:'',before:a,after:b,createdAt:ts(),effectBefore:null,effectAfter:null};
 const old=(await client.doc(inv(uid,id)).get()).data();
 const i={ownerUid:uid,taskId:id,counts:{...(old?.counts??zeros()),activityEvents:(old?.counts.activityEvents??0)+1},touches:{...touches(),activityEvents:eid},rev:(old?.rev??0)+1,updatedAt:ts()};
 mutate(i);const batch=client.batch();batch.set(client.doc(root(uid,id)),b);batch.set(client.doc(`${root(uid,id)}/activityEvents/${eid}`),e);batch.set(client.doc(inv(uid,id)),i);return batch.commit();
}
test('cross-gate inventory forgery matrix rolls back valid Task/event controls completely',async()=>{
 const variants=[i=>i.counts.activityEvents=0,i=>i.counts.activityEvents=2,i=>i.counts.todos=-1,i=>i.counts.todos=1,i=>i.touches.activityEvents='orphan',i=>i.touches.todos='phantom',i=>i.rev=0,i=>i.rev=2,i=>i.ownerUid=other,i=>i.taskId='other',i=>i.updatedAt=firebase.firestore.Timestamp.fromMillis(1),i=>i.counts.unknown=1,i=>i.touches.unknown='v1',i=>i.unapproved=true];
 for(const mutate of variants){const id=await create(),before=await read(id);await deny(startWithInventory(id,mutate));assert.deepEqual(await read(id),before);assert.equal((await db().doc(inv(uid,id)).get()).exists,false);assert.equal((await db().collection(`${root(uid,id)}/activityEvents`).get()).size,0);await startWithInventory(id);assert.equal((await read(id)).version,1)}
});
test('metadata-only edits cannot manufacture inventory changes without a child witness',async()=>{
 const id=await sample(),client=db(),a=await read(id),before=(await client.doc(inv(uid,id)).get()).data(),batch=client.batch();
 batch.update(client.doc(root(uid,id)),{title:'Smuggled touch',version:a.version+1,updatedAt:ts()});
 batch.set(client.doc(inv(uid,id)),{...before,rev:before.rev+1,updatedAt:ts()});await deny(batch.commit());assert.deepEqual(await read(id),a);assert.deepEqual((await client.doc(inv(uid,id)).get()).data(),before);
 await client.doc(root(uid,id)).update({title:'Valid ordinary edit',version:a.version+1,updatedAt:ts()});assert.deepEqual((await client.doc(inv(uid,id)).get()).data(),before);
});
test('comment edits require a changed zero-delta inventory witness and leave Task version unchanged',async()=>{
 const id=await sample(),client=db(),ref=(await client.collection(`${root(uid,id)}/discussionEntries`).get()).docs[0].ref,a=await read(id),i=(await client.doc(inv(uid,id)).get()).data();
 await deny(ref.update({text:'Missing inventory',updatedAt:ts()}));const batch=client.batch();batch.update(ref,{text:'Valid zero-delta edit',updatedAt:ts()});await addInventory(client,batch,uid,id,{discussionEntries:{id:ref.id,delta:0}});await batch.commit();
 const after=(await client.doc(inv(uid,id)).get()).data();assert.deepEqual(after.counts,i.counts);assert.equal(after.rev,i.rev+1);assert.equal((await read(id)).version,a.version);
});
test('one inventory witness cannot authorize deletion of two siblings in the same collection',async()=>{
 const id=await create();await addChild(id);await addChild(id);await change(id,'Delete');await begin(db(),uid,id);
 const client=db(),todos=(await client.collection(`${root(uid,id)}/todos`).get()).docs,prior=(await client.doc(inv(uid,id)).get()).data(),batch=client.batch();for(const todo of todos)batch.delete(todo.ref);
 await addInventory(client,batch,uid,id,{todos:{id:todos[0].id,delta:-1}});await deny(batch.commit());assert.equal((await client.collection(`${root(uid,id)}/todos`).get()).size,2);assert.deepEqual((await client.doc(inv(uid,id)).get()).data(),prior);
 await purge(client,uid,id);
});
test('purge cancellation cannot piggyback on a physical deletion and expose a partial Task',async()=>{
 const id=await sample();await change(id,'Delete');await begin(db(),uid,id);const client=db(),todo=(await client.collection(`${root(uid,id)}/todos`).get()).docs[0],prior=(await client.doc(inv(uid,id)).get()).data(),batch=client.batch();
 batch.delete(todo.ref);batch.delete(client.doc(job(uid,id)));await addInventory(client,batch,uid,id,{todos:{id:todo.id,delta:-1}});await deny(batch.commit());assert.equal((await todo.ref.get()).exists,true);assert.equal((await client.doc(job(uid,id)).get()).data().phase,'draining');assert.deepEqual((await client.doc(inv(uid,id)).get()).data(),prior);
 await client.doc(job(uid,id)).delete();await change(id,'Restore');assert.equal((await read(id)).deletedAt,null);
});
test('completed tombstone has an exact content-free schema and cannot be edited or reused',async()=>{
 const id=await sample();await change(id,'Delete');await purge(db(),uid,id);const ref=db().doc(job(uid,id)),before=(await ref.get()).data();
 assert.deepEqual(Object.keys(before).sort(),['ownerUid','taskId','taskCreatedAt','taskVersion','deletedAt','inventoryRev','phase','version','startedAt','completedAt'].sort());
 for(const patch of [{title:'Content'},{phase:'draining'},{taskVersion:0},{completedAt:ts()},{version:2}])await deny(ref.update(patch));await deny(ref.delete());await deny(db().doc(root(uid,id)).set(base()));assert.deepEqual((await ref.get()).data(),before);
});
test('purge-frozen Task rejects metadata, lifecycle and child creation without partial inventory effects',async()=>{
 const id=await sample();await change(id,'Delete');await begin(db(),uid,id);const client=db(),a=await read(id),before=(await client.doc(inv(uid,id)).get()).data();
 await deny(client.doc(root(uid,id)).update({title:'Frozen',version:a.version+1,updatedAt:ts()}));await deny(change(id,'Restore'));for(const kind of ['todos','discussionEntries','discussionLinks'])await deny(addChild(id,kind));
 assert.deepEqual(await read(id),a);assert.deepEqual((await client.doc(inv(uid,id)).get()).data(),before);await purge(client,uid,id);
});
