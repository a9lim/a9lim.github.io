# Info Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toolbar "?" button to each sim that opens a centered overlay with project description, controls, keyboard shortcuts, and AGPL-3.0 copyleft notice.

**Architecture:** New `shared-about.js` module exposes `initAboutPanel(config)` on `window`. It builds a centered modal overlay, registers `?` and Escape key handlers (capture phase), and wires the `#about-btn` click. The existing `shared-shortcuts.js` is stripped of its overlay code — it keeps only keybind dispatch. CSS classes move from `.shortcut-*` to `.about-*` in `shared-base.css`.

**Tech Stack:** Vanilla JS (bare function on `window`), CSS custom properties, no build system.

**Spec:** `docs/superpowers/specs/2026-03-23-info-panel-design.md`

---

### Task 1: Strip overlay from `shared-shortcuts.js`

**Files:**
- Modify: `shared-shortcuts.js`

Remove the overlay UI from `shared-shortcuts.js` while keeping keyboard dispatch intact.

- [ ] **Step 1: Remove overlay-related code**

In `shared-shortcuts.js`, remove:
- Variables: `overlay` (line 23), `overlayEl` (line 24)
- Functions: `buildOverlay` (lines 63–135), `formatKey` (lines 138–145), `showOverlay` (lines 147–156), `hideOverlay` (lines 158–167)
- The `?` key handler block in `onKeyDown` (lines 176–180 — the `if (e.key === '?')` block)
- The overlay check in the Escape handler (lines 184–189 — the `if (overlay)` block). Keep the registered Escape shortcut dispatch (lines 190–195).
- The `hideOverlay()` call inside `destroy()` (line 213)

After removal, `onKeyDown` should be:

```js
function onKeyDown(e) {
    if (e.key === 'Escape') {
        var escEntry = keyMap['escape'];
        if (escEntry && (!escEntry.when || escEntry.when())) {
            e.preventDefault();
            escEntry.action();
        }
        return;
    }

    if (isInputFocused()) return;

    var evKey = eventToKey(e);
    var entry = keyMap[normalizeKey(evKey)];
    if (entry && (!entry.when || entry.when())) {
        e.preventDefault();
        entry.action();
    }
}
```

And the return value should be:

```js
return {
    destroy: function() {
        document.removeEventListener('keydown', onKeyDown);
    }
};
```

- [ ] **Step 2: Verify no references to removed code remain**

Search `shared-shortcuts.js` for: `overlay`, `buildOverlay`, `formatKey`, `showOverlay`, `hideOverlay`. None should remain.

- [ ] **Step 3: Commit**

```bash
git add shared-shortcuts.js
git commit -m "refactor: strip overlay UI from shared-shortcuts.js, keep keybind dispatch"
```

---

### Task 2: Replace `.shortcut-*` CSS with `.about-*` CSS in `shared-base.css`

**Files:**
- Modify: `shared-base.css` (lines 967–1055)

Replace the shortcut overlay styles with about panel styles. The new styles are structurally similar but cover additional sections (description, controls, footer).

- [ ] **Step 1: Replace the shortcut CSS block**

Replace lines 967–1055 (the entire `/* ─── Shortcut Overlay ─── */` section) with:

```css
/* ─── About Overlay ─── */
.about-overlay {
    position: fixed;
    inset: 0;
    z-index: 9500;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--backdrop);
    opacity: 0;
    transition: opacity 0.2s var(--ease-out);
    pointer-events: none;
}

.about-overlay-visible {
    opacity: 1;
    pointer-events: auto;
}

.about-content {
    background: var(--bg-panel-solid);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: 24px 28px;
    max-width: 480px;
    width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
}

.about-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
}

.about-header h2 {
    font-family: var(--font-body);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
}

.about-desc {
    font-size: 0.88rem;
    line-height: 1.55;
    color: var(--text-secondary);
    margin: 0 0 16px;
}

.about-section {
    padding-bottom: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--border);
}

.about-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.about-group-label {
    font-family: var(--font-body);
    font-weight: 600;
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
}

.about-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 0;
}

.about-label {
    font-size: 0.82rem;
    color: var(--text-secondary);
}

.about-key {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--border-strong);
    background: var(--bg-hover);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    color: var(--text);
    min-width: 24px;
    text-align: center;
    white-space: nowrap;
}

.about-value {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--text);
}

.about-footer {
    padding-top: 12px;
    margin-top: 4px;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--text-muted);
    text-align: center;
}

.about-footer a {
    color: var(--accent);
    text-decoration: none;
}

.about-footer a:hover {
    text-decoration: underline;
}
```

