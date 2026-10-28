import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { guides, guideText } from '../src/content/index.mjs';
import { quizzes } from '../src/content/quizzes.mjs';
import { scoreQuiz } from '../src/lib/quiz.mjs';
import { searchGuides } from '../src/lib/search.mjs';
import { catalog } from '../src/discovery.mjs';

const dist=path.resolve('dist');
const manifest=JSON.parse(await fs.readFile(path.join(dist,'build-manifest.json'),'utf8'));
const siteBase=new URL(manifest.siteUrl).pathname.replace(/\/$/,'');
async function files(dir){const entries=await fs.readdir(dir,{withFileTypes:true});return(await Promise.all(entries.map(e=>e.isDirectory()?files(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const built=await files(dist);

test('launch content covers the approved topics with complete unique guides',()=>{
  assert.equal(guides.length,34);assert.equal(new Set(guides.map(g=>g.slug)).size,34);
  assert.equal(quizzes.length,6);
  for(const guide of guides){assert.equal(guide.sections.length,3);assert.ok(guideText(guide).split(/\s+/).length>=200,guide.slug);assert.ok(guide.exercise);assert.equal(guide.faq.length,2);}
  for(const quiz of quizzes){assert.equal(quiz.questions.length,6);for(const q of quiz.questions){assert.ok(q.options[q.correct]);assert.ok(q.explanation.length>35);}}
});
test('complete and partial scores preserve completion and accuracy separately',()=>{
  const questions=[{options:['a','b'],correct:0},{options:['a','b'],correct:1},{options:['a','b'],correct:1}];
  assert.deepEqual(scoreQuiz(questions,[0,null,0]),{answered:2,correct:1,total:3,unanswered:1,percentage:50,complete:false});
  assert.deepEqual(scoreQuiz(questions,[0,1,1]),{answered:3,correct:3,total:3,unanswered:0,percentage:100,complete:true});
  assert.equal(scoreQuiz(questions,[null,null,null]).percentage,null);
  for(const answers of [[0],[-1,null,null],[1.2,null,null],[2,null,null],['0',null,null]])assert.throws(()=>scoreQuiz(questions,answers));
});
test('search finds useful matches and respects topic filters',()=>{
  assert.equal(searchGuides(catalog.guides,'').length,34);
  assert.ok(searchGuides(catalog.guides,'better prompts').some(g=>g.slug==='write-better-ai-prompts'));
  assert.ok(searchGuides(catalog.guides,'AI and my job').some(g=>g.slug==='will-ai-affect-my-job'));
  assert.ok(searchGuides(catalog.guides,'spreadsheets').some(g=>g.slug==='ai-spreadsheets-and-data'));
  assert.ok(searchGuides(catalog.guides,'','roles').every(g=>g.category==='roles'));
  assert.equal(searchGuides(catalog.guides,'zzzxxyy').length,0);
  assert.throws(()=>searchGuides(catalog.guides,'x'.repeat(201)));
});
test('every HTML page has unique metadata, canonical URL, and parseable structured data',async()=>{
  const titles=new Set();const descriptions=new Set();
  for(const file of built.filter(f=>f.endsWith('.html'))){
    const html=await fs.readFile(file,'utf8');
    const title=html.match(/<title>(.*?)<\/title>/s)?.[1];assert.ok(title,file);assert.ok(!titles.has(title),title);titles.add(title);
    const desc=html.match(/<meta name="description" content="([^"]+)"/)?.[1];assert.ok(desc,file);assert.ok(!descriptions.has(desc),desc);descriptions.add(desc);
    assert.equal((html.match(/<h1[ >]/g)||[]).length,1,file);
    assert.ok(html.includes('<link rel="canonical"'),file);
    for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs))assert.equal(JSON.parse(match[1])['@context'],'https://schema.org');
    assert.ok(!html.includes(String.fromCodePoint(0x2014)),file);
  }
});
test('all local links, scripts, fonts, images, and article fragments resolve',async()=>{
  for(const file of built.filter(f=>f.endsWith('.html'))){
    const html=await fs.readFile(file,'utf8');
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      let url=match[1].replaceAll('&amp;','&');
      if(/^(https?:|data:|mailto:)/.test(url))continue;
      const parsed=new URL(url,'https://local.test/'+path.relative(dist,file));
      let pathname=decodeURIComponent(parsed.pathname);
      if(siteBase&&pathname.startsWith(siteBase))pathname=pathname.slice(siteBase.length)||'/';
      let target=path.join(dist,pathname);
      const info=await fs.stat(target).catch(()=>null);assert.ok(info,`${file}: ${url}`);
      if(info.isDirectory())target=path.join(target,'index.html');
      assert.ok(await fs.stat(target).catch(()=>null),`${file}: ${url}`);
      if(parsed.hash&&target.endsWith('.html')){const targetHtml=await fs.readFile(target,'utf8');assert.ok(targetHtml.includes(`id="${parsed.hash.slice(1)}"`),`${file}: ${url}`);}
    }
  }
});
test('sitemaps contain exactly the canonical indexable HTML pages',async()=>{
  const urls=[];
  for(const name of ['sitemap-guides.xml','sitemap-quizzes.xml','sitemap-pages.xml']){
    const xml=await fs.readFile(path.join(dist,name),'utf8');
    for(const match of xml.matchAll(/<loc>(.*?)<\/loc>/g))urls.push(match[1]);
  }
  assert.equal(urls.length,manifest.indexablePages);assert.equal(new Set(urls).size,urls.length);
  assert.ok(!urls.some(u=>u.endsWith('/search/')||u.includes('404')));
  for(const route of manifest.routes.filter(r=>r!=='/search/'))assert.ok(urls.includes(manifest.siteUrl+route),route);
  assert.ok((await fs.readFile(path.join(dist,'robots.txt'),'utf8')).includes(`${manifest.siteUrl}/sitemap.xml`));
});
test('all documented API resources exist and answer keys are internally valid',async()=>{
  const schema=JSON.parse(await fs.readFile(path.join(dist,'openapi.json'),'utf8'));assert.equal(schema.openapi,'3.1.0');
  for(const endpoint of Object.keys(schema.paths).filter(p=>!p.includes('{')))JSON.parse(await fs.readFile(path.join(dist,endpoint),'utf8'));
  for(const g of guides){const data=JSON.parse(await fs.readFile(path.join(dist,`api/v1/guides/${g.slug}.json`),'utf8'));assert.equal(data.title,g.title);assert.equal(data.sections.length,3);}
  for(const q of quizzes){const data=JSON.parse(await fs.readFile(path.join(dist,`api/v1/quizzes/${q.slug}.json`),'utf8'));assert.equal(data.questions.length,6);}
  for(const name of ['llms.txt','llms-full.txt']){const text=await fs.readFile(path.join(dist,name),'utf8');for(const guide of guides)assert.ok(text.includes(guide.title));}
});
