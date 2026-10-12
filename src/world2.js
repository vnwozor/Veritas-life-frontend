/* ================= WORLD 2: classes in Blocks A–D, hostel corridors with rooms and an upstairs floor,
   stairs in the family house, library, admin and lecture blocks, decorating your hostel room and family home ================= */

/* ---------- classes are spread over Blocks A–D ---------- */
function blockFor(code){let h=0;for(const ch of String(code))h=(h*31+ch.charCodeAt(0))>>>0;return BLOCKS[h%BLOCKS.length];}
function tagClasses(){try{(S.today&&S.today.classes||[]).forEach(c=>{if(!c.loc)c.loc=blockFor(c.code);});}catch(e){}}
{const _nd=newDay;newDay=function(){const r=_nd.apply(this,arguments);tagClasses();return r;};}
HOOKS.boot.push(tagClasses);

/* ---------- moving between rooms of the same building (no trip outside) ---------- */
function goInt(id,spawn,face){if(W.fading)return;const from=S.inside;if(ACT)stopAction(true);
  fadeThen(()=>{if(from){const F=getInt(from);F.g.visible=false;F.labels.forEach(l=>l.el.style.display='none');}
    const L=LOCS[id];const I=getInt(id);S.inside=id;S.at=id;outdoor.visible=false;I.g.visible=true;I.g.add(player);I.nav=null;intNav(I);if(I.populate)I.populate();cam.eff=null;
    showTitle(fx(L.name).toUpperCase(),L.iname||L.sub);I.lastPop=Math.floor(S.t/30);const sp=spawn||I.spawn;const fp=freeNear(intNav(I),sp.x,sp.z,4);
    P.x=fp.x;P.z=fp.z;P.dir=face==null?Math.PI:face;P.path=null;P.mode='idle';player.visible=true;cam.tx=P.x;cam.tz=P.z;cam.cd=cam.idist*2.1;cam.cp=1.2;sfx('door');
    scene.fog.near=200;scene.fog.far=400;$('#leave').hidden=false;$('#leave').textContent=L.leaveTxt||('Leave '+(L.iname||fx(L.name)));
    if(id==='boys'&&S.intro&&!CS.on)setTimeout(meetRoommates,450);if(!S.intro)try{chatArrive(id);}catch(e){}});}
/* virtual places (inside a building, no outside shape): they share the building's door */
function vloc(id,o){const B=LOCS[o.of];LOCS[id]=Object.assign({id,x:B.x,z:B.z,w:0,d:0,h:0,door:B.door,virtual:true},o);return LOCS[id];}

/* ---------- stairs (a real flight of steps you walk to) ---------- */
function stairsMesh(I,x,z,rot,up){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot||0;I.g.add(g);
  const n=8;for(let i=0;i<n;i++){const y=up?(i+1)*0.42:(n-i)*0.42;part(G.box,0x9a8e7a,2.2,0.18,0.55,0,y-0.09,-i*0.55+1.9,g,false);part(G.box,0x7d725f,2.2,y,0.55,0,y/2,-i*0.55+1.9,g,false);}
  part(G.box,0x5a4a3a,0.08,1.1,4.6,-1.15,up?2.3:1.9,0.1,g,false);part(G.box,0x5a4a3a,0.08,1.1,4.6,1.15,up?2.3:1.9,0.1,g,false);
  return g;}

