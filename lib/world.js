/* VERITAS LIFE · shared world on the server
   Everything here is decided by the server, so two players can never both win the same thing:
   - wallet transfers (reference numbers, no double sends, balance checks, history)
   - items dropped on the ground (only one player can pick an item up)
   - hostel rooms (membership, capacity, no overbooking)
   - houses and apartments outside school (one owner or tenant at a time, rent and leases)
   - concert tickets (capacity per concert)
   - the player's character record (so a returning player never sees character creation again)
   Game time: 1 game minute = 3 real seconds, the same clock the game uses (see TIME in src/life3.js). */
const MS_PER_GAME_MIN = 3000;
const uDay = () => Math.floor(Date.now() / MS_PER_GAME_MIN / 1440);

let X = null; /* helpers handed over by api/index.js: R, J, now, names, addEffect, inbox, limited, logEvent, clean */
function init(h) { X = h; }

const okRef = r => String(r || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 48);
/* the wallet as of the player's latest save (saves arrive every few seconds); the stored summary is only a fallback */
const WALLET = new Map();
async function balanceOf(me, reported) { const w = WALLET.get(me); const srv = w && Date.now() - w.at < 15 * 60000 ? w.w : (+(await X.R.cmd('HGET', 'user:' + me, 'money')) || 0); const rep = Math.floor(+reported); return Math.max(0, Number.isFinite(rep) ? Math.min(rep, srv) : srv); }
function walletAdd(uid, d) { const w = WALLET.get(uid); if (w) w.w += d; }
/* a short lock per player so two requests can't spend the same money at the same moment */
async function withLock(key, fn, waitMs) { let got = null; const until = Date.now() + (waitMs == null ? 1500 : waitMs);
  while (!(got = await X.R.cmd('SET', 'lock:' + key, '1', 'NX', 'EX', 10)) && Date.now() < until) await new Promise(r => setTimeout(r, 15 + Math.random() * 25));
  if (!got) return null; try { return await fn(); } finally { await X.R.cmd('DEL', 'lock:' + key); } }
/* a charge the game asked for (house, rent, ticket): checked and recorded once per reference */
async function charge(me, ref, amount, what, reported) {
  const prev = X.J(await X.R.cmd('GET', 'chg:' + ref)); if (prev) return Object.assign({ dup: true }, prev);
  const bal = await balanceOf(me, reported); if (amount > bal) return { ok: false, reason: 'Not enough money. You have ' + bal.toLocaleString('en-NG') + ' naira.' };
  const rec = { ok: true, ref, amount, what, at: X.now() };
  walletAdd(me, -amount);
  await X.R.pipe([['SET', 'chg:' + ref, JSON.stringify(rec), 'EX', 30 * 86400], ['HINCRBY', 'user:' + me, 'money', -amount], ['LPUSH', 'txl:' + me, JSON.stringify({ ref, dir: 'out', other: 0, name: what, amount, fee: 0, at: rec.at })], ['LTRIM', 'txl:' + me, 0, 99]]);
  return rec;
}

