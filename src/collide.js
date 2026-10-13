/* ================= SOLID VEHICLES =================
   Every car, keke, bus and parked car on screen is solid, using its real size (cars are scaled up, so
   the old checks were too small):
   - moving traffic looks ahead with a box the width of the vehicle and stops for anything in it:
     other traffic, parked cars, your car, cars in scenes. At junctions it sees a crossing car's full length.
   - the car you drive bumps into every other vehicle, parked ones too.
   - people (you and everyone walking around) are pushed out to the side of any vehicle. */
function vehDims(g){let d=g.userData.vd;if(d)return d;const V=g.userData.V||{},s=g.scale.x||1;
  if(V.kind==='keke')d={hl:1.48*s,hw:0.74*s,oz:0.22*s};
  else{const P2=VPROF[V.kind]||VPROF.sedan;d={hl:P2.L/2*s,hw:P2.W/2*s,oz:0};}
  return g.userData.vd=d;}
/* a vehicle's footprint on the ground: centre, forward axis (u), half length and half width */
function vehBox(g,x,z,r,grow){const d=vehDims(g);if(x==null){x=g.position.x;z=g.position.z;r=g.rotation.y;}const s=Math.sin(r),c=Math.cos(r);grow=grow||0;
  return {cx:x+s*d.oz,cz:z+c*d.oz,ux:s,uz:c,hl:d.hl+grow,hw:d.hw+grow};}
function boxHit(a,b){const ax=[[a.ux,a.uz],[a.uz,-a.ux],[b.ux,b.uz],[b.uz,-b.ux]];const dx=b.cx-a.cx,dz=b.cz-a.cz;
  for(const [nx,nz] of ax){const ra=a.hl*Math.abs(a.ux*nx+a.uz*nz)+a.hw*Math.abs(a.uz*nx-a.ux*nz),rb=b.hl*Math.abs(b.ux*nx+b.uz*nz)+b.hw*Math.abs(b.uz*nx-b.ux*nz);
    if(Math.abs(dx*nx+dz*nz)>ra+rb)return false;}return true;}
/* the strip just in front of a vehicle */
function probeBox(b,from,len,extra){return {cx:b.cx+b.ux*(b.hl+from+len/2),cz:b.cz+b.uz*(b.hl+from+len/2),ux:b.ux,uz:b.uz,hl:len/2,hw:b.hw+(extra||0)};}
/* every vehicle standing in the open world right now */
const SOL={list:[],at:-1};
function solids(){const now=performance.now();if(SOL.at===now)return SOL.list;SOL.at=now;const out=[];
  if(S&&!S.inside&&outdoor.visible){for(const g of outdoor.children){if(!g.visible||!g.userData.V)continue;out.push(g);}}
  return SOL.list=out;}
function onScreen(x,z){try{const v=new THREE.Vector3(x,1,z).project(camera);return v.z<1&&Math.abs(v.x)<1.25&&Math.abs(v.y)<1.25;}catch(e){return true;}}

/* ---------- traffic: look ahead with the vehicle's real width, stop for anything in the way ---------- */
trafficRules=function(dt){const L=[];for(const k of VEH){if(k.mode==='parked'||!k.g.parent||!k.g.visible)continue;L.push(k);}
  const mine=new Set(L.map(k=>k.g));const all=L.slice();for(const g of solids())if(!mine.has(g))all.push({g,player:true});
  for(const o of all)o._b=vehBox(o.g);
  for(const k of L){k.blk=null;k.blkNear=false;if(k===carVeh&&!W.ride){continue;}const b=k._b;const far=probeBox(b,-0.2,10,0.25),near=probeBox(b,-0.2,3.2,0.2);let best=1e9;
    for(const o of all){if(o===k)continue;const ob=o._b;if(Math.hypot(ob.cx-b.cx,ob.cz-b.cz)>b.hl+ob.hl+12)continue;if(!boxHit(far,ob))continue;
      const al=(ob.cx-b.cx)*b.ux+(ob.cz-b.cz)*b.uz;if(al<=0)continue;/* only what is in front */
      if(al<best){best=al;k.blk=o;k.blkD=al;}if(boxHit(near,ob))k.blkNear=true;}}
  for(const k of L){const o=k.blk;let stop=false;
    if(o){stop=true;/* two waiting for each other: a fixed order decides who goes first */if(o.blk===k&&!o.player&&VEH.indexOf(k)<VEH.indexOf(o))stop=false;}
    /* a very long jam is only broken where nobody can see it: a car never drives through another on screen */
    if(stop&&(k.wait||0)>12&&!onScreen(k.g.position.x,k.g.position.z)&&!(o&&o.g&&onScreen(o.g.position.x,o.g.position.z)))k.ghost=2;
    if(k.ghost>0){k.ghost-=dt;stop=false;}
    k.wait=stop?(k.wait||0)+dt:0;k.blocked=stop&&k.blkNear;
    if(stop&&!k.blocked){/* ease off when something is ahead but not yet close */k.vf=Math.min(k.vf==null?1:k.vf,0.45);}}};

