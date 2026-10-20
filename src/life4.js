/* ================= LIFE 4: car rescue, and the systems added with the city upgrade =================
   This file only adds to the game; every older system keeps working as before. */

/* ---------- a car that can't move (boxed in after a bump, parked badly) can always be got out ----------
   While driving: if you press the gas or brake for 2.5 seconds and the car hardly moves, a "Stuck?" button
   appears. It rolls the car onto the nearest clear stretch of road, facing along it. Free. */
const STUCK={btn:null,since:0,from:null};
{const b=el('button',null,'Stuck? Get back on the road');b.id='unstick';b.hidden=true;
  b.style.cssText='position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 132px);z-index:26;background:var(--gold);color:#1d1606;border:0;border-radius:10px;padding:10px 14px;font-weight:700;font-size:13px;min-height:44px';
  $('#app').append(b);STUCK.btn=b;b.onclick=()=>unstickCar();}
function roadSpotNear(x,z){/* nearest point on a road where the car fits, facing along that road */
  let best=null;for(const r of ROADS){const vert=r.x1===r.x2;const a=vert?Math.min(r.z1,r.z2):Math.min(r.x1,r.x2),b2=vert?Math.max(r.z1,r.z2):Math.max(r.x1,r.x2);
    const u0=clamp(vert?z:x,a+3,b2-3);for(let du=0;du<=60;du+=3)for(const sg of du?[1,-1]:[1]){const u=clamp(u0+sg*du,a+3,b2-3);for(const lane of [LANE,-LANE]){const px=vert?r.x1+lane:u,pz=vert?u:r.z1+lane;
      const d=Math.hypot(px-x,pz-z);if(best&&d>=best.d)continue;const dir=vert?(lane>0?Math.PI:0):(lane>0?Math.PI/2:-Math.PI/2);
      if(carSpotFree(px,pz,dir))best={x:px,z:pz,dir,d};}}}
  return best;}
function unstickCar(){const c=S&&S.car;if(!c)return;const sp=roadSpotNear(c.x,c.z);if(!sp)return toast('Stuck','No clear road nearby. Call the mechanic from your car menu.','bad');
  if(!W.drive)carDyn(false);c.x=sp.x;c.z=sp.z;c.dir=sp.dir;if(W.drive){W.drive.v=0;cam.yaw=c.dir+Math.PI;}placeMyCar();if(!W.drive)carDyn(true);P.x=c.x;P.z=c.z;
  STUCK.btn.hidden=true;STUCK.since=0;toast('Back on the road','A couple of passers-by help you push the car onto the road.','good');save();}
HOOKS.frame.push((dt,now)=>{const D=W.drive,c=S&&S.car;if(!D||!c){if(STUCK.btn&&!STUCK.btn.hidden)STUCK.btn.hidden=true;STUCK.since=0;return;}
  const pressing=D.keys&&(D.keys.up||D.keys.down);
  if(!pressing){STUCK.since=0;STUCK.from=null;return;}
  if(!STUCK.since){STUCK.since=now;STUCK.from={x:c.x,z:c.z};return;}
  if(Math.hypot(c.x-STUCK.from.x,c.z-STUCK.from.z)>1.2){STUCK.since=now;STUCK.from={x:c.x,z:c.z};STUCK.btn.hidden=true;return;}
  if(now-STUCK.since>2500)STUCK.btn.hidden=false;});
/* the car menu always offers a push to the road when the car is parked off it */
{const _oc=openCar;openCar=function(){const r=_oc.apply(this,arguments);try{const c=S.car;if(c&&UI.sheet&&roadDist(c.x,c.z)>5){const box=$('#shB');const b=el('button','opt','<div class="l"><b>Push the car onto the road</b><span>If it is boxed in by a tree, wall or another car</span></div>');b.onclick=()=>{closeSheet();unstickCar();};box.append(b);}}catch(e){}return r;};}


/* ================= COUNTERS, SKILLS ================= */
function cnt(){S.cnt=S.cnt||{};return S.cnt;}
function bump(k,n){const c=cnt();c[k]=(c[k]||0)+(n==null?1:n);}
const SKILL_INFO={fitness:'Fitness · less tiredness from work and sport',strength:'Strength · better pay in physical jobs',stamina:'Stamina · walk and run faster',swimming:'Swimming · swim further, safely',driving:'Driving · fewer crashes, better taxi tips',cycling:'Cycling · faster on a bicycle'};
function skillUp(k,v){const before=Math.floor(S.skills[k]||0);S.skills[k]=Math.min(10,(S.skills[k]||0)+v);const after=Math.floor(S.skills[k]);
  if(after>before){toast(k[0].toUpperCase()+k.slice(1)+' level '+after,SKILL_INFO[k]||'Skill up','good');xp(10+after*4,k+' level up');}}
/* stamina makes you walk faster (up to +20%), fitness makes physical work and sport less tiring */
{const _ws=walkSpeed;walkSpeed=function(){return _ws.apply(this,arguments)*(1+Math.min(0.2,(S.skills.stamina||0)*0.02));};}
{const _n=N;N=function(k,v){if(k==='energy'&&v<0&&ACT&&!ACT.sleep)v*=Math.max(0.7,1-(S.skills.fitness||0)*0.03);return _n(k,v);};}
/* driving skill: grows with the distance you drive yourself; cycling with distance on a bicycle */
HOOKS.frame.push(dt=>{const c=S&&S.car,D=W.drive;if(!c||!D)return;const d=Math.abs(D.v)*dt;if(d<=0)return;if(c.model==='bicycle')skillUp('cycling',d*0.00012);else skillUp('driving',d*0.00006);bump('drivem',d);if(inCity(c.z))S.flags.cityVisit=1;});

/* ================= OUTFITS (Ankara House) ================= */
const OUTFITS=[
  {id:'agbada',n:'White agbada set',cat:'native',p:45000,drip:4,look:{top:'kaftan',shirt:0xf2efe6,pants:0xf2efe6,shoeStyle:'shoes',shoes:0x5a3a2a}},
  {id:'senator',n:'Navy senator wear',cat:'native',p:28000,drip:3,look:{top:'kaftan',shirt:0x1f2d44,pants:0x1f2d44,shoeStyle:'shoes',shoes:0x1d1a18}},
  {id:'ankara2',n:'Ankara two-piece',cat:'native',p:18000,drip:3,look:{top:'ankara',shirt:0xc2541f,pants:0x2d3f5c,shoeStyle:'sneakers',shoes:0xf2f2f2}},
  {id:'office',n:'Office shirt & trousers',cat:'work',p:15000,drip:1,look:{top:'long',shirt:0xeef2f6,pants:0x222222,shoeStyle:'shoes',shoes:0x1d1a18}},
  {id:'overalls',n:'Work overalls',cat:'work',p:8000,drip:0,look:{top:'long',shirt:0x2b4f8a,pants:0x2b4f8a,shoeStyle:'shoes',shoes:0x3a2a1e}},
  {id:'hoodie',n:'Black hoodie & jeans',cat:'street',p:16000,drip:2,look:{top:'hoodie',shirt:0x1b1b1b,pants:0x2d3f5c,shoeStyle:'sneakers',shoes:0xf2f2f2}},
  {id:'drop',n:'Limited sneaker drop fit',cat:'street',p:60000,drip:5,look:{top:'tee',shirt:0xe3b04b,pants:0x222222,shoeStyle:'sneakers',shoes:0xd23b2b}},
  {id:'party',n:'Party fit (silk shirt)',cat:'party',p:22000,drip:3,look:{top:'polo',shirt:0x7a2331,pants:0x111111,shoeStyle:'shoes',shoes:0x111111}},
  {id:'gymkit',n:'Gym kit',cat:'sport',p:9000,drip:1,look:{top:'tee',shirt:0xd23b2b,pants:0x222222,shoeStyle:'sneakers',shoes:0xf2f2f2}},
  {id:'jersey2',n:'Super Eagles kit',cat:'sport',p:12000,drip:2,look:{top:'tee',shirt:0x1f8a4c,pants:0xf2f2f2,shoeStyle:'sneakers',shoes:0xf2f2f2}},
  {id:'golden',n:'Golden agbada (20 kola nuts)',cat:'native',p:0,drip:6,unlock:'kola20',look:{top:'kaftan',shirt:0xe3b04b,pants:0xe3b04b,shoeStyle:'shoes',shoes:0x5a3a2a}}];
const OUTFIT_BY=Object.fromEntries(OUTFITS.map(o=>[o.id,o]));
function outfitOwned(id){return (S.outfits||[]).includes(id);}
function outfitCat(){const o=OUTFIT_BY[S.outfit];return o?o.cat:'everyday';}
function wearOutfit(id){const o=OUTFIT_BY[id];if(!o)return;if(!S.look0)S.look0=Object.assign({},S.look);Object.assign(S.look,o.look);S.look.shirtHex=hexStr(o.look.shirt);S.outfit=id;buildPlayer(S.look);setHair(player,S.hair);
  S.drip=Math.max(S.drip||0,0);toast('Outfit','Wearing the '+o.n.toLowerCase()+'.','good');addMoodlet('Looking sharp',4+o.drip,600);bump('outfitswap');save();}
function wearEveryday(){if(!S.look0)return toast('Outfit','You are already in your everyday clothes.');Object.assign(S.look,S.look0);S.outfit=null;buildPlayer(S.look);setHair(player,S.hair);toast('Outfit','Back in your everyday clothes.');save();}
function outfitActs(){const L=[];OUTFITS.forEach(o=>{if(o.unlock&&!S.flags[o.unlock])return;const own=outfitOwned(o.id)||o.p===0&&S.flags[o.unlock];
    L.push(own?A('Wear: '+o.n,o.cat+' · drip +'+o.drip,()=>wearOutfit(o.id),{dis:S.outfit===o.id?'You are wearing it':null}):A('Buy '+o.n,o.cat+' · drip +'+o.drip+(o.id==='office'?' · needed for office jobs':o.id==='overalls'?' · workshop wear: hygiene drops slower on mechanic shifts':o.cat==='sport'?' · gym and sport bonus':o.cat==='party'?' · free entry at Club Vibez':''),()=>{if(!spend(o.p,'Outfit: '+o.n))return toast('Not enough money',o.n+' costs '+naira(o.p)+'.','bad');S.outfits=(S.outfits||[]).concat(o.id);S.drip=(S.drip||0)+o.drip*0.5;bump('outfits');wearOutfit(o.id);},{cost:o.p}));});
  if(S.outfit)L.push(A('Change into your everyday clothes','',()=>wearEveryday()));return L;}
HOOKS.apps.push(()=>[['wardrobe','Wardrobe','#7a2331','♜']]);
HOOKS.views.wardrobe=(b,T)=>{T.textContent='Wardrobe';const can=!S.inside||['boys','girls','fashion','hotel'].includes(S.inside)||(LOCS[S.inside]&&(LOCS[S.inside].prop||S.inside===S.home||S.inside===S.ownHouse));
  b.append(el('div','note',can?'Pick what to wear. Office jobs need work clothes; party clothes get you into Club Vibez free; sport kit helps at the gym.':'Change clothes at home, in your hostel room, at a hotel or at Ankara House.'));
  const own=OUTFITS.filter(o=>outfitOwned(o.id)||(o.unlock&&S.flags[o.unlock]));if(!own.length)b.append(el('div','note','You have no outfits yet. Ankara House in the Central Business District sells them.'));
  own.forEach(o=>{const r=el('div','txrow','<div>'+o.n+'<span>'+o.cat+' · drip +'+o.drip+(S.outfit===o.id?' · wearing':'')+'</span></div>');const br=el('div','btnrow');const bt=el('button',null,S.outfit===o.id?'Wearing':'Wear');bt.disabled=!can||S.outfit===o.id;bt.onclick=()=>{closePhone();wearOutfit(o.id);};br.append(bt);b.append(r,br);});
  if(S.outfit){const br=el('div','btnrow');const bt=el('button',null,'Everyday clothes');bt.disabled=!can;bt.onclick=()=>{closePhone();wearEveryday();};br.append(bt);b.append(br);}};

/* ================= CAREERS =================
   Nine careers with five ranks each. Apply once (some need the right clothes or skills), then work shifts:
   pay rises with rank, every rank unlocks something, and a moment in most shifts asks you to choose. */
const CRANK=[0,40,120,260,480],CPAY=[1,1.3,1.7,2.2,3];
const CAREERS={
  delivery:{n:'Delivery rider',at:['depot'],ranks:['Rider','Senior rider','Dispatch lead','Fleet manager','Logistics boss'],hours:[7,21],live:'delivery',
    unlock:['Parcels across the city','Express parcels (+30% pay)','Bike from the depot for free','Your own route bonus (+₦1,000)','Run the depot: daily profit share']},
  taxi:{n:'Gidi Ride driver',at:null,ranks:['Driver','Rated driver','Gold driver','Fleet partner','Transport mogul'],hours:[0,24],live:'taxi',need:()=>S.car&&!['bicycle'].includes(S.car.model)?null:'You need a car or motorcycle',
    unlock:['Ride requests in the city','Better tips','VIP riders (x1.5 fare)','Airport runs (big fares)','Fleet partner: passive income']},
  mechanic:{n:'Mechanic',at:['mech'],ranks:['Apprentice','Mechanic','Senior mechanic','Workshop head','Master mechanic'],hours:[7,19],shift:[120,3500],skill:'strength',
    unlock:['Oil changes and tyres','30% off repairs and upgrades','Engine tuning jobs','Run the wash bay','Master: free upgrades labour']},
  chef:{n:'Chef',at:['hotel','amala','shawarma','suyarep'],ranks:['Kitchen help','Line cook','Sous chef','Head chef','Executive chef'],hours:[7,22],shift:[120,3200],
    unlock:['Prep and wash','Cook on the line','Run a station','Run the kitchen','Your own menu at the hotel']},
  shop:{n:'Shop assistant',at:['megamart'],ranks:['Shelf stacker','Cashier','Supervisor','Store manager','Area manager'],hours:[8,21],shift:[120,2800],
    unlock:['Stack shelves','10% staff discount at MegaMart','Supervise the floor','Manage the store','Area bonus every week']},
  security:{n:'Security guard',at:['hub','hotel'],ranks:['Guard','Senior guard','Supervisor','Head of security','Security company owner'],hours:[0,24],shift:[240,5500],need:()=>(S.skills.fitness||0)>=1||S.flags.fireCert?null:'Fitness level 1 or a fire safety certificate',
    unlock:['Day and night shifts','Night shifts pay double','Supervise the night team','Head of security','Own security company: contracts']},
  office:{n:'Office worker',at:['hub'],ranks:['Intern','Associate','Senior associate','Manager','Director'],hours:[8,17],weekdays:true,shift:[240,7000],need:()=>S.outfit!=='office'?'Wear the office shirt & trousers (Ankara House sells them)':(S.skills.academic||0)<1.8&&(S.level||100)<200?'Academic skill 1.8 or 200 Level':null,
    unlock:['Spreadsheets and coffee','Client meetings (bonus)','Lead small projects','Manage a team','Director: company car allowance']},
  entertainer:{n:'Entertainer',at:['lounge','club'],ranks:['Open-mic act','Resident act','Headliner','Event organiser','Superstar'],hours:[18,27],shift:[60,3000],
    unlock:['Open-mic slots','Resident nights','Headline shows','Organise your own events','Superstar: concert invitations']},
  dealer:{n:'Vehicle dealer',at:['express'],ranks:['Hustler','Dealer','Senior dealer','Showroom manager','Car mogul'],hours:[8,19],live:'dealer',
    unlock:['Flip used cars','Better auction prices','Import deals','Run the showroom','Mogul: dealer price on every car']},
  conductor:{n:'Danfo conductor',at:['motorpark'],ranks:['Conductor','Senior conductor','Route boss','Park chairman','Transport union boss'],hours:[6,20],shift:[120,2500],
    unlock:['Shout the routes','Better routes','Run a route','Chair the motor park','Union boss: daily dues']}};
