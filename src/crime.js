/* ================= YAHOO (internet fraud) — a risky "job" with real consequences (18+ accounts) =================
   Femi introduces you once you own a laptop. Nights of "work" can pay big, but every payout raises your heat.
   Heat brings EFCC: a dawn raid on the hostel, arrest, and possibly the end of your time at Veritas.
   The game never explains how scams work; it shows who gets hurt. */
function yh(){return S.yahoo||(S.yahoo={on:false,lvl:0,heat:0,earned:0,victims:0,quit:false,offered:false,nights:0});}
function yahooOK(){return mature()&&S.inv.laptop;}
HOOKS.day.push(d=>{const Y=yh();
  if(!Y.offered&&yahooOK()&&d>=3&&chance(0.5)){Y.offered=true;msg('femi','Guy 😏 I see say you don get laptop now. Make I show you how the boys dey run am. Dollars, my guy. Open the Yahoo app when you ready. No tell anybody.');}
  if(Y.on&&!Y.quit){Y.heat=clamp(Y.heat-(Y.layLow>S.t?4:1.5),0,100);if(S.money+S.savings>400000)Y.heat=clamp(Y.heat+3,0,100);}
  else Y.heat=clamp(Y.heat-3,0,100);
  if(Y.on&&Y.heat>=20&&!S.captive&&chance(Y.heat/420))S.today.efcc=ri(4*60+30,5*60+30);});
HOOKS.minute.push(m=>{const T=S.today;if(T&&T.efcc!=null&&m===T.efcc){T.efcc=null;efccRaid();}});
HOOKS.apps.push(()=>yahooOK()&&(yh().offered||yh().on)?[['yahoo','Yahoo','#2b2b2b','$']]:[]);
HOOKS.back.yahoo='home';
HOOKS.views.yahoo=(b,T)=>{T.textContent='Yahoo';const Y=yh();
  if(!yahooOK()){b.append(el('div','note','Not available.'));return;}
  b.append(el('div','bgcard','<b>Femi\'s "format"</b><div class="note">Night work on your laptop, 10 PM to 3 AM, in your room. Some nights pay a lot. Every payout is real money taken from a real person, and every payout makes EFCC more likely to come. If they come: arrest, bail, maybe expulsion.</div>'));
  const heat=Math.round(Y.heat);b.append(el('div','statgrid','<div class="stat"><span>Made so far</span><b class="num">'+naira(Y.earned)+'</b></div><div class="stat"><span>People scammed</span><b class="num">'+Y.victims+'</b></div><div class="stat"><span>EFCC risk</span><b class="num" style="color:'+(heat>60?'var(--bad)':heat>30?'var(--gold)':'var(--good)')+'">'+(heat>60?'Very high':heat>30?'Rising':heat>5?'Low':'None')+'</b></div><div class="stat"><span>Level</span><b class="num">'+['Newbie','Runs small','Big boy','Chairman'][Math.min(3,Y.lvl)]+'</b></div>'));
  if(Y.quit){b.append(el('div','note','You quit. Your heat is cooling down. Femi still sends you screenshots of other people\'s "hits".'));b.append(prow(pbtn('Go back to it',()=>{Y.quit=false;Y.on=true;rel('femi',3);})));return;}
  const h=minOf(S.t)/60,night=h>=22||h<3,home=S.inside===homeId();
  b.append(prow(pbtn('Work tonight (3h)',()=>{closePhone();yahooNight();},!home?'Do it in your own room':!night?'Only between 10 PM and 3 AM':S.inside==='boys'&&Y.lvl<1&&!Y.on?null:null)));
  if(Y.on)b.append(prow(pbtn('Lay low for a week',()=>{Y.layLow=S.t+7*1440;toast('Laying low','No work for a while. Heat cools faster.');}),pbtn('Quit for good',()=>{Y.quit=true;Y.on=false;rel('femi',-6);rdAdd('femi','resp',-4,true);addMoodlet('Clean hands',8,1440);toast('Quit','You delete the chats. Femi calls you soft. You sleep better.','good');})));
  b.append(el('div','note','Father Philani hears confessions at the Chapel. Some weights are easier to carry when you put them down.'));};
function yahooNight(){const Y=yh();if(!yahooOK())return;if(S.inside!==homeId())return toast('Yahoo','Do it in your own room, at night.');if(!S.dataDays&&!(S.home==='lodge2'))return toast('No data','You need data. Buy it at Mama Ngozi Kiosk.','bad');
  if(!Y.on){Y.on=true;rel('femi',6);rdAdd('femi','trust',6,true);memAdd('femi','yahoo','You joined his yahoo work',1);}
  const pl=S.inside==='boys'?{x:4.2,y:0,z:3.4,r:Math.PI,pose:'read'}:null;
  startAction('Working the "format" on your laptop',180,{where:homeId(),place:pl,per:()=>{N('energy',-0.12);N('stress',0.05);},done:()=>yahooResult()});
  if(S.inside==='boys'&&chance(0.25))setTimeout(()=>{if(!ACT)return;rdAdd('sadiq','resp',-6,true);memAdd('sadiq','saw_yahoo','Saw you doing yahoo work at night',2);},2000);}
