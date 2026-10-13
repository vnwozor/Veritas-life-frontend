/* ================= LIFE 3 =================
   - One clock for everybody: every player sees the same time and weekday. One game hour = 2 real minutes.
   - Attending a class works from the To-do, the building sheet or a big button inside the right block.
   - Community Mass is at 12 noon. Parties off campus: ask for permission or bribe your way out.
   - Only staff are on campus (lecturers, security, Mr. Paulinus, Father Philani, vendors, cafe staff…);
     the other students are real players.
   - Every building has a restroom: pee, use the toilet, bath, wash your hands.
   - A MY ROOM sign above your door in the hostel corridor.
   - Sound starts on iPhone too; two-finger twist and drag move the camera; Messages lists real players. */

/* ---------- one clock for everybody ---------- */
const CLK={off:0,ok:false,MS:2000};/* 2000 ms per game minute: 1 game hour = 2 real minutes */
(async()=>{try{const t0=Date.now();const r=await fetch('/online.js?clock='+t0,{method:'HEAD',cache:'no-store'});const d=r.headers.get('Date');const t1=Date.now();if(d){const srv=Date.parse(d)+500;if(isFinite(srv))CLK.off=srv-(t0+t1)/2;}}catch(e){}CLK.ok=true;})();
function uNow(){return (Date.now()+CLK.off)/CLK.MS;}
function clockReady(){return S&&!S.over&&!S.intro&&!S.captive&&CLK.ok;}
/* classes and Masses that ended while you were away don't count against you */
function markPast(){const m=minOf(S.t);const T=S.today;if(!T)return;(T.classes||[]).forEach(c=>{if(c.st==='pending'&&c.end<=m)c.st='off';});(T.masses||[]).forEach(x=>{if(x.st==='pending'&&x.end<=m)x.st='off';});}
function syncStart(){const U=Math.floor(uNow()),wk=10080;const uMod=((U%wk)+wk)%wk,sMod=((S.t%wk)+wk)%wk;const delta=(uMod-sMod+wk)%wk;const d0=dayOf(S.t);
  S.t+=delta;S.tOff=U-S.t;if(dayOf(S.t)!==d0){newDay();}markPast();
  if(delta>30)setTimeout(()=>{if(S)toast('Campus time','Everyone at Veritas shares one clock now. It is '+DAYS[wd(S.t)]+' '+fmtTime(S.t)+'. One hour of game time is 2 real minutes.');},800);}
function jumpTo(target){const gap=target-S.t;const d0=dayOf(S.t);S.t=target;if(dayOf(S.t)!==d0)newDay();markPast();
  if(ACT){if(ACT.sleep)N('energy',Math.min(100,gap*0.2));ACT.left=Math.max(1,ACT.left-gap);}
  if(gap>60)toast('Welcome back','It is now '+DAYS[wd(S.t)]+' '+fmtTime(S.t)+', Day '+dayOf(S.t)+'. Campus life went on while you were away.');}
HOOKS.frame.push(()=>{try{if(!S||S.over)return;if(S.tOff!=null)tAcc=-1e12;/* the game's own fast clock is off */
  if(!clockReady()||CS.on||W.fading)return;
  if(S.tOff==null){syncStart();tAcc=-1e12;return;}
  W.userPause=false;const target=Math.floor(uNow()-S.tOff);
  if(S.t>target){/* something skipped time ahead (a "30 minutes" chat…): the shared clock wins */const d0=dayOf(S.t);S.t=target;if(dayOf(S.t)!==d0){newDay();markPast();}return;}
  const gap=target-S.t;if(gap>120){jumpTo(target);return;}
  let g=0;while(S.t<target&&g++<120){tickMinute();if(S.over)break;}}catch(e){console.error(e);}});
/* no speed buttons any more: the clock is the same for everyone */
{const st=document.createElement('style');st.textContent='#speed button[data-s]{display:none!important}';document.head.appendChild(st);}
HOOKS.boot.push(()=>{W.userPause=false;W.speed=1;});

