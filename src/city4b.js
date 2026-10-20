/* ================= BWARI CITY: inside the buildings, what you can do at each place, getting around =================
   (the places themselves are in city4.js; jobs, skills, the bank, police, businesses and missions are in life4.js) */

/* ---------- menus and hints ---------- */
Object.assign(MENUS,{suyarep:[['Beef suya (₦2,000)',2000,40,15,10],['Chicken suya & onions',2500,45,15,10],['Kilishi & cold malt',1800,30,10,8]],
  amala:[['Amala, ewedu & gbegiri',1500,60,25,4],['Amala & assorted meat',2500,70,30,6],['Rice & ofada stew',1800,58,25,4]],
  shawarma:[['Chicken shawarma',3000,55,20,12],['Double beef shawarma',4000,70,20,14],['Burger, fries & chapman',3500,60,25,10]]});
Object.assign(CAFE_JOB,{suyarep:['Grill suya at the fire',120,'kitchen'],amala:['Turn amala in the pot',120,'kitchen'],shawarma:['Wrap shawarma at the counter',120,'serve']});
Object.assign(INSIDE_HINT,{shop:'Shelves, checkout, staff',bank:'Tellers, loans desk, ATM',office2:'Desks, meeting room, interviews',hosp:'Doctor, nurse, pharmacy',police:'Charge office, fines desk',
  depot:'Parcels, dispatch desk, bikes',gym:'Weights, treadmills, boxing bag',cinema:'Screens, arcade machines, popcorn',lounge2:'Live band, bar, booths',hotel:'Reception, restaurant, rooms'});
/* opening hours that run past midnight (Skyline Lounge 4 PM – 3 AM, Starlight to midnight) */
{const _io=isOpen;isOpen=function(id){const L=LOCS[id];if(L&&L.open&&L.open[1]>24&&id!=='club'){const h=minOf(S.t)/60;return h>=L.open[0]||h<L.open[1]-24;}return _io.apply(this,arguments);};}
PLACE_CAT.push(['City · homes & parks',['prop5','prop6','prop7','prop8','cschool','cpark']],['City · shops & services',['market','megamart','bank','furni','fashion','salon','pharm']],
  ['City · work & public services',['hub','hospital','police','fire','depot']],['City · motors & transport',['express','mech','cfuel','motorpark']],
  ['City · food & fun',['gym','cinema','suyarep','amala','shawarma','hotel','pitch','bcourt','beach','pier']],['Lakeside nightlife (18+)',['club','lounge','clubpark']]);

/* ---------- small building pieces for interiors ---------- */
function shelfUnit(I,x,z,len,ry,cols){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry||0;I.g.add(g);part(G.box,0xcfcac0,len,2.2,0.7,0,1.1,0,g);
  for(let s=0;s<3;s++)for(let k=0;k<Math.floor(len/0.5);k++)part(G.box,cols[(s*3+k)%cols.length],0.36,0.34,0.4,-len/2+0.3+k*0.5,0.45+s*0.62,0.12,g,false);return g;}
function deskRow(I,x,z,n,col){const g=new THREE.Group();g.position.set(x,0,z);I.g.add(g);for(let k=0;k<n;k++){part(G.box,col||0xe8e2d0,1.6,0.08,0.9,k*2-((n-1)),1.1,0,g);part(G.box,0x222222,0.6,0.4,0.05,k*2-((n-1)),1.45,-0.2,g,false);[[-0.7,-0.35],[0.7,-0.35],[-0.7,0.35],[0.7,0.35]].forEach(([a,b])=>part(G.box,0x555555,0.06,1.1,0.06,k*2-((n-1))+a,0.55,b,g));}return g;}
function staffSim(I,look,x,z,face,poseName){const r=interiorSim(I,Object.assign({skin:0x5a3a24,shirt:0x2b4f8a,pants:0x222222},look||{}),'staff');r.g.userData.npc='staff';I.pick.push(r.g);r.home={x,z,face,pose:poseName||'stand'};return r;}
function crowdSims(I,n){const L=[];for(let k=0;k<n;k++){const r=interiorSim(I,randomLook(k%2===1),'student');r.g.userData.npc='student';I.pick.push(r.g);L.push(r);}return L;}
function busyNow(a,b){const h=minOf(S.t)/60;return h>=a&&h<b;}

