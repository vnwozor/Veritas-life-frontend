/* ================= BWARI CITY: the places =================
   South of Bwari Junction the Expressway (x = 0) runs into a whole town on a grid of avenues and streets:
     Kubwa Gardens (homes, a primary school, a park)        z 220 – 300
     Central Business District (market, shops, bank,
       offices, hospital, police, fire service)             z 300 – 380
     Motors & Leisure (dealership, mechanic, fuel, motor
       park, delivery depot, gym, cinema, food)            z 380 – 460
     Lakeside (Club Vibez and the lounge in the nightlife
       quarter, hotel, pitch, court, beach, fishing pier)  z 460 – 560
   The nightclub is in the Lakeside nightlife quarter, about 450 m by road from the university's Main Gate
   and 270 m from the primary school, with five blocks of homes, shops and offices in between.
   Runs before the world is built, so every place here gets real walls, roofs, doors, collision and a label. */
const CITY_IDS=[];
function cityPlace(id,o){o.id=id;o.zone='city';o.city=true;LOCS[id]=o;CITY_IDS.push(id);return o;}
/* the door faces the nearest road; doors on the far side of a block face that block's other street */
function cityDoor(L){const c=[];
  CITYX.forEach(x=>{if(L.z>=CITYZ[0]-2&&L.z<=CITYZ[CITYZ.length-1]+2){if(x<L.x)c.push({d:L.x-L.w/2-x,x:L.x-L.w/2-1.5,z:L.z});else c.push({d:x-(L.x+L.w/2),x:L.x+L.w/2+1.5,z:L.z});}});
  CITYZ.forEach(z=>{if(z<L.z)c.push({d:L.z-L.d/2-z,x:L.x,z:L.z-L.d/2-1.5});else c.push({d:z-(L.z+L.d/2),x:L.x,z:L.z+L.d/2+1.5});});
  c.sort((a,b)=>a.d-b.d);return {x:c[0].x,z:c[0].z};}
