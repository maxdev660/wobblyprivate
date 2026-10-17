import {loadCatalog,escapeHTML as h,localized} from './catalog.js';
import {createStore,KEY,validateState,mergeState} from './state.js';
import {translator} from './i18n.js';
import {createViews} from './views.js';
import {mountMap} from './map.js';
import {createAuth} from './auth.js';
let storage;try{storage=localStorage;}catch{storage={getItem(){return null;},setItem(){throw Error('storage');}};}
const store=createStore(storage,navigator.language),root=document.querySelector('#app');
let catalog,selectedId=null,mapInstances=[],views,toastTimer,filters={query:'',category:'',status:'',difficulty:'',area:'',version:'',eventOnly:false,sort:'name',maxDistance:''};
let t=translator(store.value.language),auth,rendering=false;
const nav=[['home','⌂'],['map','⌖'],['unlocks','✓'],['guides','▤'],['progress','◔']];
function route(){const raw=location.hash.slice(2)||'home';const [path,query]=raw.split('?');return {page:path.split('/')[0],id:((id)=>id==='wizard-ship'?'space-presents':/^present-\d+$/.test(id)?'island-presents':id)(decodeURIComponent(path.split('/')[1]||'')),query:new URLSearchParams(query)};}
function toast(message){const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4000);}
function confirmAction(message,callback){const dialog=document.querySelector('#dialog');dialog.innerHTML=`<h2 id="dialog-title">${t('confirm')}</h2><p>${h(message)}</p><div class="actions"><button class="button" data-dialog-cancel>${t('cancel')}</button><button class="button primary" data-dialog-confirm>${t('confirm')}</button></div>`;dialog.querySelector('[data-dialog-cancel]').onclick=()=>dialog.close();dialog.querySelector('[data-dialog-confirm]').onclick=()=>{dialog.close();callback();};dialog.showModal();dialog.querySelector('[data-dialog-cancel]').focus();}
function header(page){return `<div class="header-wrap"><header class="header"><a class="brand" href="#/home"><img src="assets/icons/compass.svg" alt=""><span><strong>Wobbly Guide</strong><small>THE FAN COMPANION</small></span></a><nav class="desktop-nav" aria-label="${t('explore')}">${nav.map(([key,icon])=>`<a href="#/${key}" class="nav-link ${page===key||page==='guide'&&key==='guides'?'active':''}" ${page===key||page==='guide'&&key==='guides'?'aria-current="page"':''}><span aria-hidden="true">${icon}</span>${t(key)}</a>`).join('')}</nav><div class="header-actions"><a class="icon-button header-search" href="#/unlocks?search=1" aria-label="${t('search')}">⌕</a><div class="language-control" aria-label="${t('language')}"><button data-language="de" aria-pressed="${store.value.language==='de'}" class="${store.value.language==='de'?'active':''}">DE</button><button data-language="en" aria-pressed="${store.value.language==='en'}" class="${store.value.language==='en'?'active':''}">EN</button></div><a class="icon-button header-account" href="#/settings?account=1" aria-label="${t('account')}">♙</a><a class="icon-button" href="#/settings" aria-label="${t('settings')}">⚙</a></div></header></div>`;}
function footer(){return `<footer class="footer"><div class="footer-top"><a class="brand" href="#/home"><img src="assets/icons/compass.svg" alt="" width="32" height="32"><strong>Wobbly Guide</strong></a><div class="footer-links"><a href="#/settings">${t('coverage')}</a><a href="#/download">${t('download')}</a><a href="#/settings?account=1">${t('account')}</a></div></div><p>${t('disclaimer')}</p><p>${t('reviewed')} · ${t('catalogNote')}</p></footer>`;}
function mobileNav(page){return `<nav class="mobile-nav" aria-label="${t('explore')}">${nav.map(([key,icon])=>`<a href="#/${key}" class="${page===key||page==='guide'&&key==='guides'?'active':''}" ${page===key||page==='guide'&&key==='guides'?'aria-current="page"':''}><span aria-hidden="true">${icon}</span><span>${t(key)}</span></a>`).join('')}</nav>`;}
function mountMaps(r) {
 const s=store.value;
 document.querySelectorAll('[data-map-root]').forEach(el=>{
  const guide=catalog.items.find(i=>i.id===r.id),map=catalog.maps.find(m=>m.id===(r.page==='guide'?(guide?.mapPosition?.mapId||guide?.mapId):s.mapId))||catalog.maps[0];
  const target=r.page==='guide'?guide:catalog.items.find(i=>i.id===s.target);
  let markerItems=r.page==='guide'?(guide?.mapPosition?[guide]:[]):catalog.items.filter(i=>i.mapPosition?.mapId===map.id&&(!s.hideDone||!s.completed[i.id])&&(!s.mapFilters.length||s.mapFilters.includes(i.category)));
  if(target?.mapPosition?.mapId===map.id&&!markerItems.some(i=>i.id===target.id))markerItems.push(target);
  // Multiple unlocks can share one landmark; spread their display markers slightly while preserving true distances.
  const groups=new Map();markerItems=markerItems.map(i=>{const c=catalog.categories.find(c=>c.id===i.category),key=`${i.mapPosition.x}:${i.mapPosition.y}`,n=groups.get(key)||0;groups.set(key,n+1);return {...i,done:!!s.completed[i.id],image:i.images?.[0]?.src||c.image,color:c.color,mapPosition:n?{...i.mapPosition,x:i.mapPosition.x+Math.cos(n*2.4)*.035,y:i.mapPosition.y+Math.sin(n*2.4)*.035}:i.mapPosition};});
  const instance=mountMap(el,{map,items:markerItems,position:s.positions[map.id],target,selected:selectedId,language:s.language,t,onPosition:p=>{store.set('positions',p,p.mapId);toast(t('positionSaved'));},onSelect:id=>{if(r.page==='guide'){location.hash=`/guide/${id}`;}else{selectedId=id;render();}},waypoints:r.page==='guide'?guide?.route:[],completedSteps:Object.fromEntries((guide?.route||[]).map((p,n)=>[n,!!s.steps[`${guide.id}:${p.stepIndex}`]]))});
  mapInstances.push(instance);
 });
}
function render({navigation=false}={}) {
 if(!catalog||rendering)return;rendering=true;
 const active=document.activeElement,key=active?.id?{id:active.id}:active?.dataset?.step?{step:active.dataset.step}:active?.dataset?.complete?{complete:active.dataset.complete}:active?.dataset?.mapFilter?{mapFilter:active.dataset.mapFilter}:active?.classList?.contains('player')?{player:true}:null;
 const scroll=window.scrollY,nearScroll=document.querySelector('.nearby-list')?.scrollTop||0;
 mapInstances.forEach(m=>m.destroy());mapInstances=[];
 t=translator(store.value.language);views=createViews(catalog,store,t);
 document.documentElement.lang=store.value.language;document.documentElement.dataset.animations=String(store.value.animations);
 document.querySelector('.skip').textContent=t('skip');
 const r=route();let content;
 switch(r.page){case 'map':content=views.mapPage(selectedId);break;case 'unlocks':case 'guides':content=views.listPage(r.page,filters);break;case 'guide':content=views.guide(r.id);break;case 'progress':content=views.progressPage();break;case 'settings':content=views.settingsPage(auth);break;case 'download':content=views.download();break;default:content=views.home();}
 root.innerHTML=header(r.page)+`<main id="main" class="page page-${r.page}" tabindex="-1">${store.storageError?`<div class="error-banner" role="alert">${t('storageError')}</div>`:''}${!catalog.items.length?`<p class="notice">${t('emptyData')}</p>`:''}${content}</main>`+footer()+mobileNav(r.page);
 document.title=`${r.page==='guide'?localized(catalog.items.find(i=>i.id===r.id)?.name,store.value.language)||t('guides'):t(nav.some(([n])=>n===r.page)||['settings','download'].includes(r.page)?r.page:'home')} · Wobbly Guide`;
 mountMaps(r);
 if(navigation){document.querySelector('#main').focus({preventScroll:true});window.scrollTo(0,0);if(r.query.has('search'))document.querySelector('#catalog-search')?.focus();if(r.query.has('account'))document.querySelector('#account')?.scrollIntoView({block:'start'});}
 else {window.scrollTo(0,scroll);const near=document.querySelector('.nearby-list');if(near)near.scrollTop=nearScroll;if(key){const selector=key.id?`#${CSS.escape(key.id)}`:key.step?`[data-step="${CSS.escape(key.step)}"]`:key.complete?`[data-complete="${CSS.escape(key.complete)}"]`:key.mapFilter?`[data-map-filter="${CSS.escape(key.mapFilter)}"]`:'.player';document.querySelector(selector)?.focus({preventScroll:true});}}
 rendering=false;
}
function updateResults(){views=createViews(catalog,store,t);const el=document.querySelector('#catalog-results');if(el)el.innerHTML=views.listResults(filters);}
document.addEventListener('click',async e=>{
 const el=e.target.closest('button,[data-select]');if(!el)return;
 if(el.dataset.mapChoice){selectedId=null;store.set('mapId',el.dataset.mapChoice);return;}
 if(el.dataset.language){store.set('language',el.dataset.language);return;}
 if(el.dataset.complete){const id=el.dataset.complete;store.set('completed',!store.value.completed[id],id);return;}
 if(el.dataset.target){store.set('target',el.dataset.target);toast(t('saved'));return;}
 if(el.dataset.select){selectedId=el.dataset.select;render();document.querySelector('.marker-popup')?.scrollIntoView({block:'nearest',behavior:'smooth'});return;}
 if(el.hasAttribute('data-status')){filters.status=el.dataset.status;render();return;}
 if(el.dataset.deletePosition){confirmAction(t('confirmPosition'),()=>store.set('positions',null,el.dataset.deletePosition));return;}
 switch(el.dataset.action){
  case 'clear-target':store.set('target',null);break;
  case 'close-popup':selectedId=null;render();break;
  case 'reset-markers':store.set('mapFilters',[]);store.set('hideDone',true);break;
  case 'reset-filters':filters={query:'',category:'',status:'',difficulty:'',area:'',version:'',eventOnly:false,sort:'name',maxDistance:''};render();break;
  case 'export':{const blob=new Blob([store.export()],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wobbly-guide-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
  case 'reset-progress':confirmAction(t('confirmReset'),()=>{store.resetProgress();toast(t('saved'));});break;
  case 'login':try{await auth.login();}catch(err){toast(t(err.message==='desktopAuth'?'desktopAuth':'syncError'));}break;
  case 'logout':try{await auth.logout();}catch{toast(t('syncError'));}break;
  case 'sync':await auth.sync();break;
 }
});
document.addEventListener('input',e=>{if(e.target.id==='catalog-search'){filters.query=e.target.value;updateResults();}});
document.addEventListener('change',async e=>{
 const el=e.target;
 if(el.dataset.step){store.set('steps',el.checked,el.dataset.step);return;}
 if(el.dataset.filter){filters[el.dataset.filter]=el.type==='checkbox'?el.checked:el.value;updateResults();return;}
 if(el.dataset.mapFilter){const checked=store.value.mapFilters.length?[...store.value.mapFilters]:catalog.categories.map(c=>c.id);store.set('mapFilters',el.checked?[...new Set([...checked,el.dataset.mapFilter])]:checked.filter(id=>id!==el.dataset.mapFilter).length?checked.filter(id=>id!==el.dataset.mapFilter):['none']);return;}
 if(el.id==='map-choice'){selectedId=null;store.set('mapId',el.value);return;}
 if(el.id==='hide-done')store.set('hideDone',el.checked);
 if(el.id==='language-setting')store.set('language',el.value);
 if(el.id==='animations')store.set('animations',el.checked);
 if(el.id==='sync-position')store.set('positionSync',el.checked);
 if(el.id==='import-file'){
  const file=el.files?.[0];if(!file)return;
  try {if(file.size>2000000)throw Error();const imported=validateState(JSON.parse(await file.text()),{strict:true});confirmAction(t('confirmImport'),()=>{const now=Date.now();for(const field of ['completed','steps','positions'])for(const id of new Set([...Object.keys(store.value[field]),...Object.keys(imported[field])]))imported.updated[`${field}:${id}`]=now;for(const k of ['language','target','animations','mapId','mapFilters','hideDone','positionSync'])imported.updated[k]=now;store.replace(imported);toast(t('imported'));});}catch{toast(t('invalidImport'));}finally{el.value='';}
 }
});
document.addEventListener('submit',e=>{if(!e.target.dataset.positionForm)return;e.preventDefault();const data=new FormData(e.target);store.set('positions',{mapId:e.target.dataset.positionForm,x:Number(data.get('x'))/100,y:Number(data.get('y'))/100},e.target.dataset.positionForm);toast(t('positionSaved'));});
window.addEventListener('hashchange',()=>{const r=route();if(r.query.has('category'))filters.category=r.query.get('category');render({navigation:true});});
window.addEventListener('storage',e=>{if(e.key!==KEY||!e.newValue)return;try{const merged=mergeState(store.value,validateState(JSON.parse(e.newValue)));if(JSON.stringify(merged)!==JSON.stringify(store.value))store.replace(merged);}catch{}});
let reloadingWorker=false;
if('serviceWorker' in navigator){const hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!reloadingWorker){reloadingWorker=true;location.reload();}});}
async function boot(){
 try {catalog=await loadCatalog();if(!catalog.maps.some(m=>m.id===store.value.mapId))store.set('mapId',catalog.maps[0].id);auth=createAuth(store,()=>{if(route().page==='settings')render();});store.subscribe(()=>render());const r=route();if(r.query.has('category'))filters.category=r.query.get('category');render();await auth.init();if('serviceWorker' in navigator&&!window.__TAURI_INTERNALS__&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').then(r=>r.update()).catch(()=>{});}
 catch(error){root.innerHTML=`<main id="main" class="page empty-state"><h1>Wobbly Guide</h1><p role="alert">${t(error.message==='invalidData'?'invalidData':'loadError')}</p><button class="button primary" id="retry">${t('retry')}</button></main>`;document.querySelector('#retry').onclick=()=>location.reload();}
}
boot();