function car4(k){S.career=S.career||{};return S.career[k];}
function crank(k){const c=car4(k);if(!c)return -1;let r=0;CRANK.forEach((t,i)=>{if(c.xp>=t)r=i;});return r;}
function cxp(k,n){const c=car4(k);if(!c)return;const r0=crank(k);c.xp+=n;const r1=crank(k);if(r1>r0){const C=CAREERS[k];celebrate('Promoted!',C.n+': '+C.ranks[r1]+' · '+C.unlock[r1]);bump('promos');S.rep=(S.rep||0)+2;}}
function careerOpen(k){const C=CAREERS[k];const h=minOf(S.t)/60;const okH=C.hours[1]>24?(h>=C.hours[0]||h<C.hours[1]-24):(h>=C.hours[0]&&h<C.hours[1]);if(!okH)return 'Shifts '+fmtTime(C.hours[0]*60)+' – '+fmtTime((C.hours[1]%24)*60);if(C.weekdays&&wd(S.t)>4)return 'Weekdays only';return null;}
function careerApply(k){const C=CAREERS[k];const why=C.need&&C.need();if(why)return toast('Not yet',why,'bad');S.career=S.career||{};S.career[k]={xp:0,shifts:0,earned:0,since:dayOf(S.t)};bump('hired');
  dialog({who:'me',kicker:'Hired: '+C.n,text:'You start as <b>'+C.ranks[0]+'</b>. '+C.unlock[0]+'. Work shifts to rank up; each rank pays more and unlocks something new.',choices:[{t:'Let\'s go',fn:()=>null}]});checkGoals();save();}
function careerPay(k,base){const r=crank(k);const sk=CAREERS[k].skill?1+(S.skills[CAREERS[k].skill]||0)*0.03:1;return Math.round(base*CPAY[r]*sk/50)*50;}
function careerShift(k,where){const C=CAREERS[k];const why=careerOpen(k);if(why)return toast(C.n,why,'bad');if(ACT)return toast('Busy','Finish what you are doing first.');
  const [mins,base]=C.shift;const night=k==='security'&&(minOf(S.t)<6*60||minOf(S.t)>=20*60)&&crank(k)>=1;const pay=careerPay(k,base)*(night?2:1);
  startAction(C.n+' shift ('+C.ranks[crank(k)]+')',mins,{hide:true,where,per:()=>{N('energy',-0.08);N('hygiene',k==='mechanic'&&S.outfit==='overalls'?-0.015:-0.04);N('stress',0.03);},done:()=>{const c=car4(k);c.shifts++;c.earned+=pay;earn(pay,C.n+' shift at '+fx(LOCS[where]?LOCS[where].name:'work'));S.stats.jobs+=pay;bump('shifts');bump('shift_'+k);cxp(k,10+(S.skills.business||0));xp(8,'Shift');shiftMoment(k);}});}
/* a moment in the shift: a choice that changes the tip, the XP, or your rep */
const MOMENTS={mechanic:[['A customer\'s brakes are worn but she only asked for an oil change.','Tell her (honest)','Say nothing'],['The boss is out and a rich client wants a "small discount".','Give the discount','Charge full price']],
  chef:[['The pepper soup is too salty and the order is due.','Start again (slower)','Send it out'],['A regular asks for extra meat "on credit".','Allow it','Politely refuse']],
  shop:[['A child is crying in aisle 3, lost.','Help find the parents','Call security'],['You spot a man pocketing sardines.','Stop him','Look away']],
  security:[['Someone without an ID wants to get in "just for five minutes".','Refuse','Let them in for ₦2,000'],['You hear glass breaking at 2 AM.','Investigate','Call it in and wait']],
  office:[['Your manager asks who wants to present to the client.','Volunteer','Stay quiet'],['A colleague takes credit for your report.','Speak up','Let it go']],
  entertainer:[['The crowd is quiet tonight.','Switch to Afrobeats classics','Push your new songs'],['A promoter offers a gig for "exposure", no pay.','Take it','Decline']],
  conductor:[['A passenger is ₦100 short.','Let it go','Make them get down'],['Another danfo cuts in at the stop.','Shout louder','Move to the next stop']]};
function shiftMoment(k){const M=MOMENTS[k];if(!M||!chance(0.45))return;const [txt,a,b]=pick(M);dialog({who:'me',kicker:CAREERS[k].n,text:txt,choices:[
  {t:a,fn:()=>{if(chance(0.7)){const tip=careerPay(k,500);earn(tip,'Tip / bonus');cxp(k,6);S.rep=(S.rep||0)+1;return 'Good call. +'+naira(tip)+' and the boss noticed.';}cxp(k,3);return 'It costs you time, but it was the right thing.';}},
  {t:b,fn:()=>{if(chance(0.5)){const tip=careerPay(k,800);earn(tip,'Extra');return 'It works out this time: +'+naira(tip)+'.';}cxp(k,-4);N('stress',8);return 'It backfires. The boss is not happy.';}}]});}
function careerActs(k,where){const C=CAREERS[k];if(!C)return [];const c=car4(k);if(!c)return [A('Apply: '+C.n,(C.need&&C.need())||'Free · start as '+C.ranks[0],()=>careerApply(k),{dis:C.need&&C.need()})];
  const r=crank(k);const out=[];const nx=CRANK[r+1];const info=C.ranks[r]+(nx!=null?' · '+(c.xp)+'/'+nx+' XP to '+C.ranks[r+1]:' · top rank');
  if(C.live==='delivery')out.push(A('Take a delivery',info,()=>startDelivery(),{dis:careerOpen(k)||(JOB4.kind?'Finish your current job first':null)}));
  else if(C.live==='dealer')out.push(...dealerFlipActs());
  else if(C.shift)out.push(A('Work a '+C.n.toLowerCase()+' shift',fmtDur(C.shift[0])+' · '+naira(careerPay(k,C.shift[1]))+' · '+info,()=>careerShift(k,where),{pay:careerPay(k,C.shift[1]),dis:careerOpen(k)}));
  if(k==='entertainer'&&r>=3)out.push(A('Host your own event','Hire the room, invite players · ₦20,000',()=>hostEvent(where),{cost:20000}));
  return out;}
function careerSummary(){return Object.keys(S.career||{}).map(k=>CAREERS[k].n+' · '+CAREERS[k].ranks[crank(k)]).join(' · ');}

/* ================= OBJECTIVE MARKERS (deliveries, rides, missions, races) ================= */
const MK={};/* one beacon per purpose: job, mission, race, ... */
function markerAt(T,col,key){key=key||'job';let m=MK[key];if(!m){if(!T)return;m=MK[key]=new THREE.Group();const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.4,16,18,1,true),new THREE.MeshBasicMaterial({color:0x2fbf6a,transparent:true,opacity:0.25,depthWrite:false,side:THREE.DoubleSide}));beam.position.y=8;m.add(beam);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(2,0.12,8,32),new THREE.MeshBasicMaterial({color:0x2fbf6a}));ring.rotation.x=Math.PI/2;ring.position.y=0.15;m.add(ring);outdoor.add(m);}
  if(!T){m.visible=false;return;}m.visible=!S.inside;m.position.set(T.x,0,T.z);const c=col||0x2fbf6a;m.children.forEach(o=>o.material.color.setHex(c));m.children[1].scale.setScalar(1+Math.sin(performance.now()/250)*0.08);}
const chip=el('div',null,'');chip.id='jobchip';chip.hidden=true;chip.style.cssText='position:absolute;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 88px);z-index:22;background:rgba(14,22,18,.92);border:1px solid var(--gold);border-radius:12px;padding:7px 12px;font-size:12px;color:var(--cream);max-width:calc(100vw - 32px);text-align:center;pointer-events:none';$('#app').append(chip);

/* ================= DELIVERY AND RIDE-HAILING (live jobs with a marker) ================= */
const JOB4={};
const DELIV_SPOTS=['prop5','prop6','prop7','cschool','prop8','bank','megamart','hub','hospital','police','fire','gym','cinema','amala','shawarma','suyarep','hotel','lounge','lodge1','lodge2','lodge3','family','pharm','buka','prop1','prop2','prop3','prop4','fashion','salon','furni'];
function startDelivery(){if(JOB4.kind)return toast('Busy','Finish your current job first.');const r=crank('delivery');const from='depot';let to;do{to=pick(DELIV_SPOTS);}while(!LOCS[to]||to===from);
  const len=pathLen(LOCS.depot.door,route(LOCS.depot.door,LOCS[to].door));const express=r>=1&&chance(.35);let pay=Math.round((800+len*4)*CPAY[r]*(express?1.3:1)/50)*50+(r>=3?1000:0);
  Object.assign(JOB4,{kind:'delivery',to,pay,until:S.t+Math.round(30+len/9),express,started:S.t});if(r>=2&&!S.car&&!S.inv.bike){S.inv.bike=1;toast('Depot bike','As dispatch lead you can take a depot bicycle. Cycle faster.','good');}
  toast('Parcel','Take the '+(express?'EXPRESS ':'')+'parcel to '+fx(LOCS[to].name)+' · '+naira(pay)+' · due '+fmtTime(JOB4.until%1440)+'.','good');save();}
function startRides(){if(JOB4.kind)return toast('Busy','Finish your current job first.');if(!car4('taxi'))return careerApply('taxi');const why=CAREERS.taxi.need();if(why)return toast('Gidi Ride',why,'bad');
  JOB4.kind='taxi';JOB4.stage='wait';JOB4.next=S.t+2;toast('Gidi Ride','You are online. A ride request will come in shortly. Drive towards the city.','good');}
function nextRide(){const r=crank('taxi');const pool=DELIV_SPOTS.concat(['market','express','mech','motorpark','depot','beach','pitch','gate','autos','fuel']).filter(i=>LOCS[i]);const c=S.car;
  let from=pool.reduce((b,i)=>{const d=Math.hypot(LOCS[i].door.x-c.x,LOCS[i].door.z-c.z);return d>40&&d<220&&(!b||chance(.35))?i:b;},null)||pick(pool);let to;do{to=pick(pool);}while(to===from);
  const len=pathLen(LOCS[from].door,route(LOCS[from].door,LOCS[to].door));const vip=r>=2&&chance(.25);const fare=Math.round((600+len*5.5)*CPAY[r]*(vip?1.5:1)/50)*50;
  Object.assign(JOB4,{stage:'pickup',from,to,fare,vip,who:pick(['Mrs Okafor','Tunde','Aisha','Chinedu','Uncle Bayo','Kemi','Mr Danjuma','Ruth']),until:S.t+45});
  toast('Ride request',(vip?'VIP · ':'')+JOB4.who+': pick up at '+fx(LOCS[from].name)+' → '+fx(LOCS[to].name)+' · '+naira(fare)+'.','good');}
function stopJob(why){if(!JOB4.kind)return;const k=JOB4.kind;for(const x in JOB4)delete JOB4[x];markerAt(null);chip.hidden=true;if(why)toast(k==='taxi'?'Gidi Ride':'Job',why);}
HOOKS.minute.push(()=>{if(!S||!JOB4.kind)return;if(JOB4.kind==='taxi'){if(JOB4.stage==='wait'&&S.t>=JOB4.next&&S.car)nextRide();else if(JOB4.stage!=='wait'&&S.t>JOB4.until){JOB4.stage='wait';JOB4.next=S.t+5;cxp('taxi',-3);toast('Gidi Ride',JOB4.who+' cancelled: you took too long. Your rating drops a little.','bad');}}
  else if(JOB4.kind==='delivery'&&S.t>JOB4.until+60){stopJob('The parcel was returned to the depot. No pay.');}});
HOOKS.frame.push((dt,now)=>{if(!S||!JOB4.kind){return;}let T=null,txt='';const here=W.drive&&S.car?{x:S.car.x,z:S.car.z}:{x:P.x,z:P.z};
  if(JOB4.kind==='delivery'){const L=LOCS[JOB4.to];T=L.door;const d=Math.hypot(T.x-here.x,T.z-here.z);txt='📦 Parcel → '+fx(L.name)+' · '+Math.round(d)+' m · '+naira(JOB4.pay)+(S.t>JOB4.until?' · LATE':' · due '+fmtTime(JOB4.until%1440));
    if(d<5&&!S.inside&&(!W.drive||Math.abs(W.drive.v)<2)){const late=S.t>JOB4.until;const tip=!late&&JOB4.until-S.t>10?Math.round(JOB4.pay*0.15/50)*50:0;const pay=late?Math.round(JOB4.pay*0.5/50)*50:JOB4.pay+tip;
      earn(pay,'Delivery to '+fx(L.name));const c=car4('delivery');c.shifts++;c.earned+=pay;bump('deliveries');bump('shifts');cxp('delivery',late?4:12);xp(8,'Delivery');sfx('coin');toast('Delivered',late?'Late. Half pay: '+naira(pay)+'.':'+'+naira(pay)+(tip?' (incl. '+naira(tip)+' tip)':'')+'. Back to the depot for the next one.',late?'bad':'good');stopJob();checkGoals();save();return;}}
  else if(JOB4.kind==='taxi'){if(JOB4.stage==='wait'){txt='🚕 Gidi Ride · online · waiting for a request';T=null;}
    else{const id=JOB4.stage==='pickup'?JOB4.from:JOB4.to;const L=LOCS[id];T=L.door;const A2=attach(T);const d=Math.min(Math.hypot(T.x-here.x,T.z-here.z),Math.hypot(A2.x-here.x,A2.z-here.z));
      txt=(JOB4.stage==='pickup'?'🚕 Pick up '+JOB4.who+' at ':'🚕 Drop '+JOB4.who+' at ')+fx(L.name)+' · '+Math.round(d)+' m · '+naira(JOB4.fare);
      if(d<9&&W.drive&&Math.abs(W.drive.v)<2){if(JOB4.stage==='pickup'){JOB4.stage='drop';JOB4.until=S.t+60;sfx('door');toast('Rider in',JOB4.who+': "'+fx(LOCS[JOB4.to].name)+', please."');}
        else{const sk=(S.skills.driving||0);const tip=chance(0.2+sk*0.04+(crank('taxi')>=1?0.15:0))?Math.round(JOB4.fare*0.2/50)*50:0;earn(JOB4.fare+tip,'Gidi Ride fare'+(JOB4.vip?' (VIP)':''));const c=car4('taxi');c.shifts++;c.earned+=JOB4.fare+tip;bump('rides');bump('shifts');cxp('taxi',12);xp(8,'Ride');sfx('coin');
          toast('Fare paid','+'+naira(JOB4.fare)+(tip?' + '+naira(tip)+' tip':'')+'. ★★★★★','good');JOB4.stage='wait';JOB4.next=S.t+3;checkGoals();save();}}}}
  chip.hidden=!txt||S.inside;chip.textContent=txt;markerAt(T,JOB4.kind==='taxi'?0xf2c230:0x2fbf6a,'job');});

/* people you meet in the city */
Object.assign(PEOPLE,{police:{name:'Police Officer',role:'Nigeria Police · Bwari Division',skin:'#4a2e1a',shirt:'#1d2638'},citystaff:{name:'Staff',role:'Bwari City',skin:'#5a3a24',shirt:'#2b4f8a'},bouncer:{name:'Bouncer',role:'Club Vibez door',skin:'#3a2416',shirt:'#111111'}});
/* a party or native outfit gets you into Club Vibez without the cover charge */
{const _eb=enterBuilding;enterBuilding=function(id){if(id==='club'&&S&&!S.inside&&mature()&&isOpen('club')&&['party','native'].includes(outfitCat())){const k=dayOf(S.t)-(minOf(S.t)<4*60?1:0);if(S.flags.clubPaid!==k){S.flags.clubPaid=k;toast('Bouncer','"Nice fit. Go in, no cover tonight."','good');}}return _eb.apply(this,arguments);};}
/* ================= BANK (Unity Trust) =================
   Money in the bank can't be stolen from your bunk or your pocket. Savings earn a little every day.
   Loans: borrow, repay within 14 days with 15% interest; a late loan hurts your credit and adds a fine. */