- [ ] **Step 2: Commit**

```bash
git add shared-base.css
git commit -m "style: replace .shortcut-* CSS with .about-* panel styles"
```

---

### Task 3: Create `shared-about.js`

**Files:**
- Create: `shared-about.js`

This is the core module. It exposes `initAboutPanel(config)` on `window` as a bare function (same pattern as `initShortcuts`).

- [ ] **Step 1: Write `shared-about.js`**

Create `shared-about.js` at the repo root. The module:
- Defines `initAboutPanel(config)` on `window`
- Builds a centered modal overlay with: header (title + close button), description + controls section, keyboard shortcuts section (grouped), AGPL footer with GitHub link
- Registers a `keydown` listener with `{ capture: true }` for `?` (toggle) and Escape (close, with `stopPropagation`)
- Wires `#about-btn` click handler
- Returns `{ show, hide, destroy }`

Key implementation details:
- The overlay root element (`.about-overlay`) must have `role="dialog"` and `aria-label` set to `config.title || 'About'`
- Close button: class `tool-btn about-close`, with an SVG X icon built via `document.createElementNS` (two `<line>` elements matching `shared-shortcuts.js` line 80). Do NOT use innerHTML for the SVG — build it with DOM methods.
- Controls section: wrap in a container, each control rendered as `.about-row` containing `.about-label` (span, `textContent = control.label`) + `.about-value` (span, `textContent = control.value`)
- Shortcuts section: each shortcut rendered as `.about-row` containing `.about-label` (span) + `.about-key` (kbd element)
- `formatKey()` function (moved from `shared-shortcuts.js`): formats key strings for display (e.g. "ctrl+z" → "Ctrl + Z", "space" → "Space")
- Shortcut grouping logic: preserves registration order within each group (same algorithm as the removed `buildOverlay` in `shared-shortcuts.js`)
- `isAboutInputFocused()` helper: returns true if focus is in INPUT/TEXTAREA/SELECT/contentEditable (suppresses `?` key in form fields)
- Overlay DOM is built once and cached (`overlayEl`), reattached on each `show()`
- Fade transition: add `about-overlay-visible` class via `requestAnimationFrame` after appending to body; remove class then `removeChild` after 200ms timeout on hide

- [ ] **Step 2: Commit**

```bash
git add shared-about.js
git commit -m "feat: add shared-about.js — about/help overlay panel module"
```

---

### Task 4: Integrate into physsim

**Files:**
- Modify: `physsim/index.html` (lines ~30-45 for script tag, line ~187 for toolbar button)
- Modify: `physsim/src/ui.js` (lines ~552-587 for `initAboutPanel` call)

- [ ] **Step 1: Add `#about-btn` to toolbar in `physsim/index.html`**

Insert immediately before the `#panelToggle` button (line 187):

```html
<button id="about-btn" class="tool-btn" aria-label="About" title="About">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
</button>
```

- [ ] **Step 2: Add `shared-about.js` script tag in `physsim/index.html`**

Add after the `shared-shortcuts.js` script tag (line ~43), using `defer` to match physsim's pattern:

```html
<script defer src="/shared-about.js"></script>
```

- [ ] **Step 3: Call `initAboutPanel()` in `physsim/src/ui.js`**

After the existing `initShortcuts()` call (line ~586), add:

```js
if (typeof initAboutPanel === 'function') {
    initAboutPanel({
        title: 'Particle Physics',
        description: 'N-body particle simulator with Boris integration, Barnes-Hut tree acceleration, and scalar field support. Explore gravitational, electromagnetic, and exotic physics scenarios across 19 presets.',
        controls: [
            { label: 'Pan', value: 'Click + drag' },
            { label: 'Zoom', value: 'Scroll wheel / pinch' },
            { label: 'Add particle', value: 'Click on canvas' },
            { label: 'Fling particle', value: 'Click + drag + release' },
        ],
        shortcuts: shortcuts,
        repo: 'https://github.com/a9lim/physsim',
    });
}
```

