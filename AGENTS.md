# a9l.im

Root site for **a9l.im**: a hand-written SPA, a content pipeline, a Cloudflare Worker for routing and SSR, and the shared design system that the browser projects mounted under `projects/` also use. Hosted on Cloudflare Workers + Static Assets.

## Layout

- `site/` — the root SPA shell (`index.html`, `main.js`, `i18n.js`, `styles.css`, `404.html`) and its modules in `site/src/`.
- `content/` — everything a root-site visitor reads: posts, the project registry, homepage cards, and the résumé source.
- `draft/` — unpublished mirror of `content/`, local only (see Content).
- `shared/` — shared CSS and plain-script globals used by the root site and every project.
- `projects/{lumen,miasma,shoals,worldline}/` — git submodules, each with its own `AGENTS.md`. They deploy at `/{name}/` regardless of the physical `projects/` nesting.
- `papers/ogdoad/` — submodule holding the LaTeX writeups that paper posts are generated from. The build reads `writeups/{name}.{tex,bib,pdf}`; nothing else from it is staged.
- `worker/` — `index.js` (routing, SSR, SEO/JSON-LD), `http.js` (response policy), `surveys.js` (`POST /api/surveys`), `analytics.js` (Analytics Engine writes).
- `static/` — copied as-is to the deploy root: `_headers`, fonts, icons, blog assets, `.well-known/security.txt` (its `Expires` date needs renewing yearly).
- `features/surveys/` — data, scoring, local storage, and generator for the planned `/surveys/` page. The frontend isn't built, so nothing here is staged, and `tests/deploy-layout` rejects `surveys/` and `features/` in `dist/` until it ships. Its `AGENTS.md` covers what exists; `PLAN.md` covers the design and remaining work.
- `docs/sim-overhaul/` — the ratified plan for rebuilding the four sims' visuals (`PLAN.md`) and its reference sketches. Not staged.
- `db/migrations/` — D1 migrations for the `SURVEYS_DB` binding (`a9lim-surveys`).
- `lib/wgsl/` — WGSL→JavaScript transpiler and runner, kept but not wired into anything (see `tests/wgsl-transpile/README.md`).
- `tools/` — `stage-assets.mjs`, `build.mjs`, `horizon-fit.mjs`, `subset-fonts.mjs`, `tex-to-post.mjs`, `pandoc.sh`, `og/` (the social cards, each a painting made as a program; see Social cards), `purge-cache.mjs`, `verify-deploy.mjs`.
- `tests/` — `content-pipeline/`, `deploy-layout/`, `wgsl-transpile/`.
- `dist/` and `.build/` — ignored, fully regenerated build output.

## Build, test, deploy

```bash
npm install
npm run build                          # stage dist/, then derive content outputs
npm test                               # build + --check + content/deploy-layout tests + survey tests
npm exec -- wrangler deploy --dry-run  # bundle check
./dev.sh                               # build with drafts, then pinned wrangler dev
./deploy.sh                            # production deploy
```

`npm run build` has two phases:

1. `tools/stage-assets.mjs` recreates `dist/` from an allowlist: root `LICENSE`/`README.md`, the `site/` shell, `site/src/`, `static/`, `shared/`, `content/posts/`, and each project's **git-tracked** files minus dot-paths and any `node_modules/`, `docs/`, `tests/`, `tools/`, or `extract/` directory, root `raw/`, `test_*.mjs` and `*.test.mjs` files, and root `AGENTS.md`/`CLAUDE.md`/`AUDIT.md`/`HANDOFF.md`. A new project file therefore needs `git add` before it appears in a build, and any other root-level file in a project (`README.md`, `about.md`, other `.md`) is public.
2. `tools/build.mjs` derives everything content-dependent into `dist/` and `.build/`.

