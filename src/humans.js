/* ================= REALISTIC HUMANS =================
   Rigged, realistic people built at runtime from MakeHuman data (CC0, vendor/hm/hm.bin, see tools/humans).
   Every sim keeps its old procedural body as a far-distance / low-quality fallback. Near the camera the
   procedural body is hidden and a skinned human is shown instead; its skeleton copies the procedural
   joints every frame, so every existing pose (walk, run, sit, sleep, dance, carry, rifle...) works. */
const HMS={on:true,ready:false,failed:false,loading:false,d:null,eyeTex:null,get reg(){return window.__hmReg||(window.__hmReg=[]);},set reg(v){window.__hmReg=v;},queue:[],tick:0,mats:{},stats:{built:0,ms:0}};
const HM_S=1.875/17.2;           // MakeHuman decimetres -> sim units (sim root is scaled by 1.6*height)
/* everyone is realistic: the classic bodies are never shown (they only remain as an invisible skeleton the
   realistic body copies, and come back only if the character data cannot be downloaded at all) */
window.__hmHide=true;
function hmLoad(){if(HMS.loading||HMS.ready||HMS.failed)return;HMS.loading=true;
  const get=u=>fetch(u).then(r=>{if(!r.ok)throw new Error('hm '+r.status);return r.arrayBuffer();});let base='/vendor/hm/';
  get(base+'hm.bin').catch(()=>{base='/';return get('/hm.bin');}).then(buf=>{HMS.d=hmParse(buf);
    HMS.eyeTex=new THREE.TextureLoader().load(base+'eye.png');
    /* motion-captured walk, run and idle (Mixamo clips from the three.js examples), retargeted in hmPose */
    fetch(base+'clips.json').then(r=>r.ok?r.json():fetch('/clips.json').then(r2=>r2.json())).then(c=>{for(const k in c)for(const b in c[k].bones)c[k].bones[b]=new Float32Array(c[k].bones[b]);HMS.clips=c;}).catch(()=>{});HMS.eyeTex.encoding=THREE.sRGBEncoding;HMS.base=base;HMS.ready=true;HMS.loading=false;})
  .catch(e=>{console.warn('realistic humans unavailable',e);HMS.failed=true;HMS.loading=false;hmFallback();});}
/* only if the data can't be loaded: show the classic bodies again so nobody is invisible */
function hmFallback(){window.__hmHide=false;HMS.reg.forEach(s=>{const ud=s.userData;if(ud.hm)hmDetach(s);if(ud.J)ud.J.body.visible=true;});}
function hmParse(buf){const dv=new DataView(buf);if(dv.getUint32(0,true)!==0x314d4856)throw new Error('bad hm.bin');const jl=dv.getUint32(4,true);
  const H=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,8,jl)));const base=8+jl;const TA={Float32Array,Uint16Array,Uint32Array,Uint8Array,Int8Array,Int16Array};const D={h:H};
  for(const k in H){const v=H[k];if(Array.isArray(v)&&v.length===3&&TA[v[0]])D[k]=new TA[v[0]](buf,base+v[1],v[2]);}return D;}

/* ---------- materials (shared; skinning on) ---------- */
function hmMat(key,make){return HMS.mats[key]||(HMS.mats[key]=make());}
function hmSkinMat(){return hmMat('skin',()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.52,metalness:0,skinning:true}));}
function hmCloth(c,r,tex){const k='c'+c+'_'+r+(tex?'_t':'');return hmMat(k,()=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:0,skinning:true});
  if(tex){const src=ankaraM(c).map;m.map=src;m.color.setHex(0xffffff);}return m;});}
/* photo skin and proxy textures (MakeHuman system assets, CC0) are applied when they arrive; until then the
   material shows the average skin colour, so nobody flashes white or black */
const HM_SKINREF=0x573828;
function hmTex(file,cb){const L=HMS.texL||(HMS.texL={});if(L[file]){if(L[file].t)cb(L[file].t);else L[file].q.push(cb);return;}
  const e=L[file]={t:null,q:[cb]};new THREE.TextureLoader().load((HMS.base||'/vendor/hm/')+file,t=>{t.encoding=THREE.sRGBEncoding;t.anisotropy=4;e.t=t;e.q.forEach(f=>{try{f(t);}catch(x){}});e.q=[];},undefined,()=>{});}
function hmSkinTexMat(f){return hmMat('skinT'+(f?'f':'m'),()=>{const m=new THREE.MeshStandardMaterial({vertexColors:true,color:HM_SKINREF,roughness:0.5,metalness:0,skinning:true});
  hmTex(f?'skin_f.jpg':'skin_m.jpg',t=>{m.map=t;m.color.setHex(0xffffff);m.needsUpdate=true;});return m;});}
function hmProxyMat(file,tint){return hmMat('px'+file+'_'+tint,()=>{const m=new THREE.MeshStandardMaterial({color:tint,roughness:0.75,metalness:0,skinning:true,side:THREE.DoubleSide,alphaTest:0.45,transparent:false});
  m.visible=false;hmTex(file,t=>{m.map=t;m.visible=true;m.needsUpdate=true;});return m;});}
function hmEyeMat(){return hmMat('eye',()=>new THREE.MeshStandardMaterial({map:HMS.eyeTex,roughness:0.18,metalness:0,skinning:true,alphaTest:0.5}));}

