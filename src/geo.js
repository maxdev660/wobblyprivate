export const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
export function validPosition(p) {
  return p && typeof p.mapId==='string' && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.x<=1 && p.y>=0 && p.y<=1;
}
export function distance(from,to,map) {
  if(!validPosition(from)||!validPosition(to)||from.mapId!==to.mapId)return null;
  return Math.round(Math.hypot((to.x-from.x)*map.width,(to.y-from.y)*map.height));
}
export function direction(from,to,map={width:1,height:1}) {
  if(!validPosition(from)||!validPosition(to)||from.mapId!==to.mapId)return null;
  if(Math.hypot(from.x-to.x,from.y-to.y)<0.002)return 'here';
  return ['n','ne','e','se','s','sw','w','nw'][(Math.round(Math.atan2((to.x-from.x)*map.width,(from.y-to.y)*map.height)/(Math.PI/4))+8)%8];
}
export function nearby(items,positions,maps) {
  return items.map(item=>({item,distance:item.mapPosition?distance(positions[item.mapPosition.mapId],item.mapPosition,maps.find(m=>m.id===item.mapPosition.mapId)):null}))
    .sort((a,b)=>(a.distance??Infinity)-(b.distance??Infinity)||a.item.id.localeCompare(b.item.id));
}
