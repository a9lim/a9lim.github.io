# AGENTS.md

Root site for **a9l.im**, hosted on Cloudflare Workers + Static Assets. This repository also owns the shared design system and mounts eight browser projects as git submodules.

## Source and output boundaries

The top-level layout is intentional:

- `site/` — hand-edited root SPA shell (`index.html`, `main.js`, `i18n.js`, `styles.css`, `404.html`) and browser modules in `site/src/`.
- `content/` — canonical root-site copy, project registry, posts, and resume source. If changing words a root-site visitor reads, start here.
- `draft/` — unpublished mirror of `content/`, read only when `DRAFTS=1`. Never deployed. See `draft/README.md`.
- `shared/` — shared CSS and plain-script browser globals consumed by the root site and all projects.
- `projects/{cyano,geon,gerry,miasma,pile,plasma,scripture,shoals}/` — git submodules. Their physical nesting does not change their public roots (`/geon/`, `/scripture/`, and so on).
- `worker/` — Cloudflare Worker. `index.js` owns routing and SSR; `http.js` owns Worker response policy; `surveys.js` owns `POST /api/surveys`; `analytics.js` owns Analytics Engine writes.
- `static/` — public assets copied to the deploy root, including `static/_headers`, fonts, icons, blog assets, and `.well-known/security.txt`.
- `features/surveys/` — survey scoring/data foundation. It is source-only and must not be copied into the static bundle.
- `db/migrations/` — D1 migrations.
- `lib/wgsl/` — dormant WGSL-to-JavaScript transpiler and runner. It is not deployed.
- `tools/` — the build orchestrator, asset stager, and OG generation tooling.
- `dist/` — ignored, fully replaceable deploy tree.
- `.build/` — ignored Worker/build intermediates, including `content.generated.mjs`.

Never restore generated browser, feed, sitemap, discovery, PDF, or Worker-data artifacts to the repository root. A normal build must leave tracked files untouched.

## Build contract

Use the pinned Node tooling:

```bash
npm install
npm run build
npm test
npm exec -- wrangler deploy --dry-run
```

`npm run build` runs two explicit phases:

1. `tools/stage-assets.mjs` deletes and recreates `dist/`, then copies only allowlisted site/static/shared files and tracked deployable files from each project submodule.
2. `tools/build.mjs` derives all content-dependent outputs into `dist/` and `.build/`.

`npm test` rebuilds, runs the deterministic `--check`, verifies content consistency and the deploy allowlist, and runs the survey API/scoring tests. `./dev.sh` builds then starts pinned Wrangler. `./deploy.sh` builds then deploys. For a static-only preview, build first and serve `dist/`.

The Worker imports `.build/content.generated.mjs`, so Wrangler commands that bundle the Worker require a completed build. `wrangler.jsonc` points only at `dist/`; do not broaden its asset directory back to the repository root. Workers Static Assets handles existing files before the Worker, so the retired Pages `_routes.json` file must not return.

## Content pipeline

`content/` is the single source of truth for editable root-site content. Frontmatter accepts scalar strings/bools/integers and simple `- item` lists. English and Japanese files are parallel `{name}.md` / `{name}.ja.md` pairs.

- `content/posts/{slug}.md` — canonical served post markdown. Fields: `title`, `date`, optional `updated`, `tag`, and `excerpt`. A Japanese sibling adds translated metadata/body and `translations: ["ja"]` in generated metadata.
- `content/projects/{slug}.md` — project cards and registry metadata. Fields include `title`, `href`, `kind`, `order`, optional `major`/`planned`, `external`, `emoji`, `seoName`, `seoUrl`, `tags`, and optional `packages` entries (`Registry | name | URL | install`).
- `content/home/*.md` — homepage cards and `site.md` route/head metadata.
- `content/resume/` — TeX source, fonts, and build script for `/resume.pdf`.
- `projects/{sim}/about.md` — canonical simulation documentation and its `name`, `title`, `description`, and `updated` metadata.

`draft/` mirrors that structure — `draft/posts/`, `draft/projects/`, `draft/home/`, same frontmatter rules and same `{name}.ja.md` convention — and is folded into the build only when `DRAFTS=1`. `./dev.sh` and `npm run dev` set it; `./deploy.sh`, `npm run check`, and `npm test` clear it so an exported `DRAFTS=1` cannot leak into a deploy, and `tools/build.mjs --check` refuses to run with drafts enabled. A draft file shadows the `content/` file of the same slug, so a draft is either a new entry or a preview of a revision; publishing is `git mv`. Draft posts are staged over `dist/content/posts/` so they render through the same client and Worker SSR paths, and carry `draft: true` in `posts.json`, which the listing shows as a badge.

The build emits `dist/posts.json`, `dist/src/projects.js`, the generated regions of `dist/index.html` and `dist/i18n.js`, `dist/home-data.json`, feeds, sitemaps, discovery files, `dist/resume.pdf`, synchronized project HTML/UI copies, and `.build/content.generated.mjs`. These are outputs, not hand-edited files. Project source is read-only during the parent build; SEO synchronization happens in `dist/{sim}/`, not inside the submodule.

