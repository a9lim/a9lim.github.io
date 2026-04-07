# Command Center UI Overhaul

Design spec for overhauling the a9l.im portfolio visual language toward a sharp, geometric, engineering-precision aesthetic. Evangelion NERV HQ meets Palantir Foundry — institutional confidence, operational translucency, monospace everything.

## Scope

- **Primary:** Root portfolio site (hero, navbar, carousel, blog, about, footer)
- **Secondary:** Shared token system (`shared-tokens.js`, `shared-base.css`) — cascades into all five sims
- **Targeted:** Surgical sim-level fixes where token changes produce visual breakage

## Design Direction

Clean, modern, flat, techie. Engineering precision over decorative softness. Gendo meets Alex Karp — 20-year-old amoral tech wizard energy. Lines as graphic elements (underlines, side bars, horizontal rules), never as container borders. Elevation earned through interaction, not decoration.

---

## 1. Radius System

**Before:** Four tokens (`--radius-sm: 8px`, `--radius-md: 14px`, `--radius-lg: 20px`, `--radius-pill: 9999px`) assigned ad-hoc with no governing rule.

**After:** Single token.

```css
:root {
  --radius: 2px;
}
```

- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill` eliminated
- All CSS references migrated to `--radius`
- 2px everywhere — cards, buttons, toggles, inputs, tags, panels, glass overlays
- No pills, no exceptions

## 2. Typography

**Before:** Four font stacks — Merriweather (display), Lato (body), Crimson Text (body serif), Recursive (mono).

**After:** Full monospace.

```js
const _FONT = {
  display: "'Recursive', 'SF Mono', 'Menlo', monospace",
  sans:    "'Recursive', 'SF Mono', 'Menlo', monospace",
  serif:   "'Recursive', 'SF Mono', 'Menlo', monospace",
  mono:    "'Recursive', 'SF Mono', 'Menlo', monospace",
};
```

- All four stacks resolve to Recursive
- `font-variation-settings: 'MONO' 1, 'CASL' 0` on `body` — linear, mechanical feel
- CSS vars: `--font-display`, `--font-sans`, `--font-serif`, `--font-mono` (all Recursive, kept as separate vars for future-proofing)
- Legacy `--font-body` and `--font-body-serif` eliminated, all references migrated

## 3. Shadow & Elevation

**Before:** Seven shadow tiers (xs through xl) plus glow/glow-lg.

**After:** Four tokens.

```css
:root {
  --shadow-hover:    /* subtle lift for small interactive elements (buttons, tags) */;
  --shadow-hover-lg: /* larger lift for cards/panels on hover */;
  --shadow-glow:     /* accent-colored, focus/active states */;
  --shadow-glow-lg:  /* accent-colored, strong emphasis */;
}
```

- No resting shadows on any element (enforced, not just convention)
- `--shadow-xs` through `--shadow-xl` eliminated
- Glow tokens for "data hotspot" moments — focus rings, active states
- Shadows remain black+alpha; only glow tokens use accent color

## 4. WebGL Shader

**Before:** Organic simplex noise — soft blobby texture with accent-tinted splotches, domain-warped, three octaves. Lava lamp energy.

**After:** Geometric dual-layer system.

**Layer 1 — Dot grid substrate:**
- Evenly spaced points across viewport
- Subtle luminosity variation
- Low opacity, always present
- Hardware-display texture feel

**Layer 2 — Topographic contours:**
- Flowing parallel lines derived from noise field
- Rendered as sharp isolines, not soft blobs
- Slowly shifting — terrain data being reprocessed
- Accent color bleeds through at contour density peaks (thermal hotspot style)

**Vignette:** Angular corner emphasis rather than radial falloff. Monitor-edge feel.

**Behavior unchanged:**
- On-demand rendering (scroll/resize/theme-change)
- Auto-stop after 1s idle
- Scroll shifts field vertically
- Respects `prefers-reduced-motion`
- Smooth theme toggle transition

## 5. Glass & Surface Treatment

Two surface modes based on element function:

### Opaque (structural)
- **Elements:** Cards, content panels, blog entries, contact card, footer
- **Treatment:** Solid `--bg-panel-solid` or `--bg-elevated`, hard-edged against shader background
- No backdrop-filter, no translucency

### HUD overlay (navigational/status)
- **Elements:** Navbar, sim toolbars, sidebars, modal overlays
- **Treatment:** Highly transparent (30-35% opacity background), `backdrop-filter: blur(8px)`, grid/contours visible through
- `saturate(1.5)` dropped — neutral or slightly desaturated
- Faint accent underline/topline to delineate HUD band (1px, low-opacity accent)
- Subtle glow on accent elements — backlit instrument readout level, not neon. Think `box-shadow: 0 0 12px rgba(accent, 0.1)` not `0.3`.
- Active state indicators (brand, active nav links, status dots) get a restrained text-shadow/box-shadow glow

### Line accents
- Underlines, side bars, horizontal rules used as graphic/structural markers
- Not borders on containers — lines are graphic elements
- Accent color or `--shimmer-subtle`
- Side-lines on cards/inputs glow faintly on hover/focus — bleed, not blast

## 6. Shimmer & Interaction Effects

Cohesive families sharing standardized timing, opacity scale, and color derivation.

### Cards (project cards, carousel cards)
- Mouse-tracking radial highlight: smaller radius, sharper falloff, lower opacity — spotlight sweep not soft glow
- Hover lift via `--shadow-hover-lg`
- Accent side-line appears on hover (left edge, 2px, slides in)

### Buttons & Controls (CTA, mode toggles, tool buttons)
- CTA: quick luminosity shift on hover (background lightens), no sweep animation
- Mode toggle: accent indicator slides between options (existing behavior, kept)
- Tool buttons: color transition only, scale-down on active

### Text treatments
- Hero tagline gradient animation: kept but slowed — more deliberate, less playful
- Section labels: breathing accent dot kept
- No text-shadow shimmer on hover anywhere

### Timing standardization
- All hover transitions: `0.2s ease-out`
- Slide/transform animations: `0.3s ease-out`
- `--ease-spring` and `--ease-elastic` eliminated — no bounce
- Retained: `--ease-out`, `--ease-in-out`, `--ease-smooth`

## 7. Sim-Level Surgical Fixes

Token overhaul cascades automatically. Manual attention needed for:

### All sims
- Toolbar/sidebar glass tuning to match HUD parameters (blur, opacity)
- Elements using eliminated tokens (`--radius-pill`, `--ease-spring`) that produce visual breakage

### Scripture
- Reading pane renders long-form text in Recursive mono — may need increased `line-height` or `letter-spacing` for readability at length

### Root site — Carousel dots
- Currently pill-shaped (8px circle → 28px pill active state)
- With pills eliminated, replace with square dots or alternative active indicator (underline, luminosity change)

### Approach
- Fix what breaks, don't redesign
- Flag judgment calls during implementation
