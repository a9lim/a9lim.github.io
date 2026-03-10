# CLAUDE.md

Root site for the **a9l.im** portfolio. Hosted via GitHub Pages at `a9lim.github.io` with custom domain `a9l.im` (configured in `CNAME`). This repo also hosts the shared design system files consumed by all sibling projects. See the parent `site-meta/CLAUDE.md` for the full shared design system specification.

## File Map

```
index.html               Single HTML file; all four page <section>s live here
main.js                  Entry point (ES6 module); imports everything, owns DOM cache $
styles.css               All project-specific CSS (1400 lines)
CNAME                    Custom domain: a9l.im — DO NOT DELETE
favicon.ico              Site favicon
logo.svg                 Navbar logo SVG
world-map.svg            SVG world map (About page)
posts.json               Blog post index (array of {slug, title, date, tag})
posts/                   Blog markdown files (fetched at runtime)
img/                     Project screenshots for carousel cards (PNG/WebP)
docs/plans/              Design documents (not served)

src/
  router.js              Hash-based SPA router
  theme.js               Light/dark toggle (data-theme on <html>, localStorage)
  mobile-menu.js         Hamburger menu toggle
  animations.js          Fade-in triggers, scroll reveal, navbar shadow, stripe band, getScrollNorm()
  shader.js              WebGL simplex noise shader with on-demand rendering
  projects.js            PROJECTS data array — single source of truth for carousel + projects page
  projects-page.js       renderProjectCards() — generates project grid from PROJECTS
  carousel.js            renderCarouselCards() + pagination, dots, wheel/touch nav
  card-effects.js        initCardTilt() — 3D perspective tilt + shimmer hover
  blog.js                Blog listing/post rendering, loading skeletons, fetch caching
  markdown.js            Lightweight markdown-to-HTML parser (imported by blog.js)
  world-map.js           SVG map loader, Mercator projection, arc draw animation

Shared files (hosted here, loaded by all 4 projects):
  shared-tokens.js       _PALETTE, _FONT, color math, CSS custom property injection
  shared-utils.js        escapeHtml, debounce, throttle, clamp, lerp, cubicBezier, showToast
  shared-base.css        Reset, layout tokens, .glass, .tool-btn, ctrl-row/group, form controls,
                         .sim-select, .sim-overlay, .ghost-btn, theme icons, toggles, toasts, a11y
  shared-tabs.js         Tab switching IIFE for sidebar .tab-btn/.tab-panel (sim projects only)
  shared-camera.js       Camera/viewport module (sim projects only, not used here)
  shared-info.js         Info tip popovers (sim projects only)
  shared-shortcuts.js    Keyboard shortcut registry (sim projects only)
  shared-touch.js        Swipe-to-dismiss for bottom sheets (sim projects only)
```

## Module Dependency Graph

```
main.js
  ├─ src/router.js           (imports nothing)
  ├─ src/theme.js            (imports nothing)
  ├─ src/mobile-menu.js      (imports nothing)
  ├─ src/animations.js       (imports nothing)
  ├─ src/shader.js           ← imports getTheme from theme.js
  │                          ← imports getScrollNorm from animations.js
  ├─ src/projects.js         (imports nothing; exports PROJECTS array)
  ├─ src/projects-page.js    (imports nothing; uses global escapeHtml from shared-utils.js)
  ├─ src/carousel.js         ← imports initCardTilt from card-effects.js
  │                          (uses global escapeHtml from shared-utils.js)
  ├─ src/card-effects.js     (imports nothing)
  ├─ src/blog.js             ← imports parseMarkdown from markdown.js
  │                          ← imports triggerFadeIns from animations.js
  │                          (uses global escapeHtml from shared-utils.js)
  ├─ src/world-map.js        (imports nothing)
  └─ src/markdown.js         (imports nothing)

Global scripts (loaded via <script> in <head>, not modules):
  shared-tokens.js → exposes window._PALETTE, _FONT, _r, _parseHex, _rgb2hsl, _hsl2hex, _darken
  shared-utils.js  → exposes window.escapeHtml, debounce, throttle, clamp, lerp, cubicBezier, showToast
```

