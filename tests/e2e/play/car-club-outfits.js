/* real-user flow 2: buy a car at Express Motors, drive with the on-screen pedals, speeding fine near police,
   club at night (18+, far from school), wardrobe, ChowNow, kola */
const L=require('./lib');const R=[];const ok=(n,p,i)=>{R.push([n,!!p]);console.log((p?'PASS ':'FAIL ')+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,1600):''));};
(async()=>{const srv=await L.server(3537);const b=await L.browser();const A=await L.player(b,3537,'Driver');const pg=A.page;
await A.ev(()=>{window.__QA_NR=1;const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+10*60;S.tOff=Math.floor(L3.uNow())-d;S.money=900000;const D=X.SCAN.LOCS.express.door;X.P.x=D.x;X.P.z=D.z-3;X.P.path=null;X.S.at=null;});
const tap=async(sel,txt)=>{if(!sel.startsWith('#dlg'))await A.closeD();if(sel.startsWith('.lbl')){await A.ev(()=>{window.__QA_NR=0;const X=window.__VLX;X.cam.tx=Math.max(-6,Math.min(6,X.P.x));X.cam.tz=Math.max(-6,Math.min(6,X.P.z));});await L.sleep(3500);}const loc=txt?pg.locator(sel,{hasText:txt}).first():pg.locator(sel).first();await loc.click({timeout:8000});await L.sleep(400);if(sel.startsWith('.lbl'))await A.ev(()=>{window.__QA_NR=1;});};
const hold=async(k,ms)=>{const el=pg.locator('#drive [data-k='+k+']');await el.dispatchEvent('pointerdown');await L.sleep(ms);await el.dispatchEvent('pointerup');};
try{
await A.ev(()=>window.__L4.openLoc('express'));await L.sleep(500);let txt=await pg.locator('#shB').innerText();ok('Express Motors sells bikes, okadas and cars',/City bicycle/.test(txt)&&/Bajaj/.test(txt)&&/Sports coupe/.test(txt));
await tap('#shB .opt','Buy Family saloon');const car=await L.until(A.ev,()=>window.__VLX.S.car&&window.__VLX.S.car.model,40000);ok('bought a saloon',car==='saloon',car);
await A.ev(()=>{const X=window.__VLX;X.UI.dlgQ=[];if(X.UI.dlg)X.closeDlg();});await L.sleep(3200);
const free=await A.ev(()=>{const c=window.__VLX.S.car;const s=Math.sin(c.dir),k=Math.cos(c.dir);return !window.__cb(c.x,c.z)&&!window.__cb(c.x+s*2,c.z+k*2)&&!window.__cb(c.x-s*2,c.z-k*2);});ok('new car stands on clear ground',free);
await A.ev(()=>{const X=window.__VLX,c=X.S.car;X.P.x=c.x-Math.cos(c.dir)*2.2;X.P.z=c.z+Math.sin(c.dir)*2.2;X.SCAN.enterCar();});await L.sleep(1800);
const p0=await A.ev(()=>{const c=window.__VLX.S.car;return [c.x,c.z];});await hold('up',2500);await L.sleep(800);await hold('down',1500);await hold('left',100);
const p1=await A.ev(()=>{const c=window.__VLX.S.car;return [c.x,c.z,window.__VLX.W.drive&&window.__VLX.W.drive.v];});ok('drive off the forecourt with the GAS pedal',Math.hypot(p1[0]-p0[0],p1[1]-p0[1])>6,{p0,p1});
// reverse
const pr=await A.ev(()=>{const c=window.__VLX.S.car;return [c.x,c.z];});await hold('down',2500);const pr2=await A.ev(()=>{const c=window.__VLX.S.car;return [c.x,c.z];});ok('reverse with BRAKE held',Math.hypot(pr2[0]-pr[0],pr2[1]-pr[1])>1,{pr,pr2});
// speeding near the police car: put the patrol next to us and speed
const fine=await A.ev(async()=>{const X=window.__VLX,c=X.S.car;const pc=window.__CITY.POLICE_CARS[0];c.x=0+2.1;c.z=250;c.dir=Math.PI;window.__VLX.W.drive.v=0;pc.x=pc.g.position.x=-2;pc.z=pc.g.position.z=262;pc.path=null;X.W.drive.v=20;await new Promise(r=>setTimeout(r,500));return (X.S.fines||[]).map(f=>f.why);});ok('speed camera / police fine for speeding',fine.length&&/Speed/.test(fine[0]),fine);
await A.ev(()=>{const X=window.__VLX;X.W.drive.v=0;X.UI.dlgQ=[];if(X.UI.dlg)X.closeDlg();});await L.sleep(400);await tap('#dPark');await L.sleep(1500);
const walked=await A.ev(()=>!window.__VLX.W.drive);ok('park & get out',walked);
// club at night
await A.ev(()=>{const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+22*60;S.tOff=Math.floor(L3.uNow())-d;});await L.sleep(1000);
const dist=await A.ev(()=>{const X=window.__VLX;const Lc=X.SCAN.LOCS.club,G=X.SCAN.LOCS.gate,Sc=X.SCAN.LOCS.cschool;return {gateStraight:Math.round(Math.hypot(Lc.x-G.x,Lc.z-G.z)),school:Math.round(Math.hypot(Lc.x-Sc.x,Lc.z-Sc.z))};});ok('club is far from the university and the primary school',dist.gateStraight>350&&dist.school>250,dist);
await A.ev(()=>{const X=window.__VLX;const D=X.SCAN.LOCS.club.door;X.P.x=D.x;X.P.z=D.z;X.S.at='club';});for(let i=0;i<4;i++){await A.closeD();await A.ev(()=>window.__VLRAW.enterBuilding('club'));await L.sleep(600);if(/Cover is/.test(await pg.locator('#dlg').innerText().catch(()=>'')))break;}
txt=await pg.locator('#dlg').innerText().catch(()=>'');ok('club door asks for the cover charge',/Cover is/.test(txt),txt.slice(0,80));
await tap('#dlg .ch button','Pay');const inClub=await L.until(A.ev,()=>window.__VLX.S.inside==='club'&&'in',15000);ok('pay the cover and go in',inClub==='in');
await A.ev(()=>window.__VLX.exitBuilding());await L.sleep(2000);
// wardrobe needs an outfit first: buy at Ankara House via its menu
await A.ev(()=>{const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+11*60;S.tOff=Math.floor(L3.uNow())-d;const D=X.SCAN.LOCS.fashion.door;X.P.x=D.x;X.P.z=D.z;X.S.at='fashion';});
await L.sleep(1500);await L.until(A.ev,()=>{if(window.__VLX.S.inside!=='fashion')window.__VLRAW.enterBuilding('fashion');return window.__VLX.S.inside==='fashion';},15000);await L.sleep(800);await tap('.lbl.obj','Stylist');await tap('#shB .opt','Buy Party fit');await L.until(A.ev,()=>window.__VLX.S.outfit==='party',15000);const out=await A.ev(()=>window.__VLX.S.outfit);ok('buy and wear a party fit at Ankara House',out==='party',out);
await tap('#nav button[data-tab=phone]');await tap('.app','Wardrobe');txt=await pg.locator('#pBody').innerText();ok('Wardrobe app lists your outfit',/Party fit/.test(txt));await tap('#pBody button','Everyday');ok('change back to everyday clothes',!(await A.ev(()=>window.__VLX.S.outfit)));
// ChowNow
await tap('#nav button[data-tab=phone]').catch(()=>{});await A.ev(()=>{window.__VLRAW.openPhone();window.__VLRAW.setPhone('chow4');});await L.sleep(300);await tap('#pBody button','Order');const f0=await A.ev(()=>window.__VLX.S.needs.food);
await A.ev(()=>{window.__VLRAW.closePhone();const S=window.__VLX.S;S.chow.at=S.t;});const fed=await L.until(A.ev,f0=>!window.__VLX.S.chow&&window.__VLX.S.needs.food>f0,15000,f0);ok('ChowNow food arrives and you eat',!!fed);
}catch(e){ok('flow crashed',false,String(e).slice(0,1500));await pg.screenshot({path:(process.env.OUT||'/tmp')+'/u2_fail.png'});}
ok('no page errors',!A.errs.length,A.errs.slice(0,3));{const und=await A.undef();ok('no "undefined" or "NaN" on screen',!und.length,und);}ok('no "undefined" or "NaN" on screen',!(await A.undef()).length,await A.undef());
console.log(R.filter(x=>x[1]).length+' passed, '+R.filter(x=>!x[1]).length+' failed');await b.close();srv.kill();})();
