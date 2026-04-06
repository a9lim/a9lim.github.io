# CLAUDE.md

Root site for the **a9l.im** portfolio. Hosted on Cloudflare Workers + Assets with custom domain `a9l.im`. Also hosts the shared design system consumed by all five submodules (`geon`, `shoals`, `gerry`, `cyano`, `scripture`). Cloudflare config lives in `wrangler.jsonc` (Worker + asset serving + Analytics Engine), `_worker.js` (SPA routing + HTMLRewriter SSR + SEO + security headers + CDN cache control + analytics), `_headers` (security + caching + Early Hints + COEP + CDN-Cache-Control), and `_routes.json` (static asset exclusions). Fonts are self-hosted in `fonts/` (no Google Fonts dependency).

## Design Philosophy

Flat, lineless, modern. Every surface is differentiated by **background color**, never borders. Shadows appear **only on hover/active/focus** — nothing has a resting-state shadow. Elevation is earned through interaction, not decoration.

- **No borders** on panels, buttons, inputs, tabs, cards, separators, or toggles. Use `border: none` everywhere. The only exception is `outline` on `:focus-visible` for accessibility.
- **No resting shadows** — `box-shadow: none` at rest. Hover states may use `var(--shadow-sm)` or `var(--shadow-md)`.
- **Background differentiation** — use `--bg-hover`, `--bg-elevated`, `--accent-subtle` to distinguish nested surfaces, not lines.
- **Subtle animations** — hover lifts are small (`translateY(-2px)` to `-4px`), no scale transforms on cards. Transitions use `var(--ease-out)` or `var(--ease-spring)`.
- `.glass` uses `bg-panel` (semi-transparent) with `backdrop-filter: blur(20px) saturate(1.5)` for true glassmorphism. No shimmer inset.
- Shadow tokens (`--shadow-sm` etc.) contain no `0 0 0 1px` spread rings.

## Shared Code Policy

All projects share a common design system at this repo's root. **Always prefer shared code over project-specific implementations.** Check `shared-*.js` before adding utility code to a project.

Key shared modules:
- `shared-tokens.js` — `_PALETTE`, `_FONT`, color math. Extend via `colors.js`, never hardcode colors
- `shared-utils.js` — `escapeHtml`, `debounce`, `throttle`, `clamp`, `lerp`, `showToast`, `trapFocus`, `resizeCanvasDPR`, `animateValue`, `initOverlayDismiss`
- `shared-base.css` — reset, layout tokens, `.glass`, `.tool-btn`, `.ctrl-row`, `.sim-overlay`, toasts, a11y
- `shared-toolbar.js` — `_toolbar` (theme toggle, sidebar, play/pause, speed)
- `shared-forms.js` — `_forms` (mode groups, sliders, toggles)
- `shared-icons.js` — unified SVG icon library. Exposes `_ICON` global, renders icons via `data-icon` attribute
- `shared-tabs.js`, `shared-camera.js`, `shared-info.js`, `shared-shortcuts.js`, `shared-about.js`, `shared-touch.js`, `shared-tooltip.js`, `shared-sparkline.js`, `shared-haptics.js`

## Running Locally

```bash
cd path/to/a9lim.github.io && python -m http.server
```

Root site uses relative paths for shared files; sub-projects use absolute paths (`/shared-*.js`).

## Overview

