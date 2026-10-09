/* Builds vendor/hm/hm.bin (+ eye.png) from the MakeHuman 1.x data folder (CC0).
   usage: node tools/humans/build-humans.js <path to makehuman/data> <out dir> [makehuman system assets folder]
   The game (src/humans.js) turns this into rigged, realistic people at runtime:
   morph targets (African young male/female, weight, muscle, height, face shapes),
   a 20-bone game skeleton, clothes built from the MakeHuman "tights"/"skirt"/"hair" helpers
   (Catmull-Clark subdivided once), and fitted high-poly eyes. */
const fs=require('fs'),path=require('path');
const D=process.argv[2],OUT=process.argv[3];if(!D||!OUT){console.log('usage: build-humans.js <makehuman/data> <outdir>');process.exit(1);}
fs.mkdirSync(OUT,{recursive:true});

/* ---------- base mesh ---------- */
function parseObj(file){const V=[],VT=[],F=[];let g='';
  for(const l of fs.readFileSync(file,'utf8').split('\n')){
    if(l.startsWith('v '))V.push(l.trim().split(/\s+/).slice(1,4).map(Number));
    else if(l.startsWith('vt '))VT.push(l.trim().split(/\s+/).slice(1,3).map(Number));
    else if(l.startsWith('g '))g=l.slice(2).trim();
    else if(l.startsWith('f ')){const p=l.trim().split(/\s+/).slice(1);F.push({g,v:p.map(t=>+t.split('/')[0]-1),t:p.map(t=>+(t.split('/')[1]||0)-1)});}}
  return{V,VT,F};}
const base=parseObj(path.join(D,'3dobjs/base.obj'));const V=base.V,NV=V.length;
const facesOf=g=>base.F.filter(f=>f.g===g).map(f=>f.v);
const bodyF=facesOf('body'),tightsF=facesOf('helper-tights'),skirtF=facesOf('helper-skirt'),hairF=facesOf('helper-hair');
console.log('verts',NV,'body',bodyF.length,'tights',tightsF.length,'skirt',skirtF.length,'hair',hairF.length);

/* ---------- skeleton ---------- */
const SK=JSON.parse(fs.readFileSync(path.join(D,'rigs/default.mhskel'),'utf8'));
const MW=JSON.parse(fs.readFileSync(path.join(D,'rigs/default_weights.mhw'),'utf8')).weights;
const KB=['hips','spine','chest','neck','head','jaw','clavL','uarmL','farmL','handL','clavR','uarmR','farmR','handR','thighL','shinL','footL','thighR','shinR','footR'];
const PAR={hips:null,spine:'hips',chest:'spine',neck:'chest',head:'neck',jaw:'head',clavL:'chest',uarmL:'clavL',farmL:'uarmL',handL:'farmL',clavR:'chest',uarmR:'clavR',farmR:'uarmR',handR:'farmR',thighL:'hips',shinL:'thighL',footL:'shinL',thighR:'hips',shinR:'thighR',footR:'shinR'};
const MAP={root:'hips',spine05:'hips',spine04:'spine',spine03:'spine',spine02:'chest',spine01:'chest',neck01:'neck',neck02:'neck',neck03:'neck',head:'head',jaw:'jaw'};
for(const s of ['L','R'])Object.assign(MAP,{['clavicle.'+s]:'clav'+s,['shoulder01.'+s]:'uarm'+s,['upperarm01.'+s]:'uarm'+s,['upperarm02.'+s]:'uarm'+s,['lowerarm01.'+s]:'farm'+s,['lowerarm02.'+s]:'farm'+s,['wrist.'+s]:'hand'+s,['pelvis.'+s]:'hips',['upperleg01.'+s]:'thigh'+s,['upperleg02.'+s]:'thigh'+s,['lowerleg01.'+s]:'shin'+s,['lowerleg02.'+s]:'shin'+s,['foot.'+s]:'foot'+s,['breast.'+s]:'chest'});
function kept(b){let c=b;while(c&&!MAP[c])c=SK.bones[c].parent;return MAP[c]||'hips';}
const PIV={hips:'root____head',spine:'spine04____head',chest:'spine02____head',neck:'neck01____head',head:'head____head',jaw:'jaw____head'};
for(const s of ['L','R'])Object.assign(PIV,{['clav'+s]:'clavicle.'+s+'____head',['uarm'+s]:'upperarm01.'+s+'____head',['farm'+s]:'lowerarm01.'+s+'____head',['hand'+s]:'wrist.'+s+'____head',['thigh'+s]:'upperleg01.'+s+'____head',['shin'+s]:'lowerleg01.'+s+'____head',['foot'+s]:'foot.'+s+'____head'});
const EXTRA={handTipL:'finger3-3.L____tail',handTipR:'finger3-3.R____tail',toeL:'toe3-1.L____head',toeR:'toe3-1.R____head',eyeL:'eye.L____head',eyeR:'eye.R____head',headTop:'head____tail'};
const JN=[...KB.map(b=>PIV[b]),...Object.values(EXTRA)];
const jointPos=(name,P)=>{const vs=SK.joints[name];const p=[0,0,0];vs.forEach(i=>{p[0]+=P[i][0];p[1]+=P[i][1];p[2]+=P[i][2];});return p.map(x=>x/vs.length);};
const BJ={};KB.forEach(b=>BJ[b]=jointPos(PIV[b],V));for(const k in EXTRA)BJ[k]=jointPos(EXTRA[k],V);

