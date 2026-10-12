/* ================= ACTION SCENES =================
   Real, played-out scenes instead of text boxes:
   1. your boys march to the person who wronged you and beat him up
   2. security catch you outside after curfew and drag you to the Main Gate
   3. kidnappers grab you on the road, push you into a car and take you to a house
   4. Mr. Paulinus sees your high hair, marches you to the barber and watches the cut
   5. jumping the back fence (the broken gap is gone; the wall is whole now)
   6. when someone says yes: you hold hands, walk together and kiss
   Every scene can be skipped; the result is the same either way. */

/* ---------- extra poses ---------- */
function _legs(J,t,amp){const a=Math.sin(t)*amp;J.thL.rotation.x=a;J.thR.rotation.x=-a;J.knL.rotation.x=Math.max(0,a)*1.1+0.05;J.knR.rotation.x=Math.max(0,-a)*1.1+0.05;J.body.position.y=Math.abs(Math.cos(t))*0.025;return a;}
Object.assign(POSEX,{
  punch:Object.assign((J,t,sd)=>{const c=Math.sin(t*8+sd*3);J.shR.rotation.x=-1.25-Math.max(0,c)*0.45;J.elR.rotation.x=-1.7+Math.max(0,c)*1.55;J.shL.rotation.x=-1.25-Math.max(0,-c)*0.45;J.elL.rotation.x=-1.7+Math.max(0,-c)*1.55;
    J.shL.rotation.z=0.2;J.shR.rotation.z=-0.2;J.torso.rotation.y=c*0.38;J.torso.rotation.x=0.12;J.thL.rotation.x=-0.35;J.knL.rotation.x=0.45;J.thR.rotation.x=0.25;J.knR.rotation.x=0.15;J.body.position.y=-0.06;J.hd.rotation.x=0.12;},{fast:1}),
  kick:Object.assign((J,t,sd)=>{const c=Math.max(0,Math.sin(t*5+sd));J.thR.rotation.x=-1.5*c;J.knR.rotation.x=0.25+(1-c)*0.6;J.thL.rotation.x=0.1;J.knL.rotation.x=0.2;J.torso.rotation.x=-0.18*c;J.shL.rotation.x=J.shR.rotation.x=-1.0;J.elL.rotation.x=J.elR.rotation.x=-1.6;J.shL.rotation.z=0.3;J.shR.rotation.z=-0.3;},{fast:1}),
  hurt:Object.assign((J,t)=>{J.torso.rotation.x=0.55;J.torso.rotation.z=Math.sin(t*19)*0.06;J.shL.rotation.x=J.shR.rotation.x=-2.3;J.elL.rotation.x=J.elR.rotation.x=-1.7;J.shL.rotation.z=0.5;J.shR.rotation.z=-0.5;J.hd.rotation.x=0.5;
    J.thL.rotation.x=J.thR.rotation.x=-0.45;J.knL.rotation.x=J.knR.rotation.x=0.8;J.body.position.y=-0.16;},{fast:1}),
  held:(J,t)=>{_legs(J,t,0.42);J.shL.rotation.x=J.shR.rotation.x=0.35;J.shL.rotation.z=-0.55;J.shR.rotation.z=0.55;J.elL.rotation.x=J.elR.rotation.x=-0.25;J.torso.rotation.x=0.18;J.hd.rotation.y=Math.sin(t*0.9)*0.45;J.hd.rotation.x=0.18;},
  heldstill:(J,t)=>{J.shL.rotation.x=J.shR.rotation.x=0.35;J.shL.rotation.z=-0.55;J.shR.rotation.z=0.55;J.elL.rotation.x=J.elR.rotation.x=-0.25;J.torso.rotation.x=0.12+Math.sin(t*6)*0.04;J.hd.rotation.y=Math.sin(t*2.3)*0.5;},
  grabR:(J,t)=>{const a=_legs(J,t,0.42);J.shL.rotation.x=-a*0.7;J.shL.rotation.z=-0.08;J.shR.rotation.x=-0.55;J.shR.rotation.z=-0.55;J.elR.rotation.x=-0.7;J.torso.rotation.y=-0.12;},
  grabL:(J,t)=>{const a=_legs(J,t,0.42);J.shR.rotation.x=a*0.7;J.shR.rotation.z=0.08;J.shL.rotation.x=-0.55;J.shL.rotation.z=0.55;J.elL.rotation.x=-0.7;J.torso.rotation.y=0.12;},
  grabRs:(J)=>{J.shL.rotation.z=-0.08;J.shR.rotation.x=-0.55;J.shR.rotation.z=-0.55;J.elR.rotation.x=-0.7;J.torso.rotation.y=-0.12;},
  grabLs:(J)=>{J.shR.rotation.z=0.08;J.shL.rotation.x=-0.55;J.shL.rotation.z=0.55;J.elL.rotation.x=-0.7;J.torso.rotation.y=0.12;},
  handR:(J,t)=>{const a=_legs(J,t,0.4);J.shL.rotation.x=-a*0.6;J.shL.rotation.z=-0.08;J.shR.rotation.x=-0.12;J.shR.rotation.z=-0.42;J.elR.rotation.x=-0.15;J.hd.rotation.y=-0.22+Math.sin(t*0.4)*0.1;},
  handL:(J,t)=>{const a=_legs(J,t,0.4);J.shR.rotation.x=a*0.6;J.shR.rotation.z=0.08;J.shL.rotation.x=-0.12;J.shL.rotation.z=0.42;J.elL.rotation.x=-0.15;J.hd.rotation.y=0.22+Math.sin(t*0.4)*0.1;},
  handRs:(J,t)=>{J.shL.rotation.z=-0.08;J.shR.rotation.x=-0.12;J.shR.rotation.z=-0.42;J.elR.rotation.x=-0.15;J.hd.rotation.y=-0.35;},
  handLs:(J,t)=>{J.shR.rotation.z=0.08;J.shL.rotation.x=-0.12;J.shL.rotation.z=0.42;J.elL.rotation.x=-0.15;J.hd.rotation.y=0.35;},
  kiss:(J,t)=>{J.shL.rotation.x=J.shR.rotation.x=-1.05;J.shL.rotation.z=0.55;J.shR.rotation.z=-0.55;J.elL.rotation.x=J.elR.rotation.x=-0.75;J.torso.rotation.x=0.1;J.hd.rotation.x=0.12;J.hd.rotation.z=0.28;J.hd.rotation.y=Math.sin(t*0.5)*0.04;},
  climb:Object.assign((J)=>{J.shL.rotation.x=J.shR.rotation.x=-2.5;J.elL.rotation.x=J.elR.rotation.x=-0.4;J.thL.rotation.x=J.thR.rotation.x=-1.3;J.knL.rotation.x=J.knR.rotation.x=1.9;J.torso.rotation.x=0.35;J.hd.rotation.x=-0.1;},{fast:1}),
  land:Object.assign((J)=>{J.thL.rotation.x=J.thR.rotation.x=-1.05;J.knL.rotation.x=J.knR.rotation.x=1.7;J.body.position.y=-0.38;J.torso.rotation.x=0.45;J.shL.rotation.x=J.shR.rotation.x=-0.7;J.elL.rotation.x=J.elR.rotation.x=-0.3;},{fast:1}),
  clip:(J,t)=>{J.shR.rotation.x=-1.45+Math.sin(t*6)*0.18;J.shR.rotation.z=-0.25;J.elR.rotation.x=-1.05+Math.sin(t*6)*0.12;J.shL.rotation.x=-1.25;J.shL.rotation.z=0.3;J.elL.rotation.x=-1.25;J.torso.rotation.x=0.18;J.hd.rotation.x=0.3;},
  tied:(J,t,sd)=>{J.thL.rotation.x=J.thR.rotation.x=-Math.PI/2;J.knL.rotation.x=J.knR.rotation.x=0.35;J.body.position.y=-0.86;J.shL.rotation.x=J.shR.rotation.x=0.75;J.shL.rotation.z=0.25;J.shR.rotation.z=-0.25;J.elL.rotation.x=J.elR.rotation.x=-0.5;J.hd.rotation.x=0.45+Math.sin(t*0.4+sd)*0.06;J.torso.rotation.x=0.18;},
  push:Object.assign((J,t)=>{const c=Math.max(0,Math.sin(t*4));J.shL.rotation.x=J.shR.rotation.x=-1.4;J.elL.rotation.x=J.elR.rotation.x=-0.9+c*0.8;J.torso.rotation.x=0.15+c*0.15;J.thL.rotation.x=-0.4;J.knL.rotation.x=0.4;},{fast:1}),
  cheer:(J,t)=>{const b=Math.abs(Math.sin(t*5));J.shL.rotation.z=-2.6;J.shR.rotation.z=2.6;J.elL.rotation.z=-0.3-b*0.3;J.elR.rotation.z=0.3+b*0.3;J.body.position.y=b*0.06;J.hd.rotation.x=-0.2;}
});

