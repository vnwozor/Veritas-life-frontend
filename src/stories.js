/* ================= STORIES: multi-chapter arcs that unfold through play =================
   Each story is data: chapters with a trigger (talk to someone, be somewhere, a text, or an automatic scene),
   a time window, and choices whose consequences change relationships, memories and later chapters.
   S.story[id] = {ch, next, vars, log:[decisions], known:[discovered info], done, outcome} */
const STORIES={};
function storySt(id){S.story=S.story||{};return S.story[id];}
function stGo(id,ch,afterMins){const st=storySt(id);st.ch=ch;st.next=S.t+(afterMins||0);st.avail=false;st.hinted=false;st.since=S.t;if(STORIES[id].chapters[ch]&&STORIES[id].chapters[ch].meet)storyMeet(id);save();}
function stEnd(id,outcome,summary){const st=storySt(id);st.done=true;st.ch=null;st.outcome=outcome;st.summary=summary;st.ended=S.t;journalLog('Story finished: '+STORIES[id].title+' · '+outcome);xp(40,'Story: '+STORIES[id].title);
  toast('Story · '+STORIES[id].title,summary,'good');save();}
function stLog(id,text){const st=storySt(id);st.log.push({t:S.t,x:text});}
function stKnow(id,text){const st=storySt(id);if(!st.known.includes(text)){st.known.push(text);journalLog(STORIES[id].title+': '+text);}}
function storyMeet(id){const st=storySt(id),c=STORIES[id].chapters[st.ch];if(!c||!c.who||!c.where||!CAST[c.who])return;S.story._meet=S.story._meet||{};S.story._meet[c.who]={loc:c.where,until:st.next+(c.expire||600)};
  const n=castN[c.who];if(n){n.idle=0;n.path=null;}}
function chOpen(id){const st=storySt(id);if(!st||st.done||!st.ch)return null;const c=STORIES[id].chapters[st.ch];if(!c)return null;if(S.t<st.next)return null;
  const h=minOf(S.t)/60;if(c.hours&&!(h>=c.hours[0]&&h<c.hours[1]))return null;if(c.days&&!c.days.includes(wd(S.t)))return null;if(c.ok&&!c.ok(st))return null;return c;}
function storyDlg(id,who,text,choices,kicker){dialog({who,kicker:kicker||STORIES[id].title,text,choices});}
const storyIds=()=>Object.keys(STORIES);
/* engine: start stories, announce available chapters, expire missed ones */
HOOKS.minute.push(m=>{if(m%5||!S||S.over||S.captive||CS.on)return;S.story=S.story||{};
  for(const id of storyIds()){const D=STORIES[id];let st=S.story[id];
    if(!st){if(D.start&&D.start()&&!busy()){st=S.story[id]={ch:D.first,next:S.t+(D.delay||0),vars:{},log:[],known:[],done:false,started:S.t};journalLog('New story: '+D.title);if(D.chapters[D.first].meet)storyMeet(id);}continue;}
    if(st.done||!st.ch)continue;const c=D.chapters[st.ch];if(!c)continue;
    if(c.expire&&S.t>st.next+c.expire){if(c.missed){stLog(id,'Missed: '+c.title);stGo(id,c.missed,0);}else if(c.lapse){c.lapse(st);}continue;}
    const open=chOpen(id);if(!open){st.avail=false;continue;}st.avail=true;
    if(c.trigger==='auto'){if(!busy()&&!ACT&&!W.ride&&!W.drive&&(!c.where||S.inside===c.where||S.at===c.where)){st.avail=false;c.run(st);}continue;}
    if(c.trigger==='msg'&&!st.hinted){st.hinted=true;c.run(st);continue;}
    if(!st.hinted&&c.hint){st.hinted=true;toast('★ '+D.title,c.hint);}}});
/* talk triggers show up first in the person's menu; place triggers in the place's action list */
function storyChoicesFor(who){const out=[];for(const id of storyIds()){const c=chOpen(id);if(c&&c.trigger==='talk'&&c.who===who)out.push({t:'★ '+(c.label||c.title),fn:()=>{setTimeout(()=>c.run(storySt(id)),60);return null;}});}return out;}
HOOKS.castFirst.push((id,C)=>C.push(...storyChoicesFor(id)));
HOOKS.choices.push((id,C)=>{const L=storyChoicesFor(id);if(L.length)C.unshift(...L);});
HOOKS.acts.push(id=>{const L=[];for(const sid of storyIds()){const c=chOpen(sid);if(!c||c.trigger!=='place'||c.where!==id)continue;
  L.push(A('★ '+(c.label||c.title),STORIES[sid].title+(c.who&&CAST[c.who]?' · '+CAST[c.who].name+' is here':''),()=>c.run(storySt(sid)),{now:false}));}
  for(const sid of storyIds()){const st=storySt(sid);if(!st||st.done)continue;const D=STORIES[sid];(D.leads||[]).forEach(ld=>{if(ld.where===id&&ld.ok(st)&&!st.vars['lead_'+ld.id])L.push(A('🔎 '+ld.label,D.title+' · a lead',()=>{ld.run(st);},{now:false}));});}
  return L;});
/* inside buildings: story actions appear on a "★" object near the door */
HOOKS.populate.push(I=>{});
/* ---- helpers used by stories ---- */
const here=id=>S.inside===id||S.at===id;
function witnessed(kind,text,w,extra){const ids=witnesses(14).concat(extra||[]);[...new Set(ids)].forEach(id=>memAdd(id,kind,text,w||1));return ids;}
function gossip(fromId,text,kind){/* people close to the one who saw it may hear about it */Object.keys(S.rel).forEach(k=>{if(k===fromId||!PEOPLE[k])return;if(nn(fromId,k)>10||((MATES.includes(fromId)&&MATES.includes(k))))if(chance(0.5))memAdd(k,kind||'heard',text+' (heard from '+fx(PEOPLE[fromId].name)+')',0.6);});}

