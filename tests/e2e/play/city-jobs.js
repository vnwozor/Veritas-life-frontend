/* real-user flow: map → places → taxi to the gym → train; phone → Jobs → apply → delivery; phone → Bank */
const L=require('./lib');const R=[];const ok=(n,p,i)=>{R.push([n,!!p]);console.log((p?'PASS ':'FAIL ')+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,240):''));};
(async()=>{const srv=await L.server(3535);const b=await L.browser();const A=await L.player(b,3535,'User');const pg=A.page;
await A.ev(()=>{window.__QA_NR=1;const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+10*60;S.tOff=Math.floor(L3.uNow())-d;S.money=80000;X.P.x=8;X.P.z=150;X.P.path=null;X.S.at=null;});
const tap=async(sel,txt)=>{if(sel.startsWith('.lbl')){await A.ev(()=>{window.__QA_NR=0;});await L.sleep(2500);}const loc=txt?pg.locator(sel,{hasText:txt}).first():pg.locator(sel).first();await loc.click({timeout:8000});await L.sleep(400);if(sel.startsWith('.lbl'))await A.ev(()=>{window.__QA_NR=1;});};
const closeAll=()=>A.ev(()=>{const X=window.__VLX;X.UI.dlgQ=[];if(X.UI.dlg)X.closeDlg();});
try{
await tap('#nav button[data-tab=map]');await tap('#mbList');await pg.fill('#shB input.gname','gym');await L.sleep(300);await tap('#shB .opt','Iron Paradise Gym');await L.sleep(500);
let txt=await pg.locator('#shB').innerText();ok('gym sheet offers city transport',/Gidi Ride taxi/.test(txt)&&/Danfo/.test(txt)&&!/Take a keke/.test(txt),txt.slice(0,160));
await tap('#shB .tbtn','Gidi Ride taxi');
let arr=null;for(let i=0;i<60&&!arr;i++){await L.sleep(1500);await closeAll();const st=await A.ev(()=>{const X=window.__VLX,R2=X.W.ride;return {in:X.S.inside,P:[+X.P.x.toFixed(1),+X.P.z.toFixed(1)],mode:X.P.mode,path:X.P.path&&X.P.path.length,ride:R2?[R2.phase,R2.k&&R2.k.mode,R2.board&&R2.board.stage,!!R2.exit]:null,at:X.S.at,dlg:X.UI.dlg?document.querySelector('#dlg').innerText.slice(0,80):null,t:(document.querySelector('#toasts')||{}).innerText.slice(-80)};});if(process.env.TRACE)console.log(JSON.stringify(st));if(st.in==='gym')arr='in';}ok('taxi takes you to the gym and you walk in',arr==='in');
await closeAll();
await tap('.lbl.obj','Weights');await L.sleep(400);await tap('#shB .opt','Day pass');await L.sleep(300);await tap('.lbl.obj','Weights');await tap('#shB .opt','Lift weights');
const st=await L.until(A.ev,()=>{const L3=window.__L3;if(L3.ACT)L3.ACT.left=Math.min(L3.ACT.left,1);return !L3.ACT&&window.__VLX.S.skills.strength>0&&window.__VLX.S.skills.strength;},20000);ok('lift weights via the label menu',st>0,st);
await closeAll();
// jobs app → delivery
await tap('#nav button[data-tab=phone]');await L.sleep(400);await tap('.app','Jobs');await L.sleep(300);txt=await pg.locator('#pBody').innerText();ok('Jobs app lists careers',/Delivery rider/.test(txt)&&/Office worker/.test(txt)&&/Gidi Ride driver/.test(txt));
await pg.locator('#pBody .bgcard',{hasText:'Delivery rider'}).locator('button').first().click();
const atDepot=await L.until(A.ev,()=>window.__VLX.S.inside==='depot'&&'in',120000);ok('Jobs app sends you to the depot',atDepot==='in');
await closeAll();await tap('.lbl.obj','Dispatch desk');await tap('#shB .opt','Apply');await L.sleep(600);await tap('#dlg .ch button','Let');await tap('.lbl.obj','Dispatch desk');await tap('#shB .opt','Take a delivery');
const job=await A.ev(()=>Object.assign({},window.__L4.JOB4));ok('delivery job started from the desk',job.kind==='delivery',job);
const chip=await A.ev(()=>{window.__VLX.exitBuilding();return 1;});await L.sleep(2500);const ct=await pg.locator('#jobchip').innerText();ok('delivery shows a route chip',/Parcel/.test(ct),ct);
// walk there using Map → Places search of the destination (like a user)
const dest=await A.ev(()=>window.__VLX.SCAN.LOCS[window.__L4.JOB4.to].name);await tap('#nav button[data-tab=map]');await tap('#mbList');await pg.fill('#shB input.gname',dest.split(' ')[0]);await L.sleep(300);await tap('#shB .opt',dest);await L.sleep(400);
const btn=pg.locator('#shB .tbtn',{hasText:/Walk|Gidi Ride taxi/}).first();await btn.click();
const paid=await L.until(A.ev,()=>!window.__L4.JOB4.kind&&(window.__VLX.S.cnt.deliveries||0)>=1,150000);ok('deliver the parcel by going there',!!paid);
await closeAll();
// bank app
await tap('#nav button[data-tab=phone]');await L.sleep(300);await tap('.app','Savings');const m0=await A.ev(()=>window.__VLX.S.money);await tap('#pBody button','Deposit ₦5,000');const bank=await A.ev(()=>window.__VLX.S.bank.bal);ok('bank app deposit button',bank===5000,{bank,m0});
}catch(e){ok('flow crashed',false,String(e).slice(0,300));await pg.screenshot({path:(process.env.OUT||'/tmp')+'/u1_fail.png'});}
ok('no page errors',!A.errs.length,A.errs.slice(0,3));{const und=await A.undef();ok('no "undefined" or "NaN" on screen',!und.length,und);}ok('no "undefined" or "NaN" on screen',!(await A.undef()).length,await A.undef());
console.log(R.filter(x=>x[1]).length+' passed, '+R.filter(x=>!x[1]).length+' failed');await b.close();srv.kill();})();
