/* Copies the files players download into ./public, the folder Cloudflare serves.
   Server code (api/, lib/, cf/) and tools never go in there. Run by "wrangler deploy" (see wrangler.jsonc). */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'public');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const copy = (rel) => { const s = path.join(ROOT, rel), d = path.join(OUT, rel); if (!fs.existsSync(s)) return; const st = fs.statSync(s);
  if (st.isDirectory()) { fs.mkdirSync(d, { recursive: true }); for (const f of fs.readdirSync(s)) copy(path.join(rel, f)); } else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); } };
['index.html', 'online.js', 'online.css', 'pay.js', 'config.js', 'vendor', 'favicon.ico'].forEach(copy);
let n = 0; (function count(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? count(p) : n++; } })(OUT);
console.log('public/ ready:', n, 'files');
