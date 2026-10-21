"use strict";
/* ================= Boot, updates, lifecycle ================= */
let lastCheck=0;
async function checkUpdates(manual){if(!N) return; lastCheck=Date.now(); const r=await nat('checkUpdate');
  if(r.error){if(manual) toast('Could not check for updates. Are you online?'); return;}
  if(r.apkAvailable){UI.apk=r; if(manual||!sessionStorage.getItem('apkNag')){try{sessionStorage.setItem('apkNag','1')}catch(e){} toast(`App update ${r.apkVersion} is ready`,false,{label:'Install',fn:installApk});}}
  if(r.available){const a=await nat('applyUpdate'); if(a.ok) toast('Kintore updated',false,{label:'Restart',fn:()=>{flush(); N.reload();}}); else if(manual) toast('Update failed: '+(a.error||'unknown'));}
  else if(manual&&!r.apkAvailable) toast('Kintore is up to date');}
async function installApk(){if(!UI.apk) return; const r=await nat('installApk',UI.apk.apkUrl); if(r.error) toast(r.error.replace(/^\w+: /,''));}
window.kintoreBack=()=>{if(UI.sheet){closeSheet(); return true;} if(UI.tab!=='today'){go('today'); return true;} return false;};
window.kintorePause=()=>flush();
window.kintoreResume=()=>{if(UI.foodDate<dkey(new Date())&&!UI.sheet&&UI.tab!=='food') UI.foodDate=dkey(new Date()); refreshSteps(); petSettle(); if(N&&Date.now()-lastCheck>30*60e3) checkUpdates(false); if(!UI.sheet) render();};
window.addEventListener('pagehide',flush);
refreshSteps(); petSettle(); syncReminders();
render();
if(S.pet&&hasStepSensor()&&!STEPS.avail&&STEPS.perm!=='denied') setTimeout(()=>askStepPermission(false),1200);
if(N){try{N.bootOk();}catch(e){} setTimeout(()=>checkUpdates(false),2500);}
