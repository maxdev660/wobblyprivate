import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {distance,direction,nearby,validPosition} from '../src/geo.js';
import {createStore,defaultState,initialLanguage,validateState,mergeState,KEY} from '../src/state.js';
import {filterItems,progress,validateCatalog} from '../src/catalog.js';
import {cloudPayload} from '../src/auth.js';
import {translations} from '../src/i18n.js';
const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const [data,categories,maps]=await Promise.all(['unlocks','categories','maps'].map(read));
const memory=()=>{const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};};
test('catalog has bilingual complete guides and valid IDs, sources and coordinates',()=>{
 assert.equal(validateCatalog(data,categories,maps),data);
 for(const i of data.unlocks){assert.ok(i.sources.length);assert.equal(i.guide.de.length,i.guide.en.length);assert.ok(i.guide.en.length>0);assert.ok(i.sources.every(s=>s.url.startsWith('https://')));for(const id of i.related)assert.ok(data.unlocks.some(i=>i.id===id));}
});
test('empty catalog valid, damaged catalog rejected',()=>{
 assert.equal(validateCatalog({unlocks:[]},categories,maps).unlocks.length,0);
 assert.throws(()=>validateCatalog({unlocks:[{id:'bad'}]},categories,maps));
 assert.throws(()=>validateCatalog({unlocks:[data.unlocks[0],data.unlocks[0]]},categories,maps));
});
test('geometry respects map dimensions and boundaries',()=>{
 const a={mapId:'planet-wobb',x:.1,y:.1},b={mapId:'planet-wobb',x:.4,y:.5};
 assert.equal(distance(a,b,{width:1000,height:1000}),500);
 assert.equal(distance(a,{...b,mapId:'space'},maps[0]),null);
 assert.equal(distance(null,b,maps[0]),null);
 assert.equal(validPosition({...a,x:NaN}),false);
 assert.equal(validPosition({...a,y:1.1}),false);
});
test('all eight compass directions, coincident points and map mismatch',()=>{
 const from={mapId:'planet-wobb',x:.5,y:.5};
 for(const [dx,dy,key] of [[0,-1,'n'],[1,-1,'ne'],[1,0,'e'],[1,1,'se'],[0,1,'s'],[-1,1,'sw'],[-1,0,'w'],[-1,-1,'nw']])assert.equal(direction(from,{...from,x:.5+dx*.1,y:.5+dy*.1}),key);
 assert.equal(direction(from,from),'here');assert.equal(direction(from,{...from,mapId:'space'}),null);
});
test('language detection and explicit preference',()=>{
 assert.equal(initialLanguage(null,'de-AT'),'de');assert.equal(initialLanguage(null,'fr-FR'),'en');assert.equal(initialLanguage('en','de-DE'),'en');assert.equal(initialLanguage('xx','de-DE'),'de');
 assert.deepEqual(Object.keys(translations.de),Object.keys(translations.en));
});
test('progress toggles and guide steps survive reload; false remains false',()=>{
 const m=memory(),a=createStore(m,'de-DE');a.set('completed',true,'ufo');a.set('steps',true,'ufo:0');a.set('positions',{mapId:'planet-wobb',x:.4,y:.6},'planet-wobb');a.set('target','ufo');
 const b=createStore(m);assert.equal(b.value.completed.ufo,true);assert.equal(b.value.steps['ufo:0'],true);assert.equal(b.value.positions['planet-wobb'].x,.4);assert.equal(b.value.target,'ufo');
 b.set('completed',false,'ufo');assert.equal(createStore(m).value.completed.ufo,false);assert.equal(progress(data.unlocks,b.value).done,0);
 b.set('positions',null,'planet-wobb');assert.equal(createStore(m).value.positions['planet-wobb'],undefined);
});
test('legacy three-card progress migrates only when actually saved',()=>{
 const m=memory();m.setItem('wg-demo-progress','[true,false,true]');m.setItem('wg-language','en');const s=createStore(m,'de');assert.equal(s.value.completed['flying-car'],true);assert.equal(s.value.completed['dino-pet'],false);assert.equal(s.value.completed['wizard-ship'],true);assert.equal(s.value.language,'en');assert.deepEqual(createStore(memory()).value.completed,{});
});
test('corrupt storage and write denial remain usable',()=>{
 const m=memory();m.setItem(KEY,'{bad');const a=createStore(m);assert.equal(a.storageError,true);assert.equal(a.value.language,'en');
 const b=createStore({getItem(){return null;},setItem(){throw Error();}});b.set('completed',true,'ufo');assert.equal(b.value.completed.ufo,true);assert.equal(b.storageError,true);
});
test('import rejects wrong versions, invalid booleans and invalid coordinates',()=>{
 assert.throws(()=>validateState({version:1},{strict:true}));assert.throws(()=>validateState({...defaultState(),completed:{ufo:'yes'}},{strict:true}));assert.throws(()=>validateState({...defaultState(),positions:{space:{mapId:'space',x:2,y:.3}}},{strict:true}));assert.throws(()=>validateState(JSON.parse('{"version":2,"completed":{"__proto__":true}}'),{strict:true}));
});
test('sync retains explicit unchecks and deletion tombstones',()=>{
 const old=defaultState(),newer=defaultState();old.completed.ufo=true;old.updated['completed:ufo']=5;newer.completed.ufo=false;newer.updated['completed:ufo']=10;
 old.positions.space={mapId:'space',x:.2,y:.3};old.updated['positions:space']=5;newer.updated['positions:space']=10;
 const merged=mergeState(old,newer);assert.equal(merged.completed.ufo,false);assert.equal(merged.positions.space,undefined);assert.deepEqual(mergeState(newer,old),merged);
});
test('cloud payload excludes positions until explicitly enabled',()=>{
 const s=defaultState();s.positions.space={mapId:'space',x:.2,y:.3};s.updated['positions:space']=12;assert.deepEqual(cloudPayload(s).positions,{});assert.equal(cloudPayload(s).updated['positions:space'],undefined);s.positionSync=true;assert.equal(cloudPayload(s).positions.space.x,.2);
});
test('combined search/status/category filters do not overwrite one another',()=>{
 const s=defaultState();s.language='de';s.completed.ufo=true;
 assert.deepEqual(filterItems(data.unlocks,{query:'ufo',category:'vehicles',status:'done'},s,maps).map(i=>i.id),['ufo']);
 assert.equal(filterItems(data.unlocks,{query:'ufo',category:'vehicles',status:'open'},s,maps).length,0);
 assert.ok(filterItems(data.unlocks,{query:'Mais'},s,maps).some(i=>i.id==='ufo'));
 assert.ok(filterItems(data.unlocks,{eventOnly:true},s,maps).every(i=>i.eventOnly));
});
test('nearest sorting excludes other-map distances and filters distance limit',()=>{
 const s=defaultState();s.positions['planet-wobb']={...data.unlocks.find(i=>i.id==='ufo').mapPosition};
 const sorted=nearby(data.unlocks,s.positions,maps);assert.equal(sorted[0].distance,0);assert.equal(sorted.at(-1).distance,null);
 const result=filterItems(data.unlocks,{sort:'near',maxDistance:'5'},s,maps);assert.ok(result.some(i=>i.id==='ufo'));assert.ok(result.every(i=>i.mapPosition?.mapId==='planet-wobb'));
});
test('application never requests real device location',async()=>{
 const {readdir}=await import('node:fs/promises');for(const f of await readdir(new URL('../src/',import.meta.url))){if(!f.endsWith('.js'))continue;const text=await readFile(new URL('../src/'+f,import.meta.url),'utf8');assert.doesNotMatch(text,/navigator\s*\.\s*geolocation|getCurrentPosition|watchPosition|ipapi|ipinfo/);}
});
test('positions from discarded maps are archived; progress is preserved',()=>{
 const m=memory(),old=defaultState();delete old.mapRevision;old.completed.ufo=true;old.positions['planet-wobb']={mapId:'planet-wobb',x:.5,y:.5};m.setItem(KEY,JSON.stringify(old));const migrated=createStore(m);assert.equal(migrated.value.completed.ufo,true);assert.deepEqual(migrated.value.positions,{});assert.equal(JSON.parse(m.getItem(KEY+'-before-original-maps')).positions['planet-wobb'].x,.5);
});