/* ===== 1. Nneka's fees (money, pride, trust) ===== */
STORIES.nneka={title:'Nneka\'s fees',cat:'Money & ambition',cast:['nneka','hauwa','tobi','philani'],start:()=>dayOf(S.t)>=2&&!S.intro,first:'worried',
  chapters:{
  worried:{title:'Someone looks worried outside the Library',hint:'Someone is sitting alone outside the Library, staring at a printout.',trigger:'place',where:'library',who:'nneka',hours:[9,18],meet:true,expire:2*1440,missed:'deadline',label:'Check on the girl on the steps',
    run:st=>{storyDlg('nneka','nneka','A girl in a blue blouse sits on the Library steps with a Bursary printout on her knees. She keeps folding and unfolding it. When she sees you looking, she slides it into her bag. "Yes?"',[
      {t:'"Are you okay? Do you need help?"',fn:()=>{rdAdd('nneka','trust',3);st.vars.asked=1;stLog('nneka','You asked Nneka if she needed help.');stGo('nneka','deadline',1440);return '"I\'m fine." She isn\'t. "I\'m Nneka. 200 Level Accounting. Thank you for asking."';}},
      {t:'Sit down and just listen (20m)',fn:()=>{S.t+=20;rdAdd('nneka','trust',7);rel('nneka',5);st.vars.listened=1;learnFact('nneka','role');stKnow('nneka','Nneka has a problem at the Bursary.');stLog('nneka','You sat with Nneka and listened.');stGo('nneka','deadline',1440);
        return 'You sit. She doesn\'t say much for a long time. Then: "Bursary wahala. It will sort itself out." Before she leaves she tells you her name: Nneka.';}},
      {t:'Make a joke to lighten the mood',fn:()=>{rdAdd('nneka','resp',-4);st.vars.joked=1;stLog('nneka','You joked while Nneka was upset.');stGo('nneka','deadline',1440);return '"Not today, please." She walks inside.';}},
      {t:'Leave her alone',fn:()=>{st.vars.ignored=1;stLog('nneka','You left Nneka alone.');stGo('nneka','deadline',1440);return 'You give her space. Sometimes that\'s what people want. Sometimes it isn\'t.';}},
      {t:'Ask her friend Hauwa about it later',fn:()=>{st.vars.askHauwa=1;stLog('nneka','You decided to ask Hauwa.');stGo('nneka','hauwa',60);return 'You notice a girl in a hijab waving at her from the Health Centre path. Maybe she knows.';}}]);}},
  hauwa:{title:'Ask Hauwa about Nneka',hint:'Hauwa might know what is wrong with Nneka. She works at the Health Centre.',trigger:'talk',who:'hauwa',hours:[8,20],expire:2*1440,missed:'deadline',label:'Ask about Nneka',
    run:st=>{storyDlg('nneka','hauwa','Hauwa studies your face for a long time. "Why do you want to know?"',[
      {t:'"She looked like she needed help. I want to help, quietly."',fn:()=>{rdAdd('hauwa','trust',5);rdAdd('hauwa','resp',4);st.vars.knows=1;stKnow('nneka','Her fees are unpaid and the deadline is close.');stKnow('nneka','She has been skipping dinner to save money.');learnFact('nneka','worry');
        stLog('nneka','Hauwa told you about Nneka\'s fees in confidence.');memAdd('hauwa','confided','Told you about Nneka in confidence',2);stGo('nneka','deadline',600);return '"Her fees. The deadline is this week. She\'s been skipping dinner to save. She would die before asking anyone." A pause. "I\'m telling you because you asked the right way. Don\'t embarrass her."';}},
      {t:'"Just curious"',fn:()=>{rdAdd('hauwa','trust',-3);stLog('nneka','Hauwa wouldn\'t gossip about Nneka.');stGo('nneka','deadline',600);return '"Then stay curious. It\'s not my story to tell."';}}]);}},
  deadline:{title:'Nneka\'s deadline',hint:'Nneka might talk to you now. She is usually at the Library or GGS.',trigger:'talk',who:'nneka',hours:[8,21],expire:3*1440,missed:'alone',label:'Talk to Nneka about the Bursary',
    run:st=>{const tr=rd('nneka').trust+(S.rel.nneka||0)*0.4;const open=tr>=34||st.vars.listened;
      if(!open&&!st.vars.knows){storyDlg('nneka','nneka','"It\'s nothing. Really." She packs her books and leaves. Maybe if she trusted you more.',[{t:'Okay',fn:()=>{stGo('nneka','deadline',720);rdAdd('nneka','trust',1);return null;}}]);return;}
      const C=[];
      if(!open&&st.vars.knows)C.push({t:'"Hauwa told me. I\'m not judging you."',fn:()=>{nnAdd('nneka','hauwa',-30);memAdd('nneka','heard','Hauwa told you about her fees',2);rdAdd('nneka','res',8);rdAdd('nneka','trust',2);st.vars.revealedHauwa=1;stLog('nneka','You told Nneka that Hauwa shared her secret.');
        memAdd('hauwa','betrayal','You told Nneka what Hauwa said in confidence',3);rdAdd('hauwa','trust',-20);rdAdd('hauwa','res',15);setTimeout(()=>deadlineChoices(st),80);return '"She WHAT?" Nneka closes her eyes. "Fine. Yes. My fees."';}});
      if(open)C.push({t:'"Tell me what\'s really going on."',fn:()=>{setTimeout(()=>deadlineChoices(st),80);return 'She takes a breath. "Eighty-five thousand. Due Friday. I have fifty-two. My father\'s shop burned last year, so…" She shrugs like it\'s nothing.';}});
      C.push({t:'Not now',fn:()=>{stGo('nneka','deadline',600);return null;}});
      storyDlg('nneka','nneka','Nneka is at a corner table with an exercise book full of numbers. All of them add up to the same problem.',C);}},
  work:{title:'Tobi\'s bookkeeper',hint:'Introduce Nneka to Tobi. He is usually at the Student Centre or the Library.',trigger:'talk',who:'tobi',hours:[9,22],expire:3*1440,missed:'alone',label:'Introduce Nneka as a bookkeeper',
    run:st=>{storyDlg('nneka','tobi','"An accountant? For CampusRun? I\'ve been doing the books in my head!" Tobi grabs his phone. "Send her. If she\'s good I\'ll pay ₦8,000 a week."',[
      {t:'Set up the meeting',fn:()=>{const ts=storySt('tobi');if(ts)ts.vars.accountant=1;nnAdd('nneka','tobi',25);rel('tobi',4);rdAdd('nneka','trust',8);rdAdd('nneka','resp',10);memAdd('nneka','helped','You got her a paying job with Tobi',3);
        stLog('nneka','You got Nneka a bookkeeping job with Tobi.');setTimeout(()=>{stEnd('nneka','She paid her fees herself','Nneka works Tobi\'s books three evenings a week. Between that and her savings, she pays the Bursary on Friday. She never says thank you out loud, but she saves you a seat in every lecture.');S.flags.nnekaTutor=1;},400);return '"Deal." Two days later Nneka sends you a screenshot: a Bursary receipt. Just a receipt. No caption. That\'s her way.';}}]);}},
  philani:{title:'The chaplaincy welfare fund',hint:'Father Philani manages a small welfare fund. Find him at the Chapel.',trigger:'place',where:'chapel',hours:[7,19],expire:3*1440,missed:'alone',label:'Ask Father Philani about the welfare fund',
    run:st=>{storyDlg('nneka','philani','Father Philani listens. "The fund can cover part of it, but someone must vouch for her, and she must agree. Pride is a heavy bag, my child. She has to put it down herself."',[
      {t:'Vouch for her and bring her to see him',fn:()=>{rel('philani',6);rdAdd('nneka','trust',10);rdAdd('nneka','resp',6);memAdd('nneka','helped','You took her to the chaplaincy, quietly',3);stLog('nneka','You vouched for Nneka at the chaplaincy.');
        setTimeout(()=>stEnd('nneka','The chaplaincy helped','The fund pays ₦25,000. Nneka covers the rest with her savings. She tells nobody, and neither do you. She starts eating dinner again.'),400);S.flags.nnekaTutor=1;return 'It takes an hour of convincing. She cries once, in the corridor where no one can see. Then she signs the form.';}},
      {t:'Change your mind',fn:()=>{stGo('nneka','deadline',300);return null;}}]);}},
  repay:{title:'Nneka pays you back',trigger:'msg',who:'nneka',
    run:st=>{msg('nneka','I\'m sending your money back now. All of it. Thank you for not making it a big thing. I won\'t forget.');earn(st.vars.lent||0,'Nneka paid you back');rdAdd('nneka','trust',6);memAdd('nneka','helped','You lent her money when she needed it',3);
      stEnd('nneka','She paid every naira back','You lent Nneka the money she needed. She paid it all back, on time, with a thank-you note in a very neat handwriting. She offers to tutor you before exams.');S.flags.nnekaTutor=1;}},
  exposed:{title:'Make it right with Nneka',hint:'Nneka is avoiding you after the class group thing. Apologize properly.',trigger:'talk',who:'nneka',hours:[8,21],expire:4*1440,label:'Apologize to Nneka',
    lapse:st=>stEnd('nneka','She never forgave it','The class raised some money, but Nneka paid it back and stopped talking to you. Some help costs more than it gives.'),
    run:st=>{storyDlg('nneka','nneka','"You announced my problem to two hundred people." Her voice is very calm, which is worse.',[
      {t:'"You\'re right. I should have asked you first. I\'m sorry."',fn:()=>{rdAdd('nneka','res',-15);rdAdd('nneka','trust',4);rdAdd('nneka','resp',5);stEnd('nneka','Forgiven, slowly','The money from the class covered her fees. It took a week, but she started greeting you again. "Next time, ask me."');return '"…Okay. Next time, ask me." It\'s not forgiveness yet. But it\'s a start.';}},
      {t:'"I was only trying to help!"',fn:()=>{rdAdd('nneka','res',8);stEnd('nneka','She never forgave it','The class money covered her fees. Nneka paid it back, every naira, and stopped talking to you.');return '"Then help less loudly." She walks away.';}}]);}},
  alone:{title:'Nneka is gone',trigger:'auto',
    run:st=>{storyDlg('nneka','rep','The course rep posts in the group: "Please, has anyone seen Nneka Eze? She missed the test." A day later someone says she went home to Nsukka. Deferred the semester.',[{t:'Text her',fn:()=>{msg('nneka','I\'m home. I\'ll be back next session. Thank you for asking.');rdAdd('nneka','trust',3);stEnd('nneka','She deferred the semester','Nneka went home to Nsukka. She says she will be back next session. Some stories don\'t end when you want them to.');return null;}},{t:'Let it go',fn:()=>{stEnd('nneka','She deferred the semester','Nneka went home to Nsukka. You never found out exactly what happened.');return null;}}]);}}}};
function deadlineChoices(st){const need=33000;storyDlg('nneka','nneka','"I don\'t want charity," she says before you can say anything. "I want a solution."',[
  {t:'Lend her ₦33,000 (she\'ll pay back)',fn:()=>{if(!spend(need,'Lent Nneka for her fees'))return 'You don\'t have ₦33,000 right now. Top up, save, or think of another way.';st.vars.lent=need;rdAdd('nneka','trust',14);rdAdd('nneka','resp',6);stLog('nneka','You lent Nneka ₦33,000.');stGo('nneka','repay',7*1440);
    return '"A loan. Not a gift." She writes an IOU on the spot, signs it, and makes you sign too. "Seven days."';}},
  {t:'"Tobi needs someone to do his app\'s accounts"',fn:()=>{st.vars.job=1;stLog('nneka','You suggested a bookkeeping job with Tobi.');stGo('nneka','work',30);return '"Tobi… the app boy? He has money to pay?" She almost smiles. "Introduce me."';}},
  {t:'"The chaplaincy has a welfare fund"',fn:()=>{st.vars.fund=1;stLog('nneka','You suggested the chaplaincy fund.');stGo('nneka','philani',30);return '"I\'ve heard. I can\'t walk in there and beg." You offer to go with her. She doesn\'t say no.';}},
  {t:'Post in the class group to raise money (without asking her)',fn:()=>{st.vars.exposed=1;stLog('nneka','You posted Nneka\'s situation in the class group without asking.');rdAdd('nneka','res',25);rdAdd('nneka','trust',-15);memAdd('nneka','betrayal','You posted her problem in the class group',3);
    S.vibe.followers=(S.vibe.followers||0)+5;stGo('nneka','exposed',1440);return 'Within an hour the class has raised ₦40,000. Nneka sees the post. She doesn\'t reply to anyone. She doesn\'t come to class the next day either.';}},
  {t:'"I can\'t help, sorry"',fn:()=>{stLog('nneka','You said you couldn\'t help.');stGo('nneka','alone',3*1440);return '"I didn\'t ask you to." She means it kindly. Mostly.';}}]);}