/* ---------- helpers ---------- */
const scWait=ms=>csWait(ms);
function skipBtn(on){try{csEl().querySelector('.cskip').hidden=!on;}catch(e){}}
/* a choice in the middle of a scene: the Skip button hides while you decide, so the choice can't be lost */
const scAsk=(d)=>new Promise(res=>{skipBtn(false);dialog(Object.assign({},d,{choices:d.choices.map((c,i)=>({t:c.t,fn:()=>{skipBtn(true);res(i);return c.after||null;}}))}));});
function scFadeOut(){return new Promise(r=>fadeThen(r));}
function scHit(){if(!AU.on||!AU.ctx)return;const t=AU.ctx.currentTime;try{noise(0.08,0.35,t,900,'lowpass');tone(70,0.09,'sine',0.25,t,null,45);}catch(e){}}
function scOutside(){/* step out of any building so the scene can play on campus */return new Promise(r=>{if(!S.inside)return r(false);const id=S.inside;fadeThen(()=>{const I=getInt(id);I.g.visible=false;I.labels.forEach(l=>l.el.style.display='none');outdoor.add(player);outdoor.visible=true;S.inside=null;cam.eff=null;
  const L=LOCS[id];P.x=L.door.x;P.z=L.door.z;P.path=null;P.mode='idle';player.visible=true;scene.fog.near=170;scene.fog.far=430;$('#leave').hidden=true;r(true);});});}
/* wait for actors to reach their spots; on a slow phone, anyone still walking is placed there so the scene keeps its pace */
async function scArrive(list,ms){try{await csUntil(()=>list.every(csArrived),ms);}catch(e){throw e;}list.forEach(a=>{if(a.path&&a.i<a.path.length){const p=a.path[a.path.length-1];a.x=p.x;a.z=p.z;a.path=null;}});}
function scStart(){if(ACT)stopAction(true);endDriving();P.path=null;P.mode='idle';csStart();CS.camInit=false;}
function scEnd(){skipBtn(true);CS.tick=null;csClear();csDropAll();csEnd();player.visible=true;if(player.parent!==outdoor&&!S.inside)outdoor.add(player);player.position.set(P.x,0,P.z);}
function lookOf(k){const p=PEOPLE[k];return (p&&p.look)?p.look:randomLook(false);}
const SC={busy:false};
/* the most open bit of ground near a point: few trees, bushes or walls, and off the road, so the camera can see the action */
function openSpot(cx,cz,R){let best=null,bs=1e9;for(let x=cx-R;x<=cx+R;x+=3)for(let z=cz-R;z<=cz+R;z+=3){const k=gIdx(NAV,x,z);if(isBlk(NAV,k))continue;if(!(Math.abs(x)<100&&z<100&&z>-100))continue;
    let sc=Math.hypot(x-cx,z-cz)*0.4;for(let dx=-6;dx<=6;dx+=1.5)for(let dz=-6;dz<=6;dz+=1.5){if(dx*dx+dz*dz>36)continue;if(isBlk(NAV,gIdx(NAV,x+dx,z+dz)))sc+=1;}
    for(const t of trees){const d=Math.hypot(t[0]-x,t[1]-z);if(d<10)sc+=(10-d)*1.5;}
    const rd=roadDist(x,z);if(rd<5)sc+=12;if(sc<bs){bs=sc;best={x,z};}}return best||freeNear(NAV,cx,cz,10);}
