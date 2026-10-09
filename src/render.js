/* Realistic rendering pass.
   - Sky dome: a real gradient sky with sun disc and glow, moon, stars and drifting fbm clouds whose cover follows the weather.
     Its horizon is exactly the fog colour, so distant buildings melt into the haze instead of a flat backdrop.
   - Ground, asphalt, paving and kerbs: generated albedo + normal maps sampled in WORLD space (so long road boxes are
     never stretched), with a second rotated sample and large-scale tone variation to hide tiling.
   - Trees: leaf-card crowns (alpha-tested, double layer with rounded normals) that also cast leafy shadows.
   Low quality keeps cheaper Lambert materials but still gets the textures, sky and trees. */
(function(){
const LQ=!QM,SZ=QH?1024:512,ANI=Math.min(8,renderer.capabilities.getMaxAnisotropy?renderer.capabilities.getMaxAnisotropy():1);
let seed=9137;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
/* tileable value noise / fbm in [0,1] */
function vnoise(n,cells){const g=new Float32Array(cells*cells);for(let i=0;i<g.length;i++)g[i]=R();const o=new Float32Array(n*n);
  for(let y=0;y<n;y++){const fy=y/n*cells,iy=Math.floor(fy),ty=fy-iy,sy=ty*ty*(3-2*ty),y0=iy%cells,y1=(iy+1)%cells;
    for(let x=0;x<n;x++){const fx=x/n*cells,ix=Math.floor(fx),tx=fx-ix,sx=tx*tx*(3-2*tx),x0=ix%cells,x1=(ix+1)%cells;
      const a=g[y0*cells+x0],b=g[y0*cells+x1],c=g[y1*cells+x0],d=g[y1*cells+x1];o[y*n+x]=(a+(b-a)*sx)+((c+(d-c)*sx)-(a+(b-a)*sx))*sy;}}return o;}
function fbm(n,base,oct){const o=new Float32Array(n*n);let a=1,t=0;for(let k=0;k<oct;k++){const v=vnoise(n,base<<k);for(let i=0;i<o.length;i++)o[i]+=v[i]*a;t+=a;a*=0.5;}for(let i=0;i<o.length;i++)o[i]/=t;return o;}
const hexRGB=h=>[(h>>16)&255,(h>>8)&255,h&255];
function cv(n){const c=document.createElement('canvas');c.width=c.height=n;return c;}
function tex(c,srgb){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=ANI;if(srgb)t.encoding=THREE.sRGBEncoding;return t;}
/* normal map from the luminance (or a supplied height field) of a canvas, wrapping at the edges */
function normalTex(c,str,hf){const n=c.width,g=c.getContext('2d');let H=hf;if(!H){const d=g.getImageData(0,0,n,n).data;H=new Float32Array(n*n);for(let i=0;i<n*n;i++)H[i]=(d[i*4]*0.3+d[i*4+1]*0.59+d[i*4+2]*0.11)/255;}
  const o=cv(n),og=o.getContext('2d'),im=og.createImageData(n,n),D=im.data;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const l=H[y*n+(x+n-1)%n],r=H[y*n+(x+1)%n],u=H[((y+n-1)%n)*n+x],dn=H[((y+1)%n)*n+x];
    let nx=(l-r)*str,ny=(u-dn)*str,nz=1;const L=Math.hypot(nx,ny,nz);const i=(y*n+x)*4;D[i]=(nx/L*0.5+0.5)*255;D[i+1]=(ny/L*0.5+0.5)*255;D[i+2]=(nz/L*0.5+0.5)*255;D[i+3]=255;}
  og.putImageData(im,0,0);return tex(o,false);}
/* paint a base layer by mixing colours along an fbm field */
function paintBase(c,f,cols){const n=c.width,g=c.getContext('2d'),im=g.createImageData(n,n),D=im.data,C=cols.map(hexRGB);
  for(let i=0;i<n*n;i++){const v=Math.min(0.999,Math.max(0,f[i]))*(C.length-1),k=Math.floor(v),t=v-k,a=C[k],b=C[k+1]||a;D[i*4]=a[0]+(b[0]-a[0])*t;D[i*4+1]=a[1]+(b[1]-a[1])*t;D[i*4+2]=a[2]+(b[2]-a[2])*t;D[i*4+3]=255;}
  g.putImageData(im,0,0);return g;}
const wrapDraw=(n,x,y,fn)=>{for(const ox of [-n,0,n])for(const oy of [-n,0,n]){if(x+ox<-40||x+ox>n+40||y+oy<-40||y+oy>n+40)continue;fn(x+ox,y+oy);}};
const S2=SZ/512;
/* ---- grass: patchy dry/green field with blades and bare earth ---- */
function grassSet(){const c=cv(SZ),n=SZ;const f=fbm(n,4,6),e=fbm(n,3,5);for(let i=0;i<f.length;i++){f[i]=f[i]*0.85+0.08;if(e[i]>0.66)f[i]=Math.min(0.999,0.86+(e[i]-0.66)*0.6);}
  const g=paintBase(c,f,[0x4f6530,0x5b7236,0x67793e,0x7d8248,0x8f8158,0x84704f]);
  const bl=['#465e2a','#566f32','#62783a','#728443','#8d8a58','#3a4f25','#7a8a4c'];g.lineCap='round';
  for(let i=0;i<14000*S2*S2;i++){const x=R()*n,y=R()*n,l=(2+R()*5)*S2,a=-Math.PI/2+(R()-0.5)*1.4;g.strokeStyle=bl[Math.floor(R()*bl.length)];g.globalAlpha=0.25+R()*0.35;g.lineWidth=(0.5+R()*0.8)*S2;
    wrapDraw(n,x,y,(px,py)=>{g.beginPath();g.moveTo(px,py);g.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);g.stroke();});}
  for(let i=0;i<500*S2*S2;i++){const x=R()*n,y=R()*n,r=(0.8+R()*1.8)*S2;g.fillStyle=R()<0.5?'#b9a77c':'#6e5a3c';g.globalAlpha=0.5;wrapDraw(n,x,y,(px,py)=>{g.beginPath();g.arc(px,py,r,0,7);g.fill();});}
  g.globalAlpha=1;return{map:tex(c,true),nrm:normalTex(c,2.2)};}
