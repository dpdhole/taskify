import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails as unusedAssertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {inventoryPath,putCounters} from '../counters.mjs';

async function assertFails(promise) { await assert.rejects(promise,e=>e.code==='permission-denied'); }
let env;
const uid = 'owner';
const other = 'intruder';
const sentinel = () => firebase.firestore.FieldValue.serverTimestamp();
const stamp = () => firebase.firestore.Timestamp.fromDate(new Date('2030-01-01T00:00:00Z'));
const path = id => `users/${uid}/tasks/${id}`;
const eventPath = (id,eid) => `${path(id)}/activityEvents/${eid}`;
const db = (user = uid) => env.authenticatedContext(user).firestore();
// Owner reads construct adversarial fixtures even when the batch actor is foreign.
async function addCounters(batch,client,tid,changes){
 const before=(await db().doc(inventoryPath(uid,tid)).get()).data();
 putCounters(batch,client,uid,tid,before,changes);return before;
}
async function commentChange(ref,tid,patch,remove=false){
 const client=ref.firestore,batch=client.batch();
 if(remove)batch.delete(ref);else batch.update(ref,patch);
 await addCounters(batch,client,tid,{discussionEntries:{id:ref.id,delta:remove?-1:0}});
 return batch.commit();
}
const base = () => ({ ownerUid:uid, categoryId:'uncategorized',locationId:null,lastEffect:null,linkCount:0, title:'Proof task', reference:'', lifecycle:'Draft', pauseReason:null,
  pausedUntil:null, plannedStart:null, due:null, actualStart:null, actualEnd:null,
  closureOutcome:null, deletedAt:null, version:0, lastEventId:'', createdAt:sentinel(), updatedAt:sentinel() });

before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-taskify-query-workload',firestore:{rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
  await env.clearFirestore();
  await db().doc('users/'+uid).set({ownerUid:uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});
  await initClassifications();
});
after(async () => { if (env) await env.cleanup(); });

const millis=x=>firebase.firestore.Timestamp.fromMillis(x);
function planned(at,{precision='time',endExclusive=false}={}) {
 const local=at.toMillis()+330*60000;
 const selected=local-(endExclusive?1:0);
 return {at,day:millis(Math.floor(selected/86400000)*86400000),precision,endExclusive};
}
function normalizeDates(t) {
 for(const k of ['plannedStart','due']) if(t[k] && typeof t[k].toMillis==='function')t[k]=planned(t[k]);
 return t;
}
let counter = 0;
async function create() {
  const id = `case-${++counter}`;
  await assertSucceeds(db().doc(path(id)).set(base()));
  return id;
}
const updateFor = (old, type, eid) => {
  const next = {...old, version:old.version + 1,lastEventId:eid,updatedAt:sentinel()};
  switch(type) {
    case 'Start': next.lifecycle='InProgress';next.actualStart=sentinel();break;
    case 'StartResume': next.lifecycle='InProgress';next.actualStart=sentinel();next.pauseReason=null;next.pausedUntil=null;break;
    case 'Schedule': next.lifecycle='InProgress'; next.plannedStart=stamp();break;
    case 'SchedulePause':next.plannedStart=stamp();next.pauseReason='Waiting';next.pausedUntil=stamp();break;
    case 'Pause':next.pauseReason='Waiting';break;
    case 'EditPause':next.pauseReason='Blocked';break;
    case 'Resume':next.pauseReason=null;next.pausedUntil=null;break;
    case 'ResumeStart':next.lifecycle='InProgress';next.pauseReason=null;next.pausedUntil=null;next.actualStart=sentinel();break;
    case 'Done':next.lifecycle='Closed';next.closureOutcome='Done';next.actualEnd=sentinel();next.pauseReason=null;next.pausedUntil=null;break;
    case 'Close':next.lifecycle='Closed';next.closureOutcome='Cancelled';next.actualEnd=sentinel();next.pauseReason=null;next.pausedUntil=null;break;
    case 'Reopen':next.lifecycle='InProgress';next.closureOutcome=null;next.actualEnd=null;break;
    case 'EditDates':next.due=stamp();break;
    case 'Delete':next.deletedAt=sentinel();break;
    case 'Restore':next.deletedAt=null;break;
    default: throw new Error(`unknown operation ${type}`);
  }
  return normalizeDates(next);
};
async function paired(id, type, {expected='pass', actor=uid, eid, comment, mutateTask, mutateEvent, taskOnly=false, eventOnly=false, stale} = {}) {
  const client = db(actor);
  const ref = client.doc(path(id));
  const beforeTask = stale ?? (await db().doc(path(id)).get()).data();
  const operationId = eid ?? `v${beforeTask.version+1}`;
  const next = updateFor(beforeTask,type,operationId);
  if (mutateTask) mutateTask(next,beforeTask); normalizeDates(next);
  const event = {ownerUid:uid,actorUid:uid,taskId:id,fromVersion:beforeTask.version,toVersion:next.version,
    type:type==='SchedulePause'?'Schedule':type==='StartResume'?'Start':type==='ResumeStart'?'Resume':type,
    comment:comment ?? (type==='Pause'?'Reason':type==='SchedulePause'?'Waiting to start':''),
    before:beforeTask, after:next, createdAt:sentinel(), effectBefore:null,effectAfter:null};
  if (mutateEvent) mutateEvent(event,next,beforeTask);
  const batch=client.batch();
  if (!eventOnly) batch.set(ref,next);
  if (!taskOnly) batch.set(client.doc(eventPath(id,operationId)),event);
  const inventoryBefore=await addCounters(batch,client,id,{activityEvents:{id:operationId,delta:1}});
  const op=batch.commit();
  if (expected==='pass') await assertSucceeds(op); else await assertFails(op);
  if(expected!=='pass')assert.deepEqual((await db().doc(inventoryPath(uid,id)).get()).data(),inventoryBefore);
  return {next,event,operationId};
}

// Each test isolates an independent Task, except tests that explicitly exercise transitions.
test('authenticated owner can create Draft, but foreign and unauthenticated users cannot',async()=>{
  await create();
  await assertFails(db(other).doc(path('cross-user-create')).set(base()));
  await assertFails(env.unauthenticatedContext().firestore().doc(path('anon-create')).set(base()));
});
test('ordinary title/reference edit succeeds, but cannot smuggle audited changes',async()=>{
  const id=await create(); const ref=db().doc(path(id));
  await assertSucceeds(ref.update({title:'New title',reference:'REF-1',version:1,updatedAt:sentinel()}));
  await assertFails(ref.update({lifecycle:'InProgress'}));
  await assertFails(ref.update({title:'Attempt',actualStart:stamp()}));
  await assertFails(ref.update({version:1}));
  await assertFails(ref.update({ownerUid:other}));
  await assertFails(ref.update({unknown:'field'}));
});
test('Start requires a matching immutable event',async()=>{
  const id=await create();
  await paired(id,'Start',{expected:'fail',taskOnly:true});
  await paired(id,'Start',{expected:'fail',eventOnly:true});
  await paired(id,'Start');
  await assertFails(db().doc(eventPath(id,'v1')).update({comment:'altered'}));
  await assertFails(db().doc(eventPath(id,'v1')).delete());
});
test('Schedule and paused Schedule satisfy different approved transitions',async()=>{
  await paired(await create(),'Schedule');
  await paired(await create(),'SchedulePause');
});
test('Pause and Edit Pause require an event and first-episode explanation',async()=>{
  const id=await create();
  await paired(id,'Pause',{expected:'fail',comment:''});
  await paired(id,'Pause');
  await paired(id,'EditPause');
  await paired(id,'Resume');
});
test('Start and Resume combinations preserve independent Pause semantics',async()=>{
  const id=await create();await paired(id,'Pause');await paired(id,'StartResume');
  const separate=await create();await paired(separate,'Pause');await paired(separate,'ResumeStart');
});
test('Done, Close and Reopen preserve the approved lifecycle core',async()=>{
  const done=await create();await paired(done,'Done');await paired(done,'Reopen');
  const close=await create();await paired(close,'Close');await paired(close,'Reopen');
});
test('Audited date edits require events',async()=>{
  const id=await create();
  await paired(id,'EditDates',{taskOnly:true,expected:'fail'});
  await paired(id,'EditDates');
});
test('Reject mismatched actors, operation types and historical snapshots',async()=>{
  for(const edit of [
    e=>{e.actorUid=other},
    e=>{e.type='Done'},
    e=>{e.fromVersion=99},
    e=>{e.before={...e.before,title:'fake'}},
    e=>{e.after={...e.after,title:'fake'}}
  ]) await paired(await create(),'Start',{expected:'fail',mutateEvent:edit});
});
test('Reject unauthorized client writes, impossible transitions and mixed-field bypasses',async()=>{
  const id=await create();
  await paired(id,'Start',{expected:'fail',actor:other});
  await paired(id,'Start',{expected:'fail',mutateTask:t=>{t.reference='smuggled'}});
  await paired(id,'Start');
  await paired(id,'Start',{expected:'fail'});
  await paired(id,'Reopen',{expected:'fail'});
});
test('Reject event ID replay and stale Task versions',async()=>{
  const id=await create();
  const stale=(await db().doc(path(id)).get()).data();
  await paired(id,'Start');
  await paired(id,'EditDates',{expected:'fail',eid:'v1'});
  await paired(id,'Start',{expected:'fail',stale,eid:'v2'});
});
test('Concurrent same-version batches: at most one commits',async()=>{
  const id=await create();
  const stale=(await db().doc(path(id)).get()).data();
  const attempts=await Promise.allSettled([
    paired(id,'Start',{stale}),
    paired(id,'Start',{stale})
  ]);
  assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1);
  const snapshot=await db().doc(path(id)).get();
  assert.equal(snapshot.data().version,1);
});
test('Rejected paired write commits neither document',async()=>{
  const id=await create();
  await paired(id,'Start',{expected:'fail',mutateEvent:e=>{e.actorUid=other}});
  assert.equal((await db().doc(path(id)).get()).data().version,0);
  assert.equal((await db().doc(eventPath(id,'v1')).get()).exists,false);
});

