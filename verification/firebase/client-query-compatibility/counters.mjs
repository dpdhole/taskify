import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
export const inventoryPath=(uid,tid)=>`users/${uid}/inventories/${tid}`;
export function putCounters(batch,client,uid,tid,before,changes){
 const counts={...(before?.counts??{todos:0,discussionEntries:0,discussionLinks:0,activityEvents:0})};
 const touches={todos:null,discussionEntries:null,discussionLinks:null,activityEvents:null};
 for(const [kind,change]of Object.entries(changes)){counts[kind]+=change.delta;touches[kind]=change.id}
 batch.set(client.doc(inventoryPath(uid,tid)),{ownerUid:uid,taskId:tid,counts,touches,rev:(before?.rev??0)+1,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
}