/* ---------- what a sim looks like -> body + outfit spec ---------- */
function hmSpec(o,seed){const r=n=>{const x=Math.sin(seed*91.7+n*12.9898)*43758.5453;return x-Math.floor(x);};
  const f=!!o.female,bw=o.build||1;
  const face={};const FK={oval:['hoval',0.55],round:['hround',0.6],square:['hsquare',0.55],long:['hoval',0.9],wide:['hfat1',0.5],heart:['chinw0',0.6]}[o.face||'oval'];if(FK)face[FK[0]]=FK[1];
  if((o.nose||0.026)>0.028){face.nwide=0.5;face.nflare=0.5;}else if(r(1)<0.5)face.nflare=r(2)*0.6;
  face.lipl=0.05+r(3)*0.3;face.lipu=r(4)*0.25;face.eyeL0=face.eyeR0=0.3+r(14)*0.25;if(r(5)<0.4)face.chinp1=r(6)*0.5;else face.chinp0=r(6)*0.3;
  if(r(7)<0.5){face.cheekL=face.cheekR=r(8)*0.5;}if(r(9)<0.5)face.mwide=r(10)*0.4;face.npw=r(11)*0.5;
  return{female:f,skin:o.skin||0x6b4430,weight:Math.max(0.12,Math.min(0.95,0.5+(bw-1)*2.6+(o.belly&&o.belly>1?0.15:0))),muscle:f?0.45+r(12)*0.15:0.5+r(12)*0.3,
    height:0.5,cup:0.35+r(13)*0.4,belly:o.belly&&o.belly>1?Math.min(0.6,(o.belly-1)*3):0,face,
    top:o.cassock||o.habit?'long':(o.top||'tee'),long:!!(o.longSleeve||o.cassock||o.habit||['hoodie','kaftan','kaftanA','long'].includes(o.top)),
    shirt:o.shirt!=null?o.shirt:0xdddddd,ankara:o.top==='ankara'||o.top==='kaftanA',pants:o.pants!=null?o.pants:0x23262e,
    skirt:!!o.skirt||o.top==='dress'||o.cassock||o.habit,dress:o.top==='dress',robe:!!(o.cassock||o.habit||o.top==='kaftan'||o.top==='kaftanA'),
    glasses:!!o.glasses,shoes:o.shoes||0x1d1a18,shoeStyle:o.shoeStyle||'shoes',hairStyle:o.hairStyle||(f?'puff':'low'),hairC:o.hairC||0x161010,hijab:o.hijab,mask:!!o.mask};}

