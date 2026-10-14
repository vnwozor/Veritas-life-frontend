/* Staged load simulation of the Cloudflare game server (one Durable Object) on this machine.
   It runs the real server code with N simulated players on live connections, each sending position updates
   (and some chat, item and money traffic) like the game does, and measures how long the server spends.
   It measures server CPU only: no real network, phones or Cloudflare limits. It is NOT a real load test.
   Run:  bash tests/cf/bundle.sh && node tests/cf/load.mjs 100 300 1000 3000 */
import { boot } from './harness.mjs';
const BLOB = 'x'.repeat(+process.env.SAVE_BYTES || 0);
const stages = process.argv.slice(2).map(Number).filter(Boolean); if (!stages.length) stages.push(100, 300, 1000);
const { g } = await boot({ ADMIN_PASSWORD: 'x' });
const R = g.R; const LOCS = ['out', 'out', 'out', 'out', 'in:vcafe', 'in:library', 'in:lecture', 'in:club', 'room:rb104', 'in:chapel'];
async function mkUsers(n, from) { const out = []; for (let i = 0; i < n; i++) { const id = from + i; const tok = 'tok' + id; await R.pipe([['HSET', 'user:' + id, 'matric', 'VUG/26/L' + id, 'name', 'Load' + id, 'money', 100000], ['SET', 'sess:' + tok, id, 'EX', 3600]]); out.push({ id, tok }); } return out; }
async function connect(u) { const r = await g.fetch(new Request('https://x.dev/ws?token=' + u.tok, { headers: { Upgrade: 'websocket' } })); const ws = r._ws; u.ws = ws; u.pending = new Map(); ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.t === 'sync' && u.pending.has(m.id)) { u.pending.get(m.id)(m); u.pending.delete(m.id); } }); await new Promise(r => setTimeout(r, 1)); }
let rid = 0;
function syncOnce(u, out) { return new Promise(res => { const id = ++rid; u.pending.set(id, res); u.ws.send(JSON.stringify({ id, out: out || [], pos: { x: Math.random() * 100, z: Math.random() * 100, loc: u.loc, name: 'Load' + u.id, anim: 'walk' }, dv: u.dv || null })); }); }
const users = []; let next = 50000;
for (const N of stages) {
  const add = N - users.length; if (add > 0) { const nu = await mkUsers(add, next); next += add; for (const u of nu) { u.loc = LOCS[u.id % LOCS.length]; await connect(u); users.push(u); } }
  const rounds = 5; const times = []; const t0 = performance.now(); let msgs = 0;
  for (let r = 0; r < rounds; r++) { const rs = performance.now();
    await Promise.all(users.slice(0, N).map((u, i) => { const out = []; if (BLOB && (i + r) % 7 === 0) out.push({ t: 'state', st: { name: 'Load' + u.id, money: 100000, intro: false, t: 100, pad: BLOB } }); if (i % 50 === r) out.push({ t: 'dm', to: users[(i + 1) % N].id, text: 'hi' }); if (i % 97 === r) out.push({ t: 'xfer', to: users[(i + 3) % N].id, amount: 10, ref: 'ld' + u.id + 'r' + r, bal: 100000 }); if (i % 131 === r) out.push({ t: 'drop', item: 'water', x: 1, z: 1, loc: u.loc, ref: 'dr' + u.id + 'r' + r });
      return syncOnce(u, out).then(m => { msgs += (m.body && m.body.in || []).length; }); }));
    times.push(performance.now() - rs); }
  const per = times.reduce((a, b) => a + b, 0) / rounds; const perSync = per / N;
  if (global.gc) global.gc(); const mem = process.memoryUsage().heapUsed / 1e6;
  console.log(JSON.stringify({ players: N, roundMs: Math.round(per), msPerSync: +perSync.toFixed(3), syncsPerSecondCapacity: Math.round(1000 / perSync), heapMB: Math.round(mem), messagesReturned: msgs }));
}
process.exit(0);
