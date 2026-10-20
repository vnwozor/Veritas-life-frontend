/* walk up to each teaching building from 20 m away, go in through the door, then walk to every object inside */
const L=require('./lib');
(async()=>{const port=3796;const srv=await L.server(port);const b=await L.browser();const A=await L.player(b,port,'Walker');
await A.ev(()=>{const X=window.__VLX,S=X.S,L3=window.__L3;const d=Math.floor(S.t/1440)*1440+11*60;S.tOff=Math.floor(L3.uNow())-d;});
for(const id of ['library','lecture','blockB','blockC','blockD','admin','family','prop1','prop7']){
  await A.closeD();await A.ev(()=>{const X=window.__VLX;if(X.S.inside)X.exitBuilding();});await L.sleep(1800);await A.closeD();
  const st=await A.ev(id=>{const X=window.__VLX,Lc=X.SCAN.LOCS[id];const D=Lc.door;const dx=D.x-Lc.x,dz=D.z-Lc.z,l=Math.hypot(dx,dz)||1;X.P.x=D.x+dx/l*18;X.P.z=D.z+dz/l*18;X.P.path=null;X.S.at=null;
    X.goTo(id,'walk',()=>window.__VLRAW.enterBuilding(id));return [X.P.x,X.P.z];},id);
  const inside=await L.until(A.ev,id=>{const X=window.__VLX;if(X.UI.dlg){X.UI.dlgQ=[];X.closeDlg();}return X.S.inside===id;},40000,id);
  if(!inside){const w=await A.ev(()=>({P:[window.__VLX.P.x,window.__VLX.P.z],at:window.__VLX.S.at,path:!!window.__VLX.P.path,t:(document.querySelector('#toasts')||{}).innerText.slice(-80)}));console.log('FAIL enter',id,JSON.stringify(w));continue;}
  await L.sleep(1200);
  const objs=await A.ev(()=>{const X=window.__VLX;const I=window.__L4.getInt(X.S.inside);return I.objs.filter(o=>o.spot&&o.id!=='door').map(o=>({n:o.name,s:o.spot}));});
  const res=[];for(const o of objs){await A.ev(o=>{const X=window.__VLX;X.P.path=null;},o);
    await A.ev(id=>{const X=window.__VLX,I=window.__L4.getInt(X.S.inside);X.P.x=I.spawn.x;X.P.z=I.spawn.z;},id);
    await A.ev(o=>{const X=window.__VLX,I=window.__L4.getInt(X.S.inside);const g=window.__L4.intNav(I);X.P.path=window.__L4.navPath(X.P,o.s,g)||[{x:o.s.x,z:o.s.z}];X.P.i=0;X.P.mode='walk';},o);
    const got=await L.until(A.ev,o=>{const X=window.__VLX;return !X.P.path&&Math.hypot(X.P.x-o.s.x,X.P.z-o.s.z)<1.2;},20000,o);
    const at=await A.ev(()=>[+window.__VLX.P.x.toFixed(1),+window.__VLX.P.z.toFixed(1)]);res.push((got?'ok ':'STUCK ')+o.n+(got?'':' at '+at+' want '+[o.s.x.toFixed(1),o.s.z.toFixed(1)]));}
  console.log(id,'entered; ',res.join(' | '));}
console.log('errs',JSON.stringify(A.errs.slice(0,3)));await b.close();srv.kill();})();