/* ---------- MegaMart, HomeStyle Furniture, Ankara House ---------- */
BUILD.shop=function(I,id){const L=LOCS[id];const big=id==='megamart'||id==='furni';shell(I,big?22:16,big?16:12,5,floorTex(id==='furni'?'#c9a77a':'#e8e4dc',id==='furni'?'#b8925f':'#d4cfc4',id==='furni'?'wood':'tile'),0xf2efe6,big?7:5,L.roof);
  const cash=new THREE.Group();cash.position.set(big?-6:-4,0,big?4:2.5);I.g.add(cash);part(G.box,L.roof,3.4,1.1,1,0,0.55,0,cash);part(G.box,0x222222,0.5,0.4,0.3,0.8,1.3,0,cash,false);
  poster(I,0,0,3.8,[[L.name.toUpperCase(),'800 30px sans-serif'],[L.sub.split('·').slice(0,3).join(' · '),'600 18px sans-serif']],hexStr(L.roof),'#fff6df',7,1.6);
  if(id==='megamart'){[-6,-1.5,3,7.5].forEach(x=>shelfUnit(I,x,-3,6,Math.PI/2,[0xd23b2b,0xe3b04b,0x2f8a57,0x2b6fd9,0xf2efe6,0x8a3a2b]));
    const fr=new THREE.Group();fr.position.set(0,0,-7.2);I.g.add(fr);part(G.box,0xe8e8e8,12,2.2,0.9,0,1.1,0,fr);part(G.box,0x9ad0e0,11.6,1.6,0.05,0,1.2,0.46,fr,false);
    addObj(I,fr,{id:'fridges',name:'Cold drinks',ly:3,spot:{x:0,z:-5.6},acts:()=>shopActs('drinks')});
    addObj(I,cash,{id:'checkout',name:'Checkout',ly:2.8,spot:{x:cash.position.x,z:cash.position.z+1.6},acts:()=>shopActs('grocery').concat(careerActs('shop',id))});}
  else if(id==='furni'){const show=[['sofa',-6,-3,0],['bed',0,-3.5,0],['tv',6,-5.6,0],['dining',6,0,0],['shelf',-8,2,Math.PI/2],['plant',-2,2,0]];
    show.forEach(([k,x,z,r])=>{try{const g=decorMesh(k);g.position.set(x,0,z);g.rotation.y=r;I.g.add(g);}catch(e){}});
    addObj(I,cash,{id:'sales',name:'Sales desk',ly:2.8,spot:{x:cash.position.x,z:cash.position.z+1.6},acts:()=>furnitureActs()});}
  else{/* Ankara House: racks of clothes, a mirror, a fitting room */for(const [x,z] of [[-4,-3],[0,-3],[4,-3]]){const r=new THREE.Group();r.position.set(x,0,z);I.g.add(r);part(G.box,0x444444,2.6,0.06,0.06,0,2,0,r,false);[-1.2,1.2].forEach(o=>part(G.box,0x444444,0.06,2,0.5,o,1,0,r));
      for(let k=0;k<7;k++)part(G.box,[0xc2541f,0x1f8a4c,0xe8e2d0,0x2b4f8a,0x7a2331,0xe3b04b,0x222222][(k+Math.abs(x))%7],0.3,1.1,0.5,-1+k*0.33,1.4,0,r,false);}
    onWall(I,3,0,1.8,1.4,2.6,0xbfd7e0);
    addObj(I,cash,{id:'stylist',name:'Stylist',ly:2.8,spot:{x:cash.position.x,z:cash.position.z+1.6},acts:()=>outfitActs()});}
  I.staff=staffSim(I,{shirt:L.roof,female:id!=='furni',skirt:id==='fashion'},cash.position.x,cash.position.z-1.1,0,'serve');I.crowd=crowdSims(I,5);
  I.populate=()=>{resetInt(I);placeSim(I.staff,I.staff.home.x,I.staff.home.z,0,'serve',0);const n=busyNow(16,20)?5:2;I.crowd.slice(0,n).forEach((r,k)=>placeSim(r,rnd(-6,6),rnd(-4,1.5),rnd(0,6),pick(['look','stand','phone']),0));};};
/* ---------- Unity Trust Bank ---------- */
BUILD.bank=function(I,id){shell(I,16,12,6,floorTex('#d8d2c4','#c4bba8','tile'),0xf2efe6,4,0x1f4d3a);
  const ct=new THREE.Group();ct.position.set(0,0,-3.6);I.g.add(ct);part(G.box,0x1f4d3a,12,1.2,1,0,0.6,0,ct);part(G.box,0x9ad0e0,12,1.2,0.05,0,1.8,0,ct,false);
  poster(I,0,0,4.6,[['UNITY TRUST BANK','800 30px Georgia'],['Your money, safe and growing','italic 20px Georgia']],'#1f4d3a','#e3b04b',7,1.5);
  const atm=new THREE.Group();atm.position.set(-6.6,0,2);I.g.add(atm);part(G.box,0x2b3a4a,1,2,0.7,0,1,0,atm);part(G.box,0x5aa9c9,0.6,0.4,0.05,0,1.4,0.36,atm,false);
  addObj(I,ct,{id:'teller',name:'Teller',ly:3,spot:{x:0,z:-1.8},acts:()=>bankActs()});addObj(I,atm,{id:'atm',name:'ATM',ly:2.8,spot:{x:-5.6,z:2},acts:()=>bankActs(true)});
  I.tellers=[-3,0,3].map(x=>staffSim(I,{shirt:0xf2efe6,female:x===0},x,-4.4,0,'serve'));I.crowd=crowdSims(I,3);
  I.populate=()=>{resetInt(I);I.tellers.forEach(r=>placeSim(r,r.home.x,r.home.z,0,'serve',0));I.crowd.forEach((r,k)=>placeSim(r,-3+k*3,-1.6,Math.PI,'stand',0));};};
