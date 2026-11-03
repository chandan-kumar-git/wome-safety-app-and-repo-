// Builds www/ for the Android app.
// 1) Copies the original static web app (index.html, manifest, assets/, css/, js/) unchanged.
//    sw.js is left out: the APK serves files locally, and a cache-first worker would keep stale files after updates.
// 2) Adds the Android app shell (mobile/) and links it into the COPY of index.html only.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const item of ['index.html', 'manifest.json', 'assets', 'css', 'js', 'mobile']) {
  fs.cpSync(path.join(root, item), path.join(out, item), { recursive: true });
}

const indexPath = path.join(out, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const inject = (marker, insert, where) => {
  if (!html.includes(marker)) throw new Error('copy-web: marker not found: ' + marker);
  html = html.replace(marker, where === 'before' ? insert + marker : marker + insert);
};
inject('<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">' +
  '\n  <meta name="theme-color" content="#FFFDFB">', 'replace');
html = html.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0">', '');
inject('<link rel="stylesheet" href="css/styles.css">', '\n  <link rel="stylesheet" href="mobile/app-shell.css">', 'after');
inject('<script src="js/app.js"></script>', '\n  <script src="mobile/app-shell.js"></script>', 'after');
fs.writeFileSync(indexPath, html);
console.log('Built www/ (original web app + Android app shell)');
