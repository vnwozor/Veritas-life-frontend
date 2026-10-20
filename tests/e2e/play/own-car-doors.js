const L=require('./lib');
(async()=>{const port=3798;const srv=await L.server(port);const b=await L.browser();const A=await L.player(b,port,'Owner');
await A.ev(()=>{window.__QA_NR=1;const X=window.__VLX;X.S.money=2e6;X.P.x=60;X.P.z=128;});
await A.ev(async()=>{const X=window.__VLX;X.openLoc('autos');await new Promise(r=>setTimeout(r,400));[...document.querySelectorAll('#shB .opt')].find(b=>/Buy Tokunbo hatchback.*cash/i.test(b.textContent)).click();for(let i=0;i<80&&!X.S.car;i++)await new Promise(r=>setTimeout(r,500));});
await A.closeD();await L.sleep(2500);await A.closeD();
await A.ev(()=>{const X=window.__VLX,c=X.S.car;X.P.x=c.x+Math.cos(c.dir)*2.3;X.P.z=c.z-Math.sin(c.dir)*2.3;X.P.path=null;});await L.sleep(500);
await A.ev(()=>window.__L4.enterCarUI());const log=[];let last='';
for(let i=0;i<60;i++){const s=await A.ev(()=>{const X=window.__VLX,c=X.S.car,V=X.SCAN.myCarG&&X.SCAN.myCarG.userData.V;const P=X.P;const lx=(P.x-c.x)*Math.cos(c.dir)-(P.z-c.z)*Math.sin(c.dir);return {side:lx>0.3?'+x(passenger)':lx<-0.3?'-x(driver)':'mid',walking:!!P.path,doors:V?Object.entries(V.doors).filter(([k,d])=>d.t>0.5).map(([k])=>k).join(','):'',drive:!!X.W.drive};});
  const k=JSON.stringify(s);if(k!==last){log.push(s);last=k;}if(s.drive)break;await L.sleep(150);}
log.forEach(x=>console.log(JSON.stringify(x)));
await A.ev(()=>{window.__VLX.W.drive.v=0;});await L.sleep(300);await A.ev(()=>window.__VLX.SCAN.exitCar());await L.sleep(400);
console.log('exit',JSON.stringify(await A.ev(()=>{const X=window.__VLX,c=X.S.car,V=X.SCAN.myCarG.userData.V,P=X.P;const lx=(P.x-c.x)*Math.cos(c.dir)-(P.z-c.z)*Math.sin(c.dir);return {side:lx>0?'+x':'-x',doors:Object.entries(V.doors).filter(([k,d])=>d.t>0.5).map(([k])=>k).join(',')};})));
console.log('errs',JSON.stringify(A.errs.slice(0,3)));await b.close();srv.kill();})();