function bk(){S.bank=S.bank||{bal:0,loan:0,due:0,credit:60};return S.bank;}
function bankMove(n,dir){const B=bk();n=Math.floor(n);if(n<=0)return;if(dir>0){if(!spend(n,'Deposit · Unity Trust'))return toast('Not enough cash','You have '+naira(S.money)+' on you.','bad');B.bal+=n;bump('deposits');toast('Deposited',naira(n)+' is safe in the bank. Balance '+naira(B.bal)+'.','good');}
  else{if(B.bal<n)return toast('Bank','Your balance is '+naira(B.bal)+'.','bad');B.bal-=n;earn(n,'Withdrawal · Unity Trust');toast('Withdrawn',naira(n)+' in cash. Balance '+naira(B.bal)+'.');}save();}
function bankActs(atm){const B=bk();const L=[];
  [5000,20000].forEach(n=>L.push(A('Deposit '+naira(n),'Balance '+naira(B.bal),()=>bankMove(n,1),{now:true,dis:S.money<n?'Not enough cash':null})));
  L.push(A('Deposit all your cash ('+naira(S.money)+')','Keep it safe',()=>bankMove(S.money,1),{now:true,dis:S.money<1?'No cash on you':null}));
  [5000,20000].forEach(n=>L.push(A('Withdraw '+naira(n),'Balance '+naira(B.bal),()=>bankMove(n,-1),{now:true,dis:B.bal<n?'Not enough in the bank':null})));
  if(!atm){if(!B.loan)[50000,250000].forEach(n=>{const ok=B.credit>=(n>100000?65:45)&&(S.lvl>=3||Object.keys(S.career||{}).length);L.push(A('Borrow '+naira(n),'Repay '+naira(Math.round(n*1.15))+' within 14 days · credit score '+B.credit,()=>{B.loan=Math.round(n*1.15);B.due=dayOf(S.t)+14;earn(n,'Loan · Unity Trust');bump('loans');toast('Loan approved','Repay '+naira(B.loan)+' by Day '+B.due+'.','good');save();},{now:true,dis:ok?null:'You need a job (or level 3) and a better credit score'}));});
    else L.push(A('Repay your loan ('+naira(B.loan)+')','Due Day '+B.due,()=>{const pay=Math.min(B.loan,S.money+B.bal);if(pay<B.loan)return toast('Not enough','You need '+naira(B.loan)+'.','bad');const fromBank=Math.min(B.bal,B.loan);B.bal-=fromBank;if(B.loan-fromBank>0)spend(B.loan-fromBank,'Loan repayment');B.loan=0;B.credit=Math.min(100,B.credit+8);toast('Loan repaid','Credit score '+B.credit+'.','good');save();},{now:true}));
    const F=fines();if(F.length)L.push(A('Pay your fines ('+naira(fineTotal())+')',F.length+' unpaid',()=>payFines(),{now:true}));}
  return L;}
HOOKS.day.push((d)=>{if(!S)return;const B=bk();if(B.bal>0){const i=Math.floor(B.bal*0.001);if(i>0){B.bal+=i;S.stats.earned+=0;}}
  if(B.loan&&d>=B.due){if(B.bal>=B.loan){B.bal-=B.loan;B.loan=0;msg('rep','Unity Trust: your loan was repaid from your savings.');}else{B.credit=Math.max(0,B.credit-15);addFine(5000,'Late loan repayment');B.due=d+7;msg('rep','Unity Trust: your loan is overdue. ₦5,000 penalty and your credit score fell to '+B.credit+'. Pay at any branch.');}}});
HOOKS.apps.push(()=>[['bank4','Savings','#1f4d3a','₦']]);
HOOKS.views.bank4=(b,T)=>{T.textContent='Unity Trust Bank';const B=bk();b.append(el('div','statgrid','<div class="stat"><span>Cash on you</span><b class="num">'+naira(S.money)+'</b></div><div class="stat"><span>In the bank</span><b class="num">'+naira(B.bal)+'</b></div><div class="stat"><span>Loan</span><b class="num">'+(B.loan?naira(B.loan)+' · Day '+B.due:'none')+'</b></div><div class="stat"><span>Credit score</span><b class="num">'+B.credit+'</b></div>'));
  b.append(el('div','note','Mobile banking: move money between your pocket and your account. Loans are at the branch in the Central Business District. Savings earn 0.1% a day.'));
  const row=el('div','btnrow');[['Deposit ₦5,000',()=>bankMove(5000,1)],['Deposit all',()=>bankMove(S.money,1)],['Withdraw ₦5,000',()=>bankMove(5000,-1)]].forEach(([t,f])=>{const x=el('button',null,t);x.onclick=()=>{f();renderPhone();};row.append(x);});b.append(row);
  const F=fines();b.append(el('div','sec','Fines'));if(!F.length)b.append(el('div','note','No unpaid fines.'));F.forEach(f=>b.append(el('div','txrow','<div>'+esc(f.why)+'<span>Day '+f.day+'</span></div><div class="amt neg">'+naira(f.amt)+'</div>')));
  if(F.length){const r2=el('div','btnrow');const x=el('button',null,'Pay all fines '+naira(fineTotal()));x.onclick=()=>{payFines();renderPhone();};r2.append(x);b.append(r2);}};

/* ================= POLICE, FINES AND THE WANTED LEVEL =================
   In the city the police enforce the speed limit (60 km/h) and stop reckless drivers. Unpaid fines for more
   than three days, or running from the police, give you a wanted level (stars). A patrol that sees you while
   you are wanted pulls you over: pay, talk your way out, or run. Stars fade if you keep out of trouble. */
function fines(){S.fines=S.fines||[];return S.fines;}
function fineTotal(){return fines().reduce((a,f)=>a+f.amt,0);}
function addFine(amt,why){fines().push({amt,why,day:dayOf(S.t)});bump('fines');toast('Fine','₦'+amt.toLocaleString('en-US')+' · '+why+'. Pay at the police HQ or in the Bank app.','bad');save();}
function payFines(){const t=fineTotal();if(!t)return;const B=bk();if(S.money+B.bal<t)return toast('Not enough money','Your fines come to '+naira(t)+'.','bad');let left=t;const fromCash=Math.min(S.money,left);if(fromCash>0){spend(fromCash,'Fines paid');left-=fromCash;}if(left>0)B.bal-=left;S.fines=[];bump('finespaid');if(S.wanted&&S.wanted<=2){S.wanted=0;}toast('Fines paid','Your record is clean.','good');updWanted();save();}
function setWanted(n,why){const before=S.wanted||0;S.wanted=clamp(n,0,5);S.wantedT=S.t;if(S.wanted>before)toast('Wanted ★'.repeat(1)+' '+S.wanted,why||'The police are looking for you.','bad');updWanted();}
const WHUD=el('div',null,'');WHUD.id='wanted';WHUD.hidden=true;WHUD.style.cssText='position:absolute;right:12px;top:calc(env(safe-area-inset-top,0px) + 62px);z-index:21;font-size:18px;color:#ffd23b;text-shadow:0 1px 3px #000;letter-spacing:2px;pointer-events:none';$('#app').append(WHUD);
function updWanted(){const n=S&&S.wanted||0;WHUD.hidden=!n;WHUD.textContent='★'.repeat(n)+'☆'.repeat(5-n);}
HOOKS.boot.push(()=>updWanted());
HOOKS.minute.push(()=>{if(!S)return;const n=S.wanted||0;if(n&&S.t-(S.wantedT||S.t)>180){S.wanted=n-1;S.wantedT=S.t;updWanted();if(!S.wanted)toast('Off the radar','The police have stopped looking for you.','good');}
  const old=fines().filter(f=>dayOf(S.t)-f.day>3);if(old.length&&!(S.wanted>=1)&&!S.flags.fineWarn){S.flags.fineWarn=dayOf(S.t);setWanted(1,'Unpaid fines older than 3 days. Pay them at the police HQ.');}
  if(S.flags.fineWarn&&!fines().length)S.flags.fineWarn=0;});
/* speed limit and patrol stops (only in the city, never on campus) */
HOOKS.frame.push((dt,now)=>{if(!S||S.inside||CS.on||busy())return;const here=W.drive&&S.car?{x:S.car.x,z:S.car.z}:{x:P.x,z:P.z};if(!inCity(here.z))return;
  const pc=POLICE_CARS[0];if(!pc)return;const pd=Math.hypot(pc.g.position.x-here.x,pc.g.position.z-here.z);
  if(pc.lb)pc.lb.material.color.setHex((S.wanted&&Math.floor(now/250)%2)?0x2b6fd9:0xd23b2b);
  if(W.drive&&S.car&&S.car.model!=='bicycle'){const kmh=Math.abs(W.drive.v)*3.6;const cam2=[[0,250],[0,450],[-130,380]].some(([x,z])=>Math.hypot(here.x-x,here.z-z)<14);
    if(kmh>62&&(pd<45||cam2)&&!(W.spdT>S.t)){W.spdT=S.t+90;addFine(kmh>80?15000:5000,(cam2?'Speed camera: ':'Speeding: ')+Math.round(kmh)+' km/h in a 60 zone');bump('speeding');if(kmh>80&&pd<45)setWanted((S.wanted||0)+1,'Reckless driving. The patrol car is after you.');}}
  if((S.wanted||0)>0&&pd<22&&!(W.stopT>S.t)){W.stopT=S.t+120;pullOver();}});
function pullOver(){if(W.drive&&S.car)W.drive.v=0;const n=S.wanted||0;const fine=n*15000;
  dialog({who:'police',kicker:'Police stop · '+'★'.repeat(n),text:'"Driver! Park well. License and particulars." The officer checks a list. You are wanted.'+(fines().length?' You also have '+naira(fineTotal())+' in unpaid fines.':''),choices:[
    {t:'Pay the fine and fines on the spot ('+naira(fine+fineTotal())+')',fn:()=>{const t=fine+fineTotal();if(S.money+bk().bal<t)return '"You don\'t have it? Then follow me to the station." You are taken in.'+arrest();addFine(fine,'Penalty at a police stop');payFines();S.wanted=0;updWanted();return '"Okay. Go, and drive well."';}},
    {t:'Talk your way out',fn:()=>{if(bribeOk(0.25)){S.wanted=Math.max(0,n-1);updWanted();return '"Hmm. Today is your lucky day." He waves you on.';}setWanted(n+1,'You annoyed the officer.');return '"You think I\'m a fool?" It goes on your record.';}},
    {t:'Drive / run off',fn:()=>{setWanted(n+1,'You ran from a police stop.');bump('fled');return 'You get away. For now. The police have your description.';}}]});}
function arrest(){const B=bk();const bail=30000;let paid=Math.min(S.money,bail);if(paid)spend(paid,'Bail');if(paid<bail&&B.bal>=bail-paid){B.bal-=bail-paid;paid=bail;}S.t+=paid>=bail?180:480;S.wanted=0;S.fines=[];updWanted();bump('arrests');
  if(W.drive)endDriving();const L=LOCS.police;P.x=L.door.x;P.z=L.door.z+2;P.path=null;player.position.set(P.x,0,P.z);
  return paid>=bail?' Bail was ₦30,000. You spent 3 hours at the station.':' You could not pay bail and spent the night in a cell.';}
function policeActs(){const L=[];const F=fines();
  L.push(A(F.length?'Pay all fines ('+naira(fineTotal())+')':'No unpaid fines',F.map(f=>f.why).slice(0,2).join(' · ')||'Your record is clean',()=>payFines(),{now:true,dis:F.length?null:'Nothing to pay'}));
  if(S.wanted)L.push(A('Turn yourself in','Clears the wanted level · ₦'+(S.wanted*10000).toLocaleString('en-US')+' bail',()=>{const b=S.wanted*10000;if(S.money+bk().bal<b)return toast('Not enough','Bail is '+naira(b)+'.','bad');addFine(b,'Bail');payFines();S.wanted=0;updWanted();toast('Cleared','You are no longer wanted.','good');},{now:true}));
  L.push(A('Report a crime','If someone stole from you, file it here',()=>toast('Police','"We have written it down. We will call you." Nobody calls.')));return L;}
if(typeof CS!=='undefined'){}

/* ================= HOSPITAL AND PHARMACY ================= */
function hospitalActs(){return [A('Check-up (₦3,000)','30m · health +30 · stress −10',()=>{if(!spend(3000,'Hospital check-up'))return toast('Not enough money','','bad');startAction('At the doctor',30,{done:()=>{N('health',30);N('stress',-10);toast('Doctor','"You are fine. Drink water and rest."','good');}});},{cost:3000}),
  A('Treatment (₦8,000)','1h · back to full health',()=>{if(!spend(8000,'Hospital treatment'))return toast('Not enough money','','bad');startAction('Being treated',60,{done:()=>{N('health',100);toast('Treated','Back to full health.','good');}});},{cost:8000,dis:S.needs.health>70?'You are healthy':null}),
  A('Night on a ward (₦12,000)','8h · full rest and health',()=>{if(!spend(12000,'Hospital ward'))return toast('Not enough money','','bad');startAction('Resting on the ward',480,{sleep:true,done:()=>{N('health',100);N('energy',100);}});},{cost:12000})].concat(careerActs('security','hospital').length?[]:[]);}
function pharmacyActs(){return [A('Paracetamol (₦500)','Health +8 · stress −3',()=>{if(!spend(500,'Paracetamol'))return toast('Not enough money','','bad');N('health',8);N('stress',-3);toast('Pharmacy','Two tablets with water.');},{cost:500,now:true}),
  A('First-aid kit (₦3,500)','Keep it in your bag · use it after a crash',()=>{if(!spend(3500,'First-aid kit'))return toast('Not enough money','','bad');S.inv.firstaid=(S.inv.firstaid||0)+1;toast('Pharmacy','First-aid kit in your bag.');},{cost:3500,now:true}),
  ...(S.inv.firstaid?[A('Use a first-aid kit','Health +30',()=>{S.inv.firstaid--;N('health',30);toast('First aid','Patched up.');},{now:true})]:[]),
  A('Vitamins (₦2,000)','Feel good for a day',()=>{if(!spend(2000,'Vitamins'))return toast('Not enough money','','bad');addMoodlet('Vitamins',5,1440);N('health',5);},{cost:2000,now:true}),
  A('POS cash-out (₦100 fee)','Withdraw ₦5,000 from your bank account',()=>{const B=bk();if(B.bal<5100)return toast('POS','Your account has '+naira(B.bal)+'.','bad');B.bal-=5100;earn(5000,'POS cash-out');},{now:true})];}