async function scRun(name,fn){if(SC.busy||CS.on)return false;SC.busy=name;try{await fn();}catch(e){if(e!==SKIP)console.error('scene '+name,e);}finally{try{scEnd();}catch(e){}SC.busy=false;}return true;}

/* ================= 1. CALL YOUR BOYS: the beating ================= */
callBoys=function(w){const ready=boysReady();if(ready.length<2)return toast('My Boys','Not enough loyal boys. You need at least 2 friends at 60+ (you have '+ready.length+').','bad');if(!spend(2000,'Food for the boys'))return toast('Not enough money','The boys need ₦2,000 for food and drinks first.','bad');
  if(UI.phone)closePhone();if(UI.sheet)closeSheet();if(ACT)stopAction(true);const crew=ready.slice(0,4);const names=crew.map(b=>fx(PEOPLE[b].name)).join(', ');w.settled=true;S.stats.fights=(S.stats.fights||0)+1;
  const caught=chance(clamp(0.25-S.skills.street*0.02,0.1,0.35));let choice=0;
  scRun('boys',async()=>{await scOutside();scStart();
    const spot=openSpot(-60,74,24);const st=freeNear(NAV,LOCS.boys.door.x,LOCS.boys.door.z+3,8);
    const me=csActor({g:player,x:st.x,z:st.z,keep:true,sp:5.2});player.visible=true;
    const boys=crew.map((b,i)=>csActor({look:lookOf(b),x:st.x+(i%2?1.3:-1.3),z:st.z+1+Math.floor(i/2)*1.2,sp:5.2}));
    let rlook=null;try{const n=NETX();if(w.player&&n&&n.others&&n.others.get(w.player))rlook=n.others.get(w.player).look;}catch(e){}
    const rv=csActor({look:rlook||randomLook(isF()&&false),x:spot.x,z:spot.z,sp:4});rv.pose='phone';rv.dir=0;
    csCaption('Your boys roll out',names+' are with you');
    [me,...boys].forEach((a,i)=>{const off=i===0?{x:0,z:-2.4}:{x:(i%2?1.6:-1.6),z:-1.2-Math.floor((i-1)/2)*1.1};csWalk(a,{x:spot.x+off.x,z:spot.z+off.z+(-2.2)},5.4);});
    csShot(()=>new THREE.Vector3(me.x+7,16,me.z+11),()=>new THREE.Vector3(me.x,1,me.z),1.4);await scArrive([me,...boys],14000);csCaption(null);
    [me,...boys].forEach(a=>{a.face=rv;});rv.face=me;rv.pose='stand';
    csTwoShot(me,rv,9,1);await scWait(500);
    await csSay(rv,'Wetin? Una dey find trouble?',2200);
    await csSay(me,'You '+fx(w.why||'took what is mine')+'. You think say I no go know?',2600);
    choice=await scAsk({who:crew[0],kicker:'Your boys are waiting',text:fx(w.name)+' is backed against the wall. Your boys look at you.',choices:[{t:'Teach him a lesson'},{t:'Calm down and report him instead'}]});
    if(choice===1){boys.forEach(a=>a.pose='cross');await csSay(crew.length?boys[0]:me,'Ehn. Na you sabi.',1800);return;}
    /* the fight */
    const ring=[[0,-1.1],[1.05,0.1],[-1.05,0.1],[0.2,1.1]];
    [me,...boys].forEach((a,i)=>{const r=ring[i%4];csWalk(a,{x:rv.x+r[0],z:rv.z+r[1]},5.5);});
    csShot(()=>new THREE.Vector3(rv.x+Math.sin(performance.now()/2600)*6.5,3.6,rv.z+Math.cos(performance.now()/2600)*6.5),()=>new THREE.Vector3(rv.x,1.0,rv.z),2.4);
    await scArrive([me,...boys],2500);
    [me,...boys].forEach((a,i)=>{a.face=rv;a.pose=i%3===2?'kick':'punch';});rv.pose='hurt';
    const hits=setInterval(()=>{if(!CS.on){clearInterval(hits);return;}scHit();},260);
    csCaption('Fight!','Behind the Boys Hostel');await scWait(3600);clearInterval(hits);csCaption(null);
    rv.pose='lie';rv.fixed=true;[me,...boys].forEach(a=>a.pose='angryidle');boys.forEach((a,i)=>{if(i===1)a.pose='laugh';});
    csShot(()=>new THREE.Vector3(rv.x+5,3.2,rv.z+4),()=>new THREE.Vector3(rv.x,0.4,rv.z),2);
    await csSay(boys[0]||me,'Next time, think twice before you touch our guy!',2600);
    if(caught){const T=csActor({look:guardLook(0x3a2416),x:spot.x+18,z:spot.z+6,sp:6.2});const T2=csActor({look:guardLook(0x4a2f1d),x:spot.x+19,z:spot.z+8,sp:6});
      csWalk(T,{x:spot.x+2.5,z:spot.z+1},6.4);csWalk(T2,{x:spot.x+3,z:spot.z+2.2},6.2);T.face=me;T2.face=me;
      csShot(()=>new THREE.Vector3(T.x+7,4,T.z+7),()=>new THREE.Vector3(T.x,1.4,T.z),2);await csSay(T,'HEY! WHO STARTED THIS?!',2000);await csUntil(()=>csArrived(T),3500);
      [me,...boys].forEach(a=>a.pose='shy');await scWait(900);}
  }).then(()=>{
    if(choice===1){if(chance(.5)){earn(Math.round((w.amt||0)*0.5/100)*100,'Refund via Mr. Paulinus');toast('Reported','Mr. Paulinus makes him refund half. Your boys think you\'re soft.');}else toast('Reported','Mr. Paulinus says there\'s no proof.');return;}
    crew.forEach(b=>rel(b,5));S.skills.street+=0.2;if(w.amt&&!w.player){const back=Math.round(w.amt*0.7/100)*100;earn(back,'Got some of your money back');}
    const n=NETX();if(w.player&&n)n.beat(w.player,w.why);
    if(caught)dialog({who:'tiger',kicker:'Gang fight',warn:'Fighting in the hostel goes to the panel.',text:'Officer Tiger arrives with security. "Who started this?"',choices:[
      {t:'Take Tiger\'s punishment with your boys',fn:()=>{tigerBeat('fight');addDiscipline(3,'Gang fight in the hostel');if(S.discipline>=8&&!S.over)setTimeout(()=>endLife('suspended','leading a gang fight'),300);return 'All of you get the koboko, and three points each.';}},
      {t:'Settle Tiger (₦8,000)',fn:()=>{if(!spend(8000,'Settled Officer Tiger (fight)')){addDiscipline(4,'Gang fight in the hostel');return 'No money. Four points.';}return '"Next time, I take all of you to the panel."';}}]});
    else toast('Done',w.player?'Your boys taught '+fx(w.name)+' a lesson. Word spreads: don\'t touch your things.':fx(w.name)+' won\'t touch your things again. He even returns some of the money.','good');});};

