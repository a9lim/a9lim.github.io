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
- `papers/ogdoad/` — git submodule holding the LaTeX writeups. Source only: nothing under `papers/` is staged, and the build reads `writeups/{name}.{tex,bib,pdf}` out of it.
- `static/` — public assets copied to the deploy root, including `static/_headers`, fonts, icons, blog assets, and `.well-known/security.txt`.
- `features/surveys/` — survey scoring/data foundation. It is source-only and must not be copied into the static bundle.
- `db/migrations/` — D1 migrations.
- `lib/wgsl/` — dormant WGSL-to-JavaScript transpiler and runner. It is not deployed.
- `tools/` — the build orchestrator, asset stager, fallback-font subsetter, and OG generation tooling.
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

The build needs the `papers/ogdoad` submodule checked out because paper posts convert their body from LaTeX on every build. `tools/pandoc.sh` prefers a local Pandoc and otherwise downloads the pinned, checksum-verified Linux release into `.build/`; `content/resume/build.sh` does the same for Tectonic, and `tools/subset-fonts.mjs` for the STIX Two and Shippori Mincho source fonts (`.build/fonts/`). `git submodule update --init` if a fresh clone fails there.

`npm run build` runs two explicit phases:

1. `tools/stage-assets.mjs` deletes and recreates `dist/`, then copies only allowlisted site/static/shared files and tracked deployable files from each project submodule.
2. `tools/build.mjs` derives all content-dependent outputs into `dist/` and `.build/`.

`npm test` rebuilds, runs the deterministic `--check`, verifies content consistency and the deploy allowlist, and runs the survey API/scoring tests. `./dev.sh` builds then starts pinned Wrangler. Production deployment is manual: Cloudflare Workers Builds stays disabled, and `./deploy.sh` builds, deploys, purges the `a9l.im` hostname cache with the least-privilege token stored in macOS Keychain, then verifies the live `home-data.json` marker. For a static-only preview, build first and serve `dist/`.

The Worker imports `.build/content.generated.mjs`, so Wrangler commands that bundle the Worker require a completed build. `wrangler.jsonc` points only at `dist/`; do not broaden its asset directory back to the repository root. Workers Static Assets handles existing files before the Worker, so the retired Pages `_routes.json` file must not return.

## Content pipeline

`content/` is the single source of truth for editable root-site content. Frontmatter accepts scalar strings/bools/integers and simple `- item` lists. English and Japanese files are parallel `{name}.md` / `{name}.ja.md` pairs.

- `content/posts/{slug}.md` — canonical served post markdown. Fields: `title`, `date`, optional `updated`, `tag`, and `excerpt`. Optional `paper` names a writeup in the `papers/ogdoad` submodule and replaces the body entirely (see below). Optional `authors` (a `- name` list) and `links` (a `- label | href` list, site-absolute or https, validated at build time) render as a byline opposite the date/tag line; a paper's provenance belongs there rather than in the body. A Japanese sibling adds translated metadata/body and `translations: ["ja"]` in generated metadata.
- `content/projects/{slug}.md` — project cards and registry metadata. Fields include `title`, `href`, `kind`, `order`, optional `major`/`planned`, `external`, `emoji`, `seoName`, `seoUrl`, `tags`, and optional `packages` entries (`Registry | name | URL | install`).
- `content/home/*.md` — homepage cards and `site.md` route/head metadata.

Post `tag` and project `tags` are lists that drive the `?tag=` listing filter. The build derives a `tagSlugs` array alongside each, slugified from the **English** label, and that slug is what the URL carries — a filtered link therefore survives a language switch. Localized labels are looked up positionally, so a Japanese sibling's list must have the same length **and order** as the English one; `checkTagPair` in `tools/build.mjs` fails the build otherwise. Two tags in one entry that slugify alike are also a build error.

The project tag vocabulary is deliberately small — roughly a dozen per grid, drawn from subject and language rather than rendering tech — so the filter chips stay a usable row instead of a wall of one-item dead ends. Each entry carries 2–4 tags, enforced at build time. Prefer reusing an existing tag over minting a near-synonym; a tag that will only ever match one entry is usually better spent on a broader one.

- `content/resume/` — TeX source, fonts, and build script for `/resume.pdf`.
- `projects/{sim}/about.md` — canonical simulation documentation and its `name`, `title`, `description`, and `updated` metadata.

`draft/` mirrors that structure — `draft/posts/`, `draft/projects/`, `draft/home/`, same frontmatter rules and same `{name}.ja.md` convention — and is folded into the build only when `DRAFTS=1`. `./dev.sh` and `npm run dev` set it; `./deploy.sh`, `npm run check`, and `npm test` clear it so an exported `DRAFTS=1` cannot leak into a deploy, and `tools/build.mjs --check` refuses to run with drafts enabled. A draft file shadows the `content/` file of the same slug, so a draft is either a new entry or a preview of a revision; publishing is `git mv`. Draft posts are staged over `dist/content/posts/` so they render through the same client and Worker SSR paths, and carry `draft: true` in `posts.json`, which the listing shows as a badge.