Generated files exist only in `dist/` and `.build/`; a normal build leaves `git status` clean. The build needs `papers/ogdoad` checked out (`git submodule update --init`). External tools bootstrap themselves into `.build/`: `tools/pandoc.sh` uses a local Pandoc or downloads a pinned, checksum-verified release; `content/resume/build.sh` does the same for Tectonic; `tools/subset-fonts.mjs` for the STIX Two and Shippori Mincho source fonts.

The Worker imports `.build/content.generated.mjs`, so any Wrangler command that bundles it needs a completed build. `wrangler.jsonc` serves only `dist/`, and existing files are served before the Worker except for the `run_worker_first` paths. Keep `html_handling: "auto-trailing-slash"`: `drop-trailing-slash` broke project pages in production, and that failure doesn't reproduce locally.

Deployment is manual; Cloudflare Workers Builds is disabled. `./deploy.sh` clears `DRAFTS`, builds **from the working tree** (uncommitted edits ship too), deploys with the pinned Wrangler, purges the `a9l.im` hostname cache, and checks that the new `home-data.json` `generatedAt` marker is live. The purge token has only Zone Cache Purge permission and comes from the macOS Keychain item `a9l.im-cloudflare-cache-purge`, or `CLOUDFLARE_CACHE_PURGE_TOKEN` elsewhere. The marker check doesn't prove that pages, projects, and fonts load, so after changes to response policy, routing, or assets, load the live site and check for console errors and 404s.

## Content

`content/` is the source of truth for root-site copy. Files are `{name}.md` with an optional Japanese sibling `{name}.ja.md`. Frontmatter takes scalar strings, booleans, and integers, plus simple `- item` lists.

- **Posts** (`content/posts/{slug}.md`): `title`, `date`, optional `updated`, `tag`, `excerpt`, `authors` (list), and `links` (`- label | href`, site-absolute or https, validated). Authors and links render as a byline opposite the date line. `paper: {name}` makes the body come from `papers/ogdoad/writeups/{name}.tex` (see Papers).
- **Projects** (`content/projects/{slug}.md`): card and registry metadata (`title`, `href`, `kind`, `order`, optional `major`/`planned`/`external`, `emoji`, `seoName`, `seoUrl`, `tags`, optional `packages` entries `Registry | name | URL | install`).
- **Home** (`content/home/*.md`): homepage cards; `site.md` holds route and head metadata.
- **Horizons** (`content/home/horizons.md`): the time-horizon figure at the foot of the home page (`/#fits`, drawn by `site/src/horizon.js`). Frontmatter holds its copy; the body holds the source note, the record series table, and a calibration-only table, each row a date plus a METR horizon and/or an AECI score with 95% intervals. `tools/horizon-fit.mjs` fits everything at build time with a seeded bootstrap: the AECI–horizon map, a hyperbola and a double exponential in each y view, the bands, and the singularity interval. Editing the table refits; no fit numbers are kept by hand.
- **Résumé**: `content/resume/` (TeX, fonts, `build.sh`) → `/resume.pdf`.

**Tags.** Post `tag` and project `tags` drive the `?tag=` filter. Each tag's URL slug comes from the English label, so a filtered link survives a language switch, and Japanese labels are matched by position: a `.ja.md` list must have the same length and order (`checkTagPair` enforces this). Project entries carry 2–4 tags from a deliberately small vocabulary, about a dozen per grid and drawn from subject and language rather than rendering tech, so the filter chips stay one usable row. Reuse an existing tag before minting a near-synonym.

**Project docs.** Each registered project's `about.md` carries `name` (must equal its registry `title`), `title`, `description`, and `updated` (YYYY-MM-DD), plus the long-form documentation shown in its about panel. The build writes these into the staged copies of the project's `index.html` (title, meta and social tags, JSON-LD `description` and `dateModified`), its one UI source containing `lastUpdated` (`main.js` or `src/ui.js`), and `i18n/strings.js` where one exists. To date a material behavior change, bump `updated` in `about.md`. Project source is never modified by the build.