/* ================= 2. CAUGHT AFTER CURFEW: security drag you to the gate ================= */
function curfewNow(){const h=minOf(S.t)/60;return h>=22.5||h<5;}
HOOKS.minute.push(m=>{if(!S||S.over||S.inside||CS.on||SC.busy||busy()||W.drive||W.ride||S.captive)return;if(!curfewNow()||!onCampusP())return;if(ACT&&ACT.sleep)return;
  if(S.flags.nightCaught===dayOf(S.t-300))return;if(Math.hypot(P.x,P.z-97)<10)return;/* already at the gate */
  if(chance(0.03))curfewCatch();});
function curfewCatch(){S.flags.nightCaught=dayOf(S.t-300);
  scRun('curfew',async()=>{scStart();const me=csActor({g:player,x:P.x,z:P.z,keep:true,sp:3.4});player.visible=true;me.pose='stand';
    const a0=freeNear(NAV,P.x+14,P.z+10,8),a1=freeNear(NAV,P.x-12,P.z+12,8);
    const g1=csActor({look:guardLook(0x3a2416),x:a0.x,z:a0.z,sp:6}),g2=csActor({look:guardLook(0x4f321f),x:a1.x,z:a1.z,sp:6});
    const torch=new THREE.SpotLight(0xfff2c0,3,30,0.35,0.5,1);torch.position.set(0,1.6,0.3);g1.g.add(torch);const tt=new THREE.Object3D();tt.position.set(0,0,6);g1.g.add(tt);torch.target=tt;
    csShot(()=>new THREE.Vector3(me.x+7,4.5,me.z+7),()=>new THREE.Vector3(me.x,1.3,me.z),1.8);
    csCaption('⚠ '+fmtTime(S.t),'Campus security · night patrol');
    csWalk(g1,{x:me.x+0.75,z:me.z+0.2},6.2);csWalk(g2,{x:me.x-0.75,z:me.z+0.2},6.2);g1.face=me;g2.face=me;me.face=g1;
    await csSay(g1,'YOU THERE! Stop! What are you doing outside by this time?',2400);
    await scArrive([g1,g2],6000);csCaption(null);
    me.pose='heldstill';g1.pose='grabRs';g2.pose='grabLs';await csSay(me,'Sir, I was just going back to the hostel…',2000);
    await csSay(g2,'Story for the gate. Oya move!',1800);
    /* they march you to the Main Gate, one on each arm */
    const gate={x:-1.6,z:96.2};const route=navPath(me,gate)||[gate];me.path=route.map(p=>({x:p.x,z:p.z}));me.i=0;me.sp=3.4;me.walkPose='held';
    g1.walkPose='grabL';g2.walkPose='grabR';g1.path=null;g2.path=null;g1.face=null;g2.face=null;
    CS.tick=dt=>{const r=me.dir;const sx=Math.cos(r),sz=-Math.sin(r);[[g1,0.72],[g2,-0.72]].forEach(([g,o])=>{const tx=me.x+sx*o,tz=me.z+sz*o;const d=Math.hypot(tx-g.x,tz-g.z);g.x=tx;g.z=tz;g.dir=me.dir;g.v=d/Math.max(dt,0.001);
      g.walk=me.walk;g.path=null;});};
    /* the walk is long: show it in a few shots, speeding the boring part */
    csFollow(me,10,5);W.csSpeed=2.2;await csUntil(()=>csArrived(me),45000);W.csSpeed=1;CS.tick=null;
    me.walkPose=null;g1.walkPose=null;g2.walkPose=null;me.pose='heldstill';g1.pose='grabRs';g2.pose='grabLs';
    csShot([6,4,90],[0,1.4,96],1.6);csCaption('Main Gate','Security post');await scWait(1600);csCaption(null);
    P.x=0.5;P.z=95.4;P.path=null;P.mode='idle';
  }).then(ok=>{if(!ok)return;W.side=0;dialog({who:'security',kicker:'Main Gate · after curfew',warn:'Being outside after the hostel locks goes on your record.',text:'The officer drops your arm at the security post and opens a big notebook. "Name. Room. And tell me what you were doing outside at '+fmtTime(S.t)+'."',choices:[
    {t:'Sleep at the security post till morning',fn:()=>{const d0=dayOf(S.t);S.t=Math.floor(S.t/1440)*1440+(minOf(S.t)>=12*60?1440:0)+6*60;if(dayOf(S.t)!==d0)newDay();N('energy',30);N('hygiene',-20);N('health',-6);addMoodlet('Slept at the gate',-12,720);addDiscipline(1,'Caught outside after curfew');return 'Plastic chair, mosquitoes, the officer snoring. At 6 AM they let you go. One point on your record.';}},
    {t:'Beg him to write nothing (₦3,000)',fn:()=>{if(!spend(3000,'Security at the gate (curfew)')){addDiscipline(1,'Caught outside after curfew');return '"No money? Then your name stays in the book."';}if(bribeOk(0.7)){S.flags.lockPass=S.t+30;return '"Go straight to your hostel. If I see you again tonight…" He walks you to the hostel gate.';}addDiscipline(2,'Caught outside after curfew and tried to bribe security');return 'Another officer walks in and sees the money. Two points.';}},
    {t:'Call Officer Tiger to vouch for you (₦5,000)',fn:()=>{if(!spend(5000,'Officer Tiger (curfew)'))return 'Tiger doesn\'t pick up for broke people.';S.flags.lockPass=S.t+30;return 'Tiger arrives yawning. Two words to the officer and you are free. "Inside. Now."';}}]});});}