/* ================= GYM ================= */
function gymMember(){return (S.gymUntil||0)>=dayOf(S.t);}
function gymActs(kind){const L=[];if(!gymMember())L.push(A('Gym membership (₦6,000 / 7 days)','Unlimited workouts',()=>{if(!spend(6000,'Gym membership'))return toast('Not enough money','','bad');S.gymUntil=dayOf(S.t)+7;toast('Member','Welcome to Iron Paradise. 7 days.','good');},{cost:6000,now:true}),A('Day pass (₦1,000)','Today only',()=>{if(!spend(1000,'Gym day pass'))return toast('Not enough money','','bad');S.gymUntil=dayOf(S.t);toast('Day pass','Train hard.','good');},{cost:1000,now:true}));
  const kit=outfitCat()==='sport'?1.25:1;const ev=communityEvent();const dbl=ev&&ev.id==='gymday'?2:1;const dis=gymMember()?(S.needs.energy<20?'Too tired to train':null):'Get a membership or day pass first';
  if(kind==='weights')L.push(A('Lift weights','45m · strength'+(kit>1?' · gym kit bonus':''),()=>startAction('Lifting weights',45,{place:{x:-5,y:0,z:-2.6,r:Math.PI,pose:'cross'},per:()=>{N('energy',-0.25);N('hygiene',-0.15);},done:()=>{skillUp('strength',0.18*kit*dbl);skillUp('fitness',0.06*kit*dbl);bump('gym');}}),{dis}));
  if(kind==='cardio')L.push(A('Run on the treadmill','30m · stamina + fitness',()=>startAction('Treadmill run',30,{place:{x:4.4,y:0,z:-3.6,r:Math.PI,pose:'run'},per:()=>{N('energy',-0.3);N('hygiene',-0.2);N('stress',-0.2);},done:()=>{skillUp('stamina',0.16*kit*dbl);skillUp('fitness',0.1*kit*dbl);bump('gym');}}),{dis}));
  if(kind==='boxing')L.push(A('Hit the bag','30m · fitness, strength, less stress',()=>startAction('Boxing',30,{place:{x:5.4,y:0,z:2.6,r:Math.PI,pose:'stretch'},per:()=>{N('energy',-0.3);N('stress',-0.5);},done:()=>{skillUp('fitness',0.12*kit*dbl);skillUp('strength',0.08*kit*dbl);bump('gym');}}),{dis}));
  L.push(A('Shower','8 min · ₦0 for members',()=>wcAct('Gym shower',8,{hygiene:70}),{dis:gymMember()?null:'Members only'}));return L;}

/* ================= CINEMA, ARCADE, LOUNGE, HOTEL ================= */
function cinemaActs(){return [A('Watch a movie (₦2,500)','2h · popcorn included · fun',()=>{if(!spend(2500,'Cinema ticket'))return toast('Not enough money','','bad');startAction('At the movies',120,{hide:true,per:()=>{N('fun',0.6);N('stress',-0.2);},done:()=>{addMoodlet('Great movie',10,600);bump('movies');}});},{cost:2500}),
  A('Popcorn & drink (₦1,200)','Snack',()=>{if(!spend(1200,'Popcorn'))return toast('Not enough money','','bad');N('food',10);N('fun',4);},{cost:1200,now:true})];}
function arcadeActs(){const best=(S.rec||{}).arcade||0;return [A('Play "Keke Dash" (₦200)','Tap the lit keke before it goes · best '+best,()=>{if(!spend(200,'Arcade token'))return toast('Not enough money','','bad');arcadeGame();},{cost:200,now:true}),
  A('Leaderboard','Best arcade scores in Bwari',()=>showBoard('arcade','Keke Dash · top scores'),{now:true})];}
/* Keke Dash: 20 seconds, nine lights; tap the one that lights up. Faster as you go. A real game, scored. */
function arcadeGame(){UI.mg=true;const ov=el('div',null,'');ov.style.cssText='position:fixed;inset:0;z-index:60;background:rgba(10,8,20,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:#fff;font-family:system-ui,sans-serif';
  const hdr=el('div',null,'<b style="font-size:22px">KEKE DASH</b>');const st=el('div',null,'Score 0 · 20.0 s');const grid=el('div',null,'');grid.style.cssText='display:grid;grid-template-columns:repeat(3,84px);gap:10px';
  const cells=[];for(let i=0;i<9;i++){const c=el('button',null,'');c.style.cssText='width:84px;height:84px;border-radius:14px;border:2px solid #444;background:#1d1b2e;font-size:34px';cells.push(c);grid.append(c);}
  const go=el('button',null,'Start');go.style.cssText='min-height:48px;padding:0 28px;border-radius:12px;border:0;background:#e3b04b;color:#1d1606;font-weight:800;font-size:16px';
  const quit=el('button',null,'Leave (refund ₦200)');quit.style.cssText='min-height:44px;padding:0 20px;border-radius:12px;border:1px solid #555;background:transparent;color:#ddd;font-weight:700;font-size:14px';
  quit.onclick=()=>{if(timer)return;ov.remove();UI.mg=false;earn(200,'Arcade token refund');};
  ov.append(hdr,st,grid,go,quit);document.body.append(ov);let score=0,left=20,lit=-1,t0=0,timer=null,litAt=0,win=1100;
  const light=()=>{if(lit>=0){cells[lit].textContent='';cells[lit].style.background='#1d1b2e';}let n;do{n=Math.floor(Math.random()*9);}while(n===lit);lit=n;cells[n].textContent='🛺';cells[n].style.background='#f2c230';litAt=performance.now();};
  cells.forEach((c,i)=>c.onclick=()=>{if(!timer)return;if(i===lit){score+=1+(performance.now()-litAt<450?1:0);win=Math.max(420,win-35);sfx('ping');light();}else{score=Math.max(0,score-1);sfx('bad');}});
  const end=()=>{clearInterval(timer);timer=null;const rec=S.rec=S.rec||{};const best=Math.max(rec.arcade||0,score);const nb=score>(rec.arcade||0);rec.arcade=best;bump('arcade');lbSubmit('arcade',score);
    st.textContent='Game over · score '+score+(nb?' · NEW BEST!':' · best '+best);go.textContent='Close';go.onclick=()=>{ov.remove();UI.mg=false;if(score>=25)addMoodlet('Arcade champ',8,300);N('fun',12);save();};};
  go.onclick=()=>{go.hidden=true;quit.hidden=true;t0=performance.now();light();timer=setInterval(()=>{left=Math.max(0,20-(performance.now()-t0)/1000);st.textContent='Score '+score+' · '+left.toFixed(1)+' s';if(performance.now()-litAt>win)light();if(left<=0){go.hidden=false;end();}},50);};
  window.__ARC={cells,get lit(){return lit;},get score(){return score;},start:()=>go.onclick()};}
function loungeActs(){if(!mature())return [A('Lounge','18+ only',()=>{},{dis:'18+ only'})];return [A('Small chops platter (₦3,000)','Food & fun',()=>{if(!spend(3000,'Small chops'))return toast('Not enough money','','bad');N('food',25);N('fun',8);},{cost:3000,now:true}),
  A('Chapman (₦1,500)','Non-alcoholic',()=>{if(!spend(1500,'Chapman'))return toast('Not enough money','','bad');N('fun',6);N('bladder',-10);},{cost:1500,now:true}),
  A('Enjoy the live band','1h · fun, social',()=>startAction('Vibing at Skyline',60,{per:()=>{N('fun',0.6);N('social',0.6);N('stress',-0.3);},done:()=>{bump('lounge');addMoodlet('Great night out',8,480);}}))].concat(careerActs('entertainer','lounge'));}
function hotelActs(){const booked=S.flags.hotel===dayOf(S.t);return [A(booked?'Your room is booked tonight':'Book a room (₦15,000)','Sleep in a proper bed · AC · hot shower',()=>{if(!spend(15000,'Lakeview Hotel room'))return toast('Not enough money','','bad');S.flags.hotel=dayOf(S.t);toast('Booked','Room 214. Sleep whenever you like tonight.','good');},{cost:15000,now:true,dis:booked?'Already booked':null}),
  A('Sleep in your room','8h · full rest',()=>startAction('Sleeping at the Lakeview',480,{sleep:true,hide:true,done:()=>{addMoodlet('Hotel sleep',12,600);N('hygiene',40);}}),{dis:booked?null:'Book a room first'})];}

/* ================= MARKET, FISHING, BEACH, CAR MEET ================= */
function marketActs(){const ev=communityEvent();const off=ev&&ev.id==='market'?0.8:1;const p=n=>Math.round(n*off/50)*50;const L=[];
  L.push(A('Foodstuff for the week ('+naira(p(3500))+')','+14 servings of garri & beans'+(off<1?' · Market Day discount':''),()=>{if(!spend(p(3500),'Bwari Central Market foodstuff'))return toast('Not enough money','','bad');S.inv.garri=(S.inv.garri||0)+14;bump('market');toast('Market','Bags full. Cheaper than the kiosk.','good');},{cost:p(3500)}));
  L.push(A('Fresh fish & pepper ('+naira(p(2000))+')','Cook it at home: big meal',()=>{if(!spend(p(2000),'Market fish'))return toast('Not enough money','','bad');S.inv.fish=(S.inv.fish||[]).concat([1.2]);},{cost:p(2000)}));
  L.push(A('Fishing bait ('+naira(p(500))+')','+5 baits · better catches at the pier',()=>{if(!spend(p(500),'Fishing bait'))return toast('Not enough money','','bad');S.inv.bait=(S.inv.bait||0)+5;},{cost:p(500)}));
  const fish=S.inv.fish||[];if(fish.length){const kg=fish.reduce((a,b)=>a+b,0);L.push(A('Sell your fish ('+kg.toFixed(1)+' kg)','₦1,200 per kg',()=>{const v=Math.round(kg*1200/50)*50;S.inv.fish=[];earn(v,'Sold fish at the market');bump('fishsold');},{pay:Math.round(kg*1200/50)*50}));}
  L.push(A('Help at a stall','2h · ₦2,500 · business skill',()=>startAction('Selling at the market',120,{per:()=>{N('energy',-0.06);N('social',0.2);},done:()=>{earn(2500,'Market stall help');S.skills.business=(S.skills.business||0)+0.08;bump('shifts');}}),{pay:2500,dis:!isOpen('market')?'The market is closed':null}));
  return L.concat(bizActsAt('market'));}
const FISH=[['Tilapia',0.3,1.6,0.55],['Catfish',0.6,4.2,0.32],['Nile perch',2,12,0.08],['An old sandal',0,0,0.05]];
function fishingActs(){const best=((S.rec||{}).fish||0);return [A('Fish from the pier','30m · '+(S.inv.bait?'with bait ('+S.inv.bait+' left)':'no bait: fewer bites')+' · best '+best.toFixed(1)+' kg',()=>startAction('Fishing at the pier',30,{place:{x:LOCS.pier.x,y:0,z:LOCS.pier.z+10,r:0,pose:'stand'},per:()=>{N('stress',-0.3);N('fun',0.2);},done:()=>catchFish()}),{now:false}),
  A('Fishing leaderboard','Biggest fish in Bwari',()=>showBoard('fish','Biggest fish (kg)'),{now:true})];}
function catchFish(){const bait=S.inv.bait>0;if(bait)S.inv.bait--;const p=(bait?0.75:0.45)+(S.skills.swimming||0)*0.01;if(!chance(p)){toast('No bite','The fish are not biting. Try again.');return;}
  let r=Math.random(),pk=FISH[0];for(const f of FISH){if(r<f[3]){pk=f;break;}r-=f[3];}if(!pk[2]){toast('Hmm','You reel in… an old sandal.');bump('sandal');return;}
  const kg=Math.round((pk[1]+Math.random()*(pk[2]-pk[1])*(bait?1:0.7))*10)/10;S.inv.fish=(S.inv.fish||[]).concat([kg]);bump('fish');const rec=S.rec=S.rec||{};if(kg>(rec.fish||0)){rec.fish=kg;lbSubmit('fish',kg);toast('New record!',pk[0]+' · '+kg+' kg · your biggest yet.','good');}else toast('Fish!',pk[0]+' · '+kg+' kg. Sell it at the market or cook it at home.','good');save();}
function beachActs(){const ev=communityEvent();const party=ev&&ev.id==='beach'&&minOf(S.t)>=16*60&&minOf(S.t)<20*60;const L=[];
  L.push(A('Swim in the lake','30m · swimming skill · fun',()=>{if(minOf(S.t)<6*60||minOf(S.t)>=19*60)return toast('Lifeguard','"No swimming after dark!"','bad');startAction('Swimming',30,{per:()=>{N('energy',-0.2);N('fun',0.5);N('hygiene',-0.05);},done:()=>{skillUp('swimming',0.15);skillUp('fitness',0.04);bump('swim');if((S.skills.swimming||0)<1&&S.weather==='heavy'){toast('Lifeguard','A wave catches you and the lifeguard pulls you out. Stay close to the shore until you swim better.','bad');N('stress',10);}}});}));
  L.push(A('Sunbathe','45m · relax',()=>startAction('Sunbathing',45,{per:()=>{N('stress',-0.4);N('fun',0.3);},done:()=>addMoodlet('Beach day',8,600)})));
  L.push(A('Beach football','45m · fitness, friends',()=>startAction('Beach football',45,{per:()=>{N('energy',-0.2);N('fun',0.6);N('social',0.4);},done:()=>{skillUp('fitness',0.08);bump('football');}})));
  if(party)L.push(A('Beach party dance-off','Saturday 4 – 8 PM · win up to ₦10,000',()=>startAction('Dance-off on the sand',30,{per:()=>{N('fun',1);N('social',0.6);},done:()=>{const win=chance(0.3+(S.drip||0)*0.05);if(win){earn(10000,'Beach party dance-off');toast('Winner!','The crowd chose you. ₦10,000.','good');bump('danceoff');}else toast('So close','Second place. Next Saturday.');}})));
  return L;}
function carMeet(){const c=S.car;if(!c)return;const M=carSpec();const up=c.up||{};const score=Math.round(M.price/100000+(up.eng||0)*8+(up.rims?6:0)+(up.susp?3:0)+(c.clean===dayOf(S.t)?5:0)+(c.cond/10));
  const win=score>=24||chance(score/60);if(win){earn(20000,'Car meet: best in show');S.rep=(S.rep||0)+3;toast('Best in show!','Everyone wants a photo with your '+fx(c.n)+'. ₦20,000 prize.','good');bump('carmeetwin');}
  else{S.rep=(S.rep||0)+1;toast('Car meet','People like your '+fx(c.n)+'. Score '+score+'. Upgrade and wash it to win.');}bump('carmeet');lbSubmit('carmeet',score);}

/* ================= VEHICLES: bicycles, motorcycles, new cars, upgrades ================= */
Object.assign(CARS,{bicycle:{n:'City bicycle',price:45000,top:7.5,acc:4,tank:1,col:0x2b6fd9,nofuel:true},okada:{n:'Bajaj motorcycle',price:420000,top:17,acc:8.5,tank:12,col:0xd23b2b},
  pickup:{n:'Pickup truck (2018)',price:4200000,top:17.5,acc:6.5,tank:70,col:0xe8e2d0},sedan2:{n:'New saloon (2024)',price:6500000,top:20,acc:8,tank:50,col:0x9a9a9a},sport:{n:'Sports coupe',price:18000000,top:26,acc:11,tank:55,col:0xc62b2b}});
VPROF.moto={L:2.1,W:0.8};
{const _cs=carSpec;carSpec=function(){const M=_cs.apply(this,arguments);const up=(S.car&&S.car.up)||{};
  if(S.car&&S.car.model==='bicycle'&&S.skills.cycling)return Object.assign({},M,{top:M.top*(1+0.03*S.skills.cycling),acc:M.acc*(1+0.03*S.skills.cycling)});
  if(!up.eng&&!up.susp)return M;return Object.assign({},M,{top:M.top*(1+0.06*(up.eng||0)),acc:M.acc*(1+0.1*(up.eng||0))});};}
