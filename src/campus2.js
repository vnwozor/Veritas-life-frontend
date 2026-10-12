/* ================= CAMPUS 2: Blocks A–D (side by side), Munch Box, Down Cafe =================
   Runs before the campus is built, so the new buildings get walls, roofs, signs, doors and collision
   like every other building. Positions and colours are estimates until checked against photos of the
   real campus: tell me (or edit the numbers below) and they move. */
/* the lecture blocks: one row facing the same road, A to D from west to east */
const BLOCKS=['lecture','blockB','blockC','blockD'];
{const L=LOCS.lecture;Object.assign(L,{name:'Block A',sub:'Lecture block · LT 1 & LT 2 · your classes',x:39,z:-14,w:11,d:12,h:10,wall:0xe9dfc9,roof:0x7a2f22,flat:true,iname:'Block A · LT 2'});
  const extra={blockB:'Block B',blockC:'Block C',blockD:'Block D'};
  [['blockB',52],['blockC',65],['blockD',78]].forEach(([id,x])=>{LOCS[id]={id,name:extra[id],sub:'Lecture block · classrooms and lecture theatres',x,z:-14,w:11,d:12,h:10,wall:0xe9dfc9,roof:0x7a2f22,flat:true,inside:'lecture',iname:extra[id]+' · Lecture theatre',open:[7,20],block:true};});
  L.block=true;}
/* Munch Box (a cafe) and Down Cafe (the cafe close to the Boys Hostel) */
LOCS.munch={id:'munch',name:'Munch Box',sub:'Cafe · pastries, small chops, smoothies',x:19,z:-5,w:12,d:9,h:5,wall:0xf6e6b8,roof:0xc62b2b,inside:'cafe',open:[8,21],awning:true};
LOCS.downcafe={id:'downcafe',name:'Down Cafe',sub:'Cafe by the Boys Hostel · rice, beans, swallow',x:-44,z:39,w:14,d:9,h:5,wall:0xe7efd9,roof:0x2f6b3e,inside:'cafe',open:[7,22],awning:true};
MENUS.munch=[['Meat pie & Zobo',1200,40,20,4],['Small chops pack',1800,46,20,8],['Banana smoothie',1500,26,10,10]];
MENUS.downcafe=[['Rice & beans with stew',700,46,25],['Eba & egusi',900,58,30],['Spaghetti & egg',800,44,25]];
/* doors: the side nearest a road, the same rule the rest of the campus uses */
for(const id of ['lecture','blockB','blockC','blockD','munch','downcafe']){const L=LOCS[id];L.id=id;const cand=[];
  const up=R.filter(v=>v<L.z).pop(),dn=R.find(v=>v>L.z),lf=R.filter(v=>v<L.x).pop(),rt=R.find(v=>v>L.x);
  if(up!=null)cand.push({d:L.z-up-L.d/2,x:L.x,z:L.z-L.d/2-1.5});if(dn!=null)cand.push({d:dn-L.z-L.d/2,x:L.x,z:L.z+L.d/2+1.5});
  if(lf!=null)cand.push({d:L.x-lf-L.w/2,x:L.x-L.w/2-1.5,z:L.z});if(rt!=null)cand.push({d:rt-L.x-L.w/2,x:L.x+L.w/2+1.5,z:L.z});
  cand.sort((a,b)=>a.d-b.d);L.door={x:cand[0].x,z:cand[0].z};
  if(L.block)L.door={x:L.x,z:L.z-L.d/2-1.5};/* all four blocks open onto the same walkway */}
/* every block has a big letter on it so you can tell them apart from the road */
const blockOf=id=>BLOCKS.includes(id);
