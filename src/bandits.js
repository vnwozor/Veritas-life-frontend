/* ================= BANDITS: the raid, the kidnapping, the camp, the release =================
   Armed men come through the broken fence at night in two pickups. If they take you, you see it:
   dragged to the trucks with other students, driven into the bush, held at a camp until the ransom
   is paid (by family, friends, other players or a top-up) or you escape. Kidnapped players can see
   each other at the camp. */
const CAMP={x:-430,z:-300};
const BANDIT_LOOK=s=>({skin:s,shirt:pick([0x1b1b1b,0x2a2a22,0x3a3326]),pants:pick([0x1b1b1b,0x2b2b22]),top:'long',hairStyle:'bald',mask:true,shoeStyle:'shoes',shoes:0x111111,build:pick([1,1.06,1.12]),height:rnd(1.0,1.07),bag:null});
function makeRifle(){const g=new THREE.Group();part(G.box,0x1a1a1a,0.06,0.08,0.95,0,0,0.1,g);part(G.box,0x5a3a22,0.07,0.14,0.32,0,-0.04,-0.42,g);part(G.box,0x1a1a1a,0.05,0.2,0.07,0,-0.12,0.1,g);part(G.cyl,0x111111,0.02,0.4,0.02,0,0.02,0.72,g,false).rotation.x=Math.PI/2;return g;}
function armBandit(a){const r=makeRifle();a.g.userData.J.torso.add(r);r.position.set(0.04,0.28,0.2);r.rotation.set(-0.15,0.35,-0.7);r.scale.setScalar(1/1.6*1.1);a.rifle=r;a.armed=true;}
function bandit(x,z,parent){const a=csActor({look:BANDIT_LOOK(pick(SKINS)),x,z,parent,sp:5.4});armBandit(a);a.pose='rifle';return a;}
function decal(V,text,col,bg){[-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.32),new THREE.MeshBasicMaterial({map:textTex([[text,'900 30px sans-serif']],256,64,bg||'rgba(0,0,0,0)',col||'#ffffff'),transparent:true}));m.position.set(s*(VPROF[V.kind].W/2+0.02),0.75,-0.3);m.rotation.y=s*Math.PI/2;V.b.add(m);});}
let flashL=null;function gunshot(at){sfxGun();if(!flashL){flashL=new THREE.PointLight(0xffc070,0,26,2);outdoor.add(flashL);}flashL.position.set(at.x,2.2,at.z);flashL.intensity=4;setTimeout(()=>{flashL.intensity=0;},70);}
function sfxGun(){if(!AU.on||!AU.ctx)return;const t=AU.ctx.currentTime;try{noise(0.18,0.32,t,1400,'lowpass');tone(90,0.12,'square',0.08,t,null,40);}catch(e){}}
/* ---- 1. the attack ---- */
HOOKS.raid=forced=>{if(CS.on)return;if(UI.dlg){UI.dlgQ=[];UI.dlg=false;$('#dlgWrap').hidden=true;}if(ACT)stopAction(true);endDriving();if(UI.sheet)closeSheet();if(UI.phone)closePhone();
  const n=NETX();if(n)n.log('raid_seen',{});raidScene(forced).catch(e=>{if(e!==SKIP)console.error(e);csClear();csEnd();raidChoice();});};
