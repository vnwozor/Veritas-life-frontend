/* ================= VEHICLES (shaped bodies, glass, rims, lights, opening doors & boot) ================= */
const VLIGHT={head:new THREE.MeshLambertMaterial({color:0xf4f1e2,emissive:0xfff2c0,emissiveIntensity:0.15}),tail:new THREE.MeshLambertMaterial({color:0x7a1414,emissive:0xff2a1a,emissiveIntensity:0.2}),
  glass:new THREE.MeshStandardMaterial({color:0x1d2a33,roughness:0.12,metalness:0.55}),tyre:new THREE.MeshStandardMaterial({color:0x151515,roughness:0.92}),rim:new THREE.MeshStandardMaterial({color:0xb8bcc2,roughness:0.3,metalness:0.75}),
  trim:new THREE.MeshStandardMaterial({color:0x1b1b1b,roughness:0.6}),chrome:new THREE.MeshStandardMaterial({color:0xd9dde2,roughness:0.2,metalness:0.85}),inside:new THREE.MeshLambertMaterial({color:0x17130f})};
/* sky reflections: a small outdoor environment (sky gradient, bright horizon, sun) rendered once into a
   reflection map, so car paint, chrome and glass mirror the sky the way real ones do */
let ENVTEX=null;const ENV_MATS=[];
function envTex(){if(ENVTEX!==null)return ENVTEX;try{const es=new THREE.Scene();const g=new THREE.SphereGeometry(50,32,16);const col=[];const pos=g.getAttribute('position');const c=new THREE.Color();
    for(let i=0;i<pos.count;i++){const y=pos.getY(i)/50;if(y>0)c.setHex(0x9cc4e8).lerp(_envC.setHex(0xe8f1f7),Math.pow(1-y,4));else c.setHex(0x8a7a5e).lerp(_envC.setHex(0xd9d2c0),Math.pow(1+y,6));col.push(c.r,c.g,c.b);}
    g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));es.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
    const sunM=new THREE.Mesh(new THREE.SphereGeometry(4,16,8),new THREE.MeshBasicMaterial({color:0xffffff}));sunM.material.color.multiplyScalar(6);sunM.position.set(20,35,15);es.add(sunM);
    const pm=new THREE.PMREMGenerator(renderer);ENVTEX=pm.fromScene(es,0.02).texture;pm.dispose();}catch(e){ENVTEX=false;}return ENVTEX;}
const _envC=new THREE.Color();
function envMat(m,k){const t=envTex();if(t){m.envMap=t;m.envMapIntensity=k;m.userData.envK=k;m.needsUpdate=true;ENV_MATS.push(m);}return m;}
/* reflections fade at night (called from sky() with the daylight factor) */
function envLevel(day){const f=0.12+0.88*Math.max(0,Math.min(1,day));for(const m of ENV_MATS)m.envMapIntensity=m.userData.envK*f;}
envMat(VLIGHT.glass,1.1);envMat(VLIGHT.rim,0.9);envMat(VLIGHT.chrome,1.2);
const VBODY={};function vbodyM(c){return VBODY[c]||(VBODY[c]=envMat(new THREE.MeshStandardMaterial({color:c,roughness:0.3,metalness:0.25}),0.75));}
const VPROF={ // side silhouettes (x along the length, y up), metres before scaling: lower body, cabin glass, roof line
  sedan:{L:4.5,W:1.78,body:[[-2.25,0.3],[-2.31,0.7],[-2.22,0.95],[-1.32,1.0],[1.1,1.0],[2.14,0.86],[2.28,0.6],[2.22,0.3]],glass:[[-1.3,0.98],[-0.7,1.38],[0.42,1.4],[1.08,0.98]],roof:[-0.72,0.44,1.4],wb:[-1.38,1.4],tr:0.33},
  suv:{L:4.7,W:1.88,body:[[-2.35,0.4],[-2.38,0.95],[-2.33,1.12],[1.15,1.12],[2.26,1.0],[2.38,0.7],[2.33,0.4]],glass:[[-2.3,1.1],[-2.12,1.68],[0.55,1.71],[1.13,1.1]],roof:[-2.18,0.58,1.72],wb:[-1.45,1.5],tr:0.38},
  pickup:{L:5.2,W:1.86,body:[[-2.6,0.42],[-2.62,1.05],[-0.5,1.05],[-0.5,1.1],[1.2,1.1],[2.45,0.98],[2.6,0.7],[2.55,0.42]],glass:[[-0.48,1.08],[-0.42,1.66],[0.6,1.69],[1.16,1.08]],roof:[-0.48,0.62,1.7],wb:[-1.65,1.55],tr:0.38,bed:true},
  bus:{L:6.2,W:2.05,body:[[-3.1,0.42],[-3.1,1.35],[3.12,1.35],[3.12,0.42]],glass:[[-3.06,1.33],[-3.06,2.25],[2.62,2.25],[3.08,1.85],[3.1,1.33]],roof:[-3.08,2.66,2.3],wb:[-2.0,2.1],tr:0.42}};