test('REGRESSION Resume Only cannot promote paused Draft without Actual Start',async()=>{
  const id=await create();await paired(id,'Pause');
  await paired(id,'Resume',{expected:'fail',mutateTask:t=>{t.lifecycle='InProgress'}});
});
test('REGRESSION inactive pause cannot retain pausedUntil',async()=>{
  await assertFails(db().doc(path('invalid-pause')).set({...base(),pausedUntil:stamp()}));
});
test('REGRESSION metadata update must participate in version integrity',async()=>{
  const id=await create();
  await assertFails(db().doc(path(id)).update({title:'unversioned stale write'}));
});


async function denied(promise) { await assert.rejects(promise,e=>e.code==='permission-denied'); }
async function snapshot(id) { return (await db().doc(path(id)).get()).data(); }
async function metadata(id,patch,old) {
 const a=old??await snapshot(id);
 return db().doc(path(id)).update({...patch,version:a.version+1,updatedAt:sentinel()});
}
function pairData(id,a,type,changes={}) {
 const eid=`v${a.version+1}`;
 const b={...updateFor(a,type,eid),...changes};
 const e={ownerUid:uid,actorUid:uid,taskId:id,fromVersion:a.version,toVersion:b.version,type,
  comment:type==='Pause'?'Reason':'',before:a,after:b,createdAt:sentinel(),effectBefore:null,effectAfter:null};
 return {eid,b,e};
}
async function addPair(batch,client,id,p,changes={}) {
 batch.set(client.doc(path(id)),p.b);batch.set(client.doc(eventPath(id,p.eid)),p.e);
 await addCounters(batch,client,id,{activityEvents:{id:p.eid,delta:1},...changes});
}

test('owner reads and lists Tasks/events; anonymous and foreign reads and writes denied',async()=>{
 const id=await create();await paired(id,'Start');
 for(const client of [db(other),env.unauthenticatedContext().firestore()]) {
  await denied(client.doc(path(id)).get());await denied(client.collection(`users/${uid}/tasks`).get());
  await denied(client.doc(eventPath(id,'v1')).get());await denied(client.collection(`${path(id)}/activityEvents`).get());
  await denied(client.doc(path(id)).update({title:'foreign'}));await denied(client.doc(path(id)).delete());
  const p=pairData(id,await snapshot(id),'Pause');const batch=client.batch();await addPair(batch,client,id,p);await denied(batch.commit());
 }
 await assertSucceeds(db().collection(`users/${uid}/tasks`).get());
 await assertSucceeds(db().collection(`${path(id)}/activityEvents`).get());
 await denied(db().doc('unmatched/x').set({anything:true}));
});

for(const [type,setup] of [
 ['Start',[]],['Schedule',[]],['Pause',[]],['EditPause',['Pause']],['Resume',['Pause']],
 ['Done',[]],['Close',[]],['Reopen',['Done']],['EditDates',[]],['Delete',[]],['Restore',['Delete']]
]) test(`pairing/rollback matrix ${type}: Task-only and event-only rejected; exact pair accepted`,async()=>{
 const id=await create();for(const op of setup)await paired(id,op);
 const a=await snapshot(id);const eid=`v${a.version+1}`;
 for(const options of [{taskOnly:true},{eventOnly:true}]) {
  await paired(id,type,{...options,expected:'fail'});
  assert.deepEqual(await snapshot(id),a);assert.equal((await db().doc(eventPath(id,eid)).get()).exists,false);
 }
 await paired(id,type);
 assert.equal((await snapshot(id)).version,a.version+1);
 assert.equal((await db().doc(eventPath(id,eid)).get()).exists,true);
});

test('Start Only preserves pause; Resume Only preserves Draft and empty Actual Start',async()=>{
 const start=await create();await paired(start,'Pause');await paired(start,'Start');
 assert.equal((await snapshot(start)).pauseReason,'Waiting');
 const resume=await create();await paired(resume,'Pause');await paired(resume,'Resume');
 const a=await snapshot(resume);assert.equal(a.lifecycle,'Draft');assert.equal(a.actualStart,null);
 const scheduled=await create();await paired(scheduled,'Schedule');await paired(scheduled,'Start');
 assert.ok((await snapshot(scheduled)).actualStart);
});

test('all five failure outcomes and repeated closure preserve original Actual Start and history',async()=>{
 for(const reason of ['Cancelled','UnableToComplete','NoLongerApplicable','Duplicate','Other']) {
  const id=await create();await paired(id,'Start');const a=await snapshot(id);
  await paired(id,'Pause');await paired(id,'Close',{mutateTask:t=>{t.closureOutcome=reason}});
  const closed=await snapshot(id);assert.equal(closed.pauseReason,null);assert.equal(closed.closureOutcome,reason);
  await paired(id,'Reopen');assert.deepEqual((await snapshot(id)).actualStart,a.actualStart);
  await paired(id,'Done');assert.equal((await db().collection(`${path(id)}/activityEvents`).get()).size,5);
 }
});

test('Schedule Pause has system comment; rescheduling preserves independent pausedUntil',async()=>{
 const id=await create();await paired(id,'SchedulePause');const a=await snapshot(id);
 await paired(id,'EditDates',{mutateTask:t=>{t.plannedStart=firebase.firestore.Timestamp.fromMillis(stamp().toMillis()+86400000);t.due=firebase.firestore.Timestamp.fromMillis(stamp().toMillis()+172800000)}});
 const b=await snapshot(id);assert.deepEqual(b.pausedUntil,a.pausedUntil);assert.equal(b.lifecycle,'Draft');assert.equal(b.actualStart,null);
 await paired(await create(),'SchedulePause',{expected:'fail',comment:'spoofed system comment'});
});

test('Closed and Deleted are read-only except their explicit permitted operations',async()=>{
 const closed=await create();await paired(closed,'Done');
 await denied(metadata(closed,{title:'forbidden'}));
 for(const op of ['Start','Schedule','Pause','Resume','EditDates','Done','Close'])await paired(closed,op,{expected:'fail'});
 await paired(closed,'Delete');await paired(closed,'Reopen',{expected:'fail'});await paired(closed,'Restore');await paired(closed,'Reopen');
 const id=await create();await paired(id,'Pause');await paired(id,'Delete');
 await denied(metadata(id,{reference:'forbidden'}));
 for(const op of ['Start','Schedule','EditPause','Resume','Done','Close','EditDates','Delete'])await paired(id,op,{expected:'fail'});
 await paired(id,'Restore');assert.equal((await snapshot(id)).pauseReason,'Waiting');
 await denied(db().doc(path(id)).delete());
});

for(const [label,mutateTask] of Object.entries({
 'owner':t=>t.ownerUid=other,'createdAt':t=>t.createdAt=stamp(),'updatedAt':t=>t.updatedAt=stamp(),
 'actualStart':t=>t.actualStart=stamp(),'version skip':t=>t.version+=1,'version float':t=>t.version=1.5,
 'unknown field':t=>t.evil=true,'missing field':t=>delete t.reference,
 'legacy state':t=>t.lifecycle='Waiting','inactive pause date':t=>t.pausedUntil=stamp(),
 'open closure outcome':t=>t.closureOutcome='Done','open actual end':t=>t.actualEnd=stamp(),
 'reference overflow':t=>t.reference='x'.repeat(256),'closure timestamp spoof':t=>t.actualEnd=stamp()
}))test(`protected field/schema attack ${label} rolls back both documents`,async()=>{
 const id=await create();const a=await snapshot(id);
 await paired(id,'Start',{expected:'fail',mutateTask});
 assert.deepEqual(await snapshot(id),a);assert.equal((await db().collection(`${path(id)}/activityEvents`).get()).size,0);
});

