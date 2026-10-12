/* ================= THE CONCERT (outside school) =================
   The admin hosts it from the admin website (lineup, day, time, ticket prices) and every player gets it.
   If the admin hasn't hosted one, the game puts on its own "Afrobeats Night Live" every so often.
   Posters go up around campus, the course rep and VIBE spread the word, tickets are in the Tickets app,
   and on the night a shuttle leaves from the Main Gate to the event ground in Bwari. */
const CONCERT_DEFAULT={title:'Afrobeats Night Live',lineup:['Kezzy B','Starlight Wizz','Afro Giant'],hour:20,price:5000,vip:25000};
const CON={g:null,boards:[],music:null,crowd:[],stars:[],beams:[],t:0,shot:0};
const VENUE={x:-420,z:330};
function conNow(){return S&&S.concert&&!S.concert.over?S.concert:null;}
function conStart(){const c=conNow();return c?(c.day-1)*1440+c.hour*60:0;}
function conLive(){const c=conNow();if(!c)return false;const s0=conStart();return S.t>=s0-90&&S.t<s0+180;}
function conText(c){return c.title+' · '+c.lineup.join(' · ');}
function conWhen(c){const d=c.day-dayOf(S.t);return (d<=0?'Tonight':d===1?'Tomorrow':DAYS[(c.day-1)%7]+' (Day '+c.day+')')+' · '+fmtTime(c.hour*60);}

/* ---------- announcing a concert (from the admin, or the game's own) ---------- */
function concertSet(c){if(!S)return;if(c&&c.cancel){if(S.concert){S.concert=null;S.ticket=null;boardsDraw();toast('Concert cancelled','The organisers called it off. Ticket money is refunded.','bad');if(S.ticketPaid){earn(S.ticketPaid,'Concert ticket refund');S.ticketPaid=0;}}return;}
  if(!c||!c.lineup||!c.lineup.length)return;if(S.concert&&S.concert.id===c.id)return;
  let day=dayOf(S.t)+(+c.inDays||0);if(day===dayOf(S.t)&&minOf(S.t)>(c.hour||20)*60+60)day++;
  if(S.ticket&&S.concert&&S.concert.id!==c.id){if(S.ticketPaid)earn(S.ticketPaid,'Ticket refund (concert changed)');S.ticket=null;S.ticketPaid=0;}
  S.concert={id:c.id||S.t,title:fx(c.title||CONCERT_DEFAULT.title),lineup:c.lineup.slice(0,6).map(fx),day,hour:c.hour||20,price:c.price!=null?c.price:5000,vip:c.vip!=null?c.vip:25000,src:c.src||'admin'};
  boardsDraw();promote(true);save();}
function promote(first){const c=conNow();if(!c)return;
  msg('rep','🔥🎤 '+c.title.toUpperCase()+' 🎤🔥\n'+c.lineup.join(' · ')+'\n📍 Bwari Event Ground (outside school)\n🗓 '+conWhen(c)+'\n🎟 Regular '+naira(c.price)+' · VIP '+naira(c.vip)+'\nTickets in the Tickets app on your phone. Free shuttle from the Main Gate on the night!');
  S.news=S.news||[];S.news.unshift({t:S.t,x:c.title+': '+c.lineup.join(', ')+' live at the Bwari Event Ground, '+conWhen(c)+'. Shuttle from the Main Gate.'});
  if(first)setTimeout(()=>{if(S&&conNow())celebrate('🎤 '+c.title,c.lineup.join(' · ')+' · '+conWhen(c));},700);}
/* the game's own concert every 6 days when the admin hasn't hosted one */
HOOKS.day.push(()=>{if(!S||S.over)return;const d=dayOf(S.t);const c=S.concert;
  if(c&&d>c.day){S.concert=null;S.ticket=null;S.ticketPaid=0;boardsDraw();}
  if(!S.concert&&d>=3&&!(S.flags.conNext>d)){S.flags.conNext=d+6;concertSet(Object.assign({id:'g'+d,inDays:2,src:'game'},CONCERT_DEFAULT));}
  else if(conNow()&&S.concert.day-d===1)promote(false);});
