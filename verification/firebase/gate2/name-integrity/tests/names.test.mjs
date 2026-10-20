import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
let env;const uid='owner';let serial=0;
const client=(user=uid)=>env.authenticatedContext(user).firestore();
const denied=p=>assert.rejects(p,e=>e.code==='permission-denied');
const ep=(kind,id)=>`users/${uid}/${kind}/${id}`;
const gp=(kind,key)=>`users/${uid}/nameGuards/${kind}/keys/${key}`;
const schema=(name,key=name.toLowerCase())=>({ownerUid:uid,name,nameKey:key,archived:false,order:0,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-taskify-gate2',firestore:{rules:fs.readFileSync('firestore.rules','utf8')}})});
after(async()=>{if(env)await env.cleanup()});
function pair(kind,name,{key=name.toLowerCase(),actor=uid,id=`entity-${++serial}`,entityOnly=false,guardOnly=false,mutateEntity,mutateGuard}={}) {
 const db=client(actor);const batch=db.batch();const e=schema(name,key);const g={ownerUid:uid,kind,entityId:id,nameKey:key};
 if(mutateEntity)mutateEntity(e);if(mutateGuard)mutateGuard(g);
 if(!guardOnly)batch.set(db.doc(ep(kind,id)),e);
 if(!entityOnly)batch.set(db.doc(gp(kind,key)),g);
 return {id,key,commit:()=>batch.commit()};
}
const graphemes=s=>[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(s)].length;
for(const kind of ['categories','locations']) {
 test(`${kind}: owner creates entity and unique name guard atomically`,async()=>{const p=pair(kind,`Valid-${serial}`);await p.commit();assert.equal((await client().doc(ep(kind,p.id)).get()).exists,true)});
 test(`${kind}: missing entity or missing name guard rejects and rolls back`,async()=>{
  for(const opt of [{entityOnly:true},{guardOnly:true}]){const p=pair(kind,`Missing-${serial}`,opt);await denied(p.commit());assert.equal((await client().doc(ep(kind,p.id)).get()).exists,false);assert.equal((await client().doc(gp(kind,p.key)).get()).exists,false)}
 });
 test(`${kind}: identical and case-only duplicate names rejected`,async()=>{
  const name=`Case-${serial}`;await pair(kind,name).commit();await denied(pair(kind,name).commit());await denied(pair(kind,name.toUpperCase()).commit());
 });
 test(`${kind}: archived names remain reserved`,async()=>{const name=`Archived-${serial}`;const p=pair(kind,name);await p.commit();await client().doc(ep(kind,p.id)).update({archived:true});await denied(pair(kind,name.toUpperCase()).commit())});
 test(`${kind}: spoofed owner, arbitrary key, mismatched guard and foreign actor rejected`,async()=>{
  for(const opt of [{actor:'intruder'},{key:'forged-key'},{mutateEntity:e=>e.ownerUid='intruder'},{mutateGuard:g=>g.entityId='wrong'},{mutateGuard:g=>g.ownerUid='intruder'}])await denied(pair(kind,`Forgery-${serial}`,opt).commit());
 });
 test(`${kind}: exact-key concurrent claims yield one entity and guard`,async()=>{
  const name=`Race-${serial}`;const a=pair(kind,name),b=pair(kind,name);const results=await Promise.allSettled([a.commit(),b.commit()]);
  assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.find(x=>x.status==='rejected').reason.code,'permission-denied');
  const exists=await Promise.all([a,b].map(async p=>(await client().doc(ep(kind,p.id)).get()).exists));assert.equal(exists.filter(Boolean).length,1);
 });
 test(`${kind}: ASCII length 30 accepted; 31 rejected`,async()=>{await pair(kind,'a'.repeat(30)).commit();await denied(pair(kind,'a'.repeat(31)).commit())});
 test(`${kind}: required NFC-equivalent duplicate must be rejected`,async()=>{
  const first='Caf\u00e9',second='Cafe\u0301';assert.equal(first.normalize('NFC'),second.normalize('NFC'));
  await pair(kind,first).commit();const attack=pair(kind,second);
  try{await attack.commit()}catch(e){assert.equal(e.code,'permission-denied');return}
  const stored=(await client().doc(ep(kind,attack.id)).get()).data();
  fs.writeFileSync(`${kind}-normalization-bypass.json`,JSON.stringify({first,second,firstCodePoints:[...first].map(c=>c.codePointAt(0)),secondCodePoints:[...second].map(c=>c.codePointAt(0)),normalizedEqual:true,secondCommitted:true,storedName:stored.name,firstKey:first.toLowerCase(),secondKey:second.toLowerCase()},null,2));
  assert.fail('NFC-equivalent duplicate committed through two distinct name guards');
 });
 test(`${kind}: required valid 10-grapheme emoji name must be accepted`,async()=>{
  const family='\u{1f468}\u200d\u{1f469}\u200d\u{1f467}\u200d\u{1f466}';const name=family.repeat(10);
  assert.equal(graphemes(name),10);assert.equal([...name].length,70);
  await pair(kind,name).commit();
 });
}
test('ownership protects entity and guard reads; name guard cannot be independently edited or deleted',async()=>{
 const p=pair('categories','Protected');await p.commit();
 for(const db of [client('intruder'),env.unauthenticatedContext().firestore()]){await denied(db.doc(ep('categories',p.id)).get());await denied(db.doc(gp('categories',p.key)).get())}
 await denied(client().doc(gp('categories',p.key)).update({entityId:'other'}));await denied(client().doc(gp('categories',p.key)).delete());
});
test('Unicode normalize capability: deployed expression fails on an otherwise valid write',async()=>{
 const source=fs.readFileSync('firestore.rules','utf8');
 const probe=await initializeTestEnvironment({projectId:'demo-taskify-gate2',firestore:{rules:source.replace('n.nameKey==n.name.lower()',"n.nameKey==n.name.normalize('NFC').lower()")}});
 try {
  try{await pair('categories','Capability').commit()}catch(e){
   fs.writeFileSync('normalization-api-diagnostic.txt',String(e));assert.equal(e.code,'permission-denied');return;
  }
  assert.fail('normalize unexpectedly succeeded; investigate before declaring unavailable');
 } finally {await probe.cleanup()}
});