for(const [label,mutateEvent] of Object.entries({
 'owner':e=>e.ownerUid=other,'taskId':e=>e.taskId='another-task','actor':e=>e.actorUid=other,
 'timestamp':e=>e.createdAt=stamp(),'toVersion':e=>e.toVersion=99,'fromVersion':e=>e.fromVersion=99,
 'missing comment':e=>delete e.comment,'comment type':e=>e.comment=42,'attachment':e=>e.attachment='https://example.com',
 'oversized comment':e=>e.comment='x'.repeat(2001),'type':e=>e.type='MadeUp',
 'before':e=>e.before={...e.before,title:'forged'},'after':e=>e.after={...e.after,title:'forged'}
}))test(`event forgery ${label} rolls back both documents`,async()=>{
 const id=await create();const a=await snapshot(id);
 await paired(id,'Start',{expected:'fail',mutateEvent});assert.deepEqual(await snapshot(id),a);
 assert.equal((await db().collection(`${path(id)}/activityEvents`).get()).size,0);
});

test('creation cannot inject protected or obsolete state; Task and orphan event cannot be created together',async()=>{
 for(const [i,patch] of [
  {ownerUid:other},{version:1},{lastEventId:'v1'},{createdAt:stamp()},{updatedAt:stamp()},
  {actualStart:stamp()},{actualEnd:stamp()},{deletedAt:stamp()},{lifecycle:'InProgress'},
  {pauseReason:'Waiting'},{pausedUntil:stamp()},{closureOutcome:'Done'},{obsolete:true}
 ].entries())await denied(db().doc(path(`invalid-create-${i}`)).set({...base(),...patch}));
 const client=db();const batch=client.batch();const id='create-and-event';
 batch.set(client.doc(path(id)),base());batch.set(client.doc(eventPath(id,'v0')),{ownerUid:uid});
 await denied(batch.commit());assert.equal((await client.doc(path(id)).get()).exists,false);
 await denied(client.doc(eventPath('absent-task','v1')).set({ownerUid:uid}));
});

test('metadata edits version and timestamp atomically; stale metadata and audited snapshots are rejected',async()=>{
 const id=await create();const a=await snapshot(id);await metadata(id,{title:'fresh'});
 await denied(metadata(id,{reference:'stale'},a));
 await paired(id,'Start',{expected:'fail',stale:a});
 await denied(db().doc(path(id)).update({reference:'bad time',version:2,updatedAt:stamp()}));
 await paired(id,'Start');assert.equal((await snapshot(id)).title,'fresh');assert.equal((await snapshot(id)).version,2);
});

test('deterministic event IDs reject aliases, replay, wrong-parent events and additional effects',async()=>{
 const id=await create();await paired(id,'Start',{eid:'arbitrary',expected:'fail'});
 await paired(id,'Start');const a=await snapshot(id);const client=db();
 await paired(id,'Pause',{eid:'v1',expected:'fail'});
 const p=pairData(id,a,'Pause');const batch=client.batch();await addPair(batch,client,id,p);
 batch.set(client.doc(eventPath(id,'extra')),{...p.e});await denied(batch.commit());
 assert.deepEqual(await snapshot(id),a);
 const another=await create();const wrong=client.batch();wrong.set(client.doc(path(id)),p.b);
 wrong.set(client.doc(eventPath(another,p.eid)),p.e);await denied(wrong.commit());
 await paired(id,'Pause');const event=(await client.doc(eventPath(id,'v2')).get()).data();
 await denied(client.doc(eventPath(id,'v2')).set(event));
 await denied(client.doc(eventPath(id,'v2')).update({after:{...event.after,title:'rewrite'}}));
});

test('semantic no-op operations and whitespace-only first-pause comments are rejected',async()=>{
 const id=await create();await paired(id,'Pause',{comment:'   ',expected:'fail'});await paired(id,'Pause');await paired(id,'EditPause');
 await paired(id,'EditPause',{expected:'fail'});await paired(id,'Resume');await paired(id,'Resume',{expected:'fail'});
 await paired(id,'EditDates');await paired(id,'EditDates',{expected:'fail'});
});

test('native SDK transaction conflict is rejected safely but is not automatically retried',async()=>{
 const id=await create();const client=db();const ref=client.doc(path(id));let attempts=0;
 await denied(client.runTransaction(async tx=>{
  const a=(await tx.get(ref)).data(),inventory=(await tx.get(client.doc(inventoryPath(uid,id)))).data();attempts++;
  if(attempts===1)await metadata(id,{title:'concurrent metadata'});
  const p=pairData(id,a,'Start');tx.set(ref,p.b);tx.set(client.doc(eventPath(id,p.eid)),p.e);
  putCounters(tx,client,uid,id,inventory,{activityEvents:{id:p.eid,delta:1}});
 },{maxAttempts:5}));
 assert.equal(attempts,1);assert.equal((await snapshot(id)).version,1);
 assert.equal((await client.collection(`${path(id)}/activityEvents`).get()).size,0);
});

async function retryTransaction(client,id,type,{inject,limit=3}={}) {
 const ref=client.doc(path(id));let callbacks=0;
 for(let attempt=1;attempt<=limit;attempt++) {
  let observedVersion;
  try {
   await client.runTransaction(async tx=>{
    const a=(await tx.get(ref)).data(),inventory=(await tx.get(client.doc(inventoryPath(uid,id)))).data();observedVersion=a.version;callbacks++;
    if(inject)await inject(callbacks);
    const p=pairData(id,a,type);tx.set(ref,p.b);tx.set(client.doc(eventPath(id,p.eid)),p.e);
    putCounters(tx,client,uid,id,inventory,{activityEvents:{id:p.eid,delta:1}});
   },{maxAttempts:3});
   return {attempts:attempt,callbacks};
  } catch(e) {
   if(e.code!=='permission-denied'||observedVersion===undefined||attempt===limit)throw e;
   const fresh=(await ref.get({source:'server'})).data();
   if(fresh.version===observedVersion)throw e;
   // Only confirmed concurrent changes permit a bounded retry; Rules revalidate the operation.
  }
 }
}

test('bounded adapter retry after confirmed version drift commits one Task change and one event',async()=>{
 const id=await create();const client=db();
 const evidence=await retryTransaction(client,id,'Start',{inject:async callbacks=>{
  if(callbacks===1)await metadata(id,{title:'concurrent metadata'});
 }});
 assert.equal(evidence.attempts,2);assert.equal(evidence.callbacks,2);
 const a=await snapshot(id);assert.equal(a.version,2);assert.equal(a.title,'concurrent metadata');
 const events=await client.collection(`${path(id)}/activityEvents`).get();assert.equal(events.size,1);assert.equal(events.docs[0].id,'v2');
 fs.writeFileSync('transaction-evidence.json',JSON.stringify({...evidence,version:a.version,eventIds:events.docs.map(d=>d.id)},null,2));
});

test('adapter retry does not swallow invalid transitions or loop past its bound',async()=>{
 const id=await create();await paired(id,'Done');let callbacks=0;
 await denied(retryTransaction(db(),id,'Start',{inject:async()=>{callbacks++}}));assert.equal(callbacks,1);
 const conflict=await create();let forced=0;
 await denied(retryTransaction(db(),conflict,'Start',{limit:2,inject:async()=>{forced++;await metadata(conflict,{title:`conflict-${forced}`})}}));
 assert.equal(forced,2);assert.equal((await snapshot(conflict)).version,2);
 assert.equal((await db().collection(`${path(conflict)}/activityEvents`).get()).size,0);
});
test('same-version batch race leaves exactly one event and one state effect',async()=>{
 const id=await create();const a=await snapshot(id);const results=await Promise.allSettled([paired(id,'Start',{stale:a}),paired(id,'Done',{stale:a})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await snapshot(id)).version,1);assert.equal((await db().collection(`${path(id)}/activityEvents`).get()).size,1);
 const rejected=results.find(r=>r.status==='rejected');assert.equal(rejected.reason.code,'permission-denied');
});

test('mixed valid and invalid Tasks roll back entire batch',async()=>{
 const one=await create(),two=await create();const client=db();const batch=client.batch();
 await addPair(batch,client,one,pairData(one,await snapshot(one),'Start'));
 const p=pairData(two,await snapshot(two),'Start');p.e.actorUid=other;await addPair(batch,client,two,p);
 await denied(batch.commit());
 for(const id of [one,two]){assert.equal((await snapshot(id)).version,0);assert.equal((await client.collection(`${path(id)}/activityEvents`).get()).size,0)}
});

test('Rules access budget sweep records accepted boundary and denied-batch rollback',async()=>{
 const results=[];
 for(let n=1;n<=12;n++) {
  const client=db();const batch=client.batch();const ids=[];
  for(let i=0;i<n;i++){const id=await create();ids.push(id);await addPair(batch,client,id,pairData(id,await snapshot(id),'Start'))}
  let accepted=true;try{await batch.commit()}catch(e){assert.equal(e.code,'permission-denied');accepted=false}
  results.push({aggregates:n,writes:n*3,accepted});
  for(const id of ids){assert.equal((await snapshot(id)).version,accepted?1:0);assert.equal((await client.collection(`${path(id)}/activityEvents`).get()).size,accepted?1:0);const inventory=await client.doc(inventoryPath(uid,id)).get();assert.equal(inventory.exists,accepted);if(accepted)assert.equal(inventory.data().counts.activityEvents,1)}
 }
 fs.writeFileSync('budget-evidence.json',JSON.stringify(results,null,2));
 assert.equal(results[0].accepted,true);assert.equal(results.at(-1).accepted,false);
});



