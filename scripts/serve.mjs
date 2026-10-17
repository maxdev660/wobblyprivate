import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const root=path.resolve(project,process.argv[2]||'.');
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname.split('/').some(p=>p.startsWith('.')||['prompt','node_modules','tests','scripts','src-tauri'].includes(p))){res.writeHead(403);res.end();return;}
  let file=path.resolve(root,'.'+pathname);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Permissions-Policy':'geolocation=()'});res.end(bytes);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Wobbly Guide: http://127.0.0.1:${port}`));
