import {test,before,after} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {performance} from 'node:perf_hooks';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';import 'firebase/compat/firestore';
import {initializeApp,deleteApp} from 'firebase/app';import {getAuth,connectAuthEmulator,GoogleAuthProvider,signInWithCredential,signOut} from 'firebase/auth';
import {TaskStore} from '../read-model.mjs';import {defaults,query} from '../views.mjs';
import {evaluate,burnRate,priorityOrder,indiaDay} from '../query-engine.mjs';import {workload,backlog,quota,cleanupCost} from '../workload-model.mjs';import {commitOnline} from '../online-commit.mjs';
import {documentSize,automaticIndexSize} from '../storage-model.mjs';
import {putCounters} from '../counters.mjs';
import {encodeQuery,decodeQuery} from '../query-codec.mjs';
const projectId='demo-taskify-query-workload',now=Date.parse('2026-10-20T10:30Z'),at=firebase.firestore.Timestamp.fromMillis(now),ts=()=>firebase.firestore.FieldValue.serverTimestamp();let env;
const users=Array.from({length:12},(_,i)=>`load-${String(i).padStart(2,'0')}`),clients=new Set(),db=uid=>{const client=env.authenticatedContext(uid).firestore();clients.add(client);return client};
const deny=p=>assert.rejects(p,e=>e.code==='permission-denied');
const task=(uid,i)=>({ownerUid:uid,categoryId:i%2?'c1':'c2',locationId:i%3?'l1':null,lastEffect:null,linkCount:0,title:`Task ${i} validation fixture`,reference:`REF-${i}`,important:[null,false,true][i%3],urgent:[null,false,true][Math.floor(i/3)%3],lifecycle:i<30?i%2?'InProgress':'Draft':'Closed',pauseReason:i<30&&i%4===0?'Waiting':null,pausedUntil:i<30&&i%4===0?at:null,plannedStart:null,due:null,actualStart:i<30?null:at,actualEnd:i<30?null:at,closureOutcome:i<30?null:i%10?'Done':'Cancelled',deletedAt:null,version:0,lastEventId:'',createdAt:at,updatedAt:at});
const awaitReady=store=>new Promise((resolve,reject)=>{let stop=()=>{};const timer=setTimeout(()=>{stop();reject(new Error('READINESS_TIMEOUT'))},30000);const check=()=>{if(store.error){clearTimeout(timer);stop();reject(store.error)}else if(store.ready){clearTimeout(timer);stop();resolve()}};stop=store.subscribe(check);check()});
const waitUntil=(store,predicate)=>new Promise((resolve,reject)=>{let stop=()=>{};const timer=setTimeout(()=>{stop();reject(new Error('WAIT_TIMEOUT'))},30000);const check=()=>{if(predicate()){clearTimeout(timer);stop();resolve()}};stop=store.subscribe(check);check()});
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();fs.mkdirSync('artifacts',{recursive:true});
 await env.withSecurityRulesDisabled(async ctx=>{const client=ctx.firestore();let batch=client.batch(),writes=0;const put=async(path,data)=>{batch.set(client.doc(path),data);writes++;if(writes===200){await batch.commit();batch=client.batch();writes=0}};
  // Explicit privileged scale/read fixture; not browser-creation evidence.
  for(const uid of users){await put(`users/${uid}`,{ownerUid:uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});
   for(const id of ['uncategorized','c1','c2','c3'])await put(`users/${uid}/categories/${id}`,{ownerUid:uid,name:id==='c1'?'Work':id==='c2'?'Home':id,archived:false});
   for(const id of ['l1','l2','l3'])await put(`users/${uid}/locations/${id}`,{ownerUid:uid,name:id==='l1'?'India':'Location '+id,archived:false});
   for(const v of defaults(uid,()=>at))await put(`users/${uid}/savedViews/${v.id}`,v.data);
   for(let i=0;i<500;i++)await put(`users/${uid}/tasks/t${String(i).padStart(4,'0')}`,task(uid,i));
   for(let i=0;i<60;i++){await put(`users/${uid}/tasks/t0000/discussionEntries/c${String(i).padStart(3,'0')}`,{ownerUid:uid,taskId:'t0000',text:'x'.repeat(1000),createdAt:at,updatedAt:at,taskVersion:0});await put(`users/${uid}/tasks/t0000/activityEvents/e${String(i).padStart(3,'0')}`,{ownerUid:uid,type:'SyntheticFixture',before:task(uid,0),after:task(uid,0),createdAt:at})}
  }if(writes)await batch.commit();
 });
});
after(async()=>{console.log('Workload cleanup started');await Promise.all([...clients].map(client=>client.terminate()));if(env)await env.cleanup();await globalThis[Symbol.for('undici.globalDispatcher.1')]?.destroy();console.log('Workload cleanup complete')});

