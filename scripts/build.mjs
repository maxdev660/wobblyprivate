import {readFile,writeFile,readdir,mkdir,cp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {validateCatalog} from '../src/catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'dist');
if(path.dirname(out)!==path.resolve(root)||path.basename(out)!=='dist')throw Error('Unsafe output directory');
const readJSON=async f=>JSON.parse(await readFile(path.join(root,f),'utf8'));
validateCatalog(await readJSON('data/unlocks.json'),await readJSON('data/categories.json'),await readJSON('data/maps.json'));
await rm(out,{force:true,recursive:true});await mkdir(out,{recursive:true});
for(const f of ['index.html','style.css','script.js','src','assets','data','manifest.webmanifest','_headers','_redirects'])await cp(path.join(root,f),path.join(out,f),{recursive:true});
const env={...process.env};try{const text=await readFile(path.join(root,'.env.local'),'utf8');for(const line of text.split(/\r?\n/)){const m=line.match(/^([A-Z0-9_]+)=(.*)$/);if(m&&!env[m[1]])env[m[1]]=m[2].replace(/^["']|["']$/g,'');}}catch{}
const names={apiKey:'VITE_FIREBASE_API_KEY',authDomain:'VITE_FIREBASE_AUTH_DOMAIN',projectId:'VITE_FIREBASE_PROJECT_ID',appId:'VITE_FIREBASE_APP_ID'};
const config=Object.fromEntries(Object.entries(names).map(([key,value])=>[key,env[value]||'']));
if(Object.values(config).some(Boolean)&&!Object.values(config).every(Boolean))throw Error('Provide all four public Firebase values, or leave all empty.');
await writeFile(path.join(out,'src/config.js'),`export const firebaseConfig = ${JSON.stringify(config.apiKey?config:null)};\n`);
async function files(dir,prefix=''){const result=[];for(const e of await readdir(dir,{withFileTypes:true})){const rel=prefix+e.name;if(e.isDirectory())result.push(...await files(path.join(dir,e.name),rel+'/'));else result.push(rel);}return result;}
const assets=(await files(out)).filter(f=>!f.startsWith('_')).sort();
const hash=createHash('sha256');for(const f of assets)hash.update(await readFile(path.join(out,f)));const revision=hash.digest('hex').slice(0,12);
const worker=(await readFile(path.join(root,'sw.js'),'utf8')).replace("'wobbly-guide-dev'",JSON.stringify('wobbly-guide-'+revision)).replace('/* BUILD_PRECACHE */',assets.map(f=>JSON.stringify('./'+f)).join(','));
await writeFile(path.join(out,'sw.js'),worker);
let size=0;for(const f of await files(out))size+=(await readFile(path.join(out,f))).byteLength;
console.log(`Built ${assets.length+1} files, ${(size/1024).toFixed(1)} KiB, revision ${revision}. Firebase ${config.apiKey?'configured':'not configured (guest mode)'}.`);
