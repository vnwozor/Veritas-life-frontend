/* ================= DAY 1: YOUR PARENTS BRING YOU TO SCHOOL =================
   Dad drives in through the Main Gate to the Gate Car Park. The family unloads the boot,
   Mr. Paulinus meets them, talks about the school and walks everyone to the hostel.
   The parents settle you into your room, say goodbye and leave. Skippable at any time. */
const PARENT_LOOK={
  dad:{skin:0x4a2f1d,shirt:0x2b3a52,pants:0x2b3a52,top:'kaftan',hairStyle:'low',hair:1.2,hairC:0x2a2a2a,face:'square',build:1.12,belly:1.12,height:1.04,shoeStyle:'shoes',shoes:0x2a1d14,watch:true,glasses:false,fila:0x2b3a52},
  mum:{skin:0x6a4428,shirt:0xc9772a,pants:0xc9772a,female:true,top:'kaftanA',hairStyle:'bun',face:'round',build:1.1,belly:1.06,earrings:true,shoeStyle:'shoes',shoes:0x5a2a1a,lipC:0x7a2a2a}};
function arrivalNeeded(){return S&&S.intro&&!S.flags.arrived;}
async function arrivalCutscene(after){
  const L=LOCS.gatepark,spot={x:L.x-6,z:L.z+0.4};const hostel=LOCS.boys;const F=isF();
  csStart();W.arrAfter=after;
  // the family car comes down Bwari road, through the gate, into the car park
  const car=buildVehicle('suv',pick([0x1b1b1b,0xc9ccd1,0x2b3a52,0x6b1d1d]),{plate:'ABJ '+ri(100,999)+' '+pick(['KW','GW','BW'])});
  const V={x:70,z:135+LANE,dir:-Math.PI/2,i:0};car.g.position.set(V.x,0,V.z);car.g.rotation.y=V.dir;
  /* it keeps to the correct lane all the way (LANE: right-hand side of every road), like the traffic */
  const route1=[{x:4,z:135+LANE},{x:-LANE,z:131},{x:-LANE,z:94},{x:3,z:90-LANE},{x:spot.x-3.5,z:90-LANE},{x:spot.x,z:93.5},{x:spot.x,z:97},{x:spot.x,z:spot.z}];
  player.visible=false;P.path=null;P.mode='idle';
  let driving=true,steer=0;
  /* the family car keeps to the traffic rules too: it waits behind (or for) any vehicle in front of it */
  const ahead=()=>{const r=V.rd==null?V.dir:V.rd,fx=Math.sin(r),fz=Math.cos(r);for(const k of VEH){if(!k.g||!k.g.parent||!k.g.visible)continue;const q=k.g.position,dx=q.x-V.x,dz=q.z-V.z,al=dx*fx+dz*fz;if(al<=0.3||al>9)continue;if(Math.abs(dx*fz-dz*fx)<2.6)return k;}return null;};
  const carT=(dt)=>{if(!driving)return vehAnim(car,0,0,dt);{const k=ahead();if(k){V.hold=(V.hold||0)+dt;
      /* a car that won't clear the way (stuck head-on) is quietly sent elsewhere instead of being driven through */
      if(V.hold>5&&k.mode==='ambient'){const far=NODES.filter(n=>Math.hypot(n.x-V.x,n.z-V.z)>90);const n=far.length?pick(far):null;if(n){k.x=n.x;k.z=n.z;k.path=null;k.i=0;k.g.position.set(n.x,0,n.z);}}
      return vehAnim(car,0,steer,dt);}V.hold=0;}const ox=V.x,oz=V.z;const before=V.dir;const done=stepAlong(V,route1,V.i>=5?3.2:V.i>=4?6:9,dt);const d=Math.hypot(V.x-ox,V.z-oz);
    V.rd=V.rd==null?V.dir:V.rd+angDiff(V.dir,V.rd)*Math.min(1,dt*3.2);steer+=(clamp(angDiff(V.dir,V.rd)*1.4,-0.5,0.5)-steer)*Math.min(1,dt*5);
    car.g.position.set(V.x,0,V.z);car.g.rotation.y=V.rd;vehAnim(car,d,steer,dt);if(done){driving=false;}};
  CS.tick=carT;W.csCar=car;sfx('horn');
  csShot([46,22,170],()=>new THREE.Vector3(V.x,1,V.z),1.2);CS.camInit=false;
  csCaption('Resumption day','Veritas University, Bwari · '+DAYS[wd(S.t)]+', Day 1');
  await csWait(3200);csCaption(null);
  csShot(()=>{const r=V.rd||0;return new THREE.Vector3(V.x-Math.sin(r)*15+Math.cos(r)*6,7,V.z-Math.cos(r)*15-Math.sin(r)*6);},()=>new THREE.Vector3(V.x+Math.sin(V.rd||0)*4,1.2,V.z+Math.cos(V.rd||0)*4),1.4);
  await csUntil(()=>V.z<101,20000);csCaption(null);
  csShot([spot.x+15,6.5,spot.z-13],()=>new THREE.Vector3(V.x,1.2,V.z),1.2);
  await csUntil(()=>!driving,20000);await csWait(500);
  // doors open, everyone gets out
  vehDoor(car,'l0',true);vehDoor(car,'r0',true);vehDoor(car,'r1',true);await csWait(500);
  const out=(side,dz)=>{const c=Math.cos(V.rd),sn=Math.sin(V.rd);const lx=side*1.9,lz=dz;return {x:V.x+lx*c+lz*sn,z:V.z-lx*sn+lz*c};};
  const pDad=out(-1,0.6),pMum=out(1,0.7),pMe=out(1,-0.9);
  const dad=csActor({look:PARENT_LOOK.dad,x:pDad.x,z:pDad.z,dir:V.rd-Math.PI/2});const mum=csActor({look:PARENT_LOOK.mum,x:pMum.x,z:pMum.z,dir:V.rd+Math.PI/2});
  const me=csActor({g:player,x:pMe.x,z:pMe.z,dir:V.rd+Math.PI/2,keep:true});player.visible=true;
  const back=out(0,-4.6);[dad,mum,me].forEach((a,i)=>{a.pose='stand';});
  csWalk(dad,out(-1.1,-3.6),3.2);csWalk(mum,out(1.2,-3.4),3.2);csWalk(me,out(0.2,-3.9),3.2);
  csShot([back.x-6,4.6,back.z-9],[back.x,1.6,back.z+1],1.6);
  await csWait(700);vehDoor(car,'l0',false);vehDoor(car,'r0',false);vehDoor(car,'r1',false);
  await csSay(dad,'We have reached. Thank God for journey mercies.',2600);
  car.boot.t=1;sfx('door');await csWait(900);
  // unload: suitcase, mattress, Ghana-must-go bag, bucket, provisions carton
  const items={};const place=(k,ox,oz)=>{const pr=makeProp(k);const p=out(ox,oz);pr.position.set(p.x,0,p.z);pr.rotation.y=V.rd+rnd(-0.4,0.4);outdoor.add(pr);items[k]=pr;};
  place('suitcase',-0.9,-4.4);await csWait(350);place('gmg',0.5,-4.7);await csWait(350);place('bucket',1.3,-4.3);await csWait(350);place('carton',-0.3,-5.1);await csWait(350);place('mattress',-2.4,-4.6);
  me.face=dad;dad.face=me;mum.face=dad;
  await csSay(mum,F?'My daughter, carry your box. Your father will carry the mattress.':'My son, carry your box. Your father will carry the mattress.',3000);
  car.boot.t=0;sfx('door');
  const take=(a,k,how)=>{const pr=items[k];if(!pr)return;outdoor.remove(pr);csCarry(a,pr,how);};
  take(me,'suitcase','front');take(dad,'mattress','head');take(mum,'bucket','hand');
  outdoor.remove(items.gmg);outdoor.remove(items.carton); // the porter takes the rest later
  await csSay(dad,'Ehen. Where is this hostel administrator they said will meet us?',2800);
  // Mr. Paulinus comes from the gate road
  const pl=csActor({look:PEOPLE.paulinus.look,x:6,z:93.5,dir:Math.PI/2,sp:3.4});const meetAt=out(0,-7.4);csWalk(pl,meetAt,3.4);
  csShot([meetAt.x+9,5,meetAt.z+1],()=>new THREE.Vector3(pl.x,1.2,pl.z),1.3);
  await csUntil(()=>csArrived(pl),12000);pl.face=dad;dad.face=pl;mum.face=pl;me.face=pl;pl.pose='wave';csShot(()=>{const fx2=(dad.x+mum.x+me.x)/3,fz=(dad.z+mum.z+me.z)/3,dx=pl.x-fx2,dz=pl.z-fz,l=Math.hypot(dx,dz)||1;return new THREE.Vector3(pl.x+dx/l*6+dz/l*3.4,5,pl.z+dz/l*6-dx/l*3.4);},()=>new THREE.Vector3((dad.x+mum.x+me.x+pl.x)/4,camera.aspect>1?1.5:0.8,(dad.z+mum.z+me.z+pl.z)/4),1.4);
  await csWait(500);pl.pose='talk';
  const P_=PEOPLE.paulinus.name,hn=fx(hostel.name),hall='St. Joseph Hall',sir=F?'ma':'sir';
  await csTalk({who:'paulinus',kicker:'Gate Car Park · Resumption',text:'"Good morning sir, good morning madam. You are welcome to Veritas University. I am '+P_+', the Hall Administrator of '+hall+'. And this must be our new student, <b>'+S.name+'</b>."',
    choices:[{t:'"Good morning '+sir+'"',fn:()=>{S.suspicion=Math.max(0,S.suspicion-2);return null;}},{t:'Shake '+(F?'her':'his')+' hand',fn:()=>{S.suspicion=Math.max(0,S.suspicion-3);return null;}}]});
  dad.pose='talk';pl.pose='stand';await csSay(dad,'Good morning. Thank you for receiving us.',2400);dad.pose='stand';pl.pose='talk';
  await csTalk({who:'paulinus',kicker:P_+' · about the school',text:'"Veritas is a Catholic university, and we take three things seriously here: <b>Mass</b>, <b>discipline</b> and <b>your books</b>.<br><br>Sunday Mass is at 7 AM, and Wednesday evening Mass too. A student who misses Mass pays a fine before exams. Lectures start at 8. Attendance counts in your score."',choices:[{t:'Listen',fn:()=>null}]});
  await csTalk({who:'paulinus',kicker:P_+' · hostel rules',text:'"In the hostel: the gate locks at <b>10 PM</b>. Hair must be low and neat. No cooking in the rooms, no smoking, and no visiting the '+(F?'boys\'':'girls\'')+' hostel. I inspect the rooms at night. Keep your corner clean and we will be friends."',
    choices:[{t:'"Yes '+sir+'"',fn:()=>null},{t:'"Even the hair, '+sir+'?"',fn:()=>{S.suspicion+=2;return '"Especially the hair." He looks at your head for a long second.';}}]});
  mum.pose='talk';pl.pose='stand';await csSay(mum,'Please sir, what about food? This one cannot cook to save life.',3000);mum.pose='stand';pl.pose='talk';
  await csSay(pl,'Madam, nobody starves here. Veritas Cafe, GGS, First Cafe, Mac D. And Mama Put sells breakfast.',3600);
  dad.pose='talk';pl.pose='stand';await csSay(dad,'And security? We hear things on the news.',2600);dad.pose='stand';pl.pose='talk';
  await csSay(pl,'Officer Tiger and his men patrol day and night. Stay inside after dark and never go near the back fence.',3800);
  await csTalk({who:'paulinus',kicker:P_,text:'"Any question before I take you to your room?"',choices:[
    {t:'"Where can I make some money?"',fn:()=>{S.flags.askedMoney=1;return '"The cafes need hands in their kitchens, and Keke Park needs people to carry loads. But your books come first."';}},
    {t:'"Who are my roommates?"',fn:()=>'"Five boys in Room 104. Good boys… mostly. You will meet them now."'.replace(/boys/g,F?'girls':'boys')},
    {t:'"No '+sir+', thank you"',fn:()=>null}]});
  // walk to the hostel together; Paulinus points out places on the way
  pl.pose='stand';[pl,dad,mum,me].forEach(a=>a.face=null);
  const door=hostel.door;const dir0=Math.atan2(door.x-pl.x,door.z-pl.z);
  csWalk(pl,door,3.3);setTimeout(()=>{if(CS.on)csWalk(dad,{x:door.x+1.4,z:door.z+1.2},3.25);},250);setTimeout(()=>{if(CS.on)csWalk(mum,{x:door.x-1.4,z:door.z+1.6},3.25);},450);setTimeout(()=>{if(CS.on)csWalk(me,{x:door.x,z:door.z+2.4},3.25);},650);
  csFollow(me,13,8);
  const tour=[['first','"That is First Cafe. Indomie and egg, morning till night."'],['keke','"Keke Park. One hundred naira takes you anywhere on campus."'],['kiosk','"Mama Ngozi\'s kiosk: data, garri, water. Everything."'],['barber','"The barber is there. Use him."'],['clinic','"Health Centre. The nurse is there day and night."'],['macd','"Mac D. Expensive, but students love it."'],['second','"Second Cafe. Cheap and filling."']];
  const said={};const t0=performance.now();
  await csUntil(()=>{for(const [id,line] of tour){const T=LOCS[id];if(!said[id]&&T&&Math.hypot(pl.x-T.door.x,pl.z-T.door.z)<22){said[id]=1;csSay(pl,line,3600).catch(()=>{});}}
    if(performance.now()-t0>11000&&!said.cut){said.cut=1;return true;}return csArrived(pl);},60000);
  if(!csArrived(pl)){fadeThen(()=>{const n=(a,dx,dz)=>{a.x=door.x+dx;a.z=door.z+dz;a.path=null;};n(pl,0,3);n(dad,1.4,4.6);n(mum,-1.4,4.8);n(me,0,6);});csCaption(null);await csWait(700);}
  csShot([door.x+10,5,door.z+8],[door.x,2,door.z],1.6);
  csWalk(pl,door,3.3);csWalk(dad,{x:door.x+1.4,z:door.z+1.8},3.2);csWalk(mum,{x:door.x-1.4,z:door.z+2},3.2);csWalk(me,{x:door.x,z:door.z+2.6},3.2);
  await csUntil(()=>csArrived(pl)&&csArrived(me),9000);
  await csSay(pl,'This is '+hn+'. Follow me.',2200);openDoor('boys',1800);sfx('door');
  // inside the room
  await new Promise(res=>fadeThen(()=>{csClear();me.g=player;enterRoomForArrival();res();}));
  await arrivalRoom(F);
}
function enterRoomForArrival(){const I=getInt('boys');S.inside='boys';S.at='boys';outdoor.visible=false;I.g.visible=true;I.g.add(player);I.nav=null;intNav(I);if(I.populate)I.populate();
  I.paul.g.visible=false;scene.fog.near=200;scene.fog.far=400;showTitle(LOCS.boys.name.toUpperCase(),LOCS.boys.iname||LOCS.boys.sub);P.x=I.spawn.x;P.z=I.spawn.z;}
