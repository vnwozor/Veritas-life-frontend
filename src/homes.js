/* ================= HOMES: your family house, a house you can buy, and your garage =================
   - Family House (Bwari): Mum and Dad live here. Eat Mum's food, talk, ask for pocket money once a week,
     watch TV with Dad, sleep in your old room (the hostel excuses a night spent at home).
   - Bwari Hills Duplex: buy it (cash). Then you can live there (no rent) and use its garage.
   - Duplex Garage: keep every car you own. Park a car in, take another one out. With a garage,
     Junction Autos lets you buy more cars: your current one is delivered to the garage. */
INSIDE_HINT.family='Living room, dining table, your old bedroom, Mum & Dad';
const HOUSE_PRICE=LOCS.villa.price;

/* ---------- the family house interior ---------- */
BUILD.family=function(I,id){shell(I,16,13,5,floorTex('#d8cdb8','#c4b79c','tile'),0xf0e6d0,5.5,0x7a3b2a);const hw=8,hd=6.5;
  /* living room: sofa set facing the TV, rug, family photo */
  const rug=part(G.box,0x7a2331,5,0.03,3.4,-3,0.02,-0.6,I.g,false);
  const sofa=new THREE.Group();sofa.position.set(-3,0,0.9);I.g.add(sofa);part(G.box,0x3d2b22,4,0.6,1.1,0,0.4,0,sofa);part(G.box,0x3d2b22,4,0.9,0.3,0,0.95,0.45,sofa);part(G.box,0x3d2b22,0.3,0.8,1.1,-2,0.6,0,sofa);part(G.box,0x3d2b22,0.3,0.8,1.1,2,0.6,0,sofa);
  [-1.2,0,1.2].forEach(x=>part(G.box,0xc9971c,0.6,0.35,0.15,x,0.95,0.25,sofa,false));
  const tv=onWall(I,0,-3,2.9,3.2,1.8,0x223344,true);tv.material.emissive.setHex(0x2a6a9a);part(G.box,0x5a3d26,3.6,0.7,0.6,-3,0.35,-hd+0.6,I.g);
  poster(I,2,-1,3,[['OUR FAMILY','700 28px Georgia'],['God bless this home','italic 22px Georgia']],'#f2ead8','#5a3d26',2.2,1.3);
  /* dining table with food */
  const tb=new THREE.Group();tb.position.set(4,0,-2);I.g.add(tb);part(G.box,0x6b4a2e,3,0.12,1.6,0,1.05,0,tb);[[-1.3,-0.6],[1.3,-0.6],[-1.3,0.6],[1.3,0.6]].forEach(([x,z])=>part(G.box,0x5a3d26,0.1,1.05,0.1,x,0.52,z,tb));
  [[-0.7,0,0xd9562b],[0.1,0.2,0xf2efe6],[0.8,-0.1,0x8a5a2a]].forEach(([x,z,c])=>{part(G.cyl,0xf2efe6,0.32,0.08,0.32,x,1.15,z,tb,false);part(G.sph,c,0.24,0.1,0.24,x,1.2,z,tb,false);});
  chair(I,4,-0.6,Math.PI,0x6b4a2e);chair(I,4,-3.4,0,0x6b4a2e);chair(I,2.2,-2,Math.PI/2,0x6b4a2e);chair(I,5.8,-2,-Math.PI/2,0x6b4a2e);
  /* your old bedroom corner */
  const bed=new THREE.Group();bed.position.set(-hw+1.8,0,-hd+2.4);I.g.add(bed);part(G.box,0x6b4a2e,2.4,0.5,4.2,0,0.25,0,bed);part(G.box,0xe8d9a8,2.2,0.3,4,0,0.65,0,bed,false);part(G.box,0x2b6fd9,2.25,0.1,2.6,0,0.83,0.6,bed,false);part(G.box,0xf2efe6,1.4,0.25,0.6,0,0.9,-1.6,bed,false);
  const bp={x:bed.position.x,y:0.8,z:bed.position.z+0.3,r:0,pose:'lie'};
  /* Mum and Dad */
  I.dad=interiorSim(I,PARENT_LOOK.dad,'dad');I.mum=interiorSim(I,PARENT_LOOK.mum,'mum');
  const sofaSeat={x:-2.2,y:0.05,z:0.85,r:Math.PI,pose:'sit'};
  addObj(I,sofa,{id:'sofa',name:'Dad on the sofa',ly:2.4,spot:{x:-3,z:2.4},acts:()=>[
    A('Watch TV with Dad','1h · the news, then football',()=>startAction('Watching TV with Dad',60,{where:id,place:sofaSeat,per:()=>{N('fun',0.5);N('stress',-0.2);},done:()=>{rel('dad',2);addMoodlet('Time with Dad',6,600);}})),
    A('Talk with Dad','15m · school, money, life',()=>dadTalk()),
    A('Ask Dad for pocket money','Once a week',()=>askHomeMoney(),{dis:homeMoneyWait()})]});
  addObj(I,tb,{id:'table',name:'Dining table',ly:2.6,spot:{x:4,z:0.4},acts:()=>{const h=minOf(S.t)/60,meal=(h>=6&&h<10)||(h>=12&&h<16)||(h>=18&&h<22);
    return [A('Eat Mum\'s cooking','30m · free · jollof, stew, plantain',()=>startAction('Eating at home',30,{where:id,place:{x:4,y:0,z:-0.6,r:Math.PI,pose:'eat'},per:()=>N('food',2.6),done:()=>{S.stats.meals++;rel('mum',2);addMoodlet('Mum\'s cooking',12,480);S.flags.homeMeal=dayOf(S.t)*10+Math.floor(minOf(S.t)/480);}}),{dis:!meal?'Mum serves food at breakfast, lunch and dinner time':S.flags.homeMeal===dayOf(S.t)*10+Math.floor(minOf(S.t)/480)?'You just ate. Mum says you will burst':null}),
      A('Help Mum in the kitchen','40m',()=>startAction('Helping Mum',40,{where:id,place:{x:5.4,y:0,z:-4.6,r:0,pose:'serve'},per:()=>N('stress',-0.1),done:()=>{rel('mum',4);toast('Home','Mum tells you every family gist while you cut onions.','good');}}))];}});
  addObj(I,bed,{id:'bed',name:'Your old bed',ly:2.4,spot:{x:bed.position.x+1.9,z:bed.position.z+1.2},acts:()=>[
    A('Sleep','8h · your own room at home',()=>startAction('Sleeping',480,{sleep:true,where:id,place:bp,done:()=>{addMoodlet('Slept at home',10,600);toast('Morning','Mum is already in the kitchen. The house smells of fried plantain.','good');}})),
    A('Nap','2h',()=>startAction('Napping',120,{sleep:true,where:id,place:bp}))]});
  I.populate=()=>{resetInt(I);const h=minOf(S.t)/60;
    if(h>=22||h<6){placeSim(I.dad,-hw+5,-hd+1.2,Math.PI,'stand');I.dad.g.visible=false;I.mum.g.visible=false;}
    else{placeSim(I.dad,-2.2,0.85,Math.PI,'sit',0.05);placeSim(I.mum,(h>=17&&h<20)||(h>=7&&h<9)?5.4:3.2,(h>=17&&h<20)||(h>=7&&h<9)?-4.6:-0.4,(h>=17&&h<20)||(h>=7&&h<9)?0:Math.PI,(h>=17&&h<20)||(h>=7&&h<9)?'serve':'talk');}};};

