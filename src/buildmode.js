/* ================= DECORATE (build / buy mode) =================
   In a home that is yours (a rented lodge or the duplex you bought) a "Decorate" button appears.
   Buy furniture from the catalogue, tap the floor to position it, rotate, place. Placed furniture can be
   moved or sold back (half price). Most pieces do something: sit, sleep, watch TV, play, read, snack.
   Saved per home in S.decor. */
const DECOR=[
  {k:'sofa',n:'Three-seat sofa',p:45000,c:'Living',w:3.2,d:1.1,fx:'sit'},
  {k:'arm',n:'Armchair',p:22000,c:'Living',w:1.2,d:1.1,fx:'sit'},
  {k:'coffee',n:'Coffee table',p:12000,c:'Living',w:1.6,d:0.9},
  {k:'tv',n:'Flat-screen TV on a stand',p:95000,c:'Living',w:2.4,d:0.6,fx:'tv'},
  {k:'ps',n:'Game console & TV',p:250000,c:'Living',w:2.4,d:0.6,fx:'game'},
  {k:'speaker',n:'Sound system',p:60000,c:'Living',w:1.4,d:0.6,fx:'music'},
  {k:'rug',n:'Big rug',p:15000,c:'Decor',w:3,d:2,flat:true},
  {k:'plant',n:'Potted plant',p:6000,c:'Decor',w:0.7,d:0.7},
  {k:'lamp',n:'Floor lamp',p:9000,c:'Decor',w:0.6,d:0.6},
  {k:'shelf',n:'Bookshelf',p:18000,c:'Study',w:1.6,d:0.5,fx:'read'},
  {k:'desk',n:'Study desk & chair',p:30000,c:'Study',w:1.8,d:0.9,fx:'study'},
  {k:'dining',n:'Dining set (4 chairs)',p:38000,c:'Kitchen',w:2.6,d:2.2,fx:'eat'},
  {k:'fridge',n:'Fridge',p:120000,c:'Kitchen',w:0.9,d:0.8,fx:'snack'},
  {k:'bed',n:'Double bed',p:85000,c:'Bedroom',w:2.2,d:2.6,fx:'sleep'},
  {k:'wardrobe',n:'Wardrobe',p:40000,c:'Bedroom',w:1.8,d:0.7}];