test('date ordering rejects inverted instants and rolls back its event (prototype restriction)',async()=>{
 const id=await create();const a=await snapshot(id);
 await paired(id,'EditDates',{expected:'fail',mutateTask:t=>{
  t.plannedStart=firebase.firestore.Timestamp.fromMillis(stamp().toMillis()+86400000);
 }});
 assert.deepEqual(await snapshot(id),a);
});

test('resolved domain gap: same-calendar-day Planned Start after Due is accepted',async()=>{
 const id=await create();
 await paired(id,'EditDates',{mutateTask:t=>{
  t.plannedStart=firebase.firestore.Timestamp.fromDate(new Date('2030-01-01T18:00:00Z'));
  t.due=firebase.firestore.Timestamp.fromDate(new Date('2030-01-01T09:00:00Z'));
 }});
 // Calendar-day equality permits either clock-time order.
});



// Fixed-timezone calendar-date extension. Raw maps are not normalized by the harness.
const instant=iso=>firebase.firestore.Timestamp.fromDate(new Date(iso));
const civil=day=>instant(day+'T00:00:00Z');
const rawPlan=(at,day,extra={})=>({at:instant(at),day:civil(day),precision:'time',endExclusive:false,...extra});
const schemaPlan=p=>({at:millis(p.atMillis),day:millis(p.dayMillis),precision:p.precision,endExclusive:p.endExclusive});
async function setPlans(start,due,options={}) {
 const id=await create();await paired(id,'EditDates',{...options,mutateTask:t=>{t.plannedStart=start;t.due=due}});return id;
}

test('India EOD and 16:00 resolve to correct UTC instants with original selected day',async()=>{
 const {resolveIndia}=await import('../planned-dates.mjs');
 const eod=resolveIndia({day:'2026-10-20',precision:'date'},true);
 assert.equal(new Date(eod.atMillis).toISOString(),'2026-10-20T18:30:00.000Z');
 const afternoon=resolveIndia({day:'2026-10-20',clock:'16:00'},true);
 assert.equal(new Date(afternoon.atMillis).toISOString(),'2026-10-20T10:30:00.000Z');
 assert.equal(eod.dayMillis,afternoon.dayMillis);
 const start=resolveIndia({day:'2026-10-20',precision:'date'},false);
 assert.equal(new Date(start.atMillis).toISOString(),'2026-10-19T18:30:00.000Z');
 await setPlans(schemaPlan(start),schemaPlan(eod));await setPlans(schemaPlan(start),schemaPlan(afternoon));
});

test('India display and overdue boundary stay unchanged when host timezone changes to London',async()=>{
 const {resolveIndia,indiaDisplay,isDueReached}=await import('../planned-dates.mjs');
 const original=process.env.TZ;const evidence=[];
 try {
  for(const host of ['Asia/Kolkata','Europe/London']) {
   process.env.TZ=host;
   const day=resolveIndia({day:'2026-10-20',precision:'date'},true);
   const time=resolveIndia({day:'2026-10-20',clock:'16:00'},true);
   assert.equal(indiaDisplay(time.atMillis),'20/10/2026, 16:00');
   assert.equal(indiaDisplay(day.atMillis),'21/10/2026, 00:00');
   for(const p of [day,time]) {assert.equal(isDueReached(p.atMillis,p.atMillis-1),false);assert.equal(isDueReached(p.atMillis,p.atMillis),true)}
   evidence.push({host,timeLabel:indiaDisplay(time.atMillis),eodBoundary:indiaDisplay(day.atMillis),timeUtc:new Date(time.atMillis).toISOString(),eodUtc:new Date(day.atMillis).toISOString()});
  }
 } finally { if(original===undefined)delete process.env.TZ;else process.env.TZ=original; }
 fs.writeFileSync('travel-evidence.json',JSON.stringify(evidence,null,2));
});

test('same India calendar day permits reversed clock times even across UTC midnight',async()=>{
 await setPlans(rawPlan('2026-10-20T20:00:00Z','2026-10-21'),rawPlan('2026-10-20T19:00:00Z','2026-10-21'));
 await setPlans(rawPlan('2026-10-20T12:30:00Z','2026-10-20'),rawPlan('2026-10-20T03:30:00Z','2026-10-20'));
});

test('same UTC day does not permit inverted India dates',async()=>{
 await setPlans(rawPlan('2026-10-20T23:00:00Z','2026-10-21'),rawPlan('2026-10-20T18:00:00Z','2026-10-20'),{expected:'fail'});
});

test('EOD boundary belongs to selected previous day; exact midnight belongs to its entered day',async()=>{
 const at='2026-10-20T18:30:00Z';
 const start=rawPlan(at,'2026-10-21',{precision:'date'});
 const eod=rawPlan(at,'2026-10-20',{precision:'date',endExclusive:true});
 await setPlans(start,eod,{expected:'fail'});
 await setPlans(start,rawPlan(at,'2026-10-21'));
 await setPlans(rawPlan('2026-10-19T18:30:00Z','2026-10-20',{precision:'date'}),eod);
 // A Night shortcut may resolve to an exact timestamp with an end-of-day boundary; no symbolic slot is stored.
 await setPlans(null,rawPlan(at,'2026-10-20',{precision:'time',endExclusive:true}));
});

for(const [label,change] of Object.entries({
 'selected day before':p=>p.day=civil('2026-10-19'),
 'selected day after':p=>p.day=civil('2026-10-21'),
 'non-midnight day key':p=>p.day=instant('2026-10-20T01:00:00Z'),
 'timestamp contradicts day':p=>p.at=instant('2026-10-21T10:30:00Z'),
 'string timestamp':p=>p.at='2026-10-20T10:30:00Z',
 'string day':p=>p.day='2026-10-20',
 'missing day':p=>delete p.day,'missing instant':p=>delete p.at,
 'missing precision':p=>delete p.precision,'missing boundary':p=>delete p.endExclusive,
 'forged offset':p=>p.utcOffsetMinutes=0,'forged zone':p=>p.timeZone='Europe/London',
 'obsolete symbolic slot':p=>p.precision='Afternoon','unknown key':p=>p.evil=true,
 'date precision at 16h':p=>p.precision='date',
 'end-of-day at 16h':p=>p.endExclusive=true,
 'non-boolean boundary':p=>p.endExclusive='true'
}))test(`date schema forgery ${label} rejects Task and event together`,async()=>{
 const id=await create();const a=await snapshot(id);
 const p=rawPlan('2026-10-20T10:30:00Z','2026-10-20');change(p);
 await paired(id,'EditDates',{expected:'fail',mutateTask:t=>t.due=p});
 assert.deepEqual(await snapshot(id),a);assert.equal((await db().collection(`${path(id)}/activityEvents`).get()).size,0);
});

test('date-only start requires India midnight and cannot use end-exclusive boundary',async()=>{
 await setPlans(rawPlan('2026-10-20T10:30:00Z','2026-10-20',{precision:'date'}),null,{expected:'fail'});
 await setPlans(rawPlan('2026-10-20T18:30:00Z','2026-10-20',{endExclusive:true}),null,{expected:'fail'});
});

test('EOD selected-day forgery cannot turn a later start date into a valid pair',async()=>{
 const start=rawPlan('2026-10-20T18:30:00Z','2026-10-21',{precision:'date'});
 const forgedDue=rawPlan('2026-10-20T18:30:00Z','2026-10-21',{precision:'date',endExclusive:true});
 await setPlans(start,forgedDue,{expected:'fail'});
});

test('planned date changes cannot bypass mandatory audit through ordinary metadata update',async()=>{
 const id=await create();const a=await snapshot(id);
 await denied(metadata(id,{title:'smuggle',due:rawPlan('2026-10-20T10:30:00Z','2026-10-20')}));
 assert.deepEqual(await snapshot(id),a);
 await paired(id,'EditDates',{mutateTask:t=>t.due=rawPlan('2026-10-20T10:30:00Z','2026-10-20')});
 const b=await snapshot(id);await paired(id,'EditDates',{stale:a,expected:'fail'});
 assert.deepEqual(await snapshot(id),b);
});

test('fixed account policy rejects owner relocation, forged offsets, deletion and foreign writes',async()=>{
 const profile=db().doc('users/'+uid);
 for(const patch of [{timeZone:'Europe/London'},{utcOffsetMinutes:0},{timeZone:'Asia/Kolkata',utcOffsetMinutes:331}])await denied(profile.update(patch));
 await denied(profile.delete());await denied(db(other).doc('users/'+uid).update({utcOffsetMinutes:0}));
 await denied(env.unauthenticatedContext().firestore().doc('users/'+uid).get());
 const saved=(await profile.get()).data();assert.deepEqual(saved,{ownerUid:uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});
 for(const [i,patch] of [{timeZone:'Europe/London',utcOffsetMinutes:0},{timeZone:'Asia/Kolkata',utcOffsetMinutes:0},{timeZone:'Asia/Kolkata',utcOffsetMinutes:330,extra:true}].entries()) {
  const user=`bad-zone-${i}`;await denied(db(user).doc('users/'+user).set({ownerUid:user,...patch}));
 }
});