function homeMoneyWait(){const last=S.flags.homeMoney||-99;const d=dayOf(S.t)-last;return d<7?'Dad gave you money '+(d===0?'today':d===1?'yesterday':d+' days ago')+'. Next week':null;}
function askHomeMoney(){if(homeMoneyWait())return;const base={ajebutter:10000,ajekpako:2000,scholar:4000}[S.bg]||4000;const r=S.rel.dad||50;
  const amt=Math.round(base*(0.5+r/100)/500)*500;S.flags.homeMoney=dayOf(S.t);
  dialog({who:'dad',kicker:'Your father',text:r<35?'"Money again? What did you do with the last one?" He sighs and gives you <b>'+naira(amt)+'</b>. "Spend it on books."':'"How is school? Are you reading?" He opens his wallet: <b>'+naira(amt)+'</b>. "Don\'t tell your mother how much."',
    choices:[{t:'"Thank you Daddy"',fn:()=>{earn(amt,'Pocket money from Dad');rel('dad',2);return null;}}]});}
function dadTalk(){const r=S.rel.dad||50,cg=S.cgpa||0;
  dialog({who:'dad',kicker:'Your father',text:'"Sit down. How are your lectures? '+(cg?'They told me your CGPA is '+cg.toFixed(2)+'. '+(cg>=3.5?'I am proud of you.':'You can do better.'):'Your first results will show what you are doing.')+'"',
    choices:[{t:'"School is going well"',fn:()=>{rel('dad',3);return '"Good. Keep your head down and finish strong."';}},
      {t:'"I need advice about money"',fn:()=>{S.skills.business=(S.skills.business||0)+0.1;rel('dad',2);return '"Save a little from everything you get. Small small, it becomes big. And never borrow from those loan apps."';}},
      {t:'"I want to buy a car"',fn:()=>{rel('dad',1);return S.car?'"You already have one. Take care of it."':'"Save half, I will think about the rest. Ask me properly in a message."';}}]});}

