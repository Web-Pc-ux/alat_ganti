const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'script.js');

let content = fs.readFileSync(filePath, 'utf8');

// Find all unique broken sequences
const matches = new Set();
const regex = /[\u0080-\u00FF]{2,}/g;
let m;
while ((m = regex.exec(content)) !== null) {
    const seq = m[0];
    const hex = Buffer.from(seq, 'utf8').toString('hex');
    matches.add(JSON.stringify({ chars: seq, hex: hex, len: seq.length }));
}

console.log('Unique broken sequences found:');
for (const s of matches) {
    const obj = JSON.parse(s);
    console.log(`  hex: ${obj.hex}  chars: "${obj.chars}"  codepoints: ${[...obj.chars].map(c => 'U+' + c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ')}`);
}
