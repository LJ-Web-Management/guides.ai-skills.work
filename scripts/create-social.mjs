import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const font=(await readFile('node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2')).toString('base64');
const logo=(await readFile('public/brand/logo.webp')).toString('base64');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
try{
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent(`<style>@font-face{font-family:Jakarta;src:url(data:font/woff2;base64,${font});font-weight:200 800}*{box-sizing:border-box}body{margin:0;background:oklch(99% .004 250.33);color:oklch(18% .04 250.33);font-family:Jakarta,Arial;padding:65px 75px}header{display:flex;align-items:center;gap:35px}header img{height:46px;width:auto}header span{font-size:15px;color:#465e72;font-weight:600;border-left:1px solid #dce5eb;padding-left:28px}.tag{font-size:12px;letter-spacing:2.5px;margin:70px 0 22px;color:#32666f;font-weight:700}h1{font-size:69px;letter-spacing:-2.8px;line-height:1.12;font-weight:800;margin:0}h1 span{color:oklch(31.65% .0893 250.33)}p{font-size:18px;color:#465e72;margin-top:28px}.circle{position:absolute;width:430px;height:430px;right:-110px;top:175px;border:1px solid #a3d8d8;border-radius:50%;background:#e4f3f45c;z-index:-1}.circle:after{content:'';position:absolute;width:370px;height:370px;left:-40px;top:35px;border:1px dashed #a3d8d8;border-radius:50%}.badge{position:absolute;right:75px;bottom:65px;border-radius:9999px;padding:16px 24px;background:oklch(84.96% .0711 191.43);color:oklch(18% .04 250.33);font-size:14px;font-weight:700}</style><header><img src="data:image/webp;base64,${logo}" alt="AI Skills"><span>GUIDES & LESSONS</span></header><div class="tag">PRACTICAL AI SKILLS FOR EVERYDAY WORK</div><h1>A little learning.<br>A lot of <span>possibility.</span></h1><p>Free AI lessons, practical guides, and knowledge quizzes.</p><div class="circle"></div><div class="badge">Learn at your own pace.</div>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'public/social.png'});
}finally{await browser.close();}