/* ---------- Bwari Business Hub ---------- */
BUILD.office2=function(I,id){shell(I,20,14,5,floorTex('#9aa4ac','#8a949c','tile'),0xe8eef2,6,0x2b3a4a);
  [-4,1].forEach(z=>deskRow(I,-2,z,5));const meet=new THREE.Group();meet.position.set(6.5,0,-4);I.g.add(meet);part(G.box,0x5a4a3a,3.6,0.1,1.8,0,1.1,0,meet);
  poster(I,0,0,3.8,[['BWARI BUSINESS HUB','800 28px sans-serif'],['Open-plan offices · interviews on the right','600 18px sans-serif']],'#2b3a4a','#e8eef2',7,1.4);
  const rec=new THREE.Group();rec.position.set(-6.5,0,4.6);I.g.add(rec);part(G.box,0x2b3a4a,3,1.1,0.9,0,0.55,0,rec);
  addObj(I,rec,{id:'reception',name:'Reception',ly:2.6,spot:{x:-6.5,z:5.8},acts:()=>careerActs('office',id).concat(careerActs('security',id))});
  addObj(I,meet,{id:'meeting',name:'Meeting room',ly:2.6,spot:{x:6.5,z:-2.4},acts:()=>[A('Work on your own hustle','2h · co-working · business skill',()=>startAction('Working on your hustle',120,{place:{x:6.5,y:0,z:-2.8,r:Math.PI,pose:'read'},per:()=>N('energy',-0.05),done:()=>{S.skills.business=(S.skills.business||0)+0.15;xp(12,'Co-working');toast('Hub','Pitch deck done. Business skill up.','good');}}),{cost:0})]});
  I.workers=[];for(let k=0;k<6;k++)I.workers.push(staffSim(I,{shirt:pick([0xf2efe6,0xbcd0e8,0xe8d8c8]),female:k%2===0},-6+(k%5)*2-((5-1))+4,k<5?-4.8:0.2,0,'read'));
  I.populate=()=>{resetInt(I);const on=busyNow(8,17)&&wd(S.t)<5;I.workers.forEach((r,k)=>{if(on||k<1)placeSim(r,-6+(k%5)*2,k<5?-4.6:0.4,0,'read',0);});};};
/* ---------- Bwari General Hospital ---------- */
BUILD.hosp=function(I,id){shell(I,20,14,5,floorTex('#e8eef0','#d8e2e6','tile'),0xf6f8f8,6,0x2f6b8f);
  const desk=new THREE.Group();desk.position.set(-5,0,-3.5);I.g.add(desk);part(G.box,0x2f6b8f,4,1.1,1,0,0.55,0,desk);
  poster(I,0,0,3.8,[['BWARI GENERAL HOSPITAL','800 26px sans-serif'],['Outpatients · pharmacy · emergency','600 18px sans-serif']],'#2f6b8f','#ffffff',7,1.4);
  for(let k=0;k<3;k++){const b=new THREE.Group();b.position.set(3+k*2.6,0,-4.6);I.g.add(b);part(G.box,0xf2f2f2,1.2,0.6,2.4,0,0.5,0,b);part(G.box,0x9ad0e0,1.2,0.12,1.6,0,0.86,0.3,b,false);}
  const ph=new THREE.Group();ph.position.set(7.5,0,3.5);I.g.add(ph);part(G.box,0xe8e8e8,3,1.1,0.9,0,0.55,0,ph);shelfUnit(I,8.6,5.6,3,0,[0xf2f2f2,0x2f8a57,0xd23b2b,0x2b6fd9]);
  addObj(I,desk,{id:'doctor',name:'See a doctor',ly:2.8,spot:{x:-5,z:-1.8},acts:()=>hospitalActs()});addObj(I,ph,{id:'pharmacy',name:'Pharmacy',ly:2.6,spot:{x:7.5,z:2},acts:()=>pharmacyActs()});
  I.doc=staffSim(I,{shirt:0xf6f6f6,pants:0xf6f6f6},-5,-4.4,0,'serve');I.nurse=staffSim(I,{shirt:0x9ad0e0,female:true,skirt:true},7.5,4.4,Math.PI,'serve');
  I.populate=()=>{resetInt(I);placeSim(I.doc,-5,-4.4,0,'serve',0);placeSim(I.nurse,7.5,4.4,Math.PI,'serve',0);};};
/* ---------- Police HQ ---------- */
BUILD.police=function(I,id){shell(I,16,12,5,floorTex('#8a8a84','#7a7a74','tile'),0xd9dde2,4,0x34477a);
  const ct=new THREE.Group();ct.position.set(0,0,-3.4);I.g.add(ct);part(G.box,0x34477a,10,1.2,1,0,0.6,0,ct);poster(I,0,0,4,[['BWARI DIVISIONAL POLICE','800 26px sans-serif'],['Fines · bail · reports · "Police is your friend"','600 16px sans-serif']],'#1d2638','#ffffff',7,1.4);
  for(let k=0;k<4;k++)chair(I,-5+k*1.4,3.2,Math.PI,0x5a5a5a);
  addObj(I,ct,{id:'desk',name:'Charge office',ly:3,spot:{x:0,z:-1.7},acts:()=>policeActs()});
  I.cops=[-2.5,2.5].map(x=>staffSim(I,{shirt:0x1d2638,pants:0x1d2638,cap:0x1d2638},x,-4.2,0,'serve'));
  I.populate=()=>{resetInt(I);I.cops.forEach(r=>placeSim(r,r.home.x,r.home.z,0,'serve',0));};};