HOOKS.boot.push(()=>{setTimeout(boardsDraw,500);});

/* ---------- posters on campus ---------- */
function posterTex(c){return canvasTex(512,300,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#2a0a3a');gr.addColorStop(0.55,'#7a1f4a');gr.addColorStop(1,'#e3742b');g.fillStyle=gr;g.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){g.fillStyle='rgba(255,220,120,'+(0.05+Math.random()*0.12)+')';g.beginPath();g.moveTo(w/2,h);g.lineTo(Math.random()*w,0);g.lineTo(Math.random()*w,0);g.fill();}
  g.textAlign='center';g.fillStyle='#ffd34d';g.font='900 46px sans-serif';g.fillText(c?c.title.toUpperCase():'',w/2,62);
  g.fillStyle='#ffffff';g.font='800 34px sans-serif';(c?c.lineup:[]).slice(0,3).forEach((n,i)=>g.fillText(n,w/2,112+i*40));
  g.fillStyle='#ffe9b0';g.font='700 24px sans-serif';if(c){g.fillText(conWhen(c)+' · Bwari Event Ground',w/2,240);g.fillText('Tickets '+naira(c.price)+' · VIP '+naira(c.vip)+' · Tickets app',w/2,276);}});}
const BOARD_SPOTS=[[9,91,Math.PI],[-15,43,0],[60,62,0.0],[52,-23,0],[-30,36,Math.PI/2]];
function boardsBuild(){if(CON.boards.length)return;BOARD_SPOTS.forEach(([x,z,r])=>{const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=r;outdoor.add(g);
  [-2.6,2.6].forEach(px=>part(G.box,0x2b2b2b,0.18,3.4,0.18,px,1.7,0,g));const face=new THREE.Mesh(new THREE.PlaneGeometry(6,3.5),new THREE.MeshBasicMaterial({color:0xffffff}));face.position.set(0,4.6,0.11);g.add(face);
  const back=new THREE.Mesh(new THREE.PlaneGeometry(6,3.5),new THREE.MeshLambertMaterial({color:0x222222}));back.position.set(0,4.6,-0.02);back.rotation.y=Math.PI;g.add(back);part(G.box,0x111111,6.3,3.8,0.1,0,4.6,0.04,g);
  g.userData.conBoard=1;g.visible=false;CON.boards.push({g,face});});}
function boardsDraw(){boardsBuild();const c=conNow();CON.boards.forEach(b=>{b.g.visible=!!c;if(c){const old=b.face.material.map;b.face.material.map=posterTex(c);b.face.material.needsUpdate=true;if(old)old.dispose();}});}
/* tap a poster: the ticket sheet opens */
{const _t=onTap;onTap=function(cx,cy){if(W.concert)return;try{if(S&&!S.inside&&conNow()&&!busy()){const r=cv.getBoundingClientRect();mv.x=(cx-r.left)/r.width*2-1;mv.y=-(cy-r.top)/r.height*2+1;ray.setFromCamera(mv,camera);
  const hit=ray.intersectObjects(CON.boards.filter(b=>b.g.visible).map(b=>b.g),true)[0];if(hit&&hit.distance<60){ticketSheet();return;}}}catch(e){}return _t.apply(this,arguments);};}

