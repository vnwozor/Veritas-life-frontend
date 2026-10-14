/* Cloudflare Durable Object: the shared world survives a restart (SQLite) and works over the live connection */
import { boot } from './harness.mjs';
const call = async (g, path, body, tok) => { const r = await g.fetch(new Request('https://x.dev' + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ 'Content-Type': 'application/json' }, tok ? { Authorization: 'Bearer ' + tok } : {}), body: body ? JSON.stringify(body) : undefined })); return { s: r.status, j: await r.json().catch(() => null) }; };
const phase = process.argv[2];
const { g } = await boot({ ADMIN_PASSWORD: 'adminpass123' });
const sync = async (tok, out, pos) => { const ws = (await g.fetch(new Request('https://x.dev/ws?token=' + tok, { headers: { Upgrade: 'websocket' } })))._ws; const got = []; ws.addEventListener('message', e => got.push(JSON.parse(e.data))); await new Promise(r => setTimeout(r, 20)); ws.send(JSON.stringify({ id: 5, out, pos, dv: null })); await new Promise(r => setTimeout(r, 120)); const s = got.find(m => m.t === 'sync'); return s ? s.body.in : []; };
const log = (...a) => console.log(...a);
if (phase === '1') {
  let r = await call(g, '/api/signup', { username: 'ama_k', fullname: 'Ama', email: 'ama@example.com', dept: 'CSC', age: 22, password: 'secret12' }); const t1 = r.j.token, id1 = r.j.user.id;
  r = await call(g, '/api/signup', { username: 'bayo_k', fullname: 'Bayo', email: 'bayo@example.com', dept: 'CSC', age: 22, password: 'secret12' }); const t2 = r.j.token, id2 = r.j.user.id;
  await sync(t1, [{ t: 'state', st: { name: 'Ama', money: 900000, intro: false, look: {}, t: 100 } }], { x: 1, z: 1, loc: 'out', name: 'Ama' });
  let m = await sync(t1, [{ t: 'xfer', to: id2, amount: 1000, ref: 'cfxferref001', bal: 900000 }]); log('xfer', JSON.stringify(m.filter(x => x.t === 'xfer_res').map(x => [x.ok, x.amount])));
  m = await sync(t1, [{ t: 'xfer', to: id2, amount: 1000, ref: 'cfxferref001', bal: 900000 }]); log('xfer retry', JSON.stringify(m.filter(x => x.t === 'xfer_res').map(x => [x.ok, !!x.dup])));
  m = await sync(t1, [{ t: 'drop', item: 'textbook', x: 1, z: 1, loc: 'out', ref: 'cfdropref01' }], { x: 1, z: 1, loc: 'out', name: 'Ama' }); log('drop', JSON.stringify(m.filter(x => x.t === 'drop_res').map(x => x.ok)));
  m = await sync(t1, [{ t: 'room_join', hall: 'boys', no: 104 }]); log('room', JSON.stringify(m.filter(x => x.t === 'room_res').map(x => x.ok)));
  m = await sync(t1, [{ t: 'prop_buy', id: 'prop1', ref: 'cfpropref01', bal: 900000 }]); log('buy prop1', JSON.stringify(m.filter(x => x.t === 'prop_res').map(x => [x.ok, x.reason])));
  await call(g, '/api/state', { state: { name: 'Ama', money: 899000 - 2500000 < 0 ? 0 : 0, intro: false, look: {}, t: 100 } }, t1);
  log('onboarded', (await call(g, '/api/me', null, t1)).j.user.onboarded);
  await new Promise(r => setTimeout(r, 300));
} else {
  let r = await call(g, '/api/login', { id: 'ama_k', password: 'secret12' }); const t1 = r.j.token;
  log('after restart · state', !!r.j.state, r.j.state && r.j.state.name, '· onboarded', r.j.user.onboarded, 'char', r.j.user.char && r.j.user.char.name, 'room', JSON.stringify(r.j.user.room));
  const m = await sync(t1, [{ t: 'xfer_hist' }, { t: 'prop_list' }, { t: 'room_list', hall: 'boys' }], { x: 1, z: 1, loc: 'out', name: 'Ama' });
  log('history kept', JSON.stringify(m.filter(x => x.t === 'xfer_hist').map(x => x.list.map(y => [y.dir, y.amount]))));
  log('drop kept', JSON.stringify(m.filter(x => x.t === 'drops').map(x => x.list.map(d => d.item))));
  log('room kept', JSON.stringify(m.filter(x => x.t === 'room_list').map(x => x.mine)));
  log('prop1 owner', JSON.stringify(m.filter(x => x.t === 'prop_list').map(x => x.list.find(p => p.id === 'prop1')).map(p => [p.owner ? 'owned' : 'free', p.mine])));
}
process.exit(0);