test('12-user 6000-Task fixture: six complete cold loads per user with lazy child payloads',async()=>{
 const timings=[],reads=[],paths=[];for(let round=0;round<6;round++)await Promise.all(users.map(async uid=>{
  const client=db(uid),store=new TaskStore(),seen=[],wrapped={collection:path=>{seen.push(path);return client.collection(path)}};const start=performance.now();store.connect(wrapped,uid);try{await awaitReady(store);assert.equal(store.tasks.size,500);assert.equal(store.categories.size,4);assert.equal(store.locations.size,3);assert.equal(store.result(query()).length,30);assert.equal(store.result({...query(),includeClosed:true}).length,500);assert.equal(store.result(query(),'REF-29')[0].id,'t0029');
   const delivered=store.tasks.size+store.categories.size+store.locations.size;reads.push(delivered);timings.push(performance.now()-start);paths.push(...seen);const snapshot=JSON.stringify([...store.tasks.values()]);if(round===0&&uid===users[0])fs.writeFileSync('artifacts/task-metadata-sample.json',JSON.stringify({count:store.tasks.size,jsonBytes:Buffer.byteLength(snapshot),sample:[...store.tasks.values()][0]},null,2));
  }finally{store.clear()}
 }));
 assert.equal(reads.length,72);assert.equal(reads.reduce((a,b)=>a+b,0),36504);assert.equal(paths.length,216);assert.ok(paths.every(p=>!p.includes('discussion')&&!p.includes('activity')));
 const sorted=[...timings].sort((a,b)=>a-b);fs.writeFileSync('artifacts/load-evidence.json',JSON.stringify({fixture:'privileged synthetic',users:12,tasksPerUser:500,loadsPerUser:6,coldLoads:72,serverBackedMetadataDocumentsDelivered:36504,collectionSubscriptions:216,childReads:0,latencyMs:{min:sorted[0],median:sorted[36],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)},billingMeasurement:false},null,2));
});
test('all seven Views, Search, sort and Dashboard share one store without refetching metadata',async()=>{
 const uid=users[0],client=db(uid),store=new TaskStore(),calls=[];store.connect({collection:path=>{calls.push(path);return client.collection(path)}},uid);try{await awaitReady(store);const views=defaults(uid,()=>at);let queries=0;const start=performance.now();
  for(let repeat=0;repeat<100;repeat++)for(const view of views){const q={...view.data.query,dateBuckets:[7,30,90]},r=store.view(q,'',{now});assert.equal(r.groups.reduce((n,g)=>n+g.tasks.length,0),r.count);assert.equal(store.view(q,'no match',{now}).count,0);queries+=2}
  assert.equal(calls.length,3);const burn=burnRate([...store.tasks.values()],{now});assert.equal(burn.reduce((n,b)=>n+b.newCount,0),500);assert.equal(burn.reduce((n,b)=>n+b.closedCount,0),470);fs.writeFileSync('artifacts/selector-evidence.json',JSON.stringify({evaluations:queries,taskPopulation:500,elapsedMs:performance.now()-start,additionalFirestoreQueries:0},null,2));
 }finally{store.clear()}
});
test('Important/Urgent preferences persist through Rules, retain no-event metadata contract and reject invalid values',async()=>{
 const uid=users[0],client=db(uid),ref=client.doc(`users/${uid}/tasks/t0000`),history=client.collection(`users/${uid}/tasks/t0000/activityEvents`);const count=(await history.get()).size;
 await ref.update({important:true,urgent:false,version:1,updatedAt:ts()});assert.equal((await ref.get()).data().important,true);assert.equal((await history.get()).size,count);
 for(const value of ['yes',1,{},[]])await deny(ref.update({important:value,version:2,updatedAt:ts()}));await deny(ref.update({important:false,actualStart:ts(),version:2,updatedAt:ts()}));
 await deny(client.doc(`users/${uid}/tasks/t0100`).update({important:true,version:1,updatedAt:ts()}));
 const fresh={...task(uid,0),pauseReason:null,pausedUntil:null,createdAt:ts(),updatedAt:ts()};
 for(const value of ['yes',1,{},[]])await deny(client.doc(`users/${uid}/tasks/invalid-pref`).set({...fresh,important:value}));
 const created=client.doc(`users/${uid}/tasks/pref-create`);await created.set({...fresh,important:true,urgent:false});const a=(await created.get()).data();
 for(const mutation of [b=>b.important=false,b=>delete b.important,b=>b.urgent='yes']){
  const b={...a,lifecycle:'InProgress',actualStart:ts(),version:1,lastEventId:'v1',updatedAt:ts()};mutation(b);const e={ownerUid:uid,actorUid:uid,taskId:'pref-create',fromVersion:0,toVersion:1,type:'Start',comment:'',before:a,after:b,createdAt:ts(),effectBefore:null,effectAfter:null};const batch=client.batch();batch.set(created,b);batch.set(client.doc(`users/${uid}/tasks/pref-create/activityEvents/v1`),e);putCounters(batch,client,uid,'pref-create',null,{activityEvents:{id:'v1',delta:1}});await deny(batch.commit());assert.equal((await created.get()).data().version,0);
 }
});
test('full Saved View filters/date buckets persist while malformed and search/membership payloads are denied',async()=>{
 const uid=users[0],client=db(uid),ref=client.doc(`users/${uid}/savedViews/focus`),range={presence:'set',from:indiaDay(now)-92,until:indiaDay(now)+92};
 const minimal=query();for(const bad of [{...minimal,filters:{Category:{c1:false}}},{...minimal,filters:{Pause:['Unknown']}},{...minimal,filters:{Due:{presence:'any',from:5,until:2}}},{...minimal,dateBuckets:[7,7,30]},{...minimal,search:'no'},{...minimal,taskIds:['t0000']}])await deny(ref.update({query:encodeQuery(bad),version:1,updatedAt:ts()}));
 const q={...query('Lifecycle','Category'),includeClosed:true,includeDeleted:true,dateBuckets:[7,30,90],filters:{Category:{c1:true},Location:{ids:{l1:true},includeUnspecified:true},Priority:priorityOrder,Pause:['None','Timed','Expired','Indefinite'],Due:range,PlannedStart:range,ActualStart:range,ActualEnd:range,DeletedAt:range,CreatedAt:range,UpdatedAt:range,PausedUntil:range}};
 await ref.update({query:encodeQuery(q),version:1,updatedAt:ts()});assert.deepEqual(decodeQuery((await ref.get()).data().query),q);
 await ref.update({name:'Full-filter View renamed',version:2,updatedAt:ts()});
 const revised={...q,sortDirection:'desc'};await ref.update({query:encodeQuery(revised),version:3,updatedAt:ts()});assert.deepEqual(decodeQuery((await ref.get()).data().query),revised);
 for(const bad of [{...q,filters:{Category:{c1:false}}},{...q,filters:{Pause:['Unknown']}},{...q,filters:{Due:{presence:'any',from:5,until:2}}},{...q,dateBuckets:[7,7,30]},{...q,search:'no'},{...q,taskIds:['t0000']}])await deny(ref.update({query:encodeQuery(bad),version:4,updatedAt:ts()}));
});
test('client selectors react to acknowledged preference edits and current classification labels',async()=>{
 const uid=users[1],client=db(uid),store=new TaskStore();store.connect(client,uid);try{await awaitReady(store);const ref=client.doc(`users/${uid}/tasks/t0000`);await ref.update({important:true,urgent:true,version:1,updatedAt:ts()});await waitUntil(store,()=>store.ready&&store.tasks.get('t0000').version===1);const r=store.view(query('Priority'),'',{now});assert.ok(r.groups.find(g=>g.id==='DoFirst').tasks.some(t=>t.id==='t0000'));
  await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(`users/${uid}/categories/c2`).update({name:'Renamed fixture category'}));await waitUntil(store,()=>store.ready&&store.categories.get('c2').name==='Renamed fixture category');assert.equal(store.result(query(),'renamed fixture').length,15);
 }finally{store.clear()}
});
test('bounded detail/history pages are fetched only on request and foreign users cannot enumerate them',async()=>{
 const uid=users[2],client=db(uid);for(const kind of ['discussionEntries','activityEvents']){const page=await client.collection(`users/${uid}/tasks/t0000/${kind}`).orderBy(firebase.firestore.FieldPath.documentId()).limit(25).get({source:'server'});assert.equal(page.size,25);await deny(db(users[3]).collection(`users/${uid}/tasks/t0000/${kind}`).limit(25).get())}
});
test('disconnect removes authoritative readiness and reconnect restores all eligible metadata',async()=>{
 const uid=users[3],client=db(uid),store=new TaskStore();store.connect(client,uid);try{await awaitReady(store);await client.disableNetwork();await waitUntil(store,()=>!store.ready);assert.throws(()=>store.result(query()),/NOT_READY/);await assert.rejects(commitOnline({projectId,writes:[],getToken:async()=>'',online:false}),e=>e.code==='OFFLINE_WRITE_DISABLED');await client.enableNetwork();await awaitReady(store);assert.equal(store.tasks.size,500)}finally{store.clear();await client.enableNetwork()}
});
test('browser-direct REST commit uses Auth/Rules with no SDK queue; unknown acknowledgement is reconciled from cloud',async()=>{
 const app=initializeApp({projectId,apiKey:'fake-local-key'},'query-rest'),auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});try{
  const user=(await signInWithCredential(auth,GoogleAuthProvider.credential(JSON.stringify({sub:'query-rest',email:'rest@example.test'})))).user,uid=user.uid;
  await env.withSecurityRulesDisabled(async ctx=>{const c=ctx.firestore();await c.doc(`users/${uid}`).set({ownerUid:uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});await c.doc(`users/${uid}/tasks/rest`).set({...task(uid,0),categoryId:'uncategorized'})});
  const write=(version,title)=>({update:{name:`projects/${projectId}/databases/(default)/documents/users/${uid}/tasks/rest`,fields:{title:{stringValue:title},version:{integerValue:String(version)}}},updateMask:{fieldPaths:['title','version']},updateTransforms:[{fieldPath:'updatedAt',setToServerValue:'REQUEST_TIME'}]});
  const nodeFetch=(url,options)=>fetch(url,{...options,headers:{...options.headers,Connection:'close'}});
  const options={projectId,getToken:()=>user.getIdToken(),baseUrl:'http://127.0.0.1:8080/v1',fetcher:nodeFetch};await commitOnline({...options,writes:[write(1,'REST acknowledged')]});const ref=db(uid).doc(`users/${uid}/tasks/rest`);assert.equal((await ref.get()).data().version,1);
  await assert.rejects(commitOnline({...options,writes:[write(2,'Offline must not queue')],online:false}),e=>e.code==='OFFLINE_WRITE_DISABLED');assert.equal((await ref.get()).data().version,1);
  await assert.rejects(commitOnline({...options,writes:[write(2,'Cloud committed, acknowledgement lost')],fetcher:async(...args)=>{const response=await nodeFetch(...args);await response.arrayBuffer();throw new TypeError('Lost acknowledgement')}}),e=>e.code==='WRITE_OUTCOME_UNKNOWN');assert.equal((await ref.get()).data().version,2);
  await assert.rejects(commitOnline({...options,writes:[write(2,'Stale replay')]}),e=>e.code==='PERMISSION_DENIED');assert.equal((await ref.get()).data().title,'Cloud committed, acknowledgement lost');
 }finally{await signOut(auth);await deleteApp(app)}
});
test('workload sensitivities record confirmed activity plus explicit unapproved sizing/usage inputs',()=>{
 const scenarios={expectedLow:workload({users:10,newPerDay:3,active:20,discussionPerWeek:2,opens:4,retained:310}),expectedHigh:workload(),extraReconnects:workload({extraReconnects:3}),twoSimultaneousDevices:workload({opens:12}),oneYearUnfinishedCarryover:workload({retained:backlog().retained}),largeComments:workload({commentBytes:12000}),tenDetailPages:workload({detailPagesPerUser:10})};
 assert.ok(!scenarios.expectedLow.readQuotaExceeded&&!scenarios.expectedHigh.readQuotaExceeded);assert.ok(scenarios.extraReconnects.readQuotaExceeded);assert.ok(scenarios.twoSimultaneousDevices.readQuotaExceeded);assert.ok(scenarios.oneYearUnfinishedCarryover.readQuotaExceeded);
 const uid=users[0],root=`users/${uid}/tasks/t0000`,t=task(uid,0),event={ownerUid:uid,actorUid:uid,taskId:'t0000',type:'Entity',fromVersion:0,toVersion:1,comment:'',before:t,after:{...t,version:1},createdAt:at,effectBefore:null,effectAfter:null};
 const footprint=(path,data,exempt=[])=>({documentBytes:documentSize(path,data),automaticIndexes:automaticIndexSize(path,data),withExemptions:automaticIndexSize(path,data,{exempt})});
 const storageCases=[100,1000,12000].map(bytes=>{const comment={ownerUid:uid,taskId:'t0000',text:'x'.repeat(bytes),createdAt:at,updatedAt:at,taskVersion:1};const taskSize=footprint(root,t),commentSize=footprint(root+'/discussionEntries/c1',comment,['text']),eventSize=footprint(root+'/activityEvents/v1',event,['before','after','effectBefore','effectAfter']);
  const counts={tasks:6000,comments:Math.ceil(scenarios.expectedHigh.commentsPerDay*92),events:Math.ceil(scenarios.expectedHigh.eventsPerDay*92)},sum=key=>counts.tasks*(taskSize.documentBytes+taskSize[key].bytes)+counts.comments*(commentSize.documentBytes+commentSize[key].bytes)+counts.events*(eventSize.documentBytes+eventSize[key].bytes);
  return {commentTextBytes:bytes,counts,taskSize,commentSize,eventSize,estimatedDefaultIndexedBytes:sum('automaticIndexes'),estimatedExemptedBytes:sum('withExemptions')};
 });fs.writeFileSync('artifacts/storage-estimates.json',JSON.stringify({billingMeasurement:false,scope:'representative prototype fields; excludes unspecified Todo/link counts, retained trash and backups',cases:storageCases},null,2));
 fs.writeFileSync('artifacts/workload-model.json',JSON.stringify({quota,confirmed:{users:[10,12],newTasksPerUserPerDay:[3,5],activePerUser:[20,30],discussionPerActiveTaskPerWeek:[2,3],opensPerUserPerDay:[4,6],devicesOrTabs:1,closedRetention:'three calendar months after closure',cleanup:'manual'},scenarioOnlyInputs:['500 retained Task fixture','7 classification documents','12 ancillary documents per fresh load','3 or 10 detail pages per user/day','25 records/page','10 metadata updates per user/day','one Start/new Task and 80% Close/new Task','1KB Task/comment and 2.4KB event','92-day sizing window','write Rules dependent-doc estimates 5/create,5/auditedTask,6/comment,2/metadata; maximum budgets 10/20/20/10','index size multipliers 2/4; detailed single-field estimates also retained','manual cleanup examples assume 8 children/Task and do not set a schedule'],cleanupExamples:[60,250,1000].map(tasks=>cleanupCost({tasks})),scenarios},null,2));
});
