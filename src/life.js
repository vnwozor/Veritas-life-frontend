/* ================= LIVING CAMPUS: people with their own lives =================
   New students with their own backgrounds, routines, worries and secrets. Relationships have several
   dimensions (trust, friendship, respect, attraction, rivalry, resentment, familiarity) and people only
   remember what they saw or were told. Stories (stories.js) and dating (dating.js) build on this. */
function srand(seed){let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function sr(key){return srand(Math.floor(hash(String(S.seed)+'|'+key)*4294967295));}
const CAST={
  nneka:{name:'Nneka',full:'Nneka Eze',female:true,age:19,lvl:200,dept:'ACC',role:'200L Accounting',from:'Nsukka, Enugu State',money:'struggling',
    fam:'Her father sold motor parts at Ogbete Market until his shop burned last year. Her mother teaches primary school.',
    pers:'Disciplined, proud and private. Hates pity. Dry humour once she trusts you.',goals:'A first-class degree, then ICAN, then her own accounting firm.',
    likes:'Gospel music, clean spreadsheets, akara in the morning',dislikes:'Pity, lateness, gossip',hobbies:'Choir and tutoring 100L students',
    worry:'Her school fees for this semester are still unpaid.',secret:'She has been skipping dinner to save towards her fees.',values:'Honesty and hard work',
    routine:[[6.5,9,['mamaput','library']],[9,15,['lecture','library','library','admin']],[15,19,['ggs','library','ggs']],[19,22.5,['girls']]],
    romance:'slow',jokes:-1,flattery:-1,deep:2,
    look:{female:true,skin:0x6b4429,face:'oval',hairStyle:'cornrows',hairC:0x161010,top:'long',shirt:0x2f6b8a,pants:0x2d3f5c,skirt:true,shoeStyle:'shoes',shoes:0x2a1d14,earrings:true,bag:0x5a3a2a,bagStyle:'back',lips:0.015,nose:0.025,height:1.0}},
  tobi:{name:'Tobi',full:'Tobi Adeyemi',female:false,age:21,lvl:300,dept:'SEN',role:'300L Software Engineering',from:'Ibadan, Oyo State',money:'comfortable',
    fam:'His parents are both bankers and want him to join a bank after graduation. His younger sister wants to be a doctor.',
    pers:'Optimistic, fast-talking, always building something. Forgets to eat. Generous with ideas, careless with money.',goals:'Build CampusRun, a delivery app for students, into a real company.',
    likes:'Late-night coding, jollof, Afrobeats',dislikes:'Meetings that should be emails, people who say "it can\'t work"',hobbies:'Hackathons and FIFA',
    worry:'CampusRun has no money left and his first rider just quit.',secret:'He used his own school fees as startup capital and hasn\'t told his parents.',values:'Freedom and building things',
    routine:[[8,12,['library','lecture','centre']],[12,14,['vcafe','macd']],[14,19,['library','keke','centre']],[19,23,['centre','boys','library']]],
    romance:'yes',jokes:1,flattery:0,deep:1,
    look:{skin:0x8d5a3b,face:'long',hairStyle:'highfade',hair:4.6,hairC:0x161010,top:'tee',shirt:0x111111,pants:0x2d3f5c,shoeStyle:'sneakers',shoes:0xf2f2f2,glasses:true,watch:true,bag:0x2a2a2a,bagStyle:'sling',height:1.03,build:0.95}},
  zara:{name:'Zara',full:'Zara Bello',female:true,age:20,lvl:200,dept:'MCM',role:'200L Mass Communication',from:'Kaduna',money:'comfortable',
    fam:'Her mum runs a boutique in Kaduna. Her older sister is a news anchor everybody compares her to.',
    pers:'Bubbly, loud, funny, always filming. Secretly anxious about what people think of her.',goals:'100,000 followers on VIBE and her own talk show.',
    likes:'Compliments, ring lights, shawarma, gist',dislikes:'Being ignored, bad lighting, Mondays',hobbies:'Content creation, makeup',
    worry:'Her VIBE numbers stopped growing and a brand deal fell through.',secret:'She paid for fake followers, and a blog is about to expose it.',values:'Being seen, being liked',
    routine:[[8,11,['vcafe','lecture']],[11,16,['lecture','macd','centre']],[16,19.5,['sports','macd','court','centre']],[19.5,23,['girls']]],
    romance:'yes',jokes:1,flattery:2,deep:0,
    look:{female:true,skin:0x9a6845,face:'heart',hairStyle:'bob',hairC:0x5a1a2a,top:'dress',shirt:0xc23b6a,pants:0x222222,shoeStyle:'slides',shoes:0xe3b04b,earrings:true,necklace:true,lipC:0x8a2a3a,bag:null,height:1.0}},
  musa:{name:'Musa',full:'Musa Ibrahim',female:false,age:18,lvl:100,dept:'ECO',role:'100L Economics',from:'Zaria, Kaduna State',money:'tight',
    fam:'Eldest of six. His father drives a long-distance truck. Everyone at home is counting on him.',
    pers:'Quiet at first, very funny once he knows you. Loyal. Hates losing.',goals:'Play professional football without dropping out of school.',
    likes:'Football, tuwo and miyan kuka, Barcelona',dislikes:'Cheats, arrogance, early lectures',hobbies:'Football every evening',
    worry:'A scout from a Kwara club wants to see him, on the same day as his first exam.',secret:'He has a knee that swells after every match. He hasn\'t told anyone.',values:'Loyalty and family',
    routine:[[7,9,['first','second']],[9,15,['lecture','lecture','library']],[15.5,19,['sports','sports','court']],[19,22.5,['boys','suya']]],
    romance:'yes',jokes:2,flattery:0,deep:1,
    look:{skin:0x3a2416,face:'square',hairStyle:'low',hair:1.2,top:'tee',shirt:0x1f8a4c,pants:0x222222,shoeStyle:'sneakers',shoes:0x2b6fd9,height:1.07,build:1.04,bag:null}},
  dayo:{name:'Dayo',full:'Dayo Coker',female:false,age:22,lvl:300,dept:'LAW',role:'300L Law',from:'Lekki, Lagos',money:'looks rich',
    fam:'His parents divorced last year. His father pays his fees but they barely speak.',
    pers:'Flashy and confident in public, lonely in private. Buys everyone food. Rarely asks for anything.',goals:'Become a big lawyer like his father, or at least make him proud.',
    likes:'Designer clothes, Mac D, being the one who pays',dislikes:'Silence, his own room, people who ask too many questions',hobbies:'Parties, cars',
    worry:'His father stopped his allowance after an argument.',secret:'He has been borrowing from QuickKash and other loan apps to keep up his lifestyle.',values:'Respect and appearances',
    routine:[[9,12,['macd','lecture','admin']],[12,15,['macd','centre','lecture']],[15,19,['carpark','centre','macd']],[19,23.5,['centre','boys','lodge2']]],
    romance:'yes',jokes:1,flattery:1,deep:-1,
    look:{skin:0x7a4f30,face:'oval',hairStyle:'waves',hair:2.2,top:'polo',shirt:0xf2f2f2,pants:0x8a7a5a,shoeStyle:'shoes',shoes:0x2a1d14,watch:true,necklace:true,height:1.04,bag:null}},
  hauwa:{name:'Hauwa',full:'Hauwa Garba',female:true,age:20,lvl:200,dept:'NSC',role:'200L Nursing Science',from:'Bauchi',money:'comfortable',
    fam:'Her mother is a nurse at a teaching hospital. Three older brothers who check on her every day.',
    pers:'Calm, observant, kind and very hard to fool. People tell her their problems.',goals:'Become a surgeon. She is not interested in dating right now.',
    likes:'Quiet places, kunun aya, honest people',dislikes:'Lies, loud parties',hobbies:'Reading, volunteering at the Health Centre',
    worry:'She noticed something about a friend\'s health and doesn\'t know if she should say it.',secret:'She knows more about what happens on campus at night than anyone thinks.',values:'Truth and care',
    routine:[[7,9,['vcafe','clinic']],[9,15,['lecture','library','clinic']],[15,19,['clinic','library']],[19,22,['girls']]],
    romance:'no',jokes:0,flattery:-1,deep:2,
    look:{female:true,skin:0x8d5a3b,face:'oval',hairStyle:'bald',hijab:0x2b4f8a,top:'long',shirt:0xe8e2d0,pants:0x2b4f8a,skirt:true,shoeStyle:'shoes',shoes:0x2a1d14,bag:0x2a2a2a,bagStyle:'sling',height:0.98}}};
const CAST_IDS=Object.keys(CAST);
const FACTS=[['role',0,'Studies'],['from',0,'From'],['pers',12,'Personality'],['likes',20,'Likes'],['dislikes',28,'Dislikes'],['hobbies',24,'Hobbies'],['goals',35,'Dream'],['fam',45,'Family'],['worry',55,'Worried about'],['values',40,'Cares about'],['secret',999,'Secret']];
for(const id in CAST){const c=CAST[id];PEOPLE[id]={name:c.name,role:c.role,skin:hexStr(c.look.skin),shirt:hexStr(c.look.shirt),look:c.look,trait:c.pers.split('.')[0]+'.'};}
Object.assign(CHATP,{
  nneka:{hi:['Good afternoon, {me}.','Hello {me}. How are you?'],how:['I\'m fine, thank you. Busy. You?','Managing. Reading for a test.'],unknown:['Please explain.','I don\'t follow.'],laugh:['😅','Okay, that was funny.'],
    compliment:['Thank you. Don\'t overdo it 😐','Hm. Thanks.'],money:['I don\'t have money to lend, sorry.'],study:['Library, quiet zone. I\'m there till 6.'],food:['I\'ll eat later.','I\'m not hungry.'],bye:['Okay. Take care.'],meet:['You came. Good.']},
  tobi:{hi:['Yo {me}! 🚀','{me}! Perfect timing, I have an idea.'],how:['Building, as usual. CampusRun is about to blow 😎','Tired but excited. You?'],unknown:['Lol explain like I\'m a product manager 😂'],laugh:['😂😂 I\'m stealing that joke'],
    hustle:['If you can code or ride a bike, I need you. Seriously.'],money:['Bro I\'m broke but I\'m rich in ideas 😂'],compliment:['Haha thanks! Tell investors that 😂'],bye:['Later! Ship it! 🚀'],meet:['There you are. Look at this dashboard.']},
  zara:{hi:['Heyyyy {me}! 💅','Babe!! Hiii 😍'],how:['Living my best life 💁🏽‍♀️ you?','Shooting content all day. I\'m dead 😩'],compliment:['STOPPP 😍😍 you\'re too sweet','Aww! Say it louder for VIBE 😂'],laugh:['😂😂😂 I can\'t with you','LMAOO'],
    unknown:['Huh? 😂 voice note me'],insult:['Wow. Okay. Blocked in my heart 💔'],bye:['Byeee 💋','Later love!'],meet:['You came!! Quick, stand here, we\'re filming 📸']},
  musa:{hi:['Sannu {me}.','How far {me}? 😄'],how:['I dey. Legs dey pain me from training 😂','Fine. Ball later?'],invite:['Football? Say less. Sports Field, 5 PM ⚽'],laugh:['😂😂 you be clown'],
    unknown:['Ehn? 😂'],money:['Money? Me? 😂 I get only transport.'],bye:['Sai anjima.','Later bro.'],meet:['You came! Oya pass the ball.']},
  dayo:{hi:['Big man {me}! 😎','{me}! What are we eating today? My treat.'],how:['Living large, as always 😎','Fine fine. Bored. Let\'s do something.'],food:['Mac D, my treat. Come now.'],money:['Money is not the problem 😎','Relax, I got you.'],
    laugh:['😂 You\'re funny. I like you.'],unknown:['Lol okay big man.'],compliment:['I know 😎 but thanks.'],bye:['Later, chief.'],meet:['There\'s my guy. Order anything.']},
  hauwa:{hi:['Assalamu alaikum, {me}.','Hello {me}.'],how:['Alhamdulillah, I\'m well. And you? Really?','Fine. Long shift at the clinic.'],sad:['Do you want to talk? I\'m at the Health Centre till 7.'],tired:['Rest. Drink water. I\'m serious.'],
    unknown:['I don\'t understand, but I\'m listening.'],laugh:['😊'],love:['That\'s kind, but I\'m focused on school right now. Let\'s stay friends 🙂'],compliment:['Thank you 🙂'],bye:['Take care of yourself.'],meet:['You\'re here. Sit.']}});
CAST_IDS.forEach(id=>{if(!CHATTERS.includes(id))CHATTERS.push(id);});
/* ---- relationship dimensions & memory ---- */
const RDIMS=[['trust','Trust','#66acd9'],['resp','Respect','#e3b04b'],['fam','Familiarity','#a9b5a4'],['attr','Attraction','#f6a6c8'],['riv','Rivalry','#e39a5a'],['res','Resentment','#e5654f']];
function rd(id){S.rd=S.rd||{};return S.rd[id]||(S.rd[id]={trust:20,resp:25,fam:5,attr:0,riv:0,res:0});}
function rdAdd(id,dim,v,quiet){const r=rd(id);const before=r[dim];r[dim]=clamp(before+v,0,100);if(!quiet&&Math.abs(v)>=6&&PEOPLE[id])floatText((v>0?'+':'')+Math.round(v)+' '+(RDIMS.find(d=>d[0]===dim)||[0,dim])[1]+' · '+fx(PEOPLE[id].name),dim==='res'||dim==='riv'?'neg':'rel');return r[dim];}
/* people near you (on campus or in the same building) witness what you do */
function witnesses(radius){const out=[];if(S.inside){const I=getInt(S.inside);(I.castSims?Object.keys(I.castSims):[]).forEach(id=>{if(I.castSims[id].g.visible)out.push(id);});MATES.forEach(id=>{if(I.mates&&I.mates[id]&&I.mates[id].g.visible)out.push(id);});return out;}
  npcs.forEach(n=>{if(n.id&&!n.hidden&&Math.hypot(n.x-P.x,n.z-P.z)<(radius||14))out.push(n.id);});return [...new Set(out)];}
function memAdd(id,kind,text,w){S.mem=S.mem||{};const L=S.mem[id]||(S.mem[id]=[]);L.unshift({t:S.t,k:kind,x:text,w:w||1});L.sort((a,b)=>b.w-a.w||b.t-a.t);if(L.length>10)L.length=10;remember(id,kind,text);}
function memHas(id,kind,days){const L=(S.mem||{})[id]||[];return L.find(e=>e.k===kind&&(!days||S.t-e.t<days*1440))||null;}
function knownFact(id,f){S.known=S.known||{};return (S.known[id]||[]).includes(f);}
function learnFact(id,f){S.known=S.known||{};const L=S.known[id]||(S.known[id]=[]);if(L.includes(f))return false;L.push(f);journalLog('Learned about '+CAST[id].name+': '+FACTS.find(x=>x[0]===f)[2].toLowerCase());return true;}
function journalLog(text){S.jlog=S.jlog||[];S.jlog.unshift({t:S.t,x:text});if(S.jlog.length>60)S.jlog.length=60;}
/* NPC-to-NPC feelings, used for who hangs out with whom */
function nnKey(a,b){return a<b?a+'|'+b:b+'|'+a;}
function nn(a,b){return ((S.nn||{})[nnKey(a,b)])||0;}
function nnAdd(a,b,v){S.nn=S.nn||{};const k=nnKey(a,b);S.nn[k]=clamp((S.nn[k]||0)+v,-100,100);}
HOOKS.newState.push(st=>{st.seed=Math.floor(Math.random()*1e9);st.rd={};st.mem={};st.known={};st.nn={};st.story={};st.jlog=[];});
HOOKS.migrate.push(st=>{if(st.seed==null)st.seed=Math.floor(Math.random()*1e9);['rd','mem','known','nn','story'].forEach(k=>{if(!st[k])st[k]={};});if(!st.jlog)st.jlog=[];
  CAST_IDS.forEach(id=>{if(st.rel&&st.rel[id]==null)st.rel[id]=0;});});
HOOKS.boot.push(()=>{CAST_IDS.forEach(id=>{if(S.rel[id]==null){const r=sr('rel'+id);S.rel[id]=Math.round(4+r()*10);}if(!S.rd[id]){const r=sr('rd'+id);S.rd[id]={trust:Math.round(10+r()*15),resp:Math.round(15+r()*20),fam:0,attr:0,riv:0,res:0};}});castSpawn();});
/* ---- the cast walk around campus on their own routines ---- */
const castN={};
function castSpawn(){CAST_IDS.forEach(id=>{if(castN[id])return;const c=CAST[id];const L=LOCS[(c.routine[0][2]||['vcafe'])[0]]||LOCS.vcafe;
  const look=Object.assign({},c.look);if(S.look&&S.look.female&&(LOCS.boys.name==='Girls Hostel')){/* hostel names swap for female players: routines follow the names */}
  const n=addNpc({kind:'cast',id,home:c.female?'girls':'boys',look,x:L.door.x+rnd(-3,3),z:L.door.z+rnd(-2,2),label:c.name,sp:rnd(3.6,4.4)});castN[id]=n;
  const fp=freeNear(NAV,n.x,n.z,10);n.x=fp.x;n.z=fp.z;n.g.position.set(n.x,0,n.z);
  const tg=document.createElement('div');tg.className='tag cast';tg.textContent=c.name;labelsEl.appendChild(tg);TAGS.push({el:tg,n});});}
function castWhereNow(id){const c=CAST[id];const h=minOf(S.t)/60;const w=wd(S.t);if(h>=22.5||h<6.5)return c.female?(isF()?'boys':'girls'):(isF()?'girls':'boys');
  if(S.story&&S.story._meet&&S.story._meet[id]&&S.story._meet[id].until>S.t)return S.story._meet[id].loc;
  const slot=c.routine.find(r=>h>=r[0]&&h<r[1]);if(!slot)return c.female?(isF()?'boys':'girls'):(isF()?'girls':'boys');
  if(w===6&&h>=6.3&&h<8.5&&id!=='hauwa')return 'chapel';
  const r=sr(id+dayOf(S.t)+'|'+Math.floor(h));const L=slot[2][Math.floor(r()*slot[2].length)];
  if(L==='girls')return isF()?'boys':'girls';if(L==='boys')return isF()?'girls':'boys';return L;}
HOOKS.dest.cast=n=>{const loc=castWhereNow(n.id);return LOCS[loc]||null;};
CAST_IDS.forEach(id=>{HOOKS.where[id]=()=>({id:castWhereNow(id)});});
/* in buildings, the cast sit or stand inside so you can find and talk to them */
HOOKS.populate.push(I=>castInterior(I));
function castInterior(I){I.castSims=I.castSims||{};const here=CAST_IDS.filter(id=>castWhereNow(id)===I.id&&!(S.captive));
  Object.keys(I.castSims).forEach(id=>{if(!here.includes(id))I.castSims[id].g.visible=false;});
  here.forEach((id,i)=>{let r=I.castSims[id];if(!r){r=interiorSim(I,CAST[id].look,id);r.g.userData.npc=id;I.pick.push(r.g);I.castSims[id]=r;}
    const seat=freeSeat(I);if(seat&&i%3!==2){seatSim(I,r,seat,pick(['sit','read','sitphone','sittalk']));}else{const x=rnd(-I.w/2+2,I.w/2-2),z=rnd(-I.d/2+2,I.d/2-3);placeSim(r,x,z,rnd(0,6.28),pick(['phone','stand','talk','cross']));}});}
/* ---- talking to someone from the cast ---- */
function castOpeners(id){const c=CAST[id],r=S.rel[id]||0,R=rd(id);const L=[];
  if(R.res>45)return ['"What do you want?"','"Oh. You."'];
  if(memHas(id,'betrayal',10))return ['"I trusted you, you know."'];
  if(memHas(id,'helped',6))L.push('"'+S.name+'! My person. I haven\'t forgotten what you did."');
  if(r<15)return ({nneka:['"Yes? Can I help you?"'],tobi:['"Hey! Are you a developer? No? Designer? Rider? No? Okay, hi anyway 😂"'],zara:['"Hiii, do I know you? Cute bag though."'],musa:['"Sannu."'],dayo:['"New face. Fresher? Welcome, chief."'],hauwa:['"Hello. You look tired, are you okay?"']})[id];
  L.push(...({nneka:['"I have twenty minutes before my next class."','"Did you read for the test?"','"Akara at Mama Put is the only good thing about mornings."'],tobi:['"I just fixed a bug that took three days. Ask me anything."','"Imagine if every cafe on campus delivered. Imagine!"'],
    zara:['"Do I look okay? Be honest. Actually don\'t."','"Say hi to my followers!" She points her phone at you.'],musa:['"Barca lost again. I\'m not talking about it."','"You dey come field later?"'],dayo:['"Chief! Have you eaten? Don\'t lie."','"This campus is too quiet. We need a party."'],hauwa:['"Drink water. You never drink water."','"How are you really?"']})[id]);return L;}
function castTalk(id){if(busy())return;const c=CAST[id];const R=rd(id),r=S.rel[id]||0;const M=chatMem(id);const today=dayOf(S.t);
  const C=[];
  runHooks(HOOKS.castFirst,id,C); // story beats and dates go first
  C.push({t:'Chat (20m)',fn:()=>{S.t+=20;N('fun',6);const cold=R.res>40;rel(id,cold?1:clamp(3+c.deep*0.5,2,5));rdAdd(id,'fam',4,true);rdAdd(id,'trust',cold?0.5:1.5,true);M.talks=(M.talks||0)+1;
    let line=pick(castOpeners(id)).replace(/"/g,'');if(M.talks%3===0&&learnSmall(id))line+=' You learn something new about '+c.name+'.';memAdd(id,'chat','Talked for a while',0.3);return '"'+line+'"';}});
  C.push({t:'Ask about their life',fn:()=>{S.t+=15;const next=FACTS.find(f=>!knownFact(id,f[0])&&f[1]<999);if(!next)return '"You already know everything I\'m willing to share 😅"';
    if(R.trust+r*0.4>=next[1]+10||next[1]===0){learnFact(id,next[0]);rdAdd(id,'trust',2,true);rdAdd(id,'fam',3,true);return factLine(id,next[0]);}
    rdAdd(id,'trust',-1,true);return pick(['They change the subject.','"Why do you want to know?" They smile, but don\'t answer.','"Another day, maybe."']);}});
  C.push({t:'Compliment them',fn:()=>{const f=c.flattery;if(M.compDay===today){rdAdd(id,'resp',-2,true);return '"You said that already 😐"';}M.compDay=today;
    if(f>0){rel(id,4+f);rdAdd(id,'attr',2,true);return pick(['They beam. "Finally, someone with taste!"','"Stoppp. Okay, continue." 😍']);}
    if(f<0){rdAdd(id,'resp',-2,true);rdAdd(id,'trust',-1,true);return pick(['"Hm. What do you want?"','They raise an eyebrow. "Flattery doesn\'t work on me."']);}rel(id,2);return '"Thanks. You too."';}});
  C.push({t:'Crack a joke',fn:()=>{const j=c.jokes;if(j>0&&chance(0.5+j*0.15)){rel(id,3+j);rdAdd(id,'fam',2,true);return pick(['They laugh so hard people turn around.','"😂 Where do you get these?"']);}
    if(j<0){rdAdd(id,'resp',-1.5,true);return pick(['Silence. Then: "Is that a joke?"','A polite smile. Very polite.']);}return chance(.6)?'They smile.':'It doesn\'t land.';}});
  if(S.inv.gift)C.push({t:'Give a chocolate',fn:()=>{S.inv.gift--;rel(id,8);rdAdd(id,'trust',3,true);rdAdd(id,'res',-8,true);memAdd(id,'gift','You gave them chocolate',1);if(c.money==='struggling')rdAdd(id,'resp',-1,true);return c.flattery>0?'"For me?! 😍"':'"Thank you. You didn\'t have to."';}});
  runHooks(HOOKS.castMore,id,C);
  C.push({t:'Text them later',fn:()=>{setTimeout(()=>{phoneArg=id;openPhone('thread');},50);return null;}});
  C.push({t:'Leave',fn:()=>null});
  const op=pick(castOpeners(id));dialog({who:id,kicker:c.role+' · '+tier(r),text:op,choices:C});}
CAST_IDS.forEach(id=>{HOOKS.talk[id]=()=>castTalk(id);});
function factLine(id,f){const c=CAST[id];const T={role:'"I\'m '+c.role+'."',from:'"I\'m from '+c.from+'."',pers:'You notice: '+c.pers,likes:'"I like '+c.likes.toLowerCase()+'."',dislikes:'"I can\'t stand '+c.dislikes.toLowerCase()+'."',hobbies:'"'+c.hobbies+'. That\'s my free time."',
  goals:'"'+c.goals+'"',fam:'They tell you about home. '+c.fam,worry:'They hesitate. '+c.worry,values:'"What matters to me? '+c.values+'."'};return T[f]||'';}
function learnSmall(id){const next=FACTS.find(f=>!knownFact(id,f[0])&&f[1]<=rd(id).trust+(S.rel[id]||0)*0.4);if(next){learnFact(id,next[0]);return true;}return false;}
/* ---- contact screen: what you know about them ---- */
function personCard(id,b){const c=CAST[id];if(!c)return;const R=rd(id);
  b.append(el('div','sec','What you know'));FACTS.forEach(([f,,lab])=>{if(knownFact(id,f))b.append(el('div','txrow','<div>'+lab+'<span>'+esc(f==='role'?c.role:c[f])+'</span></div>'));});
  if(!(S.known[id]||[]).length)b.append(el('div','note','You barely know them yet. Talk to them, ask about their life, spend time together.'));
  b.append(el('div','sec','How they feel about you'));
  [['Friendship',S.rel[id]||0,'#5cbf7f'],...RDIMS.filter(d=>d[0]!=='attr'||R.attr>0).map(d=>[d[1],R[d[0]],d[2]])].forEach(([l,v,col])=>b.append(el('div','attr','<span>'+l+'</span><div class="bar"><div style="width:'+clamp(v,0,100)+'%;background:'+col+'"></div></div><i class="num">'+Math.round(v)+'</i>')));
  const mem=((S.mem||{})[id]||[]).filter(m=>m.w>=1).slice(0,4);if(mem.length){b.append(el('div','sec','They remember'));mem.forEach(m=>b.append(el('div','note','· '+esc(m.x)+' (Day '+dayOf(m.t)+')')));}}
HOOKS.contact.push((k,b)=>{if(CAST[k])personCard(k,b);else if(['tunde','emeka','sadiq','chidi','femi','amina','kunle'].includes(k)){const R=rd(k);b.append(el('div','sec','How they feel about you'));
  [['Friendship',S.rel[k]||0,'#5cbf7f'],['Trust',R.trust,'#66acd9'],['Respect',R.resp,'#e3b04b']].concat(R.res>0?[['Resentment',R.res,'#e5654f']]:[]).forEach(([l,v,col])=>b.append(el('div','attr','<span>'+l+'</span><div class="bar"><div style="width:'+clamp(v,0,100)+'%;background:'+col+'"></div></div><i class="num">'+Math.round(v)+'</i>')));}});
/* roommates also get trust/respect from how you treat them */
HOOKS.choices.push((id,C)=>{});
/* NPCs who are friends hang out together; NPCs who fell out avoid each other */
HOOKS.minute.push(m=>{if(m%60!==0||S.inside)return;for(const n of npcs){if(!n.id||n.hidden||n.idle<=S.t)continue;const q=npcs.find(o=>o!==n&&o.id&&!o.hidden&&Math.hypot(o.x-n.x,o.z-n.z)<5);if(q){const f=nn(n.id,q.id);if(f<-25){n.idle=S.t;}else nnAdd(n.id,q.id,0.3);}}});