/* ---------- SwiftDrop Depot ---------- */
BUILD.depot=function(I,id){shell(I,20,14,6,floorTex('#7a7670','#6a6660','tile'),0xd9d2c0,6,0x4a4a4a);
  for(let k=0;k<4;k++)for(let j=0;j<3;j++)part(G.box,0xb8946a,1,0.8,1,-7+k*1.3,0.4+j*0.82,-5.2,I.g);
  const belt=new THREE.Group();belt.position.set(1,0,-1.5);I.g.add(belt);part(G.box,0x333333,10,0.9,1.4,0,0.45,0,belt);for(let k=0;k<6;k++)part(G.box,0xc9a06a,0.9,0.6,0.9,-4+k*1.6,1.2,0,belt,false);
  poster(I,0,0,4,[['SWIFTDROP','900 34px sans-serif'],['Every parcel, on time','600 20px sans-serif']],'#e3b04b','#1a1405',6,1.4);
  const disp=new THREE.Group();disp.position.set(6.5,0,3.6);I.g.add(disp);part(G.box,0x4a4a4a,3,1.1,1,0,0.55,0,disp);
  addObj(I,disp,{id:'dispatch',name:'Dispatch desk',ly:2.8,spot:{x:6.5,z:5},acts:()=>careerActs('delivery',id)});
  I.boss=staffSim(I,{shirt:0xe3b04b},6.5,2.8,Math.PI,'serve');I.sorters=[0,1,2].map(k=>staffSim(I,{shirt:0xe3b04b,female:k===1},-2+k*3,-0.4,Math.PI,'serve'));
  I.populate=()=>{resetInt(I);placeSim(I.boss,6.5,2.8,Math.PI,'serve',0);I.sorters.forEach(r=>placeSim(r,r.home.x,r.home.z,Math.PI,'serve',0));};};
/* ---------- Iron Paradise Gym ---------- */
BUILD.gym=function(I,id){shell(I,18,12,5,floorTex('#2a2a2a','#333333','tile'),0x3a3a3a,5,0xe3b04b);
  const rack=new THREE.Group();rack.position.set(-5,0,-4);I.g.add(rack);part(G.box,0x222222,3,0.1,1.2,0,0.5,0,rack);for(let k=0;k<5;k++)part(G.cyl,0x555555,0.25,0.3,0.25,-1.2+k*0.6,0.75,0,rack,false);part(G.box,0x999999,2.6,0.06,0.06,0,1.7,0,rack,false);
  const tm=new THREE.Group();tm.position.set(3,0,-4.4);I.g.add(tm);for(let k=0;k<3;k++){part(G.box,0x222222,0.9,0.3,2,k*1.4,0.15,0,tm);part(G.box,0x444444,0.9,1.3,0.1,k*1.4,1,-0.9,tm);}
  const bag=new THREE.Group();bag.position.set(6.5,0,1.5);I.g.add(bag);part(G.cyl,0x7a2331,0.45,1.6,0.45,0,1.5,0,bag);part(G.cyl,0x444444,0.03,1,0.03,0,2.8,0,bag,false);
  poster(I,0,0,3.6,[['IRON PARADISE','900 34px sans-serif'],['No pain, no gain','italic 22px sans-serif']],'#111111','#e3b04b',6,1.4);
  addObj(I,rack,{id:'weights',name:'Weights',ly:2.6,spot:{x:-5,z:-2.4},acts:()=>gymActs('weights')});addObj(I,tm,{id:'cardio',name:'Treadmills',ly:2.6,spot:{x:4.4,z:-2.6},acts:()=>gymActs('cardio')});
  addObj(I,bag,{id:'boxing',name:'Boxing bag',ly:3.4,spot:{x:5.4,z:2.6},acts:()=>gymActs('boxing')});
  I.lifters=[0,1,2].map(k=>staffSim(I,{shirt:pick([0x111111,0xd23b2b,0x2b4f8a]),pants:0x222222,build:1.15},-6+k*4.5,0.5,0,'cross'));
  I.populate=()=>{resetInt(I);I.lifters.forEach((r,k)=>{if(busyNow(6,10)||busyNow(17,21)||k===0)placeSim(r,r.home.x,r.home.z,rnd(0,6),pick(['cross','stand','wave']),0);});};};
/* ---------- Starlight Cinema & Arcade ---------- */
BUILD.cinema=function(I,id){shell(I,20,14,6,floorTex('#3a1a2a','#2a1420','tile'),0x2a1e3a,6,0xe3b04b);
  const pop=new THREE.Group();pop.position.set(-5,0,-4);I.g.add(pop);part(G.box,0xd23b2b,4,1.1,1,0,0.55,0,pop);part(G.box,0xf2e6a8,0.8,1,0.8,1.2,1.6,0,pop,false);
  const arc=new THREE.Group();arc.position.set(5,0,-4.4);I.g.add(arc);for(let k=0;k<3;k++){part(G.box,0x1d1b2e,1.1,2.2,0.9,k*1.5-1.5,1.1,0,arc);const sc=part(G.box,0x223344,0.8,0.6,0.05,k*1.5-1.5,1.6,0.46,arc,false);sc.material=new THREE.MeshLambertMaterial({color:0x223344,emissive:[0xe0629a,0x2fbf6a,0x2b6fd9][k],emissiveIntensity:0.7});}
  poster(I,0,0,4.2,[['STARLIGHT CINEMA','800 30px sans-serif'],['Now showing: "Lagos Heat" · "The Last Keke" · "Mama\'s Boy 2"','600 15px sans-serif']],'#1d1b2e','#e3b04b',8,1.6);
  addObj(I,pop,{id:'tickets',name:'Tickets & popcorn',ly:2.8,spot:{x:-5,z:-2.4},acts:()=>cinemaActs()});addObj(I,arc,{id:'arcade',name:'Arcade',ly:3,spot:{x:5,z:-2.8},acts:()=>arcadeActs()});
  I.crowd=crowdSims(I,6);I.staff=staffSim(I,{shirt:0xd23b2b,female:true},-5,-4.8,0,'serve');
  I.populate=()=>{resetInt(I);placeSim(I.staff,-5,-4.8,0,'serve',0);const n=busyNow(18,23)||wd(S.t)>=5?6:2;I.crowd.slice(0,n).forEach(r=>placeSim(r,rnd(-6,6),rnd(-1,4),rnd(0,6),pick(['talk','laugh','phone','stand']),0));};};
