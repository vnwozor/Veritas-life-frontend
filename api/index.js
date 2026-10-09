/* VERITAS LIFE · game server as a Vercel Function.
   Data lives in Upstash Redis. Players sync every 1–2.5 s (/api/sync): their position goes up,
   and nearby players, messages and effects (raids, money, beatings…) come back. */
'use strict';
const crypto = require('crypto');
const R = require('../lib/redis');
const mailer = require('../lib/mail');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (process.env.VERCEL ? '' : 'change-me-now');
const PAYMENTS_MODE = process.env.PAYMENTS_MODE || 'test';
const PACKS = { p1: { ng: 1000, coins: 50000 }, p5: { ng: 5000, coins: 250000 }, p20: { ng: 20000, coins: 1000000 } };
const MATRIC = /^VUG\/26\/[A-Z0-9]{2,12}(\/[A-Z0-9]{1,8})?$/;
const DEPTS = ['CSC', 'SEN', 'CYB', 'BCH', 'MCB', 'ICH', 'ACC', 'BUS', 'BFN', 'MKT', 'ECO', 'MCM', 'POL', 'IRS', 'SOC', 'PSY', 'LAW', 'ENG', 'HIS', 'PHL', 'REL', 'NSC', 'PUH', 'MLS'];
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const normEmail = e => String(e || '').trim().toLowerCase();
const maskEmail = e => { const [a, d] = String(e).split('@'); return a.slice(0, 2) + '***@' + d; };
const ONLINE_MS = 12000;
const now = () => Date.now();
const J = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const clean = (x, n) => String(x == null ? '' : x).replace(/[^\p{L}\p{N} .'()\-]/gu, '').trim().slice(0, n || 20);
const token = () => crypto.randomBytes(24).toString('base64url');
const normMatric = m => { m = String(m || '').trim().toUpperCase().replace(/\s+/g, ''); if (!m.startsWith('VUG/26/')) m = 'VUG/26/' + m.replace(/^\/+/, ''); return m; };
function hashPass(p) { const salt = crypto.randomBytes(16).toString('hex'); return salt + ':' + crypto.scryptSync(String(p), salt, 64).toString('hex'); }
function checkPass(p, stored) { const [salt, h] = String(stored || '').split(':'); if (!salt || !h) return false; const t = crypto.scryptSync(String(p), salt, 64); const hb = Buffer.from(h, 'hex'); return hb.length === t.length && crypto.timingSafeEqual(t, hb); }
const pair = (a, b) => 'dm:' + Math.min(a, b) + ':' + Math.max(a, b);

/* ---------- helpers on top of Redis ---------- */
async function user(id) { const u = R.hash(await R.cmd('HGETALL', 'user:' + id)); return u.matric ? normUser(id, u) : null; }
function normUser(id, u) { return { id: +id, matric: u.matric, pass: u.pass, adult: u.adult === '1', fullname: u.fullname || '', email: u.email || '', dept: u.dept || '', age: +u.age || 0, dating: +u.dating || 0, name: u.name || '', female: u.female === '1', created: +u.created || 0, last_seen: +u.last_seen || 0, banned: u.banned === '1', money: +u.money || 0, level: +u.level || 100, day: +u.day || 1, discipline: +u.discipline || 0, cgpa: +u.cgpa || 0, status: u.status || 'new', restarts: +u.restarts || 0, place: u.place || '' }; }
const pub = u => ({ id: u.id, matric: u.matric, name: u.name || 'New student', adult: u.adult, female: u.female, level: u.level, banned: u.banned, dept: u.dept, dating: u.dating || 0 });
const own = u => Object.assign(pub(u), { fullname: u.fullname, email: u.email, age: u.age });
async function users(ids) { if (!ids.length) return []; const rows = await R.pipe(ids.map(id => ['HGETALL', 'user:' + id])); return rows.map((r, i) => { const u = R.hash(r); return u.matric ? normUser(ids[i], u) : null; }).filter(Boolean); }
async function names(ids) { ids = [...new Set(ids.map(Number))].filter(Boolean); if (!ids.length) return {}; const r = await R.pipe(ids.flatMap(id => [['HGET', 'user:' + id, 'name'], ['HGET', 'user:' + id, 'matric']])); const o = {}; ids.forEach((id, i) => { o[id] = r[i * 2] || r[i * 2 + 1] || 'Student'; }); return o; }
async function authId(req) { const h = req.headers.authorization || ''; const t = h.startsWith('Bearer ') ? h.slice(7) : null; if (!t) return null; const id = await R.cmd('GET', 'sess:' + t); return id ? +id : null; }
async function isAdmin(req) { const h = req.headers.authorization || ''; const t = h.startsWith('Bearer ') ? h.slice(7) : null; return !!(t && await R.cmd('GET', 'adm:' + t)); }
async function limited(key, max, secs) { const k = 'rl:' + key; const [n] = await R.pipe([['INCR', k], ['EXPIRE', k, secs]]); return n > max; }
async function logEvent(type, uid, data) {
  const id = await R.cmd('INCR', 'seq:ev'); const nm = uid ? (await names([uid]))[uid] : null;
  const e = JSON.stringify({ id, type, uid: uid || null, name: nm, data: data || {}, created: now() });
  const cmds = [['LPUSH', 'events', e], ['LTRIM', 'events', 0, 1999], ['HINCRBY', 'stats', type, 1]];
  if (uid) cmds.push(['LPUSH', 'uev:' + uid, e], ['LTRIM', 'uev:' + uid, 0, 39]);
  await R.pipe(cmds);
}
async function addEffect(uid, type, data) { const id = await R.cmd('INCR', 'seq:fx'); await R.cmd('HSET', 'fxh:' + uid, id, JSON.stringify({ id, type, data: data || {} })); }
async function inbox(uid, msg) { await R.pipe([['RPUSH', 'inbox:' + uid, JSON.stringify(msg)], ['EXPIRE', 'inbox:' + uid, 86400]]); }
async function onlineIds() { return (await R.cmd('ZRANGEBYSCORE', 'z:online', now() - ONLINE_MS, '+inf')).map(Number); }
async function storeState(uid, st) {
  if (!st || typeof st !== 'object') return;
  const status = st.captive ? 'kidnapped' : st.over ? 'ended' : st.graduated ? 'graduated' : 'ok';
  await R.pipe([['SET', 'state:' + uid, JSON.stringify(st)], ['HSET', 'user:' + uid, 'name', clean(st.name), 'female', st.look && st.look.female ? 1 : 0, 'money', Math.round((st.money || 0) + (st.savings || 0)), 'level', st.level || 100,
    'day', Math.floor((st.t || 0) / 1440) + 1, 'discipline', st.discipline || 0, 'cgpa', st.cgpa || 0, 'status', status, 'restarts', st.restarts || 0, 'place', clean(st.at), 'last_seen', now()], ['ZADD', 'z:seen', now(), uid]]);
}
async function groupRows(uid) {
  const gids = await R.cmd('SMEMBERS', 'ug:' + uid); if (!gids.length) return [];
  const res = await R.pipe(gids.flatMap(g => [['HGETALL', 'g:' + g], ['HGETALL', 'gm:' + g], ['LRANGE', 'gmsg:' + g, -60, -1]]));
  const out = []; const ids = [];
  gids.forEach((g, i) => { const info = R.hash(res[i * 3]), mem = R.hash(res[i * 3 + 1]); const st = mem[uid]; if (!info.name || !st || st === 'left') return;
    const members = Object.entries(mem).filter(([, s]) => s !== 'left').map(([id, s]) => ({ id: +id, status: s })); ids.push(...members.map(m => m.id));
    out.push({ id: +g, name: info.name, owner: +info.owner, status: st, members, msgs: st === 'member' ? res[i * 3 + 2].map(J).filter(Boolean) : [] }); });
  const nm = await names(ids); out.forEach(g => { g.members.forEach(m => m.name = nm[m.id]); g.msgs.forEach(m => { if (m.from) m.name = nm[m.from] || m.name; }); });
  return out.sort((a, b) => b.id - a.id);
}
async function groupPing(gid, extra) { const mem = R.hash(await R.cmd('HGETALL', 'gm:' + gid)); for (const [id, s] of Object.entries(mem)) { if (s === 'left') continue; await inbox(+id, { t: 'groups_dirty' }); if (extra) await inbox(+id, Object.assign({ t: 'grp_ping', gid }, extra, { me: +id === extra.fromId })); } }
async function startParty(hostId, host, loc) { await R.cmd('SET', 'party:last', JSON.stringify({ id: now(), host, loc }), 'EX', 3 * 3600); const ids = await onlineIds(); for (const id of ids) if (id !== hostId) await addEffect(id, 'party', { loc, host, id: now() }); await logEvent('party', hostId, { host, loc }); }

/* ---------- body / response ---------- */
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return J(req.body) || {};
  return new Promise(ok => { const c = []; let n = 0; req.on('data', d => { n += d.length; if (n < 3e6) c.push(d); }); req.on('end', () => ok(J(Buffer.concat(c).toString('utf8')) || {})); req.on('error', () => ok({})); });
}
function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }

/* ---------- realtime messages (same shapes as the WebSocket version) ---------- */
async function handle(me, m, out, ctx) {
  switch (m.t) {
    case 'boot': { const p = J(await R.cmd('GET', 'party:last')); if (p) await addEffect(me, 'party', p); await logEvent('online', me, {}); break; }
    case 'ack': if (Array.isArray(m.ids) && m.ids.length) await R.cmd('HDEL', 'fxh:' + me, ...m.ids.slice(0, 200).map(Number)); break;
    case 'state': await storeState(me, m.st); break;
    case 'log': { const ok = ['kidnapped', 'released', 'escaped', 'ended', 'raid_seen', 'raid_safe', 'beaten', 'caught_night', 'scandal', 'semester', 'smoking', 'party_host']; if (ok.includes(m.type)) { await logEvent(m.type, me, m.data || {}); if (m.type === 'ended' && m.data) await R.cmd('HINCRBY', 'stats', 'ended_' + clean(m.data.kind), 1); } break; }
    case 'dm': { const to = +m.to, text = String(m.text || '').trim().slice(0, 500); if (!to || !text || to === me) return; const id = await R.cmd('INCR', 'seq:msg'); const msg = { id, from: me, to, name: (await names([me]))[me], text, created: now() };
      await R.pipe([['RPUSH', pair(me, to), JSON.stringify(msg)], ['LTRIM', pair(me, to), -300, -1], ['ZADD', 'th:' + me, now(), to], ['ZADD', 'th:' + to, now(), me], ['HINCRBY', 'unread:' + to, me, 1], ['HINCRBY', 'stats', 'messages', 1]]);
      await inbox(to, { t: 'dm', m: msg }); out.push({ t: 'dm', m: msg }); break; }
    case 'dm_hist': { const w = +m.with; const [list] = await R.pipe([['LRANGE', pair(me, w), -80, -1], ['HDEL', 'unread:' + me, w]]); out.push({ t: 'dm_hist', with: w, name: (await names([w]))[w], list: list.map(J).filter(Boolean) }); break; }
    case 'threads': { const others = (await R.cmd('ZREVRANGE', 'th:' + me, 0, 39)).map(Number); if (!others.length) { out.push({ t: 'threads', list: [] }); break; }
      const res = await R.pipe(others.flatMap(o => [['LRANGE', pair(me, o), -1, -1], ['HGET', 'unread:' + me, o]])); const nm = await names(others); const on = new Set(await onlineIds());
      out.push({ t: 'threads', list: others.map((o, i) => { const l = J((res[i * 2] || [])[0]) || {}; return { id: o, name: nm[o], last: l.text || '', mine: l.from === me, created: l.created || 0, unread: +res[i * 2 + 1] || 0, online: on.has(o) }; }) }); break; }
    case 'grp_new': { const name = clean(m.name, 30) || 'Group'; const ids = [...new Set((m.members || []).map(Number))].filter(x => x && x !== me).slice(0, 30); if (!ids.length) return; const gid = await R.cmd('INCR', 'seq:g');
      await R.pipe([['HSET', 'g:' + gid, 'name', name, 'owner', me, 'created', now()], ['HSET', 'gm:' + gid, me, 'member', ...ids.flatMap(i => [i, 'pending'])], ...[me, ...ids].map(i => ['SADD', 'ug:' + i, gid])]);
      const from = (await names([me]))[me]; for (const i of ids) await inbox(i, { t: 'grp_req', gid, name, from }); out.push({ t: 'groups', list: await groupRows(me) }); await logEvent('group', me, { name, invited: ids.length }); break; }
    case 'grp_resp': { const gid = +m.gid; const st = await R.cmd('HGET', 'gm:' + gid, me); if (st !== 'pending') return; await R.cmd('HSET', 'gm:' + gid, me, m.accept ? 'member' : 'left'); const nm = (await names([me]))[me];
      await R.pipe([['RPUSH', 'gmsg:' + gid, JSON.stringify({ from: 0, text: nm + (m.accept ? ' joined the group' : ' declined the request'), created: now() })]]); await groupPing(gid); break; }
    case 'grp_msg': { const gid = +m.gid, text = String(m.text || '').trim().slice(0, 500); if (!text || await R.cmd('HGET', 'gm:' + gid, me) !== 'member') return; const nm = (await names([me]))[me];
      await R.pipe([['RPUSH', 'gmsg:' + gid, JSON.stringify({ from: me, name: nm, text, created: now() })], ['LTRIM', 'gmsg:' + gid, -300, -1], ['HINCRBY', 'stats', 'messages', 1]]); await groupPing(gid, { from: nm, fromId: me, text }); break; }
    case 'grp_leave': { const gid = +m.gid; await R.pipe([['HSET', 'gm:' + gid, me, 'left'], ['SREM', 'ug:' + me, gid], ['RPUSH', 'gmsg:' + gid, JSON.stringify({ from: 0, text: (await names([me]))[me] + ' left', created: now() })]]); await groupPing(gid); out.push({ t: 'groups', list: await groupRows(me) }); break; }
    case 'groups': out.push({ t: 'groups', list: await groupRows(me) }); break;
    case 'room': { const to = +m.to; const [pm, pt] = (await R.pipe([['MGET', 'pos:' + me, 'pos:' + to]]))[0].map(J); if (!pt) { out.push({ t: 'note', text: 'They are offline right now.' }); break; }
      if (!!(pm && pm.female) !== !!pt.female) { out.push({ t: 'note', text: 'Hostel rules: no visiting rooms of the opposite sex.' }); break; }
      const nm = await names([me, to]); await inbox(to, { t: 'room_req', from: me, name: nm[me], kind: m.kind === 'ask' ? 'ask' : 'invite' }); out.push({ t: 'note', text: 'Request sent. Wait for ' + nm[to] + ' to accept.' }); break; }
    case 'room_resp': { const to = +m.to; const nm = await names([me, to]); if (!m.accept) { await inbox(to, { t: 'note', text: nm[me] + ' said no.' }); break; }
      const host = m.kind === 'ask' ? me : to, guest = m.kind === 'ask' ? to : me; const until = now() + 2 * 3600e3; const msg = { t: 'room_ok', host, hostName: nm[host], until };
      if (guest === me) out.push(msg); else await inbox(guest, msg); if (host !== me) await inbox(host, { t: 'note', text: nm[guest] + ' can now come to your room.' }); else out.push({ t: 'note', text: nm[guest] + ' can now come to your room.' }); await logEvent('room_visit', guest, { host: nm[host] }); break; }
    case 'send': { const to = +m.to, amt = Math.round(+m.amount || 0); if (!to || to === me || amt <= 0 || amt > 5e7) return; const [money, exists] = await R.pipe([['HGET', 'user:' + me, 'money'], ['HGET', 'user:' + to, 'matric']]);
      if (!exists) return; if ((+money || 0) + 1000 < amt) { out.push({ t: 'note', text: 'Transfer failed: not enough money on your account.' }); break; }
      const nm = await names([me, to]); await addEffect(to, 'credit', { amount: amt, label: 'Sent by ' + nm[me], from: nm[me] }); await logEvent('transfer', me, { to: nm[to], amount: amt }); out.push({ t: 'sent', to, amount: amt, name: nm[to] }); break; }
    case 'steal': { const to = +m.to; const [[pm, pt], money] = await R.pipe([['MGET', 'pos:' + me, 'pos:' + to], ['HGET', 'user:' + to, 'money']]).then(([a, b]) => [a.map(J), +b || 0]);
      if (!pm || !pt || pm.loc !== pt.loc || Math.hypot(pt.x - pm.x, pt.z - pm.z) > 8) { out.push({ t: 'steal_res', ok: false, reason: 'Too far away.' }); break; }
      const nm = await names([me, to]); const caught = Math.random() < 0.42; const amt = money > 300 ? Math.min(8000, Math.max(100, Math.round(money * (0.04 + Math.random() * 0.12) / 50) * 50)) : 0;
      if (caught || !amt) { out.push({ t: 'steal_res', ok: false, caught: true }); await addEffect(to, 'note', { text: nm[me] + ' tried to pickpocket you and got caught!' }); await logEvent('theft', me, { victim: nm[to], caught: true }); break; }
      const known = Math.random() < 0.45; await addEffect(to, 'robbed', { amount: amt, by: me, byName: nm[me], known }); out.push({ t: 'steal_res', ok: true, amount: amt }); await logEvent('theft', me, { victim: nm[to], amount: amt, known }); break; }
    case 'beat': { const to = +m.to; if (!to || to === me) return; const nm = await names([me, to]); await addEffect(to, 'beaten', { byName: nm[me], why: clean(m.why, 80) || 'what you did' }); await logEvent('boys', me, { target: nm[to] }); break; }
    case 'party': { const loc = ['lodge1', 'lodge2', 'lodge3'].includes(m.loc) ? m.loc : 'lodge2'; await startParty(me, (await names([me]))[me], loc); break; }
    case 'date_ask': { const to = +m.to; if (!to || to === me) return; const [a, b2] = await users([me, to]).then(L => [L.find(x => x.id === me), L.find(x => x.id === to)]);
      if (!a || !b2) return; if (!a.adult || !b2.adult) { out.push({ t: 'note', text: 'Dating is only for players who are 18 or older.' }); break; }
      if (a.dating) { out.push({ t: 'note', text: 'You are already in a relationship. Break up first.' }); break; }
      if (b2.dating) { out.push({ t: 'note', text: (b2.name || 'They') + ' is already in a relationship.' }); break; }
      if (await limited('dask:' + me + ':' + to, 2, 86400)) { out.push({ t: 'note', text: 'You already asked today. Give them some space.' }); break; }
      await inbox(to, { t: 'date_req', from: me, name: a.name || 'A student' }); out.push({ t: 'note', text: 'You asked ' + (b2.name || 'them') + ' out. Wait for their answer.' }); break; }
    case 'date_resp': { const to = +m.to; if (!to || to === me) return; const [a, b2] = await users([me, to]).then(L => [L.find(x => x.id === me), L.find(x => x.id === to)]); if (!a || !b2) return;
      if (!m.accept) { await inbox(to, { t: 'note', text: (a.name || 'They') + ' said no, kindly.' }); break; }
      if (a.dating || b2.dating || !a.adult || !b2.adult) { out.push({ t: 'note', text: 'That can\'t happen right now.' }); break; }
      await R.pipe([['HSET', 'user:' + me, 'dating', to], ['HSET', 'user:' + to, 'dating', me]]);
      out.push({ t: 'dating', with: to, name: b2.name }); await inbox(to, { t: 'dating', with: me, name: a.name }); await logEvent('dating', me, { with: b2.name }); break; }
    case 'date_end': { const u0 = await user(me); const other = u0 && u0.dating; if (!other) return; await R.pipe([['HSET', 'user:' + me, 'dating', 0], ['HSET', 'user:' + other, 'dating', 0]]);
      out.push({ t: 'dating', with: 0 }); await inbox(other, { t: 'dating', with: 0, by: u0.name || 'They' }); await logEvent('breakup', me, {}); break; }
  }
}

