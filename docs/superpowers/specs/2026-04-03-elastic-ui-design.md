# Elastic UI Redesign — WebGPU Rubber Physics

## Overview

Redesign the a9l.im portfolio site so that every UI element behaves as a soft, stretchy, elastic object. Users can click and drag to realistically pull and stretch any element — it deforms like rubber, thins unevenly under tension, and jiggles back on release. The entire visible page is rendered via a single fullscreen WebGPU canvas, merging the background shader and elastic UI into one unified surface.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Background integration | Merge — unified WebGPU surface | Whole page feels like one continuous elastic material |
| Content deformation | Full — text, icons, everything warps | Maximum visual impact; text is rubbery when stretched, readable at rest |
| Material feel | Soft silicone / gummy | Low stiffness, low damping, 3-5 oscillations, ~80% max stretch |
| Element interaction | Independent with collision | Elements stretch independently; if one physically pushes another, it deforms |
| Scrolling | Standard browser scroll | Elastic behavior on elements only, no elastic overscroll |
| Mobile touch | Single-touch drag stretching | Same as desktop mouse drag, no multi-touch |
| Click behavior | Localized outward squish | Radial impulse from click point, magnitude falls off with distance squared |
| Idle/ambient motion | None | Elements only move when interacted with |

## Rendering Architecture

The entire visible page is a single fullscreen WebGPU canvas. The DOM exists underneath (invisible, `opacity: 0; pointer-events: auto`) for accessibility, hit-testing, and layout measurement.

### Pipeline per frame

1. **Layout Phase (DOM)** — Browser lays out invisible DOM elements. JS reads `getBoundingClientRect()` for every elastic element.

2. **Rasterization Phase** — Each element is drawn to an `OffscreenCanvas` using Canvas 2D API, then uploaded to a GPU texture atlas. Rasterization runs only on content/theme/resize/route changes, never per-frame.

3. **Mesh Phase** — Each element's texture maps onto a deformable triangle grid. Grid resolution varies by element size (6x6 for small buttons up to 32x32 for large panels).

4. **Physics Phase (Compute Shader)** — WebGPU compute shader runs spring-mass simulation, updating vertex positions. 2 substeps per frame at 1/120s fixed timestep.

5. **Collision Phase (Compute Shader)** — For element pairs with overlapping AABBs, check per-node penetration and apply repulsion.

6. **Render Phase** — Single render pass: background simplex noise (fullscreen quad) → element meshes (textured triangles) in DOM z-order.

## Physics Simulation

### Spring-mass network

Each mesh vertex is a point mass connected to neighbors by three spring types:

- **Structural springs** — 4 direct neighbors (up/down/left/right). Resist stretching.
- **Shear springs** — 4 diagonal neighbors. Resist skewing.
- **Bend springs** — neighbors 2 steps away (skip-one). Resist folding, maintain shape.

### Constants (soft silicone feel)

| Parameter | Value | Notes |
|---|---|---|
| Spring stiffness | 15-25 N/m | Low — easy to pull |
| Damping | 0.3-0.5 | Low — allows 3-5 oscillations |
| Node mass | 1.0 | Normalized |
| Max stretch ratio | 1.8x rest length | Nonlinear stiffening beyond this |
| Timestep | 1/120s | 2 substeps per 60fps frame |

### Non-uniform thinning

Emerges naturally from the spring network. Pulling one end of a long element stretches structural springs longitudinally. Perpendicular springs lose restoring force in the middle (where stretch is greatest) but maintain width at the anchored ends. No special-case code needed.

### Integration method

Verlet integration — position-based, inherently stable, no explicit velocity storage needed for the core simulation (velocity buffer used for damping and impulse application).

## Interaction System

### Drag state machine

```
IDLE → pointerdown → PRESSED (start timer)
PRESSED → pointermove > 4px → DRAGGING
PRESSED → pointerup < 200ms → CLICK (squish impulse)
DRAGGING → pointermove → UPDATE (pin nodes to cursor)
DRAGGING → pointerup → RELEASE (unpin, springs restore)
```

### Drag behavior

- Nearest node to grab point is hard-pinned to cursor
- Nodes within ~3 grid cells get soft-pinned with distance falloff
- Prevents single-point pinching; gives a natural "grab a handful" feel

### Click squish

- Radial outward impulse from click point
- Magnitude: `base_impulse / (1 + distance²)`
- Strong bulge at click, rapid falloff, 3-5 oscillation settle

### Mobile touch

- `touchstart`/`touchmove`/`touchend` follow same state machine
- Single touch only — second finger ignored
- If initial movement is predominantly vertical, yield to browser scroll

### Collision

- Each mesh maintains an AABB updated per frame
- Overlapping AABBs trigger per-node penetration checks
- Penetrating nodes receive repulsion force along penetration normal
- Effect: stretched element pushing into neighbor dents the neighbor's surface

## Element Rasterization

### Approach

Dedicated draw functions per element type using Canvas 2D API on `OffscreenCanvas`. No html2canvas or DOM screenshots.

### Common utilities

- `drawRoundedRect(ctx, x, y, w, h, radius, fill)`
- `drawText(ctx, text, x, y, font, color, maxWidth)` with word-wrap
- `drawSVGPath(ctx, svgString, x, y, scale)` for icons
- `getComputedTokens()` reads CSS custom properties for theme colors

### Element rasterizers

