/* ================= DRIVE OR STEAL A CAR =================
   Parked cars around campus and Bwari Junction. Tap one: you can hotwire it (18+ accounts) and drive it
   with the normal driving controls. It is a crime: an alarm can go off, security can catch you, and while
   you drive a stolen car the police can trace it. Sell it at Junction Autos' back yard, or ditch it. */
/* the Car Park's free bay only: the other bays already have cars in them */
const PARK_SPOTS=[[11.12,-19,Math.PI],[17,101.8,0],[33,101.8,0],[-50,124,Math.PI/2],[42,128,-Math.PI/2]];
const PCOL=[[0xe8e2d0,'white'],[0x1f2d44,'navy'],[0x9a9a9a,'silver'],[0x7a2331,'wine'],[0x2b2b2b,'black'],[0x2f6b3e,'green'],[0xc9971c,'gold']];
const PK=[];
function parkSpawn(i){const [x,z,dir]=PARK_SPOTS[i];if(S&&S.car&&Math.hypot(S.car.x-x,S.car.z-z)<3)return;const [col,cn]=PCOL[(i*3+dayOf(S?S.t:0))%PCOL.length];const kind=i%3===2?'suv':'sedan';
  const g=makeCar(col,kind);g.position.set(x,0,z);g.rotation.y=dir;g.userData.stealCar=i;outdoor.add(g);
  raster(NAV,{c:0,x,z,w:3.0,d:6.0,a:dir},0.3,NAV.dyn,1);PK[i]={g,x,z,dir,col,cn,kind};}
function parkClear(i){const p=PK[i];if(!p)return;if(p.g.parent)p.g.parent.remove(p.g);raster(NAV,{c:0,x:p.x,z:p.z,w:3.0,d:6.0,a:p.dir},0.3,NAV.dyn,0);PK[i]=null;}
function parkAll(){PARK_SPOTS.forEach((_,i)=>{parkClear(i);parkSpawn(i);});}
HOOKS.boot.push(()=>{parkAll();ownCarShow();});HOOKS.day.push(()=>{if(!W.drive)parkAll();});

/* your own car stays parked where you left it while you drive a stolen one */
let ownG=null;function ownCarShow(){if(ownG){outdoor.remove(ownG);ownG=null;}const o=S&&S.ownCar;if(!o)return;ownG=makeCar(o.col,o.model==='jeep'?'suv':'sedan');ownG.position.set(o.x,0,o.z);ownG.rotation.y=o.dir;}
function restoreOwn(){if(S.car)carDyn(false);S.car=S.ownCar||null;S.ownCar=null;ownCarShow();buildMyCar();if(S.car)carDyn(true);save();}

/* tap a parked car */
{const _t=onTap;onTap=function(cx,cy){try{if(S&&!S.inside&&!busy()&&!W.drive&&!W.concert){const r=cv.getBoundingClientRect();mv.x=(cx-r.left)/r.width*2-1;mv.y=-(cy-r.top)/r.height*2+1;ray.setFromCamera(mv,camera);
  const gs=PK.filter(Boolean).map(p=>p.g);const hit=ray.intersectObjects(gs,true)[0];if(hit&&hit.distance<70){let o=hit.object;while(o&&o.userData.stealCar==null)o=o.parent;if(o){carSheet(o.userData.stealCar);return;}}}}catch(e){}return _t.apply(this,arguments);};}
function carSheet(i){const p=PK[i];if(!p)return;const wrap=el('div');wrap.style.display='grid';wrap.style.gap='8px';const near=Math.hypot(P.x-p.x,P.z-p.z)<7;
  wrap.append(el('div','note','A '+p.cn+' '+(p.kind==='suv'?'SUV':'saloon')+'. Nobody around'+(minOf(S.t)>=20*60||minOf(S.t)<6*60?' this late.':'… for now.')));
  const opt=(t,s,fn,dis)=>{const b=el('button','opt','<div class="l"><b>'+t+'</b><span>'+(dis||s)+'</span></div>');if(dis)b.disabled=true;b.onclick=()=>{closeSheet();fn();};wrap.append(b);};
  opt('Steal this car','Hotwire it and drive off · an alarm or security means big trouble',()=>stealCar(i),!mature()?'Not available on this account':S.car&&S.car.stolen?'You are already driving a stolen car':null);
  opt('Look through the window','Harmless',()=>toast('Parked car',pick(['A rosary on the mirror and a Bible on the dashboard.','Three empty Fanta bottles and a lecture timetable.','A "Baby on board" sticker. On a campus car.'])));
  if(!S.car)wrap.append(el('div','note','Want a car of your own? Junction Autos, out of the Main Gate, sells tokunbo cars for cash or hire purchase.'));
  openSheet('Parked car',near?'Right here':'Walk over first',wrap);}