/* ---------- admin ---------- */
async function allUsers() { const ids = (await R.cmd('ZREVRANGE', 'z:created', 0, 4999)).map(Number); return users(ids); }
async function adminStats() {
  const [list, stats, purch, online] = await Promise.all([allUsers(), R.cmd('HGETALL', 'stats').then(R.hash), R.cmd('HGETALL', 'purch').then(R.hash), onlineIds()]);
  const day = now() - 864e5, played = list.filter(u => u.name); const s = k => +stats[k] || 0;
  const lv = {}; played.forEach(u => lv[u.level] = (lv[u.level] || 0) + 1);
  const evs = (await R.cmd('LRANGE', 'events', 0, 1999)).map(J).filter(e => e && e.created > day); const today = {}; evs.forEach(e => today[e.type] = (today[e.type] || 0) + 1);
  return { users: list.length, playing: played.length, online: online.length, newToday: list.filter(u => u.created > day).length, activeToday: list.filter(u => u.last_seen > day).length,
    adults: list.filter(u => u.adult).length, banned: list.filter(u => u.banned).length, moneyInGame: list.reduce((a, u) => a + u.money, 0),
    avgLevel: played.length ? Math.round(played.reduce((a, u) => a + u.level, 0) / played.length) : 100, kidnappedNow: list.filter(u => u.status === 'kidnapped').length, graduated: list.filter(u => u.status === 'graduated').length,
    levels: Object.entries(lv).map(([level, n]) => ({ level: +level, n })), purchases: { n: +purch.n || 0, ng: +purch.ng || 0, coins: +purch.coins || 0 },
    totals: { raids: s('raid'), kidnapped: s('kidnapped'), released: s('released') + s('escaped'), expelled: s('ended_expelled'), suspended: s('ended_suspended'), banditDeaths: s('ended_bandits'), thefts: s('theft'), fights: s('boys'), parties: s('party'), scandals: s('scandal'), messages: s('messages') },
    today: Object.entries(today).map(([type, n]) => ({ type, n })).sort((a, b) => b.n - a.n),
    richest: played.slice().sort((a, b) => b.money - a.money).slice(0, 5).map(u => ({ id: u.id, name: u.name, matric: u.matric, money: u.money, level: u.level })),
    wildest: played.slice().sort((a, b) => b.discipline - a.discipline).slice(0, 5).map(u => ({ id: u.id, name: u.name, matric: u.matric, discipline: u.discipline, level: u.level })), payments: PAYMENTS_MODE };
}
async function onlineList() { const ids = await onlineIds(); if (!ids.length) return []; const ps = (await R.cmd('MGET', ...ids.map(i => 'pos:' + i))).map(J); return ids.map((id, i) => ps[i] && { id, name: ps[i].name, lvl: ps[i].lvl, loc: ps[i].loc, st: ps[i].st, female: !!ps[i].female }).filter(Boolean); }