test('Task cannot override timezone, and dates fail closed without an account policy',async()=>{
 const id=await create();await paired(id,'EditDates',{expected:'fail',mutateTask:t=>{t.timeZone='Europe/London'}});
 const user='no-policy';await denied(db(user).doc(`users/${user}/tasks/x`).set({...base(),ownerUid:user}));
});

test('valid dates at creation are checked by the same Rules as updates',async()=>{
 const id='dated-create';await assertSucceeds(db().doc(path(id)).set({...base(),
  plannedStart:rawPlan('2026-10-19T18:30:00Z','2026-10-20',{precision:'date'}),
  due:rawPlan('2026-10-20T18:30:00Z','2026-10-20',{precision:'date',endExclusive:true})}));
 await denied(db().doc(path('forged-dated-create')).set({...base(),due:rawPlan('2026-10-20T10:30:00Z','2026-10-19')}));
});

test('date adapter handles leap day and year rollover and rejects invalid civil input',async()=>{
 const {resolveIndia}=await import('../planned-dates.mjs');
 assert.equal(new Date(resolveIndia({day:'2028-02-29',precision:'date'},true).atMillis).toISOString(),'2028-02-29T18:30:00.000Z');
 assert.equal(new Date(resolveIndia({day:'2026-12-31',precision:'date'},true).atMillis).toISOString(),'2026-12-31T18:30:00.000Z');
 for(const day of ['2026-02-29','2026-02-30','2026-13-01','bad'])assert.throws(()=>resolveIndia({day}));
 assert.throws(()=>resolveIndia({day:'2026-10-20',clock:'24:00'}));
 await setPlans(null,rawPlan('2028-02-29T18:30:00Z','2028-02-29',{precision:'date',endExclusive:true}));
 await setPlans(null,rawPlan('2026-12-31T18:30:00Z','2026-12-31',{precision:'date',endExclusive:true}));
});

import {prepareName} from '../names.mjs';
const classPath=(kind,id)=>`users/${uid}/${kind}/${id}`;
const orderPath=kind=>`users/${uid}/orders/${kind}`;
const keyPath=(kind,digest)=>`users/${uid}/nameKeys/${kind}/keys/${digest}`;
async function namedBatch(kind,id,input,{client=db(),omitGuard=false,omitOrder=false,raw}={}) {
 const name=raw??prepareName(input);const ref=client.doc(classPath(kind,id));const batch=client.batch();
 const old=(await ref.get()).data();const order=(await client.doc(orderPath(kind)).get()).data();
 const data={ownerUid:uid,name:name.name,nameKey:name.nameKey,icon:'label',archived:false,version:old?old.version+1:0,createdAt:old?.createdAt??sentinel(),updatedAt:sentinel()};
 batch.set(ref,data);
 if(!omitGuard&&(!old||old.nameKey!==data.nameKey)) {
  batch.set(client.doc(keyPath(kind,name.digest)),{ownerUid:uid,entityId:id,nameKey:name.nameKey});
  if(old)batch.delete(client.doc(keyPath(kind,prepareName(old.name).digest)));
 }
 if(!old&&!omitOrder)batch.set(client.doc(orderPath(kind)),{...order,ids:[...order.ids,id],version:order.version+1});
 return batch;
}
async function initClassifications() {
 for(const kind of ['categories','locations'])await db().doc(orderPath(kind)).set({ownerUid:uid,ids:[],version:0});
 await (await namedBatch('categories','uncategorized','Uncategorized')).commit();
}


const childDoc=(tid,kind,id)=>`${path(tid)}/${kind}/${id}`;
async function childMutation(tid,kind,action,{id=`child-${++counter}`,patch={},mutateChild,mutateTask,mutateEvent,omit,expected='pass',stale,actor=uid}={}) {
 const client=db(actor),a=stale??await snapshot(tid);const ref=client.doc(childDoc(tid,kind,id));
 const old=(await db().doc(childDoc(tid,kind,id)).get()).data();
 let d=action==='create'?{ownerUid:uid,taskId:tid,createdAt:sentinel(),updatedAt:sentinel(),taskVersion:a.version+1,
  ...(kind==='discussionEntries'?{text:'Comment'}:kind==='discussionLinks'?{title:'External',url:'https://example.com'}:{title:'Todo',closed:false,closedAt:null,order:0})}:
  {...old,updatedAt:sentinel(),taskVersion:a.version+1};
 if(action==='close'){d.closed=true;d.closedAt=sentinel()}
 if(action==='reopen'){d.closed=false;d.closedAt=null}
 Object.assign(d,patch);if(mutateChild)mutateChild(d);
 const qualifies=(['discussionEntries','discussionLinks'].includes(kind)&&action==='create')||(kind==='todos'&&action==='close');
 const starts=qualifies&&a.actualStart===null&&(a.lifecycle==='InProgress'||a.pauseReason===null);
 const b={...a,version:a.version+1,lastEventId:`v${a.version+1}`,updatedAt:sentinel(),lastEffect:{kind,id,action,version:a.version+1},
  lifecycle:qualifies&&a.lifecycle==='Draft'&&a.pauseReason===null?'InProgress':a.lifecycle,
  actualStart:starts?sentinel():a.actualStart,
  linkCount:a.linkCount+(kind==='discussionLinks'?(action==='create'?1:action==='delete'?-1:0):0)};
 if(mutateTask)mutateTask(b);
 const e={ownerUid:uid,actorUid:uid,taskId:tid,fromVersion:a.version,toVersion:b.version,type:'Entity',comment:'',before:a,after:b,createdAt:sentinel(),
  effectBefore:kind==='discussionEntries'||action==='create'?null:old,effectAfter:kind==='discussionEntries'||action==='delete'?null:d};
 if(mutateEvent)mutateEvent(e);
 const batch=client.batch();if(omit!=='child'){if(action==='delete')batch.delete(ref);else batch.set(ref,d)}
 if(omit!=='task')batch.set(client.doc(path(tid)),b);if(omit!=='event')batch.set(client.doc(eventPath(tid,b.lastEventId)),e);
 const inventoryBefore=await addCounters(batch,client,tid,{activityEvents:{id:b.lastEventId,delta:1},[kind]:{id,delta:action==='create'?1:action==='delete'?-1:0}});
 if(expected==='fail'){
  await denied(batch.commit());assert.deepEqual((await db().doc(inventoryPath(uid,tid)).get()).data(),inventoryBefore);
 }else await batch.commit();return {id,child:d,task:b,event:e};
}

for(const kind of ['discussionEntries','discussionLinks','todos'])test(`Gate2 ${kind}: create requires exact child + Task + event, no partial writes`,async()=>{
 const tid=await create();const a=await snapshot(tid);
 for(const omit of ['child','task','event']) {
  const id=`missing-${++counter}`;await childMutation(tid,kind,'create',{id,omit,expected:'fail'});
  assert.deepEqual(await snapshot(tid),a);assert.equal((await db().doc(childDoc(tid,kind,id)).get()).exists,false);
  assert.equal((await db().collection(`${path(tid)}/activityEvents`).get()).size,0);
 }
 await childMutation(tid,kind,'create');const b=await snapshot(tid);
 assert.equal(b.lifecycle,kind==='todos'?'Draft':'InProgress');assert.equal(b.actualStart===null,kind==='todos');
});

for(const kind of ['discussionEntries','discussionLinks','todos'])for(const state of ['Draft','DraftPaused','Scheduled','InProgressPaused'])test(`Gate2 implicit activity ${kind} on ${state}`,async()=>{
 const tid=await create();
 if(state==='DraftPaused')await paired(tid,'Pause');
 if(state==='Scheduled'||state==='InProgressPaused')await paired(tid,'Schedule');
 if(state==='InProgressPaused')await paired(tid,'Pause');
 const p=await childMutation(tid,kind,'create');
 if(kind==='todos')await childMutation(tid,kind,'close',{id:p.id});
 const b=await snapshot(tid);
 assert.equal(b.lifecycle,state==='DraftPaused'?'Draft':'InProgress');assert.equal(b.actualStart===null,state==='DraftPaused');
 assert.equal(b.pauseReason!==null,state.includes('Paused'));
});

test('Gate2 Todo rename/close/reopen/delete preserve title history, state and Actual Start',async()=>{
 const tid=await create();const p=await childMutation(tid,'todos','create');
 await childMutation(tid,'todos','edit',{id:p.id,patch:{title:'Renamed'}});assert.equal((await snapshot(tid)).actualStart,null);
 const event=(await db().doc(eventPath(tid,'v2')).get()).data();assert.equal(event.effectBefore.title,'Todo');assert.equal(event.effectAfter.title,'Renamed');
 await childMutation(tid,'todos','close',{id:p.id});const started=(await snapshot(tid)).actualStart;
 await childMutation(tid,'todos','edit',{id:p.id,patch:{title:'Forbidden'},expected:'fail'});
 await childMutation(tid,'todos','delete',{id:p.id,expected:'fail'});
 await childMutation(tid,'todos','reopen',{id:p.id});assert.deepEqual((await snapshot(tid)).actualStart,started);
 await childMutation(tid,'todos','delete',{id:p.id});assert.equal((await db().doc(childDoc(tid,'todos',p.id)).get()).exists,false);
});

