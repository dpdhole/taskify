import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
export const kinds=['todos','discussionEntries','discussionLinks','activityEvents'];
export const zeros=()=>Object.fromEntries(kinds.map(k=>[k,0]));
export const touches=()=>Object.fromEntries(kinds.map(k=>[k,null]));
export const ts=()=>firebase.firestore.FieldValue.serverTimestamp();
export const root=(uid,id)=>`users/${uid}/tasks/${id}`;
export const inv=(uid,id)=>`users/${uid}/inventories/${id}`;
export const job=(uid,id)=>`users/${uid}/purges/${id}`;
export async function addInventory(db,batch,uid,id,changes) {
 const before=(await db.doc(inv(uid,id)).get()).data();const counts={...(before?.counts??zeros())},w=touches();
 for(const [kind,{id:child,delta}]of Object.entries(changes)){counts[kind]+=delta;w[kind]=child}
 const value={ownerUid:uid,taskId:id,counts,touches:w,rev:(before?.rev??0)+1,updatedAt:ts()};
 batch.set(db.doc(inv(uid,id)),value);return value;
}
export async function begin(db,uid,id) {
 const t=(await db.doc(root(uid,id)).get()).data(),i=(await db.doc(inv(uid,id)).get()).data();
 const current=(await db.doc(job(uid,id)).get()).data();if(current)return current;
 const value={ownerUid:uid,taskId:id,taskCreatedAt:t.createdAt,taskVersion:t.version,deletedAt:t.deletedAt,inventoryRev:i.rev,phase:'draining',version:0,startedAt:ts(),completedAt:null};
 try{await db.doc(job(uid,id)).set(value)}catch(e){if(e.code!=='permission-denied'||!(await db.doc(job(uid,id)).get()).exists)throw e}
 return (await db.doc(job(uid,id)).get()).data();
}
export async function removeOne(db,uid,id,kind,child) {
 const ref=db.doc(`${root(uid,id)}/${kind}/${child}`);
 for(let attempt=0;attempt<4;attempt++){
  if((await db.doc(job(uid,id)).get()).data()?.phase==='complete')return false;
  if(!(await ref.get()).exists)return false;
  const version=(await db.doc(inv(uid,id)).get()).data().rev;
  const batch=db.batch();batch.delete(ref);await addInventory(db,batch,uid,id,{[kind]:{id:child,delta:-1}});
  try{await batch.commit();return true}catch(e){
   if(e.code!=='permission-denied'||attempt===3)throw e;
   if((await db.doc(job(uid,id)).get()).data()?.phase==='complete')return false;
   if(!(await ref.get()).exists)return false;
   if((await db.doc(inv(uid,id)).get()).data().rev===version)throw e;
  }
 }
}export async function finish(db,uid,id) {
 const ref=db.doc(job(uid,id)),j=(await ref.get()).data();if(j?.phase==='complete')return;
 const batch=db.batch();if((await db.doc(root(uid,id)).get()).exists)batch.delete(db.doc(root(uid,id)));
 batch.update(ref,{phase:'complete',version:j.version+1,completedAt:ts()});try{await batch.commit()}catch(e){if(e.code!=='permission-denied'||(await ref.get()).data()?.phase!=='complete')throw e}
}
export async function purge(db,uid,id,{failAfter=Infinity,pageSize=25,afterBegin}={}) {
 const j=await begin(db,uid,id);if(j.phase==='complete')return {alreadyComplete:true,removed:0};
 if(afterBegin)await afterBegin();let removed=0;
 for(const kind of kinds) {
  while(true) {
   const page=await db.collection(`${root(uid,id)}/${kind}`).orderBy(firebase.firestore.FieldPath.documentId()).limit(pageSize).get();
   if(page.empty)break;
   for(const d of page.docs){if(removed===failAfter)throw Object.assign(new Error('Injected interruption'),{code:'INJECTED',removed});if(await removeOne(db,uid,id,kind,d.id))removed++}
  }
 }
 await finish(db,uid,id);return {alreadyComplete:false,removed};
}
export function encode(v) {
 if(v===null)return ['null'];if(typeof v==='string'||typeof v==='boolean'||typeof v==='number')return [typeof v,v];
 if(typeof v?.toMillis==='function'&&Number.isInteger(v.seconds)&&Number.isInteger(v.nanoseconds))return ['timestamp',v.seconds,v.nanoseconds];
 if(Array.isArray(v))return ['array',v.map(encode)];if(typeof v==='object')return ['map',Object.entries(v).map(([k,x])=>[k,encode(x)])];
 throw new Error('Unsupported backup value');
}
export function decode(v) {
 switch(v[0]){case 'null':return null;case 'string':case 'boolean':case 'number':return v[1];case 'timestamp':return new firebase.firestore.Timestamp(v[1],v[2]);case 'array':return v[1].map(decode);case 'map':return Object.fromEntries(v[1].map(([k,x])=>[k,decode(x)]));default:throw new Error('Invalid backup type')}
}
export async function exportTask(db,uid,id,{retries=3,pageSize=25,interleave}={}) {
 for(let attempt=1;attempt<=retries;attempt++) {
  if((await db.doc(job(uid,id)).get()).exists)throw new Error('Purge marker present; export refused');
  const t=(await db.doc(root(uid,id)).get()).data();if(!t)throw new Error('Missing Task');
  const i=(await db.doc(inv(uid,id)).get()).data();const records=[];
  for(const kind of kinds) {
   let after;while(true){let q=db.collection(`${root(uid,id)}/${kind}`).orderBy(firebase.firestore.FieldPath.documentId()).limit(pageSize);if(after)q=q.startAfter(after);const page=await q.get();if(page.empty)break;
    for(const d of page.docs)records.push({kind,id:d.id,data:encode(d.data())});after=page.docs.at(-1);if(page.size<pageSize)break}
  }
  if(interleave)await interleave(attempt);
  const endTask=(await db.doc(root(uid,id)).get()).data(),endInv=(await db.doc(inv(uid,id)).get()).data(),j=(await db.doc(job(uid,id)).get()).data();
  const counts=i?.counts??zeros();
  if(!j&&endTask?.version===t.version&&(endInv?.rev??0)===(i?.rev??0)&&kinds.every(k=>records.filter(d=>d.kind===k).length===counts[k]))
   return {format:'taskify-snapshot-v1',ownerUid:uid,taskId:id,task:encode(t),inventory:i?encode(i):null,records,attempts:attempt};
 }
 throw Object.assign(new Error('Snapshot kept changing; no backup accepted'),{code:'SNAPSHOT_CHANGED'});
}

