"use strict";
/* ================= Me: profile, goals, body fat, daily targets ================= */
const BF_CAT={m:[[6,'Essential'],[14,'Athletic'],[18,'Fit'],[25,'Average'],[999,'High']],f:[[14,'Essential'],[21,'Athletic'],[25,'Fit'],[32,'Average'],[999,'High']]};
const bfCategory=(pct,sex)=>(BF_CAT[sex]||BF_CAT.m).find(([hi])=>pct<hi)[1];
/* US Navy tape method (Hodgdon & Beckett), inputs in cm. */
function navyBF(sex,height,neck,waist,hip){
  if(!(height>0&&neck>0&&waist>0)) return null;
  const L=Math.log10; let v;
  if(sex==='f'){if(!(hip>0)||waist+hip-neck<=0) return null; v=495/(1.29579-0.35004*L(waist+hip-neck)+0.221*L(height))-450;}
  else{if(waist-neck<=0) return null; v=495/(1.0324-0.19077*L(waist-neck)+0.15456*L(height))-450;}
  return isFinite(v)&&v>2&&v<60?Math.round(v*10)/10:null;}
function bodyComp(){const bf=bodyFat(), w=latestWeight(), h=S.profile.height/100; if(!bf) return null;
  const lbm=w*(1-bf.pct/100), fat=w-lbm, ffmi=lbm/(h*h)+6.1*(1.8-h);
  return{bf,w,lbm:r1(lbm),fat:r1(fat),ffmi:r1(ffmi),cat:bfCategory(bf.pct,S.profile.sex)};}
function targetTiles(t){const wg=S.profile.waterL, sg=S.profile.stepGoal||10000;
  return`<div class="tile"><div class="l">Calories</div><div class="v">${t.kcal}<small> kcal</small></div><div class="s">maintenance ${t.tdee}</div></div>
   <div class="tile"><div class="l">Protein</div><div class="v">${t.prot}<small> g</small></div><div class="s">${t.protFrom}</div></div>
   <div class="tile"><div class="l">Carbs · fat</div><div class="v">${t.carb}<small> · ${t.fat} g</small></div><div class="s">fat at 25% of calories</div></div>
   <div class="tile"><div class="l">Water · steps</div><div class="v">${wg}<small> L · ${(sg/1000).toLocaleString()}k</small></div><div class="s">set below</div></div>`;}
function goalNote(k,bc){const sex=S.profile.sex;
  if(k==='recomp'){const hi=bc?bc.bf.pct:null, good=hi==null?null:hi>(sex==='m'?15:24);
    return`Eat at maintenance with ${DIET.recomp.pro} g protein per kg, train for growth and push progressive overload. Weight stays within about ±0.5 kg while your waist drops and lifts go up. ${hi==null?'Works best if you are fairly new to lifting or carry some extra fat. Measure body fat below to check.':good?`At ${hi}% body fat a recomp is a good fit.`:`At ${hi}% body fat progress will be slow. A small lean bulk usually builds muscle faster.`}`;}
  if(k==='cut'||k==='slowcut') return 'Keep lifting heavy and protein high so the weight you lose is mostly fat. Check the 7-day average weight each week rather than daily numbers.';
  if(k==='leangain'||k==='bulk') return 'Aim for the stated rate on the 7-day average. Faster than that is mostly fat. Increase calories by 100–150 if the average is flat for two weeks.';
  return 'Hold the 7-day average steady. Adjust calories by 100–150 if it drifts for two weeks.';}