/* ================= 3. KIDNAPPED ON THE ROAD: grabbed, pushed into a car, taken to a house ================= */
let HIDE=null;
function hideout(){if(HIDE)return HIDE;const g=new THREE.Group();g.position.set(-330,0,260);
  const wall=new THREE.MeshLambertMaterial({color:0x9a8c74}),blk=new THREE.MeshLambertMaterial({color:0x7d725f}),floor=new THREE.MeshLambertMaterial({color:0x4b4237});
  /* an unfinished block house: bare walls, no paint, a zinc roof, one doorway */
  const P2=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(G.box,m);b.scale.set(w,h,d);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;g.add(b);return b;};
  P2(12,0.2,10,0,0.1,0,floor);P2(12,3.2,0.3,0,1.6,-5,wall);P2(0.3,3.2,10,-6,1.6,0,wall);P2(0.3,3.2,10,6,1.6,0,wall);P2(4.5,3.2,0.3,-3.75,1.6,5,wall);P2(4.5,3.2,0.3,3.75,1.6,5,wall);P2(3,0.8,0.3,0,2.8,5,wall);
  for(let i=0;i<5;i++)P2(0.4,0.2,0.4,-4+i*2,3.3,-5,blk);
  const roof=P2(13,0.08,11,0,3.45,0,new THREE.MeshLambertMaterial({color:0x6e6a62}));roof.rotation.x=0.05;
  P2(2.2,0.18,1.2,-3.6,0.28,-3.2,new THREE.MeshLambertMaterial({color:0x5a4a6a}));/* old mattress */
  P2(0.6,0.5,0.6,3.6,0.35,-3.6,new THREE.MeshLambertMaterial({color:0x3a6b3a}));/* jerry can */
  const bulb=new THREE.PointLight(0xffc070,1.6,14,2);bulb.position.set(0,2.9,-0.5);g.add(bulb);const bm=new THREE.Mesh(G.sphLo||G.sph,new THREE.MeshBasicMaterial({color:0xffe0a0}));bm.scale.setScalar(0.12);bm.position.copy(bulb.position);g.add(bm);
  /* bush around */
  const bush=new THREE.MeshLambertMaterial({color:0x34522a});for(let i=0;i<26;i++){const a=i/26*Math.PI*2,r=rnd(11,20);const b=new THREE.Mesh(G.sphLo||G.sph,bush);b.scale.set(rnd(1.5,3),rnd(1.2,2.6),rnd(1.5,3));b.position.set(Math.cos(a)*r,0.8,Math.sin(a)*r);g.add(b);}
  outdoor.add(g);g.visible=false;HIDE=g;return g;}
{const _k=kidnap;kidnap=function(){if(CS.on||SC.busy)return _k.apply(this,arguments);const args=arguments,self=this;
  scRun('kidnap',async()=>{endDriving();scStart();setCarLights(true);
    const me=csActor({g:player,x:P.x,z:P.z,keep:true,sp:3.6});player.visible=true;me.pose='phone';
    /* a car with no plate pulls up */
    const car=buildVehicle('sedan',0x151515,{plate:' '});const dir0=Math.atan2(1,0);const sx=me.x-26,sz=me.z+2.4;car.g.position.set(sx,0,sz);car.g.rotation.y=Math.PI/2;
    const V={x:sx,z:sz};let mode='in';
    CS.tick=dt=>{if(mode==='in'){const tx=me.x-1.2,dx=tx-V.x;const sp=Math.min(14,Math.max(2,Math.abs(dx)*1.6));const st=Math.sign(dx)*Math.min(Math.abs(dx),sp*dt);V.x+=st;car.g.position.set(V.x,0,V.z);vehAnim(car,Math.abs(st),0,dt);if(Math.abs(dx)<0.05)mode='stop';}
      else if(mode==='go'){V.x+=dt*16;car.g.position.set(V.x,0,V.z);vehAnim(car,dt*16,0,dt);}};
    csShot(()=>new THREE.Vector3(me.x+6,3.2,me.z-7),()=>new THREE.Vector3(me.x-3,1.2,me.z+1),1.6);csCaption('Bwari road · '+fmtTime(S.t),'A car with no number plate slows down');
    sfx('horn');await csUntil(()=>mode==='stop',9000);csCaption(null);
    me.face={x:V.x,z:V.z};me.pose='look';
    const k1=csActor({look:BANDIT_LOOK(0x2e1c12),x:V.x-0.5,z:V.z+1.4,sp:6.5}),k2=csActor({look:BANDIT_LOOK(0x3a2416),x:V.x+1.4,z:V.z+1.4,sp:6.5});
    csWalk(k1,{x:me.x-0.7,z:me.z+0.3},6.5);csWalk(k2,{x:me.x+0.7,z:me.z+0.3},6.5);k1.face=me;k2.face=me;sfx('door');
    await csSay(k1,'Enter motor! NOW!',1500);await scArrive([k1,k2],3000);
    me.pose='heldstill';k1.pose='grabRs';k2.pose='push';csShot(()=>new THREE.Vector3(me.x+3.5,2.2,me.z-4),()=>new THREE.Vector3(me.x,1.3,me.z),2.5);
    await csSay(me,'Help! HELP!',1300);await scWait(500);
    /* pushed into the back seat */
    const door={x:V.x+0.2,z:V.z+1.1};csWalk(me,door,3.2);csWalk(k1,{x:door.x-0.8,z:door.z+0.4},3.2);csWalk(k2,{x:door.x+0.8,z:door.z+0.4},3.2);me.walkPose='held';
    await scArrive([me,k1,k2],3500);me.walkPose=null;sfx('door');await scWait(300);
    me.g.visible=false;k1.g.visible=false;k2.g.visible=false;mode='go';sfx('horn');
    csShot(()=>new THREE.Vector3(V.x-10,4,V.z+8),()=>new THREE.Vector3(V.x,1,V.z),1.4);csCaption('Taken','Blindfolded in the back seat');await scWait(2600);
    /* the house */
    await scFadeOut();CS.tick=null;if(car.g.parent)car.g.parent.remove(car.g);csClear();const H=hideout();H.visible=true;
    const hx=H.position.x,hz=H.position.z;
    const me2=csActor({g:player,x:hx-1.8,z:hz-1.2,keep:true});player.visible=true;me2.pose='tied';me2.fixed=true;me2.dir=0.4;
    const c1=csActor({look:BANDIT_LOOK(0x2e1c12),x:hx+1.6,z:hz+0.6});c1.pose='cross';c1.dir=-2.2;c1.fixed=true;
    const c2=csActor({look:BANDIT_LOOK(0x3a2416),x:hx+0.4,z:hz+2.6});c2.pose='phone';c2.dir=Math.PI;c2.fixed=true;
    W.hideCast=[c1,c2];
    csShot([hx+3.5,2.6,hz+3.6],[hx-1.2,0.6,hz-1],1.2);CS.camInit=false;csCaption('An unfinished house','Somewhere in the bush outside Bwari');
    await scWait(2600);csCaption(null);c2.pose='talk';await csSay(c2,'Oya call your people. Tell them how much we want.',2600);
    /* the ransom choice happens here, in the house; the scene stays until you are released or escape */
    skipBtn(false);W.kidnapHouse=true;W.kidCalled=true;_k.apply(self,args);c2.pose='phone';
    await new Promise(r=>{W.kidRes=r;setTimeout(r,180000);});
  }).then(()=>{if(!W.kidCalled)_k.apply(self,args);W.kidCalled=false;});};}
{const _a=afterKidnap;afterKidnap=function(paid){const r=_a.apply(this,arguments);if(HIDE)HIDE.visible=false;W.kidnapHouse=false;if(W.kidRes){const f=W.kidRes;W.kidRes=null;f();}return r;};}