**Outputs.** `posts.json`, `src/projects.js`, `src/route-meta.js`, `src/horizon-data.js`, the generated regions of `index.html` and `i18n.js`, `home-data.json`, `README.md` (with the project table), feeds, sitemaps, `llms.txt`/`llms-full.txt`/`about.md`, font subsets, `resume.pdf`, synchronized project HTML/UI copies, and `.build/content.generated.mjs`.

**Drafts.** `draft/` mirrors `content/` and is read only when `DRAFTS=1`, which `./dev.sh` and `npm run dev` set. `./deploy.sh`, `npm run check`, and `npm test` clear it, and `build.mjs --check` refuses to run with drafts on. A draft shadows the `content/` file with the same slug; draft posts render through the normal client and SSR paths with a `draft` badge. Everything in `draft/` except its README is gitignored, so drafts exist only on this machine. Publishing means moving the file into `content/`.

### Markdown

`site/src/markdown.js` is shared by the blog client, Worker SSR, and feed generation, so it stays isomorphic (no DOM or Node APIs). It supports fenced code, `iframe` and `switcher` directive blocks, theme-paired images (`light.png|dark.png`), and GFM-style tables. It also has a paper dialect:

- `::: theorem id="thm:x" name="Title"` … `:::` for `theorem`, `proposition`, `lemma`, `corollary`, `definition`, `remark`, and `proof`, with bodies parsed recursively. Numbering follows amsthm `[section]`: one counter for all numbered kinds, reset at each `##`, printed `{section}.{n}`. `proof` is unnumbered, and `number="A"` gives an explicit number without advancing the counter.
- `[[label]]` renders a linked `Theorem 4.1`; `[[#label]]` renders the bare number. Undeclared labels render visibly as `.xref-missing`.
- Headings take `{#sec:x}` (anchor, referenceable) and `{.unnumbered}`. List items take a leading `{#id}`, which is how bibliography entries become link targets. In a paper-dialect document, `##`/`###` headings print their section number inline, from the same counter as `[[label]]`.
- Labels are collected in a pre-pass before rendering. Math stashing, the switcher counter, and the label table belong to the outermost `parseMarkdown` call, so nested parses must not reset them. Math is HTML-escaped when restored, since formulas contain `<`.

`site/src/blog.js` lazy-loads KaTeX from jsDelivr when a post contains `$` and defines the shared macros (`\F`, `\Tr`, `\Arf`, …) there. Math renders client-side only; SSR and feeds carry the TeX source.

### Papers

`tools/tex-to-post.mjs` converts an amsthm LaTeX paper into the dialect via Pandoc, including a bibliography generated from the `.bib`. The build imports its `convertTex` for every post with `paper:` frontmatter, writes the assembled post over the staged copy, and copies `{name}.pdf` to the site path that the post's `pdf` link names. Such a post has no body or translation of its own, and a missing `.tex`/`.pdf` fails the build. To update a paper, run `git submodule update --remote papers/ogdoad`, rebuild, and commit the new pin. The CLI also starts a post from a paper outside the submodule.

Conversion order matters. `stashMath` hides every `$` span from text rewrites, so anything that operates on math runs before it (environment unwrapping, macro folding) or after `unstashMath` (display-block layout); a rewrite placed in between silently does nothing. Macro folding maps Pandoc's `\operatorname{…}`/`\mathbb{…}` back onto the shared KaTeX macros and keeps the control-word boundary (`\operatorname{rad}B` → `\rad B`). Citation anchors use the visible tag (`#ref-bcg82`), and two entries with the same tag fail the build.

## Shared layer

Check `shared/` before building project-specific UI infrastructure. Public URLs are `/shared/{name}.js` and `/shared/base.css`; the old flat `/shared-{name}` URLs are retired.

