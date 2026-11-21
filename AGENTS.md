# a9l.im

The root site for **a9l.im**: a hand-written SPA, a content pipeline, a Cloudflare Worker for routing and SSR, and the shared design layer that the sims mounted under `projects/` also use. Hosted on Cloudflare Workers + Static Assets.

## Layout

- `site/` — the SPA shell (`index.html`, `main.js`, `i18n.js`, `styles.css`, `404.html`) and its modules in `site/src/`.
- `content/` — every word a root-site visitor reads: posts, the project registry, homepage cards, the résumé source. `draft/` mirrors it, local only.
- `shared/` — CSS and plain-script globals used by the root site and every sim.
- `projects/{isochron,lumen,miasma,shoals,worldline}/` — submodules, each with its own `AGENTS.md`, deployed at `/{name}/`.
- `papers/ogdoad/` — submodule; the build reads only `writeups/{name}.{tex,bib,pdf}` for paper posts.
- `worker/` — routing, SSR and JSON-LD (`index.js`), response policy (`http.js`), `POST /api/surveys` (`surveys.js`), Analytics Engine writes.
- `static/` — copied as-is to the deploy root (`_headers`, fonts, icons, blog assets; renew `.well-known/security.txt`'s `Expires` yearly).
- `features/surveys/` — the planned `/surveys/` page's data and scoring; not staged until its frontend ships.
- `docs/horizons/` — the analysis behind the home page's time-horizon figure (its `AGENTS.md`); not staged.
- `tools/` — the build (`stage-assets.mjs`, `build.mjs`, `subset-fonts.mjs`, `tex-to-post.mjs`, `horizon-fit.mjs`, …), deploy helpers, `og/` (social cards), `sims/` (`serve.mjs` serves the sims from the working tree; `check.mjs` screenshots them headless with console errors, overflow and fps).
- `tests/site.test.mjs` — what the build can't check itself; `features/surveys/tests/` — the survey API and scoring.

## Build, test, deploy

```bash
npm install
npm run build                          # stage dist/, then derive content outputs
npm test                               # build, then the tests (node:test)
npm exec -- wrangler deploy --dry-run  # bundle check
./dev.sh                               # build with drafts, then wrangler dev
./deploy.sh                            # production deploy
```

- `tools/stage-assets.mjs` recreates `dist/` from an allowlist, taking each project's **git-tracked** files minus dot-paths, `docs/`, `tests/`, `tools/`, `node_modules/`, `*.test.mjs` and root `AGENTS.md`/`CLAUDE.md`. So a new project file needs `git add` to ship, and every other root-level file in a project (`README.md`, `about.md`) is public.
- `tools/build.mjs` derives everything content-dependent into `dist/` and `.build/` and throws on bad frontmatter, links, tags, EN/JA mismatches and missed project-metadata sync. Generated files live only there; a build leaves `git status` clean. Pandoc, Tectonic and the source fonts bootstrap into `.build/`, pinned and checksum-verified.
- The Worker imports `.build/content.generated.mjs`, so Wrangler needs a completed build. Keep `html_handling: "auto-trailing-slash"`: `drop-trailing-slash` broke project pages in production and doesn't reproduce locally.
- CI (`.github/workflows/ci.yml`) runs `npm test` and the dry run on every push; each sim's repository runs its own suite. A test earns its place only where a failure would be silent: one check per mechanism, nothing that restates the code or snapshots a tuned value.
- Deploys are manual. `./deploy.sh` builds **from the working tree** (uncommitted edits ship), deploys, purges the hostname cache (token: Keychain item `a9l.im-cloudflare-cache-purge`, or `CLOUDFLARE_CACHE_PURGE_TOKEN`) and checks the new `home-data.json` marker is live. That marker doesn't prove pages load: after policy, routing or asset changes, load the live site and check for console errors and 404s.

## Content

- `content/` is the source of truth for root-site copy: `{name}.md` with an optional `{name}.ja.md`. Frontmatter takes scalars and simple `- item` lists; the build validates each kind's fields.
- **Tags** drive `?tag=`. A tag's slug comes from its English label, and Japanese labels match by position, so a `.ja.md` list has the same length and order. Projects carry 2–4 tags from a small vocabulary (subject and language, not rendering tech) so the chips stay one row; reuse a tag before minting a near-synonym.
- **Project docs**: each sim's `about.md` carries `name` (equal to its registry `title`), `title`, `description` and `updated`, plus its about panel's text. The build writes these into the staged `index.html`, the one UI source with `lastUpdated`, and `i18n/strings.js`; project source is never modified. Bump `updated` to date a material change.
- **Horizons** (`content/home/horizons.md`) holds the figure's tables; `tools/horizon-fit.mjs` is the fit's only implementation, so editing a table refits. Check `docs/horizons/AGENTS.md` before changing its inputs.
- **Drafts**: `draft/` shadows `content/` by slug when `DRAFTS=1` (`./dev.sh`); `./deploy.sh` and `npm test` clear it. Everything in it but its README is gitignored. Publishing is moving the file into `content/`.
- **Markdown**: `site/src/markdown.js` serves the client, the Worker's SSR and the feeds, so it stays isomorphic. Its paper dialect has amsthm-style environments (`::: theorem id="thm:x"`; one counter for all numbered kinds, reset per `##`), `[[label]]`/`[[#label]]` references, and `{#id}`/`{.unnumbered}` on headings. Labels are collected in a pre-pass; the math stash, switcher counter and label table belong to the outermost parse, so nested parses must not reset them. KaTeX loads client-side only, from jsDelivr, with the shared macros in `site/src/blog.js`.
- **Papers**: a post with `paper: {name}` takes its body from the `.tex` via `tools/tex-to-post.mjs` (Pandoc) and copies the `.pdf`. To update one, `git submodule update --remote papers/ogdoad`, rebuild, commit the pin. In the converter, `stashMath` hides every `$` span from text rewrites, so a rewrite that touches math runs before it or after `unstashMath`; one placed between silently does nothing.

## Shared layer

Check `shared/` before building UI infrastructure in a project. `tokens.js` runs synchronously before CSS parses and owns the palette, inks and fonts (`_PALETTE`, `_themePalette()`, `_FONT`, `_loadTextFonts()`); each project's `colors.js` extends it. The rest are deferred plain scripts that publish globals on `window`. Their globals, class names (`.colophon*`, `.caption`, `.tab-btn`, `.about-*`, `.sim-dropdown`, …) and data attributes are an API every project uses, so check a change across all of them. `base.css` doesn't style the sims' controls; each sim styles its own.

## Worker and headers

- The Worker SSRs `/sims`, `/projects` and `/blog/*`, redirects `/about`, `/resume` and the renamed sims' old paths, and rejects methods other than GET/HEAD except `POST /api/surveys`. That endpoint takes only same-origin, schema-valid JSON, rate-limits without storing IP or request metadata, and fails closed without D1.
- Security policy lives in `worker/http.js` and in `static/_headers` (which also carries Early Hints, COEP and cache rules, under a 100-rule limit); the test checks they agree. The CSP has no `unsafe-eval`, and KaTeX needs jsDelivr in `script-src`, `style-src` and `font-src`.
- Public URLs aren't content-hashed. Browsers always revalidate; `Cloudflare-CDN-Cache-Control` sets the edge lifetime. The zone cache keeps canonical URLs across deploys, hence the purge. A page loaded seconds after a deploy can pin old files at the edge past the purge: wait a minute after deploying, and if a file is stale, deploy again.

## Design

Editorial and quiet: one serif (Newsreader, with STIX Two and Shippori Mincho for what it lacks), a near-achromatic ground, one red (the accent, which differs per theme), hairline rules for structure. Values live in `shared/tokens.js`, `shared/base.css` and `site/styles.css`.

- Every text role clears 4.5:1 on every surface in both themes, and so does every ink (the eleven data hues). Red is not an ink. Canvas and WebGPU code reads the accent and inks from `_themePalette()` on each theme change.
- No uppercase or letter-spacing, no cards, shadows, radius, gradients, glow, grain, hover transforms or entrance animations. Motion is color and opacity on the shared ease tokens; the home-page figures' tween between views is the one exception, and it holds still under reduced motion.
- Canvas text waits on `_loadTextFonts()` (canvas never triggers a webfont download) and is at least 10px. Readouts use lining tabular figures.
- Projects open straight into the app. A project's title is its name; its description says what a visitor learns or does.
- **Inside a sim's scene**: same paper, different inks. Each sim keeps the neutral ground, Newsreader on the canvas, the colophon (seal and name at top left with play, step, theme, help), a live italic caption under the scene, hairline controls, the keyboard grammar and the about panel, and spends the one red on what you'd point at. Three rules: an effect ships only if it reads a quantity in the model; the sim opens on its best preset, already running (a still frame under reduced motion); state encoded in color is paired with a pattern.
- **Show, don't tell**: the interface names things and reads out values. What a mark means or why the model behaves as it does goes in the about panel or an info tip, never in captions, hints or empty states. Readouts are label–value pairs; nothing on screen repeats another element.

## Social cards

Each card is a painting made as a program (`tools/og/paint/{name}.py` on the bristle-brush engine `brush.py`; each file's docstring says what it shows), with the seal and name set over it in Newsreader by `tools/og/{name}.html`. Every mark reads something in the model, and each card spends its one red where its sim does. `cd tools/og && npm install && npm run generate` paints every card; `node generate.js {name} --repaint` one. After repainting, bump its `?v=` revision: the sim's two image tags, or for the root card `site/index.html`, `worker/index.js`, `static/manifest.json` and `OG_REVISION` in `tools/build.mjs`. **Isochron's card is frozen**: never re-exported or repainted, however the sim changes.

## Root-site details

- `?tag=` is a view, not a route: canonical and `og:url` drop it and the Worker SSRs the unfiltered listing. Every `[data-page]` link's href is its full destination, query included.
- URLs in deployable HTML and JS are absolute, because deep SPA routes break relative paths.
- The home page's only `<h1>` is the visually hidden `a9lim`; the Person JSON-LD id is `https://a9l.im/#person`.

## References and prose

Never take a Wikidata QID, DOI or scholarly URL from memory: check it against its live source, and leave it out if none exists. Personal copy in `content/posts/` and `content/home/` is a9's own prose: contribute facts, structure and review as bullets. Project `about.md` files use a technical-reference register.