{const _d=dialog;dialog=function(d){if(d&&W.kidnapHouse&&d.kicker==='Kidnapped'&&typeof d.text==='string'){const m=d.text.match(/₦[\d,]+/);d=Object.assign({},d,{kicker:'Held in a house in the bush',text:'They tie your hands and sit you on the bare floor. One of them holds your phone up to your face. "Your people will pay '+(m?m[0]:'the money')+', or you will not see your school again."'});}return _d.call(this,d);};}
/* ================= 4. PAULINUS AND YOUR HIGH HAIR ================= */
HOOKS.minute.push(m=>{if(!S||S.over||S.inside||CS.on||SC.busy||busy()||W.drive||W.ride||S.captive||isF())return;if(S.hair<=6.3||S.flags.hairScene===dayOf(S.t))return;
  const h=minOf(S.t)/60;if(h<8||h>=19.5||!onCampusP())return;if(Math.hypot(P.x-LOCS.boys.x,P.z-LOCS.boys.z)>45&&!chance(0.3))return;if(chance(0.025))paulinusHair();});
const PLOOK=()=>Object.assign({},PEOPLE.paulinus.look,{top:'long',shirt:0xe8e2d0,pants:0x2f3540,fila:null});
function paulinusHair(){S.flags.hairScene=dayOf(S.t);const pn=fx(PEOPLE.paulinus.name);let paid=false;
  scRun('hair',async()=>{scStart();const me=csActor({g:player,x:P.x,z:P.z,keep:true,sp:3.8});player.visible=true;
    const a0=freeNear(NAV,P.x+9,P.z+6,8);const pl=csActor({look:PLOOK(),x:a0.x,z:a0.z,sp:4.6});
    csShot(()=>new THREE.Vector3((me.x+pl.x)/2+6,7,(me.z+pl.z)/2+6),()=>new THREE.Vector3((me.x+pl.x)/2,1.1,(me.z+pl.z)/2),1.6);
    await csSay(pl,S.name+'! Come here. COME HERE!',1800);csWalk(pl,{x:me.x+0.8,z:me.z+0.3},4.8);pl.face=me;me.face=pl;
    await scArrive([pl],5000);pl.pose='point';await csSay(pl,'Look at this hair. Is this a hostel or a music video?',2600);
    me.pose='shy';await csSay(me,'Sir, I was going to cut it tomorrow…',1800);
    pl.pose='grabRs';me.pose='heldstill';await csSay(pl,'Tomorrow is not a barber. We are going NOW.',2000);
    /* he marches you to the barber shop by the arm */
    const shop=LOCS.barber.door;const route=navPath(me,shop)||[shop];me.path=route;me.i=0;me.sp=3.8;me.walkPose='held';pl.walkPose='grabL';
    CS.tick=dt=>{const r=me.dir;const tx=me.x+Math.cos(r)*0.72,tz=me.z-Math.sin(r)*0.72;const d=Math.hypot(tx-pl.x,tz-pl.z);pl.x=tx;pl.z=tz;pl.dir=me.dir;pl.v=d/Math.max(dt,0.001);pl.walk=me.walk;pl.path=null;};
    csFollow(me,10,5);csCaption('To the barber','Mr. Paulinus is not letting go');W.csSpeed=2.2;await csUntil(()=>csArrived(me),40000);W.csSpeed=1;CS.tick=null;csCaption(null);
    /* inside the shop: the chair, the clippers, Paulinus watching */
    await scFadeOut();csClear();const I=getInt('barber');outdoor.visible=false;I.g.visible=true;I.labels.forEach(l=>l.el.style.display='');S.inside='barber';scene.fog.near=60;scene.fog.far=140;
    const g=intNav(I);const me2=csActor({g:player,parent:I.g,x:-1.5,z:-2.4,keep:true,grid:g});I.g.add(player);player.visible=true;me2.pose='sit';me2.fixed=true;me2.y=0.25;me2.dir=0;
    if(I.barb)I.barb.g.visible=false;
    const bb=csActor({look:{skin:0x3a2416,shirt:0xf2f2f2,pants:0x222222,hairStyle:'bald',hair:0,build:1.1},parent:I.g,x:-2.3,z:-2.55,grid:g});bb.pose='clip';bb.dir=Math.PI/2;bb.fixed=true;
    const pl2=csActor({look:PLOOK(),parent:I.g,x:0.4,z:-1.2,grid:g});pl2.pose='cross';pl2.dir=-2.0;pl2.fixed=true;
    csShot([2.4,2.5,2.4],[-1.0,1.2,-2.0],2);CS.camInit=false;
    const buzz=setInterval(()=>{if(!CS.on){clearInterval(buzz);return;}if(AU.on&&AU.ctx){try{tone(118,0.25,'sawtooth',0.03,AU.ctx.currentTime,null,122);}catch(e){}}},280);
    csCaption('Barber Shop','"Low cut. Very low. I am watching."');await csSay(pl2,'Low cut. Very low. I am watching.',2200);await scWait(2400);
    S.hair=1.4;try{setHair(player,1.4);}catch(e){}
    clearInterval(buzz);csCaption(null);await csSay(bb,'Finish. Clean like new.',1600);await csSay(pl2,'Good. This one is going on your record as a warning.',2200);
    await scFadeOut();csClear();if(I.barb)I.barb.g.visible=true;I.g.visible=false;I.labels.forEach(l=>l.el.style.display='none');outdoor.visible=true;outdoor.add(player);S.inside=null;scene.fog.near=170;scene.fog.far=430;
    const L=LOCS.barber;P.x=L.door.x;P.z=L.door.z;P.dir=Math.atan2(L.door.x-L.x,L.door.z-L.z);P.path=null;P.mode='idle';S.at='barber';cam.yaw=P.dir+0.45;cam.eff=null;
  }).then(()=>{S.hair=1.4;try{if(['locs','cornrows','twists','afro','highfade'].includes(S.look.hairStyle)){S.look.hairStyle='low';buildPlayer(S.look);}setHair(player,S.hair);}catch(e){}
    paid=spend(ECON.haircut||500,'Haircut (Mr. Paulinus made you)');if(!paid){S.flags.owePaulinus=(S.flags.owePaulinus||0)+(ECON.haircut||500);}
    S.suspicion+=4;S.plog=S.plog||[];S.plog.push('Marched to the barber for high hair');addMoodlet('Fresh (forced) haircut',-4,720);setMood('Embarrassed',240);
    toast('Fresh cut',paid?pn+' watched every stroke. '+naira(ECON.haircut||500)+' from your pocket.':'You had no money, so '+pn+' paid. You owe him.','bad');});}

