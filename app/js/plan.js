"use strict";
/* ================= Plans and schedules ================= */
const ROUTINE_DEF={
 'Push':['bench','ohp','incline','lateral','pushdown'],'Pull':['pullup','row','cablerow','curl','shrug'],'Legs':['squat','rdl','legpress','legcurl','calf'],
 'Upper':['bench','row','ohp','pulldown','curl','pushdown'],'Lower':['squat','rdl','legpress','legcurl','calf','crunch'],
 'Full body':['squat','bench','row','ohp','rdl','plank'],
 'Home upper':['pushup','invrow','pike','chairdip','curl','plank'],'Home lower':['bulgarian','glutebridge','slrdl','wallsit','slcalf','crunch'],
 'Home full body':['bwsquat','pushup','invrow','bulgarian','pike','glutebridge','plank']};
const PLAN_TPL={
 ppl:{name:'Push Pull Legs',desc:'6 days a week. The classic for building muscle.',days:{1:'Push',2:'Pull',3:'Legs',4:'Push',5:'Pull',6:'Legs'},fig:'bench'},
 ul:{name:'Upper / Lower',desc:'4 days a week. Strength and size with recovery days.',days:{1:'Upper',2:'Lower',4:'Upper',5:'Lower'},fig:'squat'},
 fb3:{name:'Full body ×3',desc:'3 days a week. Great to start or when busy.',days:{1:'Full body',3:'Full body',5:'Full body'},fig:'deadlift'},
 home3:{name:'Home 3-day',desc:'3 days, no gym needed. A chair and a table.',days:{1:'Home upper',3:'Home lower',5:'Home full body'},fig:'pushup'}};
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], WD_ORDER=[1,2,3,4,5,6,0];
function ensureRoutine(name){let r=S.routines.find(x=>x.name===name); if(!r){r={id:uid(),name,exercises:(ROUTINE_DEF[name]||[]).filter(id=>EXI[id])}; S.routines.push(r);} return r;}
function mondayOf(k){const d=new Date(k+'T12:00'); return addDays(k,-((d.getDay()+6)%7));}
function applyTemplate(key,weeks){const tp=PLAN_TPL[key], days={};
  Object.entries(tp.days).forEach(([wd,name])=>{days[wd]=ensureRoutine(name).id;});
  S.plan={tpl:key,name:tp.name,start:mondayOf(dkey(new Date())),weeks:weeks||8,days,remind:S.plan?S.plan.remind:'18:00'};
  if(key==='home3') S.profile.place='home'; save(); syncReminders();}
function scheduledOn(k){if(!S.plan) return null; if(k<S.plan.start) return null; const id=S.plan.days[new Date(k+'T12:00').getDay()]; return id?S.routines.find(r=>r.id===id)||null:null;}
const workedOn=k=>S.workouts.some(w=>dkey(w.start)===k);
function dayState(k){const t=dkey(new Date()), r=scheduledOn(k), done=workedOn(k)||(k===t&&S.active&&S.active.exercises.some(e=>doneSets(e).length));
  if(done) return{r,state:'done'}; if(!r) return{r,state:'rest'}; if(k===t) return{r,state:'today'}; return{r,state:k<t?'missed':'upcoming'};}
function planWeek(){if(!S.plan) return 0; return Math.floor((new Date(dkey(new Date())+'T12:00')-new Date(S.plan.start+'T12:00'))/(7*DAY))+1;}
function adherence(){if(!S.plan) return null; let sch=0,done=0; const t=dkey(new Date()); for(let k=S.plan.start;k<t;k=addDays(k,1)){if(scheduledOn(k)){sch++; if(workedOn(k)) done++;}} return sch?{pct:Math.round(done/sch*100),done,sch}:null;}
function weekStrip(){const t=dkey(new Date()), mon=mondayOf(t);
  return`<div class="wkplan">${[...Array(7)].map((_,i)=>{const k=addDays(mon,i), {r,state}=dayState(k);
    const ic=state==='done'?IC.check:state==='missed'?IC.close:state==='rest'?'<span class="zz">z</span>':'<span class="dotc"></span>';
    return`<button type="button" class="wkd ${state} ${k===t?'now':''}" data-a="plan-day" data-wd="${new Date(k+'T12:00').getDay()}" aria-label="${WD[new Date(k+'T12:00').getDay()]}: ${r?esc(r.name):'rest'}, ${state}"><span class="d">${'MTWTFSS'[i]}</span><span class="ic">${ic}</span><span class="nm">${r?esc(r.name.replace('Home ','')):'Rest'}</span></button>`;}).join('')}</div>`;}
