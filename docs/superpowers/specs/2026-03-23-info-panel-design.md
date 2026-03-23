# Info Panel Design Spec

Add a toolbar "?" button to each simulation project that opens a centered overlay panel with project description, controls, keyboard shortcuts, and AGPL-3.0 copyleft notice.

## New Shared Module: `shared-about.js`

Bare function `initAboutPanel(config)` exposed on `window` (same pattern as `initShortcuts`). Consumed by each sim's UI setup code.

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
- `aria-label="About"`, `title="About"`

### Insertion Points (per project)

The `#about-btn` is inserted immediately **before** the sidebar/menu toggle button. The toggle button ID varies:

| Project | Sidebar toggle ID | Insert `#about-btn` before |
|---------|-------------------|---------------------------|
| physsim | `#panelToggle` | `#panelToggle` |
| finsim | `#panel-toggle` | `#panel-toggle` |
| gerry | `#stats-toggle` | `#stats-toggle` |
| biosim | `#menu-btn` | `#menu-btn` |

### HTML

```html
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

Centered overlay (modal) with backdrop dimming. Uses `var(--bg-panel-solid)` background (matching the existing shortcut overlay style, not `.glass`).

### Sections (top to bottom)

1. **Header**: Project title (left) + close button (right, SVG X icon matching existing shortcut overlay close button)
2. **About**: 2-3 sentence description paragraph, followed by a "Controls" sub-section listing mouse/touch interactions
3. **Keyboard Shortcuts**: Grouped by category (reuses the same data and grouping logic from `shared-shortcuts.js`)
4. **Footer**: `AGPL-3.0 · Source on GitHub` — "Source on GitHub" is a link to the project's repo

### DOM Structure

```html
<div class="about-overlay" role="dialog" aria-label="{title}">
  <div class="about-content">
    <div class="about-header">
      <h2>{title}</h2>
      <button class="tool-btn about-close" aria-label="Close">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
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
- **Scroll**: Panel content scrolls if it exceeds viewport height (max-height 85vh with overflow-y: auto on `.about-content`)
- **Mobile**: Stays centered overlay (does not convert to bottom sheet)
- **Focus trap**: Not required (simple modal, Escape closes)

## Key Ownership: `?` and Escape

### Removing `?` from `shared-shortcuts.js`

The `?` key handler in `shared-shortcuts.js` `onKeyDown` (the `e.key === '?'` block and associated `showOverlay`/`hideOverlay`/`buildOverlay` functions) is **removed entirely**. The module retains only keybind dispatch logic: key normalization, `eventToKey`, `isInputFocused`, the `keyMap` lookup, and registered shortcut execution.

### `?` key handling in `shared-about.js`

`shared-about.js` registers its own `keydown` listener on `document`. It intercepts `?` (when no input is focused) to toggle the about panel. This listener is independent of `initShortcuts()`.

### Escape priority

`shared-about.js` registers its `keydown` listener with `{ capture: true }`. When the about panel is open, Escape is intercepted and `stopPropagation()` is called, preventing it from reaching `shared-shortcuts.js` or any project-registered Escape handlers. When the panel is closed, Escape propagates normally to other handlers.

After the refactor, `shared-shortcuts.js`'s Escape handling simplifies: it no longer checks for an overlay variable, and just dispatches to a registered `Escape` shortcut if one exists.

## CSS (added to `shared-base.css`)

New classes for the about panel:

- `.about-overlay` — fixed fullscreen backdrop, `background: var(--backdrop)`, `z-index: 9500` (same as existing shortcut overlay)
- `.about-overlay-visible` — opacity transition for fade-in
- `.about-content` — centered panel, `max-width: 480px`, `max-height: 85vh`, `overflow-y: auto`, `background: var(--bg-panel-solid)`, border and shadow matching `.shortcut-content`
- `.about-header` — flex row, title + close button
- `.about-section` — padding, border-bottom separator
- `.about-group-label` — small uppercase label (matches `.shortcut-group-label` style)
- `.about-controls` — grid/flex rows for control label + value pairs
- `.about-footer` — bottom section, smaller text, muted color

### Dead CSS Cleanup

Remove `.shortcut-overlay`, `.shortcut-content`, `.shortcut-header`, `.shortcut-group`, `.shortcut-group-label`, `.shortcut-row`, `.shortcut-label`, `.shortcut-key`, `.shortcut-close`, `.shortcut-overlay-visible` classes from `shared-base.css` since no code will generate them after the refactor.

## Per-Project Config

| Project | Title | Repo |
|---------|-------|------|
| physsim | Particle Physics | github.com/a9lim/physsim |
| finsim | Options Trading | github.com/a9lim/finsim |
| gerry | Redistricting | github.com/a9lim/gerry |
| biosim | Metabolism | github.com/a9lim/biosim |

## Files Changed

| File | Change |
|------|--------|
| `shared-about.js` (new) | About panel module — bare `initAboutPanel` function on `window` |
| `shared-base.css` | Add `.about-*` styles, remove `.shortcut-*` styles |
| `shared-shortcuts.js` | Remove `?` key handler, overlay building, `showOverlay`/`hideOverlay`/`buildOverlay`/`formatKey` functions. Keep keybind dispatch only. |
| `physsim/index.html` | Add `<script src="/shared-about.js" defer>`, add `#about-btn` before `#panelToggle` |
| `finsim/index.html` | Add `<script src="/shared-about.js">`, add `#about-btn` before `#panel-toggle` |
| `gerry/index.html` | Add `<script src="/shared-about.js">`, add `#about-btn` before `#stats-toggle` |
| `biosim/index.html` | Add `<script src="/shared-about.js">`, add `#about-btn` before `#menu-btn` |
| `physsim/src/ui.js` | Call `initAboutPanel()` with project config |
| `finsim/main.js` | Call `initAboutPanel()` with project config |
| `gerry/main.js` | Call `initAboutPanel()` with project config |
| `biosim/src/ui.js` | Call `initAboutPanel()` with project config |

Note: physsim uses `defer` on its shared script tags; others do not. Match each project's existing pattern.

## Loading Order

`shared-about.js` loaded after `shared-shortcuts.js` in each project's `<head>`. Both register independent `keydown` listeners on `document`; `shared-about.js` uses `{ capture: true }` to take priority for `?` and Escape when the panel is open.
