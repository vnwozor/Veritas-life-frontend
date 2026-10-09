/* Run the whole thing on your computer, exactly like Vercel would:
   node dev-server.js  →  http://localhost:3000 (game) and http://localhost:3000/admin
   Without Upstash env vars it uses an in-memory database (resets when you stop it). */
const http = require('http'), fs = require('fs'), path = require('path');
const api = require('./api/index.js');
const shop = require('./api/korapay.js');
const R = require('./lib/redis');
const PORT = +process.env.PORT || 3000, ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/shop/')) { req.query = Object.fromEntries(u.searchParams); req.query.p = u.pathname.replace(/^\/api\/shop\/?/, ''); return shop(req, res); }
  if (u.pathname.startsWith('/api/') || u.pathname === '/api') { req.query = Object.fromEntries(u.searchParams); req.query.p = u.pathname.replace(/^\/api\/?/, ''); return api(req, res); }
  let f = u.pathname === '/' ? '/index.html' : u.pathname; if (!path.extname(f)) f += '.html';
  const p = path.join(ROOT, path.normalize(f)); if (!p.startsWith(ROOT) || /\/(api|lib|node_modules)\//.test(p.slice(ROOT.length)) || !fs.existsSync(p)) { res.writeHead(404); return res.end('Not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(PORT, () => console.log('VERITAS LIFE · http://localhost:' + PORT + '  · admin: http://localhost:' + PORT + '/admin  · database: ' + (R.mock ? 'in-memory' : 'Upstash')));