/* ---- asphalt: worn grey with aggregate, tar patches and hairline cracks ---- */
function asphaltSet(){const c=cv(SZ),n=SZ;const f=fbm(n,5,6);for(let i=0;i<f.length;i++)f[i]=f[i]*0.7+0.15;const g=paintBase(c,f,[0x3a3836,0x4a4744,0x57534e,0x625d57]);
  const im=g.getImageData(0,0,n,n),D=im.data,H=new Float32Array(n*n);
  for(let i=0;i<n*n;i++){const r=R();let v=0;if(r<0.18)v=-40*R();else if(r>0.9)v=30+35*R();D[i*4]+=v;D[i*4+1]+=v;D[i*4+2]+=v*0.95;H[i]=(r>0.9?0.8:r<0.18?0.2:0.5)+f[i]*0.4;}
  g.putImageData(im,0,0);
  for(let k=0;k<4;k++){const x=R()*n,y=R()*n,r=(25+R()*40)*S2;wrapDraw(n,x,y,(px,py)=>{const gr=g.createRadialGradient(px,py,0,px,py,r);gr.addColorStop(0,'rgba(20,20,22,0.14)');gr.addColorStop(1,'rgba(20,20,22,0)');g.fillStyle=gr;g.fillRect(px-r,py-r,2*r,2*r);});}
  g.strokeStyle='rgba(18,17,16,0.75)';g.lineWidth=1.2*S2;for(let k=0;k<7;k++){let x=R()*n,y=R()*n,a=R()*6.28;const pts=[[x,y]];for(let s=0;s<14;s++){a+=(R()-0.5)*1.2;x+=Math.cos(a)*9*S2;y+=Math.sin(a)*9*S2;pts.push([x,y]);}
    wrapDraw(n,0,0,(ox,oy)=>{g.beginPath();pts.forEach(([px,py],i)=>i?g.lineTo(px+ox,py+oy):g.moveTo(px+ox,py+oy));g.stroke();});}
  return{map:tex(c,true),nrm:normalTex(c,2.2,H)};}
