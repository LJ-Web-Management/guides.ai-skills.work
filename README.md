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

The GitHub Actions workflow validates the site and deploys `dist/` to GitHub Pages on pushes to `main`. The repository must have Pages enabled with **GitHub Actions** as the source. Enabling Pages requires repository administration/Pages permissions; the workflow does not pretend the default workflow token can enable a previously unconfigured site.

The workflow reads the real Pages URL and rebuilds all internal links, canonical URLs, sitemaps, and API references for that origin and optional base path. For a custom domain, configure Pages and DNS for `guides.ai-skills.work`, then set repository variables:

```text
SITE_URL=https://guides.ai-skills.work
CUSTOM_DOMAIN=guides.ai-skills.work
```

Only set these after configuring the matching host. A default project Pages deployment can omit both variables. Local builds default to `https://guides.ai-skills.work`; override `SITE_URL` to prepare another deployment. `CUSTOM_DOMAIN` generates a matching `CNAME` file.

Any static host can serve `dist/`. `_headers` supplies security headers and public API CORS for hosts that support it; GitHub Pages does not honor that file. Same-origin API access works independently. The application also includes a restrictive CSP meta tag for hosts without custom headers.

After deployment, verify the home page, an article, quiz submission, `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and `/openapi.json` over the live HTTPS origin. Configure Google Search Console and Bing Webmaster Tools using the domain owner’s accounts and submit the sitemap. Domain ownership and hosting access are external requirements, not something the build can manufacture.

## Font licenses

DM Sans and Newsreader are self-hosted from their pinned Fontsource packages. Their OFL license texts are copied to `dist/licenses/` during the build. Regenerate the committed social card with `node scripts/create-social.mjs` if the branding changes.
