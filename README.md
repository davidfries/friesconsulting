# Fries Consulting Services

Official website for **Fries Consulting Services, LLC** (`https://friesconsulting.services`), built as a **pre-rendered React + Vite + TypeScript static SPA** deployed to a **Backblaze B2** bucket behind **Cloudflare**.

Every route compiles at build time into full static HTML with baked-in metadata and Schema.org JSON-LD (zero-JS readable for crawlers and agents) and hydrates in the browser into an instant client-side SPA.

---

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Generate typed content module + start Vite dev server
npm run typecheck   # Run TypeScript strict type checking
npm run build       # Compile content, build client + SSR bundles, and pre-render dist/
npm run verify      # Validate all HTML routes, JSON-LD, Markdown alternates, A2A card, TCO math & worker
npm run preview     # Preview pre-rendered dist/ locally
```

---

## Content Structure & Editing

All business facts, services, FAQs, and technical writing live in `content/`:

- `content/data/business.yaml` — Canonical business profile, service areas, target audiences, E-Rate/CIPA summaries, technologies, and contact checklist.
- `content/data/services.yaml` — Single source of truth for all 14 services (drives Home cards, `/services/` details, Schema.org `OfferCatalog`, `/llms.txt`, `/llms-full.txt`, `/services.json`, `/.well-known/agent-card.json`, and WebMCP).
- `content/data/faq.yaml` — Single source of truth for all 11 FAQs (drives `/services/#faq`, `FAQPage` JSON-LD, `/llms-full.txt`, and `/business.json`).
- `content/posts/*.md` — Technical case studies and articles in Markdown with YAML frontmatter.
- `public/images/` — Static assets (`banner.jpg` and `cipa-pipeline/*.png` Grafana screenshots).

Editing any file under `content/` updates `src/generated/content.ts` automatically during `npm run dev` and on every `npm run build`.

---

## Agentic-First Discovery Layer

`npm run build` outputs both human UI routes and a complete machine-readable layer into `dist/`:

- **Pre-rendered HTML + Schema.org `@graph` JSON-LD:** `ProfessionalService` + `Organization`, `WebSite`, `BreadcrumbList`, `BlogPosting` (on every post), `FAQPage` (on `/services/`), `ContactPage`, and `WebApplication` (on `/calculator/`).
- **`/llms.txt`** — Concise `llmstxt.org` index linking to services, key pages, `.md` alternates, and scoping contact guidance.
- **`/llms-full.txt`** — Single-fetch complete site dossier containing all services, FAQs, TCO baseline, and full text of every technical post.
- **Per-route clean Markdown alternates:** Both `<route>.md` and `<route>/index.md` for `/`, `/services/`, `/posts/`, `/calculator/`, `/contact/`, and all `/posts/<slug>/` articles (`<link rel="alternate" type="text/markdown">` on every HTML page).
- **`/.well-known/agent-card.json`** — A2A v1.0 Agent Card exposing all 14 services as skills and the scoping contact channel.
- **`/business.json` & `/services.json`** — Structured JSON profiles for programmatic lookup.
- **`/robots.txt`** — Explicitly welcomes `*` and major AI search/assistant crawlers (`GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, etc.).
- **`/sitemap.xml` & `/rss.xml` (`/index.xml`)** — Canonical URL index and RSS 2.0 feed.
- **WebMCP Client Tools (`src/lib/webmcp.ts`):** Registers `get_business_profile`, `search_services`, `search_writing`, `estimate_private_cloud_tco`, and `draft_scoping_inquiry` via `document.modelContext.registerTool` when supported by the visitor's browser.

---

## Deploying to Backblaze B2 + Cloudflare

### Option A: Backblaze B2 + Optional Cloudflare Worker (Recommended)

`cloudflare/worker.js` proxies your B2 bucket and adds:
1. Clean directory-style URL resolution (`/services` or `/services/` -> `/services/index.html`).
2. Edge **`Accept: text/markdown` content negotiation** (rewrites page requests from AI agents that prefer Markdown directly to the pre-rendered `.md` file with `Content-Type: text/markdown; charset=utf-8`, `Vary: Accept`, and `x-markdown-tokens`, falling back gracefully to HTML if `.md` is missing).
3. `Link` headers pointing to `/llms.txt` and each page's `.md` alternate, true HTTP `404` status on `404.html`, immutable asset caching, and security headers.

#### Where to find `B2_ORIGIN`
In the **Backblaze B2 Console**: open **Buckets** → open your site bucket → click `index.html` → copy its **Friendly URL** up to `/file/<bucket-name>` (omit `/index.html` and any trailing slash), for example:
`https://f001.backblazeb2.com/file/<your-bucket-name>`

#### Steps
1. Copy `.env.example` or add `B2_ORIGIN` (and optionally `B2_BUCKET`) alongside your `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in `.env`.
2. Sync `dist/` to your public Backblaze B2 bucket:
   ```bash
   B2_BUCKET=your-bucket-name ./scripts/deploy-b2.sh
   ```
3. Preview or deploy the Cloudflare Worker (reads `.env` automatically):
   ```bash
   DRY_RUN=1 ./scripts/deploy-worker.sh
   ./scripts/deploy-worker.sh
   ```
4. Attach routes for `friesconsulting.services/*` (and `www.friesconsulting.services/*` if applicable) in Cloudflare Workers & Pages → Settings → Domains & Routes.

### Option B: Pure Static B2 + Cloudflare Rules (No Worker)

If you prefer no Worker, upload `dist/` to B2 (`./scripts/deploy-b2.sh`) and configure a Cloudflare Transform Rule rewriting extensionless directory requests (`/services/` -> `/file/<bucket>/services/index.html`, `/` -> `/file/<bucket>/index.html`). Every HTML page, `.md` file, `.json` manifest, and `/llms.txt` exists directly as a static file in `dist/`.
