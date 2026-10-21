"use strict";
/* ================= Walking pets: species, moods, accessories, scenes, family (SVG, 200×200) ================= */
const PO='stroke="#3a302a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
const INK='#2b2420';
const PETS={
 duck:{name:'Duck',def:'Mochi',body:'#FFDE6E',belly:'#FFF1BE',feet:'#F7A23E',beak:'#F7A23E'},
 shiba:{name:'Shiba',def:'Kuri',body:'#E8A15A',belly:'#FFF4E0',feet:'#FFF4E0'},
 cat:{name:'Cat',def:'Tama',body:'#C9CDD3',belly:'#F5F4F1',feet:'#F5F4F1'},
 penguin:{name:'Penguin',def:'Pen',body:'#3B4760',belly:'#F7F6F2',feet:'#F29A3A',beak:'#F29A3A'},
 bunny:{name:'Bunny',def:'Usa',body:'#F6F2EC',belly:'#FFFFFF',feet:'#FFFFFF'},
 frog:{name:'Frog',def:'Kero',body:'#8CCB6A',belly:'#D9F0B8',feet:'#7AB85A'},
 panda:{name:'Panda',def:'Pan',body:'#F7F7F5',belly:'#FFFFFF',feet:'#2f2f33'},
 fox:{name:'Fox',def:'Kon',body:'#E9824A',belly:'#FFF6EA',feet:'#3a302a'},
 axolotl:{name:'Axolotl',def:'Upa',body:'#F4A7C0',belly:'#FBD3E0',feet:'#F4A7C0'},
 capybara:{name:'Capybara',def:'Kapi',body:'#A9784E',belly:'#C79A6E',feet:'#8A5E3B'},
};
const STARTER=['duck','shiba','cat','penguin'];
const ACCS={partyhat:'Party hat',cap:'Red cap',bow:'Bow',sunnies:'Sunglasses',scarf:'Scarf',flowers:'Flower crown',headphones:'Headphones',crown:'Crown',collar:'Golden collar'};
const SCENES={meadow:'Meadow',beach:'Beach',sakura:'Sakura',snow:'Snow day',night:'City night',space:'Space'};