/* ---------- attending classes ---------- */
/* you can still sit in until 10 minutes before the end (late, but counted) */
curClass=function(){const m=minOf(S.t);const here=S.inside&&LOCS[S.inside]&&LOCS[S.inside].block?S.inside:null;return S.today.classes.find(c=>c.st==='pending'&&m>=c.start-30&&m<c.end-10&&(!here||(c.loc||'lecture')===here));};
function findAct(prefix){try{const I=getInt(S.inside);for(const o of I.objs){if(!o.acts)continue;const a=(o.acts()||[]).find(x=>x&&x.label&&x.label.startsWith(prefix));if(a)return a;}}catch(e){}return null;}
function attendNow(kind,c){if(!S||!c)return;const m=minOf(S.t);const loc=kind==='mass'?'chapel':(c.loc||'lecture');const name=kind==='mass'?c.kind:c.code;
  if(c.st==='attended')return toast(name,'Already done. Attendance recorded.','good');
  if(c.st==='attending')return toast(name,'You are already in it.');
  if(c.st!=='pending'||m>=c.end-(kind==='mass'?5:10))return toast(name,'Too late: it is over or nearly over.','bad');
  if(S.inside!==loc){if(W.drive)return toast('Driving','Park and get out first.');closeSheet&&UI.sheet&&closeSheet();if(UI.phone)closePhone();
    toast('On your way',name+' · '+fx(LOCS[loc].name)+' · '+fmtTime(c.start));goTo(loc,'walk',()=>enterBuilding(loc,()=>setTimeout(()=>attendNow(kind,c),500)));return;}
  if(m<c.start-30)return toast('Early',name+' starts at '+fmtTime(c.start)+'. Come back to your seat from '+fmtTime(c.start-30)+'.');
  const a=findAct('Attend '+name);if(a&&!a.dis&&a.fn){if(UI.sheet)closeSheet();a.fn();return;}
  toast(name,'Find a seat: tap the seats in the hall.');}
function nextDue(){if(!S||!S.today)return null;const m=minOf(S.t);const c=S.today.classes.find(x=>x.st==='pending'&&m>=x.start-60&&m<x.end-10);if(c)return {kind:'class',c,loc:c.loc||'lecture',name:c.code};
  const ms=S.today.masses.find(x=>x.st==='pending'&&m>=x.start-60&&m<x.end-5);if(ms)return {kind:'mass',c:ms,loc:'chapel',name:ms.kind};return null;}
/* the place sheet gets a big "Attend now" button when a class or Mass is on there */
{const _ol=openLoc;openLoc=function(id){const r=_ol.apply(this,arguments);try{const n=nextDue();if(n&&n.loc===id&&UI.sheet){const box=$('#shB');const b=el('button','opt l3att','<div class="l"><b>🎓 '+(S.inside===id?'Attend ':'Go and attend ')+esc(n.name)+'</b><span>'+fmtTime(n.c.start)+' – '+fmtTime(n.c.end)+(S.inside===id?' · take a seat now':' · walks you there and sits you down')+'</span></div>');b.onclick=()=>{closeSheet();attendNow(n.kind,n.c);};box.prepend(b);}}catch(e){}return r;};}

/* ---------- Community Mass at 12 noon ---------- */
function massFix(){try{(S.today&&S.today.masses||[]).forEach(x=>{if(x.kind==='Department Mass'){x.kind='Community Mass';x.start=720;x.end=780;}});}catch(e){}}
HOOKS.day.push(()=>massFix());HOOKS.boot.push(()=>massFix());
{const _A=A;A=function(label,info,fn,o){if(typeof info==='string')info=info.replace('Wednesday 5:00 PM','Wednesday 12:00 PM (Community Mass)');return _A(label,info,fn,o);};}
{const _rp=renderPhone;renderPhone=function(){const r=_rp.apply(this,arguments);try{const b=$('#pBody');if(b&&/Department Mass/.test(b.textContent)){const w=document.createTreeWalker(b,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.nodeValue.includes('Department Mass')){n.nodeValue=n.nodeValue.replace(/Department Mass/g,'Community Mass');const row=n.parentNode&&n.parentNode.closest?n.parentNode.closest('.txrow,div'):null;if(row)row.querySelectorAll('*').forEach(e=>{if(e.childNodes.length===1&&e.firstChild.nodeType===3&&e.textContent.trim()===fmtTime(1020))e.textContent=fmtTime(720);});}}}catch(e){}return r;};}

