# Mobile Support & Keyboard Shortcut Audit — Design Spec

**Date**: 2026-03-25
**Scope**: All four simulation projects (geon, shoals, cyano, gerry) and shared infrastructure

## Problem

A cross-project audit identified 19 categories of issues:
- Right-click-only actions are inaccessible on touch devices (antimatter spawning, selling/shorting, reverse reactions, erasing)
- Missing keyboard shortcuts for common actions (zoom, speed, tabs, reset)
- Inconsistent keybindings across projects
- Touch targets below 44px minimum on mobile
- Canvas tooltips are mouse-only
- Sidebar toggles are not keyboard-focusable
- About panel and overlays lack focus traps
- Hint bars show desktop-only instructions on mobile

## Design Decisions

- Right-click actions become toolbar toggle buttons — toggle switches the meaning of tap/click globally within that project
- `X` is the universal "mode toggle" key where applicable
- Pan is always two-finger on touch (no single-finger pan mode needed)
- Universal keybindings are consistent across all four projects
- Touch targets expand to 44px via `@media (pointer: coarse)` — toolbar scrolls horizontally to accommodate
- Hint bars detect touch and swap to mobile-appropriate instructions
- Toggles become keyboard-focusable via visually-hidden pattern instead of `display: none`

## Implementation Layers

### Layer 1: Shared CSS Fixes (`shared-base.css`)

#### Touch target expansion

Add a `@media (pointer: coarse)` block:

```css
@media (pointer: coarse) {
  .tool-btn { width: 44px; height: 44px; }
  .info-trigger { min-width: 32px; min-height: 32px; padding: 8px; }
  .tab-btn { min-height: 44px; }
  .mode-btn { min-height: 44px; }
}
```

#### Toolbar horizontal scroll

Inside `@media (pointer: coarse)`:

```css
.sim-toolbar-actions {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
```

Hide the scrollbar visually (the toolbar is a single row — users discover scroll via the toggle buttons at the edges):

```css
.sim-toolbar-actions::-webkit-scrollbar { display: none; }
.sim-toolbar-actions { scrollbar-width: none; }
```

#### Toggle accessibility

Replace:
```css
.tog-wrap input { display: none; }
```

