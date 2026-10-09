/* ================= DATING (18+ accounts) =================
   Crushes grow from real interaction: flirting, dates and how well you actually get on.
   Some people aren't interested in dating at all, and they say so. Relationships need attention:
   ignore your partner, or get caught flirting with someone else, and it ends.
   Real players can ask each other out too (both accounts must be 18+). */
function datingOK(){return mature()&&(!S.age||S.age>=18);}
function loveSt(){const L=S.love||(S.love={with:null,stage:'single',since:0,dates:0,lastDate:0,lastSeen:0,history:[],pref:'opp'});if(!L.dates_)L.dates_={};return L;}
function genderOf(id){if(CAST[id])return CAST[id].female?'f':'m';if(id==='amina')return isF()?'m':'f';return null;}
function datable(id){const g=genderOf(id);if(!g)return false;if(CAST[id]&&CAST[id].romance==='no')return 'no';const p=loveSt().pref,me=isF()?'f':'m';return p==='any'||(p==='opp'?g!==me:g===me);}
function chem(id){return 0.35+0.65*hash(String(S.seed)+'chem'+id);}
const DATE_SPOTS=[
  {id:'suya',n:'Suya and a walk',cost:2000,hours:[17,22.5],loc:'suya',likes:['musa','amina','dayo']},
  {id:'macd',n:'Dinner at Mac D',cost:5000,hours:[11,21.5],loc:'macd',likes:['zara','dayo','tobi']},
  {id:'movie',n:'Movie night at the Student Centre',cost:3000,hours:[18,22],days:[4,5],loc:'centre',likes:['zara','amina','tobi']},
  {id:'field',n:'Sunset walk round the Sports Field',cost:0,hours:[17,19.5],loc:'sports',likes:['musa','nneka','amina']},
  {id:'library',n:'Study date at the Library',cost:0,hours:[9,21],loc:'library',likes:['nneka','tobi']}];
const DATE_TOPICS={dreams:['Their dreams',['nneka','tobi','musa','amina']],family:['Family',['nneka','musa','amina']],gossip:['Campus gossip',['zara','dayo']],music:['Music',['zara','amina','tobi']],football:['Football',['musa','dayo']],money:['Money and hustle',['tobi','dayo']],faith:['Faith and church',['amina','nneka']]};
/* ---- actions in someone's talk menu ---- */
function datingChoices(id,C){if(!datingOK())return;const L=loveSt(),ok=datable(id);if(!ok)return;const r=S.rel[id]||0,R=rd(id),nm=fx(PEOPLE[id].name);const mine=L.stage==='dating'&&L.with===id;
  if(ok==='no'){if(r>=30&&!S.flags['nodate_'+id])C.push({t:'Flirt a little',fn:()=>{S.flags['nodate_'+id]=1;rdAdd(id,'resp',2,true);return '"You\'re sweet. But I\'m not dating anyone. I\'m serious about that." '+nm+' smiles. "Friends?"';}});return;}
  if(mine){C.push({t:'♥ Spend time together (30m)',fn:()=>{S.t+=30;N('fun',12);N('stress',-6);rel(id,4);rdAdd(id,'attr',2,true);L.lastSeen=S.t;addMoodlet('With bae',10,360);return pick(['You talk until you both forget the time.','Comfortable silence. The good kind.','"I missed you today," '+nm+' says, like it\'s nothing.']);}});
    C.push({t:'♥ Plan a date',fn:()=>{setTimeout(()=>askDate(id),80);return null;}});
    C.push({t:'Break up',fn:()=>{setTimeout(()=>breakUp(id,'you'),80);return null;}});return;}
  if(r>=25)C.push({t:'Flirt a little',fn:()=>flirt(id)});
  if(r>=40&&R.attr>=22)C.push({t:'♥ Ask '+(genderOf(id)==='f'?'her':'him')+' on a date',fn:()=>{setTimeout(()=>askDate(id),80);return null;}});
  if(L.stage!=='dating'&&R.attr>=50&&r>=55&&(L.dates_[id]||0)>=2)C.push({t:'♥ Ask to make it official',fn:()=>askOfficial(id)});}
