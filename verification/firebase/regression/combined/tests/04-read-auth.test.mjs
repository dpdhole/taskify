import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import {initializeApp,deleteApp} from 'firebase/app';
import {getAuth,connectAuthEmulator,signInWithCredential,GoogleAuthProvider,signOut,inMemoryPersistence,setPersistence} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator,doc,setDoc,getDoc,terminate} from 'firebase/firestore';
import {TaskStore,select,categoryGroups,searchSubmit,workspaceNavigate} from '../read-model.mjs';
const projectId='demo-taskify-regression',uid='owner',other='foreign';let env;
const client=(user=uid)=>env.authenticatedContext(user).firestore();
const deny=p=>assert.rejects(p,e=>e.code==='permission-denied');
const query=(patch={})=>({groupBy:'Category',includeClosed:false,includeDeleted:false,closureReasons:[],deletedFilter:null,...patch});
const task=(n,patch={})=>({ownerUid:uid,title:`Task ${n}`,reference:'',categoryId:'c1',locationId:null,lifecycle:'Draft',deletedAt:null,closureOutcome:null,version:0,...patch});
async function adminSet(path,data){await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(path).set(data))}
function until(check,{store,timeout=15000}={}){return new Promise((resolve,reject)=>{
 let stop=()=>{};const timer=setTimeout(()=>{stop();reject(new Error('WAIT_TIMEOUT'))},timeout);
 const inspect=()=>{try{if(check()){clearTimeout(timer);stop();resolve()}}catch(e){clearTimeout(timer);stop();reject(e)}};
 if(store)stop=store.subscribe(inspect);else {const poll=setInterval(()=>{inspect()},20);stop=()=>clearInterval(poll)}inspect();
 })}
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});await env.clearFirestore();
 await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();let batch=db.batch(),size=0;
  // Privileged read-model fixture, not evidence of client creation integrity.
  for(let n=0;n<1203;n++){batch.set(db.doc(`users/${uid}/tasks/t${String(n).padStart(4,'0')}`),task(n,{title:n===1202?'Needle beyond rendered page':`Task ${n}`}));size++;if(size===200){await batch.commit();batch=db.batch();size=0}}
  if(size)await batch.commit();
  for(const [path,value]of Object.entries({[`users/${uid}/categories/c1`]:{ownerUid:uid,name:'India Work'},[`users/${uid}/categories/c2`]:{ownerUid:uid,name:'Empty Category'},[`users/${uid}/locations/l1`]:{ownerUid:uid,name:'London'},[`users/${other}/tasks/private`]:task(1,{ownerUid:other}),[`users/${uid}/tasks/t0000/discussionEntries/comment`]:{ownerUid:uid,text:'Secret deep-only needle'},[`users/${uid}/tasks/t0000/activityEvents/v1`]:{ownerUid:uid,type:'Fixture'},[`users/${uid}/savedViews/v`]:{ownerUid:uid,query:query()}}))await db.doc(path).set(value);
 });
});
after(async()=>{if(env)await env.cleanup()});