async function raidScene(){const hostel=LOCS[homeId()]&&LOCS[homeId()].zone!=='off'?LOCS.boys:LOCS.boys;const wasInside=S.inside;
  csStart();document.body.classList.add('raid');setTimeout(()=>document.body.classList.remove('raid'),12000);setCarLights(true);
  if(S.inside){const id=S.inside;await new Promise(r=>fadeThen(()=>{const I=getInt(id);I.g.visible=false;outdoor.visible=true;outdoor.add(player);player.visible=false;S.raidFrom=id;S.inside=null;scene.fog.near=170;scene.fog.far=430;r();}));}
  // two pickups outside the broken fence
  const trucks=[buildVehicle('pickup',0x2a2a26),buildVehicle('pickup',0x3a3226)];trucks.forEach((V,i)=>{V.g.position.set(-88+i*6,0,120+i*2);V.g.rotation.y=Math.PI;});W.raidTrucks=trucks;
  const B=[];for(let i=0;i<6;i++)B.push(bandit(-85+rnd(-1,1),110+i*0.8));W.raidB=B;
  const fenceIn={x:-85,z:101.2};const targets=[hostel.door,{x:hostel.door.x+4,z:hostel.door.z+8},{x:-60,z:78},{x:-40,z:86},{x:-70,z:90},{x:hostel.door.x+2,z:hostel.door.z-6}];
  B.forEach((a,i)=>{a.path=[{x:-85,z:104.5},fenceIn,...(navPath(fenceIn,targets[i])||[targets[i]])];a.i=0;a.sp=5.6;});
  // students run for their lives
  npcs.forEach(nn2=>{if(nn2.kind==='student'&&!nn2.hidden&&Math.hypot(nn2.x+60,nn2.z-70)<70){const away={x:clamp(nn2.x+(nn2.x+80)*0.8,-95,95),z:clamp(nn2.z-35,-95,95)};nn2.path=navPath(nn2,away)||[away];nn2.i=0;nn2.rush=true;nn2.idle=0;}});
  csShot([-52,26,62],[-80,1,96],1.2);CS.camInit=false;csCaption('⚠ '+fmtTime(S.t),'Gunshots at the back fence');
  const shots=setInterval(()=>{if(!CS.on){clearInterval(shots);return;}const a=pick(B);gunshot(a);},700);W.raidShots=shots;
  await csWait(2600);csShot(()=>new THREE.Vector3(B[0].x+10,7,B[0].z-10),()=>new THREE.Vector3(B[0].x,1.5,B[0].z),1.6);
  await csWait(2800);csShot([hostel.door.x+18,9,hostel.door.z+6],[hostel.door.x,2,hostel.door.z],1.4);csCaption(null);
  await csWait(1800);
  clearInterval(shots);
  // the choice happens wherever you were
  if(S.raidFrom){await new Promise(r=>fadeThen(()=>{const I=getInt(S.raidFrom);outdoor.visible=false;I.g.visible=true;I.g.add(player);player.visible=true;S.inside=S.raidFrom;r();}));S.raidFrom=null;}
  else player.visible=true;
  csEnd();raidChoice();}
function raidChoice(){const inRoom=S.inside;dialog({who:'me',kicker:'⚠ Bandit attack on campus',warn:'Armed men are on campus. Choose fast.',text:'Gunshots near the back fence. Students are screaming and running between the hostels. Men with guns are dragging people towards the bush.',choices:[
  {t:inRoom?'Hide under the bed and stay silent':'Hide behind the nearest building',fn:()=>rr(0.62)},
  {t:'Run to the Chapel and lock the doors',fn:()=>rr(0.55)},
  {t:'Sprint to the security post at the Main Gate',fn:()=>rr(0.5)},
  {t:inRoom?'Climb into the ceiling':'Lie flat in the gutter',fn:()=>rr(0.66)}]});}
function rr(p){const r=raidRoll(p);setTimeout(()=>{if(!S.captive)raidCleanup();},600);return r;}
function raidCleanup(){if(W.raidShots)clearInterval(W.raidShots);if(W.raidTrucks&&!S.captive){W.raidTrucks.forEach(V=>{if(V.g.parent)V.g.parent.remove(V.g);});W.raidTrucks=null;}csClear();W.raidB=null;setCarLights(false);
  // some NPC students are gone for a few days
  if(!S.captive){const gone=npcs.filter(n=>n.kind==='student').slice(0,ri(1,3));gone.forEach(n=>{n.hidden=true;n.idle=S.t+3*1440;n.g.visible=false;});S.news=S.news||[];S.news.unshift({t:S.t,x:'Bandits attacked the hostels last night and took '+ri(6,11)+' students. Classes are suspended for a day.'});}}
