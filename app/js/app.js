"use strict";
/* ================= App ================= */
const KEY='kintore-v2', DAY=864e5;
const N=window.KintoreNative||null;
const CB={}; window.__kCb=(id,json)=>{const f=CB[id]; delete CB[id]; if(f){let o; try{o=JSON.parse(json)}catch(e){o={error:'Bad reply'}} f(o);}};
const nat=(m,...a)=>new Promise(res=>{const id='c'+Math.random().toString(36).slice(2); CB[id]=res; try{N[m](id,...a);}catch(e){delete CB[id]; res({error:String(e)});}});
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10);
const dkey=d=>{d=new Date(d);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const addDays=(k,n)=>{const d=new Date(k+'T12:00:00');d.setDate(d.getDate()+n);return dkey(d);};
const r1=n=>Math.round(n*10)/10, kg=n=>Math.round(n*100)/100;
const fmtD=(d,o)=>new Date(d).toLocaleDateString('en-AU',o||{weekday:'short',day:'numeric',month:'short'});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const litres=ml=>{const v=ml/1000; return (Math.round(v*100)/100).toString();};

const GOALS={strength:{label:'Strength',sets:'4–5',lo:3,hi:6,rest:180},hypertrophy:{label:'Growth',sets:'3–4',lo:8,hi:12,rest:90},endurance:{label:'Endurance',sets:'2–3',lo:15,hi:20,rest:45}};
const ACT={sedentary:['Mostly sitting',1.2],light:['Light, 1–3/wk',1.375],moderate:['Moderate, 3–5/wk',1.55],very:['Very active, 6–7/wk',1.725]};
const DIET={cut:{label:'Cut',sub:'Lose about 0.5 kg a week',kcal:-500,pro:2.2},slowcut:{label:'Slow cut',sub:'Lose about 0.25 kg a week, keep strength',kcal:-250,pro:2.2},
 recomp:{label:'Recomp',sub:'Build muscle while keeping your weight',kcal:0,pro:2.2},maintain:{label:'Maintain',sub:'Hold your weight',kcal:0,pro:1.8},
 leangain:{label:'Lean bulk',sub:'Gain about 0.25 kg a week, mostly muscle',kcal:250,pro:1.8},bulk:{label:'Bulk',sub:'Gain about 0.5 kg a week',kcal:450,pro:1.8}};
const DIET_OLD={lose:'cut',gain:'leangain'};
const MEALS=[['breakfast','Breakfast'],['lunch','Lunch'],['dinner','Dinner'],['snacks','Snacks']];
const THEMES=[['system','System'],['light','Light'],['dark','Dark'],['yuya','Yuya'],['yuya-night','Yuya night']];
const PLATES=[25,20,15,10,5,2.5,1.25];
const EQ_GYM=['barbell','dumbbell','cable','machine','body'], EQ_HOME=['body','furniture','dumbbell'];

/* ================= State ================= */
let S, EXI={};
function blank(){return{v:3,profile:{sex:'m',age:28,height:178,weight:75,activity:'moderate',diet:'maintain',train:'hypertrophy',burn:true,bar:20,waterL:2.5,theme:'system',place:'gym',stepGoal:10000,walkNudge:'19:00',petHome:true},
  workouts:[],active:null,food:{},myFoods:[],meals:[],water:{},weights:[],routines:[],notes:{},customEx:[],sample:false,steps:{},stepsAdd:{},pet:null,plan:null,quests:{},bodyfat:[]};}
function rebuildEXI(){EXI=Object.fromEntries(EX.concat(S.customEx||[]).map(e=>[e.id,e]));}
const findF=n=>FOODS.find(x=>x.name===n);
function makeSample(){
  const s=blank(); s.sample=true; const now=new Date(), today=dkey(now);
  const R3=[['Push',['bench','ohp','dips','lateral','pushdown']],['Pull',['pullup','row','curl','shrug']],['Legs',['squat','rdl','lunge','calf','crunch']]];
  s.routines=R3.map(([name,ex])=>({id:'r_'+name.toLowerCase(),name,exercises:ex,sample:true}));
  s.routines.push({id:'r_home',name:'Home full body',exercises:['bwsquat','pushup','invrow','bulgarian','pike','glutebridge','plank'],sample:true});
  const base={bench:[60,2.5,[8,8,7]],ohp:[37.5,2.5,[8,7,7]],dips:[0,0,[10,9,8]],lateral:[8,1,[12,12,11]],pushdown:[25,2.5,[12,11,10]],pullup:[0,0,[7,6,6]],row:[55,2.5,[10,9,8]],curl:[12,1,[11,10,10]],shrug:[24,2,[12,12,12]],squat:[80,2.5,[8,8,7]],rdl:[70,2.5,[10,9,9]],lunge:[16,2,[10,10,9]],calf:[20,2,[15,14,13]],crunch:[0,0,[15,15,12]]};
  const mon0=addDays(today,-((now.getDay()+6)%7)-21), plan={1:'r_push',2:'r_pull',3:'r_legs',4:'r_push',5:'r_pull',6:'r_legs'}, sched=[];
  for(let k=mon0;k<today;k=addDays(k,1)){const wd=new Date(k+'T12:00').getDay(); if(plan[wd]&&k!==addDays(mon0,10)&&k!==addDays(mon0,17)) sched.push([k,plan[wd]]);}
  s.plan={tpl:'ppl',name:'Push Pull Legs',start:mon0,weeks:8,days:plan,remind:'18:00'};
  sched.forEach(([k,rid],i)=>{const rt=s.routines.find(r=>r.id===rid), cyc=Math.floor(i/6), st=new Date(k+'T18:05');
    s.workouts.push({id:uid(),name:rt.name,routineId:rt.id,start:st.toISOString(),end:new Date(st.getTime()+(52+(i*7)%18)*60000).toISOString(),sample:true,
      exercises:rt.exercises.map(id=>{const[w,inc,reps]=base[id];return{exId:id,sets:reps.map((r,k)=>({w:w+inc*cyc,r:r+(cyc>1&&k===0?1:0),done:true,pr:cyc>0&&k===0&&w>0}))};})});});
  const mk=list=>list.map(([meal,n,qty])=>({id:uid(),meal,qty,...findF(n)}));
  s.food[today]=mk([['breakfast','Rolled oats',2],['breakfast','Banana',1],['breakfast','Full cream milk',1],['lunch','Chicken burrito bowl',1],['snacks','Flat white, full cream',1]]);
  for(let ago=1;ago<14;ago++){const k=addDays(today,-ago);
    s.food[k]=mk([['breakfast',ago%3?'Rolled oats':'Smashed avo on toast',ago%3?2:1],['breakfast','Banana',1],['lunch',ago%2?'Chicken burrito bowl':'Chicken sushi roll',ago%2?1:2],['dinner',ago%3?'Chicken breast, cooked':'Salmon fillet',1],['dinner','White rice, cooked',ago%2?1.5:1],['dinner','Broccoli',1],['snacks','Greek yoghurt, plain low-fat',1],['snacks',ago===2?'Meat pie':'Almonds',1]]);
    s.water[k]=1500+(ago%4)*250;}
  s.water[today]=750;
  for(let ago=20;ago>=0;ago-=2) s.weights.push({d:addDays(today,-ago),kg:r1(76.4-(20-ago)*0.06+((ago*7)%5-2)*0.12)});
  s.profile.weight=s.weights[s.weights.length-1].kg;
  s.bodyfat=[{d:addDays(today,-28),pct:18.9,method:'navy',neck:38,waist:85},{d:addDays(today,-2),pct:17.6,method:'navy',neck:38.5,waist:83.5}]; s.profile.diet='recomp';
  const born=addDays(today,-30); let life=0;
  for(let ago=30;ago>=1;ago--){const k=addDays(today,-ago), n=ago<=16?10200+((ago*3137)%4300):(ago%3?6200+((ago*911)%3000):11000+ago*40); s.steps[k]=n; life+=n;}
  s.steps[today]=6420; life+=6420;
  const paid={}; Object.keys(s.steps).forEach(k=>{if(s.steps[k]>=10000) paid[k]=1;});
  s.pet={species:'duck',name:'Mochi',born,treats:64,best:16,claimed:['m3','m5','m7','m10','m14'],paid,days:{},fed:null,gift:null,acc:null,scene:'meadow',
    owned:{acc:['partyhat','sunnies'],scenes:['meadow','beach'],pets:['duck','shiba','cat','penguin','bunny','frog']},partner:true,eggs:[],babies:0,weekClaim:null,level:1+Math.floor(Math.sqrt(life/20000)),quests:{},sample:true};
  s.meals=[{id:uid(),name:'Usual breakfast',items:mk([['breakfast','Rolled oats',2],['breakfast','Banana',1],['breakfast','Full cream milk',1]]).map(({id,meal,...x})=>x)}];
  return s;
}
function migrate(o){const b=blank(); const s=Object.assign(b,o,{profile:Object.assign(b.profile,o.profile)});
  if(!o.v||o.v<3){ if(o.profile&&o.profile.water&&!o.profile.waterL) s.profile.waterL=r1(o.profile.water*0.25)||2.5; for(const k in s.water) if(s.water[k]<=30) s.water[k]=s.water[k]*250; s.v=3;}
  if(s.pet&&s.pet.sample&&s.pet.acc==='partyhat') s.pet.acc=null;
  if(DIET_OLD[s.profile.diet]) s.profile.diet=DIET_OLD[s.profile.diet]; if(!DIET[s.profile.diet]) s.profile.diet='maintain';
  for(const k in s.food) s.food[k].forEach(x=>{if(!x.ic) x.ic=(findF(x.name)||{}).ic||guessIcon(x.name);}); s.myFoods.forEach(f=>{if(!f.ic) f.ic=guessIcon(f.name);});
  return s;}
function load(){let raw='', ls=null; try{ls=localStorage.getItem(KEY)}catch(e){}
  try{if(N) raw=N.loadState()||'';}catch(e){} if(!raw&&ls) raw=ls;
  try{if(raw){const o=JSON.parse(raw); if(o&&o.profile) return migrate(o);}}catch(e){} return makeSample();}
let saveT=null;
function save(){const s=JSON.stringify(S); try{localStorage.setItem(KEY,s)}catch(e){} if(N){clearTimeout(saveT); saveT=setTimeout(flush,400);}}
function flush(){clearTimeout(saveT); saveT=null; if(N) try{N.saveState(JSON.stringify(S));}catch(e){}}
let undoSnap=null; const snap=()=>{undoSnap=JSON.stringify(S);};
S=load(); rebuildEXI();
const UI={tab:'today',sel:new Set(),eq:'all',kind:'all',foodDate:dkey(new Date()),progEx:null,statSeg:'strength',rest:null,mealFor:'breakfast',sheet:null,fcat:'all',fq:'',added:{}};
UI.trainSeg='plan'; UI.cal=null;
try{const t=localStorage.getItem(KEY+'-tab'); if(t==='body'){UI.tab='train'; UI.trainSeg='muscles';} else if(['today','train','walk','food','stats','me'].includes(t)) UI.tab=t;}catch(e){}
function applyTheme(){const t=S.profile.theme; if(t==='system') document.documentElement.removeAttribute('data-kt'); else document.documentElement.setAttribute('data-kt',t);
  if(N) requestAnimationFrame(()=>{const bg=getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()||'#E7E7E4', h=bg.replace('#',''), n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16);
    const lum=((n>>16)&255)*0.299+((n>>8)&255)*0.587+(n&255)*0.114; try{N.setSystemBars(bg,lum>140);}catch(e){}}); else if(window.webThemeColor) requestAnimationFrame(webThemeColor);}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme());}catch(e){}
applyTheme();

/* ================= Calculations ================= */
const eqOf=ex=>ex.eq||'body';
const isHome=ex=>!!ex.home||(ex.custom&&['body','furniture','dumbbell'].includes(ex.eq));
const kindOf=ex=>ex.iso?'Isolation':'Compound';
function latestWeight(){const w=S.weights.slice().sort((a,b)=>a.d.localeCompare(b.d)); return w.length?w[w.length-1].kg:S.profile.weight;}
function avgWeight(days=7,endK=dkey(new Date())){const from=addDays(endK,-days+1), xs=S.weights.filter(w=>w.d>=from&&w.d<=endK).map(w=>w.kg); return xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;}
/* Body fat: the latest entry from the last 90 days, if any. */
function bodyFat(){const xs=(S.bodyfat||[]).slice().sort((a,b)=>a.d.localeCompare(b.d)), l=xs[xs.length-1]; return l&&l.d>=addDays(dkey(new Date()),-90)?l:null;}
/* BMR: Katch–McArdle from lean mass when body fat is known, otherwise Mifflin–St Jeor. Protein per kg bodyweight by goal,
   switching to lean mass when body fat is high so the number isn't inflated. */
function targets(){const p=S.profile, w=latestWeight(), bf=bodyFat(), lbm=bf?w*(1-bf.pct/100):null, g=DIET[p.diet]||DIET.maintain;
  const bmr=lbm?370+21.6*lbm:10*w+6.25*p.height-5*p.age+(p.sex==='m'?5:-161), tdee=bmr*ACT[p.activity][1], kcal=Math.round((tdee+g.kcal)/10)*10;
  const highBF=bf&&bf.pct>(p.sex==='m'?25:32), prot=Math.round(highBF?2.6*lbm:g.pro*w), fat=Math.round(kcal*0.25/9), carb=Math.max(0,Math.round((kcal-prot*4-fat*9)/4));
  return{bmr:Math.round(bmr),tdee:Math.round(tdee),kcal,prot,fat,carb,bmrFrom:lbm?'lean mass (Katch–McArdle)':'height, weight and age (Mifflin–St Jeor)',protFrom:highBF?'2.6 g per kg lean mass':`${g.pro} g per kg bodyweight`};}
const e1rm=(w,r)=>w*(1+r/30);
const doneSets=e=>e.sets.filter(s=>s.done&&s.r>0), workSets=e=>doneSets(e).filter(s=>!s.warm);
const sortedW=()=>S.workouts.slice().sort((a,b)=>b.start.localeCompare(a.start));
function lastPerf(id){for(const w of sortedW()){const e=w.exercises.find(x=>x.exId===id&&workSets(x).length); if(e) return{w,e};} return null;}
function bestE1(id){let b=0; for(const w of S.workouts) for(const e of w.exercises) if(e.exId===id) for(const s of workSets(e)) b=Math.max(b,s.w>0?e1rm(s.w,s.r):0); return b;}
function rx(ex){const g=GOALS[S.profile.train]; if(ex.cardio) return{...g,sets:'1',lo:20,hi:40,unit:'min'}; if(ex.timed) return{...g,sets:'3',lo:g.lo<8?20:30,hi:g.lo<8?40:60,unit:'secs'}; if(ex.iso&&S.profile.train==='strength') return{...g,sets:'3–4',lo:6,hi:10}; if(ex.bw&&S.profile.train==='strength'&&!ex.held) return{...g,lo:6,hi:12}; return g;}
const restFor=ex=>{const g=GOALS[S.profile.train]; return Math.round((ex.iso?g.rest*0.67:g.rest)/15)*15;};
const stepFor=ex=>eqOf(ex)==='dumbbell'?1:2.5;
const fmtSet=s=>s.min!=null?`${r1(s.min)} min${s.km?' · '+r1(s.km)+' km':''}`:(s.w>0?kg(s.w)+'×':'BW×')+s.r;
function sessionsOf(id){const out=[]; for(const w of sortedW()){const e=w.exercises.find(x=>x.exId===id&&workSets(x).length); if(e) out.push({w,e,best:Math.max(...workSets(e).map(s=>s.w>0?e1rm(s.w,s.r):s.r))});} return out;}
function isPlateau(id){const ss=sessionsOf(id).slice(0,4); if(ss.length<4) return false; return ss.slice(0,3).every(x=>x.best<=ss[3].best+0.01);}
function suggest(ex){const g=rx(ex), lp=lastPerf(ex.id), unit=g.unit||'reps', base=`${g.sets} × ${g.lo}–${g.hi} ${unit}`;
  if(ex.cardio){const d=S.profile.diet, last=lp?workSets(lp.e)[0]:null;
    return{base:'20–40 min',text:(last?`Last time ${fmtSet(last)}. `:'')+(d==='cut'||d==='slowcut'?'Mostly easy, conversational pace: it adds burn without eating into your lifting recovery.':d==='bulk'||d==='leangain'?'Two or three easy 20–30 minute sessions a week keep your heart fit without stalling the gain.':'Mix easy sessions with one harder interval day, e.g. 6 × 1 min hard, 1 min easy.'),w:null};}
  if(!lp) return{base,text:ex.bw?'First time: clean reps, stop 1–2 short of failure.':'First time: pick a weight you could lift 2 more reps than the target.',w:null};
  const ds=workSets(lp.e), top=Math.max(...ds.map(s=>s.w)), ts=ds.filter(s=>s.w===top), minR=Math.min(...ts.map(s=>s.r)), inc=ex.inc||2.5;
  if(minR>=g.hi&&top>0) return{base,text:`All sets hit ${g.hi}+ last time. Go up to ${kg(top+inc)} kg.`,w:kg(top+inc)};
  if(minR>=g.hi) return{base,text:ex.home?'Top of the range. Slow the lowering to 3 seconds, or move to a harder version.':'Top of the range. Slow the lowering or add a little weight.',w:0};
  if(isPlateau(ex.id)&&top>0){const d=kg(Math.round(top*0.9/2.5)*2.5); return{base,text:`Stalled for 4 sessions. Drop to ${d} kg this week and build back up.`,w:d};}
  return{base,text:`Stay at ${top>0?kg(top)+' kg':'bodyweight'}, aim for ${Math.min(minR+1,g.hi)}+ each set.`,w:top};}