/* ================= WALLET ================= */
const XFER_FEE = amount => 0; /* no transfer fees */
const XFER_MAX = 1e12;
async function xfer(me, m) {
  const ref = okRef(m.ref); const to = +m.to; const amount = Math.floor(+m.amount || 0);
  const fail = (reason, extra) => Object.assign({ t: 'xfer_res', ok: false, ref, reason }, extra || {});
  if (ref.length < 8) return fail('Something went wrong. Try again.');
  const prev = X.J(await X.R.cmd('GET', 'tx:' + ref));
  if (prev) return prev.from === me ? Object.assign({}, prev, { dup: true }) : fail('Something went wrong. Try again.');
  if (!to || to === me) return fail('Choose another player.');
  if (!(amount >= 1 && amount <= XFER_MAX)) return fail('Enter an amount.');
  const r = await withLock('xfer:' + me, async () => {
    const [toMatric, banned] = await X.R.pipe([['HGET', 'user:' + to, 'matric'], ['HGET', 'user:' + to, 'status']]);
    if (!toMatric) return fail('No player found with that username or matric number.');
    if (banned === 'banned') return fail('That account can\'t receive money.');
    if (await X.limited('xf:' + me, 30, 3600)) return fail('Too many transfers in the last hour. Try again later.');
    const fee = XFER_FEE(amount); const bal = await balanceOf(me, m.bal);
    if (amount + fee > bal) return fail('Not enough money. You have ' + bal.toLocaleString('en-NG') + ' naira.', { bal });
    const nm = await X.names([me, to]); const at = X.now();
    const rec = { t: 'xfer_res', ok: true, ref, from: me, to, amount, fee, name: nm[to], fromName: nm[me], at };
    /* the reference is claimed first: a retry with the same reference can never send twice */
    const claimed = await X.R.cmd('SET', 'tx:' + ref, JSON.stringify(rec), 'NX', 'EX', 30 * 86400); if (!claimed) return Object.assign(X.J(await X.R.cmd('GET', 'tx:' + ref)) || rec, { dup: true });
    walletAdd(me, -(amount + fee)); walletAdd(to, amount);
    await X.R.pipe([['HINCRBY', 'user:' + me, 'money', -(amount + fee)], ['HINCRBY', 'user:' + to, 'money', amount],
      ['LPUSH', 'txl:' + me, JSON.stringify({ ref, dir: 'out', other: to, name: nm[to], amount, fee, at })], ['LTRIM', 'txl:' + me, 0, 99],
      ['LPUSH', 'txl:' + to, JSON.stringify({ ref, dir: 'in', other: me, name: nm[me], amount, fee: 0, at })], ['LTRIM', 'txl:' + to, 0, 99], ['HINCRBY', 'stats', 'transfers', 1]]);
    await X.addEffect(to, 'credit', { amount, label: 'Transfer from ' + nm[me] + ' · ref ' + ref.slice(-8).toUpperCase(), from: nm[me], ref });
    await X.logEvent('transfer', me, { to: nm[to], amount, ref });
    return rec;
  });
  return r || fail('Another transfer is still going through. Try again in a moment.', { busy: true });
}