/* ---- 2. taken: dragged out, into the trucks, into the bush ---- */
HOOKS.taken=go=>{const start=()=>{if(UI.dlg)return setTimeout(start,250);captureScene().then(()=>{toCamp();go();}).catch(e=>{if(e!==SKIP)console.error(e);csClear();csEnd();toCamp();go();});};start();};
async function captureScene(){csStart();setCarLights(true);const room=S.inside;
  if(room){const I=getInt(room);const g=intNav(I);const b1=csActor({look:BANDIT_LOOK(0x3a2416),parent:I.g,x:I.spawn.x,z:I.spawn.z,grid:g,sp:4});const b2=csActor({look:BANDIT_LOOK(0x4a2f1d),parent:I.g,x:I.spawn.x+1,z:I.spawn.z,grid:g,sp:4});armBandit(b1);armBandit(b2);
    const me=csActor({g:player,parent:I.g,x:P.x,z:P.z,grid:g,keep:true});player.visible=true;me.pose='shy';csWalk(b1,{x:P.x+0.8,z:P.z+0.8});csWalk(b2,{x:P.x-0.9,z:P.z+0.7});b1.face=me;b2.face=me;
    csShot([P.x+5,4.5,P.z+6],[P.x,1.2,P.z],2);CS.camInit=false;sfx('door');await csUntil(()=>csArrived(b1),5000);b1.pose='rifle';b2.pose='rifle';
    await csSay(b1,'Get up! Move! Now!',1800);sfxGun();await csWait(700);
    await new Promise(r=>fadeThen(()=>{csClear();I.g.visible=false;outdoor.visible=true;outdoor.add(player);S.inside=null;scene.fog.near=170;scene.fog.far=430;r();}));}
  // the march to the fence
  const start=room?LOCS[room].door:{x:P.x,z:P.z};const fp=freeNear(NAV,start.x,start.z,8);
  const me=csActor({g:player,x:fp.x,z:fp.z,keep:true,sp:3.8});player.visible=true;me.pose='walk';
  const caps=[0,1].map(i=>{const c=csActor({look:randomLook(i===1),x:fp.x+1.2+i,z:fp.z+1,sp:3.8});c.cap=1;return c;});
  const gs=[bandit(fp.x-1.4,fp.z-1.2),bandit(fp.x+2.5,fp.z+2.2),bandit(fp.x,fp.z+3.2)];gs.forEach(a=>a.sp=3.9);
  const fenceIn={x:-85,z:101.2};const route=navPath(fp,fenceIn)||[fenceIn];const tail=[{x:-85,z:104.8},{x:-85,z:109}];
  [me,...caps,...gs].forEach((a,i)=>{a.path=route.concat(tail).map(p=>({x:p.x+(i%3-1)*0.8,z:p.z+Math.floor(i/3)*0.9}));a.i=0;});
  csShot(()=>new THREE.Vector3(me.x+8,6.5,me.z-9),()=>new THREE.Vector3(me.x,1.4,me.z+2),1.5);CS.camInit=false;csCaption('Taken','They march you towards the broken fence');
  const shots=setInterval(()=>{if(!CS.on){clearInterval(shots);return;}gunshot(pick(gs));},2200);
  await csUntil(()=>csArrived(me),26000);clearInterval(shots);csCaption(null);
  // into the back of the pickup
  let trucks=W.raidTrucks;if(!trucks){trucks=[buildVehicle('pickup',0x2a2a26)];trucks[0].g.position.set(-88,0,120);trucks[0].g.rotation.y=Math.PI;W.raidTrucks=trucks;}
  const T=trucks[0];const seat=(a,i)=>{T.b.add(a.g);a.parent=T.b;a.g.position.set((i%2?0.42:-0.42),0.82,-1.0-Math.floor(i/2)*0.75);a.g.rotation.y=i%2?-Math.PI/2:Math.PI/2;a.g.scale.setScalar(1.6/T.g.scale.x*0.82);a.pose='groundsit';a.path=null;a.fixed=true;};
  csShot([T.g.position.x+9,5.5,T.g.position.z+4],[T.g.position.x,1.4,T.g.position.z],1.6);
  await csWait(700);[me,...caps].forEach((a,i)=>seat(a,i));gs.forEach((a,i)=>{T.b.add(a.g);a.g.position.set(i?0.5:-0.5,0.82,-2.1+i*0.3);a.g.rotation.y=Math.PI;a.g.scale.setScalar(1.6/T.g.scale.x*0.82);a.pose='rifle';a.fixed=true;});
  sfx('door');await csWait(900);
  // drive off into the dark
  const V={x:T.g.position.x,z:T.g.position.z,dir:Math.PI,i:0};const path=[{x:-88,z:135},{x:-116,z:135},{x:-180,z:132},{x:-260,z:120}];
  CS.tick=dt=>{const ox=V.x,oz=V.z;stepAlong(V,path,11,dt);V.rd=V.rd==null?V.dir:V.rd+angDiff(V.dir,V.rd)*Math.min(1,dt*3);T.g.position.set(V.x,0,V.z);T.g.rotation.y=V.rd;vehAnim(T,Math.hypot(V.x-ox,V.z-oz),0,dt);
    if(trucks[1]){const T2=trucks[1];const k=Math.max(0,V.i-1);T2.g.position.set(V.x+Math.sin(V.rd)*-9,0,V.z+Math.cos(V.rd)*-9);T2.g.rotation.y=V.rd;vehAnim(T2,Math.hypot(V.x-ox,V.z-oz),0,dt);}};
  csShot(()=>new THREE.Vector3(V.x-Math.sin(V.rd||0)*14+4,6,V.z-Math.cos(V.rd||0)*14),()=>new THREE.Vector3(V.x,1.2,V.z),1.3);
  csCaption('Into the bush','Nobody on the road. No police.');await csWait(6500);csCaption(null);
  await new Promise(r=>fadeThen(()=>{CS.tick=null;csClear();trucks.forEach(t2=>{if(t2.g.parent)t2.g.parent.remove(t2.g);});W.raidTrucks=null;r();}));
  csEnd();setCarLights(false);}
