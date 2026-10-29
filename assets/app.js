import { scoreQuiz } from './quiz-core.js';
import { searchGuides } from './search-core.js';

const base = document.documentElement.dataset.base || '';
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<span aria-hidden="true">↗</span>';
const header=document.querySelector('.site-header');
const syncHeader=()=>header?.classList.toggle('is-scrolled',window.scrollY>16);
window.addEventListener('scroll',syncHeader,{passive:true});
syncHeader();
const guideMenu=document.querySelector('.guide-menu');
document.addEventListener('click',event=>{
  if(guideMenu?.open&&!guideMenu.contains(event.target))guideMenu.open=false;
});
const menu = document.querySelector('.menu-toggle');
menu?.addEventListener('click', () => {
  if(guideMenu)guideMenu.open=false;
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  menu.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
  document.getElementById('mobile-nav').hidden = open;
});
document.addEventListener('keydown', event => {
  if(event.key==='Escape'&&guideMenu?.open){
    guideMenu.open=false;
    guideMenu.querySelector('summary').focus();
  }
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    menu.click();
    menu.focus();
  }
});

let catalogPromise;
async function getCatalog() {
  catalogPromise ||= fetch(`${base}/api/v1/catalog.json`).then(response => {
    if (!response.ok) throw new Error('The guide index could not be loaded.');
    return response.json();
  }).catch(error=>{catalogPromise=null;throw error;});
  return catalogPromise;
}

const searchForm = document.getElementById('guide-search');
let updateSearch;
if (searchForm) {
  const input = document.getElementById('search-input');
  const status = document.getElementById('search-status');
  const resultArea = document.getElementById('search-results');
  const cards = [...resultArea.children];
  const filters = [...document.querySelectorAll('[data-category]')];
  let category = 'all';
  let sequence = 0;
  const initial = new URLSearchParams(location.search).get('q') || '';
  input.value = initial.slice(0,200);
  updateSearch = async (query = input.value, newCategory = category) => {
    const current = ++sequence;
    input.value = query.slice(0,200);
    category = newCategory;
    filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
    try {
      const catalog = await getCatalog();
      if (current !== sequence) return;
      const results = searchGuides(catalog.guides, input.value, category);
      const urls = new Map(results.map((item,index)=>[item.path,index]));
      cards.forEach(card=>{
        const path = card.querySelector('a').getAttribute('href').slice(base.length);
        card.hidden = !urls.has(path);
        card.style.order = String(urls.get(path) ?? 999);
      });
      status.textContent = results.length ? `${results.length} ${results.length===1?'guide':'guides'}${input.value?` for “${input.value}”`:' to explore'}` : 'No matching guides yet. Try fewer words or choose another topic.';
      const url = new URL(location.href);
      input.value ? url.searchParams.set('q',input.value) : url.searchParams.delete('q');
      history.replaceState(null,'',url);
    } catch {
      cards.forEach(card=>{card.hidden=false;});
      status.textContent = 'Search is temporarily unavailable. You can browse all guides below.';
    }
  };
  searchForm.addEventListener('submit',event=>{event.preventDefault();updateSearch();});
  let debounce;
  input.addEventListener('input',()=>{clearTimeout(debounce);debounce=setTimeout(()=>updateSearch(),120);});
  filters.forEach(button=>button.addEventListener('click',()=>updateSearch(input.value,button.dataset.category)));
  updateSearch();
}

