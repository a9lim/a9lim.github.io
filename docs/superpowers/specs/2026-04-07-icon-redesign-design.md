# Icon Redesign — Command-Center Aesthetic

**Date:** 2026-04-07
**Scope:** `shared-icons.js` — all icons except social brand marks (github, twitter, linkedin)
**File:** Single file edit, no API changes

## Design Direction

Geometric precision as baseline, with selective HUD flair where it reinforces meaning. Not "replace everything with hexagons" — circles and curves stay where the shape demands them. The change is in stroke treatment, proportion tightening, and targeted accent marks.

## Stroke System

All icons share:
- `stroke-linecap="square"` (already present in `A` template)
- `stroke-linejoin="miter"` (already present in `A` template)
- `stroke-width="2"` for primary strokes

Flair accents use:
- `stroke-width="1"` at `opacity="0.4"` — consistent across all icons that have flair

## Changes by Tier

### Tier 1: Simulation Controls

| Icon | Change |
|------|--------|
| **play** | Wider triangle: `points="6,3 20,12 6,21"` |
| **pause** | Taller bars: `rect x=5 y=3 w=5 h=18` and `rect x=14 y=3 w=5 h=18` |
| **step** | Wider chevron `points="5,4 15,12 5,20"`, end-stop `x1=19 y1=4 x2=19 y2=20`, center tick accent on end-stop `x1=18 y1=12 x2=20 y2=12` sw=1 op=0.4 |
| **reset** | Keep original arc path. Squared arrow: `polyline points="3,3 3,8 8,8"`. No crosshair. |
| **stop** | Drop rx: `rect x=4 y=4 w=16 h=16` (no rx) |

### Tier 2: Theme & Utility

| Icon | Change |
|------|--------|
| **sun** | Circle core `r=5` (kept). 8 rays all at equal weight. Cardinal rays touch circle: `(12,1)-(12,5)`, `(12,19)-(12,23)`, `(1,12)-(5,12)`, `(19,12)-(23,12)`. Diagonal rays: `(4.22,4.22)-(6.34,6.34)`, `(17.66,17.66)-(19.78,19.78)`, `(4.22,19.78)-(6.34,17.66)`, `(17.66,6.34)-(19.78,4.22)` |
| **moon** | Clean crescent, no flair. Same path, just square linecap/join |
| **menu** | Staggered middle line: top `3-21`, middle `3-17`, bottom `3-21` |
| **about** | Circle kept. Same path, square linecap/join only |
| **gear** | **Unchanged** — original path kept as-is. Too complex to hand-author a replacement. |
| **close** | Unchanged (already pure geometry) |
| **search** | Circle lens kept. Crosshair accent inside: `(9,11)-(13,11)` and `(11,9)-(11,13)` sw=1 op=0.4. Handle: `(21,21)-(17,17)` |

### Tier 3: Content Tools

| Icon | Change |
|------|--------|
| **save** | Original path kept, square linecap/join only |
| **load** | Original path kept, square linecap/join only |
| **undo** | Square linecap/join. Squared arrow: `polyline points="1,4 1,10 7,10"` |
| **redo** | Square linecap/join. Squared arrow: `polyline points="23,4 23,10 17,10"` |
| **download** | Drop rx on container: `path d="M21 15v4H3v-4"`. Square linecap/join. |
| **speaker** | Square linecap/join only |
| **eye** | Square linecap/join. Vertical tick accents above/below pupil: `(12,7)-(12,8)` and `(12,16)-(12,17)` sw=1 op=0.4 |
| **copy** | Drop rx: `rect x=9 y=9 w=10 h=11` (no rx). Back panel: `path d="M5 15V5h10"` |
| **link** | Square linecap/join only |
| **dice** | Drop rx on container: `rect x=1 y=1 w=22 h=22` (no rx). Circle pips → square pips: `rect` 3×3 at (6.5,6.5), (14.5,6.5), (6.5,14.5), (14.5,14.5), (10.5,10.5) |
| **bookmark** | Drop rx: `path d="M19 21l-7-5-7 5V3h14z"` |
| **bookmarkFilled** | Same path change, filled |
| **fitView** | Square linecap/join only |
| **plus** | Square linecap/join only |
| **minus** | Square linecap/join only |
| **backArrow** | Square linecap/join only |

