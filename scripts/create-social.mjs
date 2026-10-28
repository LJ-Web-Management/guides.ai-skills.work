import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
const font=(await readFile('node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2')).toString('base64');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
try{
  const page=await browser.newPage({viewport:{width:1200,height:630},deviceScaleFactor:1});
  await page.setContent(`<style>@font-face{font-family:DM;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;background:#faf9f6;color:#24253b;font-family:DM,Arial;padding:64px 75px}header{display:flex;align-items:center;gap:15px;font-size:25px}header span{color:#9b84b4;font-size:45px}.tag{font-size:12px;letter-spacing:3px;margin:60px 0 22px;color:#78668a}h1{font-size:78px;letter-spacing:-5px;line-height:1.07;font-weight:500;margin:0}h1 span{color:#806095}p{font-size:19px;color:#756e7e;margin-top:28px}.circle{position:absolute;width:420px;height:420px;right:-100px;top:165px;border:1px solid #cdbfda;border-radius:50%;background:#eee7f250;z-index:-1}.circle:after{content:'';position:absolute;width:370px;height:370px;left:-35px;top:35px;border:1px dashed #cdbfda;border-radius:50%}.badge{position:absolute;right:90px;bottom:70px;border:1px solid #d3c8dd;border-radius:50px;padding:15px 25px;background:#eee8f4;color:#6b507e;font-size:15px}</style><header><span>✦</span> ai-skills.work / THE FIELD GUIDE</header><div class="tag">USEFUL KNOWLEDGE. A MORE CONFIDENT NEXT STEP.</div><h1>A little learning.<br>A lot of <span>possibility.</span></h1><p>Free AI lessons, practical guides, and knowledge quizzes.</p><div class="circle"></div><div class="badge">Stay curious. Keep learning.</div>`);
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:'public/social.png'});
}finally{await browser.close();}
