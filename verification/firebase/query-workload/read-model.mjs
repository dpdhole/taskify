// Isolated feasibility adapter: full UID-scoped metadata listener; no child reads.
import {select as fullSelect,evaluate} from './query-engine.mjs';
export class TaskStore {
 constructor(){this.tasks=new Map();this.categories=new Map();this.locations=new Map();this.ready=false;this.error=null;this.epoch=0;this.observers=new Set();this.stops=[];this.uid=null;this.readPaths=[]}
 emit(){for(const cb of this.observers)cb(this)}
 subscribe(cb){this.observers.add(cb);return()=>this.observers.delete(cb)}
 clear(){this.epoch++;for(const stop of this.stops)stop();this.stops=[];this.tasks.clear();this.categories.clear();this.locations.clear();this.ready=false;this.error=null;this.uid=null;this.emit()}
 connect(db,uid){this.clear();this.uid=uid;const epoch=this.epoch,loaded=new Set();
  for(const [kind,target]of [['tasks',this.tasks],['categories',this.categories],['locations',this.locations]]){
   const path=`users/${uid}/${kind}`;this.readPaths.push(path);
   this.stops.push(db.collection(path).onSnapshot({includeMetadataChanges:true},snap=>{
    if(epoch!==this.epoch)return;
    // Cache-only data must not be advertised as the complete authoritative population.
    if(snap.metadata.fromCache||snap.metadata.hasPendingWrites){loaded.delete(kind);this.ready=false;this.emit();return}
    target.clear();for(const d of snap.docs)target.set(d.id,{...d.data(),id:d.id});loaded.add(kind);this.ready=loaded.size===3;this.error=null;this.emit();
   },error=>{if(epoch!==this.epoch)return;this.ready=false;this.error=error;this.emit()}));
  }
 }
 result(q,phrase=''){if(!this.ready)throw new Error('POPULATION_NOT_READY');return select([...this.tasks.values()],q,phrase,this.categories,this.locations)}
 view(q,phrase='',options={}){if(!this.ready)throw new Error('POPULATION_NOT_READY');return evaluate([...this.tasks.values()],q,phrase,{...options,categories:this.categories,locations:this.locations})}
}
export function select(tasks,q,phrase='',categories=new Map(),locations=new Map()){
 // Legacy test fixture representation only; persisted ID filters use maps of ID -> true.
 const filters={...q.filters};if(Array.isArray(filters.Category))filters.Category=Object.fromEntries(filters.Category.map(id=>[id,true]));if(Array.isArray(filters.Location))filters.Location={ids:Object.fromEntries(filters.Location.filter(id=>id!==null).map(id=>[id,true])),includeUnspecified:filters.Location.includes(null)};
 return fullSelect(tasks,{sortField:'Due',sortDirection:'asc',deletedFilter:null,...q,filters},phrase,categories,locations);
}
export function categoryGroups(tasks,categories,order){
 const groups=order.map(id=>({id,label:categories.get(id)?.name??id,ids:[]}));const byId=new Map(groups.map(g=>[g.id,g]));
 const unknown={id:'Unspecified',label:'Unspecified',ids:[]};
 for(const t of tasks)(byId.get(t.categoryId)??unknown).ids.push(t.id);
 if(unknown.ids.length)groups.push(unknown);return groups;
}
export function searchSubmit(currentView,text){const phrase=text.trim();if(!currentView&&!phrase)return null;return{view:currentView??'allTasks',phrase}}
export function workspaceNavigate(state,destination){return destination==='detail'||destination==='back'?{...state}:{...state,phrase:''}}