/* ================= ITEMS ON THE GROUND ================= */
const DROPPABLE = new Set(['umbrella', 'laptop', 'phone', 'garri', 'gift', 'powerbank', 'camera', 'notebook', 'textbook', 'bag', 'water', 'snack']);
const DROP_TTL = 2 * 86400;
async function drop(me, m) {
  const item = String(m.item || ''); const loc = String(m.loc || '').slice(0, 40);
  if (!DROPPABLE.has(item) || !loc) return { t: 'drop_res', ok: false, reason: 'You can\'t drop that.' };
  if (await X.limited('drop:' + me, 40, 3600)) return { t: 'drop_res', ok: false, reason: 'Slow down.' };
  if (+(await X.R.cmd('HLEN', 'drops:' + loc)) >= 40) return { t: 'drop_res', ok: false, reason: 'There is too much stuff on the ground here already.' };
  const ref = okRef(m.ref); if (ref.length >= 8) { const prev = X.J(await X.R.cmd('GET', 'dropref:' + ref)); if (prev) return Object.assign({}, prev, { dup: true }); }
  const id = await X.R.cmd('INCR', 'seq:drop'); const nm = (await X.names([me]))[me];
  const d = { id, item, label: X.clean(m.label, 40) || item, x: +(+m.x || 0).toFixed(2), z: +(+m.z || 0).toFixed(2), by: me, byName: nm, at: X.now() };
  await X.R.pipe([['HSET', 'drops:' + loc, id, JSON.stringify(d)], ['EXPIRE', 'drops:' + loc, DROP_TTL], ['INCR', 'dropv:' + loc], ['EXPIRE', 'dropv:' + loc, DROP_TTL]]);
  const res = { t: 'drop_res', ok: true, ref, drop: d, loc }; if (ref.length >= 8) await X.R.cmd('SET', 'dropref:' + ref, JSON.stringify(res), 'EX', 86400);
  return res;
}
async function pick(me, m) {
  const id = +m.id; const loc = String(m.loc || '').slice(0, 40); const fail = reason => ({ t: 'pick_res', ok: false, id, reason });
  const raw = await X.R.cmd('HGET', 'drops:' + loc, id); if (!raw) return fail('Someone else already picked it up.');
  const d = X.J(raw); const sp = X.J(await X.R.cmd('GET', 'pos:' + me));
  /* where you are: the server's last known position, or the one sent with the tap */
  const p = sp && sp.loc === loc && Date.now() - (sp.ts || 0) < 10000 ? sp : (m.px != null ? { x: +m.px, z: +m.pz } : null);
  if (!p || !(Math.hypot(p.x - d.x, p.z - d.z) <= 6)) return fail('Walk closer to it first.');
  /* HDEL is atomic: if two players tap at once, only one of them gets 1 back */
  const n = await X.R.cmd('HDEL', 'drops:' + loc, id); if (!n) return fail('Someone else already picked it up.');
  await X.R.cmd('INCR', 'dropv:' + loc);
  if (d.by !== me) await X.logEvent('pickup', me, { item: d.item, from: d.byName });
  return { t: 'pick_res', ok: true, id, drop: d, loc };
}
async function dropsFor(loc) { const h = X.R.hash ? X.R.hash(await X.R.cmd('HGETALL', 'drops:' + loc)) : {}; return Object.values(h).map(X.J).filter(Boolean); }

/* ================= HOSTEL ROOMS ================= */
const ROOM_CAP = 4;
const HALLS = { boys: 'St. Joseph Hall', girls: 'St. Monica Hall' };
function roomNumbers() { const L = []; for (let k = 1; k <= 7; k++) L.push(100 + k); for (let k = 1; k <= 7; k++) L.push(200 + (k === 4 ? 10 : k)); return L; }
const roomKey = (hall, no) => 'room:' + hall + ':' + no;
async function roomList(me, m) {
  const hall = HALLS[m.hall] ? m.hall : 'boys'; const nos = roomNumbers();
  const res = await X.R.pipe(nos.map(no => ['SMEMBERS', roomKey(hall, no)])); const ids = res.flat().map(Number);
  const nm = await X.names(ids); const mine = X.J(await X.R.cmd('HGET', 'user:' + me, 'room'));
  return { t: 'room_list', hall, cap: ROOM_CAP, mine, rooms: nos.map((no, i) => ({ no, members: res[i].map(Number).map(id => ({ id, name: nm[id] || 'Student' })) })) };
}
async function roomJoin(me, m) {
  const hall = HALLS[m.hall] ? m.hall : 'boys'; const no = +m.no; const fail = reason => ({ t: 'room_res', ok: false, reason });
  if (!roomNumbers().includes(no)) return fail('That room does not exist.');
  const r = await withLock('rooms:' + hall, async () => {
    const cur = X.J(await X.R.cmd('HGET', 'user:' + me, 'room'));
    if (cur && cur.hall === hall && cur.no === no) return { t: 'room_res', ok: true, hall, no, same: true };
    const n = +(await X.R.cmd('SCARD', roomKey(hall, no))); if (n >= ROOM_CAP) return fail('Room ' + no + ' is full (' + ROOM_CAP + ' students).');
    const cmds = []; if (cur) cmds.push(['SREM', roomKey(cur.hall, cur.no), me]);
    cmds.push(['SADD', roomKey(hall, no), me], ['HSET', 'user:' + me, 'room', JSON.stringify({ hall, no, since: X.now() })]);
    await X.R.pipe(cmds); return { t: 'room_res', ok: true, hall, no };
  });
  return r || fail('The Hostel Office is busy. Try again.');
}
async function roomLeave(me) { const cur = X.J(await X.R.cmd('HGET', 'user:' + me, 'room')); if (!cur) return { t: 'room_res', ok: true, left: true }; await X.R.pipe([['SREM', roomKey(cur.hall, cur.no), me], ['HSET', 'user:' + me, 'room', '']]); return { t: 'room_res', ok: true, left: true }; }