/* ---- interlocking paving blocks (running bond) ---- */
function paverSet(){const c=cv(SZ),n=SZ,g=c.getContext('2d');const f=fbm(n,6,5);paintBase(c,f.map(v=>v*0.6+0.2),[0x9d9688,0xb0a998,0xbdb5a2,0xa59c86]);
  const rows=10,bw=n/5,bh=n/rows,H=new Float32Array(n*n).fill(0);g.lineWidth=2.4*S2;
  for(let r=0;r<rows;r++){const off=(r%2)*bw/2;for(let k=-1;k<6;k++){const x=k*bw+off,y=r*bh;const tone=(R()-0.5)*26;g.fillStyle=tone>0?'rgba(255,250,235,'+(tone/120)+')':'rgba(60,50,40,'+(-tone/110)+')';g.fillRect(x+2,y+2,bw-4,bh-4);}}
  g.strokeStyle='rgba(70,64,55,0.85)';for(let r=0;r<=rows;r++){g.beginPath();g.moveTo(0,r*bh);g.lineTo(n,r*bh);g.stroke();}
  for(let r=0;r<rows;r++){const off=(r%2)*bw/2;for(let k=0;k<=5;k++){const x=(k*bw+off)%n;g.beginPath();g.moveTo(x,r*bh);g.lineTo(x,(r+1)*bh);g.stroke();}}
  for(let y=0;y<n;y++){const r=Math.floor(y/bh),off=(r%2)*bw/2,dy=Math.min(y-r*bh,(r+1)*bh-y);for(let x=0;x<n;x++){const dx=Math.min(((x-off)%bw+bw)%bw,bw-((x-off)%bw+bw)%bw);H[y*n+x]=Math.min(1,Math.min(dx,dy)/(3*S2))*0.8+f[y*n+x]*0.2;}}
  for(let i=0;i<3000*S2*S2;i++){g.fillStyle=R()<0.5?'rgba(40,36,30,0.25)':'rgba(255,255,255,0.18)';g.fillRect(R()*n,R()*n,1.5*S2,1.5*S2);}
  return{map:tex(c,true),nrm:normalTex(c,3.5,H)};}
/* ---- concrete (kerbs) and laterite dirt (town, outskirts) ---- */
function plainSet(cols,base,dots){const c=cv(SZ/2),n=SZ/2;const f=fbm(n,base,6);const g=paintBase(c,f,cols);for(let i=0;i<dots*S2;i++){g.fillStyle=R()<0.5?'rgba(40,30,20,0.3)':'rgba(255,245,225,0.25)';const r=(0.5+R()*1.5)*S2;g.beginPath();g.arc(R()*n,R()*n,r,0,7);g.fill();}
  return{map:tex(c,true),nrm:normalTex(c,2.5)};}
const macro=(()=>{const n=256,c=cv(n),g=c.getContext('2d'),im=g.createImageData(n,n),a=fbm(n,3,5),b=fbm(n,5,4);for(let i=0;i<n*n;i++){im.data[i*4]=a[i]*255;im.data[i*4+1]=b[i]*255;im.data[i*4+2]=128;im.data[i*4+3]=255;}g.putImageData(im,0,0);return tex(c,false);})();

/* world-space mapping: the map/normal map are sampled at worldXZ*scale; a second, rotated & scaled sample is blended in by a
   large noise so the repeat is invisible, and a slow tone variation adds realistic unevenness. */
function worldMapped(m,set,scale,macroAmt,plain){m.map=set.map;if(!LQ&&set.nrm){m.normalMap=set.nrm;m.normalScale=new THREE.Vector2(0.9,0.9);}
  const WS=m.userData.ws={value:scale};const prev=m.onBeforeCompile;m.onBeforeCompile=(sh,r)=>{if(prev)prev(sh,r);sh.uniforms.uWS=WS;sh.uniforms.uMac={value:macro};sh.uniforms.uMacA={value:macroAmt};
    sh.vertexShader='uniform float uWS;\nvarying vec2 vWUV;\nvarying vec2 vWXZ;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{vec4 w4=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nw4=instanceMatrix*w4;\n#endif\nw4=modelMatrix*w4;vWXZ=w4.xz;vWUV=w4.xz*uWS;}');
    sh.fragmentShader='uniform sampler2D uMac;\nuniform float uMacA;\nvarying vec2 vWUV;\nvarying vec2 vWXZ;\n'+sh.fragmentShader.replace('#include <uv_pars_fragment>','#include <uv_pars_fragment>\n#define vUv vWUV')
      .replace('#include <map_fragment>','#ifdef USE_MAP\nfloat mkA=texture2D(uMac,vWXZ*0.019).r;vec2 uvB=mat2(0.8,-0.6,0.6,0.8)*vWUV*0.43+vec2(0.37,0.11);\nvec4 texelColor='+(plain?'texture2D(map,vWUV);':'mix(texture2D(map,vWUV),texture2D(map,uvB),smoothstep(0.4,0.6,mkA));')+'\ntexelColor=mapTexelToLinear(texelColor);diffuseColor*=texelColor;\nfloat mv=texture2D(uMac,vWXZ*0.0061+0.5).g;diffuseColor.rgb*=mix(1.0-uMacA,1.0+uMacA,smoothstep(0.25,0.75,mv));\n#endif');};
  m.customProgramCacheKey=()=>'wm'+scale+(plain?'p':'');m.needsUpdate=true;return m;}