The lightweight markdown parser is `site/src/markdown.js`, shared by the blog client, Worker SSR, and feed generation. Keep it isomorphic: no DOM or Node-only APIs. It supports the existing iframe and switcher directives, theme-paired images (`light|dark`), and GFM-style tables.

## Shared code policy

Always inspect `shared/` before adding project-specific UI infrastructure. Canonical public URLs are `/shared/{name}.js` and `/shared/base.css`. The build emits former `/shared-*.js` and `/shared/base.css` paths as one-cycle compatibility aliases; new code must not use those aliases.

Important modules:

- `shared/tokens.js` — synchronous token/bootstrap script; it must execute before CSS parses. Extends through each project's `colors.js`.
- `shared/base.css` — reset, layout/design tokens, HUD surfaces, controls, overlays, dropdowns, toasts, dependency reveals, and accessibility patterns.
- `shared/utils.js` — escaping, timing, math, toast/focus/canvas helpers.
- `shared/toolbar.js`, `shared/forms.js`, `shared/dropdown.js`, `shared/settings.js` — canonical controls and wiring.
- `shared/icons.js`, `shared/tabs.js`, `shared/camera.js`, `shared/info.js`, `shared/shortcuts.js`, `shared/about.js`, `shared/touch.js`, `shared/tooltip.js`, `shared/sparkline.js`, `shared/haptics.js` — shared project UI services.

Except for `tokens.js`, shared scripts use `defer`, expose globals on `window`, and are intentionally not ES modules. Changing public globals, class names (`.tab-btn`, `.tab-panel`, `.glass`, `.tool-btn`, `.about-*`, `.sim-dropdown`, `.panel-hint`, `.dep-reveal`, `.dep-hidden`), or data attributes can break every project.

`lib/wgsl/transpile.js`, `runner.js`, and `worker.js` are retained but unwired. Production CSP forbids runtime `Function` evaluation. Any CPU fallback needs a deterministic build-time artifact writer, a project importer, and the full WGSL smoke suite; do not imply that one ships today.

## Worker and Cloudflare contracts

`worker/index.js` preserves direct navigation for `/sims`, `/projects`, `/blog/*`, and `/scripture/*`; redirects `/about` to `/` and `/resume` to `/resume.pdf`; injects SSR/SEO/JSON-LD; returns secure 404s; and rejects unsupported methods. Scripture fetches are bounded by the existing timeout. Survey writes remain same-origin, schema-validated, rate-limited without storing IP/request metadata, and fail closed without D1.

Security policy is deliberately duplicated:

- `worker/http.js` applies it to Worker-generated responses.
- `static/_headers` applies it to direct static-asset responses and also owns Early Hints, COEP, and cache policy.

Keep CSP, HSTS, COOP, robots policy, and `Vary` aligned across both. `static/_headers` has a 100-rule limit. Cloudflare strips `Cloudflare-CDN-Cache-Control` before browser delivery; it controls CDN caching separately from browser `Cache-Control`.

## Design philosophy

Command-center engineering aesthetic: sharp, geometric, flat.

- Differentiate surfaces with background color, not container borders.
- No resting shadows; hover may use `--shadow-hover`, focus/active may use `--shadow-glow`.
- Opaque content panels use elevated/solid backgrounds; HUD overlays use translucent `--bg-panel` plus `blur(8px)`.
- Lines are accents (underlines, side bars, rules), never rounded container boundaries.
- No bounce/spring easing. Use the shared ease tokens.
- Use design tokens instead of hardcoded CSS values. Accessibility focus outlines remain allowed.
- `.fade-in.visible` outranks a plain hover selector; hover rules for those elements must include `.visible`.
- Keep project sidebars on the `.sidebar-tabs` pattern inside `.stats-header`.

## SEO and identifier safety

Never invent Wikidata QIDs, DOIs, or scholarly URLs from memory. Verify QIDs with the Wikidata search API and entity JSON, DOIs with Crossref or the DOI resolver, and other references against their live primary source. If no entity exists, omit it. This applies to Worker scripture schema, project JSON-LD, `isBasedOn`, and educational references.

Each project retains substantive `about.md` documentation, educational content, accessibility notes, structured data, canonical metadata, and verified references. Update `dateModified` and the about-panel `lastUpdated` value when behavior changes materially; the parent build checks their agreement in the staged output.

## Root-site specifics

- `site/main.js` creates the shared DOM cache passed to root init functions.
- `site/src/home.js` hydrates generated homepage data; `site/src/router.js` maintains `aria-current`.
- The root Person JSON-LD entity remains `https://a9l.im/#person`.
- The sole root `<h1>` is the hero tagline; the navbar brand is not a heading.
- `data-theme` lives on `<html>`.
- `.tog-wrap input` stays visually clipped for accessibility; never replace it with `display: none`.
- Root and project URLs inside deployable HTML/JS are absolute. Deep SPA routes make relative asset URLs unsafe.
- `static/fonts/` contains the self-hosted Recursive variable font. KaTeX project fonts still require jsDelivr in CSP.
- `static/.well-known/security.txt` has an annual expiry date.

## Prose voice

Root-site personal copy in `content/posts/` and `content/home/` uses a9lim's prose voice and its dedicated writing workflow when available. Simulation `about.md` files and educational sections use a technical-reference register. Resume bullets remain action-verb-led unless explicitly requested otherwise.