const DECOR_BY=Object.fromEntries(DECOR.map(d=>[d.k,d]));
const WOOD=0x6b4a2e,DARK=0x2b2b2b;
function decorMesh(k,col){const g=new THREE.Group(),B=(c,sx,sy,sz,x,y,z,sh)=>part(G.box,c,sx,sy,sz,x,y,z,g,sh!==false);const cl=col||0x3d5a8a;
  switch(k){
    case 'sofa':B(cl,3.2,0.5,1.1,0,0.35,0);B(cl,3.2,0.8,0.28,0,0.9,-0.42);B(cl,0.28,0.65,1.1,-1.46,0.55,0);B(cl,0.28,0.65,1.1,1.46,0.55,0);[-0.8,0.8].forEach(x=>B(0xe3b04b,0.6,0.35,0.14,x,0.95,-0.22,false));break;
    case 'arm':B(cl,1.2,0.5,1.1,0,0.35,0);B(cl,1.2,0.8,0.28,0,0.9,-0.42);B(cl,0.22,0.65,1.1,-0.5,0.55,0);B(cl,0.22,0.65,1.1,0.5,0.55,0);break;
    case 'coffee':B(WOOD,1.6,0.08,0.9,0,0.5,0);[[-0.7,-0.35],[0.7,-0.35],[-0.7,0.35],[0.7,0.35]].forEach(([x,z])=>B(0x4a3220,0.07,0.5,0.07,x,0.25,z));B(0xd9562b,0.25,0.18,0.25,0.3,0.63,0,false);break;
    case 'tv':case 'ps':{B(WOOD,2.4,0.55,0.6,0,0.28,0);B(0x111111,2.1,1.2,0.08,0,1.25,-0.15);const scr=part(G.box,0x223344,1.95,1.05,0.02,0,1.25,-0.1,g,false);scr.material=new THREE.MeshLambertMaterial({color:0x223344,emissive:k==='ps'?0x3a2a7a:0x2a6a9a,emissiveIntensity:0.8});
      if(k==='ps'){B(0xf2f2f2,0.35,0.08,0.28,-0.6,0.6,0.05);B(0x111111,0.2,0.05,0.12,0.4,0.58,0.15);}break;}
    case 'speaker':B(DARK,0.45,1.1,0.5,-0.45,0.55,0);B(DARK,0.45,1.1,0.5,0.45,0.55,0);[-0.45,0.45].forEach(x=>{const c=part(G.cyl,0x555555,0.16,0.04,0.16,x,0.75,0.26,g,false);c.rotation.x=Math.PI/2;});break;
    case 'rug':B(cl===0x3d5a8a?0x8a2b2b:cl,3,0.03,2,0,0.02,0,false);B(0xe3b04b,2.6,0.035,1.6,0,0.025,0,false);B(cl===0x3d5a8a?0x8a2b2b:cl,2.2,0.04,1.2,0,0.03,0,false);break;
    case 'plant':B(0xb5651d,0.5,0.5,0.5,0,0.25,0);for(let i=0;i<6;i++){const l=part(G.sphLo,i%2?0x2f8a57:0x3f6b33,0.35,0.5,0.35,Math.cos(i)*0.18,0.85+i*0.06,Math.sin(i)*0.18,g);}break;
    case 'lamp':B(DARK,0.4,0.06,0.4,0,0.03,0);B(DARK,0.06,1.7,0.06,0,0.88,0);{const sh=part(G.cyl,0xf2e6c8,0.32,0.4,0.32,0,1.8,0,g,false);sh.material=new THREE.MeshLambertMaterial({color:0xf2e6c8,emissive:0xffd28a,emissiveIntensity:0.6});}break;
    case 'shelf':B(WOOD,1.6,2.2,0.45,0,1.1,0);for(let s=0;s<4;s++)for(let b=0;b<7;b++)B([0xd9562b,0x2b6fd9,0x2f8a57,0xe3b04b,0x7a2331][(s+b)%5],0.14,0.38,0.32,-0.6+b*0.2,0.38+s*0.5,0.08,false);break;
    case 'desk':B(WOOD,1.8,0.08,0.9,0,1.1,0);[[-0.8,-0.38],[0.8,-0.38],[-0.8,0.38],[0.8,0.38]].forEach(([x,z])=>B(0x4a3220,0.07,1.1,0.07,x,0.55,z));B(DARK,0.55,0.08,0.55,0,0.6,0.75);B(DARK,0.55,0.6,0.08,0,0.95,1.0);B(0x222222,0.6,0.4,0.04,0.2,1.35,-0.2);break;
    case 'dining':B(WOOD,1.8,0.08,1.1,0,1.05,0);[[-0.8,-0.45],[0.8,-0.45],[-0.8,0.45],[0.8,0.45]].forEach(([x,z])=>B(0x4a3220,0.08,1.05,0.08,x,0.52,z));
      [[-0.5,-0.95,0],[0.5,-0.95,0],[-0.5,0.95,Math.PI],[0.5,0.95,Math.PI]].forEach(([x,z,r])=>{const c=new THREE.Group();c.position.set(x,0,z);c.rotation.y=r;g.add(c);part(G.box,WOOD,0.5,0.06,0.5,0,0.62,0,c);part(G.box,WOOD,0.5,0.6,0.06,0,0.92,-0.22,c);[[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]].forEach(([a,b])=>part(G.box,0x4a3220,0.05,0.62,0.05,a,0.31,b,c));});break;
    case 'fridge':B(0xe8e8e8,0.9,2.1,0.8,0,1.05,0);B(0xb8b8b8,0.04,0.5,0.04,0.35,1.4,0.41,false);B(0x999999,0.86,0.02,0.02,0,1.3,0.41,false);break;
    case 'bed':B(WOOD,2.2,0.5,2.6,0,0.25,0);B(0xf2efe6,2.05,0.28,2.45,0,0.62,0.02,false);B(cl,2.1,0.1,1.6,0,0.8,0.45,false);[-0.5,0.5].forEach(x=>B(0xffffff,0.8,0.18,0.45,x,0.85,-0.85,false));B(WOOD,2.2,1.3,0.12,0,0.65,-1.28);break;
    case 'wardrobe':B(WOOD,1.8,2.4,0.7,0,1.2,0);B(0x4a3220,0.02,2.2,0.02,0,1.2,0.36,false);[-0.12,0.12].forEach(x=>B(0xe3b04b,0.04,0.25,0.04,x,1.25,0.37,false));break;}
  return g;}