/* ---- 3. the camp in the bush ---- */
let campG=null;const campSims=[];
function buildCamp(){if(campG)return campG;const g=campG=new THREE.Group();g.position.set(CAMP.x,0,CAMP.z);outdoor.add(g);
  const gr=new THREE.Mesh(new THREE.CircleGeometry(46,36),new THREE.MeshLambertMaterial({map:noiseTex('#6b5a3a',['#5a4a2e','#7a6a44','#4a5a2e','#3f4f2a'],256,8)}));gr.rotation.x=-Math.PI/2;gr.position.y=0.03;gr.receiveShadow=true;g.add(gr);
  const trunkM=mat(0x4a3826),leafM=[0x2f4f26,0x3a5a2a,0x24401f].map(mat);
  for(let i=0;i<70;i++){const a=rnd(0,6.28),r=rnd(16,44);const x=Math.cos(a)*r,z=Math.sin(a)*r;if(z>10&&Math.abs(x)<9)continue;const k=rnd(0.8,1.6);part(G.cyl,trunkM,0.3*k,3.4*k,0.3*k,x,1.7*k,z,g);const c=part(G.sphLo,pick(leafM),2.4*k,2.2*k,2.4*k,x,4.3*k,z,g);c.castShadow=true;}
  [[-7,-5,0x2b5a8a],[6,-7,0x3a6a3a]].forEach(([x,z,c])=>{const t=new THREE.Mesh(new THREE.ConeGeometry(3.2,2.8,4),new THREE.MeshLambertMaterial({color:c,side:THREE.DoubleSide}));t.position.set(x,1.4,z);t.rotation.y=Math.PI/4;t.castShadow=true;g.add(t);});
  for(let i=0;i<5;i++){const l=part(G.cyl,0x5a3a22,0.12,1.4,0.12,Math.cos(i*1.25)*0.5,0.12,Math.sin(i*1.25)*0.5,g);l.rotation.z=Math.PI/2;l.rotation.y=i*1.25;}
  const flameM=new THREE.MeshBasicMaterial({color:0xffa030});const fl=[];for(let i=0;i<3;i++){const f=new THREE.Mesh(G.cone,flameM);f.scale.set(0.35-i*0.08,0.9-i*0.2,0.35-i*0.08);f.position.set(rnd(-0.15,0.15),0.5,rnd(-0.15,0.15));g.add(f);fl.push(f);}
  const fire=new THREE.PointLight(0xff9a40,2.2,30,2);fire.position.set(0,1.6,0);g.add(fire);g.userData.fire=fire;g.userData.flames=fl;
  [[3,2],[-3.5,2.5],[2,-3],[-2.5,-3.2],[4.5,-0.5]].forEach(([x,z])=>part(G.box,0x6b6b62,rnd(0.6,1.2),rnd(0.4,0.8),rnd(0.6,1),x,0.3,z,g));
  // guards, the leader and other captives
  const L=(o,x,z,r,pz)=>{const s=makeSim(o);s.position.set(x,0,z);s.rotation.y=r;g.add(s);campSims.push({g:s,p:pz});return s;};
  [[-9,4,0.6],[9,5,-0.8],[0,-11,Math.PI],[12,-4,-1.4]].forEach(([x,z,r])=>{const s=L(BANDIT_LOOK(pick(SKINS)),x,z,r,'rifle');const rf=makeRifle();s.userData.J.torso.add(rf);rf.position.set(0.04,0.28,0.2);rf.rotation.set(-0.15,0.35,-0.7);rf.scale.setScalar(1/1.6*1.1);});
  L(Object.assign(BANDIT_LOOK(0x3a2416),{mask:false,hairStyle:'low',hair:1,cap:0x3a3326,top:'kaftan',shirt:0x3a3326}),-4.5,-1.5,0.9,'phone');
  for(let i=0;i<5;i++){const a=2.4+i*0.42;L(randomLook(i%2===1),Math.cos(a)*4.2,Math.sin(a)*4.2+3.2,Math.atan2(-Math.cos(a),-Math.sin(a)),'groundsit');}
  g.visible=false;return g;}