With:
```css
.tog-wrap input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

The existing `input:focus-visible + .tog` rule at line 1463 will start working automatically.

### Layer 2: Shared JS Fixes

#### `shared-tabs.js` — Arrow key navigation

When a `[role="tab"]` has focus:
- `ArrowLeft` / `ArrowRight`: move focus to previous/next tab and activate it
- `Home`: focus and activate first tab
- `End`: focus and activate last tab

On init, add `aria-labelledby` on each `[role="tabpanel"]` pointing to its controlling `[role="tab"]` button's `id`. Generate tab `id`s if missing (e.g., `tab-{index}`).

#### `shared-about.js` — Focus trap and `aria-modal`

On the about overlay element:
- Add `aria-modal="true"`
- On open: store `document.activeElement` as `_previousFocus`, move focus to the close button
- Trap Tab/Shift+Tab within the overlay — cycle between focusable elements inside (use `shared-utils.js` `trapFocus()` utility)
- On close: call cleanup, restore focus to `_previousFocus`

#### `shared-info.js` — Reference overlay focus trap

Same pattern as about panel: `aria-modal="true"`, focus trap on open, restore on close.

#### `shared-tooltip.js` — Long-press for touch

Add a touch path alongside the existing mouse path:

- Bind `touchstart` / `touchmove` / `touchend` on the element that triggers tooltips
- On `touchstart`: start a 400ms timer. Record touch position.
- On `touchmove`: if moved > 8px from start, cancel the timer (user is dragging/panning)
- On timer fire: call the same hit-test function the `mousemove` handler uses. If a hit, show the tooltip at the touch position. Dismiss after 3 seconds or on next `touchstart`.
- On `touchend` before timer: cancel (normal tap proceeds to the click handler)

This requires each project to pass its hit-test function when initializing tooltip touch support, since the hit-test is project-specific (enzyme hitboxes in cyano, chain cell data in shoals).

#### `shared-utils.js` — Focus trap utility + toast `aria-live`

**`trapFocus(overlayEl)`**: Returns a cleanup function. On call:
1. Query all focusable elements inside `overlayEl` (`a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])`)
2. Add a `keydown` listener that intercepts Tab/Shift+Tab and cycles focus within the list
3. The returned cleanup function removes the listener

**Toast `aria-live`**: In `showToast()`, ensure the toast container has `role="status"` and `aria-live="polite"`. Set once on container creation.

### Layer 3: Universal Keyboard Shortcuts

Every project registers these via `initShortcuts()`:

| Key | Action | Group | Applies to |
|-----|--------|-------|------------|
| `Space` | Play / Pause | Simulation | all 4 |
| `,` | Decrease speed | Simulation | geon, shoals, cyano |
| `.` | Increase speed | Simulation | geon, shoals, cyano |
| `/` | Step forward | Simulation | geon, shoals |
| `R` | Reset simulation | Simulation | all 4 |
| `T` | Toggle theme | View | all 4 |
| `S` | Toggle sidebar | View | all 4 |
| `[` | Previous tab | View | all 4 |
| `]` | Next tab | View | all 4 |
| `=` | Zoom in | View | all 4 |
| `-` | Zoom out | View | all 4 |
| `0` | Reset zoom | View | all 4 |
| `Escape` | Close overlay/sidebar | View | all 4 |
| `?` | About/help | View | all 4 |

**Migration from current state:**
- Geon: `.` moves from step-forward to speed-up; `/` takes step-forward. Add `,`, `[`, `]`, `=`, `-`, `0`.
- Shoals: `.` moves from step-forward to speed-up; `/` takes step-forward. Add `,`, `R`, `[`, `]`, `=`, `-`, `0`. Fix save/load shortcuts (currently empty callbacks).
- Cyano: Add `R`, `,`, `.`, `[`, `]`, `=`, `-`, `0`.
- Gerry: Unbind `0` from district 10. Add `R`, `,`, `.` (gerry has no speed control — skip `,`/`.`), `[`, `]`, `=`, `-`, `0`.

### Layer 4: Project-Specific Keyboard Shortcuts

#### Geon

Existing: `1-9` (presets), `V` (velocity vectors), `F` (acceleration vectors), `C` (acceleration components), `Ctrl+S` (quick save), `Ctrl+L` (quick load), `Ctrl+Shift+S` (download state), `Ctrl+Shift+L` (upload state).

Changes:
- Fix `Ctrl+S/L/Shift+S/Shift+L` — currently registered with empty `() => {}` callbacks. Wire to actual handlers.
- Add `X` — toggle antimatter/delete mode

#### Shoals

Existing: `1-7` (presets).

Changes:
- Add `X` — toggle Buy/Sell mode
- Add `B` — buy/sell stock (respects X toggle)
- Add `N` — buy/sell bond (respects X toggle)
- Add `O` — open full chain overlay
- Add `Enter` — execute saved strategy (when Strategy tab active)
- Chain overlay keyboard nav: arrow keys move between cells, Enter executes trade

#### Cyano

Existing: `1-5` (pathways), `G` (glucose), `F` (fatty acid), `L` (light), `O` (oxygen).

Changes:
- Add `U` — toggle uncoupling
- Add `X` — toggle forward/reverse reaction mode

#### Gerry

Existing: `1-9` (districts), `E` (erase), `D` (delete), `A` (auto-fill), `N` (randomize), `Ctrl+Z` (undo), `Ctrl+Y` (redo).

Changes:
- Unbind `0` from district 10
- Add `G` — auto-gerrymander
- Add `F` — fair draw
- Add `M` — Monte Carlo simulate
- Add `P` — toggle pan mode
- Add `B` — cycle brush size (1→3→7→1)
- Add `Ctrl+Shift+Z` — redo (alternative)

### Layer 5: Project-Specific Mobile/Touch Fixes

#### Geon — Antimatter/Delete Toggle

**New toolbar button**: an icon that visually indicates normal matter vs antimatter mode. Placed in `.sim-toolbar-actions` near the existing play/speed/reset controls.

**State**: a boolean `antimatterMode` in the simulation state. Toggled by the button or `X` key.

**Touch behavior changes** in `input.js` `onTouchEnd`:
- When `antimatterMode === false` (default):
  - Tap empty space → spawn normal particle
  - Tap existing particle → select it (show Particle tab)
- When `antimatterMode === true`:
  - Tap empty space → spawn antimatter particle
  - Tap existing particle → delete it
  - Tap antimatter particle → select it

The existing `spawnParticle()` function already accepts an antimatter flag. The hit-test for particle selection needs to be integrated into the touch path — currently `onTouchEnd` calls `spawnParticle` unconditionally. Change to: hit-test first, if a particle is under the touch point, select or delete based on mode; if empty space, spawn based on mode.

**Hint bar**: detect `(pointer: coarse)` and show `"Tap to Spawn · Pinch to Zoom · X to Toggle Mode"` instead of `"Left Click to Spawn · Right Click to Remove · Scroll to Zoom"`.

#### Shoals — Buy/Sell Toggle + Chart Touch

**New toolbar button**: shows current mode (Buy/Sell) with a visual indicator. Placed in `.sim-toolbar-actions`.

**State**: a boolean `sellMode` in UI state. Toggled by the button or `X` key.

**Chain/stock/bond cell behavior**:
- `click` handler checks `sellMode`: if true, executes the sell/short action; if false, executes buy/long
- The existing `contextmenu` handler remains for desktop right-click users

**Chart canvas touch**: Call `camera.bindTouch($.chartCanvas)` in `main.js` alongside the existing `bindWheel` and `bindMousePan` calls. This enables pinch-zoom and two-finger pan using the already-implemented `shared-camera.js` `bindTouch()`.

**Strategy canvas touch**: Similarly, bind touch events on the strategy canvas. The strategy module has its own pan/zoom — add `touchstart`/`touchmove`/`touchend` handlers mirroring the existing `mousedown`/`mousemove`/`mouseup` in `strategy.js`.

**Bid/ask tooltip on touch**: Long-press on chain/stock/bond cells triggers the bid/ask tooltip via the shared-tooltip.js touch enhancement.

**Hint bar on mobile**: `"Tap to Trade · Long-press for Bid/Ask · Pinch to Zoom Chart"`.

#### Cyano — Forward/Reverse Toggle

**New toolbar button**: forward/reverse arrows icon. Placed in `.sim-toolbar-actions`.

**State**: a boolean `reverseMode` in UI state. Toggled by the button or `X` key.

**Touch behavior change** in `renderer.js` `touchend` handler:
- Currently hardcodes `'forward'` direction. Change to: check `reverseMode`, pass `'reverse'` if true.

**Canvas tooltip on touch**: handled by the shared-tooltip.js long-press enhancement. The existing `mousemove` hit-test function is extracted and reused as the hit-test callback for the touch path.

**Hint bar on mobile**: `"Tap Enzyme to React · Long-press for Info · Pinch to Zoom"`.

#### Gerry — Touch Targets + About Panel

**Touch target fixes** via `@media (pointer: coarse)` in `styles.css`:
- `.palette-btn` → 44px
- `.plan-item-btn` → min-height 44px, min-width 44px
- `.map-ctrl-btn` → 44px

**About panel controls**: update the controls array passed to `initAboutPanel()` to include both desktop and mobile instructions. Detect `pointer: coarse` and show the appropriate set.

**Hint bar on mobile**: `"Tap to Paint · Pinch to Zoom · E to Toggle Erase"`.

### Layer 6: Accessibility Fixes

#### Focus trap on overlays

Apply `trapFocus()` from `shared-utils.js` to:
- `shared-about.js` about overlay (all projects)
- `shared-info.js` reference overlay (all projects)
- Shoals: chain overlay, trade dialog, epilogue overlay
- Gerry: plans dialog, election overlay

Each overlay's open function calls `trapFocus(overlayEl)` and stores the cleanup. Close function calls cleanup and restores focus.

#### `aria-modal="true"`

Added to all overlay elements that get focus trapping.

#### Project-specific ARIA

**Geon:**
- Engine tab checkboxes (`#gpu-toggle`, `#barneshut-toggle`): add `role="switch"` and `aria-checked`
- Tab panels: add `aria-labelledby` (handled by shared-tabs.js enhancement)

