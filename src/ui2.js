/* ================= UI 2: phone-width fixes, smoother sheets, clearer To-do, bigger Back buttons,
   button feedback, auto-run, and a camera that never gets stuck inside a building ================= */
{const st=document.createElement('style');st.textContent=`
/* phone screens never scroll sideways */
#pBody{overflow-x:hidden!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
#pBody *{max-width:100%;box-sizing:border-box}
#pBody .thread{width:100%;min-width:0}
#pBody .thread .l{min-width:0;flex:1;overflow:hidden}
#pBody .thread .l b,#pBody .thread .l span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#pBody .thread .tm{flex:none}
#pBody input,#pBody textarea,#pBody select,.gname{width:100%;box-sizing:border-box}
#pBody .msg{max-width:82%;overflow-wrap:anywhere;word-break:break-word}
#pBody .newchat{width:100%;box-sizing:border-box}
#pBody .btnrow{flex-wrap:wrap}
/* sheets (Profile, Wallet...) scroll smoothly and never bounce the page */
.sheet .bd{overflow-x:hidden!important;touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;transform:translateZ(0);will-change:scroll-position}
.sheet .bd>*{min-width:0}
html,body{overscroll-behavior:none}
/* Back buttons: big, clear pills */
#pBack{min-width:74px;height:38px;padding:0 14px 0 10px;border-radius:19px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:#fff;font-size:15px;font-weight:700;display:inline-flex;align-items:center;gap:4px;line-height:1}
#pBack::after{content:'Back';font-size:14px}
#pBack:active{background:rgba(255,255,255,.22)}
#btnBack,.vlg-link{min-height:44px;padding:0 18px;border-radius:22px;font-size:15px;font-weight:700}
#leave{min-height:46px;padding:0 22px!important;font-size:15px!important;font-weight:800!important;border-radius:23px!important}
.sheet .hd .x{width:40px;height:40px;font-size:18px;border-radius:20px}
/* every button reacts to a tap */
button{-webkit-tap-highlight-color:transparent;transition:transform .08s ease,filter .08s ease}
button:active:not(:disabled){transform:scale(.95);filter:brightness(1.25)}
button.vl-sent,button.vl-sent:disabled{opacity:1!important;background:var(--good,#3fa66b)!important;color:#fff!important;border-color:transparent!important}
/* To-do panel: easy to notice */
#obj{background:linear-gradient(180deg,rgba(26,52,44,.95),rgba(14,32,27,.95))!important;border:1.5px solid var(--gold,#e3b04b)!important;box-shadow:0 6px 22px rgba(0,0,0,.45),0 0 0 3px rgba(227,176,75,.12);font-size:13.5px!important;width:268px!important}
#obj h4{font-size:12px!important;color:var(--gold,#e3b04b)!important}
#obj h4:first-child::before{content:'📋 ';letter-spacing:0}
#obj h4 button{background:rgba(255,255,255,.1)!important;border-radius:12px!important;padding:4px 10px!important;color:#fff!important}
#obj li{padding:5px 6px;border-radius:7px}
#obj li:not(.done):first-child{background:rgba(227,176,75,.16);font-weight:700}
#obj li:not(.done):first-child .dot{border-color:var(--gold,#e3b04b);animation:vlPulse 1.4s ease-in-out infinite}
#obj li .go{margin-left:auto;flex:none;font-size:11px;font-weight:800;color:#1b1406;background:var(--gold,#e3b04b);border-radius:10px;padding:2px 8px}
#obj.min{width:auto!important}
@keyframes vlPulse{0%,100%{box-shadow:0 0 0 0 rgba(227,176,75,.7)}50%{box-shadow:0 0 0 6px rgba(227,176,75,0)}}
/* auto-run chip */
#autoRun{position:absolute;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 132px);z-index:6;border:0;border-radius:22px;padding:10px 14px;font-weight:800;font-size:13px;background:rgba(15,35,30,.9);color:#fff;border:1.5px solid rgba(255,255,255,.2);box-shadow:0 4px 16px rgba(0,0,0,.4)}
#autoRun.on{background:var(--gold,#e3b04b);color:#1b1406;border-color:transparent}
body.cine #autoRun,body.camp #autoRun,body.phone-open #autoRun,body.sheet-open #autoRun,body.mapmode #autoRun,body.bm-on #autoRun{display:none}
`;document.head.appendChild(st);}

/* ---- the To-do: the next thing gets a "Go" chip ---- */
{const ul=$('#objL');if(ul)new MutationObserver(()=>{const li=ul.querySelector('li:not(.done)');if(li&&!li.querySelector('.go'))li.insertAdjacentHTML('beforeend','<span class="go">Go</span>');}).observe(ul,{childList:true});}

/* ---- render less while a sheet or the phone covers the screen: scrolling stays smooth on phones ---- */
HOOKS.frame.push(()=>{W.lowR=!!(UI.sheet||UI.phone);});