function shapeOf(pts){const sh=new THREE.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.lineTo(pts[0][0],pts[0][1]);return sh;}
const VGEO={};function vgeo(kind,part,w){const k=kind+part+w;if(VGEO[k])return VGEO[k];const P2=VPROF[kind];
  const g=new THREE.ExtrudeGeometry(shapeOf(part==='glass'?P2.glass:P2.body),{depth:w,bevelEnabled:true,bevelThickness:part==='glass'?0.03:0.07,bevelSize:part==='glass'?0.03:0.07,bevelSegments:part==='glass'?2:3,curveSegments:4});
  g.translate(0,0,-w/2);g.rotateY(-Math.PI/2);g.computeVertexNormals();return VGEO[k]=g;}
const PLATE_T={};function plateTex(txt){return PLATE_T[txt]||(PLATE_T[txt]=textTex([['ABUJA','700 15px sans-serif'],[txt,'800 30px sans-serif']],128,64,'#f4f6f4','#1a5a2a'));}
function buildVehicle(kind,color,o){o=o||{};const P2=VPROF[kind],g=new THREE.Group(),b=new THREE.Group();g.add(b);const BM=vbodyM(color);const W=P2.W;
  const body=new THREE.Mesh(vgeo(kind,'body',W-0.14),BM);body.castShadow=true;body.receiveShadow=true;b.add(body);
  const gl=new THREE.Mesh(vgeo(kind,'glass',W-0.3),VLIGHT.glass);gl.castShadow=true;b.add(gl);
  {const [r0,r1,ry]=P2.roof;const rf=part(G.box,BM,W-0.18,0.07,r1-r0,0,ry+0.02,(r0+r1)/2,b);rf.castShadow=true; // roof panel + pillars in body colour
    const gp=P2.glass;const pil=(x0,y0,x1,y1)=>{[-1,1].forEach(s2=>{const len=Math.hypot(x1-x0,y1-y0);const m=part(G.box,BM,0.06,len,0.1,s2*(W/2-0.12),(y0+y1)/2,(x0+x1)/2,b,false);m.rotation.x=Math.atan2(x1-x0,y1-y0);});};
    pil(gp[gp.length-1][0],gp[gp.length-1][1],gp[gp.length-2][0],gp[gp.length-2][1]);pil(gp[0][0],gp[0][1],gp[1][0],gp[1][1]);const mid=(gp[1][0]+gp[2][0])/2-0.05;pil(mid,gp[0][1],mid,ry);}
  if(kind==='pickup'){const bedM=VLIGHT.trim;part(G.box,BM,W-0.02,0.5,0.08,0,1.0,-2.56,b);[-1,1].forEach(s=>part(G.box,BM,0.08,0.5,2.05,s*(W/2-0.04),1.0,-1.55,b));part(G.box,bedM,W-0.2,0.04,2.0,0,0.78,-1.55,b,false);}
  // pillars, bumpers, grille, mirrors, door seams
  const zf=kind==='bus'?3.15:P2.L/2+0.04,zr=-(kind==='pickup'?2.64:P2.L/2+0.05);
  part(G.box,VLIGHT.trim,W-0.05,0.2,0.16,0,0.48,zf,b);part(G.box,VLIGHT.trim,W-0.05,0.2,0.16,0,0.5,zr,b);
  part(G.box,VLIGHT.trim,W*0.5,0.16,0.04,0,0.72,zf+0.02,b,false);
  [-1,1].forEach(s=>{part(G.box,VLIGHT.head,0.38,0.13,0.05,s*(W/2-0.3),kind==='bus'?1.05:0.8,zf+0.03,b,false);part(G.box,VLIGHT.tail,0.32,0.14,0.05,s*(W/2-0.25),kind==='bus'?1.05:0.85,zr-0.02,b,false);
    if(kind!=='bus'){const mz=kind==='pickup'?0.62:kind==='suv'?0.62:0.95;part(G.box,BM,0.18,0.1,0.07,s*(W/2+0.07),kind==='sedan'?1.08:1.2,mz,b,false);}});
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.2),new THREE.MeshBasicMaterial({map:plateTex(o.plate||('KUJ '+ri(100,999)+' '+pick(['AA','BW','GW','KD','AB']))) }));pl.position.set(0,0.55,zr-0.11);pl.rotation.y=Math.PI;b.add(pl);
  if(o.taxi){part(G.box,0xf2c230,0.08,0.06,P2.L*0.7,W/2-0.02,0.82,0,b,false);part(G.box,0xf2c230,0.08,0.06,P2.L*0.7,-W/2+0.02,0.82,0,b,false);}
  // doors: panel pivots on the front edge; a dark opening shows behind when open
  const doors={};const dy=kind==='bus'?1.2:kind==='sedan'?0.68:0.8,dh=kind==='bus'?1.6:kind==='sedan'?0.52:0.6;
  const dz=kind==='pickup'?[[-0.05,0.95]]:kind==='bus'?[[2.2,1.0]]:[[0.15,1.0],[-0.9,0.95]];
  [-1,1].forEach(s=>dz.forEach(([z0,len],i)=>{if(kind==='bus'&&s<0)return;const piv=new THREE.Group();piv.position.set(s*(W/2+0.005),dy,z0+len/2);b.add(piv);
    const pan=part(G.box,BM,0.05,dh,len,0,0,-len/2,piv);part(G.box,VLIGHT.chrome,0.03,0.03,0.14,s*0.03,0.12,-len*0.3,piv,false);
    const hole=part(G.box,VLIGHT.inside,0.04,dh*0.95,len*0.96,s*(W/2-0.02),dy,z0,b,false);hole.visible=false;
    doors[(s<0?'l':'r')+i]={piv,hole,s,a:0,t:0};}));
  // boot lid
  let boot=null;if(kind==='sedan'||kind==='suv'){const bz=kind==='sedan'?-1.35:-2.33,by=kind==='sedan'?1.0:1.68;const piv=new THREE.Group();piv.position.set(0,by,bz);b.add(piv);
    const len=kind==='sedan'?0.9:1.0;const lid=part(G.box,BM,W-0.2,0.06,len,0,0.02,-len/2,piv);if(kind==='suv'){lid.scale.set(W-0.2,1.0,0.06);lid.position.set(0,-0.5,-0.04);}
    const cav=part(G.box,VLIGHT.inside,W-0.3,0.3,len*0.9,0,by-0.2,bz-len/2,b,false);cav.visible=false;if(kind==='suv'){cav.scale.set(W-0.3,0.9,0.4);cav.position.set(0,1.15,-2.1);}boot={piv,cav,a:0,t:0,suv:kind==='suv'};}
  // wheels with rims
  const wheels=[];const r=P2.tr;[[P2.wb[1],1],[P2.wb[0],0]].forEach(([z,front])=>[-1,1].forEach(s=>{const st=new THREE.Group();st.position.set(s*(W/2-0.06),r,z);b.add(st);const spin=new THREE.Group();st.add(spin);
    const ty=new THREE.Mesh(G.cyl,VLIGHT.tyre);ty.scale.set(r,0.24,r);ty.rotation.z=Math.PI/2;ty.castShadow=true;spin.add(ty);
    const rm=new THREE.Mesh(G.cyl,VLIGHT.rim);rm.scale.set(r*0.62,0.25,r*0.62);rm.rotation.z=Math.PI/2;spin.add(rm);
    for(let k=0;k<5;k++){const sp=part(G.box,VLIGHT.rim,0.02,r*1.1,0.05,s*0.13,0,0,spin,false);sp.rotation.x=k*Math.PI/2.5;}
    part(G.cyl,VLIGHT.trim,r*1.12,0.02,r*1.12,0,0,0,st,false).rotation.z=Math.PI/2;
    wheels.push({st,spin,front:!!front,r});}));
  // steering wheel and seats visible through the glass
  const sw=new THREE.Group();sw.position.set(-W/2+0.55,kind==='bus'?1.5:1.0,kind==='bus'?2.4:0.35);b.add(sw);const swr=part(G.torus,VLIGHT.trim,0.16,0.16,0.4,0,0,0,sw,false);swr.rotation.x=-0.5;
  [[-W/2+0.55,0.1],[W/2-0.55,0.1],[0,-0.75]].forEach(([x,z])=>{if(kind!=='bus')part(G.box,0x2a2420,kind==='pickup'&&z<0?0.01:0.5,0.5,0.12,x,0.95,z-0.2,b,false);});
  g.scale.setScalar(o.scale||1.42);if(o.add!==false)outdoor.add(g);
  const V={g,b,kind,doors,boot,wheels,sw:swr,dir:0,x:0,z:0,rd:0,steer:0};return V;}