function twoWheeler(kind,col){const g=new THREE.Group(),b=new THREE.Group();g.add(b);const wheels=[];const sc=kind==='bicycle'?1:1.15;
  [[0.62,true],[-0.62,false]].forEach(([z,front])=>{const st=new THREE.Group();st.position.set(0,0.34*sc,z*sc);b.add(st);const spin=new THREE.Group();st.add(spin);const t=new THREE.Mesh(new THREE.TorusGeometry(0.3*sc,0.05*sc,6,16),VLIGHT.tyre);t.rotation.y=Math.PI/2;spin.add(t);
    const hub=part(G.cyl,0x888888,0.06*sc,0.12*sc,0.06*sc,0,0,0,spin,false);hub.rotation.z=Math.PI/2;wheels.push({spin,st,r:0.33*sc,front});});
  if(kind==='bicycle'){part(G.box,col,0.06,0.06,1.1,0,0.62,0,b);part(G.box,col,0.06,0.5,0.06,0,0.55,-0.2,b);part(G.box,0x111111,0.22,0.06,0.3,0,0.85,-0.22,b);part(G.box,0x444444,0.5,0.04,0.04,0,1.0,0.55,b);part(G.box,col,0.05,0.4,0.05,0,0.8,0.55,b);}
  else{part(G.box,col,0.36,0.32,0.95,0,0.72,0.05,b);part(G.box,0x111111,0.3,0.12,0.6,0,0.92,-0.3,b);part(G.box,0x333333,0.08,0.45,0.08,0,0.95,0.58,b);part(G.box,0x444444,0.6,0.05,0.05,0,1.18,0.58,b);part(G.box,0xf4f1e2,0.18,0.14,0.08,0,1.05,0.66,b,false).material=VLIGHT.head;part(G.box,0x222222,0.12,0.12,0.5,0.12,0.42,-0.35,b);}
  const V={g,b,kind:'moto',wheels,doors:{}};g.userData.V=V;outdoor.add(g);return g;}
{const _bm=buildMyCar;buildMyCar=function(){const r=_bm.apply(this,arguments);try{const c=S&&S.car;if(!c||!myCarG)return r;const M=c.model;let rep=null;
    if(M==='bicycle'||M==='okada')rep=twoWheeler(M,c.col);else if(M==='pickup'){const V=buildVehicle('pickup',c.col);V.g.userData.V=V;rep=V.g;}else if(M==='sport'){const V=buildVehicle('sedan',c.col,{plate:'BWR 1'});V.g.userData.V=V;V.g.scale.set(V.g.scale.x*1.04,V.g.scale.y*0.88,V.g.scale.z*1.04);rep=V.g;}
    if(rep){outdoor.remove(myCarG);const i=pickables.indexOf(myCarG);if(i>=0)pickables.splice(i,1);myCarG=rep;myCarG.userData.myCar=true;outdoor.add(myCarG);pickables.push(myCarG);placeMyCar();}
    paintRims();}catch(e){console.error(e);}return r;};}
function paintRims(){const c=S.car,up=c&&c.up;if(!myCarG||!up||!up.rims)return;const col={chrome:0xe6e9ee,black:0x1b1b1b,gold:0xd4a62a}[up.rims];myCarG.traverse(o=>{if(o.isMesh&&o.material===VLIGHT.rim){o.material=VLIGHT.rim.clone();o.material.color.setHex(col);}});}
/* a bicycle needs no fuel */
{const _ud=updateDrive;updateDrive=function(dt){const c=S&&S.car;if(c&&CARS[c.model]&&CARS[c.model].nofuel)c.fuel=1;const before=c?c.cond:0;const r=_ud.apply(this,arguments);
  /* skilled drivers (and sport suspension) take less damage in a bump */
  if(c&&S.car===c&&c.cond<before){const save2=Math.min(0.6,(S.skills.driving||0)*0.06+((c.up&&c.up.susp)?0.2:0));c.cond=Math.min(before,c.cond+(before-c.cond)*save2);}return r;};}
{const _ec=enterCar;enterCar=function(){const c=S&&S.car;if(c&&CARS[c.model]&&CARS[c.model].nofuel)c.fuel=1;return _ec.apply(this,arguments);};}
function vehValue(c){const M=CARS[c.model]||CARS.saloon;const up=c.up||{};return Math.round((M.price*0.55*c.cond/100+(up.eng||0)*60000+(up.rims?20000:0))/1000)*1000;}
function dealerCityActs(){const L=[];const cur=S.car&&!S.car.stolen?S.car:null;const trade=cur?vehValue(cur)-(S.carLoan?S.carLoan.weekly*S.carLoan.left:0):0;const disc=crank('dealer')>=4?0.9:1;
  ['bicycle','okada','hatch','saloon','jeep','pickup','sedan2','sport'].forEach(id=>{const M=CARS[id];const price=Math.round(M.price*disc/1000)*1000;const pay=Math.max(0,price-Math.max(0,trade));
    L.push(A('Buy '+M.n,(M.nofuel?'No fuel needed':'Top speed '+Math.round(M.top*3.6)+' km/h')+(cur?' · trade in your '+fx(cur.n)+' ('+naira(Math.max(0,trade))+')':'')+(disc<1?' · mogul price':''),()=>{if(!spend(pay,'Bought '+M.n+(cur?' (trade-in)':'')))return toast('Not enough money','You need '+naira(pay)+'.','bad');
      if(cur){carDyn(false);S.car=null;S.carLoan=null;}giveCar(id,null,M.col,-80,391,Math.PI,M.nofuel?1:8);bump('vehicles');celebrate('New wheels!',M.n+' · parked at Express Motors');checkGoals();save();},{cost:pay,dis:S.carLoan&&cur?'Finish your hire purchase first':null}));});
  if(cur)L.push(A('Sell your '+fx(cur.n),'They pay '+naira(Math.max(0,trade)),()=>{carDyn(false);S.car=null;buildMyCar();if(trade>0)earn(trade,'Sold your vehicle');else if(trade<0)charge(-trade,'Loan settlement');S.carLoan=null;toast('Sold','Done.');save();},{}));
  return L.concat(careerActs('dealer','express'));}
/* vehicle dealer career: flip used cars (buy, fix, sell a day later) */
function dealerFlipActs(){const r=crank('dealer');const f=S.flip;const L=[];
  if(!f){const cost=Math.round((180000+r*60000)/1000)*1000;L.push(A('Buy a used car at auction','Pay '+naira(cost)+' · sell it tomorrow for a profit (usually)',()=>{if(!spend(cost,'Auction car'))return toast('Not enough money','','bad');S.flip={cost,day:dayOf(S.t),fixed:false};cxp('dealer',6);bump('flips');toast('Auction','You got a dusty Corolla. Fix it up at Mama Pat\'s, then sell it here tomorrow.','good');save();},{cost}));}
  else{if(!f.fixed)L.push(A('Fix the auction car (₦40,000)','Raises the selling price',()=>{if(!spend(40000,'Fixing auction car'))return toast('Not enough money','','bad');f.fixed=true;toast('Fixed','It shines now.','good');},{cost:40000}));
    L.push(A('Sell the auction car','Ready from Day '+(f.day+1),()=>{const base=f.cost*(f.fixed?1.45:1.12)*(1+r*0.06);const price=Math.round(base*rnd(0.85,1.15)/1000)*1000;earn(price,'Sold auction car');const prof=price-f.cost-(f.fixed?40000:0);S.flip=null;cxp('dealer',prof>0?16:6);const c=car4('dealer');c.shifts++;c.earned+=Math.max(0,prof);bump('shifts');toast(prof>0?'Profit':'Loss',(prof>0?'+':'')+naira(prof)+' on that car.',prof>0?'good':'bad');save();},{dis:dayOf(S.t)<=f.day?'Wait until tomorrow':null}));}
  return L;}
function mechActs(){const c=S.car;const near=c&&Math.hypot(c.x-LOCS.mech.x,c.z-LOCS.mech.z)<30;const d=crank('mechanic')>=1?0.7:1;const pr=n=>Math.round(n*d/500)*500;const L=[];
  if(c){const up=c.up=c.up||{};const why=!near?'Drive your vehicle into the yard first':null;
    const rc=pr(Math.round((100-c.cond)*120/100)*100);L.push(A('Repair ('+naira(rc)+')','Condition '+Math.round(c.cond)+'% → 100%',()=>{if(!spend(rc,'Repairs at Mama Pat'))return toast('Not enough money','','bad');c.cond=100;toast('Repaired','"E don set."','good');},{cost:rc,dis:why||(c.cond>=99?'It is in good shape':null)}));
    L.push(A('Car wash ('+naira(2000)+')','Shine + drip for the day',()=>{if(!spend(2000,'Car wash'))return toast('Not enough money','','bad');c.clean=dayOf(S.t);c.cond=Math.min(100,c.cond+1);addMoodlet('Clean ride',5,720);bump('wash');toast('Washed','It sparkles.','good');},{cost:2000,dis:why}));
    if(!CARS[c.model].nofuel){const st=(up.eng||0);if(st<3){const cost=pr([90000,200000,380000][st]);L.push(A('Engine tune, stage '+(st+1)+' ('+naira(cost)+')','+6% top speed, +10% acceleration',()=>{if(!spend(cost,'Engine tune stage '+(st+1)))return toast('Not enough money','','bad');up.eng=st+1;bump('upgrades');toast('Tuned','Stage '+(st+1)+'. Feel the pull.','good');save();},{cost,dis:why}));}
      if(!up.susp){const cost=pr(65000);L.push(A('Sport suspension ('+naira(cost)+')','Smoother on rough ground, fewer dents',()=>{if(!spend(cost,'Suspension'))return toast('Not enough money','','bad');up.susp=1;bump('upgrades');toast('Suspension','Rides like silk.','good');save();},{cost,dis:why}));}
      ['chrome','black','gold'].forEach(r=>{if(up.rims===r)return;const cost=pr(r==='gold'?90000:50000);L.push(A(r[0].toUpperCase()+r.slice(1)+' rims ('+naira(cost)+')','Looks · car meet points',()=>{if(!spend(cost,r+' rims'))return toast('Not enough money','','bad');up.rims=r;buildMyCar();carDyn(true);bump('upgrades');toast('Rims',r+' rims fitted.','good');save();},{cost,dis:why}));});}
    [['White',0xe8e2d0],['Black',0x1b1b1b],['Red',0xc62b2b],['Blue',0x2b4f8a],['Green',0x2f6b3e],['Gold',0xc9971c],['Silver',0x9a9a9a]].forEach(([n,col])=>{if(c.col===col)return;const cost=pr(35000);L.push(A('Paint it '+n.toLowerCase()+' ('+naira(cost)+')','New colour',()=>{if(!spend(cost,'Paint job'))return toast('Not enough money','','bad');c.col=col;carDyn(false);buildMyCar();carDyn(true);bump('paint');toast('Painted',n+'. Fresh.','good');save();},{cost,dis:why}));});}
  else L.push(A('No vehicle yet','Buy one at Express Motors next door',()=>{},{dis:'No vehicle'}));
  return L.concat(careerActs('mechanic','mech')).concat(bizActsAt('mech'));}
function cityFuelActs(){const L=[];const c=S.car;const near=c&&Math.hypot(c.x-LOCS.cfuel.x,c.z-LOCS.cfuel.z)<20;
  if(c&&!CARS[c.model].nofuel){const M=carSpec();const need=Math.max(0,M.tank-c.fuel);const full=Math.round(need*FUEL_PRICE/50)*50;
    L.push(A('Fill the tank ('+need.toFixed(1)+' L)','₦'+FUEL_PRICE+' per litre',()=>{if(!spend(full,'Fuel ('+need.toFixed(1)+' L)'))return toast('Not enough money','','bad');c.fuel=M.tank;toast('Full tank','"Oga, e don full."','good');},{cost:full,dis:!near?'Drive into the station first':need<0.5?'Tank is already full':null}));}
  L.push(A('Jerrycan of fuel (2 L)','Carry it to your car',()=>{if(!spend(2000,'Jerrycan of fuel'))return toast('Not enough money','','bad');S.inv.jerry=(S.inv.jerry||0)+1;},{cost:2000}));
  L.push(A('Meat pie & cold drink','10m',()=>{if(!spend(700,'Meat pie & drink'))return toast('Not enough money','','bad');startAction('Snacking',10,{per:()=>N('food',2)});},{cost:700}));return L;}
function shopActs(kind){const disc=crank('shop')>=1?0.9:1;const p=n=>Math.round(n*disc/50)*50;
  if(kind==='drinks')return [A('Cold malt ('+naira(p(600))+')','Refreshing',()=>{if(!spend(p(600),'Malt'))return toast('Not enough money','','bad');N('food',4);N('fun',3);N('bladder',-8);},{cost:p(600),now:true}),A('Bottled water ('+naira(p(250))+')','Hydrate',()=>{if(!spend(p(250),'Water'))return toast('Not enough money','','bad');N('bladder',-6);N('energy',2);},{cost:p(250),now:true})];
  return [A('Groceries for a week ('+naira(p(6000))+')','+14 meals at home',()=>{if(!spend(p(6000),'MegaMart groceries'))return toast('Not enough money','','bad');S.inv.garri=(S.inv.garri||0)+14;bump('grocery');toast('MegaMart','Bags of groceries.','good');},{cost:p(6000),now:true}),
    A('Toiletries ('+naira(p(2500))+')','Hygiene drops slower for 3 days',()=>{if(!spend(p(2500),'Toiletries'))return toast('Not enough money','','bad');addMoodlet('Fresh',4,4320);N('hygiene',20);},{cost:p(2500),now:true}),
    A('Snacks ('+naira(p(1200))+')','Biscuits, chin-chin, plantain chips',()=>{if(!spend(p(1200),'Snacks'))return toast('Not enough money','','bad');N('food',15);N('fun',3);},{cost:p(1200),now:true})];}

/* ================= FURNITURE: buy at HomeStyle, keep it in storage, place it at home ================= */
DECOR.push({k:'pooltable',n:'Pool table',p:180000,c:'Living',w:2.6,d:1.5,fx:'game'},{k:'aquarium',n:'Aquarium',p:70000,c:'Decor',w:1.6,d:0.6},{k:'artwork',n:'Painting on an easel',p:25000,c:'Decor',w:1,d:0.6},{k:'homegym',n:'Home gym bench',p:95000,c:'Living',w:2,d:1,fx:'gym'});
DECOR.forEach(d=>DECOR_BY[d.k]=d);
{const _dm=decorMesh;decorMesh=function(k,col){if(!['pooltable','aquarium','artwork','homegym'].includes(k))return _dm(k,col);const g=new THREE.Group(),B=(c,sx,sy,sz,x,y,z)=>part(G.box,c,sx,sy,sz,x,y,z,g,true);
  if(k==='pooltable'){B(0x5a3d26,2.6,0.8,1.5,0,0.4,0);B(0x1f6b3e,2.3,0.06,1.2,0,0.83,0);}
  else if(k==='aquarium'){B(0x222222,1.6,0.8,0.6,0,0.4,0);const t=part(G.box,0x5aa9c9,1.5,0.8,0.5,0,1.2,0,g,false);t.material=new THREE.MeshStandardMaterial({color:0x5aa9c9,transparent:true,opacity:0.6,roughness:0.1});B(0xe3742b,0.15,0.08,0.05,0.3,1.2,0);}
  else if(k==='artwork'){B(0x5a3d26,0.06,1.8,0.06,0,0.9,-0.1);B(0xe8dcc0,1,0.8,0.05,0,1.4,0);B(0x2b6fd9,0.6,0.4,0.06,0,1.45,0.01);}
  else{B(0x222222,1.8,0.12,0.5,0,0.5,0);B(0x555555,0.08,1.4,0.08,-0.8,0.7,-0.3);B(0x555555,0.08,1.4,0.08,0.8,0.7,-0.3);B(0x999999,1.8,0.05,0.05,0,1.4,-0.3);}return g;};}
{const _da=decorActs;decorActs=function(I,it,D,sp){const L=_da.apply(this,arguments);if(D.k==='homegym')L.unshift(A('Work out','45m · strength + fitness',()=>startAction('Home workout',45,{where:I.id,place:{x:sp.x,y:0,z:sp.z,r:(it.r||0)+Math.PI,pose:'cross'},per:()=>N('energy',-0.2),done:()=>{skillUp('strength',0.12);skillUp('fitness',0.06);bump('gym');}})));
  L.push(A('Put it in storage','Take it off the floor and keep it',()=>{const list=decorList(I.id);const i=list.indexOf(it);if(i>=0)list.splice(i,1);finv()[it.k]=(finv()[it.k]||0)+1;decorBuild(I);intNav(I);save();toast('Storage',D.n+' is in your storage.');}));return L;};}
