/* ================= GREEN 5: real grass and wild flowers all over the campus, the town and the city =================
   Little 3D clumps of grass blades (and a sprinkle of wild flowers) stand on every patch of open ground that is not a
   road, a pavement, a building or a car park. They are instanced in 100 m tiles (one draw call each), so the phone
   only draws the tiles in view and near the camera, and they sway a little in the wind. Low graphics gets fewer clumps. */
(function(){const T0=performance.now();try{
const N_MAX=Q==='low'?3000:QH?14000:8500,SP=Q==='low'?2.4:QH?1.3:1.6,TILE=100,FAR=Q==='low'?80:QH?140:105;
/* what is covered (roads, pavements, buildings, plazas): a 1 m grid filled from every box in the world */
const X0=-146,Z0=-122,GW=292,GH=690;const cov=new Uint8Array(GW*GH);
const MK=[];const mark=(cx,cz,hx,hz)=>{/* small loose things (people, bins, signs) and anything parked in a car park don't decide where grass grows */if(hx<2.6&&hz<2.6)return;if(typeof inCarZone==='function'&&inCarZone(cx,cz,0))return;if(window.__QA)MK.push([Math.round(cx),Math.round(cz),Math.round(hx),Math.round(hz)].join(','));const i0=Math.max(0,Math.floor(cx-hx-X0-0.6)),i1=Math.min(GW-1,Math.ceil(cx+hx-X0+0.6)),j0=Math.max(0,Math.floor(cz-hz-Z0-0.6)),j1=Math.min(GH-1,Math.ceil(cz+hz-Z0+0.6));for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)cov[j*GW+i]=1;};
const m4=new THREE.Matrix4(),pv=new THREE.Vector3(),qv=new THREE.Quaternion(),sv=new THREE.Vector3(),bx=new THREE.Box3(),EU=new THREE.Euler();
const flatGround=new Set([typeof ground!=='undefined'?ground:null,typeof townGround!=='undefined'?townGround:null,typeof cityGround!=='undefined'?cityGround:null,typeof outer!=='undefined'?outer:null]);
outdoor.updateMatrixWorld(true);
/* lawns are flat green boxes or planes: grass grows on those */
const GC=new Map();const greenish=m=>{if(!m)return false;let r=1,g=1,b=1;const c=m.color;if(c){r=c.r;g=c.g;b=c.b;}
  const im=m.map&&m.map.image;if(im&&im.getContext){let t=GC.get(im);if(!t){try{const x=im.getContext('2d').getImageData(0,0,Math.min(16,im.width),Math.min(16,im.height)).data;let R=0,G2=0,B=0;for(let i=0;i<x.length;i+=4){R+=x[i];G2+=x[i+1];B+=x[i+2];}t=[R,G2,B];}catch(e){t=[1,1,1];}GC.set(im,t);}r*=t[0];g*=t[1];b*=t[2];}
  return g>r*1.08&&g>b*1.12;};
/* only the fixed world counts (not people or vehicles that happen to be standing there), so every player gets the same grass and trees */
const DYN=new Set();try{(typeof VEH!=='undefined'?VEH:[]).forEach(k=>k&&k.g&&DYN.add(k.g));(typeof npcs!=='undefined'?npcs:[]).forEach(n=>n&&n.g&&DYN.add(n.g));if(typeof player!=='undefined'&&player)DYN.add(player);if(typeof myCarG!=='undefined'&&myCarG)DYN.add(myCarG);}catch(e){}
const walk=(o,f)=>{if(DYN.has(o)||o.userData&&(o.userData.npc||o.userData.V))return;f(o);for(const c of o.children)walk(c,f);};
walk(outdoor,o=>{if(!o.isMesh||flatGround.has(o)||o.visible===false)return;const geo=o.geometry;if(!geo)return;
  if(o.isInstancedMesh){if(geo!==G.box&&geo.type!=='BoxGeometry'&&geo.type!=='BoxBufferGeometry')return;const gr=greenish(o.material);for(let i=0;i<o.count;i++){o.getMatrixAt(i,m4);m4.premultiply(o.matrixWorld);m4.decompose(pv,qv,sv);if(gr&&sv.y<0.4)continue;
      const e=EU.setFromQuaternion(qv);const c=Math.abs(Math.cos(e.y)),s=Math.abs(Math.sin(e.y));const hx=(sv.x*c+sv.z*s)/2,hz=(sv.x*s+sv.z*c)/2;if(hx>60&&hz>60)continue;mark(pv.x,pv.z,hx,hz);}return;}
  if(geo.type==='PlaneGeometry'||geo.type==='PlaneBufferGeometry'){/* flat painted areas (plazas, sand, pitches) are not grass */if(greenish(o.material))return;bx.setFromObject(o);if(bx.max.y-bx.min.y<0.2){const hx=(bx.max.x-bx.min.x)/2,hz=(bx.max.z-bx.min.z)/2;if(hx<70&&hz<70)mark((bx.min.x+bx.max.x)/2,(bx.min.z+bx.max.z)/2,hx,hz);}return;}
  bx.setFromObject(o);if(!isFinite(bx.min.x))return;if(bx.min.y>2.5)return;if(bx.max.y-bx.min.y<0.4&&greenish(o.material))return;const hx=(bx.max.x-bx.min.x)/2,hz=(bx.max.z-bx.min.z)/2;if(hx>70&&hz>70)return;if(bx.max.y<0.01)return;mark((bx.min.x+bx.max.x)/2,(bx.min.z+bx.max.z)/2,hx,hz);});
/* sports pitches, courts and the beach keep their own short, flat surface */
for(const id in LOCS){const L=LOCS[id];if(L&&['field','court','beach'].includes(L.kind)&&L.w&&L.d)mark(L.x,L.z,L.w/2+2,L.d/2+2);}
const covered=(x,z)=>{const i=Math.floor(x-X0),j=Math.floor(z-Z0);if(i<0||j<0||i>=GW||j>=GH)return true;return !!cov[j*GW+i];};
const onGround=(x,z)=>(Math.abs(x)<114&&Math.abs(z)<114)||(Math.abs(x)<114&&z>=114&&z<198)||(Math.abs(x)<140&&z>=198&&z<540);
/* seeded, so every player sees the same grass */
let sd=20261016;const R=()=>(sd=(sd*16807)%2147483647)/2147483647;
const pts=[];for(let z=Z0+1;z<Z0+GH-1;z+=SP)for(let x=X0+1;x<X0+GW-1;x+=SP){const px=x+(R()-0.5)*SP*0.9,pz=z+(R()-0.5)*SP*0.9;if(!onGround(px,pz))continue;if(roadDist(px,pz)<6.2)continue;if(covered(px,pz))continue;
  if(typeof inCarZone==='function'&&inCarZone(px,pz,1))continue;pts.push([px,pz,R()]);}
for(let i=pts.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=pts[i];pts[i]=pts[j];pts[j]=t;}
const use=pts.slice(0,N_MAX);
/* a clump: three crossed cards of blades. One texture holds two pictures side by side (plain grass, grass with wild
   flowers), so a tile of grass is a single draw call. */
function drawClump(g,ox,flower){const cols=['#5a8a2c','#6a9a34','#78a83c','#88b646','#9cc456','#628f30'];g.lineCap='round';
  for(let i=0;i<(flower?20:46);i++){const x=ox+10+R()*108,h=40+R()*82,bend=(R()-0.5)*26;g.strokeStyle=cols[Math.floor(R()*cols.length)];g.lineWidth=2+R()*3.2;
    g.beginPath();g.moveTo(x,128);g.quadraticCurveTo(x+bend*0.3,128-h*0.5,x+bend,128-h);g.stroke();}
  if(flower){const fc=['#f2d43a','#f7f3e6','#e86fa8','#f08a2b','#b78ae6'];for(let i=0;i<9;i++){const x=ox+16+R()*96,y=30+R()*50;g.fillStyle=fc[Math.floor(R()*fc.length)];
    for(let p=0;p<5;p++){const a=p/5*6.28;g.beginPath();g.arc(x+Math.cos(a)*4,y+Math.sin(a)*4,3.6,0,7);g.fill();}g.fillStyle='#e0a020';g.beginPath();g.arc(x,y,2.4,0,7);g.fill();}}}
function atlasTex(){const W2=256,H2=128,c=document.createElement('canvas');c.width=W2;c.height=H2;const g=c.getContext('2d');g.save();g.beginPath();g.rect(0,0,128,128);g.clip();drawClump(g,0,false);g.restore();g.save();g.beginPath();g.rect(128,0,128,128);g.clip();drawClump(g,128,true);g.restore();
  /* rebuild as raw pixels so the see-through parts keep a green colour (no dark fringes when the texture is shrunk) */
  const d=g.getImageData(0,0,W2,H2).data,out=new Uint8Array(W2*H2*4);for(let i=0;i<W2*H2;i++){const a=d[i*4+3];if(a>8){out[i*4]=Math.min(255,d[i*4]*255/a);out[i*4+1]=Math.min(255,d[i*4+1]*255/a);out[i*4+2]=Math.min(255,d[i*4+2]*255/a);}else{out[i*4]=92;out[i*4+1]=132;out[i*4+2]=48;}out[i*4+3]=a;}
  /* canvas rows run top-down, textures bottom-up */const flip=new Uint8Array(out.length),row=W2*4;for(let y=0;y<H2;y++)flip.set(out.subarray((H2-1-y)*row,(H2-y)*row),y*row);
  const t=new THREE.DataTexture(flip,W2,H2,THREE.RGBAFormat);t.encoding=THREE.sRGBEncoding;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t;}
function clumpGeo(w,h){const P=[],U=[],I=[];for(let k=0;k<3;k++){const a=k*Math.PI/3,cx=Math.cos(a)*w/2,cz=Math.sin(a)*w/2,b=P.length/3;
    P.push(-cx,0,-cz, cx,0,cz, cx,h,cz, -cx,h,-cz);U.push(0,0,1,0,1,1,0,1);I.push(b,b+1,b+2,b,b+2,b+3);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);
  /* normals point up so the cards are lit like the ground under them, not black from behind */
  g.setAttribute('normal',new THREE.Float32BufferAttribute(new Array(P.length/3).fill(0).flatMap(()=>[0,1,0]),3));return g;}
const WIND={value:0};
const gMat=new THREE.MeshLambertMaterial({map:atlasTex(),alphaTest:0.42,side:THREE.DoubleSide});
gMat.onBeforeCompile=sh=>{sh.uniforms.uT=WIND;sh.vertexShader='uniform float uT;\nattribute float aVar;\n'+sh.vertexShader
  .replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_UV\nvUv.x=vUv.x*0.5+aVar*0.5;\n#endif')
  .replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n{float ph=instanceMatrix[3].x*0.37+instanceMatrix[3].z*0.23;transformed.x+=sin(uT*1.6+ph)*0.07*uv.y;transformed.z+=cos(uT*1.3+ph)*0.05*uv.y;}\n#endif');};
gMat.customProgramCacheKey=()=>'grass5b';
const gGeo=clumpGeo(1.25,0.8);
/* split into big tiles so whole tiles are culled when out of view or far from the camera */
const tiles=new Map();use.forEach(p=>{const k=Math.floor(p[0]/TILE)+','+Math.floor(p[1]/TILE);if(!tiles.has(k))tiles.set(k,[]);tiles.get(k).push(p);});
const grp=new THREE.Group();grp.name='grass5';outdoor.add(grp);const meshes=[];const col=new THREE.Color();
tiles.forEach((L,k)=>{const [ti,tj]=k.split(',').map(Number);const cx=(ti+0.5)*TILE,cz=(tj+0.5)*TILE;
  const geo=gGeo.clone();geo.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx,0.4,cz),TILE*0.75);geo.boundingBox=null;
  const vr=new Float32Array(L.length);L.forEach((p,i)=>{vr[i]=p[2]<0.13?1:0;});geo.setAttribute('aVar',new THREE.InstancedBufferAttribute(vr,1));
  const im=new THREE.InstancedMesh(geo,gMat,L.length);L.forEach((p,i)=>{const fl=vr[i]>0.5;const s=(fl?0.7:0.75)+p[2]*0.9;qv.setFromEuler(new THREE.Euler(0,p[2]*31%6.28,0));m4.compose(pv.set(p[0],0,p[1]),qv,sv.set(s,s*(0.85+((p[2]*7)%0.4)),s));im.setMatrixAt(i,m4);
    {const v=(p[2]*13)%1;col.setRGB(0.78+v*0.22,0.88+v*0.12,0.7+v*0.2);}if(fl)col.setRGB(1,1,1);im.setColorAt(i,col);});
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=false;im.receiveShadow=false;im.userData.c=[cx,cz];grp.add(im);meshes.push(im);});
HOOKS.frame.push((dt,now)=>{WIND.value=now/1000;if(!S||S.inside){grp.visible=false;return;}grp.visible=!(cam.mode==='map');if(!grp.visible)return;
  const tx=cam.tx,tz=cam.tz;for(const m of meshes){const c=m.userData.c;m.visible=Math.hypot(c[0]-tx,c[1]-tz)<FAR+TILE*0.7;}});
/* shade trees on the big open lawns of the town and the city (and the edges of campus): they are solid, so people and
   cars go round them, and they are spaced out so they never block a path */
const TREES=[];{const want=Q==='low'?70:QH?230:150;const near=(x,z,r)=>TREES.some(t=>Math.hypot(t[0]-x,t[1]-z)<r);
  for(const p of pts){if(TREES.length>=want)break;const [x,z]=p;if(roadDist(x,z)<11)continue;let clear=true;for(let a=-3;a<=3&&clear;a+=1.5)for(let b=-3;b<=3;b+=1.5)if(covered(x+a,z+b)){clear=false;break;}
    if(!clear||near(x,z,10))continue;if(typeof inCarZone==='function'&&inCarZone(x,z,5))continue;const k=gIdx(NAV,x,z);if(k<0||NAV.blk[k])continue;TREES.push([x,z,0.85+p[2]*0.6,p[2]]);}}
if(TREES.length){const trunkM=new THREE.MeshLambertMaterial({color:0x6b4f36}),crownM=new THREE.MeshLambertMaterial({color:0xffffff,flatShading:true});
  const tg=new THREE.CylinderGeometry(0.18,0.3,1,6);tg.translate(0,0.5,0);const cg=new THREE.IcosahedronGeometry(1,1);
  const trunk=new THREE.InstancedMesh(tg,trunkM,TREES.length),crowns=new THREE.InstancedMesh(cg,crownM,TREES.length*3);const tc=new THREE.Color();
  TREES.forEach(([x,z,s,v],i)=>{m4.compose(pv.set(x,0,z),qv.set(0,0,0,1),sv.set(s,3.2*s,s));trunk.setMatrixAt(i,m4);
    for(let c=0;c<3;c++){const a=v*40+c*2.1,r=c?1.1*s:0;m4.compose(pv.set(x+Math.cos(a)*r,(3.6+(c?-0.3:0.6))*s,z+Math.sin(a)*r),qv.setFromEuler(EU.set(0,a,0)),sv.set((c?1.7:2.2)*s,(c?1.4:1.8)*s,(c?1.7:2.2)*s));crowns.setMatrixAt(i*3+c,m4);
      tc.setHSL(0.24+((v*7+c*0.13)%0.07),0.45+((v*3)%0.15),0.24+((v*5+c*0.05)%0.08));crowns.setColorAt(i*3+c,tc);}
    /* solid for walkers and drivers */try{const o={c:1,x,z,r:0.45*s};OBS.push(o);raster(NAV,o,0.05,NAV.raw);raster(NAV,o,0.42,NAV.blk);raster(NAV,o,1.05,NAV.car);}catch(e){}});
  trunk.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;if(crowns.instanceColor)crowns.instanceColor.needsUpdate=true;
  [trunk,crowns].forEach(m=>{m.castShadow=QM;m.receiveShadow=false;m.frustumCulled=false;grp.parent.add(m);});trunk.name='trees5';}
/* light to match: the ground now bounces green rather than red-brown light, and the picture is a touch brighter */
try{cGrD.setHex(0x6f7d4c);renderer.toneMappingExposure=0.84;}catch(e){}
if(window.__QA)window.__GRASS={MK,ms:Math.round(performance.now()-T0),count:use.length,tiles:tiles.size,meshes:meshes.length,candidates:pts.length};
}catch(e){console.error('grass',e);}})();
