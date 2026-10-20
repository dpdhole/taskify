import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails as unusedAssertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

async function assertFails(promise) { await assert.rejects(promise,e=>e.code==='permission-denied'); }
let env;
const uid = 'owner';
const other = 'intruder';
const sentinel = () => firebase.firestore.FieldValue.serverTimestamp();
const stamp = () => firebase.firestore.Timestamp.fromDate(new Date('2030-01-01T00:00:00Z'));
const path = id => `users/${uid}/tasks/${id}`;
const eventPath = (id,eid) => `${path(id)}/activityEvents/${eid}`;
const db = (user = uid) => env.authenticatedContext(user).firestore();
const base = () => ({ ownerUid:uid, title:'Proof task', reference:'', lifecycle:'Draft', pauseReason:null,
  pausedUntil:null, plannedStart:null, due:null, actualStart:null, actualEnd:null,
  closureOutcome:null, deletedAt:null, version:0, lastEventId:'', createdAt:sentinel(), updatedAt:sentinel() });

before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-taskify-gate1',firestore:{rules:fs.readFileSync(new URL('../firestore.rules',import.meta.url),'utf8')}});
});
after(async () => { if (env) {
 const response=await fetch('http://'+process.env.FIRESTORE_EMULATOR_HOST+'/emulator/v1/projects/demo-taskify-gate1:ruleCoverage');
 assert.equal(response.ok,true); const coverage=await response.json();
 const summarize=node=>({position:node.sourcePosition,values:(node.values??[]).map(v=>({type:Object.keys(v.value??{})[0],boolean:v.value?.boolValue,count:v.count})),children:(node.children??[]).map(summarize)});
 fs.writeFileSync('rule-coverage-summary.json',JSON.stringify(coverage.report.map(summarize),null,2)); await env.cleanup();
} });

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
  return next;
};
async function paired(id, type, {expected='pass', actor=uid, eid, comment, mutateTask, mutateEvent, taskOnly=false, eventOnly=false, stale} = {}) {
  const client = db(actor);
  const ref = client.doc(path(id));
  const beforeTask = stale ?? (await db().doc(path(id)).get()).data();
  const operationId = eid ?? `v${beforeTask.version+1}`;
  const next = updateFor(beforeTask,type,operationId);
  if (mutateTask) mutateTask(next,beforeTask);
  const event = {ownerUid:uid,actorUid:uid,taskId:id,fromVersion:beforeTask.version,toVersion:next.version,
    type:type==='SchedulePause'?'Schedule':type==='StartResume'?'Start':type==='ResumeStart'?'Resume':type,
    comment:comment ?? (type==='Pause'?'Reason':type==='SchedulePause'?'Waiting to start':''),
    before:beforeTask, after:next, createdAt:sentinel()};
  if (mutateEvent) mutateEvent(event,next,beforeTask);
  const batch=client.batch();
  if (!eventOnly) batch.set(ref,next);
  if (!taskOnly) batch.set(client.doc(eventPath(id,operationId)),event);
  const op=batch.commit();
  if (expected==='pass') await assertSucceeds(op); else await assertFails(op);
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
  comment:type==='Pause'?'Reason':'',before:a,after:b,createdAt:sentinel()};
 return {eid,b,e};
}
function addPair(batch,client,id,p) {
 batch.set(client.doc(path(id)),p.b);batch.set(client.doc(eventPath(id,p.eid)),p.e);
}

test('owner reads and lists Tasks/events; anonymous and foreign reads and writes denied',async()=>{
 const id=await create();await paired(id,'Start');
 for(const client of [db(other),env.unauthenticatedContext().firestore()]) {
  await denied(client.doc(path(id)).get());await denied(client.collection(`users/${uid}/tasks`).get());
  await denied(client.doc(eventPath(id,'v1')).get());await denied(client.collection(`${path(id)}/activityEvents`).get());
  await denied(client.doc(path(id)).update({title:'foreign'}));await denied(client.doc(path(id)).delete());
  const p=pairData(id,await snapshot(id),'Pause');const batch=client.batch();addPair(batch,client,id,p);await denied(batch.commit());
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
 const p=pairData(id,a,'Pause');const batch=client.batch();addPair(batch,client,id,p);
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
  const a=(await tx.get(ref)).data();attempts++;
  if(attempts===1)await metadata(id,{title:'concurrent metadata'});
  const p=pairData(id,a,'Start');tx.set(ref,p.b);tx.set(client.doc(eventPath(id,p.eid)),p.e);
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
    const a=(await tx.get(ref)).data();observedVersion=a.version;callbacks++;
    if(inject)await inject(callbacks);
    const p=pairData(id,a,type);tx.set(ref,p.b);tx.set(client.doc(eventPath(id,p.eid)),p.e);
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
 addPair(batch,client,one,pairData(one,await snapshot(one),'Start'));
 const p=pairData(two,await snapshot(two),'Start');p.e.actorUid=other;addPair(batch,client,two,p);
 await denied(batch.commit());
 for(const id of [one,two]){assert.equal((await snapshot(id)).version,0);assert.equal((await client.collection(`${path(id)}/activityEvents`).get()).size,0)}
});

test('Rules access budget sweep records accepted boundary and denied-batch rollback',async()=>{
 const results=[];
 for(let n=1;n<=12;n++) {
  const client=db();const batch=client.batch();const ids=[];
  for(let i=0;i<n;i++){const id=await create();ids.push(id);addPair(batch,client,id,pairData(id,await snapshot(id),'Start'))}
  let accepted=true;try{await batch.commit()}catch(e){assert.equal(e.code,'permission-denied');accepted=false}
  results.push({pairs:n,accepted});
  for(const id of ids){assert.equal((await snapshot(id)).version,accepted?1:0);assert.equal((await client.collection(`${path(id)}/activityEvents`).get()).size,accepted?1:0)}
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

test('known domain gap: same-calendar-day Planned Start after Due is rejected by prototype',async()=>{
 const id=await create();
 await paired(id,'EditDates',{expected:'fail',mutateTask:t=>{
  t.plannedStart=firebase.firestore.Timestamp.fromDate(new Date('2030-01-01T18:00:00Z'));
  t.due=firebase.firestore.Timestamp.fromDate(new Date('2030-01-01T09:00:00Z'));
 }});
 // Specification 4.1 retains calendar-date comparison, not instant ordering. This is a documented gap, not acceptance.
});

