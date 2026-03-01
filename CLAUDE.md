# CLAUDE.md

Part of the **a9l.im** portfolio. This is the root site — it hosts the shared design system files consumed by all sub-projects. See parent `site-meta/CLAUDE.md` for the full shared design system specification.

## Overview

Portfolio site for **a9l.im**, hosted via GitHub Pages at `a9lim.github.io`. Custom domain configured via `CNAME` file. Multi-page SPA with landing, projects, blog, and about/contact pages.

| Sibling Project | Repo | Path |
|----------------|------|------|
| Relativistic N-Body Sim | `a9lim/physsim` | `/physsim` |
| Cellular Metabolism Sim | `a9lim/biosim` | `/biosim` |
| Gerrymandering Simulator | `a9lim/gerry` | `/gerry` |

## Running Locally

```bash
python -m http.server
# Navigate to http://localhost:8000
```

No build step, no dependencies. Static files served directly via GitHub Pages.

## Architecture

Traditional page layout (not floating panels over canvas like the simulation sub-projects). WebGL shader background provides animated noise texture. ES6 modules loaded via `<script type="module" src="main.js">`.

```
main.js (entry point)
  ├── src/projects.js     — PROJECTS data array (single source of truth for carousel + projects page)
  ├── src/projects-page.js— renderProjectCards() — generates project grid from PROJECTS
  ├── src/router.js       — parseHash, navigateTo, onHashChange
  ├── src/theme.js        — theme toggle + localStorage
  ├── src/mobile-menu.js  — menu toggle
  ├── src/animations.js   — scroll reveals, fade-ins, stripe band, getScrollNorm()
  ├── src/shader.js       — WebGL init, GLSL source, render loop, visibility pause
  ├── src/carousel.js     — renderCarouselCards() + pagination, dots, wheel, touch, 3D tilt
  ├── src/blog.js         — listing/post rendering, caches, formatDate, escapeHtml
  ├── src/world-map.js    — SVG load, projection, arc animation
  └── src/markdown.js     — markdown parser (imported by blog.js)
```

### Deployment

- GitHub Pages repo (`a9lim.github.io` → serves as root of `a9l.im`)
- Custom domain: `a9l.im` (set in `CNAME` file — do not delete)
- Sub-projects are separate repos deployed as GitHub Pages project sites (e.g. `a9l.im/physsim`)

### Shared Files (hosted here, consumed by all projects)

This repo hosts two shared files that all sub-projects load:

- **`shared-tokens.js`**: Color math helpers (`_r`, `_parseHex`, `_rgb2hsl`, `_hsl2hex`, `_darken`), `_FONT`, `_PALETTE` with shared design tokens (surfaces, text, accent, shadows, `extended` sub-object with 10 cross-project colors). Sub-projects load via `<script src="/shared-tokens.js">` then extend with project-specific keys in their own `colors.js`.
- **`shared-base.css`**: Reset, layout tokens, body base, `.glass`, `.tool-btn` (34×34 sim-style), shared keyframes, intro screen, sidebar stat patterns, tab system, control group/row, slider value, preset dialog, shared responsive blocks (900px/600px/440px), form controls, `prefers-reduced-motion`. Sub-projects load via `<link href="/shared-base.css">`.

**Do not break these files** — all four projects depend on them.

## Color System

This site's `colors.js` is minimal — it does not add project-specific palette colors. The root site uses only the shared tokens from `shared-tokens.js` (surfaces, text, accent, shadows).

## UI & Layout