async function arrivalRoom(F){const I=getInt('boys');const g=intNav(I);const mine=I.bunks[1];const sp=I.spawn;
  const pl=csActor({look:PEOPLE.paulinus.look,parent:I.g,x:sp.x-0.6,z:sp.z-1.2,dir:Math.PI,grid:g,sp:2.6});
  const dad=csActor({look:PARENT_LOOK.dad,parent:I.g,x:sp.x+0.9,z:sp.z-0.2,dir:Math.PI,grid:g,sp:2.6});const mum=csActor({look:PARENT_LOOK.mum,parent:I.g,x:sp.x-1.8,z:sp.z,dir:Math.PI,grid:g,sp:2.6});
  const me=csActor({g:player,parent:I.g,x:sp.x,z:sp.z+0.4,dir:Math.PI,grid:g,sp:2.6,keep:true});
  const matt=makeProp('mattress');csCarry(dad,matt,'head');const suit=makeProp('suitcase');csCarry(me,suit,'front');const bk=makeProp('bucket');csCarry(mum,bk,'hand');
  csShot([5.5,9.5,9.5],[0,1.2,-1.2],2);CS.camInit=false;
  csWalk(pl,{x:mine.x+2.0,z:mine.z+3.0});csWalk(dad,{x:mine.x+1.9,z:mine.z+1.4});csWalk(mum,{x:mine.x-1.6,z:mine.z+2.7});csWalk(me,{x:mine.x+0.6,z:mine.z+3.4});
  await csUntil(()=>CS.actors.every(csArrived),9000);pl.face=me;me.face=pl;dad.face={x:mine.x,z:mine.z};mum.face={x:mine.x,z:mine.z};
  const room=S.room==='210'?'Room 210':'Room 104';
  await csSay(pl,room+'. Your bunk is this middle one, the top bed. The locker with the yellow padlock is yours.',3800);
  // mattress goes on the bunk, bag beside the locker
  csCarry(dad,null);matt.scale.setScalar(1);matt.rotation.set(0,0,0);matt.position.set(mine.x,mine.upper+0.06,mine.z+0.2);matt.scale.set(1.9,1.4,1.95);I.g.add(matt);dad.pose='serve';
  csCarry(me,null);suit.position.set(mine.x+1.5,0,mine.z+2.3);suit.rotation.y=0.3;I.g.add(suit);csCarry(mum,null);bk.position.set(mine.x-1.1,0,mine.z+2.1);I.g.add(bk);
  W.arrProps=[matt,suit,bk];mum.pose='sweep';await csWait(1600);mum.pose='stand';dad.pose='stand';
  const mt=I.mates;if(mt.tunde){placeSim(mt.tunde,mine.x+3.6,mine.z+5.2,Math.PI*1.2,'wave',0);}
  csTwoShot(mum,me,7,1);
  await csTalk({who:'mum',kicker:'Your mother',text:'"I packed garri, sugar, milk, Milo and two cartons of Indomie. Don\'t finish everything in one week, and don\'t let anybody "borrow" it. Eat proper food. Greet your roommates."',
    choices:[{t:'"Thank you Mummy"',fn:()=>{rel('mum',5);return null;}},{t:'"Mummy I\'m not a small child again"',fn:()=>{rel('mum',-1);return '"You will always be my baby. Come here." She adjusts your collar anyway.';}}]});
  S.inv.garri=(S.inv.garri||0)+8;S.inv.gift=(S.inv.gift||0)+1;
  dad.face=me;me.face=dad;dad.pose='talk';csTwoShot(dad,me,7,1);
  const bgMoney={ajebutter:15000,ajekpako:3000,scholar:5000}[S.bg]||5000;
  await csTalk({who:'dad',kicker:'Your father',text:'"Listen to me. You are not here to play. Read your books. Go to Mass. Choose your friends well. If anybody tells you anything that sounds too sweet, run."<br><br>He presses folded notes into your hand: <b>'+naira(bgMoney)+'</b>.',
    choices:[{t:'"I won\'t disappoint you, Daddy"',fn:()=>{rel('dad',6);return null;}},{t:'Hug him',fn:()=>{rel('dad',8);rel('mum',4);return 'He pats your back twice, which for him is a lot.';}}]});
  earn(bgMoney,'From Dad at resumption');S.flags.dadMoney=1;dad.pose='stand';
  mum.face=me;me.face=mum;mum.pose='hug';me.pose='hug';await csWait(1600);mum.pose='stand';me.pose='stand';
  await csSay(mum,'Call me every night. I mean it.',2600);
  // the parents leave
  [dad,mum].forEach(a=>{a.face=null;csWalk(a,{x:I.spawn.x+(a===dad?0.6:-0.6),z:I.d/2-1.1},2.8);});me.face={x:I.spawn.x,z:I.spawn.z};me.pose='wave';
  csShot([-3,7.5,6.5],()=>new THREE.Vector3((dad.x+me.x)/2,1.6,(dad.z+me.z)/2),1.4);
  await csSay(dad,'Take care of yourself.',2000);
  await csUntil(()=>csArrived(dad)&&csArrived(mum),9000);sfx('door');dad.g.visible=false;mum.g.visible=false;me.pose='stand';
  await csWait(600);
  pl.face=me;await csSay(pl,'Settle in. Inspection is at night. Welcome to Veritas.',3000);csWalk(pl,{x:I.spawn.x,z:I.d/2-1.1},3);await csUntil(()=>csArrived(pl),6000);sfx('door');pl.g.visible=false;
  arrivalDone();}