function flirt(id){const R=rd(id),c=CAST[id],nm=fx(PEOPLE[id].name);const L=loveSt();const today=dayOf(S.t);S.flags.flirt=S.flags.flirt||{};if(S.flags.flirt[id]===today)return '"Twice in one day? Calm down 😂"';S.flags.flirt[id]=today;
  const base=chem(id)*0.6+(S.rel[id]||0)/200+R.attr/250+(curMood()==='Confident'?0.1:0)+(S.drip||0)*0.015-(R.res>30?0.3:0)+(c&&c.flattery>0?0.1:0);
  cheatCheck(id);
  if(chance(clamp(base,0.12,0.9))){rdAdd(id,'attr',ri(5,9));rel(id,2);memAdd(id,'flirt','You flirted with them',0.6);return pick(['"Is that so?" '+nm+' is trying very hard not to smile, and failing.','A laugh, a look, a pause that lasts a second too long.','"You\'re trouble," '+nm+' says. It sounds like a compliment.']);}
  rdAdd(id,'attr',-1,true);rdAdd(id,'resp',-1,true);return pick(['"Okay…" Awkward silence.',''+nm+' laughs, but it\'s the polite laugh.','"Are you always like this?" Not in a good way.']);}
function askDate(id){const nm=fx(PEOPLE[id].name),R=rd(id),L=loveSt();const mine=L.stage==='dating'&&L.with===id;
  if(!mine&&L.stage==='dating'&&L.with){cheatCheck(id,true);}
  if(S.flags.dateAsk&&S.flags.dateAsk[id]===dayOf(S.t))return toast('Date','You already asked '+nm+' today.');
  const spots=DATE_SPOTS.map(sp=>({t:sp.n+(sp.cost?' · '+naira(sp.cost):' · free')+' · '+fmtTime(sp.hours[0]*60)+'+',fn:()=>{S.flags.dateAsk=S.flags.dateAsk||{};S.flags.dateAsk[id]=dayOf(S.t);
    const p=(mine?0.8:0.25)+chem(id)*0.3+R.attr/180+(S.rel[id]||0)/300+(sp.likes.includes(id)?0.15:0)-(R.res>25?0.35:0);
    if(!chance(clamp(p,0.1,0.95))){rdAdd(id,'attr',-2,true);return pick(['"Not this week, sorry. Maybe another time."','"Hmm… I don\'t think so. Sorry."']);}
    const start=planStart(sp);S.dateP={id,spot:sp.id,start,until:start+150};setMeet(id,sp.loc,start,start+150);memAdd(id,'date_plan','Said yes to '+sp.n.toLowerCase(),0.5);
    return '"'+pick(['Yes. I\'d like that.','Okay! It\'s a date 😊','Finally you asked 😂 Yes.'])+'" '+nm+' will meet you at '+locName(sp.loc)+' at '+fmtTime(start)+'. Don\'t be late.';}}));
  spots.push({t:'Never mind',fn:()=>null});dialog({who:id,kicker:'Ask '+nm+' on a date',text:'Where do you want to take '+nm+'?',choices:spots});}
function planStart(sp){const m=minOf(S.t),d0=Math.floor(S.t/1440)*1440;let st=Math.max(m+40,sp.hours[0]*60);let day=d0;if(st>sp.hours[1]*60-60){day+=1440;st=sp.hours[0]*60;}
  if(sp.days){let g=0;while(!sp.days.includes(wd(day+st))&&g++<7)day+=1440;}return day+Math.round(st/15)*15;}