const BM={on:false};
function myHomeHere(){return S&&S.inside&&(S.inside===S.home||S.inside===S.ownHouse)&&S.inside!=='boys'&&S.inside!=='girls';}
function decorList(id){S.decor=S.decor||{};return S.decor[id]=S.decor[id]||[];}
/* (re)build the placed furniture of a home interior */
function decorBuild(I){if(I.decorObjs){I.decorObjs.forEach(o=>{if(o.g.parent)o.g.parent.remove(o.g);const pi=I.pick.indexOf(o.g);if(pi>=0)I.pick.splice(pi,1);const oi=I.objs.indexOf(o.def);if(oi>=0)I.objs.splice(oi,1);
    const li=I.labels.findIndex(l=>l.def===o.def);if(li>=0){I.labels[li].el.remove();I.labels.splice(li,1);}});}
  I.decorObjs=[];const L=(S.decor||{})[I.id];if(!L||!L.length){I.nav=null;return;}
  L.forEach((it,i)=>{const D=DECOR_BY[it.k];if(!D)return;const g=decorMesh(it.k,it.col);g.position.set(it.x,0,it.z);g.rotation.y=it.r||0;I.g.add(g);
    const fx=Math.sin(it.r||0),fz=Math.cos(it.r||0),sp={x:it.x+fx*(D.d/2+0.7),z:it.z+fz*(D.d/2+0.7)};
    const def=addObj(I,g,{id:'decor'+i,name:D.n.replace(/ \(.*\)| & .*| on a stand/,''),ly:D.flat?0.6:2.6,spot:sp,label:!D.flat,acts:()=>decorActs(I,it,D,sp)});I.decorObjs.push({g,def});});
  I.nav=null;}
