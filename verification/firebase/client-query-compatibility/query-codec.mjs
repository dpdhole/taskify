// Provider adapter representation: date-filter triples reduce Rules evaluation cost.
// Logical query ports retain named presence/from/until fields.
import {dateFields,priorityOrder,lifecycleOrder} from './query-engine.mjs';
export const filterOrder=['Category','Location','Lifecycle','Priority','Pause',...Object.keys(dateFields)];
const enums={Lifecycle:lifecycleOrder,Priority:priorityOrder,Pause:['None','Timed','Expired','Indefinite']};
export function encodeQuery(q){
 if(q.filters===undefined)return {...q};if(Object.keys(q.filters).some(k=>!filterOrder.includes(k)))throw new Error('INVALID_FILTER');
 const f=q.filters,filters=[f.Category??null,f.Location??null];
 for(const key of ['Lifecycle','Priority','Pause']){const values=f[key];filters.push(!values?.length?null:values.some(v=>!enums[key].includes(v))?'INVALID':values.reduce((mask,v)=>mask|1<<enums[key].indexOf(v),0))}
 for(const key of Object.keys(dateFields)){const v=f[key];filters.push(v?.presence??null,v?.from??null,v?.until??null)}return {...q,filters};
}
export function decodeQuery(q){
 if(q.filters===undefined)return {...q};if(!Array.isArray(q.filters)||q.filters.length!==29)throw new Error('INVALID_PERSISTED_FILTER');
 const a=q.filters,filters={};if(a[0]!==null)filters.Category=a[0];if(a[1]!==null)filters.Location=a[1];
 ['Lifecycle','Priority','Pause'].forEach((key,i)=>{const mask=a[i+2];if(mask!==null){if(!Number.isInteger(mask)||mask<1||mask>2**enums[key].length-1)throw new Error('INVALID_PERSISTED_FILTER');filters[key]=enums[key].filter((v,j)=>mask&(1<<j))}});
 Object.keys(dateFields).forEach((key,i)=>{const index=5+i*3;if(a[index]!==null)filters[key]={presence:a[index],from:a[index+1],until:a[index+2]}});return {...q,filters};
}
