const CACHE='wobbly-guide-dev';
const PRECACHE=[/* BUILD_PRECACHE */];
self.addEventListener('install',event=>{
 if(!PRECACHE.length)return;
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith('wobbly-guide-')&&key!==CACHE)await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(!PRECACHE.length||event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(event.request,{ignoreSearch:true});
  if(cached)return cached;
  if(event.request.mode==='navigate'){const shell=await cache.match('./index.html');if(shell)return shell;}
  return fetch(event.request);
 })());
});
