import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

// Replace all occurrences of broken checkmark and variation selectors
content = content.replace(/✓ ï¸ /g, '✏️');
content = content.replace(/â Œ/g, '❌');
content = content.replace(/âœ“/g, '✓');

fs.writeFileSync(scriptPath, content, 'utf8');
console.log('Final encoding fix done!');