function planCard(){const p=S.plan; if(!p) return '';
  const wk=planWeek(), ad=adherence(), deload=wk>0&&wk%4===0;
  return`<div class="card"><div class="card-h"><span>Your plan</span><button type="button" class="more" data-a="plan-pick">Change</button></div><div class="card-b">
   <div class="row between"><b style="font-size:18px">${esc(p.name)}</b><span class="tag">${wk>p.weeks?'Plan complete':`Week ${Math.max(1,wk)} of ${p.weeks}`}</span></div>
   <div class="pbar" style="margin:8px 0 12px"><i style="width:${Math.min(100,(wk-1)/p.weeks*100+100/p.weeks/2)}%"></i></div>
   ${weekStrip()}
   <div class="row between small" style="margin-top:12px"><span class="ink2">${ad?`On plan ${ad.pct}% · ${ad.done}/${ad.sch} sessions`:'First week. Let’s go.'}</span>
    <button type="button" class="chip" data-a="plan-remind">${IC.bell} ${p.remind?`Reminder ${p.remind}`:'No reminder'}</button></div>
   ${deload?`<p class="note" style="margin-bottom:0">Week ${wk} is a deload week: use about 10% lighter weights and stop 3 reps short of failure.</p>`:''}</div></div>`;}
function planPicker(){sheet('Pick a plan',`<p class="note" style="margin-top:0">A weekly schedule becomes your regime: Today shows the session, reminders nudge you, and the strip tracks every day.</p>
  <div class="tplgrid">${Object.entries(PLAN_TPL).map(([k,tp])=>`<button type="button" class="tplc ${S.plan&&S.plan.tpl===k?'on':''}" data-a="plan-apply" data-k="${k}"><div class="fig" data-fig="${tp.fig}" style="cursor:inherit"></div><b>${tp.name}</b><span>${tp.desc}</span><span class="wkmini">${WD_ORDER.map(wd=>`<i class="${tp.days[wd]?'on':''}">${WD[wd][0]}</i>`).join('')}</span></button>`).join('')}</div>
  <div class="field" style="margin-top:12px"><label for="plan-weeks">Length</label><select class="input" id="plan-weeks">${[4,6,8,12].map(w=>`<option value="${w}" ${(S.plan?S.plan.weeks:8)===w?'selected':''}>${w} weeks</option>`).join('')}</select></div>
  ${S.plan?`<button type="button" class="btn danger block" data-a="plan-clear">Stop following a plan</button>`:''}`);}
function planDaySheet(wd){const cur=S.plan.days[wd]||'';
  sheet(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][wd],
   `<div class="lrow"><div class="t"><b>Rest day</b><span>Walk with your pet instead</span></div><button type="button" class="btn sm ${!cur?'primary':''}" data-a="plan-set" data-wd="${wd}" data-id="">${!cur?'Selected':'Choose'}</button></div>
   ${S.routines.map(r=>`<div class="lrow"><div class="fig" data-fig="${EXI[r.exercises[0]]?r.exercises[0]:'squat'}" style="width:48px;flex:none;cursor:default"></div><div class="t"><b>${esc(r.name)}</b><span>${r.exercises.length} exercises</span></div><button type="button" class="btn sm ${cur===r.id?'primary':''}" data-a="plan-set" data-wd="${wd}" data-id="${r.id}">${cur===r.id?'Selected':'Choose'}</button></div>`).join('')}`);}
