/* Server rules for the city upgrade: businesses, player-hosted events, leaderboards, city houses.
   Run with  node --test tests/  (in-memory engine, never real data) */
const test = require('node:test'); const assert = require('node:assert');
process.env.KV_REST_API_URL = ''; process.env.KV_REST_API_TOKEN = ''; process.env.REDIS_URL = '';
const R = require('../lib/redis'); const api = require('../api/index.js'); const W = api.world;
let seq = 0;
async function mkUser(money) { const id = 7000 + (++seq); await R.pipe([['HSET', 'user:' + id, 'matric', 'VUG/26/C' + id, 'name', 'City' + id, 'money', money]]); return id; }
const ref = () => 'ref' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
const sync = async (me, out) => (await api.doSync(me, { out })).body.in;
const pickT = (msgs, t) => msgs.filter(m => m.t === t);
const money = async id => +(await R.cmd('HGET', 'user:' + id, 'money'));

test('the city houses (including the mansion) can be bought', async () => {
  for (const id of ['prop5', 'prop6', 'prop7', 'prop8']) assert.ok(W.PROPS[id], id);
  const a = await mkUser(50000000); const r = pickT(await sync(a, [{ t: 'prop_buy', id: 'prop8', ref: ref(), bal: 50000000 }]), 'prop_res')[0];
  assert.equal(r.ok, true); assert.equal(await money(a), 50000000 - W.PROPS.prop8.price);
});
test('a business has one owner, even when two buy at once', async () => {
  const a = await mkUser(5000000), b = await mkUser(5000000);
  const [r1, r2] = await Promise.all([sync(a, [{ t: 'biz_buy', id: 'biz2', ref: ref(), bal: 5000000 }]), sync(b, [{ t: 'biz_buy', id: 'biz2', ref: ref(), bal: 5000000 }])]);
  const wins = [pickT(r1, 'biz_res')[0], pickT(r2, 'biz_res')[0]].filter(x => x.ok); assert.equal(wins.length, 1);
  const owner = pickT(r1, 'biz_res')[0].ok ? a : b, other = owner === a ? b : a;
  assert.equal(await money(owner), 5000000 - W.BIZ.biz2.price); assert.equal(await money(other), 5000000, 'the loser is not charged');
  assert.equal(pickT(await sync(other, [{ t: 'biz_collect', id: 'biz2', ref: ref() }]), 'biz_res')[0].ok, false, 'only the owner collects');
});
test('a business sells every day from its stock, pays staff, and the takings are collected once', async () => {
  const a = await mkUser(10000000); await sync(a, [{ t: 'biz_buy', id: 'biz5', ref: ref(), bal: 10000000 }]);
  await sync(a, [{ t: 'biz_staff', id: 'biz5', n: 2, ref: ref() }]);
  /* pretend three shared days have passed since it was last settled */
  const s = JSON.parse(await R.cmd('GET', 'biz:biz5')); s.last = W.uDay() - 3; await R.cmd('SET', 'biz:biz5', JSON.stringify(s));
  const list = pickT(await sync(a, [{ t: 'biz_list' }]), 'biz_list')[0].list; const v = list.find(x => x.id === 'biz5');
  assert.equal(v.lastDays, 3); assert.ok(v.lastSold > 0 && v.stock === W.BIZ.biz5.stock0 - v.lastSold, 'stock goes down by what was sold');
  assert.ok(v.bank > 0, 'takings minus wages');
  const r = ref(); const m0 = await money(a);
  const c1 = pickT(await sync(a, [{ t: 'biz_collect', id: 'biz5', ref: r }]), 'biz_res')[0]; assert.equal(c1.ok, true); assert.equal(c1.collected, v.bank);
  const c2 = pickT(await sync(a, [{ t: 'biz_collect', id: 'biz5', ref: r }]), 'biz_res')[0]; assert.equal(c2.collected, v.bank, 'a retry returns the same answer');
  assert.equal(await money(a), m0 + v.bank, 'paid once');
  const again = pickT(await sync(a, [{ t: 'biz_collect', id: 'biz5', ref: ref() }]), 'biz_res')[0]; assert.equal(again.ok, false, 'nothing left to collect');
});
test('restocking and upgrades are charged, with a balance check', async () => {
  const a = await mkUser(2000000); await sync(a, [{ t: 'biz_buy', id: 'biz4', ref: ref(), bal: 2000000 }]);
  const before = await money(a); const st = pickT(await sync(a, [{ t: 'biz_stock', id: 'biz4', units: 50, ref: ref(), bal: before }]), 'biz_res')[0];
  assert.equal(st.ok, true); assert.equal(await money(a), before - 50 * W.BIZ.biz4.unit);
  const up = pickT(await sync(a, [{ t: 'biz_up', id: 'biz4', ref: ref(), bal: 10 }]), 'biz_res')[0]; assert.equal(up.ok, false, 'cannot upgrade without the money');
});
test('a venue hosts one event a night and guests check in once', async () => {
  const h = await mkUser(100000), g = await mkUser(0), h2 = await mkUser(100000);
  const r1 = pickT(await sync(h, [{ t: 'ev_host', place: 'club', title: 'Night', ref: ref(), bal: 100000 }]), 'ev_host_res')[0]; assert.equal(r1.ok, true);
  const r2 = pickT(await sync(h2, [{ t: 'ev_host', place: 'club', title: 'Other', ref: ref(), bal: 100000 }]), 'ev_host_res')[0]; assert.equal(r2.ok, false, 'already booked');
  const id = r1.id; const j1 = pickT(await sync(g, [{ t: 'ev_join', id, ref: ref() }]), 'ev_res')[0]; assert.equal(j1.ok, true);
  const j2 = pickT(await sync(g, [{ t: 'ev_join', id, ref: ref() }]), 'ev_res')[0]; assert.equal(j2.ok, false);
  const fx = pickT(await sync(h, []), 'fx')[0]; assert.ok(fx && fx.list.some(e => e.type === 'credit' && e.data.amount === 2000), 'the host earns per guest');
});
test('leaderboards keep best scores and refuse nonsense', async () => {
  const a = await mkUser(0); await sync(a, [{ t: 'lb_set', k: 'arcade', v: 20 }, { t: 'lb_set', k: 'arcade', v: 12 }, { t: 'lb_set', k: 'fish', v: 999 }, { t: 'lb_set', k: 'hack', v: 5 }]);
  const l = pickT(await sync(a, [{ t: 'lb_get', k: 'arcade' }]), 'lb')[0].list; assert.equal(l.find(x => x.me).v, 20, 'best score kept');
  const f = pickT(await sync(a, [{ t: 'lb_get', k: 'fish' }]), 'lb')[0].list; assert.ok(f.find(x => x.me).v <= 12.5, 'impossible fish clamped');
  assert.equal(pickT(await sync(a, [{ t: 'lb_get', k: 'hack' }]), 'lb')[0].list.length, 0);
});