function decorActs(I,it,D,sp){const id=I.id,r=it.r||0,seat={x:it.x+Math.sin(r)*0.1,y:0.05,z:it.z+Math.cos(r)*0.1,r,pose:'sit'},stand={x:sp.x,y:0,z:sp.z,r:r+Math.PI,pose:'stand'};const L=[];
  switch(D.fx){
    case 'sit':L.push(A('Sit and relax','30m · less stress',()=>startAction('Relaxing',30,{where:id,place:seat,per:()=>{N('stress',-0.25);N('fun',0.15);N('energy',0.03);}})));break;
    case 'tv':L.push(A('Watch TV','1h',()=>startAction('Watching TV',60,{where:id,place:Object.assign({},stand,{pose:'cross'}),per:()=>{N('fun',0.6);N('stress',-0.15);}})));break;
    case 'game':L.push(A('Play games','1h · FIFA with whoever is around',()=>startAction('Playing games',60,{where:id,place:Object.assign({},stand,{pose:'game'}),per:()=>{N('fun',0.85);N('stress',-0.2);N('social',0.1);}})));break;
    case 'music':L.push(A('Play music and dance','30m',()=>startAction('Dancing',30,{where:id,place:Object.assign({},stand,{pose:'dance'}),per:()=>{N('fun',0.7);N('energy',-0.08);}})));break;
    case 'read':L.push(A('Read a book','1h · a little smarter',()=>startAction('Reading',60,{where:id,place:Object.assign({},stand,{pose:'read'}),per:()=>N('fun',0.1),done:()=>{addStudy(0.7);S.skills.academic+=0.03;}})));break;
    case 'study':L.push(A('Study','1h 30m · quiet desk',()=>startAction('Studying',90,{where:id,place:{x:it.x+Math.sin(r)*0.75,y:0,z:it.z+Math.cos(r)*0.75,r:r+Math.PI,pose:'read'},per:()=>N('energy',-0.05),done:()=>{addStudy(1.25);S.skills.academic+=0.04;}})));break;
    case 'eat':L.push(A('Cook and eat a proper meal','45m · ₦800 foodstuff',()=>{if(!spend(800,'Foodstuff (home)'))return toast('Not enough money','','bad');startAction('Eating at home',45,{where:id,place:{x:it.x+Math.sin(r)*0.95,y:0,z:it.z+Math.cos(r)*0.95,r:r+Math.PI,pose:'eat'},per:()=>N('food',1.4),done:()=>{S.stats.meals++;addMoodlet('Home-cooked meal',8,300);}});},{cost:800}));break;
    case 'snack':L.push(A('Grab a snack and a cold drink','10m · ₦300',()=>{if(!spend(300,'Snack'))return toast('Not enough money','','bad');startAction('Snacking',10,{where:id,place:Object.assign({},stand,{pose:'stand'}),per:()=>N('food',1.3),done:()=>addMoodlet('Cold drink',3,120)});},{cost:300}));break;
    case 'sleep':{const bp={x:it.x,y:0.8,z:it.z+Math.cos(r)*0.2,r,pose:'lie'};L.push(A('Sleep','8h · double bed',()=>startAction('Sleeping',480,{sleep:true,where:id,place:bp,done:()=>addMoodlet('Slept in a big bed',8,600)})),A('Nap','2h',()=>startAction('Napping',120,{sleep:true,where:id,place:bp})));break;}}
  L.push(A('Move it','Decorate mode',()=>bmStart({move:it})));
  L.push(A('Sell it','+'+naira(Math.round(D.p/2)),()=>{const list=decorList(id);const i=list.indexOf(it);if(i>=0)list.splice(i,1);earn(Math.round(D.p/2),'Sold '+D.n);decorBuild(I);intNav(I);save();}));
  return L;}
HOOKS.populate.push(I=>{if(S&&S.decor&&S.decor[I.id])decorBuild(I);});

/* ---------- UI: Decorate button, catalogue, placement bar ---------- */
const bmBtn=el('button',null,'🛋 Decorate');bmBtn.id='bmBtn';bmBtn.hidden=true;$('#app').append(bmBtn);
const bmBar=el('div',null,'<span class="t"></span><button data-a="rot">⟳ Rotate</button><button data-a="ok">✓ Place</button><button data-a="no">✕</button>');bmBar.id='bmBar';bmBar.hidden=true;$('#app').append(bmBar);
{const st=document.createElement('style');st.textContent='body.bm-on #obj,body.bm-on #toasts{display:none!important}#bmBtn{position:absolute;left:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 74px);background:var(--ink);border:1px solid var(--line);border-radius:9px;padding:9px 12px;font-weight:600;font-size:12px;z-index:6}'+
  '#bmBar{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 74px);display:flex;gap:6px;align-items:center;background:var(--ink);border:1px solid var(--line);border-radius:12px;padding:8px;z-index:7;max-width:calc(100vw - 32px)}'+
  '#bmBar .t{font-size:12px;color:var(--muted);padding:0 6px;max-width:34vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#bmBar button{min-height:44px;padding:0 12px;border-radius:9px;border:1px solid var(--line);background:rgba(255,255,255,.06);font-weight:700;font-size:13px}#bmBar button[data-a=ok]{background:var(--gold);color:#1d1606;border-color:var(--gold)}#bmBar button:disabled{opacity:.45}';document.head.appendChild(st);}