## Key Patterns

### DOM Cache `$`

`main.js` creates a `$` object caching all frequently accessed DOM elements by ID. This is passed to `initTheme($)`, `initMobileMenu($)`, `initRouter(deps)`, `initShader($)`, and the blog functions. Modules never call `document.getElementById` themselves for shared elements.

### PROJECTS Data Array

`src/projects.js` exports a single `PROJECTS` array. Each entry has `href`, `title`, `shortDesc`, `longDesc`, `tags`, `image`, `icon` (inline SVG string), and `external` (boolean). Both `renderCarouselCards()` and `renderProjectCards()` consume this array to generate their respective DOM. Any project change happens in one place.

### Hash Router

`src/router.js` implements a hash-based SPA. Pages are `#home`, `#projects`, `#blog`, `#about`. Blog posts use `#blog/{slug}`. The router:
1. Hides all `.page-section` elements, shows the target one
2. Updates `.active` class on nav links
3. Closes mobile nav overlay
4. For blog routes, calls `showBlogPost(slug)` or `showBlogListing()`
5. For other pages, calls `triggerFadeIns(target)` to replay entrance animations

A delegated click handler on `document` intercepts all `[data-page]` link clicks and sets `location.hash`.

### WebGL Shader

`src/shader.js` renders a full-viewport simplex noise background on `#shader-bg`. Key details:
- Renders at half resolution (0.5x DPR) for performance
- **On-demand rendering**: starts a `requestAnimationFrame` loop, then auto-stops after 1 second of no scroll/resize/theme-change events. The initial page load runs the loop for 2 seconds before idling.
- Uniforms: `u_time`, `u_res`, `u_accent`, `u_canvasLight`, `u_canvasDark`, `u_dark` (0.0 or 1.0), `u_scroll` (normalized scroll position)
- Three simplex noise layers blended for base texture, plus two warped splotch layers creating drifting red accent spots
- Canvas alpha blending: shader output is semi-transparent over the page background
- Theme changes detected via MutationObserver on `<html>` `data-theme` attribute
- Visibility API pauses/resumes the loop when the tab is hidden/shown

### Carousel

`src/carousel.js` implements a paginated 3-cards-per-page carousel on the home page.
- **Desktop (>900px)**: JS-driven `translateX` on `.carousel-track`. Wheel scroll advances pages (600ms debounce). Touch swipe with 1:1 drag tracking.
- **Mobile (<=900px)**: reverts to native `overflow-x: auto` + `scroll-snap-type: x mandatory`. The JS translateX is disabled via `!important` in CSS.
- Pill-shaped navigation dots created dynamically
- Card images use `data-src` + IntersectionObserver for lazy loading (rootMargin 200px)
- 3D tilt on hover via `initCardTilt()` from `card-effects.js` (perspective 800px, max 12deg)
- Shimmer highlight tracked via `--mouse-x`/`--mouse-y` CSS custom properties

### Blog

`src/blog.js` fetches `posts.json` for the listing and individual `.md` files from `posts/`. Features:
- Loading skeletons (shimmer animation) shown during fetch
- Fetch timeout (10 seconds) with AbortController
- In-memory caching: `postsCache` for the listing, `mdCache` per slug for post markdown
- Posts rendered via `parseMarkdown()` from `src/markdown.js` (a lightweight parser supporting headings, lists, code blocks with language labels, blockquotes, images, links, inline formatting)

### Scroll Animations

Two independent reveal systems coexist:
1. **`.fade-in` + `.visible`**: CSS-driven, triggered by `triggerFadeIns()` on page navigation. Staggered via `:nth-child` transition-delay (0.08s increments). Used for page content.
2. **`.scroll-reveal` + `.visible`**: JS IntersectionObserver (threshold 0.15, rootMargin -40px bottom). One-shot (unobserved after reveal). Used for carousel cards and section labels.