/* roll the wheels by distance, steer the fronts, swing doors and boot */
function vehAnim(V,dist,steer,dt){V.wheels.forEach(w=>{w.spin.rotation.x+=dist/(w.r*(V.g.scale.x||1));if(w.front)w.st.rotation.y+=((steer||0)-w.st.rotation.y)*Math.min(1,(dt||0.016)*8);});if(V.sw)V.sw.rotation.z=-(steer||0)*2.2;
  const k=Math.min(1,(dt||0.016)*3.2);for(const id in V.doors){const d=V.doors[id];d.a+=(d.t-d.a)*k;d.piv.rotation.y=-d.s*d.a*1.1;d.hole.visible=d.a>0.05;}
  if(V.boot){const B=V.boot;B.a+=(B.t-B.a)*k;B.piv.rotation.x=B.a*(B.suv?1.5:1.3);B.cav.visible=B.a>0.05;}}
function vehDoor(V,id,open){if(V.doors[id])V.doors[id].t=open?1:0;sfx('door');}
function setCarLights(night){VLIGHT.head.emissiveIntensity=night?1.6:0.15;VLIGHT.tail.emissiveIntensity=night?1.2:0.2;}

/* ---- things people carry ---- */
const PROPM={};function propM(c,tex){const k=c+(tex||'');return PROPM[k]||(PROPM[k]=tex?new THREE.MeshLambertMaterial({map:tex}):new THREE.MeshLambertMaterial({color:c}));}
let GMG_T=null;function gmgTex(){if(GMG_T)return GMG_T;GMG_T=canvasTex(64,64,g=>{g.fillStyle='#f2efe6';g.fillRect(0,0,64,64);for(let i=0;i<8;i++){g.fillStyle=i%2?'#2b4f8a':'#c23b3b';g.globalAlpha=0.75;g.fillRect(i*8,0,4,64);g.fillRect(0,i*8,64,4);}});GMG_T.wrapS=GMG_T.wrapT=THREE.RepeatWrapping;GMG_T.repeat.set(2,2);return GMG_T;}
let FOAM_T=null;function foamTex(){if(FOAM_T)return FOAM_T;FOAM_T=canvasTex(128,64,g=>{g.fillStyle='#e9e2f2';g.fillRect(0,0,128,64);for(let i=0;i<40;i++){g.fillStyle=pick(['#c25a8a','#5a8ac2','#e3b04b']);g.beginPath();g.arc(rnd(0,128),rnd(0,64),rnd(2,5),0,7);g.fill();}});return FOAM_T;}
function makeProp(kind){const g=new THREE.Group();
  if(kind==='suitcase'){part(G.box,0x2b3a52,0.55,0.75,0.26,0,0.42,0,g);part(G.box,0x1b2433,0.04,0.2,0.04,-0.12,0.88,0,g,false);part(G.box,0x1b2433,0.04,0.2,0.04,0.12,0.88,0,g,false);part(G.box,0x1b2433,0.28,0.04,0.04,0,0.98,0,g,false);}
  else if(kind==='gmg'){const m=new THREE.Mesh(G.box,propM(0,gmgTex()));m.scale.set(0.8,0.5,0.45);m.position.y=0.26;m.castShadow=true;g.add(m);}
  else if(kind==='bucket'){part(G.cyl,0x2b6fd9,0.24,0.42,0.2,0,0.21,0,g);part(G.torus,0x333333,0.2,0.2,0.08,0,0.44,0,g,false).rotation.x=Math.PI/2;part(G.box,0xe3b04b,0.2,0.18,0.14,0,0.48,0,g,false);}
  else if(kind==='mattress'){const m=new THREE.Mesh(G.box,propM(0,foamTex()));m.scale.set(1.0,0.16,2.0);m.position.y=0.08;m.castShadow=true;g.add(m);}
  else if(kind==='carton'){part(G.box,0xc9a46a,0.5,0.36,0.36,0,0.18,0,g);part(G.box,0xd23b2b,0.3,0.12,0.005,0,0.22,0.181,g,false);}
  return g;}