function campSeat(){const k=(S&&S.uid?S.uid:7)%9;const a=2.0+k*0.3;return {x:CAMP.x+Math.cos(a)*3.6,z:CAMP.z+Math.sin(a)*3.6+3.2,r:Math.atan2(-Math.cos(a),-Math.sin(a))};}
function toCamp(){buildCamp();campG.visible=true;W.camp=true;$('#leave').hidden=true;document.body.classList.add('camp');if(S.inside){const I=getInt(S.inside);I.g.visible=false;S.inside=null;outdoor.visible=true;}
  if(player.parent!==outdoor)outdoor.add(player);player.scale.setScalar(1.6*((S.look&&S.look.height)||1));const st=campSeat();P.x=st.x;P.z=st.z;P.dir=st.r;P.path=null;P.mode='idle';player.visible=true;player.position.set(P.x,0,P.z);player.rotation.y=P.dir;
  scene.fog.near=24;scene.fog.far=95;cam.eff=null;}
function leaveCamp(){W.camp=false;document.body.classList.remove('camp');if(campG)campG.visible=false;scene.fog.near=170;scene.fog.far=430;}
HOOKS.frame.push((dt,now)=>{if(!W.camp||!S||!S.captive)return;const t=now/1000;if(campG){const f=campG.userData.fire;f.intensity=1.8+Math.sin(t*13)*0.3+Math.sin(t*7.3)*0.25;campG.userData.flames.forEach((m,i)=>{m.scale.y=(0.9-i*0.2)*(1+Math.sin(t*9+i*2)*0.18);});
    campSims.forEach((c,i)=>pose(c.g,c.p,t+i,dt));}
  pose(player,'groundsit',t,dt);player.position.set(P.x,0,P.z);player.rotation.y=P.dir;
  const a=Math.sin(t*0.04)*0.6;camera.position.set(CAMP.x+Math.sin(a)*11,5.2,CAMP.z+3.2-Math.cos(a)*11);camera.lookAt(CAMP.x,0.6,CAMP.z+2.6);cam.tx=CAMP.x;cam.tz=CAMP.z;});
