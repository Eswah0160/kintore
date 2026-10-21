// Web version only (the Android app serves its files itself).
// Each published UI version gets its own cache, filled when the worker installs, so the app opens instantly and offline.
// A new version installs in the background and takes over on the next launch.
const C='kintore-web-1.9';
const FILES=["./","css/app.css","fonts/LICENSE-dm-mono.txt","fonts/LICENSE-zen-kaku.txt","fonts/dm-mono-latin-300-normal.woff2","fonts/dm-mono-latin-400-normal.woff2","fonts/dm-mono-latin-500-normal.woff2","fonts/zen-kaku-gothic-new-latin-400-normal.woff2","fonts/zen-kaku-gothic-new-latin-500-normal.woff2","fonts/zen-kaku-gothic-new-latin-700-normal.woff2","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-512.png","icons/icon.svg","index.html","js/app.js","js/boot.js","js/coach.js","js/figs.js","js/icons.js","js/me.js","js/pets.js","js/plan.js","js/walk.js","js/web.js","manifest.webmanifest"];
self.addEventListener('install',e=>e.waitUntil(FILES.length?caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()):self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  if(!FILES.length){e.respondWith(fetch(e.request).then(r=>{const c=r.clone(); caches.open(C).then(x=>x.put(e.request,c)); return r;}).catch(()=>caches.match(e.request))); return;}
  e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok) c.put(e.request,r.clone()); return r;}))));});