/* ===== 2. CampusRun (career, honesty) ===== */
STORIES.tobi={title:'CampusRun',cat:'Career & business',cast:['tobi','nneka','dayo','zara'],start:()=>dayOf(S.t)>=3&&!S.intro,first:'pitch',
  chapters:{
  pitch:{title:'Tobi\'s pitch',hint:'A boy at the Student Centre is pitching his delivery app to anyone who will listen.',trigger:'place',where:'centre',who:'tobi',hours:[11,21],meet:true,expire:3*1440,missed:'pitch2',label:'Listen to Tobi\'s pitch',
    run:st=>tobiPitch(st)},
  pitch2:{title:'Tobi messages you',trigger:'msg',who:'tobi',run:st=>{msg('tobi','Hey! Saw you around. I\'m Tobi, building CampusRun: food from any cafe to your hostel in 20 mins. Come see me at the Student Centre. I need people 🚀');stGo('tobi','pitch',60);}},
  work:{title:'First week of CampusRun',hint:'Tobi needs you. Find him at the Student Centre or Keke Park.',trigger:'talk',who:'tobi',hours:[10,22],expire:3*1440,missed:'crisis',label:'Work on CampusRun',
    run:st=>{const role=st.vars.role;const go=()=>{if(role==='rider')startAction('Delivering CampusRun orders',90,{per:()=>{N('energy',-0.1);N('hygiene',-0.04);},done:()=>{earn(2500,'CampusRun deliveries');rel('tobi',5);S.skills.business+=0.1;afterWork(st);}});
        else if(role==='dev')startAction('Fixing CampusRun\'s checkout bug',120,{per:()=>N('energy',-0.06),done:()=>{S.skills.tech+=0.35;rel('tobi',7);rdAdd('tobi','resp',8);xp(20,'Shipped a fix');afterWork(st);}});
        else{toast('CampusRun','Tobi shows you the numbers: 40 orders this week. Your ₦10,000 is working.');rel('tobi',3);afterWork(st);}};
      storyDlg('tobi','tobi',role==='rider'?'"Five orders from GGS to the hostels. Go go go!"':role==='dev'?'"The checkout crashes when two people order jollof at once. Don\'t ask."':'"Investor update! Come and see."',[{t:'Let\'s go',fn:()=>{setTimeout(go,100);return null;}},{t:'Not now',fn:()=>{stGo('tobi','work',240);return null;}}]);}},
  crisis:{title:'CampusRun is in trouble',trigger:'msg',who:'tobi',
    run:st=>{msg('tobi','Bad news. Bursary says my fees aren\'t paid. Deadline is Friday. And my investor just ghosted me. I don\'t know what to do 😩',[
      {t:'"Did you use your fees for the app?"',fn:()=>{st.vars.askedFees=1;stKnow('tobi','Tobi used his school fees as startup money.');learnFact('tobi','worry');return 'Tobi: ...yes. Please don\'t tell anyone.';}},
      {t:'"Let\'s meet and fix it"',fn:()=>{return 'Tobi: Student Centre. I\'ll be there.';}}]);stGo('tobi','decide',30);}},
  decide:{title:'Help Tobi decide',hint:'Tobi is waiting at the Student Centre.',trigger:'talk',who:'tobi',hours:[9,23],expire:3*1440,missed:'fold',label:'Help Tobi decide',
    run:st=>{const C=[
      {t:'"Call your parents and tell them the truth. I\'ll sit with you."',fn:()=>{st.vars.honest=1;rdAdd('tobi','trust',10);rdAdd('tobi','resp',8);stLog('tobi','You convinced Tobi to tell his parents.');stGo('tobi','verdict',1440);return 'The call takes forty minutes. His mother cries, his father goes very quiet. But at the end: "Pay the fees first. Then we talk about this app properly."';}},
      {t:'"Pitch to Dayo. He\'s rich."',fn:()=>{st.vars.dayo=1;stLog('tobi','You sent Tobi to pitch to Dayo.');stGo('tobi','verdict',1440);return 'Tobi runs off to find Dayo.';}},
      {t:'"Run a big promo weekend to raise the money fast"',fn:()=>{st.vars.promo=1;stLog('tobi','You planned a promo weekend with Tobi.');stGo('tobi','verdict',1440);return '"Free delivery Saturday! If we do 300 orders…" His eyes are already shining.';}},
      {t:'"Maybe this was a bad idea. Shut it down."',fn:()=>{rdAdd('tobi','riv',8);rdAdd('tobi','trust',-4);stLog('tobi','You told Tobi to quit.');stGo('tobi','fold',600);return 'He looks at you like you said something unforgivable. "Okay. Thanks."';}}];
      if((S.story.zara&&S.story.zara.vars.honest)||(S.rel.zara||0)>=45)C.splice(2,0,{t:'"Ask Zara to promote it on VIBE"',fn:()=>{st.vars.zara=1;st.vars.promo=1;nnAdd('tobi','zara',15);stLog('tobi','You got Zara to promote CampusRun.');stGo('tobi','verdict',1440);return 'Zara posts a skit about a CampusRun rider racing Officer Tiger. 40,000 views overnight.';}});
      storyDlg('tobi','tobi','Tobi has a laptop full of red numbers and a face to match. "Talk to me. What do I do?"',C);}},
  verdict:{title:'CampusRun: the verdict',trigger:'auto',hours:[8,22],
    run:st=>{const v=st.vars;let score=(v.honest?2:0)+(v.promo?1:0)+(v.zara?1:0)+(v.accountant?1:0)+(v.role==='dev'?1:0)+(v.invest?1:0)-(v.dayo&&!(S.story.dayo&&S.story.dayo.done)?1:0);
      if(v.dayo&&!v.honest&&score<2){stEnd('tobi','CampusRun folded','Dayo promised money he didn\'t have. CampusRun shut down and Tobi deferred his fees. He still sends you app ideas at 2 AM.');rel('tobi',-2);return;}
      if(score>=3){earn(v.role==='dev'?15000:v.invest?18000:8000,v.invest?'CampusRun: your investment paid off':'CampusRun: thank-you bonus');rel('tobi',10);rdAdd('tobi','trust',10);S.flags.campusRun=1;
        stEnd('tobi','CampusRun survived',(v.honest?'His parents paid the fees, ':'')+'the promo weekend did 300 orders, and an alumnus at a seminar offered real seed money. CampusRun is alive. Tobi calls you "co-founder" now, mostly as a joke.');return;}
      if(score>=1){rel('tobi',6);stEnd('tobi','Paused, not dead','Tobi paid his fees with his parents\' help and paused CampusRun until the long vacation. "Pausing is not quitting," he says. Twice.');return;}
      stEnd('tobi','CampusRun folded','The numbers didn\'t work. CampusRun shut down. Tobi took it hard, then started a new idea the very next week.');}},
  fold:{title:'CampusRun folds',trigger:'auto',run:st=>{stEnd('tobi','CampusRun folded','Without help, CampusRun shut down. Tobi deferred his fees. He still believes. You\'re not sure what you believe.');}}}};
function tobiPitch(st){storyDlg('tobi','tobi','"Picture this: you\'re hungry in your room at 9 PM. You tap. Twenty minutes later, jollof from GGS at your door. CampusRun." Tobi spins his laptop round. "I need riders, I need code, I need money. Which one are you?"',[
  {t:'"I\'ll ride" (deliveries for pay)',fn:()=>{st.vars.role='rider';rel('tobi',5);rdAdd('tobi','resp',4);stLog('tobi','You joined CampusRun as a rider.');stGo('tobi','work',600);return '"Legend! Start tomorrow."';}},
  {t:S.skills.tech>=1.5?'"I can code"':'"I can code" (needs Tech 1.5)',fn:()=>{if(S.skills.tech<1.5)return '"Show me." You can\'t, yet. Learn to code on a laptop first.';st.vars.role='dev';rel('tobi',8);rdAdd('tobi','resp',10);stLog('tobi','You joined CampusRun as a developer.');stGo('tobi','work',600);return '"A developer?! Marry me. Kidding. Start tomorrow."';}},
  {t:'Invest ₦10,000',fn:()=>{if(!spend(10000,'Invested in CampusRun'))return 'You don\'t have ₦10,000 right now.';st.vars.invest=10000;rel('tobi',6);stLog('tobi','You invested ₦10,000 in CampusRun.');stGo('tobi','work',1440);return '"Our first investor!" He makes you a certificate in Canva. It is very ugly. You keep it.';}},
  {t:'Ask hard questions about the money',fn:()=>{rdAdd('tobi','resp',8);rdAdd('tobi','trust',3);learnFact('tobi','goals');st.vars.asked=1;stLog('tobi','You asked Tobi where his money comes from.');stGo('tobi','work',1440);st.vars.role=st.vars.role||'adviser';return '"Good question. Really good question." He doesn\'t answer it.';}},
  {t:'"It will never work"',fn:()=>{rdAdd('tobi','riv',10);rel('tobi',-3);stLog('tobi','You told Tobi CampusRun would never work.');stGo('tobi','crisis',3*1440);return '"That\'s what they said about Jumia." He turns to the next person.';}}]);}
