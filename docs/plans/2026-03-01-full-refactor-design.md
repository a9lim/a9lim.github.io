# Full Cross-Repo Refactor Design

**Date**: 2026-03-01
**Scope**: All 4 projects (a9lim.github.io, physsim, biosim, gerry) + shared design system

## Goals

- Clean, modular, maintainable code architecture across all projects
- Shared utilities to eliminate cross-project duplication
- Visual polish and UX improvements
- Performance optimization
- Consistent patterns and conventions

---

## 1. Root Site (a9lim.github.io)

### Architecture
- **Keep SPA router** (needed for blog post views) but clean up implementation
- **Split carousel.js** (~200 lines) into carousel core (~100 lines) + `src/card-effects.js` (3D tilt, shimmer — reused by project cards)
- **Delete dead code**: root-level `markdown.js` (never imported; `src/markdown.js` is the one used)
- **Fix XSS**: Replace `innerHTML` with `textContent` for user-facing strings in card rendering
- **Add error handling**: Timeout + error states for blog post fetches, world map SVG load

### Visual Polish
- Larger, more dramatic hero typography with staggered entrance animations
- Crossfade transitions between SPA pages (instead of instant show/hide)
- Project card redesign: better image-to-content ratio, subtle parallax on hover, smooth tag reveal
- Loading skeletons (shimmer placeholders) for blog posts and images
- Better scroll indicators (animated line/dots instead of plain arrow)
- Footer redesign: social links, quick nav, accent line (currently just copyright)
- Proper lazy-loading via IntersectionObserver (remove the force-eager hack)

### Performance
- WebGL shader: render on-demand (scroll/theme events) instead of continuous RAF
- Lazy-load project images with IntersectionObserver

---

## 2. Shared Design System

### New: `shared-utils.js`
Loaded by all 4 projects (after `shared-tokens.js`, before `colors.js`).

Functions:
- `escapeHtml(str)` — standardized escaping (replaces 2 different implementations)
- `debounce(fn, ms)` / `throttle(fn, ms)` — replaces reimplementations in carousel, gerry input
- `clamp(val, min, max)` — replaces inline `Math.min(Math.max(...))`
- `cubicBezier(x1, y1, x2, y2)` — replaces Newton-Raphson in biosim renderer AND gerry config
- `lerp(a, b, t)` — currently only in biosim anim.js, useful everywhere

### New: `shared-camera.js`
Reusable viewport/camera module for all 3 sim projects.

Core API:
- State: `{ x, y, zoom }` with min/max clamping
- `camera.screenToWorld(sx, sy)` / `camera.worldToScreen(wx, wy)`
- `camera.zoomBy(factor, centerX, centerY)` — preserves world point under cursor
- `camera.panBy(dx, dy)`
- `camera.zoomToFit(bounds)`
- Mouse: wheel-to-zoom, middle-click pan
- Touch: single-finger pan, two-finger pinch-zoom (preserves pinch center)
- Smooth zoom: animated with configurable easing

Integration per project:
- **Physsim**: Canvas 2D — applies camera transform before drawing
- **Biosim**: Canvas 2D — same pattern, replaces camera logic from renderer.js
- **Gerry**: SVG viewBox — camera maps to `viewBox` attribute updates

### `shared-base.css` Cleanup
- Better section organization with clear comments
- Audit: remove patterns not used by at least 2 projects
- Audit responsive breakpoints for consistency

### `shared-tokens.js`
- No major changes needed — well-structured already

### Loading Order (standardized)
```
Google Fonts <link> tags
<link shared-base.css>
<link styles.css>
<script shared-tokens.js>
<script shared-touch.js>
<script shared-utils.js>    ← NEW
<script shared-camera.js>   ← NEW (sims only)
<script colors.js>
<script type="module" src="main.js">
```

---

## 3. Physsim Refactor

