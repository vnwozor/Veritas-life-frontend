/* take a taxi, a danfo and a campus keke like a player, and watch the doors, the toasts and the drop-off */
const L=require('./lib');
(async()=>{const port=3797;const srv=await L.server(port);const b=await L.browser();const A=await L.player(b,port,'Rider');const pg=A.page;
const toasts=new Set();pg.on('console',m=>{});
await A.ev(()=>{const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+11*60;S.tOff=Math.floor(L3.uNow())-d;S.money=200000;S.flags.exeat=1;window.__QA_NR=1;});
await A.ev(()=>{const T=document.querySelector('#toasts');window.__TL=[];new MutationObserver(()=>{window.__TL.push(T.innerText.slice(-140));}).observe(T,{childList:true,subtree:true,characterData:true});});
const ALL=[['taxi',[10,300],'gym'],['danfo',[10,300],'megamart'],['keke',[0,40],'library']];for(const [kind,from,to] of ALL.filter(x=>!process.argv[2]||x[0]===process.argv[2])){
  await A.closeD();await A.ev(()=>{const X=window.__VLX;if(X.S.inside)X.exitBuilding();});await L.until(A.ev,()=>!window.__VLX.S.inside&&!window.__VLX.W.fading,10000);await L.sleep(800);await A.ev(([x,z])=>{const X=window.__VLX;X.P.x=x;X.P.z=z;X.P.path=null;X.S.at=null;window.__TL=[];},from);await L.sleep(1500);await A.closeD();
  await A.ev(to=>window.__L4.openLocUI?window.__L4.openLocUI(to):window.__VLX.openLoc(to),to);await L.sleep(700);const btxt=await A.ev(()=>[...document.querySelectorAll('#shB button')].map(b=>b.innerText.replace(/\n/g,' ')).join(' | '));console.log('sheet:',btxt.slice(0,400));const re=kind==='taxi'?/Gidi Ride/:kind==='danfo'?/Danfo/:/keke/;await A.ev(re=>{const b=[...document.querySelectorAll('#shB button')].find(b=>new RegExp(re,'i').test(b.innerText));if(b)b.click();},re.source);
  const log=[];let last='';const t0=Date.now();
  while(Date.now()-t0<150000){const s=await A.ev(()=>{const X=window.__VLX,R=X.W.ride;const P=X.P;let o={P:[+P.x.toFixed(1),+P.z.toFixed(1)],vis:window.__VLRAW.player.visible,inside:X.S.inside,at:X.S.at};
      if(R){const k=R.k,g=k.g,V=g.userData.V;o.phase=R.phase;o.mode=k.mode;o.board=R.board&&R.board.stage;o.car=[+g.position.x.toFixed(1),+g.position.z.toFixed(1)];
        o.vf=k.vf!=null?+k.vf.toFixed(2):null;o.blocked=!!k.blocked;o.pi=k.i+'/'+(k.path?k.path.length:0);o.doors=V&&V.doors?Object.entries(V.doors).filter(([id,d])=>d.t>0.5).map(([id])=>id).join(','):'nodoors';
        const r=g.rotation.y;const lx=(P.x-g.position.x)*Math.cos(r)-(P.z-g.position.z)*Math.sin(r);o.side=lx>0.3?'+x(r)':lx<-0.3?'-x(l)':'mid';o.exit=R.exit?+R.exit.t.toFixed(1):null;}
      return o;});
    const key=JSON.stringify([s.phase,s.mode,s.board,s.doors,s.vis,s.side,s.inside,s.exit!=null&&Math.round(s.exit*2)]);if(key!==last){log.push(s);last=key;}
    if(s.inside||(s.at&&!s.phase&&Date.now()-t0>5000))break;await L.sleep(150);}
  const tl=await A.ev(()=>[...new Set(window.__TL)].slice(-12));
  console.log('====',kind,'→',to);log.forEach(x=>console.log(JSON.stringify(x)));console.log('toasts:',JSON.stringify(tl).slice(0,1500));}
console.log('errs',JSON.stringify(A.errs.slice(0,3)));console.log('undef',JSON.stringify(await A.undef()));await b.close();srv.kill();})();