function finv(){S.finv=S.finv||{};return S.finv;}
function myHomes(){const L=[];if(S.home)L.push(S.home);if(S.ownHouse)L.push(S.ownHouse);(W3.props?W3.props.list:[]).forEach(p=>{if(p.mine)L.push(p.id);});return L;}
function furnitureActs(){const L=[];const homes=myHomes();
  DECOR.forEach(d=>L.push(A('Buy '+d.n+' ('+naira(d.p)+')','Delivered to your storage · place it with Decorate at home',()=>{if(!homes.length)return toast('No home yet','Rent a lodge or a house first, then furnish it.','bad');if(!spend(d.p,'Furniture: '+d.n))return toast('Not enough money','','bad');finv()[d.k]=(finv()[d.k]||0)+1;bump('furniture');toast('Bought',d.n+' will be in your storage at home. Use Decorate to place it.','good');save();},{cost:d.p,now:true,dis:!homes.length?'Rent or buy a home first':null})));
  return L;}
/* Decorate also works in houses you rent or own in the city, and lists what you have in storage */
{const _mh=myHomeHere;myHomeHere=function(){if(_mh())return true;const id=S&&S.inside;return !!(id&&LOCS[id]&&LOCS[id].prop&&typeof propMine==='function'&&propMine(id));};}
{const _click=bmBtn.onclick;bmBtn.onclick=function(){_click.apply(this,arguments);try{const st=Object.entries(finv()).filter(([k,n])=>n>0&&DECOR_BY[k]);if(!st.length||!UI.sheet)return;const box=$('#shB');const head=el('div','kicker2','<b style="font-size:11px;letter-spacing:.14em;color:var(--gold)">IN YOUR STORAGE · FREE TO PLACE</b>');
    const items=st.map(([k,n])=>{const d=DECOR_BY[k];const b=el('button','opt','<div class="l"><b>'+d.n+' × '+n+'</b><span>Tap, then tap the floor to place it</span></div><div class="r"><span class="p">owned</span></div>');b.onclick=()=>{closeSheet();BM.fromStore=true;bmStart({k});};return b;});
    const first=box.querySelector('.note');if(first)first.after(head,...items);else box.prepend(head,...items);}catch(e){console.error(e);}};}
bmBar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!BM.on||!BM.fromStore||BM.move)return;if(b.dataset.a==='no'){BM.fromStore=false;return;}if(b.dataset.a!=='ok')return;
  e.stopImmediatePropagation();if(!bmCheck())return;const p=BM.g.position,list=decorList(BM.I.id);const k=BM.D.k;const inv=finv();if(!(inv[k]>0)){BM.fromStore=false;return;}inv[k]--;list.push({k,x:p.x,z:p.z,r:BM.r});const I=BM.I;BM.fromStore=false;bmEnd();decorBuild(I);intNav(I);save();toast('Decorate','Placed from storage. Tap it to use it.','good');},true);

/* ================= THE MANSION (Hilltop): a bigger home with a pool, a home cinema and a gym corner ================= */
LOCS.prop8.inside='mansion';INSIDE_HINT.mansion='Grand lounge, pool, home cinema, bedroom, kitchen';
BUILD.mansion=function(I,id){shell(I,24,17,6,floorTex('#e8e0d0','#d8cfbe','tile'),0xf6f0e2,8,0x3a3a4a);I.walls.forEach(w=>{w.grp.children[0].material=w.grp.children[0].material.clone();});
  const mine=()=>propMine(id);const view=[A('Viewing','Buy it to use it',()=>{},{dis:'Owners only'})];
  const bed=new THREE.Group();bed.position.set(-8.5,0,-5.5);I.g.add(bed);part(G.box,0x3a2a1e,3,0.55,3.4,0,0.28,0,bed);part(G.box,0x7a2331,2.8,0.3,3,0,0.7,0.1,bed,false);part(G.box,0xf2efe6,2.2,0.2,0.6,0,0.9,-1.3,bed,false);
  addObj(I,bed,{id:'bed',name:'King-size bed',ly:2.6,spot:{x:-6.2,z:-4},acts:()=>mine()?[A('Sleep','8h · the best sleep in Bwari',()=>startAction('Sleeping',480,{sleep:true,where:id,place:{x:-8.5,y:0.85,z:-5.3,r:0,pose:'lie'},done:()=>addMoodlet('Slept like a king',16,720)})),A('Nap','2h',()=>startAction('Napping',120,{sleep:true,where:id,place:{x:-8.5,y:0.85,z:-5.3,r:0,pose:'lie'}}))]:view});
  const pool=new THREE.Group();pool.position.set(6,0,4);I.g.add(pool);part(G.box,0xd8d2c4,8,0.3,5,0,0.15,0,pool);const wt=part(G.box,0x4fb3d9,7.4,0.05,4.4,0,0.32,0,pool,false);wt.material=new THREE.MeshStandardMaterial({color:0x4fb3d9,roughness:0.08,metalness:0.2,transparent:true,opacity:0.85});
  addObj(I,pool,{id:'pool',name:'Swimming pool',ly:1.6,spot:{x:1.4,z:4},acts:()=>mine()?[A('Swim laps','30m · swimming + fitness',()=>startAction('Swimming in your pool',30,{where:id,per:()=>{N('fun',0.5);N('stress',-0.4);},done:()=>{skillUp('swimming',0.15);skillUp('fitness',0.05);bump('swim');}})),A('Pool party','2h · invite friends · social',()=>startAction('Pool party',120,{where:id,per:()=>{N('fun',0.8);N('social',0.8);},done:()=>{addMoodlet('Pool party',14,720);S.rep=(S.rep||0)+2;bump('poolparty');}}))]:view});
  const tv=new THREE.Group();tv.position.set(-2,0,-7.6);I.g.add(tv);part(G.box,0x111111,5,2.4,0.1,0,2.2,0,tv);const scr=part(G.box,0x223344,4.6,2.1,0.02,0,2.2,0.06,tv,false);scr.material=new THREE.MeshLambertMaterial({color:0x223344,emissive:0x2a6a9a,emissiveIntensity:0.8});
  const sofa=new THREE.Group();sofa.position.set(-2,0,-3.4);I.g.add(sofa);part(G.box,0x3a3a4a,5,0.5,1.2,0,0.35,0,sofa);part(G.box,0x3a3a4a,5,0.8,0.3,0,0.75,0.5,sofa);
  addObj(I,sofa,{id:'cinema',name:'Home cinema',ly:2.2,spot:{x:-2,z:-1.8},acts:()=>mine()?[A('Movie night','2h · fun',()=>startAction('Movie night at home',120,{where:id,place:{x:-2,y:0.2,z:-3.2,r:Math.PI,pose:'sit'},per:()=>{N('fun',0.6);N('stress',-0.3);},done:()=>bump('movies')}))]:view});
  const kit=new THREE.Group();kit.position.set(9.5,0,-6.6);I.g.add(kit);part(G.box,0xe8e2d0,4,1,0.9,0,0.5,0,kit);part(G.box,0x222222,1,0.06,0.7,-1,1.03,0,kit,false);part(G.box,0xd8d8d8,1,2,0.8,1.6,1,0,kit);
  addObj(I,kit,{id:'kitchen',name:'Kitchen',ly:2.6,spot:{x:9,z:-5},acts:()=>mine()?[A('Cook a feast (₦4,000)','45m · big meal · mood',()=>{if(!spend(4000,'Groceries'))return toast('Not enough money','','bad');startAction('Cooking',45,{where:id,per:()=>N('food',1.8),done:()=>addMoodlet('Home-cooked feast',10,600)});},{cost:4000})]:view});
  const bath=new THREE.Group();bath.position.set(10.6,0,1);I.g.add(bath);part(G.box,0xf6f8f8,1.4,0.6,2.4,0,0.3,0,bath);
  addObj(I,bath,{id:'bath',name:'Bathroom',ly:2.2,spot:{x:9,z:1},acts:()=>mine()?[A('Bath','15 min · hygiene full',()=>wcAct('Bath at home',15,{hygiene:100,stress:-12})),A('Toilet','3 min',()=>wcAct('Toilet · at home',3,{bladder:100}))]:view});
  poster(I,0,-6,4.2,[['HILLTOP','800 30px Georgia'],['Built from the hustle','italic 20px Georgia']],'#3a3a4a','#e3b04b',4,1.4);
  I.populate=()=>{resetInt(I);};};

/* ================= BUSINESSES (one owner each, kept on the server) =================
   Buy a business, keep it stocked, hire staff and upgrade it. Customers buy every day on the shared calendar;
   the server works out each day's sales from stock, staff and level, pays wages, and holds the takings until
   you collect them. Buying, upgrades, staff and stock are charged by the server (one owner, no double-charging). */
const BIZ_INFO={biz1:{at:'market',icon:'🍢'},biz2:{at:'megamart',icon:'🛒'},biz3:{at:'fashion',icon:'👗'},biz4:{at:'salon',icon:'💈'},biz5:{at:'mech',icon:'🚿'},biz6:{at:'lounge',icon:'🎷'},biz7:{at:'depot',icon:'📦'}};
const B4={list:null,at:0,pend:{}};
function bizFetch(){if(!wsend({t:'biz_list'}))B4.list=null;}
function bizMine(){return (B4.list||[]).filter(b=>b.mine);}
onNet(m=>{if(m.t==='biz_list'){B4.list=m.list;B4.at=Date.now();if(UI.phone&&phoneView==='biz4')renderPhone();}
  else if(m.t==='biz_res'){if(typeof closeSending==='function')closeSending();const P0=B4.pend[m.ref];delete B4.pend[m.ref];
    if(m.ok){if(m.amount&&m.ref)applyCharge(m.ref,m.amount,m.label||'Business');if(m.collected){S.txApplied=S.txApplied||{};if(!S.txApplied[m.ref]){S.txApplied[m.ref]=Date.now();earn(m.collected,'Takings from '+m.name);bump('bizcollect');}}
      toast(m.name||'Business',m.msg||'Done.','good');bump('biz_'+m.kind);checkGoals();save();}else toast('Business',m.reason||'Try again.','bad');bizFetch();}});
HOOKS.boot.push(()=>setTimeout(bizFetch,4000));HOOKS.day.push(()=>bizFetch());
function bizCall(t,b,extra){const ref=newRef('b');B4.pend[ref]=1;wsendPaid(Object.assign({t,id:b.id,ref,bal:S.money},extra||{}));}
function bizActsAt(loc){if(!net())return [];if(!B4.list){bizFetch();return [];}return B4.list.filter(b=>BIZ_INFO[b.id]&&BIZ_INFO[b.id].at===loc).map(b=>b.mine?A('Your business: '+b.name,'Takings waiting '+naira(b.bank)+' · stock '+b.stock+' · staff '+b.staff+' · level '+b.level,()=>{openPhone();setPhone('biz4');},{now:true}):
  b.owner?A(b.name,'Owned by '+esc(b.ownerName),()=>{},{dis:'Owned by '+b.ownerName}):A('Buy the business: '+b.name+' ('+naira(b.price)+')','Earns every day on the shared calendar',()=>{if(S.money<b.price)return toast('Not enough money','You need '+naira(b.price)+'.','bad');dialog({who:'me',kicker:'Buy '+b.name,text:'Pay <b>'+naira(b.price)+'</b>? It comes with '+b.stock+' units of stock and no staff. Hire staff and keep it stocked so it sells every day.',choices:[{t:'Buy it',fn:()=>{bizCall('biz_buy',b);return 'Sending the payment…';}},{t:'Cancel',fn:()=>null}]});},{cost:b.price}));}
HOOKS.apps.push(()=>[['biz4','Business','#5a3a6b','◆']]);
HOOKS.views.biz4=(b,T)=>{T.textContent='Businesses';if(!net()){b.append(el('div','note','Businesses are part of the online game.'));return;}const L=B4.list;if(!L){b.append(el('div','note','Loading…'));bizFetch();return;}
  b.append(el('div','note','Each business sells every day on the shared calendar: sales = what customers want (more with a higher level and more staff) but never more than your stock. Staff cost ₦5,000 a day each. Collect the takings any time.'));
  L.forEach(x=>{const c=el('div','bgcard','<b>'+(BIZ_INFO[x.id]?BIZ_INFO[x.id].icon+' ':'')+esc(x.name)+'</b><div class="note">'+fx(LOCS[BIZ_INFO[x.id].at].name)+' · price '+naira(x.price)+'<br>'+(x.mine?'<b style="color:var(--good)">Yours</b> · level '+x.level+' · staff '+x.staff+' · stock '+x.stock+' · sells about '+x.demand+'/day · margin '+naira(x.margin)+' each<br>Takings waiting: <b>'+naira(x.bank)+'</b>'+(x.lastDays?' · last '+x.lastDays+' day(s): sold '+x.lastSold:''):x.owner?'Owned by '+esc(x.ownerName):'For sale')+'</div>');
    const row=el('div','btnrow');const bt=(t,fn,dis)=>{const k=el('button',null,t);if(dis){k.disabled=true;k.title=dis;}k.onclick=fn;row.append(k);};
    if(x.mine){bt('Collect '+naira(x.bank),()=>bizCall('biz_collect',x),x.bank<=0?'Nothing to collect':null);bt('Restock 50 ('+naira(x.unitCost*50)+')',()=>bizCall('biz_stock',x,{units:50}),S.money<x.unitCost*50?'Not enough money':null);
      bt('Hire staff (+1)',()=>bizCall('biz_staff',x,{n:x.staff+1}),x.staff>=5?'Max 5 staff':null);if(x.staff>0)bt('Let one go',()=>bizCall('biz_staff',x,{n:x.staff-1}));
      if(x.level<5)bt('Upgrade ('+naira(x.upCost)+')',()=>bizCall('biz_up',x),S.money<x.upCost?'Not enough money':null);}
    else if(!x.owner)bt('Go and see it',()=>{closePhone();goTo(BIZ_INFO[x.id].at,'walk');});
    c.append(row);b.append(c);});};

/* ================= LEADERBOARDS (server) ================= */
const LB={};
function lbSubmit(k,v){wsend({t:'lb_set',k,v});}
function showBoard(k,title){LB.want=k;LB.title=title;wsend({t:'lb_get',k});if(!net())return toast('Leaderboard','Leaderboards need the online game.');}
onNet(m=>{if(m.t!=='lb')return;LB[m.k]=m.list;if(LB.want===m.k){LB.want=null;const wrap=el('div');wrap.style.display='grid';wrap.style.gap='6px';if(!m.list.length)wrap.append(el('div','note','No scores yet. Be the first.'));
  m.list.forEach((r,i)=>wrap.append(el('div','txrow','<div>'+(i+1)+'. '+esc(r.name)+(r.me?' (you)':'')+'</div><div class="amt">'+(Math.round(r.v*10)/10)+'</div>')));openSheet(LB.title||'Leaderboard','Bwari · all players',wrap);}});
HOOKS.day.push(()=>{if(!S)return;const net2=S.money+bk().bal;lbSubmit('net',net2);lbSubmit('ach',Object.keys(S.ach||{}).length);});

