import learn from './learn.mjs';
import work from './work.mjs';
import careers from './careers.mjs';
import roles from './roles.mjs';
import help from './help.mjs';
export const guides = [...learn, ...work, ...careers, ...roles, ...help];
export const guidePath = (guide) => `/${guide.category}/${guide.slug}/`;
export const guideText = (guide) => [guide.title, guide.description, ...guide.sections.map(s => `${s.title} ${s.body} ${s.bullets.join(' ')}`), guide.example.title, guide.example.text, guide.exercise, ...guide.faq.map(f => `${f.question} ${f.answer}`)].join(' ');
export const readingMinutes = (guide) => Math.max(2, Math.ceil(guideText(guide).split(/\s+/).length / 200));
