/* ================= ARCHITECTURE DETAIL =================
   Buildings stay simple boxes for collisions, but get real depth on top: framed, recessed windows with
   sills, mullions and sun hoods, floor bands and corner pilasters, open corridors with balustrades and
   columns on the hostels, door steps and canopies, stained glass on the chapel, and a stucco wall
   material with weathering at the base. Everything repeated is instanced (a few draw calls in total). */
let STUCCO=null;
function stuccoTex(){if(STUCCO)return STUCCO;STUCCO=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#ffffff';g.fillRect(0,0,w,h);
    for(let i=0;i<5200;i++){const v=200+Math.floor(Math.random()*55);g.fillStyle='rgba('+v+','+v+','+(v-6)+','+(0.08+Math.random()*0.18)+')';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2.5,1+Math.random()*2.5);}
    for(let i=0;i<26;i++){const x=Math.random()*w,l=10+Math.random()*60;const gr=g.createLinearGradient(0,0,0,l);gr.addColorStop(0,'rgba(120,110,95,0.16)');gr.addColorStop(1,'rgba(120,110,95,0)');g.fillStyle=gr;g.fillRect(x,0,1.5+Math.random()*2,l);}
    const b=g.createLinearGradient(0,h*0.78,0,h);b.addColorStop(0,'rgba(110,85,60,0)');b.addColorStop(1,'rgba(110,85,60,0.32)');g.fillStyle=b;g.fillRect(0,h*0.78,w,h*0.22);});
  return STUCCO;}