/* ---------- the duplex you can buy ---------- */
function ownsHouse(){return S.ownHouse==='villa';}
function buyHouse(){if(ownsHouse())return;if(!spend(HOUSE_PRICE,'Bought Bwari Hills Duplex'))return toast('Not enough money','The duplex costs '+naira(HOUSE_PRICE)+' cash.','bad');
  S.ownHouse='villa';S.home='villa';S.homeDue=1e9;S.garage=S.garage||[];xp(150,'Home owner');celebrate('You own a house!','Bwari Hills Duplex · with a garage for your cars');
  msg('landlord','Congratulations on your new house! The keys and the garage remote are yours. No rent, ever.');save();}
function sellHouse(){if(!ownsHouse())return;const val=Math.round(HOUSE_PRICE*0.8/1000)*1000;
  dialog({who:'landlord',kicker:'Agent',text:'"I can sell it for you at <b>'+naira(val)+'</b>. Cars in the garage go with you."',choices:[{t:'Sell the house',fn:()=>{S.ownHouse=null;if(S.home==='villa'){S.home=null;S.homeDue=0;}const n=(S.garage||[]).length;
    if(n){toast('Garage emptied',n+' car'+(n>1?'s were':' was')+' sold with the garage. You got the money.','good');(S.garage||[]).forEach(c=>earn(Math.round((CARS[c.model]||CARS.saloon).price*0.5/1000)*1000,'Sold '+c.n));S.garage=[];garageRefresh();}
    earn(val,'Sold your house');return null;}},{t:'Keep it',fn:()=>null}]});}
function villaActs(){const L=[];if(!ownsHouse()){L.push(A('Buy this house',naira(HOUSE_PRICE)+' cash · no rent, a garage for all your cars',()=>buyHouse(),{cost:HOUSE_PRICE}));}
  else{if(S.home!=='villa')L.push(A('Live here','Move your things in · no rent',()=>{S.home='villa';S.homeDue=1e9;toast('Home','You moved into your duplex.','good');}));
    else L.push(A('Your house','You live here · no rent',()=>toast('Home','Bwari Hills Duplex is yours.')));
    L.push(A('Sell the house','The agent pays 80% of the price',()=>sellHouse()));}
  return L;}
/* the interior is the furnished self-contain (tier 2); the caretaker desk becomes the house papers */
{const _sc=BUILD.selfcon;BUILD.selfcon=function(I,id){_sc(I,id);if(LOCS[id].own){const d=I.objs.find(o=>o.id==='caretaker');if(d){d.acts=()=>villaActs();}}};}
HOOKS.acts.push(id=>id==='villa'?villaActs():[]);

