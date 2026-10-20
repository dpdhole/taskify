import {test} from 'node:test';import assert from 'node:assert/strict';import {documentSize,automaticIndexSize,valueSize} from '../storage-model.mjs';
import {workload,cleanupCost} from '../workload-model.mjs';import {encodeQuery,decodeQuery} from '../query-codec.mjs';
test('storage estimator reproduces official simple document and single-field index examples',()=>{
 assert.equal(documentSize('users/jeff/tasks/my_task_id',{type:'Personal',done:false,priority:1,description:'Learn Cloud Firestore'}),147);
 assert.equal(automaticIndexSize('users/jeff/tasks/my_task_id',{done:false}).bytes,218);
});
test('map snapshots create index fanout; parent exemptions remove all descendant indexes',()=>{
 const data={before:{title:'Old',version:0},after:{title:'New',version:1},createdAt:1};const all=automaticIndexSize('users/u/tasks/t/activityEvents/v1',data),exempt=automaticIndexSize('users/u/tasks/t/activityEvents/v1',data,{exempt:['before','after']});assert.equal(all.entries,14);assert.equal(exempt.entries,2);assert.ok(all.bytes>exempt.bytes*5);assert.equal(valueSize({x:null}),35);
});
test('capacity estimates include write Rules dependencies and keep manual cleanup separate',()=>{
 const budget=workload();assert.ok(budget.conservativeMaximumReadBudget>budget.estimatedReadsPerDay);assert.ok(budget.estimatedReadsPerDay>budget.clientAndDetailRuleReads);assert.ok(budget.conservativeMaximumReadBudget<50000);assert.equal(cleanupCost({tasks:1000}).deletes,9000);assert.equal(cleanupCost({tasks:1000}).writesIncludingSoftDelete,13000);assert.ok(cleanupCost({tasks:1000}).sourceEstimatedReads>50000);
});
test('provider query date triples preserve logical named fields exactly without persisting Search',()=>{
 const q={groupBy:'Category',filters:{Due:{presence:'set',from:1,until:3},Location:{ids:{l1:true},includeUnspecified:true}}};const encoded=encodeQuery(q);assert.deepEqual(encoded.filters.slice(5,8),['set',1,3]);assert.equal(encoded.filters.length,29);assert.deepEqual(decodeQuery(encoded),q);assert.equal(encoded.search,undefined);
});