/* per-vertex kept-bone weights (dense small maps) */
const VW=Array.from({length:NV},()=>({}));
for(const b in MW){const k=kept(b);for(const [i,w] of MW[b]){VW[i][k]=(VW[i][k]||0)+w;}}
const groupW=(re)=>{const a=new Float32Array(NV);for(const b in MW)if(re.test(b))for(const [i,w] of MW[b])a[i]+=w;return a;};
const LIPW=groupW(/^oris/),BROWW=groupW(/^(oculi|orbicularis|temporalis)/);

/* ---------- Catmull-Clark (one level) as stencils over base vertex ids ---------- */
function subdivide(quads){
  const key=(a,b)=>a<b?a+'_'+b:b+'_'+a;const edges=new Map();const vf=new Map(),ve=new Map();
  quads.forEach((q,fi)=>{for(let i=0;i<4;i++){const a=q[i],b=q[(i+1)%4],k=key(a,b);if(!edges.has(k))edges.set(k,{a,b,f:[]});edges.get(k).f.push(fi);
    (vf.get(a)||vf.set(a,[]).get(a)).push(fi);}});
  for(const [k,e] of edges){(ve.get(e.a)||ve.set(e.a,[]).get(e.a)).push(e);(ve.get(e.b)||ve.set(e.b,[]).get(e.b)).push(e);}
  const add=(m,i,w)=>m.set(i,(m.get(i)||0)+w);const scale=(m,s)=>{const r=new Map();for(const [i,w] of m)r.set(i,w*s);return r;};const sum=(...ms)=>{const r=new Map();ms.forEach(m=>{for(const [i,w] of m)add(r,i,w);});return r;};
  const fp=quads.map(q=>{const m=new Map();q.forEach(i=>add(m,i,0.25));return m;});
  const ep=new Map();for(const [k,e] of edges){if(e.f.length===2)ep.set(k,sum(scale(new Map([[e.a,1],[e.b,1]]),0.25),scale(fp[e.f[0]],0.25),scale(fp[e.f[1]],0.25)));else ep.set(k,new Map([[e.a,0.5],[e.b,0.5]]));}
  const vp=new Map();
  for(const [v,es] of ve){const bnd=es.filter(e=>e.f.length<2);
    if(bnd.length>=2){const m=new Map([[v,0.75]]);bnd.slice(0,2).forEach(e=>add(m,e.a===v?e.b:e.a,0.125));vp.set(v,m);}
    else{const n=es.length;const Q=scale(sum(...vf.get(v).map(f=>fp[f])),1/vf.get(v).length);const R=scale(sum(...es.map(e=>new Map([[e.a,0.5],[e.b,0.5]]))),1/n);
      vp.set(v,sum(scale(Q,1/n),scale(R,2/n),new Map([[v,(n-3)/n]])));}}
  const rows=[],ids=new Map();const id=(k,m)=>{if(!ids.has(k)){ids.set(k,rows.length);rows.push(m);}return ids.get(k);};
  const out=[];quads.forEach((q,fi)=>{const f=id('f'+fi,fp[fi]);const vi=q.map(v=>id('v'+v,vp.get(v)));const ei=q.map((a,i)=>{const b=q[(i+1)%4];return id('e'+key(a,b),ep.get(key(a,b)));});
    for(let i=0;i<4;i++)out.push([vi[i],ei[i],f,ei[(i+3)%4]]);});
  return{rows:rows.map(m=>[...m].filter(([,w])=>Math.abs(w)>1e-6)),quads:out};}