/* ================= HOSTEL CORRIDORS ================= */
vloc('boysHall',{of:'boys',name:LOCS.boys.name,iname:'Ground floor corridor',inside:'hall',floor:1,leaveTxt:'Leave the hostel'});
vloc('boysHall2',{of:'boys',name:LOCS.boys.name,iname:'First floor corridor',inside:'hall',floor:2,leaveTxt:'Go downstairs'});
vloc('nroom',{of:'boys',name:LOCS.boys.name,iname:'A room down the corridor',inside:'nroom',leaveTxt:'Back to the corridor'});
const HALL_DOORS=[[1,-5.4,-4,'n'],[2,-1.8,-4,'n'],[3,1.8,-4,'n'],[4,5.4,-4,'n'],[5,-2.6,4,'s'],[6,0.6,4,'s'],[7,3.8,4,'s']];
function myRoomNo(){return S.room==='210'?210:104;}
function roomNo(fl,k){return fl*100+(fl===2&&k===4?10:k);}/* the first floor has Room 210 where Room 204 would be */
const NAMES_M=['Ugo','Dayo','Ikenna','Seyi','Musa','Kene','Tobi','Bayo','Emeka J.','Victor','Somto','Yusuf'],NAMES_F=['Ada','Kemi','Zainab','Tolu','Ifeoma','Bisi','Hauwa','Chioma','Funke','Nneka','Amaka','Ruth'];
BUILD.hall=function(I,id){const L=LOCS[id];const fl=L.floor||1;shell(I,16,8,4.4,floorTex('#d4cbb8','#c2b6a0','tile'),0xece5d5,-6.6,0x6b4a2e);
  poster(I,0,0,3.4,[[fx(LOCS.boys.name).toUpperCase(),'800 24px Georgia'],[fl===1?'GROUND FLOOR':'FIRST FLOOR','700 20px sans-serif']],'#1f2d44','#e3b04b',3,0.9);
  for(let k=-6;k<=6;k+=4){const l=part(G.box,0xfff3d0,0.9,0.06,0.25,k,4.2,0,I.g,false);l.material=new THREE.MeshBasicMaterial({color:0xfff3d0});}
  /* room doors on both walls, each with its number */
  HALL_DOORS.forEach(([k,x,z,side])=>{const no=roomNo(fl,k);const g=new THREE.Group();g.position.set(x,0,z+(side==='n'?0.3:-0.3));I.g.add(g);
    part(G.box,0x7b5636,1.5,3.0,0.12,0,1.5,0,g);part(G.box,0x5a3d26,1.7,3.15,0.06,0,1.55,side==='n'?-0.05:0.05,g,false);part(G.sph,0xe3b04b,0.07,0.07,0.07,0.5,1.5,side==='n'?0.08:-0.08,g,false);
    const plate=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.32),new THREE.MeshBasicMaterial({map:textTex([[String(no),'800 40px sans-serif']],128,56,no===myRoomNo()?'#e3b04b':'#f2efe6','#1a1208')}));plate.position.set(0,2.6,side==='n'?0.08:-0.08);if(side==='s')plate.rotation.y=Math.PI;g.add(plate);
    addObj(I,g,{id:'door'+no,name:no===myRoomNo()?'Room '+no+' · yours':'Room '+no,ly:3.4,spot:{x,z:z+(side==='n'?1.4:-1.4)},acts:()=>roomActs(no,fl,x,z,side)});});
  /* stairs at the far end */
  const st=stairsMesh(I,6.6,0.2,0,fl===1);addObj(I,st,{id:'stairs',name:fl===1?'Stairs up':'Stairs down',ly:3.6,spot:{x:5,z:1.6},acts:()=>[fl===1?
    A('Go upstairs','First floor · Rooms 201–210',()=>goInt('boysHall2',{x:5,z:1.6},-Math.PI/2)):A('Go downstairs','Ground floor · Rooms 101–107',()=>goInt('boysHall',{x:5,z:1.6},-Math.PI/2))]});
  /* the notice board shows real players in the hostel right now */
  const nb=new THREE.Group();nb.position.set(-3.6,0,3.8);I.g.add(nb);part(G.box,0x8a6a45,2.2,1.4,0.1,0,2.4,0,nb,false);part(G.box,0xf2efe6,1.9,1.1,0.05,0,2.4,-0.07,nb,false);
  addObj(I,nb,{id:'board',name:'Who\'s in the hostel',ly:3.6,spot:{x:-3.6,z:2.4},acts:()=>hostelBoard()});
  I.crowd=[];for(let k=0;k<(QM?4:3);k++){const r=interiorSim(I,randomLook(isF()),'student');r.g.userData.npc='student';I.pick.push(r.g);I.crowd.push(r);}
  I.populate=()=>{resetInt(I);const h=minOf(S.t)/60;const n=h>=23||h<6?0:h>=7&&h<16?1:I.crowd.length;
    I.crowd.slice(0,n).forEach((r,i)=>placeSim(r,rnd(-5.5,4.5),rnd(-1.5,1.5),rnd(0,6.28),pick(['phone','talk','cross','stand','laugh']),0));};};
