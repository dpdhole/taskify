import {test} from 'node:test';
import assert from 'node:assert/strict';
import firebase from 'firebase/compat/app';import 'firebase/compat/firestore';
import {priority,priorityOrder,pause,selectedDay,indiaDay,select,grouped,evaluate,burnRate,dateFields,queryShape,changeGroup,comparator} from '../query-engine.mjs';
import {defaults,query} from '../views.mjs';
import {commitOnline} from '../online-commit.mjs';
import {workload,backlog} from '../workload-model.mjs';
const now=Date.parse('2026-10-20T10:30:00Z'),T=iso=>firebase.firestore.Timestamp.fromMillis(Date.parse(iso)),day=s=>Math.floor(Date.parse(s+'T00:00Z')/86400000);
const plan=(s,clock='09:00')=>({at:T(`${s}T${clock}:00+05:30`),day:T(`${s}T00:00:00Z`),precision:'time',endExclusive:false});
const Q=patch=>({...query(),...patch});
const task=(id,patch={})=>({id,title:id,reference:'',categoryId:'c1',locationId:null,lifecycle:'Draft',pauseReason:null,pausedUntil:null,due:null,plannedStart:null,actualStart:null,actualEnd:null,deletedAt:null,createdAt:T('2026-10-19T10:00Z'),updatedAt:T('2026-10-20T09:00Z'),closureOutcome:null,...patch});
const categories=new Map([['c1',{name:'India work'}],['c2',{name:'Zero category'}]]),locations=new Map([['l1',{name:'London'}],['l2',{name:'Empty'}]]),opts={now,categories,locations,categoryOrder:['c2','c1'],locationOrder:['l2','l1']};

