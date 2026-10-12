/* VERITAS LIFE on your own server (a VPS such as Hostinger KVM 2).
   One Node process serves the game files, the /api routes and live connections (WebSockets) on /ws.
     PORT=3000 REDIS_URL=redis://127.0.0.1:6379 ADMIN_PASSWORD=... node server.js
   Live connections: each player keeps one connection open, syncs every few seconds over it, and is
   poked the instant a message, money or an event arrives, instead of asking over and over. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const api = require('./api/index.js');
const shop = require('./api/korapay.js');
const R = require('./lib/redis');
const PORT = +process.env.PORT || 3000, ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.bin': 'application/octet-stream', '.txt': 'text/plain; charset=utf-8' };

/* static files, gzipped once and kept in memory */
const cache = new Map();
function serveFile(req, res, f) {
  const p = path.join(ROOT, path.normalize(f));
  if (!p.startsWith(ROOT + path.sep) || /[\\/](api|lib|node_modules|tools|\.git)[\\/]/.test(p.slice(ROOT.length)) || /server\.js$|dev-server\.js$|\.env/.test(p) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  const st = fs.statSync(p); let c = cache.get(p);
  if (!c || c.m !== st.mtimeMs) { const raw = fs.readFileSync(p); const ext = path.extname(p); const zip = /\.(html|js|css|json|svg|txt|bin)$/.test(ext) && raw.length > 1024; c = { m: st.mtimeMs, raw, gz: zip ? zlib.gzipSync(raw, { level: 9 }) : null, type: MIME[ext] || 'application/octet-stream' }; cache.set(p, c); }
  const gz = c.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  res.writeHead(200, { 'Content-Type': c.type, 'Cache-Control': /index\.html$/.test(p) ? 'no-cache' : 'public, max-age=3600', ...(gz ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}) });
  res.end(gz ? c.gz : c.raw);
}
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/api/shop/')) { req.query = Object.fromEntries(u.searchParams); req.query.p = u.pathname.replace(/^\/api\/shop\/?/, ''); return shop(req, res); }
  if (u.pathname.startsWith('/api/') || u.pathname === '/api') { req.query = Object.fromEntries(u.searchParams); req.query.p = u.pathname.replace(/^\/api\/?/, ''); return api(req, res); }
  let f = u.pathname === '/' ? '/index.html' : decodeURIComponent(u.pathname); if (!path.extname(f)) f += '.html';
  serveFile(req, res, f);
});

/* live connections */
let WSS = null;
try { const { WebSocketServer } = require('ws'); WSS = new WebSocketServer({ server, path: '/ws', maxPayload: 256 * 1024 }); } catch (e) { console.log('Live connections off (' + e.message + '); players fall back to normal syncing.'); }
const conns = new Map(); /* user id -> set of sockets */
if (WSS) {
  api.pokers.push(uid => { const set = conns.get(uid); if (set) for (const ws of set) if (ws.readyState === 1) ws.send('{"t":"poke"}'); });
  WSS.on('connection', async (ws, req) => {
    const t = new URL(req.url, 'http://x').searchParams.get('token');
    let me = null; try { me = await api.sessionUser(t); } catch (e) { }
    if (!me) { ws.send(JSON.stringify({ t: 'auth', ok: false })); return ws.close(4001); }
    if (!conns.has(me)) conns.set(me, new Set()); conns.get(me).add(ws); ws.send(JSON.stringify({ t: 'auth', ok: true }));
    let busy = false, last = 0;
    ws.on('message', async raw => {
      if (busy) return; const nowT = Date.now(); if (nowT - last < 120) return; last = nowT; busy = true; /* one sync at a time, at most ~8 a second */
      let b = null; try { b = JSON.parse(raw); } catch (e) { busy = false; return; }
      try { const r = await api.doSync(me, b || {}); if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'sync', id: b && b.id, code: r.code, body: r.body })); }
      catch (e) { console.error('ws sync', e.message); if (ws.readyState === 1) ws.send(JSON.stringify({ t: 'sync', id: b && b.id, code: 500, body: {} })); }
      finally { busy = false; }
    });
    ws.on('close', () => { const set = conns.get(me); if (set) { set.delete(ws); if (!set.size) conns.delete(me); } });
    ws.on('error', () => { });
  });
  /* drop dead connections every 30 s */
  setInterval(() => { for (const ws of WSS.clients) { if (ws.alive === false) { ws.terminate(); continue; } ws.alive = false; try { ws.ping(); } catch (e) { } } }, 30000);
  WSS.on('connection', ws => { ws.alive = true; ws.on('pong', () => { ws.alive = true; }); });
}
server.listen(PORT, () => console.log('VERITAS LIFE · http://localhost:' + PORT + ' · database: ' + R.kind + ' · live connections: ' + (WSS ? 'on' : 'off')));