function yahooResult(){const Y=yh();Y.nights++;const p=clamp(0.22+Y.lvl*0.07+S.skills.tech*0.03,0.15,0.6);
  if(!chance(p)){Y.heat=clamp(Y.heat+2,0,100);toast('Nothing tonight','No one replied. Femi says "patience, the client go come".');return;}
  const amt=Math.round(ri(30,120)*(1+Y.lvl*0.45))*1000;earn(amt,'"Client" payment');Y.earned+=amt;Y.victims++;Y.heat=clamp(Y.heat+6+amt/30000,0,100);if(Y.victims>=[2,5,9][Math.min(2,Y.lvl)])Y.lvl=Math.min(3,Y.lvl+1);
  addMoodlet('A stranger\'s money',-6,1440);S.vibe.followers=(S.vibe.followers||0)+2;
  if(chance(0.45))setTimeout(()=>victimMsg(amt),2500);}
const VICTIMS=[['Ms. Linda (Texas)','I sent my savings for the "customs fee". That was money for my medication. Please, if you are a real person, send it back.'],['Mr. Hans (Hamburg)','My daughter says I have been robbed. I did not believe her. I believe her now.'],['Grace (Lagos)','You told me you were a soldier abroad. I borrowed from my sister to help you. She is not speaking to me now.'],['Mrs. Okafor (Enugu)','That was my shop money. My children will not go back to school this term.']];
function victimMsg(amt){const v=pick(VICTIMS);dialog({who:'me',kicker:'A message you didn\'t expect',text:'<b>'+v[0]+':</b> "'+v[1]+'"',choices:[
  {t:'Send part of it back ('+naira(Math.round(amt*0.5/1000)*1000)+')',fn:()=>{const back=Math.round(amt*0.5/1000)*1000;if(!spend(back,'Sent money back to '+v[0]))return 'You don\'t have it anymore.';yh().heat=clamp(yh().heat-4,0,100);addMoodlet('Did one right thing',6,1440);return 'You send it from a different account. It doesn\'t fix anything. But it\'s something.';}},
  {t:'Block and delete',fn:()=>{addMoodlet('Blocked a crying stranger',-10,2880);N('stress',8);return 'Gone. The message is gone. The feeling isn\'t.';}},
  {t:'Show Femi',fn:()=>{rel('femi',2);return '"Na so dem dey talk," Femi laughs. "Mugu go always be mugu." You don\'t laugh.';}}]});}
/* Father Philani: confession takes the weight off and cools things down */
HOOKS.acts.push(id=>id==='chapel'&&yh().victims>0&&!yh().confessed?[A('Go to confession','Father Philani · tell him everything',()=>{yh().confessed=1;startAction('At confession',30,{done:()=>{S.moodlets=S.moodlets.filter(m=>!/stranger/i.test(m.t));addMoodlet('A lighter heart',10,2880);rel('philani',6);
  dialog({who:'philani',kicker:'Confession',text:'Father Philani listens without interrupting. Then: "God forgives. The law does not always. And the people you hurt are still hurt. Stop, my child. Today. And where you can, make it right."',choices:[{t:'"I\'ll stop"',fn:()=>{const Y=yh();Y.quit=true;Y.on=false;return null;}},{t:'Say nothing',fn:()=>null}]});}});})]:[]);
/* ---- EFCC at dawn ---- */
function efccRaid(){if(S.over||S.captive||CS.on)return;const Y=yh();if(UI.dlg){UI.dlgQ=[];UI.dlg=false;$('#dlgWrap').hidden=true;}if(ACT)stopAction(true);if(UI.sheet)closeSheet();if(UI.phone)closePhone();
  efccScene().catch(e=>{if(e!==SKIP)console.error(e);csClear();csEnd();efccChoice();});}
