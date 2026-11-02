// Copies the original static web app (unchanged) into www/ for Capacitor.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ['index.html', 'css', 'js']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('Copied web assets to www/');
