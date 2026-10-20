// Emulator-only simulation of a separately authorized, trusted offline operator. Never ships in the browser.
import crypto from 'node:crypto';
import {kinds,zeros,touches,ts,root,inv,job,decode} from './operations.mjs';
export const checksum=text=>crypto.createHash('sha256').update(text).digest('hex');
export function preflight(text,expectedChecksum,uid) {
 if(checksum(text)!==expectedChecksum)throw new Error('CHECKSUM_MISMATCH');
 const a=JSON.parse(text);if(a.format!=='taskify-snapshot-v1'||a.ownerUid!==uid||typeof a.taskId!=='string'||!a.taskId||a.taskId.includes('/'))throw new Error('INVALID_SCOPE');
 const task=decode(a.task),inventory=a.inventory?decode(a.inventory):null;
 if(task.ownerUid!==uid||!Number.isInteger(task.version)||task.version<0)throw new Error('INVALID_TASK');
 const seen=new Set();for(const r of a.records){
  if(!kinds.includes(r.kind)||typeof r.id!=='string'||!r.id||r.id.includes('/')||seen.has(`${r.kind}/${r.id}`))throw new Error('INVALID_RECORD');seen.add(`${r.kind}/${r.id}`);
  const d=decode(r.data);if(d.ownerUid!==uid||d.taskId!==a.taskId)throw new Error('INVALID_RECORD_OWNER');
 }
 const counts=inventory?.counts??zeros();if(!kinds.every(k=>a.records.filter(r=>r.kind===k).length===counts[k]))throw new Error('INCOMPLETE_ARCHIVE');
 return {archive:a,task,inventory};
}
export async function operatorRestore(env,text,sha,uid,{failAfter=Infinity}={}) {
 if(!process.env.FIRESTORE_EMULATOR_HOST?.startsWith('127.0.0.1:'))throw new Error('EMULATOR_ONLY');
 const {archive:a,task,inventory}=preflight(text,sha,uid);let report;
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore(),id=a.taskId,existing=(await db.doc(root(uid,id)).get()).data();
  if(existing){const last=(await db.doc(`${root(uid,id)}/activityEvents/${existing.lastEventId}`).get()).data();if(last?.type==='OperatorRecovery'&&last.sourceChecksum===sha){report={alreadyRestored:true};return}throw new Error('LIVE_TASK_EXISTS')}
  const j=(await db.doc(job(uid,id)).get()).data(),empty=(await db.doc(inv(uid,id)).get()).data();
  if(j?.phase!=='complete'||!empty||!kinds.every(k=>empty.counts[k]===0)||!j.taskCreatedAt.isEqual(task.createdAt))throw new Error('NOT_A_COMPLETED_MATCHING_PURGE');
  const journal=db.doc(`users/${uid}/recoveries/${id}`),previous=(await journal.get()).data();
  if(previous?.phase==='staging'&&previous.sourceChecksum!==sha)throw new Error('DIFFERENT_ARCHIVE_IN_PROGRESS');
  await journal.set({ownerUid:uid,taskId:id,sourceChecksum:sha,phase:'staging',purgeVersion:j.taskVersion,startedAt:ts()});
  let copied=0;for(const r of a.records){if(copied===failAfter)throw Object.assign(new Error('Injected operator interruption'),{code:'INJECTED_OPERATOR'});await db.doc(`${root(uid,id)}/${r.kind}/${r.id}`).set(decode(r.data));copied++}
  // Publish root last, with a version above every pre-purge version to reject stale clients.
  const version=Math.max(task.version,j.taskVersion)+1,eid=`v${version}`;
  const restored={...task,version,lastEventId:eid,updatedAt:ts()};
  const counts={...(inventory?.counts??zeros()),activityEvents:(inventory?.counts.activityEvents??0)+1};
  const record={ownerUid:uid,actorUid:'trusted-operator',taskId:id,type:'OperatorRecovery',sourceChecksum:sha,sourceVersion:task.version,priorPurgeVersion:j.taskVersion,toVersion:version,createdAt:ts(),after:restored};
  const batch=db.batch();batch.set(db.doc(root(uid,id)),restored);batch.set(db.doc(`${root(uid,id)}/activityEvents/${eid}`),record);
  batch.set(db.doc(inv(uid,id)),{ownerUid:uid,taskId:id,counts,touches:{...touches(),activityEvents:eid},rev:empty.rev+1,updatedAt:ts()});
  batch.delete(db.doc(job(uid,id)));batch.set(journal,{ownerUid:uid,taskId:id,sourceChecksum:sha,phase:'complete',version,publishedAt:ts()});await batch.commit();report={alreadyRestored:false,copied,newVersion:version,recoveryEvent:eid,sourceChecksum:sha};
 });return report;
}