/* ================= CUTSCENES ================= */
const CS={on:false,skip:false,actors:[],bubbles:[],cam:null,camPos:new THREE.Vector3(),camAt:new THREE.Vector3(),focus:null};
const SKIP={};
function csEl(){if(W.csEl)return W.csEl;const d=el('div','cine','<div class="cbar top"></div><div class="cbar bot"></div><div class="ccap" hidden></div><button class="cphone" aria-label="Phone">✉<i hidden></i></button><button class="cskip">Skip ›</button>');$('#app').append(d);d.querySelector('.cskip').onclick=()=>{CS.skip=true;if(UI.dlg){UI.dlgQ=[];closeDlg();}};
  /* the phone stays usable during a scene: read and answer your messages, the scene carries on behind */
  const ph=d.querySelector('.cphone');ph.onclick=()=>{if(UI.phone)closePhone();else openPhone('msgs');};
  setInterval(()=>{if(!CS.on||!S)return;const n=(S.msgs||[]).filter(m=>!m.read).length+(S.groups||[]).reduce((a,g)=>a+(g.unread||0),0);const b=ph.querySelector('i');b.hidden=!n;b.textContent=n>9?'9+':n;},1000);
  W.csEl=d;return d;}
function csStart(){CS.on=true;CS.skip=false;CS.actors=[];document.body.classList.add('cine');const d=csEl();d.hidden=false;void d.offsetWidth;d.classList.add('on');if(ACT)stopAction(true);if(UI.sheet)closeSheet();if(UI.phone)closePhone();}
function csEnd(){CS.on=false;document.body.classList.remove('cine');const d=csEl();d.classList.remove('on');setTimeout(()=>{if(!CS.on)d.hidden=true;},400);CS.bubbles.forEach(b=>b.e.remove());CS.bubbles=[];csCaption(null);CS.cam=null;W.camHold=null;}
function csCaption(t,sub){const c=csEl().querySelector('.ccap');if(!t){c.hidden=true;return;}c.innerHTML='<b>'+fx(t)+'</b>'+(sub?'<span>'+fx(sub)+'</span>':'');c.hidden=false;c.classList.remove('go');void c.offsetWidth;c.classList.add('go');}
const csWait=ms=>new Promise((res,rej)=>{if(CS.skip)return rej(SKIP);const t0=performance.now();ms/=(W.csSpeed||1);const tick=()=>{if(CS.skip)return rej(SKIP);if(performance.now()-t0>=ms)return res();requestAnimationFrame(tick);};tick();});
const csUntil=(fn,max)=>new Promise((res,rej)=>{const t0=performance.now();const tick=()=>{if(CS.skip)return rej(SKIP);if(fn()||performance.now()-t0>(max||30000))return res();requestAnimationFrame(tick);};tick();});
function csTalk(d){return new Promise((res,rej)=>{if(CS.skip)return rej(SKIP);dialog(Object.assign({},d,{onClose:()=>{if(CS.skip)return rej(SKIP);res(d._pick);}}));});}
/* an actor is any sim the scene moves: walking with the normal pathfinding, posing, carrying things */
function csActor(o){const g=o.g||makeSim(Object.assign({bag:null},o.look));(o.parent||outdoor).add(g);const a={g,x:o.x,z:o.z,dir:o.dir||0,path:null,i:0,v:0,walk:0,pose:o.pose||'stand',sp:o.sp||4.2,grid:o.grid||NAV,face:null,carry:null,keep:o.keep,run:false};
  g.position.set(a.x,0,a.z);g.rotation.y=a.dir;g.visible=o.visible!==false;CS.actors.push(a);return a;}
