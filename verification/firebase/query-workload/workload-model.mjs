// Capacity arithmetic, not measured Firebase billing. Inputs/sensitivities are explicit.
export const quota={reads:50000,writes:20000,deletes:20000,storage:1073741824,egress:10737418240,hostingBytesPerDay:360000000};
export function workload({users=12,newPerDay=5,active=30,discussionPerWeek=3,opens=6,retained=500,classificationDocs=7,ancillaryDocs=12,extraReconnects=0,detailPagesPerUser=3,pageSize=25,metadataUpdatesPerUser=10,taskBytes=1000,commentBytes=1000,eventBytes=2400,retentionDays=92}={}){
 const created=users*newPerDay,comments=users*active*discussionPerWeek/7;
 // Model: one Start/new Task, 80% Close/new Task; comment creation updates root/event/inventory.
 const events=created*1.8+comments,writeChanges=created+created*1.8+comments+users*metadataUpdatesPerUser;
 const freshLoads=users*(opens+extraReconnects),baseReads=freshLoads*(retained+classificationDocs+ancillaryDocs);
 const detailReads=users*detailPagesPerUser*(pageSize+1); // One page + one parent Rules-dependent read.
 const sourceEstimatedWriteRuleReads=created*5+created*1.8*5+comments*6+users*metadataUpdatesPerUser*2;
 const maximumBudgetWriteRuleReads=created*10+(created*1.8+comments)*20+users*metadataUpdatesPerUser*10;
 const readsBeforeWriteRules=baseReads+detailReads+writeChanges;
 const reads=readsBeforeWriteRules+sourceEstimatedWriteRuleReads;
 const writes=created+created*1.8*3+comments*4+users*metadataUpdatesPerUser;
 const estimatedDocuments=users*retained*taskBytes+comments*retentionDays*commentBytes+events*retentionDays*eventBytes;
 const egress=freshLoads*retained*taskBytes*30+users*detailPagesPerUser*pageSize*Math.max(commentBytes,eventBytes)*30;
 return {inputs:{users,newPerDay,active,discussionPerWeek,opens,retained,classificationDocs,ancillaryDocs,extraReconnects,detailPagesPerUser,pageSize,metadataUpdatesPerUser,taskBytes,commentBytes,eventBytes,retentionDays},createdPerDay:created,commentsPerDay:comments,eventsPerDay:events,clientAndDetailRuleReads:Math.ceil(readsBeforeWriteRules),sourceEstimatedWriteRuleReads:Math.ceil(sourceEstimatedWriteRuleReads),maximumBudgetWriteRuleReads:Math.ceil(maximumBudgetWriteRuleReads),conservativeMaximumReadBudget:Math.ceil(readsBeforeWriteRules+maximumBudgetWriteRuleReads),estimatedReadsPerDay:Math.ceil(reads),estimatedWritesPerDay:Math.ceil(writes),estimatedDocumentBytes:Math.ceil(estimatedDocuments),storageWithIndexSensitivity:{twoTimes:Math.ceil(estimatedDocuments*2),fourTimes:Math.ceil(estimatedDocuments*4)},estimatedMonthlyEgressBytes:Math.ceil(egress),readsRemaining:Math.floor(quota.reads-reads),readQuotaExceeded:reads>quota.reads,writeQuotaExceeded:writes>quota.writes};
}
export function cleanupCost({tasks,childrenPerTask=8}){
 const children=Math.ceil(tasks*childrenPerTask);return {tasks,childrenPerTask,children,writesIncludingSoftDelete:children+tasks*5,deletes:children+tasks,sourceEstimatedReads:children*8+tasks*20,maximumBudgetReads:children*24+tasks*56,assumption:'illustrative eligible backlog; not an approved cleanup schedule'};
}
export function backlog({days=365,newPerDay=5,weeklyUnfinishedFraction=.2,closedWindowDays=92,manualCleanupDelayDays=0}={}){
 const unfinished=Math.ceil(days*newPerDay*weeklyUnfinishedFraction),closed=Math.ceil(newPerDay*(1-weeklyUnfinishedFraction)*(closedWindowDays+manualCleanupDelayDays));
 return {days,unfinished,closed,retained:unfinished+closed};
}