function arrivalDone(){const I=getInt('boys');csClear();csDropAll();CS.tick=null;if(W.csCar){if(W.csCar.g.parent)W.csCar.g.parent.remove(W.csCar.g);W.csCar=null;}
  if(W.arrProps){W.arrProps.forEach(p=>{if(p.parent)p.parent.remove(p);});W.arrProps=null;}
  if(!S.inside){enterRoomForArrival();}
  P.x=I.spawn.x-0.4;P.z=I.spawn.z-1.6;P.dir=Math.PI;P.path=null;P.mode='idle';player.visible=true;player.position.set(P.x,0,P.z);
  if(player.parent!==I.g)I.g.add(player);
  S.flags.arrived=1;csEnd();$('#leave').hidden=false;$('#leave').textContent='Leave '+(LOCS.boys.iname||LOCS.boys.name);
  cam.tx=P.x;cam.tz=P.z;cam.yaw=0.35;cam.cd=cam.idist*1.3;cam.cp=1.0;cam.eff=null;
  if(S.inv.garri<8)S.inv.garri=8;
  setTimeout(()=>{meetRoommates();const f=W.arrAfter;W.arrAfter=null;if(f)setTimeout(f,400);},500);save();}
function arrivalSkip(){if(UI.dlg){UI.dlgQ=[];UI.dlg=false;$('#dlgWrap').hidden=true;}
  if(!S.flags.dadMoney){S.flags.dadMoney=1;earn({ajebutter:15000,ajekpako:3000,scholar:5000}[S.bg]||5000,'From Dad at resumption');S.inv.gift=(S.inv.gift||0)+1;}
  CS.skip=false;fadeThen(()=>arrivalDone());}
function startArrival(after){arrivalCutscene(after).catch(e=>{if(e===SKIP)arrivalSkip();else{console.error(e);arrivalSkip();}});}
