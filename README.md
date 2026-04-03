# a9l.im

Portfolio and project hub at **[a9l.im](https://a9l.im)**. A single-page app with a WebGL shader background, project carousel, markdown blog, and about page. Zero dependencies, no build step -- vanilla JS/HTML/CSS served as-is.

## Projects

Five interactive projects live on the site as submodules, plus several external repos:

| Project | Description |
|---------|-------------|
| [Geon](https://a9l.im/geon) | Relativistic N-body simulator with scalar fields and WebGPU compute shaders |
| [Cyano](https://a9l.im/cyano) | Cellular metabolism simulator with ten biochemical pathways |
| [Gerry](https://a9l.im/gerry) | Gerrymandering sandbox with Monte Carlo elections and fairness metrics |
| [Shoals](https://a9l.im/shoals) | Options trading simulator with stochastic volatility and strategy builder |
| [Scripture](https://a9l.im/scripture) | Sacred text reader with twelve works, full-text search, and verse-linked notes |

## Shared Design System

This repo hosts a shared design system consumed by all subprojects via absolute paths (`/shared-tokens.js`, `/shared-base.css`, etc.). Includes design tokens, CSS reset, utility functions, toolbar/form components, keyboard shortcuts, camera controls, tooltips, tabs, and touch gestures. Changes here affect every project.

## Run Locally

```bash
python -m http.server
# open http://localhost:8000
```

## License

[AGPL-3.0](LICENSE)
