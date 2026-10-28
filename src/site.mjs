export const site = {
  name: 'ai-skills.work',
  title: 'The AI Skills Field Guide',
  url: (process.env.SITE_URL || 'https://guides.ai-skills.work').replace(/\/$/, ''),
  updated: '2026-10-28',
  description: 'Practical AI lessons, honest career guidance, and free knowledge quizzes. Build useful AI skills, one small step at a time.',
};

export const categories = [
  { slug: 'learn', label: 'Learn AI', short: 'Foundations', icon: 'spark', color: 'lilac', description: 'Start with the essentials. Get comfortable with AI, one useful idea at a time.' },
  { slug: 'work', label: 'AI at work', short: 'Practical skills', icon: 'briefcase', color: 'peach', description: 'Turn everyday tasks into opportunities to work a little smarter.' },
  { slug: 'careers', label: 'Careers & confidence', short: 'Your next chapter', icon: 'compass', color: 'mint', description: 'Understand how work is changing and make a plan you can act on.' },
  { slug: 'roles', label: 'AI for your role', short: 'Made for your work', icon: 'grid', color: 'blue', description: 'Find relevant examples, practical workflows, and boundaries for your profession.' },
  { slug: 'help', label: 'Help & support', short: 'A little guidance', icon: 'help', color: 'yellow', description: 'Find your way around the field guide, lessons, and free quizzes.' },
];

export const sources = {
  nist: { name: 'NIST: AI Risk Management Framework', url: 'https://www.nist.gov/itl/ai-risk-management-framework' },
  literacy: { name: 'European Commission: AI literacy questions and answers', url: 'https://digital-strategy.ec.europa.eu/en/faqs/ai-literacy-questions-answers' },
  ilo: { name: 'International Labour Organization: AI and the world of work', url: 'https://www.ilo.org/topics-and-sectors/artificial-intelligence' },
  oecd: { name: 'OECD: Artificial intelligence and the future of work', url: 'https://www.oecd.org/en/topics/artificial-intelligence-and-work.html' },
  unesco: { name: 'UNESCO: AI in education', url: 'https://www.unesco.org/en/digital-education/artificial-intelligence' },
  privacy: { name: 'ICO: Artificial intelligence and data protection', url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/' },
  prompting: { name: 'OpenAI: Prompt engineering guide', url: 'https://platform.openai.com/docs/guides/prompt-engineering' },
  security: { name: 'OWASP: Top risks for generative AI applications', url: 'https://genai.owasp.org/llm-top-10/' },
  webmcp: { name: 'WebMCP proposal and implementation guidance', url: 'https://github.com/webmachinelearning/webmcp' },
};