/* ---------- parties outside school ---------- */
HOOKS.day.push((d,w)=>{setTimeout(()=>{try{if(!S||S.over||S.captive)return;if(S.oparty&&S.oparty.day===dayOf(S.t))return;const p=w===4||w===5?0.7:w===2?0.3:0.12;if(d>=2&&chance(p))announceParty();}catch(e){}},5000);});
function partyPermission(){const p=S.oparty;const d=dayOf(S.t);if(!p)return;
  dialog({who:'paulinus',kicker:'Night exeat for a party',text:'"A party? At '+esc(fx(LOCS[p.loc].name))+', at night? Your parent must call this office."',choices:[
    {t:'Call Mum so she can approve it',fn:()=>{const ok=(S.rel.mum||0)>=50&&S.discipline<6&&S.suspicion<50&&chance(.65);
      if(ok){S.flags.partyPass=d;S.flags.exeat=d;msg('mum','I spoke to the hostel office. Enjoy yourself, but be careful and come back early!');return '"Sign here. Back before 2 AM." Permission granted: the gate lets you out and back in tonight.';}
      msg('mum','A party?! At night?! No. Read your books.');setTimeout(refusedExeat,250);return '"Your mother said no. Case closed."';}},
    {t:'Never mind',fn:()=>null}]});}
{const _ap=announceParty;announceParty=function(o){const r=_ap.apply(this,arguments);try{const p=S.oparty;if(p&&!p.mine)setTimeout(()=>{if(!S||S.over||CS.on)return;
    dialog({who:'kunle',kicker:'🎉 Party tonight · '+fx(LOCS[p.loc].name),text:'"'+esc(p.host)+' is throwing a party off campus from '+fmtTime(p.start)+'. To leave school you get permission from the Hostel Office, or you settle the man at the gate."',choices:[
      {t:'Ask for permission (night exeat)',fn:()=>{setTimeout(partyPermission,250);return null;}},
      {t:'I\'ll bribe my way out at the gate',fn:()=>{S.flags.partyBribe=dayOf(S.t);return 'Bring ₦2,000 for the gate officer, or ₦5,000 for Officer Tiger. If it goes wrong, it goes on your record.';}},
      {t:'Not going',fn:()=>null}]});},1800);}catch(e){}return r;};}
{const _gw=gateWhy;gateWhy=function(side){try{const d=dayOf(S.t),ps=S.flags.partyPass;if(ps&&(ps===d||(ps===d-1&&minOf(S.t)<6*60)))return null;}catch(e){}return _gw.apply(this,arguments);};}
HOOKS.todo.push(o=>{const p=S.oparty;if(!p||p.mine||p.went)return;const d=dayOf(S.t),m=minOf(S.t);if(p.day!==d||m>=p.end)return;const ok=S.flags.partyPass===d||hasExeat();
  o.push({t:'🎉 Party · '+fx(LOCS[p.loc].name)+' · '+fmtTime(p.start)+(ok?' · permission ✓':' · get permission or bribe the gate'),loc:p.loc,c:m>=p.start-60?'urgent':''});});
/* classes and Masses you were away for don't show in the To-do */
HOOKS.todo.push(o=>{try{const off=[...(S.today.classes||[]).filter(c=>c.st==='off').map(c=>'Attend '+c.code),...(S.today.masses||[]).filter(x=>x.st==='off').map(x=>x.kind)];
  for(let i=o.length-1;i>=0;i--)if(off.some(s=>o[i].t&&o[i].t.startsWith(s)))o.splice(i,1);}catch(e){}});

/* ---------- only staff on campus: the other students are real players ---------- */
const NOT_STAFF=new Set(['student','mate','cast']);
function studentRole(r){const k=r&&r.role;if(!k)return false;if(k==='student'||k==='amina')return true;try{if(MATES.includes(k))return true;}catch(e){}try{if(typeof CAST!=='undefined'&&CAST[k])return true;}catch(e){}return false;}
{const _ps=placeSim;placeSim=function(r){const out=_ps.apply(this,arguments);if(studentRole(r)&&r.g)r.g.visible=false;return out;};}
HOOKS.populate.push(I=>{try{I.sims.forEach(r=>{if(studentRole(r))r.g.visible=false;});}catch(e){}});
HOOKS.frame.push(()=>{try{if(CS.on)return;for(const n of npcs){if(!NOT_STAFF.has(n.kind))continue;n.hidden=true;n.idle=1e12;if(n.g.parent){n.g.parent.remove(n.g);const i=pickables.indexOf(n.g);if(i>=0)pickables.splice(i,1);}}}catch(e){}});