const evalRow=(row,P)=>{const p=[0,0,0];for(const [i,w] of row){p[0]+=P[i][0]*w;p[1]+=P[i][1]*w;p[2]+=P[i][2]*w;}return p;};

/* ---------- regions: which part of the body a vertex belongs to (for clothes / hiding skin) ---------- */
const REG={head:0,neck:1,torsoU:2,torsoL:3,uarm:4,farm:5,hand:6,thigh:7,shin:8,foot:9};
const waistY=jointPos('spine04____head',V)[1];
const LIMB={uarmL:['uarmL','farmL'],uarmR:['uarmR','farmR'],farmL:['farmL','handL'],farmR:['farmR','handR'],handL:['handL','handTipL'],handR:['handR','handTipR'],thighL:['thighL','shinL'],thighR:['thighR','shinR'],shinL:['shinL','footL'],shinR:['shinR','footR'],footL:['footL','toeL'],footR:['footR','toeR']};
function regionOf(w,p){let best='hips',bw=-1;for(const k in w)if(w[k]>bw){bw=w[k];best=k;}
  let r,t=0;const b=best.replace(/[LR]$/,'');
  if(b==='head'||b==='jaw')r=REG.head;else if(b==='neck')r=REG.neck;else if(['hips','spine','chest','clav'].includes(b))r=p[1]>waistY?REG.torsoU:REG.torsoL;else r=REG[b];
  if(LIMB[best]){const [h,tl]=LIMB[best].map(k=>BJ[k]);const d=[tl[0]-h[0],tl[1]-h[1],tl[2]-h[2]];const L2=d[0]*d[0]+d[1]*d[1]+d[2]*d[2];t=((p[0]-h[0])*d[0]+(p[1]-h[1])*d[1]+(p[2]-h[2])*d[2])/L2;}
  return[r,Math.max(-1,Math.min(2,t))];}
function topW(w){const e=Object.entries(w).sort((a,b)=>b[1]-a[1]).slice(0,4);const s=e.reduce((a,x)=>a+x[1],0)||1;const j=[0,0,0,0],q=[0,0,0,0];let acc=0;
  e.forEach(([k,v],i)=>{j[i]=KB.indexOf(k);q[i]=Math.round(v/s*255);acc+=q[i];});q[0]+=255-acc;return{j,q};}

/* ---------- binary writer ---------- */
const chunks=[],hdr={};let off=0;
function put(name,ta){const b=Buffer.from(ta.buffer,ta.byteOffset,ta.byteLength);const pad=(4-(b.length%4))%4;hdr[name]=[ta.constructor.name,off,ta.length];chunks.push(b);if(pad)chunks.push(Buffer.alloc(pad));off+=b.length+pad;}

/* base vertices that are needed (body + helpers + joints) are simply all of them */
put('pos',Float32Array.from(V.flat()));

/* body */
const NB=13380;
{const idx=[];bodyF.forEach(q=>{idx.push(q[0],q[1],q[2],q[0],q[2],q[3]);});put('bodyIdx',Uint16Array.from(idx));
 const sj=new Uint8Array(NB*4),sw=new Uint8Array(NB*4),rg=new Uint8Array(NB),rt=new Int8Array(NB),paint=new Uint8Array(NB*2);
 for(let i=0;i<NB;i++){const {j,q}=topW(VW[i]);sj.set(j,i*4);sw.set(q,i*4);const [r,t]=regionOf(VW[i],V[i]);rg[i]=r;rt[i]=Math.round(t*60);paint[i*2]=Math.round(Math.min(1,LIPW[i])*255);paint[i*2+1]=Math.round(Math.min(1,BROWW[i])*255);}
 put('bodyJ',sj);put('bodyW',sw);put('bodyReg',rg);put('bodyT',rt);put('bodyPaint',paint);}

