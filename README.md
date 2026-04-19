# a9l.im

Portfolio and project hub at **[a9l.im](https://a9l.im)**. A single-page app with a WebGL shader background, project carousel, markdown blog, and about page. Vanilla JS, HTML, and CSS served as-is, with no build step and no dependencies.

## Projects

Five interactive projects live on the site as submodules, plus a few external repos.

| Project | Description |
|---------|-------------|
| [Geon](https://a9l.im/geon) | Relativistic N-body simulator with scalar fields and WebGPU compute shaders |
| [Cyano](https://a9l.im/cyano) | Cellular metabolism simulator with twelve biochemical pathways |
| [Gerry](https://a9l.im/gerry) | Gerrymandering sandbox with Monte Carlo elections and fairness metrics |
| [Shoals](https://a9l.im/shoals) | Options trading simulator with stochastic volatility and a strategy builder |
| [Scripture](https://a9l.im/scripture) | Sacred text reader with sixteen works, full-text search, concordance, and text-to-speech |

## Shared Design System

This repo hosts a shared design system that all the subprojects consume via absolute paths (`/shared-tokens.js`, `/shared-base.css`, and so on). It includes design tokens, a CSS reset, utility functions, toolbar and form components, keyboard shortcuts, camera controls, tooltips, tabs, and touch gestures. Anything I change here affects every project.

## Run Locally

```bash
python -m http.server
# open http://localhost:8000
```

## License

[AGPL-3.0](LICENSE)