/* ---------- restrooms in every building ---------- */
BUILD.restroom=function(I,id){shell(I,12,8,4.2,floorTex('#dfe7ea','#cdd6d9','tile'),0xf0f4f3,4.2,0x2f6b8a);
  poster(I,0,0,3.5,[['RESTROOM','800 30px sans-serif'],['Keep it clean','600 18px sans-serif']],'#2f6b8a','#f2f6f8',3.2,0.9);
  /* three toilet cubicles */
  const cub=new THREE.Group();I.g.add(cub);
  [-4.6,-2.6,-0.6].forEach(x=>{part(G.box,0x3a6b8a,0.08,2.3,2.2,x-1,1.15,-2.9,cub,false);part(G.box,0xf6f8f8,0.62,0.42,0.7,x,0.21,-3.4,cub);part(G.box,0xf6f8f8,0.6,0.62,0.24,x,0.72,-3.82,cub,false);part(G.box,0x7a8a90,0.5,0.04,0.55,x,0.44,-3.35,cub,false);});
  part(G.box,0x3a6b8a,0.08,2.3,2.2,0.4,1.15,-2.9,cub,false);
  addObj(I,cub,{id:'toilets',name:'Toilets',ly:2.8,spot:{x:-2.6,z:-1.2},acts:()=>[
    A('Pee','2 minutes · empties your bladder',()=>wcAct('Toilet · peeing',2,{bladder:100})),
    A('Use the toilet','8 minutes · long call',()=>wcAct('Toilet · long call',8,{bladder:100,hygiene:-2,mood:['Relieved',6,240]})),
    A('Wash your hands','1 minute',()=>wcAct('Washing your hands',1,{hygiene:3}))]});
  /* two shower cubicles */
  const sh=new THREE.Group();I.g.add(sh);
  [3.2,5.0].forEach(x=>{part(G.box,0xbfd7e0,1.6,2.4,0.06,x,1.2,-3.95,sh,false);part(G.box,0x9aa8ad,0.06,0.06,0.6,x,2.3,-3.7,sh,false);part(G.box,0xd0d6d8,0.3,0.06,0.3,x,2.27,-3.4,sh,false);part(G.box,0x2f8a8a,0.04,2.0,1.8,x-0.85,1.3,-3.1,sh,false);part(G.box,0xc9d4d8,1.6,0.06,1.6,x,0.03,-3.15,sh,false);});
  addObj(I,sh,{id:'showers',name:'Showers',ly:2.8,spot:{x:4.1,z:-1.4},acts:()=>[
    A('Take a bath','20 minutes · hygiene full, stress down',()=>wcAct('Bath in the restroom',20,{hygiene:100,stress:-8,energy:3})),
    A('Quick shower','8 minutes',()=>wcAct('Quick shower',8,{hygiene:55,stress:-3}))]});
  /* sinks and a mirror */
  const sk=new THREE.Group();I.g.add(sk);[-5.6].forEach(x=>{[-0.6,0.9].forEach(z=>{part(G.box,0xf6f8f8,0.6,0.16,0.7,x+0.25,0.95,z,sk);part(G.box,0x8a959a,0.08,0.95,0.08,x+0.25,0.47,z,sk,false);});part(G.box,0xcfe3ea,0.04,1.0,2.4,x-0.1,1.9,0.15,sk,false);});
  addObj(I,sk,{id:'sinks',name:'Sinks',ly:2.6,spot:{x:-4.4,z:0.2},acts:()=>[A('Wash your face and hands','2 minutes',()=>wcAct('Washing up',2,{hygiene:6,energy:1}))]});
  /* urinals (men's side only) */
  if(!isF()){const ur=new THREE.Group();I.g.add(ur);[1.4,2.4].forEach(z=>{part(G.box,0xf6f8f8,0.28,0.7,0.42,5.8,1.0,z,ur);});addObj(I,ur,{id:'urinals',name:'Urinals',ly:2.4,spot:{x:4.8,z:1.9},acts:()=>[A('Pee','1 minute',()=>wcAct('Toilet · urinal',1,{bladder:100}))]});}
  I.populate=()=>{resetInt(I);};};