The build emits `dist/posts.json`, `dist/src/projects.js`, the generated regions of `dist/index.html` and `dist/i18n.js`, `dist/home-data.json`, feeds, sitemaps, discovery files, `dist/resume.pdf`, synchronized project HTML/UI copies, and `.build/content.generated.mjs`. These are outputs, not hand-edited files. Project source is read-only during the parent build; SEO synchronization happens in `dist/{sim}/`, not inside the submodule.

The lightweight markdown parser is `site/src/markdown.js`, shared by the blog client, Worker SSR, and feed generation. Keep it isomorphic: no DOM or Node-only APIs. It supports the existing iframe and switcher directives, theme-paired images (`light|dark`), and GFM-style tables.

It also carries a small paper dialect, used by posts converted from LaTeX writeups:

- `::: theorem id="thm:x" name="Optional title"` … `:::` containers for `theorem`, `proposition`, `lemma`, `corollary`, `definition`, `remark`, and `proof`. Bodies are parsed recursively. Numbering mirrors amsthm's `\newtheorem{...}[section]`: one counter shared by every numbered kind, reset at each `##`, printed as `{section}.{n}`; `proof` is unnumbered. `number="A"` supplies a named theorem's explicit display number without advancing that counter.
- `[[label]]` renders a linked `Theorem 4.1`; `[[#label]]` renders the bare number, for prose supplying its own noun ("Sections 3–5"). An undeclared label renders visibly as `.xref-missing` rather than failing silently.
- Headings take a trailing pandoc-style attribute block: `{#sec:x}` sets the anchor and makes the heading referenceable, `{.unnumbered}` keeps it out of the section count so an abstract or reference list does not renumber the paper between them. List items take a leading `{#id}` anchor, which is how bibliography entries become link targets.
- In a paper-dialect document (any theorem environment or attributed heading), `##` and `###` headings also print their section number inline as `<span class="sec">`, counted by the same rule, so the printed number always matches `[[label]]`. Numbering requires a pre-pass, so `parseMarkdown` scans labels before rendering. Math, the switcher counter, and the label table are module-level and owned by the outermost call only — nested parses must not reset them. Math is HTML-escaped when restored: formulas routinely contain `<`, which the browser would otherwise read as markup.

KaTeX is lazy-loaded from jsDelivr by `site/src/blog.js` whenever a post contains `$`, with the shared macros (`\F`, `\Tr`, `\Arf`, …) defined there rather than per formula. Math renders client-side only; SSR and feeds emit the TeX source.

`tools/tex-to-post.mjs` converts an amsthm LaTeX paper into this dialect via pandoc, including a bibliography generated from the `.bib`. It serves two callers:

- **The build imports `convertTex`.** A post whose frontmatter carries `paper: {name}` has no body of its own — `tools/build.mjs` generates it from `papers/ogdoad/writeups/{name}.tex` on every build, writes the assembled file over the staged copy in `dist/content/posts/`, and copies `{name}.pdf` to whatever site path the post's own `pdf` link names. A `paper:` post with a body, a translated sibling, or a missing `.tex`/`.pdf` is a build error. **The paper is the source of truth; only frontmatter is editable here.** Updating it is `git submodule update --remote papers/ogdoad`, rebuild, commit — the same motion as the project submodules, and the pin is what keeps the build deterministic.
- **The CLI still works** for starting a post from a paper that does not live in the submodule: run it, review, commit the markdown.

Conversion order matters and is easy to break. `stashMath` hides every `$` span so text-level rewrites cannot corrupt a formula, which means anything operating on math must run *before* it (environment unwrapping, macro folding) or *after* `unstashMath` (display-block layout). A rewrite placed between them silently does nothing. Macro folding maps pandoc's `\operatorname{…}`/`\mathbb{…}` output back onto the shared KaTeX macros and must preserve the control-word boundary — `\operatorname{rad}B` folds to `\rad B`, never `\radB`. Citation anchors use the visible tag (`#ref-bcg82`), not the BibTeX key, and two entries colliding on one tag is a build error.

## Shared code policy

Always inspect `shared/` before adding project-specific UI infrastructure. Canonical public URLs are `/shared/{name}.js` and `/shared/base.css`. The build emits former `/shared-*.js` and `/shared/base.css` paths as one-cycle compatibility aliases; new code must not use those aliases.

Important modules:

- `shared/tokens.js` — synchronous token/bootstrap script; it must execute before CSS parses. Exposes `_PALETTE`, `_FONT`, `_themePalette()`, `_loadTextFonts()`, and the color helpers, and extends through each project's `colors.js`.
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