/* ---- Kubwa Gardens ---- */
cityPlace('prop5',{name:'Kubwa Gardens Bungalow',sub:'Bungalow · 2 bedrooms · for sale or rent',x:-100,z:240,w:16,d:12,h:6,wall:0xe6d8bf,roof:0x8a3a2a,inside:'home3',iname:'Gardens Bungalow · living room',prop:true});
cityPlace('prop6',{name:'Gardens Terrace Duplex',sub:'Duplex · 3 bedrooms · for sale or rent',x:-62,z:240,w:16,d:12,h:9,wall:0xf0e8d6,roof:0x2f4a6b,inside:'home3',iname:'Terrace Duplex · living room',prop:true});
cityPlace('prop7',{name:'Palm Court Studio',sub:'Studio apartment · cheap rent',x:-26,z:240,w:13,d:10,h:7,wall:0xdfe6d8,roof:0x5a6b3a,flat:true,inside:'home3',iname:'Palm Court Studio',prop:true});
cityPlace('cschool',{name:'Kubwa Model Primary School',sub:'Primary school · quiet family street',x:42,z:244,w:30,d:14,h:7,wall:0xf2e3b8,roof:0x2b5a8a,flat:true,open:[7,15]});
cityPlace('prop8',{name:'Hilltop Mansion',sub:'Mansion · 5 bedrooms · garden · for sale',x:100,z:252,w:24,d:18,h:11,wall:0xf6f0e2,roof:0x3a3a4a,flat:true,inside:'home3',iname:'Hilltop Mansion · grand lounge',prop:true});
cityPlace('cpark',{name:'Gardens Park',sub:'Playground · jogging path · benches',x:45,z:281,w:40,d:16,h:0,kind:'citypark'});
/* ---- Central Business District ---- */
cityPlace('market',{name:'Bwari Central Market',sub:'Foodstuff · fabric · phones · bargains · 6 AM – 7 PM',x:-95,z:320,w:30,d:20,h:0,kind:'market',open:[6,19]});
cityPlace('megamart',{name:'MegaMart Supermarket',sub:'Groceries · household · cold drinks · 8 AM – 10 PM',x:-55,z:317,w:22,d:14,h:7,wall:0xf2f2ea,roof:0xd23b2b,flat:true,inside:'shop',iname:'MegaMart · aisles',open:[8,22]});
cityPlace('bank',{name:'Unity Trust Bank',sub:'Savings · loans · business banking · 8 AM – 4 PM',x:-22,z:316,w:16,d:12,h:10,wall:0xe8e2d0,roof:0x1f4d3a,flat:true,inside:'bank',iname:'Banking hall',open:[8,16]});
cityPlace('furni',{name:'HomeStyle Furniture',sub:'Sofas · beds · TVs · decor · 9 AM – 7 PM',x:-98,z:362,w:22,d:14,h:7,wall:0xe9dcc4,roof:0x6b4a2e,flat:true,inside:'shop',iname:'HomeStyle showroom',open:[9,19]});
cityPlace('fashion',{name:'Ankara House',sub:'Native wear · streetwear · sneakers · 9 AM – 8 PM',x:-60,z:362,w:16,d:12,h:6,wall:0xf3d9c4,roof:0x7a2331,inside:'shop',iname:'Ankara House · boutique',open:[9,20],awning:true});
cityPlace('salon',{name:'Fresh Cutz',sub:'Barber & salon · cuts · braids · 8 AM – 9 PM',x:-26,z:362,w:14,d:10,h:5,wall:0x2f5d8a,roof:0xc94f3a,inside:'barber',open:[8,21],awning:true});
cityPlace('hub',{name:'Bwari Business Hub',sub:'Offices · co-working · job interviews · 7 AM – 7 PM',x:30,z:322,w:24,d:16,h:26,wall:0xb8c6cf,roof:0x2b3a4a,flat:true,inside:'office2',iname:'Hub · open-plan office',open:[7,19]});
cityPlace('hospital',{name:'Bwari General Hospital',sub:'Emergency · doctors · pharmacy · open all day',x:86,z:322,w:30,d:18,h:12,wall:0xf2f2ee,roof:0x2f6b8f,flat:true,inside:'hosp',iname:'Outpatients'});
cityPlace('police',{name:'Bwari Divisional Police HQ',sub:'Pay fines · clear warrants · report crime',x:40,z:362,w:22,d:14,h:9,wall:0x34477a,roof:0x1d2638,flat:true,inside:'police',iname:'Charge office'});
cityPlace('fire',{name:'Fire Service Station',sub:'Bwari Fire Service · volunteers welcome',x:96,z:362,w:22,d:14,h:8,wall:0xc62b2b,roof:0x3a3a3a,flat:true});
/* ---- Motors & Leisure ---- */
cityPlace('express',{name:'Express Motors',sub:'New & used cars · bikes · motorcycles · 8 AM – 7 PM',x:-95,z:400,w:30,d:14,h:0,kind:'lot2',open:[8,19]});
cityPlace('mech',{name:'Mama Pat Garage',sub:'Repairs · paint · rims · car wash · 7 AM – 8 PM',x:-55,z:400,w:22,d:14,h:0,kind:'workshop',open:[7,20]});
cityPlace('cfuel',{name:'City Fuel Station',sub:'Petrol ₦900 per litre · open 24 hours',x:-20,z:398,w:16,d:10,h:0,kind:'fuel'});
cityPlace('motorpark',{name:'City Motor Park',sub:'Danfo buses to every district · ₦200',x:-92,z:442,w:28,d:16,h:0,kind:'motorpark'});
cityPlace('depot',{name:'SwiftDrop Depot',sub:'Parcels · food delivery · riders wanted',x:-42,z:443,w:24,d:14,h:8,wall:0xd9d2c0,roof:0x4a4a4a,flat:true,inside:'depot',iname:'Sorting floor',open:[7,21]});
cityPlace('gym',{name:'Iron Paradise Gym',sub:'Weights · cardio · boxing · 6 AM – 10 PM',x:25,z:398,w:18,d:12,h:7,wall:0x2b2b2b,roof:0xe3b04b,flat:true,inside:'gym',iname:'Gym floor',open:[6,22]});
cityPlace('cinema',{name:'Starlight Cinema & Arcade',sub:'Movies · arcade · popcorn · 11 AM – midnight',x:68,z:400,w:28,d:16,h:11,wall:0x3a2a5a,roof:0x1d1b2e,flat:true,inside:'cinema',iname:'Lobby & arcade',open:[11,24]});
cityPlace('suyarep',{name:'Suya Republic',sub:'Suya · kilishi · cold drinks · 4 PM – midnight',x:110,z:398,w:12,d:10,h:5,wall:0x7a3b1f,roof:0xe3b04b,inside:'cafe',open:[16,24],awning:true});
cityPlace('amala',{name:'Amala Spot',sub:'Amala · ewedu · gbegiri · 7 AM – 9 PM',x:28,z:442,w:14,d:10,h:5,wall:0xe8d2a8,roof:0x2f6b4f,inside:'cafe',open:[7,21],awning:true});
cityPlace('shawarma',{name:'Shawarma Hub',sub:'Shawarma · burgers · chapman · 10 AM – midnight',x:64,z:442,w:14,d:10,h:5,wall:0xf3d9a8,roof:0xb23a2a,inside:'cafe',open:[10,24],awning:true});
/* ---- Lakeside: the nightlife quarter (west) and leisure (east) ---- */
cityPlace('lounge',{name:'Skyline Lounge',sub:'Live band · small chops · 4 PM – 3 AM · 18+',x:-40,z:482,w:18,d:12,h:7,wall:0x1d2a3a,roof:0xe3b04b,flat:true,inside:'lounge2',iname:'Skyline Lounge',open:[16,27]});
cityPlace('clubpark',{name:'Nightlife Car Park',sub:'Parking for Club Vibez & Skyline Lounge',x:-62,z:512,w:44,d:8,h:0,kind:'carpark2'});
cityPlace('hotel',{name:'Lakeview Hotel',sub:'Rooms ₦15,000 a night · restaurant · poolside',x:32,z:488,w:24,d:16,h:18,wall:0xf2ead8,roof:0x2b4f8a,flat:true,inside:'hotel',iname:'Hotel lobby'});
cityPlace('pitch',{name:'Lakeside Football Pitch',sub:'5-a-side · weekend league',x:98,z:494,w:36,d:26,h:0,kind:'field'});
cityPlace('bcourt',{name:'Lakeside Basketball Court',sub:'Pickup games · 3-on-3',x:62,z:514,w:12,d:10,h:0,kind:'court'});
cityPlace('beach',{name:'Usuma Lake Beach',sub:'Swim · sunbathe · beach games',x:40,z:547,w:150,d:14,h:0,kind:'beach'});
cityPlace('pier',{name:'Fishing Pier',sub:'Fishing · sunset views',x:-40,z:563,w:4,d:30,h:0,kind:'pier'});
/* ---- the nightclub moves out of the Junction into the nightlife quarter ---- */
Object.assign(LOCS.club,{x:-85,z:484,w:18,d:12,h:8,zone:'city',city:true,sub:'Nightclub · 9 PM – 4 AM · 18+ · cover ₦3,000 · Lakeside nightlife quarter'});
CITY_IDS.push('club');
/* where the club stood at the Junction there is now a pharmacy */
LOCS.pharm={id:'pharm',name:'Junction Pharmacy',sub:'Paracetamol · first aid · POS cash-out · 8 AM – 9 PM',x:-28,z:120,w:12,d:9,h:5,wall:0xeef3ee,roof:0x2f8a57,zone:'off',open:[8,21],awning:true};
LOCS.pharm.door={x:-28,z:120+9/2+1.5};
/* the Expressway now runs south from the Junction: Graceland Annex moves off it */
Object.assign(LOCS.lodge3,{x:-22,w:14});LOCS.lodge3.door={x:-22,z:166-12/2-1.5};
CITY_IDS.forEach(id=>{const L=LOCS[id];if(L.kind==='beach'){L.door={x:L.x,z:536};return;}if(L.kind==='pier'){L.door={x:L.x,z:540};return;}L.door=cityDoor(L);});
/* places where cars stand: never a tree or a lamp here */
CARZONE.push({n:'Express Motors forecourt',x:-95,z:396,w:34,d:24},{n:'Mama Pat yard',x:-55,z:396,w:26,d:24},{n:'City Fuel',x:-20,z:396,w:20,d:22},
  {n:'Motor park',x:-92,z:440,w:32,d:26},{n:'Nightlife car park',x:-62,z:514,w:48,d:14},{n:'Hotel drop-off',x:32,z:472,w:14,d:8});