function weekSets(days=7){const since=Date.now()-days*DAY, v={}; MUSCLES.forEach(m=>v[m.id]=0);
  const add=e=>{const ex=EXI[e.exId]; if(!ex||ex.cardio) return; const n=workSets(e).length; ex.primary.forEach(m=>v[m]+=n); (ex.secondary||[]).forEach(m=>v[m]+=n*0.5);};
  S.workouts.forEach(w=>{if(new Date(w.start).getTime()>=since) w.exercises.forEach(add);}); if(S.active) S.active.exercises.forEach(add); return v;}
function lastTrained(){const lt={}; for(const w of S.workouts){const t=new Date(w.start).getTime(); for(const e of w.exercises){const ex=EXI[e.exId]; if(!ex||ex.cardio||!workSets(e).length) continue; ex.primary.forEach(m=>{if(!lt[m]||t>lt[m]) lt[m]=t;});}} return lt;}
function focusMuscles(){const v=weekSets(), lt=lastTrained(), now=Date.now(); return MUSCLES.filter(m=>v[m.id]<10&&(now-(lt[m.id]||0))>48*36e5).sort((a,b)=>v[a.id]-v[b.id]).slice(0,4);}
function pool(){const home=S.profile.place==='home'; return Object.values(EXI).filter(ex=>!ex.cardio&&(!home||isHome(ex))&&(UI.eq==='all'||eqOf(ex)===UI.eq)&&(UI.kind==='all'||(UI.kind==='compound')===!ex.iso));}
function rankEx(sel){const list=pool(); if(!sel.size) return list;
  return list.map(ex=>({ex,s:ex.primary.filter(m=>sel.has(m)).length*2+(ex.secondary||[]).filter(m=>sel.has(m)).length})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||(a.ex.iso?1:0)-(b.ex.iso?1:0)).map(x=>x.ex);}
const homeAlts=ex=>(ex.alt||[]).map(id=>EXI[id]).filter(Boolean);
const vol=w=>{let v=0; w.exercises.forEach(e=>workSets(e).forEach(s=>v+=s.w*s.r)); return v;};
/* Cardio energy: running/walking from speed (ACSM equations) when distance is logged, otherwise a MET for the effort level.
   Lifting time is counted at 5 METs. All of these are estimates. */
const EFFORT=['Easy','Moderate','Hard'];
function cardioMET(ex,s){const L=s.lvl??1; if(ex.speed&&s.km>0&&s.min>0){const v=s.km*1000/s.min; return v<134?(0.1*v+3.5)/3.5:(0.2*v+3.5)/3.5;} return (ex.met||[5,7,9])[L];}
const cardioKcal=(ex,s)=>Math.round(cardioMET(ex,s)*latestWeight()*(s.min||0)/60);
const cardioMin=w=>w.exercises.reduce((a,e)=>a+(EXI[e.exId]&&EXI[e.exId].cardio?doneSets(e).reduce((b,s)=>b+(s.min||0),0):0),0);
const wBurn=w=>{const h=((w.end?new Date(w.end):new Date())-new Date(w.start))/36e5, cm=cardioMin(w);
  const ck=w.exercises.reduce((a,e)=>{const ex=EXI[e.exId]; return a+(ex&&ex.cardio?doneSets(e).reduce((b,s)=>b+cardioKcal(ex,s),0):0);},0);
  return Math.round(5*latestWeight()*clamp(h-cm/60,0,3))+ck;};
const dayBurn=k=>S.profile.burn?S.workouts.filter(w=>dkey(w.start)===k).reduce((a,w)=>a+wBurn(w),0):0;
function dayTot(k){const t={kcal:0,p:0,c:0,f:0}; (S.food[k]||[]).forEach(x=>{t.kcal+=x.kcal*x.qty;t.p+=x.p*x.qty;t.c+=x.c*x.qty;t.f+=x.f*x.qty;}); return t;}
function upNext(){const rs=S.routines.filter(r=>S.profile.place!=='home'||r.exercises.every(id=>EXI[id]&&isHome(EXI[id]))); const list=rs.length?rs:S.routines; if(!list.length) return null;
  const last=r=>{const w=sortedW().find(w=>w.routineId===r.id); return w?new Date(w.start).getTime():0;}; return list.slice().sort((a,b)=>last(a)-last(b))[0];}
function weekStreak(){let n=0; const mon=d=>{d=new Date(d);const x=(d.getDay()+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-x); return d.getTime();};
  const cnt=t=>S.workouts.filter(w=>mon(w.start)===t).length; let t=mon(new Date()); if(cnt(t)<2) t-=7*DAY; while(cnt(t)>=2&&n<520){n++; t-=7*DAY;} return n;}
function platesFor(w){const bar=+S.profile.bar||20; if(!(w>bar)) return null; let side=(w-bar)/2; const out=[]; for(const p of PLATES){while(side>=p-1e-9){out.push(p); side-=p;}} return{out,left:r1(side*2)};}
function recentFoods(n=10){const seen=new Set(), out=[]; Object.keys(S.food).sort().reverse().forEach(k=>(S.food[k]||[]).slice().reverse().forEach(x=>{if(!seen.has(x.name)&&out.length<n){seen.add(x.name); out.push(x);}})); return out;}
function usualFor(meal,k){const cnt={}, last={}; Object.keys(S.food).filter(d=>d<k&&d>=addDays(k,-30)).forEach(d=>(S.food[d]||[]).forEach(x=>{if(x.meal===meal){cnt[x.name]=(cnt[x.name]||0)+1; last[x.name]=x;}}));
  const have=new Set((S.food[k]||[]).filter(x=>x.meal===meal).map(x=>x.name)); return Object.keys(cnt).filter(n=>!have.has(n)).sort((a,b)=>cnt[b]-cnt[a]).slice(0,4).map(n=>last[n]);}
function mealNow(){const h=new Date().getHours()+new Date().getMinutes()/60; return h<10.5?'breakfast':h<14.5?'lunch':h>=17&&h<21.5?'dinner':'snacks';}
function recentEx(){const seen=[]; for(const w of sortedW()) for(const e of w.exercises) if(!seen.includes(e.exId)&&EXI[e.exId]) seen.push(e.exId); return seen.slice(0,6);}
const allFoods=()=>S.myFoods.map(f=>({...f,mine:1,cat:'Mine'})).concat(FOODS);
const findFood=n=>S.myFoods.find(x=>x.name===n)||FOODS.find(x=>x.name===n)||recentFoods(50).find(x=>x.name===n);
function proteinIdeas(k){const t=targets(), tot=dayTot(k), goal=t.kcal+dayBurn(k), kl=goal-tot.kcal, pl=t.prot-tot.p; if(pl<15||kl<100) return [];
  return allFoods().filter(f=>f.kcal<=kl&&f.p>=8).sort((a,b)=>b.p/Math.max(b.kcal,40)-a.p/Math.max(a.kcal,40)).slice(0,4);}

/* ================= Figures in the page ================= */
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches, visible=new Set();
const io=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(e=>{e.isIntersecting?visible.add(e.target):visible.delete(e.target);})):null;
function mountFigs(root){root.querySelectorAll('[data-fig]').forEach(el=>{const ex=EXI[el.dataset.fig]; if(!ex) return; el.innerHTML=figSVG(ex,reduceMotion?0.5:0,{ghost:true}); if(io&&!reduceMotion&&!ex.custom) io.observe(el);});
  root.querySelectorAll('[data-map]').forEach(el=>{const ex=EXI[el.dataset.map]; if(ex) el.innerHTML=`<svg viewBox="0 0 240 210" class="fg" aria-label="Muscles worked">${miniMapInner(ex)}</svg>`;});}
let lastFrame=0;
function tick(t){requestAnimationFrame(tick); if(reduceMotion||t-lastFrame<33) return; lastFrame=t;
  visible.forEach(el=>{if(!el.isConnected){visible.delete(el);return;} const ex=EXI[el.dataset.fig]; if(!ex||ex.custom) return; const T=1500*ex.K.length; el.innerHTML=figSVG(ex,(t%T)/T);});}
requestAnimationFrame(tick);

/* ================= Body map ================= */
function bodySVG(){const v=weekSets(); let out='';
  ['front','back'].forEach((side,i)=>{let g=''; BODY[side].forEach(sh=>{let a;
    if(!sh.m) a='class="base"'; else{const on=UI.sel.has(sh.m), pct=Math.round(Math.min(v[sh.m]/20,1)*70);
      a=`class="m" data-a="muscle" data-m="${sh.m}" fill="${on?'var(--red)':`color-mix(in srgb, var(--ink) ${pct}%, var(--off))`}" role="button" tabindex="0" aria-pressed="${on}" aria-label="${MN[sh.m]}"`;}
    g+=shapeSVG(sh,a); if(sh.mir) g+=`<g transform="matrix(-1 0 0 1 160 0)">${shapeSVG(sh,a)}</g>`;});
    out+=`<g transform="translate(${i*170},6)">${g}<text x="80" y="334" text-anchor="middle">${side.toUpperCase()}</text></g>`;});
  return`<svg class="body" viewBox="0 0 330 345" role="group" aria-label="Muscle map">${out}</svg>`;}