/* helpers: subdivided clothes */
function helper(name,quads,weightOverride){const S=subdivide(quads);const n=S.rows.length;
  const offs=new Uint32Array(n+1),ii=[],ww=[];S.rows.forEach((r,k)=>{offs[k]=ii.length;r.forEach(([i,w])=>{ii.push(i);ww.push(w);});});offs[n]=ii.length;
  const idx=[];S.quads.forEach(q=>idx.push(q[0],q[1],q[2],q[0],q[2],q[3]));
  const sj=new Uint8Array(n*4),sw=new Uint8Array(n*4),rg=new Uint8Array(n),rt=new Int8Array(n);
  S.rows.forEach((r,k)=>{let w={};if(weightOverride)w=weightOverride;else r.forEach(([i,wt])=>{for(const b in VW[i])w[b]=(w[b]||0)+VW[i][b]*wt;});for(const b in w)if(w[b]<0)delete w[b];
    const {j,q}=topW(w);sj.set(j,k*4);sw.set(q,k*4);const [rr,t]=regionOf(w,evalRow(r,V));rg[k]=rr;rt[k]=Math.round(t*60);});
  /* nearest body vertex for every shell vertex (lets the game keep clothes outside the skin) */
  const near=new Uint16Array(n);{const G=new Map(),cs=0.6,key=(x,y,z)=>Math.floor(x/cs)+','+Math.floor(y/cs)+','+Math.floor(z/cs);for(let i=0;i<13380;i++){const k=key(...V[i]);(G.get(k)||G.set(k,[]).get(k)).push(i);}
    S.rows.forEach((r,k)=>{const p=evalRow(r,V);let best=0,bd=1e9;for(let rad=1;rad<6&&bd===1e9;rad++){const cx=Math.floor(p[0]/cs),cy=Math.floor(p[1]/cs),cz=Math.floor(p[2]/cs);
      for(let a=-rad;a<=rad;a++)for(let b=-rad;b<=rad;b++)for(let c=-rad;c<=rad;c++){const L=G.get((cx+a)+','+(cy+b)+','+(cz+c));if(!L)continue;for(const i of L){const d=(V[i][0]-p[0])**2+(V[i][1]-p[1])**2+(V[i][2]-p[2])**2;if(d<bd){bd=d;best=i;}}}}near[k]=best;});}
  put(name+'Near',near);
  put(name+'Off',offs);put(name+'Src',Uint16Array.from(ii));put(name+'Wt',Float32Array.from(ww));put(name+'Idx',Uint16Array.from(idx));put(name+'J',sj);put(name+'W',sw);put(name+'Reg',rg);put(name+'T',rt);
  console.log(name,'subdivided verts',n,'tris',idx.length/3,'stencil',ii.length);}
helper('tights',tightsF);helper('skirt',skirtF);helper('hair',hairF,{head:1});

/* joints: vertex lists for pivots */
{const jo=new Uint32Array(JN.length+1),ji=[];JN.forEach((n,k)=>{jo[k]=ji.length;ji.push(...SK.joints[n]);});jo[JN.length]=ji.length;put('jointOff',jo);put('jointIdx',Uint16Array.from(ji));}

/* eyes (high-poly proxy, fitted with mhclo refs) */
{const E=parseObj(path.join(D,'eyes/high-poly/high-poly.obj'));const clo=fs.readFileSync(path.join(D,'eyes/high-poly/high-poly.mhclo'),'utf8').split('\n');
 const sc={};let refs=[],inV=false;for(const l of clo){const p=l.trim().split(/\s+/);if(/^[xyz]_scale/.test(l))sc[p[0][0]]=[+p[1],+p[2],+p[3]];
   else if(l.startsWith('verts'))inV=true;else if(inV&&p.length>=9&&/^\d/.test(p[0]))refs.push(p.map(Number));else if(inV&&p.length===1&&/^\d+$/.test(p[0]))refs.push([+p[0],+p[0],+p[0],1,0,0,0,0,0]);}
 if(refs.length!==E.V.length)throw new Error('eye refs '+refs.length+' vs '+E.V.length);
 const map=new Map(),ref=[],uv=[],idx=[];
 E.F.forEach(f=>{const vv=f.v.map((v,i)=>{const k=v+'/'+f.t[i];if(!map.has(k)){map.set(k,ref.length/9);ref.push(...refs[v]);uv.push(E.VT[f.t[i]][0],E.VT[f.t[i]][1]);}return map.get(k);});
   for(let i=1;i<vv.length-1;i++)idx.push(vv[0],vv[i],vv[i+1]);});
 put('eyeRef',Float32Array.from(ref));put('eyeUV',Float32Array.from(uv));put('eyeIdx',Uint16Array.from(idx));hdr.eyeScale=sc;}