The Worker cache is explicitly version-scoped with `cache.cross_version_cache: false`, but the live zone cache has retained canonical URLs across deployments. `tools/purge-cache.mjs` therefore purges only the `a9l.im` hostname after Wrangler succeeds; its token has only Zone Cache Purge permission and is read from the `a9l.im-cloudflare-cache-purge` Keychain item (or `CLOUDFLARE_CACHE_PURGE_TOKEN` off macOS). Public assets use stable URLs, so both `static/_headers` and Worker responses also require browser revalidation (`max-age=0, must-revalidate`); an edge purge cannot evict an already-fresh browser copy. Preserve the purge and revalidation halves together.

## Design system

Editorial and quiet: one serif typeface, a near-white neutral ground, a single oxblood red, and hairline rules for structure. It covers the root site, every project, generated images, and the resume.

### Color

`shared/tokens.js` owns the palette (`_PALETTE.light`, `_PALETTE.dark`) and injects it as CSS custom properties. Neutrals are near-achromatic (OKLCH chroma below 0.004): never cold blue-white, never beige.

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FCFCFB` | `#121111` | page ground |
| `panelSolid` | `#F4F3F2` | `#161615` | inset blocks, chips, solid HUD panels |
| `elevated` | `#FFFFFF` | `#1B1A1A` | the rare raised surface |
| `text` | `#161514` | `#ECEBEA` | headings, ledes, post body |
| `textSecondary` | `#42413F` | `#BEBDBC` | home-page prose, descriptions |
| `textMuted` | `#666463` | `#949392` | labels, dates, metadata |
| `accent` | `#983432` | `#DC5960` | links, active navigation, emphasized figures, the seal |

- Rules (`--border`) are `text` at 12% (light) or 13% (dark). Link underlines are `accent` at 40%.
- The accent is per theme: CSS reads `var(--accent)`; canvas and WebGPU code reads `_themePalette().accent` (the palette for the current `data-theme`) on every theme change. There is no theme-independent accent value.
- Every text role clears 4.5:1 on every surface in both themes; the lowest pair is dark `accent` on `elevated` at 4.66:1.
- The navbar seal is inline SVG filled with `currentColor`, so it follows the theme's accent (light oxblood on the dark canvas is only 2.6:1). Static copies — `static/logo.svg`, the favicon, app icons, OG cards — use light `#983432`.
- `extended` data hues are unchanged except `slate`, which is `#8A8580` (OKLCH 0.62 0.010 75) so it sits on the neutral ground. `secondary` is unchanged.

### Type

- **Newsreader for everything a visitor reads**: brand, navigation, headings, body, labels, table headers, dates, figures, buttons, HUD readouts, and canvas text. Glyphs it lacks come from two fallback families subset at build time by `tools/subset-fonts.mjs`, both build outputs in `dist/fonts/`, never tracked. Self-hosted variable WOFF2 (opsz 6–72, wght 200–800), roman and italic, Latin and Latin Extended subsets, with `font-optical-sizing: auto`.
- Newsreader's default figures are lining and tabular, so dates and readouts align without a monospace face. It has no small caps and no old-style figures.
- **Greek, Cyrillic, super/subscripts, operators, arrows, and accidentals are STIX Two**: Text (roman and italic) for letters, scripts, and combining marks, so σ̄ sets as one cluster; Math for operators, brackets, ♭ ♮ ♯, and arrows. Each `unicode-range` slice (text, italic, math, arrows) downloads only on a page that uses it, so an English page with "→" pulls only the 5 KB arrows file. `size-adjust` matches Newsreader's x-height and `ascent-`/`descent-override` restore its line metrics, so a fallback glyph never moves a baseline or a line. Math's one upright cut is declared for italic too: operators in italic runs never slant.
- **Japanese is Shippori Mincho** (400 and 500), subset to kana, CJK punctuation, fullwidth forms, and every kanji in the tracked text of `content/`, `site/`, `worker/`, and the projects.
- Every slice always carries a fixed core (kana; the Greek alphabet; digit super/subscripts; common operators and arrows), so a new label renders correctly before its characters reach the scanned text. Stack: `'Newsreader', 'STIX Two Text', 'STIX Two Math', 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`.
- **Monospace only for code** (`--font-code`, a system stack with no webfont).
- Canvas drawing never starts a webfont download, so canvas text waits on `_loadTextFonts()` (`shared/tokens.js`), which loads Newsreader and every STIX slice; `shared/toolbar.js` starts it on each `.sim-body` page, and a project that draws once redraws when it resolves. KaTeX math in posts renders in KaTeX's own fonts.
- Font tokens are `_FONT.text`, `_FONT.code`, and `_FONT.emoji`, injected as `--font-text`, `--font-code`, and `--font-emoji`. There are no variation-settings tokens. Scripture's optional sans reading face is a local system-sans stack in that project, not a shared token.
- Project HUD sizes are `--font-sm` / `--font-base` / `--font-lg` (0.84 / 0.92 / 1.02rem) in `shared/base.css`; numeric readouts use `font-variant-numeric: lining-nums tabular-nums`. The base reset sets `font: inherit` on form controls, so buttons and inputs never fall back to the system UI face.