const M=(o)=>LQ?new THREE.MeshLambertMaterial({color:o.color||0xffffff}):new THREE.MeshStandardMaterial({color:o.color||0xffffff,roughness:o.rough==null?0.95:o.rough,metalness:0});

const grass=grassSet(),asph=asphaltSet(),pav=paverSet(),conc=plainSet([0x8f8a80,0xa6a092,0xb7b0a0],8,900),dirt=plainSet([0x8a6a48,0x9c7b55,0xab8b62,0x93805a,0x6f7a3e],4,1600);
const gM=worldMapped(M({color:0xdedfd2}),grass,1/3.2,0.2);ground.material=gM;
if(typeof townGround!=='undefined'&&townGround)townGround.material=worldMapped(M({color:0xffffff}),dirt,1/7,0.2);
outer.material=worldMapped(new THREE.MeshLambertMaterial({color:0xe8e6dc}),dirt,1/9,0.25);
/* the asphalt keeps its wet-weather behaviour (the weather code tints roadMat.color from userData.c) */
roadMat.userData.c=0xd9d6d2;roadMat.color.setHex(0xd9d6d2);worldMapped(roadMat,asph,1/4,0.12);if(!LQ)roadMat.normalScale.set(0.6,0.6);
const dM=worldMapped(M({color:0xf0e6d8}),dirt,1/5,0.2);outdoor.children.forEach(o=>{if(o.isMesh&&o.material===dustMat)o.material=dM;});
const paveM=worldMapped(M({color:0xffffff,rough:0.9}),pav,1/2.2,0.1,true),kerbM=worldMapped(M({color:0xe0dcd4,rough:0.9}),conc,1/1.6,0.08);
  outdoor.children.forEach(o=>{if(!o.isInstancedMesh||o.geometry!==G.box)return;if(o.material===MC[0xb3ab9a])o.material=paveM;else if(o.material===MC[0x8f887a])o.material=kerbM;});

/* ---- photo-scanned PBR textures (Poly Haven, CC0) in vendor/tex: they replace the generated ones once loaded;
   if they are missing the generated textures simply stay ---- */
{const TL=new THREE.TextureLoader(),townM=typeof townGround!=='undefined'&&townGround?townGround.material:null;
  const ph=(name,cb)=>{const t={};let n=0;[['d',true],['n',false]].forEach(([k,srgb])=>TL.load('vendor/tex/'+name+'_'+k+'.jpg',tx=>{tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.anisotropy=ANI;if(srgb)tx.encoding=THREE.sRGBEncoding;t[k]=tx;if(++n===2)try{cb(t);}catch(e){}},undefined,()=>{}));};
  const use=(m,t,color,scale,ns)=>{if(!m)return;m.map=t.d;if(!LQ){m.normalMap=t.n;m.normalScale=new THREE.Vector2(ns||1,ns||1);}if(color!=null)m.color.setHex(color);if(m.userData.ws)m.userData.ws.value=scale;m.needsUpdate=true;};
  ph('leafy_grass',t=>use(gM,t,0xd4e6b8,1/2.6,1));
  ph('asphalt_02',t=>{roadMat.userData.c=0xc4c2bf;use(roadMat,t,0xc4c2bf,1/3.2,0.8);});
  ph('dry_ground_01',t=>{use(dM,t,0xd9aa80,1/1.6,0.8);use(townM,t,0xdcbc98,1/2.4,0.8);use(outer.material,t,0xd8b890,1/5);});
  ph('concrete_pavers',t=>use(paveM,t,0xf2eee6,1/2.2,1));
  ph('concrete_floor_02',t=>use(kerbM,t,0xe6e2da,1/1.4,0.7));
  /* pitched roofs: painted corrugated iron sheets, ridges running down the slope, with a little sky reflection */
  ph('corrugated_iron_02',t=>{const RM={};const mk=c=>{if(RM[c])return RM[c];const col=new THREE.Color(c).lerp(new THREE.Color(0xffffff),0.12).multiplyScalar(2.1);
      const d=t.d.clone(),n=t.n.clone();[d,n].forEach(x=>{x.needsUpdate=true;x.center.set(0.5,0.5);x.rotation=Math.PI/2;x.repeat.set(0.45,0.45);});
      const m=LQ?new THREE.MeshLambertMaterial({color:col,map:d}):new THREE.MeshStandardMaterial({color:col,map:d,normalMap:n,roughness:0.6,metalness:0.12});
      if(!LQ&&typeof envMat==='function')try{envMat(m,0.35);}catch(e){}return RM[c]=m;};
    scene.traverse(o=>{if(o.isMesh&&o.userData.roof!=null)o.material=mk(o.userData.roof);});});}
