# a9l.im

Portfolio and project hub at **[a9l.im](https://a9l.im)**. The root site, eight browser projects, shared design system, Worker backend, and content pipeline live in one repository without mixing deploy artifacts into the source tree.

## Repository map

```text
site/                  root SPA shell and browser modules
content/               canonical copy, project registry, posts, and resume source
shared/                design-system CSS and browser globals
projects/              eight git submodules (published at their original URL roots)
worker/                Cloudflare Worker router, SSR, API, headers, and analytics
static/                copied-as-is public assets and _headers
features/surveys/      private survey data/scoring foundation (not static assets)
db/migrations/         D1 migrations
lib/wgsl/              dormant WGSL-to-JavaScript tooling
tools/                 build, staging, and OG-image tools
tests/                 build-layout, content, and WGSL checks
dist/                  ignored deploy tree
.build/                ignored Worker/build intermediates
```

Physical source paths do not change public routes: `projects/geon/` still deploys at `/geon/`, for example. Shared modules live at `/shared/{name}.js` and `/shared/base.css`; the build also emits the former `/shared-*.js` and `/shared/base.css` URLs as temporary compatibility aliases.

## Content

Visitor-facing root-site copy is canonical in `content/`. Each simulation's long-form documentation and SEO summary is canonical in `projects/{name}/about.md`. `tools/build.mjs` derives the homepage regions, project registry, feeds, sitemaps, discovery files, Worker metadata, and resume into `dist/`; generated outputs are not committed.

## Build and run

```bash
npm install
npm run build           # recreate dist/ and .build/ from source
npm test                # build, deterministic check, layout checks, API/scoring tests
./dev.sh                 # build, then run the pinned Wrangler dev server
```

For a static-only preview after building:

```bash
python -m http.server --directory dist 8000
```

`./deploy.sh` runs a fresh build and deploys with the pinned Wrangler version. A normal build must leave `git status` clean.
Linux builders bootstrap pinned, checksum-verified Pandoc and Tectonic binaries into the ignored `.build/` cache when those tools are not already installed.

## Projects

<!-- content:sim-table generated into dist/README.md by tools/build.mjs; edit content/projects/ and projects/{sim}/about.md -->
| Project | Description |
|---------|-------------|
| [Geon](https://a9l.im/geon) | Explore relativistic many-body dynamics, electromagnetism, compact objects, scalar fields, and nontrivial topologies across fifteen browser presets. |
| [Cyano](https://a9l.im/cyano) | Trace connected carbon metabolism, electron transport, conserved cofactor pools, enzyme feedback, and reactive oxygen species across five stylized cell presets. |
| [Gerry](https://a9l.im/gerry) | Draw districts on a procedural hex map, compare six fairness measures, generate pack-and-crack or neutral plans, and stress-test Monte Carlo elections. |
| [Shoals](https://a9l.im/shoals) | Trade stock, bonds, VXHCN volatility futures, American options, and AI-milestone binaries through the last years of the race — stochastic pricing, a hidden capability model, and six ways it ends. |
| [Scripture](https://a9l.im/scripture/) | Read, search, annotate, compare, and listen to sixteen sacred works with chapter and verse deep links, concordance, and related passages. |
| [Miasma](https://a9l.im/miasma) | Seed and contain stochastic multi-strain epidemics on six hex-grid topologies with vaccination, quarantine, reservoirs, mutation, and painted interventions. |
| [Pile](https://a9l.im/pile) | Operate PWR, RBMK-1000, and molten-salt reactor models with axial kinetics, xenon, plant systems, faults, procedures, and guided scenarios. |
| [Plasma](https://a9l.im/plasma) | Explore shocks, reconnection, waves, transport, radiation, self-gravity, and cylindrical flows in a WebGPU 2.5D magnetohydrodynamics laboratory. |
<!-- /content:sim-table -->

## License

[AGPL-3.0](LICENSE)