Note: `shortcuts` refers to the array already defined above the `initShortcuts` call in `ui.js`.

- [ ] **Step 4: Test in browser**

Open physsim in the browser. Verify:
- `?` button appears left of the settings toggle
- Clicking it opens the about overlay
- Pressing `?` key opens/closes it
- Escape closes it
- Backdrop click closes it
- All shortcuts are listed and grouped
- Footer shows AGPL-3.0 with GitHub link
- Existing keyboard shortcuts still work when panel is closed

- [ ] **Step 5: Commit**

```bash
git add physsim/index.html physsim/src/ui.js
git commit -m "feat(physsim): add about/info panel to toolbar"
```

---

### Task 5: Integrate into finsim

**Files:**
- Modify: `finsim/index.html` (lines ~31-45 for script tag, line ~196 for toolbar button)
- Modify: `finsim/main.js` (lines ~229-251 for `initAboutPanel` call)

- [ ] **Step 1: Add `#about-btn` to toolbar in `finsim/index.html`**

Insert immediately before `#panel-toggle` (line 196):

```html
<button id="about-btn" class="tool-btn" aria-label="About" title="About">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
</button>
```

- [ ] **Step 2: Add `shared-about.js` script tag in `finsim/index.html`**

Add after `shared-shortcuts.js` (no `defer`, matching finsim's pattern):

```html
<script src="/shared-about.js"></script>
```

- [ ] **Step 3: Call `initAboutPanel()` in `finsim/main.js`**

The shortcuts array in finsim is currently inline inside the `initShortcuts` call. Extract it into a named variable, then pass to both. Change lines 229-251:

```js
var _shortcuts = [
    { key: ' ',  label: 'Play / Pause', group: 'Simulation', action: () => togglePlay() },
    { key: '.', label: 'Step forward',  group: 'Simulation', action: () => step() },
    { key: 's', label: 'Strategy view',  group: 'View',       action: () => {
        if (!$.sidebar.classList.contains('open')) {
            _toolbar.toggleSidebar($.panelToggle, $.sidebar);
        }
        const tab = document.querySelector('[data-tab="strategy"]');
        if (tab) tab.click();
    } },
    { key: 'b', label: 'Buy stock',      group: 'Trade',      action: () => handleBuyStock() },
    { key: 't', label: 'Toggle sidebar',  group: 'View',       action: () => { _toolbar.toggleSidebar($.panelToggle, $.sidebar); if (typeof _haptics !== 'undefined') _haptics.trigger('light'); } },
    { key: 'r', label: 'Reset',           group: 'Simulation', action: () => resetSim() },
    { key: '1', label: PRESETS[0].name,   group: 'Presets',    action: () => loadPreset(0) },
    { key: '2', label: PRESETS[1].name,   group: 'Presets',    action: () => loadPreset(1) },
    { key: '3', label: PRESETS[2].name,   group: 'Presets',    action: () => loadPreset(2) },
    { key: '4', label: PRESETS[3].name,   group: 'Presets',    action: () => loadPreset(3) },
    { key: '5', label: PRESETS[4].name,   group: 'Presets',    action: () => loadPreset(4) },
    { key: '6', label: PRESETS[5].name,   group: 'Presets',    action: () => loadPreset(5) },
    { key: '7', label: PRESETS[6].name,   group: 'Presets',    action: () => loadPreset(6) },
];

if (typeof initShortcuts !== 'undefined') {
    initShortcuts(_shortcuts, { helpTitle: 'Shoals Keyboard Shortcuts' });
}

if (typeof initAboutPanel === 'function') {
    initAboutPanel({
        title: 'Options Trading',
        description: 'Options trading simulator with GBM, Merton jump-diffusion, and Heston stochastic volatility stock models. Build strategies with CRR binomial tree pricing and navigate narrative-driven market events.',
        controls: [
            { label: 'Buy stock', value: 'Click Buy button' },
            { label: 'Place option', value: 'Configure in Strategy tab' },
        ],
        shortcuts: _shortcuts,
        repo: 'https://github.com/a9lim/finsim',
    });
}
```

- [ ] **Step 4: Test in browser**

Same verification as Task 4 step 4, but for finsim.

- [ ] **Step 5: Commit**

```bash
git add finsim/index.html finsim/main.js
git commit -m "feat(finsim): add about/info panel to toolbar"
```

---

### Task 6: Integrate into gerry

**Files:**
- Modify: `gerry/index.html` (lines ~25-38 for script tag, line ~257 for toolbar button)
- Modify: `gerry/main.js` (lines ~359-390 for `initAboutPanel` call)

- [ ] **Step 1: Add `#about-btn` to toolbar in `gerry/index.html`**

Insert immediately before `#stats-toggle` (line 257):

```html
<button id="about-btn" class="tool-btn" aria-label="About" title="About">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
</button>
```

- [ ] **Step 2: Add `shared-about.js` script tag in `gerry/index.html`**

Add after `shared-shortcuts.js` (no `defer`, matching gerry's pattern):

```html
<script src="/shared-about.js"></script>
```

- [ ] **Step 3: Call `initAboutPanel()` in `gerry/main.js`**

After the existing `initShortcuts()` call (around line 390), add:

```js
if (typeof initAboutPanel === 'function') {
    initAboutPanel({
        title: 'Redistricting',
        description: 'Redistricting and gerrymandering simulator on a procedural hex-tile map. Assign hexes to 10 districts across 3 parties, then analyze fairness metrics or run Monte Carlo election simulations.',
        controls: [
            { label: 'Assign hex', value: 'Click on hex' },
            { label: 'Erase hex', value: 'E then click' },
            { label: 'Pan', value: 'Click + drag on empty space' },
            { label: 'Zoom', value: 'Scroll wheel / pinch' },
        ],
        shortcuts: shortcuts,
        repo: 'https://github.com/a9lim/gerry',
    });
}
```

- [ ] **Step 4: Test in browser**

Same verification as Task 4 step 4, but for gerry.

- [ ] **Step 5: Commit**

```bash
git add gerry/index.html gerry/main.js
git commit -m "feat(gerry): add about/info panel to toolbar"
```

---

### Task 7: Integrate into biosim

**Files:**
- Modify: `biosim/index.html` (lines ~32-46 for script tag, line ~171 for toolbar button)
- Modify: `biosim/src/ui.js` (lines ~181-214 for `initAboutPanel` call)

- [ ] **Step 1: Add `#about-btn` to toolbar in `biosim/index.html`**

Insert immediately before `#menu-btn` (line 171):

```html
<button id="about-btn" class="tool-btn" aria-label="About" title="About">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
</button>
```

- [ ] **Step 2: Add `shared-about.js` script tag in `biosim/index.html`**

Add after `shared-shortcuts.js` (no `defer`, matching biosim's pattern):

```html
<script src="/shared-about.js"></script>
```

- [ ] **Step 3: Call `initAboutPanel()` in `biosim/src/ui.js`**

After the existing `initShortcuts()` call (around line 214), add:

```js
if (typeof initAboutPanel === 'function') {
    initAboutPanel({
        title: 'Metabolism',
        description: 'Cellular metabolism simulator with 12 biochemical pathways, 14 electron transport chain complexes, and allosteric regulation. Visualize ATP production, ROS dynamics, and photosynthesis across 5 organism presets.',
        controls: [
            { label: 'Step simulation', value: 'Click Step button' },
            { label: 'Toggle pathway', value: 'Click pathway toggle in sidebar' },
        ],
        shortcuts: shortcuts,
        repo: 'https://github.com/a9lim/biosim',
    });
}
```

- [ ] **Step 4: Test in browser**

Same verification as Task 4 step 4, but for biosim.

- [ ] **Step 5: Commit**

```bash
git add biosim/index.html biosim/src/ui.js
git commit -m "feat(biosim): add about/info panel to toolbar"
```

---

### Task 8: Cross-project smoke test

No files changed — verification only.

- [ ] **Step 1: Test all four sims**

Open each sim in the browser and verify:
1. `?` button visible in toolbar, left of menu button
2. Click opens about panel with correct title, description, controls, shortcuts, footer
3. `?` key toggles the panel
4. Escape closes the panel (and does NOT trigger other Escape handlers like "close sidebar")
5. Backdrop click closes the panel
6. All previously-registered keyboard shortcuts still work when panel is closed
7. Theme toggle works while panel is open/closed
8. Mobile viewport (<=900px): panel is centered and scrollable, not a bottom sheet

- [ ] **Step 2: Verify no console errors**

Check browser dev console on each sim for JS errors or warnings.