/* ---------- Skyline Lounge ---------- */
BUILD.lounge2=function(I,id){shell(I,18,13,5,floorTex('#2a2420','#1e1a18','wood'),0x1d2a3a,5,0xe3b04b);
  const stage=new THREE.Group();stage.position.set(0,0,-4.8);I.g.add(stage);part(G.box,0x3a2a1e,8,0.4,2.6,0,0.2,0,stage);part(G.cyl,0x333333,0.05,1.5,0.05,-1,1.15,0,stage,false);part(G.box,0x7a2331,1.6,0.8,0.6,2,0.8,0,stage);
  const bar=new THREE.Group();bar.position.set(-6.4,0,1.5);I.g.add(bar);part(G.box,0x3a2a1e,1.2,1.15,6,0,0.58,0,bar);
  [[-1,2],[2.5,2],[5.5,1]].forEach(([x,z])=>tableSet(I,x,z,0x3a2a1e,0x7a2331));
  poster(I,0,0,3.9,[['SKYLINE LOUNGE','800 30px sans-serif'],['Live band from 8 PM','600 20px sans-serif']],'#0d1420','#e3b04b',6,1.4);
  addObj(I,bar,{id:'bar',name:'Bar',ly:2.6,spot:{x:-5,z:1.5},acts:()=>loungeActs()});addObj(I,stage,{id:'stage',name:'Stage',ly:2.8,spot:{x:0,z:-2.6},acts:()=>careerActs('entertainer',id)});
  I.band=[-2,0,2].map(x=>staffSim(I,{shirt:pick([0x111111,0x7a2331,0xe3b04b])},x,-5,0,'dance'));I.crowd=crowdSims(I,6);
  I.populate=()=>{resetInt(I);const h=minOf(S.t)/60,live=h>=20||h<2;I.band.forEach(r=>{if(live)placeSim(r,r.home.x,r.home.z,0,'dance',0.4);});const n=live?6:2;I.crowd.slice(0,n).forEach(r=>{const st=freeSeat(I);if(st)seatSim(I,r,st,pick(['sittalk','sit','sitphone']));});};};
/* ---------- Lakeview Hotel ---------- */
BUILD.hotel=function(I,id){shell(I,20,14,6,floorTex('#d8c8a8','#c8b898','tile'),0xf2ead8,6,0x2b4f8a);
  const rec=new THREE.Group();rec.position.set(-5,0,-4);I.g.add(rec);part(G.box,0x2b4f8a,5,1.1,1,0,0.55,0,rec);part(G.box,0xe3b04b,5.1,0.1,1.1,0,1.12,0,rec,false);
  [[3,-2],[7,-2],[3,2],[7,2]].forEach(([x,z])=>tableSet(I,x,z,0xf2efe6,0x2b4f8a));
  poster(I,0,0,4.2,[['LAKEVIEW HOTEL','800 30px Georgia'],['Rooms · restaurant · pool','italic 20px Georgia']],'#2b4f8a','#f2ead8',7,1.5);
  const rest=new THREE.Group();rest.position.set(5,0,0);I.g.add(rest);
  addObj(I,rec,{id:'reception',name:'Reception',ly:2.8,spot:{x:-5,z:-2.3},acts:()=>hotelActs().concat(careerActs('security',id))});
  addObj(I,rest,{id:'restaurant',name:'Restaurant',ly:2.4,spot:{x:5,z:4.6},acts:()=>[A('Pepper soup & rice (₦4,500)','30m · proper meal',()=>{if(!spend(4500,'Hotel restaurant'))return toast('Not enough money','','bad');startAction('Eating at the hotel',30,{place:{x:3,y:0,z:0.4,r:Math.PI,pose:'eat'},per:()=>{N('food',2.2);N('fun',0.3);},done:()=>addMoodlet('Hotel food',8,480)});},{cost:4500})].concat(careerActs('chef',id))});
  I.staff=staffSim(I,{shirt:0x2b4f8a,female:true},-5,-4.8,0,'serve');I.crowd=crowdSims(I,4);
  I.populate=()=>{resetInt(I);placeSim(I.staff,-5,-4.8,0,'serve',0);I.crowd.forEach(r=>{const st=freeSeat(I);if(st&&chance(.6))seatSim(I,r,st,pick(['eat','sittalk']));});};};