/* ---------- scene backgrounds ---------- */
function sceneSVG(k){
  const g=(id,a,b)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  const flower=(x,y,c)=>`<g transform="translate(${x} ${y})"><circle cx="0" cy="-3" r="2.4" fill="${c}"/><circle cx="3" cy="0" r="2.4" fill="${c}"/><circle cx="0" cy="3" r="2.4" fill="${c}"/><circle cx="-3" cy="0" r="2.4" fill="${c}"/><circle r="1.8" fill="#F7D65A"/></g>`;
  if(k==='beach') return `<defs>${g('sk','#BFE6F5','#EAF7FB')}</defs><rect width="200" height="200" fill="url(#sk)"/><circle cx="160" cy="40" r="16" fill="#FFE08A"/><rect y="118" width="200" height="34" fill="#7CC6E0"/><path d="M0 128q25 -6 50 0t50 0t50 0t50 0" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/><rect y="150" width="200" height="50" fill="#F3DFB3"/><path d="M22 150c2-20 4-32 2-48" stroke="#8B6A44" stroke-width="4" fill="none"/><path d="M24 104c-12-6-20-2-24 4M24 104c10-8 20-8 26-2M24 104c-4-10 0-18 8-20" stroke="#5FA35A" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="178" cy="176" r="5" fill="#F4A7C0"/><path d="M168 186l6-4 6 4" stroke="#E07F8F" stroke-width="2" fill="none"/>`;
  if(k==='sakura') return `<defs>${g('sk','#FCE4EC','#FFF5F7')}</defs><rect width="200" height="200" fill="url(#sk)"/><path d="M200 18c-30 8-58 20-80 40" stroke="#8B5E4B" stroke-width="5" fill="none" stroke-linecap="round"/>${[[150,30],[170,22],[132,46],[186,36],[118,58],[160,46]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="9" fill="#F7B6C9" opacity=".95"/><circle cx="${x+5}" cy="${y-3}" r="6" fill="#FBD0DD"/>`).join('')}${[[40,60],[70,90],[24,120],[90,40],[60,140]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="3.2" ry="2" fill="#F7B6C9" transform="rotate(30 ${x} ${y})"/>`).join('')}<rect y="160" width="200" height="40" fill="#CDE6B5"/><path d="M0 160q50 -8 100 0t100 0v4H0z" fill="#B7DB9B"/>`;
  if(k==='snow') return `<defs>${g('sk','#D6E6F2','#F2F7FB')}</defs><rect width="200" height="200" fill="url(#sk)"/>${[[20,30],[60,18],[110,40],[150,22],[180,60],[36,80],[90,70],[170,100],[14,120]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="#fff"/>`).join('')}<path d="M0 150q40 -18 80 -4t70 -6t50 4V200H0z" fill="#FFFFFF"/><path d="M150 150l10-26 10 26z" fill="#6E9C7A"/><path d="M152 138l8-20 8 20z" fill="#7FB08A"/><rect x="158" y="150" width="4" height="6" fill="#8B6A44"/>`;
  if(k==='night') return `<defs>${g('sk','#1F2A44','#3A3F66')}</defs><rect width="200" height="200" fill="url(#sk)"/><circle cx="156" cy="40" r="14" fill="#FFF2C2"/><circle cx="162" cy="36" r="12" fill="#2A3352"/>${[[30,30],[70,20],[100,50],[20,80],[180,80],[130,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="#FFF2C2"/>`).join('')}<path d="M0 150V112h16V98h14v14h12V90h18v24h10V104h16v46zM120 150V100h20V86h16v18h12V96h14v54z" fill="#2A3352"/>${[[20,118],[48,100],[66,124],[130,110],[146,96],[172,112]].map(([x,y])=>`<rect x="${x}" y="${y}" width="4" height="5" fill="#FFD27A" opacity=".8"/>`).join('')}<rect y="150" width="200" height="50" fill="#4A4F78"/>`;
  if(k==='space') return `<defs>${g('sk','#120F2E','#2D2263')}</defs><rect width="200" height="200" fill="url(#sk)"/>${[[20,20],[60,40],[110,14],[170,30],[30,90],[184,96],[90,80],[150,64]].map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="${i%3?1.4:2.2}" fill="#fff"/>`).join('')}<circle cx="160" cy="50" r="14" fill="#E7A2F0"/><ellipse cx="160" cy="50" rx="24" ry="5" fill="none" stroke="#F7D65A" stroke-width="2"/><path d="M0 160q100 -30 200 0V200H0z" fill="#8E86C9"/><circle cx="40" cy="176" r="6" fill="#7A72B6"/><circle cx="150" cy="182" r="8" fill="#7A72B6"/>`;
  return `<defs>${g('sk','#CFEAF5','#F4FAF5')}</defs><rect width="200" height="200" fill="url(#sk)"/><circle cx="162" cy="38" r="15" fill="#FFE08A"/><ellipse cx="44" cy="40" rx="18" ry="8" fill="#fff"/><ellipse cx="58" cy="36" rx="12" ry="8" fill="#fff"/><path d="M0 156q50 -22 100 -6t100 -4V200H0z" fill="#A9D98C"/><path d="M0 170q60 -12 120 0t80 -2V200H0z" fill="#93CC76"/>${flower(24,176,'#F7A1B5')}${flower(176,170,'#fff')}${flower(150,186,'#F7A1B5')}${flower(40,190,'#fff')}`;
}

/* ---------- the pet ---------- */
function eyesFor(mood,ex,ey,dark,big){
  const c=dark?'#fff':INK, hi=dark?INK:'#fff';
  const dot=big?(x)=>`<g class="pet-eye"><ellipse cx="${x}" cy="${ey}" rx="6.6" ry="7.8" fill="${c}"/><circle cx="${x-2.2}" cy="${ey-2.8}" r="2.6" fill="${hi}"/><circle cx="${x+2.4}" cy="${ey+2.8}" r="1.2" fill="${hi}"/></g>`:(x)=>`<g class="pet-eye"><ellipse cx="${x}" cy="${ey}" rx="5.2" ry="6.2" fill="${c}"/><circle cx="${x-1.8}" cy="${ey-2.2}" r="1.9" fill="${hi}"/></g>`;
  const arc=(x)=>`<path d="M${x-6} ${ey+2}q6 -8 12 0" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  if(mood==='ecstatic'||mood==='happy') return arc(100-ex)+arc(100+ex);
  if(mood==='sleeping') return `<path d="M${100-ex-6} ${ey}h12M${100+ex-6} ${ey}h12" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  if(mood==='grumpy') return `<path d="M${100-ex-6} ${ey}h12M${100+ex-6} ${ey}h12" stroke="${c}" stroke-width="3" stroke-linecap="round"/><ellipse cx="${100-ex}" cy="${ey+2.6}" rx="4.4" ry="2.6" fill="${c}"/><ellipse cx="${100+ex}" cy="${ey+2.6}" rx="4.4" ry="2.6" fill="${c}"/>`;
  if(mood==='angry') return `<ellipse cx="${100-ex}" cy="${ey+1}" rx="4.6" ry="4" fill="${c}"/><ellipse cx="${100+ex}" cy="${ey+1}" rx="4.6" ry="4" fill="${c}"/>`;
  return dot(100-ex)+dot(100+ex);
}
function browsFor(mood,ex,ey,dark){const c=dark?'#fff':INK, y=ey-11;
  if(mood==='sad'||mood==='worried') return `<path d="M${100-ex-7} ${y+1}l10 -4M${100+ex+7} ${y+1}l-10 -4" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
  if(mood==='grumpy') return `<path d="M${100-ex-7} ${y-2}l11 3M${100+ex+7} ${y-2}l-11 3" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
  if(mood==='angry') return `<path d="M${100-ex-8} ${y-4}l13 6M${100+ex+8} ${y-4}l-13 6" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`;
  return '';}
function mouthFor(mood,mx,my,sp){
  if(sp.beak){const b=sp.beak; if(sp===PETS.duck&&mood!=='ecstatic'&&mood!=='angry'&&mood!=='grumpy'&&mood!=='sad') return `<path d="M${mx-8} ${my-1}q8 -6 16 0q-2 6 -8 6q-6 0 -8 -6z" fill="${b}" ${PO}/><path d="M${mx-5} ${my+1.5}q5 2.5 10 0" fill="none" stroke="#C9741F" stroke-width="1.4" stroke-linecap="round"/>`;
    if(mood==='ecstatic') return `<path d="M${mx-10} ${my-2}q10 -6 20 0q-10 5 -20 0z" fill="${b}" ${PO}/><path d="M${mx-8} ${my+1}q8 12 16 0z" fill="#E86A5A" ${PO}/>`;
    if(mood==='angry'||mood==='grumpy') return `<path d="M${mx-10} ${my}q10 -5 20 0q-10 6 -20 0z" fill="${b}" ${PO}/><path d="M${mx-10} ${my}h20" stroke="#3a302a" stroke-width="1.6"/>`;
    if(mood==='sad') return `<path d="M${mx-9} ${my+1}q9 -5 18 0q-9 8 -18 0z" fill="${b}" ${PO}/>`;
    return `<path d="M${mx-10} ${my}q10 -6 20 0q-10 7 -20 0z" fill="${b}" ${PO}/><path d="M${mx-9} ${my+0.5}h18" stroke="#3a302a" stroke-width="1.2" opacity=".6"/>`;}
  const s='stroke="#3a302a" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  if(mood==='ecstatic') return `<path d="M${mx-8} ${my-1}q8 14 16 0z" fill="#E86A5A" ${PO}/>`;
  if(mood==='happy') return `<path d="M${mx-7} ${my}q3.5 4 7 0q3.5 4 7 0" ${s}/>`;
  if(mood==='content'||mood==='sleeping') return `<path d="M${mx-5} ${my}q2.5 3 5 0q2.5 3 5 0" ${s}/>`;
  if(mood==='worried') return `<ellipse cx="${mx}" cy="${my+1}" rx="2.6" ry="3" fill="#3a302a"/>`;
  if(mood==='sad') return `<path d="M${mx-6} ${my+3}q6 -6 12 0" ${s}/>`;
  if(mood==='grumpy') return `<path d="M${mx-6} ${my+2}h12" ${s}/>`;
  return `<path d="M${mx-8} ${my}l4 -3l4 3l4 -3l4 3" ${s}/>`;}
function earsFor(k,sp){const o=PO;
  if(k==='shiba') return `<path d="M62 92l4 -30l22 18z" fill="${sp.body}" ${o}/><path d="M138 92l-4 -30l-22 18z" fill="${sp.body}" ${o}/><path d="M68 86l2 -16l11 10z" fill="#FFF4E0"/><path d="M132 86l-2 -16l-11 10z" fill="#FFF4E0"/>`;
  if(k==='cat') return `<path d="M62 94l2 -32l24 20z" fill="${sp.body}" ${o}/><path d="M138 94l-2 -32l-24 20z" fill="${sp.body}" ${o}/><path d="M68 88l1 -17l12 11z" fill="#F4B6C2"/><path d="M132 88l-1 -17l-12 11z" fill="#F4B6C2"/>`;
  if(k==='fox') return `<path d="M60 94l0 -36l28 22z" fill="${sp.body}" ${o}/><path d="M140 94l0 -36l-28 22z" fill="${sp.body}" ${o}/><path d="M60 70l0 -12l9 7z" fill="#3a302a"/><path d="M140 70l0 -12l-9 7z" fill="#3a302a"/>`;
  if(k==='bunny') return `<g class="pet-ears"><rect x="72" y="30" width="16" height="54" rx="8" fill="${sp.body}" ${o} transform="rotate(-8 80 84)"/><rect x="112" y="30" width="16" height="54" rx="8" fill="${sp.body}" ${o} transform="rotate(8 120 84)"/><rect x="76.5" y="38" width="7" height="38" rx="3.5" fill="#F4B6C2" transform="rotate(-8 80 84)"/><rect x="116.5" y="38" width="7" height="38" rx="3.5" fill="#F4B6C2" transform="rotate(8 120 84)"/></g>`;
  if(k==='panda') return `<circle cx="66" cy="84" r="12" fill="#2f2f33" ${o}/><circle cx="134" cy="84" r="12" fill="#2f2f33" ${o}/>`;
  if(k==='capybara') return `<ellipse cx="70" cy="84" rx="8" ry="6" fill="#8A5E3B" ${o}/><ellipse cx="130" cy="84" rx="8" ry="6" fill="#8A5E3B" ${o}/>`;
  if(k==='axolotl') return [-1,1].map(s=>[0,1,2].map(i=>{const x=100+s*50, y=96+i*14, x2=x+s*18, y2=y-6+i*3; return `<path d="M${x} ${y}Q${x+s*10} ${y-8} ${x2} ${y2}" stroke="#E0608E" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="${x2}" cy="${y2}" r="3.5" fill="#E0608E"/>`;}).join('')).join('');
  if(k==='duck') return `<path d="M100 76c-1 -9 3 -15 9 -14c-4 2 -5 6 -4 10z" fill="${sp.body}" ${o}/><path d="M99 76c-3 -8 -9 -11 -14 -8c4 1 7 4 7 9z" fill="${sp.body}" ${o}/><path d="M101 75c1 -6 6 -8 10 -6" fill="none" ${o}/>`;
  return '';}
function tailFor(k,sp){const o=PO;
  if(k==='shiba') return `<path d="M144 132c18 -4 20 -24 6 -26c-8 -1 -10 8 -4 10" fill="none" stroke="#3a302a" stroke-width="12" stroke-linecap="round"/><path d="M144 132c18 -4 20 -24 6 -26c-8 -1 -10 8 -4 10" fill="none" stroke="${sp.body}" stroke-width="8.5" stroke-linecap="round"/>`;
  if(k==='cat') return `<path d="M146 146c22 -4 26 -30 12 -40" fill="none" stroke="#3a302a" stroke-width="11" stroke-linecap="round"/><path d="M146 146c22 -4 26 -30 12 -40" fill="none" stroke="${sp.body}" stroke-width="7.5" stroke-linecap="round"/>`;
  if(k==='fox') return `<path d="M140 150c30 4 44 -20 34 -40c-8 10 -20 14 -36 18z" fill="${sp.body}" ${o}/><path d="M174 110c-3 7 -8 11 -14 14c8 2 14 -4 14 -14z" fill="#fff"/>`;
  if(k==='bunny') return `<circle cx="150" cy="142" r="9" fill="#fff" ${o}/>`;
  if(k==='duck') return `<path d="M140 134c12 -2 20 -12 20 -22c-4 6 -12 8 -22 8z" fill="${sp.body}" ${o}/>`;
  return '';}
function bodyFor(k,sp){const o=PO;
  if(k==='duck'){const w=`<path d="M52 124c-12 3 -16 18 -9 26c6 6 16 2 18 -6c2 -8 -2 -18 -9 -20z" fill="#F7CB4D" ${o}/><path d="M48 136c3 2 7 2 9 0" fill="none" stroke="#E0AE2E" stroke-width="2" stroke-linecap="round"/>`;
    return `<path d="M100 74c30 0 52 26 52 56c0 26 -22 42 -52 42s-52 -16 -52 -42c0 -30 22 -56 52 -56z" fill="${sp.body}" ${o}/><ellipse cx="100" cy="150" rx="31" ry="17" fill="${sp.belly}"/><ellipse cx="80" cy="92" rx="10" ry="5" fill="#fff" opacity=".45" transform="rotate(-28 80 92)"/><g class="pet-wing">${w}</g><g transform="matrix(-1 0 0 1 200 0)"><g class="pet-wing">${w}</g></g>`;}
  let s=`<ellipse cx="100" cy="124" rx="52" ry="46" fill="${sp.body}" ${o}/>`;
  if(k==='penguin') s+=`<path d="M100 92c-26 0 -38 16 -38 34c0 20 16 36 38 36s38 -16 38 -36c0 -18 -12 -34 -38 -34z" fill="${sp.belly}"/><path d="M100 92c-6 4 -8 8 -8 12c0 0 4 -4 8 -4s8 4 8 4c0 -4 -2 -8 -8 -12z" fill="${sp.body}"/>`;
  else if(k==='shiba'||k==='fox') s+=`<path d="M60 126c6 16 22 26 40 26s34 -10 40 -26c-10 6 -24 4 -40 4s-30 2 -40 -4z" fill="${sp.belly}"/><ellipse cx="100" cy="150" rx="24" ry="14" fill="${sp.belly}"/>`;
  else if(k==='capybara') s+=`<ellipse cx="100" cy="128" rx="26" ry="18" fill="${sp.belly}" ${o}/><ellipse cx="93" cy="124" rx="2.4" ry="3" fill="#3a302a"/><ellipse cx="107" cy="124" rx="2.4" ry="3" fill="#3a302a"/>`;
  else if(sp.belly&&k!=='panda') s+=`<ellipse cx="100" cy="146" rx="28" ry="18" fill="${sp.belly}"/>`;
  if(k==='cat') s+=`<path d="M92 84l2 8M100 82v9M108 84l-2 8" stroke="#9EA3AB" stroke-width="3" stroke-linecap="round"/>`;
  if(k==='duck'||k==='penguin') s+=`<ellipse cx="50" cy="128" rx="8" ry="16" fill="${k==='duck'?'#F2C94C':sp.body}" ${o} transform="rotate(14 50 128)"/><ellipse cx="150" cy="128" rx="8" ry="16" fill="${k==='duck'?'#F2C94C':sp.body}" ${o} transform="rotate(-14 150 128)"/>`;
  if(k==='panda') s+=`<ellipse cx="54" cy="138" rx="10" ry="14" fill="#2f2f33" ${o}/><ellipse cx="146" cy="138" rx="10" ry="14" fill="#2f2f33" ${o}/><ellipse cx="85" cy="112" rx="10" ry="12" fill="#2f2f33" transform="rotate(20 85 112)"/><ellipse cx="115" cy="112" rx="10" ry="12" fill="#2f2f33" transform="rotate(-20 115 112)"/>`;
  return s;}
function extrasFor(mood){
  if(mood==='ecstatic') return `<g class="pet-spark"><path d="M30 70l3 -8l3 8l8 3l-8 3l-3 8l-3 -8l-8 -3z" fill="#F7D65A"/><path d="M164 86l2 -6l2 6l6 2l-6 2l-2 6l-2 -6l-6 -2z" fill="#F7D65A"/><path d="M150 52c-3 -6 4 -10 7 -5c3 -5 10 -1 7 5l-7 7z" fill="#F07D8F"/></g>`;
  if(mood==='happy') return `<path class="pet-spark" d="M156 66c-3 -6 4 -10 7 -5c3 -5 10 -1 7 5l-7 7z" fill="#F07D8F"/>`;
  if(mood==='sad') return `<path class="pet-tear" d="M76 120c-3 5 -3 9 0 10s5 -3 3 -6z" fill="#7FB5E6"/>`;
  if(mood==='angry') return `<g class="pet-steam"><path d="M150 70l6 -6M150 64l6 6M144 66l2 -2M158 72l2 -2" stroke="#E0453A" stroke-width="3.4" stroke-linecap="round"/><path d="M40 78c-6 -4 -2 -10 4 -8c0 -6 8 -6 8 0c6 -2 8 6 2 8z" fill="#fff" opacity=".85"/><path d="M160 96c-6 -4 -2 -10 4 -8c0 -6 8 -6 8 0c6 -2 8 6 2 8z" fill="#fff" opacity=".85"/></g>`;
  if(mood==='grumpy') return `<path d="M152 72c-3 -3 0 -7 3 -5c1 -4 6 -3 6 1c3 0 4 4 1 5z" fill="#fff" opacity=".85"/>`;
  if(mood==='sleeping') return `<g class="pet-zzz" font-family="DM Mono,monospace" font-weight="500" fill="#3a302a"><text x="140" y="74" font-size="14">z</text><text x="152" y="60" font-size="18">z</text><text x="166" y="42" font-size="22">Z</text></g>`;
  if(mood==='worried') return `<path d="M150 70q4 -8 10 -4q4 -8 10 0" fill="none" stroke="#3a302a" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/>`;
  return '';}
function accFor(a){
  if(a==='partyhat') return `<path d="M100 40l-16 40h32z" fill="#7CB7F0" ${PO}/><path d="M92 60h16M88 70h24" stroke="#F7D65A" stroke-width="4"/><circle cx="100" cy="38" r="5" fill="#F07D8F" ${PO}/>`;
  if(a==='cap') return `<path d="M68 86c0 -22 64 -22 64 0z" fill="#E0574B" ${PO}/><path d="M124 84c14 0 22 2 24 6c-8 2 -18 2 -28 0z" fill="#C9473C" ${PO}/><circle cx="100" cy="66" r="3" fill="#fff"/>`;
  if(a==='bow') return `<g transform="translate(128 80) rotate(18)"><path d="M0 0l-14 -9v18zM0 0l14 -9v18z" fill="#F07D8F" ${PO}/><circle r="4.5" fill="#E05A73" ${PO}/></g>`;
  if(a==='sunnies') return `<g><rect x="70" y="104" width="24" height="14" rx="6" fill="#2b2420"/><rect x="106" y="104" width="24" height="14" rx="6" fill="#2b2420"/><path d="M94 109h12" stroke="#2b2420" stroke-width="3"/><path d="M74 108l6 0" stroke="#fff" stroke-width="2" opacity=".6"/><path d="M110 108l6 0" stroke="#fff" stroke-width="2" opacity=".6"/></g>`;
  if(a==='scarf') return `<path d="M58 146c26 12 58 12 84 0l2 10c-28 12 -60 12 -88 0z" fill="#E0574B" ${PO}/><path d="M120 156l6 22l12 -4l-6 -20z" fill="#E0574B" ${PO}/><path d="M78 152v8M92 154v8M106 154v8" stroke="#F7D65A" stroke-width="3"/>`;
  if(a==='flowers') return [70,85,100,115,130].map((x,i)=>`<circle cx="${x}" cy="${82-Math.sin(i/4*Math.PI)*6}" r="6" fill="${['#F7A1B5','#F7D65A','#fff','#F7A1B5','#B9A3F0'][i]}" ${PO}/><circle cx="${x}" cy="${82-Math.sin(i/4*Math.PI)*6}" r="2" fill="#F2A33A"/>`).join('');
  if(a==='headphones') return `<path d="M58 112c0 -50 84 -50 84 0" fill="none" stroke="#3a302a" stroke-width="6"/><rect x="48" y="104" width="16" height="24" rx="7" fill="#7CB7F0" ${PO}/><rect x="136" y="104" width="16" height="24" rx="7" fill="#7CB7F0" ${PO}/>`;
  if(a==='crown') return `<path d="M76 82l-4 -22l14 10l14 -16l14 16l14 -10l-4 22z" fill="#F7C948" ${PO}/><circle cx="100" cy="66" r="3" fill="#E0574B"/><circle cx="84" cy="74" r="2.4" fill="#7CB7F0"/><circle cx="116" cy="74" r="2.4" fill="#7CB7F0"/>`;
  if(a==='bindle') return `<path d="M128 156L168 92" stroke="#8B6A44" stroke-width="4" stroke-linecap="round"/><path d="M156 84c-12 2-16 14-8 20c8 6 22 2 24-8c1-8-7-14-16-12z" fill="#E0574B" ${PO}/><circle cx="154" cy="94" r="2" fill="#fff"/><circle cx="163" cy="99" r="2" fill="#fff"/><circle cx="160" cy="89" r="1.6" fill="#fff"/>`;
  if(a==='collar') return `<path d="M62 148c24 10 52 10 76 0" fill="none" stroke="#F7C948" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="158" r="6" fill="#F7C948" ${PO}/>`;
  return '';}
/* One pet, standing at the origin of its own 200×200 box. */
function petBody(k,mood,acc,opt={}){
  const sp=PETS[k]||PETS.duck, duck=k==='duck', eyeY=k==='frog'?92:duck?112:108, ex=k==='frog'?18:duck?15:16, mouthY=k==='frog'?118:duck?127:(sp.beak?124:(k==='capybara'?134:124));
  let face='';
  if(k==='frog') face+=`<circle cx="${100-ex}" cy="${eyeY}" r="12" fill="#fff" ${PO}/><circle cx="${100+ex}" cy="${eyeY}" r="12" fill="#fff" ${PO}/>`;
  const dark=false;
  const eyeMood=k==='capybara'&&(mood==='content'||mood==='happy')?'grumpy-calm':mood;
  face+=eyeMood==='grumpy-calm'?`<path d="M${100-ex-6} ${eyeY}h12M${100+ex-6} ${eyeY}h12" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`:eyesFor(mood,ex,eyeY,k==='panda'?true:dark,duck);
  face+=browsFor(mood,ex,eyeY,false);
  if(k==='shiba'||k==='fox') face+=`<ellipse cx="100" cy="${mouthY-5}" rx="4.4" ry="3.2" fill="#3a302a"/>`;
  if(k==='cat'||k==='bunny') face+=`<path d="M97 ${mouthY-5}h6l-3 3z" fill="#F07D8F"/>`;
  if(k==='cat') face+=`<path d="M60 120l-14 -3M60 126l-14 2M140 120l14 -3M140 126l14 2" stroke="#3a302a" stroke-width="1.6" stroke-linecap="round"/>`;
  face+=mouthFor(mood,100,mouthY,sp);
  const blush=mood==='angry'?'#F05A4A':'#FF8E8E', bo=mood==='angry'?.75:.55;
  face+=`<ellipse cx="${100-ex-14}" cy="${eyeY+14}" rx="7" ry="4" fill="${blush}" opacity="${bo}"/><ellipse cx="${100+ex+14}" cy="${eyeY+14}" rx="7" ry="4" fill="${blush}" opacity="${bo}"/>`;
  const feet=duck?[82,118].map(x=>`<path d="M${x-13} ${178}c0 -8 6 -11 13 -11s13 3 13 11c-3 2 -6 1 -8 -1c-2 3 -8 3 -10 0c-2 2 -5 3 -8 1z" fill="${sp.feet}" ${PO}/>`).join(''):`<ellipse cx="80" cy="168" rx="12" ry="6.5" fill="${sp.feet}" ${PO}/><ellipse cx="120" cy="168" rx="12" ry="6.5" fill="${sp.feet}" ${PO}/>`;
  const anim=opt.still?'':` class="pet-${mood==='ecstatic'?'hop':mood==='angry'?'shake':mood==='sad'||mood==='grumpy'?'sway':mood==='sleeping'?'breathe':'bob'}"`;
  return `<g${anim}>${tailFor(k,sp)}${feet}${earsFor(k,sp)}${bodyFor(k,sp)}<g class="pet-face">${face}</g>${acc?accFor(acc):''}</g>`;
}
function eggSVG(progress){const cracks=Math.round(clampP(progress)*3);
  return `<g class="pet-wobble"><path d="M100 60c-26 0 -40 40 -40 66c0 24 18 40 40 40s40 -16 40 -40c0 -26 -14 -66 -40 -66z" fill="#FFF8EC" ${PO}/><circle cx="84" cy="110" r="7" fill="#9ED3F2"/><circle cx="116" cy="132" r="9" fill="#F7B6C9"/><circle cx="108" cy="92" r="5" fill="#F7D65A"/>${cracks>0?'<path d="M80 128l8 -6l6 6l8 -8" fill="none" stroke="#3a302a" stroke-width="2.2" stroke-linecap="round"/>':''}${cracks>1?'<path d="M104 118l8 -6l6 6" fill="none" stroke="#3a302a" stroke-width="2.2" stroke-linecap="round"/>':''}${cracks>2?'<path d="M88 96l6 6l6 -6l6 6" fill="none" stroke="#3a302a" stroke-width="2.2" stroke-linecap="round"/>':''}</g>`;}
const clampP=v=>Math.max(0,Math.min(1,v||0));
/* Full scene: background, family, main pet. opt: {species,mood,acc,scene,partner,eggs:[progress],babies,size} */
function petScene(o){
  let s=sceneSVG(o.scene||'meadow')+`<ellipse cx="100" cy="176" rx="46" ry="6" fill="#000" opacity=".1"/>`;
  if(o.partner) s+=`<ellipse cx="38" cy="180" rx="26" ry="4" fill="#000" opacity=".08"/><g transform="translate(6 98) scale(.42)">${petBody(o.species,o.mood==='angry'?'grumpy':o.mood==='ecstatic'?'happy':o.mood,'bow',{})}</g>`;
  (o.eggs||[]).forEach((p,i)=>{s+=`<g transform="translate(${150-i*24} ${132}) scale(.26)">${eggSVG(p)}</g>`;});
  for(let i=0;i<(o.babies||0)&&i<4;i++){const x=[148,170,128,182][i]; s+=`<g transform="translate(${x} ${148}) scale(.2)">${petBody(o.species,o.mood==='angry'?'sad':o.mood,null,{})}</g>`;}
  s+=`<g transform="translate(14 28) scale(.86)">${petBody(o.species,o.mood,o.acc,{})}</g>`;
  return `<svg viewBox="0 0 200 200" class="petsvg" role="img" aria-label="${esc((PETS[o.species]||PETS.duck).name)}, ${o.mood}">${s}</svg>`;}
function petAvatar(k,mood,acc){return `<svg viewBox="20 30 160 150" class="petsvg" aria-hidden="true">${petBody(k,mood||'happy',acc,{still:true})}</svg>`;}
