/* ================= SOCIAL and BLADDER needs =================
   Social drops slowly when you are alone and rises when you talk to people, are around others, chat on
   your phone, eat with family or go out. Bladder drops all day (faster after eating or drinking); use any
   toilet (inside any building) before it runs out, or there is an accident.
   Tap any need bar in the top bar to see what restores it. */
NEEDS.push(['social','Social','#c98ad9'],['bladder','Bladder','#7fc4c4']);
$('#needs').innerHTML=NEEDS.map(([k,l])=>'<div class="need" data-need="'+k+'"><div class="v">'+l+'<i class="num" id="nv_'+k+'"></i></div><div class="bar"><div id="nb_'+k+'"></div></div></div>').join('');
HOOKS.newState.push(st=>{st.needs.social=70;st.needs.bladder=85;});
HOOKS.migrate.push(st=>{if(st.needs){if(st.needs.social==null)st.needs.social=70;if(st.needs.bladder==null)st.needs.bladder=85;}});

/* eating and drinking fill the bladder */
{const _N=N;N=function(k,v){_N(k,v);if(k==='food'&&v>0&&S.needs.bladder!=null)_N('bladder',-v*0.3);};}

/* talking to a person (any dialog with someone) lifts social, at most once an hour per person */
{const _d=dialog;dialog=function(d){try{if(S&&d&&d.who&&d.who!=='me'&&PEOPLE[d.who]&&S.needs.social!=null){const k='soc_'+d.who;S.flags.soc=S.flags.soc||{};
  if(!S.flags.soc[k]||S.t-S.flags.soc[k]>60){S.flags.soc[k]=S.t;N('social',6);}}}catch(e){}return _d(d);};}

const SOCIAL_ACT=/party|date|chat|gist|hang|dad|mum|mass|lecture|dance|game|snooker|football|eating at|with/i;
HOOKS.minute.push(m=>{if(!S||S.over||S.needs.social==null)return;const asleep=ACT&&ACT.sleep;
  /* bladder */
  N('bladder',asleep?-0.04:-0.09);
  if(S.needs.bladder<=0&&!(ACT&&/toilet/i.test(ACT.label))){N('bladder',100);N('hygiene',-45);addMoodlet('Had an accident',-18,600);setMood('Embarrassed',300);
    toast('Accident','You didn\'t make it to a toilet in time. Go and have a bath.','bad');}
  else if(S.needs.bladder<18&&m%30===0&&!asleep)toast('Bladder','You really need the toilet. Tap the Bladder bar.','bad');
  /* social */
  let s=asleep?-0.006:-0.028;
  if(ACT&&!asleep&&SOCIAL_ACT.test(ACT.label))s+=0.22;
  if(UI.phone&&phoneView==='thread')s+=0.12;
  if(S.inside){const I=IW[S.inside];if(I&&I.sims.some(r=>r.g.visible))s+=0.05;}
  else{let c=0;for(const n of npcs){if(n.hidden)continue;if(Math.hypot(n.x-P.x,n.z-P.z)<7&&++c>=3)break;}s+=c*0.025;}
  N('social',s);
  if(m%60===0){if(S.needs.social<20)addMoodlet('Lonely',-8,90);else if(S.needs.social>80)addMoodlet('Well connected',5,90);}});

/* tap a need bar: what restores it, with a shortcut for the toilet */
const NEED_TIPS={energy:'Sleep in your bed, nap, or rest. Coffee only hides it.',food:'Eat at a cafe, buka, Mama Put, or cook at home. Garri works in a pinch.',hygiene:'Bath at your hostel, lodge or house. Sweat and accidents drop it.',
  fun:'Play games, watch TV, go to the Student Centre, parties, football.',stress:'Rest, pray at the chapel, have fun. Deadlines and debt raise it.',health:'Eat well, sleep, see the nurse at the Health Centre.',
  social:'Talk to people, sit with roommates, chat in Messages, eat with family, go to parties or Mass.',bladder:'Use a toilet. Every building has one: tap below when you are inside.'};
function toiletAct(){if(!S.inside){const best=Object.values(LOCS).filter(L=>L.inside&&!(L.zone==='off'&&L.own&&S.ownHouse!==L.id)).sort((a,b)=>Math.hypot(a.door.x-P.x,a.door.z-P.z)-Math.hypot(b.door.x-P.x,b.door.z-P.z))[0];
    if(best){toast('Toilet','Heading to '+fx(best.name)+'.');goTo(best.id);}return;}
  if(ACT)stopAction(true);startAction('Using the toilet',5,{where:S.inside,hide:true,per:()=>N('bladder',22),done:()=>{N('bladder',100);N('hygiene',-1);}});}
$('#needs').addEventListener('click',e=>{const d=e.target.closest('.need');if(!d||!S)return;const k=d.dataset.need;const n=NEEDS.find(x=>x[0]===k);if(!n)return;
  const wrap=el('div');wrap.style.display='grid';wrap.style.gap='8px';wrap.append(el('div','note',NEED_TIPS[k]||''));
  if(k==='bladder'){const b=el('button','opt','<div class="l"><b>'+(S.inside?'Use the toilet':'Find the nearest toilet')+'</b><span>'+(S.inside?'5 minutes':'Walks you to the closest building')+'</span></div>');b.onclick=()=>{closeSheet();toiletAct();};wrap.append(b);}
  openSheet(n[1]+' · '+Math.round(S.needs[k])+'%',k==='stress'?'Lower is better':'Higher is better',wrap);});
{const st=document.createElement('style');st.textContent='.needs{grid-template-columns:repeat(8,1fr)}.need{cursor:pointer}@media (max-width:480px){.needs{grid-template-columns:repeat(4,1fr)}}';document.head.appendChild(st);}
