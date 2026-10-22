export const defaultIds=['focus','scheduled','priority','local','completed','deleted','allTasks'];
export const query=(groupBy='Category',sortField='Due',sortDirection='asc',includeClosed=false,includeDeleted=false,closureReasons=[],deletedFilter=null)=>({groupBy,sortField,sortDirection,includeClosed,includeDeleted,closureReasons,deletedFilter});
export function defaults(user,stamp) {
 const names=['Focus','Scheduled','Priority','Local','Completed','Deleted','All Tasks'];
 const queries=[query('Due'),query('PlannedStart','PlannedStart'),query('Priority'),query('Location'),query('ActualEnd','ActualEnd','desc',true,false,['Done']),query('DeletedAt','DeletedAt','desc',true,true,[],'set'),query()];
 return defaultIds.map((id,i)=>({id,data:{ownerUid:user,name:names[i],query:queries[i],showOnHome:true,version:0,createdAt:stamp(),updatedAt:stamp()}}));
}