test('all nine tri-state preference combinations produce the five approved classes',()=>{
 const expected=['DoFirst','Schedule','Unclassified','Delegate','Eliminate','Unclassified','Unclassified','Unclassified','Unclassified'];let n=0;
 for(const important of [true,false,null])for(const urgent of [true,false,null])assert.equal(priority({important,urgent}),expected[n++]);assert.equal(priority({}),'Unclassified');
});
test('scope flags and closure reasons cover all six approved outcomes independently of deletion',()=>{
 const rows=['Done','Cancelled','UnableToComplete','NoLongerApplicable','Duplicate','Other'].map((closureOutcome,i)=>task(`c${i}`,{lifecycle:'Closed',closureOutcome,deletedAt:i%2?T('2026-10-19T10:00Z'):null}));rows.push(task('open'));
 assert.equal(select(rows,Q(),'',categories,locations,now).length,1);assert.equal(select(rows,Q({includeClosed:true}),'',categories,locations,now).length,4);
 assert.equal(select(rows,Q({includeClosed:true,includeDeleted:true}),'',categories,locations,now).length,7);
 for(const reason of rows.slice(0,6).map(r=>r.closureOutcome))assert.equal(select(rows,Q({includeClosed:true,includeDeleted:true,closureReasons:[reason]}),'',categories,locations,now).length,1);
 assert.equal(select(rows,Q({closureReasons:['Done']}),'',categories,locations,now)[0].id,'open');
});
test('Deleted Date set/notSet vocabulary agrees with persisted Rules contract',()=>{
 const rows=[task('a'),task('b',{deletedAt:T('2026-10-19T10:00Z')})];assert.deepEqual(select(rows,Q({includeDeleted:true,deletedFilter:'notSet'})).map(t=>t.id),['a']);assert.deepEqual(select(rows,Q({includeDeleted:true,deletedFilter:'set'})).map(t=>t.id),['b']);assert.throws(()=>select(rows,Q({deletedFilter:'unset'})),/INVALID_QUERY/);
});
test('Category/Location OR, dimensions AND, five-class and paused filters combine',()=>{
 const rows=[task('a',{important:true,urgent:true,locationId:'l1',pauseReason:'Waiting'}),task('b',{categoryId:'c2',important:false,urgent:false}),task('c',{locationId:'l1',important:true,urgent:true,pausedUntil:T('2026-10-21T09:00Z'),pauseReason:'Blocked'})];
 const q=Q({groupBy:'Due',filters:{Category:{c1:true,c2:true},Location:{ids:{l1:true},includeUnspecified:false},Priority:['DoFirst'],Pause:['Timed','Indefinite']}});assert.deepEqual(select(rows,q,'',categories,locations,now).map(t=>t.id),['a','c']);
 assert.deepEqual(select(rows,Q({groupBy:'Due',filters:{Location:{ids:{},includeUnspecified:true}}})).map(t=>t.id),['b']);
});
test('pause expiry is derived, independent of lifecycle and never mutates the Task',()=>{
 const rows=[task('none'),task('indefinite',{pauseReason:'Waiting'}),task('exact',{pauseReason:'Blocked',pausedUntil:firebase.firestore.Timestamp.fromMillis(now)}),task('future',{pauseReason:'Other',pausedUntil:firebase.firestore.Timestamp.fromMillis(now+1)})];const before=JSON.stringify(rows);
 assert.deepEqual(rows.map(t=>pause(t,now)),['None','Indefinite','Expired','Timed']);assert.equal(JSON.stringify(rows),before);
});
for(const dimension of Object.keys(dateFields))test(`calendar range ${dimension}: inclusive lower, exclusive upper and presence`,()=>{
 const field=dateFields[dimension],value=(s,time)=>['Due','PlannedStart'].includes(dimension)?plan(s,time):T(`${s}T${time}:00+05:30`);
 const rows=[task('before',{[field]:value('2026-10-19','23:59')}),task('lower',{[field]:value('2026-10-20','00:00')}),task('inside',{[field]:value('2026-10-20','16:00')}),task('upper',{[field]:value('2026-10-21','00:00')}),task('missing',{[field]:null})];
 const q=Q({groupBy:'Priority',includeDeleted:true,filters:{[dimension]:{presence:'set',from:day('2026-10-20'),until:day('2026-10-21')}}});assert.deepEqual(select(rows,q).map(t=>t.id),['lower','inside']);assert.deepEqual(select(rows,Q({groupBy:'Priority',includeDeleted:true,filters:{[dimension]:{presence:'notSet',from:null,until:null}}})).map(t=>t.id),['missing']);
});
test('EOD Due groups/filters by selected India day rather than next-midnight instant',()=>{
 const row=task('eod',{due:{...plan('2026-10-20'),at:T('2026-10-21T00:00:00+05:30'),precision:'date',endExclusive:true}});
 assert.equal(selectedDay(row,'Due'),day('2026-10-20'));const q=Q({groupBy:'Due',dateBuckets:[7,30,90]});assert.equal(grouped([row],q,opts).find(g=>g.id==='Today').tasks[0].id,'eod');
});
test('global user-defined class order, zero groups and missing Location remain visible',()=>{
 const groups=grouped([task('a'),task('b',{locationId:'l1'})],Q({groupBy:'Location'}),opts);assert.deepEqual(groups.map(g=>g.id),['l2','l1','Unspecified']);assert.equal(groups[0].tasks.length,0);assert.equal(groups.at(-1).tasks.length,1);assert.equal(groups.reduce((n,g)=>n+g.tasks.length,0),2);
 const cats=grouped([task('a')],Q(),opts);assert.deepEqual(cats.map(g=>g.id),['c2','c1']);
});
test('nonoverlapping date boundaries partition every day exactly once and retain empty groups',()=>{
 const offsets=[-100,-1,0,1,7,8,30,31,90,91,300];const today=day('2026-10-20');const rows=offsets.map(n=>task(String(n),{due:{at:firebase.firestore.Timestamp.fromMillis((today+n)*86400000-330*60000),day:firebase.firestore.Timestamp.fromMillis((today+n)*86400000),precision:'time',endExclusive:false}}));rows.push(task('missing'));
 const groups=grouped(rows,Q({groupBy:'Due',dateBuckets:[7,30,90]}),opts);assert.deepEqual(groups.map(g=>g.tasks.length),[2,1,2,2,2,2,1]);assert.equal(new Set(groups.flatMap(g=>g.tasks.map(t=>t.id))).size,rows.length);assert.equal(groups.at(-1).id,'Unspecified');
});
test('Paused Until groups expired instants today, indefinite and unspecified separately',()=>{
 const rows=[task('expired',{pauseReason:'Waiting',pausedUntil:T('2026-10-20T09:00:00+05:30')}),task('indefinite',{pauseReason:'Waiting'}),task('none'),task('later',{pauseReason:'Waiting',pausedUntil:T('2026-10-20T20:00:00+05:30')})];
 const g=grouped(rows,Q({groupBy:'PausedUntil',dateBuckets:[7,30,90]}),opts);assert.deepEqual(g.filter(x=>x.tasks.length).map(x=>[x.id,x.tasks[0].id]),[['Expired','expired'],['Today','later'],['Indefinite','indefinite'],['Unspecified','none']]);
});
test('Deleted Date Today/Yesterday/2–7/8–30/Older boundaries are exclusive and exhaustive',()=>{
 const rows=[0,-1,-2,-7,-8,-30,-31].map(n=>task(String(n),{deletedAt:firebase.firestore.Timestamp.fromMillis(now+n*86400000)}));const groups=grouped(rows,Q({groupBy:'DeletedAt',includeDeleted:true}),opts);assert.deepEqual(groups.filter(g=>g.tasks.length).map(g=>[g.id,g.tasks.length]),[['Today',1],['Yesterday',1],['2–7 days ago',2],['8–30 days ago',2],['Older',1]]);assert.equal(groups.at(-1).id,'Unspecified');
});
test('all grouping and sort dimensions retain exclusive partition and deterministic null-last ordering',()=>{
 const rows=[task('z',{due:plan('2026-10-20'),important:true,urgent:true}),task('a',{due:plan('2026-10-19'),locationId:'l1'}),task('m')];
 for(const groupBy of ['Category','Location','Lifecycle','Priority',...Object.keys(dateFields)])for(const sortField of ['Title','Category','Location','Lifecycle','Priority','Pause',...Object.keys(dateFields)])for(const sortDirection of ['asc','desc']){
  const q=Q({groupBy,sortField,sortDirection,dateBuckets:[7,30,90]}),groups=grouped(rows,q,opts);assert.equal(groups.reduce((n,g)=>n+g.tasks.length,0),rows.length);assert.equal(new Set(groups.flatMap(g=>g.tasks.map(t=>t.id))).size,rows.length);
 }
 for(const sortDirection of ['asc','desc']){const sorted=[...rows].sort(comparator(Q({sortField:'Due',sortDirection}),categories,locations,now));assert.equal(sorted.at(-1).id,'m')}
});
test('group change clears the conflicting filter; stored definition and Search remain independent',()=>{
 const q=Q({filters:{Priority:['DoFirst'],Location:{ids:{l1:true},includeUnspecified:false}}}),saved=JSON.stringify(q),next=changeGroup(q,'Priority');assert.equal(next.filters.Priority,undefined);assert.deepEqual(next.filters.Location,{ids:{l1:true},includeUnspecified:false});assert.equal(JSON.stringify(q),saved);
 const result=evaluate([task('a',{title:'One contiguous phrase'}),task('b',{reference:'contiguous phrase',categoryId:'c2'})],q,' CONTIGUOUS PHRASE ',opts);assert.equal(result.count,0);assert.equal(JSON.stringify(q),saved);assert.throws(()=>queryShape({...q,search:'phrase'}),/INVALID_QUERY/);
});
for(const view of defaults('owner',()=>null))test(`default View ${view.id} evaluates full eligible population with its approved scope/grouping`,()=>{
 const rows=[task('open'),task('done',{lifecycle:'Closed',closureOutcome:'Done',actualEnd:T('2026-10-20T08:00Z')}),task('cancelled',{lifecycle:'Closed',closureOutcome:'Cancelled'}),task('deleted',{deletedAt:T('2026-10-19T08:00Z')}),task('deletedClosed',{lifecycle:'Closed',closureOutcome:'Done',deletedAt:T('2026-10-19T08:00Z')})];
 const result=evaluate(rows,{...view.data.query,dateBuckets:[7,30,90]},'',opts);assert.deepEqual(result.tasks.map(t=>t.id),view.id==='completed'?['done']:view.id==='deleted'?['deleted','deletedClosed']:['open']);assert.equal(result.groups.reduce((n,g)=>n+g.tasks.length,0),result.count);
});
test('burn rate uses distinct current Task state, excludes deletion and ignores historical closure multiplicity',()=>{
 const rows=[task('open'),task('done',{lifecycle:'Closed',actualEnd:T('2026-10-20T08:00Z')}),task('deleted',{deletedAt:T('2026-10-19T08:00Z')}),task('reopened',{actualEnd:null})];const b=burnRate([...rows,rows[1]],{now});assert.equal(b.length,8);assert.equal(b.reduce((n,x)=>n+x.newCount,0),3);assert.equal(b.reduce((n,x)=>n+x.closedCount,0),1);assert.equal(b.at(-1).partial,true);assert.equal(b[0].from,Date.parse('2026-10-13T00:00+05:30'));
});
test('burn rate calendar weeks/months handle Monday boundary, year/leap changes and supported period ranges',()=>{
 const week=burnRate([],{now,unit:'weeks',n:4});assert.equal(week.at(-1).from,Date.parse('2026-10-19T00:00+05:30'));const month=burnRate([],{now:Date.parse('2028-03-31T10:00Z'),unit:'months',n:3});assert.equal(month[0].from,Date.parse('2027-12-01T00:00+05:30'));assert.equal(month.at(-1).from,Date.parse('2028-03-01T00:00+05:30'));assert.throws(()=>burnRate([],{unit:'days',n:90}),/INVALID_BURN_PERIOD/);
});
test('invalid bucket/filter definitions fail closed instead of producing incomplete results',()=>{
 for(const dateBuckets of [[0,7,30],[7,7,30],[7,30],[7,30,'90']])assert.throws(()=>queryShape(Q({dateBuckets})),/INVALID_DATE_BUCKETS/);
 for(const filters of [{Other:[]},{Category:{c1:false}},{Pause:['Unknown']},{Due:{presence:'set',from:2,until:1}}])assert.throws(()=>queryShape(Q({filters})),/INVALID/);
});
test('online commit does not enqueue offline writes or silently retry an unknown outcome',async()=>{
 let calls=0;const options={projectId:'demo-taskify-query-workload',writes:[],getToken:async()=>'',fetcher:async()=>{calls++;throw new TypeError('network down')}};
 await assert.rejects(commitOnline({...options,online:false}),e=>e.code==='OFFLINE_WRITE_DISABLED');assert.equal(calls,0);await assert.rejects(commitOnline(options),e=>e.code==='WRITE_OUTCOME_UNKNOWN');assert.equal(calls,1);await new Promise(r=>setTimeout(r,20));assert.equal(calls,1);
});
test('capacity model uses agreed workload and exposes reconnect, payload and backlog sensitivities',()=>{
 const base=workload();assert.ok(base.estimatedReadsPerDay<50000);assert.ok(base.estimatedWritesPerDay<20000);assert.equal(base.commentsPerDay,12*30*3/7);assert.ok(workload({extraReconnects:3}).readQuotaExceeded);assert.ok(backlog().retained>500);assert.ok(workload({retained:backlog().retained}).readQuotaExceeded);
});
