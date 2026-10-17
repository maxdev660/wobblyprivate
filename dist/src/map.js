import {clamp} from './geo.js';
import {escapeHTML as h,localized} from './catalog.js';
const savedViews=new Map();
export function mountMap(root,{map,items,position,target,selected,language,t,onPosition,onSelect,waypoints=[],completedSteps={}}) {
  let view={...(savedViews.get(root.dataset.mapKey)||{zoom:1,x:0,y:0})};
  let setting=false,baseW=1,baseH=1,maxZoom=1,nativeZoom=1,start=null,draggingPlayer=false,moved=false,pinch=null;
  const points=new Map(),abort=new AbortController(),signal=abort.signal;
  root.dataset.world=map.id;
  root.innerHTML=`<div class="map-tools"><button class="button small primary" data-mode aria-pressed="false">⌖ ${t('setPosition')}</button><span class="zoom-tools"><button class="icon-button" data-zoom="in" aria-label="${t('zoomIn')}">+</button><button class="icon-button" data-zoom="out" aria-label="${t('zoomOut')}">−</button><button class="icon-button" data-zoom="reset" aria-label="${t('resetView')}">↺</button><button class="icon-button" data-expand aria-pressed="false" aria-label="${t('fullscreen')}">⛶</button></span></div><div class="map-viewport" tabindex="0" role="region" aria-label="${t('keyboardMap')}"><div class="map-scene"><img class="map-image" src="${h(map.image)}" alt="${h(localized(map.name,language))}" draggable="false"><svg class="route-layer" viewBox="0 0 ${map.width} ${map.height}" aria-hidden="true"></svg><div class="labels"></div><div class="markers"></div></div><span class="map-compass" aria-hidden="true">N<br>↑</span><span class="map-scale" aria-live="polite">1×</span><span class="map-instruction" hidden>${t('positionHint')}</span><span class="map-load-status" role="status">${t('mapLoading')}</span></div><p class="map-caption">${h(localized(map.note,language)||t('schematic'))}</p>`;
  const viewport=root.querySelector('.map-viewport'),scene=root.querySelector('.map-scene'),markers=root.querySelector('.markers'),mode=root.querySelector('[data-mode]');
  const labels=root.querySelector('.labels');
  labels.innerHTML=(map.labels||[]).map(l=>`<span class="map-label" style="left:${l.x*100}%;top:${l.y*100}%">${h(localized(l.name,language))}</span>`).join('');
  const mapImage=root.querySelector('.map-image'),loadStatus=root.querySelector('.map-load-status');
  function loaded(){loadStatus.hidden=true;transform();}
  mapImage.addEventListener('load',loaded,{signal});
  mapImage.addEventListener('error',()=>{loadStatus.hidden=false;loadStatus.textContent=t('noMapAsset');}, {signal});
  function renderMarkers() {
    markers.innerHTML=items.map(item=>`<button class="map-marker ${item.done?'is-done':''} ${target?.id===item.id?'is-target':''} ${selected===item.id?'is-selected':''}" style="left:${item.mapPosition.x*100}%;top:${item.mapPosition.y*100}%;--marker-color:${item.color||'#fff'}" data-marker="${h(item.id)}" aria-label="${h(localized(item.name,language))} · ${t(item.done?'done':'open')}" title="${h(localized(item.name,language))}"><img src="${h(item.image)}" alt="" draggable="false">${item.done?'<i>✓</i>':''}</button>`).join('');
    waypoints.filter(p=>p.mapId===map.id).forEach((p,i)=>{const button=document.createElement('button');button.className=`map-marker waypoint ${!completedSteps[i]&&Object.keys(completedSteps).filter(k=>completedSteps[k]).length===i?'is-target':''}`;button.style.left=p.x*100+'%';button.style.top=p.y*100+'%';button.textContent=completedSteps[i]?'✓':String(i+1);button.title=localized(p.label,language);button.setAttribute('aria-label',`${t('step')} ${i+1}: ${localized(p.label,language)}`);button.addEventListener('click',()=>root.closest('main')?.querySelector(`[data-step-index="${i}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),{signal});markers.append(button);});
    if(position) {const player=document.createElement('button');player.className='map-marker player';player.style.left=position.x*100+'%';player.style.top=position.y*100+'%';player.setAttribute('aria-label',t('you'));player.title=t('you');player.innerHTML='<span class="player-face" aria-hidden="true"><i></i></span>';markers.append(player);}
    const route=root.querySelector('.route-layer');
    route.innerHTML=position&&target?.mapPosition?.mapId===map.id?`<line x1="${position.x*map.width}" y1="${position.y*map.height}" x2="${target.mapPosition.x*map.width}" y2="${target.mapPosition.y*map.height}" stroke="#485080" stroke-width="3" stroke-dasharray="8 9" vector-effect="non-scaling-stroke"/>`:'';
  }
  function transform() {
    const width=viewport.clientWidth,height=viewport.clientHeight;
    // Render at the actual display size, rather than magnifying a GPU raster layer.
    // Track source-detail resolution separately from magnification.
    const nativeW=(mapImage.naturalWidth||map.width)/Math.max(1,window.devicePixelRatio||1);
    baseW=Math.min(width,height*map.width/map.height,nativeW);baseH=baseW*map.height/map.width;
    nativeZoom=Math.max(1,nativeW/Math.max(1,baseW));maxZoom=Math.max(12,nativeZoom);view.zoom=clamp(view.zoom,1,maxZoom);
    const w=baseW*view.zoom,hh=baseH*view.zoom;
    const limitX=Math.max(0,(w-width)/2),limitY=Math.max(0,(hh-height)/2);
    view.x=clamp(view.x,-limitX,limitX);view.y=clamp(view.y,-limitY,limitY);
    Object.assign(scene.style,{width:w+'px',height:hh+'px',left:((width-w)/2+view.x)+'px',top:((height-hh)/2+view.y)+'px',transform:'none'});
    root.style.setProperty('--inverse-zoom',1);
    root.querySelector('.map-scale').textContent=`${view.zoom.toFixed(1)}×${view.zoom>nativeZoom+.01?' · '+t('enlargedZoom'):view.zoom>=nativeZoom-.01?' · '+t('nativeZoom'):''}`;
    root.querySelector('[data-zoom="in"]').disabled=view.zoom>=maxZoom-.01;
    root.querySelector('[data-zoom="out"]').disabled=view.zoom<=1.01;
    savedViews.set(root.dataset.mapKey,{...view});
  }
  function coords(clientX,clientY) {const rect=scene.getBoundingClientRect();return {mapId:map.id,x:clamp((clientX-rect.left)/rect.width),y:clamp((clientY-rect.top)/rect.height)};}
  function toggleMode(value) {setting=value;mode.setAttribute('aria-pressed',String(value));mode.classList.toggle('active',value);root.querySelector('.map-instruction').hidden=!value;viewport.classList.toggle('setting-position',value);}
  function zoom(next,cx,cy) {
    const rect=viewport.getBoundingClientRect();const px=(cx??rect.left+rect.width/2)-rect.left-rect.width/2,py=(cy??rect.top+rect.height/2)-rect.top-rect.height/2;
    const prev=view.zoom;view.zoom=clamp(next,1,maxZoom);const ratio=view.zoom/prev;view.x=px-(px-view.x)*ratio;view.y=py-(py-view.y)*ratio;transform();
  }
  mode.addEventListener('click',()=>{toggleMode(!setting);viewport.focus();},{signal});
  function expand(value){root.classList.toggle('map-expanded',value);const b=root.querySelector('[data-expand]');b.setAttribute('aria-pressed',String(value));b.setAttribute('aria-label',t(value?'exitFullscreen':'fullscreen'));document.body.classList.toggle('map-is-expanded',value);view={zoom:1,x:0,y:0};transform();}
  root.querySelector('[data-expand]').addEventListener('click',()=>expand(!root.classList.contains('map-expanded')),{signal});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&root.classList.contains('map-expanded')){expand(false);root.querySelector('[data-expand]').focus();}},{signal});
  root.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.zoom==='reset'){view={zoom:1,x:0,y:0};transform();}else zoom(view.zoom*(b.dataset.zoom==='in'?1.3:1/1.3));},{signal}));
  viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(view.zoom*Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);},{passive:false,signal});
  viewport.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(points.size===2){const p=[...points.values()];pinch={distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom:view.zoom};moved=true;viewport.setPointerCapture(e.pointerId);return;}
    start={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y,marker:e.target.closest('[data-marker]')?.dataset.marker};moved=false;draggingPlayer=!!e.target.closest('.player');
    viewport.setPointerCapture(e.pointerId);
  },{signal});
  viewport.addEventListener('pointermove',e=>{
    if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(points.size>=2&&pinch){const p=[...points.values()];zoom(pinch.zoom*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/Math.max(1,pinch.distance),(p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2);return;}
    if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>5)moved=true;
    if(draggingPlayer){position=coords(e.clientX,e.clientY);const player=markers.querySelector('.player');if(player){player.style.left=position.x*100+'%';player.style.top=position.y*100+'%';}}
    else if(moved){view.x=start.vx+dx;view.y=start.vy+dy;transform();}
  },{signal});
  function end(e,cancel=false) {
    if(!points.has(e.pointerId))return;points.delete(e.pointerId);
    if(pinch){if(points.size===0){pinch=null;start=null;}return;}
    if(cancel){start=null;return;}
    if(draggingPlayer&&moved){onPosition(coords(e.clientX,e.clientY));}
    else if(!moved&&setting){toggleMode(false);onPosition(coords(e.clientX,e.clientY));}
    else if(!moved&&start?.marker){onSelect(start.marker);}
    start=null;draggingPlayer=false;
  }
  viewport.addEventListener('pointerup',e=>end(e),{signal});viewport.addEventListener('pointercancel',e=>end(e,true),{signal});
  markers.addEventListener('click',e=>{if(e.detail===0){const id=e.target.closest('[data-marker]')?.dataset.marker;if(id)onSelect(id);}},{signal});
  viewport.addEventListener('keydown',e=>{
    if(e.target!==viewport&&!e.target.closest('.player'))return;
    if(e.key==='Escape'){toggleMode(false);return;}
    if(e.key==='+'||e.key==='='){zoom(view.zoom*1.25);e.preventDefault();return;}
    if(e.key==='-'){zoom(view.zoom/1.25);e.preventDefault();return;}
    if(e.key==='Enter'&&setting){const rect=viewport.getBoundingClientRect();toggleMode(false);onPosition(coords(rect.left+rect.width/2,rect.top+rect.height/2));e.preventDefault();return;}
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();const dx=e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,dy=e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0;
      if(e.target.closest('.player')&&position){onPosition({...position,x:clamp(position.x+dx*.01),y:clamp(position.y+dy*.01)});}else{view.x-=dx*40;view.y-=dy*40;transform();}
    }
  },{signal});
  renderMarkers();const observer=new ResizeObserver(transform);observer.observe(viewport);transform();
  if(mapImage.complete&&mapImage.naturalWidth)loaded();
  return {destroy(){abort.abort();observer.disconnect();document.body.classList.remove('map-is-expanded');},setMode(){toggleMode(true);viewport.focus();}};
}
