// Fixed-India calendar-age helper, separate from irreversible delete authorization.
const OFFSET=330*60000;
export function cutoffIndia(now,{unit,n}){
 if(!Number.isInteger(n)||n<1||!['days','months'].includes(unit))throw new Error('Invalid age threshold');
 const local=new Date(now+OFFSET);if(unit==='days')local.setUTCDate(local.getUTCDate()-n);
 else {const day=local.getUTCDate(),month=local.getUTCMonth()-n,year=local.getUTCFullYear();const last=new Date(Date.UTC(year,month+1,0)).getUTCDate();local.setUTCDate(1);local.setUTCMonth(month);local.setUTCDate(Math.min(day,last))}
 return local.getTime()-OFFSET;
}
export function eligible(tasks,action,cutoff){
 return tasks.filter(t=>action==='trash'?t.deletedAt===null&&t.lifecycle==='Closed'&&t.actualEnd!==null&&t.actualEnd.toMillis()<cutoff:
  action==='purge'?t.deletedAt!==null&&t.deletedAt.toMillis()<cutoff:false);
}