function roomActs(no,fl,x,z,side){const mine=no===myRoomNo();if(mine)return [A('Go into your room','Room '+no+' · your bunk, locker and roommates',()=>{S.flags.lockPass=Math.max(S.flags.lockPass||0,S.t+2);goInt('boys');})];
  const names=isF()?NAMES_F:NAMES_M;const who=names[no%names.length],who2=names[(no*7+3)%names.length];
  return [A('Knock on Room '+no,'See who is in',()=>{const h=minOf(S.t)/60;if(h>=23||h<6)return toast('Room '+no,'"Who is knocking by this time?! Go and sleep!"','bad');toast('Room '+no,pick(['"It\'s open, come in!"','"Who\'s that? Ah, come in jare."','"Enter, but don\'t touch my garri."']));}),
    A('Go into Room '+no,who+' and '+who2+' live here',()=>{W.nroom={no,fl,x,z,side,who,who2};goInt('nroom');})];}
function hostelBoard(){const n=NETX();const L=[];const online=(n&&n.online||[]).filter(p=>p.id!==(n.user&&n.user.id)&&p.loc&&(p.loc.startsWith('room:')||p.loc==='in:boysHall'||p.loc==='in:boysHall2'||p.loc==='in:boys'));
  if(!n)return [A('Offline game','Real players show up here in the online game',()=>{},{dis:'Not online'})];
  if(!online.length)L.push(A('No real players in the hostel right now','Check again later, or invite friends from the Players app',()=>{},{dis:'Nobody in'}));
  online.slice(0,8).forEach(p=>L.push(A(fx(p.name),(p.loc.startsWith('room:')?'In their room':'In the corridor')+' · '+p.lvl+'L · tap to see their profile',()=>{setPhone('pprof',p.id);})));
  L.push(A('Players app','Find anyone, ask to visit their room or invite them to yours',()=>setPhone('players')));return L;}
/* another student's room down the corridor */
BUILD.nroom=function(I,id){shell(I,11,9,4.4,floorTex('#c9bda6','#b7a98e','tile'),0xe7dfcf,3.4,0x5a4434);
  bunk(I,-3.6,-1.2,0x2b6fd9,0x7a2331);bunk(I,-0.6,-1.2,0x2f8a57,0xe3b04b);locker(I,3.6,-3.6,0,0x3a5a7a);locker(I,4.7,-3.6,0,0x5a3a7a);
  const tb=table(I,2.6,0.8,2.2,1.4,0x6b4a2e);fan(I,0,0,4.1);poster(I,0,0,3.2,[['NO CHEATING','800 22px sans-serif'],['ON MY GARRI','700 20px sans-serif']],'#f2efe6','#a22a2a',1.6,0.8);
  I.sA=interiorSim(I,randomLook(isF()),'student');I.sB=interiorSim(I,randomLook(isF()),'student');[I.sA,I.sB].forEach(r=>{r.g.userData.npc='student';I.pick.push(r.g);});
  addObj(I,tb,{id:'gist',name:'Their table',ly:2.8,spot:{x:2.6,z:2.2},acts:()=>{const R0=W.nroom||{};return [
    A('Gist with '+(R0.who||'them'),'30m · fun, social',()=>startAction('Gisting in Room '+(R0.no||''),30,{where:'nroom',place:{x:2.6,y:0,z:2,r:Math.PI,pose:'sittalk'},per:()=>{N('fun',0.5);try{N('social',0.6);}catch(e){}},done:()=>{S.skills.street+=0.03;toast('Gist','You hear who is dating who on the first floor. Hot.');}})),
    A('Borrow a phone charger','Quick favour',()=>toast('Room '+(R0.no||''),chance(.6)?'"Take am, bring am back o."':'"My own don spoil too. Sorry."'))];}});
  I.populate=()=>{resetInt(I);const R0=W.nroom||{};const h=minOf(S.t)/60;
    if(h>=23||h<6){placeSim(I.sA,-3.6,-0.2,0,'lie',1.27);placeSim(I.sB,-0.6,-0.2,0,'lie',3.07);}
    else{placeSim(I.sA,-0.6,0.6,Math.PI/2,pick(['phone','read','sit']),1.27-0.77);placeSim(I.sB,1.8,2.2,2.6,pick(['talk','laugh','cross','game']),0);}
    if(I.plate){I.plate.parent&&I.plate.parent.remove(I.plate);}I.plate=poster(I,1,0,3.4,[['ROOM '+(R0.no||''),'800 26px sans-serif'],[(R0.who||'')+' & '+(R0.who2||''),'600 20px sans-serif']],'#1f2d44','#f2efe6',2.4,0.9);};};