/* ================= HOUSES AND APARTMENTS OUTSIDE SCHOOL ================= */
const PROPS = {
  prop1: { name: 'Junction Court Apartment', kind: 'apartment', tier: 1, beds: 1, price: 2500000, rent: 25000, deposit: 25000 },
  prop2: { name: 'Hillside Bungalow', kind: 'bungalow', tier: 2, beds: 2, price: 6000000, rent: 60000, deposit: 60000 },
  prop3: { name: 'Bwari Heights Duplex', kind: 'duplex', tier: 3, beds: 3, price: 15000000, rent: 150000, deposit: 150000 },
  prop4: { name: 'Mini Flat by the Market', kind: 'mini flat', tier: 1, beds: 1, price: 1500000, rent: 15000, deposit: 15000 }
};
const LEASE_DAYS = 7, GRACE_DAYS = 1;
async function propState(id) { const s = X.J(await X.R.cmd('GET', 'prop:' + id)) || {}; if (s.tenant && s.until && uDay() > s.until + GRACE_DAYS) { /* lease ran out and was not renewed */ const t = s.tenant; delete s.tenant; delete s.until; delete s.tenantName; await X.R.cmd('SET', 'prop:' + id, JSON.stringify(s)); if (t) await X.inbox(t, { t: 'note', text: 'Your lease ended and was not renewed. The landlord changed the locks.' }); } return s; }
async function propList(me) { const out = []; for (const id of Object.keys(PROPS)) { const s = await propState(id); out.push(Object.assign({ id }, PROPS[id], { owner: s.owner || 0, ownerName: s.ownerName || '', tenant: s.tenant || 0, tenantName: s.tenantName || '', until: s.until || 0, listed: s.listed !== false, rentSet: s.rent || PROPS[id].rent, mine: s.owner === me ? 'owner' : s.tenant === me ? 'tenant' : '' })); } return { t: 'prop_list', list: out, uday: uDay(), lease: LEASE_DAYS, grace: GRACE_DAYS }; }
async function propBuy(me, m) {
  const id = String(m.id); const P = PROPS[id]; const ref = okRef(m.ref); const fail = reason => ({ t: 'prop_res', ok: false, id, ref, reason });
  if (!P || ref.length < 8) return fail('That property is not for sale.');
  const r = await withLock('prop:' + id, async () => {
    const s = await propState(id); if (s.owner === me) return { t: 'prop_res', ok: true, id, ref, kind: 'buy', dup: true };
    if (s.owner) return fail('Sorry, ' + (s.ownerName || 'another player') + ' already owns it.');
    if (s.tenant && s.tenant !== me) return fail('It is rented out right now. Try again when the lease ends.');
    const c = await charge(me, ref, P.price, 'Bought ' + P.name, m.bal); if (!c.ok) return fail(c.reason);
    const nm = (await X.names([me]))[me]; Object.assign(s, { owner: me, ownerName: nm, since: X.now(), listed: false }); delete s.tenant; delete s.tenantName; delete s.until;
    await X.R.cmd('SET', 'prop:' + id, JSON.stringify(s)); await X.logEvent('property', me, { bought: P.name, price: P.price });
    return { t: 'prop_res', ok: true, id, ref, kind: 'buy', amount: P.price };
  });
  return r || fail('Someone else is buying it right now. Try again.');
}
async function propRent(me, m) {
  const id = String(m.id); const P = PROPS[id]; const ref = okRef(m.ref); const fail = reason => ({ t: 'prop_res', ok: false, id, ref, reason });
  if (!P || ref.length < 8) return fail('That property is not available.');
  const r = await withLock('prop:' + id, async () => {
    const s = await propState(id); const renew = s.tenant === me;
    if (s.tenant && !renew) return fail('Already rented by ' + (s.tenantName || 'another player') + '.');
    if (s.owner === me) return fail('You own it. No rent to pay.');
    if (s.owner && s.listed === false) return fail('The owner is not renting it out.');
    const rent = s.rent || P.rent; const amount = renew ? rent : rent + P.deposit;
    const c = await charge(me, ref, amount, (renew ? 'Rent renewal · ' : 'Rent + deposit · ') + P.name, m.bal); if (!c.ok) return fail(c.reason);
    const nm = (await X.names([me]))[me]; const start = renew ? Math.max(uDay(), s.until || uDay()) : uDay();
    Object.assign(s, { tenant: me, tenantName: nm, until: start + LEASE_DAYS }); await X.R.cmd('SET', 'prop:' + id, JSON.stringify(s));
    if (s.owner && !c.dup) await X.addEffect(s.owner, 'credit', { amount: rent, label: 'Rent from ' + nm + ' · ' + P.name, from: nm });
    return { t: 'prop_res', ok: true, id, ref, kind: renew ? 'renew' : 'rent', amount, until: s.until };
  });
  return r || fail('Someone else is renting it right now. Try again.');
}
async function propLeave(me, m) { const id = String(m.id); if (!PROPS[id]) return { t: 'prop_res', ok: false, reason: 'Unknown property.' };
  return (await withLock('prop:' + id, async () => { const s = await propState(id); if (s.tenant !== me) return { t: 'prop_res', ok: false, id, reason: 'You are not renting it.' };
    delete s.tenant; delete s.tenantName; delete s.until; await X.R.cmd('SET', 'prop:' + id, JSON.stringify(s)); return { t: 'prop_res', ok: true, id, kind: 'leave' }; })) || { t: 'prop_res', ok: false, reason: 'Busy, try again.' }; }
