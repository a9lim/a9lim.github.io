# a9l.im

Source for **[a9l.im](https://a9l.im)**: a personal site with a blog, a project index, and four interactive browser simulations. The root site, the shared design system, the content pipeline, and the Cloudflare Worker live here; each project is its own repository, mounted as a git submodule.

## Repository map

```text
site/              root SPA shell and browser modules
content/           posts, project registry, homepage copy, résumé source
shared/            design-system CSS and browser globals used by every project
projects/          project submodules, served at /{name}/
papers/ogdoad/     LaTeX writeups that paper posts are generated from
worker/            Cloudflare Worker: routing, SSR, headers, survey API
static/            public assets copied as-is, including _headers
features/surveys/  survey data and scoring (no frontend yet; not deployed)
db/migrations/     D1 migrations
lib/wgsl/          WGSL-to-JavaScript transpiler (not wired into the site)
tools/             build, staging, font subsetting, paper conversion, OG images
tests/             content, deploy-layout, and transpiler tests
```

`dist/` (the deploy tree) and `.build/` (Worker data and tool caches) are generated and ignored.

## Building

Node 22 or newer. Clone with submodules (`git clone --recurse-submodules`, or `git submodule update --init` afterwards).

```bash
npm install
npm run build      # recreate dist/ and .build/ from source
npm test           # build, deterministic check, content/layout checks, survey tests
./dev.sh           # build, then run the pinned Wrangler dev server
```

For a static preview without the Worker, serve `dist/`:

```bash
python3 -m http.server --directory dist 8000
```

Pandoc, Tectonic, and the fallback fonts download into `.build/` (pinned and checksum-verified) when they aren't installed locally. Root-site copy lives in `content/`. Each project's long-form documentation and SEO summary lives in its `about.md`, and the build derives the homepage, project grid, feeds, sitemaps, discovery files, and résumé from these. A build leaves the working tree unchanged.

Deployment is manual through `./deploy.sh`. It builds, deploys with the pinned Wrangler, purges the hostname cache, and confirms the new build marker is live.

## Projects

<!-- content:sim-table generated into dist/README.md by tools/build.mjs; edit content/projects/ and projects/{sim}/about.md -->
| Project | Description |
|---------|-------------|
| [Geon](https://a9l.im/geon) | Explore relativistic many-body dynamics, electromagnetism, compact objects, scalar fields, and nontrivial topologies across fifteen browser presets. |
| [Cyano](https://a9l.im/cyano) | Trace connected carbon metabolism, electron transport, conserved cofactor pools, enzyme feedback, and reactive oxygen species across five stylized cell presets. |
| [Shoals](https://a9l.im/shoals) | Trade stock, bonds, VXHCN volatility futures, American options, and AI-milestone binaries through the last years of the race — stochastic pricing, a hidden capability model, and six ways it ends. |
| [Miasma](https://a9l.im/miasma) | Seed and contain stochastic multi-strain epidemics on six hex-grid topologies with vaccination, quarantine, reservoirs, mutation, and painted interventions. |
<!-- /content:sim-table -->

## License

[AGPL-3.0](LICENSE)