/* entering the hostel from outside puts you in the corridor; leaving your room takes you back to it */
{const _eb=enterBuilding;enterBuilding=function(id,then){
  if(id==='boys'&&!then&&!S.inside&&!CS.on&&!S.intro&&!W.drive&&isOpen('boys')&&!lockedNow('boys')){if(ACT)stopAction(true);if(cam.mode==='map'){exitMap();setTab('home');}openDoor('boys',900);goInt('boysHall');return;}
  return _eb.apply(this,arguments);};}
{const _xb=exitBuilding;exitBuilding=function(then){const id=S&&S.inside;
  if(!then&&!CS.on&&!W.fading){
    if(id==='boys'){const fl=myRoomNo()>=200?2:1;const d=HALL_DOORS.find(x=>roomNo(fl,x[0])===myRoomNo())||HALL_DOORS[3];goInt(fl===2?'boysHall2':'boysHall',{x:d[1],z:d[2]+(d[3]==='n'?1.4:-1.4)},d[3]==='n'?Math.PI:0);return;}
    if(id==='nroom'){const R0=W.nroom||{fl:1,x:0,z:-4,side:'n'};goInt(R0.fl===2?'boysHall2':'boysHall',{x:R0.x,z:R0.z+(R0.side==='n'?1.4:-1.4)},R0.side==='n'?Math.PI:0);return;}
    if(id==='boysHall2'){goInt('boysHall',{x:5,z:1.6},-Math.PI/2);return;}
    if(id&&LOCS[id]&&LOCS[id].upOf){const B=LOCS[id].upOf;goInt(B,LOCS[id].downSpawn||null);return;}
    if(id==='family2'){goInt('family',{x:5.4,z:3.2},Math.PI);return;}}
  return _xb.apply(this,arguments);};}
/* the hostel's "where are you" checks treat the corridors as the hostel */
{const _ln=lockedNow;lockedNow=function(id){if(['boysHall','boysHall2','nroom'].includes(id))return false;return _ln.apply(this,arguments);};}

/* ================= FAMILY HOUSE: upstairs bedrooms ================= */
vloc('family2',{of:'family',name:LOCS.family.name,iname:'Upstairs · bedrooms',inside:'family2',zone:'off',leaveTxt:'Go downstairs'});
{const _bf=BUILD.family;BUILD.family=function(I,id){_bf(I,id);const st=stairsMesh(I,6.2,3.2,Math.PI,true);
  addObj(I,st,{id:'stairs',name:'Stairs up',ly:3.8,spot:{x:4.6,z:3.6},acts:()=>[A('Go upstairs','Your bedroom, your parents\' room, the balcony',()=>goInt('family2',{x:5,z:2.6},Math.PI))]});};}