/* body UVs: MakeHuman's UV layout has seams, so vertices are split per (vertex, uv) pair.
   bodyVid maps each split vertex back to its base vertex (all other per-vertex data stays on base ids). */
{const map=new Map(),vid=[],uv=[],idx=[];
 base.F.filter(f=>f.g==='body').forEach(f=>{const vv=f.v.map((v,i)=>{const k=v+'/'+f.t[i];if(!map.has(k)){map.set(k,vid.length);vid.push(v);uv.push(base.VT[f.t[i]][0],base.VT[f.t[i]][1]);}return map.get(k);});
   idx.push(vv[0],vv[1],vv[2],vv[0],vv[2],vv[3]);});
 put('bodyVid',Uint16Array.from(vid));put('bodyUV',Float32Array.from(uv));put('bodyIdxS',Uint16Array.from(idx));console.log('body split verts',vid.length);}

/* proxies from the MakeHuman system assets (CC0): hair styles, eyebrows, eyelashes.
   Fitted to the morphed body at runtime like the eyes; skin weights interpolated from the reference vertices. */
hdr.proxies={};
function proxy(name,dir,file,headOnly){const objF=path.join(dir,file+'.obj'),cloF=path.join(dir,file+'.mhclo');if(!fs.existsSync(objF)||!fs.existsSync(cloF)){console.log('proxy missing',name,dir);return;}
  const E=parseObj(objF);const clo=fs.readFileSync(cloF,'utf8').split('\n');const sc={};const refs=[];let inV=false;
  for(const l of clo){const p=l.trim().split(/\s+/);if(/^[xyz]_scale/.test(l))sc[p[0][0]]=[+p[1],+p[2],+p[3]];
    else if(/^verts/.test(l))inV=true;else if(inV&&p.length>=9&&/^\d/.test(p[0]))refs.push(p.slice(0,9).map(Number));else if(inV&&p.length===1&&/^\d+$/.test(p[0]))refs.push([+p[0],+p[0],+p[0],1,0,0,0,0,0]);else if(/^delete_verts/.test(l))inV=false;}
  if(refs.length!==E.V.length)throw new Error(name+' refs '+refs.length+' vs '+E.V.length);
  const map=new Map(),ref=[],uv=[],idx=[],J=[],W=[];
  E.F.forEach(f=>{const vv=f.v.map((v,i)=>{const k=v+'/'+f.t[i];if(!map.has(k)){map.set(k,ref.length/9);const r=refs[v];ref.push(...r);const t=E.VT[f.t[i]]||[0,0];uv.push(t[0],t[1]);
      let w={};if(headOnly)w={head:1};else for(let a=0;a<3;a++){const bw=VW[r[a]];for(const b in bw)w[b]=(w[b]||0)+bw[b]*r[3+a];}if(!Object.keys(w).length)w={head:1};const tw=topW(w);J.push(...tw.j);W.push(...tw.q);}return map.get(k);});
    for(let i=1;i<vv.length-1;i++)idx.push(vv[0],vv[i],vv[i+1]);});
  put(name+'Ref',Float32Array.from(ref));put(name+'UV',Float32Array.from(uv));put(name+'Idx',Uint16Array.from(idx));put(name+'J',Uint8Array.from(J));put(name+'W',Uint8Array.from(W));
  hdr.proxies[name]=sc;console.log('proxy',name,ref.length/9,'verts',idx.length/3,'tris');}
{const A=process.argv[4];if(A){for(const h of ['afro01','braid01','ponytail01','bob01'])proxy('px_'+h,path.join(A,'hair',h),h,true);
  proxy('px_brow',path.join(A,'eyebrows','eyebrow001'),'eyebrow001');proxy('px_lash',path.join(A,'eyelashes','eyelashes01'),'eyelashes01');}}