The accent stripe (`.stripe-band`) slides in from the left on scroll via `requestAnimationFrame` transform, rotated -3deg.

### World Map

`src/world-map.js` fetches `world-map.svg`, injects it into the About page, and creates an overlay SVG layer with:
- Two city dots (Singapore, San Diego) positioned via calibrated Mercator projection
- Pulsing glow circles on each dot
- Animated arc drawn progressively between cities (IntersectionObserver triggers, 2.5s fallback timeout)
- Visibility API pauses/resumes the animation

## Color System

The root site **does not have a `colors.js`**. It uses only the shared tokens injected by `shared-tokens.js`:
- Surfaces: `--bg-canvas`, `--bg-panel`, `--bg-panel-solid`, `--bg-elevated`, `--bg-hover`
- Text: `--text`, `--text-secondary`, `--text-muted`
- Borders: `--border`, `--border-strong`
- Accent: `--accent`, `--accent-light`, `--accent-subtle`, `--accent-glow`
- Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Fonts: `--font-display`, `--font-body`, `--font-mono`
- Extended palette CSS vars: `--ext-blue` through `--ext-yellow` (10 colors, used by world map `--ext-brown`)
- Overlay vars: `--overlay-base`, `--overlay-text`, `--overlay-tint`, etc. (carousel card overlays)
- Shimmer vars: `--shimmer`, `--shimmer-subtle` (card hover effects)

The `_PALETTE` and `_FONT` objects are **never frozen** on the root site (no `colors.js` to freeze them), so they remain mutable at runtime. This is fine since no code mutates them after `shared-tokens.js` runs.

## CSS Conventions and Overrides

### Root Site Overrides (in `styles.css`)

| Override | Shared Default | Root Value | Why |
|----------|---------------|------------|-----|
| `--toolbar-h` | `52px` | `56px` | Taller navbar for portfolio layout |
| `.tool-btn` | 34x34, sim-style | 36x36, `inline-flex`, `border: none`, `color: var(--text-secondary)` | Larger social link buttons |
| `--toolbar-h` at 600px | `52px` | `48px` | Shrinks on small phones |

### Layout

- **Traditional page layout** (`page-container` / `page-section`), not floating panels over a canvas
- **No intro screen** -- the root site uses a hero section with a scroll hint instead
- **Navbar** (`#navbar`) reuses `.sim-toolbar.glass` from `shared-base.css` but adds `border-radius: var(--radius-lg)` and custom padding
- **`.glass`** applied only to `#navbar` and `.contact-section`
- **Page transitions**: pages hidden via `display: none` / `.active` toggles `display: block` with a `pageEnter` keyframe (fade + slide up)

### Specificity Notes

- `.fade-in.visible` has specificity 0,2,0 which overrides `.project-card:hover` (0,1,1). The selector `.project-card.visible:hover` exists to win this battle.
- `.fade-in.visible` transition includes `transform` and `box-shadow` properties specifically so hover animations still work.

### Fonts

- **Noto Serif**: hero tagline, project titles, carousel card titles, blog post titles, inspire quote, contact heading
- **Noto Sans**: body text, nav links, UI labels
- **Noto Sans Mono**: section labels (`.section-label`), scroll hint, blog dates, project tags, blog code blocks
- Loaded via `<link>` tags in `<head>` (Google Fonts), never `@import` in CSS

## Responsive Breakpoints

| Breakpoint | What changes |
|-----------|-------------|
| `768px` (min-width) | Projects grid 2-column, about layout 2-column |
| **`900px`** | Desktop nav hides, mobile hamburger + overlay nav appears. Carousel switches from JS pagination to native scroll-snap. Hero title shrinks. World map shrinks. |
| **`600px`** | `--toolbar-h` drops to 48px. `.sim-brand` hidden. Hero padding shrinks. Blog entries stack vertically. Code blocks go full-bleed. |