- **Traditional page layout** — uses `page-container` / `page-section` pattern, not floating panels over a canvas
- **No intro screen** — root site uses a hero section with scroll hint instead
- **WebGL shader background**: `#shader-bg` canvas provides animated noise texture with scroll-reactive splotchy accent effects. Opacity: 0.6 light, 0.5 dark. Shader has `u_scroll` uniform that offsets noise layers as user scrolls, plus two splotch layers (`smoothstep` thresholds) that create drifting red accent spots.
- **Scroll-triggered reveals**: Two systems coexist — `.fade-in` + `.visible` (CSS-driven, staggered `transition-delay` via `:nth-child`) for page content, and `.scroll-reveal` + `.visible` (JS `IntersectionObserver`, threshold 0.15) for carousel cards and section labels.
- **Accent stripe**: `.stripe-section` between hero and carousel. Flat red rectangular band (`.stripe-band`) slides in from left on scroll via JS `requestAnimationFrame` transform. Rotated -3deg.
- **Project data**: `src/projects.js` exports a `PROJECTS` array — the single source of truth for both the carousel and projects page. Each entry has `href`, `title`, `shortDesc` (carousel), `longDesc` (projects page), `tags`, `image`, `icon` (SVG string), and `external` (boolean). `main.js` calls `renderCarouselCards()` and `renderProjectCards()` to populate empty `.carousel-track` and `.projects-grid` containers before the init chain runs.
- **Project carousel** (home page): Paginated 3-cards-per-page system with pill dots. Cards rendered dynamically from `PROJECTS` via `renderCarouselCards()` in `src/carousel.js`. Desktop: JS-driven `translateX` on `.carousel-track` inside `.carousel-viewport` (overflow wrapper). Wheel scroll advances pages (600ms debounce). Touch swipe with 1:1 drag. 3D tilt on hover (`perspective(800px) rotateX/Y`, max ~12deg from cursor position). Shimmer highlight via `--mouse-x`/`--mouse-y` CSS vars. Mobile ≤900px: reverts to native `overflow-x: auto` + `scroll-snap-type: x mandatory`. Cards eagerly loaded (lazy loading fails inside `overflow: hidden`).
- **Projects page grid**: Cards rendered dynamically from `PROJECTS` via `renderProjectCards()` in `src/projects-page.js`. Each card has an SVG icon, arrow, title, long description, and tags. Uses `.project-card.glass.fade-in` classes for styling and stagger animation.
- **Inspirational quote**: Centered blockquote between carousel and projects page.
- **World map** (about page): SVG world map in `.map-section` with brown fill (`#9C6840` from `extended.brown`). Two city dots (Singapore, San Diego) connected by a red accent arc. Top/bottom CSS mask fades (`map-fade-top`, `map-fade-bottom`) blend into canvas color.
- **Project screenshots**: `img/` directory contains PNG/WebP screenshots for carousel cards (physsim.png, biosim.png, gerry.png, raiko.png, faithful.png, catppuccin.webp).
- **Blog**: Renders markdown from fetched `.md` files. Blog content typography in `.blog-content` styles.

### Root Site Overrides (styles.css)

- **`--toolbar-h: 56px`** (shared default is 52px) — taller navbar for the portfolio site
- **`.tool-btn`**: overridden to 36×36, `inline-flex`, `border: none`, `color: var(--text-secondary)` (shared base is 34×34 sim-style)
- **`.section-label`**: uses `var(--font-mono)` (not body font) for uppercase section headers
- **`.scroll-hint`**: also uses `var(--font-mono)`
- **Project card hover**: `.project-card.visible:hover` selector needed for specificity over `.fade-in.visible` transform — lifts card `translateY(-6px) scale(1.03)` with `box-shadow: var(--shadow-lg)`
- **Carousel card hover**: whole card lifts (`translateY(-6px) scale(1.03)`), not just inner image

## Key Patterns

- **Theme toggle**: Light/dark via `data-theme` on `<html>`. `<html data-theme="light">` in markup.
- **`.glass`** (from shared-base.css): applied to `#navbar`.
- **No hardcoded colors in CSS** — all via `var(--*)`.
- **Fonts via `<link>` tags** in HTML, not `@import` in CSS.

## Gotchas

- **Do not delete `CNAME`** — it configures the `a9l.im` custom domain.
- **Shared files are critical** — `shared-tokens.js` and `shared-base.css` are loaded by all four projects. Breaking changes here break everything.
- **Root site uses relative paths** for shared files (`shared-base.css`, `shared-tokens.js`) — sub-projects use absolute paths (`/shared-base.css`, `/shared-tokens.js`).
- **Carousel viewport/track architecture**: `.carousel-viewport` has `overflow: hidden`, `.carousel-track` must NOT have `overflow: hidden` — otherwise `translateX` moves the clipping boundary with the track and hides later pages.
- **Lazy loading fails in overflow:hidden**: Images inside the carousel must use `loading="eager"` (or omit the attribute). The JS also force-sets `img.loading = 'eager'` as a fallback.
- **`.fade-in.visible` specificity**: Has specificity 0,2,0 which overrides `.project-card:hover` (0,1,1). The `.project-card.visible:hover` selector exists specifically to win this specificity battle. The `.fade-in.visible` transition also includes `transform` and `box-shadow` for hover animation compatibility.
- **Hero title `white-space: nowrap`**: Title and quote are forced single-line. The italic `<em>` in `.hero-tagline` has `padding-right: 0.05em` to prevent the italic "e" glyph from clipping.
