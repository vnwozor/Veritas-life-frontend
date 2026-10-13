/* ================= MAP FROM ANYWHERE =================
   Inside a building, a hostel corridor, upstairs, or while driving, the Map button opens a drawn map
   of the whole campus and Bwari Junction. It marks where you are; tap any place to go there (you walk
   out of the building on the way). Outside, the Map button opens the 3D map as before. */
function hereId(){const id=S&&S.inside;if(!id)return null;if(id==='boysHall'||id==='boysHall2'||id==='nroom')return 'boys';const L=LOCS[id];if(L&&L.upOf)return L.upOf;return id;}
function mapSpots(){const ids=new Set();PLACE_CAT.forEach(([,a])=>a.forEach(i=>ids.add(i)));Object.keys(LOCS).forEach(i=>{const L=LOCS[i];if(L&&L.block)ids.add(i);});
  return [...ids].filter(i=>{const L=LOCS[i];return L&&L.x!=null&&L.z!=null&&!L.upOf&&L.name;});}
function drawnMap(){const here=hereId();const ids=mapSpots();
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;const grow=(x,z)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);};
  ROADS.forEach(r=>{grow(r.x1,r.z1);grow(r.x2,r.z2);});ids.forEach(i=>{const L=LOCS[i];grow(L.x-(L.w||6)/2,L.z-(L.d||6)/2);grow(L.x+(L.w||6)/2,L.z+(L.d||6)/2);});
  x0-=8;x1+=8;z0-=8;z1+=8;const W2=x1-x0,H2=z1-z0;
  const me=here&&LOCS[here]?{x:LOCS[here].x,z:LOCS[here].z}:W.drive&&S.car?{x:S.car.x,z:S.car.z}:{x:P.x,z:P.z};
  let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+x0+' '+z0+' '+W2+' '+H2+'" style="width:100%;height:auto;display:block;background:#1d3a2c;border-radius:12px;touch-action:manipulation">';
  svg+='<rect x="-104" y="-104" width="208" height="208" rx="6" fill="#244a37" stroke="#c9971c" stroke-width="0.8" stroke-dasharray="3 2"/>';
  ROADS.forEach(r=>{svg+='<line x1="'+r.x1+'" y1="'+r.z1+'" x2="'+r.x2+'" y2="'+r.z2+'" stroke="#6d6a64" stroke-width="6.5" stroke-linecap="round"/>';});
  ROADS.forEach(r=>{svg+='<line x1="'+r.x1+'" y1="'+r.z1+'" x2="'+r.x2+'" y2="'+r.z2+'" stroke="#efe6cf" stroke-width="0.35" stroke-dasharray="2 2.5" opacity=".6"/>';});
  ids.forEach(i=>{const L=LOCS[i];const w=L.w||6,d=L.d||6;const on=i===here;const col='#'+((L.wall||0xd9cfb8)>>>0).toString(16).padStart(6,'0');
    svg+='<g data-loc="'+i+'" style="cursor:pointer"><rect x="'+(L.x-w/2)+'" y="'+(L.z-d/2)+'" width="'+w+'" height="'+d+'" rx="1.2" fill="'+col+'" stroke="'+(on?'#c9971c':'#0b1a14')+'" stroke-width="'+(on?1.6:0.5)+'"/>'+
      '<rect x="'+(L.x-Math.max(w,14)/2)+'" y="'+(L.z-Math.max(d,10)/2)+'" width="'+Math.max(w,14)+'" height="'+Math.max(d,10)+'" fill="transparent"/>'+
      '<text x="'+L.x+'" y="'+(L.z+d/2+3.6)+'" font-size="3.3" font-weight="700" text-anchor="middle" fill="#efe6cf" stroke="#0b1a14" stroke-width="0.7" paint-order="stroke" style="pointer-events:none;font-family:system-ui,sans-serif">'+esc(fx(L.name))+'</text></g>';});
  svg+='<circle cx="'+me.x+'" cy="'+me.z+'" r="3.4" fill="#c2306b" stroke="#fff" stroke-width="0.9"/><text x="'+me.x+'" y="'+(me.z-5)+'" font-size="3.6" font-weight="800" text-anchor="middle" fill="#fff" stroke="#c2306b" stroke-width="0.9" paint-order="stroke" style="pointer-events:none;font-family:system-ui,sans-serif">YOU</text>';
  return {svg:svg+'</svg>',me,box:[x0,z0,W2,H2]};}