test('owner Task list includes the complete 1203-document population without pagination limits',async()=>{
 const result=await client().collection(`users/${uid}/tasks`).get({source:'server'});assert.equal(result.size,1203);assert.equal(result.docs.at(-1).id,'t1202');
});
test('anonymous, foreign UID and cross-user collection-group reads are denied',async()=>{
 await deny(env.unauthenticatedContext().firestore().collection(`users/${uid}/tasks`).get());await deny(client(other).collection(`users/${uid}/tasks`).get());await deny(client().collection(`users/${other}/tasks`).get());await deny(client().collectionGroup('tasks').get());
});
test('missing root ownership and forged ownerUid writes are rejected',async()=>{
 const db=client();await deny(db.doc(`users/${uid}`).set({timeZone:'Asia/Kolkata',utcOffsetMinutes:330}));await deny(db.doc(`users/${uid}`).set({ownerUid:other,timeZone:'Asia/Kolkata',utcOffsetMinutes:330}));
 await deny(db.doc(`users/${uid}/tasks/spoof`).set(task(1,{ownerUid:other})));await deny(db.doc(`users/${other}/tasks/spoof`).set(task(1)));
});
test('read ownership follows trusted UID path even if an administrator corrupts the stored ownerUid',async()=>{
 const path=`users/${uid}/tasks/admin-corrupt`;await adminSet(path,task(1,{ownerUid:other}));assert.equal((await client().doc(path).get()).exists,true);await deny(client(other).doc(path).get());
 await env.withSecurityRulesDisabled(ctx=>ctx.firestore().doc(path).delete());
});
test('whole-population Search finds the final record while list loads no Discussion or Activity',async()=>{
 const store=new TaskStore();store.connect(client(),uid);try{await until(()=>store.ready,{store});const result=store.result(query(),'needle beyond');assert.deepEqual(result.map(t=>t.id),['t1202']);assert.equal(store.tasks.size,1203);assert.deepEqual(store.readPaths,[`users/${uid}/tasks`,`users/${uid}/categories`,`users/${uid}/locations`]);assert.equal(store.result(query(),'Secret deep-only').length,0)}finally{store.clear()}
});
test('single-phrase Search trims, ignores case, ORs fields and ANDs structured eligibility',()=>{
 const cats=new Map([['c1',{name:'India Work'}]]),locs=new Map([['l1',{name:'London office'}]]),items=[task(1,{id:'title',title:'A RED APPLE'}),task(2,{id:'ref',reference:'Ref ABC-12'}),task(3,{id:'loc',locationId:'l1'}),task(4,{id:'closed',title:'red apple',lifecycle:'Closed'})];
 assert.deepEqual(select(items,query(),' red apple ',cats,locs).map(t=>t.id),['title']);assert.equal(select(items,query(),'apple red',cats,locs).length,0);assert.equal(select(items,query(),'india work',cats,locs).length,3);assert.deepEqual(select(items,query(),'abc-12',cats,locs).map(t=>t.id),['ref']);assert.deepEqual(select(items,query(),'london',cats,locs).map(t=>t.id),['loc']);assert.equal(select(items,query(),'a',cats,locs).length,3);
});
test('Include Closed and Include Deleted are independent; closure reason selections reactivate explicitly',()=>{
 const rows=[task(1,{id:'open'}),task(2,{id:'closed',lifecycle:'Closed',closureOutcome:'Done'}),task(3,{id:'deleted',deletedAt:1}),task(4,{id:'both',deletedAt:1,lifecycle:'Closed',closureOutcome:'Cancelled'})];
 for(const [c,d,ids]of [[false,false,['open']],[true,false,['open','closed']],[false,true,['open','deleted']],[true,true,['open','closed','deleted','both']]])assert.deepEqual(select(rows,query({includeClosed:c,includeDeleted:d})).map(t=>t.id),ids);
 assert.deepEqual(select(rows,query({closureReasons:['Done']})).map(t=>t.id),['open']);assert.deepEqual(select(rows,query({includeClosed:true,closureReasons:['Done']})).map(t=>t.id),['closed']);assert.deepEqual(select(rows,query({includeClosed:true,includeDeleted:true,deletedFilter:'set'})).map(t=>t.id),['deleted','both']);
});
test('OR within dimensions, AND across dimensions; grouped dimension cannot filter itself',()=>{
 const rows=[task(1,{id:'a',categoryId:'c1',locationId:'l1'}),task(2,{id:'b',categoryId:'c2',locationId:'l1'}),task(3,{id:'c',categoryId:'c3',locationId:'l2'})];
 assert.deepEqual(select(rows,query({groupBy:'Due',filters:{Category:['c1','c2'],Location:['l1']}})).map(t=>t.id),['a','b']);assert.equal(select(rows,query({filters:{Category:['missing']}})).length,3);
});
test('category partition preserves ordered zero groups and counts every matching Task once',()=>{
 const cats=new Map([['c1',{name:'One'}],['c2',{name:'Empty'}]]);const groups=categoryGroups([task(1,{id:'a'}),task(2,{id:'b',categoryId:'unknown'})],cats,['c2','c1']);assert.deepEqual(groups.map(g=>g.id),['c2','c1','Unspecified']);assert.equal(groups[0].ids.length,0);assert.equal(groups.reduce((n,g)=>n+g.ids.length,0),2);
});
test('authoritative remote changes reconcile membership, classification labels and counts through shared state',async()=>{
 const store=new TaskStore();store.connect(client(),uid);try{await until(()=>store.ready,{store});assert.equal(store.result(query(),'late-change').length,0);
  await adminSet(`users/${uid}/tasks/t1202`,task(1202,{title:'late-change'}));await until(()=>store.ready&&store.result(query(),'late-change').length===1,{store});
  await adminSet(`users/${uid}/tasks/t1202`,task(1202,{title:'late-change',lifecycle:'Closed'}));await until(()=>store.ready&&store.result(query(),'late-change').length===0,{store});
  await adminSet(`users/${uid}/categories/c1`,{ownerUid:uid,name:'Renamed current label'});await until(()=>store.ready&&store.result(query(),'renamed current').length===1202,{store});
 }finally{store.clear()}
});
test('logout clears data immediately and changing UID cannot publish prior-user listener data',async()=>{
 const store=new TaskStore();store.connect(client(),uid);await until(()=>store.ready,{store});store.clear();assert.equal(store.tasks.size,0);assert.equal(store.categories.size,0);assert.throws(()=>store.result(query()),/NOT_READY/);
 store.connect(client(other),other);try{await until(()=>store.ready,{store});assert.deepEqual([...store.tasks.keys()],['private']);assert.equal(store.categories.size,0)}finally{store.clear()}
});
test('listener permission failures never advertise complete results',async()=>{
 const store=new TaskStore();store.connect(client(other),uid);try{await until(()=>store.error,{store});assert.equal(store.ready,false);assert.throws(()=>store.result(query()),/NOT_READY/)}finally{store.clear()}
});
test('Search submit and navigation preserve detail-back context but clear on other navigation',()=>{
 assert.equal(searchSubmit(null,'  '),null);assert.deepEqual(searchSubmit(null,' x '),{view:'allTasks',phrase:'x'});assert.deepEqual(searchSubmit('focus',''),{view:'focus',phrase:''});const s={view:'focus',phrase:'x'};assert.deepEqual(workspaceNavigate(s,'detail'),s);assert.deepEqual(workspaceNavigate(s,'back'),s);assert.equal(workspaceNavigate(s,'home').phrase,'');
});
test('server profile and Saved View ownership remain enforced for current paths',async()=>{
 const db=client();await db.doc(`users/${uid}`).set({ownerUid:uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});await deny(client(other).doc(`users/${uid}`).get());await deny(client(other).collection(`users/${uid}/savedViews`).get());await deny(env.unauthenticatedContext().firestore().doc(`users/${uid}/savedViews/v`).get());assert.equal((await db.doc(`users/${uid}/savedViews/v`).get()).exists,true);
});
test('mock Google Auth signs in repeatedly, authorizes own Firestore path and denies access after sign-out',async()=>{
 const app=initializeApp({projectId,apiKey:'fake-local-key',authDomain:`${projectId}.firebaseapp.com`},'gate4-auth');const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
 const db=getFirestore(app);connectFirestoreEmulator(db,'127.0.0.1',8080);
 try{await setPersistence(auth,inMemoryPersistence);const credential=GoogleAuthProvider.credential(JSON.stringify({sub:'mock-google-user',email:'mock@example.test',email_verified:true}));const user=(await signInWithCredential(auth,credential)).user;assert.equal(user.providerData[0].providerId,'google.com');const remembered=user.uid;const token=await user.getIdToken();assert.ok(token);
  await setDoc(doc(db,`users/${user.uid}`),{ownerUid:user.uid,timeZone:'Asia/Kolkata',utcOffsetMinutes:330});assert.equal((await getDoc(doc(db,`users/${user.uid}`))).exists(),true);await deny(getDoc(doc(db,`users/${uid}`)));
  await signOut(auth);assert.equal(auth.currentUser,null);await deny(getDoc(doc(db,`users/${remembered}`)));assert.equal((await signInWithCredential(auth,credential)).user.uid,remembered);assert.equal((await getDoc(doc(db,`users/${remembered}`))).exists(),true);await signOut(auth)
 }finally{await terminate(db);await deleteApp(app)}
});

