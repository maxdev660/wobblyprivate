import {validPosition} from './geo.js';
export const KEY='wobbly-guide-v2';
export const defaultState=()=>({version:2,mapRevision:2,language:null,completed:{},steps:{},positions:{},target:null,mapId:'planet-wobb',mapFilters:[],hideDone:true,animations:true,positionSync:false,updated:{}});
const safeKey=k=>typeof k==='string'&&/^[a-z0-9][a-z0-9._:-]{0,120}$/i.test(k)&&!['constructor','prototype','__proto__'].includes(k);
export function validateState(raw,{strict=false}={}) {
  if(!raw||typeof raw!=='object'||raw.version!==2)throw Error('invalidImport');
  const out=defaultState();
  for(const field of ['completed','steps']) {
    if(raw[field]!==undefined&&(typeof raw[field]!=='object'||Array.isArray(raw[field])||raw[field]===null))throw Error('invalidImport');
    for(const [k,v] of Object.entries(raw[field]||{})) {
      if(!safeKey(k)||typeof v!=='boolean') {if(strict)throw Error('invalidImport');continue;}
      out[field][k]=v;
    }
  }
  for(const [k,p] of Object.entries(raw.positions||{})) {
    if(!safeKey(k)||!validPosition(p)||p.mapId!==k){if(strict)throw Error('invalidImport');continue;}
    out.positions[k]={mapId:k,x:p.x,y:p.y};
  }
  if(['de','en'].includes(raw.language))out.language=raw.language;
  for(const field of ['hideDone','animations','positionSync'])if(typeof raw[field]==='boolean')out[field]=raw[field];
  if(raw.target===null||safeKey(raw.target))out.target=raw.target;
  if(safeKey(raw.mapId))out.mapId=raw.mapId;
  if(Array.isArray(raw.mapFilters))out.mapFilters=raw.mapFilters.filter(safeKey);
  for(const [k,v] of Object.entries(raw.updated||{}))if(safeKey(k)&&Number.isSafeInteger(v)&&v>=0)out.updated[k]=v;
  // Positions from the discarded illustrative maps cannot locate a player on the original game map.
  if(raw.mapRevision!==2)out.positions={};
  // Preserve old per-present checkmarks inside the grouped island guide.
  for(let n=0;n<9;n++){
    const old='present-'+(n+1),key='island-presents:'+n;
    if(!(key in out.steps)&&(out.completed[old]||out.steps[old+':0'])){out.steps[key]=true;out.updated['steps:'+key]=Math.max(out.updated['completed:'+old]||0,out.updated['steps:'+old+':0']||0);}
  }
  if(!('space-presents' in out.completed)&&'wizard-ship' in out.completed){out.completed['space-presents']=out.completed['wizard-ship'];out.updated['completed:space-presents']=out.updated['completed:wizard-ship']||0;}
  if(out.target==='wizard-ship')out.target='space-presents';
  if(/^present-\d+$/.test(out.target||''))out.target='island-presents';
  return out;
}
export function mergeState(a,b) {
  const out=validateState(a);b=validateState(b);
  for(const field of ['completed','steps','positions'])for(const k of new Set([...Object.keys(a[field]),...Object.keys(b[field])])) {
    const key=`${field}:${k}`;
    if((b.updated[key]??0)>(a.updated[key]??0)) {
      if(k in b[field])out[field][k]=b[field][k];else delete out[field][k];
      out.updated[key]=b.updated[key];
    }
  }
  // Timestamp tombstones preserve explicit unchecks and position removals.
  for(const [key,time] of Object.entries(b.updated)) {
    if(time<=(a.updated[key]??0))continue;
    out.updated[key]=time;
    if(key.startsWith('positions:')) {const id=key.slice(10);if(!(id in b.positions))delete out.positions[id];}
    if(['language','target','animations','positionSync','mapId','mapFilters','hideDone'].includes(key))out[key]=b[key];
  }
  return out;
}
export function initialLanguage(saved,browser='en') {return ['de','en'].includes(saved)?saved:browser.toLowerCase().startsWith('de')?'de':'en';}
export function createStore(storage,browser='en') {
  let state=defaultState(),storageError=false;
  try {
    const saved=storage.getItem(KEY);
    if(saved){const raw=JSON.parse(saved);if(raw.mapRevision!==2&&Object.keys(raw.positions||{}).length)storage.setItem(KEY+'-before-original-maps',saved);state=validateState(raw);}
    else {
      state.language=storage.getItem('wg-language');
      const legacy=JSON.parse(storage.getItem('wg-demo-progress')||'null');
      if(Array.isArray(legacy))['flying-car','dino-pet','wizard-ship'].forEach((id,i)=>{if(typeof legacy[i]==='boolean'){state.completed[id]=legacy[i];state.updated[`completed:${id}`]=Date.now();}});
    }
  }catch{storageError=true;}
  state.language=initialLanguage(state.language,browser);
  const listeners=new Set();
  function save() {try{storage.setItem(KEY,JSON.stringify(state));storageError=false;}catch{storageError=true;}listeners.forEach(fn=>fn(state));}
  return {
    get value(){return state;},get storageError(){return storageError;},
    subscribe(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
    set(field,value,id){
      const key=id?`${field}:${id}`:field;
      if(id){if(value===null)delete state[field][id];else state[field][id]=value;}else state[field]=value;
      state.updated[key]=Math.max(Date.now(),(state.updated[key]||0)+1);save();
    },
    replace(value){state=validateState(value,{strict:true});save();},
    merge(value){state=mergeState(state,value);save();},
    resetProgress(){for(const field of ['completed','steps'])for(const id of Object.keys(state[field])){state[field][id]=false;state.updated[`${field}:${id}`]=Date.now();}save();},
    export(){return JSON.stringify(state,null,2);}
  };
}
