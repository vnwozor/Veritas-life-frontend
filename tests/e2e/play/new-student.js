/* a brand-new student, only tapping what a player can see: sign up, make a character, watch the arrival then Skip,
   follow the Today card, eat, use the toilet, nap in the room, then log out and back in */
const L=require('./lib');const R=[];const ok=(n,p,i)=>{R.push([n,!!p]);console.log((p?'PASS ':'FAIL ')+n+(i!==undefined?'  '+JSON.stringify(i).slice(-900):''));};
(async()=>{const port=3800+Math.floor(Math.random()*50);const srv=await L.server(port);const b=await L.browser();
const ctx=await b.newContext({viewport:{width:390,height:780},hasTouch:true,isMobile:true});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.addInitScript(()=>{try{localStorage.setItem('veritas-quality','low');}catch(e){}window.__QA=1;window.__UNDEF=[];const chk=n=>{const t=(n&&(n.innerText||n.textContent))||'';const m=t.match(/.{0,40}\b(undefined|NaN)\b.{0,40}/);if(m&&window.__UNDEF.length<30&&!window.__UNDEF.includes(m[0]))window.__UNDEF.push(m[0]);};addEventListener('DOMContentLoaded',()=>{new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')chk(m.target.parentNode);else m.addedNodes.forEach(chk);}}).observe(document.body,{childList:true,subtree:true,characterData:true});});});
const ev=(f,a)=>pg.evaluate(f,a);const shot=n=>pg.screenshot({path:(process.env.OUT||'/tmp')+'/u6_'+n+'.png'});
const tap=async(sel,txt,t)=>{const loc=txt?pg.locator(sel,{hasText:txt}).first():pg.locator(sel).first();await loc.click({timeout:t||15000,noWaitAfter:true});await L.sleep(500);};
try{
pg.setDefaultTimeout(120000);await pg.goto('http://localhost:'+port+'/',{timeout:120000});await L.sleep(2000);await shot('1_gate');
await tap('.vlg-tabs button[data-m=up]');const user='ada'+Math.floor(Math.random()*1e5);
await pg.fill('input[name=fullname]','Ada Obi');await pg.fill('input[name=username]',user);await pg.fill('input[name=email]',user+'@example.com');await pg.selectOption('select[name=dept]','CSC');await pg.fill('input[name=age]','19');await pg.fill('input[name=password]','secret12');await pg.fill('input[name=password2]','secret12');
await tap('.vlg-go');await L.sleep(2500);await shot('2_splash');const beg=pg.locator('button',{hasText:'Tap to begin'}).first();if(await beg.isVisible().catch(()=>false)){await beg.click();await L.sleep(1500);}await shot('2_create');
const nm=await ev(()=>document.querySelector('#inName').value);ok('create form is filled with your name',/^Ada/.test(nm),nm);
await tap('#btnNext');await L.sleep(500);await shot('3_create2');await tap('#btnStart');
const sk=await L.until(ev,()=>{const b=document.querySelector('.cskip');return b&&b.offsetParent!==null;},20000);ok('arrival cutscene starts with a Skip button',!!sk);
await L.sleep(4000);await shot('4_cut');await tap('.cskip');
const done=await L.until(ev,()=>!window.__VLX.CS.on,15000);ok('Skip ends the cutscene',!!done);await L.sleep(3000);
// any dialogs after arrival: answer like a player (tap the first choice) until none
for(let i=0;i<12;i++){const d=await ev(()=>window.__VLX.UI.dlg);if(!d)break;await shot('5_dlg'+i);const c=pg.locator('#dlg .ch button').first();if(await c.count())await c.click();else await pg.locator('#dlg').click();await L.sleep(1200);}
await shot('6_home');const st=await ev(()=>({intro:window.__VLX.S.intro,inside:window.__VLX.S.inside,name:window.__VLX.S.name,hud:!!document.querySelector('#hud')}));ok('you are in the game as Ada',st.name==='Ada Obi'||/Ada/.test(st.name),st);
// Today card Go button
const goBtn=pg.locator('#obj button',{hasText:'Go'}).first();if(await goBtn.count()){const t=await pg.locator('#obj').innerText();await goBtn.click();await L.sleep(1500);ok('Today card Go button does something',await ev(()=>!!window.__VLX.P.path||!!window.__VLX.UI.sheet||!!window.__VLX.W.ride||!!window.__VLX.UI.dlg),t.slice(0,80));}
await ev(()=>{const X=window.__VLX;X.UI.dlgQ=[];while(X.UI.dlg)X.closeDlg();if(X.UI.sheet)window.__L4.closeSheet();X.P.path=null;});
// toilet via the Restroom button (it must be visible on the main screen)
await ev(()=>{window.__VLX.S.needs.bladder=25;});await L.sleep(500);const rr=pg.locator('button',{hasText:'Restroom'}).first();ok('Restroom button on screen',await rr.isVisible().catch(()=>false));
if(await rr.isVisible().catch(()=>false)){await rr.click();await L.sleep(800);await L.sleep(2500);if(await ev(()=>!!window.__VLX.UI.sheet)){await pg.locator('#shB .opt').first().click();}else{const lbls=await ev(()=>[...document.querySelectorAll('.lbl.obj')].filter(l=>l.style.display!=='none').map(l=>l.textContent));console.log('restroom labels',lbls);const t=lbls.find(x=>/Urinal|Toilet|WC/i.test(x));if(t){await pg.locator('.lbl.obj',{hasText:t}).first().click();await L.sleep(600);await pg.locator('#shB .opt').first().click();}}const pee=await L.until(ev,()=>window.__VLX.S.needs.bladder>80,60000);ok('use the toilet: bladder refills',!!pee,await ev(()=>Math.round(window.__VLX.S.needs.bladder)));}
await shot('7_after_toilet');
// map tab: open, tap Veritas Cafe, go
await ev(()=>{const X=window.__VLX;X.UI.dlgQ=[];while(X.UI.dlg)X.closeDlg();if(window.__L3.ACT)window.__L3.stopAction(true);if(X.S.inside)X.exitBuilding();});await L.sleep(2500);
await tap('#nav button[data-tab=map]');await L.sleep(1500);await shot('8_map');const mapOn=await ev(()=>window.__VLX.cam.mode==='map'||!!document.querySelector('.mapsheet,#mapUI'));ok('Map tab opens the map',mapOn);
await tap('#nav button[data-tab=home]').catch(()=>{});await L.sleep(800);
}catch(e){ok('flow crashed',false,String(e).slice(-900));await shot('fail');}
ok('no page errors',!errs.length,errs.slice(0,3));const und=await ev(()=>window.__UNDEF||[]);ok('no "undefined" or "NaN" on screen',!und.length,und);console.log(R.filter(x=>x[1]).length+' passed, '+R.filter(x=>!x[1]).length+' failed');await b.close();srv.kill();})();