async function propList2(me, m) { const id = String(m.id); if (!PROPS[id]) return { t: 'prop_res', ok: false, reason: 'Unknown property.' };
  return (await withLock('prop:' + id, async () => { const s = await propState(id); if (s.owner !== me) return { t: 'prop_res', ok: false, id, reason: 'Only the owner can do that.' };
    s.listed = !!m.listed; if (m.rent) s.rent = Math.max(1000, Math.min(1e8, Math.floor(+m.rent))); await X.R.cmd('SET', 'prop:' + id, JSON.stringify(s)); return { t: 'prop_res', ok: true, id, kind: 'listing', listed: s.listed, rent: s.rent }; })) || { t: 'prop_res', ok: false, reason: 'Busy, try again.' }; }

/* ================= CONCERT TICKETS ================= */
const TIX_CAP = { reg: 400, vip: 40 };
async function ticket(me, m) {
  const cid = X.clean(m.cid, 40); const tier = m.vip ? 'vip' : 'reg'; const ref = okRef(m.ref); const price = Math.max(0, Math.floor(+m.price || 0)); const fail = reason => ({ t: 'tix_res', ok: false, ref, cid, reason });
  if (!cid || ref.length < 8) return fail('Ticket sales are closed.');
  const r = await withLock('tix:' + cid, async () => {
    const have = X.J(await X.R.cmd('HGET', 'tixu:' + cid, me)); if (have && (have.tier === 'vip' || tier === 'reg')) return { t: 'tix_res', ok: true, ref, cid, tier: have.tier, dup: true };
    const sold = +(await X.R.cmd('GET', 'tix:' + cid + ':' + tier)) || 0; if (sold >= TIX_CAP[tier]) return fail(tier === 'vip' ? 'VIP is sold out.' : 'Sold out. The venue is full.');
    const c = await charge(me, ref, price, 'Concert ticket (' + tier.toUpperCase() + ')', m.bal); if (!c.ok) return fail(c.reason);
    await X.R.pipe([['INCRBY', 'tix:' + cid + ':' + tier, 1], ['EXPIRE', 'tix:' + cid + ':' + tier, 30 * 86400], ['HSET', 'tixu:' + cid, me, JSON.stringify({ tier, at: X.now(), ref })], ['EXPIRE', 'tixu:' + cid, 30 * 86400]]);
    if (have && have.tier === 'reg' && tier === 'vip') await X.R.cmd('INCRBY', 'tix:' + cid + ':reg', -1);
    return { t: 'tix_res', ok: true, ref, cid, tier, left: TIX_CAP[tier] - sold - 1 };
  });
  return r || fail('Ticket desk is busy. Try again.');
}
async function ticketCheck(me, m) { const cid = X.clean(m.cid, 40); const have = X.J(await X.R.cmd('HGET', 'tixu:' + cid, me)); return { t: 'tix_check', cid, ok: !!have, tier: have ? have.tier : null }; }

