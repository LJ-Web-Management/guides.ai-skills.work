import { appendFile } from 'node:fs/promises';

const input=process.argv[2];
if(!input)throw new Error('Provide the live HTTPS site URL.');
const origin=new URL(input);
if(origin.protocol!=='https:'||origin.search||origin.hash||origin.username||origin.password)throw new Error('Provide an HTTPS site URL without credentials, query, or fragment.');
const siteUrl=origin.href.replace(/\/$/,'');
const fetchResource=async(path)=>{
  const response=await fetch(`${siteUrl}${path}`,{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});
  if(response.status!==200)throw new Error(`${path}: expected HTTP 200, received ${response.status}`);
  return response;
};

let lastError;
for(let attempt=1;attempt<=12;attempt++){
  try{
    const html=await(await fetchResource('/')).text();
    if(!/<h1>A little learning\./.test(html))throw new Error('The generated homepage has not reached the live origin yet.');
    if(!html.includes(`rel="canonical" href="${siteUrl}/"`))throw new Error('The homepage canonical does not match the live site URL.');
    const catalog=await(await fetchResource('/api/v1/catalog.json')).json();
    if(catalog.guides?.length!==34)throw new Error('Expected the complete 34-guide catalog.');
    if(!catalog.guides.every(g=>g.url.startsWith(`${siteUrl}/`)))throw new Error('Guide catalog URLs do not match the live site.');
    const quizzes=await(await fetchResource('/api/v1/quizzes.json')).json();
    if(quizzes.quizzes?.length!==6)throw new Error('Expected six live quizzes.');
    const lesson=await(await fetchResource('/learn/write-better-ai-prompts/')).text();
    if(!lesson.includes('Better prompts. More useful answers.')||!lesson.includes('Try one small thing'))throw new Error('The live lesson content is incomplete.');
    const quiz=await(await fetchResource('/quizzes/ai-basics/')).text();
    const quizData=JSON.parse(quiz.match(/<script id="quiz-data" type="application\/json">(.*?)<\/script>/s)?.[1]||'null');
    if(quizData?.questions.length!==6||!quiz.includes('id="partial-dialog"'))throw new Error('The live quiz is missing questions or its partial-submission warning.');
    for(const path of ['/sitemap.xml','/sitemap-guides.xml','/sitemap-quizzes.xml','/sitemap-pages.xml','/llms.txt','/llms-full.txt','/developers/api/','/developers/webmcp/','/webmcp.json','/feed.xml'])await fetchResource(path);
    const robots=await(await fetchResource('/robots.txt')).text();
    if(!robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`))throw new Error('robots.txt points to the wrong sitemap.');
    const schema=await(await fetchResource('/openapi.json')).json();
    if(schema.openapi!=='3.1.0'||schema.servers[0].url!==siteUrl)throw new Error('The live API specification has an incorrect origin.');
    const app=await(await fetchResource('/assets/app.js')).text();
    if(!app.includes('search_guides')||!app.includes('submit-quiz'))throw new Error('The live interaction script is incomplete.');
    await fetchResource('/assets/quiz-core.js');await fetchResource('/assets/search-core.js');await fetchResource('/assets/style.css');
    const font=Buffer.from(await(await fetchResource('/assets/dm-sans.woff2')).arrayBuffer());
    if(font.subarray(0,4).toString()!=='wOF2')throw new Error('The live font is not a WOFF2 asset.');
    const image=Buffer.from(await(await fetchResource('/social.png')).arrayBuffer());
    if(image.subarray(1,4).toString()!=='PNG')throw new Error('The social sharing image is not a PNG.');
    const message=`${siteUrl}/ serves the generated homepage, 34 guides, six quizzes, working assets, sitemaps, robots.txt, llms files, WebMCP, and API documentation.`;
    console.log(message);
    console.log(`::notice title=Live site verified::${message}`);
    if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,`## Live site verified\n\n[Open the AI Skills Field Guide](${siteUrl}/)\n\nVerified the generated homepage, lesson and quiz content, 34-guide catalog, six-quiz catalog, production assets, canonical URLs, XML sitemaps, robots.txt, llms files, WebMCP, and OpenAPI documentation over live HTTPS.\n`);
    process.exit(0);
  }catch(error){
    lastError=error;
    console.log(`Live verification attempt ${attempt}/12: ${error.message}`);
    if(attempt<12)await new Promise(resolve=>setTimeout(resolve,10000));
  }
}
throw lastError;
