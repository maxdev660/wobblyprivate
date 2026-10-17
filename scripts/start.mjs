import {spawn,spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const url='http://127.0.0.1:4173';
{const build=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit',windowsHide:true});if(build.status!==0)process.exit(1);}
async function ready(){try{const r=await fetch(url,{signal:AbortSignal.timeout(700)});return r.ok&&(await r.text()).includes('Wobbly Guide');}catch{return false;}}
if(!await ready()){const server=spawn(process.execPath,['scripts/serve.mjs','dist'],{cwd:root,detached:true,stdio:'ignore',windowsHide:true});server.unref();}
for(let i=0;i<15;i++){if(await ready()){spawn('cmd.exe',['/c','start','',url],{stdio:'ignore',windowsHide:true}).unref();console.log('Wobbly Guide: '+url);process.exit(0);}await new Promise(r=>setTimeout(r,200));}
console.error('Start failed. Run npm run preview and open '+url);process.exit(1);