function afterWork(st){st.vars.worked=(st.vars.worked||0)+1;if(st.vars.worked>=2)stGo('tobi','crisis',1440);else stGo('tobi','work',720);}

/* ===== 3. Going viral (fame, honesty, friendship) ===== */
STORIES.zara={title:'Going viral',cat:'Friendship & fame',cast:['zara','tobi'],start:()=>dayOf(S.t)>=2&&!S.intro,first:'skit',
  chapters:{
  skit:{title:'Zara needs an extra',hint:'A girl filming at Mac D or the Student Centre is looking for "one more person".',trigger:'place',where:'macd',who:'zara',hours:[11,20],meet:true,expire:3*1440,missed:'blog',label:'Help the girl filming',
    run:st=>{storyDlg('zara','zara','"YOU. Yes, you. Can you act? Doesn\'t matter. You\'re the guy who orders jollof at a shawarma place. Action!"'.replace('the guy',isF()?'the babe':'the guy'),[
      {t:'Do the skit (45m)',fn:()=>{S.t+=45;N('fun',20);rel('zara',8);S.vibe.followers=(S.vibe.followers||0)+ri(20,60);st.vars.skit=1;stLog('zara','You acted in Zara\'s skit.');stGo('zara','blog',2*1440);return 'Take seven is the one. By night it has 9,000 views and your face is a meme. Zara calls you "my lucky charm".';}},
      {t:'Suggest a better idea (Design 1+)',fn:()=>{if(S.skills.design<1)return '"Babe, I have ideas. I need faces." She wants you in the video, not behind it. (Needs Design 1.)';rel('zara',10);rdAdd('zara','resp',10);st.vars.skit=1;st.vars.idea=1;S.vibe.followers=(S.vibe.followers||0)+ri(40,90);stLog('zara','Your idea made Zara\'s skit work.');stGo('zara','blog',2*1440);return 'Your idea turns a boring skit into a good one. 15,000 views. "Okay, you\'re officially my creative director."';}},
      {t:'"I\'m camera shy, sorry"',fn:()=>{rel('zara',-1);stGo('zara','blog',2*1440);return '"Your loss! You would have been famous!" She grabs the next person.';}}]);}},
  blog:{title:'CampusTea exposes Zara',trigger:'msg',who:'zara',
    run:st=>{msg('zara','Have you seen CampusTea?? They\'re saying I BOUGHT my followers 😭😭 everybody is laughing at me. I can\'t go to class.',[{t:'"Is it true?"',fn:()=>'Zara: …can we talk in person? Please.'},{t:'"Ignore them"',fn:()=>'Zara: easy for you to say 😩'}]);stGo('zara','truth',60);}},
  truth:{title:'The truth about Zara\'s followers',hint:'Zara wants to talk in person. She is hiding in the Girls Hostel lounge or at the Student Centre.',trigger:'talk',who:'zara',hours:[9,21],expire:3*1440,missed:'quit',label:'Talk to Zara about CampusTea',
    run:st=>{const tr=rd('zara').trust+(S.rel.zara||0)*0.4;
      if(tr<30){storyDlg('zara','zara','"It\'s all lies, okay? Haters." She won\'t look at you. You\'d need her trust for the real story.',[{t:'Okay',fn:()=>{stGo('zara','quit',2*1440);return null;}}]);return;}
      stKnow('zara','Zara bought fake followers last year.');learnFact('zara','worry');
      storyDlg('zara','zara','"Fine. Last year I paid for 20,000 followers. Everybody was growing except me and my sister was on TV and I just… wanted to be seen." Her mascara is a disaster. "What do I do?"',[
        {t:'"Own it. Post the truth yourself, before they do."',fn:()=>{st.vars.honest=1;rdAdd('zara','trust',10);rdAdd('zara','resp',6);stLog('zara','You told Zara to admit it publicly.');stGo('zara','after',1440);return 'She records it in one take, no filter. "Hi. It\'s true. Here\'s why." Then she turns off her phone.';}},
        {t:'"Deny everything. I\'ll help you make fake screenshots."',fn:()=>{st.vars.lie=1;rdAdd('zara','trust',5);stLog('zara','You helped Zara cover it up with fake screenshots.');stGo('zara','after',1440);S.skills.design+=0.1;return 'You make the screenshots look real. Zara posts them with "Haters will hate 💅".';}},
        {t:'"Take a break from VIBE"',fn:()=>{st.vars.pause=1;rdAdd('zara','trust',4);stLog('zara','You told Zara to take a break.');stGo('zara','after',1440);return '"A break… okay. Maybe."';}}]);}},
  after:{title:'What happened to Zara',trigger:'auto',hours:[8,22],
    run:st=>{const v=st.vars;if(v.honest){S.vibe.followers=(S.vibe.followers||0)+ri(50,120);rel('zara',12);rdAdd('zara','trust',8);memAdd('zara','helped','You told her to be honest when it was hard',3);
        stEnd('zara','The honest video went viral','Zara\'s confession got 120,000 views, real ones. People said it was the first time she seemed real. A brand that cancelled on her called back.');return;}
      if(v.lie){if(chance(0.65)){rel('zara',-6);rdAdd('zara','res',10);S.vibe.followers=Math.max(0,(S.vibe.followers||0)-20);memAdd('zara','betrayal','Your fake screenshots got her caught a second time',2);witnessed('heard','Helped Zara fake screenshots',0.5);
          stEnd('zara','Caught twice','CampusTea found the edit marks in the screenshots in two hours. Now it\'s about faking followers AND faking proof. Zara deleted VIBE for a month.');return;}
        stEnd('zara','The lie held, for now','The screenshots worked. The story died down. Zara is relieved, but she flinches every time CampusTea posts.');return;}
      stEnd('zara','She logged off for a while','Zara took a month off VIBE. When she came back, she posted less and smiled more.');}},
  quit:{title:'Zara disappears from VIBE',trigger:'auto',run:st=>{stEnd('zara','She deleted VIBE','Zara deleted her account without saying anything to anyone. You see her at the Mac D sometimes, alone, without her phone.');}}}};

