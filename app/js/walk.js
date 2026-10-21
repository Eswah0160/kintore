"use strict";
/* ================= Walking pet: steps, mood, streaks, treats, rewards, family ================= */
const STEPS={native:{},avail:false,perm:'unknown'};
const hasStepSensor=()=>!!(N&&typeof N.stepsJson==='function');
const stepGoal=()=>+S.profile.stepGoal||10000;
function stepsOn(k){const base=hasStepSensor()&&STEPS.avail?(STEPS.native[k]||0):(S.steps[k]||0); return base+(S.stepsAdd[k]||0);}
const hitOn=k=>stepsOn(k)>=stepGoal();
function refreshSteps(){if(!hasStepSensor()) return; try{const st=JSON.parse(N.stepsStatus()||'{}'); STEPS.hw=!!st.available; STEPS.avail=!!st.available&&st.permission==='granted'; STEPS.perm=st.permission||'unknown'; STEPS.native=JSON.parse(N.stepsJson(150)||'{}')||{};}catch(e){}}
window.kintoreSteps=n=>{STEPS.native[dkey(new Date())]=n; STEPS.avail=true; const paid=petSettle(); if(paid||UI.sheet) {if(!UI.sheet) render(); return;} liveSteps();};
function liveSteps(){const n=stepsOn(dkey(new Date())), g=stepGoal();
  document.querySelectorAll('[data-live="steps"]').forEach(el=>el.textContent=n.toLocaleString());
  document.querySelectorAll('[data-live="togo"]').forEach(el=>el.textContent=n>=g?'Goal reached':`${Math.max(0,g-n).toLocaleString()} to go`);
  document.querySelectorAll('[data-live="bar"]').forEach(el=>el.style.width=Math.min(100,n/g*100)+'%');}

/* ---------- milestones, shop ---------- */
const MILESTONES=[
 {id:'m3',streak:3,title:'Party hat',text:'A hat for the party you just started.',give:{acc:'partyhat',treats:5}},
 {id:'m5',streak:5,title:'Beach day',text:'A new place to hang out.',give:{scene:'beach',treats:5}},
 {id:'m7',streak:7,title:'New friends',text:'Bunny and Frog can now be adopted.',give:{pets:['bunny','frog'],treats:10}},
 {id:'m10',streak:10,title:'Sunglasses',text:'Too cool.',give:{acc:'sunnies',treats:10}},
 {id:'m14',streak:14,title:'A partner',text:'{name} met someone special on your walks.',give:{partner:true,treats:10}},
 {id:'m21',streak:21,title:'An egg!',text:'Hit your goal 3 more days and it hatches.',give:{egg:true,treats:15}},
 {id:'m30',streak:30,title:'Royalty',text:'A crown, the sakura park, and Panda and Fox.',give:{acc:'crown',scene:'sakura',pets:['panda','fox'],treats:20}},
 {id:'m45',streak:45,title:'Another egg',text:'The family grows.',give:{egg:true,treats:20}},
 {id:'m60',streak:60,title:'Golden collar',text:'City nights and Axolotl join the album.',give:{acc:'collar',scene:'night',pets:['axolotl'],treats:30}},
 {id:'m100',streak:100,title:'Legend',text:'The legendary Capybara and a trip to space.',give:{pets:['capybara'],scene:'space',treats:50}},
];
const SHOP=[
 {k:'acc',id:'bow',price:10},{k:'acc',id:'partyhat',price:12},{k:'acc',id:'cap',price:15},{k:'acc',id:'scarf',price:20},{k:'acc',id:'flowers',price:20},{k:'acc',id:'headphones',price:25},{k:'acc',id:'sunnies',price:30},
 {k:'scene',id:'beach',price:25},{k:'scene',id:'snow',price:30},{k:'scene',id:'sakura',price:40},{k:'scene',id:'night',price:60},
 {k:'pet',id:'bunny',price:50},{k:'pet',id:'frog',price:50},{k:'pet',id:'panda',price:80},{k:'pet',id:'fox',price:80},{k:'pet',id:'axolotl',price:120},
];
const LEVEL_STEP=20000;
const petLevel=life=>1+Math.floor(Math.sqrt(life/LEVEL_STEP));
const levelAt=l=>Math.pow(l-1,2)*LEVEL_STEP;

function newPet(species,name){return{species,name:name||PETS[species].def,born:dkey(new Date()),treats:5,best:0,claimed:[],paid:{},days:{},fed:null,gift:null,acc:null,scene:'meadow',
  owned:{acc:[],scenes:['meadow'],pets:STARTER.slice()},partner:false,eggs:[],babies:0,weekClaim:null,level:1,quests:{}};}
/* Paused days (sick, travelling) neither break a streak nor count as missed. */
const isPaused=d=>((S.pet&&S.pet.pauses)||[]).some(p=>d>=p.from&&d<=p.to);
function streakInfo(){const P=S.pet, t=dkey(new Date()); let s=0, d=hitOn(t)?t:addDays(t,-1), guard=0;
  while(d>=P.born&&guard++<1200){if(isPaused(d)){d=addDays(d,-1); continue;} if(!hitOn(d)) break; s++; d=addDays(d,-1);}
  let missed=0; d=addDays(t,-1); guard=0; const floor=P.back&&P.back>P.born?P.back:P.born;
  while(d>=floor&&guard++<200){if(isPaused(d)){d=addDays(d,-1); continue;} if(hitOn(d)) break; missed++; d=addDays(d,-1);}
  return{streak:s,missed};}