### Typographic scale (root site)

| Element | Size / leading | Notes |
|---|---|---|
| Home lede | 29 / 1.34 | `text` |
| Home body | 18.5 / 1.62 | `textSecondary` |
| Post body | 19.5 / 1.58 | `text`, 680px measure |
| Post title | 54 / 1.06 | weight 400, tracking −0.018em |
| Post h2 / h3 | 29 / 22 | h3 weight 600; section numbers inline in `textMuted` |
| Post and project titles in lists | 25–31 | weight 400 |
| Navigation | 18 | lowercase |
| Labels | 17.5 | italic, sentence case, `textMuted` |
| Metadata | 15.5 | dates, tags, bylines |

Nothing is uppercase or letter-spaced. Japanese labels are upright, weight 500, tracking 0.1em; Japanese body leading is 1.9–1.95.

### Treatments

- Structure comes from 1px hairline rules, not cards. The root site has no container surfaces except inline chips and `kbd`, and its radius is 0. Project HUD controls keep `--radius: 2px`, solid `panelSolid` panels, and translucent `--bg-panel` overlays with `blur(8px)`.
- Navbar: 76px, bottom rule, seal and brand at left, links centered, tools at right. The active link is `accent` with a 1px underline.
- Prose links are `accent` with a 1px underline at 40% accent, offset 0.2em. Navigation and metadata links are not underlined.
- Inline lists (topics, card tags) are separated by `·`, or `・` in Japanese.
- Theorems have no surface: the head ("Theorem A.") is weight 600 and the statement italic.
- Icons use 1.4px strokes with round caps and joins.
- Motion is color and opacity transitions on the shared ease tokens. No hover transforms, blur or translate entrances, gradient text, shimmer, tilt, glow, grain overlay, or shadows on the root site, and no bounce or spring easing.
- The `~` in prediction values is raised 0.16em; Newsreader's sits low enough to read as a minus.
- Canvas text in projects is at least 10px.
- Use design tokens instead of hardcoded values. Accessibility focus outlines remain allowed.
- `.fade-in.visible` outranks a plain hover selector; hover rules for those elements must include `.visible`.
- Keep project sidebars on the `.sidebar-tabs` pattern inside `.stats-header`.

## SEO and identifier safety

Never invent Wikidata QIDs, DOIs, or scholarly URLs from memory. Verify QIDs with the Wikidata search API and entity JSON, DOIs with Crossref or the DOI resolver, and other references against their live primary source. If no entity exists, omit it. This applies to Worker scripture schema, project JSON-LD, `isBasedOn`, and educational references.

Each project retains substantive `about.md` documentation, educational content, accessibility notes, structured data, canonical metadata, and verified references. Update `dateModified` and the about-panel `lastUpdated` value when behavior changes materially; the parent build checks their agreement in the staged output.

## Root-site specifics

- `site/main.js` creates the shared DOM cache passed to root init functions.
- `site/src/home.js` hydrates generated homepage data; `site/src/router.js` maintains `aria-current`.
- `?tag={slug}` filters `/sims`, `/projects`, and `/blog` client-side. It is a view, not a route: `parsePath` reports it separately from page/slug, canonical and `og:url` deliberately drop it, and the Worker SSRs the unfiltered listing. Every `[data-page]` link's href is the route it navigates to, query string included — do not rebuild a path from `data-page` alone or the filter is lost on click.
- The root Person JSON-LD entity remains `https://a9l.im/#person`.
- The home page's only `<h1>` is the visually hidden `a9lim` heading; the navbar brand (`.nav-brand`, inline-SVG seal plus name) is not a heading.
- `data-theme` lives on `<html>`.
- `.tog-wrap input` stays visually clipped for accessibility; never replace it with `display: none`.
- Root and project URLs inside deployable HTML/JS are absolute. Deep SPA routes make relative asset URLs unsafe.
- `static/fonts/` holds Newsreader (roman and italic, latin and latin-ext WOFF2), Noto Emoji, the OFL texts for those and for the build-time STIX Two and Shippori Mincho subsets, and `fonts.css`. KaTeX project fonts still require jsDelivr in CSP.
- `static/.well-known/security.txt` has an annual expiry date.

## Prose voice

Root-site personal copy in `content/posts/` and `content/home/` uses a9lim's prose voice and its dedicated writing workflow when available. Simulation `about.md` files and educational sections use a technical-reference register. Resume bullets remain action-verb-led unless explicitly requested otherwise.