function goFromMap(id){closeSheet();if(W.drive){if(Math.abs(W.drive.v)>3)return toast('Slow down','Stop the car first, then pick where to go.');exitCar();if(!W.drive&&S.car&&S.car.fuel>0){setTimeout(()=>autoDrive(id),700);return;}}
  setTimeout(()=>openLoc(id),60);}
function anyMap(){if(!S||W.fading)return;const M=drawnMap();const wrap=el('div');wrap.style.display='grid';wrap.style.gap='8px';
  const tools=el('div');tools.style.cssText='display:flex;gap:6px;flex-wrap:wrap';
  const box=el('div');box.style.cssText='overflow:auto;max-height:62vh;border-radius:12px;-webkit-overflow-scrolling:touch';box.innerHTML=M.svg;const sv=box.firstChild;let z=1;
  const zoomTo=nz=>{z=clamp(nz,1,3.2);sv.style.width=(z*100)+'%';const [x0,z0,W2,H2]=M.box;requestAnimationFrame(()=>{box.scrollLeft=(M.me.x-x0)/W2*box.scrollWidth-box.clientWidth/2;box.scrollTop=(M.me.z-z0)/H2*box.scrollHeight-box.clientHeight/2;});};
  const tb=(t,fn)=>{const b=el('button','tbtn','<b>'+t+'</b>');b.style.flex='1';b.onclick=fn;tools.append(b);};
  tb('＋ Zoom in',()=>zoomTo(z*1.5));tb('− Zoom out',()=>zoomTo(z/1.5));tb('☰ Places',()=>{closeSheet();placesSheet();});
  wrap.append(tools,box,el('div','note',S.inside?'You are inside '+esc(fx((LOCS[hereId()]||{}).name||'a building'))+'. Tap any place to go there; you walk out on the way.':W.drive?'Tap a place: you park and your car drives you there.':'Tap any place to go there.'));
  box.addEventListener('click',e=>{const g=e.target.closest('[data-loc]');if(!g)return;goFromMap(g.dataset.loc);});
  openSheet('Map','Veritas University · Bwari Junction',wrap);zoomTo(1.6);}
/* a Map button on the driving controls too */
{const r=$('#drive .dmid');if(r){const b=document.createElement('button');b.id='dMap';b.textContent='⌖ Map';b.style.cssText='width:100%;margin-bottom:6px;padding:7px 10px;font-weight:700;background:var(--ink2);color:var(--cream);border:1px solid var(--line);border-radius:10px';b.onclick=()=>anyMap();r.prepend(b);}}
if(window.__QA)window.__MAP={anyMap,drawnMap,hereId,goFromMap};
/* the Map button and the phone's Map app open this map inside buildings too */
{const nav=$('#nav');if(nav)nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!S||W.fading||b.dataset.tab!=='map'||!S.inside)return;e.stopImmediatePropagation();e.preventDefault();if(UI.sheet)closeSheet();if(UI.phone)closePhone();anyMap();},true);}
{const _t=toast;toast=function(t,m){if(t==='Map'&&/Leave the building/.test(m||'')&&S&&S.inside){setTimeout(anyMap,30);return;}return _t.apply(this,arguments);};}
/* character creation keeps the name you typed (or your account name) when you switch Male / Female */
{const n=$('#inName'),g=$('#cGender');if(n&&g){n.addEventListener('input',()=>{n.dataset.own=n.value.trim()?'1':'';});
  g.addEventListener('click',()=>{const keep=n.dataset.own?n.dataset.keep:null;setTimeout(()=>{if(keep)n.value=keep;},0);},true);
  n.addEventListener('input',()=>{n.dataset.keep=n.value;});
  const obs=()=>{if(n.value&&n.value!=='Daniel'&&n.value!=='Adaeze'&&!n.dataset.own){n.dataset.own='1';n.dataset.keep=n.value;}};setInterval(obs,800);}}