/* Running away: RUN_AT missed days in a row and your pet leaves a note and goes.
   Bring it home by hitting your goal several days in a row (more if it has been gone a while). */
const RUN_AT=5;
const awayNeed=()=>{const A=S.pet.away; if(!A) return 0; const gone=Math.round((new Date(dkey(new Date())+'T12:00')-new Date(A.since+'T12:00'))/864e5); return gone>14?5:3;};
function searchProgress(){const A=S.pet.away, t=dkey(new Date()); let n=0, d=hitOn(t)?t:addDays(t,-1); while(d>=A.since&&hitOn(d)&&n<30){n++; d=addDays(d,-1);} return n;}
function lifetimeSteps(){const P=S.pet, t=dkey(new Date()); let n=stepsOn(t); for(const k in P.days) if(k<t) n+=P.days[k]; return n;}
/* Credit finished days and today's goal once. Returns true if anything was paid (so the caller re-renders). */
function petSettle(){const P=S.pet; if(!P) return false; const t=dkey(new Date()); let changed=false, msgs=[];
  for(let d=P.born; d<=t; d=addDays(d,1)){const n=stepsOn(d); if(d<t&&n) P.days[d]=n;
    if(!P.paid[d]&&n>=stepGoal()){P.paid[d]=1; const bonus=n>=stepGoal()*1.5?2:0; P.treats+=3+bonus; changed=true;
      if(!P.away) P.eggs.forEach(e=>e.hits++); if(d===t) msgs.push(`Goal reached! +${3+bonus} treats`);}}
  for(let i=P.eggs.length-1;i>=0;i--) if(P.eggs[i].hits>=3){P.eggs.splice(i,1); P.babies++; changed=true; msgs.push(`The egg hatched! ${P.name} has ${P.babies} little one${P.babies>1?'s':''}`);}
  const {streak}=streakInfo(); if(streak>P.best){P.best=streak; changed=true;}
  const lv=petLevel(lifetimeSteps()); if(lv>P.level){P.treats+=5*(lv-P.level); msgs.push(`${P.name} reached level ${lv}! +${5*(lv-P.level)} treats`); P.level=lv; changed=true;}
  if(!P.away){const {missed}=streakInfo(); if(missed>=RUN_AT&&!isPaused(t)){P.away={since:t,missed}; P.runs=(P.runs||0)+1; changed=true; UI.petEvent='ran';}}
  else if(searchProgress()>=awayNeed()){const gone=P.away.since; P.away=null; P.back=t; changed=true; UI.petEvent='back'; P.treats+=5;}
  if(UI.petEvent&&!UI.petEventShown){UI.petEventShown=true; setTimeout(()=>{const e=UI.petEvent; UI.petEvent=null; UI.petEventShown=false; if(typeof syncReminders==='function') syncReminders(); if(UI.sheet) return;
    if(e==='ran') sheet(`${esc(P.name)} ran away`,`<div style="max-width:280px;margin:0 auto">${awayScene(P)}</div><div class="petnote">${esc(awayNote(P))}</div><p class="sub" style="text-align:center">${RUN_AT} days without a walk was too much. Hit ${stepGoal().toLocaleString()} steps ${awayNeed()} days in a row to bring ${esc(P.name)} home. Your treats, wardrobe and family are safe.</p>`,`<button type="button" class="btn primary block" data-a="close-render">I'll go find ${esc(P.name)}</button>`);
    else celebrate(`${P.name} came home!`,`You walked ${awayNeed()||3} days in a row and found {name}. +5 treats. Don't let it happen again.`,'happy');},350);}
  const keys=Object.keys(P.paid).sort(); if(keys.length>200) keys.slice(0,keys.length-200).forEach(k=>delete P.paid[k]);
  if(changed) save(); if(msgs.length) toast(msgs.join(' · '));
  return changed;}
function pendingMilestones(){const P=S.pet; return MILESTONES.filter(m=>P.best>=m.streak&&!P.claimed.includes(m.id));}
function nextMilestone(){const P=S.pet; return MILESTONES.find(m=>!P.claimed.includes(m.id)&&P.best<m.streak);}
function petMood(){const P=S.pet, t=dkey(new Date()), p=stepsOn(t)/stepGoal(), {missed}=streakInfo(), h=new Date().getHours();
  const order=['angry','grumpy','sad','worried','content','happy','ecstatic']; let m;
  if(p>=1) m=(h>=22||h<6)?'sleeping':'ecstatic';
  else if(P.away) m='sad'; else if(missed>=3) m='angry'; else if(missed===2) m='grumpy'; else if(missed===1) m='sad';
  else if(h>=22||h<6) m='sleeping'; else if(p>=0.6) m='happy'; else if(p>=0.3) m='content'; else m=h>=16?'worried':'content';
  if(P.fed===t&&m!=='sleeping'&&m!=='ecstatic'){const i=order.indexOf(m); if(i>=0&&i<order.length-2) m=order[i+1];}
  return m;}