/* ================= 5. JUMPING THE BACK FENCE ================= */
/* the gap is repaired: a whole wall piece where the broken bit was, and the rubble is gone */
{const piece=new THREE.Mesh(G.box,new THREE.MeshLambertMaterial({color:0xcfc3a8}));piece.scale.set(2.4,2.4,1);piece.position.set(-85,1.2,106);piece.castShadow=piece.receiveShadow=true;outdoor.add(piece);
  /* footholds on both sides: a couple of blocks students use to climb */
  [[-84.2,104.9],[-85.6,107.2]].forEach(([x,z])=>{const b=new THREE.Mesh(G.box,new THREE.MeshLambertMaterial({color:0x8d8573}));b.scale.set(0.8,0.45,0.6);b.position.set(x,0.22,z);outdoor.add(b);});
  try{pickables.forEach(p=>{if(p.userData&&p.userData.loc==='fence'){p.children.slice().forEach(c=>{if(c.isMesh&&c.geometry===G.box&&c.material&&c.material.color&&c.material.color.getHex()===0xbdb196)c.visible=false;});}});}catch(e){}
  LOCS.fence.name='Back Fence';LOCS.fence.sub='Behind the Boys Hostel · students jump it here';}
sneak=function(dir){if(W.ride||W.drive)return;if(S.inside){exitBuilding(()=>sneak(dir));return;}
  const near=dir?{x:-85,z:104.3}:{x:-85,z:107.7},far=dir?{x:-85,z:108.4}:{x:-85,z:103.4};
  const go=()=>scRun('fence',async()=>{scStart();const me=csActor({g:player,x:P.x,z:P.z,keep:true,sp:5.6});player.visible=true;me.face={x:-85,z:far.z};
    csShot([-75.5,3.4,106+(dir?-2.5:2.5)],[-85,1.3,106],2);CS.camInit=false;
    await scWait(500);me.pose='look';await scWait(700);
    /* run-up, then over the top */
    const z0=me.z,z1=far.z;let t=0;me.fixed=true;me.pose='climb';
    CS.tick=dt=>{t+=dt;const k=Math.min(1,t/0.95);me.z=z0+(z1-z0)*k;me.x=-85;me.y=Math.sin(k*Math.PI)*2.0;me.dir=dir?0:Math.PI;if(k>0.62)me.pose='land';};
    sfx('step');await csUntil(()=>t>=0.95,3000);me.y=0;me.pose='land';CS.tick=null;sfx('step');await scWait(450);me.pose='stand';me.fixed=false;await scWait(300);
    P.x=far.x;P.z=far.z;P.path=null;P.mode='idle';});
  if(Math.hypot(P.x-near.x,P.z-near.z)<2.5){go().then(()=>escapeRoll(dir));return;}
  const pth=navPath(P,near);if(!pth)return toast('Can\'t reach the fence','Walk to the Back Fence behind the Boys Hostel first.');
  P.path=pth;P.i=0;P.mode='walk';P.run=true;S.at=null;W.after=()=>{go().then(()=>escapeRoll(dir));};toast(dir?'Jumping the fence':'Jumping back in','Head down. Move fast.');};