function remindSheet(){const p=S.plan;
  sheet('Reminders',`<div class="field"><label for="rem-time">Workout reminder on plan days</label><input class="input" id="rem-time" type="time" value="${p&&p.remind?p.remind:'18:00'}"></div>
   <label class="row small" style="margin-bottom:12px"><input type="checkbox" id="rem-on" ${p&&p.remind?'checked':''}> Remind me</label>
   <div class="field"><label for="walk-time">Walk nudge if ${S.pet?esc(S.pet.name):'your pet'} is behind</label><input class="input" id="walk-time" type="time" value="${S.profile.walkNudge||'19:00'}"></div>
   <label class="row small"><input type="checkbox" id="walk-on" ${S.profile.walkNudge!==''?'checked':''}> Nudge me when I'm under 70% of my step goal</label>
   ${N&&typeof N.setReminders==='function'?'':`<p class="note">${typeof IOS!=='undefined'&&IOS?'iPhone web apps can’t schedule notifications. Kintore saves these times, and you can set the same ones in the Clock or Reminders app.':'Reminders work in the Android app.'}</p>`}`,`<button type="button" class="btn primary block" data-a="remind-save">Save</button>`);}
const askNotif=()=>{if(N&&typeof N.askNotifications==='function') try{N.askNotifications();}catch(e){}};
function syncReminders(){if(!N||typeof N.setReminders!=='function') return; const items=[];
  if(S.plan&&S.plan.remind) Object.entries(S.plan.days).forEach(([wd,id])=>{const r=S.routines.find(x=>x.id===id); if(r) items.push({kind:'workout',weekday:+wd,time:S.plan.remind,title:`${r.name} day`,text:`${r.exercises.length} exercises today. Tap to start.`});});
  if(S.pet&&S.profile.walkNudge!==''){const P=S.pet, mi=P.away?0:streakInfo().missed;
    items.push({kind:'walk',weekday:-1,time:S.profile.walkNudge||'19:00',title:P.away?`${P.name} is still missing`:mi>=RUN_AT-2?`${P.name} is packing a bag`:`${P.name} wants a walk`,
      text:P.away?'Hit your step goal today to keep searching.':mi>=RUN_AT-2?`${RUN_AT-mi} more missed day${RUN_AT-mi>1?'s':''} and ${P.name} runs away.`:'You’re behind on steps today.',goal:stepGoal()});}
  try{N.setReminders(JSON.stringify(items));}catch(e){}}
Object.assign(A,{
 'plan-pick':()=>planPicker(),
 'plan-apply':b=>{const w=+(($('#plan-weeks')||{}).value||8); applyTemplate(b.dataset.k,w); askNotif(); closeSheet(); render(); toast(`${PLAN_TPL[b.dataset.k].name} is your plan`);},
 'plan-clear':()=>{snap(); S.plan=null; save(); syncReminders(); closeSheet(); render(); toast('Plan stopped',true);},
 'plan-day':b=>{if(!S.plan) return planPicker(); planDaySheet(+b.dataset.wd);},
 'plan-set':b=>{const wd=+b.dataset.wd; if(b.dataset.id) S.plan.days[wd]=b.dataset.id; else delete S.plan.days[wd]; S.plan.tpl='custom'; save(); syncReminders(); closeSheet(); render();},
 'plan-remind':()=>remindSheet(),
 'remind-save':()=>{const on=$('#rem-on').checked, t=$('#rem-time').value||'18:00'; if(S.plan) S.plan.remind=on?t:null; S.profile.walkNudge=$('#walk-on').checked?($('#walk-time').value||'19:00'):''; save(); syncReminders(); if(on||S.profile.walkNudge) askNotif(); closeSheet(); render(); toast('Reminders saved');},
 'trainseg':b=>{UI.trainSeg=b.dataset.s; render();},
});
document.addEventListener('change',e=>{if(e.target.id==='plan-weeks'&&S.plan){S.plan.weeks=+e.target.value; save();}});
