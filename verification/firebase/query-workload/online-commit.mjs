// Browser-direct REST write port: one HTTP attempt, no Firestore SDK offline write queue.
export async function commitOnline({projectId,writes,getToken,online=true,fetcher=fetch,baseUrl='https://firestore.googleapis.com/v1',timeoutMs=10000}){
 if(!online)throw Object.assign(new Error('OFFLINE_WRITE_DISABLED'),{code:'OFFLINE_WRITE_DISABLED'});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetcher(`${baseUrl}/projects/${projectId}/databases/(default)/documents:commit`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${await getToken()}`},body:JSON.stringify({writes}),signal:controller.signal});
  const body=await response.json();if(!response.ok)throw Object.assign(new Error(body.error?.message??'WRITE_REJECTED'),{code:body.error?.status??'WRITE_REJECTED'});return body;
 }catch(error){if(error.code)throw error;throw Object.assign(new Error('WRITE_OUTCOME_UNKNOWN',{cause:error}),{code:'WRITE_OUTCOME_UNKNOWN'})}
 finally{clearTimeout(timer)}
}