/* ---------- what you can do at each city place ---------- */
const CITY_ACTS={
  cschool:()=>[A('Coach the school football team','2h · ₦3,000 · after 2 PM',()=>startAction('Coaching kids football',120,{per:()=>{N('energy',-0.06);N('fun',0.3);},done:()=>{earn(3000,'Coaching at Kubwa Model Primary');S.skills.fitness=(S.skills.fitness||0)+0.08;xp(10,'Coaching');bump('coach');}}),{pay:3000,dis:minOf(S.t)<14*60||minOf(S.t)>17*60||wd(S.t)>4?'Weekdays, 2 PM – 5 PM':null}),
    A('Read to the pupils','1h · volunteer · kindness',()=>startAction('Reading to pupils',60,{done:()=>{addMoodlet('Made kids laugh',10,720);S.rep=(S.rep||0)+1;xp(8,'Volunteering');}}),{dis:!isOpen('cschool')?'School hours only (7 AM – 3 PM)':null})],
  cpark:()=>[A('Jog round the park','30m · stamina + fitness',()=>startAction('Jogging in Gardens Park',30,{per:()=>{N('energy',-0.2);N('stress',-0.3);N('hygiene',-0.1);},done:()=>{skillUp('stamina',0.12);skillUp('fitness',0.06);bump('jog');toast('Jog done','Lungs on fire. Stamina up.','good');}})),
    A('Sit by the fountain','20m · calm',()=>startAction('Relaxing by the fountain',20,{per:()=>{N('stress',-0.4);N('fun',0.2);}}))],
  market:()=>marketActs(),express:()=>dealerCityActs(),mech:()=>mechActs(),cfuel:()=>cityFuelActs(),
  motorpark:()=>[A('Ride a danfo to another district','₦200 · use Go → Danfo from any place',()=>toast('Danfo','Open the Map, pick a city place and choose "Danfo".')),...careerActs('conductor','motorpark')],
  fire:()=>[A('Fire safety drill (volunteer)','1h · rep + a certificate',()=>startAction('Fire safety drill',60,{per:()=>N('energy',-0.08),done:()=>{S.rep=(S.rep||0)+2;S.flags.fireCert=1;xp(15,'Fire drill');toast('Certificate','Fire safety certificate earned. Security jobs pay a bit more now.','good');}}),{dis:S.flags.fireCert?'You already have the certificate':null})],
  pitch:()=>[A('Penalty shootout','vs the weekend league keeper',()=>startPenalty({vs:'Lakeside FC keeper'})),A('5-a-side match','1h · fitness + friends',()=>startAction('5-a-side at the lake',60,{per:()=>{N('energy',-0.18);N('fun',0.7);N('social',0.4);},done:()=>{skillUp('fitness',0.1);skillUp('stamina',0.06);bump('football');}}))],
  bcourt:()=>[A('Shoot hoops','30m · free',()=>startAction('Shooting hoops',30,{per:()=>{N('energy',-0.12);N('fun',0.5);},done:()=>{skillUp('fitness',0.05);bump('hoops');}})),A('3-on-3 pickup game','1h',()=>startAction('3-on-3 basketball',60,{per:()=>{N('energy',-0.18);N('fun',0.6);N('social',0.5);},done:()=>{skillUp('fitness',0.1);bump('hoops');}}))],
  beach:()=>beachActs(),pier:()=>fishingActs(),
  clubpark:()=>[A('Car meet (Friday 8 PM – midnight)','Show your car · rep',()=>carMeet(),{dis:!(wd(S.t)===4&&minOf(S.t)>=20*60)?'Car meets are on Friday nights':!S.car||Math.hypot(S.car.x-LOCS.clubpark.x,S.car.z-LOCS.clubpark.z)>30?'Bring your car here':null})],
  pharm:()=>pharmacyActs(),hospital:()=>[],police:()=>[],lounge:()=>[]};
{const _oa=outdoorActions;outdoorActions=function(id){const base=_oa.apply(this,arguments);const f=CITY_ACTS[id];if(!f)return base;try{return f().concat(base);}catch(e){console.error(e);return base;}};}

/* ---------- getting around the city: taxis and danfo buses ----------
   Yellow taxis (Gidi Ride) drive the city's streets; the fare is by distance. Danfo buses run along the
   Expressway between the stops; ₦200 any distance. The campus keke stays on campus and at the Junction. */