/* ---------- build one human ---------- */
const _v1=new THREE.Vector3(),_v2=new THREE.Vector3();
function hmBuild(spec){const t0=performance.now();const D=HMS.d,H=D.h;const P=new Float32Array(D.pos);const NB=H.nBody;
  const T=(k,w)=>{const ii=D['t_'+k+'_i'],dd=D['t_'+k+'_d'];if(!w||!ii)return;const s=w/4000;for(let j=0;j<ii.length;j++){const o=ii[j]*3,q=j*3;P[o]+=dd[q]*s;P[o+1]+=dd[q+1]*s;P[o+2]+=dd[q+2]*s;}};
  const f=spec.female,g=f?'uf':'um',lr=(a,b,v)=>{if(v<0.5)T(a,(0.5-v)*2);else T(b,(v-0.5)*2);};
  T(f?'af':'am',1);lr(g+'_w0',g+'_w1',spec.weight);lr(g+'_m0',g+'_m1',spec.muscle);lr((f?'f':'m')+'h0',(f?'f':'m')+'h1',spec.height);T(f?'fp':'mp',0.5);
  if(f)lr('fb0','fb1',spec.cup);T('belly',spec.belly);for(const k in spec.face)T(k,spec.face[k]);
  let minY=1e9;for(let i=0;i<NB;i++)minY=Math.min(minY,P[i*3+1]);for(let i=1;i<P.length;i+=3)P[i]-=minY;
  /* joints */
  const JO=D.jointOff,JI=D.jointIdx,nJ=JO.length-1,JP=[];for(let k=0;k<nJ;k++){const p=new THREE.Vector3();for(let j=JO[k];j<JO[k+1];j++)p.x+=P[JI[j]*3],p.y+=P[JI[j]*3+1],p.z+=P[JI[j]*3+2];JP.push(p.multiplyScalar(1/(JO[k+1]-JO[k])));}
  const B=H.bones,X={};B.forEach((b,i)=>X[b]=JP[i]);H.extra.forEach((e,i)=>X[e]=JP[B.length+i]);
  /* skeleton (rest rotations are identity; pivots at MakeHuman joint centres) */
  const g0=new THREE.Group();g0.scale.setScalar(HM_S);const bones=B.map(()=>new THREE.Bone()),bn={};
  B.forEach((b,i)=>{const p=H.parents[i];bones[i].name=b;bn[b]=bones[i];if(p<0){bones[i].position.copy(X[b]);g0.add(bones[i]);}else{bones[i].position.copy(X[b]).sub(X[B[p]]);bones[p].add(bones[i]);}});
  g0.updateMatrixWorld(true);const skel=new THREE.Skeleton(bones);
  /* neutral pose: arms hang down beside the body (MakeHuman rest is an A-pose) */
  const N={};const side=s=>Math.sign(X['uarm'+s].x)||1;
  ['L','R'].forEach(s=>{const sg=side(s),down=new THREE.Vector3(sg*0.07,-1,0.02).normalize();
    const qa=new THREE.Quaternion().setFromUnitVectors(_v1.copy(X['farm'+s]).sub(X['uarm'+s]).normalize(),down);
    const fd=_v2.copy(X['hand'+s]).sub(X['farm'+s]).applyQuaternion(qa).normalize();const qf=new THREE.Quaternion().setFromUnitVectors(fd,new THREE.Vector3(sg*0.03,-1,0.08).normalize()).multiply(qa);
    N['uarm'+s]=qa;N['farm'+s]=qf;N['hand'+s]=qf;
    X['elbowN'+s]=X['uarm'+s].clone().add(X['farm'+s].clone().sub(X['uarm'+s]).applyQuaternion(qa));
    X['wristN'+s]=X['elbowN'+s].clone().add(X['hand'+s].clone().sub(X['farm'+s]).applyQuaternion(qf));});
  /* geometry helpers */
  const mk=(pos,idx,J,Wt,extra)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setIndex(new THREE.BufferAttribute(idx,1));
    geo.setAttribute('skinIndex',new THREE.BufferAttribute(J,4));geo.setAttribute('skinWeight',new THREE.BufferAttribute(Wt,4,true));if(extra)extra(geo);return geo;};
  const skinned=(geo,mat,shadow=true)=>{const m=new THREE.SkinnedMesh(geo,mat);m.castShadow=shadow&&(typeof QH==='undefined'||QH);m.receiveShadow=true;g0.add(m);m.bind(skel);return m;};
  const R=H.reg,meshes=[];const sstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  /* ---- clothing / hair are cut from skin-tight shells by smooth scalar fields s (>0 = covered, in dm) ---- */
  const dist=(a,b)=>X[a].distanceTo(X[b]),Lg={uarm:(dist('uarmL','farmL')+dist('uarmR','farmR'))/2,farm:(dist('farmL','handL')+dist('farmR','handR'))/2,thigh:(dist('thighL','shinL')+dist('thighR','shinR'))/2,shin:(dist('shinL','footL')+dist('shinR','footR'))/2};
  const waist=X.spine.y,waistTop=waist+0.42,eyeY=(X.eyeL.y+X.eyeR.y)/2,eyeZ=(X.eyeL.z+X.eyeR.z)/2,hcx=(X.eyeL.x+X.eyeR.x)/2,hcz=eyeZ-0.95;
  const clavY=(X.clavL.y+X.clavR.y)/2,nkx=(X.neck.x),nkz=X.neck.z+0.05,R0=spec.top==='hoodie'?0.8:spec.top==='polo'?0.84:0.92;
  const neckS=(x,y,z)=>Math.max(clavY-0.45-y,Math.hypot(x-nkx,(z-nkz)*(z>nkz?0.9:1.15))-R0);
  const hem=spec.dress?waist:spec.robe?waist-0.6:spec.skirt?waist+0.22:waist-0.42,shorts=!!spec.shorts,longPants=!spec.skirt||spec.robe;
  const kneeY=(X.shinL.y+X.shinR.y)/2,skirtCut=spec.robe?0.9:spec.dress?kneeY-0.5:kneeY-1.6;
  const topS0=(r,t,x,y,z)=>r===R.torsoU||r===R.torsoL?y-hem:r===R.thigh?y-hem:r===R.neck?1:r===R.uarm?(spec.long?1:(0.45-t)*Lg.uarm):r===R.farm?(spec.long?(0.93-t)*Lg.farm:-1):-1;
  const topS=(r,t,x,y,z)=>Math.min(topS0(r,t,x,y,z),neckS(x,y,z));
  const botS=(r,t,x,y,z)=>Math.min(waistTop-y,botS0(r,t,x,y,z));
  const botS0=(r,t,x,y,z)=>r===R.torsoU||r===R.torsoL?waistTop-y:r===R.thigh?(spec.skirt&&!spec.robe?(0.25-t)*Lg.thigh:shorts?(0.62-t)*Lg.thigh:1):r===R.shin?(longPants&&!shorts?(0.95-t)*Lg.shin:-1):-1;
  const shoeS=(r,t,x,y,z)=>spec.shoeStyle==='slides'?(r===R.foot?0.28-y:-1):r===R.foot?1:r===R.shin?(t-0.9)*Lg.shin:-1;
  const hairS=(r,t,x,y,z)=>{if(r!==R.head&&r!==R.neck)return -1;const a=Math.abs(Math.atan2(x-hcx,z-hcz))/Math.PI;
    const bob=spec.hairStyle==='bob',fr=spec.hairStyle==='highfade'?0.7:bob?0.55:0.62,sd=bob?-0.35:0.47,bk=bob?-1.15:-0.78;
    const line=a<0.22?eyeY+fr+(sd-fr)*(a/0.22):a<0.5?eyeY+sd-0.05*((a-0.22)/0.28):eyeY+sd-0.05+(bk-sd+0.05)*Math.min(1,(a-0.5)/0.4);return y-line;};
  const field=(pl,fn)=>{const s=new Float32Array(pl.n);for(let k=0;k<pl.n;k++)s[k]=fn(pl.reg?pl.reg[k]:0,pl.t?pl.t[k]/60:0,pl.pos[k*3],pl.pos[k*3+1],pl.pos[k*3+2]);return s;};
  const clip=(pl,s,offset,mat,uvs,shadow)=>{const n=pl.n,map=new Int32Array(n).fill(-1),Pp=[],Nn=[],Jj=[],Ww=[],U=[],idx=[],ek=new Map();const off=typeof offset==='function'?offset:()=>offset;
    const addV=i=>{if(map[i]<0){map[i]=Pp.length/3;const o=off(i,s[i]);for(let a=0;a<3;a++){Pp.push(pl.pos[i*3+a]+pl.nor[i*3+a]*o);Nn.push(pl.nor[i*3+a]);}for(let a=0;a<4;a++){Jj.push(pl.J[i*4+a]);Ww.push(pl.W[i*4+a]);}if(uvs)U.push(uvs[i*2],uvs[i*2+1]);}return map[i];};
    const cut=(i,j)=>{const key=i<j?i*n+j:j*n+i;let id=ek.get(key);if(id!=null)return id;const t=s[i]/(s[i]-s[j]),oi=off(i,s[i]),oj=off(j,0);id=Pp.length/3;
      for(let a=0;a<3;a++){const pi=pl.pos[i*3+a]+pl.nor[i*3+a]*oi,pj=pl.pos[j*3+a]+pl.nor[j*3+a]*oj;Pp.push(pi+(pj-pi)*t);Nn.push(pl.nor[i*3+a]+(pl.nor[j*3+a]-pl.nor[i*3+a])*t);}
      {const m=new Map();for(let a=0;a<4;a++){const wi=pl.W[i*4+a]*(1-t),wj=pl.W[j*4+a]*t;if(wi)m.set(pl.J[i*4+a],(m.get(pl.J[i*4+a])||0)+wi);if(wj)m.set(pl.J[j*4+a],(m.get(pl.J[j*4+a])||0)+wj);}
        const e=[...m].sort((p,q)=>q[1]-p[1]).slice(0,4),sm=e.reduce((x,y)=>x+y[1],0)||1;let acc=0;for(let a=0;a<4;a++){const w=e[a]?Math.round(e[a][1]/sm*255):0;Jj.push(e[a]?e[a][0]:0);Ww.push(a===3?0:w);acc+=a===3?0:w;}
        if(e[3]){const w3=255-acc;Ww[Ww.length-1]=Math.max(0,w3);}else Ww[Ww.length-4]+=255-acc;}if(uvs)U.push(uvs[i*2]+(uvs[j*2]-uvs[i*2])*t,uvs[i*2+1]+(uvs[j*2+1]-uvs[i*2+1])*t);ek.set(key,id);return id;};
    const ix=pl.idx;for(let k=0;k<ix.length;k+=3){const v=[ix[k],ix[k+1],ix[k+2]],inn=v.map(i=>s[i]>=0);if(inn[0]&&inn[1]&&inn[2]){idx.push(addV(v[0]),addV(v[1]),addV(v[2]));continue;}if(!inn[0]&&!inn[1]&&!inn[2])continue;
      const out=[];for(let e=0;e<3;e++){const p=v[e],q=v[(e+1)%3];if(s[p]>=0)out.push(addV(p));if((s[p]>=0)!==(s[q]>=0))out.push(s[p]>=0?cut(p,q):cut(q,p));}for(let e=1;e<out.length-1;e++)idx.push(out[0],out[e],out[e+1]);}
    if(!idx.length)return null;const nv=Pp.length/3;
    const geo=mk(new Float32Array(Pp),nv>65535?new Uint32Array(idx):new Uint16Array(idx),new Uint8Array(Jj),new Uint8Array(Ww),g=>{const nn=new Float32Array(Nn);for(let k=0;k<nv;k++){const l=Math.hypot(nn[k*3],nn[k*3+1],nn[k*3+2])||1;nn[k*3]/=l;nn[k*3+1]/=l;nn[k*3+2]/=l;}g.setAttribute('normal',new THREE.BufferAttribute(nn,3));if(uvs)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(U),2));});
    const m=skinned(geo,mat,shadow!==false);meshes.push(m);return m;};
  /* body pool */
  const bpos=P.slice(0,NB*3);const bfull=mk(bpos,D.bodyIdx,D.bodyJ,D.bodyW);bfull.computeVertexNormals();
  const body={n:NB,pos:bpos,nor:bfull.getAttribute('normal').array,reg:D.bodyReg,t:D.bodyT,idx:D.bodyIdx,J:D.bodyJ,W:D.bodyW};
  /* skin: hidden where clothes fully cover it */
  {const col=new Float32Array(NB*3),sk=new THREE.Color(spec.skin),lip=sk.clone().multiplyScalar(0.6).lerp(_c2.setHex(0x4a2222),0.3),brow=new THREE.Color(0x0c0806),sole=sk.clone().lerp(_c2.setHex(0xd9ab8c),0.45);
    const paint=D.bodyPaint,reg=D.bodyReg;
    for(let i=0;i<NB;i++){const c=_c1.copy(sk);const lw=paint[i*2]/255;if(lw>0.5)c.lerp(lip,Math.min(1,(lw-0.5)*2.2));
      const bw=paint[i*2+1]/255,y=bpos[i*3+1],z=bpos[i*3+2];if(bw>0.25&&y>eyeY+0.14&&y<eyeY+0.5&&z>eyeZ-0.3)c.lerp(brow,Math.min(0.85,(bw-0.25)*1.6));
      if(reg[i]===R.foot&&y<0.1)c.lerp(sole,0.8);
      {const x=bpos[i*3];for(const E of [X.eyeL,X.eyeR]){const d=Math.hypot(x-E.x,(y-E.y)*1.6,z-E.z);if(d<0.36&&z>E.z-0.05)c.multiplyScalar(0.55+0.45*sstep(0.2,0.36,d));}}
      if(reg[i]===R.hand){const ny=body.nor[i*3+1],nx=body.nor[i*3]*Math.sign(bpos[i*3]-hcx);if(nx<-0.35)c.lerp(sole,Math.min(0.7,(-nx-0.35)*1.5));}
      col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
    const sT=field(body,topS),sB=spec.dress||(spec.skirt&&!spec.robe)?null:field(body,botS),sS=spec.shoeStyle==='slides'?null:field(body,shoeS),M=0.03;
    const hid=i=>sT[i]>M||(sB&&sB[i]>M)||(sS&&sS[i]>M);const hd=new Uint8Array(NB);for(let i=0;i<NB;i++)hd[i]=hid(i)?1:0;
    const idx=[],src=D.bodyIdx;for(let k=0;k<src.length;k+=3){const a=src[k],b=src[k+1],c=src[k+2];if(hd[a]&&hd[b]&&hd[c])continue;idx.push(a,b,c);}
    if(D.bodyVid&&D.bodyUV){/* photo-textured skin: split vertices along the UV seams; colour becomes a tone multiplier */
      const vid=D.bodyVid,ns=vid.length,sp=new Float32Array(ns*3),sn=new Float32Array(ns*3),sc=new Float32Array(ns*3),sj=new Uint8Array(ns*4),sw=new Uint8Array(ns*4),bn0=bfull.getAttribute('normal').array;
      const ref=_c2.setHex(HM_SKINREF),tr=Math.min(1.6,sk.r/ref.r),tg=Math.min(1.6,sk.g/ref.g),tb=Math.min(1.6,sk.b/ref.b);
      for(let k=0;k<ns;k++){const i=vid[k];for(let a=0;a<3;a++){sp[k*3+a]=bpos[i*3+a];sn[k*3+a]=bn0[i*3+a];}for(let a=0;a<4;a++){sj[k*4+a]=D.bodyJ[i*4+a];sw[k*4+a]=D.bodyW[i*4+a];}
        let m=1;const y=bpos[i*3+1];{const x=bpos[i*3],z=bpos[i*3+2];for(const E of [X.eyeL,X.eyeR]){const d=Math.hypot(x-E.x,(y-E.y)*1.6,z-E.z);if(d<0.3&&z>E.z-0.05)m*=0.75+0.25*sstep(0.15,0.3,d);}}
        sc[k*3]=tr*m;sc[k*3+1]=tg*m;sc[k*3+2]=tb*m;}
      const si=[],S2=D.bodyIdxS;for(let k=0;k<S2.length;k+=3){const a=S2[k],b=S2[k+1],c=S2[k+2];if(hd[vid[a]]&&hd[vid[b]]&&hd[vid[c]])continue;si.push(a,b,c);}
      const geo=mk(sp,Uint16Array.from(si),sj,sw,g=>{g.setAttribute('color',new THREE.BufferAttribute(sc,3));g.setAttribute('normal',new THREE.BufferAttribute(sn,3));g.setAttribute('uv',new THREE.BufferAttribute(D.bodyUV,2));});
      meshes.push(skinned(geo,hmSkinTexMat(f)));}
    else{const geo=mk(bpos,Uint16Array.from(idx),D.bodyJ,D.bodyW,g=>{g.setAttribute('color',new THREE.BufferAttribute(col,3));g.setAttribute('normal',bfull.getAttribute('normal'));});
    meshes.push(skinned(geo,hmSkinMat()));}}
  /* helper pools (subdivided once) */
  const pool=name=>{const off=D[name+'Off'],src=D[name+'Src'],wt=D[name+'Wt'],n=off.length-1,pos=new Float32Array(n*3);
    for(let k=0;k<n;k++){let x=0,y=0,z=0;for(let j=off[k];j<off[k+1];j++){const s=src[j]*3,w=wt[j];x+=P[s]*w;y+=P[s+1]*w;z+=P[s+2]*w;}pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;}
    const near=D[name+'Near'];if(near){const bn=body.nor;for(let k=0;k<n;k++){const b=near[k]*3;const d=(pos[k*3]-bpos[b])*bn[b]+(pos[k*3+1]-bpos[b+1])*bn[b+1]+(pos[k*3+2]-bpos[b+2])*bn[b+2];if(d<0.015){const m=0.015-d;pos[k*3]+=bn[b]*m;pos[k*3+1]+=bn[b+1]*m;pos[k*3+2]+=bn[b+2]*m;}}}
    let J=D[name+'J'],Wt=D[name+'W'];if(near&&name!=='hair'){/* move exactly like the skin underneath */J=new Uint8Array(n*4);Wt=new Uint8Array(n*4);for(let k=0;k<n;k++)for(let c=0;c<4;c++){J[k*4+c]=D.bodyJ[near[k]*4+c];Wt[k*4+c]=D.bodyW[near[k]*4+c];}}
    const geo=mk(pos,D[name+'Idx'],J,Wt);geo.computeVertexNormals();return{n,pos,nor:geo.getAttribute('normal').array,reg:D[name+'Reg'],t:D[name+'T'],idx:D[name+'Idx'],J,W:Wt};};
  const tg=pool('tights');let tuv=null;if(spec.ankara){tuv=new Float32Array(tg.n*2);for(let k=0;k<tg.n;k++){tuv[k*2]=(Math.atan2(tg.pos[k*3],tg.pos[k*3+2])/Math.PI+1)*2;tuv[k*2+1]=tg.pos[k*3+1]*0.32;}}
  const topOff=spec.top==='hoodie'?0.15:0.075,TOPM=hmCloth(spec.shirt,0.88,spec.ankara),BOTM=hmCloth(spec.pants,0.86);
  if(window.__HMDBG)HMS.dbg={tg,sT:field(tg,topS),R,X,clavY,nkx,nkz,R0};
  clip(tg,field(tg,topS),topOff,TOPM,tuv);
  if(!spec.dress&&!(spec.skirt&&!spec.robe))clip(tg,field(tg,botS),0.045,BOTM);
  clip(tg,field(tg,shoeS),spec.shoeStyle==='sneakers'?0.065:spec.shoeStyle==='slides'?0.03:0.045,hmCloth(spec.shoes,spec.shoeStyle==='sneakers'?0.7:0.4));
  if(spec.skirt){const sk=pool('skirt');clip(sk,field(sk,(r,t,x,y,z)=>Math.min(y-skirtCut,(spec.dress||spec.robe?waistTop+0.15:waist+0.3)-y)),0.035,spec.dress||spec.robe?TOPM:BOTM,spec.ankara?(()=>{const u=new Float32Array(sk.n*2);for(let k=0;k<sk.n;k++){u[k*2]=(Math.atan2(sk.pos[k*3],sk.pos[k*3+2])/Math.PI+1)*2;u[k*2+1]=sk.pos[k*3+1]*0.32;}return u;})():null);}
  /* hair: a shell over the scalp with a smooth hairline */
  const pxHair=spec.hijab||spec.mask?null:({afro:'afro01',natural:'afro01',braids:'braid01',ponytail:'ponytail01',bob:'bob01'})[spec.hairStyle]||null,pxOK=pxHair&&D['px_'+pxHair+'Ref'];
  const hs=pxOK?'low':spec.hairStyle;if(hs!=='bald'&&!spec.hijab&&!spec.mask){const th={low:0.045,waves:0.06,highfade:0.1,twists:0.24,locs:0.22,cornrows:0.06,braids:0.08,afro:0.75,natural:0.45,puff:0.07,bun:0.07,bob:0.12,ponytail:0.07}[hs]||0.06;
    const HM=hmMat('h'+spec.hairC,()=>new THREE.MeshStandardMaterial({color:spec.hairC,roughness:0.78,metalness:0,skinning:true}));const topY=X.headTop.y;
    clip(body,field(body,hairS),(i,s)=>{let o=0.012+th*sstep(0,hs==='afro'||hs==='natural'?0.7:0.22,s);if(hs==='highfade')o*=sstep(topY-1.5,topY-0.35,body.pos[i*3+1])*0.85+0.15;
      if(hs==='afro'||hs==='natural'||hs==='bob')o*=0.55+0.45*sstep(eyeY-0.4,topY-0.2,body.pos[i*3+1]);return o;},HM);
    if(['locs','braids','twists','bob'].includes(hs)){const hp=pool('hair');const low=hs==='bob'?eyeY-1.25:eyeY-2.1;
      clip(hp,field(hp,(r,t,x,y,z)=>Math.min(y-low,Math.max(eyeZ-0.8-z,y-(eyeY+0.6)))),0.05,HM);}}
  /* hijab: wraps the head, leaves the face open, drapes over the shoulders */
  if(spec.hijab){const fy=eyeY-0.25;const hjS=(r,t,x,y,z)=>{if(r===R.head||r===R.neck){if(z<eyeZ-0.75)return 0.6;return (Math.hypot((x-hcx)/0.6,(y-fy)/(y>fy?0.82:0.98))-1)*0.5;}
      if(r===R.torsoU||r===R.uarm||r===R.torsoL)return y-(clavY-(z<nkz?1.2:0.75));return -1;};
    clip(body,field(body,hjS),(i,s)=>0.14+(body.reg[i]===R.head?0.1:0.24)*sstep(0,0.5,s),hmCloth(spec.hijab,0.9));}
  /* balaclava */
  if(spec.mask){const mkS=(r,t,x,y,z)=>r===R.head||r===R.neck?Math.max(Math.abs(y-eyeY)-0.2,(eyeZ-0.55)-z):(r===R.torsoU?y-clavY:-1);
    clip(body,field(body,mkS),0.04,hmCloth(0x141414,0.95));}
  /* fitted proxies (hair styles, eyebrows, eyelashes) */
  const proxy=(name,mat,shadow)=>{const ref=D[name+'Ref'],sc=H.proxies&&H.proxies[name];if(!ref||!sc)return null;const n=ref.length/9,pos=new Float32Array(n*3);
    const ax=(q,c)=>q?Math.abs(P[q[0]*3+c]-P[q[1]*3+c])/q[2]:1,sx=ax(sc.x,0),sy=ax(sc.y,1),sz=ax(sc.z,2);
    for(let k=0;k<n;k++){const r=ref.subarray(k*9,k*9+9);for(let a=0;a<3;a++)pos[k*3+a]=P[r[0]*3+a]*r[3]+P[r[1]*3+a]*r[4]+P[r[2]*3+a]*r[5]+r[6+a]*[sx,sy,sz][a];}
    const geo=mk(pos,D[name+'Idx'],D[name+'J'],D[name+'W'],g=>g.setAttribute('uv',new THREE.BufferAttribute(D[name+'UV'],2)));geo.computeVertexNormals();const m=skinned(geo,mat,shadow);meshes.push(m);return m;};
  const hairTint=new THREE.Color(spec.hairC).lerp(_c1.setHex(0x3a2a20),0.35).multiplyScalar(2.2).getHex();
  if(!spec.mask)proxy('px_brow',hmProxyMat('brow.png',0x9a8a80),false);
  proxy('px_lash',hmProxyMat('lash.png',0xffffff),false);
  if(pxOK)proxy('px_'+pxHair,hmProxyMat('hair_'+pxHair+'.png',hairTint),true);
  /* eyes */
  {const ref=D.eyeRef,n=ref.length/9,pos=new Float32Array(n*3),sc=H.eyeScale,V3=i=>[P[i*3],P[i*3+1],P[i*3+2]];
    const sx=Math.abs(P[sc.x[0]*3]-P[sc.x[1]*3])/sc.x[2],sy=Math.abs(P[sc.y[0]*3+1]-P[sc.y[1]*3+1])/sc.y[2],sz=Math.abs(P[sc.z[0]*3+2]-P[sc.z[1]*3+2])/sc.z[2];
    for(let k=0;k<n;k++){const r=ref.subarray(k*9,k*9+9);for(let a=0;a<3;a++)pos[k*3+a]=P[r[0]*3+a]*r[3]+P[r[1]*3+a]*r[4]+P[r[2]*3+a]*r[5]+r[6+a]*[sx,sy,sz][a];}
    const hj=B.indexOf('head'),J=new Uint8Array(n*4),Wt=new Uint8Array(n*4);for(let k=0;k<n;k++){J[k*4]=hj;Wt[k*4]=255;}
    const geo=mk(pos,D.eyeIdx,J,Wt,g=>g.setAttribute('uv',new THREE.BufferAttribute(D.eyeUV,2)));geo.computeVertexNormals();meshes.push(skinned(geo,hmEyeMat(),false));}
  /* glasses: thin frames on the head bone */
  if(spec.glasses){const gm=hmMat('glass',()=>new THREE.MeshStandardMaterial({color:0x111111,roughness:0.35,metalness:0.2})),gg=new THREE.Group();
    const rim=new THREE.TorusGeometry(0.17,0.013,6,20);[X.eyeL,X.eyeR].forEach(E=>{const m=new THREE.Mesh(rim,gm);m.scale.y=0.78;m.position.copy(E).sub(X.head);m.position.z+=0.2;gg.add(m);
      const arm=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.012,0.9),gm);arm.position.copy(E).sub(X.head);arm.position.x+=Math.sign(E.x-X.head.x)*0.17;arm.position.z-=0.25;gg.add(arm);});
    const br=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.012,0.012),gm);br.position.copy(X.eyeL).add(X.eyeR).multiplyScalar(0.5).sub(X.head);br.position.z+=0.2;br.position.y+=0.03;gg.add(br);bn.head.add(gg);}
  /* rest-pose correction for motion capture: MakeHuman stands in an A-pose, the capture skeleton in a T-pose */
  const C={};['L','R'].forEach(s=>{const sg=side(s),T=new THREE.Vector3(sg,0,0);C['uarm'+s]=new THREE.Quaternion().setFromUnitVectors(_v1.copy(X['farm'+s]).sub(X['uarm'+s]).normalize(),T);
    C['farm'+s]=new THREE.Quaternion().setFromUnitVectors(_v1.copy(X['hand'+s]).sub(X['farm'+s]).normalize(),T);C['hand'+s]=C['farm'+s];});
  HMS.stats.built++;HMS.stats.ms=performance.now()-t0;
  return{g:g0,bones:bn,skel,N,X,C,meshes};}
