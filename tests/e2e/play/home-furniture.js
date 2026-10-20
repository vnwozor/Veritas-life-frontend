/* real-user flow 3: rent a home in the city, furnish it (place, rotate, move, store, place from storage), then log in on a new device and find it all still there */
const L=require('./lib');const R=[];const ok=(n,p,i)=>{R.push([n,!!p]);console.log((p?'PASS ':'FAIL ')+n+(i!==undefined?'  '+JSON.stringify(i).slice(0,400):''));};
(async()=>{const srv=await L.server(3541);const b=await L.browser();const A=await L.player(b,3541,'Homer');const pg=A.page;
const tap=async(sel,txt)=>{if(!sel.startsWith('#dlg'))await A.closeD();const loc=txt?pg.locator(sel,{hasText:txt}).first():pg.locator(sel).first();await loc.click({timeout:8000});await L.sleep(450);};
const floorTap=async(fx,fy)=>{const box=await pg.locator('canvas').first().boundingBox();await pg.mouse.click(box.x+box.width*fx,box.y+box.height*fy);await L.sleep(350);};
try{
await A.ev(()=>{const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+12*60;S.tOff=Math.floor(L3.uNow())-d;S.money=3000000;window.__VLRAW.save();});await L.sleep(4000);
await tap('#nav button[data-tab=phone]');await tap('.app','Houses');await L.until(A.ev,()=>/Palm Court Studio/.test(document.querySelector('#pBody').innerText),10000);
const card=pg.locator('#pBody .bgcard',{hasText:'Palm Court Studio'}).first();await card.locator('button',{hasText:/^Rent$/}).click();await L.sleep(500);
await tap('#dlg .ch button','Pay');const rented=await L.until(A.ev,()=>{const p=window.__W3.W3.props&&window.__W3.W3.props.list.find(x=>x.id==='prop7');return p&&p.mine==='tenant';},15000);ok('rent Palm Court Studio from the Houses app',!!rented);await L.sleep(800);console.log('TX',JSON.stringify(await A.ev(()=>({m:window.__VLX.S.money,tx:window.__VLX.S.tx.slice(-6),p:window.__W3.W3.props.list.find(x=>x.id==='prop7')}))));ok('payment dialog closes by itself once the server confirms',!(await A.ev(()=>window.__VLX.UI.dlg)));await A.closeD();
await A.ev(()=>window.__VLRAW.closePhone());
await A.ev(()=>{const X=window.__VLX;const D=X.SCAN.LOCS.prop7.door;X.P.x=D.x;X.P.z=D.z;X.P.path=null;X.S.at='prop7';});await L.sleep(1200);
await L.until(A.ev,()=>{if(window.__VLX.S.inside!=='prop7')window.__VLRAW.enterBuilding('prop7');return window.__VLX.S.inside==='prop7';},15000);await L.sleep(2500);
ok('Decorate button shows in your rented home',await pg.locator('#bmBtn').isVisible());
const m0=await A.ev(()=>window.__VLX.S.money);
await tap('#bmBtn');await tap('#shB .opt','Three-seat sofa');ok('placement preview appears',await A.ev(()=>window.__BM.BM.on));
let placedOk=false;for(const [fx,fy] of [[0.5,0.45],[0.4,0.4],[0.6,0.5],[0.5,0.35],[0.35,0.5]]){await floorTap(fx,fy);console.log('BM',fx,fy,JSON.stringify(await A.ev(()=>{const B=window.__BM.BM;return {on:B.on,ok:B.ok,p:B.g&&[B.g.position.x,B.g.position.z],sheet:!!window.__VLX.UI.sheet,inside:window.__VLX.S.inside};})));if(await A.ev(()=>window.__BM.BM.ok)){placedOk=true;break;}}
ok('a clear spot turns the preview green',placedOk);
await tap('#bmBar button[data-a=rot]');const r1=await A.ev(()=>window.__BM.BM.r);ok('rotate the sofa 90 degrees',Math.abs(r1-Math.PI/2)<0.01,r1);
if(!(await A.ev(()=>window.__BM.BM.ok))){for(const [fx,fy] of [[0.5,0.45],[0.45,0.4],[0.55,0.5],[0.5,0.55]]){await floorTap(fx,fy);if(await A.ev(()=>window.__BM.BM.ok))break;}}
await tap('#bmBar button[data-a=ok]');const dec=await A.ev(()=>JSON.parse(JSON.stringify((window.__VLX.S.decor||{}).prop7||[])));const m1=await A.ev(()=>window.__VLX.S.money);
ok('place it: saved in the home and paid once',dec.length===1&&dec[0].k==='sofa'&&m0-m1===45000,{dec,paid:m0-m1});
// blocked spot: try to put a bed on the doorway
await tap('#bmBtn');await tap('#shB .opt','Double bed');await A.ev(()=>{const B=window.__BM.BM,I=B.I;B.g.position.set(I.spawn?I.spawn.x:0,0,I.spawn?I.spawn.z:I.d/2-1);window.__BM.bmCheck();});
ok('cannot block the doorway (red, Place disabled)',await A.ev(()=>!window.__BM.BM.ok&&document.querySelector('#bmBar [data-a=ok]').disabled));
await A.ev(()=>{const B=window.__BM.BM,s=window.__VLX.S.decor.prop7[0];B.g.position.set(s.x,0,s.z);window.__BM.bmCheck();});ok('cannot put a bed on top of the sofa',await A.ev(()=>!window.__BM.BM.ok));
await tap('#bmBar button[data-a=no]');ok('cancel leaves money untouched',(await A.ev(()=>window.__VLX.S.money))===m1);
// move the sofa via its label
await L.sleep(800);await tap('.lbl.obj','Three-seat sofa');await tap('#shB .opt','Move it');for(let i=0;i<8;i++){await L.sleep(800);console.log('WK',JSON.stringify(await A.ev(()=>({P:[+window.__VLX.P.x.toFixed(2),+window.__VLX.P.z.toFixed(2)],path:window.__VLX.P.path,mode:window.__VLX.P.mode,on:window.__BM.BM.on,decor:window.__VLX.S.decor.prop7}))));if(await A.ev(()=>window.__BM.BM.on))break;}
const before=await A.ev(()=>{const s=window.__VLX.S.decor.prop7[0];return [s.x,s.z];});
console.log('MV0',JSON.stringify(await A.ev(()=>{const B=window.__BM.BM;return {on:B.on,ok:B.ok,sheet:!!window.__VLX.UI.sheet,act:!!window.__L3.ACT};})));let moved=false;for(const [fx,fy] of [[0.3,0.4],[0.7,0.4],[0.3,0.55],[0.7,0.55],[0.5,0.3],[0.4,0.45],[0.6,0.45],[0.5,0.5],[0.35,0.35],[0.65,0.35],[0.45,0.6],[0.55,0.6]]){await floorTap(fx,fy);console.log('MV',fx,fy,JSON.stringify(await A.ev(()=>{const B=window.__BM.BM;return {on:B.on,ok:B.ok,p:B.g&&[B.g.position.x,B.g.position.z],sheet:!!window.__VLX.UI.sheet,shT:(document.querySelector('#shT')||{}).textContent,inside:window.__VLX.S.inside};})));if(!(await A.ev(()=>window.__BM.BM.on)))break;const p=await A.ev(()=>[window.__BM.BM.g.position.x,window.__BM.BM.g.position.z,window.__BM.BM.ok]);if(p[2]&&(p[0]!==before[0]||p[1]!==before[1])){moved=true;break;}}
await tap('#bmBar button[data-a=ok]');const after=await A.ev(()=>{const s=window.__VLX.S.decor.prop7;return s.map(x=>[x.k,x.x,x.z,x.r]);});
ok('move the sofa somewhere else (no extra charge)',moved&&after.length===1&&(after[0][1]!==before[0]||after[0][2]!==before[1])&&(await A.ev(()=>window.__VLX.S.money))===m1,{before,after});
// buy at HomeStyle into storage, then place it from storage
await A.ev(()=>{const X=window.__VLX;X.exitBuilding();});await L.sleep(2000);
await A.ev(()=>{const X=window.__VLX;const D=X.SCAN.LOCS.furni.door;X.P.x=D.x;X.P.z=D.z;X.P.path=null;X.S.at='furni';});await L.sleep(1000);
await L.until(A.ev,()=>{if(window.__VLX.S.inside!=='furni')window.__VLRAW.enterBuilding('furni');return window.__VLX.S.inside==='furni';},15000);await L.sleep(2000);
await tap('.lbl.obj','Sales desk');await tap('#shB .opt','Buy Armchair');const inv=await L.until(A.ev,()=>(window.__VLX.S.finv||{}).arm,15000);ok('buy an armchair at HomeStyle: it goes to storage',inv===1,inv);
await A.ev(()=>{const X=window.__VLX;X.exitBuilding();});await L.sleep(2000);
await A.ev(()=>{const X=window.__VLX;const D=X.SCAN.LOCS.prop7.door;X.P.x=D.x;X.P.z=D.z;X.P.path=null;X.S.at='prop7';});await L.sleep(1000);
await L.until(A.ev,()=>{if(window.__VLX.S.inside!=='prop7')window.__VLRAW.enterBuilding('prop7');return window.__VLX.S.inside==='prop7';},15000);await L.sleep(2000);
const sofaBack=await A.ev(()=>{const I=window.__VLX.IW?window.__VLX.IW.prop7:null;return (window.__VLX.S.decor.prop7||[]).length;});ok('the sofa is still there when you come back',sofaBack===1);
await tap('#bmBtn');await tap('#shB .opt','Armchair × 1');let armOk=false;for(const [fx,fy] of [[0.35,0.4],[0.65,0.4],[0.5,0.5],[0.35,0.55],[0.65,0.55]]){await floorTap(fx,fy);if(await A.ev(()=>window.__BM.BM.ok)){armOk=true;break;}}
const mA=await A.ev(()=>window.__VLX.S.money);await tap('#bmBar button[data-a=ok]');
const d2=await A.ev(()=>({d:(window.__VLX.S.decor.prop7||[]).map(x=>x.k),inv:(window.__VLX.S.finv||{}).arm,m:window.__VLX.S.money}));ok('place the armchair from storage for free',armOk&&d2.d.includes('arm')&&!d2.inv&&d2.m===mA,d2);
// put the armchair back in storage
await L.sleep(600);await tap('.lbl.obj','Armchair');await tap('#shB .opt','Put it in storage');await L.until(A.ev,()=>(window.__VLX.S.finv||{}).arm===1,15000);
const d3=await A.ev(()=>({d:(window.__VLX.S.decor.prop7||[]).map(x=>x.k),inv:(window.__VLX.S.finv||{}).arm}));ok('put the armchair back in storage',!d3.d.includes('arm')&&d3.inv===1,d3);
// a new device: no local copy, log in, go home
const layout=await A.ev(()=>JSON.stringify(window.__VLX.S.decor.prop7));await A.ev(()=>window.__VLRAW.save());await L.sleep(1000);await A.ev(async()=>{await window.VLNet.saveNow(window.__VLRAW.snapState());});
await A.ev(()=>localStorage.clear());await pg.reload();await L.sleep(2000);await pg.fill('input[name=ident]',A.user);await pg.fill('input[name=password]','secret12');await pg.click('.vlg-go');await L.sleep(8000);
const back=await A.ev(()=>({lay:JSON.stringify((window.__VLX.S.decor||{}).prop7),inv:(window.__VLX.S.finv||{}).arm,title:document.querySelector('#title').hidden}));ok('after logging in on a new device the layout and storage are the same',back.title&&back.lay===layout&&back.inv===1,{back,layout});
await A.closeD();await A.ev(()=>{const X=window.__VLX;if(X.S.inside)X.exitBuilding();});await L.sleep(2500);await A.closeD();
await A.ev(()=>{const X=window.__VLX;const D=X.SCAN.LOCS.prop7.door;X.P.x=D.x;X.P.z=D.z;X.P.path=null;X.S.at='prop7';});await L.sleep(1500);
await L.until(A.ev,()=>{window.__VLX.UI.dlgQ=[];if(window.__VLX.UI.dlg)window.__VLX.closeDlg();if(window.__VLX.S.inside!=='prop7')window.__VLRAW.enterBuilding('prop7');return window.__VLX.S.inside==='prop7';},20000);await L.sleep(2500);
const built=await pg.locator('.lbl.obj',{hasText:'Three-seat sofa'}).count();ok('the sofa is built in the room again after login',built>0);
await pg.screenshot({path:(process.env.OUT||'/tmp')+'/u3_home.png'});
}catch(e){ok('flow crashed',false,String(e).slice(0,1500));await pg.screenshot({path:(process.env.OUT||'/tmp')+'/u3_fail.png'});}
ok('no page errors',!A.errs.length,A.errs.slice(0,3));{const und=await A.undef();ok('no "undefined" or "NaN" on screen',!und.length,und);}ok('no "undefined" or "NaN" on screen',!(await A.undef()).length,await A.undef());
console.log(R.filter(x=>x[1]).length+' passed, '+R.filter(x=>!x[1]).length+' failed');await b.close();srv.kill();})();
