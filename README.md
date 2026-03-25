# a9l.im

Personal portfolio site at **[a9l.im](https://a9l.im)**. Showcases interactive simulations and open-source projects across physics, biology, and political science.

Hosted on GitHub Pages with a custom domain. Multi-page SPA with a hash router handling Home, Projects, Blog, and About pages. A WebGL shader renders an animated noise background with drifting accent splotches that respond to scrolling and theme changes.

## Live

**[a9l.im](https://a9l.im)**

## Tech

- **Zero-dependency vanilla JS/HTML/CSS** -- no frameworks, no build step, no npm
- ES6 modules (`import`/`export`) loaded via `<script type="module">`
- WebGL shader background (simplex noise, on-demand rendering)
- Markdown-based blog (fetches `.md` files at runtime with a built-in parser)
- GitHub Pages with custom domain (`CNAME` -> `a9l.im`)

## Run Locally

```bash
python -m http.server
# or
npx serve .
# then open http://localhost:8000
```

No install, no build. Every file is served as-is.

## Project Structure

```
main.js                  Entry point -- imports all modules, sets up DOM cache
src/
  projects.js            PROJECTS data array (shared by carousel + projects page)
  projects-page.js       Renders project card grid from PROJECTS
  carousel.js            Paginated carousel with dots, wheel/touch nav, 3D tilt
  card-effects.js        3D tilt + shimmer hover effects for cards
  router.js              Hash-based SPA router (#home, #projects, #blog, #about)
  theme.js               Light/dark toggle via data-theme on <html>, localStorage
  mobile-menu.js         Hamburger menu toggle for mobile nav overlay
  animations.js          Fade-in triggers, navbar scroll shadow, scroll-reveal observer, stripe band
  shader.js              WebGL init, GLSL noise shader, on-demand render loop
  blog.js                Blog listing + post view, loading skeletons, markdown fetch
  markdown.js            Lightweight markdown-to-HTML parser (headings, lists, code, inline)
  world-map.js           SVG world map on About page with city dots and animated arc

index.html               Single HTML file with all four page sections
styles.css               All project-specific CSS (nav, hero, carousel, blog, about, responsive)
shared-tokens.js         Shared design tokens (see below)
shared-utils.js          Shared utility functions
shared-base.css          Shared CSS reset, layout tokens, glass panels, responsive
shared-camera.js         Shared camera/viewport module (used by sim projects, not this site)
shared-info.js           Shared info tip popover system (used by sim projects)
shared-shortcuts.js      Shared keyboard shortcut registry (used by sim projects)
shared-touch.js          Shared swipe-to-dismiss for bottom sheets (used by sim projects)
```

## Shared Design System

This repository hosts seven shared files consumed by three sibling simulation projects via absolute paths (`/shared-tokens.js`, `/shared-base.css`, etc.):

| File | Purpose |
|------|---------|
| `shared-tokens.js` | `_PALETTE`, `_FONT`, color math helpers, CSS custom property injection |
| `shared-utils.js` | `clamp`, `lerp`, `debounce`, `throttle`, `showToast`, `escapeHtml`, `cubicBezier` |
| `shared-base.css` | CSS reset, layout tokens, `.glass` panels, `.tool-btn`, toggles, toasts, accessibility, responsive breakpoints |
| `shared-camera.js` | Viewport/camera with zoom/pan, coordinate transforms, Canvas 2D + SVG integration |
| `shared-info.js` | Info tip popovers (hover on desktop, tap on mobile), optional KaTeX math rendering |
| `shared-shortcuts.js` | Keyboard shortcut registry with `?` help overlay |
| `shared-touch.js` | Swipe-to-dismiss for mobile bottom-sheet panels |

Changes to these files affect all projects. See the parent [site-meta](https://github.com/a9lim/site-meta) repo for the full design system specification.

## Sibling Projects

| Project | URL | Description |
|---------|-----|-------------|
| [Geon](https://github.com/a9lim/geon) | [a9l.im/geon](https://a9l.im/geon) | Relativistic N-body simulation with scalar fields and radiation |
| [Cyano](https://github.com/a9lim/cyano) | [a9l.im/cyano](https://a9l.im/cyano) | Interactive cellular metabolism with 10 pathways and allosteric regulation |
| [Gerry](https://github.com/a9lim/gerry) | [a9l.im/gerry](https://a9l.im/gerry) | Gerrymandering simulator on a procedural hex-tile map |
| [Shoals](https://github.com/a9lim/shoals) | [a9l.im/shoals](https://a9l.im/shoals) | Options trading simulator with stochastic volatility and strategy builder |

## License

[AGPL-3.0](LICENSE)
