"use strict";
/* ================= Workout check: is this session enough, balanced, and heavy enough? =================
   Rules of thumb used (evidence-based ranges, not hard limits):
   - Per muscle per session: about 4–10 hard sets for growth (3–8 for strength); weekly 10–20.
   - Secondary muscles count half a set.
   - Reps in reserve from your best estimated 1RM (Epley): reps to failure ≈ 30 × (e1RM ÷ weight − 1). */
const PUSH=['chest','shoulders','triceps'], PULL=['lats','traps','biceps'];
function sessionSets(items){const v={}; MUSCLES.forEach(m=>v[m.id]=0);
  items.forEach(({ex,n})=>{if(ex.cardio) return; ex.primary.forEach(m=>v[m]+=n); (ex.secondary||[]).forEach(m=>v[m]+=n*0.5);}); return v;}
function roundTo(w,inc){return Math.max(0,Math.round(w/inc)*inc);}
function checkWorkout(items){
  const goal=S.profile.train, lo=goal==='strength'?3:4, hi=goal==='strength'?8:10, out=[], have=new Set(items.map(i=>i.ex.id)), lift=items.filter(i=>!i.ex.cardio);
  if(!lift.length) return{out,v:{},total:0};
  const v=sessionSets(lift), wk=weekSets(), total=lift.reduce((a,i)=>a+i.n,0);
  const pick=(m,n=2)=>rankEx(new Set([m])).filter(e=>!have.has(e.id)&&e.primary.includes(m)).slice(0,n).map(e=>e.id);
  const trained=MUSCLES.filter(m=>lift.some(i=>i.ex.primary.includes(m.id)));
  trained.forEach(m=>{const n=v[m.id];
    if(n<lo) out.push({k:'warn',t:`${m.name}: ${r1(n)} set${n===1?'':'s'}. ${lo}–${hi} per session is the productive range, so add ${Math.ceil(lo-n)} or more.`,add:pick(m.id)});
    else if(n>hi+2) out.push({k:'tip',t:`${m.name}: ${r1(n)} sets is a lot for one session. Past about ${hi}, extra sets add more fatigue than growth. Consider moving some to another day.`});});
  // balance
  const push=PUSH.reduce((a,m)=>a+v[m],0), pull=PULL.reduce((a,m)=>a+v[m],0), wPush=PUSH.reduce((a,m)=>a+wk[m],0), wPull=PULL.reduce((a,m)=>a+wk[m],0);
  if(push>=5&&pull<1&&wPull<wPush*0.8) out.push({k:'tip',t:`No pulling today and your week is push-heavy (${Math.round(wPush)} push vs ${Math.round(wPull)} pull sets). A row keeps your shoulders healthy.`,add:pick('lats',1).concat(pick('traps',1))});
  if(v.quads>=4&&v.hamstrings<1.5&&wk.hamstrings<wk.quads*0.5) out.push({k:'tip',t:`Quads are getting ${r1(v.quads)} sets but hamstrings almost none. Add a hinge or curl.`,add:pick('hamstrings')});
  // weekly context
  trained.forEach(m=>{const after=wk[m.id]+(S.active?0:v[m.id]); if(after<10&&v[m.id]>=lo) out.push({k:'info',t:`${m.name} will be at ${r1(after)} sets this week. 10–20 a week is the usual range for growth.`});});
  // load check from history
  lift.forEach(i=>{const ex=i.ex, s=i.sets||[], w=Math.max(0,...s.map(x=>x.w||0)); if(!(w>0)||ex.timed) return; const e1=bestE1(ex.id); if(!(e1>0)) return;
    const g=rx(ex), reps=Math.max(...s.map(x=>x.r||0))||g.lo, rtf=30*(e1/w-1), rir=Math.round(rtf-reps), inc=ex.inc||stepFor(ex), good=roundTo(e1/(1+(reps+2)/30),inc);
    if(rir>4) out.push({k:'warn',t:`${ex.name} at ${kg(w)} kg × ${reps} looks light: about ${rir} reps in reserve from your best e1RM of ${r1(e1)} kg. Try ${kg(good)} kg.`,w:{id:ex.id,kg:good}});
    else if(rir<0) out.push({k:'warn',t:`${ex.name} at ${kg(w)} kg × ${reps} is above what your best e1RM (${r1(e1)} kg) predicts. Try ${kg(good)} kg, or aim for ${Math.max(1,Math.floor(rtf)-1)} reps.`,w:{id:ex.id,kg:good}});
    else out.push({k:'good',t:`${ex.name} at ${kg(w)} kg × ${reps}: about ${Math.max(0,rir)} reps in reserve. Right in the useful 0–3 zone.`});});
  // size of the session
  const mins=Math.round(total*(restFor({})/60+0.75));
  if(total<9) out.push({k:'info',t:`${total} working sets, about ${mins} min. Fine when short on time. For growth most sessions land around 12–20 sets.`});
  else if(total>28) out.push({k:'tip',t:`${total} working sets (about ${mins} min). Quality drops late in long sessions. Consider splitting it.`});
  if(lift.length>=2&&lift.every(i=>!i.ex.iso)&&goal!=='strength'){const top=trained.slice().sort((a,b)=>v[b.id]-v[a.id])[0]; const iso=top?rankEx(new Set([top.id])).filter(e=>e.iso&&!have.has(e.id)).slice(0,1).map(e=>e.id):[]; if(iso.length) out.push({k:'info',t:`All compounds so far. An isolation finisher for ${top.name.toLowerCase()} adds volume with little extra fatigue.`,add:iso});}
  if(!out.some(o=>o.k==='warn')) out.unshift({k:'good',t:'Solid session: every muscle you are training gets a productive amount of work.'});
  return{out,v,total,mins};}