BUILD.family2=function(I,id){shell(I,16,13,4.6,floorTex('#b89a72','#a4865e','wood'),0xf3ead8,5.5,0x7a3b2a);const hw=8,hd=6.5;
  /* your bedroom */
  const bed=new THREE.Group();bed.position.set(-5,0,-3.6);I.g.add(bed);part(G.box,0x6b4a2e,2.6,0.5,4.2,0,0.25,0,bed);part(G.box,0xe8d9a8,2.4,0.3,4,0,0.65,0,bed,false);part(G.box,0x2f8a57,2.45,0.1,2.6,0,0.83,0.6,bed,false);part(G.box,0xf2efe6,1.6,0.25,0.6,0,0.9,-1.6,bed,false);
  poster(I,0,-5,3,[['MY ROOM','800 26px sans-serif'],['knock first!','600 20px sans-serif']],'#2b2b2b','#e3b04b',1.8,1);
  const desk=new THREE.Group();desk.position.set(-1.6,0,-5.4);I.g.add(desk);part(G.box,0x5a3d26,2.4,0.1,1,0,1.3,0,desk);part(G.box,0x5a3d26,0.1,1.3,1,-1.1,0.65,0,desk);part(G.box,0x5a3d26,0.1,1.3,1,1.1,0.65,0,desk);part(G.box,0x223344,0.9,0.6,0.06,0,1.65,-0.3,desk,false);chair(I,-1.6,-4.2,Math.PI,0x2b2b2b);
  /* parents' room behind a half wall */
  part(G.box,0xe9e0cc,0.3,3.2,6,1.5,1.6,-3.5,I.g);const pbed=new THREE.Group();pbed.position.set(5,0,-3.6);I.g.add(pbed);part(G.box,0x4a2f1d,3.2,0.6,4.2,0,0.3,0,pbed);part(G.box,0xf2efe6,3,0.3,4,0,0.75,0,pbed,false);part(G.box,0x7a2331,3.05,0.1,2.6,0,0.93,0.6,pbed,false);
  /* balcony door with a view */
  onWall(I,1,-3,2.2,3,3,0xa8cbe0,true);
  const bp={x:bed.position.x,y:0.8,z:bed.position.z+0.3,r:0,pose:'lie'};
  addObj(I,bed,{id:'bed',name:'Your bed',ly:2.4,spot:{x:-3.4,z:-2.2},acts:()=>[A('Sleep','8h · your real bed',()=>startAction('Sleeping',480,{sleep:true,where:id,place:bp,done:()=>{addMoodlet('Slept in your own bed',12,600);toast('Morning','Nothing beats your own bed.','good');}})),A('Nap','2h',()=>startAction('Napping',120,{sleep:true,where:id,place:bp}))]});
  addObj(I,desk,{id:'desk',name:'Your desk',ly:2.6,spot:{x:-1.6,z:-3.4},acts:()=>[A('Study at home','1h · quiet',()=>startAction('Studying at home',60,{where:id,place:{x:-1.6,y:0,z:-4.2,r:Math.PI,pose:'read'},per:()=>N('energy',-0.04),done:()=>{try{addStudy(1.1);}catch(e){}}})),A('Play games','1h',()=>startAction('Gaming at home',60,{where:id,place:{x:-1.6,y:0,z:-4.2,r:Math.PI,pose:'game'},per:()=>N('fun',0.7)}))]});
  addObj(I,pbed,{id:'pbed',name:'Mum and Dad\'s room',ly:2.4,spot:{x:4,z:-0.8},acts:()=>[A('Look around','Family photos, Dad\'s old suits',()=>toast('Mum and Dad\'s room','Your baby photo is still on the wall. Embarrassing.'))]});
  const st=stairsMesh(I,6.2,3.2,Math.PI,false);addObj(I,st,{id:'stairs',name:'Stairs down',ly:3.4,spot:{x:4.6,z:3.6},acts:()=>[A('Go downstairs','Living room and kitchen',()=>goInt('family',{x:4.6,z:3.6},Math.PI))]});
  I.populate=()=>{resetInt(I);};};

/* ================= UPSTAIRS IN CAMPUS BUILDINGS ================= */
function addUpper(baseId,o){const B=LOCS[baseId];const id=baseId+'_up';vloc(id,Object.assign({of:baseId,name:B.name,inside:'upper',upOf:baseId,leaveTxt:'Go downstairs',downSpawn:o.downSpawn},o));
  return id;}
