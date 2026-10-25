const V="tracker-v1";
const CORE=["./","index.html","app.js","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png","https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=="GET"||u.hostname.endsWith("supabase.co"))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&(u.origin===location.origin||u.hostname==="cdn.jsdelivr.net"||u.hostname.endsWith("fonts.gstatic.com")||u.hostname==="fonts.googleapis.com")){const c=r.clone();caches.open(V).then(ca=>ca.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));
});