/* ---- leaf-card tree crowns ---- */
const leafTex=(()=>{const n=256,c=cv(n),g=c.getContext('2d');const cols=['#4b6e33','#5a7d3b','#3d5f2b','#698a45','#77924e','#34512a','#566f33'];
  g.strokeStyle='#4a3a26';g.lineWidth=2;for(let k=0;k<7;k++){g.beginPath();g.moveTo(n/2,n/2);g.lineTo(n/2+(R()-0.5)*n*0.8,n/2+(R()-0.5)*n*0.8);g.stroke();}
  for(let i=0;i<150;i++){const a=R()*6.28,r=Math.pow(R(),0.6)*n*0.42,x=n/2+Math.cos(a)*r,y=n/2+Math.sin(a)*r,s=9+R()*10;g.save();g.translate(x,y);g.rotate(R()*6.28);
    g.fillStyle=cols[Math.floor(R()*cols.length)];g.beginPath();g.ellipse(0,0,s,s*0.42,0,0,7);g.fill();g.strokeStyle='rgba(30,50,15,0.5)';g.lineWidth=1;g.beginPath();g.moveTo(-s,0);g.lineTo(s,0);g.stroke();g.restore();}
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=ANI;return t;})();
function crownGeo(){const P=[],N=[],U=[],cards=QH?46:QM?36:24,v=new THREE.Vector3(),a=new THREE.Vector3(),b=new THREE.Vector3(),nn=new THREE.Vector3();
  for(let i=0;i<cards;i++){const ctr=new THREE.Vector3(R()*2-1,R()*2-1,R()*2-1);if(ctr.length()>1){i--;continue;}ctr.multiplyScalar(0.62);ctr.y=ctr.y*0.9+0.05;
    nn.set(R()*2-1,R()*2-1,R()*2-1).normalize();a.set(0,1,0).cross(nn);if(a.lengthSq()<0.01)a.set(1,0,0);a.normalize();b.copy(nn).cross(a).normalize();const s=0.55+R()*0.3;
    const C=[[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]].map(([x,y,u,w])=>{v.copy(ctr).addScaledVector(a,x*s).addScaledVector(b,y*s);return[v.x,v.y,v.z,u,w];});
    [[0,1,2,0,2,3],[0,2,1,0,3,2]].forEach(tri=>tri.forEach(k=>{const p=C[k];P.push(p[0],p[1],p[2]);U.push(p[3],p[4]);v.set(p[0],p[1]*1.2,p[2]).normalize().lerp(nn.set(0,1,0),0.25).normalize();N.push(v.x,v.y,v.z);}));}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));geo.computeBoundingSphere();return geo;}
{const cg=crownGeo(),tints={0x3f6b33:0xe9f2dc,0x4f7d3a:0xf4f2d6,0x335c2e:0xd6e6c8},dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:leafTex,alphaTest:0.45});
  outdoor.children.forEach(o=>{if(!o.isInstancedMesh||o.geometry!==G.sphLo||!o.material||o.material===bulbMat)return;const hx=o.material.color.getHex();if(!(hx in tints))return;
    o.geometry=cg;o.material.map=leafTex;o.material.alphaTest=0.45;o.material.color.setHex(tints[hx]);o.material.needsUpdate=true;o.customDepthMaterial=dm;o.frustumCulled=false;});}

