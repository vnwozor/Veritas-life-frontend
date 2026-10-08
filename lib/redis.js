/* Tiny Redis client.
   On Vercel: Upstash Redis over its REST API (env vars are added automatically when you
   connect "Upstash for Redis" from the Vercel Marketplace).
   Locally with no env vars: an in-memory Redis so you can try everything without an account. */
'use strict';
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

async function upstash(cmds) {
  const r = await fetch(URL_.replace(/\/+$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds.map(c => c.map(String))) });
  if (!r.ok) throw new Error('Redis error ' + r.status + ': ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  return j.map(x => { if (x.error) throw new Error('Redis: ' + x.error); return x.result; });
}

/* ---- in-memory stand-in (local development and tests) ---- */
const M = new Map(); const EXP = new Map();
const alive = k => { const e = EXP.get(k); if (e && e <= Date.now()) { M.delete(k); EXP.delete(k); } return M.has(k); };
const get = (k, mk) => { if (!alive(k)) { if (!mk) return undefined; M.set(k, mk()); } return M.get(k); };
const zsorted = z => [...z.entries()].sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1));
const num = v => v === '-inf' ? -Infinity : v === '+inf' ? Infinity : +v;
function one(c) {
  const [cmd, k, ...a] = c.map(String); const C = cmd.toUpperCase();
  switch (C) {
    case 'GET': { const v = get(k); return v === undefined ? null : v; }
    case 'SET': { M.set(k, a[0]); EXP.delete(k); const i = a.findIndex(x => x.toUpperCase() === 'EX'); if (i >= 0) EXP.set(k, Date.now() + +a[i + 1] * 1000); return 'OK'; }
    case 'DEL': { let n = 0; [k, ...a].forEach(x => { if (alive(x)) { M.delete(x); EXP.delete(x); n++; } }); return n; }
    case 'EXPIRE': if (!alive(k)) return 0; EXP.set(k, Date.now() + +a[0] * 1000); return 1;
    case 'INCR': { const v = (+get(k) || 0) + 1; M.set(k, String(v)); return v; }
    case 'MGET': return [k, ...a].map(x => { const v = get(x); return v === undefined ? null : v; });
    case 'HSET': { const h = get(k, () => new Map()); let n = 0; for (let i = 0; i < a.length; i += 2) { if (!h.has(a[i])) n++; h.set(a[i], a[i + 1]); } return n; }
    case 'HGET': { const h = get(k); return h && h.has(a[0]) ? h.get(a[0]) : null; }
    case 'HGETALL': { const h = get(k); return h ? [...h.entries()].flat() : []; }
    case 'HDEL': { const h = get(k); if (!h) return 0; let n = 0; a.forEach(f => { if (h.delete(f)) n++; }); return n; }
    case 'HINCRBY': { const h = get(k, () => new Map()); const v = (+h.get(a[0]) || 0) + +a[1]; h.set(a[0], String(v)); return v; }
    case 'SADD': { const s = get(k, () => new Set()); let n = 0; a.forEach(x => { if (!s.has(x)) { s.add(x); n++; } }); return n; }
    case 'SREM': { const s = get(k); if (!s) return 0; let n = 0; a.forEach(x => { if (s.delete(x)) n++; }); return n; }
    case 'SMEMBERS': { const s = get(k); return s ? [...s] : []; }
    case 'ZADD': { const z = get(k, () => new Map()); let n = 0; for (let i = 0; i < a.length; i += 2) { if (!z.has(a[i + 1])) n++; z.set(a[i + 1], +a[i]); } return n; }
    case 'ZREM': { const z = get(k); if (!z) return 0; let n = 0; a.forEach(x => { if (z.delete(x)) n++; }); return n; }
    case 'ZRANGEBYSCORE': { const z = get(k); if (!z) return []; const lo = num(a[0]), hi = num(a[1]); return zsorted(z).filter(([, s]) => s >= lo && s <= hi).map(([m]) => m); }
    case 'ZREVRANGE': { const z = get(k); if (!z) return []; const L = zsorted(z).reverse().map(([m]) => m); const s = +a[0], e = +a[1]; return L.slice(s, e < 0 ? L.length + e + 1 : e + 1); }
    case 'ZCOUNT': { const z = get(k); if (!z) return 0; const lo = num(a[0]), hi = num(a[1]); return [...z.values()].filter(s => s >= lo && s <= hi).length; }
    case 'ZREMRANGEBYSCORE': { const z = get(k); if (!z) return 0; const lo = num(a[0]), hi = num(a[1]); let n = 0; for (const [m, sc] of [...z]) if (sc >= lo && sc <= hi) { z.delete(m); n++; } return n; }
    case 'ZCARD': { const z = get(k); return z ? z.size : 0; }
    case 'LPUSH': case 'RPUSH': { const l = get(k, () => []); a.forEach(x => C === 'LPUSH' ? l.unshift(x) : l.push(x)); return l.length; }
    case 'LRANGE': { const l = get(k) || []; let s = +a[0], e = +a[1]; if (s < 0) s = Math.max(0, l.length + s); if (e < 0) e = l.length + e; return l.slice(s, e + 1); }
    case 'LTRIM': { const l = get(k); if (!l) return 'OK'; let s = +a[0], e = +a[1]; if (s < 0) s = Math.max(0, l.length + s); if (e < 0) e = l.length + e; M.set(k, l.slice(s, e + 1)); return 'OK'; }
    case 'LLEN': { const l = get(k); return l ? l.length : 0; }
    default: throw new Error('mock redis: unsupported ' + C);
  }
}
async function memory(cmds) { return cmds.map(one); }

const run = URL_ && TOKEN ? upstash : memory;
const R = {
  mock: !(URL_ && TOKEN),
  pipe: cmds => cmds.length ? run(cmds) : Promise.resolve([]),
  cmd: async (...c) => (await run([c]))[0],
  hash: arr => { const o = {}; if (Array.isArray(arr)) for (let i = 0; i < arr.length; i += 2) o[arr[i]] = arr[i + 1]; else if (arr && typeof arr === 'object') Object.assign(o, arr); return o; }
};
module.exports = R;
