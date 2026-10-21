"use strict";
/* ================= iPhone / web version: install, offline, gestures, haptics, sound, steps from Shortcuts =================
   Everything here is skipped inside the Android app, which has native versions of these. */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const STANDALONE=!!(navigator.standalone||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches));
if(!N){
  document.documentElement.classList.toggle('ios',IOS); document.documentElement.classList.toggle('standalone',STANDALONE);
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}

  /* --- haptics: Android web has vibrate; iOS 18+ Safari ticks when a switch toggles --- */
  let hapEl=null;
  window.webHaptic=kind=>{try{
    if(navigator.vibrate){navigator.vibrate(kind==='long'?[0,120,60,120]:kind==='confirm'?18:10); return;}
    if(!IOS) return; if(!hapEl){hapEl=document.createElement('label'); hapEl.style.cssText='position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';
      hapEl.innerHTML='<input type="checkbox" switch tabindex="-1" aria-hidden="true">'; document.body.appendChild(hapEl);}
    hapEl.click(); if(kind==='long') setTimeout(()=>hapEl.click(),120);}catch(e){}};

  /* --- a soft chime when rest ends (sound must be unlocked by a tap first on iOS) --- */
  let actx=null;
  const unlockAudio=()=>{try{if(!actx){const AC=window.AudioContext||window.webkitAudioContext; if(AC) actx=new AC();} if(actx&&actx.state==='suspended') actx.resume();}catch(e){}};
  document.addEventListener('pointerdown',unlockAudio,{passive:true});
  window.webChime=()=>{try{if(!actx) return; const t=actx.currentTime; [880,1175].forEach((f,i)=>{const o=actx.createOscillator(), g=actx.createGain(); o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t+i*.16); g.gain.exponentialRampToValueAtTime(0.25,t+i*.16+.02); g.gain.exponentialRampToValueAtTime(0.0001,t+i*.16+.5); o.connect(g).connect(actx.destination); o.start(t+i*.16); o.stop(t+i*.16+.55);});}catch(e){}};

  /* --- keep the screen awake during a workout --- */
  let wake=null;
  window.webKeepAwake=on=>{try{if(!('wakeLock' in navigator)) return; if(on&&!wake&&document.visibilityState==='visible') navigator.wakeLock.request('screen').then(w=>{wake=w; w.addEventListener('release',()=>{wake=null;});}).catch(()=>{}); else if(!on&&wake){wake.release(); wake=null;}}catch(e){}};

  /* --- theme colour for the status bar / browser chrome --- */
  window.webThemeColor=()=>{const m=document.querySelector('meta[name="theme-color"]'); if(m) m.content=getComputedStyle(document.documentElement).getPropertyValue('--paper').trim()||'#E7E7E4';};
  webThemeColor();

  /* --- swipe down on a sheet to close it; swipe in from the left edge to go back --- */
  let drag=null;
  const sheetEl=()=>$('#sheet');
  document.addEventListener('touchstart',e=>{if(e.touches.length!==1) return; const t=e.touches[0], target=e.target;
    if(UI.sheet&&sheetEl().contains(target)){const body=$('#sheet-b'), onHead=!!target.closest('.grab,.sheet-h'), atTop=!body||body.scrollTop<=0;
      if(target.closest('input,textarea,select,.wkplan,.chips')&&!onHead) return;
      if(onHead||atTop) drag={kind:'sheet',y0:t.clientY,x0:t.clientX,t0:Date.now(),dy:0,on:false}; return;}
    if(!UI.sheet&&t.clientX<22) drag={kind:'back',x0:t.clientX,y0:t.clientY,dx:0};},{passive:true});
  const onMove=e=>{if(!drag) return; const t=e.touches[0];
    if(drag.kind==='sheet'){const dy=t.clientY-drag.y0, dx=Math.abs(t.clientX-drag.x0);
      if(!drag.on){if(dy>8&&dy>dx) drag.on=true; else if(dy<-4||dx>12){drag=null; return;} else return;}
      drag.dy=Math.max(0,dy); const s=sheetEl(); s.style.transition='none'; s.style.transform=`translateY(${drag.dy}px)`+(innerWidth>=720?' translateX(-50%)':''); $('#sheetwrap .scrim').style.opacity=String(Math.max(0,1-drag.dy/400));
      if(e.cancelable) e.preventDefault();}
    else drag.dx=t.clientX-drag.x0;};
  $('#sheetwrap').addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('touchmove',e=>{if(drag&&drag.kind==='back') onMove(e);},{passive:true});
  document.addEventListener('touchend',()=>{if(!drag) return; const d=drag; drag=null;
    if(d.kind==='sheet'&&d.on){const s=sheetEl(), v=d.dy/Math.max(1,Date.now()-d.t0), close=d.dy>120||v>0.6, wide=innerWidth>=720?' translateX(-50%)':'';
      s.style.transition='transform .22s cubic-bezier(.2,.8,.2,1)'; $('#sheetwrap .scrim').style.opacity='';
      if(close){s.style.transform=`translateY(110%)`+wide; setTimeout(()=>{s.style.transition=''; s.style.transform=''; closeSheet(); if(UI.tab) render();},200);}
      else{s.style.transform=''; setTimeout(()=>{s.style.transition='';},230);}}
    else if(d.kind==='back'&&d.dx>70){if(window.kintoreBack) kintoreBack(); webHaptic();}},{passive:true});

  /* --- service worker: instant offline launch; say when a new version is ready --- */
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
    const had=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then(reg=>{document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible') reg.update().catch(()=>{});});}).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(had) toast('Kintore updated',false,{label:'Reload',fn:()=>{flush(); location.reload();}});});}

  /* --- resume: new day, steps prompt, wake lock --- */
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'){flush(); return;}
    if(window.kintoreResume) kintoreResume(); webKeepAwake(!!S.active);
    if(S.pet&&S.profile.stepShortcut&&IOS&&Date.now()-(UI.lastPaste||0)>20*60e3&&!UI.sheet) toast('Ran your steps Shortcut?',false,{label:'Paste steps',fn:pasteSteps});});
}