Single-page portfolio site. Path-based SPA router (`/`, `/projects`, `/blog`, `/about`, `/blog/{slug}`). `_worker.js` routes non-static requests to the correct SPA shell (`index.html` for root routes, `scripture/index.html` for `/scripture/*`) and uses HTMLRewriter for:
- **SSR**: Blog posts are rendered from markdown at the edge (parser ported from `src/markdown.js`). The blog listing at `/blog` is SSR'd from `posts.json`. The project grid is injected as static HTML on `/projects`. Scripture index (`/scripture/`) gets a work listing with links. Scripture work-level routes (`/scripture/{workId}`) get a book listing with inline chapter links for all chapters, fetched from manifests, plus a work description paragraph. Scripture chapter routes get structured verse HTML (first 25 verses) injected into `#reading-pane` and visible breadcrumb HTML into `#breadcrumb`. Verse deep links (`/scripture/{workId}/{bookId}-{chapter}:{verse}`) also populate `#reading-pane` with the specific verse. The correct page section gets the `active` class per route. All of this makes SPA content visible to crawlers without JS execution.
- **SEO injection**: Per-route `<title>`, `<meta description>`, OG tags, `twitter:title`/`twitter:description`, `article:published_time`/`article:modified_time`/`article:author`/`article:tag` (blog posts — tags support arrays), canonical URLs, `hreflang="en"` + `hreflang="x-default"` self-referential tags, `BlogPosting` + `BreadcrumbList` JSON-LD (blog posts — includes `wordCount`, `image`, `articleSection`, `speakable`, `articleBody` truncated to ~500 chars), `Blog` + `ItemList` JSON-LD (`/blog`), `CollectionPage` + `ItemList` JSON-LD (`/projects`, `/scripture/`), `Person` JSON-LD (`/about` — includes `jobTitle`, `hasOccupation` with SOC code, `makesOffer`), `Book` + `translationOfWork` + `sameAs` + `mentions` + `author` + `ReadAction` + `SearchAction` + `Dataset` JSON-LD (scripture work-level — includes `license`, `contentRating`, and work-scoped search), `Chapter` + `BreadcrumbList` + `Quotation` JSON-LD (scripture chapters — includes `@id`, `position`, section headings with `aria-label`, and first-verse Quotation schema for crawlers), `Quotation` + `author` + `mentions` JSON-LD (verse deep links — includes `@id`, `url`, `inLanguage`, `position`; inherits `WORK_MENTIONS` entities from parent work). `SiteNavigationElement` JSON-LD is injected on all root SPA routes. All entities have `@id` URIs for knowledge graph disambiguation. Visible breadcrumb HTML is SSR'd for `/projects`, `/blog`, `/about` (targeting `#breadcrumb` element in root `index.html`) and all scripture routes.
- **Security headers** (CSP, HSTS, COOP, etc.) via the `secure()` wrapper — `_headers` only covers static assets. Worker also sets `Vary: Accept-Encoding` and rejects non-GET/HEAD with 405. Scripture manifest/chapter fetches are wrapped in a 2-second timeout (`timedFetch`) to prevent SSR hangs.

Static assets are served directly by the asset layer before the Worker runs (`html_handling: "drop-trailing-slash"`). CDN caching is split from browser caching via `Cloudflare-CDN-Cache-Control`: the CDN caches Worker HTML for 1 hour and static assets indefinitely (purged on deploy), while browsers use short TTLs. Analytics Engine (`VIEWS` binding) logs page views server-side via `waitUntil()` with pathname, country, referer, user-agent, city, and ASN. Speculation Rules in `index.html` prefetch and prerender SPA routes. WebGL simplex noise shader background, project carousel, blog with markdown rendering, SVG world map with animated arc.

## Architecture

- `main.js` creates `$` DOM cache, passed to all init functions. Modules never call `getElementById` for shared elements.
- `src/projects.js` exports `PROJECTS` array — single source of truth for carousel and projects page. **Also duplicated** as `PROJECTS_SSR` in `_worker.js` for crawler SSR — update both when adding/editing projects.
- `src/markdown.js` is the client-side markdown parser. **Also duplicated** as `mdEsc`/`mdInline`/`renderMarkdown` in `_worker.js` (blog SSR) and `_build.js` (feed generation) — update all three when changing the parser.
- `shared-tokens.js` is a synchronous `<script>` tag (no `defer`) — it must run before CSS parses to inject CSS custom properties. All other `shared-*.js` use `defer`. Both expose globals on `window`. ES6 modules access these directly. Converting them to modules would break all consumers.

## Image Generation

```bash
node og/generate.js      # OG images (1200×630) → each project's og-image.webp + PWA icons (192/512px PNG)
node cards/generate.js   # Card images (1920×1200) → img/{project}.webp
node _build.js           # Sitemap, feeds, llms-full.txt (see below)
```

Both require Puppeteer (installed in `og/` and `cards/`). Source HTML in `og/` and `cards/` respectively — self-contained pages with hardcoded colors, no shared imports. OG images are WebP (quality 90). PWA icons are PNG with transparent background and `#e11107` logo fill (`og/icon.html`). Each `index.html` references its `og-image.webp` via `<meta property="og:image">` with absolute `https://a9l.im/` URLs. Card images are referenced by `src/projects.js` for the carousel and projects page.