test('Gate2 forged implicit Start, child timestamp, owner, reference and audit payload rejected',async()=>{
 for(const opts of [
  {mutateChild:d=>d.ownerUid=other},{mutateChild:d=>d.taskId='other'},{mutateChild:d=>d.createdAt=stamp()},
  {mutateChild:d=>d.taskVersion=999},{mutateTask:t=>t.actualStart=stamp()},
  {mutateTask:t=>t.lastEffect.id='missing'},{mutateEvent:e=>e.effectAfter={fake:true}},
  {actor:other}
 ]){const tid=await create();await childMutation(tid,'todos','create',{...opts,expected:'fail'});assert.equal((await snapshot(tid)).version,0)}
 const tid=await create();await paired(tid,'Pause');await childMutation(tid,'discussionEntries','create',{expected:'fail',mutateTask:t=>{t.lifecycle='InProgress';t.actualStart=sentinel()}});
});

for(const kind of ['discussionEntries','discussionLinks','todos'])test(`Gate2 ${kind}: Closed/Deleted Task read-only before and after batch`,async()=>{
 const tid=await create();await paired(tid,'Done');await childMutation(tid,kind,'create',{expected:'fail'});
 await paired(tid,'Reopen');await paired(tid,'Delete');await childMutation(tid,kind,'create',{expected:'fail'});await paired(tid,'Restore');
 const p=await childMutation(tid,kind,'create');await paired(tid,'Done');
 if(kind==='discussionEntries')await denied(commentChange(db().doc(childDoc(tid,kind,p.id)),tid,{text:'forbidden',updatedAt:sentinel()}));
 else await childMutation(tid,kind,'edit',{id:p.id,patch:{title:'forbidden'},expected:'fail'});
 await denied(db().doc(childDoc(tid,kind,p.id)).delete());
});

test('Gate2 comments edit/delete within 30 minutes; original timestamp/actor/order fields immutable',async()=>{
 const tid=await create();const p=await childMutation(tid,'discussionEntries','create');const ref=db().doc(childDoc(tid,'discussionEntries',p.id));
 const first=(await ref.get()).data();await commentChange(ref,tid,{text:'Edited',updatedAt:sentinel()});assert.deepEqual((await ref.get()).data().createdAt,first.createdAt);
 for(const patch of [{createdAt:sentinel()},{ownerUid:other},{taskVersion:999},{taskId:'other'},{url:'https://example.com'}])await denied(commentChange(ref,tid,{...patch,updatedAt:sentinel()}));
 await commentChange(ref,tid,null,true);assert.equal((await ref.get()).exists,false);
 const old=await childMutation(tid,'discussionEntries','create');const age=firebase.firestore.Timestamp.fromMillis(Date.now()-31*60000);
 await env.withSecurityRulesDisabled(async ctx=>ctx.firestore().doc(childDoc(tid,'discussionEntries',old.id)).update({createdAt:age}));
 const oldRef=db().doc(childDoc(tid,'discussionEntries',old.id));await denied(commentChange(oldRef,tid,{text:'Expired',updatedAt:sentinel()}));await denied(commentChange(oldRef,tid,null,true));
});

test('Gate2 comments have no prototype character cap and are plain-text data',async()=>{
 const tid=await create();const text='<script>plain data</script>\n'+'x'.repeat(12000);const p=await childMutation(tid,'discussionEntries','create',{patch:{text}});
 assert.equal((await db().doc(childDoc(tid,'discussionEntries',p.id)).get()).data().text,text);
});

test('Gate2 no Todo comment/attachment fields or nested entries, nor Activity attachment/user-post writes',async()=>{
 const tid=await create();const p=await childMutation(tid,'todos','create');
 for(const patch of [{comments:[]},{attachments:[]},{entries:[]},{url:'https://example.com'}])await childMutation(tid,'todos','edit',{id:p.id,patch,expected:'fail'});
 for(const sub of ['entries','comments','attachments'])await denied(db().doc(`${childDoc(tid,'todos',p.id)}/${sub}/x`).set({text:'forbidden'}));
 await denied(db().doc(eventPath(tid,'arbitrary')).set({text:'user comment',attachments:[]}));
});

test('Gate2 links: only HTTP(S), ten total slots, edit/delete paired and counts correct',async()=>{
 const tid=await create();
 for(const url of ['javascript:alert(1)','data:text/html,hi','file:///x'])await childMutation(tid,'discussionLinks','create',{patch:{url},expected:'fail'});
 const ids=[];for(let i=0;i<10;i++)ids.push((await childMutation(tid,'discussionLinks','create')).id);
 assert.equal((await snapshot(tid)).linkCount,10);await childMutation(tid,'discussionLinks','create',{expected:'fail'});
 await childMutation(tid,'discussionLinks','edit',{id:ids[0],patch:{url:'https://example.org/path'}});
 await childMutation(tid,'discussionLinks','delete',{id:ids[0]});assert.equal((await snapshot(tid)).linkCount,9);
 await childMutation(tid,'discussionLinks','create');assert.equal((await snapshot(tid)).linkCount,10);
});