### Code Quality
- **Extract `src/relativity.js`**: `gamma(p, m)`, `velFromMomentum(p, m)`, `clampVelocity(v)` — eliminates 4× duplication
- **Add `src/config.js`**: Named constants (`BH_THETA`, `MIN_DIST_SQ`, `BOUNCE_FRICTION`, `DESPAWN_MARGIN`, `MAX_TRAIL_LENGTH`, `QUADTREE_CAPACITY`, `MAX_VELOCITY_RATIO`)
- **Remove dead code**: Unused `totalSpin` in quadtree, unused CSS vars (`--danger`, `--danger-subtle`)
- **Integrate shared-camera.js**: Replace camera logic in `input.js` and `main.js`
- **Use shared-utils.js**: Replace inline `Math.min(Math.max(...))` with `clamp()`

### Visual Polish
- Button press states (scale-down on active)
- Toast notification on preset load / simulation reset
- Consistent intro screen entrance animation

---

## 4. Biosim Refactor

### Architecture
- **Split renderer.js** (1088 lines) into:
  - `src/renderer.js` (~400 lines) — Canvas draw pipeline, particle rendering
  - `src/layout.js` (~200 lines) — `computeLayout()`, metabolite positions, enzyme hitboxes
  - `src/particles.js` (~100 lines) — Particle spawning, lifecycle, animation
  - Camera logic moves to shared-camera.js
- **Reaction pattern factory**: Extract repeated `if (fwd && substrates && room) { mutate; showActiveStep; return true }` into declarative reaction builder
- **Decouple dashboard**: Reactions return `{ enzyme, reaction, yields }` object; main loop handles UI updates

### Code Quality
- **Fix theme inconsistency**: Move `data-theme` from `<body>` to `<html>` (match all other projects)
- **Clean up enzymes.js**: Remove unused font sizes from `_F` cache
- **Remove dead code**: `Anim.trail()` (never used)
- **Integrate shared-camera.js**
- **Use shared-utils.js**

### Visual Polish
- Button press states
- Toast notifications for significant actions
- Spring-physics easing on panel transitions

---

## 5. Gerry Refactor

### Performance
- **Optimize border rendering**: Incremental updates — only recalculate borders for changed districts, not all 10 on every paint stroke

### Code Quality
- **Fix bugs**: Variable shadowing in `renderBorders()`, add proper `_darken` import
- **Remove dead code**: `state.districtColors`
- **Clean up state shape**: Replace `isPainting` tri-state with explicit `{ mode: 'none' | 'paint' | 'erase', districtId?: number }`
- **Extract magic numbers** to `config.js`: zoom limits, population caps, noise scales
- **Remove `activeColors` export** from state.js — read `_PALETTE` directly
- **Integrate shared-camera.js**: Replace `zoom.js` + touch.js viewport logic
- **Use shared-utils.js**

### Visual Polish
- Button press states
- Toast notifications (map randomized, reset, undo/redo)
- Better mobile bottom sheet drag handle

---

## 6. Cross-Project Standards

### Conventions
- ES6 modules with named exports. Default exports only for singleton classes.
- Every project has `config.js` with named constants. No magic numbers in logic.
- DOM caching via `$` object pattern (standardize physsim and biosim to match gerry/root).
- Timeout + error states for all fetch operations.
- All projects pause RAF loops when tab is hidden.

### Visual Standards
- Consistent intro screen animations across all 3 sims (staggered card cascade, gradient pulse bg)
- `.tool-btn` press state: `transform: scale(0.94)` on `:active`
- Toast notification system (shared CSS pattern in shared-base.css, JS helper in shared-utils.js)
- Spring-physics easing for panel open/close (standardized via shared-utils.js cubicBezier)
- 8px vertical rhythm grid for spacing consistency
- Blog code blocks use palette colors for syntax highlighting (CSS-only, no library)
- Better mobile bottom sheets with drag handle and snap points

### Typography
- Audit spacing across all projects for 8px grid consistency
- Ensure `font-variant-numeric: tabular-nums` is used consistently for all numeric displays