### Tier 4: Map Tools (Gerry)

| Icon | Change |
|------|--------|
| **eraser** | Original path kept, square linecap/join only |
| **trash** | Original path kept, square linecap/join only |
| **move** | Square linecap/join only |
| **autofill** | Circle kept. Cardinal tick accents: `(12,2)-(12,4)`, `(12,20)-(12,22)`, `(2,12)-(4,12)`, `(20,12)-(22,12)` sw=1 op=0.4 |
| **gerrymander** | Square linecap/join only |
| **fairDraw** | Square linecap/join only |
| **chart** | Square linecap/join only |
| **document** | Drop rx: `path d="M14 2H4v20h16V8z"`. Polyline kept. |
| **shuffle** | Square linecap/join only |

### Tier 5: Project Icons

| Icon | Change |
|------|--------|
| **projGeon** | Square linecap/join only |
| **projCyano** | Square linecap/join only |
| **projGerry** | Square linecap/join only |
| **projShoals** | **Redesigned.** Axes: `(2,22)-(2,2)` and `(2,22)-(22,22)`. Trend line: `polyline points="4,18 9,13 14,16 18,12"` (3 data points at x=4,9,14 with 5-unit spacing, even oscillation up 5/down 3/up 4). Arrow corner at (19,11) on the 45° line from dip. Line stops 1 unit short. Arrow: `polyline points="15,11 19,11 19,15"` (4-unit arms). |
| **projScripture** | Square linecap/join only |
| **projShannon** | **Redesigned.** Robot face: antenna line `(12,1)-(12,4)`, head `rect x=4 y=4 w=16 h=12 rx=3`, ear panels (horizontal line pairs: `(1,8)-(4,8)`, `(1,12)-(4,12)`, `(20,8)-(23,8)`, `(20,12)-(23,12)`), square eyes `rect 7.5,8.5 3×3` and `rect 13.5,8.5 3×3` (filled), jaw `rect x=7 y=18 w=10 h=5 rx=2`, neck struts `(9,16)-(9,18)` and `(15,16)-(15,18)`. stroke-width=1.5. |
| **projRaiko** | Square linecap/join only |
| **projFaithful** | Drop rx: `path d="M21 15V3H3v18l4-4h12a2 2 0 002-2z"` |
| **projCatppuccin** | Square linecap/join only |
| **projectArrow** | Square linecap/join only |

### Tier 6: Social (NO CHANGES)

github, twitter, linkedin — brand marks, left as-is.

### Tier 7: Mode Toggles + Toggle Icons

| Icon | Change |
|------|--------|
| **modeNormal** | Square linecap only |
| **modeCyano** | Square linecap only |
| **modeShoals** | Square linecap only |
| **togSun** | Already square linecap. Unchanged. |
| **togMoon** | Unchanged (filled) |
| **themeAuto** | Square linecap/join on sub-icons |

## What Does NOT Change

- The `_ICON` API surface: all property names, `.at()`, `.init()`, `data-icon`, `data-icon-size`
- The `A` and `FILL` template strings (already have square/miter)
- The `M20` template string
- The IIFE structure and DOMContentLoaded init
- The `s()` helper function
- Social brand marks

## Implementation Notes

- Single file edit: `shared-icons.js`
- No CSS changes needed — all styling is inline in SVG markup
- The `SUNF` (focused sun for toggles) should get the same ray structure as the new sun
- The compound `theme` and `themeAuto` icons should use the updated sun/moon SVGs
- Test at 18px (default), 10px (toggle), and 20px (M20) sizes
- Verify all `data-icon` consumers still render correctly across all 5 sims
