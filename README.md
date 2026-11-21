# a9l.im

Source for **[a9l.im](https://a9l.im)**: a personal site with a blog, a project index, and five interactive browser simulations. The root site, the shared design system, the content pipeline, and the Cloudflare Worker live here; each project is its own repository, mounted as a git submodule.

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
tools/             build, staging, font subsetting, paper conversion, OG images
tests/             checks the build can't make itself
```

`dist/` (the deploy tree) and `.build/` (Worker data and tool caches) are generated and ignored.

## Building

Node 22 or newer. Clone with submodules (`git clone --recurse-submodules`, or `git submodule update --init` afterwards).

```bash
npm install
npm run build      # recreate dist/ and .build/ from source
npm test           # build, then the site and survey tests
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
| [Worldline](https://a9l.im/worldline) | Explore relativistic many-body dynamics, electromagnetism, light and scalar fields in nine curated figures, and tilt the plane into spacetime to see the world lines they trace. |
| [Lumen](https://a9l.im/lumen) | Pulse the enzymes of a kinetic model of cellular energy metabolism (glycolysis, the Krebs and Calvin cycles, electron transport, ATP synthase) and watch flux, cofactor pools and the proton gradient answer, in five organisms. |
| [Shoals](https://a9l.im/shoals) | Trade stock, bonds, VXHCN volatility futures, American options, and AI-milestone binaries through the last years of the race — stochastic pricing, a hidden capability model, and six ways it ends. |
| [Miasma](https://a9l.im/miasma) | Run six spatial epidemic experiments, from the outbreak threshold and herd immunity to antigenic drift and spillover, on four glued hex-grid surfaces drawn as an epidemiological atlas, and paint your own interventions. |
| [Isochron](https://a9l.im/isochron) | Run an Earth-like planet from plate tectonics to weather on one globe: seafloor that spreads and sinks, rivers that wear down mountains, ice ages paced by the orbit, a carbon thermostat, ocean gyres, tides that slow its spin, and weather fronts. Or set people on it, from the first of them through farming and industry to the machines that outgrow them. |
<!-- /content:sim-table -->

## License

[AGPL-3.0](LICENSE)