/* ---------- the car you drive hits every vehicle, parked or moving ---------- */
function carHitsVeh(x,z,dir,from){if(!myCarG)return false;const me=vehBox(myCarG,x,z,dir,-0.05);const c=from||S.car;const cur=c?vehBox(myCarG,c.x,c.z,c.dir,-0.05):null;
  for(const g of solids()){if(g===myCarG)continue;const ob=vehBox(g);if(Math.hypot(ob.cx-me.cx,ob.cz-me.cz)>me.hl+ob.hl+1)continue;
    if(boxHit(me,ob)){/* already touching it (it drove into you): let you back away */if(cur&&boxHit(cur,ob)&&Math.hypot(ob.cx-me.cx,ob.cz-me.cz)>=Math.hypot(ob.cx-cur.cx,ob.cz-cur.cz))continue;return true;}}return false;}

/* ---------- people can't stand inside a vehicle ---------- */
function pushOut(o,list){let moved=false;const R=0.38;
  for(const g of list){const b=vehBox(g);const dx=o.x-b.cx,dz=o.z-b.cz;if(Math.abs(dx)>b.hl+2||Math.abs(dz)>b.hl+2)continue;
    const al=dx*b.ux+dz*b.uz,lat=dx*b.uz-dz*b.ux;const pa=b.hl+R-Math.abs(al),pl=b.hw+R-Math.abs(lat);if(pa<=0||pl<=0)continue;
    const sl=lat<0?-1:1,sa=al<0?-1:1;
    const opts=[[b.uz*sl*pl,-b.ux*sl*pl,pl],[b.ux*sa*pa,b.uz*sa*pa,pa],[-b.uz*sl*(2*b.hw+2*R-pl),b.ux*sl*(2*b.hw+2*R-pl),9],[-b.ux*sa*(2*b.hl+2*R-pa),-b.uz*sa*(2*b.hl+2*R-pa),9]].sort((p,q)=>p[2]-q[2]);
    for(const [mx,mz] of opts){const nx=o.x+mx,nz=o.z+mz;const k=gIdx(NAV,nx,nz);if(k>=0&&!NAV.blk[k]){o.x=nx;o.z=nz;moved=true;break;}}}
  return moved;}
HOOKS.frame.push(()=>{try{if(!S||S.inside||CS.on||W.fading)return;const list=solids();if(!list.length)return;
    if(!W.drive&&!W.ride&&!W.carAnim&&!(ACT&&(ACT.place||ACT.hide))&&player&&player.visible){if(pushOut(P,list)){player.position.set(P.x,0,P.z);}}
    for(const n of npcs){if(n.hidden||!n.g.visible)continue;if(pushOut(n,list))n.g.position.set(n.x,0,n.z);}}catch(e){}});

/* your own car stays solid (and visible) while you drive a stolen one */
{const _ocs=ownCarShow;ownCarShow=function(){if(ownG&&W.ownDyn){raster(NAV,W.ownDyn,0.3,NAV.dyn,0);W.ownDyn=null;}_ocs.apply(this,arguments);
  if(ownG){outdoor.add(ownG);const o=S.ownCar;W.ownDyn={c:0,x:o.x,z:o.z,w:3.0,d:6.2,a:o.dir};raster(NAV,W.ownDyn,0.3,NAV.dyn,1);}};}
if(window.__QA)window.__COL={vehBox,boxHit,solids,carHitsVeh,pushOut};

/* the car you drive: after each step, if it now overlaps any vehicle (parked ones too), undo the step and bounce */
{const _ud=updateDrive;updateDrive=function(dt){const c=S&&S.car,D=W.drive;if(!c||!D||!myCarG)return _ud.apply(this,arguments);const ox=c.x,oz=c.z,od=c.dir,v=D.v;
  const r=_ud.apply(this,arguments);
  if(W.drive&&S.car===c&&(c.x!==ox||c.z!==oz||c.dir!==od)&&carHitsVeh(c.x,c.z,c.dir,{x:ox,z:oz,dir:od})){c.x=ox;c.z=oz;c.dir=od;D.v=-v*0.25;
    if(Math.abs(v)>4.5){c.cond=Math.max(0,c.cond-Math.abs(v)*0.5);if(performance.now()>D.bump){D.bump=performance.now()+1500;sfx('bad');toast('Bang!','You hit something. Car condition '+Math.round(c.cond)+'%.','bad');}}
    myCarG.position.set(c.x,myCarG.position.y,c.z);myCarG.rotation.y=c.dir;P.x=c.x;P.z=c.z;P.dir=c.dir;}
  return r;};}