const MOOD_LABEL={ecstatic:'Over the moon',happy:'Happy',content:'Content',worried:'Restless',sad:'Sad',grumpy:'Grumpy',angry:'Furious',sleeping:'Asleep'};
function petHearts(){const t=dkey(new Date()); let hits=0; for(let i=1;i<=7;i++) if(hitOn(addDays(t,-i))) hits++; return Math.min(5,Math.round(hits/7*5)+(S.pet.fed===t?1:0));}
function seeded(a){const s=dkey(new Date())+UI.tab; let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))|0; return a[Math.abs(h)%a.length];}
function petLine(mood){const P=S.pet, n=stepsOn(dkey(new Date())), g=stepGoal(), left=Math.max(0,g-n).toLocaleString(), {missed,streak}=streakInfo();
  if(missed>=RUN_AT-1&&n<g) return seeded([`I've packed my bag. One more day like this and I'm gone.`,`See this bag? ${left} steps today or I'm leaving.`]);
  const L={ecstatic:[`We did it! ${streak} day${streak===1?'':'s'} in a row.`,`Best walk ever. Same time tomorrow?`,`${n.toLocaleString()} steps! I'm so proud of us.`],
    happy:[`Only ${left} to go. Almost there!`,`This is fun. Let's finish the ${left}.`],
    content:[`${left} steps to go. A walk after lunch?`,`Good start. ${left} to go.`],
    worried:[`We've barely moved today… ${left} to go.`,`It's getting late. A short walk?`],
    sad:[`We missed yesterday. Can we walk today?`,`I miss our walks. ${left} to go.`],
    grumpy:[`Two days without a walk. Hmph.`,`I'm not talking to you until we walk ${left} steps.`],
    angry:[`${missed} days! I'm fuming. Take me out NOW.`,`${missed} days of nothing. ${left} steps or else.`],
    sleeping:[`Zzz… big day tomorrow.`,`Zzz… dreaming of walks.`]};
  return seeded(L[mood]||L.content);}
const treatIcon=`<svg viewBox="0 0 40 40" class="ti" aria-hidden="true"><path d="M20 7c-6 0-14 15-14 20 0 4 3 6 6 6h16c3 0 6-2 6-6 0-5-8-20-14-20z" fill="#FBF8F0" stroke="#3a302a" stroke-width="2.2" stroke-linejoin="round"/><rect x="12" y="23" width="16" height="10" rx="2" fill="#2f3b34"/><circle cx="17" cy="19" r="1.3" fill="#2b2420"/><circle cx="23" cy="19" r="1.3" fill="#2b2420"/><ellipse cx="13.5" cy="21" rx="2" ry="1.2" fill="#FF8E8E" opacity=".6"/><ellipse cx="26.5" cy="21" rx="2" ry="1.2" fill="#FF8E8E" opacity=".6"/></svg>`;
const heartsHTML=n=>`<span class="hearts" aria-label="${n} of 5 hearts">${[0,1,2,3,4].map(i=>`<svg viewBox="0 0 24 24" class="${i<n?'on':''}"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`).join('')}</span>`;

/* ---------- views ---------- */
function petHeroCard(compact){const P=S.pet, t=dkey(new Date()), n=stepsOn(t), g=stepGoal(); if(P.away) return awayCard(compact); const mood=petMood(), {streak,missed}=streakInfo();
  const scene=petScene({species:P.species,mood,acc:missed>=RUN_AT-1&&n<g?'bindle':P.acc,scene:P.scene,partner:P.partner,eggs:P.eggs.map(e=>e.hits/3),babies:P.babies});
  return`<div class="card pethero ${compact?'compact':''}">${compact?`<button type="button" class="pethide" data-a="pet-hide" aria-label="Hide pet from Today"><svg class="i" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4.2 9.5 6-.5.9-1.5 2.3-3 3.6M6.3 7.6C4.5 8.9 3.2 10.7 2.5 12c1 1.8 4.5 6 9.5 6 1.6 0 3-.4 4.3-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg></button>`:''}<button type="button" class="petstage" data-a="${compact?'tab':'pet-tap'}" data-t="walk" aria-label="${esc(P.name)}">${scene}<span class="bubble">${esc(petLine(mood))}</span></button>
   <div class="card-b"><div class="row between" style="margin-bottom:6px"><div><b class="petname">${esc(P.name)}</b> <span class="tag">${MOOD_LABEL[mood]}</span></div><span class="row" style="gap:10px">${heartsHTML(petHearts())}</span></div>
   <div class="row between small"><span><b class="num" data-live="steps">${n.toLocaleString()}</b> <span class="muted">/ ${g.toLocaleString()} steps</span></span><span class="muted" data-live="togo">${n>=g?'Goal reached':`${(g-n).toLocaleString()} to go`}</span></div>
   <div class="pbar"><i data-live="bar" style="width:${Math.min(100,n/g*100)}%"></i></div>
   <div class="row wrap" style="gap:6px;margin-top:10px"><span class="chip p">${IC.flame} ${streak} day streak</span><span class="chip p">${treatIcon} ${P.treats}</span><span class="chip">Lv ${P.level}</span>${pendingMilestones().length?`<button type="button" class="chip on" data-a="${compact?'tab':'claim'}" data-t="walk">Reward ready</button>`:''}</div></div></div>`;}
