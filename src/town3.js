/* ================= TOWN 3: nightclub and houses for sale or rent at Bwari Junction =================
   Runs before the world is built, so these get real walls, roofs, doors and collision. */
LOCS.club={name:'Club Vibez',sub:'Nightclub · 9 PM – 4 AM · 18+ · cover ₦3,000',x:-28,z:120,w:16,d:11,h:7,wall:0x1d1b2e,roof:0x2a1a3a,inside:'club',iname:'Club Vibez · dance floor',zone:'off',open:[21,28],flat:true,awning:true};
LOCS.prop1={name:'Junction Court Apartment',sub:'Apartment · 1 bedroom · for sale or rent',x:28,z:158,w:13,d:10,h:7,wall:0xe7d9c2,roof:0x7a3b22,inside:'home3',iname:'Junction Court · living room',zone:'off',prop:true};
LOCS.prop2={name:'Hillside Bungalow',sub:'Bungalow · 2 bedrooms · for sale or rent',x:-38,z:160,w:14,d:11,h:6,wall:0xd9e2cf,roof:0x2f5a3a,inside:'home3',iname:'Hillside Bungalow · living room',zone:'off',prop:true};
LOCS.prop3={name:'Bwari Heights Duplex',sub:'Duplex · 3 bedrooms · for sale or rent',x:96,z:150,w:14,d:11,h:9,wall:0xf2ead8,roof:0x3a3a4a,inside:'home3',iname:'Bwari Heights · living room',zone:'off',prop:true};
LOCS.prop4={name:'Mini Flat by the Market',sub:'Mini flat · 1 room · for sale or rent',x:-100,z:152,w:12,d:10,h:6,wall:0xe9d2b4,roof:0x8a4a2a,inside:'home3',iname:'Mini Flat · living room',zone:'off',prop:true};
for(const id of ['club','prop1','prop2','prop3','prop4']){const L=LOCS[id];L.id=id;L.door=L.z>135?{x:L.x,z:L.z-L.d/2-1.5}:{x:L.x,z:L.z+L.d/2+1.5};}