/* ===== 4. The trial (sports, health, choices) ===== */
STORIES.musa={title:'The trial',cat:'Sports & ambition',cast:['musa','hauwa','lecturer'],start:()=>dayOf(S.t)>=3&&!S.intro,first:'field',
  chapters:{
  field:{title:'The boy who never misses',hint:'A 100L boy at the Sports Field is scoring every shot. Evenings, 4 to 7 PM.',trigger:'place',where:'sports',who:'musa',hours:[15.5,19],meet:true,expire:4*1440,missed:'clash',label:'Watch the boy who never misses',
    run:st=>{storyDlg('musa','musa','A tall boy in a green jersey bends a free kick into the top corner. Then does it again. And again. "You want to try?"',[
      {t:'"Teach me that"',fn:()=>{rel('musa',8);rdAdd('musa','resp',5);st.vars.friend=1;learnFact('musa','role');stLog('musa','You trained with Musa.');stGo('musa','knee',2*1440);S.skills.fitness=(S.skills.fitness||0)+0.1;return 'An hour later you can almost hit the target. He laughs at every miss. "You go learn. Small small."';}},
      {t:'Challenge him to penalties',fn:()=>{st.vars.friend=1;rel('musa',5);stGo('musa','knee',2*1440);setTimeout(()=>startPenalty({vs:'Musa',real:true}),300);return '"Oya. Loser buys suya."';}},
      {t:'Just watch',fn:()=>{stGo('musa','knee',2*1440);return 'You watch. He doesn\'t miss once.';}}]);}},
  knee:{title:'Musa is limping',hint:'Musa was limping after training. Check on him at the Sports Field.',trigger:'place',where:'sports',who:'musa',hours:[15.5,19.5],expire:3*1440,missed:'clash',label:'Check on Musa',
    run:st=>{storyDlg('musa','musa','After training Musa sits away from everyone, pressing ice water from a sachet onto his knee. When he sees you, he stands up too fast and winces.',[
      {t:'"Go and see the nurse. Today."',fn:()=>{const tr=rd('musa').trust+(S.rel.musa||0)*0.4;if(tr>=28||st.vars.friend){st.vars.nurse=1;rdAdd('musa','trust',8);stKnow('musa','Musa\'s knee swells after matches.');stLog('musa','You made Musa see the nurse.');stGo('musa','clash',1440);return '"If I see the nurse and she says stop playing…" But he goes. Hauwa is on duty. She makes him promise to rest for a week.';}
        rdAdd('musa','trust',-2);stGo('musa','clash',1440);return '"I\'m fine." He walks off, very carefully.';}},
      {t:'Tell Hauwa quietly',fn:()=>{st.vars.hauwa=1;nnAdd('musa','hauwa',5);rel('hauwa',2);stLog('musa','You told Hauwa about Musa\'s knee.');stGo('musa','clash',1440);st.vars.nurse=chance(0.7)?1:0;return st.vars.nurse?'Hauwa finds him at dinner and doesn\'t let him leave until he agrees to come in.':'Hauwa tries. Musa laughs it off.';}},
      {t:'Say nothing',fn:()=>{stLog('musa','You said nothing about Musa\'s knee.');stGo('musa','clash',1440);return 'It\'s his body. His choice. You hope.';}}]);}},
  clash:{title:'Trial day = exam day',trigger:'msg',who:'musa',
    run:st=>{msg('musa','Bro. The Kwara scout said Saturday 10 AM. That\'s the same time as our ECO 101 make-up test 😭 what do I do??',[
      {t:'"Ask Dr. Okafor to move your test"',fn:()=>{st.vars.ask=1;return 'Musa: you think he\'ll agree?? Come with me abeg.';}},
      {t:'"Go to the trial. Football is your dream."',fn:()=>{st.vars.trial=1;return 'Musa: you\'re right. You\'re right. 🙏';}},
      {t:'"Write the test. School first."',fn:()=>{st.vars.exam=1;return 'Musa: …okay. Maybe there will be another trial.';}}]);stGo('musa','outcome',2*1440);}},
  outcome:{title:'Saturday',trigger:'auto',hours:[9,21],
    run:st=>{const v=st.vars;
      if(v.ask&&S.skills.academic>=1.8&&(S.rel.lecturer||30)>=25){rel('musa',12);rdAdd('musa','trust',10);memAdd('musa','helped','You talked Dr. Okafor into moving his test',3);rel('lecturer',2);
        stEnd('musa',v.nurse?'He made the squad':'He made it, then the knee went',v.nurse?'Dr. Okafor moved the test to Monday ("Because you asked properly"). Musa rested his knee all week and played the trial of his life. Kwara\'s academy wants him on weekends. He still writes his tests.':'Dr. Okafor moved the test. Musa played brilliantly for 60 minutes, then his knee gave way. The scout said "come back when you\'re healed". He will.');return;}
      if(v.trial||v.ask){if(v.nurse){rel('musa',8);stEnd('musa','He made the squad, and failed the test','Musa impressed the scout and joined the academy. He failed the make-up test and will carry the course over. "Worth it," he says. His father isn\'t sure.');return;}
        rel('musa',4);addMoodlet('Watched a friend get hurt',-8,1440);stEnd('musa','Injured at the trial','His knee gave way in the first half. Torn ligament. Months out. He sits with you at the Sports Field in the evenings now, watching other people play.');return;}
      rel('musa',2);stEnd('musa','He chose the test','Musa wrote the test and passed with a B. The scout didn\'t wait. He says there will be other trials. He trains harder than ever.');}}}};

/* ===== 5. Big boy, small pocket (secrets, debt, family) ===== */
STORIES.dayo={title:'Big boy, small pocket',cat:'Money & secrets',cast:['dayo'],start:()=>dayOf(S.t)>=4&&!S.intro,first:'treat',
  chapters:{
  treat:{title:'Dayo\'s treat',hint:'Dayo is buying food for everyone at Mac D again.',trigger:'place',where:'macd',who:'dayo',hours:[12,21],meet:true,expire:4*1440,missed:'calls',label:'Join Dayo\'s table at Mac D',
    run:st=>{storyDlg('dayo','dayo','"Chief! Sit, sit. Order anything. Anything!" Dayo has paid for six people already. He pays with his phone and doesn\'t look at the amount.',[
      {t:'Order a shawarma on him',fn:()=>{N('food',50);rel('dayo',5);S.stats.meals++;st.vars.ate=1;stGo('dayo','calls',2*1440);return 'Best shawarma of your life. Free things taste better.';}},
      {t:'"I\'ll pay for mine"',fn:()=>{if(!spend(2500,'Shawarma at Mac D'))return 'You check your wallet. You can\'t, actually.';N('food',50);rdAdd('dayo','resp',8);st.vars.paid=1;stGo('dayo','calls',2*1440);return '"Ah. Okay. Respect." He looks at you a little differently.';}},
      {t:'"Why do you always pay for everyone?"',fn:()=>{rdAdd('dayo','trust',5);learnFact('dayo','pers');st.vars.asked=1;stGo('dayo','calls',2*1440);return 'He laughs too loudly. "Because I can, chief." Then, quieter: "And because then people stay."';}}]);}},
  calls:{title:'A strange message about Dayo',trigger:'msg',who:'loan',
    run:st=>{msg('loan','QuickLoanz: Your contact DAYO COKER has an overdue loan of ₦180,000. You have been listed as a reference. Advise him to pay or we will contact all his contacts.',[{t:'Ignore it',fn:()=>null},{t:'Screenshot it',fn:()=>{st.vars.screenshot=1;return null;}}]);stKnow('dayo','Loan apps are chasing Dayo for ₦180,000.');stGo('dayo','truth',120);}},
  truth:{title:'Talk to Dayo',hint:'You know about the loan messages. Talk to Dayo, carefully.',trigger:'talk',who:'dayo',hours:[10,23],expire:4*1440,missed:'spiral',label:'Ask Dayo about the loan messages',
    run:st=>{storyDlg('dayo','dayo','You show him the message. For a second Dayo\'s face does nothing at all. Then: "Who else got it?"',[
      {t:'"Just me, I think. Talk to me. No one else has to know."',fn:()=>{rdAdd('dayo','trust',12);learnFact('dayo','worry');stKnow('dayo','Dayo\'s father cut his allowance after an argument.');stKnow('dayo','He has been borrowing from loan apps to keep up appearances.');
        memAdd('dayo','confided','Told you about the loans',2);stLog('dayo','You talked to Dayo privately about the loans.');setTimeout(()=>dayoChoices(st),80);return 'He sits down on the kerb in his designer jeans. "My dad stopped my allowance. Divorce stuff. I couldn\'t just… stop being Dayo." He laughs. It isn\'t funny.';}},
      {t:'Tell the whole room so he\'s forced to deal with it',fn:()=>{rdAdd('dayo','res',30);rdAdd('dayo','trust',-25);memAdd('dayo','betrayal','You exposed his debt in front of everyone',3);witnessed('heard','Dayo owes loan apps money',0.8);stLog('dayo','You exposed Dayo\'s debts publicly.');stGo('dayo','spiral',1440);return 'The room goes quiet. Dayo smiles, picks up his keys and leaves. He doesn\'t come to Mac D the next day. Or the next.';}}]);}},
  plan:{title:'Dayo\'s plan',trigger:'auto',hours:[9,22],run:st=>{const v=st.vars;
    if(v.dad){rel('dayo',12);stEnd('dayo','He called his father','The call was hard. His father paid off the loans, on conditions: a budget, monthly statements, and Sunday lunch every month. Dayo complains about Sunday lunch. He goes every time.');S.flags.dayoFriend=1;return;}
    if(v.sell){rel('dayo',10);S.skills.business+=0.2;stEnd('dayo','He sold the drip','You helped Dayo sell two watches, three designer shirts and a speaker at the Mart. Loans cleared. He wears plain tees now and says it\'s a "look".');return;}
    if(v.lend){if(chance(0.5)){rel('dayo',3);stEnd('dayo','He paid you back… eventually','Dayo paid back your money in pieces over five weeks. The loan apps are still calling.');earn(v.lend,'Dayo finally paid you back');return;}
      stEnd('dayo','Your money went into the hole','Dayo used your money to pay one loan app and borrowed from two more. You stopped asking about it.');return;}
    stEnd('dayo','Still pretending','Dayo still pays for everyone. The loan apps still call.');}},
  spiral:{title:'Dayo\'s spiral',trigger:'auto',hours:[9,22],run:st=>{stEnd('dayo','It caught up with him','A loan app sent everyone in his contacts a picture of Dayo with "THIEF" written across it. He went home to Lagos for "a family matter". His room is locked.');}}}};
function dayoChoices(st){storyDlg('dayo','dayo','"How do I get out of this?"',[
  {t:'"Call your dad. Tell him everything. I\'ll stay with you."',fn:()=>{st.vars.dad=1;rdAdd('dayo','trust',10);stGo('dayo','plan',1440);stLog('dayo','You convinced Dayo to call his father.');return 'He dials. Hangs up. Dials again. You stay.';}},
  {t:'"Sell some of your stuff at the Mart. Clear the loans yourself."',fn:()=>{st.vars.sell=1;rdAdd('dayo','resp',6);stGo('dayo','plan',1440);stLog('dayo','You helped Dayo plan to sell his things.');return '"My watches?" A long pause. "…How much do you think the Rolex will go for?"';}},
  {t:'Lend him ₦20,000',fn:()=>{if(!spend(20000,'Lent Dayo money'))return 'You don\'t have ₦20,000.';st.vars.lend=20000;rel('dayo',6);stGo('dayo','plan',1440);stLog('dayo','You lent Dayo ₦20,000.');return '"You\'re a real one. I\'ll pay you back next week. Promise."';}}]);}

