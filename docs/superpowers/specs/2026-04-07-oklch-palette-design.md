# OKLCH Palette Redesign

**Date:** 2026-04-07
**Status:** Approved

## Summary

Rework the shared color scheme in `shared-tokens.js` to use an OKLCH-native palette with a cold slate command-center aesthetic. Dual accent system (red primary + blue secondary), H=270 neutrals, perceptually uniform extended colors.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Accent model | Dual: red primary + blue secondary | Red for brand/interaction, blue for data/status |
| Neutral hue | H=270 (cold blue-violet slate) | Clinical Palantir Foundry feel, slightly cooler than current H=255 |
| Light theme | Mirrored cold slate (same H=270) | Consistent tone across themes, not a separate warm reading mode |
| Extended colors | L=0.62 uniform, C=0.11 | Strict perceptual uniformity, no color pops more than another |

## Palette Specification

### Accents

| Token | OKLCH | Hex | Use |
|-------|-------|-----|-----|
| `accent` | `oklch(0.53 0.225 29)` | `#E11107` | Primary brand, active nav underlines, buttons, progress bars |
| `accentLight` | `oklch(0.64 0.19 29)` | `#E95142` | Hover states, lighter accent contexts |
| `secondary` | `oklch(0.62 0.12 250)` | `#4488CC` | Data/status indicators, secondary actions, info elements |
| `secondaryLight` | `oklch(0.72 0.10 250)` | `#6BA3D6` | Lighter secondary contexts |

### Dark Theme Neutrals (H=270)

| Token | OKLCH | Approximate Hex | Use |
|-------|-------|-----------------|-----|
| `canvas` | `oklch(0.13 0.010 270)` | `#09090f` | Page background |
| `panelSolid` | `oklch(0.17 0.010 270)` | `#121218` | Cards, sidebar, panel backgrounds |
| `elevated` | `oklch(0.22 0.010 270)` | `#1c1c24` | Elevated surfaces, hover backgrounds |
| `text` | `oklch(0.91 0.005 270)` | `#e0e0e6` | Primary text |
| `textSecondary` | `oklch(0.62 0.008 270)` | `#8a8a94` | Secondary text, labels |
| `textMuted` | `oklch(0.42 0.008 270)` | `#55555f` | Muted text, placeholders |

### Light Theme Neutrals (H=270, mirrored)

| Token | OKLCH | Approximate Hex | Use |
|-------|-------|-----------------|-----|
| `canvas` | `oklch(0.93 0.008 270)` | `#e8e8ee` | Page background |
| `panelSolid` | `oklch(0.96 0.006 270)` | `#f0f0f5` | Cards, sidebar, panel backgrounds |
| `elevated` | `oklch(0.98 0.004 270)` | `#f8f8fc` | Elevated surfaces |
| `text` | `oklch(0.15 0.010 270)` | `#101016` | Primary text |
| `textSecondary` | `oklch(0.42 0.010 270)` | `#4e4e58` | Secondary text |
| `textMuted` | `oklch(0.57 0.008 270)` | `#7a7a84` | Muted text |

### Extended Colors (L=0.62, C=0.11)

All 13 chromatic colors locked to perceptually uniform lightness.

| Token | Hue | OKLCH | Use |
|-------|-----|-------|-----|
| `blue` | 235 | `oklch(0.62 0.11 235)` | Data series, geon negative charge hue source |
| `green` | 160 | `oklch(0.62 0.11 160)` | Positive/up, shoals call/up, cyano glycolysis |
| `orange` | 70 | `oklch(0.62 0.11 70)` | Warnings, shoals stock/gamma, gerry Federalist |
| `rose` | 0 | `oklch(0.62 0.11 0)` | Negative/down, shoals put/down |
| `purple` | 300 | `oklch(0.62 0.11 300)` | Category, shoals vega, gerry Reform |
| `cyan` | 195 | `oklch(0.62 0.11 195)` | Info, shoals theta, geon positive spin hue |
| `red` | 25 | `oklch(0.62 0.13 25)` | Error, geon positive charge hue source |
| `yellow` | 100 | `oklch(0.62 0.11 100)` | Highlight, cyano photon/betaox |
| `magenta` | 330 | `oklch(0.62 0.13 330)` | Accent alternative |
| `lime` | 140 | `oklch(0.62 0.13 140)` | gerry Farmer-Labor |
| `indigo` | 275 | `oklch(0.62 0.11 275)` | Category alternative |
| `brown` | 55 | `oklch(0.62 0.09 55)` | Subdued, cyano fermentation |
| `slate` | 270 | `oklch(0.62 0.015 270)` | Neutral reference, shoals rho |

Notes on chroma exceptions:
- `red`, `magenta`, `lime` use C=0.13 because these hues need slightly more chroma to remain distinguishable at L=0.62.
- `brown` uses C=0.09 because higher chroma at H=55 shifts perception toward orange.
- `slate` uses C=0.015 to remain near-achromatic as the neutral reference color.

## Scope of Changes

### Files Modified

1. **`shared-tokens.js`** — Replace `_PALETTE` values with OKLCH-computed hex. Add `secondary`/`secondaryLight` accent tokens. Shift neutral hue from H=255 to H=270. Add `--secondary`, `--secondary-light`, `--secondary-subtle`, `--secondary-glow` CSS custom properties alongside existing accent vars.
2. **`shared-base.css`** — No structural changes. Token vars remain the same names, just new values.
3. **Project `colors.js` files** — No changes needed. All project colors alias from `_PALETTE.extended.*` which gets new values automatically.

### Files NOT Modified

- `_worker.js` — no hardcoded colors to update
- Project CSS files — all reference CSS custom properties, not raw hex
- `og/generate.js`, `cards/generate.js` — hardcoded card colors, separate concern

### New CSS Custom Properties

```
--secondary:        #4488CC
--secondary-light:  #6BA3D6
--secondary-subtle: #4488CC14   (alpha ~0.078)
--secondary-glow:   #4488CC2E   (alpha ~0.18)
```

### Preserved API Surface

All existing CSS variable names (`--bg-canvas`, `--bg-panel`, `--text`, `--accent`, `--ext-blue`, etc.) remain unchanged. Only values change. No consumer updates needed.

## Migration Risk

**Low.** The change is purely cosmetic at the token level. All downstream consumers read CSS custom properties or `_PALETTE` object keys, both of which keep their names. The only visible change is that colors shift slightly.

The hue shift from H=255→H=270 on neutrals is subtle (15 degrees toward violet). Extended color lightness normalization to L=0.62 will cause some colors to get slightly lighter or darker — yellow and lime will darken most noticeably, purple and indigo will lighten slightly.

## Verification

1. Serve locally, check all 5 sims + root site in both themes
2. Verify extended colors remain distinguishable in shoals charts, geon canvas, cyano pathway colors, gerry hex map
3. Check accent contrast ratios: red on elevated (dark), red on canvas (light), blue on both
4. Verify `--text-on-accent` still readable on red and blue accent backgrounds