function csWalk(a,to,sp){const p=navPath(a,to,a.grid)||[{x:to.x,z:to.z}];a.path=p;a.i=0;if(sp)a.sp=sp;}
function csArrived(a){return !a.path||a.i>=a.path.length;}
function csCarry(a,prop,how){if(a.carry){a.carry.parent&&a.carry.parent.remove(a.carry);a.carry=null;}a.carryHow=how||null;if(!prop)return;const J=a.g.userData.J;
  if(how==='head'){J.hd.add(prop);prop.position.set(0,0.31,0);prop.scale.setScalar(1/1.6);prop.rotation.set(0,Math.PI/2,0);}
  else if(how==='hand'){J.elR.add(prop);prop.position.set(0,-0.42,0.02);prop.scale.setScalar(1/1.6);prop.rotation.set(0,0,0);}
  else{J.torso.add(prop);prop.position.set(0,0.1,0.26);prop.scale.setScalar(1/1.6*0.9);prop.rotation.set(0,0,0);}prop.userData.csProp=1;a.carry=prop;}
function csSay(a,text,ms){const e=el('div','say3d',fx(text));$('#app').append(e);const b={e,a,until:performance.now()+(ms||3200)};CS.bubbles.forEach(x=>{if(x.a===a)x.until=0;});CS.bubbles.push(b);return csWait(Math.min(ms||3200,6000)*0.85).catch(e2=>{throw e2;});}
function csShot(from,at,k){CS.cam={from,at,k:k||1.6};}
/* a side-on shot of two people talking, framed in the top half so the dialog box doesn't cover them */
function csTwoShot(a,b,dist,side){csShot(()=>{const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2,dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;const s2=side||1;const px=-dz/l*s2,pz=dx/l*s2;const d=dist||8;
    const wx=mx+px*d,wz=mz+pz*d;const L=Math.hypot(wx-mx,wz-mz)||1;const cl=S.inside?Math.min(d,6):camClear(mx,2.2,mz,(wx-mx)/L*0.95,0.3,(wz-mz)/L*0.95,d);return new THREE.Vector3(mx+px*cl,S.inside?6.2:2.9+cl*0.18,mz+pz*cl);},
  ()=>new THREE.Vector3((a.x+b.x)/2,camera.aspect>1?1.4:0.35,(a.z+b.z)/2),1.5);}
