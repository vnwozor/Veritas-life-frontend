/* VERITAS LIFE on Cloudflare.
   - The game files (index.html, vendor/…) are served straight from Cloudflare's edge (free, unlimited).
   - /api/* and the live connection /ws go to ONE Durable Object, "Game": the same game server code as on
     Vercel (api/index.js, api/korapay.js), but its data lives in the Durable Object's own SQLite storage
     instead of Upstash. Players keep one live connection (WebSocket) open instead of calling the server
     every second, which keeps the game inside Cloudflare's free limits. */
import { DurableObject } from 'cloudflare:workers';
import { Buffer } from 'node:buffer';
import nodeProcess from 'node:process';
if (!globalThis.Buffer) globalThis.Buffer = Buffer;
if (!globalThis.process) globalThis.process = nodeProcess;
if (!process.env) process.env = {};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/ws' || url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const stub = env.GAME.get(env.GAME.idFromName('main'));
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  }
};

/* keys that only matter while people are online: never written to storage */
const EPHEMERAL = /^(pos:|zl:|rl:)|^z:online$/;
/* a player's full save is written to storage at most every 3 minutes (always kept current in memory,
   and written at once when they close the game or go offline) */
const SLOW = /^state:/;
const SLOW_MS = 180000;

export class Game extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, t TEXT, v TEXT, exp INTEGER)');
    for (const [k, v] of Object.entries(env || {})) if (typeof v === 'string') process.env[k] = v;
    process.env.ON_CLOUDFLARE = '1';
    const R = require('../lib/redis');
    this.loaded = new Set(); this.inDb = new Set(); this.due = new Map();
    const E = this.E = R.makeEngine({ load: k => this.load(k), changed: k => this.changed(k) });
    R.use(async cmds => { const r = cmds.map(E.one); this.flushDue(); return r; }, 'durable-object');
    R.flush = async k => { if (k) { if (this.due.has(k)) this.write(k); } else this.flushAll(); };
    this.R = R;
    this.api = require('../api/index.js');
    this.shop = require('../api/korapay.js');
    this.socks = new Map();
    this.api.pokers.push(uid => { const set = this.socks.get(+uid); if (set) for (const ws of set) { try { ws.send('{"t":"poke"}'); } catch (e) { } } });
    this.timer = setInterval(() => { try { this.flushDue(); } catch (e) { console.error('flush', e); } }, 20000);
  }

  /* ---------- storage: load a key the first time it is used, write it back when it changes ---------- */
  load(k) {
    if (this.loaded.has(k)) return; this.loaded.add(k); if (EPHEMERAL.test(k)) return;
    const row = this.sql.exec('SELECT t, v, exp FROM kv WHERE k = ?', k).toArray()[0]; if (!row) return;
    this.inDb.add(k);
    if (row.exp && row.exp <= Date.now()) { this.due.set(k, 0); return; }
    const E = this.E; const t = row.t;
    const val = t === 's' ? row.v : t === 'h' || t === 'z' ? new Map(JSON.parse(row.v)) : t === 'S' ? new Set(JSON.parse(row.v)) : JSON.parse(row.v);
    E.M.set(k, val); E.TY.set(k, t); if (row.exp) E.EXP.set(k, row.exp); else E.EXP.delete(k);
  }
  changed(k) { if (EPHEMERAL.test(k)) return; if (SLOW.test(k)) { if (!this.due.has(k)) this.due.set(k, Date.now() + SLOW_MS); } else this.due.set(k, 0); }
  write(k) {
    this.due.delete(k); const E = this.E;
    if (!E.alive(k)) { if (this.inDb.has(k)) { this.sql.exec('DELETE FROM kv WHERE k = ?', k); this.inDb.delete(k); } return; }
    const t = E.TY.get(k) || 's', v = E.M.get(k);
    const enc = t === 's' ? String(v) : t === 'l' ? JSON.stringify(v) : JSON.stringify([...v]);
    this.sql.exec('INSERT OR REPLACE INTO kv (k, t, v, exp) VALUES (?, ?, ?, ?)', k, t, enc, E.EXP.get(k) || null); this.inDb.add(k);
  }
  flushDue() { const now = Date.now(); for (const [k, at] of [...this.due]) if (at <= now) this.write(k); }
  flushAll() { for (const k of [...this.due.keys()]) this.write(k); }

  /* ---------- requests ---------- */
  async fetch(request) {
    for (const [k, v] of Object.entries(this.env || {})) if (typeof v === 'string') process.env[k] = v;
    const url = new URL(request.url);
    if (url.pathname === '/ws') return this.live(request, url);
    if (url.pathname === '/api/admin/import' && request.method === 'POST') return this.importUpstash(request);
    if (url.pathname === '/api/admin/storage') return this.storageInfo(request);
    return this.http(request, url);
  }

  /* Node-style req/res for the existing handlers */
  async http(request, url) {
    const shop = url.pathname.startsWith('/api/shop/');
    const query = Object.fromEntries(url.searchParams); query.p = url.pathname.replace(shop ? /^\/api\/shop\/?/ : /^\/api\/?/, '');
    const headers = {}; request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    headers['x-forwarded-for'] = request.headers.get('cf-connecting-ip') || headers['x-forwarded-for'] || '';
    let body = undefined; if (request.method === 'POST') { const txt = await request.text(); try { body = txt ? JSON.parse(txt) : {}; } catch (e) { body = {}; } }
    const req = { method: request.method, url: url.pathname + url.search, headers, query, body, socket: { remoteAddress: headers['x-forwarded-for'] } };
    return new Promise(resolve => {
      const res = { statusCode: 200, h: {}, setHeader(k, v) { this.h[k] = v; }, getHeader(k) { return this.h[k]; }, writeHead(c, hh) { this.statusCode = c; Object.assign(this.h, hh || {}); return this; },
        end(b) { const st = this.statusCode; resolve(new Response(st === 204 || st === 304 ? null : (b == null ? '' : b), { status: st, headers: this.h })); } };
      Promise.resolve((shop ? this.shop : this.api)(req, res)).catch(e => { console.error(e); resolve(new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })); });
    });
  }

  /* the live connection: syncs travel over it, and the server pokes a player when something arrives for them */
  async live(request, url) {
    if (request.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const pair = new WebSocketPair(); const [client, ws] = Object.values(pair); ws.accept();
    const id = await this.api.sessionUser(url.searchParams.get('token'));
    if (!id) { ws.send(JSON.stringify({ t: 'auth', ok: false })); ws.close(1008, 'auth'); return new Response(null, { status: 101, webSocket: client }); }
    let set = this.socks.get(id); if (!set) this.socks.set(id, set = new Set()); set.add(ws);
    ws.send(JSON.stringify({ t: 'auth', ok: true }));
    ws.addEventListener('message', async ev => {
      let m = null; try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : new TextDecoder().decode(ev.data)); } catch (e) { return; }
      const rid = m.id; delete m.id; let r;
      try { r = await this.api.doSync(id, m); } catch (e) { console.error('sync', e); r = { code: 500, body: { error: 'Server error' } }; }
      try { ws.send(JSON.stringify({ t: 'sync', id: rid, code: r.code, body: r.body })); } catch (e) { }
    });
    const gone = () => { const s = this.socks.get(id); if (s) { s.delete(ws); if (!s.size) { this.socks.delete(id); this.R.flush('state:' + id); } } if (!this.socks.size) this.flushAll(); };
    ws.addEventListener('close', gone); ws.addEventListener('error', gone);
    return new Response(null, { status: 101, webSocket: client });
  }

  async isAdmin(request) { const h = request.headers.get('authorization') || ''; const t = h.startsWith('Bearer ') ? h.slice(7) : ''; return !!(t && await this.R.cmd('GET', 'adm:' + t)); }
  json(o, code) { return new Response(JSON.stringify(o), { status: code || 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } }); }

  /* how much the game has stored (for the admin) */
  async storageInfo(request) {
    if (!(await this.isAdmin(request))) return this.json({ error: 'Not allowed' }, 401);
    const n = this.sql.exec('SELECT COUNT(*) AS n, SUM(LENGTH(v)) AS b FROM kv').toArray()[0];
    return this.json({ keys: n.n, bytes: n.b || 0, online: this.socks.size, pending: this.due.size });
  }

  /* one-time move from Upstash: copies every player, save, message and setting into this server.
     Needs IMPORT_URL and IMPORT_TOKEN (your Upstash REST URL and token) set in Cloudflare. */
  async importUpstash(request) {
    if (!(await this.isAdmin(request))) return this.json({ error: 'Log in to the admin website first.' }, 401);
    const U = (process.env.IMPORT_URL || '').replace(/\/+$/, ''), T = process.env.IMPORT_TOKEN || '';
    if (!U || !T) return this.json({ error: 'Set IMPORT_URL and IMPORT_TOKEN (from Upstash) in Cloudflare first.' }, 400);
    const up = async cmds => { const r = await fetch(U + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + T, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds.map(c => c.map(String))) });
      if (!r.ok) throw new Error('Upstash ' + r.status + ': ' + (await r.text()).slice(0, 200)); return (await r.json()).map(x => { if (x.error) throw new Error(x.error); return x.result; }); };
    try {
      const keys = []; let cur = '0', guard = 0;
      do { const [res] = await up([['SCAN', cur, 'COUNT', 1000]]); cur = String(res[0]); keys.push(...res[1]); } while (cur !== '0' && ++guard < 40);
      const todo = [...new Set(keys)].filter(k => !EPHEMERAL.test(k)); let copied = 0; const E = this.E;
      for (let i = 0; i < todo.length; i += 250) {
        const chunk = todo.slice(i, i + 250); const types = await up(chunk.map(k => ['TYPE', k]));
        const cmds = []; chunk.forEach((k, j) => { const t = types[j]; cmds.push(t === 'string' ? ['GET', k] : t === 'hash' ? ['HGETALL', k] : t === 'set' ? ['SMEMBERS', k] : t === 'zset' ? ['ZRANGE', k, 0, -1, 'WITHSCORES'] : t === 'list' ? ['LRANGE', k, 0, -1] : ['TYPE', k]); cmds.push(['PTTL', k]); });
        const vals = await up(cmds);
        chunk.forEach((k, j) => { const t = types[j], v = vals[j * 2], ttl = +vals[j * 2 + 1]; let val, ty;
          if (t === 'string') { val = String(v); ty = 's'; } else if (t === 'hash') { val = new Map(); for (let a = 0; a < v.length; a += 2) val.set(String(v[a]), String(v[a + 1])); ty = 'h'; }
          else if (t === 'set') { val = new Set(v.map(String)); ty = 'S'; } else if (t === 'zset') { val = new Map(); for (let a = 0; a < v.length; a += 2) val.set(String(v[a]), +v[a + 1]); ty = 'z'; }
          else if (t === 'list') { val = v.map(String); ty = 'l'; } else return;
          this.loaded.add(k); E.M.set(k, val); E.TY.set(k, ty); if (ttl > 0) E.EXP.set(k, Date.now() + ttl); else E.EXP.delete(k); this.write(k); copied++; });
      }
      return this.json({ ok: true, found: keys.length, copied });
    } catch (e) { return this.json({ error: String(e.message || e) }, 502); }
  }
}