/* district names shown when you walk or drive into each one */
const ZONES={campus:['VERITAS UNIVERSITY','Main campus · Bwari'],town:['BWARI JUNCTION','Off campus · lodges, autos, fuel'],
  gardens:['KUBWA GARDENS','Homes · primary school · park'],cbd:['CENTRAL BUSINESS DISTRICT','Market · shops · bank · offices · hospital · police'],
  motors:['MOTORS & LEISURE','Dealership · mechanic · motor park · gym · cinema · food'],lake:['LAKESIDE','Nightlife quarter · hotel · pitch · beach'],
  road:['BWARI EXPRESSWAY','Junction ↔ Bwari City']};
function zoneAt(x,z){if(z<=106)return 'campus';if(z<=206)return 'town';if(z<=212)return 'road';if(z<=300)return 'gardens';if(z<=380)return 'cbd';if(z<=460)return 'motors';return 'lake';}

/* ================= CITY BUILDING TOOLS =================
   CB collects plain boxes (walls, stalls, benches, umbrellas...) and draws them all as ONE instanced mesh
   with a colour per box, so the whole city's filler costs a handful of draw calls on a phone. */
const CB={boxes:[],wins:[]};
function cbBox(x,y,z,sx,sy,sz,col,ry){CB.boxes.push([x,y,z,sx,sy,sz,col,ry||0]);}
/* ---- filler buildings: deterministic rows of homes, shops, offices and workshops along every city street,
   never on a road, a sidewalk, a place's doorway, a car zone or another building ---- */