function setMeet(id,loc,from,until){if(CAST[id]){S.story._meet=S.story._meet||{};S.story._meet[id]={loc,until};}const n=npcs.find(x=>x.id===id);if(n){n.meet={loc,until};}}
/* the date itself: show up and spend time together */
HOOKS.acts.push(id=>{const D=S.dateP;if(!D)return [];const sp=DATE_SPOTS.find(x=>x.id===D.spot);if(!sp||sp.loc!==id)return [];const nm=fx(PEOPLE[D.id].name);const on=S.t>=D.start-30&&S.t<=D.until;
  return [A('♥ Date with '+nm,on?sp.n+' · '+nm+' is waiting':'Starts '+fmtTime(D.start)+' · Day '+dayOf(D.start),()=>startDate(),{now:false,dis:on?null:'Come back at '+fmtTime(D.start),cost:sp.cost||undefined})];});
HOOKS.minute.push(m=>{const D=S.dateP;if(!D)return;if(S.t>D.until){const nm=fx(PEOPLE[D.id].name);S.dateP=null;rel(D.id,-6);rdAdd(D.id,'attr',-6,true);rdAdd(D.id,'res',8,true);memAdd(D.id,'stoodup','You stood them up on a date',2);msg(D.id,pick(['I waited for you. Wow.','So you just weren\'t going to come? Okay.','I was there for an hour. Don\'t ask me out again.']));}
  const sp=DATE_SPOTS.find(x=>x.id===D.spot);if(sp&&S.t>=D.start-5&&!busy()&&!ACT&&!W.ride&&!W.drive&&(S.inside===sp.loc||(!LOCS[sp.loc].inside&&S.at===sp.loc))){startDate();return;}
  if(S.t===D.start-30)toast('♥ Date soon',fx(PEOPLE[D.id].name)+' · '+locName(DATE_SPOTS.find(x=>x.id===D.spot).loc)+' at '+fmtTime(D.start));});
function startDate(){const D=S.dateP;if(!D||ACT||busy())return;const sp=DATE_SPOTS.find(x=>x.id===D.spot);const id=D.id,nm=fx(PEOPLE[id].name);
  if(LOCS[sp.loc].inside&&S.inside!==sp.loc){enterBuilding(sp.loc,()=>setTimeout(startDate,500));return;}S.lastDateId=id;if(sp.cost&&!spend(sp.cost,'Date with '+nm+' · '+sp.n))return toast('Not enough money','This date costs '+naira(sp.cost)+'. Top up or choose a free one next time.','bad');
  S.dateP=null;const L=loveSt();L.dates_=L.dates_||{};L.dates_[id]=(L.dates_[id]||0)+1;L.dates=(L.dates||0)+1;L.lastDate=S.t;L.lastSeen=S.t;
  // put your date beside you
  const look=Object.assign({},PEOPLE[id].look||CAST[id]&&CAST[id].look);let sim=null;
  if(look){sim=makeSim(Object.assign({bag:null},look));if(S.inside){const I=getInt(S.inside);I.g.add(sim);const s1=freeSeat(I);if(s1){s1.used=true;sim.position.set(s1.x,s1.y-0.77,s1.z);sim.rotation.y=s1.face;W.dateSeat=s1;}else sim.position.set(P.x+1.2,0,P.z+0.4);}
    else{outdoor.add(sim);const fp=freeNear(NAV,P.x+1.1,P.z+0.5,6);sim.position.set(fp.x,0,fp.z);sim.rotation.y=Math.atan2(P.x-fp.x,P.z-fp.z);}W.dateSim=sim;const n=castN[id];if(n)n.hidden=true;}
  const seated=!!(S.inside&&W.dateSeat);const pl=seated?{x:W.dateSeat.x+Math.sin(W.dateSeat.face)*1.6,y:0,z:W.dateSeat.z+Math.cos(W.dateSeat.face)*1.6,r:W.dateSeat.face+Math.PI,pose:'sittalk'}:{x:P.x,y:0,z:P.z,r:sim?Math.atan2(sim.position.x-P.x,sim.position.z-P.z):P.dir,pose:'talk'};
  startAction(sp.n+' with '+nm,sp.id==='library'?90:70,{place:pl,per:()=>{N('fun',0.4);N('stress',-0.15);if(sp.id==='macd'||sp.id==='suya')N('food',0.6);if(sp.id==='library')addStudy(0.012);},
    done:()=>dateTalk(id,sp,1,0),onStop:()=>endDateSim()});
  if(sim){const tick=()=>{if(!W.dateSim||!ACT){return;}pose(W.dateSim,seated?'sittalk':(chance(0.002)?'laugh':'talk'),performance.now()/1000,0.016);requestAnimationFrame(tick);};tick();}}
