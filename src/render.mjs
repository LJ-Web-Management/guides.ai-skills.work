import { site, categories } from './site.mjs';
import { guidePath, readingMinutes } from './content/index.mjs';

export const base = new URL(site.url).pathname.replace(/\/$/, '');
export const href = (path) => /^(https?:|mailto:|#)/.test(path) ? path : `${base}${path}`;
export const absolute = (path) => `${site.url}${path}`;
export const esc = (value) => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const json = (value) => JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
export const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const paths = {
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V4h8v3M3 12c5 4 13 4 18 0M12 12v4"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6 6-2Z"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4m0 3h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  pen: '<path d="m15 4 5 5L9 20H4v-5L15 4Zm-2 2 5 5"/>',
  book: '<path d="M12 6C9 3 5 3 3 4v15c3-1 6-1 9 2 3-3 6-3 9-2V4c-2-1-6-1-9 2Zm0 0v15"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name] || paths.spark}</svg>`;
export const button = (label, path, secondary = false) => `<a class="button ${secondary ? 'button-secondary' : ''}" href="${href(path)}">${esc(label)} ${icon('arrow')}</a>`;

export function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="${href('/')}">Home</a></li>${items.map((item, i) => `<li>${icon('chevron')}${i === items.length - 1 ? `<span aria-current="page">${esc(item.label)}</span>` : `<a href="${href(item.path)}">${esc(item.label)}</a>`}</li>`).join('')}</ol></nav>`;
}
export function breadcrumbSchema(items) {
  return { '@type': 'BreadcrumbList', itemListElement: [{ label: 'Home', path: '/' }, ...items].map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.label, item: absolute(item.path) })) };
}
export function guideCard(guide, featured = false) {
  const category = categories.find(c => c.slug === guide.category);
  return `<article class="guide-card ${featured ? 'featured-card' : ''}"><a class="card-link" href="${href(guidePath(guide))}"><div class="card-top"><span class="icon-box ${category.color}">${icon(category.icon)}</span><span class="card-tag">${esc(category.short)}</span>${icon('arrow', 'card-arrow')}</div><h3>${esc(guide.title)}</h3><p>${esc(guide.description)}</p><div class="card-meta"><span>${icon('clock')}${readingMinutes(guide)} min read</span><span>${esc(guide.level)}</span></div></a></article>`;
}
export function quizCard(quiz) {
  return `<article class="quiz-tile ${quiz.color}"><a class="card-link" href="${href(`/quizzes/${quiz.slug}/`)}"><span class="quiz-mark">${icon(quiz.icon)}</span><span class="eyebrow">FREE KNOWLEDGE CHECK</span><h3>${esc(quiz.title)}</h3><p>${esc(quiz.description)}</p><span class="quiz-tile-bottom">${quiz.questions.length} questions <span>Take the quiz ${icon('arrow')}</span></span></a></article>`;
}

export function layout({ title, description = site.description, path = '/', content, schemas = [], noindex = false, pageClass = '' }) {
  const active = (part) => path.startsWith(`/${part}/`) ? ' aria-current="page"' : '';
  const canonical = absolute(path);
  const org = { '@type': 'Organization', '@id': `${site.url}/#organization`, name: site.name, url: site.url, logo: absolute('/favicon.svg') };
  return `<!doctype html>
<html lang="en" data-base="${esc(base)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"><title>${esc(title)} | AI Skills Field Guide</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="${schemas.some(s => s['@type'] === 'Article') ? 'article' : 'website'}"><meta property="og:site_name" content="${site.title}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${absolute('/social.png')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="AI Skills Field Guide: A little learning. A lot of possibility."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${absolute('/social.png')}"><meta name="theme-color" content="#f7f6f2"><link rel="icon" type="image/svg+xml" href="${href('/favicon.svg')}"><link rel="manifest" href="${href('/site.webmanifest')}"><link rel="preload" href="${href('/assets/dm-sans.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${href('/assets/style.css')}"><link rel="alternate" type="application/atom+xml" title="AI Skills guides" href="${href('/feed.xml')}"><link rel="alternate" type="text/plain" title="AI-readable guide index" href="${href('/llms.txt')}"><link rel="service-desc" type="application/json" href="${href('/openapi.json')}"><script type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': [org, ...schemas] })}</script><script type="module" src="${href('/assets/app.js')}"></script></head>
<body class="${esc(pageClass)}"><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="${href('/')}"><span class="brand-symbol" aria-hidden="true">${icon('spark')}</span><span>ai-skills<span class="brand-domain">.work</span><small>THE FIELD GUIDE</small></span></a><nav class="desktop-nav" aria-label="Main navigation"><a href="${href('/learn/')}"${active('learn')}>Learn AI</a><a href="${href('/work/')}"${active('work')}>AI at work</a><a href="${href('/careers/')}"${active('careers')}>Careers</a><a href="${href('/quizzes/')}"${active('quizzes')}>Free quizzes<span class="nav-dot"></span></a></nav><div class="header-actions"><a class="search-link" href="${href('/search/')}" aria-label="Search the field guide">${icon('search')}</a><a class="main-site-link" href="https://ai-skills.work">Main website ${icon('arrow')}</a><button class="menu-toggle" aria-label="Open navigation" aria-controls="mobile-nav" aria-expanded="false">${icon('menu')}</button></div></div><nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" hidden>${[['Learn AI','learn'], ['AI at work','work'], ['Careers','careers'], ['AI for your role','roles'], ['Free quizzes','quizzes'], ['Help','help']].map(([label, slug])=>`<a href="${href(`/${slug}/`)}">${label}${icon('arrow')}</a>`).join('')}<a href="https://ai-skills.work">Main website ${icon('arrow')}</a></nav></header>
<main id="main">${content}</main>
<footer class="site-footer"><div class="container footer-grid"><div class="footer-intro"><a class="brand" href="${href('/')}"><span class="brand-symbol" aria-hidden="true">${icon('spark')}</span><span>ai-skills<span class="brand-domain">.work</span></span></a><p>A little knowledge.<br>A more confident next step.</p><span class="footer-note">Free to explore. Made for people.</span></div><div><h2>Keep learning</h2><a href="${href('/learn/')}">AI foundations</a><a href="${href('/work/')}">Practical guides</a><a href="${href('/roles/')}">AI for your role</a><a href="${href('/careers/')}">Careers & confidence</a></div><div><h2>Find your way</h2><a href="${href('/quizzes/')}">Free quizzes</a><a href="${href('/help/')}">Help center</a><a href="${href('/search/')}">Search all guides</a><a href="${href('/sitemap/')}">All pages</a></div><div><h2>About this guide</h2><a href="${href('/about/')}">Our approach</a><a href="${href('/privacy/')}">Privacy</a><a href="${href('/developers/')}">Developers & API</a><a href="https://ai-skills.work">Visit ai-skills.work ${icon('arrow')}</a></div></div><div class="container footer-bottom"><span>© ${site.updated.slice(0,4)} ai-skills.work</span><span>Stay curious. Keep your judgment.</span><a href="${href('/accessibility/')}">Accessibility</a></div></footer></body></html>`;
}