function stealCar(i){const p=PK[i];if(!p)return;const door={x:p.x-Math.cos(p.dir)*2.2,z:p.z+Math.sin(p.dir)*2.2};
  const go=()=>scRun('steal',async()=>{scStart();const me=csActor({g:player,x:P.x,z:P.z,keep:true,sp:3});player.visible=true;me.face={x:p.x,z:p.z};me.pose='look';
    csShot([door.x+Math.sin(p.dir)*5+3,2.8,door.z+Math.cos(p.dir)*5],[p.x,1,p.z],1.8);CS.camInit=false;csCaption('Hotwiring','Look around… nobody?');await scWait(1200);
    me.pose='kneel';await scWait(1800);csCaption(null);
    const alarm=chance(0.3);let caught=false;
    if(alarm){csCaption('🚨 ALARM','The car screams. Lights flash.');const V=p.g.userData.V;const t0=performance.now();const blink=setInterval(()=>{if(!CS.on){clearInterval(blink);return;}sfx('horn');},420);
      await scWait(1800);clearInterval(blink);csCaption(null);const guardNear=guards.some(g=>!g.hidden&&Math.hypot(g.x-p.x,g.z-p.z)<45);caught=chance(guardNear?0.75:0.4)&&onCampus(p.x,p.z)||chance(0.25);}
    W.stealOut=caught?'caught':'ok';me.pose='stand';});
  const finish=()=>{if(W.stealOut==='caught'){W.stealOut=null;return stealCaught(false);}W.stealOut=null;
    /* it's yours… for now */
    if(S.car&&!S.car.stolen){S.ownCar=S.car;S.car=null;}parkClear(i);
    S.car={model:p.kind==='suv'?'jeep':'saloon',n:'Stolen '+p.cn+' '+(p.kind==='suv'?'SUV':'saloon'),col:p.col,fuel:rnd(5,18),cond:rnd(55,90),x:p.x,z:p.z,dir:p.dir,sticker:false,km:0,stolen:true,stolenAt:S.t};
    ownCarShow();buildMyCar();S.flags.carThefts=(S.flags.carThefts||0)+1;addMoodlet('Adrenaline',6,180);P.x=door.x;P.z=door.z;enterCar();
    toast('You\'re in','The engine coughs and starts. Drive. Sell it at Junction Autos\' back yard, or ditch it before the police trace it.','bad');};
  if(Math.hypot(P.x-door.x,P.z-door.z)<2.5)go().then(finish);else{const pth=navPath(P,door);if(!pth)return toast('Can\'t reach it','Walk closer to the car first.');P.path=pth;P.i=0;P.mode='walk';S.at=null;W.after=()=>go().then(finish);}}
function stealCaught(driving){const fine=driving?60000:30000;
  dialog({who:'security',kicker:driving?'Stopped in a stolen car':'Caught stealing a car',warn:'Car theft goes straight to the disciplinary panel, or to the police.',text:driving?'Flashing lights behind you. The police wave you to the side. "This car was reported stolen. Come down. Hands where I can see them."':'A security officer grabs your collar before you can stand up. "Thief! You want to steal oga\'s car?"',choices:[
    {t:'Beg and pay ('+naira(fine)+')',fn:()=>{if(!spend(fine,'Settled the car theft'))return caughtFinal(driving,'You don\'t have the money. They take you in.');if(bribeOk(0.55)){if(driving)dropStolen();S.suspicion+=15;return 'They take the money, take the car back to its owner and let you go with a warning you won\'t forget.';}return caughtFinal(driving,'Another officer sees the money change hands. Now it\'s bribery too.');}},
    {t:'Accept it',fn:()=>caughtFinal(driving,'They take you in.')}]});}
function caughtFinal(driving,why){if(driving)dropStolen();addDiscipline(6,'Car theft');tigerBeat('theft');S.suspicion+=25;setMood('Sad',720);
  if(S.discipline>=8&&!S.over)setTimeout(()=>endLife('suspended','car theft'),400);return why+' Six points on your record and a night at the station.';}
function dropStolen(){if(!S.car||!S.car.stolen)return;if(W.drive){W.drive=null;$('#drive').hidden=true;$('#nav').hidden=false;player.visible=true;const fp=freeNear(NAV,S.car.x,S.car.z,8);P.x=fp.x;P.z=fp.z;}carDyn(false);if(myCarG){outdoor.remove(myCarG);myCarG=null;}S.car=null;restoreOwn();}
/* the police can trace a stolen car while you drive it */
HOOKS.minute.push(()=>{const c=S&&S.car;if(!c||!c.stolen||S.over||busy()||CS.on)return;const mins=S.t-(c.stolenAt||S.t);
  if(W.drive){let p=0.006+Math.min(0.02,mins/6000);if(onCampus(c.x,c.z)&&guards.some(g=>!g.hidden&&Math.hypot(g.x-c.x,g.z-c.z)<25))p+=0.05;if(chance(p)){W.drive.v=0;stealCaught(true);}}
  else if(mins>1440*2&&chance(0.01)){toast('Stolen car found','The police found the stolen car where you left it and towed it away. Nobody saw you… this time.','bad');dropStolen();}});
/* extra choices in the car menu for a stolen car */
{const _oc=openCar;openCar=function(){const r=_oc.apply(this,arguments);try{const c=S.car;if(c&&c.stolen&&UI.sheet){const box=$('#shB');const near=Math.hypot(P.x-LOCS.autos.x,P.z-LOCS.autos.z)<20||Math.hypot(c.x-LOCS.autos.x,c.z-LOCS.autos.z)<20;
  const val=Math.round((c.model==='jeep'?650000:320000)*0.22/1000)*1000;
  const mk=(t,s,fn,dis)=>{const b=el('button','opt','<div class="l"><b>'+t+'</b><span>'+(dis||s)+'</span></div>');if(dis)b.disabled=true;b.onclick=()=>{closeSheet();fn();};box.prepend(b);};
  mk('Ditch the stolen car','Walk away and leave it here',()=>{dropStolen();toast('Ditched','You wipe the steering wheel and walk away fast.');});
  mk('Sell it at the back yard ('+naira(val)+')','Junction Autos\' back yard asks no questions',()=>{if(chance(0.15))return stealCaught(false);earn(val,'Sold a stolen car');dropStolen();S.skills.street+=0.2;toast('Sold',naira(val)+' in cash, no receipt.','bad');},near?null:'Drive it to Junction Autos first');}}catch(e){}return r;};}
if(window.__QA)window.__CJ={PK,stealCar,carSheet,parkAll,dropStolen};
