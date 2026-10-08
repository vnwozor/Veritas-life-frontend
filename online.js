/* VERITAS LIFE · online client. Loaded before the game script; the game calls back through window.VLNet. */
(function () {
  'use strict';
  const TK = 'vl-token';
  const BASE = String(window.VL_API || '').replace(/\/+$/, ''); // empty = same server
  const WSBASE = BASE ? BASE.replace(/^http/, 'ws') : (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host;
  try { localStorage.removeItem('veritas-life-proto-v2'); localStorage.removeItem('veritas-autoboot'); } catch (e) { }
  const N = window.VLNet = { on: true, live: false, user: null, token: null, ws: null, online: [], threads: [], dms: {}, groups: [], others: new Map(), pvisit: null, fxq: [], booted: false };
  let VL = null;
  window.__VL = o => { VL = o; N.VL = o; };
  const $ = s => document.querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const escH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const S = () => VL && VL.S;
  const minOf = t => ((t % 1440) + 1440) % 1440;
  const naira = n => VL ? VL.naira(n) : '₦' + n;

  /* ---------- API ---------- */
  async function api(path, body) {
    const r = await fetch(BASE + path, { method: body ? 'POST' : 'GET', headers: Object.assign({ 'Content-Type': 'application/json' }, N.token ? { Authorization: 'Bearer ' + N.token } : {}), body: body ? JSON.stringify(body) : undefined });
    let j = {}; try { j = await r.json(); } catch (e) { j = { error: 'Network error' }; }
    if (!r.ok) { const err = new Error(j.error || 'Something went wrong'); err.code = r.status; throw err; }
    return j;
  }

  /* ---------- login / create account ---------- */
  let gate = null;
  function showGate(msg) {
    if (gate) gate.remove();
    gate = h('div', 'vlgate', `
      <div class="vlg-card">
        <div class="vlg-crest">V</div>
        <h1>VERITAS LIFE</h1>
        <p class="vlg-sub">Online · play as a student at Veritas, Bwari</p>
        <div class="vlg-tabs"><button data-m="in" class="on">Log in</button><button data-m="up">Create account</button></div>
        <form autocomplete="on">
          <label>Matric number</label>
          <div class="vlg-matric"><span>VUG/26/</span><input name="matric" placeholder="1234" autocomplete="username" inputmode="text" maxlength="24" required></div>
          <label>Password</label>
          <input name="password" type="password" placeholder="At least 6 characters" autocomplete="current-password" required minlength="6">
          <div class="vlg-up" hidden>
            <label>Confirm password</label>
            <input name="password2" type="password" placeholder="Type it again" autocomplete="new-password">
            <label class="vlg-check"><input type="checkbox" name="adult"> I am 18 or older <small>(unlocks mature storylines: smoking, the plug, night walks)</small></label>
          </div>
          <div class="vlg-err" role="alert">${escH(msg || '')}</div>
          <button class="vlg-go" type="submit">Log in</button>
        </form>
        <p class="vlg-note">Use a <b>new</b> password, never your school portal password.<br>Fan-made game. Not affiliated with Veritas University. All staff in the game are fictional NPCs.</p>
      </div>`);
    document.body.appendChild(gate);
    let mode = 'in'; const f = gate.querySelector('form'); const err = gate.querySelector('.vlg-err'); const go = gate.querySelector('.vlg-go');
    gate.querySelectorAll('.vlg-tabs button').forEach(b => b.onclick = () => { mode = b.dataset.m; gate.querySelectorAll('.vlg-tabs button').forEach(x => x.classList.toggle('on', x === b)); gate.querySelector('.vlg-up').hidden = mode !== 'up'; go.textContent = mode === 'up' ? 'Create account' : 'Log in'; f.password.autocomplete = mode === 'up' ? 'new-password' : 'current-password'; err.textContent = ''; });
    f.onsubmit = async e => {
      e.preventDefault(); err.textContent = '';
      const matric = 'VUG/26/' + f.matric.value.trim().toUpperCase().replace(/^VUG\/26\//, '');
      if (!/^VUG\/26\/[A-Z0-9]{2,12}(\/[A-Z0-9]{1,8})?$/.test(matric)) { err.textContent = 'Matric number should look like VUG/26/1234.'; return; }
      if (mode === 'up' && f.password.value !== f.password2.value) { err.textContent = 'Passwords do not match.'; return; }
      go.disabled = true; go.textContent = 'Please wait…';
      try { const j = await api(mode === 'up' ? '/api/signup' : '/api/login', { matric, password: f.password.value, adult: mode === 'up' && f.adult.checked }); N.token = j.token; try { localStorage.setItem(TK, j.token); } catch (e) { } enter(j.user, j.state); }
      catch (e2) { err.textContent = e2.message; go.disabled = false; go.textContent = mode === 'up' ? 'Create account' : 'Log in'; }
    };
  }
  function whenVL(fn) { if (VL) return fn(); setTimeout(() => whenVL(fn), 50); }
  function enter(user, state) {
    N.user = user; if (gate) { gate.remove(); gate = null; }
    connect();
    whenVL(() => {
      const c = $('#btnCont'); if (c) c.hidden = true; document.querySelectorAll('.spl .ghost').forEach(x => x.remove());
      if (state && !state.over) { VL.boot(VL.migrate(state)); }
      else { const n = $('#inName'); if (n && !n.value) n.placeholder = 'Your name'; }
      addAccountChip();
    });
  }
  function addAccountChip() { if ($('#vlAcct')) return; const a = h('button', 'vlacct', '<span>' + escH(N.user.matric) + '</span><b>Log out</b>'); a.id = 'vlAcct'; a.onclick = logout; const t = $('#title'); if (t) t.appendChild(a); }
  async function logout() { try { if (S()) await saveNow(VL.snapState()); await api('/api/logout', {}); } catch (e) { } try { localStorage.removeItem(TK); } catch (e) { } location.reload(); }
  N.logout = logout;

  /* ---------- realtime ---------- */
  let retry = 0, stopWS = false;
  /* Vercel version: no long-lived socket. The game syncs with /api/sync every 1–2.5 s
     (faster when other players are around or the phone is open). */
  N.out = []; N.pos = null; let syncing = false, syncT = null, nSync = 0, fails = 0;
  function connect() { if (stopWS) return; N.ws = { readyState: 1 }; wsSend({ t: 'threads' }); wsSend({ t: 'groups' }); schedule(30); }
  function schedule(ms) { clearTimeout(syncT); syncT = setTimeout(sync, ms); }
  async function sync() {
    if (stopWS) return; if (syncing) { schedule(250); return; } syncing = true;
    const out = N.out.splice(0, 40); nSync++;
    try {
      const r = await fetch(BASE + '/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + N.token }, body: JSON.stringify({ out, pos: N.booted ? N.pos : null, online: nSync % 3 === 1 }) });
      let j = {}; try { j = await r.json(); } catch (e) { }
      if (r.status === 401 || r.status === 403) { stopWS = true; try { localStorage.removeItem(TK); } catch (e) { } showGate(r.status === 403 ? 'This account has been banned by the game admin.' : 'Your session ended. Please log in again.'); return; }
      if (!r.ok) throw new Error('sync ' + r.status);
      fails = 0; (j.in || []).forEach(m => { try { onMsg(m); } catch (e) { console.error(e); } });
    } catch (e) { N.out.unshift(...out.filter(o => o.t !== 'state' || !N.out.some(x => x.t === 'state'))); fails++; }
    finally { syncing = false; N.dbg = { n: nSync, fails, at: Date.now(), out: N.out.length }; }
    const busy = N.others.size > 0 || (VL && VL.UI.phone);
    schedule(fails ? Math.min(15000, 1500 * fails) : N.out.length ? 120 : document.hidden ? 8000 : busy ? 1000 : 2500);
  }
  function wsSend(o) { if (o.t === 'state') { const i = N.out.findIndex(x => x.t === 'state'); if (i >= 0) N.out.splice(i, 1); } N.out.push(o); if (o.t !== 'state' && !syncing) schedule(120); return true; }
  N.send = wsSend;
  function bootMsg() { const s = S(); wsSend({ t: 'boot', name: s.name, look: s.look, lvl: s.level || 100, female: !!(s.look && s.look.female) }); }
  function rerender(views) { if (VL && VL.UI.phone && (!views || views.includes(VL.phoneView))) VL.renderPhone(); }
  function onMsg(m) {
    switch (m.t) {
      case 'fx': { N.fxSeen = N.fxSeen || new Set(); const fresh = m.list.filter(e => !N.fxSeen.has(e.id)); fresh.forEach(e => N.fxSeen.add(e.id)); N.fxq.push(...fresh); flushFx(); break; }
      case 'groups_dirty': wsSend({ t: 'groups' }); break;
      case 'pres': onPres(m.list); break;
      case 'online': N.online = m.list; rerender(['players', 'pprof', 'onew']); break;
      case 'threads': N.threads = m.list; rerender(['players']); break;
      case 'dm': { const other = m.m.from === N.user.id ? m.m.to : m.m.from; (N.dms[other] = N.dms[other] || []).push(m.m);
        const viewing = VL && VL.UI.phone && VL.phoneView === 'pchat' && VL.phoneArg === other;
        if (m.m.from !== N.user.id && !viewing && VL && S()) VL.toast(escH(m.m.name), escH(m.m.text.length > 80 ? m.m.text.slice(0, 78) + '…' : m.m.text));
        wsSend({ t: 'threads' }); rerender(['pchat', 'players']); break; }
      case 'dm_hist': N.dms[m.with] = m.list; N.names[m.with] = m.name; rerender(['pchat']); break;
      case 'groups': N.groups = m.list; rerender(['groups', 'ogroup']); break;
      case 'grp_req': if (VL && S()) VL.toast('Group request', escH(m.from) + ' wants to add you to "' + escH(m.name) + '". Open Phone → Groups.'); wsSend({ t: 'groups' }); break;
      case 'grp_ping': if (!m.me && VL && S() && !(VL.UI.phone && VL.phoneView === 'ogroup' && +VL.phoneArg === m.gid)) VL.toast(escH(m.from) + ' · group', escH(m.text.slice(0, 80))); break;
      case 'room_req': if (VL && S()) VL.dialog({ who: 'me', kicker: m.kind === 'ask' ? 'Room visit request' : 'Room invitation', text: m.kind === 'ask' ? '<b>' + escH(m.name) + '</b> wants to come to your room.' : '<b>' + escH(m.name) + '</b> is inviting you to their room.', choices: [{ t: 'Accept', fn: () => { wsSend({ t: 'room_resp', to: m.from, accept: true, kind: m.kind }); return m.kind === 'ask' ? 'Accepted. They can come to your room for the next 2 hours.' : 'Accepted. Go to your hostel and choose "Visit ' + escH(m.name) + '\'s room".'; } }, { t: 'Decline', fn: () => { wsSend({ t: 'room_resp', to: m.from, accept: false, kind: m.kind }); return null; } }] }); break;
      case 'room_ok': N.pvisit = { host: m.host, hostName: m.hostName, until: m.until }; if (VL && S()) VL.toast('Room visit', 'You can visit ' + m.hostName + '\'s room for the next 2 hours. Go to your hostel.'); break;
      case 'note': if (VL && S()) VL.toast('Veritas Online', escH(m.text)); break;
      case 'sent': if (VL && S()) VL.toast('Money sent', naira(m.amount) + ' sent to ' + m.name + '.'); break;
      case 'steal_res': onSteal(m); break;
      case 'banned': stopWS = true; try { localStorage.removeItem(TK); } catch (e) { } showGate('This account has been banned by the game admin.'); break;
      case 'kicked': stopWS = true; showGate('You logged in on another device or tab. Log in again to play here.'); break;
    }
  }
  N.names = {};

  /* ---------- effects from the server ---------- */
  function flushFx() {
    const s = S(); if (!s || !N.booted || s.over) return;
    const done = [];
    while (N.fxq.length) { const e = N.fxq.shift(); try { applyFx(e.type, e.data || {}); } catch (x) { console.error(x); } done.push(e.id); }
    if (done.length) { wsSend({ t: 'ack', ids: done }); VL.save(); }
  }
  function applyFx(type, d) {
    const s = S();
    switch (type) {
      case 'credit': if (s.captive) { s.captive.raised += d.amount; VL.toast('Ransom', (d.from || 'Someone') + ' sent ' + naira(d.amount) + ' towards your ransom.'); }
        else { VL.earn(d.amount, d.label || 'Money received'); if (d.from) VL.toast('Money received', d.from + ' sent you ' + naira(d.amount) + '.'); } break;
      case 'debit': s.money = Math.max(0, s.money - d.amount); s.tx.unshift({ t: s.t, l: d.label || 'Taken', a: -d.amount }); VL.toast('Money', d.label + ': ' + naira(d.amount)); break;
      case 'raid': window.__forceKidnap = !!d.taken; VL.banditRaid(true); break;
      case 'beaten': VL.N('health', -25); VL.N('stress', 25); VL.addMoodlet('Beaten by ' + d.byName + '\'s boys', -18, 2880); VL.setMood('Embarrassed', 600);
        VL.dialog({ who: 'me', kicker: 'Ambushed', text: escH(d.byName) + '\'s boys catch you behind the hostel. It\'s over in a minute: bruises, a torn shirt and a warning. They say it\'s because you ' + escH(d.why) + '.', choices: [{ t: 'Limp away', fn: () => { if (S().needs.health <= 0) VL.hospital(); return null; } }] }); break;
      case 'robbed': { const a = Math.min(s.money, d.amount); s.money -= a; s.tx.unshift({ t: s.t, l: 'Pickpocketed', a: -a }); VL.toast('Pickpocketed!', 'Someone took ' + naira(a) + ' from your pocket.', 'bad');
        if (d.known) { s.wrongs = s.wrongs || []; s.wrongs.push({ player: d.by, name: d.byName, info: 'player', why: 'pickpocketed ' + naira(a) + ' from you', amt: a, day: Math.floor(s.t / 1440) + 1, known: true, settled: false }); VL.msg('tunde', 'Guy, na ' + d.byName + ' pick your pocket o! I see am with my two eyes. Open the My Boys app if you wan do something.'); } break; }
      case 'note': VL.toast('Veritas Online', escH(d.text)); break;
      case 'announce': VL.dialog({ who: 'rep', kicker: '📢 Announcement', text: escH(d.text), choices: [{ t: 'Okay', fn: () => null }] }); break;
      case 'party': { if (s.oparty && s.oparty.pid === d.id) break; const m = minOf(s.t); const st = m < 20 * 60 ? 20 * 60 : m < 23 * 60 ? m + 30 : m + 30; VL.announceParty({ loc: d.loc, host: d.host, start: st, end: st + 300, pid: d.id }); break; }
      case 'reset': N.restart(VL.freshLife()); break;
    }
  }

  /* ---------- the game calls these ---------- */
  N.onBoot = st => { st.mature = !!N.user.adult; st.matric = N.user.matric; st.uid = N.user.id; N.booted = true; bootMsg(); setTimeout(() => { VL.save(); flushFx(); }, 600); };
  let saveT = null, lastState = null;
  N.save = st => { lastState = st; if (saveT) return; saveT = setTimeout(() => { saveT = null; if (!wsSend({ t: 'state', st: lastState })) saveNow(lastState); }, 2500); };
  async function saveNow(st) { try { await fetch(BASE + '/api/state', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + N.token }, body: JSON.stringify({ state: st }) }); } catch (e) { } }
  N.saveNow = saveNow;
  N.restart = async st => { stopWS = true; await saveNow(st); location.reload(); };
  window.addEventListener('pagehide', () => { if (S() && !S().over && N.booted) saveNow(VL.snapState()); });
  N.log = (type, data) => wsSend({ t: 'log', type, data });
  N.beat = (to, why) => wsSend({ t: 'beat', to, why });
  N.party = op => wsSend({ t: 'party', loc: op.loc });
  N.buy = async id => { try { const j = await api('/api/shop/buy', { pack: id }); VL.toast('Top up', naira(j.coins) + ' is on its way to your account' + (j.mode === 'test' ? ' (test mode, no real money charged).' : '.')); } catch (e) { VL.toast('Top up failed', e.message, 'bad'); } };
  N.acts = id => {
    const L = []; const s = S(); if (!s) return L;
    if (id === 'boys' && N.pvisit && N.pvisit.until > Date.now()) L.push({ label: 'Visit ' + N.pvisit.hostName + '\'s room', info: 'You were invited · real player', now: true, fn: () => { s.roomHost = N.pvisit.host; VL.enterBuilding('boys'); } });
    return L;
  };

  /* ---------- presence: other players in the same place ---------- */
  let posT = 0;
  function myLoc() { const s = S(); if (!s) return 'none'; if (s.inside) return s.inside === 'boys' ? 'room:' + (s.roomHost || N.user.id) : 'in:' + s.inside; return 'out'; }
  N.frame = (dt, now) => {
    const s = S(); if (!s || !N.booted) return;
    if (!s.inside && s.roomHost) s.roomHost = null;
    posT += dt;
    if (posT > 0.25) { posT = 0; const P = VL.P; const hidden = !VL.player || !VL.player.visible || s.captive;
      N.pos = ({ x: +P.x.toFixed(2), z: +P.z.toFixed(2), dir: +(P.dir || 0).toFixed(2), loc: myLoc(), anim: hidden ? 'hidden' : P.mode === 'walk' ? 'walk' : VL.ACT && VL.ACT.place ? VL.ACT.place.pose : 'stand', name: s.name, lvl: s.level || 100, st: s.captive ? 'kidnapped' : '', female: !!s.look.female, look: s.look }); }
    const t = now / 1000; const loc = myLoc();
    for (const [id, o] of N.others) {
      if (o.loc !== loc || Date.now() - o.seen > 7000) { removeOther(id); continue; }
      const k = Math.min(1, dt * 3.5); const dx = o.tx - o.x, dz = o.tz - o.z; o.x += dx * k; o.z += dz * k;
      let dd = o.tdir - o.dir; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; o.dir += dd * k;
      o.g.position.set(o.x, 0, o.z); o.g.rotation.y = o.dir; const moving = o.anim === 'walk' || Math.hypot(dx, dz) > 0.05; if (moving) o.walk += dt * 9;
      try { VL.pose(o.g, moving ? 'walk' : (o.anim || 'stand'), moving ? o.walk : t, dt); } catch (e) { VL.pose(o.g, 'stand', t, dt); }
      placeLabel(o);
    }
  };
  function parentFor(loc) { if (loc === 'out') return VL.outdoor; const id = loc.startsWith('room:') ? 'boys' : loc.slice(3); try { return VL.getInt(id).g; } catch (e) { return null; } }
  function onPres(list) {
    if (!VL || !S()) return; const loc = myLoc(); const seen = new Set();
    for (const p of list) {
      if (p.loc && p.loc !== loc) continue; seen.add(p.id); let o = N.others.get(p.id);
      if (!o || o.lookKey !== JSON.stringify(p.look)) { if (o) removeOther(p.id); const par = parentFor(loc); if (!par || !p.look) continue;
        let g; try { g = VL.makeSim(Object.assign({}, p.look)); } catch (e) { continue; } par.add(g); g.userData.netId = p.id;
        const lb = h('button', 'netlbl', ''); lb.onclick = e => { e.stopPropagation(); VL.setPhone('pprof', p.id); }; netLayer().appendChild(lb);
        o = { id: p.id, g, lb, x: p.x, z: p.z, dir: p.dir, walk: 0, lookKey: JSON.stringify(p.look), loc }; N.others.set(p.id, o); }
      Object.assign(o, { tx: p.x, tz: p.z, tdir: p.dir, anim: p.anim, name: p.name, lvl: p.lvl, st: p.st, loc, seen: Date.now() });
      o.lb.innerHTML = '<b>' + escH(p.name) + '</b><span>' + (p.st === 'kidnapped' ? 'kidnapped' : p.lvl + 'L') + '</span>';
    }
  }
  function removeOther(id) { const o = N.others.get(id); if (!o) return; if (o.g.parent) o.g.parent.remove(o.g); o.lb.remove(); N.others.delete(id); }
  let layer = null; function netLayer() { if (!layer) { layer = h('div', 'netlayer'); (document.getElementById('app') || document.body).appendChild(layer); } return layer; }
  const V3 = () => new (window.THREE.Vector3)();
  let tmpV = null;
  function placeLabel(o) { tmpV = tmpV || V3(); tmpV.set(o.x, 2.45, o.z); if (o.g.parent && o.g.parent !== VL.outdoor) o.g.parent.localToWorld(tmpV); tmpV.project(VL.camera);
    const vis = tmpV.z < 1 && Math.abs(tmpV.x) < 1.1 && Math.abs(tmpV.y) < 1.1 && !VL.UI.phone; o.lb.style.display = vis ? '' : 'none';
    if (vis) o.lb.style.transform = 'translate(' + ((tmpV.x + 1) / 2 * innerWidth) + 'px,' + ((1 - tmpV.y) / 2 * innerHeight) + 'px) translate(-50%,-100%)'; }

  /* ---------- pickpocketing real players ---------- */
  function onSteal(m) { const s = S(); if (!s) return;
    if (m.ok) { s.cd.steal = s.t + 120; VL.earn(m.amount, 'Pickpocketed a player'); VL.toast('Got away with it', naira(m.amount) + '. Your heart is pounding.'); return; }
    if (m.caught) { window.__forceSteal = 'caught'; VL.steal('pick'); return; }
    VL.toast('Pickpocket', m.reason || 'Not possible right now.'); }

  /* ---------- phone apps ---------- */
  const el = (t, c, x) => VL.el(t, c, x);
  const pb = (label, fn, dis) => { const b = h('button', null, label); if (dis) { b.disabled = true; b.title = dis; } b.onclick = () => { fn(); VL.renderPhone(); }; return b; };
  const prow = (...bs) => { const r = h('div', 'btnrow'); bs.forEach(x => r.append(x)); return r; };
  function pinfo(id) { return N.online.find(x => x.id === id) || (N.lastSearch || []).find(x => x.id === id) || N.threads.find(x => x.id === id) || { id, name: N.names[id] || 'Student' }; }
  function nearMe(id) { const o = N.others.get(id); if (!o) return false; const P = VL.P; return Math.hypot(o.x - P.x, o.z - P.z) < 7; }
  function sendMoney(p) { VL.closePhone(); const amts = [1000, 5000, 20000, 100000];
    VL.dialog({ who: 'me', kicker: 'Send money', text: 'How much do you want to send to <b>' + escH(p.name) + '</b>?' + (p.st === 'kidnapped' ? ' They are being held by bandits: it goes straight to the ransom.' : ''), choices: amts.map(a => ({ t: naira(a), fn: () => { if (!VL.spend(a, 'Sent to ' + p.name)) return 'You don\'t have ' + naira(a) + '.'; wsSend({ t: 'send', to: p.id, amount: a }); return null; } })).concat([{ t: 'Cancel', fn: () => null }]) }); }
  N.phone = (v, b, T) => {
    if (v === 'players') { T.textContent = 'Players';
      b.append(el('div', 'note', 'Real students playing right now. Tap a name to message them, send money, invite them to a group or to your room.'));
      const sr = h('input', 'gname'); sr.placeholder = 'Search by name or matric number'; sr.value = N.q || ''; let st = null; sr.oninput = () => { N.q = sr.value; clearTimeout(st); st = setTimeout(search, 300); }; b.append(sr);
      if (N.q && N.lastSearch) { b.append(el('div', 'sec', 'Search results')); N.lastSearch.forEach(p => b.append(prow2(p))); if (!N.lastSearch.length) b.append(el('div', 'note', 'Nobody found.')); }
      const others = N.online.filter(x => x.id !== N.user.id);
      b.append(el('div', 'sec', 'Online now · ' + others.length)); if (!others.length) b.append(el('div', 'note', 'Nobody else is online right now.'));
      others.forEach(p => b.append(prow2(Object.assign({ online: true }, p))));
      if (N.threads.length) { b.append(el('div', 'sec', 'Chats')); N.threads.forEach(t => { const r = el('button', 'thread', '<div class="av">' + VL.avatar('me') + '</div><div class="l"><b>' + escH(t.name) + '</b><span>' + (t.mine ? 'You: ' : '') + escH(t.last) + '</span></div><div class="tm">' + (t.unread ? '<em>' + t.unread + '</em>' : '') + '</div>'); r.onclick = () => VL.setPhone('pchat', t.id); b.append(r); }); }
      b.append(el('div', 'note', 'Logged in as ' + escH(N.user.matric) + '.')); b.append(prow(pb('Log out', () => logout())));
      return true; }
    if (v === 'pprof') { const id = +VL.phoneArg; const p = pinfo(id); T.textContent = p.name;
      b.append(el('div', 'prof', '<div class="av">' + VL.avatar('me') + '</div><b>' + escH(p.name) + '</b><span>' + (p.lvl || p.level || 100) + ' Level · ' + (p.online || N.online.some(x => x.id === id) ? 'online' : 'offline') + (p.st === 'kidnapped' || p.status === 'kidnapped' ? ' · <b style="color:var(--bad)">held by bandits</b>' : '') + '</span>'));
      const s = S(); const wrong = (s.wrongs || []).find(w => w.player === id && !w.settled);
      b.append(prow(pb('Message', () => VL.setPhone('pchat', id)), pb('Send money', () => sendMoney(Object.assign({ id }, p)))));
      b.append(prow(pb('Invite to your room', () => wsSend({ t: 'room', to: id, kind: 'invite' })), pb('Ask to visit their room', () => wsSend({ t: 'room', to: id, kind: 'ask' }))));
      b.append(prow(pb('Pickpocket', () => { VL.closePhone(); wsSend({ t: 'steal', to: id }); }, !nearMe(id) ? 'Get close to them first' : s.cd.steal > s.t ? 'Too many eyes on you' : !VL.mature() ? 'Not available' : null)));
      if (wrong) b.append(prow(pb('Call your boys on ' + p.name, () => { VL.closePhone(); VL.callBoys(wrong); }, VL.BOYS.filter(k => (s.rel[k] || 0) >= 60).length < 2 ? 'Need 2 loyal boys (60+)' : null)));
      b.append(el('div', 'note', 'Room visits follow hostel rules: same hostel only, and only if they accept.'));
      return true; }
    if (v === 'pchat') { const id = +VL.phoneArg; const p = pinfo(id); T.textContent = p.name; N.asked = N.asked || new Set(); if (!N.asked.has(id)) { N.asked.add(id); wsSend({ t: 'dm_hist', with: id }); }
      const list = N.dms[id] || []; if (!list.length) b.append(el('div', 'note', 'Say hi to ' + escH(p.name) + '. This is a real player.'));
      list.forEach(m => b.append(el('div', 'msg' + (m.from === N.user.id ? ' me' : ''), '<span>' + escH(m.text) + '</span><small>' + new Date(m.created).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</small>')));
      b.append(composer(t => wsSend({ t: 'dm', to: id, text: t })));
      setTimeout(() => { b.scrollTop = 1e6; }, 0); return true; }
    if (v === 'ogroup') { const g = N.groups.find(x => x.id === +VL.phoneArg); if (!g) { VL.setPhone('groups'); return true; } T.textContent = g.name; $('#pStat').textContent = g.members.filter(m => m.status === 'member').map(m => m.name).join(', ');
      g.msgs.forEach(m => { if (!m.from) b.append(el('div', 'daysep', escH(m.text))); else b.append(el('div', 'msg' + (m.from === N.user.id ? ' me' : ''), '<span>' + (m.from === N.user.id ? '' : '<b style="font-size:11px;color:var(--gold)">' + escH(m.name) + '</b><br>') + escH(m.text) + '</span><small>' + new Date(m.created).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</small>')); });
      const pend = g.members.filter(m => m.status === 'pending'); if (pend.length) b.append(el('div', 'note', 'Waiting for: ' + pend.map(m => escH(m.name)).join(', ')));
      b.append(composer(t => wsSend({ t: 'grp_msg', gid: g.id, text: t }))); b.append(prow(pb('Leave group', () => { wsSend({ t: 'grp_leave', gid: g.id }); VL.setPhone('groups'); })));
      setTimeout(() => { b.scrollTop = 1e6; }, 0); return true; }
    if (v === 'onew') { T.textContent = 'New group (players)'; N.sel = N.sel || [];
      const nm = h('input', 'gname'); nm.placeholder = 'Group name'; nm.maxLength = 30; nm.value = N.gname || ''; nm.oninput = () => N.gname = nm.value; b.append(nm);
      const pool = [...N.online.filter(x => x.id !== N.user.id), ...N.threads.filter(t => !N.online.some(o => o.id === t.id))];
      b.append(el('div', 'sec', 'Send requests to')); if (!pool.length) b.append(el('div', 'note', 'Nobody online yet. Chat with players first, then make a group.'));
      pool.forEach(p => { const on = N.sel.includes(p.id); const r = el('button', 'thread' + (on ? ' sel' : ''), '<div class="av">' + VL.avatar('me') + '</div><div class="l"><b>' + escH(p.name) + '</b><span>' + (N.online.some(o => o.id === p.id) ? 'online' : 'offline') + '</span></div><div class="tm">' + (on ? '✓' : '') + '</div>'); r.onclick = () => { N.sel = on ? N.sel.filter(x => x !== p.id) : N.sel.concat(p.id); VL.renderPhone(); }; b.append(r); });
      b.append(prow(pb('Create & send requests', () => { wsSend({ t: 'grp_new', name: (N.gname || '').trim() || 'The Squad', members: N.sel }); N.sel = []; N.gname = ''; VL.setPhone('groups'); }, !N.sel.length ? 'Pick at least one player' : null)));
      return true; }
    return false;
  };
  N.groupsView = b => {
    const nb = h('button', 'newchat', '<b>＋ New group with real players</b><span>They must accept your request to join</span>'); nb.onclick = () => VL.setPhone('onew'); b.append(nb);
    const pend = N.groups.filter(g => g.status === 'pending');
    pend.forEach(g => { b.append(el('div', 'bgcard', '<b>' + escH(g.name) + '</b><div class="note">Group request · ' + g.members.filter(m => m.status === 'member').map(m => escH(m.name)).join(', ') + '</div>')); b.append(prow(pb('Accept', () => wsSend({ t: 'grp_resp', gid: g.id, accept: true })), pb('Decline', () => wsSend({ t: 'grp_resp', gid: g.id, accept: false })))); });
    N.groups.filter(g => g.status === 'member').forEach(g => { const l = g.msgs[g.msgs.length - 1]; const r = el('button', 'thread', '<div class="av" style="display:grid;place-items:center;background:#1f5d8a;color:#fff;font-weight:700">' + escH(g.name[0] || 'G') + '</div><div class="l"><b>' + escH(g.name) + ' <small style="color:var(--info)">online</small></b><span>' + g.members.filter(m => m.status === 'member').length + ' members · ' + escH(l ? (l.from ? l.name + ': ' : '') + l.text : 'No messages yet') + '</span></div>'); r.onclick = () => VL.setPhone('ogroup', g.id); b.append(r); });
    if (N.groups.length) b.append(el('div', 'sec', 'Groups with NPC friends'));
  };
  function prow2(p) { const r = el('button', 'thread', '<div class="av">' + VL.avatar('me') + '</div><div class="l"><b>' + escH(p.name) + '</b><span>' + (p.lvl || p.level || 100) + ' Level' + (p.online ? ' · online' : '') + (p.st === 'kidnapped' || p.status === 'kidnapped' ? ' · <b style="color:var(--bad)">kidnapped</b>' : '') + '</span></div><div class="tm">' + (p.online ? '<i class="dot"></i>' : '') + '</div>'); r.onclick = () => VL.setPhone('pprof', p.id); return r; }
  async function search() { if (!N.q) { N.lastSearch = null; return VL.renderPhone(); } try { const j = await api('/api/players?q=' + encodeURIComponent(N.q)); N.lastSearch = j.players; VL.renderPhone(); } catch (e) { } }
  function composer(fn) { const f = h('div', 'gsend'); const i = h('input'); i.placeholder = 'Message'; i.maxLength = 500; i.value = N.draft || ''; i.oninput = () => { N.draft = i.value; }; const sb = h('button', null, 'Send'); const go = () => { const t = i.value.trim(); if (!t) return; fn(t); i.value = ''; N.draft = ''; }; sb.onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); }; f.append(i, sb); setTimeout(() => i.focus(), 50); return f; }

  /* ---------- start ---------- */
  function start() {
    let t = null; try { t = localStorage.getItem(TK); } catch (e) { }
    if (!t) return showGate();
    N.token = t; api('/api/me').then(j => enter(j.user, j.state)).catch(e => { if (e.code === 401 || e.code === 403) { try { localStorage.removeItem(TK); } catch (x) { } N.token = null; } showGate(e.code === 403 ? e.message : ''); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