## Gotchas

### Do Not Break

- **`_worker.js`** — SPA routing, HTMLRewriter SSR + SEO injection, security headers (via `secure()` wrapper), CDN cache control, Analytics Engine logging, 405 rejection for non-GET/HEAD, `Vary: Accept-Encoding`. Removing it breaks direct navigation to `/projects`, `/blog/*`, `/about`, and `/scripture/*`. Route metadata lives in `ROUTE_META` and `BLOG_META` at the top of the file — update these when adding SPA routes or blog posts. `WORK_TITLES` maps scripture work IDs to display names. `WORK_SCHEMA` maps work IDs to translator, language, year, Wikidata IDs, `sameAs` URLs (Wikipedia, sacred-texts.com), `translatorWikidata` Q-IDs, `author` (original author/compiler with Wikidata `@id` where applicable), and `description` (all 16 works have Wikidata `@id` URIs). `WORK_MENTIONS` maps work IDs to arrays of 7-14 Wikidata-linked named entities (key figures, deities, places, concepts) for GEO entity linking (~120 total entities). `SCRIPTURE_WORKS_SSR` is built from these for the index route. Scripture has three SSR tiers: index (work listing + `CollectionPage`/`ItemList` JSON-LD), work-level (book listing + description paragraph fetched from manifests + `Book`/`translationOfWork`/`Dataset` JSON-LD with `license` and `contentRating`), and chapter (structured verse HTML [25 verses] + `Chapter` JSON-LD with `@id`/`position` + prev/next links). Verse deep links get `Quotation` JSON-LD (with `@id`, `url`, `inLanguage`, `position`, `author` translator and nested `isPartOf` chain) and verse text in `#reading-pane`. Blog listing at `/blog` is SSR'd from `posts.json` with `Blog`/`ItemList` JSON-LD. Blog posts get `BlogPosting` (with `@id`, `articleSection`, `speakable`) + `BreadcrumbList` + `article:*` OG meta. `/projects` gets `CollectionPage`/`ItemList` JSON-LD. All root SPA routes include `SiteNavigationElement` JSON-LD. All entities have `@id` URIs. `rewriteHTML()` also handles `twitter:title`/`twitter:description` rewriting (requires base tags in HTML). `PROJECTS_SSR` and the markdown parser (`renderMarkdown`) are duplicated from client code — update all copies. `ABOUT_JSONLD` contains Person structured data with `@id: https://a9l.im/about` for `/about`. Security headers are duplicated between `_worker.js` (`SECURITY_HEADERS` object) and `_headers` (`/*` block) because they serve different response types — keep them in sync. Scripture manifest/chapter fetches use `timedFetch` (2s timeout) to prevent SSR hangs.
- **`_headers`** — security headers for static assets (CSP, HSTS, COOP, COEP on `/geon/*`), cache policy with `Cloudflare-CDN-Cache-Control` for CDN/browser TTL separation, Early Hints (including per-subproject `modulepreload` for `main.js`), and `preconnect` for cdn.jsdelivr.net on KaTeX-using sims (geon, cyano, shoals). Does NOT apply to Worker-served responses — those get headers from `_worker.js`.
- **`_routes.json`** — excludes static assets, subproject paths (`/geon/*`, `/cyano/*`, `/gerry/*`, `/shoals/*`), discovery files (`/*.txt`, `/*.md`, `/.well-known/*`, `/feed.atom`), and scripture `.md` files from the Worker. `/scripture/*` is intentionally NOT excluded because the Worker handles scripture's SPA deep-route routing and breadcrumb JSON-LD injection. Scripture static assets (JS/CSS) still serve directly via the assets-first default.
- **All `shared-*.js` and `shared-base.css` files** — consumed by all projects. Changing public APIs or class names (`.tab-btn`, `.tab-panel`, `data-tab`, `.glass`, `.tool-btn`, `.about-*`) breaks all sims
- `_toolbar`, `_forms`, `initAboutPanel(config)` — changing these APIs breaks all consumers. `initAboutPanel` now accepts `lastUpdated` (optional)

### Shader Is On-Demand

