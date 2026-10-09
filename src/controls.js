/* ================= CONTROLS: keyboard walking on desktop (WASD / arrows, Shift to run) =================
   Tap or click to walk still works everywhere; double-tap or double-click to run. */
const KEYS={};
window.addEventListener('keydown',e=>{if(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){KEYS[k]=true;if(k.startsWith('arrow')&&S&&!W.drive)e.preventDefault();}});
window.addEventListener('keyup',e=>{KEYS[e.key.toLowerCase()]=false;});
window.addEventListener('blur',()=>{for(const k in KEYS)KEYS[k]=false;});
HOOKS.frame.push((dt)=>{if(!S||W.drive||W.ride||CS.on||S.captive||busy()||W.fading||(ACT&&ACT.place))return;
  const f=(KEYS.w||KEYS.arrowup?1:0)-(KEYS.s||KEYS.arrowdown?1:0),r=(KEYS.d||KEYS.arrowright?1:0)-(KEYS.a||KEYS.arrowleft?1:0);
  if(!f&&!r){if(W.kbWalk){W.kbWalk=false;P.path=null;P.mode='idle';P.run=false;if(!S.inside)setAt();}return;}
  if(ACT)stopAction(true);
  // camera-relative: forward is away from the camera
  const fx=-Math.sin(cam.yaw),fz=-Math.cos(cam.yaw),rx=Math.cos(cam.yaw),rz=-Math.sin(cam.yaw);let dx=fx*f+rx*r,dz=fz*f+rz*r;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  const look=S.inside?1.6:2.6;P.path=[{x:P.x+dx*look,z:P.z+dz*look}];P.i=0;P.mode='walk';P.run=!!KEYS.shift&&S.needs.energy>8;W.kbWalk=true;W.after=null;if(!S.inside)S.at=null;});
/* desktop: double-click also runs (pointer events already handle taps) */
