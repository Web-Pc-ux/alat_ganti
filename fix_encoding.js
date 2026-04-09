import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, 'script.js');
let content = fs.readFileSync(scriptPath, 'utf8');

const replacements = [
    { from: /ðŸš€/g, to: '🚀' },
    { from: /â Œ/g, to: '❌' },
    { from: /ðŸ”„/g, to: '🔄' },
    { from: /ðŸ” /g, to: '🔍' },
    { from: /ðŸ“¦/g, to: '📦' },
    { from: /✓ ï¸ /g, to: '✏️' },
    { from: /✓ ï¸ /g, to: '📝' }, // Handle variation
    { from: /\u00e2\u0153\u201c/g, to: '✓' },
    { from: /ï¸ /g, to: '' }, // Remove lingering variation selectors
    { from: /âœ“/g, to: '✓' }
];

replacements.forEach(r => {
    content = content.replace(r.from, r.to);
});

// Specific fixes for lines I saw
content = content.replace(/onclick="promptEditRequest\(\$\{r\.id\}\)"\>✓/g, 'onclick="promptEditRequest(${r.id})">✏️');
content = content.replace(/textContent = '✓  Edit Permohonan'/g, "textContent = '📝 Edit Permohonan'");

fs.writeFileSync(scriptPath, content, 'utf8');
console.log('✅ script.js encoding fixed!');
