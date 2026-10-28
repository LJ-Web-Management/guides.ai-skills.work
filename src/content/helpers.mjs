export function guide(slug, category, title, description, sections, example, exercise, faq, sourceKeys = ['nist']) {
  return { slug, category, title, description, sections: sections.map(([title, body, bullets = []]) => ({ title, body, bullets })), example: { title: example[0], text: example[1] }, exercise, faq: faq.map(([question, answer]) => ({ question, answer })), sourceKeys, level: category === 'roles' ? 'Role guide' : category === 'help' ? 'Getting started' : 'Beginner friendly' };
}