HOOKS.boot.push(()=>{if(S.captive){setTimeout(()=>{toCamp();captiveMenu();},800);}});
/* ---- 4. freed: dropped by the road at dawn, police bring you back ---- */
HOOKS.freed=(paid,cont)=>{const done=()=>{leaveCamp();cont();};freeScene(paid).then(done).catch(e=>{if(e!==SKIP)console.error(e);csClear();csEnd();done();});};
async function freeScene(paid){csStart();const st=campSeat();const me=csActor({g:player,x:P.x,z:P.z,dir:P.dir,keep:true,sp:3.2});me.pose='stand';
  if(paid){csShot([CAMP.x+7,4,CAMP.z+9],[P.x,1.2,P.z],1.5);CS.camInit=false;csCaption('The money has arrived','Dawn, day '+dayOf(S.t));const guard=bandit(P.x+2,P.z+2);guard.face=me;
    await csSay(guard,'Your people have paid. Get up. Walk.',2400);csCaption(null);}
  else{csShot([P.x-6,3,P.z+6],[P.x,1,P.z],1.5);CS.camInit=false;csCaption('Escape','The guard has fallen asleep');campSims.forEach(c=>{if(c.p==='rifle')c.p='sad';});await csWait(1800);csCaption(null);}
  me.path=[{x:P.x,z:P.z-14},{x:P.x+4,z:P.z-34}];me.i=0;me.sp=paid?3.2:6;csShot(()=>new THREE.Vector3(me.x+6,4,me.z+8),()=>new THREE.Vector3(me.x,1.2,me.z-2),1.2);
  await csWait(paid?3200:2600);
  await new Promise(r=>fadeThen(()=>{leaveCamp();csClear();r();}));
  // police bring you to the gate car park
  const pol=buildVehicle('pickup',0x1f3f8a,{plate:'NPF '+ri(100,999)});decal(pol,'POLICE','#ffffff');pol.g.position.set(30,0,135);pol.g.rotation.y=-Math.PI/2;
  const V={x:30,z:135,dir:-Math.PI/2,i:0};const path=[{x:3,z:135},{x:2,z:131},{x:2,z:96},{x:8,z:93},{x:16,z:93},{x:16,z:98}];
  CS.tick=dt=>{const ox=V.x,oz=V.z;stepAlong(V,path,9,dt);V.rd=V.rd==null?V.dir:V.rd+angDiff(V.dir,V.rd)*Math.min(1,dt*3);pol.g.position.set(V.x,0,V.z);pol.g.rotation.y=V.rd;vehAnim(pol,Math.hypot(V.x-ox,V.z-oz),0,dt);};
  csShot([22,10,118],()=>new THREE.Vector3(V.x,1,V.z),1.4);CS.camInit=false;csCaption(paid?'Released':'You made it','The police bring you back to Veritas');
  await csUntil(()=>V.i>=path.length,16000);csCaption(null);vehDoor(pol,'r0',true);await csWait(500);
  const me2=csActor({g:player,x:V.x+2.2,z:V.z,keep:true});player.visible=true;me2.pose='sad';csShot([V.x+8,4,V.z-6],[V.x+2,1.3,V.z],1.6);await csWait(1800);
  CS.tick=null;outdoor.remove(pol.g);csClear();csEnd();P.x=V.x+2.2;P.z=V.z-1;W.freePos={x:P.x,z:P.z};}
/* test hooks (only when the page is opened by the QA harness) */
if(window.__QA)window.__VLX={get S(){return S;},W,CS,P,cam,camera,buildVehicle,makeSim,outdoor,kekeModel,csStart,csShot,csEnd,csActor,CAST,PARENT_LOOK,BANDIT_LOOK,pose,castTalk,castN,STORIES,storySt,stGo,askDate,startDate,flirt,datingChoices,loveSt,rd,rdAdd,efccRaid,yahooNight,yahooResult,yh,banditRaid,captiveMenu,releaseCaptive,toCamp,enterBuilding,exitBuilding,openLoc,goTo,tickMinute,newDay,openPhone,setPhone,renderPhone,dialog,closeDlg,UI,LOCS,npcs,arrivalSkip,startArrival,tapNpc,witnesses,memAdd};