const WALLM={};function wallMat(c){return WALLM[c]||(WALLM[c]=new THREE.MeshStandardMaterial({color:c,map:stuccoTex(),roughness:0.93,metalness:0}));}
const ARCH={win:[],box:[]};   // win: windows to build; box: [x,y,z,sx,sy,sz,color] trim pieces
const ACADEMIC=['lecture','faculty','library','admin','lodge2','girls','boys'];
const HOSTELS=['boys','girls','lodge1','lodge2','lodge3'];
function archBox(x,y,z,sx,sy,sz,c){ARCH.box.push([x,y,z,sx,sy,sz,c]);}
function shade(c,f){const col=new THREE.Color(c);col.multiplyScalar(f);return col.getHex();}
/* front face of a building = the side its door is on */
function archFront(L){const dx=L.door.x-L.x,dz=L.door.z-L.z;return Math.abs(dz)>Math.abs(dx)?{ax:'z',sg:Math.sign(dz)||1}:{ax:'x',sg:Math.sign(dx)||1};}
function archDetail(L,g){if(!L.h||L.kind==='gate')return;
  const floors=Math.max(1,Math.floor(L.h/3.4)),F=archFront(L),trim=shade(L.wall,1.08),dark=shade(L.wall,0.82),hostel=HOSTELS.includes(L.id)&&floors>1;
  const faces=[['z',1,L.w],['z',-1,L.w],['x',1,L.d],['x',-1,L.d]];
  /* windows (frames etc. are built later, all instanced) */
  const chapel=L.kind==='chapel';
  faces.forEach(([ax,sg,len])=>{const n=Math.floor(len/(chapel?4.2:3.6));const pos=ax==='z'?L.z+sg*L.d/2:L.x+sg*L.w/2;
    for(let f=0;f<floors;f++)for(let k=0;k<n;k++){const off=-len/2+(k+0.5)*len/n,y=chapel?4.2:1.9+f*3.3;if(chapel&&f>0)continue;
      const wx=ax==='z'?L.x+off:pos,wz=ax==='z'?pos:L.z+off;
      if(f===0&&Math.hypot(wx-L.door.x,wz-L.door.z)<3.4)continue;
      if(chapel&&ax==='z'&&sg>0)continue;
      ARCH.win.push({x:wx,y,z:wz,ax,sg,w:chapel?1.1:1.3,h:chapel?3.4:1.5,L,hood:ACADEMIC.includes(L.id)&&!(hostel&&ax===F.ax&&sg===F.sg),chapel,lit:(hash(L.id+f+'_'+k+ax+sg)<0.75)});}});
  /* plinth already exists; floor bands and corner pilasters */
  for(let f=1;f<floors;f++){const y=f*3.3+0.02;archBox(L.x,y,L.z+L.d/2+0.06,L.w+0.3,0.2,0.14,trim);archBox(L.x,y,L.z-L.d/2-0.06,L.w+0.3,0.2,0.14,trim);archBox(L.x+L.w/2+0.06,y,L.z,0.14,0.2,L.d+0.3,trim);archBox(L.x-L.w/2-0.06,y,L.z,0.14,0.2,L.d+0.3,trim);}
  if(L.h>=5&&!chapel)[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>archBox(L.x+a*(L.w/2-0.15),(L.h-0.3)/2,L.z+b*(L.d/2-0.15),0.6,L.h-0.3,0.6,trim));
  /* cornice under the roof line */
  if(L.h>=4&&!chapel){const y=L.h-0.12;archBox(L.x,y,L.z+L.d/2+0.08,L.w+0.4,0.24,0.18,dark);archBox(L.x,y,L.z-L.d/2-0.08,L.w+0.4,0.24,0.18,dark);archBox(L.x+L.w/2+0.08,y,L.z,0.18,0.24,L.d+0.4,dark);archBox(L.x-L.w/2-0.08,y,L.z,0.18,0.24,L.d+0.4,dark);}
  /* hostels: open corridors with balustrades and columns on the door side */
  if(hostel){const len=F.ax==='z'?L.w:L.d,depth=1.8,wall=F.ax==='z'?L.z+F.sg*L.d/2:L.x+F.sg*L.w/2,out=wall+F.sg*depth;
    const P=(along,y,o,sa,sy,so,c)=>F.ax==='z'?archBox(along,y,o,sa,sy,so,c):archBox(o,y,along,so,sy,sa,c);const c0=F.ax==='z'?L.x:L.z;
    for(let f=1;f<=floors;f++){const y=f*3.3;const top=f===floors;const yy=top?L.h:y;
      P(c0,yy,wall+F.sg*depth/2,len+0.4,0.22,depth,top?dark:trim);
      if(!top){P(c0,y+0.6,out-F.sg*0.06,len+0.4,1.0,0.14,L.wall);P(c0,y+1.14,out-F.sg*0.06,len+0.5,0.08,0.24,trim);
        /* room doors along the corridor */
        const nd=Math.floor(len/4.4);for(let k=0;k<nd;k++){const a=c0-len/2+(k+0.5)*len/nd+1.1;P(a,y+1.1,wall+F.sg*0.05,1.0,2.1,0.1,0x6b4a30);}}}
    const nc=Math.max(2,Math.round(len/5.6));for(let k=0;k<=nc;k++){const a=c0-len/2+k*len/nc;const dx=F.ax==='z'?a:out-F.sg*0.25,dz=F.ax==='z'?out-F.sg*0.25:a;if(Math.hypot(dx-L.door.x,dz-L.door.z)<2.2)continue;
      P(a,L.h/2,out-F.sg*0.25,0.36,L.h,0.36,trim);obsC(dx,dz,0.3);}
    /* stair block at one end */
    const sx=c0+len/2-1.2;P(sx,L.h/2+0.2,wall+F.sg*depth/2,0.2,L.h+0.4,depth,trim);}
  /* door: step, frame trim and a small canopy where there is no awning or corridor */
  {const fz=F.ax==='z',pos=fz?L.z+F.sg*(L.d/2+0.7):L.x+F.sg*(L.w/2+0.7);const dx=fz?L.door.x:pos,dz=fz?pos:L.door.z;
    archBox(dx,0.06,dz,fz?3.6:1.4,0.12,fz?1.4:3.6,0xbdb6a6);
    const wall=fz?L.z+F.sg*L.d/2:L.x+F.sg*L.w/2;const fx=fz?L.door.x:wall+F.sg*0.12,fzz=fz?wall+F.sg*0.12:L.door.z;
    archBox(fz?fx-1.4:fx,1.7,fz?fzz:fzz-1.4,fz?0.18:0.16,3.5,fz?0.16:0.18,trim);archBox(fz?fx+1.4:fx,1.7,fz?fzz:fzz+1.4,fz?0.18:0.16,3.5,fz?0.16:0.18,trim);archBox(fx,3.42,fzz,fz?3.0:0.16,0.18,fz?0.16:3.0,trim);
    const hasAwning=['vcafe','macd','second','first','ggs','kiosk','barber','mart','centre','clinic','suya','mamaput','faculty'].includes(L.id);
    if(!hasAwning&&!hostel&&L.h>=5)archBox(fz?L.door.x:wall+F.sg*0.8,3.75,fz?wall+F.sg*0.8:L.door.z,fz?4:1.6,0.16,fz?1.6:4,dark);}}
