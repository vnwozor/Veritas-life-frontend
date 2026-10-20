/* Play-test harness: a real browser (phone-sized, touch), the real local server (dev-server.js, in-memory data,
   never production) and real sign-ups. Run any file here with  NODE_PATH=<folder with playwright> node <file> */
const { spawn } = require('child_process'); const path = require('path'); const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function server(port) { try{require('child_process').execSync('fuser -k '+port+'/tcp 2>/dev/null');}catch(e){}
 const p = spawn('node', ['dev-server.js'], { cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(port), KV_REST_API_URL: '', KV_REST_API_TOKEN: '', VERCEL: '' }), stdio: ['ignore', 'pipe', 'pipe'] });
  let log = ''; p.stdout.on('data', d => log += d); p.stderr.on('data', d => log += d); for (let i = 0; i < 80 && !log.includes('http://localhost'); i++) await sleep(100); p.log = () => log; SRV.push(p); return p; }
async function browser() { return chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] }); }
async function player(b, port, name, opt) { opt = opt || {};
  const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true }, opt.ctx || {})); const page = await ctx.newPage(); const errs = [], logs = [];
  await page.addInitScript((q) => { try { localStorage.setItem('veritas-quality', q); } catch (e) { } window.__QA = 1;
    /* catch any "undefined" or "NaN" that ever shows up on screen */
    window.__UNDEF = []; const chk = n => { const t = (n && (n.innerText || n.textContent)) || ''; const m = t.match(/.{0,40}\b(undefined|NaN)\b.{0,40}/); if (m && window.__UNDEF.length < 30) { let e = n.nodeType === 1 ? n : n.parentNode, path = []; for (let i = 0; e && i < 4; i++, e = e.parentNode) path.push((e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') || e.tagName); const st = document.querySelector('#shT'); const v = m[0] + ' @' + path.join('<') + (st ? ' [sheet: ' + st.textContent + ']' : '') + ' {' + ((n.nodeType === 1 ? n : n.parentNode).outerHTML || '').slice(0, 160) + '}'; if (!window.__UNDEF.includes(v)) window.__UNDEF.push(v); } };
    addEventListener('DOMContentLoaded', () => { new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') chk(m.target.parentNode); else m.addedNodes.forEach(chk); } }).observe(document.body, { childList: true, subtree: true, characterData: true }); }); }, opt.quality || 'low');
  page.on('pageerror', e => { errs.push(e.message); if (process.env.QA_HTTP) console.log('PAGEERR', e.stack); }); if (process.env.QA_HTTP) { page.on('response', r => { if (/api/.test(r.url())) console.log('HTTP', r.status(), r.request().method(), r.url().replace(/.*\/api/,'/api'), (r.request().headers().authorization||'').slice(0,14)); }); } page.on('console', m => { if (m.type() === 'error') logs.push(m.text()); }); page.setDefaultTimeout(120000);
  const ev = (f, a) => page.evaluate(f, a);
  await page.goto('http://localhost:' + port + '/'); await sleep(1500);
  await page.click('.vlg-tabs button[data-m=up]'); const user = name.toLowerCase() + Math.floor(Math.random() * 1e5);
  await page.fill('input[name=fullname]', name); await page.fill('input[name=username]', user); await page.fill('input[name=email]', user + '@example.com');
  await page.selectOption('select[name=dept]', 'CSC'); await page.fill('input[name=age]', String(opt.age || 21)); await page.fill('input[name=password]', 'secret12'); await page.fill('input[name=password2]', 'secret12');
  await page.click('.vlg-go'); await sleep(1500);
  /* wait for the account to be made (the create-player form appears), like a player would */
  for (let i = 0; i < 60; i++) { const ok = await ev(() => { const n = document.querySelector('#btnNext'); return !!(n && n.offsetParent !== null) || !!document.querySelector('#inName:not([disabled])') && !document.querySelector('.vlg-go:disabled'); }); if (ok) break; await sleep(500); } await sleep(1000);
  await ev(() => { document.querySelector('#btnNext').click(); document.querySelector('#btnStart').click(); }); await sleep(4000);
  /* skip the arrival cutscene the way the Skip button does, until it is really over */
  for (let i = 0; i < 40; i++) { const on = await ev(() => { const X = window.__VLX; if (X.CS.on) X.CS.skip = true; return X.CS.on; }); if (!on && i > 3) break; await sleep(500); } await sleep(2500);
  const closeD = () => ev(() => { const X = window.__VLX; let g = 0; while (X.UI.dlg && g++ < 10) { X.UI.dlgQ = []; X.closeDlg(); } });
  for (let g = 0; g < 10; g++) { await closeD(); const ins = await ev(() => { const X = window.__VLX; if (X.S.inside) X.exitBuilding(); return X.S.inside; }); if (!ins) break; await sleep(2000); }
  await closeD(); await ev(() => { const S = window.__VLX.S; if (S.intro) { S.intro = false; S.flags.arrived = 1; } }); await sleep(2500); await closeD();
  return { page, ctx, ev, closeD, errs, logs, user, undef: () => ev(() => window.__UNDEF || []) };
}
const until = async (ev, f, ms, arg) => { const t0 = Date.now(); while (Date.now() - t0 < (ms || 15000)) { const v = await ev(f, arg); if (v) return v; await sleep(300); } return null; };
process.on('exit',()=>{try{for(const p of SRV)p.kill();}catch(e){}});const SRV=[];
module.exports = { server, browser, player, sleep, until, ROOT };