/* morph targets (sparse, int16 at 1/4000 dm) */
const T={am:'macrodetails/african-male-young',af:'macrodetails/african-female-young',
  um_w0:'macrodetails/universal-male-young-averagemuscle-minweight',um_w1:'macrodetails/universal-male-young-averagemuscle-maxweight',um_m0:'macrodetails/universal-male-young-minmuscle-averageweight',um_m1:'macrodetails/universal-male-young-maxmuscle-averageweight',
  uf_w0:'macrodetails/universal-female-young-averagemuscle-minweight',uf_w1:'macrodetails/universal-female-young-averagemuscle-maxweight',uf_m0:'macrodetails/universal-female-young-minmuscle-averageweight',uf_m1:'macrodetails/universal-female-young-maxmuscle-averageweight',
  mh0:'macrodetails/height/male-young-averagemuscle-averageweight-minheight',mh1:'macrodetails/height/male-young-averagemuscle-averageweight-maxheight',fh0:'macrodetails/height/female-young-averagemuscle-averageweight-minheight',fh1:'macrodetails/height/female-young-averagemuscle-averageweight-maxheight',
  mp:'macrodetails/proportions/male-young-averagemuscle-averageweight-idealproportions',fp:'macrodetails/proportions/female-young-averagemuscle-averageweight-idealproportions',
  fb0:'breast/female-young-averagemuscle-averageweight-mincup-averagefirmness',fb1:'breast/female-young-averagemuscle-averageweight-maxcup-averagefirmness',
  belly:'stomach/stomach-pregnant-incr',
  hoval:'head/head-oval',hround:'head/head-round',hsquare:'head/head-square',hfat1:'head/head-fat-incr',hfat0:'head/head-fat-decr',
  nflare:'nose/nose-flaring-incr',nwide:'nose/nose-scale-horiz-incr',nnarrow:'nose/nose-scale-horiz-decr',npw:'nose/nose-point-width-incr',
  lipl:'mouth/mouth-lowerlip-volume-incr',lipu:'mouth/mouth-upperlip-volume-incr',mwide:'mouth/mouth-scale-horiz-incr',mnarrow:'mouth/mouth-scale-horiz-decr',
  chinw1:'chin/chin-width-incr',chinw0:'chin/chin-width-decr',chinp1:'chin/chin-prominent-incr',chinp0:'chin/chin-prominent-decr',
  cheekL:'cheek/l-cheek-volume-incr',cheekR:'cheek/r-cheek-volume-incr',eyeL1:'eyes/l-eye-scale-incr',eyeR1:'eyes/r-eye-scale-incr',eyeL0:'eyes/l-eye-scale-decr',eyeR0:'eyes/r-eye-scale-decr'};
hdr.targets={};
for(const k in T){const f=path.join(D,'targets',T[k]+'.target');if(!fs.existsSync(f)){console.log('missing',f);continue;}
  const ii=[],dd=[];for(const l of fs.readFileSync(f,'utf8').split('\n')){if(!l||l[0]==='#')continue;const p=l.trim().split(/\s+/).map(Number);if(p.length<4)continue;ii.push(p[0]);dd.push(...p.slice(1,4).map(x=>Math.max(-32767,Math.min(32767,Math.round(x*4000)))));}
  put('t_'+k+'_i',Uint16Array.from(ii));put('t_'+k+'_d',Int16Array.from(dd));hdr.targets[k]=ii.length;}

hdr.bones=KB;hdr.parents=KB.map(b=>PAR[b]?KB.indexOf(PAR[b]):-1);hdr.extra=Object.keys(EXTRA);hdr.nBody=NB;hdr.waistY=waistY;hdr.reg=REG;
hdr.license='Base mesh, targets, skeleton, weights and eyes: MakeHuman (makehumancommunity.org), released CC0.';
const js=Buffer.from(JSON.stringify(hdr));const jpad=(4-((js.length)%4))%4;
const head=Buffer.alloc(8);head.writeUInt32LE(0x314d4856,0);head.writeUInt32LE(js.length+jpad,4);
fs.writeFileSync(path.join(OUT,'hm.bin'),Buffer.concat([head,js,Buffer.alloc(jpad,32),...chunks]));
console.log('wrote',path.join(OUT,'hm.bin'),(8+js.length+jpad+off)/1e6,'MB');