const FILLER=[];
function fillerFree(x,z,w,d){const m=3;
  for(const id in LOCS){const L=LOCS[id];if(L.x==null||L.w==null)continue;if(Math.abs(x-L.x)<(w+L.w)/2+m&&Math.abs(z-L.z)<(d+L.d)/2+m)return false;
    if(L.door&&Math.abs(x-L.door.x)<w/2+4&&Math.abs(z-L.door.z)<d/2+4)return false;}
  for(const f of FILLER)if(Math.abs(x-f.x)<(w+f.w)/2+2.5&&Math.abs(z-f.z)<(d+f.d)/2+2.5)return false;
  if(inCarZone(x,z,Math.max(w,d)/2+1))return false;
  for(const rx of CITYX)if(Math.abs(x-rx)<w/2+10.5)return false;
  for(const rz of CITYZ)if(Math.abs(z-rz)<d/2+10.5)return false;
  if(z-d/2<212||z+d/2>526||Math.abs(x)+w/2>136)return false;return true;}
{const STYLE={gardens:{h:[4,8],w:[10,14],d:[9,12],col:[0xe8dcc0,0xd9c9a8,0xf0e6d0,0xcfd8c8,0xe6cfc0,0xf2e2c8],roof:[0x8a3a2a,0x6b6b6b,0x3b5a6b,0x2f4a6b],pitched:0.75},
    cbd:{h:[9,24],w:[12,18],d:[10,14],col:[0xd9dde2,0xe8e2d0,0xc9d2d9,0xf2efe6,0xb8c6cf,0xe3d6bd],roof:[0x4a4a4a,0x2b3a4a,0x5a5a5a],pitched:0},
    motors:{h:[5,9],w:[14,20],d:[10,14],col:[0xd9d2c0,0xc9c4b8,0xe0d8c8,0xbfb8a8],roof:[0x6b6b6b,0x8a8a8a,0x3a4a5a],pitched:0.2},
    lake:{h:[5,12],w:[12,18],d:[10,13],col:[0xf2ead8,0xe9dcc4,0xdfe6e8,0xf6f0e2],roof:[0x2b4f8a,0x3a3a4a,0x8a3a2a],pitched:0.4}};
  for(let iz=0;iz<CITYZ.length-1;iz++)for(const side of [-1,1]){const z0=CITYZ[iz],z1=CITYZ[iz+1];const zone=zoneAt(0,(z0+z1)/2);const st=STYLE[zone]||STYLE.gardens;
    const xa=side<0?-130:0,xb=side<0?0:130;
    /* sweep the whole block: rows along both streets first, then whatever space is left in the middle */
    for(let pass=0;pass<2;pass++)for(let zz=z0+11;zz<=z1-11;zz+=pass?4:z1-z0-22){let x=xa+12;let guard=0;while(x<xb-10&&guard++<60){const w=wri(st.w[0],st.w[1]),d=wri(st.d[0],st.d[1]),h=wri(st.h[0],st.h[1]);
        const front=zz>(z0+z1)/2?1:0;const cz=pass?zz+d/2:(front?z1-10.6-d/2:z0+10.6+d/2);const cx=x+w/2;
        if(fillerFree(cx,cz,w,d)){FILLER.push({x:cx,z:cz,w,d,h,col:wpick(st.col),roof:wpick(st.roof),pitched:WSEED()<st.pitched,front,zone});x+=w+wri(3,5);}else x+=3;}}}}
/* ---- the city's ground, the lake and its shore ---- */
let cityGround=null;
{const g=new THREE.Mesh(new THREE.PlaneGeometry(284,356),new THREE.MeshLambertMaterial({map:noiseTex('#86915a',['#93a35a','#7a8a48','#a09a6a','#6f7d44'],256,22)}));g.rotation.x=-Math.PI/2;g.position.set(0,0.004,378);g.receiveShadow=true;outdoor.add(g);cityGround=g;window.cityGround=g;
  const strip=new THREE.Mesh(new THREE.PlaneGeometry(40,14),new THREE.MeshLambertMaterial({map:noiseTex('#8f7f5c',['#a08d63','#7a6c4c'],128,6)}));strip.rotation.x=-Math.PI/2;strip.position.set(0,0.004,206);outdoor.add(strip);
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1400,420),new THREE.MeshStandardMaterial({color:0x3f7d93,roughness:0.18,metalness:0.25,transparent:true,opacity:0.94}));water.rotation.x=-Math.PI/2;water.position.set(0,0.03,766);water.userData.water=true;outdoor.add(water);window.cityWater=water;
  const sand=new THREE.Mesh(new THREE.PlaneGeometry(1400,10),new THREE.MeshLambertMaterial({map:noiseTex('#e3cf9a',['#d9c48a','#efdcae','#cbb47c'],128,40)}));sand.rotation.x=-Math.PI/2;sand.position.set(0,0.02,553);outdoor.add(sand);}