| Element | Content drawn |
|---|---|
| Navbar | Glass-tinted rounded rect, logo text, nav links, icon circles |
| Hero block | Subtle bg, large serif title, italic gradient text, subtitle |
| Carousel card | Rounded rect, background image, gradient overlay, title, description, tags |
| Carousel dots | Row of circles, active dot wider + accent |
| Project card | Rounded rect, SVG icon, title, description, arrow, tags |
| Blog entry | Rounded rect, date, title, tag |
| Blog post | Rounded rect, rendered markdown (headings, paragraphs, code blocks) |
| About bio | Rounded rect, paragraph text |
| Contact card | Glass-tinted rect, heading, links |
| World map | Rounded rect, SVG country paths, dots, arcs |
| Footer | Rounded rect, accent line, nav, icons, copyright |

### Texture atlas

- Single `GPUTexture` at 4096x4096, `rgba8unorm`
- Bin-packing algorithm assigns regions
- Rebuilt on theme change, resize, or route change

### Re-rasterization triggers

- Theme change → full re-rasterize
- Window resize → full re-rasterize
- Route change → rasterize new page elements, evict old
- Never per-frame

## Mesh Inventory

| Element | Grid | Notes |
|---|---|---|
| Navbar | 32x4 | Wide + thin, horizontal stretch |
| Hero tagline | 24x16 | Large text block |
| Carousel card | 16x20 | Portrait, per-card |
| Carousel dots | 16x2 | Thin strip |
| Project card | 16x16 | Square-ish |
| Blog entry | 24x4 | Wide + short |
| Blog post | 24x32 | Tall content block |
| About bio | 16x16 | Text region |
| Contact card | 16x12 | Glass panel |
| World map | 32x20 | Large SVG |
| Footer | 32x4 | Wide strip |
| Theme toggle | 6x6 | Small, coarse mesh |

## Visual Design

### Principles

- **Gap = background** — space between elements shows the simplex noise shader surface
- **Generous spacing** — ~50% more spacing than current design to allow room for stretching
- **Rounded everything** — 20-28px border-radius on all elements; sharp corners look wrong on rubber
- **Flat + soft** — no borders, no resting shadows (matches existing philosophy). Elastic deformation is the visual interest.
- **Background differentiation** — elements distinguished by background color/opacity against shader surface

## WebGPU Pipeline Detail

### Buffer layout (per element, concatenated globally)

- Vertex buffer: `[x, y, u, v, restX, restY]` per node
- Velocity buffer: `[vx, vy]` per node
- Spring buffer: `[nodeA, nodeB, restLength]` per spring

### Compute dispatches

1. Spring forces + Verlet integration: `ceil(totalNodes / 256)` workgroups, run twice (2 substeps)
2. Collision: dispatched per overlapping element pair

### Render passes

1. Background: fullscreen quad, simplex noise fragment shader (ported from current GLSL to WGSL)
2. Meshes: per-element draw call, textured triangles from atlas, draw order = DOM z-order, alpha blending

### Shader modules (WGSL)

- `physics.wgsl` — spring forces + Verlet integration
- `collision.wgsl` — inter-element collision
- `background.wgsl` — simplex noise (port of current WebGL shader)
- `mesh.wgsl` — vertex/fragment for textured mesh rendering

### Performance

- ~500 total nodes across all visible elements — trivial compute load
- 11-15 draw calls per frame — well within budget
- Texture atlas static between content changes
- Target: locked 60fps, physics compute <1ms

## Fallback

### Two-tier strategy

**Tier 1 — WebGPU available:** Full elastic mesh system.

**Tier 2 — WebGPU unavailable:** Existing site as-is. WebGL simplex noise background, DOM rendering, CSS animations. The site works and looks good without elastic physics.

### Detection

```js
if (navigator.gpu) {
  const adapter = await navigator.gpu.requestAdapter();
  if (adapter) { /* Tier 1 */ } else { /* Tier 2 */ }
} else { /* Tier 2 */ }
```

No middle-ground CSS approximation — the existing site is a better fallback than a half-baked elastic simulation.

## File Structure

```
src/elastic/
  index.js          — WebGPU detection, init orchestration
  device.js         — GPUDevice/adapter setup, canvas config
  atlas.js          — Texture atlas packing, upload, region management
  rasterizer.js     — Element-type draw functions, OffscreenCanvas
  mesh.js           — Grid topology, spring network generation
  physics.js        — Compute pipeline setup, buffer management
  collision.js      — AABB tracking, overlap detection
  renderer.js       — Background pass + mesh draw pass
  interaction.js    — Pointer events, drag state machine, impulses
  layout.js         — DOM rect reading, element-to-mesh mapping
  shaders/
    physics.wgsl
    collision.wgsl
    background.wgsl
    mesh.wgsl
```

## Integration with Existing Code

### Modified

- `main.js` — new branch at top: attempt WebGPU init → if success, skip visual init but keep router/theme/data

### Bypassed in WebGPU mode

- `src/shader.js` → replaced by `background.wgsl`
- `src/card-effects.js` → replaced by mesh deformation
- `src/animations.js` scroll-reveal/fade-in → replaced by mesh rendering
- CSS hover effects → all visual feedback from physics

### Active in both modes

- `src/router.js` — elastic `layout.js` listens to route changes
- `src/theme.js` — elastic `rasterizer.js` listens to theme changes
- `src/projects.js` — data source for card rasterization
- `src/blog.js` — markdown fetching/parsing
- `src/mobile-menu.js` — mobile nav toggle
- `shared-tokens.js` — CSS custom properties read by rasterizer
- `styles.css` / `shared-base.css` — define invisible DOM layout

## Accessibility

- Invisible DOM layer (`opacity: 0; pointer-events: auto`) preserves full accessibility tree
- Screen readers interact with real DOM elements
- Tab focus works on real elements; elastic renderer draws focus indicator on corresponding mesh
- Links and navigation work through DOM click handlers
- `prefers-reduced-motion`: disable elastic deformation, render meshes at rest positions (static textured quads)
