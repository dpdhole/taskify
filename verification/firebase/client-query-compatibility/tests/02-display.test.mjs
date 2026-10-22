import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveIndia,deadlineLabel} from '../planned-dates.mjs';
test('travel preserves displayed selected EOD day and India 16:00 deadline',()=>{
 const original=process.env.TZ;
 try {
  for(const host of ['Asia/Kolkata','Europe/London']) {
   process.env.TZ=host;
   assert.equal(deadlineLabel(resolveIndia({day:'2026-10-20',precision:'date'},true)),'20/10/2026, EOD · IST');
   assert.equal(deadlineLabel(resolveIndia({day:'2026-10-20',clock:'16:00'},true)),'20/10/2026, 16:00 · IST');
  }
 } finally {if(original===undefined)delete process.env.TZ;else process.env.TZ=original;}
});