function checkHTML(c,ctx){if(!c.out.length) return '';
  const chips=Object.entries(c.v).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]).map(([m,n])=>`<span class="chip ${n>=(S.profile.train==='strength'?3:4)?'p':''}">${MN[m]} ${r1(n)}</span>`).join('');
  const ic={good:IC.check,warn:'!',tip:'↻',info:'i'};
  return`<div class="chips wrapc" style="margin-bottom:6px">${chips}</div>${c.out.map(o=>`<div class="ckl ${o.k}"><span class="cki">${ic[o.k]}</span><div class="grow small">${esc(o.t)}${(o.add||[]).length?`<div class="chips wrapc" style="margin-top:6px">${o.add.map(id=>`<button type="button" class="chip" data-a="${ctx==='routine'?'r-check-add':'add-ex'}" data-ex="${id}">${IC.plus}${esc(EXI[id].name)}</button>`).join('')}</div>`:''}${o.w&&ctx!=='routine'?`<button type="button" class="chip" style="margin-top:6px" data-a="ck-weight" data-ex="${o.w.id}" data-kg="${o.w.kg}">Use ${kg(o.w.kg)} kg</button>`:''}</div></div>`).join('')}`;}
function checkCard(){const a=S.active; if(!a||!a.exercises.length) return '';
  const items=a.exercises.map(e=>({ex:EXI[e.exId],n:e.sets.filter(s=>!s.warm).length,sets:e.sets.filter(s=>!s.warm)})).filter(i=>i.ex);
  const c=checkWorkout(items); if(!c.out.length) return '';
  const open=UI.ckOpen!==false;
  return`<div class="card ckcard"><button type="button" class="card-h ckh" data-a="ck-toggle" aria-expanded="${open}"><span>Workout check</span><span>${c.total} sets · ~${c.mins} min ${open?'▴':'▾'}</span></button>${open?`<div class="card-b">${checkHTML(c,'active')}</div>`:''}</div>`;}
function routineCheck(){const d=UI.rEdit; if(!d||!d.exercises.length) return '';
  const items=d.exercises.map(id=>({ex:EXI[id],n:EXI[id]&&EXI[id].cardio?1:3})).filter(i=>i.ex), c=checkWorkout(items);
  return c.out.length?`<div class="card ckcard" style="margin-top:12px"><div class="card-h"><span>Routine check</span><span>3 sets each · ~${c.mins} min</span></div><div class="card-b">${checkHTML(c,'routine')}</div></div>`:'';}
Object.assign(A,{
 'ck-toggle':()=>{UI.ckOpen=UI.ckOpen===false; render();},
 'ck-weight':b=>{const e=S.active.exercises.find(x=>x.exId===b.dataset.ex); if(!e) return; e.sets.forEach(s=>{if(!s.done&&!s.warm) s.w=+b.dataset.kg;}); save(); render(); toast(`Remaining sets set to ${b.dataset.kg} kg`);},
 'r-check-add':b=>{UI.rEdit.name=($('#r-name')||{}).value||UI.rEdit.name; UI.rEdit.exercises.push(b.dataset.ex); drawRoutineSheet();},
});