test('Gate2 child changes reject stale root versions and competing mutations leave one effect',async()=>{
 const tid=await create();const stale=await snapshot(tid);const results=await Promise.allSettled([
  childMutation(tid,'discussionEntries','create',{stale}),childMutation(tid,'todos','create',{stale})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal((await snapshot(tid)).version,1);
 assert.equal((await db().collection(`${path(tid)}/activityEvents`).get()).size,1);
 const children=(await db().collection(`${path(tid)}/discussionEntries`).get()).size+(await db().collection(`${path(tid)}/todos`).get()).size;assert.equal(children,1);
});

import {defaultIds,query,defaults} from '../views.mjs';
async function provision(user=uid,{omit,mutate,client=db(user)}={}) {
 const batch=client.batch();const prefix=`users/${user}`;
 for(const v of defaults(user,sentinel)){if(v.id===omit)continue;if(mutate)mutate(v);batch.set(client.doc(`${prefix}/savedViews/${v.id}`),v.data)}
 if(omit!=='order')batch.set(client.doc(`${prefix}/orders/savedViews`),{ownerUid:user,ids:defaultIds,version:0});
 if(omit!=='manifest')batch.set(client.doc(`${prefix}/provisioning/views`),{ownerUid:user,version:1,createdAt:sentinel()});
 return batch;
}
async function createView(id,{name='Custom',q=query(),showOnHome=true,omitOrder=false}={}) {
 const client=db();const order=(await client.doc(orderPath('savedViews')).get()).data();const batch=client.batch();
 batch.set(client.doc(classPath('savedViews',id)),{ownerUid:uid,name,query:q,showOnHome,version:0,createdAt:sentinel(),updatedAt:sentinel()});
 if(!omitOrder)batch.set(client.doc(orderPath('savedViews')),{...order,ids:[...order.ids,id],version:order.version+1});return batch;
}
async function editView(id,patch,{stale}={}) {
 const ref=db().doc(classPath('savedViews',id));const a=stale??(await ref.get()).data();return ref.update({...patch,version:a.version+1,updatedAt:sentinel()});
}
async function deleteView(id,{omitOrder=false}={}) {
 const client=db(),order=(await client.doc(orderPath('savedViews')).get()).data(),batch=client.batch();
 batch.delete(client.doc(classPath('savedViews',id)));
 if(!omitOrder)batch.set(client.doc(orderPath('savedViews')),{...order,ids:order.ids.filter(x=>x!==id),version:order.version+1});return batch;
}

for(const kind of ['categories','locations'])test(`Gate2 ${kind}: Unicode adapter, exact reservations, rename, archive and order integrity`,async()=>{
 assert.equal(prepareName(' Cafe\u0301 ').name,'Café');assert.equal(prepareName('Cafe\u0301').digest,prepareName('Café').digest);
 assert.throws(()=>prepareName('a'.repeat(31)));const family='👨‍👩‍👧‍👦'.repeat(10);assert.equal(prepareName(family).name,family);
 const id=`named-${++counter}`;await (await namedBatch(kind,id,'Café')).commit();
 await denied((await namedBatch(kind,`duplicate-${++counter}`,'Cafe\u0301')).commit());
 await denied((await namedBatch(kind,`missing-guard-${++counter}`,'Missing Guard',{omitGuard:true})).commit());
 await denied((await namedBatch(kind,`missing-order-${++counter}`,'Missing Order',{omitOrder:true})).commit());
 const p=prepareName('Renamed / Category');await (await namedBatch(kind,id,p.name)).commit();
 assert.equal((await db().doc(keyPath(kind,prepareName('Café').digest)).get()).exists,false);
 assert.equal((await db().doc(keyPath(kind,p.digest)).get()).data().entityId,id);
 const ref=db().doc(classPath(kind,id));let a=(await ref.get()).data();await ref.update({archived:true,version:a.version+1,updatedAt:sentinel()});
 await denied((await namedBatch(kind,`archived-duplicate-${++counter}`,p.name.toUpperCase())).commit());
 await denied(ref.delete());await denied(db().doc(keyPath(kind,p.digest)).delete());
 const orderRef=db().doc(orderPath(kind));const order=(await orderRef.get()).data();
 await orderRef.update({ids:[...order.ids].reverse(),version:order.version+1});
 const latest=(await orderRef.get()).data();await denied(orderRef.update({ids:[...latest.ids,latest.ids[0]],version:latest.version+1}));
 await denied(orderRef.update({ids:[...latest.ids,'phantom'],version:latest.version+1}));
 const emoji=`emoji-${++counter}`;await (await namedBatch(kind,emoji,family)).commit();
});

test('Gate2 accepted limitation: crafted owner can bypass NFC/grapheme client policy only in own namespace',async()=>{
 const rawName='Cafe\u0301-raw';const rawKey=rawName.toLowerCase();const {createHash}=await import('node:crypto');
 const raw={name:rawName,nameKey:rawKey,digest:createHash('sha256').update(rawKey).digest('hex').toUpperCase()};
 await (await namedBatch('categories',`raw-${++counter}`,rawName,{raw})).commit();
 const long='x'.repeat(31);const longKey=prepareName('x');longKey.name=long;longKey.nameKey=long;longKey.digest=createHash('sha256').update(long).digest('hex').toUpperCase();
 await (await namedBatch('categories',`raw-long-${++counter}`,long,{raw:longKey})).commit();
 // These are explicit accepted client-policy limitations, not evidence of server-enforced Unicode validation.
});

test('Gate2 Uncategorized label/icon/archive/delete protections and classification ownership',async()=>{
 const ref=db().doc(classPath('categories','uncategorized')),a=(await ref.get()).data();
 for(const patch of [{name:'Other',nameKey:'other'},{icon:'other'},{archived:true},{ownerUid:other}])await denied(ref.update({...patch,version:a.version+1,updatedAt:sentinel()}));
 await denied(ref.delete());
 for(const kind of ['categories','locations']){
  await denied(db(other).collection(`users/${uid}/${kind}`).get());await denied(env.unauthenticatedContext().firestore().collection(`users/${uid}/${kind}`).get());
  await denied(db(other).doc(orderPath(kind)).update({ids:[],version:99}));
 }
});

test('Gate2 active classification references required for new assignment; archived existing references retained',async()=>{
 const cat=`reference-cat-${++counter}`,loc=`reference-loc-${++counter}`;
 await (await namedBatch('categories',cat,'Reference Category')).commit();await (await namedBatch('locations',loc,'Reference Location')).commit();
 const tid=await create();await metadata(tid,{categoryId:cat,locationId:loc});
 for(const kind of ['categories','locations']){
  const ref=db().doc(classPath(kind,kind==='categories'?cat:loc)),a=(await ref.get()).data();await ref.update({archived:true,version:a.version+1,updatedAt:sentinel()});
 }
 await metadata(tid,{title:'Existing archived classification remains editable'});await paired(tid,'Start');
 const fresh=await create();await denied(metadata(fresh,{categoryId:cat}));await denied(metadata(fresh,{locationId:loc}));
 await denied(metadata(fresh,{categoryId:'missing'}));await denied(metadata(fresh,{locationId:'missing'}));
 await denied(db().doc(path('bad-category-create')).set({...base(),categoryId:'missing'}));
 await metadata(tid,{categoryId:'uncategorized',locationId:null});
});

test('Gate2 competing normalized-name claims create one classification; loser has no entity/order residue',async()=>{
 const ids=[`race-${++counter}`,`race-${++counter}`],batches=await Promise.all(ids.map(id=>namedBatch('locations',id,'One Winner')));
 const result=await Promise.allSettled(batches.map(b=>b.commit()));assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
 const exists=await Promise.all(ids.map(async id=>(await db().doc(classPath('locations',id)).get()).exists));assert.equal(exists.filter(Boolean).length,1);
 const order=(await db().doc(orderPath('locations')).get()).data();assert.equal(ids.filter(id=>order.ids.includes(id)).length,1);
});

test('Gate2 provisioning rejects incomplete/forged presets and commits exactly seven valid views',async()=>{
 for(const [index,omit] of ['focus','allTasks','order','manifest'].entries()){
  const user=`incomplete-${index}`;await denied((await provision(user,{omit})).commit());
  assert.equal((await db(user).collection(`users/${user}/savedViews`).get()).size,0);
 }
 await denied((await provision('bad-default',{mutate:v=>{if(v.id==='focus')v.data.query.groupBy='Category'}})).commit());
 await (await provision()).commit();const views=await db().collection(`users/${uid}/savedViews`).get();assert.equal(views.size,7);
 for(const v of views.docs)assert.equal(v.data().showOnHome,true);
 assert.deepEqual((await db().doc(orderPath('savedViews')).get()).data().ids,defaultIds);
 await denied((await provision()).commit());
});

test('Gate2 All Tasks definition immutable, always on Home, but global order can move it',async()=>{
 const id='allTasks';for(const patch of [{name:'Renamed'},{showOnHome:false},{query:query('Location')},{ownerUid:other}])await denied(editView(id,patch));
 await denied((await deleteView(id)).commit());const ref=db().doc(orderPath('savedViews')),a=(await ref.get()).data();
 await ref.update({ids:['allTasks',...a.ids.filter(x=>x!=='allTasks')],version:a.version+1});assert.equal((await ref.get()).data().ids[0],'allTasks');
});

test('Gate2 ordinary presets/custom views editable and deletable; deletion never changes Tasks',async()=>{
 const tid=await create();const a=await snapshot(tid);await editView('focus',{name:'My Focus',showOnHome:false,query:query('Location')});
 await (await createView('custom-view',{name:'Saved copy',q:query('Priority')})).commit();
 await denied((await createView('no-order',{omitOrder:true})).commit());await denied((await createView('hidden-at-create',{showOnHome:false})).commit());
 await denied((await deleteView('custom-view',{omitOrder:true})).commit());await (await deleteView('custom-view')).commit();
 await (await deleteView('focus')).commit();assert.deepEqual(await snapshot(tid),a);
 assert.equal((await db().doc(classPath('savedViews','focus')).get()).exists,false);
});

test('Gate2 Saved View shape, grouping, ephemeral search, stale versions and ownership enforced',async()=>{
 const ref=db().doc(classPath('savedViews','scheduled')),stale=(await ref.get()).data();await editView('scheduled',{name:'Changed'});
 await denied(editView('scheduled',{name:'Stale'},{stale}));
 for(const patch of [{search:'temporary'},{taskIds:['task']},{query:{...query(),search:'temporary'}},{query:query('None')},{query:{...query(),includeClosed:'yes'}},{query:{...query(),closureReasons:['NotAReason']}}])await denied(editView('scheduled',patch));
 await editView('scheduled',{query:query('Due','Due','asc',false,false,['Done'])}); // Stored but inactive when Include Closed is off.
 await denied(db(other).doc(classPath('savedViews','scheduled')).get());await denied(db(other).doc(classPath('savedViews','scheduled')).update({name:'Foreign'}));
 await denied(env.unauthenticatedContext().firestore().doc(classPath('savedViews','scheduled')).get());
 const orderRef=db().doc(orderPath('savedViews')),order=(await orderRef.get()).data();
 await denied(orderRef.update({ids:[...order.ids,order.ids[0]],version:order.version+1}));
 await denied(orderRef.update({ids:order.ids.filter(x=>x!=='allTasks'),version:order.version+1}));
});

test('Gate2 racing initial provisioning yields one complete seven-view set',async()=>{
 const user='provision-race';const a=await provision(user),b=await provision(user);const result=await Promise.allSettled([a.commit(),b.commit()]);
 assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal((await db(user).collection(`users/${user}/savedViews`).get()).size,7);
 assert.deepEqual((await db(user).doc(`users/${user}/orders/savedViews`).get()).data().ids,defaultIds);
});


test('Gate2 stale child-effect pointer cannot piggyback a rename on an unrelated Start event',async()=>{
 const tid=await create();const p=await childMutation(tid,'todos','create');await childMutation(tid,'todos','edit',{id:p.id,patch:{title:'First rename'}});
 const a=await snapshot(tid),client=db(),batch=client.batch(),root=pairData(tid,a,'Start');await addPair(batch,client,tid,root,{todos:{id:p.id,delta:0}});
 const ref=client.doc(childDoc(tid,'todos',p.id)),old=(await ref.get()).data();
 batch.set(ref,{...old,title:'Smuggled rename',updatedAt:sentinel(),taskVersion:a.version+1});
 await denied(batch.commit());assert.deepEqual(await snapshot(tid),a);assert.equal((await ref.get()).data().title,'First rename');
 await childMutation(tid,'todos','edit',{id:p.id,patch:{title:'Second legitimate rename'}});
});

test('Gate2 closed Todo completion cannot be replayed and fake child audit snapshots roll back',async()=>{
 const tid=await create();const p=await childMutation(tid,'todos','create');const a=await snapshot(tid);
 await childMutation(tid,'todos','close',{id:p.id,expected:'fail',mutateEvent:e=>e.effectBefore={...e.effectBefore,title:'forged'}});
 assert.deepEqual(await snapshot(tid),a);await childMutation(tid,'todos','close',{id:p.id});
 await childMutation(tid,'todos','close',{id:p.id,expected:'fail'});
});

test('Gate2 child may not write a second sibling using one mandatory effect',async()=>{
 const tid=await create();const a=await snapshot(tid),client=db();const id='one',extra='two';
 const b={...a,version:1,lastEventId:'v1',updatedAt:sentinel(),lastEffect:{kind:'todos',id,action:'create',version:1}};
 const d={ownerUid:uid,taskId:tid,title:'Todo',closed:false,closedAt:null,order:0,createdAt:sentinel(),updatedAt:sentinel(),taskVersion:1};
 const e={ownerUid:uid,actorUid:uid,taskId:tid,fromVersion:0,toVersion:1,type:'Entity',comment:'',before:a,after:b,createdAt:sentinel(),effectBefore:null,effectAfter:d};
 const batch=client.batch();batch.set(client.doc(path(tid)),b);batch.set(client.doc(eventPath(tid,'v1')),e);
 batch.set(client.doc(childDoc(tid,'todos',id)),d);batch.set(client.doc(childDoc(tid,'todos',extra)),d);
 await addCounters(batch,client,tid,{activityEvents:{id:'v1',delta:1},todos:{id,delta:1}});
 await denied(batch.commit());assert.equal((await client.collection(`${path(tid)}/todos`).get()).size,0);assert.deepEqual(await snapshot(tid),a);
});

test('Gate2 classifications reject forged hash/guard, missing old reservation release, and protected default aliases',async()=>{
 const id=`integrity-${++counter}`;await (await namedBatch('categories',id,'Original Name')).commit();
 const raw=prepareName('Different Name'),client=db(),a=(await client.doc(classPath('categories',id)).get()).data();
 const batch=client.batch();batch.set(client.doc(classPath('categories',id)),{...a,name:raw.name,nameKey:raw.nameKey,version:a.version+1,updatedAt:sentinel()});
 batch.set(client.doc(keyPath('categories',raw.digest)),{ownerUid:uid,entityId:id,nameKey:raw.nameKey});
 await denied(batch.commit());assert.equal((await client.doc(classPath('categories',id)).get()).data().name,'Original Name');
 await denied(client.doc(keyPath('categories','0'.repeat(64))).set({ownerUid:uid,entityId:id,nameKey:'original name'}));
 await denied((await namedBatch('categories',`alias-${++counter}`,'Uncategorized')).commit());
 await denied(client.doc(classPath('categories',id)).update({name:'Change without guard',nameKey:'change without guard',version:a.version+1,updatedAt:sentinel()}));
 const oldKey=prepareName('Original Name');await denied(client.doc(keyPath('categories',oldKey.digest)).delete());
});

test('Gate2 child reads isolated by owner; orphan parents and link-count forgery rejected',async()=>{
 const tid=await create();
 for(const kind of ['discussionEntries','discussionLinks','todos']){
  const p=await childMutation(tid,kind,'create');for(const client of [db(other),env.unauthenticatedContext().firestore()]){
   await denied(client.doc(childDoc(tid,kind,p.id)).get());await denied(client.collection(`${path(tid)}/${kind}`).get());
  }
 }
 const fresh=await create();await childMutation(fresh,'discussionLinks','create',{expected:'fail',mutateTask:t=>t.linkCount=0});
 await denied(metadata(fresh,{linkCount:10}));
 await denied(db().doc(childDoc('missing-parent','todos','x')).set({ownerUid:uid,taskId:'missing-parent',title:'Orphan'}));
 await denied(db().doc(childDoc('missing-parent','todos','x')).get());
});

test('Gate2 Todo order edits do not start work; child timestamps and Task closure cannot be smuggled',async()=>{
 const tid=await create();const p=await childMutation(tid,'todos','create');
 await childMutation(tid,'todos','edit',{id:p.id,patch:{order:25}});assert.equal((await snapshot(tid)).actualStart,null);
 for(const patch of [{createdAt:stamp()},{updatedAt:stamp()},{closed:true,closedAt:stamp()}])await childMutation(tid,'todos','edit',{id:p.id,patch,expected:'fail'});
 await childMutation(tid,'todos','edit',{id:p.id,patch:{title:'X'},mutateTask:t=>{t.lifecycle='Closed';t.actualEnd=sentinel();t.closureOutcome='Done'},expected:'fail'});
});

test('Gate2 owner preferences persist with version checks; cross-user and timezone override writes denied',async()=>{
 const ref=db().doc(`users/${uid}/settings/preferences`);await ref.set({ownerUid:uid,viewDiscardWarning:true,version:0});
 await ref.update({viewDiscardWarning:false,version:1});assert.equal((await ref.get()).data().viewDiscardWarning,false);
 await denied(ref.update({viewDiscardWarning:true,version:1}));await denied(ref.update({timeZone:'Europe/London',version:2}));
 await denied(db(other).doc(`users/${uid}/settings/preferences`).get());await denied(db(other).doc(`users/${uid}/settings/preferences`).update({version:2}));
 await denied(env.unauthenticatedContext().firestore().doc(`users/${uid}/settings/preferences`).get());
});

test('Gate2 classification assignment observes after-state archival and rolls back both writes',async()=>{
 const cat=`after-state-${++counter}`;await (await namedBatch('categories',cat,'After State Category')).commit();
 const tid=await create(),a=await snapshot(tid),client=db(),ref=client.doc(classPath('categories',cat)),c=(await ref.get()).data();
 const batch=client.batch();batch.set(client.doc(path(tid)),{...a,categoryId:cat,version:a.version+1,updatedAt:sentinel()});
 batch.set(ref,{...c,archived:true,version:c.version+1,updatedAt:sentinel()});await denied(batch.commit());
 assert.deepEqual(await snapshot(tid),a);assert.equal((await ref.get()).data().archived,false);
});

test('inventory-enabled four-write child budget sweep: accepted batches complete; denied batches leave no effects',async()=>{
 const outcomes=[];
 for(let n=1;n<=8;n++) {
  const client=db(),batch=client.batch(),ids=[];
  for(let i=0;i<n;i++) {
   const tid=await create(),a=await snapshot(tid),id='budget-child';ids.push(tid);
   const d={ownerUid:uid,taskId:tid,title:'Todo',closed:false,closedAt:null,order:i,createdAt:sentinel(),updatedAt:sentinel(),taskVersion:1};
   const b={...a,version:1,lastEventId:'v1',updatedAt:sentinel(),lastEffect:{kind:'todos',id,action:'create',version:1}};
   const e={ownerUid:uid,actorUid:uid,taskId:tid,fromVersion:0,toVersion:1,type:'Entity',comment:'',before:a,after:b,createdAt:sentinel(),effectBefore:null,effectAfter:d};
   batch.set(client.doc(path(tid)),b);batch.set(client.doc(eventPath(tid,'v1')),e);batch.set(client.doc(childDoc(tid,'todos',id)),d);
   await addCounters(batch,client,tid,{activityEvents:{id:'v1',delta:1},todos:{id,delta:1}});
  }
  let accepted=true;try{await batch.commit()}catch(e){assert.equal(e.code,'permission-denied');accepted=false}
  for(const tid of ids){assert.equal((await snapshot(tid)).version,accepted?1:0);assert.equal((await client.doc(eventPath(tid,'v1')).get()).exists,accepted);assert.equal((await client.doc(childDoc(tid,'todos','budget-child')).get()).exists,accepted);const inventory=await client.doc(inventoryPath(uid,tid)).get();assert.equal(inventory.exists,accepted);if(accepted){assert.equal(inventory.data().counts.activityEvents,1);assert.equal(inventory.data().counts.todos,1)}}
  outcomes.push({aggregates:n,writes:n*4,accepted});
 }
 fs.writeFileSync('child-budget-evidence.json',JSON.stringify(outcomes,null,2));assert.equal(outcomes[0].accepted,true);assert.equal(outcomes.at(-1).accepted,false);
});


async function ensureViews(user) {
 const client=db(user),marker=client.doc(`users/${user}/provisioning/views`);
 if((await marker.get({source:'server'})).exists)return false;
 try{await (await provision(user,{client})).commit();return true}catch(e){
  if(e.code==='permission-denied'&&(await marker.get({source:'server'})).exists)return false;throw e;
 }
}
test('Gate2 provisioning adapter recovers from racing setup and never resets user modifications',async()=>{
 const user='ensure-race';const results=await Promise.all([ensureViews(user),ensureViews(user)]);assert.equal(results.filter(Boolean).length,1);
 const ref=db(user).doc(`users/${user}/savedViews/focus`);await ref.update({name:'User changed name',version:1,updatedAt:sentinel()});
 assert.equal(await ensureViews(user),false);assert.equal((await ref.get()).data().name,'User changed name');
 const existing=(await db().doc(classPath('savedViews','scheduled')).get()).data();
 assert.equal(await ensureViews(uid),false);assert.deepEqual((await db().doc(classPath('savedViews','scheduled')).get()).data(),existing);
});