/* ===== 6. The missing laptop (a fair mystery with clues) ===== */
STORIES.laptop={title:'The missing laptop',cat:'Mystery',cast:['sadiq','femi','emeka'],start:()=>dayOf(S.t)>=4&&!S.intro&&S.room!=='210',first:'gone',
  leads:[
    {id:'lib',where:'library',label:'Check the Library sign-in book',ok:st=>st.ch==='clues',run:st=>{st.vars.lead_lib=1;stKnow('laptop','Clue: the Library book shows Sadiq signed in WITH his laptop at 7:12 PM. No sign-out for the laptop.');toast('Clue found','Sadiq brought his laptop to the Library that night. So it wasn\'t stolen from the room.','good');clueCheck(st);}},
    {id:'gate',where:'gate',label:'Ask Security if anything was handed in',ok:st=>st.ch==='clues'&&st.vars.lead_lib,run:st=>{st.vars.lead_gate=1;stKnow('laptop','Clue: Security logged a laptop handed in from the Library at 10 PM. It was collected the next morning by "I. Obi, Rm 108".');toast('Clue found','A laptop was handed in to Security, and collected by "I. Obi, Rm 108".','good');clueCheck(st);}},
    {id:'kiosk',where:'kiosk',label:'Ask Mama Ngozi about Femi\'s money',ok:st=>st.ch==='clues',run:st=>{st.vars.lead_kiosk=1;stKnow('laptop','Clue: Femi sold his old phone to Mama Ngozi\'s son for ₦8,000. That explains his money.');toast('Clue found','Femi\'s "suspicious" money came from selling his old phone.','good');clueCheck(st);}}],
  chapters:{
  gone:{title:'Sadiq\'s laptop is gone',trigger:'auto',where:'boys',hours:[18,22.5],
    run:st=>{storyDlg('laptop','sadiq','Sadiq is turning the room upside down. "My laptop. It\'s gone. My whole final project is on it." Emeka points across the room: "Femi was flashing money yesterday. Just saying."',[
      {t:'"Femi, just bring it back."',fn:()=>{st.vars.accused=1;rel('femi',-12);rdAdd('femi','res',30);memAdd('femi','betrayal','You accused him of stealing in front of everyone',3);nnAdd('femi','sadiq',-20);witnessed('heard','Femi was accused of stealing Sadiq\'s laptop',0.8);stLog('laptop','You accused Femi in front of the room.');stGo('laptop','clues',0);return 'Femi stands up slowly. "Say that again." The room goes very quiet. He walks out.';}},
      {t:'"Calm down. Let\'s find out what happened first."',fn:()=>{st.vars.calm=1;MATES.forEach(m=>rdAdd(m,'resp',3,true));rdAdd('femi','trust',6);stLog('laptop','You told everyone not to jump to conclusions.');stGo('laptop','clues',0);return 'Sadiq nods. Femi gives you a look. Not friendly, not unfriendly. "Thank you."';}},
      {t:'Stay out of it',fn:()=>{stLog('laptop','You stayed out of the laptop drama.');stGo('laptop','clues',0);st.vars.stayed=1;return 'You put your earpiece in. The argument goes on until midnight.';}}]);
      toast('🔎 Mystery','Find out what happened to Sadiq\'s laptop. Leads are in your Journal (Phone → Journal).');}},
  clues:{title:'Investigate: where did the laptop go?',trigger:'none',expire:5*1440,lapse:st=>{stLog('laptop','You never solved it.');stEnd('laptop','Unsolved','Paulinus found the laptop two weeks later in a 100L room. By then everyone had decided it was Femi. Nobody apologized to him.');rdAdd('femi','res',10);}},
  room108:{title:'Room 108',hint:'The laptop was collected by "I. Obi" of Room 108. Go to the hostel.',trigger:'place',where:'boys',hours:[16,22],label:'Knock on Room 108',
    run:st=>{storyDlg('laptop','me','Room 108. Ikenna Obi (100L) opens the door. On his desk: a laptop with an Arsenal sticker. Sadiq\'s Arsenal sticker. He follows your eyes. "I… found it. In the Library. I was going to return it."',[
      {t:'"Then return it now. And we\'ll forget this."',fn:()=>{st.vars.found=1;st.vars.calmTake=1;stLog('laptop','You got the laptop back from Ikenna calmly.');stGo('laptop','return',0);return 'He hands it over without another word.';}},
      {t:'Report him to '+fx('Mr. Paulinus'),fn:()=>{st.vars.found=1;st.vars.reported=1;S.suspicion=Math.max(0,S.suspicion-5);stLog('laptop','You reported Ikenna to the hostel office.');stGo('laptop','return',0);return 'Paulinus takes it from there. Ikenna gets three points on his record.';}},
      {t:'Call your boys on him',fn:()=>{const ready=BOYS.filter(b=>(S.rel[b]||0)>=60);if(ready.length<2)return 'You need two loyal boys (60+ friendship) for that. You take the laptop calmly instead.';st.vars.found=1;st.vars.force=1;S.skills.street+=0.1;stLog('laptop','You and your boys took the laptop back by force.');stGo('laptop','return',0);if(chance(.3))setTimeout(()=>addDiscipline(2,'Fight in Room 108'),400);return 'It\'s over quickly. You have the laptop. Ikenna has a lesson and a swollen lip.';}}]);}},
  return:{title:'Give Sadiq his laptop',trigger:'auto',where:'boys',hours:[6,23.5],
    run:st=>{const v=st.vars;rel('sadiq',15);rdAdd('sadiq','trust',12);memAdd('sadiq','helped','You found his laptop and his project',3);
      const C=[];if(v.accused)C.push({t:'Apologize to Femi in front of everyone',fn:()=>{rdAdd('femi','res',-25);rel('femi',8);rdAdd('femi','resp',6);nnAdd('femi','sadiq',15);memAdd('femi','apology','You apologized in front of everyone',2);stEnd('laptop','Solved, and you apologized','You found the laptop, proved Femi didn\'t take it, and apologized in front of the room. Femi pretends it\'s no big deal. It is.');return 'Femi waves it off. "It\'s fine." Then: "Thanks for saying it out loud."';}},
        {t:'Say nothing to Femi',fn:()=>{rdAdd('femi','riv',15);stEnd('laptop','Solved, but Femi remembers','You found the laptop, but you never took back what you said about Femi. He hasn\'t forgotten.');return null;}});
      else C.push({t:'Hand it over',fn:()=>{if(v.calm&&v.lead_kiosk){rdAdd('femi','resp',10);rel('femi',8);nnAdd('femi','sadiq',10);}stEnd('laptop','Solved','You followed the clues and found the laptop. '+(v.lead_kiosk?'Femi\'s name was cleared too, and he knows you were the one who did it.':'Sadiq\'s project is safe.'));return null;}});
      storyDlg('laptop','sadiq','You put the laptop on Sadiq\'s bunk. He opens it. His project is there. He doesn\'t say anything for a moment, then stands up and shakes your hand like a lecturer. "Thank you. Really."',C);}}}};
function clueCheck(st){if(st.vars.lead_lib&&st.vars.lead_gate&&st.ch==='clues'){stGo('laptop','room108',0);toast('🔎 Mystery','You know who has the laptop. Go to the hostel and knock on Room 108.','good');}}

