/* VERITAS LIFE · Korapay payments (Vercel Function).
   /api/shop/config   → which payment mode is on
   /api/shop/buy      → creates a Korapay checkout for a pack (needs login)
   /api/shop/verify   → confirms a payment with Korapay and credits game money once
   /api/shop/webhook  → Korapay's notification (signature checked) → same as verify
   Set KORAPAY_SECRET_KEY in Vercel. Without it the shop stays in test mode. */
'use strict';
const crypto = require('crypto');
const R = require('../lib/redis');

const KEY = process.env.KORAPAY_SECRET_KEY || '';
const BASE = (process.env.KORAPAY_BASE_URL || 'https://api.korapay.com/merchant/api/v1').replace(/\/+$/, '');
const TEST = /^sk_test/i.test(KEY);
const MODE = KEY ? 'korapay' : 'test';
const PACKS = { p1: { ng: 1000, coins: 50000 }, p5: { ng: 5000, coins: 250000 }, p20: { ng: 20000, coins: 1000000 } };
const now = () => Date.now();
const J = s => { try { return JSON.parse(s); } catch (e) { return null; } };
const clean = (x, n) => String(x == null ? '' : x).replace(/[^\p{L}\p{N} .'()\-]/gu, '').trim().slice(0, n || 20);

function send(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return J(req.body) || {};
  return new Promise(ok => { const c = []; req.on('data', d => c.push(d)); req.on('end', () => ok(J(Buffer.concat(c).toString('utf8')) || {})); req.on('error', () => ok({})); });
}
async function authId(req) { const h = req.headers.authorization || ''; const t = h.startsWith('Bearer ') ? h.slice(7) : null; if (!t) return null; const id = await R.cmd('GET', 'sess:' + t); return id ? +id : null; }
async function logEvent(type, uid, data) {
  const id = await R.cmd('INCR', 'seq:ev'); let name = null;
  if (uid) { const [n, m] = await R.pipe([['HGET', 'user:' + uid, 'name'], ['HGET', 'user:' + uid, 'matric']]); name = n || m; }
  const e = JSON.stringify({ id, type, uid: uid || null, name, data: data || {}, created: now() });
  const cmds = [['LPUSH', 'events', e], ['LTRIM', 'events', 0, 1999], ['HINCRBY', 'stats', type, 1]];
  if (uid) cmds.push(['LPUSH', 'uev:' + uid, e], ['LTRIM', 'uev:' + uid, 0, 39]);
  await R.pipe(cmds);
}
async function addEffect(uid, type, data) { const id = await R.cmd('INCR', 'seq:fx'); await R.cmd('HSET', 'fxh:' + uid, id, JSON.stringify({ id, type, data: data || {} })); }
async function kora(path, payload) {
  const r = await fetch(BASE + path, { method: payload ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: payload ? JSON.stringify(payload) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) { }
  if (!r.ok || j.status === false) throw new Error((j && j.message) || ('Korapay error ' + r.status));
  return j.data || {};
}
/* Confirm with Korapay, then credit exactly once. */
async function settle(reference) {
  const P = J(await R.cmd('GET', 'pay:' + reference)); if (!P) return { ok: false, error: 'Unknown payment reference' };
  if (P.status === 'paid') return { ok: true, already: true, coins: P.coins };
  const d = await kora('/charges/' + encodeURIComponent(reference));
  if (String(d.status).toLowerCase() !== 'success') return { ok: false, pending: true, status: d.status || 'pending' };
  if (Math.round(+d.amount) < P.ng || (d.currency && d.currency !== 'NGN')) { await logEvent('payment_mismatch', P.uid, { reference, paid: d.amount, expected: P.ng }); return { ok: false, error: 'Amount does not match' }; }
  if (!(await R.cmd('SET', 'payclaim:' + reference, 1, 'NX', 'EX', 90 * 86400))) return { ok: true, already: true, coins: P.coins };
  P.status = 'paid'; P.paidAt = now(); const mode = TEST ? 'korapay-test' : 'korapay';
  const rec = JSON.stringify({ pack: P.pack, ng: P.ng, coins: P.coins, mode, reference, created: now() });
  await R.pipe([['SET', 'pay:' + reference, JSON.stringify(P), 'EX', 90 * 86400], ['HINCRBY', 'purch', 'n', 1], ['HINCRBY', 'purch', 'ng', P.ng], ['HINCRBY', 'purch', 'coins', P.coins], ['LPUSH', 'upurch:' + P.uid, rec], ['LTRIM', 'upurch:' + P.uid, 0, 49]]);
  await addEffect(P.uid, 'credit', { amount: P.coins, label: 'Top-up via Korapay' });
  await logEvent('purchase', P.uid, { pack: P.pack, ng: P.ng, coins: P.coins, mode, reference });
  return { ok: true, coins: P.coins };
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  let p = (req.query && req.query.p) || url.searchParams.get('p') || url.pathname.replace(/^\/api\/(shop\/)?/, '');
  p = String(Array.isArray(p) ? p.join('/') : p).replace(/^\/+|\/+$/g, '').replace(/^shop\//, '');
  try {
    if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
    const b = req.method === 'POST' ? await body(req) : {};
    if (p === 'config') return send(res, 200, { payments: MODE, korapayTest: TEST, packs: PACKS });
    if (p === 'webhook' && req.method === 'POST') {
      if (!KEY) return send(res, 200, { ok: true });
      const sig = crypto.createHmac('sha256', KEY).update(JSON.stringify(b.data || {})).digest('hex');
      if (sig !== req.headers['x-korapay-signature']) return send(res, 401, { error: 'bad signature' });
      if (b.event === 'charge.success' && b.data && b.data.reference) { try { await settle(String(b.data.reference)); } catch (e) { console.error('webhook', e); } }
      return send(res, 200, { ok: true });
    }
    const me = await authId(req); if (!me) return send(res, 401, { error: 'Not logged in' });
    if (p === 'buy' && req.method === 'POST') {
      const pk = PACKS[b.pack]; if (!pk) return send(res, 400, { error: 'Unknown pack' });
      if (MODE !== 'korapay') { // test mode: no real money
        const rec = JSON.stringify({ pack: b.pack, ng: pk.ng, coins: pk.coins, mode: 'test', created: now() });
        await R.pipe([['HINCRBY', 'purch', 'n', 1], ['HINCRBY', 'purch', 'ng', pk.ng], ['HINCRBY', 'purch', 'coins', pk.coins], ['LPUSH', 'upurch:' + me, rec], ['LTRIM', 'upurch:' + me, 0, 49]]);
        await addEffect(me, 'credit', { amount: pk.coins, label: 'Top-up (test mode)' }); await logEvent('purchase', me, { pack: b.pack, ng: pk.ng, coins: pk.coins, mode: 'test' });
        return send(res, 200, { ok: true, coins: pk.coins, mode: 'test' });
      }
      const email = String(b.email || '').trim().slice(0, 120); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'Enter a valid email for your payment receipt.' });
      const [name, matric] = await R.pipe([['HGET', 'user:' + me, 'name'], ['HGET', 'user:' + me, 'matric']]);
      const reference = 'VL' + me + '-' + b.pack + '-' + crypto.randomBytes(6).toString('hex');
      const host = (process.env.PUBLIC_URL || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host))).replace(/\/+$/, '');
      await R.cmd('SET', 'pay:' + reference, JSON.stringify({ uid: me, pack: b.pack, ng: pk.ng, coins: pk.coins, status: 'pending', created: now() }), 'EX', 90 * 86400);
      try {
        const d = await kora('/charges/initialize', { amount: pk.ng, currency: 'NGN', reference, redirect_url: host + '/?paid=1', notification_url: host + '/api/shop/webhook', narration: 'VERITAS LIFE: ' + pk.coins.toLocaleString('en-US') + ' game money', customer: { email, name: clean(name) || matric || 'Player' }, metadata: { uid: String(me), pack: b.pack } });
        await logEvent('checkout', me, { pack: b.pack, ng: pk.ng, reference });
        return send(res, 200, { ok: true, mode: 'korapay', reference, checkout_url: d.checkout_url });
      } catch (e) { console.error('korapay init', e); return send(res, 502, { error: 'Korapay: ' + e.message }); }
    }
    if (p === 'verify' && req.method === 'POST') {
      if (MODE !== 'korapay') return send(res, 400, { error: 'Korapay is not set up' });
      const ref = String(b.reference || ''); const P = J(await R.cmd('GET', 'pay:' + ref)); if (!P || P.uid !== me) return send(res, 404, { error: 'Payment not found' });
      try { return send(res, 200, await settle(ref)); } catch (e) { return send(res, 502, { error: 'Korapay: ' + e.message }); }
    }
    return send(res, 404, { error: 'Not found' });
  } catch (e) { console.error(e); return send(res, 500, { error: 'Server error' }); }
};
