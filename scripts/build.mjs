import { mkdir, rm, cp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, categories } from '../src/site.mjs';
import { guides, guidePath } from '../src/content/index.mjs';
import { quizzes } from '../src/content/quizzes.mjs';
import { layout, esc, href, absolute } from '../src/render.mjs';
import { homePage, categoryPage, articlePage, quizIndexPage, quizPage, searchPage, aboutPage, privacyPage, accessibilityPage, prosePage } from '../src/pages.mjs';
import { catalog, publicGuide, quizCatalog, openapi, webmcpManifest, markdown, llmsIndex, developersPage, apiPage, webmcpPage } from '../src/discovery.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
const url=new URL(site.url);
if(!['https:','http:'].includes(url.protocol)||url.search||url.hash)throw new Error('SITE_URL must be an absolute HTTP URL without a query or fragment.');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
const write=async(file,content)=>{const target=path.join(output,file);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,content);};
const writeJSON=(file,data)=>write(file,JSON.stringify(data,null,2)+'\n');
await cp(path.join(root,'public'),output,{recursive:true});
await cp(path.join(root,'src/styles.css'),path.join(output,'assets/style.css'));
await cp(path.join(root,'src/client/app.js'),path.join(output,'assets/app.js'));
await cp(path.join(root,'src/lib/quiz.mjs'),path.join(output,'assets/quiz-core.js'));
await cp(path.join(root,'src/lib/search.mjs'),path.join(output,'assets/search-core.js'));
await cp(path.join(root,'node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2'),path.join(output,'assets/dm-sans.woff2'));
await cp(path.join(root,'node_modules/@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2'),path.join(output,'assets/newsreader-italic.woff2'));
await mkdir(path.join(output,'licenses'),{recursive:true});
await cp(path.join(root,'node_modules/@fontsource-variable/dm-sans/LICENSE'),path.join(output,'licenses/dm-sans.txt'));
await cp(path.join(root,'node_modules/@fontsource-variable/newsreader/LICENSE'),path.join(output,'licenses/newsreader.txt'));

const pages=new Map();
const add=(route,html)=>pages.set(route,html);
add('/',homePage());
for(const category of categories)add(`/${category.slug}/`,categoryPage(category));
for(const guide of guides){add(guidePath(guide),articlePage(guide));await write(`${guidePath(guide).slice(1)}index.md`,markdown(guide));await writeJSON(`api/v1/guides/${guide.slug}.json`,publicGuide(guide));}
add('/quizzes/',quizIndexPage());
for(const quiz of quizzes){add(`/quizzes/${quiz.slug}/`,quizPage(quiz));await writeJSON(`api/v1/quizzes/${quiz.slug}.json`,quiz);}
add('/search/',searchPage());
add('/about/',aboutPage());add('/privacy/',privacyPage());add('/accessibility/',accessibilityPage());
add('/developers/',developersPage());add('/developers/api/',apiPage());add('/developers/webmcp/',webmcpPage());
add('/sitemap/',prosePage('Every page. One place.','Browse the full learning center by topic.','/sitemap/',`${categories.map(c=>`<h2><a href="${href(`/${c.slug}/`)}">${esc(c.label)}</a></h2><ul>${guides.filter(g=>g.category===c.slug).map(g=>`<li><a href="${href(guidePath(g))}">${esc(g.title)}</a></li>`).join('')}</ul>`).join('')}<h2>Free quizzes</h2><ul>${quizzes.map(q=>`<li><a href="${href(`/quizzes/${q.slug}/`)}">${esc(q.title)}</a></li>`).join('')}</ul><h2>About and resources</h2><ul>${[['About','/about/'],['Privacy','/privacy/'],['Accessibility','/accessibility/'],['Developers','/developers/'],['API reference','/developers/api/'],['WebMCP','/developers/webmcp/']].map(([label,route])=>`<li><a href="${href(route)}">${label}</a></li>`).join('')}</ul>`));
for(const [route,html] of pages)await write(`${route.slice(1)}index.html`,html);
await write('404.html',layout({title:'A different path awaits',description:'This page could not be found. Explore the free AI lessons or search the field guide.',path:'/404/',noindex:true,content:`<section class="container page-intro centered"><span class="eyebrow">PAGE NOT FOUND / 404</span><h1>Let’s find a <em>better path.</em></h1><p>The page you’re looking for isn’t here. There’s still plenty to explore.</p><a class="button" href="${href('/')}">Back to the field guide ↗</a> <a class="button button-secondary" href="${href('/search/')}">Search the guides</a></section>`}));

