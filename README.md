# a9l.im

Portfolio site and shared design system host for the **[a9l.im](https://a9l.im)** project family.

Hosted via GitHub Pages with custom domain. Multi-page site with landing, projects, blog, and about/contact pages. WebGL shader background provides animated noise texture.

## Projects

| Project | Path | Description |
|---------|------|-------------|
| [Relativistic N-Body](https://github.com/a9lim/physsim) | [/physsim](https://a9l.im/physsim) | Barnes-Hut physics simulation |
| [Cellular Metabolism](https://github.com/a9lim/biosim) | [/biosim](https://a9l.im/biosim) | Interactive metabolic pathway visualization |
| [Redistricting Sim](https://github.com/a9lim/gerry) | [/gerry](https://a9l.im/gerry) | Gerrymandering simulator on a hex-tile map |

## Shared Design System

This repo hosts two files consumed by all sub-projects:

- **`shared-tokens.js`** — `_PALETTE` (surfaces, text, accent, extended cross-project colors), `_FONT`, color math helpers (`_r`, `_darken`, HSL conversion), CSS custom property injection
- **`shared-base.css`** — Reset, layout tokens, `.glass` panels, `.tool-btn`, intro screen, keyframes, sidebar stats, tab system, control groups, slider values, preset dialog, form controls, shared responsive breakpoints (900/600/440px), `prefers-reduced-motion`

Sub-projects load these via absolute paths (`/shared-tokens.js`, `/shared-base.css`) and extend with project-specific tokens in their own `colors.js`.

## Running Locally

```bash
python -m http.server
# Navigate to http://localhost:8000
```

No build step, no dependencies. Static files served directly.

## Tech Stack

- Vanilla HTML/CSS/JS — zero dependencies
- WebGL shader background
- Markdown-based blog (fetches `.md` files at runtime)
- GitHub Pages with custom domain (`CNAME` → `a9l.im`)

## License

[AGPL-3.0](LICENSE)
