/* ================= WORLD 3 =================
   Action durations from TIME (src/life3.js) · Sleep need · keke cancel and boarding · items you can drop and
   pick up · hostel rooms with real members · academics (attendance per course, assignments, exams, GPA) ·
   concerts and parties on the shared calendar · Club Vibez · houses and apartments to buy or rent.
   Anything other players compete for (items, rooms, houses, tickets, money) is decided by the server (lib/world.js). */

/* ---------- talking to the server ---------- */
const W3={h:[],drops:{},meshes:new Map(),rooms:null,props:null,tixOk:{},pend:{}};
function net(){return NETX();}
function wsend(o){const n=net();if(!n||!n.send)return false;n.send(o);return true;}
/* payments go up together with your latest save, so the server checks your real balance */
function wsendPaid(o){const n=net();if(!n||!n.send)return false;try{n.send({t:'state',st:snapState()});}catch(e){}n.send(o);return true;}
function onNet(f){W3.h.push(f);}
function newRef(p){return (p||'r')+((S&&S.uid)||0)+'-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
/* money the server charged: taken from your wallet exactly once per reference */
function applyCharge(ref,amount,label){S.txApplied=S.txApplied||{};if(S.txApplied[ref])return false;S.txApplied[ref]=Date.now();spend(amount,label);save();return true;}
HOOKS.frame.push(()=>{const n=net();if(n&&!n.w3){n.handlers=n.handlers||[];n.handlers.push(m=>W3.h.forEach(f=>{try{f(m);}catch(e){console.error(e);}}));n.w3=1;}});
function uDayNow(){return Math.floor(uNow()/1440);}
function bigSheet(title,sub,build){const wrap=el('div');wrap.style.display='grid';wrap.style.gap='8px';build(wrap);openSheet(title,sub,wrap);return wrap;}
function optBtn(wrap,t,s,fn,dis){const b=el('button','opt','<div class="l"><b>'+t+'</b><span>'+(dis||s||'')+'</span></div>');if(dis)b.disabled=true;b.onclick=()=>{fn(b);};wrap.append(b);return b;}

/* ================= ACTION DURATIONS (one table: TIME.ACTION_MIN) ================= */
function actKind(label,o){const l=String(label||'').toLowerCase();o=o||{};
  if(o.sleep)return /nap/.test(l)?'nap':'sleep';if(o.cls||/^lecture/.test(l))return 'lecture';if(o.mass)return 'pray';if(/exam/.test(l))return 'exam';
  if(/toilet|urinal|pee/.test(l))return 'toilet';if(/bath/.test(l))return 'bath';if(/shower|wash/.test(l))return 'shower';
  if(/assignment|stud|read|revis|homework|lt 2/.test(l))return 'study';if(/cook/.test(l))return 'cook';
  if(/eat|lunch|breakfast|dinner|rice|suya|shawarma|indomie|meal|food|snack|chop|garri|amala|eba|jollof|bread/.test(l))return 'eat';
  if(/party|club|danc/.test(l))return 'party';if(/gist|chat|hang|social|talk|date|visit/.test(l))return 'social';
  if(/work|shift|job|gig|kitchen|hustle/.test(l))return 'work';if(/gym|workout|run|exercise|football|ball|training/.test(l))return 'gym';
  if(/pray|mass|rosary|adoration/.test(l))return 'pray';if(/shop|buy/.test(l))return 'shop';return 'other';}
{const _sa=startAction;startAction=function(label,mins,o){o=o||{};try{if(o.noScale)return _sa.call(this,label,mins,o);const k=actKind(label,o);
    let want=TIME.ACTION_MIN[k]!=null?TIME.ACTION_MIN[k]:TIME.ACTION_MIN.other;if(k!=='sleep'&&k!=='nap')want=Math.min(mins,want,TIME.maxActionMin);want=Math.max(1,Math.round(want));
    if(want!==mins&&k!=='sleep'&&k!=='nap'&&o.per){/* the effects of the old, longer action still all happen */const per=o.per,ratio=mins/want;let acc=0;o.per=function(){acc+=ratio;while(acc>=1){acc-=1;per.apply(this,arguments);}};}
    if(k==='sleep'||k==='nap'){const d0=o.done,nap=k==='nap';o.done=function(){N('energy',nap?30:100);N('sleep',nap?35:100);if(!nap)addMoodlet('Rested',6,360);if(d0)return d0.apply(this,arguments);};}
    return _sa.call(this,label,want,o);}catch(e){console.error(e);return _sa.call(this,label,mins,o);}};}
/* the buttons show the new lengths */
function parseDur(s){const m=String(s).match(/^(\d+(?:\.\d+)?)\s*(h|m|min)\b/);if(!m)return null;return m[2]==='h'?+m[1]*60:+m[1];}
function fmtD(mins){return mins<60?mins+' min':(mins%60?Math.floor(mins/60)+'h '+(mins%60)+'m':(mins/60)+'h');}
{const _A=A;A=function(label,info,fn,o){try{if(typeof info==='string'){const d=parseDur(info);if(d!=null){const k=label==='Sleep'||/^sleep/i.test(label)?'sleep':label==='Nap'||/^nap/i.test(label)?'nap':actKind(label);
      const want=k==='sleep'||k==='nap'?TIME.ACTION_MIN[k]:Math.min(d,TIME.ACTION_MIN[k]!=null?TIME.ACTION_MIN[k]:TIME.ACTION_MIN.other,TIME.maxActionMin);if(want!==d)info=info.replace(/^(\d+(?:\.\d+)?)\s*(h|m|min)\b/,fmtD(want));}}}catch(e){}return _A(label,info,fn,o);};}

/* ================= NEEDS: a separate Sleep stat, warnings, effects ================= */
const NEED_CFG={sleep:{start:80,decay:0.06,gainAsleep:1.6,low:25},warnBelow:22,warnEveryMin:240,lowSleepEnergyDrain:0.03,lowSleepStudy:0.65,lowHygieneSocial:0.6};
if(!NEEDS.some(n=>n[0]==='sleep'))NEEDS.push(['sleep','Sleep','#8a9ad9']);
$('#needs').innerHTML=NEEDS.map(([k,l])=>'<div class="need" data-need="'+k+'"><div class="v">'+l+'<i class="num" id="nv_'+k+'"></i></div><div class="bar"><div id="nb_'+k+'"></div></div></div>').join('');
NEED_TIPS.sleep='Sleep 30 minutes in a bed (a full night\'s rest) or nap 10 minutes. Sleep also restores energy.';
HOOKS.newState.push(st=>{st.needs.sleep=NEED_CFG.sleep.start;});
HOOKS.migrate.push(st=>{if(st.needs&&st.needs.sleep==null)st.needs.sleep=NEED_CFG.sleep.start;});
HOOKS.boot.push(()=>{if(S.needs.sleep==null)S.needs.sleep=NEED_CFG.sleep.start;});
HOOKS.minute.push(()=>{const n=S.needs;if(n.sleep==null)return;const asleep=ACT&&ACT.sleep;
  N('sleep',asleep?NEED_CFG.sleep.gainAsleep:-NEED_CFG.sleep.decay);if(!asleep&&n.sleep<NEED_CFG.sleep.low)N('energy',-NEED_CFG.lowSleepEnergyDrain);
  /* warnings when something important runs low (not more than every few hours per need) */
  S.flags.warnAt=S.flags.warnAt||{};for(const [k,lbl] of [['sleep','Sleep'],['food','Hunger'],['energy','Energy'],['hygiene','Hygiene'],['social','Social'],['bladder','Bladder']]){
    if(n[k]!=null&&n[k]<NEED_CFG.warnBelow&&!(S.flags.warnAt[k]>S.t)&&!asleep){S.flags.warnAt[k]=S.t+NEED_CFG.warnEveryMin;toast(lbl+' low',(NEED_TIPS[k]||'Take care of it soon.'),'bad');}}});
{const _e=eff;eff=function(){let e=_e();const n=S.needs;if(n.sleep!=null&&n.sleep<NEED_CFG.sleep.low)e*=NEED_CFG.lowSleepStudy;return e;};}

/* ================= KEKE: cancel while it comes, climb in and out properly ================= */
{const st=document.createElement('style');st.textContent='#w3ride,#w3pick{position:absolute;left:50%;transform:translateX(-50%);z-index:22;display:flex;gap:8px;align-items:center;background:rgba(10,24,20,.94);border:1px solid var(--line);border-radius:14px;padding:8px 10px;box-shadow:0 6px 18px rgba(0,0,0,.4);max-width:calc(100vw - 24px)}#w3ride{bottom:calc(env(safe-area-inset-bottom,0px) + 140px)}#w3pick{bottom:calc(env(safe-area-inset-bottom,0px) + 196px)}#w3ride[hidden],#w3pick[hidden]{display:none}#w3ride span,#w3pick span{font-weight:700;font-size:14px;color:var(--cream)}#w3ride button,#w3pick button{border-radius:10px;padding:9px 12px;font-weight:800;border:1px solid var(--line);background:var(--ink2);color:var(--cream)}#w3ride .x{background:#8a2a2a;border-color:#a33}#w3pick .g{background:var(--gold);color:#1a1405;border-color:var(--gold)}body.sheet-open #w3ride,body.phone-open #w3ride,body.cine #w3ride,body.sheet-open #w3pick,body.phone-open #w3pick,body.cine #w3pick{display:none}';document.head.appendChild(st);}
const rideBar=el('div');rideBar.id='w3ride';rideBar.hidden=true;rideBar.innerHTML='<span></span><button class="x">Cancel ride</button>';($('#app')||document.body).append(rideBar);
function cancelRide(why){const R2=W.ride;if(!R2||R2.own||R2.phase!=='wait')return;const k=R2.k;if(R2.boarded)return;
  k.mode='ambient';kekeRoute(k);W.ride=null;P.path=null;P.mode='idle';player.visible=true;player.position.y=0;toast((k.rk||RIDES.keke).n,why||'Ride cancelled. No charge.');}
rideBar.querySelector('.x').onclick=()=>cancelRide();
{const _up=updatePlayer;updatePlayer=function(dt,now){const R2=W.ride;
  try{if(R2&&!R2.own&&R2.phase==='wait'&&!R2.boarded){const k=R2.k;R2.t0=R2.t0||performance.now();
      /* the driver never came: give up after two real minutes */
      if(k.mode==='pickup'&&performance.now()-R2.t0>120000){cancelRide('The driver is not coming. You were not charged.');return _up.apply(this,arguments);}
      if(k.mode==='wait'&&!R2.board){k.mode='boarding';const g=k.g,r=g.rotation.y;const side={x:g.position.x+Math.cos(r)*1.8,z:g.position.z-Math.sin(r)*1.8};const fp=freeNear(NAV,side.x,side.z,3);R2.board={t:0,side:fp,stage:'walk'};P.path=navPath(P,fp)||[fp];P.i=0;P.mode='walk';}
      if(R2.board){const B=R2.board,g=k.g;B.t+=dt;
        if(B.stage==='walk'){if(!P.path||Math.hypot(P.x-B.side.x,P.z-B.side.z)<0.6||B.t>7){P.path=null;P.mode='idle';B.stage='in';B.t=0;B.from={x:P.x,z:P.z};sfx('door');const V=g.userData.V;if(V&&V.doors&&V.doors.l0)vehDoor(V,'l0',true);}
          else{if(navMove(P,dt,walkSpeed(),NAV,true))P.path=null;P.walk+=dt*9;pose(player,'walk',P.walk,dt);player.position.set(P.x,0,P.z);player.rotation.y=P.dir;return;}}
        if(B.stage==='in'){const u=Math.min(1,B.t/0.9);const tx=g.position.x,tz=g.position.z;P.dir=Math.atan2(tx-B.from.x,tz-B.from.z);P.x=B.from.x+(tx-B.from.x)*u*0.85;P.z=B.from.z+(tz-B.from.z)*u*0.85;
          player.visible=true;player.position.set(P.x,0.3*Math.min(1,u*1.6),P.z);player.rotation.y=P.dir;pose(player,u<0.55?'walk':'sit',now/1000,dt);
          if(u>=1){R2.boarded=true;k.mode='wait';player.position.y=0;const V=g.userData.V;if(V&&V.doors&&V.doors.l0)setTimeout(()=>vehDoor(V,'l0',false),300);}return;}}}
    /* getting out: step out at the side, not through the roof */
    if(R2&&!R2.own&&R2.phase==='ride'&&R2.k.mode==='drop'&&!R2.out){R2.out=true;const g=R2.k.g,r=g.rotation.y;const fp=freeNear(NAV,g.position.x+Math.cos(r)*1.8,g.position.z-Math.sin(r)*1.8,4);R2.k.x=fp.x;R2.k.z=fp.z;sfx('door');}
  }catch(e){console.error(e);}
  const out=_up.apply(this,arguments);
  try{if(R2&&R2.out&&!W.ride&&R2.k){R2.k.x=R2.k.g.position.x;R2.k.z=R2.k.g.position.z;}}catch(e){}
  return out;};}
HOOKS.frame.push(()=>{const R2=W.ride;const show=!!(S&&R2&&!R2.own&&R2.phase==='wait'&&!R2.boarded);rideBar.hidden=!show;if(!show)return;
  const k=R2.k,d=Math.hypot(k.x-P.x,k.z-P.z),RD=k.rk||RIDES.keke;rideBar.querySelector('span').textContent='🛺 '+RD.n+(R2.board?' is here · climbing in':k.mode==='pickup'?' coming · '+Math.round(d)+' m away':' is here');
  rideBar.querySelector('.x').hidden=!!R2.board;});

/* ================= ITEMS: drop them, pick them up (yours or anyone's) ================= */
const ITEMS={umbrella:{n:'Umbrella',c:0x2b3b8a},laptop:{n:'Laptop',c:0x333333},phone:{n:'Phone',c:0x111111},garri:{n:'Garri pack',c:0xe8dcb0},gift:{n:'Gift box',c:0xc2306b},powerbank:{n:'Power bank',c:0x2a2a2a},camera:{n:'Camera',c:0x1b1b1b},notebook:{n:'Notebook',c:0x2f6b8a},textbook:{n:'Textbook',c:0x7a2331},bag:{n:'School bag',c:0x3a3a2a},water:{n:'Bottle of water',c:0x7fc4ff},snack:{n:'Meat pie',c:0xd9a441}};
HOOKS.newState.push(st=>{Object.assign(st.inv,{notebook:1,textbook:1,bag:1,water:1});});
HOOKS.migrate.push(st=>{if(st.inv&&st.inv.notebook==null)Object.assign(st.inv,{notebook:1,textbook:1,bag:1,water:st.inv.water||1});});
function invCount(k){if(k==='phone')return S.flags.phoneGone?0:1;const v=S.inv[k];return v===true?1:(+v||0);}
function invTake(k){if(k==='phone'){S.flags.phoneGone=1;return;}const v=S.inv[k];S.inv[k]=v===true?false:Math.max(0,(+v||0)-1);}
function invGive(k){if(k==='phone'){if(S.flags.phoneGone){S.flags.phoneGone=0;return 'Your phone is back in your pocket.';}S.inv.sparePhone=(S.inv.sparePhone||0)+1;return 'A spare phone. Sell it, or keep it.';}const v=S.inv[k];S.inv[k]=(v===true?1:(+v||0))+1;return null;}
function curLoc(){const n=net();if(n&&n.myLoc)return n.myLoc();return S.inside?'in:'+S.inside:'out';}
function canDrop(){return S&&!S.over&&!CS.on&&!S.captive&&!W.drive&&!W.ride&&!ACT;}
function dropItem(k){if(!canDrop())return toast('Not now','Finish what you are doing first.');if(invCount(k)<1)return toast(ITEMS[k].n,'You don\'t have one.');
  if(k==='laptop'&&S.yahoo&&S.yahoo.on)return toast('Laptop','You are using it.');const loc=curLoc();const x=P.x+Math.sin(P.dir||0)*0.9,z=P.z+Math.cos(P.dir||0)*0.9;invTake(k);save();
  if(net()){const ref=newRef('d');W3.pend[ref]=k;wsend({t:'drop',item:k,label:ITEMS[k].n,x,z,loc,ref});toast('Dropped',ITEMS[k].n+' is on the ground. Anyone nearby can pick it up.');}
  else{S.ldrops=S.ldrops||{};const L=S.ldrops[loc]=S.ldrops[loc]||[];L.push({id:'l'+Date.now(),item:k,label:ITEMS[k].n,x,z,by:0});W3.drops[loc]=L;drawDrops();toast('Dropped',ITEMS[k].n+' is on the ground.');}
  sfx('step');}
function pickItem(d){if(!canDrop())return;const loc=curLoc();if(Math.hypot(P.x-d.x,P.z-d.z)>3)return toast('Too far','Walk up to it first.');
  if(net()){if(W3.picking)return;W3.picking=d.id;wsend({t:'pick',id:d.id,loc,px:P.x,pz:P.z});setTimeout(()=>{if(W3.picking===d.id)W3.picking=null;},6000);}
  else{const L=S.ldrops&&S.ldrops[loc]||[];const i=L.findIndex(x=>x.id===d.id);if(i<0)return;L.splice(i,1);W3.drops[loc]=L;const msg2=invGive(d.item);drawDrops();toast('Picked up',d.label+(msg2?' · '+msg2:''),'good');save();}}
onNet(m=>{if(m.t==='drops'){const n=net();n.dv=n.dv||{};n.dv[m.loc]=m.v;W3.drops[m.loc]=m.list;drawDrops();}
  else if(m.t==='drop_res'){const k=W3.pend[m.ref];delete W3.pend[m.ref];if(!m.ok&&k){invGive(k);save();toast('Can\'t drop it',m.reason||'Try again.','bad');}else if(m.ok){const L=W3.drops[m.loc]=W3.drops[m.loc]||[];if(!L.some(x=>x.id===m.drop.id))L.push(m.drop);drawDrops();}}
  else if(m.t==='pick_res'){W3.picking=null;if(m.ok){const d=m.drop;const L=W3.drops[m.loc]||[];W3.drops[m.loc]=L.filter(x=>x.id!==d.id);const msg2=invGive(d.item);drawDrops();save();
      toast('Picked up',d.label+(d.by&&net()&&d.by!==net().user.id?' (dropped by '+esc(d.byName||'someone')+')':'')+(msg2?' · '+msg2:''),'good');sfx('ping');}
    else{toast('Gone',m.reason||'Someone else took it.','bad');const L=W3.drops[curLoc()]||[];W3.drops[curLoc()]=L.filter(x=>x.id!==m.id);drawDrops();}}});
function itemMesh(k){const g=new THREE.Group();const c=(ITEMS[k]||{}).c||0x888888;
  if(k==='umbrella'){part(G.cyl,c,0.05,1.0,0.05,0,0.06,0,g,false).rotation.z=Math.PI/2;part(G.box,c,0.9,0.12,0.22,0,0.1,0,g,false);}
  else if(k==='laptop'){part(G.box,c,0.5,0.04,0.35,0,0.03,0,g,false);}
  else if(k==='phone'){part(G.box,c,0.12,0.02,0.24,0,0.02,0,g,false);}
  else if(k==='bag'){part(G.box,c,0.45,0.5,0.25,0,0.25,0,g,false);}
  else if(k==='water'){part(G.cyl,c,0.08,0.32,0.08,0,0.16,0,g,false);}
  else if(k==='textbook'||k==='notebook'){part(G.box,c,0.32,0.06,0.42,0,0.04,0,g,false);part(G.box,0xf2efe6,0.3,0.04,0.4,0.01,0.04,0,g,false);}
  else part(G.box,c,0.32,0.22,0.32,0,0.11,0,g,false);
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.42,0.55,24),new THREE.MeshBasicMaterial({color:0xe3b04b,transparent:true,opacity:0.7,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=0.02;g.add(ring);g.userData.ring=ring;return g;}
function drawDrops(){const loc=curLoc();const want=new Set((W3.drops[loc]||[]).map(d=>d.id));
  for(const [id,g] of W3.meshes){if(!want.has(id)||g.userData.loc!==loc){if(g.parent)g.parent.remove(g);W3.meshes.delete(id);}}
  const parent=S.inside?getInt(S.inside).g:outdoor;(W3.drops[loc]||[]).forEach(d=>{if(W3.meshes.has(d.id))return;const g=itemMesh(d.item);g.position.set(d.x,0,d.z);g.rotation.y=(d.id*1.7)%6.28;g.userData.loc=loc;g.userData.drop=d;parent.add(g);W3.meshes.set(d.id,g);});}
const pickBar=el('div');pickBar.id='w3pick';pickBar.hidden=true;pickBar.innerHTML='<span></span><button class="g">Pick up</button>';($('#app')||document.body).append(pickBar);
let lastLoc='';HOOKS.frame.push((dt,now)=>{if(!S)return;const loc=curLoc();if(loc!==lastLoc){lastLoc=loc;drawDrops();if(!net()){W3.drops[loc]=(S.ldrops||{})[loc]||[];drawDrops();}}
  let best=null,bd=2.4;for(const g of W3.meshes.values()){if(g.userData.ring)g.userData.ring.material.opacity=0.45+Math.sin(now/250)*0.25;const d=g.userData.drop;const dd=Math.hypot(P.x-d.x,P.z-d.z);if(dd<bd){bd=dd;best=d;}}
  const show=!!best&&canDrop();pickBar.hidden=!show;if(show){pickBar.querySelector('span').textContent=best.label;pickBar.querySelector('.g').onclick=()=>pickItem(best);}});
/* your bag: see what you carry, drop things */
HOOKS.apps.push(()=>[['bag','Bag','#5a4a2f','▣']]);
HOOKS.views.bag=(b,T)=>{T.textContent='Your bag';b.append(el('div','note','Drop something and it lies on the ground where you stand. Anyone nearby, you included, can pick it up.'));
  let any=false;for(const k in ITEMS){const n=invCount(k);if(!n)continue;any=true;const r=el('div','txrow','<div>'+ITEMS[k].n+(n>1?' × '+n:'')+'<span>'+(k==='phone'?'Dropping your phone means no phone until you get it back':'Tap Drop to put it down here')+'</span></div>');
    const br=el('div','btnrow');const bt=el('button',null,'Drop '+ITEMS[k].n.toLowerCase());bt.disabled=!canDrop();bt.onclick=()=>{closePhone();dropItem(k);};br.append(bt);b.append(r,br);}
  if(S.inv.sparePhone)b.append(el('div','txrow','<div>Spare phone × '+S.inv.sparePhone+'<span>Found on the ground</span></div>'));
  if(!any)b.append(el('div','note','Your bag is empty.'));};
{const _op=openPhone;openPhone=function(v){if(S&&S.flags.phoneGone){const where=Object.entries(W3.drops).find(([,L])=>(L||[]).some(d=>d.item==='phone'&&net()&&d.by===net().user.id));
    dialog({who:'me',kicker:'No phone',text:where?'Your phone is on the ground where you dropped it. Go back and pick it up.':'You don\'t have a phone right now. Someone may have picked it up.',choices:[{t:'Buy a new phone (₦15,000)',fn:()=>{if(!spend(15000,'New phone'))return 'You don\'t have ₦15,000.';S.flags.phoneGone=0;save();return 'New phone, same number. Back online.';}},{t:'Okay',fn:()=>null}]});return;}
  return _op.apply(this,arguments);};}

/* ================= HOSTEL ROOMS: register, join a room, members only ================= */
function hallId(){return isF()?'girls':'boys';}
function roomsFetch(){if(!wsend({t:'room_list',hall:hallId()}))W3.rooms=null;}
onNet(m=>{if(m.t==='room_list'){W3.rooms=m;W3.roomsAt=Date.now();if(m.mine&&m.mine.hall===hallId()){if(S.roomNo!==m.mine.no){S.roomNo=m.mine.no;save();}}if(UI.sheet&&W3.roomSheetOpen)roomSheet();}
  else if(m.t==='room_res'){if(m.ok){if(m.left){S.roomNo=null;toast('Hostel Office','You gave up your room.');}else{S.roomNo=m.no;toast('Room '+m.no,m.same?'That is already your room.':'Welcome to Room '+m.no+'. Your name is on the door. Find it on your floor.','good');checkGoals();}save();}else toast('Hostel Office',m.reason||'Try again.','bad');roomsFetch();}});
HOOKS.boot.push(()=>setTimeout(roomsFetch,2500));
myRoomNo=function(){return S&&S.roomNo||(S&&S.room==='210'?210:104);};
function roomMembers(no){const R0=W3.rooms;if(!R0)return null;const r=R0.rooms.find(x=>x.no===no);return r?r.members:[];}
function roomSheet(){W3.roomSheetOpen=true;bigSheet('Accommodation',fx(LOCS[isF()?'girls':'boys'].name)+' · '+(W3.rooms?W3.rooms.cap:4)+' students per room',wrap=>{
  const R0=W3.rooms;const mine=myRoomNo();
  if(!net()){wrap.append(el('div','note','Offline game: you are in Room '+mine+'. Online, real students share rooms.'));return;}
  if(!R0){wrap.append(el('div','note','Loading rooms…'));roomsFetch();return;}
  wrap.append(el('div','note',R0.mine?'Your room: <b>Room '+R0.mine.no+'</b>. Moving gives up your bed there.':'You have not registered for a room yet. Your bunk is Room '+mine+' until you do.'));
  R0.rooms.forEach(r=>{const full=r.members.length>=R0.cap;const me=R0.mine&&R0.mine.no===r.no;const who=r.members.map(x=>esc(x.name)).join(', ');
    optBtn(wrap,(me?'★ ':'')+'Room '+r.no+' · '+(r.no<200?'ground floor':'first floor'),r.members.length+'/'+R0.cap+(who?' · '+who:' · empty'),()=>{wsend({t:'room_join',hall:hallId(),no:r.no});},me?'Your room':full?'Full · '+who:null);});
  if(R0.mine)optBtn(wrap,'Give up my room','Free your bed for someone else',()=>{wsend({t:'room_leave'});});});}
{const _cs=closeSheet;closeSheet=function(){W3.roomSheetOpen=false;return _cs.apply(this,arguments);};}
roomActs=function(no,fl,x,z,side){const mine=no===myRoomNo();if(mine)return [A('Go into your room','Room '+no+' · your bunk, locker and things',()=>{S.flags.lockPass=Math.max(S.flags.lockPass||0,S.t+2);S.roomHost=null;goInt('boys');})];
  const mem=roomMembers(no);const n=net();const L=[];
  if(!n)return [A('Room '+no,'Locked',()=>{},{dis:'Members only'})];
  if(mem==null){roomsFetch();return [A('Room '+no,'Checking who lives here…',()=>{},{dis:'Loading'})];}
  const names=mem.map(m=>m.name).join(', ');const on=mem.filter(m=>(n.online||[]).some(o=>o.id===m.id));
  const pv=n.pvisit&&n.pvisit.until>Date.now()&&mem.some(m=>m.id===n.pvisit.host);
  L.push(A('Room '+no,mem.length?'Lives here: '+names:'Empty room · register for it at the Hostel Office',()=>{},{dis:mem.length+'/'+(W3.rooms.cap)+' students'}));
  if(mem.length)L.push(A('Knock','Ask '+(on.length?on.map(m=>m.name).join(' or '):'them')+' to let you in',()=>{if(!on.length)return toast('Room '+no,'Nobody answers. They are not online.');wsend({t:'room',to:on[0].id,kind:'ask'});toast('Room '+no,'You knock. Waiting for '+on[0].name+' to open.');}));
  L.push(A('Go in',pv?'You were invited':'Members and invited guests only',()=>{/* the same room the members are in */S.roomHost='r'+(isF()?'g':'b')+no;S.flags.lockPass=Math.max(S.flags.lockPass||0,S.t+2);goInt('boys');toast('Room '+no,'You are a guest. Be nice.');},{dis:pv?null:'Knock first'}));
  L.push(A('Accommodation','See every room and register',()=>roomSheet()));return L;};
{const _ol=openLoc;openLoc=function(id){const r=_ol.apply(this,arguments);try{if((id==='hadmin'||id==='boys'||id==='girls')&&UI.sheet){const box=$('#shB');const b=el('button','opt','<div class="l"><b>🛏 Accommodation</b><span>Register for a room · see who lives where</span></div>');b.onclick=()=>{closeSheet();roomsFetch();setTimeout(roomSheet,60);};box.prepend(b);}}catch(e){}return r;};}

/* ================= ACADEMICS: attendance per course, assignments, exams, GPA ================= */
const LECTURERS=['Dr. Okafor','Prof. Bello','Dr. Adeyemi','Mrs. Eze'];
const TOPICS=['Problem set','Short essay','Lab report','Case study','Reading summary','Group presentation notes'];
function acad(){S.acad=S.acad||{c:{},seen:{},asg:[],res:[],remind:{}};return S.acad;}
function courses(){return [0,1,2,3].map(i=>({i,code:courseCode(i),lect:LECTURERS[i]}));}
function gradeOf(sc){return sc>=70?'A':sc>=60?'B':sc>=50?'C':sc>=45?'D':sc>=40?'E':'F';}
const GP={A:5,B:4,C:3,D:2,E:1,F:0};
HOOKS.minute.push(()=>{const A0=acad(),d=dayOf(S.t),m=minOf(S.t);
  (S.today.classes||[]).forEach(c=>{const key=d+':'+c.code+':'+c.start;
    if(!A0.remind[key]&&c.st==='pending'&&c.start-m===15){A0.remind[key]=1;toast('📚 '+c.code+' in 15 minutes',fx((LOCS[c.loc||'lecture']||LOCS.lecture).name)+' · '+LECTURERS[courses().findIndex(x=>x.code===c.code)]+' · tap it in your To-do to go','good');sfx('ping');}
    if(!A0.seen[key]&&(c.st==='attended'||c.st==='missed')){A0.seen[key]=c.st;const r=A0.c[c.code]=A0.c[c.code]||{held:0,att:0};r.held++;if(c.st==='attended')r.att++;}});
  if(m===0){const keep=d-3;for(const k in A0.seen)if(+k.split(':')[0]<keep)delete A0.seen[k];for(const k in A0.remind)if(+k.split(':')[0]<keep)delete A0.remind[k];}});
HOOKS.day.push((d,w)=>{const A0=acad();
  if(w===0)courses().forEach(c=>{if(A0.asg.some(a=>a.code===c.code&&(a.st==='open'||a.st==='ready')))return;A0.asg.push({id:'a'+d+c.i,code:c.code,title:pick(TOPICS),set:d,due:d+3,st:'open',q:0});
    msg('rep','New assignment for '+c.code+' ('+c.lect+'): due '+DAYS[(d+2)%7]+' (Day '+(d+3)+'). Do it in your Grades app, then submit before 11:59 PM that day.');});
  A0.asg.forEach(a=>{if((a.st==='open'||a.st==='ready')&&d>a.due+3){a.st='missed';a.score=0;msg('rep','You never submitted the '+a.code+' '+a.title.toLowerCase()+'. That is a zero.');}});
  if(A0.asg.length>40)A0.asg=A0.asg.slice(-40);});
function workAssignment(a){if(ACT)return toast('Busy','Finish what you are doing first.');
  startAction('Assignment: '+a.code,60,{per:()=>{N('energy',-0.05);N('stress',0.03);},done:()=>{a.q=Math.round(clamp(42+eff()*30+S.skills.academic*4+(S.needs.sleep>40?5:-6)+rnd(-8,8),0,100));a.st='ready';toast(a.code,'Assignment done. Submit it before the deadline.','good');save();}});}
function submitAssignment(a){const d=dayOf(S.t);const late=Math.max(0,d-a.due);if(late>3){a.st='missed';a.score=0;return toast(a.code,'Too late. The portal closed for this one.','bad');}
  a.st='submitted';a.sub=d;a.late=late;a.score=Math.max(0,a.q-15*late);S.study+=0.3;
  toast(a.code,late?'Submitted '+late+' day'+(late>1?'s':'')+' late: −'+(15*late)+' marks. Score '+a.score+'/100.':'Submitted on time. Score '+a.score+'/100.',late?'bad':'good');save();}
function courseRow(code){const A0=acad();const r=A0.c[code]||{held:0,att:0};const att=r.held?r.att/r.held:1;const asg=A0.asg.filter(a=>a.code===code&&(a.st==='submitted'||a.st==='missed'));
  const asgAvg=asg.length?asg.reduce((s,a)=>s+(a.score||0),0)/asg.length:null;const ca=Math.round(att*10+(asgAvg==null?20:asgAvg*0.3));return {att,held:r.held,ca,asgAvg,asgN:asg.length};}
{const _er=examResult;examResult=function(how){const before=(S.exams||[]).length;const out=_er.apply(this,arguments);try{const E=(S.exams||[]);if(E.length>before){const e=E[E.length-1];const A0=acad();
      const rows=courses().map(c=>{const r=courseRow(c.code);const ex=how==='done'?Math.round(clamp(e.score+rnd(-6,6),0,100)):0;const total=Math.round(r.ca+ex*0.6);return {code:c.code,ca:r.ca,exam:ex,total,grade:gradeOf(total)};});
      const gpa=Math.round(rows.reduce((s,r)=>s+GP[r.grade],0)/rows.length*100)/100;A0.res.push({day:e.day,rows,gpa});const cg=A0.res.reduce((s,x)=>s+x.gpa,0)/A0.res.length;S.cgpa=Math.round(cg*100)/100;
      if(gpa<1.5){setTimeout(()=>dialog({who:'rep',kicker:'Academic probation',text:'Your GPA this time is <b>'+gpa.toFixed(2)+'</b>. Below 1.50 puts you on probation: the faculty writes to your parents, and two in a row means repeating the level.',choices:[{t:'I will do better',fn:()=>null}]}),600);rel('mum',-5);S.flags.probation=(S.flags.probation||0)+1;}
      else S.flags.probation=0;}}catch(err){console.error(err);}return out;};}
HOOKS.apps.push(()=>[['grades','Grades','#2f5a8a','A+']]);
HOOKS.views.grades=(b,T)=>{T.textContent='Grades & timetable';const A0=acad();
  b.append(el('div','statgrid','<div class="stat"><span>CGPA (5.0 scale)</span><b class="num">'+(S.cgpa||0).toFixed(2)+'</b></div><div class="stat"><span>Attendance</span><b class="num">'+(S.held?Math.round(S.attended/S.held*100):100)+'%</b></div><div class="stat"><span>Next exams</span><b>Day '+nextExamDay()+'</b></div><div class="stat"><span>Level</span><b>'+(S.level||100)+'</b></div>'));
  b.append(el('div','sec','Courses'));courses().forEach(c=>{const r=courseRow(c.code);b.append(el('div','txrow','<div><b>'+c.code+'</b> · '+c.lect+'<span>Attendance '+Math.round(r.att*100)+'% ('+r.held+' held) · assignments '+(r.asgAvg==null?'none yet':Math.round(r.asgAvg)+'/100 ×'+r.asgN)+' · CA '+r.ca+'/40</span></div><div class="amt">'+gradeOf(r.ca+Math.round(clamp(30+S.study*3+r.att*20,0,100)*0.6))+'?</div>'));});
  const open=A0.asg.filter(a=>a.st==='open'||a.st==='ready');b.append(el('div','sec','Assignments'));if(!open.length)b.append(el('div','note','Nothing due. New assignments come out on Mondays.'));
  open.forEach(a=>{const d=dayOf(S.t);const row=el('div','txrow','<div><b>'+a.code+'</b> · '+a.title+'<span>Due Day '+a.due+(d>a.due?' · <b style="color:var(--bad)">late: −15 marks a day</b>':d===a.due?' · due today':'')+(a.st==='ready'?' · done, not submitted':'')+'</span></div>');
    const br=el('div','btnrow');const bt=el('button',null,a.st==='ready'?'Submit':'Work on it (30 min)');bt.onclick=()=>{closePhone();if(a.st==='ready')submitAssignment(a);else workAssignment(a);};br.append(bt);b.append(row,br);});
  const done=A0.asg.filter(a=>a.st==='submitted'||a.st==='missed').slice(-6).reverse();if(done.length){b.append(el('div','sec','Marked'));done.forEach(a=>b.append(el('div','txrow','<div>'+a.code+' · '+a.title+'<span>'+(a.st==='missed'?'Not submitted':a.late?'Late by '+a.late+' day'+(a.late>1?'s':''):'On time')+'</span></div><div class="amt">'+(a.score||0)+'/100</div>')));}
  b.append(el('div','sec','Weekly timetable'));WEEK.forEach((day,i)=>{if(!day.length)return;b.append(el('div','txrow','<div><b>'+DAYS[i]+'</b><span>'+day.map(([ci,s,e])=>{const code=courseCode(ci);return code+' '+fmtTime(s)+'–'+fmtTime(e)+' · '+fx((LOCS[blockFor(code)]||LOCS.lecture).name)+' · '+LECTURERS[ci];}).join('<br>')+'</span></div>'));});
  if(A0.res.length){b.append(el('div','sec','Results'));A0.res.slice().reverse().forEach(R0=>{b.append(el('div','txrow','<div><b>Exams · Day '+R0.day+'</b><span>'+R0.rows.map(r=>r.code+' '+r.total+' ('+r.grade+')').join(' · ')+'</span></div><div class="amt">GPA '+R0.gpa.toFixed(2)+'</div>'));});}};
HOOKS.todo.push(o=>{const A0=acad(),d=dayOf(S.t);A0.asg.filter(a=>(a.st==='open'||a.st==='ready')&&a.due-d<=1).slice(0,2).forEach(a=>o.push({t:'📝 '+a.code+' assignment · due '+(a.due===d?'today':a.due<d?'LATE':'tomorrow')+(a.st==='ready'?' · submit':''),loc:'library',c:a.due<=d?'urgent':''}));});

/* ================= CONCERTS on the shared calendar, tickets checked by the server ================= */
HOOKS.boot.push(()=>{S.flags.conNext=1e9;});
{const _cs=concertSet;concertSet=function(c){if(c&&c.uday!=null&&!c.cancel)c=Object.assign({},c,{inDays:Math.max(0,c.uday-uDayNow())});return _cs.call(this,c);};}
HOOKS.day.push(()=>{S.flags.conNext=1e9;const ud=uDayNow();if(S.concert&&S.concert.src==='admin')return;
  let U=ud;while(U%6!==3)U++;if(U-ud<=2&&!(S.concert&&S.concert.id==='u'+U))concertSet(Object.assign({},CONCERT_DEFAULT,{id:'u'+U,src:'game',inDays:U-ud}));});
ticketSheet=function(){const c=conNow();if(!c)return toast('Concerts','No concert announced right now.');const online=!!net();
  bigSheet('Tickets',c.title,wrap=>{wrap.append(el('div','note',c.lineup.join(' · ')+'<br>'+conWhen(c)+' · Bwari Event Ground · capacity '+(online?'400 regular, 40 VIP':'limited')));
    if(S.ticket)wrap.append(el('div','note','<b style="color:var(--good)">✓ You have a '+(S.ticket.vip?'VIP':'regular')+' ticket.</b> On the night, go to the Main Gate and board the concert shuttle.'));
    [false,true].forEach(vip=>{const p=vip?c.vip:c.price;const cost=S.ticket?p-(S.ticketPaid||0):p;
      optBtn(wrap,vip?'VIP ticket · '+naira(p):'Regular ticket · '+naira(p),vip?'Front of the stage, free drink, meet the artists':'General standing',btn=>{if(S.money<cost)return toast('Not enough money','You need '+naira(cost)+'.','bad');
        if(!online){if(!spend(cost,'Concert ticket · '+c.title))return;S.ticket={vip};S.ticketPaid=p;save();closeSheet();return toast('Ticket bought','See you there!','good');}
        btn.disabled=true;btn.querySelector('span').textContent='Checking with the ticket desk…';const ref=newRef('t');W3.pend[ref]={vip,p,cost};wsendPaid({t:'tix_buy',cid:String(c.id),vip,price:cost,ref,bal:S.money});},
        S.ticket&&(S.ticket.vip||!vip)?'You already have this':null);});});};
onNet(m=>{if(m.t==='tix_res'){const P0=W3.pend[m.ref];delete W3.pend[m.ref];if(m.ok&&P0){applyCharge(m.ref,P0.cost,'Concert ticket'+(P0.vip?' (VIP)':''));S.ticket={vip:P0.vip,ref:m.ref};S.ticketPaid=P0.p;W3.tixOk[m.cid]=1;save();if(UI.sheet)closeSheet();toast('🎟 Ticket confirmed',(m.left!=null?m.left+' left in this section. ':'')+'Board the shuttle at the Main Gate on the night.','good');}
    else if(!m.ok){toast('Tickets',m.reason||'Try again.','bad');if(UI.sheet)closeSheet();}}
  else if(m.t==='tix_check'){W3.tixOk[m.cid]=m.ok?1:-1;if(m.ok&&W3.wantGo){W3.wantGo=false;goConcert();}else if(!m.ok){W3.wantGo=false;S.ticket=null;toast('Entrance','Your ticket is not on the list. Buy one in the Tickets app.','bad');}}});
{const _go=goConcert;goConcert=function(){const c=conNow();if(c&&net()&&S.ticket&&W3.tixOk[c.id]!==1){W3.wantGo=true;wsend({t:'tix_check',cid:String(c.id)});toast('Entrance','Scanning your ticket…');return;}return _go.apply(this,arguments);};}
{const _lc=leaveConcert;leaveConcert=function(over){const was=!!W.concert;const r=_lc.apply(this,arguments);if(was&&over){S.inv.wristband=(S.inv.wristband||0)+1;setTimeout(()=>toast('Souvenir','You kept your festival wristband. It is in your bag.','good'),900);}return r;};}

/* ================= PARTIES: the same parties for everybody ================= */
const HOSTS3=['Kunle (200L)','Big Dayo (400L)','Rita (300L)','The Law Students','Jay Cutz (300L)'];
{const _ap=announceParty;announceParty=function(o){if(!o||!(o.uni||o.mine||o.host||o.forced))return;return _ap.apply(this,arguments);};}
function uniParty(){const ud=uDayNow(),w=wd(S.t);const h=((ud*2654435761)>>>0)%100;const on=((w===4||w===5)&&h<75)||(w===2&&h<30)||(w===5&&h<90)||h<8;
  if(on&&!(S.oparty&&S.oparty.uday===ud))announceParty({uni:1,uday:ud,loc:PARTY_SPOTS[h%PARTY_SPOTS.length],host:HOSTS3[h%HOSTS3.length]});}
HOOKS.day.push(()=>setTimeout(()=>{try{if(S&&!S.over&&!S.captive)uniParty();}catch(e){}},3000));HOOKS.boot.push(()=>setTimeout(()=>{try{if(S&&!S.over&&!S.intro)uniParty();}catch(e){}},6000));

/* ================= CLUB VIBEZ (Bwari Junction, 9 PM – 4 AM, 18+) ================= */
PLACE_CAT.push(['Nightlife',['club']],['Houses to buy or rent',['prop1','prop2','prop3','prop4']]);
{const _io=isOpen;isOpen=function(id){if(id==='club'){const h=minOf(S.t)/60;return h>=21||h<4;}return _io.apply(this,arguments);};}
BUILD.club=function(I,id){shell(I,16,12,5,floorTex('#1a1424','#120e1a','tile'),0x1d1b2e,5.6,0x7a1f4a);
  poster(I,0,0,3.6,[['CLUB VIBEZ','800 34px sans-serif'],['Afrobeats · Amapiano · Every night','600 18px sans-serif']],'#140a1c','#ff3d8a',5,1.1);
  I.disco=[];const floor=new THREE.Group();I.g.add(floor);for(let i=-2;i<=2;i++)for(let j=-1;j<=1;j++){const t=part(G.box,0x2a1a3a,1.5,0.06,1.5,i*1.6,0.04,j*1.6-0.5,floor,false);t.material=t.material.clone();I.disco.push(t);}
  I.party=()=>{const h=minOf(S.t)/60;return h>=21||h<4;};
  const booth=new THREE.Group();booth.position.set(0,0,-4.6);I.g.add(booth);part(G.box,0x111111,3.2,1.2,1.0,0,0.6,0,booth);part(G.box,0x00d8ff,3.0,0.06,0.8,0,1.22,0,booth,false);
  I.dj=interiorSim(I,{skin:0x3a2416,shirt:0x111111,pants:0x222222,hairStyle:'twists',hair:5.6,cap:null},'dj');
  const bar=new THREE.Group();bar.position.set(-6.2,0,1.5);I.g.add(bar);part(G.box,0x3a2a1e,1.2,1.15,5,0,0.58,0,bar);part(G.box,0x7a5a3a,1.3,0.06,5.1,0,1.17,0,bar,false);
  addObj(I,floor,{id:'floor',name:'Dance floor',ly:2.2,spot:{x:0,z:0.6},acts:()=>[A('Dance','20 min · fun, social, energy',()=>startAction('Dancing at Club Vibez',20,{where:id,place:{x:rnd(-2.5,2.5),y:0,z:rnd(-1.5,0.5),r:Math.PI,pose:'dance'},per:()=>{N('fun',1.2);N('social',1.0);N('energy',-0.35);N('hygiene',-0.15);N('stress',-0.3);},done:()=>{S.rep=(S.rep||0)+1;S.skills.street=(S.skills.street||0)+0.03;addMoodlet('Owned the dance floor',10,600);toast('Club Vibez','The DJ shouts your name. Your rep goes up.','good');}})),
    A('Watch the crowd','10 min',()=>startAction('Watching the crowd',10,{where:id,per:()=>{N('social',0.4);N('fun',0.3);}}))]});
  addObj(I,bar,{id:'bar',name:'Bar',ly:2.4,spot:{x:-4.8,z:1.5},acts:()=>[A('Chapman (₦1,500)','Non-alcoholic · refreshing',()=>{if(!spend(1500,'Chapman at Club Vibez'))return toast('Not enough money','','bad');N('food',6);N('fun',6);N('bladder',-12);toast('Bar','Ice cold. Perfect.','good');}),
    A('Water (₦300)','Stay hydrated',()=>{if(!spend(300,'Water at Club Vibez'))return;N('bladder',-8);N('energy',3);}),A('Small chops (₦2,500)','10 min · eat something',()=>{if(!spend(2500,'Small chops at Club Vibez'))return toast('Not enough money','','bad');startAction('Eating small chops',10,{where:id,per:()=>N('food',2.5)});})]});
  addObj(I,booth,{id:'dj',name:'DJ booth',ly:2.8,spot:{x:0,z:-3.2},acts:()=>[A('Request a song (₦2,000)','The crowd goes mad if it slaps',()=>{if(!spend(2000,'Song request'))return;S.rep=(S.rep||0)+1;N('fun',10);toast('DJ','"This one is for '+S.name+'!"','good');})]});
  I.populate=()=>{resetInt(I);const on=I.party();if(on)placeSim(I.dj,0,-4.9,0,'dance',0);};};
{const _eb=enterBuilding;enterBuilding=function(id,then){const L=LOCS[id];
  if(id==='club'&&!S.inside&&!then&&!W.fading){if(!mature())return toast('Club Vibez','18+ only. The bouncer shakes his head.','bad');if(!isOpen('club'))return toast('Club Vibez','Opens at 9 PM.','bad');
    if(S.flags.clubPaid!==dayOf(S.t)-(minOf(S.t)<4*60?1:0)){return dialog({who:'security',kicker:'Club Vibez · door',text:'"Cover is ₦3,000. No fighting, no trouble. Enjoy yourself."',choices:[{t:'Pay ₦3,000 and go in',fn:()=>{if(!spend(3000,'Club Vibez cover charge'))return 'You don\'t have ₦3,000.';S.flags.clubPaid=dayOf(S.t)-(minOf(S.t)<4*60?1:0);setTimeout(()=>enterBuilding('club'),300);return null;}},{t:'Not tonight',fn:()=>null}]});}}
  if(L&&L.prop&&!S.inside&&!W.fading){const pr=propInfo(id);/* your home, or a viewing of one that is for sale or rent; other people's homes are private */
    if(pr&&!pr.mine&&(pr.tenant||(pr.owner&&!pr.listed)))return toast(L.name,'Private home. It belongs to '+(pr.tenantName||pr.ownerName||'another player')+'.','bad');}
  return _eb.apply(this,arguments);};}

/* ================= HOUSES AND APARTMENTS: buy or rent (the server keeps one owner/tenant) ================= */
const PROP_IDS=['prop1','prop2','prop3','prop4'];
function propsFetch(){if(!wsend({t:'prop_list'}))W3.props=null;}
function propInfo(id){return W3.props&&W3.props.list.find(p=>p.id===id);}
function propMine(id){const p=propInfo(id);return !!p&&(p.mine==='owner'||p.mine==='tenant');}
onNet(m=>{if(m.t==='prop_list'){W3.props=m;if(UI.phone&&phoneView==='houses')renderPhone();}
  else if(m.t==='prop_res'){const P0=W3.pend[m.ref];delete W3.pend[m.ref];
    if(m.ok){if(m.amount&&m.ref)applyCharge(m.ref,m.amount,m.kind==='buy'?'Bought '+LOCS[m.id].name:m.kind==='renew'?'Rent renewal · '+LOCS[m.id].name:'Rent + deposit · '+LOCS[m.id].name);
      toast(LOCS[m.id]?LOCS[m.id].name:'Property',m.kind==='buy'?'It is yours. The keys are in your pocket.':m.kind==='rent'?'Lease signed until shared Day '+m.until+'. Move in!':m.kind==='renew'?'Rent paid. Lease runs to shared Day '+m.until+'.':m.kind==='leave'?'You moved out.':m.kind==='listing'?(m.listed?'Listed for rent at '+naira(m.rent)+'.':'Taken off the rental market.'):'Done.','good');checkGoals();}
    else toast('Property',m.reason||'Try again.','bad');propsFetch();}});
HOOKS.boot.push(()=>setTimeout(propsFetch,3500));HOOKS.day.push(()=>propsFetch());
HOOKS.apps.push(()=>[['houses','Houses','#6b4a2f','⌂']]);
HOOKS.views.houses=(b,T)=>{T.textContent='Houses & apartments';if(!net()){b.append(el('div','note','Houses outside school are part of the online game. Log in to buy or rent one.'));return;}
  const D=W3.props;if(!D){b.append(el('div','note','Loading listings…'));propsFetch();return;}
  b.append(el('div','note','Bwari Junction, outside the Main Gate. One owner and one tenant at a time. Rent is for '+D.lease+' shared days, plus a deposit the first time. Miss a renewal by more than '+D.grace+' day and the lease ends.'));
  D.list.forEach(p=>{const L=LOCS[p.id];const left=p.until?p.until-D.uday:0;const card=el('div','bgcard','<b>'+esc(p.name)+'</b><div class="note">'+p.kind+' · '+p.beds+' bed'+(p.beds>1?'s':'')+' · '+'★'.repeat(p.tier)+'<br>Price '+naira(p.price)+' · Rent '+naira(p.rentSet)+' / '+D.lease+' days · deposit '+naira(p.deposit)+'<br>'+
      (p.mine==='owner'?'<b style="color:var(--good)">You own it</b>'+(p.tenant?' · tenant: '+esc(p.tenantName):p.listed?' · listed for rent':''):p.mine==='tenant'?'<b style="color:var(--good)">You rent it</b> · '+(left>=0?left+' day'+(left===1?'':'s')+' left':'<b style="color:var(--bad)">rent overdue</b>'):p.owner?'Owned by '+esc(p.ownerName)+(p.tenant?' · rented':p.listed?' · for rent':' · not available'):p.tenant?'Rented by '+esc(p.tenantName):'Available')+'</div>');
    const row=el('div','btnrow');const bt=(t,fn,dis)=>{const x=el('button',null,t);if(dis){x.disabled=true;x.title=dis;}x.onclick=fn;row.append(x);};
    const go=()=>{closePhone();goTo(p.id,'walk',()=>enterBuilding(p.id));};
    if(p.mine)bt('Go home',go);else if(!p.tenant&&(!p.owner||p.listed))bt('Go and view it',go);
    const buy=()=>{if(S.money<p.price)return toast('Not enough money','You need '+naira(p.price)+'.','bad');dialog({who:'me',kicker:'Buy '+p.name,text:'Pay <b>'+naira(p.price)+'</b>? Your wallet after: '+naira(S.money-p.price)+'.',choices:[{t:'Buy it',fn:()=>{const ref=newRef('p');W3.pend[ref]=1;wsendPaid({t:'prop_buy',id:p.id,ref,bal:S.money});return 'Sending the payment…';}},{t:'Cancel',fn:()=>null}]});};
    const rent=renew=>{const amt=renew?p.rentSet:p.rentSet+p.deposit;if(S.money<amt)return toast('Not enough money','You need '+naira(amt)+'.','bad');dialog({who:'me',kicker:(renew?'Renew lease · ':'Rent ')+p.name,text:'Pay <b>'+naira(amt)+'</b>'+(renew?' for another '+D.lease+' days':' (rent '+naira(p.rentSet)+' + deposit '+naira(p.deposit)+') for '+D.lease+' days')+'?',choices:[{t:'Pay',fn:()=>{const ref=newRef('r');W3.pend[ref]=1;wsendPaid({t:'prop_rent',id:p.id,ref,bal:S.money});return 'Sending the payment…';}},{t:'Cancel',fn:()=>null}]});};
    if(!p.owner&&!p.tenant)bt('Buy',buy);if(!p.tenant&&(!p.owner||p.listed)&&p.mine!=='owner')bt('Rent',()=>rent(false));
    if(p.mine==='tenant'){bt('Pay rent',()=>rent(true));bt('Move out',()=>{wsend({t:'prop_leave',id:p.id});});}
    if(p.mine==='owner')bt(p.listed?'Stop renting it out':'Rent it out',()=>wsend({t:'prop_listing',id:p.id,listed:!p.listed}));
    card.append(row);b.append(card);});};
HOOKS.todo.push(o=>{if(!W3.props)return;W3.props.list.filter(p=>p.mine==='tenant'&&p.until-W3.props.uday<=1).forEach(p=>o.push({t:'⌂ Rent for '+p.name+' due · '+naira(p.rentSet),loc:p.id,c:'urgent'}));});
/* inside a house: bed, kitchen, bathroom, sofa, wardrobe; owners and tenants get everything, viewers can look around */
BUILD.home3=function(I,id){const L=LOCS[id];const tier=({prop1:1,prop2:2,prop3:3,prop4:1})[id]||1;
  shell(I,14,11,4.6,floorTex(tier>1?'#c9a77a':'#d8cdb8',tier>1?'#b8925f':'#c7bba3','wood'),0xefe6d6,4.4,0x6b4a2e);I.walls.forEach(w=>{w.grp.children[0].material=w.grp.children[0].material.clone();});
  const bed=new THREE.Group();bed.position.set(-4.4,0,-3.4);I.g.add(bed);part(G.box,0x5a3d26,2.2,0.5,3.0,0,0.25,0,bed);part(G.box,tier>1?0x2f4f7a:0xd9d2c0,2.0,0.25,2.6,0,0.62,0.1,bed,false);part(G.box,0xf2efe6,1.6,0.18,0.5,0,0.8,-1.1,bed,false);
  const bp={x:-4.4,y:0.75,z:-3.2,r:0,pose:'lie'};
  addObj(I,bed,{id:'bed',name:'Bed',ly:2.4,spot:{x:-2.6,z:-2.2},acts:()=>propMine(id)?[A('Sleep','30 min · your own bed',()=>startAction('Sleeping',480,{sleep:true,where:id,place:bp,done:()=>{addMoodlet('Slept at home',8+tier*2,600);toast('Home','You wake up in your own bed. Nobody banging buckets.','good');}})),A('Nap','10 min',()=>startAction('Napping',120,{sleep:true,where:id,place:bp}))]:[A('Bed','Viewing only',()=>{},{dis:'Buy or rent to use it'})]});
  const kit=new THREE.Group();kit.position.set(4.6,0,-4.2);I.g.add(kit);part(G.box,0xd9d2c0,3.6,1.0,0.8,0,0.5,0,kit);part(G.box,0x333333,0.8,0.06,0.6,-0.8,1.03,0,kit,false);part(G.box,0xf2f2f2,0.8,1.8,0.7,1.5,0.9,0.05,kit);
  addObj(I,kit,{id:'kitchen',name:'Kitchen',ly:2.6,spot:{x:4.2,z:-2.6},acts:()=>propMine(id)?[A('Cook jollof rice (₦1,500)','15 min · big meal',()=>{if(!spend(1500,'Groceries'))return toast('Not enough money','','bad');startAction('Cooking jollof rice',45,{where:id,per:()=>{N('food',1.6);N('fun',0.2);},done:()=>{N('food',25);addMoodlet('Home-cooked food',8,480);toast('Kitchen','Party jollof. At home.','good');}});}),
      A('Make noodles (₦600)','10 min · quick',()=>{if(!spend(600,'Noodles'))return;startAction('Eating noodles',15,{where:id,per:()=>N('food',2.2)});})]:[A('Kitchen','Viewing only',()=>{},{dis:'Buy or rent to use it'})]});
  const bath=new THREE.Group();bath.position.set(5.2,0,2.6);I.g.add(bath);part(G.box,0xbfd7e0,0.08,2.6,3.2,-1.3,1.3,0,bath,false);part(G.box,0xf6f8f8,1.1,0.55,2.0,0.3,0.28,0,bath);part(G.box,0xf6f8f8,0.6,0.42,0.7,0.3,0.21,1.3,bath);
  addObj(I,bath,{id:'bath',name:'Bathroom',ly:2.6,spot:{x:3.4,z:2.6},acts:()=>propMine(id)?[A('Take a bath','12 min · hygiene full',()=>wcAct('Bath at home',20,{hygiene:100,stress:-10,energy:3})),A('Shower','8 min',()=>wcAct('Shower at home',8,{hygiene:60})),A('Toilet','3 min',()=>wcAct('Toilet · at home',3,{bladder:100}))]:[A('Bathroom','Viewing only',()=>{},{dis:'Buy or rent to use it'})]});
  const sofa=new THREE.Group();sofa.position.set(-1,0,2.6);I.g.add(sofa);part(G.box,tier>1?0x6b2f3a:0x4a5a6a,3.2,0.5,1.0,0,0.35,0,sofa);part(G.box,tier>1?0x6b2f3a:0x4a5a6a,3.2,0.8,0.3,0,0.75,0.45,sofa,false);part(G.box,0x111111,1.8,1.0,0.1,0,1.6,-3.8,sofa,false);
  addObj(I,sofa,{id:'sofa',name:'Sofa & TV',ly:2.4,spot:{x:-1,z:1.2},acts:()=>propMine(id)?[A('Watch TV','20 min · fun',()=>startAction('Watching TV at home',30,{where:id,place:{x:-1,y:0.2,z:2.4,r:Math.PI,pose:'sit'},per:()=>{N('fun',0.8);N('stress',-0.3);}})),
      A('Have friends over','15 min · social · invite players from the Players app',()=>startAction('Hanging out at home',30,{where:id,place:{x:-1.5,y:0.2,z:2.4,r:Math.PI,pose:'sittalk'},per:()=>{N('social',1.0);N('fun',0.6);}}))]:[A('Sofa','Viewing only',()=>{},{dis:'Buy or rent to use it'})]});
  const ward=new THREE.Group();ward.position.set(-6.2,0,1.0);I.g.add(ward);part(G.box,0x7b5636,0.7,2.4,1.8,0,1.2,0,ward);
  addObj(I,ward,{id:'wardrobe',name:'Wardrobe & storage',ly:3,spot:{x:-5,z:1},acts:()=>{if(!propMine(id))return [A('Wardrobe','Viewing only',()=>{},{dis:'Buy or rent to use it'})];S.store=S.store||{};const st=S.store[id]=S.store[id]||{};const L2=[];
      for(const k in ITEMS){if(k==='phone')continue;if(invCount(k)>0)L2.push(A('Store: '+ITEMS[k].n,'Keep it safe at home',()=>{invTake(k);st[k]=(st[k]||0)+1;save();toast('Stored',ITEMS[k].n+' is in your wardrobe.');}));if(st[k])L2.push(A('Take: '+ITEMS[k].n+(st[k]>1?' ×'+st[k]:''),'From your wardrobe',()=>{st[k]--;if(!st[k])delete st[k];invGive(k);save();toast('Taken',ITEMS[k].n+' is in your bag.');}));}
      return L2.length?L2:[A('Empty','Nothing to store',()=>{},{dis:'Empty'})];}});
  const deco=new THREE.Group();deco.position.set(0,0,-5.2);I.g.add(deco);part(G.box,0xe3b04b,1.4,1.0,0.06,0,2.2,0,deco,false);
  addObj(I,deco,{id:'decor',name:'Decorate',ly:3.2,spot:{x:0,z:-3.6},acts:()=>propMine(id)?[['Cream',0xefe6d6],['Sky blue',0xcfe3ef],['Sage',0xd5e2cf],['Terracotta',0xe7c6b0],['Lilac',0xe0d4ef]].map(([n,c])=>A('Paint the walls '+n.toLowerCase(),'Free · saved with your home',()=>{S.homeDeco=S.homeDeco||{};S.homeDeco[id]={wall:c};I.populate();save();toast('Decorated','Fresh '+n.toLowerCase()+' walls.','good');})):[A('Decorate','Owners and tenants only',()=>{},{dis:'Buy or rent first'})]});
  I.populate=()=>{resetInt(I);const c=S.homeDeco&&S.homeDeco[id]&&S.homeDeco[id].wall;if(c!=null)I.walls.forEach(w=>{const m=w.grp.children[0];if(m&&m.material&&m.material.color)m.material.color.setHex(c);});};};
/* work that was set while you were away (the shared clock moved on) is not held against you */
function excuseMissed(){try{const A0=acad(),d=dayOf(S.t);A0.asg.forEach(a=>{if((a.st==='open'||a.st==='ready')&&a.due<d)a.st='excused';});}catch(e){}}
{const _ss=syncStart;syncStart=function(){const r=_ss.apply(this,arguments);excuseMissed();return r;};}
{const _jt=jumpTo;jumpTo=function(){const r=_jt.apply(this,arguments);excuseMissed();return r;};}
/* the Create Player form never starts with an empty name */
{const b=$('#btnStart');if(b)b.addEventListener('click',e=>{const n=$('#inName');if(n&&!n.value.trim()){e.stopImmediatePropagation();e.preventDefault();n.focus();toast('Your name','Type your character\'s name first.','bad');}},true);}
if(window.__QA)window.__VLRAW={startAction:(...a)=>startAction(...a),callKeke:(...a)=>callKeke(...a),save:()=>save(),openPhone:(...a)=>openPhone(...a),setPhone:(...a)=>setPhone(...a),closePhone:()=>closePhone(),enterBuilding:(...a)=>enterBuilding(...a),concertSet:c=>concertSet(c),snapState:()=>snapState(),get player(){return player;}};
if(window.__QA)window.__W3={W3,actKind,dropItem,pickItem,invCount,roomSheet,roomActs:(...a)=>roomActs(...a),courseRow,workAssignment,submitAssignment,acad,ticketSheet:()=>ticketSheet(),uniParty,propsFetch,cancelRide,drawDrops};