/* follow someone from behind and above, pulled in when a building is in the way */
function csFollow(a,dist,h){csShot(()=>{const dx=-Math.sin(a.dir),dz=-Math.cos(a.dir);const d=dist||12,hh=h||7;const ux=dx*0.85,uy=hh/Math.hypot(d,hh),uz=dz*0.85;const cl=S.inside?d:camClear(a.x,1.8,a.z,ux,uy,uz,Math.hypot(d,hh));
    return new THREE.Vector3(a.x+ux*cl,1.8+uy*cl,a.z+uz*cl);},()=>new THREE.Vector3(a.x+Math.sin(a.dir)*3,1.2,a.z+Math.cos(a.dir)*3),1.2);}
const _cv=new THREE.Vector3(),_ca=new THREE.Vector3();
function csResolve(v,out){const r=typeof v==='function'?v():v;if(r&&r.isVector3)return out.copy(r);return out.set(r[0],r[1],r[2]);}
function csFrame(dt,now){if(!CS.on)return;dt*=(W.csSpeed||1);const t=now/1000;if(CS.tick)CS.tick(dt);
  for(const a of CS.actors){if(!a.g.parent)continue;if(a.fixed){pose(a.g,a.pose,t+a.x,dt);continue;}
    if(a.path&&a.i<a.path.length){navMove(a,dt,a.sp,a.grid,false);a.walk+=dt*Math.max(0.6,a.v||0)*(a.sp>5?1.4:1.8);
      const carrying=a.armed?'riflewalk':a.carryHow==='head'?'carryheadwalk':a.carryHow==='front'?'carrywalk':a.carryHow==='hand'?'walk':null;pose(a.g,(a.v||0)<0.2?(a.carryHow==='head'?'carryhead':a.carryHow==='front'?'carry':'stand'):(carrying||(a.sp>5?'run':'walk')),a.walk,dt);}
    else{if(a.face!=null){const want=typeof a.face==='number'?a.face:Math.atan2(a.face.x-a.x,a.face.z-a.z);a.dir+=angDiff(want,a.dir)*Math.min(1,dt*5);}
      const p=a.carryHow==='head'?'carryhead':a.carryHow==='front'?'carry':a.pose;pose(a.g,p,t+a.x,dt);}
    a.g.position.set(a.x,a.y||0,a.z);a.g.rotation.y=a.dir;}
  if(CS.cam){const k=Math.min(1,dt*CS.cam.k);csResolve(CS.cam.from,_cv);csResolve(CS.cam.at,_ca);
    if(!S.inside){/* never put the camera inside a building */const dx=_cv.x-_ca.x,dy=_cv.y-_ca.y,dz=_cv.z-_ca.z,d=Math.hypot(dx,dy,dz);if(d>3){const cl=camClear(_ca.x,_ca.y,_ca.z,dx/d,dy/d,dz/d,d);if(cl<d-0.01){_cv.set(_ca.x+dx/d*cl,Math.max(_ca.y+dy/d*cl,_ca.y+1.2),_ca.z+dz/d*cl);}}}if(!CS.camInit){CS.camPos.copy(_cv);CS.camAt.copy(_ca);CS.camInit=true;}else{CS.camPos.lerp(_cv,k);CS.camAt.lerp(_ca,k);}
    camera.position.copy(CS.camPos);camera.lookAt(CS.camAt);cam.tx=CS.camAt.x;cam.tz=CS.camAt.z;}
  const w=host.clientWidth,h=host.clientHeight;const nowp=performance.now();
  for(let i=CS.bubbles.length-1;i>=0;i--){const b=CS.bubbles[i];if(nowp>b.until){b.e.remove();CS.bubbles.splice(i,1);continue;}b.a.g.getWorldPosition(v3);v3.y+=4.4;v3.project(camera);
    if(v3.z>1){b.e.style.display='none';continue;}b.e.style.display='';b.e.style.transform='translate('+((v3.x+1)/2*w).toFixed(0)+'px,'+((1-v3.y)/2*h).toFixed(0)+'px) translate(-50%,-100%)';}}
function csClear(){CS.actors.forEach(a=>{if(a.carry)csCarry(a,null);if(!a.keep&&a.g.parent&&a.g!==player)a.g.parent.remove(a.g);});CS.actors=[];}
/* drop anything a cutscene left in the player's hands (a suitcase, a bucket...) */
function csDropAll(){const J=player&&player.userData.J;if(!J)return;['torso','hd','elR','elL'].forEach(k=>{const j=J[k];if(!j)return;j.children.slice().forEach(c=>{if(c.userData&&c.userData.csProp)j.remove(c);});});}
