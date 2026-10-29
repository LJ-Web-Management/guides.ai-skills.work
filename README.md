# AI Skills Field Guide

A static learning center for ai-skills.work with 34 original guides, six free card-based quizzes, topic collections, search, and help. It builds 56 HTML pages with no production server or runtime dependencies.

## Development

Use Node.js 24 and npm. Work in the existing checkout; cloud tasks are already isolated and do not require a new worktree.

```sh
npm ci --cache /tmp/ai-skills-npm-cache
npm run dev
```

The development server listens on port 4321 and rebuilds when `src/` or `public/` changes. `npm start` serves an existing production build. `HOST` and `PORT` can override the bind address and port. This local server is a development tool, not the production hosting target.

```sh
npm run build
npm test
npm run test:e2e
```

The browser suite uses `/usr/bin/chromium` when installed. Set `PLAYWRIGHT_EXECUTABLE_PATH` to use another compatible Chromium, or run `npx playwright install --with-deps chromium` where browser downloads and system package installation are allowed. The cloud base image already supplies Chromium. `npm run check` runs the complete build and test sequence.

## Content

- `src/content/`: individual lessons, examples, exercises, FAQs, and quiz questions.
- `src/pages.mjs` and `src/render.mjs`: semantic HTML templates.
- `src/styles.css`: responsive styling, local fonts, and reduced-motion behavior.
- `src/client/app.js`: client-side search, quizzes, and browser-agent tools.
- `scripts/build.mjs`: production generator. Output goes to ignored `dist/`.

Do not insert em dash characters in content, UI copy, or documentation. Keep source dates meaningful when content actually changes. Main-site feature instructions must be verified against the real product. The site does not invent account or billing workflows.

Quizzes allow submission after at least one answer. Incomplete attempts require a warning. Accuracy uses only answered questions; completion and unanswered counts remain explicit. No attempt is sent to a server, persisted in an account, or used to predict employment outcomes.

## SEO and AI discovery

Generated resources include:

- Canonical metadata, Open Graph and Twitter cards, Article/CollectionPage/Quiz/Organization/BreadcrumbList structured data.
- `/sitemap.xml`, three child XML sitemaps, `/sitemap/`, and `/robots.txt`.
- `/llms.txt`, `/llms-full.txt`, and Markdown alternatives for every article.
- `/feed.xml`, a web manifest, local fonts, favicon, and social sharing image.
- `/api/v1/catalog.json`, complete guide JSON, quiz JSON, site metadata, and `/openapi.json`.
- `/developers/api/`, `/developers/webmcp/`, and informational `/webmcp.json`.

Search result pages are noindex; canonical topic and guide pages are in the sitemap. Similar wording variations are covered by substantive articles rather than duplicate doorway pages. Discovery files improve accessibility to crawlers and tools but do not guarantee inclusion or ranking. `llms.txt` is supplemental. WebMCP is experimental; this is not a remote MCP server.

WebMCP registers `search_guides`, `get_guide`, and `list_quizzes` through a supported browser API. Tools read public content only and do not access quiz attempts or submit results. The implementation follows the current `document.modelContext` proposal and supports the older `navigator.modelContext` surface where available.

## Deployment

GitHub Pages publishes the generated site from **main / (root)**, matching the repository's configured publishing source. The generated files are tracked alongside the source and recorded in `.pages-root-manifest.json`. Do not hand-edit generated pages; update `src/`, then regenerate them.

```sh
SITE_URL=https://lj-web-management.github.io/guides.ai-skills.work npm run build
node scripts/publish-root.mjs --stage
```

The publisher protects application source and refuses to overwrite existing unrelated files or manual changes to its previous output. Running it again with the same build produces the same release. The public `site-release.json` identifies the generated content used for live verification.

The GitHub Actions workflow validates changes, builds for the real Pages URL, and updates generated pages on main. When a bot commit is needed, it explicitly requests a Pages rebuild, because commits made with the workflow token do not automatically trigger one. Live checks wait for the expected release and verify the homepage, lessons, quizzes, production assets, and discovery resources over HTTPS.

The default live URL is `https://lj-web-management.github.io/guides.ai-skills.work/`. For a custom domain, configure Pages and DNS first, then set the repository's `SITE_URL` and `CUSTOM_DOMAIN` variables to the matching HTTPS origin and hostname. The generator supports the default project base path as well as a custom domain root.

Any static host can serve `dist/`. `_headers` supplies security headers and public API CORS for hosts that support it; GitHub Pages does not honor that file. Same-origin API access works independently. The application also includes a restrictive CSP meta tag for hosts without custom headers.

After deployment, verify the home page, an article, quiz submission, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and `/openapi.json` over the live HTTPS origin. Configure Google Search Console and Bing Webmaster Tools using the domain owner’s accounts and submit the sitemap. Domain ownership and hosting access are external requirements, not something the build can manufacture.

## Font licenses

Plus Jakarta Sans is self-hosted from its pinned Fontsource package, matching the main ai-skills.work website. Its OFL license is copied to `dist/licenses/` during the build. The shared logo and favicon in `public/brand/` are the original main-site assets. `src/brand.mjs` records the verified navigation, CTA destinations, and brand values; `src/brand.css` applies them to the learning center. Regenerate the committed social card with `node scripts/create-social.mjs` if the branding changes.