## HTML Loading Order

```
<head>
  Google Fonts <link> (Noto Serif, Sans, Sans Mono)
  <script src="shared-tokens.js">    ← injects CSS vars, exposes _PALETTE/_FONT on window
  <script src="shared-utils.js">     ← exposes escapeHtml, debounce, etc. on window
  <link href="shared-base.css">      ← CSS reset, shared layout, glass, tool-btn, etc.
  <link href="styles.css">           ← project-specific overrides
  <link rel="icon" href="favicon.ico">
</head>
<body class="app-ready">
  ...
  <script type="module" src="main.js">  ← entry point, imports src/ modules
</body>
```

Note: The root site uses **relative paths** for shared files (`shared-tokens.js`, `shared-base.css`). Sub-projects use absolute paths (`/shared-tokens.js`, `/shared-base.css`). Both resolve to the same files because this repo is the root of `a9l.im`.

The root site does **not** load `shared-tabs.js`, `shared-camera.js`, `shared-info.js`, `shared-shortcuts.js`, or `shared-touch.js` -- those are only used by the three simulation projects.

## Gotchas

### Do Not Break

- **`CNAME` file** -- deleting it removes the `a9l.im` custom domain
- **`shared-tokens.js`** -- all four projects depend on it; breaking changes here break everything
- **`shared-utils.js`** -- `escapeHtml()` is called from multiple modules via the window global; removing it breaks rendering
- **`shared-base.css`** -- all four projects load this; class name changes affect all sims
- **`shared-tabs.js`** -- tab switching for all three sim sidebars; changing `.tab-btn`/`.tab-panel` class names or `data-tab` attribute breaks tab navigation
- **`shared-camera.js`, `shared-info.js`, `shared-shortcuts.js`, `shared-touch.js`** -- consumed by sim projects; do not rename, move, or change their public API without updating all consumers

### Shader On-Demand Rendering

The shader is **not** a continuous animation loop. It renders on scroll, resize, and theme change events, then stops after 1 second of inactivity. If you add UI that should trigger a visual update (e.g., a new scroll-reactive element), you need to call `requestRender()` or dispatch a scroll/resize event.

### Carousel Viewport/Track Architecture

- `.carousel-viewport` has `overflow: hidden`
- `.carousel-track` must **not** have `overflow: hidden` -- otherwise `translateX` moves the clipping boundary with the track and hides later pages
- Mobile (<=900px) CSS sets `transform: none !important` on the track and enables `overflow-x: auto` + `scroll-snap-type`

### Image Loading in Carousel

Carousel card images use `data-src` + IntersectionObserver for lazy loading. The `rootMargin: '200px'` ensures images load slightly before they scroll into view.

### `.fade-in.visible` Specificity Trap

Adding new `.fade-in` elements that also need hover effects requires the hover selector to include `.visible` (e.g., `.my-element.visible:hover`) to beat the 0,2,0 specificity of `.fade-in.visible`.

### Hero Title Italic Clipping

`.hero-tagline em` has `padding-right: 0.05em` to prevent the italic glyph from clipping at the edge. Removing this causes visual truncation on some fonts.

### Global Script Dependencies

`shared-tokens.js` and `shared-utils.js` are plain `<script>` tags (not modules). They expose globals on `window`. ES6 modules in `src/` access these globals directly (e.g., `_PALETTE`, `_parseHex`, `escapeHtml`). If you convert them to modules, you must update all consumers.

### Theme Toggle Location

All four projects set `data-theme` on `<html>` (`document.documentElement`). Do not change this without checking the shader's MutationObserver, which watches `document.documentElement`.

### Blog Fetch Path

Blog listing fetches `posts.json` and individual posts fetch `posts/{slug}.md` using relative URLs. These paths break if the site is served from a subdirectory.