function vMe(){const p=S.profile, t=targets(), bc=bodyComp(), w7=avgWeight(7), sel=(id,obj,cur)=>`<select class="input" id="${id}" data-p="${id.slice(2)}">${Object.entries(obj).map(([k,v])=>`<option value="${k}" ${k===cur?'selected':''}>${Array.isArray(v)?v[0]:v.label}</option>`).join('')}</select>`;
  const sp=S.pet?S.pet.species:'duck', hist=(S.bodyfat||[]).slice().sort((a,b)=>b.d.localeCompare(a.d));
  let o=`<div class="split"><div class="col"><div class="mehead"><div class="meav">${petAvatar(sp,'happy')}</div><div><h2 class="hello" style="margin:0">Ethan</h2><p class="sub" style="margin:2px 0 0">${p.sex==='m'?'Male':'Female'} · ${p.age} · ${p.height} cm · ${w7?r1(w7):latestWeight()} kg</p></div></div>`;
  // goal
  o+=`<div class="card"><div class="card-h"><span>Goal</span><span>${DIET[p.diet].label}</span></div><div class="card-b"><div class="goalgrid">${Object.entries(DIET).map(([k,g])=>`<button type="button" class="goalc ${p.diet===k?'on':''}" data-a="me-goal" data-k="${k}"><b>${g.label}</b><span>${g.sub}</span><i>${g.kcal>0?'+':''}${g.kcal?g.kcal+' kcal':'±0 kcal'}</i></button>`).join('')}</div>
   <p class="note" style="margin-bottom:10px">${goalNote(p.diet,bc)}</p>
   <div class="lbl" style="margin-bottom:6px">Training focus</div><div class="seg">${Object.entries(GOALS).map(([k,g])=>`<button type="button" class="${p.train===k?'on':''}" data-a="me-train" data-k="${k}">${g.label}</button>`).join('')}</div>
   <div class="seg" role="group" aria-label="Where you train">${[['gym','Gym'],['home','Home']].map(([k,l])=>`<button type="button" class="${p.place===k?'on':''}" data-a="place" data-k="${k}">${l}</button>`).join('')}</div></div></div>`;
  // targets
  o+=`<div class="card"><div class="card-h"><span>Daily targets</span></div><div class="card-b"><div class="tiles" id="set-stats">${targetTiles(t)}</div><p class="note" style="margin:0">Base burn ${t.bmr} kcal from ${t.bmrFrom}, times your activity level. Workouts and cardio are added on the day${p.burn?'':' (turned off in Settings)'}.</p></div></div>`;
  o+=`</div><div class="col">`;
  // body composition
  o+=`<div class="card"><div class="card-h"><span>Body fat</span><button type="button" class="more" data-a="bf-open">+ Measure</button></div><div class="card-b">`;
  if(bc){o+=`<div class="row" style="gap:16px">${ring('',Math.min(100,bc.bf.pct*2.5),`<b>${bc.bf.pct}</b><span>% fat</span>`)}<div class="grow"><div class="bfscale">${bfScale(bc.bf.pct)}</div><div class="small ink2" style="margin-top:6px"><b>${bc.cat}</b> for ${p.sex==='m'?'men':'women'}</div></div></div>
     <div class="tiles" style="margin-top:12px"><div class="tile"><div class="l">Lean mass</div><div class="v">${bc.lbm}<small> kg</small></div></div><div class="tile"><div class="l">Fat mass</div><div class="v">${bc.fat}<small> kg</small></div></div>
     <div class="tile"><div class="l">FFMI</div><div class="v">${bc.ffmi}</div><div class="s">${bc.ffmi<18?'room to build':bc.ffmi<20?'trained':bc.ffmi<22?'well trained':bc.ffmi<25?'very muscular':'elite'}</div></div><div class="tile"><div class="l">Measured</div><div class="v" style="font-size:16px">${fmtD(bc.bf.d+'T12:00',{day:'numeric',month:'short'})}</div><div class="s">${bc.bf.method==='navy'?'tape (US Navy)':'scale / scan'}</div></div></div>`;
    if(hist.length>1){const a=hist[hist.length-1], b=hist[0], d=r1(b.pct-a.pct); o+=`<p class="note" style="margin-bottom:0">${d<=0?'Down':'Up'} ${Math.abs(d)} points since ${fmtD(a.d+'T12:00',{day:'numeric',month:'short'})}. Re-measure every 2–4 weeks, same time of day.</p>`;}}
  else o+=`<div class="row" style="gap:12px"><div style="width:64px;flex:none">${petAvatar(sp,'content')}</div><div class="small ink2">Measure with a tape (neck and waist${p.sex==='f'?' and hips':''}) or enter a number from a scale or DEXA scan. Kintore then uses your lean mass for calories and protein.</div></div><button type="button" class="btn primary block" style="margin-top:10px" data-a="bf-open">Measure body fat</button>`;
  o+=`</div></div>`;
  if(hist.length) o+=`<div class="card"><div class="card-b" style="padding-top:4px">${hist.slice(0,6).map(h=>`<div class="lrow"><div class="t"><b>${h.pct}%</b><span>${fmtD(h.d+'T12:00')}${h.waist?` · waist ${h.waist} cm`:''}</span></div><button type="button" class="iconbtn sm" data-a="bf-del" data-d="${h.d}" aria-label="Delete">${IC.close}</button></div>`).join('')}</div></div>`;
  // profile
  o+=`<div class="card"><div class="card-h"><span>About you</span><button type="button" class="more" data-a="log-weight">+ Weight</button></div><div class="card-b">
   <div class="g3"><div class="field"><label for="p-sex">Sex</label><select class="input" id="p-sex" data-p="sex"><option value="m" ${p.sex==='m'?'selected':''}>Male</option><option value="f" ${p.sex==='f'?'selected':''}>Female</option></select></div>
    <div class="field"><label for="p-age">Age</label><input class="input" id="p-age" data-p="age" inputmode="numeric" value="${p.age}"></div><div class="field"><label for="p-height">Height cm</label><input class="input" id="p-height" data-p="height" inputmode="decimal" value="${p.height}"></div></div>
   <div class="field"><label for="p-activity">Activity outside the gym</label>${sel('p-activity',ACT,p.activity)}</div>
   <div class="g2"><div class="field"><label for="p-waterL">Water goal L</label><input class="input" id="p-waterL" data-p="waterL" inputmode="decimal" value="${p.waterL}"></div><div class="field"><label for="p-stepGoal">Step goal</label><input class="input" id="p-stepGoal" data-p="stepGoal" inputmode="numeric" value="${p.stepGoal}"></div></div>
   <p class="note" style="margin:0">Bodyweight is your 7-day average from weigh-ins.</p></div></div>`;
  return o+'</div></div>';}
