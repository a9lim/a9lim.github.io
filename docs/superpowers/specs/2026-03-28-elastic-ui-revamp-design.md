# Elastic UI Revamp — Design Spec

**Date**: 2026-03-28
**Scope**: Root site (a9l.im) and shared design system

The visual identity of a9l.im is being rebuilt around the concept of elasticity — elements stretch, compress, and deform like clay or silly putty in response to scroll and cursor interaction. The experience should feel physically coherent: heavy, viscous, and organic.

---

## 1. Elastic Engine (`elastic.js`)

A new shared module loaded as a `<script>` tag (like `shared-tokens.js`), exposing a global `_elastic` object. Single `requestAnimationFrame` loop managing all deformation state.

### State Tracking

- **Scroll**: position, velocity (px/frame), smoothed via exponential moving average (factor ~0.15)
- **Cursor**: position, velocity, distance to registered elements
- **Per-element deformation**: scaleX, scaleY, translateX/Y, border-radius corners — all interpolated via quintic smoothstep (`t^3 * (t * (t * 6 - 15) + 10)`)

### Declarative Opt-In

Elements register via `data-elastic` attribute:

- `data-elastic="light"` — shared components in sims: magnetic drift only (1-2px), elastic easing on transitions
- `data-elastic="medium"` — root site secondary elements: 70% scroll deformation, mild cursor effects
- `data-elastic="heavy"` — root site hero/key elements: full 100% scroll deformation, full cursor effects

### CSS Custom Properties

The engine sets per-element custom properties consumed by CSS:

- `--el-sx`, `--el-sy` — scale deformation
- `--el-drift-x`, `--el-drift-y` — cursor magnetic drift

### SVG Filter System

Shared SVG `<defs>` block injected into `<body>` with `feTurbulence` + `feDisplacementMap` filters per tier. Parameters (`baseFrequency`, `scale`) updated per frame based on scroll velocity. Elements reference via `filter: url(#elastic-heavy)`.

---

## 2. Metaball Shader Background

Replaces the current simplex noise shader (`src/shader.js`). Same architecture: WebGL on `#shader-bg`, half-resolution (0.5x DPR), on-demand rendering with idle timeout, visibility API pause, reduced-motion respect.

### Visual

- 6-8 soft metaball blobs in accent color family
- Classic metaball field function: `sum(radius_i^2 / distance_i^2)` with `smoothstep` threshold for soft glowing edges
- Blobs drift slowly on their own, merge and split like a lava lamp
- Core color: accent red. Edges fade through accent-light to transparent
- Light theme: very subtle, almost heat distortion. Dark theme: more visible and luminous

### Scroll Reactivity

- Scroll velocity uniform stretches the distance function elliptically — blobs elongate in the scroll direction
- Creates trailing streaks during fast scrolling

### Cursor Reactivity

- Cursor position uniform creates a gravitational bias pulling blob positions lazily toward the mouse
- Fast mouse movement creates slight wake/turbulence in the field

### Performance

- Blob positions updated on CPU, passed as uniforms
- 8 blob metaball evaluation is cheaper than current 3-octave simplex noise + domain warping
- Mobile: 4 blobs at 0.35x DPR

---

## 3. Scroll Deformation — Per-Block Clay Physics

The primary interaction system. Each content block (`.el-block`) has independent compression state driven by scroll velocity.

### Compression Front Propagation

- **Scroll down**: blocks near the top of viewport compress first, bottom stays static. Force uses `pow(1 - viewportPos, 0.7)` falloff.
- **Scroll up**: blocks near the bottom compress first, top stays static. Force uses `pow(viewportPos, 0.7)` falloff.
- The compression wave propagates directionally — you see the squish travel through the page.

### Deformation Values

- **Vertical compression**: up to 40% scaleY reduction at max velocity
- **Horizontal widening**: inverse of scaleY (volume conservation: `scaleX = 1 / scaleY`)
- **Accumulated push**: blocks below the compression zone shift vertically by the height lost above them

### Interpolation Rates

- **Onset**: fast (~0.20 lerp factor) — snappy response to scroll
- **Recovery**: moderate (~0.06) — viscous ooze back to rest
- **Velocity normalization**: ~25px/frame baseline, EMA smoothing factor ~0.15

### Intensity Tiers

- `heavy`: 100% of values above (root site hero, cards)
- `medium`: 70% (projects grid, blog, about)
- `light`: 40% (shared components in sims)

---

## 4. Page Transitions — Silly Putty Morph

Toolbar stays fixed as stable anchor. Content area has `overflow: hidden` for natural clipping. ~400ms per phase (~800ms total).

### Phase 1: Pull & Thin (400ms)

Outgoing page stretches sideways like pulled putty:

- `scaleX`: 1.0 → 2.2 (widens)
- `scaleY`: inverse of scaleX (volume conservation — thins as it widens)
- `translateX`: drifts toward exit direction, then accelerates off-screen
- `skewX`: builds gently with the pull, up to ~8deg
- Stays **fully opaque** throughout — slides off-screen, does not fade
- Easing: quintic smoothstep (gooey)

### Phase 2: Ooze In (400ms)

Incoming page enters from opposite side:

- Starts off-screen, horizontally compressed (`scaleX: 0.35`) and vertically stretched (`scaleY: 1/0.35`)
- Decompresses smoothly into natural shape as it slides to center
- `skewX` unwinds from ~-10deg to 0
- Easing: quintic smoothstep (gooey) — smooth deceleration, no bounce

### Metaball Shader Reaction

Blobs scatter during transition and re-coalesce as the new page settles. Adds visual continuity between the foreground transition and the background.

---

## 5. Cursor Proximity Effects

Secondary to scroll. Disabled entirely on touch devices (`'ontouchstart' in window`).

### Magnetic Drift

Elements within ~250px of cursor shift 2-4px toward it via `translate`. Gooey interpolation (0.06 lerp) — lazy gravitational pull.

### Asymmetric Border-Radius Morphing

On proximity, element corners morph based on cursor entry angle:

- Corner nearest cursor swells rounder (up to +20px radius)
- Far corners stay at base value
- Driven by normalized cursor position relative to element center
- Recovery lerp: 0.04 (slow ooze back to uniform radius)

### Accent Glow

Elements gain a subtle `box-shadow` in accent color proportional to cursor proximity. Fades to zero at 250px distance.

### Blob Attraction

Metaball shader blobs drift lazily toward cursor position (~12% of the distance). Always active, not gated by proximity.

### Intensity Tiers

- `light`: magnetic drift only (1-2px)
- `medium`: drift + mild bulge (3-4px), mild glow
- `heavy`: full drift (4px), full bulge (8px), full border-radius morphing, full glow

---

## 6. Shared Design System Changes

Enough elastic DNA for cohesion, not the full treatment.

### shared-tokens.js

- Add `--ease-elastic` CSS custom property: `linear()` approximation of the quintic smoothstep curve

### shared-base.css

- Replace `--ease-spring` with a gooier curve matching the putty feel
- `.tool-btn:active`: change `scale(0.94)` to `scaleY(0.90) scaleX(1.11)` (volume-conserving squish) with elastic easing
- Add `data-elastic` attribute support: CSS rules consuming `--el-sx`, `--el-sy`, `--el-drift-x`, `--el-drift-y` custom properties
- `.glass` panels get `data-elastic="light"` behavior

### elastic.js (new shared file)

- Loaded after `shared-tokens.js`
- Sims include it and get light-tier effects automatically on any `data-elastic` element
- Provides the full engine: scroll tracking, cursor tracking, SVG filter management, per-element deformation

### shared-toolbar.js

- Toolbar does NOT deform (stable anchor)

### No changes to

shared-forms.js, shared-tabs.js, shared-camera.js, shared-about.js, shared-touch.js, shared-tooltip.js, shared-sparkline.js, shared-haptics.js, shared-shortcuts.js, shared-info.js

---

## 7. Root Site Specific Changes

### New/Modified Files

| File | Change |
|------|--------|
| `src/shader.js` | Complete rewrite: metaball fragment shader replacing simplex noise |
| `src/router.js` | Silly putty page transitions replacing fade-up |
| `src/animations.js` | Per-block clay scroll physics replacing uniform translateY fade-in |
| `src/card-effects.js` | Replace 3D perspective tilt with elastic cursor system |
| `src/carousel.js` | Putty physics for swipe drag, elastic dot morphing |
| `styles.css` | New elastic keyframes, `data-elastic` styling, remove shimmer pseudo-elements |
| `index.html` | Add `data-elastic` attributes, wrap sections in `.el-block`, add elastic.js script |
| `elastic.js` | New shared elastic engine (loaded from root, absolute path for sims) |

### Stripe Section

Remove the current `translateX` stripe band. Replace with a metaball-style blob shape that stretches across as you scroll past it.

### Hero Section

- Hero tagline and subtitle get `data-elastic="heavy"`
- Replace scroll-hint (line + animated gradient) with a downward-pointing blob shape that stretches on scroll start

### Footer

- Accent line becomes a small metaball-style blob that deforms on cursor proximity

---

## 8. Mobile & Performance

### Touch Devices

- Scroll deformation works identically (touch scroll velocity drives clay physics)
- Cursor effects disabled entirely
- Page transitions: same putty morph, same timing
- Carousel swipe: putty stretch physics

### Metaball Shader on Mobile

- 4 blobs instead of 6-8
- 0.35x DPR instead of 0.5x
- Same idle timeout and visibility pause

### Reduced Motion

`prefers-reduced-motion: reduce`:

- Disable all elastic deformation
- Render shader once as static texture
- Use simple opacity transitions for page navigation
- No SVG filter deformation

### Performance Guardrails

- Elastic engine pauses on `visibilitychange` (tab hidden)
- If SVG filter takes >16ms/frame, auto-downgrade to transform-only deformation
- Single rAF loop for all deformation (no competing animation frames)

---

## 9. What Does NOT Change

- Color palette (red accent, cool blue-gray neutrals)
- Typography (Noto Sans / Noto Serif / Noto Sans Mono)
- Content structure (hash-based SPA router, same pages)
- Blog rendering (markdown, same layout)
- World map SVG on about page
- No idle breathing / ambient animation — elements are static at rest
- CNAME, shared-tokens.js palette values, shared API contracts (`_toolbar`, `_forms`, etc.)
