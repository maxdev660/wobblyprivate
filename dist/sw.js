const CACHE="wobbly-guide-657248972eae";
const PRECACHE=["./assets/icons/compass.svg","./assets/images/category-clothes.jpg","./assets/images/category-events.jpg","./assets/images/category-gifts.jpg","./assets/images/category-jobs.jpg","./assets/images/category-museum.jpg","./assets/images/category-pets.jpg","./assets/images/category-races.jpg","./assets/images/category-secrets.jpg","./assets/images/category-space.jpg","./assets/images/category-tasks.jpg","./assets/images/category-vehicles.jpg","./assets/images/mining.jpg","./assets/images/planet-wobb.jpg","./assets/images/space.jpg","./assets/images/ufo-lab.jpg","./assets/images/wobbly-life-keyart.webp","./data/categories.json","./data/locations.json","./data/maps.json","./data/sources.json","./data/unlocks.json","./index.html","./manifest.webmanifest","./script.js","./src/app.js","./src/auth.js","./src/catalog.js","./src/config.js","./src/geo.js","./src/i18n.js","./src/map.js","./src/state.js","./src/views.js","./style.css"];
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
