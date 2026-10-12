/* ================= SOCIAL 2: love life in character creation, relationship status on your profile ================= */
const CASLOVE={status:'single',pref:'opp',partner:''};
setTimeout(()=>{const btn=$('#btnNext');if(btn){const f=el('div','field');f.id='fLove';f.innerHTML='<span class="lb">Love life</span><div class="chips" id="cLove"></div><div class="chips" id="cLovePref" style="margin-top:6px"></div><input id="inPartner" maxlength="20" placeholder="Partner\'s name" autocomplete="off" style="margin-top:8px" hidden><div class="note" style="margin-top:6px;font-size:12px;color:var(--muted)">Dating in the game is only for players who are 18 or older.</div>';
  btn.parentNode.insertBefore(f,btn);
  const draw=()=>{const F=CAS.g==='f';const c=$('#cLove');c.innerHTML='';
    [['single','Single'],['open','Single, open to dating'],['taken','Taken (partner back home)'],['none','Not interested']].forEach(([v,n])=>{const b=el('button',CASLOVE.status===v?'on':null,n);b.onclick=()=>{CASLOVE.status=v;draw();};c.append(b);});
    const p=$('#cLovePref');p.innerHTML='';p.hidden=CASLOVE.status==='none';
    [['opp','Into '+(F?'men':'women')],['same','Into '+(F?'women':'men')],['any','Everyone']].forEach(([v,n])=>{const b=el('button',CASLOVE.pref===v?'on':null,n);b.onclick=()=>{CASLOVE.pref=v;draw();};p.append(b);});
    const pi=$('#inPartner');pi.hidden=CASLOVE.status!=='taken';pi.value=CASLOVE.partner;pi.oninput=()=>{CASLOVE.partner=pi.value.replace(/[<>]/g,'').slice(0,20);};};
  const _r=refreshCAS;refreshCAS=function(){const r=_r.apply(this,arguments);try{draw();const ad=!window.VLNet||!VLNet.user||VLNet.user.adult!==false;$('#fLove').hidden=!ad;}catch(e){}return r;};
  draw();}},0);
HOOKS.newState.push(st=>{if(!st.love)return;st.love.pref=CASLOVE.pref;st.love.status=CASLOVE.status;if(CASLOVE.status==='taken')st.love.home={name:(CASLOVE.partner||'').trim()||'your partner back home',since:0};});

/* what everyone sees: Single / Taken · name */
function relStatus(){const L=S&&S.love;if(!L)return{t:'Single',taken:false};
  if(L.player&&L.player.name)return{t:'Taken',who:L.player.name,taken:true};
  if(L.stage==='dating'&&L.with&&PEOPLE[L.with])return{t:'Taken',who:PEOPLE[L.with].name,taken:true};
  if(L.home&&L.home.name)return{t:'Taken',who:L.home.name+' (back home)',taken:true};
  if(L.status==='none')return{t:'Not looking',taken:false};
  return{t:L.status==='open'?'Single · open to dating':'Single',taken:false};}
HOOKS.profile.push(wrap=>{const r=relStatus();const row=el('div','txrow','<div>Relationship</div><div class="amt" style="color:'+(r.taken?'#ff8fb2':'inherit')+'">'+(r.taken?'♥ Taken · '+esc(r.who):r.t)+'</div>');
  const first=wrap.querySelector('.bgcard');if(first)first.after(row);else wrap.append(row);
  if(mature()&&S.love&&S.love.home){const b=el('button','opt','<div class="l"><b>Break up with '+esc(S.love.home.name)+'</b><span>End the long-distance relationship</span></div>');b.onclick=()=>{const n=S.love.home.name;S.love.home=null;addMoodlet('Broke up',-10,1440);toast('Single again','You and '+esc(n)+' ended things on the phone.','bad');closeSheet();openProfile();};wrap.append(b);}});
/* the online side reports your status with your position, so other players see "Taken · name" too */
if(window.__QA)window.__SOC={relStatus,CASLOVE};
