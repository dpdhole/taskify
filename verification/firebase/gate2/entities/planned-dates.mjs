// Isolated India-only date adapter. No device timezone or arbitrary client offset is consulted.
const DAY=86400000;
const OFFSET=330*60000;
export function resolveIndia({day,clock='00:00',precision='time',endExclusive=false},isDue=false) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Invalid calendar date');
 const civil=Date.parse(day+'T00:00:00.000Z');
 if(!Number.isFinite(civil)||new Date(civil).toISOString().slice(0,10)!==day)throw new Error('Invalid calendar date');
 if(!['date','time'].includes(precision)||typeof endExclusive!=='boolean')throw new Error('Invalid precision');
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))throw new Error('Invalid clock');
 const [hours,minutes]=clock.split(':').map(Number);
 if(precision==='date'&&clock!=='00:00')throw new Error('Date precision requires a boundary');
 if(!isDue&&endExclusive)throw new Error('Start cannot be end-exclusive');
 const end=isDue&&(precision==='date'||endExclusive);
 if(end&&clock!=='00:00')throw new Error('End-of-day requires midnight');
 return {atMillis:civil+(end?DAY:0)+hours*3600000+minutes*60000-OFFSET,
  dayMillis:civil,precision,endExclusive:end};
}
export function indiaDisplay(atMillis) {
 return new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(atMillis));
}
export const isDueReached=(atMillis,nowMillis)=>nowMillis>=atMillis;
// dayMillis is a verified civil-date marker, not a deadline instant.
export function deadlineLabel(plan) {
 if(plan.precision==='date') {
  const selected=new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(plan.dayMillis));
  return selected+', EOD · IST';
 }
 return indiaDisplay(plan.atMillis)+' · IST';
}