/* ================= Icons ================= */
const I=d=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IC={today:I('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),train:I('<path d="M3 9v6M6 6.5v11M18 6.5v11M21 9v6M6 12h12"/>'),
 body:I('<circle cx="12" cy="4.5" r="2"/><path d="M5 9l7-1.8L19 9M12 7.2V15M12 15l-3 6M12 15l3 6"/>'),food:I('<path d="M4 11h16a8 8 0 0 1-16 0zM8 7c0-2 2-2 2-4M12 7c0-2 2-2 2-4"/>'),
 stats:I('<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>'),check:I('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),more:I('<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'),
 close:I('<path d="M6 6l12 12M18 6L6 18"/>'),plus:I('<path d="M12 5v14M5 12h14"/>'),play:I('<path d="M7 5l12 7-12 7z"/>'),left:I('<path d="M15 5l-7 7 7 7"/>'),right:I('<path d="M9 5l7 7-7 7"/>'),
 up:I('<path d="M6 15l6-6 6 6"/>'),down:I('<path d="M6 9l6 6 6-6"/>'),copy:I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>'),
 search:I('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'),home:I('<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5"/>'),
 breakfast:I('<path d="M3 17h18M6 17a6 6 0 0 1 12 0M12 5v2M5.6 8.6l1.4 1.4M18.4 8.6L17 10"/>'),lunch:I('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'),
 dinner:I('<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z"/>'),snacks:I('<circle cx="12" cy="12" r="8"/><circle cx="9.5" cy="10" r=".8"/><circle cx="14" cy="9" r=".8"/><circle cx="14.5" cy="14" r=".8"/><circle cx="9.5" cy="14.5" r=".8"/>'),
 drop:I('<path d="M12 3.5c3 4 6 7.2 6 10.5a6 6 0 0 1-12 0c0-3.3 3-6.5 6-10.5z"/>'),
 flame:I('<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.6-5.3 3.6-8.3.6 1.8 1.7 2.9 2.9 3.3 0-2.6 1-4.9 3-6.8.2 3 3.5 5.2 3.5 9.6 0 4.6-2.6 8.4-6.5 8.4z"/>'),
 star:I('<path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>'),
 lock:I('<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'),
 bell:I('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0"/>'),
 me:I('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c.8-4 3.8-6.3 7.5-6.3s6.7 2.3 7.5 6.3"/>'),
 walk:I('<circle cx="6.5" cy="9.5" r="1.9"/><circle cx="10.5" cy="5.8" r="1.9"/><circle cx="15.5" cy="6.3" r="1.9"/><circle cx="18.7" cy="10.6" r="1.9"/><path d="M12.3 11.6c-3 0-6 3.5-6 6.1 0 1.9 1.6 2.6 3.2 2.1 1.9-.6 3.2-.6 5.1 0 1.6.5 3.2-.3 3.2-2.1 0-2.6-2.5-6.1-5.5-6.1z"/>'),
 gift:I('<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11M12 9c-1-3-5-4.5-5.5-2S10.5 9 12 9zm0 0c1-3 5-4.5 5.5-2S13.5 9 12 9z"/>')};
const NAV=[['today','Today','home'],['train','Train','train'],['walk','Walk','walk'],['food','Food','food'],['stats','Stats','stats'],['me','Me','me']];

/* ================= Render ================= */
function render(){
  $('#nav').innerHTML=NAV.map(([id,l,ic])=>`<button type="button" class="navbtn ${UI.tab===id?'on':''}" data-a="tab" data-t="${id}" aria-label="${l}" ${UI.tab===id?'aria-current="page"':''}>${IC[ic]}<span class="nl">${l}</span>${(id==='train'&&S.active)||(id==='walk'&&S.pet&&pendingMilestones().length)?'<span class="dot"></span>':''}</button>`).join('');
  const v=$('#view'); v.innerHTML=(S.sample?`<div class="banner"><span>Example data is loaded so you can try everything.</span><button type="button" class="btn sm" data-a="clear-sample">Clear examples</button></div>`:'')+({today:vToday,train:vTrain,walk:vWalk,food:vFood,stats:vStats,me:vMe})[UI.tab]();
  cuteEmpties(v); mountFigs(v);
  if(N) try{N.keepScreenOn(!!S.active);}catch(e){} else if(window.webKeepAwake) webKeepAwake(!!S.active);
}
function cuteEmpties(root){const sp=S.pet?S.pet.species:'duck'; root.querySelectorAll('.empty').forEach(el=>{if(el.querySelector('.petmini')) return; el.insertAdjacentHTML('afterbegin',`<span class="petmini">${petAvatar(sp,'content')}</span>`);});}
const ring=(cls,v,inner,c)=>`<div class="ring ${cls}" style="--v:${clamp(v,0,100)};--c:${c||'var(--ink)'}"><div>${inner}</div></div>`;
function bottle(ml,goalL){const pct=clamp(ml/(goalL*1000),0,1), top=22, bot=92, y=bot-(bot-top)*pct;
  return`<svg class="bottle" viewBox="0 0 58 96" aria-hidden="true"><defs><clipPath id="bclip"><path d="M21 4h16v8c0 3 9 6 9 14v62a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V26c0-8 9-11 9-14z"/></clipPath></defs>
   <path d="M21 4h16v8c0 3 9 6 9 14v62a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V26c0-8 9-11 9-14z" fill="var(--soft)"/>
   <g clip-path="url(#bclip)"><path d="M0 ${f1(y)} Q 14.5 ${f1(y-4)} 29 ${f1(y)} T 58 ${f1(y)} V 96 H 0 Z" fill="var(--water)" opacity=".85"/><path d="M0 ${f1(y+3)} Q 14.5 ${f1(y+6)} 29 ${f1(y+3)} T 58 ${f1(y+3)} V 96 H 0 Z" fill="var(--water)"/></g>
   <path d="M21 4h16v8c0 3 9 6 9 14v62a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V26c0-8 9-11 9-14z" fill="none" stroke="var(--line-strong)" stroke-width="1.6"/><rect x="19" y="1" width="20" height="5" rx="2" fill="var(--ink-2)"/>
   <path d="M17 34v40" stroke="var(--sheet)" stroke-width="2.5" stroke-linecap="round" opacity=".55"/></svg>`;}

/* ---------- daily quests ---------- */
function questsFor(k){const t=targets(), tot=dayTot(k), r=typeof scheduledOn==='function'?scheduledOn(k):null, meals=new Set((S.food[k]||[]).map(x=>x.meal)), g=stepGoal(), n=stepsOn(k);
  const q=[{id:'steps',ic:'walk',title:`Walk ${g.toLocaleString()} steps`,cur:n,goal:g,fmt:v=>v.toLocaleString()},
   {id:'protein',ic:'food',title:`Eat ${t.prot} g protein`,cur:Math.round(tot.p),goal:Math.round(t.prot*0.9),fmt:v=>v+' g'},
   {id:'water',ic:'drop',title:`Drink ${S.profile.waterL} L water`,cur:S.water[k]||0,goal:S.profile.waterL*1000,fmt:v=>litres(v)+' L'}];
  if(r) q.push({id:'train',ic:'train',title:`Do ${r.name}`,cur:workedOn(k)?1:0,goal:1,fmt:v=>v?'done':'to do'});
  else q.push({id:'meals',ic:'breakfast',title:'Log breakfast, lunch and dinner',cur:['breakfast','lunch','dinner'].filter(m=>meals.has(m)).length,goal:3,fmt:v=>v+'/3'});
  return q;}
const QUEST_TREATS=2, PERFECT_TREATS=3;
function questCard(){const k=dkey(new Date()), qs=questsFor(k), st=S.quests[k]||{c:[]}, done=qs.filter(q=>q.cur>=q.goal).length, P=S.pet;
  return`<div class="card"><div class="card-h"><span>Daily quests</span><span>${done}/${qs.length}${st.perfect?' · perfect day':''}</span></div><div class="card-b" style="padding-top:4px">
   ${qs.map(q=>{const ok=q.cur>=q.goal, claimed=st.c.includes(q.id);
    return`<div class="lrow quest ${ok?'ok':''}"><span class="qic">${ok?IC.check:IC[q.ic]}</span><div class="t"><b>${esc(q.title)}</b><div class="pbar thin"><i style="width:${Math.min(100,q.cur/q.goal*100)}%"></i></div></div>
     ${ok&&P&&!claimed?`<button type="button" class="btn sm primary" data-a="quest" data-q="${q.id}">${treatIcon} +${QUEST_TREATS}</button>`:`<span class="small muted num" style="min-width:56px;text-align:right">${claimed?`${treatIcon} got`:q.fmt(Math.min(q.cur,q.goal))}</span>`}</div>`;}).join('')}
   ${P?`<div class="tiny muted" style="margin-top:8px">Each quest gives ${QUEST_TREATS} treats for ${esc(P.name)}. Finish all ${qs.length} for a ${PERFECT_TREATS}-treat bonus.</div>`:`<div class="tiny muted" style="margin-top:8px">Adopt a pet on the Walk tab to earn treats from quests.</div>`}</div></div>`;}
function claimQuest(id){const k=dkey(new Date()), qs=questsFor(k), q=qs.find(x=>x.id===id), P=S.pet; if(!q||!P||q.cur<q.goal) return;
  const st=S.quests[k]=S.quests[k]||{c:[]}; if(st.c.includes(id)) return; st.c.push(id); P.treats+=QUEST_TREATS; let msg=`+${QUEST_TREATS} treats`;
  if(!st.perfect&&qs.every(x=>st.c.includes(x.id))){st.perfect=true; P.treats+=PERFECT_TREATS; msg=`Perfect day! +${QUEST_TREATS+PERFECT_TREATS} treats`;}
  Object.keys(S.quests).sort().slice(0,-90).forEach(d=>delete S.quests[d]);
  save(); render(); toast(msg); if(N) try{N.haptic('success');}catch(e){} else if(window.webHaptic) webHaptic('confirm');}

function sessionCard(){const k=dkey(new Date()), sp=S.pet?S.pet.species:'duck';
  if(S.active){const n=S.active.exercises.reduce((a,e)=>a+doneSets(e).length,0), f=S.active.exercises[0];
    return`<div class="card session live"><div class="card-h"><span>In progress</span><span>${Math.floor((Date.now()-new Date(S.active.start))/60000)} min</span></div><div class="card-b row" style="gap:12px">${f?`<div class="fig" data-fig="${f.exId}" style="width:74px;flex:none;cursor:default"></div>`:''}<div class="grow"><b style="font-size:19px">${esc(S.active.name)}</b><div class="small muted">${n} sets done · ${S.active.exercises.length} exercises</div></div><button type="button" class="btn primary" data-a="tab" data-t="train">Resume</button></div></div>`;}
  const ds=S.plan?dayState(k):null, wd=new Date().getDay();
  if(ds&&ds.state==='done'){const w=sortedW().find(x=>dkey(x.start)===k);
    return`<div class="card session"><div class="card-h"><span>Today · done</span><span>${S.plan?esc(S.plan.name):''}</span></div><div class="card-b row" style="gap:12px"><div style="width:74px;flex:none">${petAvatar(sp,'ecstatic')}</div><div class="grow"><b style="font-size:19px">${esc(w?w.name:'Workout')} complete</b><div class="small ink2">${w?`${w.exercises.length} exercises · ${Math.round(vol(w)).toLocaleString()} kg moved`:'Nice work.'}</div></div>${w?`<button type="button" class="btn sm" data-a="hist" data-id="${w.id}">View</button>`:''}</div></div>`;}
  if(ds&&ds.state==='rest'){let nx=null; for(let i=1;i<8&&!nx;i++){const r=scheduledOn(addDays(k,i)); if(r) nx={r,i};}
    return`<div class="card session"><div class="card-h"><span>Today · rest day</span><span>${S.plan?`week ${Math.max(1,planWeek())}`:''}</span></div><div class="card-b row" style="gap:12px"><div style="width:74px;flex:none">${petAvatar(sp,'sleeping')}</div><div class="grow"><b style="font-size:19px">Recover and walk</b><div class="small ink2">${nx?`Next: ${esc(nx.r.name)} ${nx.i===1?'tomorrow':WD[(wd+nx.i)%7]}.`:'No session today.'} A walk keeps ${S.pet?esc(S.pet.name):'you'} happy.</div></div></div>
      <div class="row" style="gap:8px;padding:0 16px 14px"><button type="button" class="btn sm" data-a="tab" data-t="walk">${IC.walk} Walk</button><button type="button" class="btn sm ghost" data-a="start-empty">Train anyway</button></div></div>`;}
  const r=ds?ds.r:upNext(); if(!r) return`<div class="card session"><div class="card-b row" style="gap:12px;padding-top:14px"><div class="fig" data-fig="squat" style="width:74px;flex:none;cursor:default"></div><div class="grow"><b style="font-size:18px">Pick a plan</b><div class="small ink2">A weekly schedule that tells you what to train each day.</div></div><button type="button" class="btn primary" data-a="plan-pick">Pick</button></div></div>`;
  const lp=sortedW().find(w=>w.routineId===r.id), ex=r.exercises.map(id=>EXI[id]).filter(Boolean), est=ex.length*9;
  return`<div class="card session"><div class="card-h"><span>${ds?'Today’s session':'Up next'}</span><span>${lp?'last '+fmtD(lp.start,{day:'numeric',month:'short'}):'first time'}</span></div><div class="card-b">
    <div class="row" style="gap:12px"><div class="figrow">${ex.slice(0,3).map(e=>`<div class="fig" data-fig="${e.id}" style="cursor:default"></div>`).join('')}</div></div>
    <div class="row between" style="margin-top:8px;gap:10px"><div class="grow"><b style="font-size:21px">${esc(r.name)}</b><div class="small muted">${ex.length} exercises · about ${est} min</div></div><button type="button" class="btn primary" data-a="start-routine" data-id="${r.id}">${IC.play}Start</button></div>
    <div class="chips wrapc" style="margin-top:8px">${ex.map(e=>`<button type="button" class="chip" data-a="ex-info" data-ex="${e.id}">${esc(e.name)}</button>`).join('')}</div>
    ${!S.plan?`<button type="button" class="more" data-a="plan-pick" style="margin-top:6px">Follow a weekly plan instead</button>`:''}</div></div>`;}

function nutritionCard(k){const t=targets(), tot=dayTot(k), burn=dayBurn(k), goal=t.kcal+burn, left=Math.round(goal-tot.kcal), items=S.food[k]||[];
  const mac=(l,v,g,c)=>`<div class="macl"><div class="row between tiny"><span>${l}</span><span class="num">${Math.round(v)}/${Math.round(g)} g</span></div><div class="bar"><i style="width:${clamp(v/g*100,0,100)}%;background:${c}"></i></div></div>`;
  const ics=[]; items.forEach(x=>{if(!ics.includes(x.ic)) ics.push(x.ic);});
  return`<div class="card"><div class="card-h"><span>Nutrition</span><button type="button" class="more" data-a="tab" data-t="food">Food tab</button></div><div class="card-b">
   <div class="row" style="gap:14px">${ring('',tot.kcal/goal*100,`<b>${Math.abs(left)}</b><span>${left<0?'over':'left'}</span>`,left<0?'var(--red)':'')}
    <div class="grow">${mac('Protein',tot.p,t.prot,'var(--ink)')}${mac('Carbs',tot.c,t.carb,'var(--ink-3)')}${mac('Fat',tot.f,t.fat,'var(--ink-3)')}</div></div>
   <div class="foodstrip">${ics.length?ics.slice(0,10).map(ic=>icon(ic)).join(''):`<span class="small muted">Nothing logged yet today.</span>`}</div>
   <div class="row" style="gap:8px"><button type="button" class="btn sm primary" data-a="add-food" data-m="${mealNow()}">${IC.plus}Log ${MEALS.find(m=>m[0]===mealNow())[1].toLowerCase()}</button><span class="small muted">${Math.round(tot.kcal)} of ${goal} kcal</span></div></div></div>`;}

function vToday(){
  const now=new Date(), k=dkey(now), h=now.getHours(), greet=h<5?'Late night':h<12?'Morning':h<18?'Afternoon':'Evening';
  const wa=S.water[k]||0, wg=S.profile.waterL, w7=avgWeight(7), w7p=avgWeight(7,addDays(k,-7));
  const prs=[]; sortedW().slice(0,8).forEach(w=>w.exercises.forEach(e=>e.sets.forEach(s=>{if(s.pr) prs.push({w,e,s});})));
  if(S.pet) petSettle();
  let o=(typeof installCard==='function'?installCard():'')+`<div class="split"><div class="col"><div class="row between"><div><h2 class="hello">${greet}, Ethan.</h2><p class="sub">${fmtD(now,{weekday:'long',day:'numeric',month:'long'})}${S.profile.place==='home'?' · training at home':''}</p></div></div>`;
  if(S.profile.petHome===false) o+='';
  else o+=S.pet?petHeroCard(true):`<button type="button" class="card adoptteaser" data-a="tab" data-t="walk"><div class="card-b"><div class="adoptrow">${STARTER.map(sp=>`<span>${petAvatar(sp,'happy')}</span>`).join('')}</div><b>Adopt a walking buddy</b><div class="small ink2">Hit ${stepGoal().toLocaleString()} steps a day to keep them happy. Streaks unlock rewards and a family.</div></div></button>`;
  o+=sessionCard()+questCard();
  o+=`</div><div class="col">`+nutritionCard(k);
  o+=`<div class="tiles"><div class="tile watertile"><div class="row" style="gap:10px">${bottle(wa,wg)}<div class="grow"><div class="l">Water</div><div class="v">${litres(wa)}<small> / ${wg} L</small></div><div class="row" style="margin-top:6px;gap:6px"><button type="button" class="btn sm" data-a="water" data-ml="250">${IC.plus}250</button></div></div></div></div>
    <button type="button" class="tile" data-a="log-weight"><div class="l">Weight · 7d avg</div><div class="v">${w7?r1(w7):'—'}<small> kg</small></div><div class="s">${w7&&w7p?`${w7-w7p>0?'+':''}${r1(w7-w7p)} kg vs last week`:'Tap to log today'}</div></button></div>`;
  if(S.plan) o+=`<div class="card"><div class="card-h"><span>This week · ${esc(S.plan.name)}</span><button type="button" class="more" data-a="trainplan">Plan</button></div><div class="card-b">${weekStrip()}</div></div>`;
  else{const wkStart=mondayOf(k), wkW=S.workouts.filter(w=>dkey(w.start)>=wkStart);
    o+=`<div class="tiles"><div class="tile"><div class="l">This week</div><div class="v">${wkW.length}<small> workouts</small></div></div><div class="tile"><div class="l">Streak</div><div class="v">${weekStreak()}<small> wks</small></div><div class="s">weeks with 2+ workouts</div></div></div>`;}
  if(prs.length) o+=`<div class="sectionlabel"><span>Recent PRs</span></div><div class="card"><div class="card-b" style="padding-top:4px">${prs.slice(0,3).map(({w,e,s})=>`<div class="lrow"><span class="medal gold">${IC.star}</span><div class="t"><b>${esc(EXI[e.exId]?.name||e.exId)}</b><span>${fmtD(w.start,{day:'numeric',month:'short'})}</span></div><span class="num">${fmtSet(s)}</span></div>`).join('')}</div></div>`;
  return o+'</div></div>';
}

function vTrain(){
  const a=S.active; let o='';
  if(a){
    o+=`<div class="row" style="margin:14px 2px 2px"><input class="wtitle grow" id="w-title" value="${esc(a.name)}" aria-label="Workout name"></div>
      <p class="sub"><span class="num" id="elapsed">${Math.floor((Date.now()-new Date(a.start))/60000)} min</span> · ${a.exercises.reduce((n,e)=>n+workSets(e).length,0)} working sets · <span class="num">${Math.round(vol(a)).toLocaleString()}</span> kg</p>`;
    o+='<div class="exgrid">';
    if(!a.exercises.length) o+=`<div class="card"><div class="empty">Add an exercise below, or use the Muscles tab under Train to get suggestions.</div></div>`;
    a.exercises.forEach((e,ei)=>{const ex=EXI[e.exId]; if(!ex) return; const sg=suggest(ex), lp=lastPerf(ex.id), prev=lp?workSets(lp.e):[], g=rx(ex), st=stepFor(ex);
      const nextW=(e.sets.find(s=>!s.done)||e.sets[e.sets.length-1]||{}).w, pl=eqOf(ex)==='barbell'&&nextW?platesFor(nextW):null; let wi=0;
      o+=`<article class="card exb"><div class="exh"><button type="button" class="fig thumb" data-fig="${ex.id}" data-a="ex-info" data-ex="${ex.id}" aria-label="Show ${esc(ex.name)} form"></button>
        <div class="grow"><button type="button" class="nm" data-a="ex-info" data-ex="${ex.id}">${esc(ex.name)}</button><div class="meta">${ex.cardio?`Cardio · ${EQ[eqOf(ex)]}`:`${ex.primary.map(m=>MN[m]).join(' · ')} · rest ${restFor(ex)}s`}</div></div>
        <button type="button" class="iconbtn sm" data-a="ex-menu" data-ei="${ei}" aria-label="Exercise options">${IC.more}</button></div>
        <div class="tip"><b>${sg.base}.</b> ${esc(sg.text)}</div>${S.notes[ex.id]?`<div class="memo">${esc(S.notes[ex.id])}</div>`:''}
        ${pl?`<div class="plates"><span class="lbl" style="margin-right:4px">Per side · ${kg(nextW)} kg</span>${pl.out.length?pl.out.map(p=>`<span class="pl">${p}</span>`).join(''):'<span class="muted">bar only</span>'}${pl.left?`<span class="neg"> +${pl.left} kg can't be made</span>`:''}</div>`:''}
        ${ex.cardio?cardioTable(e,ei,prev):`<table class="sets ${ex.bw&&!e.wt?'bwt':''}"><thead><tr><th>Set</th><th>Last</th><th>${ex.bw?(e.wt?'+kg':''):'kg'}</th><th>${g.unit||'reps'}</th><th><span class="sr">Done</span></th></tr></thead><tbody>
        ${e.sets.map((s,si)=>{const lbl=s.warm?'W':String(++wi), pv=s.warm?null:prev[wi-1];
          return`<tr class="${s.done?'done':''}"><td class="sn ${s.warm?'w':''}">${lbl}</td><td class="prev">${pv?fmtSet(pv):'—'}</td>
          <td>${ex.bw&&!e.wt?'<span class="bwcell">BW</span>':`<div class="stp"><button type="button" data-a="step" data-ei="${ei}" data-si="${si}" data-d="${-st}" aria-label="Less weight">−</button><input class="cell" id="w-${ei}-${si}" inputmode="decimal" data-ei="${ei}" data-si="${si}" data-f="w" value="${s.w??''}" placeholder="${ex.bw?'0':'kg'}" aria-label="Set ${lbl} weight"><button type="button" data-a="step" data-ei="${ei}" data-si="${si}" data-d="${st}" aria-label="More weight">+</button></div>`}</td>
          <td><input class="cell r" id="r-${ei}-${si}" inputmode="numeric" data-ei="${ei}" data-si="${si}" data-f="r" value="${s.r||''}" placeholder="${s.warm?'':(e.tgt?(e.tgt.lo===e.tgt.hi?e.tgt.lo:e.tgt.lo+'–'+e.tgt.hi):g.lo+'–'+g.hi)}" aria-label="Set ${lbl} reps">${s.pr?'<span class="prmark">PR</span>':''}</td>
          <td><button type="button" class="tick" data-a="set-done" data-ei="${ei}" data-si="${si}" aria-label="Mark set ${lbl} done" aria-pressed="${!!s.done}">${IC.check}</button></td></tr>`;}).join('')}
        </tbody></table>`}<div class="exf"><button type="button" class="btn sm" data-a="add-set" data-ei="${ei}">${IC.plus}${ex.cardio?'Interval':'Set'}</button>${ex.bw&&!ex.cardio&&!ex.timed?`<button type="button" class="btn sm ghost" data-a="bw-wt" data-ei="${ei}">${e.wt?'No weight':'+ Add weight'}</button>`:''}<button type="button" class="btn sm ghost" data-a="ex-info" data-ex="${ex.id}">Form</button></div></article>`;});
    o+='</div>'+(typeof checkCard==='function'?checkCard():'');
    o+=`<button type="button" class="btn block" data-a="pick" style="margin:12px 0">${IC.plus}Add exercise</button>
      <div class="row between"><button type="button" class="btn danger" data-a="discard">Discard</button><button type="button" class="btn primary" data-a="finish">Finish workout</button></div>`;
    return o;
  }
  o+=`<h2 class="hello">Train</h2><div class="seg" role="group" aria-label="Train sections">${[['plan','Plan'],['muscles','Muscles'],['history','History']].map(([k,l])=>`<button type="button" class="${UI.trainSeg===k?'on':''}" data-a="trainseg" data-s="${k}">${l}</button>`).join('')}</div>`;
  if(UI.trainSeg==='muscles') return o+vBody();
  if(UI.trainSeg==='history') return o+trainHistory();
  o+=`<div class="split"><div class="col">`+(S.plan?planCard():`<div class="card plancta"><div class="card-b row" style="gap:12px;padding-top:14px"><div class="fig" data-fig="squat" style="width:70px;flex:none;cursor:default"></div><div class="grow"><b style="font-size:17px">Follow a plan</b><div class="small ink2">Pick a weekly schedule. Today will show the session and reminders keep you on it.</div></div><button type="button" class="btn primary" data-a="plan-pick">Pick</button></div></div>`);
  o+=`</div><div class="col"><div class="seg" role="group" aria-label="Where you train">${[['gym','Gym'],['home','Home']].map(([k,l])=>`<button type="button" class="${S.profile.place===k?'on':''}" data-a="place" data-k="${k}">${l}</button>`).join('')}</div>`;
  if(S.profile.place==='home') o+=`<p class="note" style="margin-top:-6px">Routines with gym-only exercises start with home versions swapped in.</p>`;
  const nx=upNext();
  o+=`<div class="sectionlabel"><span>My routines</span><button type="button" class="more" data-a="routine-edit">+ New</button></div>`;
  if(!S.routines.length) o+=`<div class="card"><div class="empty">No routines yet. Make one, or finish a workout and save it as a routine.</div></div>`;
  else o+=`<div class="card"><div class="card-b" style="padding-top:4px">${S.routines.map(r=>{const lp=sortedW().find(w=>w.routineId===r.id), home=r.exercises.every(id=>EXI[id]&&isHome(EXI[id]));
    return`<div class="lrow"><div class="t"><b>${esc(r.name)}${nx&&nx.id===r.id?' <span class="tag">up next</span>':''}${home?' <span class="tag home">home</span>':''}</b><span class="ellipsis">${r.exercises.length} exercises${r.plan?` · ${r.plan.reduce((a,p,i)=>a+(EXI[r.exercises[i]]&&EXI[r.exercises[i]].cardio?0:(p.n||0)),0)} sets`:''} · ${lp?'last '+fmtD(lp.start,{day:'numeric',month:'short'}):'never done'}</span></div>
      <button type="button" class="iconbtn sm" data-a="routine-edit" data-id="${r.id}" aria-label="Edit ${esc(r.name)}">${IC.more}</button><button type="button" class="btn sm primary" data-a="start-routine" data-id="${r.id}">Start</button></div>`;}).join('')}</div></div>`;
  o+=`<div class="row" style="gap:8px"><button type="button" class="btn grow" data-a="routine-edit">${IC.plus}Create routine</button><button type="button" class="btn grow" data-a="start-empty">Empty workout</button></div></div></div>`;
  return o;
}
function trainHistory(){let o='';
  const hist=sortedW().slice(0,30);
  o+=`<div class="sectionlabel"><span>History</span><span>${S.workouts.length} total</span></div>`;
  if(!hist.length) o+=`<div class="card"><div class="empty">Finished workouts show up here.</div></div>`;
  else o+=`<div class="card"><div class="card-b" style="padding-top:4px">${hist.map(w=>{const mins=w.end?Math.round((new Date(w.end)-new Date(w.start))/60000):0, prn=w.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.pr).length,0);
    return`<div class="lrow" style="cursor:pointer" data-a="hist" data-id="${w.id}" role="button" tabindex="0"><div class="t"><b>${esc(w.name)}${prn?`<span class="prmark">${prn} PR</span>`:''}</b><span>${fmtD(w.start)} · ${w.exercises.length} exercises · ${mins} min</span></div><span class="num small ink2">${Math.round(vol(w)).toLocaleString()} kg</span></div>`;}).join('')}</div></div>`;
  return o;
}

function cardioTable(e,ei,prev){const ex=EXI[e.exId];
  return`<table class="sets cardio"><thead><tr><th>#</th><th>min</th><th>km</th><th>Effort</th><th><span class="sr">Done</span></th></tr></thead><tbody>${e.sets.map((s,si)=>`<tr class="${s.done?'done':''}"><td class="sn">${si+1}</td>
   <td><input class="cell r" inputmode="decimal" data-ei="${ei}" data-si="${si}" data-f="min" value="${s.min??''}" placeholder="20" aria-label="Minutes"></td>
   <td><input class="cell r" inputmode="decimal" data-ei="${ei}" data-si="${si}" data-f="km" value="${s.km??''}" placeholder="${ex.speed||ex.id==='bike'||ex.id==='rower'?'opt.':'—'}" aria-label="Distance in km"></td>
   <td><button type="button" class="chip eff l${s.lvl??1}" data-a="cardio-lvl" data-ei="${ei}" data-si="${si}">${EFFORT[s.lvl??1]}</button><div class="tiny muted" id="ck-${ei}-${si}">${cardioKcal(ex,s)} kcal</div></td>
   <td><button type="button" class="tick" data-a="set-done" data-ei="${ei}" data-si="${si}" aria-label="Mark done" aria-pressed="${!!s.done}">${IC.check}</button></td></tr>`).join('')}</tbody></table>
   ${prev.length?`<div class="tiny muted" style="padding:2px 16px 0">Last time: ${prev.map(fmtSet).join(' + ')}</div>`:''}`;}
function exCard(ex){const sg=suggest(ex);
  return`<div class="exc"><button type="button" class="fig" data-fig="${ex.id}" data-a="ex-info" data-ex="${ex.id}" aria-label="${esc(ex.name)} form"></button><h3>${esc(ex.name)}</h3>
    <div class="m">${ex.primary.map(m=>MN[m]).join(' · ')}</div><div class="tags"><span class="tag">${kindOf(ex)}</span>${isHome(ex)?'<span class="tag home">home</span>':''}</div><div class="rx">${sg.base}${sg.w?` · ${sg.w} kg`:''}</div>
    <button type="button" class="btn sm" data-a="add-ex" data-ex="${ex.id}">${IC.plus}Add</button></div>`;}
function vBody(){
  const fm=focusMuscles(), list=rankEx(UI.sel), home=S.profile.place==='home', eqs=home?EQ_HOME:EQ_GYM;
  if(UI.eq!=='all'&&!eqs.includes(UI.eq)) UI.eq='all';
  let o=`<p class="sub">Tap the map or the names. Darker means more sets this week.</p><div class="split"><div class="col">
   <div class="seg" role="group" aria-label="Where you train">${[['gym','Gym'],['home','Home · no big equipment']].map(([k,l])=>`<button type="button" class="${S.profile.place===k?'on':''}" data-a="place" data-k="${k}">${l}</button>`).join('')}</div>
   <div class="card"><div class="card-b">${bodySVG()}<div class="legend"><span><i style="background:var(--red)"></i>Selected</span><span><i style="background:color-mix(in srgb,var(--ink) 70%,var(--off))"></i>20+ sets</span><span><i style="background:var(--off)"></i>None</span></div></div></div>
   <div class="chips wrapc">${MUSCLES.map(m=>`<button type="button" class="chip ${UI.sel.has(m.id)?'on':''}" data-a="muscle" data-m="${m.id}" aria-pressed="${UI.sel.has(m.id)}">${m.name}</button>`).join('')}</div>
   <div class="row wrap" style="margin:2px 0 4px">${fm.length?`<button type="button" class="btn sm" data-a="sel-focus">Select fresh muscles</button>`:''}${UI.sel.size&&list.length?`<button type="button" class="btn sm primary" data-a="start-sel">Start with top ${Math.min(4,list.length)}</button>`:''}${UI.sel.size?`<button type="button" class="btn sm ghost" data-a="clear-sel">Clear</button>`:''}</div>
   </div><div class="col"><div class="sectionlabel" style="padding-top:4px"><span>${UI.sel.size?'Suggested':'All exercises'}${home?' · home':''} · ${GOALS[S.profile.train].label}</span><span>${list.length}</span></div>
   <div class="chips">${[['all','All'],['compound','Compound'],['iso','Isolation']].map(([k,l])=>`<button type="button" class="chip ${UI.kind===k?'on':''}" data-a="kind" data-k="${k}">${l}</button>`).join('')}<span style="width:8px;flex:none"></span>${[['all','Any equipment'],...eqs.map(k=>[k,EQ[k]])].map(([k,l])=>`<button type="button" class="chip ${UI.eq===k?'on':''}" data-a="eq" data-e="${k}">${l}</button>`).join('')}</div>
   <div class="excards">${list.map(exCard).join('')}${list.length?'':'<div class="empty" style="grid-column:1/-1">Nothing matches these filters. Try any equipment or both types.</div>'}</div></div></div>`;
  return o;
}

function vFood(){
  const k=UI.foodDate, t=targets(), tot=dayTot(k), burn=dayBurn(k), goal=t.kcal+burn, left=Math.round(goal-tot.kcal), today=dkey(new Date()), isToday=k===today, wa=S.water[k]||0, wg=S.profile.waterL;
  const d=new Date(k+'T12:00'), mon=addDays(k,-((d.getDay()+6)%7));
  let o=`<div class="split"><div class="col"><div class="wkh"><button type="button" class="iconbtn" data-a="day" data-d="-7" aria-label="Previous week">${IC.left}</button><div style="text-align:center"><b>${isToday?'Today':fmtD(k+'T12:00',{weekday:'long',day:'numeric',month:'short'})}</b>${isToday?'':`<div><button type="button" class="more" data-a="day" data-d="0">Back to today</button></div>`}</div><button type="button" class="iconbtn" data-a="day" data-d="7" aria-label="Next week">${IC.right}</button></div>
   <div class="wk" role="group" aria-label="Days">${[...Array(7)].map((_,i)=>{const dk=addDays(mon,i), dt=dayTot(dk), g=t.kcal+dayBurn(dk), v=dt.kcal/g*100;
     return`<button type="button" class="${dk===k?'on':''} ${dk===today?'today':''}" data-a="goday" data-k="${dk}" aria-label="${fmtD(dk+'T12:00',{weekday:'long',day:'numeric'})}"><span class="d">${'MTWTFSS'[i]}</span><span class="n">${new Date(dk+'T12:00').getDate()}</span><span class="r" style="--v:${clamp(v,0,100)};--c:${v>100?'var(--red)':'var(--ink)'}"></span></button>`;}).join('')}</div>
   <div class="card"><div class="card-b" style="padding-top:14px"><div class="fsum">${ring('',tot.kcal/goal*100,`<b>${Math.abs(left)}</b><span>${left<0?'kcal over':'kcal left'}</span>`,left<0?'var(--red)':'')}
     <div class="macros">${[['Protein',tot.p,t.prot],['Carbs',tot.c,t.carb],['Fat',tot.f,t.fat]].map(([l,v,g])=>`<div class="mac">${ring('xs',v/g*100,`<b>${Math.round(Math.max(0,g-v))}</b><span>g left</span>`,v>g*1.1?'var(--warn)':'')}<span class="lbl">${l}</span><span class="tiny muted num">${Math.round(v)}/${g}</span></div>`).join('')}</div></div>
     <div class="tiny muted mono" style="margin-top:10px">${Math.round(tot.kcal)} eaten · ${t.kcal} target${burn?` · +${burn} workout`:''}</div></div></div>`;
  const ideas=proteinIdeas(k);
  if(ideas.length) o+=`<div class="sectionlabel"><span>${Math.round(t.prot-tot.p)} g protein to go · ideas</span></div><div class="chips">${ideas.map(f=>`<button type="button" class="idea" data-a="quick" data-name="${esc(f.name)}">${icon(f.ic)}<div><b>${esc(f.name)}</b><span>+${r1(f.p)} g · ${f.kcal} kcal</span></div></button>`).join('')}</div>`;
  o+=waterCard(wa,wg)+`</div><div class="col">`;
  MEALS.forEach(([m,l])=>{const items=(S.food[k]||[]).filter(x=>x.meal===m), kc=items.reduce((a,x)=>a+x.kcal*x.qty,0), us=usualFor(m,k);
    o+=`<div class="card"><div class="mealh"><span class="mi">${IC[m]}</span><h3>${l}</h3><span class="num small ink2">${Math.round(kc)} kcal</span><button type="button" class="iconbtn sm" data-a="meal-menu" data-m="${m}" aria-label="${l} options">${IC.more}</button></div>
     ${items.map(x=>`<button type="button" class="fitem" data-a="fedit" data-id="${x.id}"><span class="fic">${icon(x.ic)}</span><span class="t"><b>${esc(x.name)}</b><span>${x.qty!==1?`${x.qty} × `:''}${esc(x.serving)} · P ${r1(x.p*x.qty)} C ${r1(x.c*x.qty)} F ${r1(x.f*x.qty)}</span></span><span class="k">${Math.round(x.kcal*x.qty)}<small>kcal</small></span></button>`).join('')}
     <div class="usual">${us.map(f=>`<button type="button" class="chip" data-a="add-usual" data-m="${m}" data-name="${esc(f.name)}">${icon(f.ic)}${esc(f.name.split(',')[0])}</button>`).join('')}<button type="button" class="chip p" data-a="add-food" data-m="${m}">${IC.plus}${us.length?'More':'Add food'}</button></div></div>`;});
  return o+`<p class="note">Food values are approximate per serving. Target uses Mifflin-St Jeor with your latest logged weight.</p></div></div>`;
}

function waterCard(wa,wg){
  return `<div class="card"><div class="card-h"><span>Water</span><span class="num">${litres(wa)} / ${wg} L</span></div><div class="card-b"><div class="water">${bottle(wa,wg)}<div class="grow">
     <div class="tiny muted" style="margin-bottom:8px">${wa>=wg*1000?'Goal reached.':`${litres(Math.max(0,wg*1000-wa))} L to go`}</div>
     <div class="wbtns">${[250,500,750].map(ml=>`<button type="button" class="btn sm" data-a="water" data-ml="${ml}">${IC.drop}+${ml} ml</button>`).join('')}${wa?`<button type="button" class="btn sm ghost" data-a="water" data-ml="-250">−250</button>`:''}</div></div></div></div></div>`;}
function niceStep(x){const p=Math.pow(10,Math.floor(Math.log10(x||1))), n=x/p; return (n<=1?1:n<=2?2:n<=5?5:10)*p;}
function lineChart(pts,unit,avg){
  if(pts.length<2) return`<div class="empty">Needs at least two entries to show a trend.</div>`;
  const W=600,H=210,Lf=40,Rr=14,T=18,B=26, ys=pts.map(p=>p.y).concat(avg?avg.map(p=>p.y):[]);
  let lo=Math.min(...ys),hi=Math.max(...ys); const pad=(hi-lo)*0.15||2; lo-=pad; hi+=pad; const st=niceStep((hi-lo)/4); lo=Math.floor(lo/st)*st; hi=Math.ceil(hi/st)*st;
  const t0=pts[0].x,t1=pts[pts.length-1].x, X=x=>Lf+(x-t0)/(t1-t0||1)*(W-Lf-Rr), Y=y=>T+(1-(y-lo)/(hi-lo))*(H-T-B);
  let g=''; for(let v=lo;v<=hi+1e-9;v+=st) g+=`<line x1="${Lf}" x2="${W-Rr}" y1="${f1(Y(v))}" y2="${f1(Y(v))}" stroke="var(--rule)"/><text x="${Lf-6}" y="${f1(Y(v)+3)}" text-anchor="end">${r1(v)}</text>`;
  const path=a=>a.map((p,i)=>(i?'L':'M')+f1(X(p.x))+' '+f1(Y(p.y))).join(' '), main=avg||pts, last=main[main.length-1], fd=x=>fmtD(x,{day:'numeric',month:'short'});
  return`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Trend">${g}
   ${avg?'':`<path d="${path(pts)} L${f1(X(t1))} ${H-B} L${f1(X(t0))} ${H-B} Z" fill="color-mix(in srgb, var(--ink) 7%, transparent)"/>`}
   <path d="${path(pts)}" fill="none" stroke="${avg?'var(--dim)':'var(--ink)'}" stroke-width="${avg?1.5:2}" stroke-linejoin="round"/>${avg?`<path d="${path(avg)}" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/>`:''}
   ${pts.map(p=>`<circle cx="${f1(X(p.x))}" cy="${f1(Y(p.y))}" r="2.6" fill="var(--sheet)" stroke="${avg?'var(--dim)':'var(--ink)'}" stroke-width="1.6"/>`).join('')}
   <circle cx="${f1(X(last.x))}" cy="${f1(Y(last.y))}" r="4.5" fill="var(--red)"/><text x="${f1(W-Rr)}" y="${f1(Y(last.y)-10)}" text-anchor="end" style="fill:var(--ink)">${r1(last.y)} ${unit}</text>
   <text x="${Lf}" y="${H-7}">${fd(t0)}</text><text x="${W-Rr}" y="${H-7}" text-anchor="end">${fd(t1)}</text></svg>`;}
function vStats(){
  let o=`<h2 class="hello">Stats</h2><div class="seg">${[['strength','Strength'],['volume','Volume'],['body','Body'],['food','Food'],['badges','Badges']].map(([k,l])=>`<button type="button" class="${UI.statSeg===k?'on':''}" data-a="seg" data-s="${k}">${l}</button>`).join('')}</div>`;
  if(UI.statSeg==='strength'){
    const logged=Object.values(EXI).filter(ex=>!ex.cardio&&S.workouts.some(w=>w.exercises.some(e=>e.exId===ex.id&&workSets(e).length)));
    if(!logged.find(e=>e.id===UI.progEx)) UI.progEx=logged[0]?.id;
    const ex=EXI[UI.progEx]; let pts=[], unit='kg';
    if(ex) sessionsOf(ex.id).reverse().forEach(({w,e})=>{const ds=workSets(e), top=Math.max(...ds.map(s=>s.w)); if(top>0) pts.push({x:new Date(w.start).getTime(),y:Math.max(...ds.map(s=>e1rm(s.w,s.r)))}); else{unit='reps'; pts.push({x:new Date(w.start).getTime(),y:Math.max(...ds.map(s=>s.r))});}});
    o+=`<div class="card"><div class="card-h"><span>${unit==='kg'?'Estimated 1RM (Epley)':'Best set · reps'}</span></div><div class="card-b">${logged.length?`<select class="input" id="prog-ex" aria-label="Exercise">${logged.map(e=>`<option value="${e.id}" ${e.id===UI.progEx?'selected':''}>${esc(e.name)}</option>`).join('')}</select>`:''}
      <div class="chart" style="margin-top:10px">${lineChart(pts,unit)}</div>${ex&&isPlateau(ex.id)?`<p class="note neg">No progress in the last 4 sessions, so the suggestion switches to a 10% deload.</p>`:''}</div></div>`;
    const prs=logged.map(ex=>{let b=null; S.workouts.forEach(w=>w.exercises.forEach(e=>{if(e.exId===ex.id) workSets(e).forEach(s=>{if(s.w>0&&(!b||e1rm(s.w,s.r)>e1rm(b.s.w,b.s.r))) b={s,w};});})); return b?{ex,...b}:null;}).filter(Boolean);
    o+=`<div class="sectionlabel"><span>Personal bests</span></div><div class="card"><div class="card-b" style="padding-top:4px">${prs.map(p=>`<div class="lrow"><div class="t"><b>${esc(p.ex.name)}</b><span>${fmtD(p.w.start,{day:'numeric',month:'short',year:'numeric'})}</span></div><span class="num">${fmtSet(p.s)}</span><span class="num small muted" style="min-width:64px;text-align:right">${r1(e1rm(p.s.w,p.s.r))} kg</span></div>`).join('')||'<div class="empty">Weighted sets will show here.</div>'}</div></div>`;}
  if(UI.statSeg==='volume'){const v=weekSets();
    o+=`<div class="card"><div class="card-h"><span>Sets per muscle · 7 days</span></div><div class="card-b">${MUSCLES.map(m=>{const n=v[m.id]; return`<div class="vb"><span class="small">${m.name}</span><div class="tr"><div class="band"></div><div class="fl ${n<10?'low':n>20?'hi':''}" style="width:${Math.min(n/30*100,100)}%"></div></div><span class="num small" style="text-align:right">${r1(n)}</span></div>`;}).join('')}
      <p class="note">Shaded band is 10–20 sets, a common range for growth. Secondary muscles count half.</p></div></div>`;
    const end=new Date(); end.setHours(0,0,0,0); const start=new Date(end); start.setDate(start.getDate()-((end.getDay()+6)%7)-7*11);
    const byDay={}; S.workouts.forEach(w=>{const k=dkey(w.start); byDay[k]=(byDay[k]||0)+vol(w)+1;}); const mx=Math.max(1,...Object.values(byDay));
    let cells=''; for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const k=dkey(d), x=byDay[k]; cells+=`<i title="${k}" style="${x?`background:color-mix(in srgb,var(--ink) ${Math.round(35+65*x/mx)}%,var(--off))`:''}"></i>`;}
    o+=`<div class="card"><div class="card-h"><span>Training days · 12 weeks</span><span>${S.workouts.filter(w=>new Date(w.start)>=start).length} sessions</span></div><div class="card-b"><div class="heat">${cells}</div><p class="note">Columns are weeks, Monday at the top. Darker means more volume.</p></div></div>`;}
  if(UI.statSeg==='body'){const ws=S.weights.slice().sort((a,b)=>a.d.localeCompare(b.d)), pts=ws.map(w=>({x:new Date(w.d+'T12:00').getTime(),y:w.kg})), avg=ws.map(w=>({x:new Date(w.d+'T12:00').getTime(),y:avgWeight(7,w.d)}));
    o+=`<div class="card"><div class="card-h"><span>Bodyweight · 7-day average</span><button type="button" class="more" data-a="log-weight">+ Log</button></div><div class="card-b"><div class="chart">${lineChart(pts,'kg',avg)}</div><p class="note">Light line is each weigh-in, dark line is the 7-day average.</p></div></div>
      <div class="card"><div class="card-b" style="padding-top:4px">${ws.slice().reverse().slice(0,8).map(w=>`<div class="lrow"><div class="t"><b>${fmtD(w.d+'T12:00')}</b></div><span class="num">${w.kg} kg</span><button type="button" class="iconbtn sm" data-a="del-weight" data-d="${w.d}" aria-label="Delete">${IC.close}</button></div>`).join('')||'<div class="empty">No weigh-ins yet.</div>'}</div></div>`;}
  if(UI.statSeg==='food'){const t=targets(), days=[...Array(14)].map((_,i)=>{const k=addDays(dkey(new Date()),-13+i), d=dayTot(k); return{k,kc:d.kcal,p:d.p,goal:t.kcal+dayBurn(k),w:S.water[k]||0};});
    const W=600,H=190,Lf=40,B=24,T=12, mx=Math.max(...days.map(x=>Math.max(x.kc,x.goal)))*1.1, st=niceStep(mx/4), top=Math.ceil(mx/st)*st, Y=y=>T+(1-y/top)*(H-T-B), bw=(W-Lf-8)/14;
    let g=''; for(let y=0;y<=top;y+=st) g+=`<line x1="${Lf}" x2="${W-8}" y1="${f1(Y(y))}" y2="${f1(Y(y))}" stroke="var(--rule)"/><text x="${Lf-6}" y="${f1(Y(y)+3)}" text-anchor="end">${y}</text>`;
    days.forEach((x,i)=>{const cx=Lf+bw*i+bw*0.2, w=bw*0.6; g+=`<rect x="${f1(cx)}" y="${f1(Y(x.kc))}" width="${f1(w)}" height="${f1(Math.max(0,Y(0)-Y(x.kc)))}" rx="2" fill="${x.kc>x.goal?'var(--red)':'var(--ink)'}"/><line x1="${f1(cx-2)}" x2="${f1(cx+w+2)}" y1="${f1(Y(x.goal))}" y2="${f1(Y(x.goal))}" stroke="var(--ink-3)" stroke-width="2"/>${i%2?'':`<text x="${f1(cx+w/2)}" y="${H-7}" text-anchor="middle">${new Date(x.k+'T12:00').getDate()}</text>`}`;});
    const lg=days.filter(d=>d.kc>0), avgK=lg.length?lg.reduce((a,d)=>a+d.kc,0)/lg.length:0, avgP=lg.length?lg.reduce((a,d)=>a+d.p,0)/lg.length:0, wl=days.filter(d=>d.w>0), avgW=wl.length?wl.reduce((a,d)=>a+d.w,0)/wl.length:0;
    o+=`<div class="tiles t4"><div class="tile"><div class="l">Avg intake</div><div class="v">${Math.round(avgK)}<small> kcal</small></div><div class="s">target ${t.kcal}</div></div><div class="tile"><div class="l">Avg protein</div><div class="v">${Math.round(avgP)}<small> g</small></div><div class="s">target ${t.prot} g</div></div>
      <div class="tile"><div class="l">Avg water</div><div class="v">${litres(Math.round(avgW/50)*50)}<small> L</small></div><div class="s">goal ${S.profile.waterL} L</div></div><div class="tile"><div class="l">Days logged</div><div class="v">${lg.length}<small> / 14</small></div></div></div>
      <div class="card"><div class="card-h"><span>Calories · 14 days</span></div><div class="card-b"><div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily calories">${g}</svg></div><p class="note">Grey tick is the day's target including workout estimate. Red bars are over.</p></div></div>`;}
  if(UI.statSeg==='badges') o+=badgesView();
  return o;
}

/* ================= Badges ================= */
function badgeList(){const wk=S.workouts.length, prs=S.workouts.reduce((a,w)=>a+w.exercises.reduce((b,e)=>b+e.sets.filter(x=>x.pr).length,0),0), P=S.pet;
  const foodDays=Object.keys(S.food).filter(k=>(S.food[k]||[]).length).length, waterDays=Object.keys(S.water).filter(k=>S.water[k]>=S.profile.waterL*1000).length;
  const ton=Math.max(0,...S.workouts.map(vol)), ad=S.plan?adherence():null, qd=Object.values(S.quests||{}).filter(q=>q.perfect).length, best=P?P.best:0, lv=P?P.level:0;
  return[
   ['First rep','Finish a workout',wk,1,'squat'],['Regular','10 workouts',wk,10,'bench'],['Iron habit','50 workouts',wk,50,'deadlift'],['Centurion','100 workouts',wk,100,'pullup'],
   ['PR hunter','10 personal records',prs,10,'ohp'],['Ten tonne day','10,000 kg in one session',ton,10000,'legpress'],
   ['On plan','Follow a plan for 4 weeks',S.plan?planWeek()-1:0,4,'row'],['Plan perfect','90% plan adherence',ad&&ad.sch>=6?ad.pct:0,90,'lunge'],
   ['First walk','Hit your step goal',best,1,'pet'],['Week walker','7-day step streak',best,7,'pet'],['Month walker','30-day step streak',best,30,'pet'],['Legend','100-day step streak',best,100,'pet'],
   ['Best friends','Pet level 5',lv,5,'pet'],['Family','Hatch an egg',P?P.babies:0,1,'egg'],
   ['Food diary','Log food on 7 days',foodDays,7,'food'],['Hydrated','Hit your water goal 7 times',waterDays,7,'water'],['Perfect day','Finish every daily quest',qd,1,'star'],['Perfect week','7 perfect days',qd,7,'star']];}
function badgesView(){const L=badgeList(), got=L.filter(b=>b[2]>=b[3]).length, sp=S.pet?S.pet.species:'duck';
  const art=(b,on)=>b[4]==='pet'?petAvatar(sp,on?'ecstatic':'sleeping'):b[4]==='egg'?`<svg viewBox="40 50 120 130" class="petsvg">${eggSVG(on?1:.3)}</svg>`:b[4]==='food'?icon('sushi'):b[4]==='water'?bottle(on?2000:700,2.5):b[4]==='star'?`<span class="medal ${on?'gold':''}" style="width:56px;height:56px">${IC.star}</span>`:`<div class="fig" data-fig="${b[4]}" style="cursor:default"></div>`;
  return`<div class="card"><div class="card-h"><span>Badges</span><span>${got} / ${L.length}</span></div><div class="card-b"><div class="pbar" style="margin-bottom:14px"><i style="width:${got/L.length*100}%"></i></div>
   <div class="badges">${L.map(b=>{const on=b[2]>=b[3]; return`<div class="badge ${on?'on':''}"><div class="bart">${art(b,on)}${on?'':`<span class="blk">${IC.lock}</span>`}</div><b>${b[0]}</b><span>${on?b[1]:`${Math.min(b[2],b[3]).toLocaleString()} / ${b[3].toLocaleString()}`}</span></div>`;}).join('')}</div></div></div>`;}

/* ================= Sheets ================= */
function sheet(title,body,foot){UI.sheet=true; $('#sheet').innerHTML=`<div class="grab"></div><div class="sheet-h"><h2>${title}</h2><button type="button" class="iconbtn" data-a="close" aria-label="Close">${IC.close}</button></div><div class="sheet-b" id="sheet-b">${body}</div>${foot?`<div class="sheet-f" id="sheet-f">${foot}</div>`:''}`; $('#sheetwrap').hidden=false; mountFigs($('#sheet'));}
function closeSheet(){$('#sheetwrap').hidden=true; $('#sheet').innerHTML=''; UI.sheet=null;}
function exInfo(id){const ex=EXI[id], sg=suggest(ex), ss=sessionsOf(id).slice(0,5), alts=homeAlts(ex);
  sheet(esc(ex.name),`<div class="figpair"><div class="fig" data-fig="${ex.id}"></div><div class="fig" data-map="${ex.id}"></div></div>
   <div class="chips wrapc"><span class="tag">${kindOf(ex)}</span><span class="tag">${EQ[eqOf(ex)]}${ex.note?' · '+ex.note:''}</span>${isHome(ex)?'<span class="tag home">home</span>':''}</div>
   <div class="chips wrapc">${ex.primary.map(m=>`<span class="chip p">${MN[m]}</span>`).join('')}${(ex.secondary||[]).map(m=>`<span class="chip">${MN[m]}</span>`).join('')}</div>
   <p style="margin:6px 0 10px">${esc(ex.cue)}</p><div class="card"><div class="card-b" style="padding-top:12px"><div class="lbl">${sg.base}</div><div class="small ink2" style="margin-top:4px">${esc(sg.text)}</div></div></div>
   ${alts.length?`<div class="sectionlabel" style="padding-top:6px"><span>At home instead</span></div>${alts.map(a=>`<div class="lrow"><div class="fig" data-fig="${a.id}" style="width:54px;flex:none;cursor:default"></div><div class="t"><b>${esc(a.name)}</b><span>${EQ[eqOf(a)]} · ${kindOf(a)}</span></div><button type="button" class="btn sm" data-a="add-ex" data-ex="${a.id}">Add</button></div>`).join('')}`:''}
   ${ss.length?`<div class="sectionlabel" style="padding-top:6px"><span>Recent</span></div>${ss.map(({w,e})=>`<div class="lrow"><span class="t"><b>${fmtD(w.start,{day:'numeric',month:'short'})}</b></span><span class="num small ink2">${workSets(e).map(fmtSet).join(' · ')}</span></div>`).join('')}`:''}`,
   `<button type="button" class="btn primary block" data-a="add-ex" data-ex="${ex.id}">${IC.plus}Add to workout</button>`);}
function pickSheet(){const rec=recentEx();
  sheet('Add exercise',`<div class="field"><input class="input" id="pick-q" placeholder="Search name or muscle" autocomplete="off" aria-label="Search exercises"></div>
   ${rec.length?`<div class="lbl" style="margin-bottom:6px">Recent</div><div class="chips wrapc">${rec.map(id=>`<button type="button" class="chip" data-a="add-ex" data-ex="${id}">${esc(EXI[id].name)}</button>`).join('')}</div>`:''}
   <div class="lbl" style="margin:10px 0 6px">Cardio</div><div class="chips wrapc">${Object.values(EXI).filter(e=>e.cardio&&(S.profile.place!=='home'||isHome(e))).map(e=>`<button type="button" class="chip" data-a="add-ex" data-ex="${e.id}">${esc(e.name)}</button>`).join('')}</div>
   <div id="pick-list">${pickRows('')}</div>`,UI.pickFor==='routine'?`<button type="button" class="btn sm" data-a="custom-ex">${IC.plus}Own exercise</button><span class="grow"></span><button type="button" class="btn primary" id="pick-done" data-a="r-back">Done · ${UI.rEdit.exercises.length} in routine</button>`:`<button type="button" class="btn block" data-a="custom-ex">${IC.plus}Create your own exercise</button>`);}
function pickRows(q){const ql=q.toLowerCase(), home=S.profile.place==='home', list=Object.values(EXI).filter(e=>(!home||isHome(e))&&(!ql||e.name.toLowerCase().includes(ql)||e.primary.concat(e.secondary||[]).some(m=>MN[m].toLowerCase().includes(ql))));
  return (home?'<p class="note" style="margin-top:0">Showing home exercises. Switch to Gym on the Train tab for everything.</p>':'')+(list.map(e=>`<div class="lrow"><div class="fig" data-fig="${e.id}" style="width:48px;flex:none;cursor:default"></div><div class="t"><b>${esc(e.name)}</b><span>${e.primary.map(m=>MN[m]).join(', ')} · ${kindOf(e)}</span></div><button type="button" class="btn sm" data-a="add-ex" data-ex="${e.id}">Add</button></div>`).join('')||'<div class="empty">No match.</div>');}
function exMenu(ei){const e=S.active.exercises[ei], ex=EXI[e.exId], alts=homeAlts(ex), same=Object.values(EXI).filter(x=>x.id!==ex.id&&x.primary[0]===ex.primary[0]&&!alts.includes(x));
  const work=(e.sets.find(s=>!s.warm&&s.w>0)||{}).w||suggest(ex).w;
  const row=a=>`<div class="lrow"><div class="fig" data-fig="${a.id}" style="width:48px;flex:none;cursor:default"></div><div class="t"><b>${esc(a.name)}</b><span>${EQ[eqOf(a)]}</span></div><button type="button" class="btn sm" data-a="swap" data-ei="${ei}" data-ex="${a.id}">Swap</button></div>`;
  sheet(esc(ex.name),`<div class="lbl" style="margin:4px 0 6px">Order</div><div class="row" style="margin-bottom:12px"><button type="button" class="btn sm" data-a="move" data-ei="${ei}" data-d="-1" ${ei?'':'disabled'}>${IC.up}Up</button><button type="button" class="btn sm" data-a="move" data-ei="${ei}" data-d="1" ${ei<S.active.exercises.length-1?'':'disabled'}>${IC.down}Down</button></div>
   ${!ex.bw&&work?`<div class="lbl" style="margin-bottom:6px">Warm-up</div><button type="button" class="btn sm" data-a="warmup" data-ei="${ei}" style="margin-bottom:12px">Add ramp to ${kg(work)} kg</button>`:''}
   <div class="field"><label for="ex-note">Note, kept for next time</label><input class="input" id="ex-note" data-ex="${ex.id}" value="${esc(S.notes[ex.id]||'')}" placeholder="e.g. seat at 4, close grip"></div>
   ${alts.length?`<div class="lbl" style="margin-bottom:2px">Home alternatives</div>${alts.map(row).join('')}`:''}
   ${same.length?`<div class="lbl" style="margin:12px 0 2px">Same muscle</div>${same.map(row).join('')}`:''}`,
   `<button type="button" class="btn danger" data-a="rm-ex" data-ei="${ei}">Remove</button><span class="grow"></span><button type="button" class="btn primary" data-a="close-render">Done</button>`);}
/* ---------- Routine builder: exercises with planned sets, reps and weight ---------- */
const rDef=id=>{const ex=EXI[id]; if(!ex) return{n:3,lo:8,hi:12,kg:null}; if(ex.cardio) return{n:1,min:20}; const g=rx(ex); return{n:3,lo:g.lo,hi:g.hi,kg:null};};
function routineSheet(id,copy){const r=id?S.routines.find(x=>x.id===id):null;
  UI.rEdit={id:copy?null:(r?.id||null),name:r?(copy?r.name+' copy':r.name):'',exercises:r?[...r.exercises]:[],plan:r&&r.plan?r.plan.map(x=>({...x})):[]};
  UI.rEdit.exercises.forEach((x,i)=>{if(!UI.rEdit.plan[i]) UI.rEdit.plan[i]=rDef(x);}); drawRoutineSheet();}
function rSync(){const d=UI.rEdit, n=$('#r-name'); if(n) d.name=n.value;}
function drawRoutineSheet(){const d=UI.rEdit; UI.pickFor=null; const tot=d.plan.reduce((a,p,i)=>a+(EXI[d.exercises[i]]&&EXI[d.exercises[i]].cardio?0:(p.n||0)),0);
  const tpls=typeof ROUTINE_DEF==='object'?Object.keys(ROUTINE_DEF):[];
  sheet(d.id?'Edit routine':'New routine',`<div class="field"><label for="r-name">Name</label><input class="input" id="r-name" value="${esc(d.name)}" placeholder="e.g. Upper A, Chest day, Saturday legs"></div>
   ${!d.exercises.length&&tpls.length?`<div class="lbl" style="margin-bottom:6px">Start from a template, or add your own below</div><div class="chips wrapc" style="margin-bottom:10px">${tpls.map(k=>`<button type="button" class="chip" data-a="r-tpl" data-k="${esc(k)}">${esc(k)}</button>`).join('')}</div>`:''}
   <div class="row between" style="margin-bottom:4px"><span class="lbl">Exercises${d.exercises.length?` · ${d.exercises.length}`:''}</span>${tot?`<span class="tiny muted num">${tot} working sets</span>`:''}</div>
   <div class="rlist">${d.exercises.map((x,i)=>{const ex=EXI[x]; if(!ex) return ''; const p=d.plan[i]||rDef(x), g=rx(ex);
     return`<div class="rrow"><div class="fig" data-fig="${ex.id}" style="cursor:default"></div><div class="grow" style="min-width:0"><b class="ellipsis" style="display:block">${esc(ex.name)}</b><span class="tiny muted">${ex.cardio?'Cardio':ex.primary.map(m=>MN[m]).join(' · ')}</span>
      <div class="rctl">${ex.cardio?`<label class="rin"><input inputmode="decimal" data-rp="min" data-i="${i}" value="${p.min??20}"><span>min</span></label>`
       :`<span class="rstp"><button type="button" data-a="r-sets" data-i="${i}" data-d="-1" aria-label="Fewer sets">−</button><b class="num">${p.n}</b><button type="button" data-a="r-sets" data-i="${i}" data-d="1" aria-label="More sets">+</button></span><span class="tiny muted">sets ×</span>
        <label class="rin"><input inputmode="text" data-rp="reps" data-i="${i}" value="${p.lo===p.hi?p.lo:p.lo+'–'+p.hi}" aria-label="Reps"><span>${g.unit||'reps'}</span></label>
        ${ex.bw?'':`<label class="rin"><input inputmode="decimal" data-rp="kg" data-i="${i}" value="${p.kg??''}" placeholder="auto" aria-label="Weight"><span>kg</span></label>`}`}</div></div>
      <div class="rbtns"><button type="button" class="iconbtn sm" data-a="r-move" data-i="${i}" aria-label="Move up" ${i?'':'disabled'}>${IC.up}</button><button type="button" class="iconbtn sm" data-a="r-rm" data-i="${i}" aria-label="Remove">${IC.close}</button></div></div>`;}).join('')||'<div class="empty">No exercises yet.</div>'}</div>
   <button type="button" class="btn block" style="margin-top:10px" data-a="r-pick">${IC.plus}Add exercises</button>
   <p class="tiny muted">Leave weight on <b>auto</b> and Kintore suggests one from your last session.</p>
   ${typeof routineCheck==='function'?routineCheck():''}`,
   `${d.id?`<button type="button" class="btn danger sm" data-a="r-del">Delete</button><button type="button" class="btn sm ghost" data-a="r-dup">Duplicate</button>`:''}<span class="grow"></span><button type="button" class="btn sm" data-a="r-save" data-start="1">Save &amp; start</button><button type="button" class="btn primary sm" data-a="r-save">Save</button>`);}
document.addEventListener('input',e=>{const t=e.target; if(!t.dataset||!t.dataset.rp||!UI.rEdit) return; const p=UI.rEdit.plan[+t.dataset.i]; if(!p) return; const v=t.value.trim();
  if(t.dataset.rp==='kg'){const n=parseFloat(v); p.kg=isNaN(n)?null:n;} else if(t.dataset.rp==='min'){const n=parseFloat(v); p.min=isNaN(n)?20:n;}
  else{const m=v.match(/(\d+)\s*[-–to ]*\s*(\d+)?/); if(m){p.lo=+m[1]; p.hi=m[2]?Math.max(+m[1],+m[2]):+m[1];}}});

/* food sheets */
function foodSheet(m){UI.mealFor=m; UI.added={}; UI.fq=''; const l=MEALS.find(x=>x[0]===m)[1];
  sheet('Add to '+l,`<div class="field" style="margin-bottom:8px"><input class="input" id="food-q" placeholder="Search foods" autocomplete="off" aria-label="Search foods"></div>
   <div class="chips" id="fcats">${fcatChips()}</div>
   ${S.meals.length?`<div class="chips">${S.meals.map(t=>`<button type="button" class="chip p" data-a="use-meal" data-id="${t.id}">${IC.plus}${esc(t.name)} · ${Math.round(t.items.reduce((a,x)=>a+x.kcal*x.qty,0))} kcal</button>`).join('')}</div>`:''}
   <div class="fgrid" id="fgrid">${foodGrid()}</div>
   <details class="card" style="margin-top:14px"><summary class="card-h" style="cursor:pointer">Quick add your own</summary><form id="qa" class="card-b">
    <div class="field"><label for="qa-name">Name</label><input class="input" id="qa-name" required></div>
    <div class="lbl" style="margin-bottom:6px">Icon</div><div class="icpick" id="icpick">${Object.keys(ICONS).map(k=>`<button type="button" data-a="qa-ic" data-k="${k}" class="${k==='plate'?'on':''}" aria-label="${k}">${icon(k)}</button>`).join('')}</div>
    <div class="g2"><div class="field"><label for="qa-serv">Serving</label><input class="input" id="qa-serv" placeholder="1 serve"></div><div class="field"><label for="qa-kcal">kcal</label><input class="input" id="qa-kcal" inputmode="decimal" required></div></div>
    <div class="g3"><div class="field"><label for="qa-p">Protein g</label><input class="input" id="qa-p" inputmode="decimal"></div><div class="field"><label for="qa-c">Carbs g</label><input class="input" id="qa-c" inputmode="decimal"></div><div class="field"><label for="qa-f">Fat g</label><input class="input" id="qa-f" inputmode="decimal"></div></div>
    <label class="row small" style="margin-bottom:10px"><input type="checkbox" id="qa-save" checked> Save to my foods</label><button class="btn primary block" type="submit">Add</button></form></details>`,
   `<span class="grow small ink2" id="add-sum">Tap a food to add one serving.</span><button type="button" class="btn primary" data-a="close-render">Done</button>`);
  UI.qaIc=null;}
function fcatChips(){const cats=[['all','All'],['recent','Recent'],...(S.myFoods.length?[['Mine','Mine']]:[]),...FCATS.map(c=>[c,c])]; return cats.map(([k,l])=>`<button type="button" class="chip ${UI.fcat===k?'on':''}" data-a="fcat" data-k="${esc(k)}">${l}</button>`).join('');}
function foodGrid(){const q=UI.fq.toLowerCase(); let list=UI.fcat==='recent'?recentFoods(18).map(x=>findFood(x.name)||x):allFoods();
  if(UI.fcat!=='all'&&UI.fcat!=='recent') list=list.filter(f=>f.cat===UI.fcat); if(q) list=allFoods().filter(f=>f.name.toLowerCase().includes(q));
  return list.map(f=>{const n=(UI.added[f.name]||{}).n||0; return`<div class="ftile ${n?'on':''}"><button type="button" data-a="ft-add" data-name="${esc(f.name)}" style="all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;width:100%">${icon(f.ic)}<b>${esc(f.name)}</b><span>${esc(f.serving)} · ${f.kcal}</span></button>${n?`<span class="badge">×${n}</span><button type="button" class="minus" data-a="ft-sub" data-name="${esc(f.name)}" aria-label="Remove one">−</button>`:''}</div>`;}).join('')||'<div class="empty" style="grid-column:1/-1">No match. Use quick add below.</div>';}
function updAddSum(){const xs=Object.values(UI.added).filter(a=>a.n>0), kc=xs.reduce((a,x)=>a+x.kcal*x.n,0), n=xs.reduce((a,x)=>a+x.n,0); const el=$('#add-sum'); if(el) el.textContent=n?`${n} added · ${Math.round(kc)} kcal`:'Tap a food to add one serving.'; const g=$('#fgrid'); if(g) g.innerHTML=foodGrid();}
function editFood(id){const x=(S.food[UI.foodDate]||[]).find(y=>y.id===id); if(!x) return closeSheet(); UI.fedit=id;
  sheet(esc(MEALS.find(m=>m[0]===x.meal)[1]),`<div class="edit-hero">${icon(x.ic)}<b style="font-size:18px">${esc(x.name)}</b><span class="small muted">${esc(x.serving)} per serving</span></div>
   <div class="bigstep"><button type="button" data-a="fe-qty" data-d="-0.25" aria-label="Less">−</button><b>×${x.qty}</b><button type="button" data-a="fe-qty" data-d="0.25" aria-label="More">+</button></div>
   <div class="chips" style="justify-content:center">${[0.5,1,1.5,2,3].map(q=>`<button type="button" class="chip ${x.qty===q?'on':''}" data-a="fe-set" data-q="${q}">×${q}</button>`).join('')}</div>
   <div class="tiles t4" style="margin-top:8px"><div class="tile"><div class="l">kcal</div><div class="v">${Math.round(x.kcal*x.qty)}</div></div><div class="tile"><div class="l">Protein</div><div class="v">${r1(x.p*x.qty)}<small> g</small></div></div><div class="tile"><div class="l">Carbs</div><div class="v">${r1(x.c*x.qty)}<small> g</small></div></div><div class="tile"><div class="l">Fat</div><div class="v">${r1(x.f*x.qty)}<small> g</small></div></div></div>
   <div class="lbl" style="margin-bottom:6px">Meal</div><div class="seg">${MEALS.map(([m,l])=>`<button type="button" class="${x.meal===m?'on':''}" data-a="fe-meal" data-m="${m}">${l}</button>`).join('')}</div>`,
   `<button type="button" class="btn danger" data-a="fe-del">Remove</button><span class="grow"></span><button type="button" class="btn primary" data-a="close-render">Done</button>`);}
function mealMenu(m){UI.mealFor=m; const l=MEALS.find(x=>x[0]===m)[1], items=(S.food[UI.foodDate]||[]).filter(x=>x.meal===m), y=(S.food[addDays(UI.foodDate,-1)]||[]).filter(x=>x.meal===m);
  sheet(l,`<div class="lrow"><div class="t"><b>Copy from the day before</b><span>${y.length?y.map(x=>x.name).join(', '):'Nothing logged'}</span></div><button type="button" class="btn sm" data-a="copy-y" data-m="${m}" ${y.length?'':'disabled'}>${IC.copy}Copy</button></div>
   <div class="lrow"><div class="t"><b>Save as meal</b><span>${items.length?items.length+' items, reuse with one tap':'Add food to this meal first'}</span></div>${items.length?`<input class="input" id="meal-name" style="max-width:140px;min-height:34px" value="${esc(l)}" aria-label="Meal name"><button type="button" class="btn sm" data-a="save-meal" data-m="${m}">Save</button>`:''}</div>
   <div class="lrow"><div class="t"><b>Clear ${l.toLowerCase()}</b></div><button type="button" class="btn sm danger" data-a="clear-meal" data-m="${m}" ${items.length?'':'disabled'}>Clear</button></div>
   ${S.meals.length?`<div class="sectionlabel"><span>Saved meals</span></div>${S.meals.map(t=>`<div class="lrow"><div class="t"><b>${esc(t.name)}</b><span>${t.items.map(x=>x.name).join(', ')}</span></div><button type="button" class="iconbtn sm" data-a="del-meal" data-id="${t.id}" aria-label="Delete">${IC.close}</button></div>`).join('')}`:''}`);}
function weightSheet(){const today=dkey(new Date()), cur=S.weights.find(w=>w.d===today);
  sheet('Log weight',`<div class="g2"><div class="field"><label for="wt-d">Date</label><input class="input" id="wt-d" type="date" value="${today}"></div><div class="field"><label for="wt-kg">Weight kg</label><input class="input" id="wt-kg" inputmode="decimal" value="${cur?cur.kg:r1(latestWeight())}"></div></div>
   <p class="note">Weigh in the morning before food. The 7-day average smooths water swings, and your calorie target follows your latest weigh-in.</p>`,`<button type="button" class="btn primary block" data-a="save-weight">Save</button>`);}
function summarySheet(w){const mins=Math.round((new Date(w.end)-new Date(w.start))/60000), prs=[]; w.exercises.forEach(e=>e.sets.forEach(s=>{if(s.pr) prs.push({e,s});}));
  sheet('Workout saved',`<h2 class="hello" style="margin-top:4px">${esc(w.name)}</h2><div class="tiles"><div class="tile"><div class="l">Time</div><div class="v">${mins}<small> min</small></div></div><div class="tile"><div class="l">Volume</div><div class="v">${Math.round(vol(w)).toLocaleString()}<small> kg</small></div></div>
   <div class="tile"><div class="l">Sets</div><div class="v">${w.exercises.reduce((a,e)=>a+workSets(e).length,0)}</div></div><div class="tile"><div class="l">Burn est.</div><div class="v">${wBurn(w)}<small> kcal</small></div>${cardioMin(w)?`<div class="s">incl. ${Math.round(cardioMin(w))} min cardio</div>`:''}</div></div>
   ${prs.length?`<div class="lbl" style="margin-bottom:4px">New PRs</div>${prs.map(({e,s})=>`<div class="lrow"><div class="t"><b>${esc(EXI[e.exId]?.name)}</b></div><span class="num">${fmtSet(s)}</span><span class="prmark">PR</span></div>`).join('')}`:''}`,
   `${w.routineId?'':`<button type="button" class="btn" data-a="save-as-routine" data-id="${w.id}">Save as routine</button>`}<span class="grow"></span><button type="button" class="btn primary" data-a="close">Done</button>`);}
function histSheet(id){const w=S.workouts.find(x=>x.id===id); if(!w) return;
  sheet(esc(w.name),`<p class="sub" style="margin:0 0 8px">${fmtD(w.start,{weekday:'long',day:'numeric',month:'long'})} · ${Math.round(vol(w)).toLocaleString()} kg</p>${w.exercises.map(e=>`<div class="lrow"><div class="t"><b>${esc(EXI[e.exId]?.name||e.exId)}</b><span class="num">${doneSets(e).map(s=>(s.warm?'W ':'')+fmtSet(s)+(s.pr?' PR':'')).join(' · ')}</span></div></div>`).join('')}`,
   `<button type="button" class="btn danger" data-a="del-workout" data-id="${w.id}">Delete</button><span class="grow"></span>${w.routineId?'':`<button type="button" class="btn" data-a="save-as-routine" data-id="${w.id}">Routine</button>`}<button type="button" class="btn primary" data-a="repeat" data-id="${w.id}">Repeat</button>`);}
function customExSheet(){sheet('Your own exercise',`<div class="field"><label for="cx-name">Name</label><input class="input" id="cx-name" placeholder="e.g. Hack squat"></div>
   <div class="g2"><div class="field"><label for="cx-m">Main muscle</label><select class="input" id="cx-m">${MUSCLES.map(m=>`<option value="${m.id}">${m.name}</option>`).join('')}</select></div>
   <div class="field"><label for="cx-e">Equipment</label><select class="input" id="cx-e">${Object.entries(EQ).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div></div>
   <label class="row small"><input type="checkbox" id="cx-iso"> Isolation (single joint)</label><p class="note">Your own exercises show a muscle diagram instead of an animation.</p>`,`<button type="button" class="btn primary block" data-a="save-cx">Create and add</button>`);}
const statTiles=t=>typeof targetTiles==="function"?targetTiles(t):`<div class="tile"><div class="l">Maintenance</div><div class="v">${t.tdee}<small> kcal</small></div></div><div class="tile"><div class="l">Daily target</div><div class="v">${t.kcal}<small> kcal</small></div><div class="s">P ${t.prot} · C ${t.carb} · F ${t.fat} g</div></div>`;
function settingsSheet(){const p=S.profile;
  sheet('Settings',`<button type="button" class="lrow mecta" data-a="tab" data-t="me"><span class="medal">${IC.me}</span><div class="t"><b>Profile, goals and body fat</b><span>Now in the Me tab</span></div>${IC.right}</button>
   <div class="lbl" style="margin:12px 0 6px">Theme</div><div class="seg">${THEMES.map(([k,l])=>`<button type="button" class="${p.theme===k?'on':''}" data-a="theme" data-k="${k}">${l}</button>`).join('')}</div>
   <div class="g2"><div class="field"><label for="p-bar">Barbell kg</label><input class="input" id="p-bar" data-p="bar" inputmode="decimal" value="${p.bar}"></div>
    <div class="field"><label for="p-burn">Workout kcal</label><select class="input" id="p-burn" data-p="burn"><option value="1" ${p.burn?'selected':''}>Add to food target</option><option value="0" ${p.burn?'':'selected'}>Ignore</option></select></div></div>
   <label class="row small" style="margin:-2px 0 12px;gap:8px"><input type="checkbox" id="p-pethome" ${p.petHome!==false?'checked':''}> Show my pet on Today</label>
   <button type="button" class="btn block" data-a="plan-remind">${IC.bell} Reminders</button>
   <div class="sectionlabel"><span>Data</span></div><p class="note" style="margin-top:0">${N?'Your data is saved in Kintore’s private storage on this phone, with a copy kept for each of the last 7 days. Backups go to Downloads/Kintore.':'This web version keeps everything in this browser. Copy a backup before clearing site data.'}</p>
   <div class="row wrap"><button type="button" class="btn sm" data-a="export">${N?'Save backup':'Copy backup'}</button><button type="button" class="btn sm" data-a="import-open">Restore</button><button type="button" class="btn sm danger" data-a="erase">Erase all</button></div><div id="data-msg" class="small muted" style="margin-top:8px"></div>${aboutHTML()}`);}
function aboutHTML(){if(!N) return ''; let i={}; try{i=JSON.parse(N.info())}catch(e){}
  return`<div class="sectionlabel"><span>App</span></div><div class="lrow"><div class="t"><b>Kintore ${esc(i.appVersion||'')}</b><span>UI ${esc(i.webVersion||'')} · ${esc(i.webSource||'')}${UI.apk?` · app update ${esc(UI.apk.apkVersion)} available`:''}</span></div>${UI.apk?`<button type="button" class="btn sm primary" data-a="install-apk">Install</button>`:''}<button type="button" class="btn sm" data-a="check-update">Check</button></div>`;}

/* ================= Actions ================= */
function toast(msg,undo,act){const w=$('#toastwrap'); UI.toastFn=act?act.fn:null; w.innerHTML=`<div class="toast" role="status"><span>${esc(msg)}</span>${undo?'<button type="button" data-a="undo">Undo</button>':''}${act?`<button type="button" data-a="toast-act">${esc(act.label)}</button>`:''}</div>`; clearTimeout(toast.t); toast.t=setTimeout(()=>{w.innerHTML='';},act?12000:undo?5000:2400);}
function newWorkout(name,rid){S.active={id:uid(),name:name||'Workout',routineId:rid||null,start:new Date().toISOString(),exercises:[]};}
function addExercise(id){if(!S.active) newWorkout(EXI[id].cardio?EXI[id].name:EXI[id].primary.map(m=>MN[m]).join(' + '));
  const ex=EXI[id], sg=suggest(ex), lp=lastPerf(id), n=lp?Math.max(3,workSets(lp.e).length):3;
  if(ex.cardio){const l=lp?workSets(lp.e)[0]:null; S.active.exercises.push({exId:id,sets:[{min:l?l.min:20,km:null,lvl:l?(l.lvl??1):1,w:0,r:0,done:false}]}); return;}
  S.active.exercises.push({exId:id,sets:[...Array(n)].map(()=>({w:sg.w??(ex.bw?0:null),r:0,done:false}))});}
function nextUp(){const a=S.active; if(!a) return 'Next set'; for(const e of a.exercises){const i=e.sets.findIndex(s=>!s.done); if(i>=0){const ex=EXI[e.exId], s=e.sets[i]; return `Next: ${ex?ex.name:'set'}${s.w>0?' · '+kg(s.w)+' kg':''}`;}} return 'All sets done';}
function startRest(ex){const s=restFor(ex); UI.rest={end:Date.now()+s*1000,len:s*1000,name:ex.name}; $('#rest').hidden=false; if(N) try{N.restStart(UI.rest.end,nextUp());}catch(e){} restTick();}
function stopRest(){UI.rest=null; if(N) try{N.restCancel();}catch(e){} restTick();}
function restTick(){if(!UI.rest){$('#rest').hidden=true;return;} const left=UI.rest.end-Date.now();
  if(left<=0){UI.rest=null; $('#rest').hidden=true; if(!N&&window.webChime){webChime(); webHaptic('long');} toast('Rest done. '+nextUp()+'.'); return;}
  const s=Math.ceil(left/1000); $('#rest-t').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); $('#rest-i').style.width=(left/UI.rest.len*100)+'%'; $('#rest-n').textContent=UI.rest.name;}