/* ---------- steps on iPhone: Apple Health → Shortcuts → clipboard → Kintore ---------- */
function parseSteps(txt){const out={}, today=dkey(new Date()); txt=String(txt||'').trim(); if(!txt) return out;
  try{const o=JSON.parse(txt); if(o&&typeof o==='object'){for(const k in o) if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&+o[k]>=0) out[k]=Math.round(+o[k]); if(Object.keys(out).length) return out;}}catch(e){}
  const lines=txt.split(/[\n;,]+/).map(s=>s.trim()).filter(Boolean);
  for(const ln of lines){const m=ln.match(/(\d{4}-\d{2}-\d{2})\D+([\d.]+)/)||ln.match(/^([\d.]+)$/);
    if(!m) continue; if(m.length===3) out[m[1]]=Math.round(+m[2]); else out[today]=Math.round(+m[1].replace(/,/g,''));}
  if(!Object.keys(out).length){const n=txt.replace(/[^\d.]/g,''); if(n) out[today]=Math.round(+n);}
  return out;}
function applySteps(map){const ks=Object.keys(map).filter(k=>map[k]<200000); if(!ks.length) return 0; ks.forEach(k=>{S.steps[k]=map[k];}); S.profile.stepShortcut=true; save(); if(S.pet) petSettle(); return ks.length;}
async function pasteSteps(){let txt='';
  try{txt=await navigator.clipboard.readText();}catch(e){toast('Kintore could not read the clipboard. Allow Paste when iOS asks.'); return;}
  const map=parseSteps(txt), n=applySteps(map); UI.lastPaste=Date.now();
  if(!n){toast('No step count found on the clipboard'); return;}
  const t=dkey(new Date()); webHaptic('confirm'); closeSheet(); render(); toast(map[t]!=null?`${map[t].toLocaleString()} steps today`:`Steps updated for ${n} day${n>1?'s':''}`);}
function shortcutSheet(){sheet('Steps from Apple Health',`<p class="note" style="margin-top:0">Web apps can't read the iPhone's step counter directly, so a one-tap Shortcut copies today's steps from Apple Health and Kintore pastes them.</p>
  <div class="lbl" style="margin:10px 0 6px">Make the Shortcut once</div>
  <ol class="steps-howto"><li>Open <b>Shortcuts</b>, tap <b>+</b>, name it <b>Kintore steps</b>.</li>
   <li>Add <b>Find Health Samples</b>: type <b>Steps</b>, where <b>Start Date</b> is <b>Today</b>.</li>
   <li>Add <b>Calculate Statistics</b>: <b>Sum</b> of the Health Samples.</li>
   <li>Add <b>Round Number</b>, then <b>Copy to Clipboard</b>.</li>
   <li>Optional: add it to your Home Screen or the Action Button, or run it from an Automation each evening.</li></ol>
  <div class="lbl" style="margin:12px 0 6px">Each time</div>
  <p class="small ink2" style="margin-top:0">Run the Shortcut, open Kintore, tap <b>Paste steps</b>. When Kintore comes back on screen it offers the paste button for you.</p>
  <p class="tiny muted">Also accepts lines like <span class="num">2026-10-15 9832</span> to fill in earlier days.</p>`,`<button type="button" class="btn primary block" data-a="paste-steps">Paste steps</button>`);}
function installCard(){if(N||STANDALONE||!IOS) return ''; let off=false; try{off=localStorage.getItem(KEY+'-ios-tip')==='1';}catch(e){} if(off) return '';
  return`<div class="card installcard"><div class="card-b row" style="gap:12px;padding-top:12px"><img src="icons/icon-192.png" alt="" width="46" height="46" style="border-radius:11px;flex:none"><div class="grow small"><b>Install Kintore</b><div class="ink2">Tap <svg class="i" viewBox="0 0 24 24" style="width:16px;height:16px;vertical-align:-3px"><path d="M12 15V3M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg> Share, then <b>Add to Home Screen</b>. It opens full screen and works offline.</div></div><button type="button" class="iconbtn sm" data-a="ios-tip-off" aria-label="Dismiss">${IC.close}</button></div></div>`;}
Object.assign(A,{
 'paste-steps':()=>pasteSteps(),
 'steps-shortcut':()=>shortcutSheet(),
 'ios-tip-off':()=>{try{localStorage.setItem(KEY+'-ios-tip','1');}catch(e){} render();},
});