function bfScale(pct){const C=BF_CAT[S.profile.sex]||BF_CAT.m, max=40, x=Math.min(100,pct/max*100);
  let prev=0; return`<div class="bfbar">${C.map(([hi,l])=>{const w=(Math.min(hi,max)-prev)/max*100; prev=Math.min(hi,max); return`<i style="width:${w}%" title="${l}"></i>`;}).join('')}<b style="left:${x}%"></b></div><div class="bflab">${C.slice(0,4).map(([hi])=>`<span style="left:${hi/max*100}%">${hi}</span>`).join('')}</div>`;}
function bfSheet(mode){UI.bfMode=mode||UI.bfMode||'navy'; const p=S.profile, last=(S.bodyfat||[]).slice().sort((a,b)=>b.d.localeCompare(a.d))[0]||{};
  const f=(id,l,v,ph)=>`<div class="field"><label for="${id}">${l}</label><input class="input" id="${id}" inputmode="decimal" value="${v??''}" placeholder="${ph||''}"></div>`;
  sheet('Body fat',`<div class="seg">${[['navy','Tape measure'],['manual','Scale or scan']].map(([k,l])=>`<button type="button" class="${UI.bfMode===k?'on':''}" data-a="bf-mode" data-k="${k}">${l}</button>`).join('')}</div>
   ${UI.bfMode==='navy'?`<p class="note" style="margin-top:0">Measure in cm, relaxed, in the morning. Neck just below the Adam’s apple. ${p.sex==='m'?'Waist at the belly button.':'Waist at the narrowest point, hips at the widest.'}</p>
    <div class="g3">${f('bf-neck','Neck',last.neck,'38')}${f('bf-waist','Waist',last.waist,'84')}${p.sex==='f'?f('bf-hip','Hips',last.hip,'98'):`<div class="field"><label>Height</label><input class="input" value="${p.height} cm" disabled></div>`}</div>`
   :`<p class="note" style="margin-top:0">From a smart scale, calipers or a DEXA scan. Use the same method each time so the trend means something.</p>${f('bf-pct','Body fat %','', '18.5')}`}
   <div class="bfres" id="bf-res"></div>`,`<button type="button" class="btn primary block" data-a="bf-save">Save</button>`); bfPreview();}
function bfValue(){if(UI.bfMode==='manual'){const v=parseFloat(($('#bf-pct')||{}).value); return v>2&&v<60?r1(v):null;}
  const n=parseFloat($('#bf-neck').value), w=parseFloat($('#bf-waist').value), h=$('#bf-hip')?parseFloat($('#bf-hip').value):0; return navyBF(S.profile.sex,S.profile.height,n,w,h);}
function bfPreview(){const el=$('#bf-res'); if(!el) return; const v=bfValue(), w=latestWeight();
  el.innerHTML=v==null?'<span class="small muted">Fill in the measurements to see your estimate.</span>':`<div class="row" style="gap:14px">${ring('sm',Math.min(100,v*2.5),`<b>${v}</b>`)}<div class="small"><b>${v}% · ${bfCategory(v,S.profile.sex)}</b><div class="ink2">Lean ${r1(w*(1-v/100))} kg · fat ${r1(w*v/100)} kg</div>${UI.bfMode==='navy'?'<div class="tiny muted">Tape methods are usually within about 3–4 points of a DEXA scan.</div>':''}</div></div>`;}
Object.assign(A,{
 'me-goal':b=>{S.profile.diet=b.dataset.k; save(); render(); toast(`Goal: ${DIET[b.dataset.k].label}. Targets updated.`);},
 'me-train':b=>{S.profile.train=b.dataset.k; save(); render();},
 'bf-open':()=>bfSheet(), 'bf-mode':b=>bfSheet(b.dataset.k),
 'bf-save':()=>{const v=bfValue(); if(v==null){toast('Check the measurements'); return;} const d=dkey(new Date()), e={d,pct:v,method:UI.bfMode};
   if(UI.bfMode==='navy'){e.neck=parseFloat($('#bf-neck').value); e.waist=parseFloat($('#bf-waist').value); if($('#bf-hip')) e.hip=parseFloat($('#bf-hip').value);}
   S.bodyfat=(S.bodyfat||[]).filter(x=>x.d!==d); S.bodyfat.push(e); save(); closeSheet(); render(); toast(`Body fat ${v}% saved. Targets now use your lean mass.`);},
 'bf-del':b=>{snap(); S.bodyfat=(S.bodyfat||[]).filter(x=>x.d!==b.dataset.d); save(); render(); toast('Entry deleted',true);},
});
document.addEventListener('input',e=>{if(/^bf-/.test(e.target.id)) bfPreview();});