/* ---------- router ---------- */
module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  let p = (req.query && req.query.p) || url.searchParams.get('p') || url.pathname.replace(/^\/api\/?/, '');
  p = String(Array.isArray(p) ? p.join('/') : p).replace(/^\/+|\/+$/g, '');
  const q = k => (req.query && req.query[k] != null ? req.query[k] : url.searchParams.get(k));
  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '').split(',')[0].trim();
  // CORS: lets the separate admin website (another Vercel project) talk to this server. Logins use tokens, not cookies.
  const org = req.headers.origin; const ALLOWED = String(process.env.ALLOWED_ORIGINS || '*').split(',').map(x => x.trim()).filter(Boolean);
  if (org && (ALLOWED.includes('*') || ALLOWED.includes(org))) { res.setHeader('Access-Control-Allow-Origin', org); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); res.setHeader('Access-Control-Max-Age', '86400'); }
  try {
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    const b = req.method === 'POST' ? await body(req) : {};
    if (R.mock && process.env.VERCEL) return send(res, 503, { error: 'The game database is not connected yet. In Vercel: Storage → Upstash for Redis → Connect to this project, then redeploy.' });
    if (p === 'config') return send(res, 200, { payments: PAYMENTS_MODE, packs: PACKS, storage: R.mock ? 'memory (connect Upstash Redis!)' : 'upstash', email: mailer.ready, depts: DEPTS });
    if (p === 'signup' && req.method === 'POST') {
      if (await limited('su:' + ip, 60, 3600)) return send(res, 429, { error: 'Too many accounts from this network. Try again later.' });
      const m = normMatric(b.matric); if (!MATRIC.test(m)) return send(res, 400, { error: 'Matric number must look like VUG/26/1234.' });
      const fullname = String(b.fullname || '').replace(/[^\p{L} .'\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60);
      if (fullname.split(' ').filter(Boolean).length < 2) return send(res, 400, { error: 'Enter your full name (first name and surname).' });
      const email = normEmail(b.email); if (!EMAIL.test(email)) return send(res, 400, { error: 'Enter a valid email address. You need it to reset your password.' });
      const dept = String(b.dept || '').toUpperCase(); if (!DEPTS.includes(dept)) return send(res, 400, { error: 'Choose your department.' });
      const age = Math.floor(+b.age); if (!(age >= 15 && age <= 70)) return send(res, 400, { error: 'Enter your real age (15 or older).' });
      if (String(b.password || '').length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
      if (await R.cmd('GET', 'matric:' + m)) return send(res, 409, { error: 'That matric number already has an account. Log in instead.' });
      if (await R.cmd('GET', 'email:' + email)) return send(res, 409, { error: 'That email already has an account. Log in, or use "Forgot password".' });
      const id = await R.cmd('INCR', 'seq:user'); const t = token(); const adult = age >= 18;
      await R.pipe([['SET', 'matric:' + m, id], ['SET', 'email:' + email, id], ['HSET', 'user:' + id, 'matric', m, 'pass', hashPass(b.password), 'adult', adult ? 1 : 0, 'fullname', fullname, 'email', email, 'dept', dept, 'age', age, 'created', now(), 'last_seen', now(), 'level', 100, 'status', 'new'], ['ZADD', 'z:created', now(), id], ['ZADD', 'z:seen', now(), id], ['SET', 'sess:' + t, id, 'EX', 30 * 86400], ['SADD', 'usess:' + id, t]]);
      await logEvent('signup', id, { matric: m, dept, age }); return send(res, 200, { token: t, user: own(await user(id)), state: null });
    }
    if ((p === 'forgot' || p === 'reset') && req.method === 'POST') {
      const ident = String(b.id || '').trim(); const key = ident.includes('@') ? 'email:' + normEmail(ident) : 'matric:' + normMatric(ident);
      if (await limited('fp:' + ip, 20, 3600) || await limited('fp:' + key, 8, 3600)) return send(res, 429, { error: 'Too many tries. Wait an hour and try again.' });
      const id = await R.cmd('GET', key); const u = id && await user(id);
      if (p === 'forgot') {
        if (!u) return send(res, 404, { error: 'No account found with that matric number or email.' });
        if (!u.email) return send(res, 400, { error: 'This account has no email saved. Ask the game admin to reset your password.' });
        if (!mailer.ready) return send(res, 501, { error: 'Password reset by email is not switched on yet. Ask the game admin to reset your password.' });
        const code = String(crypto.randomInt(100000, 1000000));
        await R.cmd('SET', 'reset:' + u.id, JSON.stringify({ h: crypto.createHash('sha256').update(code).digest('hex'), n: 0 }), 'EX', 900);
        try { await mailer.send(u.email, 'Your Veritas Life reset code: ' + code, 'Hi ' + (u.fullname || u.name || 'there') + ',\n\nYour code to reset your Veritas Life password is:\n\n    ' + code + '\n\nIt works for 15 minutes. If you did not ask for this, ignore this email; your password stays the same.\n\nVeritas Life'); }
        catch (e) { console.error('mail', e.message); return send(res, 502, { error: 'Could not send the email right now. Try again in a few minutes, or ask the admin.' }); }
        await logEvent('reset_code', u.id, {}); return send(res, 200, { ok: true, to: maskEmail(u.email) });
      }
      const rec = u && J(await R.cmd('GET', 'reset:' + u.id));
      if (!rec) return send(res, 400, { error: 'That code has expired. Ask for a new one.' });
      if (rec.n >= 5) { await R.cmd('DEL', 'reset:' + u.id); return send(res, 400, { error: 'Too many wrong codes. Ask for a new one.' }); }
      const ok = crypto.createHash('sha256').update(String(b.code || '').trim()).digest('hex') === rec.h;
      if (!ok) { rec.n++; await R.cmd('SET', 'reset:' + u.id, JSON.stringify(rec), 'EX', 900); return send(res, 400, { error: 'Wrong code. Check the email and try again.' }); }
      if (String(b.password || '').length < 6) return send(res, 400, { error: 'New password must be at least 6 characters.' });
      const old = await R.cmd('SMEMBERS', 'usess:' + u.id); if (old.length) await R.pipe(old.map(x => ['DEL', 'sess:' + x]));
      const t = token(); await R.pipe([['HSET', 'user:' + u.id, 'pass', hashPass(b.password)], ['DEL', 'reset:' + u.id], ['DEL', 'usess:' + u.id], ['SET', 'sess:' + t, u.id, 'EX', 30 * 86400], ['SADD', 'usess:' + u.id, t]]);
      await logEvent('password_reset', u.id, {}); return send(res, 200, { token: t, user: own(u), state: J(await R.cmd('GET', 'state:' + u.id)) });
    }
    if (p === 'login' && req.method === 'POST') {
      const ident = String(b.id || b.matric || '').trim(); const key = ident.includes('@') ? 'email:' + normEmail(ident) : 'matric:' + normMatric(ident);
      if (await limited('li:' + key, 12, 600)) return send(res, 429, { error: 'Too many attempts. Wait 10 minutes.' });
      const id = await R.cmd('GET', key); const u = id && await user(id);
      if (!u || !checkPass(b.password || '', u.pass)) return send(res, 401, { error: ident.includes('@') ? 'Wrong email or password.' : 'Wrong matric number or password.' });
      if (u.banned) return send(res, 403, { error: 'This account has been banned by the game admin.' });
      const t = token(); await R.pipe([['SET', 'sess:' + t, u.id, 'EX', 30 * 86400], ['SADD', 'usess:' + u.id, t]]); await logEvent('login', u.id, {});
      return send(res, 200, { token: t, user: own(u), state: J(await R.cmd('GET', 'state:' + u.id)) });
    }
    if (p === 'logout' && req.method === 'POST') { const h = req.headers.authorization || ''; await R.cmd('DEL', 'sess:' + h.slice(7)); return send(res, 200, { ok: true }); }

    if (p.startsWith('admin/')) {
      if (p === 'admin/login' && req.method === 'POST') {
        if (!ADMIN_PASSWORD) return send(res, 503, { error: 'Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables, then redeploy.' });
        if (await limited('adm:' + ip, 10, 600)) return send(res, 429, { error: 'Too many attempts.' });
        const a = Buffer.from(String(b.password || '')), e = Buffer.from(ADMIN_PASSWORD); if (a.length !== e.length || !crypto.timingSafeEqual(a, e)) return send(res, 401, { error: 'Wrong admin password.' });
        const t = token(); await R.cmd('SET', 'adm:' + t, 1, 'EX', 12 * 3600); return send(res, 200, { token: t });
      }
      if (!(await isAdmin(req))) return send(res, 401, { error: 'Admin login required' });
      if (p === 'admin/stats') return send(res, 200, await adminStats());
      if (p === 'admin/users') {
        const qq = String(q('q') || '').trim().toLowerCase(); const on = new Map((await onlineList()).map(o => [o.id, o]));
        const key = { money: u => -u.money, level: u => -u.level, discipline: u => -u.discipline, new: u => -u.created }[q('sort')] || (u => -u.last_seen);
        const list = (await allUsers()).filter(u => !qq || u.name.toLowerCase().includes(qq) || u.matric.toLowerCase().includes(qq)).sort((a, c) => key(a) - key(c)).slice(0, 500)
          .map(u => { const o = Object.assign({}, u, { adult: u.adult ? 1 : 0, banned: u.banned ? 1 : 0, online: on.has(u.id), loc: on.has(u.id) ? on.get(u.id).loc : null }); delete o.pass; return o; });
        return send(res, 200, { users: list });
      }
      if (p === 'admin/user') {
        const id = +q('id'); const u = await user(id); if (!u) return send(res, 404, { error: 'No such user' });
        const [st, ev, pu] = await R.pipe([['GET', 'state:' + id], ['LRANGE', 'uev:' + id, 0, 39], ['LRANGE', 'upurch:' + id, 0, 19]]); const s = J(st) || {}; const on = (await onlineIds()).includes(id);
        return send(res, 200, { user: Object.assign(own(u), { created: u.created, last_seen: u.last_seen, money: u.money, day: u.day, discipline: u.discipline, cgpa: u.cgpa, status: u.status, restarts: u.restarts, online: on }),
          game: { dept: s.dept, trait: s.trait, bg: s.bg, needs: s.needs, skills: s.skills, offences: (s.offences || []).slice(-15), exams: s.exams || [], tx: (s.tx || []).slice(0, 25), car: s.car ? s.car.n : null, home: s.home, suspicion: s.suspicion, captive: s.captive || null, fineDebt: s.fineDebt || 0, stats: s.stats || {} },
          events: ev.map(J).filter(Boolean), purchases: pu.map(J).filter(Boolean) });
      }
      if (p === 'admin/events' || p === 'admin/feed') { const after = +q('after') || 0; const evs = (await R.cmd('LRANGE', 'events', 0, 149)).map(J).filter(e => e && e.id > after); return send(res, 200, { events: evs, online: p === 'admin/feed' ? await onlineList() : undefined }); }
      if (p === 'admin/raid' && req.method === 'POST') {
        const chanceTaken = Math.max(0, Math.min(1, b.chance == null ? 0.35 : +b.chance)); const single = b.target && b.target !== 'all';
        const targets = single ? [+b.target] : await onlineIds(); const taken = [];
        for (const uid of targets) { const t = single ? true : Math.random() < chanceTaken; if (t) taken.push(uid); await addEffect(uid, 'raid', { taken: t }); }
        await logEvent('raid', null, { by: 'admin', targets: targets.length, taken: taken.length, single: single ? +b.target : null }); return send(res, 200, { ok: true, targets: targets.length, taken: taken.length, takenIds: taken });
      }
      if (p === 'admin/announce' && req.method === 'POST') { const text = String(b.text || '').slice(0, 400); if (!text) return send(res, 400, { error: 'Empty message' }); const ids = b.target && b.target !== 'all' ? [+b.target] : await onlineIds(); for (const id of ids) await addEffect(id, 'announce', { text }); await logEvent('announce', null, { text, to: ids.length }); return send(res, 200, { ok: true, to: ids.length }); }
      if (p === 'admin/money' && req.method === 'POST') { const id = +b.userId, amt = Math.round(+b.amount || 0); if (!id || !amt) return send(res, 400, { error: 'userId and amount needed' }); await addEffect(id, amt > 0 ? 'credit' : 'debit', { amount: Math.abs(amt), label: amt > 0 ? 'Gift from the game admin' : 'Taken by the game admin' }); await logEvent('admin_money', id, { amount: amt }); return send(res, 200, { ok: true }); }
      if (p === 'admin/ban' && req.method === 'POST') { const id = +b.userId; await R.cmd('HSET', 'user:' + id, 'banned', b.banned ? 1 : 0); if (b.banned) { const ts = await R.cmd('SMEMBERS', 'usess:' + id); if (ts.length) await R.pipe(ts.map(t => ['DEL', 'sess:' + t])); await R.cmd('DEL', 'usess:' + id); await inbox(id, { t: 'banned' }); } await logEvent(b.banned ? 'ban' : 'unban', id, {}); return send(res, 200, { ok: true }); }
      if (p === 'admin/resetpass' && req.method === 'POST') { const id = +b.userId; const u2 = await user(id); if (!u2) return send(res, 404, { error: 'No such user' });
        const temp = crypto.randomBytes(4).toString('hex'); const ts = await R.cmd('SMEMBERS', 'usess:' + id); if (ts.length) await R.pipe(ts.map(t => ['DEL', 'sess:' + t]));
        await R.pipe([['HSET', 'user:' + id, 'pass', hashPass(temp)], ['DEL', 'usess:' + id]]); await logEvent('admin_resetpass', id, {}); return send(res, 200, { ok: true, password: temp }); }
      if (p === 'admin/reset' && req.method === 'POST') { const id = +b.userId; await addEffect(id, 'reset', {}); await logEvent('admin_reset', id, {}); return send(res, 200, { ok: true }); }
      if (p === 'admin/party' && req.method === 'POST') { const loc = ['lodge1', 'lodge2', 'lodge3'].includes(b.loc) ? b.loc : 'lodge2'; await startParty(null, clean(b.host, 30) || 'The Admin', loc); return send(res, 200, { ok: true }); }
      return send(res, 404, { error: 'Unknown admin route' });
    }

    /* ---- player routes (need login) ---- */
    const me = await authId(req);
    if (!me) return send(res, 401, { error: 'Not logged in' });
    const u = await user(me); if (!u) return send(res, 401, { error: 'Not logged in' });
    if (u.banned) return send(res, 403, { error: 'This account has been banned by the game admin.' });
    if (p === 'me') return send(res, 200, { user: Object.assign(own(u), { datingName: u.dating ? (await names([u.dating]))[u.dating] : null }), state: J(await R.cmd('GET', 'state:' + me)), mail: mailer.ready });
    if (p === 'account' && req.method === 'POST') {
      const set = [];
      if (b.fullname != null) { const f = String(b.fullname).replace(/[^\p{L} .'\-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 60); if (f.split(' ').filter(Boolean).length < 2) return send(res, 400, { error: 'Enter your full name.' }); set.push('fullname', f); }
      if (b.email != null) { const e = normEmail(b.email); if (!EMAIL.test(e)) return send(res, 400, { error: 'Enter a valid email address.' }); const taken = await R.cmd('GET', 'email:' + e); if (taken && +taken !== me) return send(res, 409, { error: 'That email is used by another account.' });
        if (u.email && u.email !== e) await R.cmd('DEL', 'email:' + u.email); await R.cmd('SET', 'email:' + e, me); set.push('email', e); }
      if (b.dept != null && !u.dept) { const d = String(b.dept).toUpperCase(); if (!DEPTS.includes(d)) return send(res, 400, { error: 'Choose your department.' }); set.push('dept', d); }
      if (b.age != null && !u.age) { const a = Math.floor(+b.age); if (!(a >= 15 && a <= 70)) return send(res, 400, { error: 'Enter your real age.' }); set.push('age', a, 'adult', a >= 18 ? 1 : 0); }
      if (set.length) await R.cmd('HSET', 'user:' + me, ...set); return send(res, 200, { user: own(await user(me)) });
    }
    if (p === 'state' && req.method === 'POST') { await storeState(me, b.state); return send(res, 200, { ok: true }); }
    if (p === 'players') {
      const qq = String(q('q') || '').trim().toLowerCase(); const ids = (await R.cmd('ZREVRANGE', 'z:seen', 0, 999)).map(Number).filter(i => i !== me); const on = new Set(await onlineIds());
      const list = (await users(ids)).filter(x => x.name && !x.banned && (x.name.toLowerCase().includes(qq) || x.matric.toLowerCase().includes(qq))).slice(0, 60);
      return send(res, 200, { players: list.map(x => ({ id: x.id, name: x.name, level: x.level, status: x.status, female: x.female, online: on.has(x.id), last_seen: x.last_seen, dating: x.dating ? 1 : 0, adult: x.adult })) });
    }
    if (p === 'shop/buy' && req.method === 'POST') {
      const pk = PACKS[b.pack]; if (!pk) return send(res, 400, { error: 'Unknown pack' }); if (PAYMENTS_MODE !== 'test') return send(res, 501, { error: 'Live payments are not set up yet.' });
      // TEST MODE: no real money moves. To go live, verify the payment with your provider here before crediting.
      const rec = JSON.stringify({ pack: b.pack, ng: pk.ng, coins: pk.coins, mode: 'test', created: now() });
      await R.pipe([['HINCRBY', 'purch', 'n', 1], ['HINCRBY', 'purch', 'ng', pk.ng], ['HINCRBY', 'purch', 'coins', pk.coins], ['LPUSH', 'upurch:' + me, rec], ['LTRIM', 'upurch:' + me, 0, 49]]);
      await addEffect(me, 'credit', { amount: pk.coins, label: 'Top-up (test mode)' }); await logEvent('purchase', me, { pack: b.pack, ng: pk.ng, coins: pk.coins, mode: 'test' });
      return send(res, 200, { ok: true, coins: pk.coins, mode: 'test' });
    }
    if (p === 'sync' && req.method === 'POST') {
      const out = [];
      for (const m of (Array.isArray(b.out) ? b.out.slice(0, 40) : [])) { try { await handle(me, m, out); } catch (e) { console.error('handle', m && m.t, e); } }
      const t = now(); const pos = b.pos && typeof b.pos === 'object' ? b.pos : null;
      const cmds = [['ZADD', 'z:online', t, me], ['HSET', 'user:' + me, 'last_seen', t], ['HGETALL', 'fxh:' + me], ['LRANGE', 'inbox:' + me, 0, -1], ['DEL', 'inbox:' + me], ['ZRANGEBYSCORE', 'z:online', t - ONLINE_MS, '+inf']];
      if (pos) cmds.unshift(['SET', 'pos:' + me, JSON.stringify({ x: +pos.x || 0, z: +pos.z || 0, dir: +pos.dir || 0, loc: String(pos.loc || 'out').slice(0, 40), anim: String(pos.anim || 'stand').slice(0, 16), lvl: +pos.lvl || 100, name: clean(pos.name), look: pos.look || null, st: String(pos.st || '').slice(0, 16), female: !!pos.female, ts: t }), 'EX', 20]);
      const r = await R.pipe(cmds); const o = pos ? 1 : 0;
      const fx = Object.values(R.hash(r[o + 2])).map(J).filter(Boolean).sort((a, c) => a.id - c.id);
      const inb = r[o + 3].map(J).filter(Boolean);
      const ids = r[o + 5].map(Number).filter(i => i !== me);
      if (Math.random() < 0.02) await R.cmd('ZREMRANGEBYSCORE', 'z:online', '-inf', t - 120000);
      let pres = [], online = null;
      if (ids.length) { const ps = (await R.cmd('MGET', ...ids.map(i => 'pos:' + i))).map(J); const myLoc = pos ? String(pos.loc || 'out') : null;
        pres = ids.map((id, i) => ps[i] && Object.assign({ id }, ps[i])).filter(x => x && x.loc === myLoc && x.anim !== 'hidden').map(x => ({ id: x.id, name: x.name, look: x.look, x: x.x, z: x.z, dir: x.dir, anim: x.anim, lvl: x.lvl, st: x.st }));
        if (b.online) online = ids.map((id, i) => ps[i] && { id, name: ps[i].name, lvl: ps[i].lvl, loc: ps[i].loc, st: ps[i].st, female: !!ps[i].female }).filter(Boolean); }
      else if (b.online) online = [];
      if (online) { const mp = pos ? { id: me, name: clean(pos.name), lvl: +pos.lvl || 100, loc: pos.loc, st: pos.st, female: !!pos.female } : null; if (mp) online.unshift(mp); }
      const msgs = [...inb, ...out]; if (fx.length) msgs.push({ t: 'fx', list: fx }); msgs.push({ t: 'pres', list: pres }); if (online) msgs.push({ t: 'online', list: online });
      if (inb.some(x => x.t === 'banned')) return send(res, 403, { error: 'banned', in: msgs });
      return send(res, 200, { in: msgs, others: ids.length });
    }
    return send(res, 404, { error: 'Not found' });
  } catch (e) { console.error(e); return send(res, 500, { error: 'Server error' }); }
};