/* ---- builders for the new kinds of place (the usual ones: building, fuel, field, court, are built as before) ---- */
{const _bl=buildLoc;buildLoc=function(L){const B=CITY_KIND[L.kind];if(!B)return _bl(L);const g=new THREE.Group();g.position.set(L.x,0,L.z);g.userData.loc=L.id;outdoor.add(g);pickables.push(g);B(L,g);return g;};}
function citySign(g,text,sub,x,y,z,ry,bg,fg,w){const s=new THREE.Mesh(new THREE.PlaneGeometry(w||8,1.6),new THREE.MeshBasicMaterial({map:textTex(sub?[[text,'800 32px sans-serif'],[sub,'600 20px sans-serif']]:[[text,'800 34px sans-serif']],320,64,bg||'#1f2d44',fg||'#ffffff'),side:THREE.DoubleSide}));s.position.set(x,y,z);s.rotation.y=ry||0;g.add(s);return s;}
const CITY_KIND={
  citypark(L,g){part(G.box,0x5a9a44,L.w,0.08,L.d,0,0.05,0,g,false);
    /* jogging loop */[[0,-L.d/2+1.2,L.w-1,1.4],[0,L.d/2-1.2,L.w-1,1.4]].forEach(([x,z,w,d])=>cbBox(L.x+x,0.1,L.z+z,w,0.06,d,0xc9b28a));[[-L.w/2+1.2,0,1.4,L.d-1],[L.w/2-1.2,0,1.4,L.d-1]].forEach(([x,z,w,d])=>cbBox(L.x+x,0.1,L.z+z,w,0.06,d,0xc9b28a));
    /* fountain */part(G.cyl,0xbdb6a8,3,0.7,3,0,0.35,0,g);const wt=part(G.cyl,0x5aa9c9,2.6,0.1,2.6,0,0.72,0,g,false);wt.material=new THREE.MeshStandardMaterial({color:0x5aa9c9,roughness:0.1,metalness:0.3});part(G.cyl,0xbdb6a8,0.35,2,0.35,0,1.4,0,g);obsC(L.x,L.z,3.1);
    /* swings and a slide */const px=L.x+12,pz=L.z-2;[-1.6,1.6].forEach(o=>{cbBox(px+o,1.3,pz,0.15,2.6,0.15,0x2f6b8f);obsC(px+o,pz,0.15);});cbBox(px,2.6,pz,3.4,0.15,0.15,0x2f6b8f);[-0.7,0.7].forEach(o=>cbBox(px+o,0.6,pz,0.6,0.08,0.3,0xd23b2b));
    const sx=L.x-12,sz=L.z+1;cbBox(sx,0.9,sz-1.2,1,1.8,1,0xe3b04b);obsR(sx,sz-1.2,1,1);const sl=part(G.box,0xd23b2b,0.9,0.1,3,sx-L.x,0.9,sz-L.z+0.6,g);sl.rotation.x=-0.5;obsR(sx,sz+0.6,0.9,2.6);
    citySign(g,'GARDENS PARK','Playground · jogging path',0,2.8,-L.d/2-0.6,Math.PI,'#2f6b3e','#f2efe6',6);part(G.box,0x444444,0.1,2.4,0.1,-3,1.2,-L.d/2-0.6,g);part(G.box,0x444444,0.1,2.4,0.1,3,1.2,-L.d/2-0.6,g);obsC(L.x-3,L.z-L.d/2-0.6,0.15);obsC(L.x+3,L.z-L.d/2-0.6,0.15);},
  market(L,g){part(G.box,0x8a8478,L.w,0.1,L.d,0,0.05,0,g,false);
    const TARP=[0xd23b2b,0x2b6fd9,0xe3b04b,0x2f8a57,0xe0629a,0xf08a2b];let i=0;
    for(const rz of [-5.5,5.5])for(let rx=-11;rx<=11;rx+=5.5){const x=L.x+rx,z=L.z+rz;const t=TARP[(i++)%TARP.length];
      [[-1.9,-1.4],[1.9,-1.4],[-1.9,1.4],[1.9,1.4]].forEach(([a,b])=>cbBox(x+a,1.3,z+b,0.1,2.6,0.1,0x5a4a3a));cbBox(x,2.7,z,4.4,0.12,3.4,t);
      cbBox(x,0.5,z+(rz<0?-0.6:0.6),3.6,1,1.2,0x7b5636);for(let k=0;k<6;k++)cbBox(x-1.4+k*0.56,1.12,z+(rz<0?-0.6:0.6),0.42,0.24,0.42,[0xd9562b,0xe3b04b,0x2f8a57,0x8a3a2b,0xf2efe6,0x5a8a3a][(k+i)%6]);
      obsR(x,z+(rz<0?-0.6:0.6),3.7,1.3);}
    citySign(g,'BWARI CENTRAL MARKET','Foodstuff · fabric · phones',0,4.2,-L.d/2,Math.PI,'#7a2331','#fff6df',9);[-4,4].forEach(o=>{part(G.box,0x444444,0.12,4.2,0.12,o,2.1,-L.d/2,g);obsC(L.x+o,L.z-L.d/2,0.15);});},
  lot2(L,g){part(G.box,0x9a9488,L.w,0.1,L.d,0,0.05,0,g,false);
    /* glass showroom at the back */const bx=L.x+L.w/2-5,bz=L.z+L.d/2-3.6;cbBox(bx,2,bz,9,4,6,0xe8e2d0);cbBox(bx,4.2,bz,9.6,0.4,6.6,0x1f2d44);obsR(bx,bz,9.2,6.2);
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(8,3),new THREE.MeshStandardMaterial({color:0x2a3a44,roughness:0.1,metalness:0.6}));gl.position.set(bx-L.x,1.8,bz-L.z-3.05);gl.rotation.y=Math.PI;g.add(gl);
    citySign(g,'EXPRESS MOTORS','New & used · bikes · okadas',-4,5.4,-L.d/2+0.2,Math.PI,'#c62b2b','#ffffff',10);[-9,1].forEach(o=>{part(G.cyl,0x444444,0.1,5,0.1,o,2.5,-L.d/2+0.25,g);obsC(L.x+o,L.z-L.d/2+0.25,0.2);});
    [[-11,0x2b6fd9,0.3,'sedan'],[-5,0xe8e2d0,0.3,'suv'],[1,0xc62b2b,0.3,'sedan']].forEach(([x,c,r,k])=>{const V=buildVehicle(k,c);V.g.position.set(L.x+x,0,L.z+1.5);V.g.rotation.y=r;obsR(L.x+x,L.z+1.5,2.6,5.8,r);});
    for(let i=0;i<10;i++){const f=part(G.box,[0xd23b2b,0xe3b04b,0x2f8a57][i%3],0.5,0.6,0.02,-13+i*2.4,4.6,-L.d/2+0.3,g,false);f.rotation.z=0.3;}},
  workshop(L,g){part(G.box,0x77736c,L.w,0.1,L.d,0,0.05,0,g,false);
    /* open shed */[[-L.w/2+0.4,L.d/2-0.4],[L.w/2-0.4,L.d/2-0.4],[-L.w/2+0.4,0.6],[L.w/2-0.4,0.6]].forEach(([a,b])=>{cbBox(L.x+a,2.3,L.z+b,0.3,4.6,0.3,0x5a5a5a);obsC(L.x+a,L.z+b,0.2);});cbBox(L.x,4.7,L.z+3.4,L.w,0.2,7.6,0x2b4f8a);
    cbBox(L.x-5,0.6,L.z+4,4,1.2,1,0xb8b8b8);obsR(L.x-5,L.z+4,4,1);/* lift */const V=buildVehicle('sedan',0x7a2331);V.g.position.set(L.x-5,1.3,L.z+4);V.g.rotation.y=Math.PI/2;
    for(let k=0;k<5;k++)cbBox(L.x+6.5,0.2+k*0.4,L.z+5.8,0.9,0.36,0.9,0x151515);obsR(L.x+6.5,L.z+5.8,1,1);
    /* wash bay */cbBox(L.x+5,0.06,L.z-2.5,6,0.04,8,0x6a8a9a);cbBox(L.x+8,1,L.z-2.5,0.4,2,0.4,0x2b6fd9);obsC(L.x+8,L.z-2.5,0.3);
    citySign(g,"MAMA PAT GARAGE",'Repairs · paint · rims · wash',0,5.6,-L.d/2+0.2,Math.PI,'#2b4f8a','#fff6df',9);[-4.2,4.2].forEach(o=>{part(G.cyl,0x444444,0.1,5.6,0.1,o,2.8,-L.d/2+0.25,g);obsC(L.x+o,L.z-L.d/2+0.25,0.2);});},
  motorpark(L,g){part(G.box,0x5a5753,L.w,0.1,L.d,0,0.05,0,g,false);
    for(const sx of [-8,8]){cbBox(L.x+sx,3,L.z+L.d/2-2,9,0.2,3,0x2f8a57);[-4,4].forEach(o=>{cbBox(L.x+sx+o,1.5,L.z+L.d/2-1,0.15,3,0.15,0x444444);obsC(L.x+sx+o,L.z+L.d/2-1,0.15);});cbBox(L.x+sx,0.45,L.z+L.d/2-2,6,0.12,0.7,0x7a5636);obsR(L.x+sx,L.z+L.d/2-2,6,0.8);}
    [[-6,0],[6,0]].forEach(([x,z])=>{const V=buildVehicle('bus',0xf2c230,{plate:'DANFO'});cbBox(L.x+x,0.75,L.z+z,2.08,0.25,6.26,0x111111);V.g.position.set(L.x+x,0,L.z+z);V.g.rotation.y=Math.PI;obsR(L.x+x,L.z+z,2.6,7);});
    citySign(g,'CITY MOTOR PARK','Danfo · ₦200 any district',0,4.4,-L.d/2+0.2,Math.PI,'#f2c230','#1a1405',8);[-3.6,3.6].forEach(o=>{part(G.box,0x444444,0.12,4.4,0.12,o,2.2,-L.d/2+0.25,g);obsC(L.x+o,L.z-L.d/2+0.25,0.15);});},
  carpark2(L,g){part(G.box,0x4a4844,L.w,0.1,L.d,0,0.05,0,g,false);for(let i=0;i<=Math.floor(L.w/3);i++)cbBox(L.x-L.w/2+0.8+i*3,0.11,L.z,0.12,0.02,L.d-0.8,0xf2f2ea);
    [[-15,0x2b2b2b],[3,0xe8e2d0],[12,0x7a2331]].forEach(([x,c])=>{const c2=makeCarLite(c);c2.position.set(L.x+x,0,L.z);c2.rotation.y=Math.PI;obsR(L.x+x,L.z,2.6,5.8);});},
  beach(L,g){/* umbrellas, loungers, a lifeguard tower and a volleyball net on the sand */
    {const sd=new THREE.Mesh(new THREE.PlaneGeometry(L.w+40,L.d+6),new THREE.MeshLambertMaterial({map:noiseTex('#e8d29c',['#dcc488','#f2e2b4','#cfb47c'],128,30)}));sd.rotation.x=-Math.PI/2;sd.position.set(0,0.03,2);g.add(sd);}
    for(let i=0;i<9;i++){const x=L.x-L.w/2+10+i*16,z=L.z+(i%2?2:-1);cbBox(x,1.2,z,0.1,2.4,0.1,0xdddddd);cbBox(x,2.45,z,3,0.15,3,[0xd23b2b,0x2b6fd9,0xe3b04b][i%3]);cbBox(x+1.6,0.3,z,0.8,0.15,2,0xf2f2ea);obsC(x,z,0.15);}
    const tx=L.x+L.w/2-14,tz=L.z;[[-0.8,-0.8],[0.8,-0.8],[-0.8,0.8],[0.8,0.8]].forEach(([a,b])=>cbBox(tx+a,1.2,tz+b,0.15,2.4,0.15,0xf2f2ea));cbBox(tx,2.5,tz,2,0.2,2,0xd23b2b);cbBox(tx,3.3,tz,1.8,1.4,1.8,0xf2f2ea);obsR(tx,tz,1.9,1.9);
    const nx=L.x-30,nz=L.z;[-4,4].forEach(o=>{cbBox(nx+o,1.2,nz,0.12,2.4,0.12,0x444444);obsC(nx+o,nz,0.12);});cbBox(nx,2.1,nz,8,0.6,0.04,0xf2f2ea);},
  pier(L,g){const z0=L.z-L.d/2;for(let k=0;k<Math.floor(L.d/1.2);k++)cbBox(L.x,0.32,z0+0.6+k*1.2,L.w,0.12,1.1,0x8a6a45);
    for(let k=0;k<=Math.floor(L.d/4);k++)for(const s of [-1,1]){cbBox(L.x+s*(L.w/2-0.1),0.0,z0+k*4,0.3,1.6,0.3,0x5a4430);cbBox(L.x+s*(L.w/2-0.05),1.0,z0+k*4,0.1,1.0,0.1,0x5a4430);}
    for(const s of [-1,1]){cbBox(L.x+s*(L.w/2-0.05),1.45,L.z,0.08,0.08,L.d,0x5a4430);obsR(L.x+s*(L.w/2+0.3),L.z,0.4,L.d);}obsR(L.x,L.z+L.d/2+0.3,L.w+1,0.4);}};
