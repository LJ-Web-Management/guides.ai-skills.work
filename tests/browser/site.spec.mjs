import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { quizzes } from '../../src/content/quizzes.mjs';

test('home, lesson, and navigation work without horizontal overflow',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['/','/learn/','/learn/write-better-ai-prompts/','/roles/','/developers/api/']){
    const response=await page.goto(route);expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto('/');
  if(testInfo.project.name==='mobile'){
    await page.getByRole('button',{name:'Open navigation'}).click();await expect(page.locator('#mobile-nav')).toBeVisible();
    await expect(page.locator('.mobile-learning-links').getByRole('link',{name:'Learn AI',exact:true})).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.locator('#mobile-nav')).toBeHidden();
  }else{
    const trigger=page.locator('.guide-menu>summary');
    await trigger.click();await expect(page.locator('.guide-menu-panel')).toBeVisible();
    await page.keyboard.press('Escape');await expect(page.locator('.guide-menu-panel')).toBeHidden();
    await expect(trigger).toBeFocused();
    await trigger.click();await page.locator('h1').click();await expect(page.locator('.guide-menu-panel')).toBeHidden();
    await trigger.click();await page.locator('.guide-menu-panel').getByRole('link',{name:'Learn AI',exact:true}).click();
    await expect(page).toHaveURL(/\/learn\/$/);await page.goto('/');
  }
  await page.getByRole('link',{name:'Find your starting point'}).click();await expect(page).toHaveURL(/\/learn\/$/);
  expect(errors).toEqual([]);
});

test('search supports queries, filters, empty states, and safe user text',async({page})=>{
  await page.goto('/search/?q=better%20prompts');
  await expect(page.locator('#search-results .guide-card:visible')).toHaveCount(2);
  await expect(page.getByRole('status')).toContainText('2 guides');
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button',{name:'AI for your role',exact:true}).click();
  await expect(page.locator('#search-results .guide-card:visible')).toHaveCount(7);
  await page.getByRole('button',{name:'All guides',exact:true}).click();
  await page.getByRole('searchbox').fill('zzzxxyy');
  await expect(page.getByRole('status')).toContainText('No matching');
  await page.getByRole('searchbox').fill('<script>window.unwanted=true</script>');
  await expect(page.getByRole('status')).toContainText('No matching');
  expect(await page.evaluate(()=>window.unwanted)).toBeUndefined();
});

test('partial quiz submission warns, supports cancellation, and reports the right denominator',async({page})=>{
  await page.goto('/quizzes/ai-basics/');
  await expect(page.getByRole('button',{name:'See my results'})).toBeDisabled();
  await page.getByRole('radio').nth(0).check();
  await page.getByRole('button',{name:'Next question'}).click();
  await page.getByRole('radio').nth(0).check();
  await page.getByRole('button',{name:'Previous',exact:false}).click();
  await expect(page.getByRole('radio').nth(0)).toBeChecked();
  await page.getByRole('button',{name:'See my results'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('may not be fully accurate');
  await page.getByRole('button',{name:'Keep answering'}).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button',{name:'See my results'}).click();
  await page.getByRole('button',{name:'Submit anyway'}).click();
  await expect(page.locator('.result-card')).toContainText('1 of 2 answered correctly');
  await expect(page.locator('.completion-line')).toContainText('2 of 6 questions answered');
  await expect(page.locator('.score-circle')).toContainText('50');
  await expect(page.locator('.partial-notice')).toBeVisible();
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('button',{name:'See my results'})).toBeDisabled();
  await expect(page.getByRole('radio').nth(0)).not.toBeChecked();
});

for(const quiz of quizzes)test(`complete quiz: ${quiz.slug}`,async({page})=>{
  await page.goto(`/quizzes/${quiz.slug}/`);
  for(let i=0;i<quiz.questions.length;i++){
    await page.getByRole('radio').nth(quiz.questions[i].correct).check();
    if(i<quiz.questions.length-1)await page.getByRole('button',{name:'Next question'}).click();
  }
  await page.getByRole('button',{name:'See my results'}).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.result-card')).toContainText('6 of 6 answered correctly');
  await expect(page.locator('.score-circle')).toContainText('100');
  await expect(page.locator('.review-item')).toHaveCount(6);
  await page.locator('.review-item summary').first().click();
  await expect(page.locator('.review-body').first()).toBeVisible();
});

test('WebMCP tools read public content and validate inputs',async({page})=>{
  await page.addInitScript(()=>{window.registeredTools={};Object.defineProperty(document,'modelContext',{value:{registerTool:async tool=>{window.registeredTools[tool.name]=tool;}}});});
  await page.goto('/search/');
  await expect.poll(()=>page.evaluate(()=>Object.keys(window.registeredTools))).toHaveLength(3);
  const result=await page.evaluate(async()=>JSON.parse((await window.registeredTools.search_guides.execute({query:'better prompts'})).content[0].text));
  expect(result.guides[0].slug).toBe('write-better-ai-prompts');
  await expect(page.locator('#search-results .guide-card:visible')).toHaveCount(2);
  const guide=await page.evaluate(async()=>JSON.parse((await window.registeredTools.get_guide.execute({slug:'write-better-ai-prompts'})).content[0].text));
  expect(guide.sections).toHaveLength(3);
  const invalid=await page.evaluate(async()=>JSON.parse((await window.registeredTools.get_guide.execute({slug:'../../privacy'})).content[0].text));
  expect(invalid.error).toBeTruthy();
  const list=await page.evaluate(async()=>JSON.parse((await window.registeredTools.list_quizzes.execute()).content[0].text));expect(list.quizzes).toHaveLength(6);
});

test('pages, active quiz, dialog, and results have no detected WCAG A/AA violations',async({page})=>{
  const scan=async()=>{await page.evaluate(()=>Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished)));const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);};
  for(const route of ['/','/learn/what-is-ai/','/quizzes/','/search/','/developers/api/']){await page.goto(route);await scan();}
  await page.goto('/quizzes/ai-basics/');await scan();
  await page.getByRole('radio').first().check();await page.getByRole('button',{name:'See my results'}).click();await scan();
  await page.getByRole('button',{name:'Submit anyway'}).click();await scan();
});

test('static discovery resources and 404 return correct HTTP outcomes',async({request,page})=>{
  for(const resource of ['/sitemap.xml','/sitemap-guides.xml','/sitemap-quizzes.xml','/sitemap-pages.xml','/feed.xml']){
    const response=await request.get(resource);expect(response.status()).toBe(200);
    const xml=await response.text();await page.goto('/');
    const errors=await page.evaluate(xml=>new DOMParser().parseFromString(xml,'application/xml').querySelectorAll('parsererror').length,xml);expect(errors).toBe(0);
  }
  expect((await request.get('/missing-page/')).status()).toBe(404);
  expect((await request.get('/api/v1/guides/missing.json')).status()).toBe(404);
  const schema=await(await request.get('/openapi.json')).json();expect(schema.openapi).toBe('3.1.0');
});
