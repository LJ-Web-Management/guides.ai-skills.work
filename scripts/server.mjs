import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { watch, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const port=Number(process.env.PORT||4321);
const host=process.env.HOST||'0.0.0.0';
const development=process.argv.includes('--dev');
const build=()=>spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit'}).status===0;
if((development||!existsSync(dist))&&!build())process.exit(1);
const metadata=JSON.parse(await readFile(path.join(dist,'build-manifest.json'),'utf8'));
const serveBase=new URL(metadata.siteUrl).pathname.replace(/\/$/,'');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/markdown; charset=utf-8','.xml':'application/xml; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');return;}
  try{
    const requestedPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(serveBase&&requestedPath===serveBase){res.writeHead(308,{'Location':`${serveBase}/`});res.end();return;}
    const pathname=serveBase&&requestedPath.startsWith(`${serveBase}/`)?requestedPath.slice(serveBase.length):requestedPath;
    const file=path.resolve(dist,`.${pathname}`);
    if(!file.startsWith(`${dist}${path.sep}`)&&file!==dist){res.writeHead(403);res.end('Forbidden');return;}
    let target=file;
    const info=await stat(target);
    if(info.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(308,{'Location':`${requestedPath}/${new URL(req.url,'http://localhost').search}`});res.end();return;}
      target=path.join(target,'index.html');
    }
    const body=await readFile(target);
    res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control',development?'no-store':'public, max-age=0, must-revalidate');
    if(pathname.startsWith('/api/'))res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Content-Length',body.length);
    res.writeHead(200);res.end(req.method==='HEAD'?undefined:body);
  }catch(error){
    if(error instanceof URIError){res.writeHead(400);res.end('Bad request');return;}
    res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex'});
    const body=await readFile(path.join(dist,'404.html')).catch(()=>Buffer.from('Not found'));
    res.end(req.method==='HEAD'?undefined:body);
  }
});
server.listen(port,host,()=>console.log(`Field Guide listening on ${host}:${port}${development?' (development)':''}`));
if(development){let timer;for(const dir of ['src','public'])watch(path.join(root,dir),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(build,150);});}
process.on('SIGTERM',()=>server.close());process.on('SIGINT',()=>server.close());
