// Fixed-India feasibility query engine. Bucket boundaries are caller-supplied design inputs.
const DAY=86400000,OFFSET=330*60000;
export const priorityOrder=['DoFirst','Schedule','Delegate','Eliminate','Unclassified'];
export const lifecycleOrder=['Draft','InProgress','Closed'];
export const dateFields={Due:'due',PlannedStart:'plannedStart',ActualStart:'actualStart',ActualEnd:'actualEnd',DeletedAt:'deletedAt',CreatedAt:'createdAt',UpdatedAt:'updatedAt',PausedUntil:'pausedUntil'};
export const ms=v=>v==null?null:typeof v==='number'?v:v.toMillis();
export const indiaDay=v=>Math.floor((ms(v)+OFFSET)/DAY);
export function selectedDay(task,dimension){const v=task[dateFields[dimension]];return v==null?null:dimension==='Due'||dimension==='PlannedStart'?Math.floor(ms(v.day)/DAY):indiaDay(v)}
export function priority(t){if(t.important==null||t.urgent==null)return 'Unclassified';return t.important?t.urgent?'DoFirst':'Schedule':t.urgent?'Delegate':'Eliminate'}
export function pause(t,now){return t.pauseReason==null?'None':t.pausedUntil==null?'Indefinite':ms(t.pausedUntil)<=now?'Expired':'Timed'}
export function queryShape(q){
 const groups=['Category','Location','Lifecycle','Priority',...Object.keys(dateFields)];
 const allowed=['groupBy','sortField','sortDirection','includeClosed','includeDeleted','closureReasons','deletedFilter','filters','dateBuckets'];
 if(!q||Object.keys(q).some(k=>!allowed.includes(k))||!groups.includes(q.groupBy)||!['Title','Category','Location','Lifecycle','Priority','Pause',...Object.keys(dateFields)].includes(q.sortField??'Due')||!['asc','desc'].includes(q.sortDirection??'asc')||typeof q.includeClosed!=='boolean'||typeof q.includeDeleted!=='boolean'||!Array.isArray(q.closureReasons)||!q.closureReasons.every(v=>['Done','Cancelled','UnableToComplete','NoLongerApplicable','Duplicate','Other'].includes(v))||![null,'set','notSet'].includes(q.deletedFilter??null))throw new Error('INVALID_QUERY');
 const f=q.filters??{};if(!f||Array.isArray(f)||Object.keys(f).some(k=>!['Category','Location','Lifecycle','Priority','Pause',...Object.keys(dateFields)].includes(k)))throw new Error('INVALID_FILTER');
 for(const [key,v]of Object.entries(f)){
  if(key==='Category'){if(!v||Array.isArray(v)||typeof v!=='object'||Object.values(v).some(x=>x!==true))throw new Error('INVALID_ID_FILTER')}
  else if(key==='Location'){if(!v||Object.keys(v).some(k=>!['ids','includeUnspecified'].includes(k))||typeof v.includeUnspecified!=='boolean'||!v.ids||Array.isArray(v.ids)||Object.values(v.ids).some(x=>x!==true))throw new Error('INVALID_LOCATION_FILTER')}
  else if(['Lifecycle','Priority','Pause'].includes(key)){const choices=key==='Lifecycle'?lifecycleOrder:key==='Priority'?priorityOrder:['None','Timed','Expired','Indefinite'];if(!Array.isArray(v)||!v.every(x=>choices.includes(x)))throw new Error('INVALID_ENUM_FILTER')}
  else if(!v||Object.keys(v).some(k=>!['presence','from','until'].includes(k))||!['any','set','notSet'].includes(v.presence)||![v.from,v.until].every(x=>x===null||Number.isInteger(x))||(v.from!==null&&v.until!==null&&v.from>=v.until))throw new Error('INVALID_DATE_FILTER');
 }
 if(q.dateBuckets!==undefined)validateBounds(q.dateBuckets);return q;
}
export function validateBounds(b){if(!Array.isArray(b)||b.length!==3||!b.every(Number.isInteger)||!(1<=b[0]&&b[0]<b[1]&&b[1]<b[2]))throw new Error('INVALID_DATE_BUCKETS')}
export function select(tasks,q,phrase='',categories=new Map(),locations=new Map(),now=Date.now()){
 queryShape(q);const text=phrase.trim().toLowerCase();const f=q.filters??{};
 return tasks.filter(t=>{
  if((!q.includeClosed&&t.lifecycle==='Closed')||(!q.includeDeleted&&t.deletedAt!=null))return false;
  if(q.deletedFilter==='set'&&t.deletedAt==null||q.deletedFilter==='notSet'&&t.deletedAt!=null)return false;
  if(q.includeClosed&&q.closureReasons.length&&!q.closureReasons.includes(t.closureOutcome))return false;
  for(const [dim,rule]of Object.entries(f)){
   if(dim===q.groupBy)continue;
   if(dim==='Category'){const keys=Object.keys(rule);if(keys.length&&!keys.includes(t.categoryId))return false}
   else if(dim==='Location'){const keys=Object.keys(rule.ids);if((keys.length||rule.includeUnspecified)&&!(t.locationId==null?rule.includeUnspecified:keys.includes(t.locationId)))return false}
   else if(['Lifecycle','Priority','Pause'].includes(dim)){const value=dim==='Lifecycle'?t.lifecycle:dim==='Priority'?priority(t):pause(t,now);if(rule.length&&!rule.includes(value))return false}
   else {const day=selectedDay(t,dim);if(rule.presence==='set'&&day===null||rule.presence==='notSet'&&day!==null)return false;if(rule.from!==null&&(day===null||day<rule.from)||rule.until!==null&&(day===null||day>=rule.until))return false}
  }
  return !text||[t.title,t.reference,categories.get(t.categoryId)?.name,locations.get(t.locationId)?.name].some(v=>typeof v==='string'&&v.toLowerCase().includes(text));
 });
}
function dateGroups(dimension,now,bounds){
 if(dimension==='DeletedAt')return [{id:'Future',from:1,until:Infinity},{id:'Today',from:0,until:1},{id:'Yesterday',from:-1,until:0},{id:'2–7 days ago',from:-7,until:-1},{id:'8–30 days ago',from:-30,until:-7},{id:'Older',from:-Infinity,until:-30}];
 const [near,medium,far]=bounds??[1,2,3]; // Minimal test fallback; not approved product defaults.
 return [{id:dimension==='PausedUntil'?'Expired':'Older',from:-Infinity,until:0},{id:'Today',from:0,until:1},{id:'Near',from:1,until:near+1},{id:'Medium',from:near+1,until:medium+1},{id:'Far',from:medium+1,until:far+1},{id:'Later',from:far+1,until:Infinity}];
}
export function grouped(tasks,q,{categories=new Map(),locations=new Map(),categoryOrder=[...categories.keys()],locationOrder=[...locations.keys()],now=Date.now()}={}){
 queryShape(q);const dim=q.groupBy;let groups;
 if(dim==='Category'||dim==='Location'){const values=dim==='Category'?categories:locations,order=dim==='Category'?categoryOrder:locationOrder;groups=order.map(id=>({id,label:values.get(id)?.name??id}));for(const t of tasks){const id=dim==='Category'?t.categoryId:t.locationId;if(id!=null&&!groups.some(g=>g.id===id))groups.push({id,label:values.get(id)?.name??id})}}
 else if(dim==='Lifecycle'||dim==='Priority')groups=(dim==='Lifecycle'?lifecycleOrder:priorityOrder).map(id=>({id,label:id}));
 else {groups=dateGroups(dim,now,q.dateBuckets);if(dim==='PausedUntil')groups.push({id:'Indefinite',label:'Indefinite'})}
 if(dim==='Location'||dim in dateFields)groups.push({id:'Unspecified',label:'Unspecified'});
 groups=groups.map(g=>({...g,label:g.label??g.id,tasks:[]}));const today=indiaDay(now);
 for(const t of tasks){let key;if(dim==='Category')key=t.categoryId;else if(dim==='Location')key=t.locationId??'Unspecified';else if(dim==='Lifecycle')key=t.lifecycle;else if(dim==='Priority')key=priority(t);
  else {const day=selectedDay(t,dim);if(dim==='PausedUntil'&&t.pauseReason!=null&&t.pausedUntil==null)key='Indefinite';else if(day===null)key='Unspecified';else if(dim==='PausedUntil'&&ms(t.pausedUntil)<=now)key='Expired';else {const delta=day-today;key=groups.find(g=>g.from<=delta&&delta<g.until)?.id}}
  const group=groups.find(g=>g.id===key);if(!group)throw new Error(`UNPARTITIONED_TASK:${t.id}`);group.tasks.push(t);
 }
 for(const g of groups)g.tasks.sort(comparator(q,categories,locations,now));return groups;
}
export function comparator(q,categories=new Map(),locations=new Map(),now=Date.now()){
 const field=q.sortField??'Due',direction=q.sortDirection==='desc'?-1:1;
 const value=t=>field==='Title'?t.title:field==='Category'?categories.get(t.categoryId)?.name:field==='Location'?locations.get(t.locationId)?.name:field==='Lifecycle'?lifecycleOrder.indexOf(t.lifecycle):field==='Priority'?priorityOrder.indexOf(priority(t)):field==='Pause'?['None','Timed','Expired','Indefinite'].indexOf(pause(t,now)):ms(t[dateFields[field]]?.at??t[dateFields[field]]);
 return (a,b)=>{const x=value(a),y=value(b);if(x==null&&y!=null)return 1;if(y==null&&x!=null)return -1;const order=x==null?0:typeof x==='string'?x.localeCompare(y,'en',{sensitivity:'base'}):x-y;return order*direction||String(a.id).localeCompare(String(b.id))};
}
export function evaluate(tasks,q,phrase='',options={}){const matches=select(tasks,q,phrase,options.categories,options.locations,options.now);return {tasks:matches,groups:grouped(matches,q,options),count:matches.length}}
export function changeGroup(q,groupBy){const filters={...q.filters};delete filters[groupBy];return {...q,groupBy,filters}}
export function burnRate(tasks,{now=Date.now(),unit='days',n=7,weekStart=1}={}){
 const allowed=unit==='days'?[3,7,10]:unit==='weeks'?Array.from({length:9},(_,i)=>i+4):unit==='months'?Array.from({length:34},(_,i)=>i+3):[];
 if(!allowed.includes(n)||!Number.isInteger(weekStart)||weekStart<0||weekStart>6)throw new Error('INVALID_BURN_PERIOD');
 const local=new Date(now+OFFSET);local.setUTCHours(0,0,0,0);if(unit==='weeks')local.setUTCDate(local.getUTCDate()-(local.getUTCDay()-weekStart+7)%7);if(unit==='months')local.setUTCDate(1);
 const anchor=local.getTime(),step=(base,delta)=>{const d=new Date(base);if(unit==='months')d.setUTCMonth(d.getUTCMonth()+delta);else d.setUTCDate(d.getUTCDate()+delta*(unit==='weeks'?7:1));return d.getTime()};
 const buckets=Array.from({length:n+1},(_,i)=>({from:step(anchor,i-n)-OFFSET,until:i===n?now+1:step(anchor,i-n+1)-OFFSET,partial:i===n,newIds:new Set(),closedIds:new Set()}));
 for(const t of tasks){if(t.deletedAt!=null)continue;const created=ms(t.createdAt),end=ms(t.actualEnd);for(const b of buckets){if(created!==null&&created>=b.from&&created<b.until)b.newIds.add(t.id);if(t.lifecycle==='Closed'&&end!==null&&end>=b.from&&end<b.until)b.closedIds.add(t.id)}}
 return buckets.map(({newIds,closedIds,...b})=>({...b,newCount:newIds.size,closedCount:closedIds.size}));
}