const _c1=new THREE.Color(),_c2=new THREE.Color();

/* ---------- attach to a sim: line the procedural joints up with the real skeleton ---------- */
function hmAttach(s){const ud=s.userData,J=ud.J,o=ud.o;if(!J||ud.hm)return;
  const H=hmBuild(hmSpec(o,ud.seed||1));const X=H.X,S=HM_S;
  J.body.add(H.g);
  /* which real side each procedural limb uses (procedural "L" sits at -x) */
  const P_L=Math.sign(X.uarmL.x)<0?'L':'R',P_R=P_L==='L'?'R':'L';H.map={L:P_L,R:P_R};
  const v=(p,b)=>p.clone().sub(b||new THREE.Vector3()).multiplyScalar(S);
  const save=ud.hmSave={};const keep=(k,obj)=>{save[k]=obj.position.clone();};
  ['torso','hd','shL','shR','elL','elR','thL','thR','knL','knR'].forEach(k=>keep(k,J[k]));
  J.torso.position.copy(v(X.spine));
  const eyeMid=X.eyeL.clone().add(X.eyeR).multiplyScalar(0.5);
  J.hd.position.copy(v(eyeMid,X.spine)).sub(new THREE.Vector3(0,0.15,0.112));
  [['shL','elL',P_L],['shR','elR',P_R]].forEach(([sh,el,b])=>{J[sh].position.copy(v(X['uarm'+b],X.spine));J[el].position.copy(v(X['elbowN'+b],X['uarm'+b]));});
  [['thL','knL',P_L],['thR','knR',P_R]].forEach(([th,kn,b])=>{J[th].position.copy(v(X['thigh'+b]));J[kn].position.copy(v(X['shin'+b],X['thigh'+b]));});
  /* things held in the hands sit in the real hand: the forearm of this body decides how far below the elbow */
  {const L=(X.wristNL.distanceTo(X.elbowNL)+X.wristNR.distanceTo(X.elbowNR))/2*S;const hold=[[J.umb,-L-0.02],[J.phone,-L-0.035],[J.book,-L+0.01]];
    hold.forEach(([o,y],i)=>{if(!o)return;save['hold'+i]=o.position.clone();o.position.y=y;});ud.hmHold=hold;}
  /* the procedural parts that the real body replaces */
  const hide=[],robe=HM_ROBE(o),keepX=HMS.d&&HMS.d.px_ponytail01Ref?['puff','bun']:['puff','bun','ponytail'];J.body.traverse(m=>{if(!m.isMesh||m===J.blob)return;const t=m.userData.t,px=m.parent&&m.parent.userData.hairExtra;
    if(t==='b'||t==='jewel'||t==='headwear'||(t==='garment'&&!robe)||m.userData.hairCap||(px&&!keepX.includes(px))||(px&&o.hijab))hide.push(m);});
  H.hide=hide;ud.hm=H;hmShow(s,true);}
