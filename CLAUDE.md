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
- **SSR**: Blog posts are rendered from markdown at the edge (parser ported from `src/markdown.js`). The project grid is injected as static HTML on `/projects`. Scripture chapter routes get a verse text excerpt (~500 chars) injected into `#reading-pane` and visible breadcrumb HTML into `#breadcrumb`. The correct page section gets the `active` class per route. All of this makes SPA content visible to crawlers without JS execution.
- **SEO injection**: Per-route `<title>`, `<meta description>`, OG tags, canonical URLs, `BlogPosting` + `BreadcrumbList` JSON-LD (blog posts), `Person` JSON-LD (`/about`), and per-chapter meta tags + `BreadcrumbList` JSON-LD (scripture).
- **Security headers** (CSP, HSTS, COOP, etc.) via the `secure()` wrapper — `_headers` only covers static assets.

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

- **`_worker.js`** — SPA routing, HTMLRewriter SSR + SEO injection, security headers (via `secure()` wrapper), CDN cache control, Analytics Engine logging, scripture chapter meta rewriting + BreadcrumbList + verse SSR + visible breadcrumbs, and blog BreadcrumbList. Removing it breaks direct navigation to `/projects`, `/blog/*`, `/about`, and `/scripture/*`. Route metadata lives in `ROUTE_META` and `BLOG_META` at the top of the file — update these when adding SPA routes or blog posts. `WORK_TITLES` maps scripture work IDs to display names for meta/breadcrumb injection on `/scripture/{workId}/{bookId}-{chapter}` URLs. Scripture chapter routes get full `rewriteHTML()` treatment (title, description, canonical, OG, breadcrumb JSON-LD, verse excerpt in `#reading-pane`, visible breadcrumb in `#breadcrumb`). Blog posts get `BlogPosting` + `BreadcrumbList` in a `@graph`. `PROJECTS_SSR` and the markdown parser (`renderMarkdown`) are duplicated from client code — update all copies. `ABOUT_JSONLD` contains Person structured data for `/about`. Security headers are duplicated between `_worker.js` (`SECURITY_HEADERS` object) and `_headers` (`/*` block) because they serve different response types — keep them in sync.
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
- `_build.js` generates four files — run before deploy. Requires git history for `<lastmod>`:
  - `sitemap.xml` — 2700+ URLs with scripture deep routes, git-dated `<lastmod>`, `<changefreq>`, `<priority>`, and `<image:image>` tags on sim URLs
  - `feed.xml` — RSS 2.0 with `content:encoded` full HTML from rendered markdown, `lastBuildDate`
  - `feed.atom` — Atom feed with same rendered content
  - `llms-full.txt` — concatenated markdown of all project `about.md` files and blog posts (for LLM consumption)
- `llms.txt` is a static site map for LLMs (per llmstxt.org spec). Links to canonical HTML URLs for each project. Update when adding projects.
- `.well-known/security.txt` — RFC 9116. Update the `Expires` date annually.
- Each sim's `index.html` has three JSON-LD blocks: `["WebApplication", "LearningResource"]` (with `teaches`, `interactivityType`, `datePublished`, `dateModified`, `codeRepository`, `license`), `FAQPage` (7-8 questions), and `BreadcrumbList`. All `about` concepts have Wikidata `@id` URIs. Update `dateModified` and FAQ content when making significant sim changes.
- Each sim's `index.html` has a `<details class="edu-content">` section with educational text and FAQ Q&As before `</body>`. This is crawlable content for SEO/GEO — keep it factually accurate.
- `shared-about.js` `initAboutPanel(config)` accepts optional `lastUpdated` (ISO date string) — displayed as "Updated YYYY-MM-DD" in the about panel footer. Update when making significant sim changes.
- `manifest.json` — Web App Manifest for PWA with 48/192/512px icons and `categories: ["education", "science"]`. Icons generated by `og/generate.js` from `og/icon.html` (logo.svg in `#e11107` on transparent background).

### Cloudflare Headers Split

- `_headers` applies to **static assets only** (served by the asset layer). Worker-served HTML (SPA routes, scripture, 404) gets headers from `_worker.js`'s `secure()` function. Both must carry the same security headers — changing CSP or HSTS in one requires updating the other.
- `Cloudflare-CDN-Cache-Control` is stripped by Cloudflare before reaching the browser. It controls CDN-layer caching independently of `Cache-Control` (which controls the browser). `_headers` uses this for static assets; the Worker sets it for HTML responses.
- `_headers` has a **100-rule limit** (~46 rules used). Adding new path-header pairs requires checking headroom. Early Hints are the largest consumer.
- `robots.txt` explicitly allows 10 AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Google-Extended, Applebot-Extended, DuckAssistBot). Update when new AI search bots emerge.