**Shoals:**
- Chain overlay, trade dialog, epilogue: add `role="dialog"` and `aria-label`
- Chain overlay keyboard navigation: cells already have `tabindex="0"` and `role="button"`. Arrow key nav within `role="grid"` — up/down moves between rows, left/right between call/put columns.

**Cyano:**
- Organism `<select>`: add `aria-label="Organism preset"`

**Gerry:**
- Palette buttons: add `aria-pressed` reflecting active state, updated in `palette.js` when selection changes
- Brush-size buttons: add `aria-pressed` reflecting active state
- Plans dialog: add `role="dialog"` and `aria-label`
- Election overlay close button: add `aria-label="Close"`
- Skip link: change target from `#hex-map` (unfocusable SVG) to `#map-container` with `tabindex="-1"`

## Files Modified

### Shared (affects all projects)
- `shared-base.css` — touch targets, toolbar scroll, toggle accessibility
- `shared-tabs.js` — arrow key nav, `aria-labelledby`
- `shared-about.js` — focus trap, `aria-modal`
- `shared-info.js` — reference overlay focus trap
- `shared-tooltip.js` — long-press touch support
- `shared-utils.js` — `trapFocus()` utility, toast `aria-live`

### Per-project
- `geon/src/ui.js` — shortcuts, hint bar
- `geon/src/input.js` — touch mode toggle, particle selection on touch
- `geon/index.html` — new toggle button, ARIA fixes
- `geon/styles.css` — toggle button styling
- `shoals/main.js` — shortcuts, chart touch binding
- `shoals/src/ui.js` — sell mode toggle, hint bar
- `shoals/src/chain-renderer.js` — respect sell mode on click
- `shoals/src/strategy.js` — touch pan/zoom
- `shoals/index.html` — new toggle button, ARIA fixes
- `cyano/src/ui.js` — shortcuts, hint bar
- `cyano/src/renderer.js` — reverse mode on touch, tooltip hit-test extraction
- `cyano/index.html` — new toggle button, ARIA fixes
- `gerry/main.js` — shortcuts, hint bar
- `gerry/src/palette.js` — `aria-pressed`
- `gerry/index.html` — ARIA fixes, skip link target
- `gerry/styles.css` — touch target overrides