const TAXIS=[],DANFOS=[];
function makeTaxi(){const V=buildVehicle('sedan',0xf2c230,{taxi:true,plate:'GIDI'});V.g.userData.V=V;part(G.box,0x111111,1.6,0.25,0.5,0,1.55,0,V.b,false);return V.g;}
function makeDanfo(){const V=buildVehicle('bus',0xf2c230,{plate:'DANFO'});V.g.userData.V=V;[-1,1].forEach(s2=>part(G.box,0x111111,0.02,0.18,5.6,s2*1.04,0.95,0,V.b,false));return V.g;}
for(let k=0;k<(QM?4:3);k++){const n=NODES[ri(20,NODES.length-1)];const t={g:makeTaxi(),x:n.x,z:n.z,dir:0,i:0,path:null,sp:rnd(10,12),mode:'ambient',isCar:true,cityOnly:true,taxi:true};TAXIS.push(t);VEH.push(t);kekeRoute(t);}
for(let k=0;k<2;k++){const n=NODES[20+3*k+1];const d={g:makeDanfo(),x:n.x,z:n.z,dir:0,i:0,path:null,sp:9,mode:'ambient',isCar:true,cityOnly:true,danfo:true};DANFOS.push(d);VEH.push(d);kekeRoute(d);}
/* city traffic: private cars and a police patrol */
const POLICE_CARS=[];
for(let k=0;k<(QM?4:2);k++){const n=NODES[ri(20,NODES.length-1)];const c={g:makeCar(pick([0xe8e2d0,0x1f2d44,0x9a9a9a,0x7a2331,0x2b2b2b,0x2f6b3e])),x:n.x,z:n.z,dir:0,i:0,path:null,sp:rnd(9,12),mode:'ambient',isCar:true,cityOnly:true};VEH.push(c);kekeRoute(c);}
{const V=buildVehicle('sedan',0xf2f2f2,{plate:'POLICE'});V.g.userData.V=V;part(G.box,0x1d2638,4.4,0.3,1.82,0,0.75,0,V.b,false);part(G.box,0x2b6fd9,0.4,0.15,0.9,-0.2,1.5,0,V.b,false);const lb=part(G.box,0xd23b2b,0.4,0.15,0.9,0.2,1.5,0,V.b,false);
  const n=NODES[CN(1,1)];const pc={g:V.g,x:n.x,z:n.z,dir:0,i:0,path:null,sp:10,mode:'ambient',isCar:true,cityOnly:true,police:true,lb};POLICE_CARS.push(pc);VEH.push(pc);kekeRoute(pc);}
RIDES.taxi={n:'Gidi Ride taxi',fare:800,sp:18,ride:20,delay:0.05};RIDES.danfo={n:'Danfo',fare:200,sp:9,ride:13,delay:0.25};
function taxiFare(id){const from=S.inside?LOCS[S.inside].door:P;const d=pathLen(from,route(from,LOCS[id].door));return Math.max(600,Math.round((400+d*5)/50)*50);}
/* the ride system picks the right vehicles: danfo buses for danfo, Gidi taxis for taxi */
{const _ck=callKeke;callKeke=function(id,then,kind){if(kind==='taxi')RIDES.taxi.fare=taxiFare(id);
  if(kind!=='taxi'&&kind!=='danfo')return _ck.apply(this,arguments);
  /* the core books a 'drop'; for the city it is a Gidi Ride taxi or a danfo, with its own name, fare and speed */
  const swap=cars.slice(),drop0=RIDES.drop;cars.length=0;(kind==='taxi'?TAXIS:DANFOS).forEach(k=>cars.push(k));let r;try{RIDES.drop=RIDES[kind];r=_ck.call(this,id,then,'drop');if(W.ride&&W.ride.k)W.ride.k.rk=RIDES[kind];}finally{RIDES.drop=drop0;cars.length=0;swap.forEach(k=>cars.push(k));}return r;};}
/* the ride menu: in or to the city, offer the city's transport instead of the campus keke and shuttle */
function inCity(z){return z>206;}
{const _ol=openLoc;openLoc=function(id){const r=_ol.apply(this,arguments);try{const L=LOCS[id];if(!UI.sheet||!L)return r;const from=S.inside?LOCS[S.inside].door:P;const here=(S.at===id&&!S.inside)||S.inside===id;
    if(here||(!inCity(L.z)&&!inCity(from.z)))return r;const tr=$('#shB .travel');if(!tr)return r;const far=Math.hypot(L.door.x-from.x,L.door.z-from.z)>=48;if(!far)return r;
    [...tr.querySelectorAll('.tbtn')].forEach(b=>{if(/keke|shuttle|Drop \(taxi\)/i.test(b.textContent))b.remove();});
    const then=L.inside?()=>enterBuilding(id):null;
    const bt=el('button','tbtn keke','<b>Gidi Ride taxi</b><span>'+naira(taxiFare(id))+' · fast, door to door</span>');bt.onclick=()=>{closeSheet();goTo(id,'taxi',then);};
    const bd=el('button','tbtn','<b>Danfo bus</b><span>₦200 · slower, waits at the roadside</span>');bd.onclick=()=>{closeSheet();goTo(id,'danfo',then);};
    if(W.ride)bt.disabled=bd.disabled=true;tr.append(bt,bd);
    if(S.car&&!W.drive){const bc=el('button','tbtn','<b>Drive your car</b><span>'+fx(S.car.n)+' · uses fuel</span>');bc.onclick=()=>{closeSheet();autoDrive(id);};tr.append(bc);}
    const note=[...$('#shB').querySelectorAll('.note')].find(n=>/Okadas are banned/.test(n.textContent));if(note)note.textContent='The campus keke does not run into the city. Use a Gidi Ride taxi, a danfo or your own car.';}catch(e){console.error(e);}return r;};}
{const _gt=goTo;goTo=function(id,how,then){if(how==='taxi'||how==='danfo'){if(S.inside){if(S.inside===id){if(then)then();return;}exitBuilding(()=>goTo(id,how,then));return;}return callKeke(id,then,how);}return _gt.apply(this,arguments);};}
/* your car's auto-drive menu knows the city too */
{const _oc=openCar;openCar=function(){const r=_oc.apply(this,arguments);try{if(!UI.sheet||!S.car)return r;const tr=$('#shB .travel');if(!tr)return r;
    ['express','mech','cfuel','hub','megamart','gym','hotel','clubpark',S.home].filter((x,i,a)=>x&&LOCS[x]&&a.indexOf(x)===i&&!tr.textContent.includes(fx(LOCS[x].name))).forEach(id=>{const b3=el('button','tbtn','<b>'+fx(LOCS[id].name)+'</b><span>'+(S.car.fuel<=0?'no fuel':'uses fuel')+'</span>');b3.disabled=S.car.fuel<=0;b3.onclick=()=>{closeSheet();autoDrive(id);};tr.append(b3);});}catch(e){}return r;};}

