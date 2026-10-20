import crypto from 'node:crypto';
export function prepareName(input) {
 const name=input.normalize('NFC').trim();
 const count=[...new Intl.Segmenter('en',{granularity:'grapheme'}).segment(name)].length;
 if(count<1||count>30)throw new Error('Name must contain 1–30 grapheme clusters');
 const nameKey=name.toLowerCase();return {name,nameKey,digest:crypto.createHash('sha256').update(nameKey).digest('hex').toUpperCase()};
}