test('acknowledged browser metadata update reconciles Search and grouping without manual refresh; stale update rejected',async()=>{
 const db=client(),stamp=()=>firebase.firestore.FieldValue.serverTimestamp();
 await adminSet(`users/${uid}/categories/uncategorized`,{ownerUid:uid,name:'Uncategorized',archived:false});
 const id='valid-write',path=`users/${uid}/tasks/${id}`;
 await db.doc(path).set({ownerUid:uid,categoryId:'uncategorized',locationId:null,lastEffect:null,linkCount:0,title:'Before browser edit',reference:'',lifecycle:'Draft',pauseReason:null,pausedUntil:null,plannedStart:null,due:null,actualStart:null,actualEnd:null,closureOutcome:null,deletedAt:null,version:0,lastEventId:'',createdAt:stamp(),updatedAt:stamp()});
 const store=new TaskStore();store.connect(db,uid);try{await until(()=>store.ready,{store});assert.equal(store.result(query(),'after browser edit').length,0);
  await db.doc(path).update({title:'After browser edit',version:1,updatedAt:stamp()});await until(()=>store.ready&&store.result(query(),'after browser edit').some(t=>t.id===id),{store});assert.equal(store.tasks.get(id).version,1);
  await deny(db.doc(path).update({title:'Stale',version:1,updatedAt:stamp()}));assert.equal((await db.doc(path).get()).data().title,'After browser edit');
 }finally{store.clear()}
});

