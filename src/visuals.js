/* ================= VISUALS: shared look for small vehicles and props ================= */
/* the keke: shaped body, canopy, windscreen, three spoked wheels, headlamp */
function kekeModel(){const g=new THREE.Group(),b=new THREE.Group();g.add(b);const Y=vbodyM(0xf2c230),Gn=vbodyM(0x2f7a4a);
  const prof=[[-1.2,0.45],[-1.25,1.25],[1.0,1.25],[1.55,1.05],[1.7,0.7],[1.65,0.45]];const sh=shapeOf(prof);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:1.3,bevelEnabled:true,bevelThickness:0.06,bevelSize:0.06,bevelSegments:2});geo.translate(0,0,-0.65);geo.rotateY(-Math.PI/2);
  const body=new THREE.Mesh(geo,Y);body.castShadow=true;b.add(body);part(G.box,Gn,1.44,0.14,2.9,0,0.62,0.2,b);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(1.58,0.1,2.7),VLIGHT.trim);roof.position.set(0,2.05,0.05);roof.castShadow=true;b.add(roof);
  [[-0.72,-1.15],[0.72,-1.15],[-0.7,0.95],[0.7,0.95]].forEach(([x,z])=>part(G.cyl,VLIGHT.trim,0.035,0.8,0.035,x,1.65,z,b,false));
  const ws=new THREE.Mesh(new THREE.BoxGeometry(1.25,0.62,0.04),VLIGHT.glass);ws.position.set(0,1.62,1.02);ws.rotation.x=-0.12;b.add(ws);
  part(G.box,0x1b1b1b,1.2,0.55,0.5,0,1.15,-0.55,b);part(G.box,0x3a2a1e,1.15,0.12,0.6,0,0.9,-0.5,b,false);
  part(G.box,VLIGHT.head,0.22,0.16,0.05,0,0.95,1.73,b,false);
  const wheels=[];[[0,1.4,1],[-0.72,-0.85,0],[0.72,-0.85,0]].forEach(([x,z,front])=>{const st=new THREE.Group();st.position.set(x,0.32,z);b.add(st);const spin=new THREE.Group();st.add(spin);
    const ty=new THREE.Mesh(G.cyl,VLIGHT.tyre);ty.scale.set(0.32,0.18,0.32);ty.rotation.z=Math.PI/2;ty.castShadow=true;spin.add(ty);const rm=new THREE.Mesh(G.cyl,VLIGHT.rim);rm.scale.set(0.18,0.19,0.18);rm.rotation.z=Math.PI/2;spin.add(rm);wheels.push({st,spin,front:!!front,r:0.32});});
  g.userData.V={g,b,kind:'keke',doors:{},boot:null,wheels,sw:null};g.scale.setScalar(1.6);outdoor.add(g);return g;}