const app = document.getElementById('quiz-app');
if (app) {
  const quiz = JSON.parse(document.getElementById('quiz-data').textContent);
  const dialog = document.getElementById('partial-dialog');
  let answers = Array(quiz.questions.length).fill(null);
  let index = 0;
  let finished = false;
  const count = () => answers.filter(a=>a!==null).length;
  const render = (focus = false) => {
    const question = quiz.questions[index];
    app.innerHTML = `<div class="quiz-progress-top"><span>Question ${index+1} of ${quiz.questions.length}</span><span id="answered-count">${count()} answered</span></div><progress id="quiz-progress" value="${count()}" max="${quiz.questions.length}" aria-label="Questions answered"></progress><section class="question-card"><span class="eyebrow">A MOMENT TO THINK</span><h2 id="question-title" tabindex="-1">${escapeHtml(question.question)}</h2><fieldset class="answer-options" aria-labelledby="question-title"><legend class="sr-only">Choose one answer</legend>${question.options.map((option,i)=>`<label class="answer-option ${answers[index]===i?'is-selected':''}"><input type="radio" name="answer" value="${i}" ${answers[index]===i?'checked':''}><span class="option-letter" aria-hidden="true">${String.fromCharCode(65+i)}</span><span>${escapeHtml(option)}</span><span class="option-check" aria-hidden="true">✓</span></label>`).join('')}</fieldset><div class="question-controls"><button class="plain-button" id="previous" ${index===0?'disabled':''}>← Previous</button><button class="plain-button" id="skip" ${index===quiz.questions.length-1?'disabled':''}>Skip for now</button><button class="button" id="next" ${index===quiz.questions.length-1?'disabled':''}>Next question ${arrow}</button></div></section><div class="quiz-submit-row"><p>No rush. You can revisit any question.</p><button class="text-button" id="submit-quiz" ${count()===0?'disabled':''}>See my results ${arrow}</button></div>`;
    app.querySelectorAll('input[name="answer"]').forEach(radio=>radio.addEventListener('change',()=>{
      answers[index]=Number(radio.value);
      app.querySelectorAll('.answer-option').forEach(label=>label.classList.toggle('is-selected',label.contains(radio)));
      document.getElementById('answered-count').textContent=`${count()} answered`;
      document.getElementById('quiz-progress').value=count();
      document.getElementById('submit-quiz').disabled=false;
    }));
    document.getElementById('previous').addEventListener('click',()=>{if(index>0){index--;render(true);}});
    document.getElementById('next').addEventListener('click',()=>{if(index<quiz.questions.length-1){index++;render(true);}});
    document.getElementById('skip').addEventListener('click',()=>{if(index<quiz.questions.length-1){index++;render(true);}});
    document.getElementById('submit-quiz').addEventListener('click',()=>{
      if (!count()) return;
      if (count()<quiz.questions.length) dialog.showModal();
      else showResults();
    });
    if(focus) document.getElementById('question-title').focus({preventScroll:true});
  };
  const showResults = () => {
    if(finished || !count()) return;
    finished=true;
    const result=scoreQuiz(quiz.questions,answers);
    app.innerHTML=`<section class="result-card"><span class="eyebrow">YOUR LEARNING SNAPSHOT</span><h2 id="result-title" tabindex="-1">${result.complete?'A little more perspective.':'A starting point, with room to explore.'}</h2>${!result.complete?'<p class="partial-notice"><strong>Incomplete attempt.</strong> Results may not be fully accurate because you did not answer every question.</p>':''}<div class="result-summary"><div class="score-circle" style="--score:${result.percentage}%"><span>${result.percentage}<small>%</small></span></div><div><h3>${result.correct} of ${result.answered} answered correctly</h3><p>Accuracy on answered questions</p><p class="completion-line">${result.answered} of ${result.total} questions answered · ${result.unanswered} unanswered</p></div></div><p>A quiz is a check-in, not a label. Use the explanations to find your next useful step.</p><div class="result-actions"><a class="button" href="${escapeHtml(quiz.lesson)}">Explore the related lesson ${arrow}</a><button class="button button-secondary" id="retake">Try again</button></div></section><section class="answer-review"><h2>A closer look at your answers</h2>${quiz.questions.map((question,i)=>`<details class="review-item ${answers[i]===null?'unanswered':answers[i]===question.correct?'correct':'incorrect'}"><summary><span class="review-indicator" aria-hidden="true">${answers[i]===null?'○':answers[i]===question.correct?'✓':'↗'}</span><span>${escapeHtml(question.question)}<small>${answers[i]===null?'Unanswered':answers[i]===question.correct?'Correct':'Worth another look'}</small></span><span aria-hidden="true">+</span></summary><div class="review-body">${answers[i]!==null?`<p><strong>Your answer:</strong> ${escapeHtml(question.options[answers[i]])}</p>`:'<p>You left this question unanswered.</p>'}<p><strong>Correct answer:</strong> ${escapeHtml(question.options[question.correct])}</p><p>${escapeHtml(question.explanation)}</p></div></details>`).join('')}</section><a class="text-link" href="${base}/quizzes/">Explore another quiz ${arrow}</a>`;
    document.getElementById('retake').addEventListener('click',()=>{answers=Array(quiz.questions.length).fill(null);index=0;finished=false;render(true);});
    document.getElementById('result-title').focus({preventScroll:true});
    app.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  document.getElementById('keep-answering').addEventListener('click',()=>dialog.close());
  document.getElementById('confirm-submit').addEventListener('click',()=>{dialog.close();showResults();});
  render();
}

function agentNotice(message) {
  let notice=document.getElementById('agent-notice');
  if(!notice){notice=document.createElement('div');notice.id='agent-notice';notice.className='agent-notice';notice.setAttribute('role','status');document.body.append(notice);}
  notice.textContent=message;
  clearTimeout(agentNotice.timer);
  agentNotice.timer=setTimeout(()=>notice.remove(),7000);
}
const context = document.modelContext || navigator.modelContext;
if (context?.registerTool) {
  const result = value=>({content:[{type:'text',text:JSON.stringify(value)}]});
  const tools=[
    {name:'search_guides',description:'Search the public AI Skills Field Guide. Returns matching public lessons with titles, descriptions, and URLs. Updates search results when the search page is open. Does not access quiz answers or personal information.',inputSchema:{type:'object',properties:{query:{type:'string',description:'A topic or question of up to 200 characters.'},category:{type:'string',enum:['all','learn','work','careers','roles','help'],description:'Optional topic filter; defaults to all.'}},required:['query'],additionalProperties:false},async execute({query,category='all'}={}){
      if(typeof query!=='string'||query.length>200||!['all','learn','work','careers','roles','help'].includes(category))return result({error:'Provide a query of up to 200 characters and a valid category.'});
      const catalog=await getCatalog();const matches=searchGuides(catalog.guides,query,category).slice(0,12);
      if(updateSearch)await updateSearch(query,category);else agentNotice(`Found ${matches.length} public guides for “${query}”.`);
      return result({guides:matches.map(({slug,title,description,url})=>({slug,title,description,url}))});
    }},
    {name:'get_guide',description:'Read a public guide by its catalog slug. Returns lesson sections, examples, exercises, FAQs, and original-source links. No navigation or account access.',inputSchema:{type:'object',properties:{slug:{type:'string',description:'The exact guide slug returned by search_guides.'}},required:['slug'],additionalProperties:false},async execute({slug}={}){
      if(typeof slug!=='string'||!/^[a-z0-9-]{1,100}$/.test(slug))return result({error:'Provide a valid guide slug from search_guides.'});
      const catalog=await getCatalog();if(!catalog.guides.some(g=>g.slug===slug))return result({error:'Guide not found. Use search_guides to find a valid slug.'});
      const response=await fetch(`${base}/api/v1/guides/${slug}.json`);if(!response.ok)return result({error:'The guide is temporarily unavailable.'});
      const guide=await response.json();agentNotice(`Reading public guide: ${guide.title}`);return result(guide);
    }},
    {name:'list_quizzes',description:'List free knowledge quizzes with topic, question count, and URL. Does not answer, submit, or inspect any quiz attempt.',inputSchema:{type:'object',properties:{},additionalProperties:false},async execute(){const response=await fetch(`${base}/api/v1/quizzes.json`);if(!response.ok)return result({error:'The quiz catalog is temporarily unavailable.'});const data=await response.json();agentNotice('Listed the six free knowledge quizzes.');return result(data);}},
  ];
  for(const tool of tools){
    const execute=tool.execute;
    tool.execute=async args=>{try{return await execute(args);}catch{return result({error:'The public content could not be loaded. Please try again or browse the site.'});}};
    try{await context.registerTool(tool);}catch{/* Unsupported or denied registration must not interrupt the learning interface. */}
  }
}