/* ---- after the town is built (obstacles, trees and lamps exist): draw the filler, city trees, benches and
   bus stops, register their collisions, then the walk grid is built with all of it ---- */
function cityBuild(){
  FILLER.forEach(f=>{cbBox(f.x,f.h/2,f.z,f.w,f.h,f.d,f.col);cbBox(f.x,0.25,f.z,f.w+0.3,0.5,f.d+0.3,0x8c7d68);
    if(f.pitched){cbBox(f.x,f.h+0.2,f.z,f.w+0.8,0.4,f.d+0.8,f.roof);cbBox(f.x,f.h+1.1,f.z,f.w*0.7,1.4,f.d*0.55,f.roof);}else{cbBox(f.x,f.h+0.3,f.z,f.w+0.5,0.6,f.d+0.5,f.roof);cbBox(f.x,f.h+0.9,f.z+f.d/2,f.w+0.5,0.6,0.25,f.col);}
    const facing=f.front?1:-1;/* door and windows on the street side */cbBox(f.x,1.3,f.z-facing*(f.d/2+0.06),1.6,2.6,0.12,0x3a2a1e);
    const floors=Math.max(1,Math.floor(f.h/3.3)),n=Math.max(1,Math.floor(f.w/3.6));
    for(let fl=0;fl<floors;fl++)for(let k=0;k<n;k++){const ox=-f.w/2+(k+0.5)*f.w/n;if(fl===0&&Math.abs(ox)<1.4)continue;for(const s of [-1,1])CB.wins.push([f.x+ox,1.9+fl*3.3,f.z+s*(f.d/2+0.07),1.2,1.2,0.06]);}
    for(let fl=0;fl<floors;fl++)for(const s of [-1,1])CB.wins.push([f.x+s*(f.w/2+0.07),1.9+fl*3.3,f.z,0.06,1.2,Math.min(1.4,f.d*0.2)]);
    obsR(f.x,f.z,f.w+0.3,f.d+0.3);});
  /* trees: avenue rows along city streets, more in the park and the gardens, and bush along the outer edges */
  const CT=[];const ok=(x,z,k)=>!blocked(x,z,2.6+2*k)&&!CT.some(t=>Math.hypot(t[0]-x,t[1]-z)<5.5)&&!FILLER.some(f=>Math.abs(x-f.x)<f.w/2+2.5&&Math.abs(z-f.z)<f.d/2+2.5)&&!PROPS.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+2.2);
  for(let k=0;k<900&&CT.length<(QH?170:QM?130:95);k++){let x,z;const s=wrnd(0.85,1.3);
    if(k%2===0){const r=wpick(ROADS.filter(q=>q.city)),vert=r.x1===r.x2,o=wpick([-11.5,11.5]),u=wrnd(0,1);if(vert){x=r.x1+o;z=r.z1+(r.z2-r.z1)*u;}else{z=r.z1+o;x=r.x1+(r.x2-r.x1)*u;}}
    else if(k%5===1){const P2=LOCS.cpark;x=P2.x+wrnd(-P2.w/2+3,P2.w/2-3);z=P2.z+wrnd(-P2.d/2+3,P2.d/2-3);if(Math.hypot(x-P2.x,z-P2.z)<6)continue;}
    else{x=wrnd(-128,128);z=wrnd(214,528);}
    if(x>-110&&x<110&&z>=200&&z<212)continue;if(ok(x,z,s))CT.push([x,z,s,wri(0,2)]);}
  for(let k=0;k<400&&CT.length<(QH?260:QM?200:150);k++){const side=wpick([-1,1]);const x=side*wrnd(146,230),z=wrnd(200,540);const s=wrnd(1.1,1.7);if(!CT.some(t=>Math.hypot(t[0]-x,t[1]-z)<6))CT.push([x,z,s,wri(0,2)]);}
  {const crowns=[0x3f6b33,0x4f7d3a,0x335c2e].map(c=>new THREE.InstancedMesh(G.sphLo,new THREE.MeshLambertMaterial({color:c}),CT.length));const trunk=new THREE.InstancedMesh(G.cyl,mat(0x5e4630),CT.length);const cn=[0,0,0];
    const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sv=new THREE.Vector3(),pv=new THREE.Vector3();
    CT.forEach(([x,z,k,c],i)=>{sv.set(0.35*k,3.2*k,0.35*k);pv.set(x,1.6*k,z);m4.compose(pv,q,sv);trunk.setMatrixAt(i,m4);sv.set(2.4*k,1.9*k,2.4*k);pv.set(x,3.9*k,z);m4.compose(pv,q,sv);crowns[c].setMatrixAt(cn[c]++,m4);obsC(x,z,0.35*k+0.12);});
    trunk.castShadow=!!QH;outdoor.add(trunk);crowns.forEach((m,i)=>{m.count=cn[i];m.castShadow=!!QH;outdoor.add(m);});}
  window.__CITYTREES=CT;
  /* bus stops (the danfo stops at these) and benches along the Expressway */
  CITY_STOPS.forEach(s=>{cbBox(s.x,2.6,s.z,4,0.15,1.8,0xf2c230);cbBox(s.x-1.8,1.3,s.z,0.12,2.6,0.12,0x444444);cbBox(s.x+1.8,1.3,s.z,0.12,2.6,0.12,0x444444);cbBox(s.x,0.45,s.z+0.5,3.2,0.1,0.5,0x7a5636);obsC(s.x-1.8,s.z,0.15);obsC(s.x+1.8,s.z,0.15);obsR(s.x,s.z+0.5,3.2,0.5);});
  /* draw every collected box as one instanced mesh, and every window as another (they glow at night) */
  {const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sv=new THREE.Vector3(),pv=new THREE.Vector3(),col=new THREE.Color();
    const im=new THREE.InstancedMesh(G.box,new THREE.MeshLambertMaterial({color:0xffffff}),CB.boxes.length);
    CB.boxes.forEach(([x,y,z,sx,sy,sz,c,ry],i)=>{e.set(0,ry,0);q.setFromEuler(e);sv.set(sx,sy,sz);pv.set(x,y,z);m4.compose(pv,q,sv);im.setMatrixAt(i,m4);im.setColorAt(i,col.setHex(c));});
    if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=!!QH;im.receiveShadow=true;im.frustumCulled=false;outdoor.add(im);
    const wm=new THREE.InstancedMesh(G.box,winLit,CB.wins.length);q.identity();CB.wins.forEach(([x,y,z,sx,sy,sz],i)=>{sv.set(sx,sy,sz);pv.set(x,y,z);m4.compose(pv,q,sv);wm.setMatrixAt(i,m4);});wm.frustumCulled=false;outdoor.add(wm);
    window.__CITYDRAW={boxes:CB.boxes.length,wins:CB.wins.length,filler:FILLER.length,trees:CT.length};}
}
/* danfo stops: one on each side of every city block along the Expressway and at the motor park */
const CITY_STOPS=[{id:'stopA',x:-11.5,z:262,n:'Kubwa Gardens stop'},{id:'stopB',x:11.5,z:338,n:'Central Business District stop'},{id:'stopC',x:-11.5,z:418,n:'Motors & Leisure stop'},{id:'stopD',x:11.5,z:498,n:'Lakeside stop'},{id:'stopJ',x:-11.5,z:182,n:'Bwari Junction stop'}];

function zoneLabel(){const z=zoneAt(P.x,P.z);return {campus:'Campus',town:'Bwari Junction',road:'Bwari Expressway',gardens:'Kubwa Gardens',cbd:'Business District',motors:'Motors & Leisure',lake:'Lakeside'}[z]||'Bwari';}
