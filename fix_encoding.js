const fs = require('fs');
const path = 'd:\\Webmaker\\website-vibe-alatganti\\script.js';

let content = fs.readFileSync(path, 'utf8');

// Fix all broken emoji patterns using simple string replacement
// The broken patterns come from double-encoding UTF-8

// Pattern: broken checkmark
content = content.split('\u00e2\u0153\u201c').join('\u2713');  // â✓
content = content.split('\u00e2\u0153\u0178').join('\u270f\ufe0f'); // â✏️ 

// Try line-by-line approach for known broken strings
const lines = content.split('\n');
const fixedLines = lines.map(line => {
    // Fix common broken notification strings
    line = line.replace(/showNotification\('\[OK\]/g, "showNotification('✓");
    line = line.replace(/\u00e2\u0153\u201c/g, '✓');
    return line;
});

content = fixedLines.join('\n');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