function endDateSim(){if(W.dateSim&&W.dateSim.parent)W.dateSim.parent.remove(W.dateSim);W.dateSim=null;if(W.dateSeat){W.dateSeat.used=false;W.dateSeat=null;}const n=castN[S.lastDateId];if(n)n.hidden=false;}
function dateTalk(id,sp,round,score){S.lastDateId=id;const nm=fx(PEOPLE[id].name);const keys=Object.keys(DATE_TOPICS);const rr=sr('topics'+id+(loveSt().dates||0)+round);const opts=keys.sort(()=>rr()-0.5).slice(0,3);
  dialog({who:id,kicker:'On a date · '+sp.n+' · '+round+'/3',text:round===1?'"So… what do you want to talk about?" '+nm+' asks.':round===2?'The conversation keeps going. What next?':'It\'s getting late. One more thing to talk about.',
    choices:opts.map(k=>({t:DATE_TOPICS[k][0],fn:()=>{const good=DATE_TOPICS[k][1].includes(id);const sc=score+(good?2:chance(0.5)?1:0);const line=good?pick([''+nm+' lights up and talks for twenty minutes.','"Okay, now you\'re talking," '+nm+' says, leaning in.','You find out something you didn\'t know. It makes you like '+(genderOf(id)==='f'?'her':'him')+' more.']):pick(['It\'s fine. Just fine.',''+nm+' nods along politely.','A little awkward, but you laugh it off.']);
      if(good)rdAdd(id,'attr',3,true);if(round<3){setTimeout(()=>dateTalk(id,sp,round+1,sc),80);return line;}setTimeout(()=>dateEnd(id,sp,sc),80);return line;}})).concat(round===1?[{t:'Ask about '+(genderOf(id)==='f'?'her':'him'),fn:()=>{const f=FACTS.find(x=>CAST[id]&&!knownFact(id,x[0])&&x[1]<70);if(f){learnFact(id,f[0]);}setTimeout(()=>dateTalk(id,sp,round+1,score+1),80);return f?factLine(id,f[0]):'"I\'m an open book. A short one 😂"';}}]:[])});}
function dateEnd(id,sp,sc){endDateSim();const nm=fx(PEOPLE[id].name);const L=loveSt();const great=sc>=5,ok=sc>=3;rel(id,great?9:ok?5:1);rdAdd(id,'attr',great?10:ok?5:-2);rdAdd(id,'trust',ok?3:0,true);addMoodlet(great?'Amazing date':'Nice date',great?16:8,1440);setMood('Happy',360);
  memAdd(id,'date',(great?'A really good':'A')+' date: '+sp.n.toLowerCase(),great?2:1);journalLog('Date with '+nm+' · '+sp.n);xp(great?25:12,'Date');
  dialog({who:id,kicker:'End of the date',text:great?'"I really enjoyed tonight." '+nm+' doesn\'t let go of your hand straight away.':ok?'"That was nice. Thank you." A small smile.':'"Thanks for tonight." Polite. Maybe next time will be better.',choices:[{t:'Walk '+(genderOf(id)==='f'?'her':'him')+' back',fn:()=>{rel(id,2);return null;}},{t:'"Same time next week?"',fn:()=>{rdAdd(id,'attr',ok?3:-1,true);return ok?'"Ask me properly next week and we\'ll see 😊"':'"Let\'s see."';}}]});}