/* ---------- tickets ---------- */
function ticketSheet(){const c=conNow();if(!c)return toast('Concerts','No concert announced right now.');const wrap=el('div');wrap.style.display='grid';wrap.style.gap='8px';
  wrap.append(el('div','bgcard','<b>🎤 '+esc(c.title)+'</b><div class="note">'+c.lineup.map(esc).join(' · ')+'<br>📍 Bwari Event Ground, outside school<br>🗓 '+conWhen(c)+' · the show runs about 3 hours<br>🚌 Free shuttle from the Main Gate from '+fmtTime(c.hour*60-60)+'</div>'));
  if(S.ticket)wrap.append(el('div','note','<b style="color:var(--good)">✓ You have a '+(S.ticket.vip?'VIP':'regular')+' ticket.</b> On the night, go to the Main Gate and board the concert shuttle.'));
  const buy=(vip)=>{const p=vip?c.vip:c.price;const b=el('button','opt','<div class="l"><b>'+(vip?'VIP ticket':'Regular ticket')+'</b><span>'+(vip?'Front of the stage, free drink, meet the artists':'General standing')+'</span></div><div class="r"><span class="c">'+naira(p)+'</span></div>');
    if(S.ticket&&(S.ticket.vip||!vip))b.disabled=true;b.onclick=()=>{const cost=S.ticket?p-(S.ticketPaid||0):p;if(!spend(cost,(S.ticket?'Upgrade to VIP · ':'Concert ticket · ')+c.title))return toast('Not enough money','You need '+naira(cost)+'.','bad');S.ticket={id:c.id,vip};S.ticketPaid=(S.ticketPaid||0)+cost;closeSheet();celebrate('🎟 Ticket bought',(vip?'VIP · ':'')+c.title+' · '+conWhen(c));try{N('fun',8);}catch(e){}save();};wrap.append(b);};
  buy(false);buy(true);openSheet('Tickets',c.title,wrap);}
HOOKS.apps.push(()=>conNow()?[['tickets','Tickets','#7a1f4a','🎟']]:[]);
HOOKS.views.tickets=(b,T)=>{T.textContent='Tickets';const c=conNow();if(!c){b.append(el('div','note','No concert right now. Watch the posters on campus.'));return;}
  b.append(el('div','bgcard','<b>🎤 '+esc(c.title)+'</b><div class="note">'+c.lineup.map(esc).join(' · ')+'<br>'+conWhen(c)+' · Bwari Event Ground</div>'));
  b.append(el('div','note',S.ticket?'✓ You have a '+(S.ticket.vip?'VIP':'regular')+' ticket. Board the shuttle at the Main Gate on the night.':'Regular '+naira(c.price)+' · VIP '+naira(c.vip)));
  const x=el('button',null,S.ticket?'See your ticket':'Buy tickets');x.onclick=()=>{closePhone();ticketSheet();};const r=el('div','btnrow');r.append(x);b.append(r);};
/* the To-do shows the concert on the day */
HOOKS.todo=HOOKS.todo||[];HOOKS.todo.push(o=>{const c=conNow();if(c&&c.day===dayOf(S.t)&&minOf(S.t)<c.hour*60+150)o.unshift({t:'🎤 '+c.title+' · '+fmtTime(c.hour*60)+(S.ticket?' · shuttle at the Main Gate':' · buy a ticket'),loc:'gate',c:'urgent'});});
/* the shuttle at the Main Gate */
HOOKS.acts.push(id=>{if(id!=='gate'||!conNow())return [];const c=conNow();const m=S.t-conStart();
  if(m<-90)return [A('Concert shuttle','Leaves from '+fmtTime(c.hour*60-60)+' on '+conWhen(c),()=>{},{dis:'Not yet'})];
  if(m>=150)return [];
  return [A('Board the concert shuttle','To the Bwari Event Ground · '+(S.ticket?(S.ticket.vip?'VIP':'regular')+' ticket':'you need a ticket'),()=>{if(!S.ticket)return ticketSheet();goConcert();},{now:true})];});