/* ================= EVENTS: the community calendar and player-hosted events ================= */
const CEV=[{id:'market',n:'Market Day',d:'Foodstuff is 20% cheaper at Bwari Central Market',loc:'market'},{id:'gymday',n:'Gym Challenge',d:'Double skill gains at Iron Paradise',loc:'gym'},
  {id:'jollof',n:'Jollof Festival',d:'Free jollof at Gardens Park, 12 – 4 PM',loc:'cpark'},{id:'carmeet',n:'Car Meet',d:'Show your car at the Nightlife Car Park, 8 PM – midnight',loc:'clubpark'},
  {id:'beach',n:'Lakeside Beach Party',d:'Dance-off on the sand, 4 – 8 PM, ₦10,000 prize',loc:'beach'},{id:'league',n:'Weekend League',d:'5-a-side at the Lakeside Pitch: win ₦5,000',loc:'pitch'},{id:'quiet',n:'Sunday rest',d:'Shops open late, the city is calm',loc:null}];
function communityEvent(){const w=wd(S.t);return [CEV[0],null,CEV[1],null,CEV[3],CEV[4],CEV[2]][w]||null;}
function festival(){const ud=uDayNow();return ud%30<4?{n:'Bwari Carnival week',d:'Masquerades, music and double XP on every job shift'}:null;}
{const _cx=cxp;cxp=function(k,n){return _cx(k,festival()&&n>0?n*2:n);};}
const EV4={list:null};
function evFetch(){if(!wsend({t:'ev_list'}))EV4.list=null;}
onNet(m=>{if(m.t==='ev_list'){EV4.list=m.list;if(UI.phone&&phoneView==='events4')renderPhone();}else if(m.t==='ev_res'){toast('Event',m.ok?m.msg:m.reason,m.ok?'good':'bad');if(m.ok&&m.reward){S.txApplied=S.txApplied||{};if(!S.txApplied[m.ref]){S.txApplied[m.ref]=1;earn(m.reward,'Event reward');}}evFetch();}});
function hostEvent(where){if(!net())return toast('Events','Hosting needs the online game.');const L=LOCS[where];dialog({who:'me',kicker:'Host an event at '+L.name,text:'Pay ₦20,000 to book '+fx(L.name)+' for tonight from 8 PM to midnight. Every player sees it in Events; each guest who turns up earns you ₦2,000 (paid by the venue).',choices:[
  {t:'Book it',fn:()=>{const ref=newRef('e');wsendPaid({t:'ev_host',place:where,title:S.name+'\'s night at '+L.name,ref,bal:S.money,price:20000});return 'Booking…';}},{t:'Cancel',fn:()=>null}]});}
