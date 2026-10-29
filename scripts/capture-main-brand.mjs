import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output='references/main-brand';
await mkdir(output,{recursive:true});
const browser=await chromium.launch();
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const page=await context.newPage();
  const response=await page.goto('https://ai-skills.work/',{waitUntil:'domcontentloaded',timeout:60000});
  if(!response?.ok())throw new Error(`Main site returned ${response?.status()}.`);
  await page.waitForFunction(()=>document.body.innerText.trim().length>200,undefined,{timeout:15000});
  await page.evaluate(()=>document.fonts.ready);
  const snapshot=await page.evaluate(()=>{
    const properties=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textTransform','color','backgroundColor','backgroundImage','borderColor','borderWidth','borderRadius','boxShadow','padding','gap','height','maxWidth'];
    const style=element=>element?Object.fromEntries(properties.map(p=>[p,getComputedStyle(element)[p]])):null;
    const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden';};
    const describe=e=>({tag:e.tagName,text:e.innerText?.trim().replace(/\s+/g,' '),href:e.href||null,className:typeof e.className==='string'?e.className:null,style:style(e)});
    const header=[...document.querySelectorAll('header,[role="banner"],.site-header,[data-elementor-type="header"]')].find(visible);
    const clone=header?.cloneNode(true);
    clone?.querySelectorAll('script,style').forEach(e=>e.remove());
    const rootStyle=getComputedStyle(document.documentElement);
    const variables=Object.fromEntries([...rootStyle].filter(p=>p.startsWith('--')&&/color|font|radius|background|primary|accent|brand/.test(p)).map(p=>[p,rootStyle.getPropertyValue(p).trim()]));
    return {url:location.href,title:document.title,body:style(document.body),h1:style(document.querySelector('h1')),h2:style(document.querySelector('h2')),header:style(header),headerHtml:clone?.outerHTML||null,headerLinks:header?[...header.querySelectorAll('a,button')].filter(visible).map(describe):[],links:[...document.querySelectorAll('a,button')].filter(visible).slice(0,65).map(describe),images:[...document.images].filter(visible).slice(0,15).map(e=>({src:e.currentSrc||e.src,alt:e.alt,width:e.width,height:e.height})),inlineLogos:header?[...header.querySelectorAll('svg')].slice(0,5).map(e=>e.outerHTML):[],variables,bodyText:document.body.innerText.slice(0,15000),stylesheets:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.href)};
  });
  if(/just a moment|access denied|verify you are human/i.test(snapshot.title))throw new Error('Main site requires an interactive access check; no reference was captured.');
  await page.screenshot({path:`${output}/desktop.png`,fullPage:true,animations:'disabled'});
  const logo=snapshot.images.find(i=>/logo|brand|AI Skills/i.test(i.alt+' '+i.src))||snapshot.images[0];
  if(logo?.src?.startsWith('https://')){
    const response=await fetch(logo.src);
    if(response.ok){const type=response.headers.get('content-type')||'';const extension=type.includes('svg')?'svg':type.includes('png')?'png':type.includes('webp')?'webp':type.includes('jpeg')?'jpg':null;if(extension){await writeFile(`${output}/logo.${extension}`,Buffer.from(await response.arrayBuffer()));snapshot.savedLogo=`logo.${extension}`;}}
  }
  for(let i=0;i<snapshot.stylesheets.length;i++){
    const url=snapshot.stylesheets[i];
    if(new URL(url).origin==='https://ai-skills.work'){
      const response=await fetch(url);if(response.ok)await writeFile(`${output}/main-${i}.css`,await response.text());
    }
  }
  snapshot.headingDetails=await page.evaluate(()=>[...document.querySelectorAll('h1,h2')].map(e=>({text:e.innerText,html:e.innerHTML,children:[...e.querySelectorAll('span,em,strong')].map(s=>({text:s.innerText,color:getComputedStyle(s).color}))})));
  snapshot.favicon=await page.evaluate(()=>document.querySelector('link[rel~="icon"]')?.href||null);
  if(snapshot.favicon){const r=await fetch(snapshot.favicon);if(r.ok){const extension=new URL(snapshot.favicon).pathname.split('.').pop();if(['svg','ico','png','webp'].includes(extension)){await writeFile(`${output}/favicon.${extension}`,Buffer.from(await r.arrayBuffer()));snapshot.savedFavicon=`favicon.${extension}`;}}}
  const mobile=await context.newPage();
  await mobile.setViewportSize({width:390,height:844});
  await mobile.goto('https://ai-skills.work/',{waitUntil:'domcontentloaded',timeout:60000});
  await mobile.screenshot({path:`${output}/mobile.png`,fullPage:true,animations:'disabled'});
  snapshot.mobile=await mobile.evaluate(()=>({header:document.querySelector('header')?.outerHTML,buttons:[...document.querySelectorAll('header a,header button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height;}).map(e=>({text:e.innerText,href:e.href,ariaLabel:e.getAttribute('aria-label')}))}));
  await writeFile(`${output}/reference.json`,JSON.stringify(snapshot,null,2)+'\n');
  console.log('::notice title=Brand reference captured::Captured the public ai-skills.work header, CTAs, fonts, colors, logo, and desktop/mobile appearance.');
}catch(error){
  const message=String(error.message).replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A');
  console.log(`::error title=Main-site reference capture failed::${message}`);
  throw error;
}finally{await browser.close();}