async function efccScene(){csStart();const room=S.inside;
  if(room){await new Promise(r=>fadeThen(()=>{getInt(room).g.visible=false;outdoor.visible=true;scene.fog.near=170;scene.fog.far=430;S.efccFrom=room;S.inside=null;r();}));}
  const V=buildVehicle('pickup',0xf2f2f2,{plate:'EFCC '+ri(10,99)});decal(V,'EFCC','#1f8a4c');V.g.position.set(30,0,135);V.g.rotation.y=-Math.PI/2;
  const M={x:30,z:135,dir:-Math.PI/2,i:0};const path=[{x:3,z:135},{x:2,z:131},{x:2,z:96},{x:8,z:93},{x:22,z:93},{x:22,z:98}];
  CS.tick=dt=>{const ox=M.x,oz=M.z;stepAlong(M,path,10,dt);M.rd=M.rd==null?M.dir:M.rd+angDiff(M.dir,M.rd)*Math.min(1,dt*3);V.g.position.set(M.x,0,M.z);V.g.rotation.y=M.rd;vehAnim(V,Math.hypot(M.x-ox,M.z-oz),0,dt);};
  csShot([14,12,120],()=>new THREE.Vector3(M.x,1,M.z),1.3);CS.camInit=false;csCaption(fmtTime(S.t)+' · Day '+dayOf(S.t),'A white pickup at the gate');setCarLights(true);
  await csUntil(()=>M.i>=path.length,16000);csCaption(null);
  const look=s=>({skin:s,shirt:0x111111,pants:0x1b2438,top:'hoodie',hairStyle:'low',hair:1,cap:0x111111,shoeStyle:'shoes',shoes:0x0d0d0d,build:1.08,bag:null});
  const ofs=[0,1,2].map(i=>csActor({look:look(pick(SKINS)),x:M.x+2.4,z:M.z-1.5+i*1.2,sp:4.6}));const door=LOCS[homeId()].door;
  ofs.forEach((a,i)=>csWalk(a,{x:door.x+(i-1)*1.2,z:door.z+1+i*0.4},4.6));
  csFollow(ofs[0],12,8);await csUntil(()=>ofs.every(csArrived),16000);
  await csSay(ofs[0],'EFCC! Nobody move!',1800);
  await new Promise(r=>fadeThen(()=>{csClear();V.g.parent&&V.g.parent.remove(V.g);CS.tick=null;if(S.efccFrom){const I=getInt(S.efccFrom);outdoor.visible=false;I.g.visible=true;S.inside=S.efccFrom;S.efccFrom=null;}r();}));
  csEnd();setCarLights(false);efccChoice();}
function efccChoice(){const Y=yh();const ev=Y.heat;
  dialog({who:'me',kicker:'EFCC raid',warn:'Internet fraud is a federal crime.',text:'Men in black jackets burst into the room at dawn. Torches. "EFCC! Everybody on the floor! Whose laptop is this?" Your roommates stare at you.',choices:[
    {t:'Cooperate',fn:()=>{setTimeout(()=>efccArrest(ev),300);return 'They take your laptop and your phone, and you, in the back of the white pickup.';}},
    {t:'Wipe the laptop before they reach it (Tech)',fn:()=>{const ok=chance(clamp(0.2+S.skills.tech*0.1,0.2,0.65));if(ok){Y.heat=Math.max(0,Y.heat-30);setTimeout(()=>efccArrest(ev*0.4),300);return 'You hold the power button and pray. When they open it, it\'s a fresh install. They take you anyway.';}setTimeout(()=>efccArrest(ev+20),300);return 'An officer grabs your wrist halfway. "Ehen. You wan delete evidence?" That made it worse.';}},
    {t:'"Settle" them (₦500,000)',fn:()=>{if(S.money<500000){setTimeout(()=>efccArrest(ev+10),300);return '"With what money?" They laugh, and cuff you.';}spend(500000,'"Settled" EFCC officers');if(chance(0.45)){Y.heat=10;S.suspicion+=15;return 'The leader counts it in the corridor. "We never came here." They leave with your laptop.';}setTimeout(()=>efccArrest(ev+25),300);return 'They take the money as evidence of bribery. Now there are two charges.';}},
    {t:'Jump out of the window and run',fn:()=>{if(chance(0.25)){Y.heat=Math.min(100,Y.heat+15);S.suspicion+=20;addDiscipline(2,'Fled from law enforcement');return 'You hit the ground, roll, and run through the bush behind the hostel. They will be back.';}N('health',-25);setTimeout(()=>efccArrest(ev+20),300);return 'You land badly. Your ankle. They are on you in seconds.';}}]});
  MATES.forEach(m=>{rdAdd(m,'trust',-6,true);memAdd(m,'saw_efcc','EFCC raided the room because of you',2);});S.suspicion+=20;{const n=NETX();if(n)n.log('efcc',{heat:Math.round(ev)});}}
function efccArrest(ev){const Y=yh();S.inv.laptop=false;Y.on=false;Y.quit=true;const d0=dayOf(S.t);S.t+=3*1440;if(dayOf(S.t)!==d0)newDay();N('stress',40);N('health',-10);addMoodlet('Three nights in a cell',-25,5*1440);rel('mum',-25);rel('dad',-30);
  const expel=chance(clamp(ev/110,0.15,0.8));
  dialog({who:'dad',kicker:'Released on bail',text:'Three nights in an EFCC cell in Abuja. Your father pays for a lawyer and bail. He doesn\'t look at you once.'+(expel?'':'<br><br>The case is "under investigation". The school gives you a final warning.'),choices:[{t:expel?'…':'Go back to school',fn:()=>{if(expel)setTimeout(()=>endLife('expelled','an EFCC arrest for internet fraud'),300);else addDiscipline(4,'Arrested by EFCC');return null;}}]});}
HOOKS.migrate.push(st=>{if(st.yahoo&&st.yahoo.nights==null)st.yahoo.nights=0;});