function askOfficial(id){const nm=fx(PEOPLE[id].name),R=rd(id),L=loveSt(),c=CAST[id];if(L.player)return 'You\'re already in a relationship with '+L.player.name+'.';
  if(c&&c.romance==='slow'&&R.attr<72)return '"I like you. I do. But not until after exams. I need to be sure." '+nm+' squeezes your hand.';
  if(!chance(clamp(0.35+R.attr/150+(S.rel[id]||0)/250,0.2,0.95))){rdAdd(id,'attr',-4,true);return '"I… need more time. Is that okay?"';}
  if(L.stage==='dating'&&L.with&&L.with!==id)breakUp(L.with,'you',true);
  L.with=id;L.stage='dating';L.since=S.t;L.lastSeen=S.t;rel(id,10);rdAdd(id,'trust',8);memAdd(id,'together','You asked them to be official and they said yes',3);celebrate('In a relationship','You and '+nm+' are official ♥');journalLog('You started dating '+nm);
  const n=NETX();if(n)n.log('dating',{with:nm});return '"Yes. Obviously yes." '+nm+' laughs, then hugs you so hard your phone falls out of your pocket.';}
function breakUp(id,by,quiet){const L=loveSt(),nm=fx(PEOPLE[id].name);if(L.with!==id)return;L.history.push({id,from:L.since,to:S.t,by});L.with=null;L.stage='single';
  rel(id,by==='you'?-15:-8);rdAdd(id,'res',by==='you'?20:8,true);rdAdd(id,'attr',-20,true);addMoodlet('Heartbreak',by==='you'?-8:-18,3*1440);setMood('Sad',720);memAdd(id,'breakup',by==='you'?'You broke up with them':'They broke up with you',3);journalLog('Broke up with '+nm);
  if(!quiet)dialog({who:id,kicker:'Breakup',text:by==='you'?'You tell '+nm+'. It goes quiet. "Okay," '+nm+' finally says. "Okay." It isn\'t okay, but it\'s done.':nm+' sends a long message. It ends with: "I think we should stop. I\'m sorry."',choices:[{t:'…',fn:()=>null}]});}
/* jealousy: flirting or dating someone else while taken can get back to your partner */
function cheatCheck(id,date){const L=loveSt();if(L.stage!=='dating'||!L.with||L.with===id)return;const p=L.with;const seen=witnesses(16).includes(p)||chance(date?0.35:0.18);if(!seen)return;
  const nm=fx(PEOPLE[p].name);memAdd(p,'jealous','Heard you were flirting with '+fx(PEOPLE[id].name),2);rdAdd(p,'trust',-15);rdAdd(p,'res',12);
  setTimeout(()=>dialog({who:p,kicker:'Uh oh',text:nm+' heard about you and '+fx(PEOPLE[id].name)+'. "So that\'s what you do when I\'m not there?"',choices:[
    {t:'Apologize properly',fn:()=>{rdAdd(p,'res',-6);rdAdd(p,'trust',2);if(chance(0.5+rd(p).attr/250))return '"Don\'t do it again." It\'s a warning, not a pardon.';setTimeout(()=>breakUp(p,'them'),300);return '"Sorry isn\'t enough this time."';}},
    {t:'"It was nothing"',fn:()=>{rdAdd(p,'trust',-6);if(chance(0.5)){setTimeout(()=>breakUp(p,'them'),300);return '"Then you won\'t miss me either."';}return '"Nothing. Okay." The temperature drops ten degrees.';}},
    {t:'Break up',fn:()=>{setTimeout(()=>breakUp(p,'you'),300);return null;}}]}),600);}
