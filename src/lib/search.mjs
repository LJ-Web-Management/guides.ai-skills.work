const stopWords = new Set(['a','an','the','and','or','of','to','for','with','my','me','i','is','are','do','does','how','what','will','can','about','in','on','ai']);
const normalize = value => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ');
export function searchGuides(catalog, query = '', category = 'all') {
  if (typeof query !== 'string' || query.length > 200) throw new TypeError('Use a search phrase of up to 200 characters.');
  const terms = normalize(query).split(/\s+/).filter(w => w && !stopWords.has(w)).map(w => w.length > 4 ? w.replace(/s$/, '') : w);
  return catalog.filter(item => category === 'all' || item.category === category).map(item => {
    const title = normalize(item.title);
    const description = normalize(item.description);
    const text = normalize(item.text || '');
    const matches = terms.every(t => `${title} ${description} ${text}`.includes(t));
    return { item, score: matches ? terms.reduce((n,t) => n + (title.includes(t)?8:0) + (description.includes(t)?3:0) + (text.includes(t)?1:0), 0) : -1 };
  }).filter(r => r.score >= 0).sort((a,b)=>b.score-a.score).map(r=>r.item);
}