/* ---------- the event ground ---------- */
function venueBuild(){if(CON.g)return CON.g;const g=new THREE.Group();g.position.set(VENUE.x,0,VENUE.z);outdoor.add(g);CON.g=g;g.visible=false;
  const M=c=>new THREE.MeshLambertMaterial({color:c});const B=(w,h,d,x,y,z,m)=>{const b=new THREE.Mesh(G.box,m);b.scale.set(w,h,d);b.position.set(x,y,z);g.add(b);return b;};
  B(70,0.1,56,0,0.05,0,M(0x6b5a3e));/* the field */
  B(24,1.6,9,0,0.8,-18,M(0x1b1b1f));B(24,0.1,9,0,1.62,-18,M(0x2b2b33));/* stage */
  B(0.6,12,0.6,-12.5,6,-14,M(0x555555));B(0.6,12,0.6,12.5,6,-14,M(0x555555));B(0.6,12,0.6,-12.5,6,-22,M(0x555555));B(0.6,12,0.6,12.5,6,-22,M(0x555555));B(26,0.6,0.6,0,12,-14,M(0x555555));B(26,0.6,0.6,0,12,-22,M(0x555555));
  /* LED screen with the concert name */
  CON.screen=new THREE.Mesh(new THREE.PlaneGeometry(16,7),new THREE.MeshBasicMaterial({color:0xffffff}));CON.screen.position.set(0,7.6,-21.9);g.add(CON.screen);
  /* speaker stacks and barrier */
  [-15,15].forEach(x=>{B(3,6,3,x,3,-16,M(0x111111));for(let i=0;i<3;i++)B(1.6,1.6,0.1,x,1.2+i*1.8,-14.45,M(0x2a2a2a));});
  for(let i=-10;i<=10;i+=2)B(1.9,1.2,0.15,i,0.6,-11.5,M(0x9a9a9a));
  /* VIP rope and stalls */
  B(14,0.08,0.08,0,1,-6,M(0xe3b04b));[-26,-20,20,26].forEach((x,i)=>{B(4,2.6,3,x,1.3,8,M([0xd23b2b,0x2f8a57,0x2b4f8a,0xe3b04b][i]));B(4.6,0.3,3.6,x,2.8,8,M(0xf2efe6));});
  /* light beams (no real lights: cheap on phones) and two coloured lamps */
  for(let i=0;i<6;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry(2.2,16,12,1,true),new THREE.MeshBasicMaterial({color:[0xff3d8a,0x3dd6ff,0xffd34d,0x8a5aff,0x3dff8a,0xff8a3d][i],transparent:true,opacity:0.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
    const piv=new THREE.Group();piv.position.set(-11+i*4.4,12,-14.5);piv.add(cone);cone.position.y=-8;g.add(piv);CON.beams.push(piv);}
  CON.lamps=[0xff3d8a,0x3dd6ff].map((c,i)=>{const l=new THREE.PointLight(c,2.2,40,2);l.position.set(i?8:-8,8,-12);g.add(l);return l;});
  /* the crowd */
  const n=QH?26:QM?18:12;for(let i=0;i<n;i++){const s=makeSim(randomLook(chance(.5)));const x=rnd(-14,14),z=rnd(-9,6);s.position.set(x,0,z);s.rotation.y=Math.PI+rnd(-0.4,0.4);g.add(s);CON.crowd.push({g:s,ph:rnd(0,6),k:pick(['dance','dance','cheer','dance','phone'])});}
  /* the artists */
  for(let i=0;i<3;i++){const s=makeSim(Object.assign(randomLook(false),{shirt:[0xf2f2f2,0x1b1b1b,0xd23b2b][i],top:['ankara','tee','long'][i],glasses:i===1,necklace:true,watch:true}));s.position.set(-4+i*4,1.65,-18);s.visible=i===0;g.add(s);CON.stars.push(s);}
  return g;}
function screenDraw(c,artist){const t=canvasTex(512,224,(g,w,h)=>{g.fillStyle='#08040c';g.fillRect(0,0,w,h);const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#ff3d8a');gr.addColorStop(1,'#ffd34d');g.fillStyle=gr;g.textAlign='center';
  g.font='900 40px sans-serif';g.fillText(c.title.toUpperCase(),w/2,70);g.fillStyle='#ffffff';g.font='900 54px sans-serif';g.fillText(artist||'',w/2,150);g.fillStyle='#bbb';g.font='600 20px sans-serif';g.fillText('BWARI EVENT GROUND',w/2,196);});
  const old=CON.screen.material.map;CON.screen.material.map=t;CON.screen.material.needsUpdate=true;if(old)old.dispose();}

/* ---------- music: a small afrobeats loop made in the browser (no audio files) ---------- */
function musicStart(){if(CON.music||!AU.on||!AU.ctx)return;const c=AU.ctx;const out=c.createGain();out.gain.value=0.5;out.connect(c.destination);let step=0;const bpm=104,sp=60/bpm/4;let next=c.currentTime+0.05;
  const kick=t=>{const o=c.createOscillator(),gg=c.createGain();o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+0.16);gg.gain.setValueAtTime(0.9,t);gg.gain.exponentialRampToValueAtTime(0.001,t+0.22);o.connect(gg);gg.connect(out);o.start(t);o.stop(t+0.24);};
  const hit=(t,f,d,v,type)=>{const s=c.createBufferSource();s.buffer=AU.noiseBuf;const fl=c.createBiquadFilter();fl.type=type||'highpass';fl.frequency.value=f;const gg=c.createGain();gg.gain.setValueAtTime(v,t);gg.gain.exponentialRampToValueAtTime(0.001,t+d);s.connect(fl);fl.connect(gg);gg.connect(out);s.start(t);s.stop(t+d+0.02);};
  const log=(t,f)=>{const o=c.createOscillator(),gg=c.createGain();o.type='sine';o.frequency.setValueAtTime(f*1.6,t);o.frequency.exponentialRampToValueAtTime(f,t+0.06);gg.gain.setValueAtTime(0.5,t);gg.gain.exponentialRampToValueAtTime(0.001,t+0.35);o.connect(gg);gg.connect(out);o.start(t);o.stop(t+0.4);};
  const chord=(t,fs)=>fs.forEach(f=>{const o=c.createOscillator(),gg=c.createGain();o.type='triangle';o.frequency.value=f;gg.gain.setValueAtTime(0.06,t);gg.gain.exponentialRampToValueAtTime(0.001,t+0.25);o.connect(gg);gg.connect(out);o.start(t);o.stop(t+0.3);});
  const BASS=[55,0,0,55,0,0,73.4,0,0,65.4,0,0,61.7,0,55,0],CH=[[220,277,330],[196,247,294],[175,220,262],[196,247,294]];
  const tick=()=>{if(!CON.music)return;while(next<c.currentTime+0.12){const s=step%16,bar=Math.floor(step/16)%4;if(s===0||s===7||s===10)kick(next);if(s===4||s===12)hit(next,1800,0.12,0.35,'bandpass');hit(next,7000,0.03,s%2?0.08:0.14);
      if(BASS[s])log(next,BASS[s]);if(s===2||s===6||s===10||s===14)chord(next,CH[bar]);next+=sp;step++;}};CON.music={out,iv:setInterval(tick,25)};}
function musicStop(){if(!CON.music)return;clearInterval(CON.music.iv);try{CON.music.out.gain.setTargetAtTime(0,AU.ctx.currentTime,0.2);setTimeout(()=>{try{CON.music&&CON.music.out.disconnect();}catch(e){}CON.music=null;},600);}catch(e){CON.music=null;}}

/* ---------- going, being there, leaving ---------- */
const conBar=el('div',null,'');conBar.id='conBar';conBar.hidden=true;$('#app').append(conBar);
{const st=document.createElement('style');st.textContent='#conBar{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 74px);z-index:8;display:flex;flex-wrap:wrap;justify-content:center;gap:6px;width:min(560px,calc(100vw - 24px))}#conBar button{flex:1 1 30%;min-height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(20,8,28,.88);color:#fff;font-weight:800;font-size:13px}#conBar button.on{background:#ff3d8a;border-color:#ff3d8a}#conBar .cap{flex:1 1 100%;text-align:center;font-weight:800;color:#ffd34d;text-shadow:0 2px 8px #000;font-size:14px}body.concert #obj,body.concert #autoRun,body.concert #leave,body.concert #bmBtn,body.concert #labels,body.concert #prompt,body.concert #mapbar{display:none!important}';document.head.appendChild(st);}
function goConcert(){const c=conNow();if(!c||W.concert)return;if(ACT)stopAction(true);endDriving();venueBuild();
  fadeThen(()=>{CON.g.visible=true;W.concert={vip:!!(S.ticket&&S.ticket.vip),dance:false,artist:-1,front:false};W.side=1;
    P.x=VENUE.x+rnd(-3,3);P.z=VENUE.z+(W.concert.vip?-8:3);P.path=null;P.mode='idle';P.dir=Math.PI;player.visible=true;outdoor.add(player);player.position.set(P.x,0,P.z);
    document.body.classList.add('concert');conBar.hidden=false;conDraw();musicStart();setCarLights(true);
    toast('Bwari Event Ground',W.concert.vip?'VIP wristband on. Straight to the front.':'The bass hits you in the chest. The whole of Bwari is here.','good');try{N('fun',10);N('stress',-8);}catch(e){}
    const n=NETX();if(n)try{n.log('party_host',{concert:c.title});}catch(e){}});}
function conDraw(){const c=conNow();const C=W.concert;if(!c||!C)return;conBar.innerHTML='';const s0=conStart();const idx=clamp(Math.floor((S.t-s0)/60),-1,c.lineup.length);
  conBar.append(el('div','cap',S.t<s0?'Doors open · show starts at '+fmtTime(c.hour*60):idx<c.lineup.length?'🎤 Now on stage: '+esc(c.lineup[Math.min(idx,c.lineup.length-1)]):'The show is over'));
  const B=(t,fn,on,dis)=>{const b=el('button',on?'on':null,t);if(dis)b.disabled=true;b.onclick=()=>{fn();conDraw();};conBar.append(b);};
  B(C.dance?'💃 Dancing':'💃 Dance',()=>{C.dance=!C.dance;},C.dance);
  B('🥤 Drink '+naira(1500),()=>{if(C.vip&&!C.freeDrink){C.freeDrink=1;toast('VIP','Free drink. Chilled.','good');}else if(!spend(1500,'Drink at the concert'))return toast('Not enough money','','bad');try{N('food',8);N('bladder',-12);N('fun',4);}catch(e){}});
  B('📸 Selfie',()=>{if(!S.dataDays)return toast('No data','Your selfie can\'t upload without data.','bad');S.vibe.followers+=ri(8,40);S.vibe.posts.push({t:S.t,cap:'At '+c.title+' 🔥🎤',likes:ri(30,160),com:'"Omo you went?!"'});toast('VIBE','Posted. The likes are pouring in.','good');xp(10,'Concert selfie');});
  B(C.front?'⭐ At the front':'⭐ Go to the front',()=>{if(!C.vip)return toast('VIP only','Upgrade at the Tickets app: VIP gets you to the barrier.','bad');C.front=true;P.x=VENUE.x+rnd(-2,2);P.z=VENUE.z-10;player.position.set(P.x,0,P.z);},C.front,false);
  B('🚌 Leave',()=>leaveConcert());}
function leaveConcert(over){if(!W.concert)return;fadeThen(()=>{musicStop();CON.g.visible=false;document.body.classList.remove('concert');conBar.hidden=true;W.concert=null;
  const gp=freeNear(NAV,2,93,6);P.x=gp.x;P.z=gp.z;P.path=null;P.mode='idle';W.side=0;W.lpx=P.x;W.lpz=P.z;player.position.set(P.x,0,P.z);S.flags.lockPass=S.t+90;setCarLights(minOf(S.t)>=19*60||minOf(S.t)<6*60);
  addMoodlet('Saw them live!',18,1440);setMood('Excited',300);toast('Back at school',over?'What a night. The shuttle drops everyone at the Main Gate. Your ears are still ringing.':'The shuttle drops you at the Main Gate.','good');S.stats.concerts=(S.stats.concerts||0)+1;save();});}
/* every frame at the venue: lights, dancing, the camera */
HOOKS.frame.push((dt,now)=>{const C=W.concert;if(!C||!CON.g)return;const c=conNow();const t=now/1000;CON.t+=dt;
  CON.beams.forEach((b,i)=>{b.rotation.z=Math.sin(t*0.9+i)*0.5;b.rotation.x=Math.cos(t*0.7+i*1.3)*0.35;});CON.lamps.forEach((l,i)=>{l.intensity=1.6+Math.abs(Math.sin(t*3.4+i*1.7))*2.2;});
  const s0=conStart();const idx=c?Math.floor((S.t-s0)/60):-1;
  if(c&&idx!==C.artist){C.artist=idx;CON.stars.forEach((s,i)=>s.visible=i===Math.min(idx,2)&&idx>=0&&idx<c.lineup.length);screenDraw(c,idx<0?'STARTING SOON':idx<c.lineup.length?c.lineup[idx]:'THANK YOU BWARI!');conDraw();
    if(idx>=0&&idx<c.lineup.length)toast('🎤 Now on stage',esc(c.lineup[idx]));}
  if(c&&S.t>=s0+180&&!C.ending){C.ending=1;setTimeout(()=>leaveConcert(true),2500);}
  CON.crowd.forEach((p,i)=>{if(!p.g.visible)return;pose(p.g,p.k,t*1.0+p.ph,dt);});CON.stars.forEach((s,i)=>{if(s.visible)pose(s,i===1?'cheer':'dance',t,dt);});
  pose(player,C.dance?'dance':'stand',t,dt);player.position.set(P.x,0,P.z);player.rotation.y=Math.PI;
  if(C.dance){try{N('fun',dt*0.6);N('energy',-dt*0.1);}catch(e){}}
  /* camera: slow moves between a wide shot, the stage and you in the crowd */
  const k=Math.floor(CON.t/7)%3;const vx=VENUE.x,vz=VENUE.z;let px,py,pz,ax,ay,az;
  if(k===0){px=vx+Math.sin(t*0.12)*16;py=7;pz=vz+18;ax=vx;ay=4;az=vz-14;}
  else if(k===1){px=vx+Math.sin(t*0.2)*5;py=3.2;pz=vz-8;ax=vx;ay=3.4;az=vz-18;}
  else{px=P.x+2.4;py=2.2;pz=P.z+4.2;ax=P.x;ay=1.4;az=P.z-1;}
  camera.position.set(px,py,pz);camera.lookAt(ax,ay,az);cam.tx=P.x;cam.tz=P.z;});
/* nothing else happens to you while you're at the concert (no kidnapping on the road, no curfew catch) */
{const _kt=kidnapTick;kidnapTick=function(){if(W.concert)return;return _kt.apply(this,arguments);};}
HOOKS.minute.unshift(()=>{if(W.concert)S.flags.lockPass=Math.max(S.flags.lockPass||0,S.t+30);});

/* hand the concert function to the online side */
window.__concertSet=concertSet;setTimeout(()=>{try{const n=window.VLNet;if(n&&n.VL)n.VL.concertSet=concertSet;}catch(e){}},0);
if(window.__QA)window.__CON={concertSet,goConcert,leaveConcert,ticketSheet,boardsDraw,CON};
