/* buy a car at Junction Autos and drive it like a player: out of the lot, down the Expressway into the city, through
   every district to Club Vibez, then back. Steering only with the controls; reports anywhere the car gets stuck. */
const L=require('./lib');
(async()=>{const port=3700+Math.floor(Math.random()*50);const srv=await L.server(port);const b=await L.browser();const A=await L.player(b,port,'Racer');
await A.ev(()=>{window.__QA_NR=1;const X=window.__VLX,S=X.S,L3=window.__L3;S.money=3e6;const d=Math.floor(S.t/1440)*1440+10*60;S.tOff=Math.floor(L3.uNow())-d;S.flags.exeat=1;S.exeat=1;X.P.x=60;X.P.z=128;});
const bought=await A.ev(async()=>{const X=window.__VLX;X.openLoc('autos');await new Promise(r=>setTimeout(r,500));const btn=[...document.querySelectorAll('#shB .opt')].find(b=>/Buy Tokunbo hatchback.*cash/i.test(b.textContent));if(!btn)return 'nobtn:'+document.querySelector('#shB').innerText.slice(0,200);btn.click();for(let i=0;i<80&&!X.S.car;i++)await new Promise(r=>setTimeout(r,500));return !!X.S.car;});
console.log('bought',bought);await A.closeD();await L.sleep(3000);await A.closeD();
const res=await A.ev(async()=>{const X=window.__VLX,S=X.S,c=S.car;const w=ms=>new Promise(r=>setTimeout(r,ms));
  X.P.x=c.x-Math.cos(c.dir)*2.2;X.P.z=c.z+Math.sin(c.dir)*2.2;X.SCAN.enterCar();await w(1800);if(!X.W.drive)return {err:'nodrive'};
  const K=X.W.drive.keys;const ang=(a)=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  const goals=[[36,135],[0,135],[0,220],[0,300],[-130,300],[-130,460],[0,460],[130,460],[130,380],[0,380],[0,530],[-85,530],[-85,500],[-85,530],[0,530],[0,135],[40,135]];
  const log=[];let stuckAt=[];
  for(const [gx,gz] of goals){const t0=performance.now();let best=1e9,bestT=performance.now();
    while(true){const dx=gx-c.x,dz=gz-c.z,d=Math.hypot(dx,dz);if(d<5)break;if(d<best-0.5){best=d;bestT=performance.now();}
      if(performance.now()-bestT>7000){const C=window.__CITY;const nearV=[];const add=(tag,o)=>{const x=o.x!=null?o.x:o.g&&o.g.position.x,z=o.z!=null?o.z:o.g&&o.g.position.z;if(x!=null&&Math.hypot(x-c.x,z-c.z)<9)nearV.push([tag,+x.toFixed(1),+z.toFixed(1),o.mode||o.stage||'',o.dir!=null?+o.dir.toFixed(2):null,o.vf!=null?+o.vf.toFixed(2):null,o.pHold!=null?+o.pHold.toFixed(1):null,o.g?[+o.g.position.x.toFixed(1),+o.g.position.z.toFixed(1)]:null]);};(X.VEH||[]).forEach(o=>add('veh',o));(C.TAXIS||[]).forEach(o=>add('taxi',o));(C.DANFOS||[]).forEach(o=>add('danfo',o));(C.POLICE_CARS||[]).forEach(o=>add('police',o));(C.CITYFOLK||[]).forEach(o=>add('folk',o));stuckAt.push({dlg:X.UI.dlg?document.querySelector('#dlg').innerText.slice(0,80):null,toast:(document.querySelector('#toasts')||{}).innerText.slice(-90),wanted:S.wanted,act:window.__L3.ACT&&window.__L3.ACT.label,drive:!!X.W.drive,hit:!!X.W.hitVeh,hitAge:Math.round(performance.now()-(X.W.hitVehAt||0)),blockT:X.W.blockT,keys:JSON.stringify(K),goal:[gx,gz],at:[+c.x.toFixed(1),+c.z.toFixed(1)],dir:+c.dir.toFixed(2),v:+X.W.drive.v.toFixed(1),cb:[window.__cb(c.x+Math.sin(c.dir)*2.5,c.z+Math.cos(c.dir)*2.5)],nearV});
        /* a real player would back up and try again */K.up=0;K.left=0;K.right=0;K.down=1;await w(1500);K.down=0;bestT=performance.now();best=1e9;if(stuckAt.length>12)break;continue;}
      if(performance.now()-t0>90000){log.push('timeout '+gx+','+gz);break;}
      const want=Math.atan2(dx,dz);const e=ang(want-c.dir);const v=X.W.drive.v;
      K.left=e>0.08?1:0;K.right=e<-0.08?1:0;/* slow down for corners and arrivals */const target=Math.abs(e)>0.6?6:d<20?8:14;
      K.up=v<target?1:0;K.down=v>target+3?1:0;await w(50);}
    log.push([gx,gz,Math.round((performance.now()-t0)/1000)+'s']);if(stuckAt.length>12)break;}
  K.up=0;K.left=0;K.right=0;K.down=1;await w(1200);K.down=0;
  return {log,stuck:stuckAt,cond:Math.round(c.cond),fines:(S.fines||[]).map(f=>f.why)};});
console.log(JSON.stringify(res,null,0));console.log('errs',JSON.stringify(A.errs.slice(0,3)));console.log('undef',JSON.stringify(await A.undef()));await b.close();srv.kill();})();