/* ---- sky dome ---- */
const SU={uTop:{value:new THREE.Color(0x6f9fd8)},uHor:{value:new THREE.Color(0xd8ddcf)},uSun:{value:new THREE.Vector3(0.3,0.8,0.4)},uSunC:{value:new THREE.Color(0xfff1d6)},uT:TU,uCl:{value:0.3},uDay:{value:1},uNight:{value:0},uGrey:{value:0}};
const dome=new THREE.Mesh(new THREE.SphereGeometry(700,32,16),new THREE.ShaderMaterial({uniforms:SU,side:THREE.BackSide,depthWrite:false,depthTest:false,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0);gl_Position=p.xyww;gl_Position.z*=0.99999;}',
  fragmentShader:`varying vec3 vD;uniform vec3 uTop,uHor,uSunC,uSun;uniform float uT,uCl,uDay,uNight,uGrey;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h1(i),h1(i+vec2(1.0,0.0)),f.x),mix(h1(i+vec2(0.0,1.0)),h1(i+vec2(1.0,1.0)),f.x),f.y);}
float fb(vec2 p){float s=0.0,a=0.5;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(1.7,9.2);a*=0.5;}return s;}
void main(){vec3 d=normalize(vD);float y=d.y;vec3 sd=normalize(uSun);
  vec3 col=mix(uHor,uTop,pow(clamp(y,0.0,1.0),0.5));if(y<0.0)col=uHor;
  float sc=max(dot(d,sd),0.0);col+=uSunC*(pow(sc,6.0)*0.18+pow(sc,90.0)*0.35)*uDay*(1.0-uGrey*0.8);
  col=mix(col,uSunC*1.6+0.4,smoothstep(0.99955,0.9998,sc)*uDay*(1.0-uGrey)*step(0.0,sd.y));
  float mc=max(dot(d,-sd),0.0);col=mix(col,vec3(0.92,0.94,1.0),smoothstep(0.99965,0.99985,mc)*uNight*(1.0-uGrey));
  if(y>0.0){vec2 sp=floor(d.xz/(y+0.6)*420.0);float st=step(0.9975,h1(sp))*uNight*smoothstep(0.05,0.35,y)*(1.0-uGrey);
    vec2 cp=d.xz/(y+0.1)*1.4+vec2(uT*0.006,uT*0.002);float f=fb(cp);float c=smoothstep(0.62-uCl*0.45,0.82-uCl*0.3,f)*smoothstep(0.0,0.12,y);
    float sh=fb(cp*1.7+vec2(3.1,0.7)+sd.xz*0.25);vec3 lit=mix(vec3(1.0,0.99,0.97),uSunC,0.35);vec3 dk=mix(uHor*0.9,vec3(0.6,0.62,0.66),0.5);
    vec3 cc=mix(dk,lit,smoothstep(0.3,0.75,sh))*mix(0.16,1.0,uDay);cc=mix(cc,vec3(dot(cc,vec3(0.33))),uGrey*0.7)*mix(1.0,0.72,uGrey);cc+=uSunC*pow(sc,10.0)*0.35*uDay;
    col=mix(col+vec3(st),cc,c*0.92);}
  gl_FragColor=vec4(col,1.0);}`}));
dome.renderOrder=-100;dome.frustumCulled=false;scene.add(dome);
if(typeof cloudMat!=='undefined')cloudMat.visible=false;
const top=new THREE.Color(),tc=new THREE.Color(),cNightTop=new THREE.Color(0x0b1430),cDayTop=new THREE.Color(0x4f86c9),cGreyTop=new THREE.Color(0x8d959c);
function updDome(cam){dome.visible=!(S&&S.inside);if(!dome.visible)return;dome.position.copy(cam.position);
  let h=10.5,wx='sun';if(S){h=minOf(S.t)/60;wx=S.weather||'sun';}else h=17.4;
  const s=Math.sin((h-6)/12*Math.PI),k=Math.max(0,Math.min(1,s*1.6+0.12)),ang=(h-6)/12*Math.PI;
  SU.uSun.value.set(Math.cos(ang),Math.sin(ang),0.45).normalize();const grey={sun:0,cloudy:0.15,overcast:0.6,rain:0.8,heavy:1}[wx]||0;
  SU.uCl.value={sun:0.18,cloudy:0.55,overcast:0.9,rain:1,heavy:1}[wx]||0.2;SU.uGrey.value=grey;SU.uDay.value=k;SU.uNight.value=Math.max(0,Math.min(1,1-k*2.2));
  SU.uHor.value.copy(scene.fog.color);SU.uSunC.value.copy(S?sun.color:tc.setHex(0xffc890));
  top.copy(cNightTop).lerp(cDayTop,k).lerp(cGreyTop,grey*k);SU.uTop.value.copy(top).lerp(scene.fog.color,0.18);}
const _render=renderer.render.bind(renderer);renderer.render=function(sc,cam){if(sc===scene)try{updDome(cam);}catch(e){}return _render(sc,cam);};
window.__RND={dome,SU,gM};
})();