/* ---------- people in the city: walkers on the sidewalks, traders, police ---------- */
const CITYFOLK=[];
{const SPOTS=[];ROADS.filter(r=>r.city).forEach(r=>{const vert=r.x1===r.x2;for(const o of [-7,7]){const a=vert?{x:r.x1+o,z:Math.min(r.z1,r.z2)+12}:{x:Math.min(r.x1,r.x2)+12,z:r.z1+o};const b=vert?{x:r.x1+o,z:Math.max(r.z1,r.z2)-12}:{x:Math.max(r.x1,r.x2)-12,z:r.z1+o};SPOTS.push([a,b]);}});
  const n=QH?16:QM?12:8;for(let k=0;k<n;k++){const [a,b]=SPOTS[(k*7)%SPOTS.length];const g=makeSim(randomLook(k%2===0));outdoor.add(g);const t=rnd(0,1);
    CITYFOLK.push({g,a,b,t,dir:1,sp:rnd(1.1,1.6),kind:'walk',ph:rnd(0,6),nightOwl:k%3===0});}
  /* traders who stand at their stalls and shop doors during the day */
  [['market',0,-11],['market',-6,-11],['suyarep',0,0],['motorpark',0,-9],['megamart',0,0],['amala',0,0]].forEach(([id,ox,oz],k)=>{const L=LOCS[id];const p=oz===0?{x:L.door.x+ox+1.6,z:L.door.z}:{x:L.x+ox,z:L.z+oz};
    const g=makeSim(Object.assign(randomLook(k%2===0),{shirt:pick([0xc2541f,0xe3b04b,0x2f8a57])}));outdoor.add(g);g.position.set(p.x,0,p.z);CITYFOLK.push({g,x:p.x,z:p.z,kind:'stand',pose:'serve',hours:LOCS[id].open||[6,22],face:Math.atan2(L.door.x-L.x,L.door.z-L.z)});});
  /* two officers outside the police HQ */
  [-2,2].forEach(o=>{const L=LOCS.police;const g=makeSim({skin:0x4a2e1a,shirt:0x1d2638,pants:0x1d2638,cap:0x1d2638,build:1.1});outdoor.add(g);const p={x:L.door.x+o,z:L.door.z+1.2};g.position.set(p.x,0,p.z);CITYFOLK.push({g,x:p.x,z:p.z,kind:'stand',pose:'cross',hours:[0,24],face:0,police:true});});}
HOOKS.frame.push((dt,now)=>{if(!S||S.inside)return;const t=now/1000,h=minOf(S.t)/60;const night=h<6||h>=21;
  for(const f of CITYFOLK){const far=Math.hypot(f.g.position.x-cam.tx,f.g.position.z-cam.tz)>130&&cam.mode!=='map';
    if(f.kind==='walk'){const len=Math.hypot(f.b.x-f.a.x,f.b.z-f.a.z);f.t+=f.dir*dt*f.sp/len*(night?0.6:1);if(f.t>1){f.t=1;f.dir=-1;}if(f.t<0){f.t=0;f.dir=1;}
      const x=f.a.x+(f.b.x-f.a.x)*f.t,z=f.a.z+(f.b.z-f.a.z)*f.t;f.g.position.set(x,0,z);f.g.rotation.y=Math.atan2((f.b.x-f.a.x)*f.dir,(f.b.z-f.a.z)*f.dir);f.g.visible=!far&&!(night&&!f.nightOwl);if(f.g.visible){f.ph+=dt*f.sp*1.8;pose(f.g,'walk',f.ph,dt);}}
    else{const on=h>=f.hours[0]&&h<f.hours[1];f.g.visible=on&&!far;if(f.g.visible){f.g.rotation.y=f.face;pose(f.g,f.pose,t,dt);}}}});

/* ---------- far-away city buildings are hidden (they are also in the fog), so phones draw less ---------- */
HOOKS.frame.push(()=>{if(!S)return;const map=cam.mode==='map';const cx=cam.tx,cz=cam.tz;const R=map?1e9:260;
  for(const g of outdoor.children){const id=g.userData&&g.userData.loc;if(!id)continue;const L=LOCS[id];if(!L||!L.city)continue;g.visible=Math.hypot(L.x-cx,L.z-cz)<R+Math.max(L.w,L.d);}});
if(window.__QA)window.__CITY={TAXIS,DANFOS,POLICE_CARS,CITYFOLK,taxiFare,CITY_ACTS,FILLER,CITY_IDS,fillerFree,inCarZone};