/* ---- auto-run: double-tap the ground once and you keep running until you switch it off ---- */
const autoBtn=el('button',null,'🏃 Auto-run');autoBtn.id='autoRun';autoBtn.hidden=true;host.appendChild(autoBtn);
function autoRunSet(on){if(!S)return;S.flags.autoRun=!!on;autoBtn.classList.toggle('on',!!on);autoBtn.textContent=on?'🏃 Auto-run ON':'🚶 Walk';if(on){P.run=S.needs.energy>8&&P.mode==='walk';}else P.run=false;}
autoBtn.onclick=()=>{autoRunSet(!S.flags.autoRun);toast(S.flags.autoRun?'Auto-run on':'Auto-run off',S.flags.autoRun?'You run everywhere. Tap the button to walk again.':'You walk. Double-tap the ground to run again.');};
{const _t=onTap;onTap=function(cx,cy){const before=W.lastTap;const r=_t.apply(this,arguments);
  if(S&&before&&W.lastTap===null&&P.mode==='walk'&&!S.flags.autoRun){autoRunSet(true);toast('Auto-run on','You keep running. Tap "Auto-run ON" to walk again.');}return r;};}
{const _w=walkTo;walkTo=function(){const r=_w.apply(this,arguments);if(S&&S.flags.autoRun&&S.needs.energy>8)P.run=true;return r;};}
{const _wi=walkInside;walkInside=function(){const r=_wi.apply(this,arguments);if(S&&S.flags.autoRun&&S.needs.energy>8)P.run=true;return r;};}
HOOKS.boot.push(()=>{autoBtn.hidden=false;autoRunSet(!!(S&&S.flags.autoRun));});
HOOKS.minute.push(()=>{if(S&&S.flags.autoRun&&S.needs.energy<=8&&P.run){P.run=false;toast('Too tired to run','Eat or rest. Auto-run starts again when you have energy.','bad');}});

/* ---- camera: when you walk out of a building it swings round behind you, facing away from the wall,
   and anywhere outdoors it rises over a building that blocks the view instead of getting stuck in it ---- */
{const _ex=exitBuilding;exitBuilding=function(then){const id=S&&S.inside;return _ex.call(this,function(){
  try{const L=LOCS[id];if(L&&L.door){cam.yaw=Math.atan2(L.door.x-L.x,L.door.z-L.z)+0.45;cam.pitch=Math.max(cam.pitch,0.62);cam.cd=Math.max(cam.dist*0.7,18);cam.eff=cam.cd;cam.cp=Math.max(cam.cp||0,0.62);}}catch(e){}
  if(then)then();});};}
{const _cc=camClear;camClear=function(tx,ty,tz,ux,uy,uz,dist){const d=_cc(tx,ty,tz,ux,uy,uz,dist);
  /* blocked by a building: look for the nearest clear angle around the player and swing there (not while you drag) */
  if(d<Math.min(dist,14)&&!W.drive&&!CS.on&&cam.mode==='home'&&!drag){const now=performance.now();if(!W.camScan||now-W.camScan>250){W.camScan=now;const hz=Math.hypot(ux,uz)||1;
    for(const off of [0.35,-0.35,0.7,-0.7,1.05,-1.05,1.4,-1.4,1.9,-1.9,2.5,-2.5,3.14]){const y=cam.yaw+off;const vx=Math.sin(y)*hz,vz=Math.cos(y)*hz;if(_cc(tx,ty,tz,vx,uy,vz,dist)>=Math.min(dist,14)){W.camYawT=y;break;}}}}
  else if(d>=dist-0.5)W.camYawT=null;
  return d;};}
HOOKS.frame.push(dt=>{if(W.camYawT!=null&&!drag&&S&&!S.inside&&cam.mode==='home'){const df=angDiff(W.camYawT,cam.yaw);cam.yaw+=df*Math.min(1,dt*3.2);if(Math.abs(df)<0.02)W.camYawT=null;}});

/* ---- To-do: compact by default (only the next task shows, so it never covers your character); tap More to see all ---- */
{const st=document.createElement('style');st.textContent='#obj.compact li:not(:first-child),#obj.compact .goalhd,#obj.compact #goalL{display:none}#obj.compact{width:auto!important;max-width:calc(100% - 32px)!important}';document.head.appendChild(st);
  const o=$('#obj'),b=$('#objT');if(o&&b){o.classList.remove('min');o.classList.add('compact');b.textContent='More';
    b.onclick=e=>{e.stopPropagation();o.classList.remove('min');o.classList.toggle('compact');b.textContent=o.classList.contains('compact')?'More':'Less';};}}
if(window.__QA)window.__UI2={autoRunSet,tap:(x,y)=>onTap(x,y),walkTo:(x,z)=>walkTo({x,z})};