test('cache-only and pending snapshots cannot become an authoritative complete population',()=>{
 const callbacks=new Map(),store=new TaskStore(),db={collection:path=>({onSnapshot:(_options,cb)=>{callbacks.set(path,cb);return()=>{}}})};store.connect(db,uid);
 const snap=(fromCache=false,hasPendingWrites=false)=>({metadata:{fromCache,hasPendingWrites},docs:[]});const emit=(kind,s)=>callbacks.get(`users/${uid}/${kind}`)(s);
 for(const kind of ['tasks','categories','locations'])emit(kind,snap());assert.equal(store.ready,true);
 emit('tasks',snap(true));assert.equal(store.ready,false);emit('categories',snap());assert.equal(store.ready,false);emit('tasks',snap(false,true));assert.equal(store.ready,false);emit('tasks',snap());assert.equal(store.ready,true);
 const late=callbacks.get(`users/${uid}/tasks`);store.clear();late({metadata:{fromCache:false,hasPendingWrites:false},docs:[{id:'leak',data:()=>({title:'Old user'})}]});assert.equal(store.tasks.size,0);assert.equal(store.ready,false);
});

test('static Hosting emulator serves entrypoint and SPA fallback without a function or API',async()=>{
 for(const path of ['/','/tasks/example']){const response=await fetch(`http://127.0.0.1:5000${path}`);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/html/);assert.match(await response.text(),/Taskify Gate 4 local probe/)}
 const config=JSON.parse(fs.readFileSync('firebase.json','utf8'));assert.equal(config.functions,undefined);assert.equal(config.hosting.public,'public');assert.ok(config.hosting.rewrites.every(r=>r.destination&&!r.function&&!r.run));
});