setInterval(()=>{bmBtn.hidden=!(myHomeHere()&&!BM.on&&!CS.on&&!W.fading);if(BM.on&&!myHomeHere())bmEnd();},400);
bmBtn.onclick=()=>{if(!myHomeHere()||busy())return;const wrap=el('div');wrap.style.display='grid';wrap.style.gap='8px';const I=getInt(S.inside);const placed=decorList(S.inside);
  wrap.append(el('div','note','Tap an item to buy it, then tap the floor where it should go. Placed pieces: tap them to use, move or sell.'));
  ['Living','Kitchen','Bedroom','Study','Decor'].forEach(c=>{wrap.append(el('div','kicker2','<b style="font-size:11px;letter-spacing:.14em;color:var(--gold)">'+c.toUpperCase()+'</b>'));
    DECOR.filter(d=>d.c===c).forEach(d=>{const b=el('button','opt','<div class="l"><b>'+d.n+'</b><span>'+(d.fx?{sit:'Sit and relax',tv:'Watch TV',game:'Play games',music:'Music and dancing',read:'Read',study:'Study',eat:'Cook and eat',snack:'Snacks and cold drinks',sleep:'Sleep'}[d.fx]:'Decoration · makes home nicer')+'</span></div><div class="r"><span class="c">'+naira(d.p)+'</span></div>');
      if(S.money<d.p){b.disabled=true;}b.onclick=()=>{closeSheet();bmStart({k:d.k});};wrap.append(b);});});
  if(placed.length)wrap.append(el('div','note','You have '+placed.length+' piece'+(placed.length>1?'s':'')+' in this home.'));
  openSheet('Decorate',(LOCS[S.inside].iname||LOCS[S.inside].name),wrap);};
function bmStart(o){const I=getInt(S.inside);if(ACT)stopAction(true);if(UI.sheet)closeSheet();bmEnd(true);const D=o.move?DECOR_BY[o.move.k]:DECOR_BY[o.k];if(!D)return;
  BM.on=true;BM.I=I;BM.D=D;BM.move=o.move||null;BM.r=o.move?o.move.r||0:0;
  if(o.move){const i=BM.I.decorObjs.findIndex(x=>x.def.acts&&x.g.position.x===o.move.x&&x.g.position.z===o.move.z);if(i>=0)BM.I.decorObjs[i].g.visible=false;}
  BM.g=decorMesh(D.k,o.move&&o.move.col);BM.g.traverse(m=>{if(m.isMesh){m.material=m.material.clone();m.material.transparent=true;m.material.opacity=0.7;m.castShadow=false;}});
  BM.ring=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:0x2fbf6a,transparent:true,opacity:0.35,depthWrite:false}));BM.ring.rotation.x=-Math.PI/2;BM.ring.position.y=0.04;BM.ring.scale.set(D.w+0.2,D.d+0.2,1);BM.g.add(BM.ring);
  const x0=o.move?o.move.x:0,z0=o.move?o.move.z:0;BM.g.position.set(x0,0,z0);BM.g.rotation.y=BM.r;I.g.add(BM.g);
  cam.idist=Math.max(cam.idist||0,22);document.body.classList.add('bm-on');bmBar.hidden=false;bmBar.querySelector('.t').textContent=(o.move?'Move: ':'')+D.n+' · tap the floor';bmCheck();}