const HM_ROBE=o=>!!(o.cassock||o.habit);
function hmShow(s,on){const ud=s.userData,H=ud.hm;if(!H)return;H.g.visible=on;H.hide.forEach(m=>m.visible=false);ud.J.body.visible=on;ud.hmOn=on;}
function hmDetach(s){const ud=s.userData,H=ud.hm;if(!H)return;hmShow(s,false);H.hide.forEach(m=>m.visible=true);H.g.parent&&H.g.parent.remove(H.g);H.meshes.forEach(m=>m.geometry.dispose());if(H.skel.dispose)H.skel.dispose();
  const J=ud.J;for(const k in ud.hmSave){if(k.startsWith('hold')){const o=(ud.hmHold||[])[+k.slice(4)];if(o&&o[0])o[0].position.copy(ud.hmSave[k]);continue;}J[k].position.copy(ud.hmSave[k]);}ud.hm=null;ud.hmOn=false;J.body.visible=!window.__hmHide;}

/* ---------- pose transfer (called from pose()) ---------- */
const _q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),HQ=[...Array(96)].map(()=>new THREE.Quaternion()),HQI=new THREE.Quaternion(),HE=new THREE.Euler(),_hv=new THREE.Vector3(),_ax=new THREE.Vector3(1,0,0);
function hmPose(s,dt){const ud=s.userData,H=ud.hm;if(!H||!ud.hmOn)return;dt=dt||0.016;const J=ud.J,b=H.bones,N=H.N,W={};let qi=0;const q=()=>HQ[qi++].identity();
  const qT=q().setFromEuler(J.torso.rotation),qHl=q().setFromEuler(J.hd.rotation);
  /* look at someone: the head (and a little of the neck) turns toward ud.lookAt */
  let qL=null;{const want=ud.lookAt&&!/walk|run|lie|drive|carryhead/.test(ud.pk||'')?1:0;ud.lookW=(ud.lookW||0)+(want-(ud.lookW||0))*Math.min(1,dt*3);
    if(ud.lookW>0.01&&ud.lookAt){_hv.copy(ud.lookAt);s.worldToLocal(_hv);_hv.y-=1.62;const yaw=Math.atan2(_hv.x,_hv.z),pit=-Math.atan2(_hv.y,Math.hypot(_hv.x,_hv.z));
      if(Math.abs(yaw)<1.5){HE.set(Math.max(-0.35,Math.min(0.35,pit))*0.7*ud.lookW,Math.max(-0.95,Math.min(0.95,yaw))*0.8*ud.lookW,0,'YXZ');qL=q().setFromEuler(HE);}}}
  W.hips=HQI;W.spine=q().slerp(qT,0.45);W.chest=qT;W.neck=q().copy(qT).multiply(q().slerp(qHl,0.35));W.head=q().copy(qT).multiply(qHl);
  if(qL){W.neck=q().slerp(qL,0.35).multiply(W.neck);W.head=q().copy(qL).multiply(W.head);}
  /* breathing: the chest rises a little (stronger after running) */
  {const br=Math.sin((ud.pt||0)*(/run/.test(ud.pk||'')?4.5:1.7)+(ud.seed||0))*(/run/.test(ud.pk||'')?0.03:0.014);const qb=q().setFromAxisAngle(_ax,-br);W.chest=q().copy(W.chest).multiply(qb);W.neck=q().copy(W.neck).multiply(q().copy(qb).invert());}
  /* lips: the jaw moves while talking or laughing */
  {const k=ud.pk||'',tt=ud.pt||0;let open=0;if(/talk/.test(k)||ud.speaking)open=Math.max(0,0.06+0.09*Math.sin(tt*9.3)*Math.sin(tt*3.1+1));else if(k==='laugh')open=0.12+0.06*Math.abs(Math.sin(tt*6));else if(k==='yawn')open=0.32;
    ud.jawO=(ud.jawO||0)+(open-(ud.jawO||0))*Math.min(1,dt*14);W.jaw=ud.jawO>0.004?q().copy(W.head).multiply(q().setFromAxisAngle(_ax,ud.jawO)):W.head;}
  for(const ps of ['L','R']){const k=H.map[ps];const qS=q().copy(qT).multiply(q().setFromEuler(J['sh'+ps].rotation));const qE=q().copy(qS).multiply(q().setFromEuler(J['el'+ps].rotation));
    W['clav'+k]=q().copy(qT).multiply(q().slerp(q().setFromEuler(J['sh'+ps].rotation),0.12));
    W['uarm'+k]=q().copy(qS).multiply(N['uarm'+k]);W['farm'+k]=q().copy(qE).multiply(N['farm'+k]);W['hand'+k]=W['farm'+k];
    const qTh=q().setFromEuler(J['th'+ps].rotation);W['thigh'+k]=qTh;W['shin'+k]=q().copy(qTh).multiply(q().setFromEuler(J['kn'+ps].rotation));W['foot'+k]=W['shin'+k];}
  /* motion capture: real walk/run/idle cycles drive the body; poses that need the hands (phone, carrying,
     rifle, umbrella, books) keep their arms and only take the legs from the capture */
  const CL=HMS.clips,k=ud.pk||'';if(CL){let clip=null,legsOnly=false,fr=0;
    if(k==='walk'||k==='run'||k==='walkphone'||k==='carrywalk'||k==='carryheadwalk'||k==='riflewalk'){clip=CL[k==='run'?'run':'walk'];legsOnly=k!=='walk'&&k!=='run'||!!(J.umb&&J.umb.visible)||!!J.book;
      fr=(((ud.pt||0)/(Math.PI*2))%1+1)%1*clip.n;}
    else if(k==='stand'){clip=CL.idle;fr=((performance.now()/1000+(ud.seed||0)*3)*clip.fps)%clip.n;}
    if(clip){const f0=Math.floor(fr)%clip.n,f1=(f0+1)%clip.n,u=fr-Math.floor(fr);const B=clip.bones;
      const take=n=>{const a=B[n];if(!a)return null;const r=q();_q1.set(a[f0*4],a[f0*4+1],a[f0*4+2],a[f0*4+3]);_q2.set(a[f1*4],a[f1*4+1],a[f1*4+2],a[f1*4+3]);r.copy(_q1).slerp(_q2,u);return r;};
      const legs=['hips','thighL','shinL','footL','thighR','shinR','footR'],upper=['spine','chest','neck','head','clavL','uarmL','farmL','handL','clavR','uarmR','farmR','handR'];
      for(const n of legsOnly?legs:legs.concat(upper)){const d=take(n);if(!d)continue;W[n]=H.C[n]?d.multiply(H.C[n]):d;}
      if(!legsOnly&&qL){W.neck=q().slerp(qL,0.35).multiply(W.neck);W.head=q().copy(qL).multiply(W.head);}
      W.jaw=ud.jawO>0.004?q().copy(W.head).multiply(q().setFromAxisAngle(_ax,ud.jawO)):W.head;
      const hy=clip.hipsY;if(hy){const y=hy[f0]*(1-u)+hy[f1]*u;b.hips.position.y=H.X.hips.y*(1+y);}}
    else b.hips.position.y=H.X.hips.y;}
  /* smooth every change of pose (switching between capture and posed animation never snaps) */
  const S0=ud.hmQS||(ud.hmQS={}),kk=ud.snap?1:Math.min(1,dt*12);
  const D=HMS.d.h;D.bones.forEach(n=>{const w=W[n];if(!w)return;const p=S0[n]||(S0[n]=new THREE.Quaternion().copy(w));p.slerp(w,kk);W[n]=p;});
  D.bones.forEach((n,i)=>{const p=D.parents[i];const bq=b[n].quaternion;if(p<0){bq.copy(W[n]);return;}bq.copy(W[D.bones[p]]).invert().multiply(W[n]);});}