function wcAct(label,mins,o){if(ACT)stopAction(true);sfx('door');
  startAction(label,mins,{where:S.inside,hide:true,per:()=>{if(o.bladder)N('bladder',100/mins);if(o.hygiene>0)N('hygiene',o.hygiene/mins);if(o.stress)N('stress',o.stress/mins);if(o.energy)N('energy',o.energy/mins);},
    done:()=>{if(o.bladder)N('bladder',100);if(o.hygiene<0)N('hygiene',o.hygiene);if(o.hygiene>=100)N('hygiene',100);if(o.mood)addMoodlet(o.mood[0],o.mood[1],o.mood[2]);toast(label.replace('Toilet · ',''),pick(['Done. Much better.','All good. Wash your hands!','Fresh.']),'good');}});}
function wcOk(){const id=S&&S.inside;if(!id||!LOCS[id]||LOCS[id].wc)return false;return true;}
function goRestroom(){if(!wcOk())return;const B=S.inside;const id='wc_'+B;const L0=LOCS[B];
  if(!LOCS[id])vloc(id,{of:B,name:L0.name,iname:'Restroom',inside:'restroom',upOf:B,wc:true,zone:L0.zone,leaveTxt:'Back to '+(L0.iname||fx(L0.name))});
  LOCS[id].downSpawn={x:P.x,z:P.z};goInt(id);}
/* the Restroom button (bottom left) whenever you are inside a building */
{const st=document.createElement('style');st.textContent='#l3bar{position:absolute;left:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 136px);z-index:21;display:flex;flex-direction:column;gap:8px;align-items:flex-start}#l3bar[hidden]{display:none}#l3bar button{border:1px solid var(--line);background:rgba(10,24,20,.92);color:var(--cream);border-radius:999px;padding:10px 14px;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.35)}#l3bar .att{background:var(--gold);color:#1a1405;border-color:var(--gold);font-size:15px;padding:12px 16px}body.sheet-open #l3bar,body.phone-open #l3bar,body.cine #l3bar,body.camp #l3bar{display:none}.l3att{border:2px solid var(--gold)!important;background:rgba(201,151,28,.16)!important}';document.head.appendChild(st);
  const bar=document.createElement('div');bar.id='l3bar';bar.hidden=true;bar.innerHTML='<button class="att" hidden></button><button class="wc">🚻 Restroom</button>';(document.getElementById('app')||document.body).appendChild(bar);
  const att=bar.querySelector('.att'),wc=bar.querySelector('.wc');wc.onclick=()=>goRestroom();
  let key='';HOOKS.frame.push(()=>{if(!S)return;const show=!!(S.inside&&!CS.on&&!W.drive&&!S.over);const n=show?nextDue():null;const inRight=n&&S.inside===n.loc&&n.c.st==='pending'&&minOf(S.t)>=n.c.start-30;
    const k=(show?1:0)+'|'+(wcOk()?1:0)+'|'+(inRight?n.name:'')+'|'+(ACT?1:0);if(k===key)return;key=k;bar.hidden=!show;wc.hidden=!wcOk();
    att.hidden=!inRight||!!ACT;if(inRight){att.textContent='🎓 Attend '+n.name+' now';att.onclick=()=>attendNow(n.kind,n.c);}});}

/* ---------- MY ROOM sign in the hostel corridor ---------- */
HOOKS.populate.push(I=>{try{if(I.kind!=='hall')return;const fl=(LOCS[I.id]&&LOCS[I.id].floor)||1;const mine=myRoomNo();if(I.myTag&&I.myTagNo===mine)return;
  if(I.myTag){I.g.remove(I.myTag);I.myTag=null;}const d=HALL_DOORS.find(x=>roomNo(fl,x[0])===mine);if(!d)return;const [k,x,z,side]=d;
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:textTex([['▼ MY ROOM ▼','800 46px sans-serif']],320,80,'#e3b04b','#1a1208'),depthTest:false,transparent:false,fog:false}));m.scale.set(2.6,0.65,1);m.renderOrder=999;
  m.position.set(x,3.9,z+(side==='n'?0.6:-0.6));I.g.add(m);I.myTag=m;I.myTagNo=mine;
  I.labels.forEach(l=>{if(!l.def||!/^door\d+$/.test(l.def.id))return;const isMine=l.def.id==='door'+mine;l.el.textContent=isMine?'★ MY ROOM · '+mine:fx(l.def.name).replace(' · yours','');l.el.classList.toggle('l3mine',isMine);});}catch(e){}});
{const st=document.createElement('style');st.textContent='.lbl.obj.l3mine{background:var(--gold)!important;color:#1a1405!important;font-weight:800;border-color:var(--gold)!important}';document.head.appendChild(st);}
HOOKS.frame.push((dt,now)=>{try{if(!S||!S.inside)return;const I=IW[S.inside];if(I&&I.myTag)I.myTag.position.y=3.9+Math.sin(now/300)*0.08;}catch(e){}});