function awayNote(P){return seeded([`Gone to find someone who walks. — ${P.name}`,`Don't look for me. (Actually, please do. ${stepGoal().toLocaleString()} steps.) — ${P.name}`,`I needed some fresh air. Lots of it. — ${P.name}`]);}
function awayScene(P){const sp=PETS[P.species]||PETS.duck, prints=[[96,170],[112,164],[128,168],[144,161],[160,165],[176,158],[192,162]].map(([x,y],i)=>`<g transform="translate(${x} ${y}) rotate(${i%2?8:-8})" opacity="${0.35+i*0.08}"><ellipse rx="3.2" ry="2.2" fill="#6b5a48"/><circle cx="-2.6" cy="-3" r="1.1" fill="#6b5a48"/><circle cx="0" cy="-3.8" r="1.1" fill="#6b5a48"/><circle cx="2.6" cy="-3" r="1.1" fill="#6b5a48"/></g>`).join('');
  let s=sceneSVG(P.scene||'meadow')+prints;
  if(P.partner) s+=`<ellipse cx="38" cy="180" rx="26" ry="4" fill="#000" opacity=".08"/><g transform="translate(6 98) scale(.42)">${petBody(P.species,'sad','bow',{})}</g>`;
  for(let i=0;i<(P.babies||0)&&i<4;i++){const x=[148,170,128,182][i]; s+=`<g transform="translate(${x} ${148}) scale(.2)">${petBody(P.species,'sad',null,{})}</g>`;}
  s+=`<g transform="translate(86 150) rotate(-6)"><rect x="0" y="0" width="34" height="24" rx="2" fill="#FFFDF6" stroke="#3a302a" stroke-width="2"/><path d="M6 8h22M6 13h18M6 18h12" stroke="#9a8f80" stroke-width="1.6" stroke-linecap="round"/><path d="M27 17c-1.6-2.4 1.4-4 2.4-1.8c1-2.2 4-.6 2.4 1.8l-2.4 2.4z" fill="${sp.body}" stroke="#3a302a" stroke-width="1"/></g>`;
  s+=`<g transform="translate(52 160)"><ellipse cx="0" cy="8" rx="14" ry="4" fill="#000" opacity=".1"/><path d="M-13 0h26l-3 8h-20z" fill="#E0574B" stroke="#3a302a" stroke-width="2" stroke-linejoin="round"/></g>`;
  return`<svg viewBox="0 0 200 200" class="petsvg" role="img" aria-label="${esc(P.name)} is missing">${s}</svg>`;}
function awayCard(compact){const P=S.pet, t=dkey(new Date()), n=stepsOn(t), g=stepGoal(), need=awayNeed(), got=searchProgress();
  return`<div class="card pethero away ${compact?'compact':''}"><button type="button" class="petstage" data-a="${compact?'tab':'away-note'}" data-t="walk" aria-label="${esc(P.name)} is missing">${awayScene(P)}<span class="bubble">${esc(awayNote(P))}</span></button>
   <div class="card-b"><div class="row between" style="margin-bottom:6px"><div><b class="petname">${esc(P.name)}</b> <span class="tag neg">Ran away</span></div><span class="small muted">gone since ${fmtD(P.away.since+'T12:00',{day:'numeric',month:'short'})}</span></div>
   <div class="small ink2" style="margin-bottom:8px">Hit your goal ${need} days in a row to bring ${esc(P.name)} home.</div>
   <div class="searchdots">${[...Array(need)].map((_,i)=>`<i class="${i<got?'on':''}">${i<got?IC.check:i+1}</i>`).join('')}</div>
   <div class="row between small" style="margin-top:10px"><span><b class="num" data-live="steps">${n.toLocaleString()}</b> <span class="muted">/ ${g.toLocaleString()} today</span></span><span class="muted" data-live="togo">${n>=g?'Goal reached':`${(g-n).toLocaleString()} to go`}</span></div>
   <div class="pbar"><i data-live="bar" style="width:${Math.min(100,n/g*100)}%"></i></div></div></div>`;}
function pauseCard(){const P=S.pet, t=dkey(new Date()), cur=(P.pauses||[]).find(p=>t>=p.from&&t<=p.to);
  if(cur) return`<div class="card"><div class="card-b row" style="gap:10px;padding-top:12px"><div style="width:46px;flex:none">${petAvatar(P.species,'sleeping')}</div><div class="grow small ink2"><b>Paused until ${fmtD(cur.to+'T12:00',{weekday:'short',day:'numeric',month:'short'})}</b><div>Missed days don't count while you rest.</div></div><button type="button" class="btn sm" data-a="pause-end">Resume</button></div></div>`;
  return '';}