/* ===== 7. The letter from home (family expectations) ===== */
STORIES.sadiq={title:'The letter from home',cat:'Family',cast:['sadiq'],start:()=>dayOf(S.t)>=6&&!S.intro&&S.room!=='210',first:'letter',
  chapters:{
  letter:{title:'Sadiq\'s letter',trigger:'auto',where:'boys',hours:[19,22.5],
    run:st=>{storyDlg('sadiq','sadiq','Sadiq is reading a letter. A real paper letter. He has read it at least five times. When he notices you, he folds it very small.',[
      {t:'"Bad news from home?"',fn:()=>{const tr=rd('sadiq').trust+(S.rel.sadiq||0)*0.4;if(tr<35){stGo('sadiq','letter2',2*1440);return '"It\'s fine." It clearly isn\'t.';}stKnow('sadiq','Sadiq\'s father wants him to switch to Medicine at ABU next session.');stKnow('sadiq','Sadiq loves programming and is entering a national coding competition.');stGo('sadiq','choice',0);setTimeout(()=>STORIES.sadiq.chapters.choice.run(st),80);return '"My father wants me to transfer. Medicine, at ABU Zaria. Next session." He looks at his laptop. "I\'m entering the national coding competition next month."';}},
      {t:'Leave him alone',fn:()=>{stGo('sadiq','letter2',2*1440);return null;}}]);}},
  letter2:{title:'Sadiq is quiet',hint:'Sadiq has been unusually quiet since that letter. Maybe try again, when he trusts you more.',trigger:'talk',who:'sadiq',hours:[8,22.5],expire:6*1440,missed:'gone',label:'Ask Sadiq about the letter',
    run:st=>{const tr=rd('sadiq').trust+(S.rel.sadiq||0)*0.4;if(tr<30){rdAdd('sadiq','trust',2);stGo('sadiq','letter2',1440);storyDlg('sadiq','sadiq','"Not now."',[{t:'Okay',fn:()=>null}]);return;}
      stKnow('sadiq','Sadiq\'s father wants him to switch to Medicine at ABU next session.');stGo('sadiq','choice',0);STORIES.sadiq.chapters.choice.run(st);}},
  choice:{title:'Advise Sadiq',trigger:'none',run:st=>{storyDlg('sadiq','sadiq','"What would you do?"',[
    {t:'"Talk to your father. Show him what you\'ve built."',fn:()=>{st.vars.talk=1;rdAdd('sadiq','trust',8);stLog('sadiq','You told Sadiq to talk to his father honestly.');stGo('sadiq','call',1440);return '"He doesn\'t listen." A pause. "But maybe if I show him." He opens his project.';}},
    {t:'"Win the competition. Then he can\'t argue."',fn:()=>{st.vars.win=1;rdAdd('sadiq','resp',6);stLog('sadiq','You told Sadiq to let the results speak.');stGo('sadiq','call',3*1440);return '"Help me practise?" You end up doing past questions together until 2 AM.';}},
    {t:'"Your parents know best. Do Medicine."',fn:()=>{st.vars.obey=1;rdAdd('sadiq','trust',-4);stLog('sadiq','You told Sadiq to obey his father.');stGo('sadiq','call',2*1440);return '"Maybe." He closes the laptop.';}}]);}},
  call:{title:'The phone call',trigger:'auto',where:'boys',hours:[18,22.5],
    run:st=>{const v=st.vars;if(v.obey){rel('sadiq',-2);stEnd('sadiq','He will transfer','Sadiq applied to ABU for Medicine. He still codes at night, quietly. The competition came and went without him.');return;}
      const won=v.win&&chance(0.55+S.skills.tech*0.05);
      if(v.talk||won){rel('sadiq',12);rdAdd('sadiq','trust',10);memAdd('sadiq','helped','You stood by him when his father called',3);
        stEnd('sadiq',won?'He won, and he stays':'A compromise',won?'Sadiq came second in the national competition. His father drove from Kano to see the award. He is staying in Computer Science.':'Sadiq showed his father the project on a video call. His father didn\'t understand all of it, but he understood his son. Sadiq stays, as long as his CGPA stays above 4.0.');return;}
      stEnd('sadiq','Still deciding','The competition didn\'t go well. Sadiq\'s father is still waiting for an answer.');}},
  gone:{title:'Sadiq decides alone',trigger:'auto',run:st=>{stEnd('sadiq','He decided alone','Sadiq never talked about the letter again. At the end of the semester you hear he\'s transferring.');}}}};

/* ===== 8. Amina's voice (talent, secrets, encouragement) ===== */
STORIES.amina={title:'Amina\'s voice',cat:'Friendship & talent',cast:['amina'],start:()=>dayOf(S.t)>=5&&!S.intro,first:'chapel',
  chapters:{
  chapel:{title:'Someone singing in the empty Chapel',hint:'In the evening, someone sings alone in the Chapel.',trigger:'place',where:'chapel',hours:[17.5,20],expire:5*1440,missed:'missed',label:'Follow the singing',
    run:st=>{const nm=partnerName();storyDlg('amina','amina','The Chapel is empty except for one voice, singing near the altar. It\'s '+nm+'. When '+they()+' sees you, '+they()+' stops so fast '+they()+' nearly drops '+(isF()?'his':'her')+' phone. "How long have you been there?!"',[
      {t:'"That was beautiful. Why do you hide it?"',fn:()=>{rel('amina',8);rdAdd('amina','trust',8);st.vars.enc=1;stKnow('amina',nm+' sings, and is terrified of anyone hearing.');stGo('amina','show',2*1440);return '"Because when I sing in front of people my voice shakes." A tiny smile. "You really think it was good?"';}},
      {t:'"I won\'t tell anyone. Promise."',fn:()=>{rdAdd('amina','trust',10);st.vars.secret=1;stGo('amina','show',2*1440);return '"Thank you." '+nm+' looks relieved. "It\'s just for me. And God."';}},
      {t:'Tease '+(isF()?'him':'her')+' about it',fn:()=>{rel('amina',-4);rdAdd('amina','res',8);stGo('amina','missed',3*1440);return 'You hum the song back, badly. '+nm+' doesn\'t laugh. "Okay. Goodnight."';}}]);}},
  show:{title:'The talent show',trigger:'msg',who:'rep',run:st=>{msg('rep','📢 TALENT NIGHT this Friday, Student Centre, 7 PM! Singers, dancers, comedians. Winner gets ₦50,000! Register with me.');stGo('amina','convince',60);}},
  convince:{title:'Convince Amina to sing',hint:'Talk to Amina about the talent show.',trigger:'talk',who:'amina',hours:[8,21],expire:4*1440,missed:'missed',label:'Talk about the talent show',
    run:st=>{const nm=partnerName();const C=[
      {t:'"Enter. I\'ll be in the front row."',fn:()=>{const tr=rd('amina').trust+(S.rel.amina||0)*0.4;if(tr<40){stGo('amina','missed',2*1440);return '"I can\'t. I just can\'t." Maybe '+they()+' needs to trust you more.';}st.vars.enter=1;rel('amina',6);stGo('amina','night',1440);return '"…Front row. You promise?"';}}];
      if(st.vars.secret)C.push({t:'Tell the course rep to sign '+(isF()?'him':'her')+' up as a surprise',fn:()=>{rdAdd('amina','res',20);rdAdd('amina','trust',-20);memAdd('amina','betrayal','You broke your promise about the singing',3);st.vars.broke=1;stGo('amina','night',1440);return 'The poster goes up with '+nm+'\'s name on it. '+nm+' sees it, and then sees you.';}});
      C.push({t:'Don\'t push',fn:()=>{stGo('amina','missed',2*1440);return null;}});
      storyDlg('amina','amina','"Did you see the talent show poster?" '+nm+' asks, too casually.',C);}},
  night:{title:'Talent night',hint:'Talent night is at the Student Centre. Be there by 7 PM.',trigger:'place',where:'centre',hours:[18.5,22],expire:2*1440,missed:'noshow',label:'Watch talent night',
    run:st=>{const nm=partnerName();if(st.vars.broke){storyDlg('amina','amina',nm+' walks on stage because '+they()+' has no choice now. '+(isF()?'His':'Her')+' voice shakes for the first verse. Then it doesn\'t. The room goes silent. Third place. Afterwards '+they()+' walks straight past you.',[{t:'Let '+(isF()?'him':'her')+' go',fn:()=>{stEnd('amina','Third place, and a broken promise',nm+' came third. '+(isF()?'He':'She')+' says the singing was worth it. You were not.');return null;}}]);return;}
      startAction('Watching talent night',90,{per:()=>{N('fun',0.5);},done:()=>{const win=chance(0.5+(S.rel.amina||0)/250);rel('amina',12);rdAdd('amina','trust',10);rdAdd('amina','attr',6);memAdd('amina','helped','You believed in the singing',3);
        stEnd('amina',win?'First place':'Runner-up',win?nm+' won! ₦50,000 and a standing ovation. '+(isF()?'He':'She')+' found you in the front row the whole time.':nm+' came second, and got a standing ovation. "Next year, first," '+they()+' says, still shaking.');}});}},
  noshow:{title:'You missed it',trigger:'auto',run:st=>{rel('amina',-5);memAdd('amina','stoodup','You promised the front row and didn\'t come',2);stEnd('amina','You missed it',partnerName()+' sang. You weren\'t there.');}},
  missed:{title:'The voice stays secret',trigger:'auto',run:st=>{stEnd('amina','Still a secret',partnerName()+' still sings, alone, in the empty Chapel. Maybe one day.');}}}};

/* ================= JOURNAL (phone app) ================= */
HOOKS.apps.push(()=>{const act=storyIds().filter(id=>{const st=storySt(id);return st&&!st.done;}).length;return [['journal','Journal'+(act?' ('+act+')':''),'#7a5a2a','✎'],['people','People','#4a3a6b','☺']];});
HOOKS.back.journal='home';HOOKS.back.jstory='journal';HOOKS.back.people='home';HOOKS.back.person='people';HOOKS.back.news='journal';
HOOKS.views.journal=(b,T)=>{T.textContent='Journal';const ids=storyIds().filter(id=>storySt(id));
  const active=ids.filter(id=>!storySt(id).done),done=ids.filter(id=>storySt(id).done);
  b.append(el('div','sec','Active stories · '+active.length));if(!active.length)b.append(el('div','note','Nothing yet. Stories start as you meet people and explore campus.'));
  active.forEach(id=>{const D=STORIES[id],st=storySt(id),c=D.chapters[st.ch]||{};const r=el('button','thread','<div class="av" style="display:grid;place-items:center;background:#7a5a2a;color:#fff;font-weight:800">'+(D.cat==='Mystery'?'?':'★')+'</div><div class="l"><b>'+esc(D.title)+'</b><span>'+esc(c.title||'')+(S.t<st.next?' · later':'')+'</span></div>');r.onclick=()=>{phoneView='jstory';phoneArg=id;renderPhone();};b.append(r);});
  const myst=active.filter(id=>STORIES[id].cat==='Mystery');if(myst.length){b.append(el('div','sec','Unsolved mysteries'));myst.forEach(id=>b.append(el('div','note','🔎 '+esc(STORIES[id].title)+': '+storySt(id).known.length+' clue(s) found')));}
  const nb=el('button','newchat','<b>Campus news & recent events</b><span>What happened lately</span>');nb.onclick=()=>{phoneView='news';renderPhone();};b.append(nb);
  b.append(el('div','sec','Finished · '+done.length));done.forEach(id=>{const st=storySt(id);const r=el('button','thread','<div class="av" style="display:grid;place-items:center;background:#2f6b3e;color:#fff;font-weight:800">✓</div><div class="l"><b>'+esc(STORIES[id].title)+'</b><span>'+esc(st.outcome||'')+'</span></div>');r.onclick=()=>{phoneView='jstory';phoneArg=id;renderPhone();};b.append(r);});};