/* ---------- the garage ---------- */
const garageG=new THREE.Group();outdoor.add(garageG);
function garageRefresh(){while(garageG.children.length)garageG.remove(garageG.children[0]);const L=LOCS.garage;(S&&S.garage||[]).slice(0,3).forEach((c,i)=>{const g=makeCar(c.col,c.model==='jeep'?'suv':'sedan');
  outdoor.remove(g);g.position.set(L.x-L.w/2+2+i*4,0,L.z+0.4);g.rotation.y=Math.PI;garageG.add(g);});}
function stashCar(){const c=S.car;if(!c)return;S.garage=S.garage||[];carDyn(false);const keep=Object.assign({},c);delete keep.x;delete keep.z;delete keep.dir;S.garage.push(keep);S.car=null;buildMyCar();garageRefresh();}
function takeCar(i){const g=S.garage||[];const c=g[i];if(!c)return;const L=LOCS.garage;g.splice(i,1);S.car=Object.assign({},c,{x:L.door.x,z:L.door.z-1,dir:Math.PI});buildMyCar();carDyn(true);garageRefresh();checkGoals();}
function garageActs(){const L=[];if(!ownsHouse())return [A('Locked','The garage comes with Bwari Hills Duplex',()=>{},{dis:'Buy the duplex first'})];
  const G2=S.garage||[];const near=S.car&&Math.hypot(S.car.x-LOCS.garage.x,S.car.z-LOCS.garage.z)<22;
  if(S.car)L.push(A('Park '+S.car.n+' inside','Keep it safe in your garage',()=>{stashCar();toast('Garage','Parked inside. The door rolls down.','good');},{dis:near?(G2.length>=3?'The garage holds 3 cars':null):'Drive it here first'}));
  G2.forEach((c,i)=>L.push(A('Take out '+c.n,'Fuel '+c.fuel.toFixed(1)+' L · condition '+Math.round(c.cond)+'%'+(S.car?' · swaps with your '+S.car.n:''),()=>{if(S.car)stashCar();const j=(S.garage||[]).indexOf(c);takeCar(j);toast('Garage','Your '+c.n+' is out and ready.','good');},{dis:S.car&&!near?'Bring your current car here first':null})));
  if(!G2.length&&!S.car)L.push(A('Empty garage','Buy a car at Junction Autos',()=>{},{dis:'No cars yet'}));
  return L;}
HOOKS.acts.push(id=>id==='garage'?garageActs():[]);

/* Junction Autos: with a garage you can own more than one car (your current one is delivered there) */
{const _da=dealerActs;dealerActs=function(){if(!S.car||!ownsHouse())return _da();const cur=S.car;S.car=null;let L;try{L=_da();}finally{S.car=cur;}
  if((S.garage||[]).length>=3)return _da();
  return L.filter(a=>/^Buy /.test(a.label)).map(a=>Object.assign({},a,{info:a.info+' · your '+cur.n+' goes to your garage',fn:()=>{if(S.money<(a.cost||0))return a.fn();stashCar();a.fn();}})).concat(_da().filter(a=>!/^Buy |^Hire purchase/.test(a.label)));};}

/* housing app: an owned house has no rent */
{const _ha=housingApp;housingApp=function(b,btn,row){if(S.home&&LOCS[S.home]&&LOCS[S.home].own){b.append(el('div','bgcard','<b>Home: '+LOCS[S.home].name+'</b><div class="note">You own this house. No rent. Garage: '+((S.garage||[]).length)+' car'+((S.garage||[]).length===1?'':'s')+' inside.</div>'));
  b.append(row(btn('Move back to the hostel',()=>{S.home=null;S.homeDue=0;toast('Moved out','You still own the duplex. Move back in any time.');})));return;}return _ha(b,btn,row);};}

HOOKS.migrate.push(st=>{if(!st.garage)st.garage=[];});
HOOKS.boot.push(()=>{try{garageRefresh();}catch(e){}});
setTimeout(()=>{try{if(S)garageRefresh();}catch(e){}},1500);
if(window.__QA)window.__HOME={villaActs,buyHouse,garageActs,stashCar,dealerActs:()=>dealerActs(),giveCar};