/* glass, frames, sills, mullions, hoods and trim: all instanced */
const glassDay=new THREE.MeshStandardMaterial({color:0x3e5862,roughness:0.12,metalness:0.1,emissive:0xffc66e,emissiveIntensity:0});
const glassOff=new THREE.MeshStandardMaterial({color:0x2c3a3f,roughness:0.18,metalness:0.1});
envMat(glassDay,0.8);envMat(glassOff,0.8);
function archBuild(){const m4=new THREE.Matrix4(),col=new THREE.Color();
  const frames=[],sills=[],hoods=[],lit=[],off=[],stained=[];
  ARCH.win.forEach(W=>{const z=W.ax==='z',n=W.sg,wx=W.x,wz=W.z,w=W.w,h=W.h,y=W.y;
    const at=(along,out,yy,sa,sy,so)=>z?[wx+along,yy,wz+n*out,sa,sy,so]:[wx+n*out,yy,wz+along,so,sy,sa];
    (W.chapel?stained:W.lit?lit:off).push(at(0,0.02,y,w,h,0.04));
    const fc=W.L.id==='boys'||W.L.id==='lodge3'?0x5a3f2a:0xf1ede4;
    frames.push(at(0,0.08,y+h/2+0.05,w+0.2,0.1,0.16).concat(fc),at(0,0.08,y-h/2-0.05,w+0.2,0.1,0.16).concat(fc),at(-w/2-0.05,0.08,y,0.1,h+0.2,0.16).concat(fc),at(w/2+0.05,0.08,y,0.1,h+0.2,0.16).concat(fc));
    if(!W.chapel){frames.push(at(0,0.06,y,0.06,h,0.1).concat(fc),at(0,0.06,y+h*0.2,w,0.05,0.1).concat(fc));}
    else frames.push(at(0,0.06,y,0.06,h,0.1).concat(0x3a2a1e),at(0,0.06,y+h*0.15,w,0.06,0.1).concat(0x3a2a1e),at(0,0.06,y-h*0.2,w,0.06,0.1).concat(0x3a2a1e));
    sills.push(at(0,0.16,y-h/2-0.16,w+0.5,0.09,0.32));
    if(W.hood)hoods.push(at(0,0.34,y+h/2+0.42,w+0.9,0.1,0.68));});
  const inst=(list,matl,colorIdx)=>{if(!list.length)return null;const im=new THREE.InstancedMesh(G.box,matl,list.length);list.forEach((b,i)=>{m4.makeScale(b[3],b[4],b[5]);m4.setPosition(b[0],b[1],b[2]);im.setMatrixAt(i,m4);if(colorIdx!=null)im.setColorAt(i,col.setHex(b[colorIdx]));});
    if(im.instanceColor)im.instanceColor.needsUpdate=true;im.castShadow=false;im.receiveShadow=true;outdoor.add(im);return im;};
  inst(lit,glassDay);inst(off,glassOff);
  {const sm=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.3,emissive:0x553311,emissiveIntensity:0.15});const C=[0x2b5fa8,0xb8322a,0xd9a520,0x2f7a4a,0x6a3a8a];stained.forEach((b,i)=>b.push(C[i%C.length]));inst(stained,sm,6);}
  inst(frames,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.55,metalness:0.05}),6);
  inst(sills,mat(0xd6cfc0));inst(hoods,mat(0xd9d3c6));
  const tb=inst(ARCH.box,new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.85}),6);if(tb)tb.castShadow=true;}
