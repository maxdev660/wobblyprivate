import {nearby} from './geo.js';
export const localized=(value,lang)=>typeof value==='string'?value:value?.[lang]??value?.en??'';
export const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateCatalog(data,categories,maps) {
  if(!data||!Array.isArray(data.unlocks))throw Error('invalidData');
  const ids=new Set();
  for(const item of data.unlocks) {
    if(!item.id||ids.has(item.id)||!categories.some(c=>c.id===item.category)||!['de','en'].every(l=>item.name?.[l]&&item.description?.[l]&&Array.isArray(item.guide?.[l])))throw Error('invalidData');
    ids.add(item.id);
    if(item.mapPosition&&(!maps.some(m=>m.id===item.mapPosition.mapId)||![item.mapPosition.x,item.mapPosition.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1)))throw Error('invalidData');
    if(item.guide.de.length!==item.guide.en.length)throw Error('invalidData');
  }
  return data;
}
export async function loadCatalog() {
  const load=async name=>{const r=await fetch(`data/${name}.json`);if(!r.ok)throw Error('loadError');return r.json();};
  const [data,categories,maps,locations]=await Promise.all(['unlocks','categories','maps','locations'].map(load));
  return {data:validateCatalog(data,categories,maps),items:data.unlocks,categories,maps,locations};
}
export function filterItems(items,filters,state,maps) {
  const query=(filters.query||'').trim().toLocaleLowerCase();
  const result=items.filter(item=>{
    const complete=!!state.completed[item.id];
    return (!query||JSON.stringify([item.name,item.description,item.location,item.area,item.category,item.reward,item.keywords,item.guide,item.walkthrough]).toLocaleLowerCase().includes(query))
      &&(!filters.category||item.category===filters.category)
      &&(!filters.status||complete===(filters.status==='done'))
      &&(!filters.difficulty||item.difficulty===filters.difficulty)
      &&(!filters.area||item.areaId===filters.area)
      &&(!filters.version||item.version===filters.version)
      &&(!filters.eventOnly||item.eventOnly);
  });
  if(filters.sort==='near')return nearby(result,state.positions,maps).filter(r=>!filters.maxDistance||(r.distance!==null&&r.distance<=Number(filters.maxDistance))).map(r=>r.item);
  return result.sort((a,b)=>localized(a.name,state.language).localeCompare(localized(b.name,state.language),state.language));
}
export function progress(items,state){const done=items.filter(i=>state.completed[i.id]).length;return {done,total:items.length,percent:items.length?Math.round(done/items.length*100):0};}
