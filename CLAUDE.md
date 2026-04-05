# CLAUDE.md

Root site for the **a9l.im** portfolio. Hosted via GitHub Pages with custom domain `a9l.im` (configured in `CNAME`). Also hosts the shared design system consumed by all five submodules (`geon`, `shoals`, `gerry`, `cyano`, `scripture`).

## Design Philosophy

Flat, lineless, modern. Every surface is differentiated by **background color**, never borders. Shadows appear **only on hover/active/focus** — nothing has a resting-state shadow. Elevation is earned through interaction, not decoration.

- **No borders** on panels, buttons, inputs, tabs, cards, separators, or toggles. Use `border: none` everywhere. The only exception is `outline` on `:focus-visible` for accessibility.
- **No resting shadows** — `box-shadow: none` at rest. Hover states may use `var(--shadow-sm)` or `var(--shadow-md)`.
- **Background differentiation** — use `--bg-hover`, `--bg-elevated`, `--accent-subtle` to distinguish nested surfaces, not lines.
- **Subtle animations** — hover lifts are small (`translateY(-2px)` to `-4px`), no scale transforms on cards. Transitions use `var(--ease-out)` or `var(--ease-spring)`.
- `.glass` uses `bg-panel` (semi-transparent) with `backdrop-filter: blur(20px) saturate(1.5)` for true glassmorphism. No shimmer inset.
- Shadow tokens (`--shadow-sm` etc.) contain no `0 0 0 1px` spread rings.

## Shared Code Policy

All projects share a common design system at this repo's root. **Always prefer shared code over project-specific implementations.** Check `shared-*.js` before adding utility code to a project.

Key shared modules:
- `shared-tokens.js` — `_PALETTE`, `_FONT`, color math. Extend via `colors.js`, never hardcode colors
- `shared-utils.js` — `escapeHtml`, `debounce`, `throttle`, `clamp`, `lerp`, `showToast`, `trapFocus`, `resizeCanvasDPR`, `animateValue`, `initOverlayDismiss`
- `shared-base.css` — reset, layout tokens, `.glass`, `.tool-btn`, `.ctrl-row`, `.sim-overlay`, toasts, a11y
- `shared-toolbar.js` — `_toolbar` (theme toggle, sidebar, play/pause, speed)
- `shared-forms.js` — `_forms` (mode groups, sliders, toggles)
- `shared-icons.js` — unified SVG icon library. Exposes `_ICON` global, renders icons via `data-icon` attribute
- `shared-tabs.js`, `shared-camera.js`, `shared-info.js`, `shared-shortcuts.js`, `shared-about.js`, `shared-touch.js`, `shared-tooltip.js`, `shared-sparkline.js`, `shared-haptics.js`

## Running Locally

```bash
cd path/to/a9lim.github.io && python -m http.server
```

Root site uses relative paths for shared files; sub-projects use absolute paths (`/shared-*.js`).

## Overview

Single-page portfolio site. Hash-based SPA router (`#home`, `#projects`, `#blog`, `#about`). WebGL simplex noise shader background, project carousel, blog with markdown rendering, SVG world map with animated arc.

## Architecture

- `main.js` creates `$` DOM cache, passed to all init functions. Modules never call `getElementById` for shared elements.
- `src/projects.js` exports `PROJECTS` array — single source of truth for carousel and projects page.
- `shared-tokens.js` and `shared-utils.js` are plain `<script>` tags exposing globals on `window`. ES6 modules access these directly. Converting them to modules would break all consumers.

## Image Generation

```bash
node og/generate.js      # OG images (1200×630) → each project's og-image.png
node cards/generate.js   # Card images (1920×1200) → img/{project}.png
```

Both require Puppeteer (installed in `og/`). Source HTML in `og/` and `cards/` respectively — self-contained pages with hardcoded colors, no shared imports. Each `index.html` references its `og-image.png` via `<meta property="og:image">` with absolute `https://a9l.im/` URLs. Card images are referenced by `src/projects.js` for the carousel and projects page.

## Gotchas

### Do Not Break

- **`CNAME` file** — deleting removes the `a9l.im` custom domain
- **All `shared-*.js` and `shared-base.css` files** — consumed by all projects. Changing public APIs or class names (`.tab-btn`, `.tab-panel`, `data-tab`, `.glass`, `.tool-btn`, `.about-*`) breaks all sims
- `_toolbar`, `_forms`, `initAboutPanel(config)` — changing these APIs breaks all consumers

### Shader Is On-Demand

Not a continuous loop. Renders on scroll/resize/theme-change, auto-stops after 1s of inactivity. New scroll-reactive elements need `requestRender()` or a scroll/resize event dispatch.

### Carousel

- `.carousel-track` must NOT have `overflow: hidden` — it would move the clipping boundary with `translateX`
- Mobile (<=900px) sets `transform: none !important` and enables native scroll-snap

### Specificity

- `.fade-in.visible` (0,2,0) beats `.project-card:hover` (0,1,1). Hover selectors must include `.visible` (e.g., `.my-element.visible:hover`)

### Sidebar Pattern

All project sidebars now use `.sidebar-tabs` inside `.stats-header` instead of a `<h2 class="stats-title">` with a separate `.tab-bar`. New sidebars should follow this pattern.

### Other

- `.hero-tagline em` needs `padding-right: 0.05em` to prevent italic glyph clipping
- `data-theme` is on `<html>` — the shader's MutationObserver watches `document.documentElement`
- `.tog-wrap input` uses `clip: rect(0,0,0,0)` for a11y — do not change to `display: none`
- The sole `<h1>` is the hero tagline — navbar brand is a `<span>` for heading hierarchy
- Blog fetches `posts.json` and `posts/{slug}.md` via relative URLs — breaks if served from a subdirectory