/* ---------- level of detail manager ---------- */
function hmInScene(s){let p=s.parent,n=0;while(p&&n<12){if(p===scene)return true;if(!p.visible)return false;p=p.parent;n++;}return false;}
function hmBudget(){return{n:999,r:typeof QH!=='undefined'&&QH?150:120};}
function hmManage(dt){if(HMS.failed)return;
  if(!HMS.ready){hmLoad();return;}
  HMS.tick-=dt;if(HMS.tick<=0){HMS.tick=0.25;const cp=camera.position,bud=hmBudget(),live=[];
    HMS.reg=HMS.reg.filter(s=>{const ud=s.userData;if(!s.parent){if(ud.hm)hmDetach(s);ud.hmOrphan=(ud.hmOrphan||0)+0.25;return ud.hmOrphan<120;}ud.hmOrphan=0;
      if(hmInScene(s)){s.getWorldPosition(_v1);const dc=_v1.distanceTo(cp),df=typeof cam!=='undefined'&&cam.tx!=null?Math.hypot(_v1.x-cam.tx,_v1.z-cam.tz):dc;const d=Math.min(dc,df+4);if(d<bud.r&&dc<80)live.push([d,s]);}
      else if(ud.hmOn)hmShow(s,false);if(!ud.hm&&ud.J)ud.J.body.visible=false;return true;});
    /* people near the player look at them now and then; the player looks at whoever they're talking to */
    if(typeof player!=='undefined'&&player&&player.parent){player.getWorldPosition(_v2);_v2.y+=2.6;for(const [d,s] of live){if(s===player)continue;const ud=s.userData;
        s.getWorldPosition(_v1);const dp=_v1.distanceTo(_v2);if(dp<7&&(ud.lookSeed==null?(ud.lookSeed=Math.random()):ud.lookSeed)<0.75){ud.lookAt=ud.lookAt||new THREE.Vector3();ud.lookAt.copy(_v2);}else ud.lookAt=null;}
      const pu=player.userData;let near=null,nd=4.5;if(typeof UI!=='undefined'&&UI.dlg){for(const [d,s] of live){if(s===player)continue;s.getWorldPosition(_v1);const q=_v1.distanceTo(player.position);if(q<nd){nd=q;near=s;}}}
      if(near){near.getWorldPosition(_v1);_v1.y+=2.6;pu.lookAt=pu.lookAt||new THREE.Vector3();pu.lookAt.copy(_v1);}else pu.lookAt=null;}
    live.sort((a,b)=>a[0]-b[0]);const want=new Set(live.slice(0,bud.n).map(x=>x[1]));
    for(const s of HMS.reg){const ud=s.userData;if(want.has(s)){if(ud.hm&&!ud.hmOn)hmShow(s,true);}else if(ud.hmOn)hmShow(s,false);}
    HMS.queue=live.filter(([d,s])=>!s.userData.hm).map(x=>x[1]);
    /* free memory: people who are not on screen keep their body up to a limit */
    const built=HMS.reg.filter(s=>s.userData.hm&&!s.userData.hmOn);if(built.length>40)built.slice(0,built.length-40).forEach(hmDetach);}
  /* build the nearest people first, about 12 ms of work per frame so the game keeps running */
  const t0=performance.now();let n=0;while(HMS.queue.length&&(n===0||performance.now()-t0<12)){const s=HMS.queue.shift();if(!s.userData.hm&&s.parent){try{hmAttach(s);s.userData.snap=true;}catch(e){console.warn('hm build failed',e);HMS.failed=true;hmFallback();return;}}n++;}}
/* runs on its own clock so it keeps working while the game is paused (dialogs, phone, cutscenes) */
{let last=performance.now();const loop=now=>{requestAnimationFrame(loop);const dt=Math.min(0.1,(now-last)/1000);last=now;try{hmManage(dt);}catch(e){console.warn('hm',e);}};requestAnimationFrame(loop);}
if(window.__QA)window.__HMS={HMS,hmBuild,hmSpec,hmAttach,hmDetach,hmShow,makeSim,pose,randomLook,scene,camera,outdoor,CAST:typeof CAST!=='undefined'?CAST:null};