onNet(m=>{if(m.t==='ev_host_res'){if(m.ok){applyCharge(m.ref,20000,'Event booking');toast('Booked','Your event is on the calendar. Players will see it.','good');bump('hosted');}else toast('Events',m.reason,'bad');evFetch();}});
HOOKS.boot.push(()=>setTimeout(evFetch,5000));
HOOKS.apps.push(()=>[['events4','Events','#7a1f4a','✦']]);
HOOKS.views.events4=(b,T)=>{T.textContent='Events in Bwari';const ev=communityEvent(),fe=festival();
  if(fe)b.append(el('div','bgcard','<b>🎭 '+fe.n+'</b><div class="note">'+fe.d+'</div>'));
  b.append(el('div','bgcard','<b>Today: '+(ev?ev.n:'No city event today')+'</b><div class="note">'+(ev?ev.d:'Check tomorrow')+'</div>'));
  b.append(el('div','sec','This week'));['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach((d,i)=>{const e=[CEV[0],null,CEV[1],null,CEV[3],CEV[4],CEV[2]][i];b.append(el('div','txrow','<div><b>'+d+'</b> · '+(e?e.n:'—')+'<span>'+(e?e.d:'')+'</span></div>'));});
  b.append(el('div','sec','Hosted by players'));if(!net())b.append(el('div','note','Online only.'));else if(!EV4.list){b.append(el('div','note','Loading…'));evFetch();}else{if(!EV4.list.length)b.append(el('div','note','No player events today. Entertainers (rank 4+) can host one at the lounge or the club.'));
    EV4.list.forEach(e=>{const r=el('div','txrow','<div><b>'+esc(e.title)+'</b><span>'+fx(LOCS[e.place]?LOCS[e.place].name:e.place)+' · 8 PM – midnight · '+e.guests+' guests</span></div>');b.append(r);const br=el('div','btnrow');const x=el('button',null,e.mine?'Your event':'I\'m here (check in)');x.disabled=e.mine||e.joined;x.onclick=()=>{const L=LOCS[e.place];if(!L||Math.hypot(P.x-L.door.x,P.z-L.door.z)>25&&S.inside!==e.place)return toast('Event','Go to '+fx(L.name)+' to check in.','bad');const h=minOf(S.t)/60;if(h<20)return toast('Event','It starts at 8 PM.');wsend({t:'ev_join',id:e.id,ref:newRef('j')});};br.append(x);b.append(br);});}};

/* ================= MISSIONS: a story in any order, side jobs for people, collectibles, achievements ================= */
function myProps(){return (W3.props?W3.props.list:[]).filter(p=>p.mine);}
const STORY4=[
  {id:'m1',t:'Welcome to Bwari City',d:'Take the Expressway south from the Junction and reach the Central Business District.',ok:()=>!!S.flags.cbdSeen,loc:'bank',rw:[5000,30]},
  {id:'m2',t:'Get a city job',d:'Get hired anywhere in the city. The Jobs app shows every employer.',ok:()=>Object.keys(S.career||{}).length>0,loc:'depot',rw:[5000,40]},
  {id:'m3',t:'Hustle hard',d:'Finish 5 shifts, deliveries or rides.',ok:()=>(cnt().shifts||0)>=5,rw:[10000,50]},
  {id:'m4',t:'Bank it',d:'Keep ₦20,000 in a Unity Trust account.',ok:()=>bk().bal>=20000,loc:'bank',rw:[5000,30]},
  {id:'m5',t:'Wheels',d:'Own a bicycle, motorcycle or car.',ok:()=>!!S.car||(S.garage||[]).length>0,loc:'express',rw:[15000,60]},
  {id:'m6',t:'Fit for it',d:'Reach fitness level 2 (gym, jogging, sport).',ok:()=>(S.skills.fitness||0)>=2,loc:'gym',rw:[8000,40]},
  {id:'m7',t:'A place of your own',d:'Rent or buy a house in the city or at the Junction.',ok:()=>myProps().length>0||!!S.ownHouse,rw:[20000,80]},
  {id:'m8',t:'Boss moves',d:'Buy a business.',ok:()=>bizMine().length>0,rw:[50000,120]},
  {id:'m9',t:'Make it home',d:'Place 4 pieces of furniture in a home you own or rent.',ok:()=>Object.values(S.decor||{}).some(l=>l.length>=4),loc:'furni',rw:[15000,60]},
  {id:'m10',t:'Hilltop',d:'Buy the Hilltop Mansion in Kubwa Gardens.',ok:()=>myProps().some(p=>p.id==='prop8'&&p.mine==='owner'),loc:'prop8',rw:[250000,300]}];
const SIDE4=[{id:'oil',t:'Mama Pat needs engine oil',d:'Buy groceries at MegaMart (she needs a bottle of oil from there), then bring it to Mama Pat Garage.',a:'megamart',b:'mech',rw:6000},
  {id:'suya',t:'Suya for the hotel manager',d:'Pick up an order at Suya Republic and take it to the Lakeview Hotel reception.',a:'suyarep',b:'hotel',rw:5000},
  {id:'phone',t:'Ifeoma lost her phone',d:'She thinks she left it in Gardens Park. Go and search, then return it at Palm Court Studio.',a:'cpark',b:'prop7',rw:7000,search:true},
  {id:'files',t:'Files for the Business Hub',d:'Collect a folder at Unity Trust Bank and take it to the Bwari Business Hub.',a:'bank',b:'hub',rw:5500},
  {id:'meds',t:'Medicine for Mama Ngozi',d:'Buy her prescription at the hospital pharmacy and take it to her kiosk on campus.',a:'hospital',b:'kiosk',rw:6500},
  {id:'ball',t:'A ball for the school team',d:'Pick up a football at the market and drop it at Kubwa Model Primary.',a:'market',b:'cschool',rw:4500}];
function sideToday(){const ud=uDayNow();return [SIDE4[ud%SIDE4.length],SIDE4[(ud*3+1)%SIDE4.length]].filter((x,i,a)=>a.indexOf(x)===i);}
function msn(){S.msn=S.msn||{done:{},side:null,sideDone:{}};return S.msn;}
function sideStart(q){const M=msn();if(M.side)return toast('Side job','Finish "'+M.side.t+'" first.');M.side={id:q.id,t:q.t,stage:'a',day:uDayNow()};toast('Side job',q.t+': go to '+fx(LOCS[q.a].name)+'.','good');save();}
HOOKS.frame.push(()=>{if(!S)return;const M=msn();const q=M.side&&SIDE4.find(x=>x.id===M.side.id);if(!q){markerAt(null,0,'side');return;}const id=M.side.stage==='a'?q.a:q.b;const L=LOCS[id];if(!L){M.side=null;return;}
  markerAt(S.inside?null:L.door,0x2b6fd9,'side');const at=S.inside===id||(S.at===id&&!S.inside)||Math.hypot(P.x-L.door.x,P.z-L.door.z)<4;if(!at||busy()||ACT)return;
  if(M.side.stage==='a'){if(q.search){startAction('Searching the park',20,{done:()=>{toast('Found it','A cracked phone under a bench. Take it to '+fx(LOCS[q.b].name)+'.','good');}});}else toast('Got it','Now take it to '+fx(LOCS[q.b].name)+'.','good');M.side.stage='b';}
  else{earn(q.rw,'Side job: '+q.t);xp(20,'Side job');bump('sides');M.sideDone[q.id+'@'+M.side.day]=1;M.side=null;markerAt(null,0,'side');celebrate('Side job done',q.t+' · +'+naira(q.rw));save();}});
/* story progress is checked every game minute; finishing a mission pays its reward once */
HOOKS.minute.push(()=>{if(!S||S.intro)return;if(P.z>300&&P.z<380)S.flags.cbdSeen=1;const M=msn();STORY4.forEach(m=>{if(M.done[m.id])return;let ok=false;try{ok=m.ok();}catch(e){}if(ok){M.done[m.id]=dayOf(S.t);earn(m.rw[0],'Mission: '+m.t);xp(m.rw[1],'Mission');bump('missions');celebrate('Mission complete',m.t+' · +'+naira(m.rw[0]));save();}});});
/* ---- 20 gold kola nuts hidden around Bwari: pick one up by walking (or driving) over it ---- */
const KOLA=[[-95,-95],[95,-98],[-100,95],[80,-30],[-30,-80],[108,148],[-108,190],[45,190],[-128,250],[128,226],[60,296],[-40,296],[128,350],[-128,372],[-60,452],[100,456],[0,515],[-120,520],[120,526],[-40,575]];
const KG={g:null,meshes:[]};
function kolaBuild(){if(KG.g)return;KG.g=new THREE.Group();outdoor.add(KG.g);const m=new THREE.MeshLambertMaterial({color:0xe3b04b,emissive:0x8a5a10,emissiveIntensity:0.6});
  KOLA.forEach(([x,z],i)=>{const g=new THREE.Group();g.position.set(x,0,z);const k=part(G.sph,0xe3b04b,0.35,0.42,0.35,0,0.9,0,g,false);k.material=m;const r=new THREE.Mesh(new THREE.RingGeometry(0.5,0.7,20),new THREE.MeshBasicMaterial({color:0xe3b04b,transparent:true,opacity:0.6,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.y=0.05;g.add(r);KG.g.add(g);KG.meshes[i]=g;});}
HOOKS.boot.push(()=>{kolaBuild();S.kola=S.kola||{};KG.meshes.forEach((g,i)=>g.visible=!S.kola[i]);});
HOOKS.frame.push((dt,now)=>{if(!S||S.inside||!KG.g)return;const here=W.drive&&S.car?{x:S.car.x,z:S.car.z}:{x:P.x,z:P.z};S.kola=S.kola||{};
  KG.meshes.forEach((g,i)=>{if(!g.visible)return;g.children[0].rotation.y+=dt*2;g.children[0].position.y=0.9+Math.sin(now/400+i)*0.15;if(Math.abs(g.position.x-here.x)<2.4&&Math.abs(g.position.z-here.z)<2.4){g.visible=false;S.kola[i]=1;const n=Object.keys(S.kola).length;earn(2000,'Gold kola nut');bump('kola');sfx('fanfare');
    if(n===20){S.flags.kola20=1;celebrate('All 20 gold kola nuts!','The Golden agbada is yours. Find it in your Wardrobe.');S.outfits=(S.outfits||[]).concat('golden');}else toast('Gold kola nut','You found one! '+n+' of 20. +₦2,000','good');save();}});});
/* ---- achievements: checked once a game minute, each pays once ---- */
const ACH4=[['firstjob','First pay cheque','Work your first city shift, delivery or ride',()=>(cnt().shifts||0)>=1,2000],['promo','Promoted','Reach the second rank in any career',()=>Object.keys(S.career||{}).some(k=>crank(k)>=1),5000],
  ['boss','The boss','Reach the top rank in a career',()=>Object.keys(S.career||{}).some(k=>crank(k)>=4),50000],['deliv10','Ten parcels','Make 10 deliveries',()=>(cnt().deliveries||0)>=10,8000],['rides10','Ten fares','Drive 10 Gidi Ride fares',()=>(cnt().rides||0)>=10,8000],
  ['wheels','Wheels','Own a vehicle',()=>!!S.car,3000],['tuned','Tuned','Fit an engine tune',()=>!!(S.car&&S.car.up&&S.car.up.eng),5000],['house','Keys','Rent or own a house',()=>myProps().length>0,10000],
  ['mansion','Hilltop','Own the Hilltop Mansion',()=>myProps().some(p=>p.id==='prop8'&&p.mine==='owner'),100000],['bizown','Business owner','Own a business',()=>bizMine().length>0,20000],['tycoon','Tycoon','Own three businesses',()=>bizMine().length>=3,100000],
  ['fit5','In shape','Fitness level 5',()=>(S.skills.fitness||0)>=5,10000],['swim3','Swimmer','Swimming level 3',()=>(S.skills.swimming||0)>=3,5000],['driver5','Road master','Driving level 5',()=>(S.skills.driving||0)>=5,10000],
  ['kola10','Kola hunter','Find 10 gold kola nuts',()=>Object.keys(S.kola||{}).length>=10,10000],['kola20','Golden','Find all 20 gold kola nuts',()=>Object.keys(S.kola||{}).length>=20,50000],
  ['fish10','Fisher','Catch 10 fish',()=>(cnt().fish||0)>=10,5000],['bigfish','The big one','Catch a fish over 6 kg',()=>((S.rec||{}).fish||0)>=6,10000],['arcade30','Arcade legend','Score 30 in Keke Dash',()=>((S.rec||{}).arcade||0)>=30,5000],
  ['movie','Movie night','Watch a movie at Starlight',()=>(cnt().movies||0)>=1,1000],['clean','Clean record','Pay off your fines',()=>(cnt().finespaid||0)>=1,2000],['saver','Saver','₦500,000 in the bank',()=>bk().bal>=500000,20000],
  ['million','Millionaire','₦1,000,000 cash and savings',()=>S.money+bk().bal>=1000000,30000],['explorer','Explorer','Visit every city district',()=>['gardens','cbd','motors','lake'].every(z=>(S.flags.zones||{})[z]),5000],
  ['host','Host','Host an event',()=>(cnt().hosted||0)>=1,10000],['meet','Best in show','Win a car meet',()=>(cnt().carmeetwin||0)>=1,10000],['missions','Story told','Finish every story mission',()=>STORY4.every(m=>msn().done[m.id]),100000]];
HOOKS.minute.push(m=>{if(!S||S.intro)return;S.ach=S.ach||{};const z=zoneAt(P.x,P.z);S.flags.zones=S.flags.zones||{};if(!S.inside)S.flags.zones[z]=1;if(m%2)return;
  ACH4.forEach(([id,t,d,ok,rw])=>{if(S.ach[id])return;let v=false;try{v=ok();}catch(e){}if(v){S.ach[id]=dayOf(S.t);earn(rw,'Achievement: '+t);xp(25,'Achievement');toast('🏆 '+t,d+' · +'+naira(rw),'good');sfx('fanfare');save();}});});
/* ---- daily and weekly challenges: the same three for everyone each day ---- */
const DCH=[['shifts',2,'Work 2 shifts, deliveries or rides'],['gym',1,'Train once (gym, jog or sport)'],['deliveries',1,'Make a delivery'],['market',1,'Shop at the market'],['fish',1,'Catch a fish'],['movies',1,'Watch a movie'],['swim',1,'Swim in the lake'],['wash',1,'Wash your car'],['kola',1,'Find a gold kola nut'],['jog',1,'Jog in Gardens Park'],['football',1,'Play football'],['sides',1,'Finish a side job']];
function dailyToday(){const ud=uDayNow();return [0,1,2].map(i=>DCH[(ud*7+i*5)%DCH.length]).filter((x,i,a)=>a.indexOf(x)===i);}
function dailyState(){const ud=uDayNow();if(!S.dc||S.dc.day!==ud){const prev=S.dc;const streak=prev&&prev.day===ud-1&&prev.done.length>=3?(prev.streak||0)+1:(prev&&prev.day===ud-1?prev.streak||0:0);S.dc={day:ud,base:Object.assign({},cnt()),done:[],streak};}return S.dc;}
HOOKS.minute.push(m=>{if(!S||S.intro||m%3)return;const D=dailyState();dailyToday().forEach(([k,n,t])=>{if(D.done.includes(k))return;if(((cnt()[k]||0)-(D.base[k]||0))>=n){D.done.push(k);const rw=3000+(D.streak||0)*500;earn(rw,'Daily challenge');xp(15,'Daily');toast('Daily challenge',t+' · +'+naira(rw),'good');if(D.done.length===dailyToday().length){earn(5000,'All daily challenges');toast('Daily sweep','All three done. +₦5,000 bonus.','good');}save();}});});

/* ================= PHONE APPS: Jobs, City (missions & more), Gidi Ride, ChowNow ================= */
HOOKS.apps.push(()=>[['jobs4','Jobs','#2f6b3e','⚒'],['city4','City','#c9971c','★'],['ride4','Gidi Ride','#f2c230','🚕'],['chow4','ChowNow','#d23b2b','🍲']]);
HOOKS.views.jobs4=(b,T)=>{T.textContent='Jobs in Bwari';if(JOB4.kind){const row=el('div','btnrow');const x=el('button',null,JOB4.kind==='taxi'?'Go offline (Gidi Ride)':'Cancel the delivery');x.onclick=()=>{stopJob(JOB4.kind==='taxi'?'You are offline.':'Parcel returned.');renderPhone();};row.append(x);b.append(el('div','note',chip.textContent||''),row);}
  Object.entries(CAREERS).forEach(([k,C])=>{const c=car4(k);const r=crank(k);const where=C.at?C.at.map(i=>fx(LOCS[i].name)).join(' / '):'Anywhere (your own car)';
    const card=el('div','bgcard','<b>'+C.n+'</b><div class="note">'+(c?'<b style="color:var(--good)">'+C.ranks[r]+'</b> · '+c.shifts+' done · earned '+naira(c.earned)+(CRANK[r+1]!=null?' · '+c.xp+'/'+CRANK[r+1]+' XP to '+C.ranks[r+1]:' · top rank'):'Where: '+where+((C.need&&C.need())?'<br>Needs: '+C.need():''))+'<br>'+C.unlock.map((u,i)=>(i<=r&&c?'✓ ':'· ')+C.ranks[i]+': '+u).join('<br>')+'</div>');
    const row=el('div','btnrow');if(k==='taxi'){const x=el('button',null,c?(JOB4.kind==='taxi'?'Online':'Go online'):'Join Gidi Ride');x.disabled=JOB4.kind==='taxi';x.onclick=()=>{closePhone();c?startRides():careerApply(k);};row.append(x);}
    else{const x=el('button',null,c?'Go to work':'Go and apply');x.onclick=()=>{closePhone();goTo(C.at[0],'walk',LOCS[C.at[0]].inside?()=>enterBuilding(C.at[0]):null);};row.append(x);}card.append(row);b.append(card);});};
HOOKS.views.city4=(b,T)=>{T.textContent='City life';const M=msn();const D=dailyState();
  b.append(el('div','sec','Daily challenges'+(D.streak?' · streak '+D.streak+' days':'')));dailyToday().forEach(([k,n,t])=>{const prog=Math.min(n,(cnt()[k]||0)-(D.base[k]||0));b.append(el('div','txrow','<div>'+(D.done.includes(k)?'✓ ':'')+t+'<span>'+prog+'/'+n+'</span></div><div class="amt">'+naira(3000+(D.streak||0)*500)+'</div>'));});
  b.append(el('div','sec','Story missions (any order)'));STORY4.forEach(m=>{const r=el('div','txrow','<div>'+(M.done[m.id]?'✓ ':'')+'<b>'+m.t+'</b><span>'+m.d+'</span></div><div class="amt">'+naira(m.rw[0])+'</div>');b.append(r);if(!M.done[m.id]&&m.loc){const br=el('div','btnrow');const x=el('button',null,'Show me where');x.onclick=()=>{closePhone();W.camHold={x:LOCS[m.loc].x,z:LOCS[m.loc].z,until:performance.now()+3500};openLoc(m.loc);};br.append(x);b.append(br);}});
  b.append(el('div','sec','Side jobs today'));sideToday().forEach(q=>{const done=M.sideDone[q.id+'@'+uDayNow()];b.append(el('div','txrow','<div>'+(done?'✓ ':'')+'<b>'+q.t+'</b><span>'+q.d+'</span></div><div class="amt">'+naira(q.rw)+'</div>'));const br=el('div','btnrow');const x=el('button',null,M.side&&M.side.id===q.id?'In progress':'Take it');x.disabled=!!done||!!M.side;x.onclick=()=>{sideStart(q);closePhone();};br.append(x);b.append(br);});
  b.append(el('div','sec','Gold kola nuts: '+Object.keys(S.kola||{}).length+' / 20'));b.append(el('div','note','Hidden all over campus, the Junction and the city. Glowing gold. +₦2,000 each; all 20 unlock the Golden agbada.'));
  const ach=S.ach||{};b.append(el('div','sec','Achievements '+Object.keys(ach).length+' / '+ACH4.length));ACH4.forEach(([id,t,d,,rw])=>b.append(el('div','txrow','<div>'+(ach[id]?'🏆 ':'· ')+'<b>'+t+'</b><span>'+d+'</span></div><div class="amt">'+naira(rw)+'</div>')));
  b.append(el('div','sec','Skills'));Object.keys(SKILL_INFO).forEach(k=>b.append(el('div','txrow','<div>'+SKILL_INFO[k]+'</div><div class="amt">'+(S.skills[k]||0).toFixed(1)+' / 10</div>')));
  const br=el('div','btnrow');[['Richest','net','Net worth'],['Achievements','ach','Most achievements'],['Arcade','arcade','Keke Dash'],['Fishing','fish','Biggest fish (kg)']].forEach(([t,k,ti])=>{const x=el('button',null,t);x.onclick=()=>{closePhone();showBoard(k,ti);};br.append(x);});b.append(el('div','sec','Leaderboards'),br);};
HOOKS.views.ride4=(b,T)=>{T.textContent='Gidi Ride';b.append(el('div','note','Call a yellow Gidi Ride taxi to any place in Bwari. You pay when you get in. The campus keke is in the Map for rides on campus.'));
  const ids=['market','megamart','bank','hub','hospital','police','express','mech','gym','cinema','amala','shawarma','suyarep','hotel','lounge','club','beach','pier','cpark','prop5','prop6','prop7','prop8','gate','autos','lodge1','lodge2','lodge3','family'].filter(i=>LOCS[i]);
  const tr=el('div','travel');ids.forEach(id=>{const x=el('button','tbtn','<b>'+fx(LOCS[id].name)+'</b><span>'+naira(taxiFare(id))+'</span>');x.disabled=!!W.ride||!!W.drive;x.onclick=()=>{closePhone();goTo(id,'taxi',LOCS[id].inside?()=>enterBuilding(id):null);};tr.append(x);});b.append(tr);};
const CHOW=[['amala','Amala & ewedu',2200,60],['shawarma','Chicken shawarma',3500,55],['suyarep','Suya & onions',2800,45],['megamart','Snack box',1800,30]];
HOOKS.views.chow4=(b,T)=>{T.textContent='ChowNow';const o=S.chow;if(o){b.append(el('div','bgcard','<b>On its way</b><div class="note">'+o.n+' · arrives about '+fmtTime(o.at%1440)+'</div>'));}
  b.append(el('div','note','Food delivered wherever you are in Bwari (not inside campus after 10 PM). ₦500 delivery fee.'));
  CHOW.forEach(([id,n,p,f])=>{const r=el('div','txrow','<div>'+n+'<span>From '+fx(LOCS[id].name)+'</span></div><div class="amt">'+naira(p+500)+'</div>');const br=el('div','btnrow');const x=el('button',null,'Order');x.disabled=!!o;x.onclick=()=>{if(!spend(p+500,'ChowNow: '+n))return toast('Not enough money','','bad');S.chow={n,food:f,at:S.t+ri(25,45)};bump('chow');toast('ChowNow','Order placed. A rider is on the way.','good');renderPhone();};br.append(x);b.append(r,br);});};
HOOKS.minute.push(()=>{if(!S||!S.chow||S.t<S.chow.at)return;const o=S.chow;if(S.inside==='boys'&&minOf(S.t)>=22*60){S.chow.at=S.t+30;return;}S.chow=null;toast('ChowNow','Your '+o.n.toLowerCase()+' is here. You eat it right away.','good');N('food',o.food);addMoodlet('Delivery food',5,300);});

/* ---- new things saved in your game ---- */
HOOKS.newState.push(st=>{st.cnt={};st.career={};st.bank={bal:0,loan:0,due:0,credit:60};st.fines=[];st.wanted=0;st.outfits=[];st.finv={};st.msn={done:{},side:null,sideDone:{}};st.kola={};st.ach={};st.rec={};});
HOOKS.migrate.push(st=>{['cnt','career','finv','kola','ach','rec'].forEach(k=>{if(!st[k])st[k]={};});if(!st.bank)st.bank={bal:0,loan:0,due:0,credit:60};if(!st.fines)st.fines=[];if(!st.outfits)st.outfits=[];if(!st.msn)st.msn={done:{},side:null,sideDone:{}};if(st.wanted==null)st.wanted=0;
  if(st.skills){['strength','stamina','swimming','driving','cycling','fitness'].forEach(k=>{if(st.skills[k]==null)st.skills[k]=0;});}});

/* ================= DRAW ONLY WHAT IS NEAR =================
   Trees, flowers, lamps, sidewalks, road paint and the city's filler are drawn as instanced meshes that
   cover the whole map. three.js decides whether to draw an instanced mesh from its one bounding sphere at
   the origin, so these were either drawn everywhere (slow) or culled wrongly (missing trees). Here each one is
   split into 160 m squares with a correct bounding sphere: the camera only draws the squares it can see. */
function chunkify(root,cell){cell=cell||128;const list=[];root.children.forEach(o=>{if(!o.isInstancedMesh||o.userData.chunk)return;const g=o.geometry;const t=(g.index?g.index.count:g.attributes.position.count)/3;if(o.count*t>=6000)list.push(o);});let made=0,removed=0;
  const m4=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),col=new THREE.Color();
  for(const im of list){const geo=im.geometry;if(!geo.boundingSphere)geo.computeBoundingSphere();const gr=geo.boundingSphere.radius,gc=geo.boundingSphere.center;const groups=new Map();
    for(let i=0;i<im.count;i++){im.getMatrixAt(i,m4);m4.decompose(p,q,sc);const k=Math.floor(p.x/cell)+','+Math.floor(p.z/cell);let g=groups.get(k);if(!g){g=[];groups.set(k,g);}g.push(i);}
    if(groups.size<2)continue;
    for(const [k,idx] of groups){const ni=new THREE.InstancedMesh(geo.clone(),im.material,idx.length);ni.castShadow=im.castShadow;ni.receiveShadow=im.receiveShadow;ni.renderOrder=im.renderOrder;if(im.customDepthMaterial)ni.customDepthMaterial=im.customDepthMaterial;ni.userData.chunk=1;ni.frustumCulled=true;/* (three.js turns culling off for instanced meshes by default) */
      const box=new THREE.Box3();idx.forEach((i,j)=>{im.getMatrixAt(i,m4);ni.setMatrixAt(j,m4);m4.decompose(p,q,sc);const r=gr*Math.max(sc.x,sc.y,sc.z);const c=gc.clone().multiply(sc).applyQuaternion(q).add(p);box.expandByPoint(new THREE.Vector3(c.x-r,c.y-r,c.z-r));box.expandByPoint(new THREE.Vector3(c.x+r,c.y+r,c.z+r));
        if(im.instanceColor){im.getColorAt(i,col);ni.setColorAt(j,col);}});
      const sph=new THREE.Sphere();box.getBoundingSphere(sph);ni.geometry.boundingSphere=sph;ni.geometry.boundingBox=box;if(ni.instanceColor)ni.instanceColor.needsUpdate=true;ni.instanceMatrix.needsUpdate=true;root.add(ni);made++;}
    root.remove(im);removed++;}
  return {made,removed};}
window.__CHUNK=chunkify(outdoor,160);
/* the camera stops drawing just past the fog (430 m): nothing beyond it can be seen anyway. The map view sees everything. */
HOOKS.frame.push(()=>{const want=cam.mode==='map'&&S&&!S.inside?1800:480;if(camera.far!==want){camera.far=want;camera.updateProjectionMatrix();}});
if(window.__QA){window.__cb=(x,z)=>carBlocked(x,z);window.__nav=()=>NAV;window.__REN=renderer;}
/* the two newer campus cafes have kitchens too: give them shifts like the others */
Object.assign(CAFE_JOB,{munch:['Make small chops for the rush',90,'serve'],downcafe:['Wash pots in the kitchen',120,'plates']});
if(window.__QA)window.__L4={closeSheet:()=>closeSheet(),enterCarUI:()=>enterCar(),openLocUI:id=>openLoc(id),goToUI:(a,b,c)=>goTo(a,b,c),intNav:I=>intNav(I),navPath:(a,b,g)=>navPath(a,b,g),getInt:id=>getInt(id),gIdx:(g,x,z)=>gIdx(g,x,z),carSpotFree:(...a)=>carSpotFree(...a),carSpawn:(...a)=>carSpawn(...a),roadSpotNear,unstickCar,STUCK,CARZONE,JOB4,startDelivery,startRides,careerApply,careerShift,careerActs,crank,cxp,bankMove,bankActs,addFine,payFines,setWanted,pullOver,policeActs,gymActs,arcadeGame,catchFish,fishingActs,dealerCityActs,mechActs,furnitureActs,finv,myHomes,OUTFITS,wearOutfit,outfitActs,B4,bizFetch,bizMine,STORY4,msn,KOLA,KG,ACH4,dailyToday,dailyState,communityEvent,EV4,evFetch,hostEvent,skillUp,cnt,bump,marketActs,cityFuelActs,shopActs,hotelActs,loungeActs,beachActs,carMeet,dealerFlipActs,sideStart,sideToday,showBoard,LB,markerAt,MK,stopJob,taxiFare:(...a)=>taxiFare(...a),goTo:(...a)=>goTo(...a),openLoc:(...a)=>openLoc(...a),callKeke:(...a)=>callKeke(...a)};
