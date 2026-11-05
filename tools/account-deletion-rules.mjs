// DA1 admission only. Browser progress, cleanup and fence retirement stay denied.
export const accountDeletionFunctions = `
  function workspaceWritable(uid) {
    return unfenced(uid) && !existsAfter(/databases/$(database)/documents/accountDeletion/$(uid));
  }
  function deletionRequest(uid) {
    let d=request.resource.data;
    let c=get(/databases/$(database)/documents/runtime/compatibility).data;
    let t=request.auth.token;
    return owner(uid) && allowed('accountDeletion') &&
      c.revision is int && c.revision>=3 && c.serverRelease is int && c.serverRelease>=3 &&
      d.keys().hasOnly(['schemaVersion','inventoryVersion','operatorPolicyVersion','admissionRevision','jobId','state','requestedAt','authTime','proofProvider','recordVersion','updatedAt']) &&
      d.keys().hasAll(['schemaVersion','inventoryVersion','operatorPolicyVersion','admissionRevision','jobId','state','requestedAt','authTime','proofProvider','recordVersion','updatedAt']) &&
      d.schemaVersion==1 && d.inventoryVersion==1 && d.operatorPolicyVersion==1 &&
      d.admissionRevision==c.revision && d.recordVersion==1 && d.state=='requested' &&
      d.jobId is string && d.jobId.matches('^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$') &&
      d.requestedAt==request.time && d.updatedAt==request.time &&
      d.authTime is int && d.authTime>=0 && t.auth_time is int && d.authTime==t.auth_time &&
      timestamp.value(d.authTime*1000)<=request.time &&
      request.time<=timestamp.value(d.authTime*1000)+duration.value(300,'s') &&
      d.proofProvider in ['google.com','microsoft.com'] &&
      t.firebase.sign_in_provider==d.proofProvider &&
      t.firebase.identities[d.proofProvider] is list && t.firebase.identities[d.proofProvider].size()>0;
  }
`;
export const accountDeletionMatch = `match /accountDeletion/{uid} {
    allow get: if owner(uid);
    allow create: if owner(uid) && deletionRequest(uid);
    allow list,update,delete: if false;
  }`;