Not a continuous loop. Renders on scroll/resize/theme-change, auto-stops after 1s of inactivity. New scroll-reactive elements need `requestRender()` or a scroll/resize event dispatch.

### Carousel

- `.carousel-track` must NOT have `overflow: hidden` — it would move the clipping boundary with `translateX`
- Mobile (<=900px) sets `transform: none !important` and enables native scroll-snap

### Specificity

- `.fade-in.visible` (0,2,0) beats `.project-card:hover` (0,1,1). Hover selectors must include `.visible` (e.g., `.my-element.visible:hover`)

### Sidebar Pattern

All project sidebars now use `.sidebar-tabs` inside `.stats-header` instead of a `<h2 class="stats-title">` with a separate `.tab-bar`. New sidebars should follow this pattern.

### Other

- `.hero-tagline em` needs `padding-right: 0.05em` to prevent italic glyph clipping
- `data-theme` is on `<html>` — the shader's MutationObserver watches `document.documentElement`
- `.tog-wrap input` uses `clip: rect(0,0,0,0)` for a11y — do not change to `display: none`
- The sole `<h1>` is the hero tagline — navbar brand is a `<span>` for heading hierarchy
- Blog fetches `posts.json` and `posts/{slug}.md` via relative URLs — breaks if served from a subdirectory. The Worker also fetches these for SSR — slug validation rejects `/` and `..` to prevent path traversal.
- `fonts/` contains self-hosted woff2 files (Merriweather, Lato, Crimson Text, Recursive). `fonts/fonts.css` has the `@font-face` declarations. CSP allows `font-src 'self'` only — no external font domains.
- `_build.js` generates six files — run before deploy. Requires git history for `<lastmod>`:
  - `sitemap.xml` — `<sitemapindex>` pointing to `sitemap-main.xml` and `sitemap-scripture.xml`
  - `sitemap-main.xml` — root routes, project routes, blog, sim routes with `<image:image>` tags
  - `sitemap-scripture.xml` — 2740+ scripture work-level (priority 0.7) and chapter (priority 0.65) URLs with git-dated `<lastmod>` and `<changefreq>`
  - `feed.xml` — RSS 2.0 with `content:encoded` full HTML from rendered markdown, `lastBuildDate` from most recent post (not build date), `<channel><image>`, `<managingEditor>`, `<ttl>60</ttl>`, uses `posts.json` `excerpt` for `<description>`
  - `feed.atom` — Atom feed with same rendered content, `<updated>` uses `p.updated || p.date`, per-entry `<author>` and `<category>` elements
  - `llms-full.txt` — concatenated markdown of all project `about.md` files and blog posts (for LLM consumption). Links back to `llms.txt`.
