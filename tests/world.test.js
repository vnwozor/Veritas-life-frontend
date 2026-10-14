/* Server rules: run with  node --test tests/  (uses the in-memory engine, never real data) */
const test = require('node:test'); const assert = require('node:assert');
process.env.KV_REST_API_URL = ''; process.env.KV_REST_API_TOKEN = ''; process.env.REDIS_URL = '';
const R = require('../lib/redis'); const api = require('../api/index.js'); const W = api.world;
let seq = 0;
async function mkUser(money, extra) { const id = 9000 + (++seq); await R.pipe([['HSET', 'user:' + id, 'matric', 'VUG/26/T' + id, 'name', 'Player' + id, 'money', money, ...(extra || [])]]); return id; }
const ref = () => 'ref' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
const sync = async (me, out, extra) => (await api.doSync(me, Object.assign({ out }, extra || {}))).body.in;
const pickT = (msgs, t) => msgs.filter(m => m.t === t);

test('transfer moves money once, with history on both sides', async () => {
  const a = await mkUser(10000), b = await mkUser(0); const r = ref();
  const res = pickT(await sync(a, [{ t: 'xfer', to: b, amount: 2500, ref: r, bal: 10000 }]), 'xfer_res')[0];
  assert.equal(res.ok, true); assert.equal(res.amount, 2500);
  assert.equal(+(await R.cmd('HGET', 'user:' + a, 'money')), 7500); assert.equal(+(await R.cmd('HGET', 'user:' + b, 'money')), 2500);
  const again = pickT(await sync(a, [{ t: 'xfer', to: b, amount: 2500, ref: r, bal: 10000 }]), 'xfer_res')[0];
  assert.equal(again.ok, true); assert.equal(again.dup, true); assert.equal(+(await R.cmd('HGET', 'user:' + a, 'money')), 7500, 'retry did not send twice');
  const ha = pickT(await sync(a, [{ t: 'xfer_hist' }]), 'xfer_hist')[0].list; const hb = pickT(await sync(b, [{ t: 'xfer_hist' }]), 'xfer_hist')[0].list;
  assert.equal(ha[0].dir, 'out'); assert.equal(hb[0].dir, 'in'); assert.equal(hb[0].amount, 2500);
  const fx = pickT(await sync(b, []), 'fx')[0]; assert.ok(fx && fx.list.some(e => e.type === 'credit' && e.data.amount === 2500), 'receiver gets the credit');
});
test('transfer refuses more than the balance, bad recipients and zero', async () => {
  const a = await mkUser(1000), b = await mkUser(0);
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: b, amount: 5000, ref: ref(), bal: 99999999 }]), 'xfer_res')[0].ok, false, 'server balance wins over a lying client');
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: 123456789, amount: 10, ref: ref(), bal: 1000 }]), 'xfer_res')[0].ok, false);
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: a, amount: 10, ref: ref(), bal: 1000 }]), 'xfer_res')[0].ok, false);
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: b, amount: 0, ref: ref(), bal: 1000 }]), 'xfer_res')[0].ok, false);
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: b, amount: -50, ref: ref(), bal: 1000 }]), 'xfer_res')[0].ok, false);
  assert.equal(+(await R.cmd('HGET', 'user:' + a, 'money')), 1000);
});
test('simultaneous transfers can not overspend', async () => {
  const a = await mkUser(1000), b = await mkUser(0), c = await mkUser(0);
  const rs = await Promise.all([sync(a, [{ t: 'xfer', to: b, amount: 800, ref: ref(), bal: 1000 }]), sync(a, [{ t: 'xfer', to: c, amount: 800, ref: ref(), bal: 1000 }]), sync(a, [{ t: 'xfer', to: b, amount: 800, ref: ref(), bal: 1000 }])]);
  const ok = rs.map(x => pickT(x, 'xfer_res')[0]).filter(x => x.ok).length; assert.equal(ok, 1, 'only one 800 transfer out of 1000');
  assert.ok(+(await R.cmd('HGET', 'user:' + a, 'money')) >= 0, 'never negative');
});
test('an item on the ground can only be picked up once', async () => {
  const a = await mkUser(0), b = await mkUser(0), c = await mkUser(0); const loc = 'test-loc-' + seq;
  const pos = { x: 1, z: 1, loc, name: 'x' };
  const d = pickT(await sync(a, [{ t: 'drop', item: 'umbrella', label: 'Umbrella', x: 1, z: 1, loc }], { pos }), 'drop_res')[0]; assert.equal(d.ok, true);
  const seen = pickT(await sync(b, [], { pos, dv: {} }), 'drops')[0]; assert.equal(seen.list.length, 1, 'other players see it');
  const [r1, r2] = await Promise.all([sync(b, [{ t: 'pick', id: d.drop.id, loc, px: 1, pz: 1.5 }], { pos }), sync(c, [{ t: 'pick', id: d.drop.id, loc, px: 1.5, pz: 1 }], { pos })]);
  const wins = [pickT(r1, 'pick_res')[0], pickT(r2, 'pick_res')[0]].filter(x => x.ok); assert.equal(wins.length, 1, 'exactly one winner');
  const after = pickT(await sync(a, [], { pos, dv: {} }), 'drops')[0]; assert.equal(after.list.length, 0, 'gone for everyone');
  assert.equal(pickT(await sync(a, [{ t: 'drop', item: 'exam_paper', loc }], { pos }), 'drop_res')[0].ok, false, 'restricted items stay in your bag');
});
test('far away players can not pick things up', async () => {
  const a = await mkUser(0), b = await mkUser(0); const loc = 'far-' + seq;
  const d = pickT(await sync(a, [{ t: 'drop', item: 'textbook', x: 0, z: 0, loc }], { pos: { x: 0, z: 0, loc } }), 'drop_res')[0];
  const r = pickT(await sync(b, [{ t: 'pick', id: d.drop.id, loc }], { pos: { x: 40, z: 40, loc } }), 'pick_res')[0]; assert.equal(r.ok, false);
});
test('hostel rooms never go over capacity, moving rooms frees your old bed', async () => {
  const ids = []; for (let i = 0; i < W.ROOM_CAP + 2; i++) ids.push(await mkUser(0));
  const res = await Promise.all(ids.map(id => sync(id, [{ t: 'room_join', hall: 'boys', no: 105 }])));
  const ok = res.map(x => pickT(x, 'room_res')[0]).filter(x => x.ok).length; assert.equal(ok, W.ROOM_CAP);
  const lst = pickT(await sync(ids[0], [{ t: 'room_list', hall: 'boys' }]), 'room_list')[0]; assert.equal(lst.rooms.find(r => r.no === 105).members.length, W.ROOM_CAP);
  await sync(ids[0], [{ t: 'room_join', hall: 'boys', no: 106 }]);
  const lst2 = pickT(await sync(ids[0], [{ t: 'room_list', hall: 'boys' }]), 'room_list')[0]; assert.equal(lst2.rooms.find(r => r.no === 105).members.length, W.ROOM_CAP - 1);
  assert.equal(lst2.mine.no, 106);
});
test('a house can only be sold to one player, and renting respects owners', async () => {
  const a = await mkUser(20000000), b = await mkUser(20000000);
  const [r1, r2] = await Promise.all([sync(a, [{ t: 'prop_buy', id: 'prop2', ref: ref(), bal: 20000000 }]), sync(b, [{ t: 'prop_buy', id: 'prop2', ref: ref(), bal: 20000000 }])]);
  const wins = [pickT(r1, 'prop_res')[0], pickT(r2, 'prop_res')[0]].filter(x => x.ok); assert.equal(wins.length, 1);
  const owner = wins[0] === pickT(r1, 'prop_res')[0] ? a : b; const other = owner === a ? b : a;
  assert.equal(+(await R.cmd('HGET', 'user:' + owner, 'money')), 20000000 - W.PROPS.prop2.price);
  assert.equal(+(await R.cmd('HGET', 'user:' + other, 'money')), 20000000, 'loser is not charged');
  assert.equal(pickT(await sync(other, [{ t: 'prop_rent', id: 'prop2', ref: ref(), bal: 20000000 }]), 'prop_res')[0].ok, false, 'owner has not listed it');
  await sync(owner, [{ t: 'prop_listing', id: 'prop2', listed: true, rent: 70000 }]);
  const rr = pickT(await sync(other, [{ t: 'prop_rent', id: 'prop2', ref: ref(), bal: 20000000 }]), 'prop_res')[0]; assert.equal(rr.ok, true); assert.equal(rr.amount, 70000 + W.PROPS.prop2.deposit);
  const c = await mkUser(20000000); assert.equal(pickT(await sync(c, [{ t: 'prop_rent', id: 'prop2', ref: ref(), bal: 20000000 }]), 'prop_res')[0].ok, false, 'no double booking');
  const fx = pickT(await sync(owner, []), 'fx')[0]; assert.ok(fx.list.some(e => e.type === 'credit' && e.data.amount === 70000), 'owner gets the rent');
});
test('concert tickets stop at capacity and are not charged twice', async () => {
  const cid = 'c' + seq; const ids = []; for (let i = 0; i < W.TIX_CAP.vip + 3; i++) ids.push(await mkUser(100000));
  const res = await Promise.all(ids.map(id => sync(id, [{ t: 'tix_buy', cid, vip: true, price: 25000, ref: ref(), bal: 100000 }])));
  assert.equal(res.map(x => pickT(x, 'tix_res')[0]).filter(x => x.ok).length, W.TIX_CAP.vip);
  const r = ref(); await sync(ids[0], [{ t: 'tix_buy', cid, vip: true, price: 25000, ref: r, bal: 100000 }]);
  assert.equal(+(await R.cmd('HGET', 'user:' + ids[0], 'money')), 75000, 'buying again with the same ticket is free');
  assert.equal(pickT(await sync(ids[0], [{ t: 'tix_check', cid }]), 'tix_check')[0].ok, true);
});
test('a saved character marks the account as onboarded', async () => {
  const a = await mkUser(0); await sync(a, [{ t: 'state', st: { name: 'Ada', intro: true, look: {}, t: 500 } }]);
  assert.ok(!(+(await R.cmd('HGET', 'user:' + a, 'onboarded'))), 'not during the arrival');
  await sync(a, [{ t: 'state', st: { name: 'Ada', intro: false, look: { female: true }, dept: 'CSC', t: 900 } }]);
  assert.equal(+(await R.cmd('HGET', 'user:' + a, 'onboarded')), 1); assert.equal(JSON.parse(await R.cmd('HGET', 'user:' + a, 'char')).name, 'Ada');
});
test('the balance check uses the latest save, and spends are counted right away', async () => {
  const a = await mkUser(0), b = await mkUser(0);
  await sync(a, [{ t: 'state', st: { name: 'A', money: 5000, intro: false, t: 1 } }]);
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: b, amount: 4000, ref: ref(), bal: 5000 }]), 'xfer_res')[0].ok, true);
  assert.equal(pickT(await sync(a, [{ t: 'xfer', to: b, amount: 2000, ref: ref(), bal: 5000 }]), 'xfer_res')[0].ok, false, 'only 1000 left even though the client still says 5000');
});