function stepPermCard(){const av=k=>`<div style="width:64px;flex:none">${petAvatar(S.pet.species,k)}</div>`, card=(m,body,btn)=>`<div class="card"><div class="card-b" style="padding-top:12px"><div class="row" style="gap:12px">${av(m)}<div class="grow">${body}</div></div>${btn||''}</div></div>`;
  if(N&&!hasStepSensor()){let v=''; try{v=JSON.parse(N.info()).appVersion||'';}catch(e){}
    return card('worried',`<b>Update the app to count steps</b><div class="small ink2">You have Kintore ${esc(v)}. Step counting needs app 1.0.2 or newer. Your data stays as it is.</div>`,`<button type="button" class="btn primary block" style="margin-top:10px" data-a="steps-update">Update app</button>`);}
  if(N&&STEPS.hw===false&&STEPS.perm!=='unknown') return card('sad',`<b>No step counter found</b><div class="small ink2">Android didn't report a step sensor on this phone. Add steps with <b>+ Steps</b>.</div>`);
  if(N&&!STEPS.avail&&STEPS.perm==='denied') return card('worried',`<b>Step permission is off</b><div class="small ink2">Tap below, then <b>Permissions › Physical activity › Allow</b>. Come back and ${esc(S.pet.name)} starts counting.</div>`,`<button type="button" class="btn primary block" style="margin-top:10px" data-a="steps-perm">Open Kintore settings</button>`);
  if(!hasStepSensor()){const ios=typeof IOS!=='undefined'&&IOS;
   if(ios&&S.profile.stepShortcut) return `<div class="card"><div class="card-b row" style="gap:10px;padding-top:12px"><div style="width:46px;flex:none">${petAvatar(S.pet.species,'happy')}</div><div class="grow small ink2">Steps come from your <b>Kintore steps</b> Shortcut.</div><button type="button" class="btn sm primary" data-a="paste-steps">Paste steps</button><button type="button" class="iconbtn sm" data-a="steps-shortcut" aria-label="How it works">?</button></div></div>`;
   return `<div class="card"><div class="card-b" style="padding-top:12px"><div class="row" style="gap:12px"><div style="width:64px;flex:none">${petAvatar(S.pet.species,'worried')}</div><div class="grow"><b>${ios?'Bring in steps from Apple Health':'Add your steps'}</b><div class="small ink2">${ios?`A one-tap Shortcut copies today's steps and ${esc(S.pet.name)} picks them up.`:"This web version can't read your phone's step counter. Add steps with <b>+ Steps</b>, or use the Android app."}</div></div></div>${ios?`<button type="button" class="btn primary block" style="margin-top:10px" data-a="steps-shortcut">Set up in 1 minute</button>`:''}</div></div>`;}
  if(STEPS.avail) return '';
  return `<div class="card"><div class="card-b" style="padding-top:12px"><div class="row" style="gap:12px"><div style="width:64px;flex:none">${petAvatar(S.pet.species,'worried')}</div><div class="grow"><b>Let ${esc(S.pet.name)} count your steps</b><div class="small ink2">Kintore uses the Fold's built-in step counter. Steps stay on your phone.</div></div></div><button type="button" class="btn primary block" style="margin-top:10px" data-a="steps-perm">Allow step counting</button></div></div>`;}
function weekStepsCard(){const t=dkey(new Date()), d=new Date(t+'T12:00'), mon=addDays(t,-((d.getDay()+6)%7)), g=stepGoal();
  const days=[...Array(7)].map((_,i)=>{const k=addDays(mon,i); return{k,n:stepsOn(k)};}), mx=Math.max(g*1.3,...days.map(x=>x.n)), tot=days.reduce((a,x)=>a+x.n,0), wgoal=g*6, P=S.pet, claimed=P.weekClaim===mon;
  return`<div class="card"><div class="card-h"><span>This week</span><span class="num">${tot.toLocaleString()} steps</span></div><div class="card-b">
   <div class="wbars">${days.map((x,i)=>`<div class="wb ${x.k===t?'today':''} ${x.n>=g?'hit':''}"><div class="col"><i style="height:${Math.max(3,x.n/mx*100)}%"></i><span class="gl" style="bottom:${g/mx*100}%"></span></div><span class="lbl">${'MTWTFSS'[i]}</span>${x.n>=g?'<svg viewBox="0 0 24 24" class="paw"><circle cx="7" cy="9" r="2.2"/><circle cx="12" cy="6.5" r="2.2"/><circle cx="17" cy="9" r="2.2"/><path d="M12 11c-3 0-6 3-6 6 0 2 2 3 3.5 2.4 1.5-.6 3.5-.6 5 0 1.5.6 3.5-.4 3.5-2.4 0-3-3-6-6-6z"/></svg>':'<span class="paw"></span>'}</div>`).join('')}</div>
   <div class="row between small" style="margin-top:12px"><span><b>Weekly challenge</b> <span class="muted">· ${wgoal.toLocaleString()} steps</span></span><span class="num">${Math.min(100,Math.round(tot/wgoal*100))}%</span></div>
   <div class="pbar"><i style="width:${Math.min(100,tot/wgoal*100)}%"></i></div>
   ${tot>=wgoal&&!claimed?`<button type="button" class="btn primary block" style="margin-top:10px" data-a="week-claim">Claim 10 treats</button>`:`<div class="tiny muted" style="margin-top:6px">${claimed?'Claimed this week.':'Reward: 10 treats.'}</div>`}</div></div>`;}
function milestoneCard(){const P=S.pet, pend=pendingMilestones(), nx=nextMilestone(), {streak}=streakInfo();
  let o=`<div class="card"><div class="card-h"><span>Streak rewards</span><span>best ${P.best}</span></div><div class="card-b">`;
  pend.forEach(m=>{o+=`<div class="lrow"><span class="medal gold">${IC.star}</span><div class="t"><b>${esc(m.title)}</b><span>${m.streak}-day streak reached</span></div><button type="button" class="btn sm primary" data-a="claim" data-id="${m.id}">Claim</button></div>`;});
  if(nx){const need=nx.streak-streak; o+=`<div class="lrow"><span class="medal">${IC.lock}</span><div class="t"><b>${esc(nx.title)}</b><span>${need>0?`${need} more goal day${need>1?'s':''} in a row`:'Keep the streak going'} · ${nx.streak}-day streak</span></div></div><div class="pbar"><i style="width:${Math.min(100,streak/nx.streak*100)}%"></i></div>`;}
  else if(!pend.length) o+=`<div class="small ink2">Every streak reward collected. Legend status.</div>`;
  const fam=[]; if(P.partner) fam.push('a partner'); if(P.eggs.length) fam.push(`${P.eggs.length} egg${P.eggs.length>1?'s':''} (${P.eggs.map(e=>`${e.hits}/3`).join(', ')} goal days to hatch)`); if(P.babies) fam.push(`${P.babies} little one${P.babies>1?'s':''}`);
  if(fam.length) o+=`<div class="small ink2" style="margin-top:10px">Family: ${fam.join(' · ')}</div>`;
  return o+`</div></div>`;}
function vWalk(){
  if(!S.pet) return adoptView();
  petSettle(); const P=S.pet;
  let o=`<div class="split"><div class="col"><h2 class="hello">${esc(P.name)} the ${PETS[P.species].name.toLowerCase()}</h2><p class="sub">Walk ${stepGoal().toLocaleString()} steps a day to keep ${esc(P.name)} happy. Tap ${esc(P.name)} for a daily surprise.</p>`;
  o+=petHeroCard(false)+pauseCard()+stepPermCard();
  o+=`<div class="row wrap" style="gap:8px;margin-bottom:12px">${P.away?'':`<button type="button" class="btn sm ghost" data-a="pause-open">Pause</button>`}<button type="button" class="btn sm" data-a="feed" ${P.away||P.fed===dkey(new Date())||P.treats<2?'disabled':''}>${treatIcon} Feed · 2</button><button type="button" class="btn sm" data-a="shop">Shop</button><button type="button" class="btn sm" data-a="wardrobe">Wardrobe</button><button type="button" class="btn sm" data-a="album">Album</button><button type="button" class="btn sm ghost" data-a="add-steps">+ Steps</button></div>`;
  o+=`</div><div class="col">`+weekStepsCard()+milestoneCard();
  o+=`<div class="card"><div class="card-h"><span>Level ${P.level}</span><span class="num">${lifetimeSteps().toLocaleString()} steps together</span></div><div class="card-b"><div class="pbar"><i style="width:${Math.max(0,Math.min(100,(lifetimeSteps()-levelAt(P.level))/(levelAt(P.level+1)-levelAt(P.level))*100))}%"></i></div><div class="tiny muted" style="margin-top:6px">${(levelAt(P.level+1)-lifetimeSteps()).toLocaleString()} steps to level ${P.level+1} · +5 treats each level</div></div></div>`;
  return o+`</div></div>`;}
function adoptView(){UI.adopt=UI.adopt||'duck';
  return`<h2 class="hello">Adopt a walking buddy</h2><p class="sub">They live on your steps. ${stepGoal().toLocaleString()} a day keeps them happy; skip days and they sulk. Streaks unlock rewards, new friends and a family.</p>
   <div class="adopt">${STARTER.map(k=>`<button type="button" class="adoptc ${UI.adopt===k?'on':''}" data-a="adopt-pick" data-k="${k}">${petAvatar(k,UI.adopt===k?'ecstatic':'happy')}<b>${PETS[k].name}</b></button>`).join('')}</div>
   <div class="card"><div class="card-b" style="padding-top:12px"><div class="field"><label for="pet-name">Name</label><input class="input" id="pet-name" value="${esc(PETS[UI.adopt].def)}" maxlength="16"></div><button type="button" class="btn primary block" data-a="adopt">Adopt ${PETS[UI.adopt].name}</button></div></div>`;}

/* ---------- sheets ---------- */
function celebrate(title,text,mood){const P=S.pet; sheet('Reward',`<div class="celebrate"><div style="max-width:260px;margin:0 auto">${petScene({species:P.species,mood:mood||'ecstatic',acc:P.acc,scene:P.scene,partner:P.partner,eggs:P.eggs.map(e=>e.hits/3),babies:P.babies})}</div><h2 class="hello" style="text-align:center">${esc(title)}</h2><p class="sub" style="text-align:center">${esc(text.replace('{name}',P.name))}</p></div>`,`<button type="button" class="btn primary block" data-a="close-render">Yay</button>`);}
function shopSheet(){const P=S.pet, has=it=>it.k==='acc'?P.owned.acc.includes(it.id):it.k==='scene'?P.owned.scenes.includes(it.id):P.owned.pets.includes(it.id);
  const thumb=it=>it.k==='acc'?petAvatar(P.species,'happy',it.id):it.k==='scene'?`<svg viewBox="0 0 200 200" class="petsvg">${sceneSVG(it.id)}</svg>`:petAvatar(it.id,'happy');
  const name=it=>it.k==='acc'?ACCS[it.id]:it.k==='scene'?SCENES[it.id]:PETS[it.id].name;
  sheet('Shop',`<div class="row between" style="margin-bottom:10px"><span class="small ink2">Spend treats from walking and daily quests.</span><span class="chip p">${treatIcon} ${P.treats}</span></div>
   ${['acc','scene','pet'].map(k=>`<div class="lbl" style="margin:8px 0 6px">${{acc:'Accessories',scene:'Places',pet:'Friends to adopt'}[k]}</div><div class="shopgrid">${SHOP.filter(i=>i.k===k).map(it=>`<div class="shopc"><div class="th">${thumb(it)}</div><b>${name(it)}</b>${has(it)?'<span class="tag home">owned</span>':`<button type="button" class="btn sm ${P.treats>=it.price?'primary':''}" data-a="buy" data-k="${it.k}" data-id="${it.id}" ${P.treats>=it.price?'':'disabled'}>${treatIcon}${it.price}</button>`}</div>`).join('')}</div>`).join('')}`);}
function wardrobeSheet(){const P=S.pet;
  sheet('Wardrobe',`<div style="max-width:240px;margin:0 auto 10px">${petScene({species:P.species,mood:'happy',acc:P.acc,scene:P.scene,partner:P.partner,eggs:P.eggs.map(e=>e.hits/3),babies:P.babies})}</div>
   <div class="field"><label for="pet-rename">Name</label><input class="input" id="pet-rename" value="${esc(P.name)}" maxlength="16"></div>
   <div class="lbl" style="margin-bottom:6px">Friend</div><div class="chips">${P.owned.pets.map(k=>`<button type="button" class="chip ${P.species===k?'on':''}" data-a="wear" data-k="species" data-id="${k}">${PETS[k].name}</button>`).join('')}</div>
   <div class="lbl" style="margin:6px 0">Accessory</div><div class="chips"><button type="button" class="chip ${!P.acc?'on':''}" data-a="wear" data-k="acc" data-id="">None</button>${P.owned.acc.map(a=>`<button type="button" class="chip ${P.acc===a?'on':''}" data-a="wear" data-k="acc" data-id="${a}">${ACCS[a]}</button>`).join('')}</div>
   <div class="lbl" style="margin:6px 0">Place</div><div class="chips">${P.owned.scenes.map(s=>`<button type="button" class="chip ${P.scene===s?'on':''}" data-a="wear" data-k="scene" data-id="${s}">${SCENES[s]}</button>`).join('')}</div>`,`<button type="button" class="btn primary block" data-a="close-render">Done</button>`);}
function albumSheet(){const P=S.pet, req=k=>{if(STARTER.includes(k)) return 'Starter'; const m=MILESTONES.find(x=>(x.give.pets||[]).includes(k)); const s=SHOP.find(x=>x.k==='pet'&&x.id===k); return [m?`${m.streak}-day streak`:'',s?`or ${s.price} treats`:''].filter(Boolean).join(' ');};
  sheet('Album',`<div class="lbl" style="margin-bottom:6px">Friends · ${P.owned.pets.length}/${Object.keys(PETS).length}</div><div class="shopgrid">${Object.keys(PETS).map(k=>{const own=P.owned.pets.includes(k); return`<div class="shopc ${own?'':'locked'}"><div class="th">${petAvatar(k,own?'happy':'sleeping')}</div><b>${own?PETS[k].name:'???'}</b><span class="tiny muted">${own?'Unlocked':req(k)}</span></div>`;}).join('')}</div>
   <div class="lbl" style="margin:12px 0 6px">Streak rewards</div>${MILESTONES.map(m=>`<div class="lrow"><span class="medal ${P.claimed.includes(m.id)?'gold':''}">${P.claimed.includes(m.id)?IC.star:IC.lock}</span><div class="t"><b>${esc(m.title)}</b><span>${m.streak} days · ${esc(m.text.replace('{name}',P.name))}</span></div></div>`).join('')}`);}
function stepsSheet(){const t=dkey(new Date());
  sheet('Add steps',`<p class="note" style="margin-top:0">For walks without your phone, or a treadmill. Added on top of what the phone counted.</p><div class="g2"><div class="field"><label for="st-d">Day</label><input class="input" id="st-d" type="date" value="${t}"></div><div class="field"><label for="st-n">Steps</label><input class="input" id="st-n" inputmode="numeric" placeholder="e.g. 2500"></div></div>
   <div class="chips">${[1000,2500,5000].map(n=>`<button type="button" class="chip" data-a="steps-quick" data-n="${n}">+${n.toLocaleString()}</button>`).join('')}</div>`,`<button type="button" class="btn primary block" data-a="steps-save">Add</button>`);}

/* ---------- actions ---------- */
Object.assign(A,{
 'adopt-pick':b=>{UI.adopt=b.dataset.k; render();},
 adopt:()=>{const k=UI.adopt||'duck', n=($('#pet-name').value||PETS[k].def).trim().slice(0,16); S.pet=newPet(k,n); save(); syncReminders(); render(); celebrate(`Meet ${n}!`,`${n} is ready for walks. Hit ${stepGoal().toLocaleString()} steps a day to keep them happy.`,'ecstatic'); askStepPermission();},
 'pet-tap':()=>{const P=S.pet, t=dkey(new Date()); if(P.away) return; if(P.gift!==t){P.gift=t; const n=1+Math.floor(Math.random()*3); P.treats+=n; save(); toast(seeded([`${P.name} found ${n} treat${n>1?'s':''} on the path!`,`${P.name} gave you ${n} treat${n>1?'s':''}. Cute.`,`Surprise! ${n} treat${n>1?'s':''} from ${P.name}.`])); if(N) try{N.haptic('confirm')}catch(e){} render();}
   else toast(seeded([`${P.name} wiggles happily.`,`${P.name} wants another walk.`,`Come back tomorrow for another surprise.`]));},
 'away-note':()=>{const P=S.pet; sheet('A note',`<div class="petnote big">${esc(awayNote(P))}</div><p class="sub" style="text-align:center">Search progress: ${searchProgress()} of ${awayNeed()} goal days in a row.</p>`);},
 'pause-open':()=>{sheet('Pause walks',`<p class="note" style="margin-top:0">Sick, injured or travelling? While paused, missed days don't count, so ${esc(S.pet.name)} won't sulk or run away. Your streak is kept but doesn't grow.</p>
   <div class="chips">${[1,2,3,5,7].map(n=>`<button type="button" class="chip" data-a="pause-set" data-n="${n}">${n} day${n>1?'s':''}</button>`).join('')}</div><p class="tiny muted">Up to 7 days, and up to 14 paused days in any 60.</p>`);},
 'pause-set':b=>{const P=S.pet, t=dkey(new Date()), n=+b.dataset.n, used=(P.pauses||[]).filter(p=>p.to>=addDays(t,-60)).reduce((a,p)=>a+Math.round((new Date(p.to)-new Date(p.from))/864e5)+1,0);
   if(used+n>14){toast(`Only ${Math.max(0,14-used)} pause days left this period`); return;} (P.pauses=P.pauses||[]).push({from:t,to:addDays(t,n-1)}); save(); closeSheet(); render(); toast(`Paused for ${n} day${n>1?'s':''}. Get well soon.`);},
 'pause-end':()=>{const P=S.pet, t=dkey(new Date()); (P.pauses||[]).forEach(p=>{if(t>=p.from&&t<=p.to) p.to=addDays(t,-1);}); P.pauses=(P.pauses||[]).filter(p=>p.to>=p.from); save(); render();},
 feed:()=>{const P=S.pet, t=dkey(new Date()); if(P.fed===t||P.treats<2) return; P.treats-=2; P.fed=t; save(); render(); toast(`${P.name} loved that. Mood up for today.`);},
 claim:b=>{const P=S.pet, m=b.dataset.id?MILESTONES.find(x=>x.id===b.dataset.id):pendingMilestones()[0]; if(!m) return go('walk');
   const g=m.give; P.claimed.push(m.id); P.treats+=g.treats||0; if(g.acc&&!P.owned.acc.includes(g.acc)){P.owned.acc.push(g.acc); P.acc=g.acc;} if(g.scene&&!P.owned.scenes.includes(g.scene)) P.owned.scenes.push(g.scene);
   (g.pets||[]).forEach(k=>{if(!P.owned.pets.includes(k)) P.owned.pets.push(k);}); if(g.partner) P.partner=true; if(g.egg) P.eggs.push({hits:0});
   save(); if(UI.tab!=='walk'){UI.tab='walk';} render(); celebrate(m.title,`${m.text}${g.treats?` Plus ${g.treats} treats.`:''}`);},
 'week-claim':()=>{const t=dkey(new Date()), d=new Date(t+'T12:00'), mon=addDays(t,-((d.getDay()+6)%7)); S.pet.weekClaim=mon; S.pet.treats+=10; save(); render(); toast('Weekly challenge done! +10 treats');},
 shop:()=>shopSheet(), wardrobe:()=>wardrobeSheet(), album:()=>albumSheet(), 'add-steps':()=>stepsSheet(),
 buy:b=>{const P=S.pet, it=SHOP.find(x=>x.k===b.dataset.k&&x.id===b.dataset.id); if(!it||P.treats<it.price) return; P.treats-=it.price;
   if(it.k==='acc'){P.owned.acc.push(it.id); P.acc=it.id;} if(it.k==='scene'){P.owned.scenes.push(it.id); P.scene=it.id;} if(it.k==='pet') P.owned.pets.push(it.id);
   save(); shopSheet(); toast(it.k==='pet'?`${PETS[it.id].name} joined the album. Switch in Wardrobe.`:'Bought and equipped');},
 wear:b=>{const P=S.pet, k=b.dataset.k, v=b.dataset.id; const nm=$('#pet-rename'); if(nm&&nm.value.trim()) P.name=nm.value.trim().slice(0,16); if(k==='species') P.species=v; if(k==='acc') P.acc=v||null; if(k==='scene') P.scene=v; save(); wardrobeSheet();},
 'steps-quick':b=>{$('#st-n').value=b.dataset.n;},
 'steps-save':()=>{const d=$('#st-d').value, n=parseInt($('#st-n').value,10); if(!d||!(n>0&&n<100000)){toast('Enter a number of steps'); return;} S.stepsAdd[d]=(S.stepsAdd[d]||0)+n; save(); closeSheet(); petSettle(); render(); toast(`+${n.toLocaleString()} steps added`);},
 'steps-update':async()=>{toast('Checking for the app update…'); await checkUpdates(true); if(UI.apk) installApk(); else toast('No app update found. Check you are online, or download it from eswah0160.github.io/kintore');},
 'steps-perm':()=>askStepPermission(true),
});
document.addEventListener('change',e=>{if(e.target.id==='pet-rename'&&S.pet){const v=e.target.value.trim(); if(v){S.pet.name=v.slice(0,16); save();}}});
function askStepPermission(force){if(!hasStepSensor()) return; if(STEPS.avail&&!force) return; nat('requestStepsPermission').then(r=>{refreshSteps(); if(r&&r.granted){petSettle(); render(); toast('Step counting is on');} else if(force) toast('Step counting is off. You can allow it in Android settings.');});}