- `llms.txt` is a static site map for LLMs (per llmstxt.org spec). Links to canonical HTML URLs for each hosted project plus external GitHub projects. Links to `llms-full.txt` for expanded docs. Update when adding projects.
- `.well-known/security.txt` — RFC 9116. Update the `Expires` date annually.
- Each sim's `index.html` has `twitter:title`, `twitter:description`, keyword-rich `<title>`, `og:locale`, `hreflang="en"` self-referential tags, `apple-mobile-web-app-title`, and `<link rel="modulepreload" href="main.js">`. KaTeX-using sims (geon, cyano, shoals) also have `dns-prefetch` + `preconnect` for cdn.jsdelivr.net in HTML `<head>`. Four JSON-LD blocks: `["WebApplication", "LearningResource"]` (with `teaches`, `about` array of Wikidata entities, `inLanguage`, `interactivityType`, `datePublished`, `dateModified`, `codeRepository`, `license`, `sameAs`, `isBasedOn` scholarly articles with DOI links, `educationalAlignment` to 3+ standards (AP/NGSS/professional — Shoals adds GARP FRM, Gerry adds CCSS, Cyano adds IB Biology HL) with `targetUrl` links, `accessibilityFeature`, `accessibilityHazard`, `relatedLink` cross-sim references; Shoals additionally has `@type: "Game"` plus `gameItem`/`genre`/`numberOfPlayers` for its narrative system), `FAQPage` (8 questions — domain-specific, not boilerplate), `BreadcrumbList`, and `HowTo` (3-5 steps for using the sim). All `about` concepts have Wikidata `@id` URIs. Update `dateModified` and FAQ content when making significant sim changes.
- Each sim's `index.html` has a `<details class="edu-content">` section with 500+ words of educational text, Learning Outcomes, Prerequisites, References (with DOI links), Accessibility (describing keyboard nav, theme toggle, ARIA labels, and hazards), and cross-sim "See also" links (all 3 siblings) before `</body>`. This is crawlable content for SEO/GEO — keep it factually accurate and substantive.
- `shared-about.js` `initAboutPanel(config)` accepts optional `lastUpdated` (ISO date string) — displayed as "Updated YYYY-MM-DD" in the about panel footer. Update when making significant sim changes.
- `manifest.json` — Web App Manifest for PWA with 48/192/512px icons (`purpose: "any"`, not maskable — icons have transparent backgrounds), `lang: "en"`, `id: "/"`, `scope: "/"`, `categories: ["education", "science"]`, screenshots (wide + narrow form factors), and `share_target` for scripture search via Web Share Target API. Icons generated by `og/generate.js` from `og/icon.html` (logo.svg in `#e11107` on transparent background).
- Root `index.html` has a `Course` JSON-LD schema linking all 5 sims as a learning path, `WebSite` schema with `datePublished`, `dateModified`, `inLanguage`, and `SearchAction`, and `SiteNavigationElement` schema. Has `hreflang="en"` + `hreflang="x-default"` and `dns-prefetch` for `github.com` and `cdn.jsdelivr.net`. `#breadcrumb` nav element (hidden by default) is filled by the Worker for `/projects`, `/blog`, `/about`.
- `posts.json` `tag` field supports arrays — `_worker.js` emits multiple `<meta property="article:tag">` tags. `_build.js` handles both string and array formats for RSS `<category>`.
- `src/router.js` sets `aria-current="page"` on the active nav link for screen reader accessibility.
- `scripture/index.html` has a `SearchAction` potentialAction in its WebApplication JSON-LD — links to `?q={query}` with `suggestedQuery` examples. Has `hreflang="x-default"`, `og:locale`, `accessibilityFeature`/`accessibilityHazard` in the WebApplication schema and a separate `Dataset` JSON-LD block describing the 16-work corpus (with license, keywords, distribution, `temporalCoverage`, `spatialCoverage`). `scripture/main.js` reads the `?q=` URL parameter on init to auto-open search. `aria-live="polite"` on `#search-results`, `#concordance-results`, and `#notes-content` for dynamic content announcements.
- Each sim's about.md is 400+ words for LLM consumption via `llms-full.txt`. Each includes an Accessibility section describing keyboard navigation, high-contrast mode, ARIA labels, and known hazards.

### Cloudflare Headers Split

- `_headers` applies to **static assets only** (served by the asset layer). Worker-served HTML (SPA routes, scripture, 404) gets headers from `_worker.js`'s `secure()` function. Both must carry the same security headers — changing CSP or HSTS in one requires updating the other. Both set `X-Robots-Tag: index, follow` and `Vary: Accept-Encoding`.
- `Cloudflare-CDN-Cache-Control` is stripped by Cloudflare before reaching the browser. It controls CDN-layer caching independently of `Cache-Control` (which controls the browser). `_headers` uses this for static assets; the Worker sets it for HTML responses.
- `_headers` has a **100-rule limit** (~46 rules used). Adding new path-header pairs requires checking headroom. Early Hints are the largest consumer.
- `robots.txt` has tiered crawl delays: Googlebot (1s), Bingbot (2s), default `*` (5s), and AI scraper bots (10s — GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot). Google-Extended, Applebot-Extended, and DuckAssistBot have no delay. Explicitly allows `/llms.txt` and `/llms-full.txt`. Disallows `/posts/` (raw markdown) and `/fonts/`. Update when new AI search bots emerge.
- `opensearch.xml` — OpenSearch descriptor with favicon `<Image>`, `<LongName>`, `<Language>`, `<InputEncoding>`, RSS/Atom feed discovery URLs. Search URL template points to scripture search (`https://a9l.im/scripture/?q={searchTerms}`). Linked from `index.html` and `scripture/index.html`.
- `llms.txt` and `llms-full.txt` have YAML frontmatter (title, url, description, language, license, updated) for machine-parseable metadata. Update the `updated` date when regenerating.
