import { readFile, writeFile, readdir, mkdir, lstat, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const manifestPath=path.join(root,'.pages-root-manifest.json');
const protectedRoots=new Set(['.git','.github','.gitignore','.node-version','src','scripts','tests','public','node_modules','dist','README.md','package.json','package-lock.json','playwright.config.mjs']);
const safe=relative=>relative&&!path.isAbsolute(relative)&&!relative.split('/').some(p=>p==='..'||p==='.')&&!protectedRoots.has(relative.split('/')[0])&&relative!=='.pages-root-manifest.json';
const hash=data=>createHash('sha256').update(data).digest('hex');
async function walk(dir,prefix=''){
  const found=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const relative=prefix+entry.name;
    if(entry.isSymbolicLink())throw new Error(`Do not publish a symlink: ${relative}`);
    if(entry.isDirectory())found.push(...await walk(path.join(dir,entry.name),relative+'/'));
    else found.push(relative);
  }
  return found.sort();
}
let previous={files:{}};
try{previous=JSON.parse(await readFile(manifestPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
for(const relative of Object.keys(previous.files))if(!safe(relative))throw new Error(`Unsafe prior publication path: ${relative}`);
const nextFiles={};
const contents=new Map();
for(const relative of await walk(dist)){
  if(!safe(relative))throw new Error(`Publication would overwrite a source path: ${relative}`);
  const data=await readFile(path.join(dist,relative));
  nextFiles[relative]=hash(data);contents.set(relative,data);
}
const release=hash(JSON.stringify(nextFiles));
const marker=Buffer.from(JSON.stringify({release,siteUrl:JSON.parse(contents.get('build-manifest.json').toString()).siteUrl},null,2)+'\n');
nextFiles['site-release.json']=hash(marker);contents.set('site-release.json',marker);
// Validate ownership before changing files. Preserve manual edits and application source.
for(const relative of new Set([...Object.keys(previous.files),...Object.keys(nextFiles)])){
  const target=path.join(root,relative);
  const info=await lstat(target).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(!info)continue;
  if(info.isSymbolicLink()||!info.isFile())throw new Error(`Publication target is not a regular file: ${relative}`);
  const actual=hash(await readFile(target));
  if(previous.files[relative]){
    if(actual!==previous.files[relative])throw new Error(`Preserve a manually edited generated file before republishing: ${relative}`);
  }else if(actual!==nextFiles[relative])throw new Error(`Publication would overwrite an existing file: ${relative}`);
}
for(const [relative,data] of contents){const target=path.join(root,relative);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,data);}
for(const relative of Object.keys(previous.files))if(!nextFiles[relative])await rm(path.join(root,relative));
await writeFile(manifestPath,JSON.stringify({release,files:nextFiles},null,2)+'\n');
if(process.argv.includes('--stage')){
  const paths=[...new Set([...Object.keys(previous.files),...Object.keys(nextFiles),'.pages-root-manifest.json'])];
  const result=spawnSync('git',['add','--all','--',...paths],{cwd:root,stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
console.log(`Prepared ${contents.size} generated files for GitHub Pages main / root. Release ${release.slice(0,12)}.`);