setInterval(()=>{restTick(); const el=$('#elapsed'); if(el&&S.active) el.textContent=Math.floor((Date.now()-new Date(S.active.start))/60000)+' min';},250);
function addFood(f,meal,qty=1,date=UI.foodDate){const e={id:uid(),meal,qty,name:f.name,serving:f.serving,kcal:f.kcal,p:f.p,c:f.c,f:f.f,ic:f.ic||guessIcon(f.name)}; (S.food[date]=S.food[date]||[]).push(e); return e;}
const go=t=>{UI.tab=t; try{localStorage.setItem(KEY+'-tab',t)}catch(e){} closeSheet(); render(); scrollTo(0,0);};
const busy=()=>{if(S.active){toast('Finish or discard the current workout first'); go('train'); return true;} return false;};
const curFood=()=>(S.food[UI.foodDate]||[]).find(y=>y.id===UI.fedit);

const A={
 tab:b=>go(b.dataset.t), 'pet-hide':()=>{S.profile.petHome=false; save(); render(); toast('Pet hidden from Today',false,{label:'Undo',fn:()=>{S.profile.petHome=true; save(); render();}});}, quest:b=>claimQuest(b.dataset.q), trainplan:()=>{UI.trainSeg='plan'; go('train');}, settings:()=>settingsSheet(), close:()=>{if(UI.pickFor==='routine'&&UI.rEdit){drawRoutineSheet(); return;} closeSheet();}, 'close-render':()=>{closeSheet(); render();},
 'clear-sample':()=>{snap(); S.workouts=S.workouts.filter(w=>!w.sample); S.routines=S.routines.filter(r=>!r.sample); S.food={}; S.water={}; S.weights=[]; S.meals=[]; S.steps={}; S.stepsAdd={}; S.quests={}; if(S.plan&&S.routines.every(r=>!Object.values(S.plan.days).includes(r.id))) S.plan=null; if(S.pet&&S.pet.sample) S.pet=null; S.sample=false; save(); if(typeof syncReminders==='function') syncReminders(); render(); toast('Examples cleared',true);},
 undo:()=>{if(!undoSnap) return; S=JSON.parse(undoSnap); undoSnap=null; rebuildEXI(); applyTheme(); save(); render(); $('#toastwrap').innerHTML='';},
 theme:b=>{S.profile.theme=b.dataset.k; save(); applyTheme(); settingsSheet();},
 place:b=>{S.profile.place=b.dataset.k; UI.eq='all'; save(); render();},
 muscle:b=>{const m=b.dataset.m; UI.sel.has(m)?UI.sel.delete(m):UI.sel.add(m); render();},
 'sel-focus':()=>{UI.sel=new Set(focusMuscles().map(m=>m.id)); render();}, 'clear-sel':()=>{UI.sel.clear(); render();},
 eq:b=>{UI.eq=b.dataset.e; render();}, kind:b=>{UI.kind=b.dataset.k; render();},
 'start-sel':()=>{const list=rankEx(UI.sel).slice(0,4); if(!list.length) return; if(!S.active) newWorkout([...UI.sel].map(m=>MN[m]).join(' + ')); list.forEach(e=>addExercise(e.id)); save(); go('train');},
 'focus-build':()=>{UI.sel=new Set(focusMuscles().map(m=>m.id)); UI.eq='all'; UI.kind='all'; A['start-sel']();},
 'start-empty':()=>{newWorkout('Workout'); save(); render();},
 'start-routine':b=>{const r=S.routines.find(x=>x.id===b.dataset.id); if(!r||busy()) return; let sw=0; newWorkout(r.name,r.id);
   r.exercises.forEach((id,i)=>{let ex=EXI[id]; if(!ex) return; const swapped=S.profile.place==='home'&&!isHome(ex)&&homeAlts(ex).find(isHome); if(swapped){ex=swapped; sw++;} addExercise(ex.id);
     const p=r.plan&&r.plan[i], e=S.active.exercises[S.active.exercises.length-1]; if(!p) return;
     if(ex.cardio){if(p.min) e.sets[0].min=p.min; return;}
     const n=Math.max(1,p.n||3); while(e.sets.length<n) e.sets.push({...e.sets[e.sets.length-1],done:false}); e.sets.length=n;
     if(p.lo) e.tgt={lo:p.lo,hi:p.hi||p.lo}; if(p.kg!=null&&!swapped) e.sets.forEach(s=>{s.w=p.kg;});});
   save(); go('train'); if(sw) toast(`Swapped ${sw} exercise${sw>1?'s':''} for home versions`);},
 'ex-info':b=>exInfo(b.dataset.ex), pick:()=>pickSheet(), 'custom-ex':()=>customExSheet(),
 'add-ex':b=>{if(UI.pickFor==='routine'&&UI.rEdit){UI.rEdit.exercises.push(b.dataset.ex); UI.rEdit.plan.push(rDef(b.dataset.ex)); const f=$('#pick-done'); if(f) f.textContent=`Done · ${UI.rEdit.exercises.length} in routine`; toast(EXI[b.dataset.ex].name+' added'); return;}
   addExercise(b.dataset.ex); save(); closeSheet(); render(); if(UI.tab!=='train') toast(EXI[b.dataset.ex].name+' added to workout');},
 'add-set':b=>{const e=S.active.exercises[+b.dataset.ei], l=e.sets.filter(s=>!s.warm).pop(); e.sets.push(EXI[e.exId]&&EXI[e.exId].cardio?{min:l?l.min:10,km:null,lvl:l?l.lvl:1,w:0,r:0,done:false}:{w:l?l.w:null,r:l?l.r:0,done:false}); save(); render();},
 'bw-wt':b=>{const e=S.active.exercises[+b.dataset.ei]; e.wt=!e.wt; if(!e.wt) e.sets.forEach(s=>{s.w=0;}); save(); render();},
 'cardio-lvl':b=>{const s=S.active.exercises[+b.dataset.ei].sets[+b.dataset.si]; s.lvl=((s.lvl??1)+1)%3; save(); render();},
 step:b=>{const s=S.active.exercises[+b.dataset.ei].sets[+b.dataset.si]; s.w=Math.max(0,kg((s.w||0)+ +b.dataset.d)); save(); render();},
 'set-done':b=>{const e=S.active.exercises[+b.dataset.ei], s=e.sets[+b.dataset.si], ex=EXI[e.exId];
   if(ex.cardio){if(!(s.min>0)) s.min=20; s.r=Math.max(1,Math.round(s.min)); s.done=!s.done; save(); if(s.done){if(N) try{N.haptic('confirm');}catch(e){} else if(window.webHaptic) webHaptic('confirm'); toast(`${ex.name} · ${fmtSet(s)} · about ${cardioKcal(ex,s)} kcal`);} render(); return;}
   if(!s.done&&!s.r) s.r=s.warm?5:(e.tgt?e.tgt.lo:rx(ex).lo); if(s.w==null) s.w=0; s.done=!s.done; s.pr=false;
   if(s.done&&!s.warm&&s.w>0){const prior=bestE1(ex.id), best=Math.max(prior,...e.sets.filter(x=>x!==s&&x.pr).map(x=>e1rm(x.w,x.r))); if(prior>0&&e1rm(s.w,s.r)>best+0.01){s.pr=true; toast(`New PR · ${ex.name} ${fmtSet(s)}, e1RM ${r1(e1rm(s.w,s.r))} kg`);}}
   save(); if(N&&s.done) try{N.haptic(s.pr?'long':'confirm');}catch(e){} else if(s.done&&window.webHaptic) webHaptic(s.pr?'long':'confirm'); if(s.done&&S.active.exercises.some(x=>x.sets.some(y=>!y.done))) startRest(ex); render();},
 'ex-menu':b=>exMenu(+b.dataset.ei),
 move:b=>{const i=+b.dataset.ei, j=i+ +b.dataset.d, a=S.active.exercises; [a[i],a[j]]=[a[j],a[i]]; save(); render(); exMenu(j);},
 warmup:b=>{const e=S.active.exercises[+b.dataset.ei], ex=EXI[e.exId], W=(e.sets.find(s=>!s.warm&&s.w>0)||{}).w||suggest(ex).w, bar=eqOf(ex)==='barbell'?+S.profile.bar:0, rd=x=>Math.max(bar,Math.round(x/2.5)*2.5);
   e.sets=e.sets.filter(s=>!s.warm); let ramp=[[0.5,8],[0.7,5],[0.85,3]].map(([p,r])=>({w:rd(W*p),r,done:false,warm:true})); if(bar&&W>bar+20) ramp.unshift({w:bar,r:10,done:false,warm:true});
   ramp=ramp.filter((s,i,a)=>(!i||s.w>a[i-1].w)&&s.w<W); e.sets=ramp.concat(e.sets); save(); closeSheet(); render(); toast(ramp.length+' warm-up sets added');},
 swap:b=>{const e=S.active.exercises[+b.dataset.ei], ex=EXI[b.dataset.ex], sg=suggest(ex); e.exId=ex.id; e.sets=e.sets.filter(s=>!s.warm).map(()=>({w:sg.w??(ex.bw?0:null),r:0,done:false})); save(); closeSheet(); render();},
 'rm-ex':b=>{snap(); S.active.exercises.splice(+b.dataset.ei,1); save(); closeSheet(); render(); toast('Exercise removed',true);},
 finish:()=>{const a=S.active, kept=a.exercises.filter(e=>doneSets(e).length).map(e=>({...e,sets:doneSets(e)})); if(!kept.length){toast('Tick at least one set, or discard'); return;}
   a.exercises=kept; a.end=new Date().toISOString(); S.workouts.push(a); S.active=null; stopRest(); save(); flush(); render(); summarySheet(a);},
 discard:()=>{snap(); S.active=null; stopRest(); save(); render(); toast('Workout discarded',true);},
 hist:b=>histSheet(b.dataset.id),
 repeat:b=>{const w=S.workouts.find(x=>x.id===b.dataset.id); if(!w||busy()) return; newWorkout(w.name,w.routineId);
   w.exercises.forEach(e=>{const ex=EXI[e.exId]; if(!ex) return; const sg=suggest(ex); S.active.exercises.push({exId:e.exId,sets:workSets(e).map(s=>({w:sg.w??s.w,r:0,done:false}))});}); save(); go('train');},
 'del-workout':b=>{snap(); S.workouts=S.workouts.filter(x=>x.id!==b.dataset.id); save(); closeSheet(); render(); toast('Workout deleted',true);},
 'save-as-routine':b=>{const w=S.workouts.find(x=>x.id===b.dataset.id); if(!w) return; const r={id:uid(),name:w.name,exercises:w.exercises.map(e=>e.exId),
   plan:w.exercises.map(e=>{const ex=EXI[e.exId], ws=workSets(e); if(ex&&ex.cardio) return{n:1,min:ws[0]?ws[0].min:20}; const d=rDef(e.exId), top=Math.max(0,...ws.map(s=>s.w||0)); return{n:Math.max(1,ws.length||3),lo:d.lo,hi:d.hi,kg:top>0?top:null};})}; S.routines.push(r); w.routineId=r.id; save(); closeSheet(); render(); toast('Saved as routine '+r.name);},
 'routine-edit':b=>routineSheet(b.dataset.id),
 'r-move':b=>{const i=+b.dataset.i, a=UI.rEdit.exercises, p=UI.rEdit.plan; rSync(); [a[i-1],a[i]]=[a[i],a[i-1]]; [p[i-1],p[i]]=[p[i],p[i-1]]; drawRoutineSheet();},
 'r-rm':b=>{rSync(); UI.rEdit.exercises.splice(+b.dataset.i,1); UI.rEdit.plan.splice(+b.dataset.i,1); drawRoutineSheet();},
 'r-sets':b=>{rSync(); const p=UI.rEdit.plan[+b.dataset.i]; p.n=clamp((p.n||3)+ +b.dataset.d,1,10); drawRoutineSheet();},
 'r-tpl':b=>{rSync(); const ids=(ROUTINE_DEF[b.dataset.k]||[]).filter(id=>EXI[id]); UI.rEdit.exercises=ids.slice(); UI.rEdit.plan=ids.map(rDef); if(!UI.rEdit.name) UI.rEdit.name=b.dataset.k; drawRoutineSheet();},
 'r-pick':()=>{rSync(); UI.pickFor='routine'; pickSheet();},
 'r-dup':()=>{rSync(); const d=UI.rEdit; UI.rEdit={...d,id:null,name:d.name+' copy',exercises:[...d.exercises],plan:d.plan.map(x=>({...x}))}; drawRoutineSheet(); toast('Copy made. Rename it and save.');},
 'r-save':b=>{const d=UI.rEdit; rSync(); d.name=d.name.trim()||'My routine'; if(!d.exercises.length){toast('Add at least one exercise'); return;}
   let r; if(d.id){r=S.routines.find(x=>x.id===d.id); r.name=d.name; r.exercises=d.exercises; r.plan=d.plan; delete r.sample;} else{r={id:uid(),name:d.name,exercises:d.exercises,plan:d.plan}; S.routines.push(r);}
   save(); closeSheet(); if(b.dataset.start) A['start-routine']({dataset:{id:r.id}}); else{render(); toast(`${r.name} saved`);}},
 'r-back':()=>drawRoutineSheet(),
 'r-del':()=>{snap(); S.routines=S.routines.filter(x=>x.id!==UI.rEdit.id); save(); closeSheet(); render(); toast('Routine deleted',true);},
 'rest-add':()=>{if(UI.rest){UI.rest.end+=15000; UI.rest.len+=15000; if(N) try{N.restStart(UI.rest.end,nextUp());}catch(e){}}}, 'rest-stop':()=>stopRest(), 'toast-act':()=>{const f=UI.toastFn; $('#toastwrap').innerHTML=''; if(f) f();},
 day:b=>{const d=+b.dataset.d; UI.foodDate=d?addDays(UI.foodDate,d):dkey(new Date()); render();},
 goday:b=>{UI.foodDate=b.dataset.k; render();},
 'add-food':b=>foodSheet(b.dataset.m),
 fcat:b=>{UI.fcat=b.dataset.k; UI.fq=''; const q=$('#food-q'); if(q) q.value=''; $('#fcats').innerHTML=fcatChips(); $('#fgrid').innerHTML=foodGrid();},
 'ft-add':b=>{const f=findFood(b.dataset.name); if(!f) return; const a=UI.added[f.name];
   if(a&&a.n>0){const x=(S.food[UI.foodDate]||[]).find(y=>y.id===a.id); if(x){x.qty=r1(x.qty+1); a.n++;}} else {const e=addFood(f,UI.mealFor); UI.added[f.name]={id:e.id,n:1,kcal:f.kcal};}
   save(); updAddSum();},
 'ft-sub':b=>{const a=UI.added[b.dataset.name]; if(!a) return; const list=S.food[UI.foodDate]||[], i=list.findIndex(y=>y.id===a.id); if(i>=0){if(list[i].qty>1){list[i].qty=r1(list[i].qty-1);} else list.splice(i,1);} a.n--; save(); updAddSum();},
 'qa-ic':b=>{UI.qaIc=b.dataset.k; document.querySelectorAll('#icpick button').forEach(x=>x.classList.toggle('on',x===b));},
 quick:b=>{const f=findFood(b.dataset.name); if(!f) return; snap(); const m=UI.foodDate===dkey(new Date())?mealNow():'snacks'; addFood(f,m); save(); render(); toast(f.name+' added to '+MEALS.find(x=>x[0]===m)[1].toLowerCase(),true);},
 'add-usual':b=>{const f=findFood(b.dataset.name); if(!f) return; snap(); addFood(f,b.dataset.m); save(); render(); toast(f.name+' added',true);},
 fedit:b=>editFood(b.dataset.id),
 'fe-qty':b=>{const x=curFood(); if(!x) return; x.qty=Math.max(0.25,Math.round((x.qty+ +b.dataset.d)*4)/4); save(); editFood(x.id);},
 'fe-set':b=>{const x=curFood(); if(!x) return; x.qty=+b.dataset.q; save(); editFood(x.id);},
 'fe-meal':b=>{const x=curFood(); if(!x) return; x.meal=b.dataset.m; save(); editFood(x.id);},
 'fe-del':()=>{const list=S.food[UI.foodDate]||[], i=list.findIndex(y=>y.id===UI.fedit); if(i<0) return; snap(); const n=list[i].name; list.splice(i,1); save(); closeSheet(); render(); toast(n+' removed',true);},
 'meal-menu':b=>mealMenu(b.dataset.m),
 'copy-y':b=>{const m=b.dataset.m; snap(); (S.food[addDays(UI.foodDate,-1)]||[]).filter(x=>x.meal===m).forEach(x=>addFood(x,m,x.qty)); save(); closeSheet(); render(); toast('Copied from the day before',true);},
 'save-meal':b=>{const m=b.dataset.m, items=(S.food[UI.foodDate]||[]).filter(x=>x.meal===m).map(({id,meal,...x})=>x); S.meals.push({id:uid(),name:($('#meal-name').value||'Meal').trim(),items}); save(); closeSheet(); toast('Meal saved');},
 'use-meal':b=>{const t=S.meals.find(x=>x.id===b.dataset.id); if(!t) return; t.items.forEach(x=>addFood(x,UI.mealFor,x.qty)); save(); closeSheet(); render(); toast(t.name+' added');},
 'del-meal':b=>{S.meals=S.meals.filter(x=>x.id!==b.dataset.id); save(); mealMenu(UI.mealFor);},
 'clear-meal':b=>{snap(); S.food[UI.foodDate]=(S.food[UI.foodDate]||[]).filter(x=>x.meal!==b.dataset.m); save(); closeSheet(); render(); toast('Meal cleared',true);},
 water:b=>{const k=UI.tab==='food'?UI.foodDate:dkey(new Date()); S.water[k]=Math.max(0,(S.water[k]||0)+ +b.dataset.ml); save(); render();},
 'log-weight':()=>weightSheet(),
 'save-weight':()=>{const d=$('#wt-d').value, v=parseFloat($('#wt-kg').value); if(!d||!(v>20&&v<400)){toast('Enter a weight in kg'); return;} S.weights=S.weights.filter(w=>w.d!==d); S.weights.push({d,kg:r1(v)}); S.profile.weight=latestWeight(); save(); closeSheet(); render(); toast('Weight saved');},
 'del-weight':b=>{snap(); S.weights=S.weights.filter(w=>w.d!==b.dataset.d); save(); render(); toast('Weigh-in deleted',true);},
 seg:b=>{UI.statSeg=b.dataset.s; render();},
 'save-cx':()=>{const n=$('#cx-name').value.trim(); if(!n){toast('Give it a name'); return;} const eq=$('#cx-e').value;
   const ex={id:'c_'+uid(),name:n,primary:[$('#cx-m').value],secondary:[],eq,custom:true,iso:$('#cx-iso').checked,bw:eq==='body',home:['body','furniture','dumbbell'].includes(eq),inc:eq==='dumbbell'?1:2.5,cue:'Your own exercise. Add form notes from the exercise menu.'};
   S.customEx.push(ex); rebuildEXI(); if(UI.pickFor==='routine'&&UI.rEdit){UI.rEdit.exercises.push(ex.id); UI.rEdit.plan.push(rDef(ex.id)); save(); drawRoutineSheet(); return;} addExercise(ex.id); save(); go('train');},
 export:()=>{const txt=JSON.stringify(S,null,1), m=$('#data-msg'), name='kintore-backup-'+dkey(new Date())+'.json';
   if(N){const r=JSON.parse(N.saveFile(name,txt)||'{}'); if(r.ok){m.textContent='Saved to '+r.path+'.'; toast('Backup saved to Downloads/Kintore',false,{label:'Share',fn:()=>N.share(txt,name)});} else m.textContent='Could not save: '+(r.error||'unknown error'); return;} const fb=()=>sheet('Backup',`<p class="note" style="margin-top:0">Select all and copy this somewhere safe.</p><textarea class="input" id="bk" rows="10" readonly>${esc(txt)}</textarea>`);
   if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(()=>{m.textContent='Backup copied ('+Math.round(txt.length/1024)+' KB).';},fb); else fb();},
 'import-open':()=>{if(N){nat('pickText').then(r=>{if(r.cancelled) return; if(r.error){toast('Could not open the file'); return;} try{const o=JSON.parse(r.text); if(!o||!o.profile||!Array.isArray(o.workouts)) throw 0; snap(); S=migrate(o); rebuildEXI(); applyTheme(); save(); flush(); closeSheet(); render(); toast('Backup restored',true);}catch(e){toast('That file is not a Kintore backup');}}); return;} sheet('Restore backup',`<p class="note" style="margin-top:0">Paste a Kintore backup. This replaces everything here.</p><textarea class="input" id="imp" rows="8"></textarea><div id="imp-msg" class="small neg" style="margin-top:6px"></div>`,`<button type="button" class="btn primary block" data-a="import">Restore</button>`);},
 import:()=>{try{const o=JSON.parse($('#imp').value); if(!o||!o.profile||!Array.isArray(o.workouts)) throw 0; snap(); S=migrate(o); rebuildEXI(); applyTheme(); save(); closeSheet(); render(); toast('Backup restored',true);}catch(e){$('#imp-msg').textContent='That is not a Kintore backup. Copy the whole text and paste again.';}},
 'check-update':()=>checkUpdates(true), 'install-apk':()=>installApk(),
 erase:b=>{if(!b.dataset.sure){b.dataset.sure=1; b.textContent='Tap again to erase'; return;} snap(); S=blank(); rebuildEXI(); applyTheme(); save(); closeSheet(); render(); toast('Everything erased',true);},
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]'); if(!b||b.disabled) return; const f=A[b.dataset.a]; if(f){e.preventDefault(); f(b,e);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&UI.sheet) closeSheet(); const t=e.target; if((e.key==='Enter'||e.key===' ')&&t.matches&&(t.matches('svg .m')||t.matches('.lrow[data-a]'))){e.preventDefault(); A[t.dataset.a](t);}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.f&&S.active){const s=S.active.exercises[+t.dataset.ei].sets[+t.dataset.si], v=parseFloat(t.value), f=t.dataset.f; if(f==='w') s.w=isNaN(v)?null:v; else if(f==='min'){s.min=isNaN(v)?null:v; if(s.done) s.r=Math.max(1,Math.round(v||0));} else if(f==='km') s.km=isNaN(v)?null:v; else s.r=isNaN(v)?0:Math.round(v); save(); const ck=$('#ck-'+t.dataset.ei+'-'+t.dataset.si); if(ck){const ex=EXI[S.active.exercises[+t.dataset.ei].exId]; ck.textContent=cardioKcal(ex,s)+' kcal';} return;}
  if(t.id==='w-title'&&S.active){S.active.name=t.value; save(); return;}
  if(t.id==='pick-q'){$('#pick-list').innerHTML=pickRows(t.value); mountFigs($('#pick-list')); return;}
  if(t.id==='food-q'){UI.fq=t.value; $('#fgrid').innerHTML=foodGrid(); return;}
  if(t.id==='qa-name'&&!UI.qaIc){const k=guessIcon(t.value); document.querySelectorAll('#icpick button').forEach(x=>x.classList.toggle('on',x.dataset.k===k)); return;}
  if(t.id==='ex-note'){const v=t.value.trim(); if(v) S.notes[t.dataset.ex]=v; else delete S.notes[t.dataset.ex]; save(); return;}
  if(t.dataset.p&&t.tagName==='INPUT'){const v=parseFloat(t.value); if(!isNaN(v)&&v>0){S.profile[t.dataset.p]=v; save(); const st=$('#set-stats'); if(st) st.innerHTML=statTiles(targets());}}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='prog-ex'){UI.progEx=t.value; render(); return;}
  if(t.id==='p-pethome'){S.profile.petHome=t.checked; save(); render(); return;}
  if(t.dataset.f==='w'&&UI.tab==='train'){render(); return;}
  if(t.dataset.p&&t.tagName==='SELECT'){S.profile[t.dataset.p]=t.dataset.p==='burn'?t.value==='1':t.value; save(); render(); const st=$('#set-stats'); if(st) st.innerHTML=statTiles(targets());}});
document.addEventListener('submit',e=>{if(e.target.id!=='qa') return; e.preventDefault();
  const n=$('#qa-name').value.trim(), kc=parseFloat($('#qa-kcal').value); if(!n||isNaN(kc)){toast('Add a name and calories'); return;}
  const num=id=>{const v=parseFloat($(id).value); return isNaN(v)?0:v;}, on=document.querySelector('#icpick button.on');
  const f={name:n,serving:$('#qa-serv').value.trim()||'1 serve',kcal:kc,p:num('#qa-p'),c:num('#qa-c'),f:num('#qa-f'),ic:UI.qaIc||(on?on.dataset.k:guessIcon(n))};
  if($('#qa-save').checked&&!S.myFoods.some(x=>x.name===f.name)) S.myFoods.unshift(f);
  const en=addFood(f,UI.mealFor); UI.added[f.name]={id:en.id,n:1,kcal:f.kcal}; save(); e.target.reset(); $('#qa-save').checked=true; UI.qaIc=null; updAddSum(); toast(f.name+' added');});
