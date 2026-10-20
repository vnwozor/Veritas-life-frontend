/* End-to-end player journeys in a real browser against the local server (never production).
   Run:  NODE_PATH=<folder with playwright> node tests/e2e/journeys.js
   Two accounts play in the same world: time, sleep/nap, keke cancel and boarding, dropping and picking up items,
   rooms, assignments, houses, the club, concert tickets, money transfers, logout/login without character creation. */
const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..'); const PORT = 3400 + Math.floor(Math.random() * 400); const OUT = process.env.OUT || '/tmp/vl-e2e';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (name, pass, info) => { results.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
async function server() { const p = spawn('node', ['dev-server.js'], { cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(PORT), KV_REST_API_URL: '', KV_REST_API_TOKEN: '', VERCEL: '' }), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; p.stdout.on('data', d => log += d); p.stderr.on('data', d => log += d); for (let i = 0; i < 80 && !log.includes('http://localhost'); i++) await sleep(100); return p; }
async function player(b, name) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true }); const page = await ctx.newPage(); const errs = [];
  await page.addInitScript(() => { try { localStorage.setItem('veritas-quality', 'low'); } catch (e) { } window.__QA = 1; });
  page.on('pageerror', e => errs.push(e.message)); page.setDefaultTimeout(120000);
  const ev = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:' + PORT + '/'); await sleep(1500);
  await page.click('.vlg-tabs button[data-m=up]'); const user = name.toLowerCase() + Math.floor(Math.random() * 1e5);
  await page.fill('input[name=fullname]', name); await page.fill('input[name=username]', user); await page.fill('input[name=email]', user + '@example.com');
  await page.selectOption('select[name=dept]', 'CSC'); await page.fill('input[name=age]', '21'); await page.fill('input[name=password]', 'secret12'); await page.fill('input[name=password2]', 'secret12');
  await page.click('.vlg-go'); await sleep(2500);
  const prefilled = await ev(() => document.querySelector('#inName').value);
  await ev(() => { document.querySelector('#btnNext').click(); document.querySelector('#btnStart').click(); }); await sleep(4000);
  await ev(() => { window.__VLX.CS.skip = true; }); await sleep(6000);
  const closeD = () => ev(() => { const X = window.__VLX; let g = 0; while (X.UI.dlg && g++ < 10) { X.UI.dlgQ = []; X.closeDlg(); } });
  for (let g = 0; g < 10; g++) { await closeD(); const ins = await ev(() => { const X = window.__VLX; if (X.S.inside) X.exitBuilding(); return X.S.inside; }); if (!ins) break; await sleep(2000); }
  await closeD(); await ev(() => { const S = window.__VLX.S; if (S.intro) { S.intro = false; S.flags.arrived = 1; } }); await sleep(3000); await closeD();
  return { page, ctx, ev, closeD, errs, user, prefilled };
}
const until = async (ev, f, ms, arg) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 15000)) { const v = await ev(f, arg); if (v) return v; await sleep(400); } return null; };
(async () => {
  fs.mkdirSync(OUT, { recursive: true }); const srv = await server(); const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  try {
    const A = await player(b, 'Amaka'), B = await player(b, 'Bayo');
    ok('create form uses the registered name', A.prefilled === 'Amaka', A.prefilled);
    /* ---- time ---- */
    const t0 = await A.ev(() => window.__VLX.S.t); await sleep(9000); const t1 = await A.ev(() => window.__VLX.S.t);
    ok('1 game hour = 3 real minutes (9 s ≈ 3 game minutes)', t1 - t0 >= 2 && t1 - t0 <= 4, t1 - t0);
    ok('clock is shared', await A.ev(() => { const S = window.__VLX.S, L = window.__L3; return Math.abs(Math.floor(L.uNow()) - S.tOff - S.t) <= 1; }));
    const dur = await A.ev(() => { const L = window.__L3, X = window.__VLX, VL = window.VLX_ || null; const sa = s => { window.__W3.W3; return s; };
      const res = {}; const st = (lbl, m, o) => { X.UI.dlgQ = []; window.__L3.stopAction(); const f = window.__VLRAW.startAction; f(lbl, m, o); res[lbl] = window.__L3.ACT && window.__L3.ACT.total; window.__L3.stopAction(); };
      st('Sleeping', 480, { sleep: true }); st('Napping', 120, { sleep: true }); st('Lecture: CSC 101', 120, { cls: {} }); st('Eating rice', 45, {}); st('Partying at X', 120, {}); return res; });
    ok('sleep takes 30 game minutes', dur['Sleeping'] === 30, dur); ok('nap takes 10 game minutes', dur['Napping'] === 10); ok('lecture capped at 30', dur['Lecture: CSC 101'] === 30); ok('eating 10', dur['Eating rice'] === 10); ok('party 60', dur['Partying at X'] === 60);
    ok('Sleep need exists', await A.ev(() => window.__VLX.S.needs.sleep != null));
    /* ---- keke: cancel while it comes ---- */
    const kc = await A.ev(async () => { const VL = window.__VLRAW, X = window.__VLX; X.S.money = Math.max(X.S.money, 5000); VL.callKeke('library'); await new Promise(r => setTimeout(r, 800)); const bar = !document.querySelector('#w3ride').hidden; const k = X.W.ride && X.W.ride.k;
      document.querySelector('#w3ride .x').click(); await new Promise(r => setTimeout(r, 300)); return { bar, cancelled: !X.W.ride, kmode: k && k.mode }; });
    ok('cancel ride button shows and cancels', kc.bar && kc.cancelled && kc.kmode === 'ambient', kc);
    /* ---- keke: boarding ---- */
    await A.closeD(); const kb = await A.ev(async () => { const VL = window.__VLRAW, X = window.__VLX; VL.callKeke('library'); const R2 = X.W.ride; const k = R2.k; k.x = X.P.x + 3; k.z = X.P.z; k.g.position.set(k.x, 0, k.z); k.mode = 'wait'; const m0 = X.S.money;
      for (let i = 0; i < 40 && !(R2.boarded && X.W.ride && X.W.ride.phase === 'ride'); i++) { if (X.UI.dlg) { X.UI.dlgQ = []; X.closeDlg(); } await new Promise(r => setTimeout(r, 300)); }
      return { boarded: !!R2.boarded, phase: X.W.ride && X.W.ride.phase, paidOnce: m0 - X.S.money, visible: window.__VLRAW.player.visible }; });
    ok('keke boarding: walk up, climb in, then ride', kb.boarded && kb.phase === 'ride' && kb.visible === false, kb);
    await A.ev(() => { const X = window.__VLX; if (X.W.ride) X.W.ride.k.mode = 'drop'; }); for (let i = 0; i < 6; i++) { await A.closeD(); await sleep(400); }
    /* the keke stops, you step out, then it leaves: wait for that like a player would */
    await until(A.ev, () => { const X = window.__VLX; if (X.UI.dlg) { X.UI.dlgQ = []; X.closeDlg(); } return !X.W.ride; }, 20000);
    const ke = await A.ev(() => { const X = window.__VLX; return { ride: !!X.W.ride, visible: window.__VLRAW.player.visible }; }); ok('keke exit: out of the ride and visible', !ke.ride && ke.visible, ke);
    await A.closeD(); await B.closeD();
    /* ---- both in the same place for items ---- */
    await A.ev(() => { const X = window.__VLX; X.P.x = 10; X.P.z = 40; X.P.path = null; }); await B.ev(() => { const X = window.__VLX; X.P.x = 10.5; X.P.z = 40.5; X.P.path = null; }); await sleep(2500);
    await A.ev(() => { const X = window.__VLX; X.S.inv.umbrella = true; window.__W3.dropItem('umbrella'); });
    const seen = await until(B.ev, () => (window.__W3.W3.drops.out || []).some(d => d.item === 'umbrella'), 15000);
    ok('another player sees the dropped umbrella', !!seen);
    ok('dropper no longer has it', !(await A.ev(() => window.__W3.invCount('umbrella'))));
    const before = await B.ev(() => window.__W3.invCount('umbrella'));
    await B.ev(() => { const d = (window.__W3.W3.drops.out || []).find(d => d.item === 'umbrella'); window.__VLX.P.x = d.x; window.__VLX.P.z = d.z; window.__W3.pickItem(d); });
    const got = await until(B.ev, b0 => window.__W3.invCount('umbrella') > b0, 12000, before); ok('the other player picks it up', !!got);
    const goneA = await until(A.ev, () => !(window.__W3.W3.drops.out || []).some(d => d.item === 'umbrella'), 15000); ok('it is gone for everybody', !!goneA);
    /* ---- money transfer A → B ---- */
    await A.ev(() => { window.__VLX.S.money = 50000; window.__VLRAW.save(); }); await sleep(4000);
    const bUser = B.user; const bId = await B.ev(() => window.VLNet.user.id); const bMoney0 = await B.ev(() => window.__VLX.S.money);
    await A.ev(id => { const N = window.VLNet; N.payTo = { id, name: 'Bayo' }; N.payAmt = '12000'; window.__VLRAW.openPhone(); window.__VLRAW.setPhone('pmoney', id); }, bId); await sleep(500);
    await A.ev(() => document.querySelector('.psend').click()); await sleep(400);
    const confirm = await A.ev(() => (document.querySelector('#dlg') || {}).innerText || ''); ok('confirm screen shows recipient and amount', /Bayo/.test(confirm) && /12,000/.test(confirm));
    await A.ev(() => { const b = [...document.querySelectorAll('#dlg .ch button')].find(x => /Send/.test(x.textContent)); b.click(); });
    const aMoney = await until(A.ev, () => window.__VLX.S.money === 38000 && window.__VLX.S.money, 15000);
    const bMoney = await until(B.ev, m0 => window.__VLX.S.money >= m0 + 12000 && window.__VLX.S.money, 20000, bMoney0); ok('receiver gets it', bMoney === bMoney0 + 12000, { bMoney, bMoney0 });
    await A.ev(() => window.VLNet.send({ t: 'xfer_hist' })); const hist = await until(A.ev, () => window.VLNet.xhist && window.VLNet.xhist.length && window.VLNet.xhist, 10000); ok('transfer history', hist && hist[0].dir === 'out' && hist[0].amount === 12000);
    await A.ev(id => window.VLNet.send({ t: 'xfer', to: id, amount: 99999999, ref: 'overdraft' + Date.now(), bal: 99999999 }), bId);
    await sleep(3000); ok('overdraft refused', (await A.ev(() => window.__VLX.S.money)) === 38000);
    /* ---- rooms ---- */
    await A.ev(() => window.VLNet.send({ t: 'room_join', hall: 'boys', no: 106 })); const rn = await until(A.ev, () => window.__VLX.S.roomNo === 106, 10000); ok('register for a hostel room', !!rn);
    /* ---- assignments ---- */
    const asg = await A.ev(() => { const W3 = window.__W3, S = window.__VLX.S; const a = W3.acad(); const d = Math.floor(S.t / 1440) + 1; a.asg.push({ id: 'qa1', code: 'CSC 101', title: 'Problem set', set: d - 4, due: d - 1, st: 'ready', q: 80 }); W3.submitAssignment(a.asg[a.asg.length - 1]); return a.asg[a.asg.length - 1]; });
    ok('late assignment loses 15 marks a day', asg.st === 'submitted' && asg.score === 65, asg);
    await A.ev(() => { window.__VLRAW.openPhone(); window.__VLRAW.setPhone('grades'); }); await sleep(400); ok('grades dashboard renders', /CGPA/.test(await A.ev(() => document.querySelector('#pBody').innerText)));
    await A.ev(() => window.__VLRAW.closePhone());
    /* ---- houses ---- */
    await A.ev(() => { window.__VLX.S.money = 3000000; window.__VLRAW.save(); }); await sleep(4000);
    await A.ev(() => window.VLNet.send({ t: 'prop_list' })); await until(A.ev, () => window.__W3.W3.props, 8000);
    await A.ev(() => { const S = window.__VLX.S; const ref = 'p-qa-' + Date.now(); window.__W3.W3.pend[ref] = 1; window.VLNet.send({ t: 'state', st: window.__VLRAW.snapState() }); window.VLNet.send({ t: 'prop_buy', id: 'prop4', ref, bal: S.money }); });
    const bought = await until(A.ev, () => { const p = window.__W3.W3.props && window.__W3.W3.props.list.find(x => x.id === 'prop4'); return p && p.mine === 'owner'; }, 12000);
    const m1 = await A.ev(() => window.__VLX.S.money); ok('buy the mini flat', !!bought); const buyTx = await A.ev(() => window.__VLX.S.tx.filter(t => /Bought Mini Flat/.test(t.l)).map(t => t.a)); ok('price taken once', buyTx.length === 1 && buyTx[0] === -1500000, { buyTx, spentOverall: 3000000 - m1 });
    const n1 = await A.ev(() => window.__VLX.S.tx.filter(t => /Bought Mini Flat/.test(t.l)).length); ok('one ledger line for the purchase', n1 === 1, n1);
    await B.ev(() => window.VLNet.send({ t: 'prop_list' })); await until(B.ev, () => window.__W3.W3.props, 8000);
    const bTry = await B.ev(() => { window.__VLRAW.enterBuilding('prop4'); return window.__VLX.S.inside; }); ok('another player can not walk into your home', !bTry);
    /* ---- concert ticket ---- */
    await B.ev(() => { window.__VLX.S.money = 100000; window.__VLRAW.save(); }); await sleep(4000);
    await B.ev(() => { window.__VLRAW.concertSet({ id: 'qa-con-' + Date.now(), title: 'QA Night', lineup: ['Test Artist'], inDays: 1, hour: 20, price: 5000, vip: 25000 }); });
    const tix = await B.ev(async () => { window.__W3.ticketSheet(); await new Promise(r => setTimeout(r, 300)); const b = [...document.querySelectorAll('#shB .opt')].find(x => /Regular/.test(x.textContent)); b.click(); for (let i = 0; i < 30 && !window.__VLX.S.ticket; i++) await new Promise(r => setTimeout(r, 300)); return { t: window.__VLX.S.ticket, m: window.__VLX.S.money }; });
    ok('concert ticket bought through the server, charged once', tix.t && tix.m === 95000, tix);
    /* ---- the club ---- */
    const club = await A.ev(async () => { const X = window.__VLX, S = X.S, L = window.__L3; const d = Math.floor(S.t / 1440) * 1440 + 22 * 60; S.tOff = Math.floor(L.uNow()) - d - 1440; await new Promise(r => setTimeout(r, 1500)); X.UI.dlgQ = []; X.closeDlg();
      const D = X.LOCS.club.door; X.P.x = D.x; X.P.z = D.z + 1; S.money = Math.max(S.money, 10000); window.__VLRAW.enterBuilding('club'); await new Promise(r => setTimeout(r, 400)); const pay = [...document.querySelectorAll('#dlg .ch button')].find(x => /Pay/.test(x.textContent)); if (pay) pay.click();
      for (let i = 0; i < 20 && S.inside !== 'club'; i++) await new Promise(r => setTimeout(r, 300)); return S.inside; });
    ok('Club Vibez: pay the cover, go in', club === 'club', club);
    await A.page.screenshot({ path: OUT + '/club.png' });
    /* ---- returning player: log out and back in, no character creation, no arrival ---- */
    await A.ev(() => window.__VLRAW.save()); await sleep(3500);
    await A.ev(async () => { await window.VLNet.saveNow(window.__VLRAW.snapState()); }); const name1 = await A.ev(() => window.__VLX.S.name);
    await A.ev(() => { localStorage.clear(); }); /* a different device: no local backup */
    await A.page.reload(); await sleep(2000); await A.page.fill('input[name=ident]', A.user); await A.page.fill('input[name=password]', 'secret12'); await A.page.click('.vlg-go'); await sleep(7000);
    const back = await A.ev(() => ({ title: document.querySelector('#title').hidden, name: window.__VLX.S && window.__VLX.S.name, intro: window.__VLX.S && window.__VLX.S.intro, cs: window.__VLX.CS.on }));
    ok('returning player goes straight in on a new device', back.title && back.name === name1 && !back.intro && !back.cs, back);
    ok('no page errors (A)', !A.errs.length, A.errs.slice(0, 5)); ok('no page errors (B)', !B.errs.length, B.errs.slice(0, 5));
  } catch (e) { ok('journey crashed', false, String(e && e.stack || e).slice(0, 600)); }
  finally { await b.close(); srv.kill(); fs.writeFileSync(OUT + '/results.json', JSON.stringify(results, null, 1)); const f = results.filter(r => !r.pass); console.log('\n' + (results.length - f.length) + ' passed, ' + f.length + ' failed'); process.exit(f.length ? 1 : 0); }
})();