/* ---------- sound on iPhone ---------- */
{let tag=null;const silent=()=>{const n=1600,buf=new ArrayBuffer(44+n),v=new DataView(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);for(let i=0;i<n;i++)v.setUint8(44+i,128);
    return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}));};
  const unlock=()=>{try{if(!AU.on)return;try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback';}catch(e){}
    if(!tag){tag=new Audio(silent());tag.setAttribute('playsinline','');tag.loop=true;tag.volume=0.01;}if(tag.paused){const p=tag.play();if(p&&p.catch)p.catch(()=>{});}
    audioInit();if(AU.ctx&&AU.ctx.state!=='running'){const p=AU.ctx.resume();if(p&&p.catch)p.catch(()=>{});}}catch(e){}};
  ['touchend','pointerdown','click','keydown'].forEach(t=>window.addEventListener(t,unlock,{capture:true,passive:true}));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(unlock,60);});}

/* ---------- two fingers: twist to turn the camera, drag up/down to tilt (pinch still zooms) ---------- */
{const tp=new Map();let g0=null;const gs=()=>{const [a,b]=[...tp.values()];return {ang:Math.atan2(b.y-a.y,b.x-a.x),my:(a.y+b.y)/2,yaw:cam.yaw,pitch:S&&S.inside?cam.ipitch:cam.pitch};};
  cv.addEventListener('pointerdown',e=>{tp.set(e.pointerId,{x:e.clientX,y:e.clientY});if(tp.size===2)g0=gs();},true);
  cv.addEventListener('pointermove',e=>{if(!tp.has(e.pointerId))return;tp.set(e.pointerId,{x:e.clientX,y:e.clientY});if(tp.size!==2||!g0||!S||(cam.mode==='map'&&!S.inside))return;const g=gs();
    cam.yaw=g0.yaw+angDiff(g.ang,g0.ang);const dy=g.my-g0.my;if(S.inside)cam.ipitch=clamp(g0.pitch+dy*0.005,0.45,1.3);else if(cam.mode==='home')cam.pitch=clamp(g0.pitch+dy*0.005,0.35,1.25);},true);
  const end=e=>{tp.delete(e.pointerId);if(tp.size<2)g0=null;};cv.addEventListener('pointerup',end,true);cv.addEventListener('pointercancel',end,true);}

/* ---------- Messages: real players next to your contacts ---------- */
HOOKS.views.msgs=(b,T)=>{try{const n=NETX();if(!n||!n.user)return false;if(!W.thrAsk||Date.now()-W.thrAsk>8000){W.thrAsk=Date.now();if(n.send)n.send({t:'threads'});}
  const nb=el('button','newchat','<b>＋ Message a player</b><span>Real students · find anyone by @username or matric number</span>');nb.onclick=()=>setPhone('players');b.append(nb);
  const th=n.threads||[];if(th.length){b.append(el('div','sec','Players'));th.forEach(t=>{const r=el('button','thread','<div class="av">'+avatar('me')+'</div><div class="l"><b>'+esc(t.name)+' <small style="color:var(--gold);font-weight:700">· player</small></b><span>'+(t.mine?'You: ':'')+esc(t.last||'')+'</span></div><div class="tm">'+(t.unread?'<em>'+t.unread+'</em>':'')+'</div>');r.onclick=()=>setPhone('pchat',t.id);b.append(r);});}
  const on=(n.online||[]).filter(p=>p.id!==n.user.id&&!th.some(t=>t.id===p.id)).slice(0,6);
  if(on.length){b.append(el('div','sec','Online now'));on.forEach(p=>{const r=el('button','thread','<div class="av">'+avatar('me')+'</div><div class="l"><b>'+esc(p.name)+'</b><span>Online · tap to say hi</span></div>');r.onclick=()=>setPhone('pchat',p.id);b.append(r);});}
  b.append(el('div','sec','Contacts'));}catch(e){}return false;};
if(window.__QA)window.__L3={uNow,CLK,attendNow,nextDue,goRestroom,partyPermission,markPast,get ACT(){return ACT;},stopAction:()=>stopAction(true),announceParty:()=>announceParty()};