/* a relationship needs attention */
HOOKS.day.push(d=>{const L=loveSt();if(L.stage!=='dating'||!L.with)return;const id=L.with,nm=fx(PEOPLE[id].name),gap=(S.t-(L.lastSeen||L.since))/1440;
  if(gap>=9){breakUp(id,'them');return;}if(gap>=5)msg(id,pick(['Are we still together? I haven\'t seen you in days.','You\'ve been so quiet. Is everything okay with us?']));
  else if(chance(0.6))msg(id,pick(['Good morning ☀️ have a good day','Thinking about you 🙈','Did you eat? Don\'t lie','Can\'t wait to see you later']));
  if(chance(0.15)&&(S.rel[id]||0)>60){S.inv.gift=(S.inv.gift||0)+1;msg(id,'I left something for you at your hostel. Chocolate 🍫');}});
HOOKS.minute.push(m=>{if(m%30)return;const L=loveSt();if(L.stage==='dating'&&L.with&&((S.chatMem||{})[L.with]||{}).hist){const h=S.chatMem[L.with].hist;const last=h.filter(x=>x.me).slice(-1)[0];if(last&&last.t>(L.lastSeen||0)-1440)L.lastSeen=Math.max(L.lastSeen||0,last.t-720);}});
HOOKS.castMore.push((id,C)=>datingChoices(id,C));
/* Amina (or Ade, for female players) gets a full talk menu: chat, stories, dating */
HOOKS.talk.amina=()=>{const C=[];C.push(...storyChoicesFor('amina'));
  C.push({t:'Chat (30m)',fn:()=>{S.t+=30;N('fun',12);rel('amina',5);rdAdd('amina','fam',4,true);rdAdd('amina','trust',2,true);if(S.flags.aminaOwes&&chance(.6)){earn(1000,'Amina paid back');S.flags.aminaOwes=0;return 'She sends back your ₦1,000 before you even ask. Respect.';}return pick(['You both laugh so hard the porter looks over.','You end up planning a group study for Thursday.','Gist about everybody in your class. Everybody.']);}});
  datingChoices('amina',C);
  if(mature()&&loveSt().with==='amina')C.push({t:'Ask for a night walk',fn:()=>{setTimeout(askNightWalk,60);return null;}});
  C.push({t:'Later',fn:()=>null});
  dialog({who:'amina',kicker:fx(PEOPLE.amina.role)+' · '+tier(S.rel.amina||0),text:pick(['"'+S.name+'! You finally found your way here. Sit, sit."','"Did you hear Blessing moved the assignment again? I\'m tired."','"Abeg tell me something funny, my day has been long."']),choices:C});};
/* dating section in your profile, with who you're interested in */
HOOKS.profile.push(wrap=>{if(!datingOK())return;const L=loveSt();wrap.append(el('div','sec','Love life'));
  wrap.append(el('div','note',L.player?'In a relationship with <b>'+esc(L.player.name)+'</b> (real player).':L.stage==='dating'?'In a relationship with <b>'+fx(PEOPLE[L.with].name)+'</b> since Day '+dayOf(L.since)+'.':'Single.'+(L.history.length?' Exes: '+L.history.map(h=>fx(PEOPLE[h.id].name)).join(', ')+'.':'')));
  const row=el('div','chips');[['opp','Interested in '+(isF()?'men':'women')],['same','Interested in '+(isF()?'women':'men')],['any','Everyone']].forEach(([v,n])=>{const b=el('button',L.pref===v?'on':null,n);b.onclick=()=>{L.pref=v;closeSheet();openProfile();};row.append(b);});wrap.append(row);});
HOOKS.migrate.push(st=>{if(st.love&&!st.love.dates_)st.love.dates_={};});
HOOKS.newState.push(st=>{st.love={with:null,stage:'single',since:0,dates:0,dates_:{},lastDate:0,lastSeen:0,history:[],pref:'opp'};});