BUILD.upper=function(I,id){const L=LOCS[id];const kind=L.kind2||'study';shell(I,18,12,4.6,floorTex('#cfc8b8','#bdb5a2','tile'),0xeee8da,6.6,0x4a5a6a);
  poster(I,0,0,3.4,[[fx(LOCS[L.upOf].name).toUpperCase(),'800 24px sans-serif'],['FIRST FLOOR','700 20px sans-serif']],'#1f2d44','#f2efe6',3,0.9);
  if(kind==='study'){for(let i=0;i<3;i++)for(let j=0;j<2;j++)tableSet(I,-5+i*5,-2.6+j*4.6,0x6b4a2e,0x2b4f8a);}
  else if(kind==='class'){for(let r=0;r<4;r++)for(let c=0;c<5;c++){const x=-6+c*3,z=-2.6+r*2.2;part(G.box,0x8a6a45,2.2,0.1,0.7,x,1.25,z-0.5,I.g,false);chair(I,x,z,Math.PI,0x7a2331);}onWall(I,0,0,2.6,6,2.2,0x24402f);}
  else{for(let i=0;i<4;i++){table(I,-5+i*3.4,-3.4,2.2,1.2,0x5a3d26);chair(I,-5+i*3.4,-2.2,Math.PI,0x2b2b2b);}locker(I,7.6,-4.6,0,0x6b6b6b);locker(I,6.4,-4.6,0,0x6b6b6b);}
  const room=new THREE.Group();room.position.set(0,0,0.5);I.g.add(room);
  addObj(I,room,{id:'up',name:kind==='study'?'Quiet reading room':kind==='class'?'Upstairs classroom':'Offices',ly:2.6,spot:{x:0,z:3},acts:()=>kind==='office'?[A('Ask at the offices','5m',()=>toast(fx(LOCS[L.upOf].name),pick(['"Come back on Monday."','"Have you paid your fees? Bursary is downstairs."','"Fill this form in triplicate."'])))]:
    [A('Study up here','1h · quieter than downstairs',()=>{const s=freeSeat(I)||I.seats[0];startAction('Studying upstairs',60,{where:id,place:{x:s.x,y:0,z:s.z,r:s.face,pose:'read'},per:()=>N('energy',-0.04),done:()=>{try{addStudy(1.0);}catch(e){}}});})]});
  const st=stairsMesh(I,7.2,2.8,Math.PI,false);addObj(I,st,{id:'stairs',name:'Stairs down',ly:3.4,spot:{x:5.6,z:3.6},acts:()=>[A('Go downstairs','Back to '+fx(LOCS[L.upOf].name),()=>goInt(L.upOf,L.downSpawn||null))]});
  I.crowd=[];for(let k=0;k<3;k++){const r=interiorSim(I,randomLook(k%2===1),'student');r.g.userData.npc='student';I.pick.push(r.g);I.crowd.push(r);}
  I.populate=()=>{resetInt(I);const h=minOf(S.t)/60;if(h<7||h>=21)return;I.crowd.forEach(r=>seatSim(I,r,freeSeat(I),chance(.7)?'read':'sit'));};};
/* stairs inside the library, administration and each lecture block */
[['library','study'],['admin','office'],['lecture','class'],['blockB','class'],['blockC','class'],['blockD','class']].forEach(([b,k])=>addUpper(b,{kind2:k,iname:'First floor',downSpawn:null}));
{const wrap=(type)=>{const _b=BUILD[type];BUILD[type]=function(I,id){_b.apply(this,arguments);if(!LOCS[id+'_up'])return;const x=I.w/2-1.6,z=I.d/2-3.2;const st=stairsMesh(I,x,z,Math.PI,true);
    addObj(I,st,{id:'stairsup',name:'Stairs up',ly:3.8,spot:{x:x-1.6,z:z+0.6},acts:()=>[A('Go upstairs',LOCS[id+'_up'].kind2==='office'?'Offices':LOCS[id+'_up'].kind2==='study'?'Quiet reading room':'More classrooms',()=>goInt(id+'_up',{x:5.6,z:3.6},Math.PI))]});
    LOCS[id+'_up'].downSpawn={x:x-1.6,z:z+0.6};};};
  ['library','admin','lecture'].forEach(t=>{if(BUILD[t])wrap(t);});}

/* ================= DECORATE: your hostel corner and your family home too ================= */
{const _mh=myHomeHere;myHomeHere=function(){if(!S||!S.inside)return false;if(['boys','family','family2'].includes(S.inside))return true;return _mh.apply(this,arguments);};}

/* ---------- labels for the new places in the map list ---------- */
if(window.__QA)window.__W2={goInt,blockFor,hostelBoard,enter:(id,t)=>enterBuilding(id,t),exit:t=>exitBuilding(t),objectives:()=>{const o=[];(HOOKS.todo||[]).forEach(f=>f(o));return o;}};
