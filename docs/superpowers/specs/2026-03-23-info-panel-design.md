# Info Panel Design Spec

Add a toolbar "?" button to each simulation project that opens a centered overlay panel with project description, controls, keyboard shortcuts, and AGPL-3.0 copyleft notice.

## New Shared Module: `shared-about.js`

Exposes `initAboutPanel(config)`, consumed by each sim's `main.js`.

### Config Shape

```js
initAboutPanel({
  title: 'Particle Physics',           // panel header
  description: '...',                   // 2-3 sentence overview
  controls: [                           // mouse/touch controls
    { label: 'Pan', value: 'Click + drag' },
    { label: 'Zoom', value: 'Scroll wheel / pinch' }
  ],
  shortcuts: [                          // same array passed to initShortcuts()
    { key: 'Space', label: 'Play / Pause', group: 'Simulation' }
  ],
  repo: 'https://github.com/a9lim/physsim'
})
```

### Return Value

Returns `{ destroy(), show(), hide() }` for programmatic control.

## Toolbar Button

- `.tool-btn` with a `?` SVG icon (circle + question mark, 18×18, stroke style matching existing icons)
- Positioned immediately **left of the sidebar/menu toggle button** in each sim's toolbar
- `aria-label="About"`, `title="About"`

### HTML Addition (per project)

```html
<!-- Added just before the sidebar toggle button -->
<button id="about-btn" class="tool-btn" aria-label="About" title="About">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="2"
       stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
</button>
```

## Panel Structure

Centered overlay (modal) with backdrop dimming, matching the existing `shared-shortcuts.js` overlay pattern. Styled with `.glass` and `backdrop-filter: blur()`.

### Sections (top to bottom)

1. **Header**: Project title (left) + close button (right)
2. **About**: 2-3 sentence description paragraph, followed by a "Controls" sub-section listing mouse/touch interactions
3. **Keyboard Shortcuts**: Grouped by category (reuses the same data and grouping logic from `shared-shortcuts.js`)
4. **Footer**: `AGPL-3.0 · Source on GitHub` — "Source on GitHub" is a link to the project's repo

### DOM Structure

```html
<div class="about-overlay">                    <!-- backdrop -->
  <div class="about-content glass">            <!-- panel -->
    <div class="about-header">
      <h2>{title}</h2>
      <button class="tool-btn about-close" aria-label="Close">✕</button>
    </div>

    <div class="about-section">
      <p class="about-desc">{description}</p>
      <div class="about-group-label">Controls</div>
      <div class="about-controls">
        <!-- control rows: label + value -->
      </div>
    </div>

    <div class="about-section">
      <div class="about-group-label">Keyboard Shortcuts</div>
      <!-- grouped shortcut rows, same as current shortcut overlay -->
    </div>

    <div class="about-footer">
      <span>AGPL-3.0</span>
      <span>·</span>
      <a href="{repo}" target="_blank" rel="noopener">Source on GitHub</a>
    </div>
  </div>
</div>
```

## Behavior

- **Open**: Toolbar `?` button click, or `?` key press
- **Close**: Close button, backdrop click, or Escape key
- **Transition**: Fade in/out (200ms, matching existing overlay transitions)
- **Scroll**: Panel content scrolls if it exceeds viewport height (max-height with overflow-y: auto on `.about-content`)
- **Focus trap**: Not required (simple modal, Escape closes)

## Changes to `shared-shortcuts.js`

Remove the built-in overlay from `shared-shortcuts.js`. The module keeps its keyboard dispatch logic (`onKeyDown`, key mapping, input suppression) but no longer builds or manages the `?` help overlay. The `?` key binding is handled by `shared-about.js` instead.

`initShortcuts()` return value changes from `{ destroy }` to `{ destroy }` (same shape, just no overlay teardown internally).

## CSS (added to `shared-base.css`)

New classes for the about panel:

- `.about-overlay` — fixed fullscreen backdrop (`background: rgba(0,0,0,0.5)`, z-index above toolbar)
- `.about-overlay-visible` — opacity transition for fade-in
- `.about-content` — centered panel, max-width 480px, max-height 85vh, overflow-y auto, `.glass` styling
- `.about-header` — flex row, title + close button
- `.about-section` — padding, border-bottom separator
- `.about-group-label` — small uppercase label (matches `.shortcut-group-label` style)
- `.about-controls` — grid/flex rows for control label + value pairs
- `.about-footer` — bottom section, smaller text, muted color

## Per-Project Config

| Project | Title | Repo |
|---------|-------|------|
| physsim | Particle Physics | github.com/a9lim/physsim |
| finsim | Options Trading | github.com/a9lim/finsim |
| gerry | Redistricting | github.com/a9lim/gerry |
| biosim | Metabolism | github.com/a9lim/biosim |

Each project's `main.js` provides its own description, controls list, and shortcuts array. The shortcuts array is the same one already passed to `initShortcuts()`.

## Files Changed

| File | Change |
|------|--------|
| `shared-about.js` (new) | About panel module |
| `shared-base.css` | Add `.about-*` styles |
| `shared-shortcuts.js` | Remove overlay building, keep keybind dispatch |
| `physsim/index.html` | Add `<script src="/shared-about.js">`, add `#about-btn` to toolbar |
| `finsim/index.html` | Same |
| `gerry/index.html` | Same |
| `biosim/index.html` | Same |
| `physsim/main.js` (or `src/ui.js`) | Call `initAboutPanel()` with project config |
| `finsim/main.js` | Same |
| `gerry/main.js` | Same |
| `biosim/main.js` | Same |

## Loading Order

`shared-about.js` loaded after `shared-shortcuts.js` in each project's `<head>` (it depends on no other shared modules, but logically replaces the shortcut overlay).