- `tokens.js` runs synchronously, before CSS parses. It defines `_PALETTE` (each theme with its `inks`), `_INKS`, `_FONT`, `_themePalette()`, `_loadTextFonts()`, and the color helpers, and each project's `colors.js` extends it (`_freezeTokens`, `_injectProjectVars`).
- `base.css` holds the reset, layout and design tokens, the root navbar's tool buttons and segmented controls, the colophon and caption, overlays, the about panel, info tips, toasts, dependency reveals, and accessibility patterns. It does not style the sims' controls: each sim styles its own (`docs/sim-overhaul/PLAN.md`).
- `colophon.js` (the theme, the colophon's wiring, and the caption setter; the root site uses only the theme); `utils.js` (escaping, timing, math, toast/focus/canvas helpers); `forms.js`, `dropdown.js` (controls and wiring; behavior only); `icons.js` (including the seal), `tabs.js`, `camera.js`, `info.js`, `shortcuts.js`, `about.js`, `touch.js`, `tooltip.js`, `haptics.js`.

Apart from `tokens.js`, these are deferred plain scripts that publish globals on `window`, not ES modules. Their globals, class names (`.colophon*`, `.caption`, `.tab-btn`, `.tab-panel`, `.glass`, `.tool-btn`, `.about-*`, `.sim-dropdown`, `.panel-hint`, `.dep-reveal`, `.dep-hidden`), and data attributes are an API used by every project, so a change has to be checked across all of them.
## Worker and headers

`worker/index.js` SSRs and injects SEO/JSON-LD for the SPA routes (`/sims`, `/projects`, `/blog/*`), redirects `/about` → `/`, `/resume` → `/resume.pdf`, and the renamed sims' old paths `/geon/*` → `/worldline/*` and `/cyano/*` → `/lumen/*` (308), returns secure 404s, and rejects methods other than GET/HEAD, with `POST /api/surveys` as the one exception. The survey endpoint accepts only same-origin, schema-valid JSON, rate-limits by an in-memory IP-derived key without storing IP or request metadata, and fails closed when D1 is unavailable.

Security policy is set in two places that must agree: `worker/http.js` for Worker responses and `static/_headers` for static assets, which also carries Early Hints, COEP, and per-path cache rules. Keep CSP, HSTS, COOP, robots, and `Vary` aligned between them. `_headers` has a 100-rule limit. The CSP has no `unsafe-eval`, so runtime `Function`/`eval` is unavailable in production, and KaTeX needs jsDelivr in `script-src`, `style-src`, and `font-src`.

Caching: public URLs are stable, not content-hashed. Browsers always revalidate (`Cache-Control: max-age=0, must-revalidate`), while `Cloudflare-CDN-Cache-Control`, which Cloudflare strips before delivery, sets the edge lifetime separately. The Worker cache is version-scoped (`cross_version_cache: false`), but the zone cache has kept canonical URLs across deployments, which is why `deploy.sh` purges. Browser revalidation and the purge each cover a different cache, so both are needed.

## Design system

Editorial and quiet: one serif typeface, a near-white neutral ground, a single oxblood red, and hairline rules for structure. It applies to the root site, every project, the icons, and the résumé; the social cards set its type and seal over paintings of their own (Social cards). Projects open straight into the app, without intro or splash screens. A project's title is just its name, and its description says what a visitor learns or does.

### Color

`shared/tokens.js` owns the palette (`_PALETTE.light`, `_PALETTE.dark`) and injects it as CSS custom properties. Neutrals are near-achromatic (OKLCH chroma under 0.004), neither blue-white nor beige.

| Token | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#FCFCFB` | `#121111` | page ground |
| `panelSolid` | `#F4F3F2` | `#161615` | inset blocks, chips, solid HUD panels |
| `elevated` | `#FFFFFF` | `#1B1A1A` | the rare raised surface |
| `text` | `#161514` | `#ECEBEA` | headings, ledes, post body |
| `textSecondary` | `#42413F` | `#BEBDBC` | home-page prose, descriptions |
| `textMuted` | `#666463` | `#949392` | labels, dates, metadata |
| `accent` | `#983432` | `#DC5960` | links, active navigation, emphasized figures, the seal |

- `--border` is `text` at 12% (light) or 13% (dark); link underlines are `accent` at 40%.
- The accent differs per theme. CSS reads `var(--accent)`, while canvas and WebGPU code reads `_themePalette().accent` on each theme change. There is no theme-independent accent.
- Every text role clears 4.5:1 on every surface in both themes; the tightest pair is dark `accent` on `elevated` at 4.66:1.
- The navbar seal is inline SVG in `currentColor`, so it follows the accent. Static copies (`static/logo.svg`, favicon, app icons) use the light `#983432`; a social card sets the seal to suit its painting (`tools/og/card.css`).
- The inks are the data hues: eleven pigments, each paired per theme and clearing 4.5:1 on `canvas` and `panelSolid` in both, so any ink can set text. They live on each theme (`_PALETTE.light.inks`, `_themePalette().inks.ochre`) and in CSS as `--ink-{name}`. Red is not an ink: the accent is the one red. The neutral data hue, graphite, is `textMuted`. Inks differ per theme, so canvas and WebGPU code reads them on each theme change, like the accent. `docs/sim-overhaul/sketches/inks.py` fitted them (OKLCH chroma 0.05–0.12).

| Ink | Light | Dark |
|---|---|---|
| `indigo` | `#586AB2` | `#7486CB` |
| `prussian` | `#3473A3` | `#548EBE` |
| `verdigris` | `#2A7976` | `#4A9593` |
| `viridian` | `#317B55` | `#4F9770` |
| `sap` | `#5B7637` | `#779252` |
| `ochre` | `#8B681B` | `#A8843C` |
| `sienna` | `#9F5D31` | `#BC7950` |
| `umber` | `#7C6049` | `#997D64` |
| `madder` | `#A65179` | `#C07095` |
| `mulberry` | `#97588E` | `#B275A9` |
| `violet` | `#7D60A6` | `#977DBF` |

### Type

- **Newsreader** sets everything a visitor reads: brand, navigation, headings, body, labels, table headers, dates, figures, buttons, HUD readouts, and canvas text. It is self-hosted as variable WOFF2 (opsz 6–72, wght 200–800, roman and italic, Latin and Latin Extended) with `font-optical-sizing: auto`. Its default figures are lining and tabular, so readouts align without monospace. It has no small caps or old-style figures.
- **STIX Two** covers what Newsreader lacks: Text (roman and italic) for Greek, Cyrillic, super/subscripts, and combining marks, so σ̄ sets as one cluster; Math for operators, brackets, ♭ ♮ ♯, and arrows. `tools/subset-fonts.mjs` subsets both at build time into `unicode-range` slices (text, italic, math, arrows) that download only where used. `size-adjust` and the ascent/descent overrides match Newsreader's metrics, so fallback glyphs don't shift baselines. The math cut is declared for italic too, so operators never slant.
- **Shippori Mincho** (400, 500) sets Japanese, subset to kana, CJK punctuation, fullwidth forms, and every kanji in the tracked text of `content/`, `site/`, `worker/`, and the projects. Every slice also carries a fixed core (kana, Greek, digit scripts, common operators and arrows), so a new label renders before a rebuild picks up its characters.
- Stack: `'Newsreader', 'STIX Two Text', 'STIX Two Math', 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`. Tokens: `_FONT.text`/`--font-text`, `_FONT.code`/`--font-code` (system monospace, for code only), `_FONT.emoji`/`--font-emoji`.
- Canvas drawing never triggers a webfont download. Canvas text therefore waits on `_loadTextFonts()`, which `shared/colophon.js` starts on every `.sim-body` page, and a project that draws once redraws when it resolves. KaTeX uses its own fonts.
- Project HUD sizes are `--font-sm`/`--font-base`/`--font-lg` (0.84/0.92/1.02rem). Numeric readouts use `font-variant-numeric: lining-nums tabular-nums`. Form controls inherit the font. Canvas text is at least 10px.

| Root-site element | Size / leading | Notes |
|---|---|---|
| Home lede | 29 / 1.34 | `text` |
| Home body | 18.5 / 1.62 | `textSecondary` |
| Post body | 19.5 / 1.58 | `text`, 680px measure |
| Post title | 54 / 1.06 | weight 400, tracking −0.018em |
| Post h2 / h3 | 29 / 22 | h3 weight 600; section numbers inline in `textMuted` |
| Titles in lists | 25–31 | weight 400 |
| Navigation | 18 | lowercase |
| Labels | 17.5 | italic, sentence case, `textMuted` |
| Metadata | 15.5 | dates, tags, bylines |

Nothing is uppercase or letter-spaced. Japanese labels are upright, weight 500, tracking 0.1em; Japanese body leading is 1.9–1.95.

### Treatments

- Structure comes from 1px hairline rules, not cards. On the root site the only surfaces are inline chips and `kbd`, and radius is 0. The sims follow "Inside the scene" below.
- Navbar: 76px tall with a bottom rule; seal and brand at left, links centered, tools at right. The active link is `accent` with a 1px underline.
- Prose links are `accent` with a 1px underline at 40% accent, offset 0.2em. Navigation and metadata links have no underline.
- Inline lists are separated by `·` (`・` in Japanese). Theorems have no surface: the head is weight 600 and the statement italic. Icons use 1.4px round strokes. The `~` in prediction values is raised 0.16em so it doesn't read as a minus.
- Motion is limited to color and opacity transitions on the shared ease tokens. The site uses no hover transforms, entrance animations, gradient text, shimmer, glow, grain, shadows, or bounce easing. Focus outlines stay.
- `.fade-in.visible` outranks a plain hover selector, so hover rules on those elements include `.visible`.

### Inside the scene

The sims share the paper and choose their own medium: "same paper, different inks" (`docs/sim-overhaul/PLAN.md`, ratified 2026-10-24). Every sim keeps the neutral ground in both themes, Newsreader for every word on the canvas too, the colophon (seal and name at the top left, with play, step, theme and help), a live italic figure caption under the scene, hairline structure in its controls (no cards, shadows or rounded panels), the inks, the keyboard grammar and the about panel. Each sim spends the one red on the thing you would point at: Worldline the selected body, its world line and light cone; Lumen the protons; Miasma the disease; Shoals losses and down moves. Its medium, renderer, control layout and signature view are its own.

Three rules hold inside every scene:

1. **Depict, don't decorate.** The ban on glow, grain, shimmer and flourish still holds for chrome. Inside a scene an effect ships only if it reads a quantity in the model (density is concentration, line weight is flux, bead spacing is proper time). An effect whose quantity can't be named doesn't ship.
2. **Open on a living frame.** No splash screen and no empty state: each sim boots into its best preset, already running. Under reduced motion it opens on a still, complete frame.
3. **Pattern before hue.** Where a scene encodes state, color comes paired with a pattern (stipple, hatching, dash, bead), so the scene survives grayscale and color-vision differences.

**Show, don't tell.** A sim's interface names things and reads out values; it doesn't explain them. Labels, units, live values and glyph keys stay on the surface. What a mark means, how a control works and why the model behaves as it does belong in the about panel, or in an info tip where a concept can't be inferred, never in captions, ledes, hints or empty states. The figure caption is the view's name and its live values, in a line. Readouts are label–value pairs, not sentences. Prefer a symbol, a key or the drawing itself to a sentence, and an affordance (cursor, hover, a dotted value) to an instruction. Nothing on screen repeats what another element already shows.

## Social cards

Each card is a painting made as a program, with the site's type set over it. No image model draws any of it and nothing is traced.

- `tools/og/paint/brush.py` is a small bristle-brush engine (numpy, scipy, Pillow): a stroke is a path and a width, laid down bristle by bristle, with a frisket and a glaze layer beside it. `tools/og/paint/{name}.py` paints one card by calling it a few thousand times; each file's docstring says what the picture shows and what each mark reads. Paintings are 1200 × 630 nominal, painted at twice that and reduced, and are seeded, so the same program gives the same picture.
- `tools/og/{name}.html` and `card.css` set the type over the painting in Newsreader: the seal with a9l.im, and on a sim's card its name. Nothing else is set; a card carries no tagline or rule. `body.dark` is light type for a dark painting, and a template may move its type in a `<style>` of its own (Shoals does).
- `cd tools/og && npm install && npm run generate` paints and writes every card; `node generate.js worldline --repaint` does one, and `--preview DIR` writes PNGs elsewhere for looking at. Paintings are kept in `tools/og/art/` (ignored) and reused until `--repaint`. Painting needs Python with numpy, scipy and Pillow (`PYTHON`, or `python3`); the cards are committed, so the site build needs neither Python nor Puppeteer.
- The root card (`static/og-image.webp`) serves every root route and post. Each sim owns its card (`projects/{slug}/og-image.webp`), which its `index.html` names with a `?v=` revision that the build copies into the sitemap. After repainting, bump the revision so caches refetch: the sim's two image tags, or for the root card `site/index.html`, `worker/index.js`, `static/manifest.json` and `OG_REVISION` in `tools/build.mjs` and `tests/content-pipeline/run.mjs`.

The pictures follow the scenes' rules: every mark reads something in the model, and each card spends one red, on what its sim spends it on.

| Card | Painting | The red |
|---|---|---|
| a9l.im | A grove (the seal's 林) in ink and fog, after Tōhaku's pine screens: a near pair of pines, others going grey behind them | the seal, as the stamp on an ink painting |
| Worldline | The spacetime view as a nocturne: the present is a lit sheet, and each body's world line hangs beneath it, beaded at equal proper time | the selected body, its world line and its past light cone |
| Lumen | A cyanobacterial thylakoid in cross-section, in Goodsell's manner: both membranes and their complexes around the lumen | the protons, whose crowding is the stored gradient |
| Miasma | A town at night, one house per hex cell, its windows the state of a seeded SEIR run: lit, infectious, dark where the wave has passed, with a vaccinated quarter the front split around and a river it crossed only by the bridge | the infectious windows |
| Shoals | A sandbar from the air whose edge is a price path from the sim's own model (GBM, Heston variance, Merton jumps) | a buoy on each day the close fell more than 3.5% |

## Root-site details

- `site/main.js` builds a DOM cache and passes it to the `init*` functions. `site/src/home.js` hydrates `home-data.json`, and `site/src/router.js` handles routes and `aria-current`.
- `?tag={slug}` filters `/sims`, `/projects`, and `/blog` client-side. It is a view, not a route: `parsePath` reports it separately, canonical and `og:url` drop it, and the Worker SSRs the unfiltered listing. Every `[data-page]` link's href is its full destination, query included, because rebuilding a path from `data-page` would drop the filter.
- `data-theme` lives on `<html>`. The home page's only `<h1>` is the visually hidden `a9lim` heading; the navbar brand is not a heading. The Person JSON-LD id is `https://a9l.im/#person`.
- `.tog-wrap input` is visually clipped rather than `display: none` so it stays focusable and announced.
- URLs in deployable HTML and JS are absolute, because deep SPA routes break relative asset paths.

## References and prose

Never take a Wikidata QID, DOI, or scholarly URL from memory. Check QIDs with the Wikidata search API and entity JSON, DOIs with Crossref or the resolver, and other references against their live source; if no entity exists, leave it out. This applies to the Worker's scripture schema and to project JSON-LD, `isBasedOn`, and educational references.

Personal copy in `content/posts/` and `content/home/` is a9's own prose. Contribute facts, structure, and review as bullets for a9 to write up; a draft that reads like finished prose isn't useful there. Project `about.md` files and educational sections use a technical-reference register. Résumé bullets lead with action verbs.