await writeJSON('api/v1/catalog.json',catalog);
await writeJSON('api/v1/quizzes.json',quizCatalog);
await writeJSON('api/v1/site.json',{name:site.title,url:site.url,updated:site.updated,guideCount:guides.length,quizCount:quizzes.length,openapi:absolute('/openapi.json'),llms:absolute('/llms.txt'),sitemap:absolute('/sitemap.xml'),webmcp:absolute('/developers/webmcp/')});
await writeJSON('openapi.json',openapi);
await writeJSON('webmcp.json',webmcpManifest);
await write('llms.txt',llmsIndex());
await write('llms-full.txt',`${llmsIndex()}\n\n# Complete guides\n\n${guides.map(markdown).join('\n\n***\n\n')}`);
const xmlEsc=esc;
const sitemap=routes=>`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route=>`<url><loc>${xmlEsc(absolute(route))}</loc><lastmod>${site.updated}</lastmod></url>`).join('')}</urlset>\n`;
const guideRoutes=guides.map(guidePath);
const quizRoutes=quizzes.map(q=>`/quizzes/${q.slug}/`);
const otherRoutes=[...pages.keys()].filter(route=>!guideRoutes.includes(route)&&!quizRoutes.includes(route)&&route!=='/search/');
await write('sitemap-guides.xml',sitemap(guideRoutes));
await write('sitemap-quizzes.xml',sitemap(quizRoutes));
await write('sitemap-pages.xml',sitemap(otherRoutes));
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['guides','quizzes','pages'].map(name=>`<sitemap><loc>${xmlEsc(absolute(`/sitemap-${name}.xml`))}</loc><lastmod>${site.updated}</lastmod></sitemap>`).join('')}</sitemapindex>\n`);
await write('robots.txt',`User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`);
await write('feed.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom"><title>${xmlEsc(site.title)}</title><id>${xmlEsc(site.url)}/</id><link href="${xmlEsc(absolute('/feed.xml'))}" rel="self"/><link href="${xmlEsc(site.url)}/"/><updated>${site.updated}T00:00:00Z</updated><author><name>ai-skills.work</name></author>${guides.map(g=>`<entry><title>${xmlEsc(g.title)}</title><id>${xmlEsc(absolute(guidePath(g)))}</id><link href="${xmlEsc(absolute(guidePath(g)))}"/><updated>${site.updated}T00:00:00Z</updated><summary>${xmlEsc(g.description)}</summary></entry>`).join('')}</feed>\n`);
await writeJSON('site.webmanifest',{name:site.title,short_name:'AI Field Guide',start_url:href('/'),display:'browser',background_color:'#faf9f6',theme_color:'#faf9f6',icons:[{src:href('/favicon.svg'),sizes:'any',type:'image/svg+xml',purpose:'any'}]});
await write('.nojekyll','');
if(process.env.CUSTOM_DOMAIN){
  if(!/^(?!-)[a-z0-9.-]+(?<!-)$/.test(process.env.CUSTOM_DOMAIN)||process.env.CUSTOM_DOMAIN!==url.hostname)throw new Error('CUSTOM_DOMAIN must be a valid hostname matching SITE_URL.');
  await write('CNAME',`${process.env.CUSTOM_DOMAIN}\n`);
}
const manifest={siteUrl:site.url,guideCount:guides.length,quizCount:quizzes.length,htmlPages:pages.size+1,indexablePages:otherRoutes.length+guideRoutes.length+quizRoutes.length,routes:[...pages.keys()]};
await writeJSON('build-manifest.json',manifest);
console.log(`Built ${manifest.htmlPages} HTML pages, ${guides.length} guides, ${quizzes.length} quizzes, and discovery resources for ${site.url}.`);