/* everyone who crosses the wall line (bandits in a raid, you) hops over it instead of walking through */
HOOKS.frame.push(()=>{if(!CS.on)return;for(const a of CS.actors){if(a.fixed||!a.g.parent||a.g.parent!==outdoor)continue;if(Math.abs(a.x+85)<3&&a.z>104.6&&a.z<107.4){const k=(a.z-104.6)/2.8;a.g.position.y=Math.sin(k*Math.PI)*1.9;}}});

/* ================= 6. HOLDING HANDS AND A KISS ================= */
function coupleScene(name,id){if(!mature())return;const lk=(()=>{try{const n=NETX();if(id&&n&&n.others&&n.others.get(+id))return n.others.get(+id).look;}catch(e){}if(id&&PEOPLE[id]&&PEOPLE[id].look)return PEOPLE[id].look;const L=S.love||{};const want=L.pref==='same'?isF():L.pref==='any'?chance(.5):!isF();return randomLook(want);})();
  const wait=()=>{if(UI.dlg||busy()||CS.on||SC.busy)return setTimeout(wait,600);run();};
  const run=()=>scRun('couple',async()=>{const wasIn=S.inside;await scOutside();scStart();
    const spot=freeNear(NAV,P.x+2,P.z+2,10);const me=csActor({g:player,x:spot.x,z:spot.z,keep:true,sp:2.6});player.visible=true;
    const pt=csActor({look:lk,x:spot.x+0.62,z:spot.z,sp:2.6});
    /* a slow walk, hand in hand */
    const dirv=freeNear(NAV,spot.x,spot.z-14,10);const path=navPath(me,dirv)||[dirv];me.path=path;me.i=0;me.walkPose='handR';pt.walkPose='handL';
    CS.tick=dt=>{const r=me.dir;const tx=me.x+Math.cos(r)*0.62,tz=me.z-Math.sin(r)*0.62;const d=Math.hypot(tx-pt.x,tz-pt.z);pt.x=tx;pt.z=tz;pt.dir=me.dir;pt.v=d/Math.max(dt,0.001);pt.walk=me.walk+Math.PI;pt.path=null;};
    const hd=Math.atan2(dirv.x-spot.x,dirv.z-spot.z);me.dir=hd;pt.dir=hd;pt.x=me.x+Math.cos(hd)*0.62;pt.z=me.z-Math.sin(hd)*0.62;
    csShot(()=>{const fx2=Math.sin(hd),fz2=Math.cos(hd),mx2=(me.x+pt.x)/2,mz2=(me.z+pt.z)/2;return new THREE.Vector3(mx2+fx2*7.5+fz2*3,3.2,mz2+fz2*7.5-fx2*3);},()=>new THREE.Vector3((me.x+pt.x)/2,1.1,(me.z+pt.z)/2),1.6);
    csCaption('♥ '+fx(name),'Officially together');await csUntil(()=>csArrived(me),9000);CS.tick=null;csCaption(null);
    me.walkPose=pt.walkPose=null;me.pose='handRs';pt.pose='handLs';await scWait(700);
    /* face each other */
    me.face=pt;pt.face=me;await scWait(900);
    CS.camInit=false;csTwoShot(me,pt,4.2,1);await csSay(pt,pick(['I really like you, you know.','Took you long enough 🙈','So… we\'re doing this?']),2200);
    await csSay(me,pick(['I like you too. A lot.','Best decision I\'ve made all semester.','We\'re doing this.']),2000);
    /* step in close for the kiss */
    const mx=(me.x+pt.x)/2,mz=(me.z+pt.z)/2;const ang=Math.atan2(pt.x-me.x,pt.z-me.z);me.x=mx-Math.sin(ang)*0.31;me.z=mz-Math.cos(ang)*0.31;pt.x=mx+Math.sin(ang)*0.31;pt.z=mz+Math.cos(ang)*0.31;me.dir=ang;pt.dir=ang+Math.PI;me.face=null;pt.face=null;
    me.pose='kiss';pt.pose='kiss';me.fixed=pt.fixed=true;CS.camInit=false;csShot([mx+Math.cos(ang)*5.2,2.3,mz-Math.sin(ang)*5.2],[mx,1.45,mz],2.5);
    const hearts=[];for(let i=0;i<7;i++){const e=el('div','vl-heart','♥');e.style.left=(40+Math.random()*20)+'%';e.style.animationDelay=(i*0.25)+'s';$('#app').append(e);hearts.push(e);}
    sfx('fanfare');await scWait(2600);hearts.forEach(e=>e.remove());me.fixed=pt.fixed=false;me.pose='handRs';pt.pose='laugh';await scWait(900);});
  wait();}
{const st=document.createElement('style');st.textContent='.vl-heart{position:absolute;bottom:38%;z-index:30;font-size:30px;color:#ff5c8a;text-shadow:0 2px 8px rgba(0,0,0,.4);pointer-events:none;animation:vlHeart 2.2s ease-out forwards}@keyframes vlHeart{0%{transform:translateY(0) scale(.6);opacity:0}15%{opacity:1}100%{transform:translateY(-220px) scale(1.25);opacity:0}}';document.head.appendChild(st);}
{const _o=askOfficial;askOfficial=function(id){const L=loveSt();const before=L.stage==='dating'&&L.with===id;const r=_o.apply(this,arguments);if(!before&&L.stage==='dating'&&L.with===id)setTimeout(()=>coupleScene(PEOPLE[id].name,id),300);return r;};}

/* expose to the online side and to tests */
setTimeout(()=>{try{const n=window.VLNet;if(n&&n.VL)Object.assign(n.VL,{coupleScene,concertSet:window.__concertSet||n.VL.concertSet});}catch(e){}},0);
if(window.__QA)window.__SC={curfewCatch,paulinusHair,coupleScene,SC,sneak:d=>sneak(d),callBoys:w=>callBoys(w),kidnap:()=>kidnap(),hideout};