HOOKS.views.jstory=(b,T)=>{const id=phoneArg,D=STORIES[id],st=storySt(id);if(!D||!st){phoneView='journal';return HOOKS.views.journal(b,T);}T.textContent=D.title;
  b.append(el('div','note',esc(D.cat)+' · started Day '+dayOf(st.started)));
  if(st.done)b.append(el('div','bgcard','<b>'+esc(st.outcome)+'</b><div class="note">'+esc(st.summary||'')+'</div>'));
  else{const c=D.chapters[st.ch]||{};b.append(el('div','bgcard','<b>'+esc(c.title||'')+'</b><div class="note">'+esc(c.hint||'Keep living your life. This will come back to you.')+(c.where&&c.trigger==='place'?'<br>Where: '+locName(c.where):'')+(c.who&&PEOPLE[c.who]&&c.trigger==='talk'?'<br>Who: '+fx(PEOPLE[c.who].name):'')+(c.hours?'<br>When: '+fmtTime(c.hours[0]*60)+' – '+fmtTime(c.hours[1]*60):'')+(S.t<st.next?'<br>Not yet. Give it time.':'')+'</div>'));
    (D.leads||[]).forEach(ld=>{if(st.ch==='clues'||st.vars['lead_'+ld.id])b.append(el('div','txrow','<div>'+(st.vars['lead_'+ld.id]?'✓ ':'🔎 ')+esc(ld.label)+'<span>'+locName(ld.where)+'</span></div>'));});}
  if(st.known.length){b.append(el('div','sec','What you found out'));st.known.forEach(k=>b.append(el('div','note','· '+esc(k))));}
  if(st.log.length){b.append(el('div','sec','Your decisions'));st.log.slice(-8).forEach(l=>b.append(el('div','note','Day '+dayOf(l.t)+' · '+esc(l.x))));}};
HOOKS.views.news=(b,T)=>{T.textContent='Campus news';const L=(S.news||[]).slice(0,25);if(!L.length)b.append(el('div','note','Quiet week so far.'));L.forEach(n=>b.append(el('div','txrow','<div>'+esc(n.x)+'<span>Day '+dayOf(n.t)+' · '+fmtTime(n.t)+'</span></div>')));
  if((S.jlog||[]).length){b.append(el('div','sec','Your recent moments'));S.jlog.slice(0,15).forEach(n=>b.append(el('div','note','Day '+dayOf(n.t)+' · '+esc(n.x))));}};
HOOKS.views.people=(b,T)=>{T.textContent='People';b.append(el('div','note','Everyone you\'ve met. Tap someone to see what you know about them and how they feel about you.'));
  const ids=CAST_IDS.concat(['amina','tunde','emeka','sadiq','chidi','femi','kunle']).filter(id=>PEOPLE[id]);
  ids.sort((a,c)=>(S.rel[c]||0)-(S.rel[a]||0)).forEach(id=>{const met=(S.rel[id]||0)>=15||(S.known&&(S.known[id]||[]).length)||!CAST[id];const r=el('button','thread','<div class="av">'+avatar(id)+'</div><div class="l"><b>'+fx(PEOPLE[id].name)+'</b><span>'+(met?fx(PEOPLE[id].role)+' · '+tier(Math.round(S.rel[id]||0)):'Not met yet')+'</span></div>');
    r.onclick=()=>{phoneView='person';phoneArg=id;renderPhone();};b.append(r);});};
HOOKS.views.person=(b,T)=>{const id=phoneArg;if(!PEOPLE[id]){phoneView='people';return HOOKS.views.people(b,T);}T.textContent=fx(PEOPLE[id].name);
  b.append(el('div','prof','<div class="av">'+avatar(id)+'</div><b>'+fx(PEOPLE[id].name)+'</b><span>'+fx(PEOPLE[id].role)+'</span>'));
  b.append(prow(pbtn('Message',()=>{phoneView='thread';phoneArg=id;})));runHooks(HOOKS.contact,id,b);};
/* ================= CAMPUS EVENTS: the world moves without you ================= */
function news(x){S.news=S.news||[];S.news.unshift({t:S.t,x});if(S.news.length>40)S.news.length=40;}
EVENTS.push(
  {id:'club_rec',cd:7,ok:()=>wd(S.t)===0&&minOf(S.t)>=10*60&&minOf(S.t)<15*60,run:()=>{const club=pick(['the Drama Society','the Tech Club','the Catholic Students Association','the Debate Club','the Red Cross club']);news(club+' is recruiting new members at the Student Centre.');toast('Campus',club+' is recruiting at the Student Centre today.');}},
  {id:'match_day',cd:7,ok:()=>wd(S.t)===5&&minOf(S.t)>=12*60&&minOf(S.t)<15*60,run:()=>{news('Inter-faculty football match at the Sports Field today, 4 PM.');msg('tunde','Match today! Sciences vs Social Sciences, 4 PM at the field. Musa is playing ⚽');}},
  {id:'birthday',cd:6,ok:()=>minOf(S.t)>=9*60&&minOf(S.t)<17*60,run:()=>{const who=pick(['tunde','emeka','chidi','amina','zara','musa'].filter(k=>(S.rel[k]||0)>=30));if(!who)return;const nm=fx(PEOPLE[who].name);news('It\'s '+nm+'\'s birthday today.');
    dialog({who,kicker:'Birthday',text:'Someone in the group chat reminds everyone: it\'s <b>'+nm+'\'s</b> birthday today 🎂',choices:[{t:'Buy a small cake (₦2,500)',fn:()=>{if(!spend(2500,'Birthday cake for '+nm))return 'You can\'t afford it right now. You send a long message instead.';rel(who,10);memAdd(who,'gift','You bought them a birthday cake',2);return nm+' is genuinely surprised. "You remembered!"';}},{t:'Send a birthday message',fn:()=>{rel(who,2);return 'A short message with three emojis. Classic.';}},{t:'Forget about it',fn:()=>{memAdd(who,'forgot','You forgot their birthday',0.8);return null;}}]});}},
  {id:'lost_phone',cd:9,ok:()=>!S.inside&&minOf(S.t)>=8*60&&minOf(S.t)<20*60,run:()=>{dialog({who:'me',kicker:'On the ground',text:'An iPhone lies face-down on the path. No one around. The lock screen shows a photo of a girl with her grandmother.',choices:[
    {t:'Hand it in at the Main Gate security post',fn:()=>{xp(15,'Did the right thing');news('A lost iPhone was handed in to Security. The owner, a 300L student, collected it in tears.');rdAdd('hauwa','resp',4,true);setTimeout(()=>msg('rep','Someone returned Precious\'s phone to Security! Whoever you are, God bless you 🙏'),4000);return 'Security writes it in the log. You feel lighter.';}},
    {t:'Keep it',fn:()=>{earn(25000,'Sold a found phone at Bwari');addMoodlet('Guilty conscience',-8,2880);S.suspicion+=4;news('A 300L student\'s iPhone was lost near the Library. It was never found.');if(chance(.3))setTimeout(()=>dialog({who:'tiger',kicker:'Security',text:'Officer Tiger stops you. "A phone was lost near the Library. CCTV saw someone bend down." He looks at you for a long time. "Hm."',choices:[{t:'Keep walking',fn:()=>{S.suspicion+=8;return null;}}]}),3000);return 'You sell it at Bwari for ₦25,000. It doesn\'t feel like ₦25,000.';}},
    {t:'Leave it',fn:()=>null}]});}},
  {id:'water',cd:8,ok:()=>minOf(S.t)>=6*60&&minOf(S.t)<9*60,run:()=>{news('No water in the hostels this morning. Buckets everywhere.');toast('Campus','No water in the hostels today. The queue at the tap behind GGS is long.','bad');N('hygiene',-8);}},
  {id:'rumour',cd:5,ok:()=>dayOf(S.t)>=3,run:()=>{const L=['Someone saw Officer Tiger buying shawarma at Mac D. Smiling.','They say the Vice-Chancellor is visiting the hostels this week.','A 400L student got a job offer from a Lagos tech company before graduating.','The Drama Society\'s play was cancelled after the lead actor got malaria.'];news(pick(L));}},
  {id:'exam_near',cd:10,ok:()=>{const d=dayOf(S.t);return typeof nextExamDay==='function'&&nextExamDay()-d<=5&&nextExamDay()-d>=3;},run:()=>{news('Exams start in a few days. The Library is full until it closes.');msg('rep','Exam timetable is out! Library is packed, go early 📚');}}
);