/* ================= THE PLAYER'S CHARACTER (onboarding is remembered on the server) ================= */
async function onState(uid, st) {
  if (st && Number.isFinite(+st.money)) WALLET.set(uid, { w: Math.round(+st.money), at: Date.now() });
  if (!st || st.over || st.intro) return;
  const ch = { name: X.clean(st.name), look: st.look || null, dept: st.dept || '', trait: st.trait || '', room: st.room || '104', bg: st.bg || '', female: !!(st.look && st.look.female) };
  const key = JSON.stringify(ch); if (CHAR_AT.get(uid) === key) return; CHAR_AT.set(uid, key);
  await X.R.cmd('HSET', 'user:' + uid, 'onboarded', 1, 'char', key);
}
const CHAR_AT = new Map();

/* ================= messages from the game ================= */
async function handle(me, m, out) {
  switch (m.t) {
    case 'xfer': out.push(await xfer(me, m)); return true;
    case 'xfer_hist': out.push({ t: 'xfer_hist', list: (await X.R.cmd('LRANGE', 'txl:' + me, 0, 49)).map(X.J).filter(Boolean) }); return true;
    case 'drop': out.push(await drop(me, m)); return true;
    case 'pick': out.push(await pick(me, m)); return true;
    case 'room_list': out.push(await roomList(me, m)); return true;
    case 'room_join': out.push(await roomJoin(me, m)); return true;
    case 'room_leave': out.push(await roomLeave(me)); return true;
    case 'prop_list': out.push(await propList(me)); return true;
    case 'prop_buy': out.push(await propBuy(me, m)); return true;
    case 'prop_rent': out.push(await propRent(me, m)); return true;
    case 'prop_leave': out.push(await propLeave(me, m)); return true;
    case 'prop_listing': out.push(await propList2(me, m)); return true;
    case 'tix_buy': out.push(await ticket(me, m)); return true;
    case 'tix_check': out.push(await ticketCheck(me, m)); return true;
  }
  return false;
}
/* every sync: when the items on the ground where you are change, you get the new list */
async function sync(me, b, myLoc, out) {
  if (!myLoc) return; const v = +(await X.R.cmd('GET', 'dropv:' + myLoc)) || 0; const have = b && b.dv ? +b.dv[myLoc] : NaN;
  if (v !== have && !(v === 0 && have === 0)) out.push({ t: 'drops', loc: myLoc, v, list: v ? await dropsFor(myLoc) : [] });
}
module.exports = { init, handle, sync, onState, PROPS, ROOM_CAP, TIX_CAP, MS_PER_GAME_MIN, uDay, _test: { xfer, drop, pick, roomJoin, roomList, propBuy, propRent, ticket } };
