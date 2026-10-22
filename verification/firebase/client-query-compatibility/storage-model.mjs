// Document/single-field index estimate from the documented Firestore size formula.
// This is not a measurement of billed storage or index provisioning.
const stringSize=s=>Buffer.byteLength(s,'utf8')+1;
export const nameSize=p=>p.split('/').reduce((n,s)=>n+stringSize(s),16);
export function valueSize(v){
 if(v==null||typeof v==='boolean')return 1;if(typeof v==='number'||typeof v.toMillis==='function')return 8;if(typeof v==='string')return stringSize(v);if(Array.isArray(v))return v.reduce((n,x)=>n+valueSize(x),0);return Object.entries(v).reduce((n,[key,x])=>n+stringSize(key)+valueSize(x),32);
}
export const documentSize=(path,data)=>nameSize(path)+Object.entries(data).reduce((n,[key,v])=>n+stringSize(key)+valueSize(v),32);
export function automaticIndexSize(path,data,{exempt=[]}={}){
 const parent=path.split('/').slice(0,-2).join('/'),overhead=nameSize(path)+(parent?nameSize(parent):0)+32;let bytes=0,entries=0;
 const visit=(value,field)=>{if(exempt.some(p=>field===p||field.startsWith(p+'.')))return;bytes+=2*(overhead+stringSize(field)+Math.min(valueSize(value),1500));entries+=2;
  if(Array.isArray(value)){for(const v of new Set(value)){bytes+=overhead+stringSize(field)+Math.min(valueSize(v),1500);entries++}}
  else if(value&&typeof value==='object'&&typeof value.toMillis!=='function')for(const [key,v]of Object.entries(value))visit(v,field+'.'+key);
 };for(const [key,v]of Object.entries(data))visit(v,key);return {bytes,entries};
}