function bmEnd(silent){if(!BM.on)return;if(BM.g&&BM.g.parent)BM.g.parent.remove(BM.g);if(BM.move&&BM.I)BM.I.decorObjs.forEach(x=>x.g.visible=true);BM.on=false;BM.g=null;bmBar.hidden=true;document.body.classList.remove('bm-on');}
function bmFoot(x,z,D,r){const q=Math.abs(Math.round(r/(Math.PI/2)))%2===1;return{hw:(q?D.d:D.w)/2,hd:(q?D.w:D.d)/2,x,z};}
function bmCheck(){const I=BM.I,D=BM.D,p=BM.g.position,f=bmFoot(p.x,p.z,D,BM.r);let ok=Math.abs(p.x)+f.hw<I.w/2-0.35&&Math.abs(p.z)+f.hd<I.d/2-0.35;
  if(ok&&I.spawn&&Math.abs(p.x-I.spawn.x)<f.hw+1.2&&Math.abs(p.z-I.spawn.z)<f.hd+1.4)ok=false; // keep the doorway clear
  if(ok&&!D.flat){for(const it of decorList(I.id)){if(it===BM.move)continue;const E=DECOR_BY[it.k];if(!E||E.flat)continue;const g2=bmFoot(it.x,it.z,E,it.r||0);if(Math.abs(it.x-p.x)<f.hw+g2.hw&&Math.abs(it.z-p.z)<f.hd+g2.hd){ok=false;break;}}
    if(ok){/* the room's own furniture (bed, desk, kitchen...) from its walk grid, built without the pieces placed here */const hid=[];(I.decorObjs||[]).forEach(o=>{if(o.g.visible){o.g.visible=false;hid.push(o.g);}});BM.g.visible=false;const save0=I.nav;I.nav=null;const g=intNav(I);I.nav=save0;hid.forEach(h=>h.visible=true);BM.g.visible=true;
      for(let a=-1;a<=1&&ok;a+=0.5)for(let b=-1;b<=1;b+=0.5){const k=gIdx(g,p.x+a*f.hw*0.9,p.z+b*f.hd*0.9);if(k>=0&&g.blk[k]&&!(Math.abs(p.x+a*f.hw*0.9)>I.w/2-0.7||Math.abs(p.z+b*f.hd*0.9)>I.d/2-0.7)){ok=false;break;}}}}
  BM.ok=ok;BM.ring.material.color.setHex(ok?0x2fbf6a:0xd23b2b);bmBar.querySelector('[data-a=ok]').disabled=!ok;return ok;}
{const _tap=onTap;onTap=function(cx,cy){if(!BM.on)return _tap(cx,cy);const r=cv.getBoundingClientRect();mv.x=(cx-r.left)/r.width*2-1;mv.y=-(cy-r.top)/r.height*2+1;ray.setFromCamera(mv,camera);
  const h=ray.intersectObject(BM.I.floor,false)[0];if(!h)return;const p=BM.I.g.worldToLocal(h.point.clone());BM.g.position.set(Math.round(p.x*2)/2,0,Math.round(p.z*2)/2);bmCheck();};}
bmBar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!BM.on)return;const a=b.dataset.a;
  if(a==='rot'){BM.r=(BM.r+Math.PI/2)%(Math.PI*2);BM.g.rotation.y=BM.r;bmCheck();}
  else if(a==='no')bmEnd();
  else if(a==='ok'){if(!bmCheck())return;const p=BM.g.position,list=decorList(BM.I.id);
    if(BM.move){BM.move.x=p.x;BM.move.z=p.z;BM.move.r=BM.r;}
    else{if(!spend(BM.D.p,'Furniture: '+BM.D.n))return toast('Not enough money',BM.D.n+' costs '+naira(BM.D.p)+'.','bad');list.push({k:BM.D.k,x:p.x,z:p.z,r:BM.r});xp(10,'Decorated');if(list.length===3)addMoodlet('Home sweet home',10,1440);}
    const I=BM.I;bmEnd();decorBuild(I);intNav(I);save();toast('Decorate',BM.move?'Moved.':'Placed. Tap it to use it.','good');}});
/* a nicely furnished home lifts your mood while you are in it */
HOOKS.minute.push(m=>{if(m%30||!S||!myHomeHere())return;const n=decorList(S.inside).length;if(n>=4)addMoodlet('Nicely furnished home',Math.min(10,2+n),60);});
HOOKS.migrate.push(st=>{if(!st.decor)st.decor={};});
if(window.__QA)window.__BM={BM,bmStart,bmEnd,bmCheck,decorBuild,DECOR,myHomeHere};
