/* ================= FLOWER BEDS and BUSHES =================
   Colourful beds along the front of every building (both sides of the door) and round bushes at the
   corners. Everything is instanced (three draw calls in total), so it costs almost nothing on phones. */
(function(){
const beds=[],bushes=[];
for(const id in LOCS){const L=LOCS[id];if(!L.h||L.kind==='gate'||!L.door)continue;
  const dx=L.door.x-L.x,dz=L.door.z-L.z,alongX=Math.abs(dz)/L.d>=Math.abs(dx)/L.w;/* door on a z face -> beds run along x */
  const len=(alongX?L.w:L.d),half=(alongX?L.d:L.w)/2,n=alongX?Math.sign(dz):Math.sign(dx),bl=Math.min(6,len*0.26);
  [-1,1].forEach(s=>{const off=s*len*0.3,x=alongX?L.x+off:L.x+n*(half+0.75),z=alongX?L.z+n*(half+0.75):L.z+off,w=alongX?bl:0.9,d=alongX?0.9:bl;
    if(roadDist(x,z)<6.2)return;beds.push({x,z,w,d});});
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>{const x=L.x+a*(L.w/2+0.9),z=L.z+b*(L.d/2+0.9);if(roadDist(x,z)<6.5||Math.hypot(x-L.door.x,z-L.door.z)<3)return;bushes.push({x,z,s:0.8+Math.random()*0.5});});}
const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new THREE.Vector3(),ps=new THREE.Vector3(),col=new THREE.Color();
/* soil + low edging */
{const im=new THREE.InstancedMesh(G.box,new THREE.MeshLambertMaterial({color:0x4a3322}),beds.length);beds.forEach((b,i)=>{sc.set(b.w,0.22,b.d);ps.set(b.x,0.11,b.z);m4.compose(ps,q,sc);im.setMatrixAt(i,m4);
  try{raster(NAV,{c:0,x:b.x,z:b.z,w:b.w,d:b.d,a:0},0.05,NAV.blk,1);}catch(e){}});im.receiveShadow=true;outdoor.add(im);}
/* flowers: leaves + blooms in one instanced mesh with per-instance colour */
const PAL=[0xd23b2b,0xe3b04b,0xf2f2ea,0xe0629a,0xf08a2b,0x8a4ad9,0xffd23b];
const per=QH?22:QM?16:10,total=beds.length*per*2+bushes.length;
const fm=new THREE.InstancedMesh(G.sphLo,new THREE.MeshLambertMaterial({color:0xffffff}),total);let k=0;
beds.forEach((b,bi)=>{const p0=PAL[bi%PAL.length],p1=PAL[(bi*3+2)%PAL.length];
  for(let i=0;i<per;i++){const x=b.x+(Math.random()-0.5)*(b.w-0.2),z=b.z+(Math.random()-0.5)*(b.d-0.2);
    sc.set(0.2,0.16,0.2);ps.set(x,0.3,z);m4.compose(ps,q,sc);fm.setMatrixAt(k,m4);fm.setColorAt(k++,col.setHex(i%3?0x3f7a33:0x2f6a2b));
    sc.set(0.11,0.09,0.11);ps.set(x+(Math.random()-0.5)*0.08,0.44+Math.random()*0.08,z+(Math.random()-0.5)*0.08);m4.compose(ps,q,sc);fm.setMatrixAt(k,m4);fm.setColorAt(k++,col.setHex(Math.random()<0.6?p0:p1));}});
bushes.forEach(b=>{sc.set(0.55*b.s,0.5*b.s,0.55*b.s);ps.set(b.x,0.42*b.s,b.z);m4.compose(ps,q,sc);fm.setMatrixAt(k,m4);fm.setColorAt(k++,col.setHex(0x356b2c));try{raster(NAV,{c:1,x:b.x,z:b.z,r:0.5*b.s},0.05,NAV.blk,1);}catch(e){}});
fm.count=k;if(fm.instanceColor)fm.instanceColor.needsUpdate=true;fm.castShadow=!!QH;fm.receiveShadow=true;outdoor.add(fm);
if(window.__QA)window.__FLORA={beds:beds.length,bushes:bushes.length};
})();
