# About a9l.im

a9l.im is a collection of interactive educational simulations built by a9lim. Each project runs entirely in the browser with no server dependencies, accounts, or installation.

## Projects

- **Geon** — Relativistic N-body simulator. Explore gravity, electromagnetism, and exotic forces across 19 curated presets using WebGPU compute shaders.
- **Cyano** — Cellular metabolism simulator. Trace energy through glycolysis, the Krebs cycle, electron transport, photosynthesis, and eight more pathways with allosteric regulation.
- **Gerry** — Gerrymandering sandbox. Draw districts on a procedural hex map, run Monte Carlo elections, and measure fairness with efficiency gap, partisan symmetry, and four other metrics.
- **Shoals** — Options trading simulator. Price American options with Heston stochastic volatility, build multi-leg strategies, and stress-test portfolios against 400+ narrative market events.
- **Scripture** — Sacred text reader. Read and compare sixteen works including the Bible (KJV), Quran (Pickthall), Book of Mormon, Tao Te Ching, Kojiki, and more with full-text search and concordance.

## Technical Approach

All simulations use vanilla JavaScript with no frameworks. Shared design system (`shared-*.js`, `shared-base.css`) provides consistent UI across projects. Hosted on Cloudflare Pages with a Worker for SPA routing, SSR, and security headers.

## Contact

mx@a9l.im | [GitHub](https://github.com/a9lim) | [Twitter](https://twitter.com/_a9lim)

## License

All projects are licensed under AGPL-3.0.
