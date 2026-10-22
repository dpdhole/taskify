import {queryShape} from './query-engine.mjs';
import {decodeQuery} from './query-codec.mjs';
// Integer release identifiers avoid ambiguous semantic-version ordering.
export function checkCompatibility(contract,app){
 if(!contract || !Number.isInteger(contract.serverRelease) || !Number.isInteger(contract.contractVersion) || contract.contractVersion!==1 ||
 !Number.isInteger(contract.minimumAppRelease) || !Array.isArray(contract.readSchemas) ||
 !Array.isArray(contract.writeSchemas) || !Number.isInteger(app.release) ||
 !contract.readSchemas.every(Number.isInteger) || !contract.writeSchemas.every(Number.isInteger))throw Error('COMPATIBILITY_UNAVAILABLE');
 if(app.release<contract.minimumAppRelease || !contract.readSchemas.every(s=>app.readSchemas.includes(s)) ||
 !contract.writeSchemas.includes(app.writeSchema))throw Error('UPDATE_REQUIRED');
 return true;
}
export function encodeDefinition(query){queryShape(query);const payload=JSON.stringify(query);if(payload.length>32768)throw Error('DEFINITION_TOO_LARGE');return {querySchemaVersion:2,query:payload};}
export function loadDefinition(record){
 try{
  if(record.querySchemaVersion!==undefined && record.querySchemaVersion!==2)throw Error('UNSUPPORTED_SCHEMA');
  const query=record.querySchemaVersion===2?JSON.parse(record.query):decodeQuery(record.query);
  queryShape(query);return {ok:true,query};
 }catch(error){return {ok:false,reason:error.message,query:null};}
}
export function createGate(app){
 let ready=false;
 return {async refresh(fetchContract){ready=false;checkCompatibility(await fetchContract(),app);ready=true;},
  async run(action){if(!ready)throw Error('BOOT_BLOCKED');return action();},get ready(){return ready;}};
}
export async function upgradeDefinition(db,ref,serverTimestamp){
 return db.runTransaction(async tx=>{const snap=await tx.get(ref),record=snap.data();
  if(record.querySchemaVersion===2)return false;
  const loaded=loadDefinition(record);if(!loaded.ok)throw Error('MANUAL_CORRECTION_REQUIRED');
  tx.update(ref,{...encodeDefinition(loaded.query),version:record.version+1,updatedAt:serverTimestamp()});return true;
 });
}
