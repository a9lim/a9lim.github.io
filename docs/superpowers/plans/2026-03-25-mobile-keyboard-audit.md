# Mobile & Keyboard Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 19 categories of mobile, keyboard, and accessibility issues across all four simulation projects and shared infrastructure.

**Architecture:** Work in layers — shared CSS first, shared JS second, then keyboard shortcuts and project-specific mobile/touch fixes. Each layer is independently committable. Shared code is touched exactly once; project code consumes shared changes.

**Tech Stack:** Vanilla JS, CSS, HTML. No build step. Shared files loaded as plain `<script>` / `<link>` tags.

**Spec:** `docs/superpowers/specs/2026-03-25-mobile-keyboard-audit-design.md`

**Prerequisites:**
```bash
git submodule update --init --recursive
```
All submodule line numbers below are approximate — always `Read` the file first to locate exact insertion points.

---

### Task 1: Shared CSS — Touch Targets, Toolbar Scroll, Toggle Accessibility

**Files:**
- Modify: `shared-base.css:1405` (toggle input visibility)
- Modify: `shared-base.css` (add `@media (pointer: coarse)` block at end)

- [ ] **Step 1: Fix toggle accessibility**

In `shared-base.css`, replace:
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

- [ ] **Step 2: Add `@media (pointer: coarse)` block**

Append to the end of `shared-base.css` (before any existing `@media` that might follow, or at the very end):
```css
/* ─── Touch Device Overrides ─── */
@media (pointer: coarse) {
  .tool-btn { width: 44px; height: 44px; }
  .info-trigger { min-width: 32px; min-height: 32px; padding: 8px; }
  .tab-btn { min-height: 44px; }
  .mode-btn { min-height: 44px; }

  .sim-toolbar-actions {
    overflow-x: auto;
    scrollbar-width: none;
  }
  .sim-toolbar-actions::-webkit-scrollbar { display: none; }
}
```

- [ ] **Step 3: Verify in browser**

Open each project on a mobile device or via Chrome DevTools device emulation (toggle "touch" pointer). Confirm:
- Toolbar buttons are 44px
- Toolbar scrolls horizontally when buttons exceed viewport width
- Toggle switches are focusable via Tab key
- `:focus-visible` outline appears on toggles when tabbed to

- [ ] **Step 4: Commit**

```bash
git add shared-base.css
git commit -m "fix: touch targets 44px, toolbar scroll, toggle keyboard focus"
```

---

### Task 2: Shared JS — `trapFocus()` Utility and Toast `aria-live`

**Files:**
- Modify: `shared-utils.js:187-205` (showToast)
- Modify: `shared-utils.js` (add `trapFocus` function)

- [ ] **Step 1: Add `trapFocus()` to `shared-utils.js`**

Add before the `showToast` function:
```js
/**
 * Trap keyboard focus within an overlay element.
 * @param {HTMLElement} overlayEl  The overlay container
 * @returns {Function} Cleanup function that removes the trap
 */
function trapFocus(overlayEl) {
    var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function _handler(e) {
        if (e.key !== 'Tab') return;
        var focusable = Array.from(overlayEl.querySelectorAll(FOCUSABLE)).filter(function(el) {
            return el.offsetParent !== null; // visible only
        });
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
    }
    overlayEl.addEventListener('keydown', _handler);
    return function() { overlayEl.removeEventListener('keydown', _handler); };
}
```

- [ ] **Step 2: Add `role="status"` to toast container**

In the `showToast` function, after the container is created (line ~193), add:
```js
container.setAttribute('role', 'status');
```

So the block reads:
```js
if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'status');
    document.body.appendChild(container);
}
```

- [ ] **Step 3: Verify**

Open any project, Tab through toggles to confirm focus works. Call `showToast('test')` in console and verify the container has `role="status"`.

- [ ] **Step 4: Commit**

```bash
git add shared-utils.js
git commit -m "feat: add trapFocus() utility and toast aria-live"
```

---

### Task 3: Shared JS — `shared-tabs.js` Arrow Key Navigation

**Files:**
- Modify: `shared-tabs.js` (entire file, 27 lines)

- [ ] **Step 1: Add arrow key navigation and `aria-labelledby`**

Replace the entire `shared-tabs.js` with:
```js
// shared-tabs.js — Tab switching for sidebar panels.
// Loaded as a plain <script> (not a module) so tabs work even if the main module fails.
(function () {
    var btns = document.querySelectorAll('.tab-btn');
    var activeBtn = null;
    var activePanel = null;

    // Assign IDs and aria-labelledby
    btns.forEach(function (btn, i) {
        if (!btn.id) btn.id = 'tab-' + (btn.dataset.tab || i);
        var panel = document.getElementById('tab-' + btn.dataset.tab);
        if (panel) panel.setAttribute('aria-labelledby', btn.id);
    });

    // Find initial active state
    for (var i = 0; i < btns.length; i++) {
        if (btns[i].classList.contains('active')) { activeBtn = btns[i]; break; }
    }
    if (activeBtn) activePanel = document.getElementById('tab-' + activeBtn.dataset.tab);

    function activate(btn) {
        if (btn === activeBtn) return;
        if (activeBtn) { activeBtn.classList.remove('active'); activeBtn.setAttribute('aria-selected', 'false'); activeBtn.setAttribute('tabindex', '-1'); }
        if (activePanel) activePanel.classList.remove('active');
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        btn.setAttribute('tabindex', '0');
        btn.focus();
        if (typeof _haptics !== 'undefined') _haptics.trigger('selection');
        var target = document.getElementById('tab-' + btn.dataset.tab);
        if (target) target.classList.add('active');
        activeBtn = btn;
        activePanel = target;
    }

    // Set initial tabindex: only active tab is in tab order
    btns.forEach(function (btn) {
        btn.setAttribute('tabindex', btn === activeBtn ? '0' : '-1');
    });

    btns.forEach(function (btn) {
        btn.addEventListener('click', function () { activate(btn); });
    });

    // Arrow key navigation within tablist
    btns.forEach(function (btn, idx) {
        btn.addEventListener('keydown', function (e) {
            var target = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                target = btns[(idx + 1) % btns.length];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                target = btns[(idx - 1 + btns.length) % btns.length];
            } else if (e.key === 'Home') {
                target = btns[0];
            } else if (e.key === 'End') {
                target = btns[btns.length - 1];
            }
            if (target) { e.preventDefault(); activate(target); }
        });
    });
})();
```

- [ ] **Step 2: Verify**

Open any project with a sidebar. Tab to a tab button, then use Arrow keys to switch tabs. Confirm focus moves and the panel switches. Confirm `aria-labelledby` is set on tab panels.

- [ ] **Step 3: Commit**

```bash
git add shared-tabs.js
git commit -m "feat: arrow key navigation and aria-labelledby in shared-tabs"
```

---

### Task 4: Shared JS — `shared-about.js` Focus Trap

**Files:**
- Modify: `shared-about.js:74-78` (buildOverlay — add aria-modal)
- Modify: `shared-about.js` (show/hide — add focus trap)

- [ ] **Step 1: Add `aria-modal` to overlay**

In `buildOverlay()`, after line 78 (`overlay.setAttribute('aria-label', ...)`), add:
```js
overlay.setAttribute('aria-modal', 'true');
```

- [ ] **Step 2: Add focus trap to show/hide**

Find the `show()` and `hide()` functions. Add a module-level variable and modify them:

Add near the top of the `initAboutPanel` closure (before `buildOverlay`):
```js
var _previousFocus = null;
var _trapCleanup = null;
```

In `show()` — after the overlay is appended to the body / made visible:
```js
_previousFocus = document.activeElement;
// Focus the close button after a frame (allows CSS transition to start)
requestAnimationFrame(function() {
    var closeBtn = overlay.querySelector('.about-close');
    if (closeBtn) closeBtn.focus();
});
if (typeof trapFocus === 'function') _trapCleanup = trapFocus(overlay);
```

In `hide()` — before the overlay is removed:
```js
if (_trapCleanup) { _trapCleanup(); _trapCleanup = null; }
if (_previousFocus) { _previousFocus.focus(); _previousFocus = null; }
```

- [ ] **Step 3: Verify**

Open any project, press `?` to open about panel. Confirm:
- Close button receives focus
- Tab cycles within the panel only
- Escape closes and returns focus to the previous element
- `aria-modal="true"` is on the overlay

- [ ] **Step 4: Commit**

```bash
git add shared-about.js
git commit -m "feat: focus trap and aria-modal in about panel"
```

---

### Task 5: Shared JS — `shared-info.js` Reference Overlay Focus Trap

**Files:**
- Modify: `shared-info.js` (openReference / dismiss functions)

- [ ] **Step 1: Read the file to locate openReference and dismiss**

Read `shared-info.js` and find the reference overlay open/close functions.

- [ ] **Step 2: Add focus trap**

Add module-level variables for `_refPreviousFocus` and `_refTrapCleanup`. In the function that opens the reference overlay (sets `hidden = false`):
```js
_refPreviousFocus = document.activeElement;
overlayEl.setAttribute('aria-modal', 'true');
if (typeof trapFocus === 'function') _refTrapCleanup = trapFocus(overlayEl);
// Focus the close button
var closeBtn = overlayEl.querySelector('.ref-close') || overlayEl.querySelector('button');
if (closeBtn) closeBtn.focus();
```

The dismiss is handled internally by `initOverlayDismiss()` from `shared-utils.js`, which is not directly modifiable from `shared-info.js`. Use a `MutationObserver` on the `hidden` attribute to detect close:
```js
var _refObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
        if (m.attributeName === 'hidden' && overlayEl.hidden) {
            if (_refTrapCleanup) { _refTrapCleanup(); _refTrapCleanup = null; }
            overlayEl.removeAttribute('aria-modal');
            if (_refPreviousFocus) { _refPreviousFocus.focus(); _refPreviousFocus = null; }
        }
    });
});
_refObserver.observe(overlayEl, { attributes: true, attributeFilter: ['hidden'] });
```
Place this observer setup once, after `initReferenceOverlay` creates the overlay element.

- [ ] **Step 3: Verify**

Open any project, long-press an info trigger to open the reference overlay. Confirm focus is trapped and restored on close.

- [ ] **Step 4: Commit**

```bash
git add shared-info.js
git commit -m "feat: focus trap and aria-modal in reference overlay"
```

---

### Task 6: Shared JS — `shared-tooltip.js` Long-Press Touch Support

**Files:**
- Modify: `shared-tooltip.js` (add `bindTooltipTouch` function)

- [ ] **Step 1: Add `bindTooltipTouch` function**

Append after the existing `createSimTooltip` function:
```js
/**
 * Bind long-press touch to show a tooltip via a project-specific hit-test.
 *
 * @param {HTMLElement} el         Element to listen on (canvas or container)
 * @param {Function}    hitTestFn  (clientX, clientY) => { text, screenX, screenY } | null
 * @param {{ show, hide }} tooltip Tooltip instance from createSimTooltip()
 * @returns {Function} Cleanup function
 */
function bindTooltipTouch(el, hitTestFn, tooltip) {
    var HOLD_MS = 400;
    var MOVE_THRESHOLD = 8;
    var DISMISS_MS = 3000;
    var timer = null;
    var dismissTimer = null;
    var startX = 0, startY = 0;

    function clearTimers() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; }
    }

    function onStart(e) {
        if (e.touches.length !== 1) { clearTimers(); return; }
        var t = e.touches[0];
        startX = t.clientX;
        startY = t.clientY;
        clearTimers();
        timer = setTimeout(function () {
            timer = null;
            var hit = hitTestFn(t.clientX, t.clientY);
            if (hit) {
                tooltip.show(hit.screenX || t.clientX, hit.screenY || t.clientY, hit.text);
                dismissTimer = setTimeout(function () { tooltip.hide(); }, DISMISS_MS);
            }
        }, HOLD_MS);
    }

    function onMove(e) {
        if (!timer) return;
        var t = e.touches[0];
        var dx = t.clientX - startX, dy = t.clientY - startY;
        if (dx * dx + dy * dy > MOVE_THRESHOLD * MOVE_THRESHOLD) clearTimers();
    }

    function onEnd() {
        if (timer) { clearTimeout(timer); timer = null; }
        // dismissTimer left running — tooltip fades after DISMISS_MS
    }

    function onStartDismiss(e) {
        if (tooltip.el.classList.contains('visible') && e.target !== el && !el.contains(e.target)) {
            tooltip.hide();
            if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; }
        }
    }

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    // Dismiss on next touch outside the element
    document.addEventListener('touchstart', onStartDismiss, { passive: true });

    return function () {
        el.removeEventListener('touchstart', onStart);
        el.removeEventListener('touchmove', onMove);
        el.removeEventListener('touchend', onEnd);
        document.removeEventListener('touchstart', onStartDismiss);
        clearTimers();
    };
}
```

- [ ] **Step 2: Verify**

Open cyano or shoals on a touch device. Long-press on a canvas element (enzyme in cyano, chart in shoals). Confirm tooltip appears after 400ms and dismisses after 3 seconds or on next touch.

- [ ] **Step 3: Commit**

```bash
git add shared-tooltip.js
git commit -m "feat: bindTooltipTouch for long-press tooltip on touch devices"
```

---

### Task 7: Geon — Universal + Project Shortcuts

**Files:**
- Modify: `geon/src/ui.js:552-587` (shortcut registration)

- [ ] **Step 1: Read `geon/src/ui.js` shortcut section**

Read lines 540-600 to understand the current shortcut structure and the `initAboutPanel` config.

- [ ] **Step 2: Update shortcuts array**

Replace the existing shortcuts array with the updated version. Key changes:
- Ensure `Space` → play/pause is present
- `.` → speed up (was step forward)
- Add `/` → step forward
- Add `,` → speed down
- Add `R` → reset (if not already present, verify)
- Add `[` → previous tab, `]` → next tab
- Add `=` → zoom in, `-` → zoom out, `0` → reset zoom
- Add `X` → toggle antimatter mode
- Fix `Ctrl+S/L/Shift+S/Shift+L` — wire to actual save/load handler functions instead of `() => {}`
- `Escape` should close sidebar if open (verify if already handled by existing `Escape` binding or add)

For `[`/`]` tab switching, call the same `activate()` logic as `shared-tabs.js` — find the `.tab-btn` elements, determine the current active index, and activate the next/previous. Use a helper:
```js
function cycleTab(dir) {
    var btns = document.querySelectorAll('.tab-btn');
    var idx = 0;
    btns.forEach(function(b, i) { if (b.classList.contains('active')) idx = i; });
    var next = (idx + dir + btns.length) % btns.length;
    btns[next].click();
}
```

For `=`/`-`/`0` zoom, call the same functions as the zoom buttons: `camera.zoomBy(1.25, ...)` for in, `camera.zoomBy(0.8, ...)` for out, and the reset-zoom handler.

- [ ] **Step 3: Update `initAboutPanel` config**

Update the shortcuts list in the about panel config to reflect all new/changed bindings.

- [ ] **Step 4: Verify**

Open geon, test each shortcut. Confirm `.` speeds up, `/` steps, `,` slows down, `[`/`]` switch tabs, `=`/`-`/`0` zoom, `X` toggles mode (after Task 9 adds the toggle state).

- [ ] **Step 5: Commit**

```bash
git add geon/src/ui.js
git commit -m "feat(geon): universal + project-specific keyboard shortcuts"
```

---

### Task 8: Shoals — Universal + Project Shortcuts

**Files:**
- Modify: `shoals/main.js:242-262` (shortcut registration)

- [ ] **Step 1: Read `shoals/main.js` shortcut section**

Read lines 230-280 to understand current structure.

- [ ] **Step 2: Update shortcuts array**

Key changes:
- Ensure `Space` → play/pause is present
- `.` → speed up (was step forward)
- Add `/` → step forward one day
- Add `,` → speed down
- `S` → plain sidebar toggle (remove strategy-tab-specific behavior)
- Add `R` → reset simulation
- Add `[` → previous tab, `]` → next tab
- Add `=` → zoom in, `-` → zoom out, `0` → reset zoom
- Add `X` → toggle buy/sell mode
- Add `B` → buy/sell stock (respects X toggle)
- Add `N` → buy/sell bond (respects X toggle)
- Add `O` → open full chain overlay
- Add `Enter` → execute saved strategy (when Strategy tab active)
- `Escape` should close sidebar if open (verify if already handled or add)
- Fix save/load shortcuts if applicable

Use the same `cycleTab(dir)` helper pattern as geon.

For zoom, call chart camera's zoom methods.

- [ ] **Step 3: Update `initAboutPanel` config**

Update the shortcuts and controls lists to reflect all new bindings.

- [ ] **Step 4: Verify**

Test each shortcut in shoals. Confirm `S` now does plain sidebar toggle (not strategy view).

- [ ] **Step 5: Commit**

```bash
git add shoals/main.js
git commit -m "feat(shoals): universal + project-specific keyboard shortcuts"
```

---

### Task 9: Cyano — Universal + Project Shortcuts

**Files:**
- Modify: `cyano/src/ui.js:181-210` (shortcut registration)

- [ ] **Step 1: Read `cyano/src/ui.js` shortcut section**

Read lines 170-230.

- [ ] **Step 2: Update shortcuts array**

Key changes:
- Ensure `Space` → play/pause is present
- Add `,` → speed down, `.` → speed up
- Add `R` → reset
- Add `[` → previous tab, `]` → next tab
- Add `=` → zoom in, `-` → zoom out, `0` → reset zoom
- Add `U` → toggle uncoupling
- Add `X` → toggle forward/reverse mode
- `Escape` should close sidebar if open (verify if already handled or add)

- [ ] **Step 3: Update `initAboutPanel` config**

- [ ] **Step 4: Verify and commit**

```bash
git add cyano/src/ui.js
git commit -m "feat(cyano): universal + project-specific keyboard shortcuts"
```

---

### Task 10: Gerry — Universal + Project Shortcuts

**Files:**
- Modify: `gerry/main.js:354-383` (shortcut registration)

- [ ] **Step 1: Read `gerry/main.js` shortcut section**

Read lines 340-410.

- [ ] **Step 2: Update shortcuts array**

Key changes:
- Unbind `0` from district 10 (district 10 has no keyboard shortcut after this change; it remains accessible via the palette buttons at the bottom of the screen)
- Add `R` → reset districts (call `#reset-btn` handler)
- `Escape` should close sidebar if open (verify if already handled or add)
- Add `[` → previous tab, `]` → next tab
- Add `=` → zoom in, `-` → zoom out, `0` → reset zoom
- Add `G` → auto-gerrymander
- Add `F` → fair draw
- Add `M` → Monte Carlo simulate
- Add `P` → toggle pan mode
- Add `B` → cycle brush size
- Add `Ctrl+Shift+Z` → redo

`Space` is not bound (gerry has no play/pause). `,`/`.` are not bound (no speed control).

- [ ] **Step 3: Update `initAboutPanel` config**

- [ ] **Step 4: Verify and commit**

```bash
git add gerry/main.js
git commit -m "feat(gerry): universal + project-specific keyboard shortcuts"
```

---

### Task 11: Geon — Antimatter/Delete Toggle + Touch Fix

**Files:**
- Modify: `geon/index.html` (add toggle button to toolbar)
- Modify: `geon/src/input.js` (touch behavior, hit-test before spawn)
- Modify: `geon/src/ui.js` (antimatterMode state, button wiring, hint bar)
- Modify: `geon/styles.css` (toggle button styling if needed)

- [ ] **Step 1: Add toggle button to toolbar HTML**

In `geon/index.html`, find the toolbar actions area. Add a button after the reset button:
```html
<button id="mode-btn" class="tool-btn" aria-label="Toggle antimatter mode" aria-pressed="false" title="Toggle antimatter mode">
    <!-- SVG icon: a circle with +/- or matter/antimatter symbol -->
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="9"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
</button>
```

The icon shows a circle with a horizontal line (minus = matter). When toggled, JS swaps to a circle with a cross (plus = antimatter).

- [ ] **Step 2: Add antimatterMode state and button wiring in `ui.js`**

Add to the DOM cache and state:
```js
$.modeBtn = document.getElementById('mode-btn');
let antimatterMode = false;
```

Wire the button:
```js
$.modeBtn.addEventListener('click', () => {
    antimatterMode = !antimatterMode;
    $.modeBtn.setAttribute('aria-pressed', String(antimatterMode));
    $.modeBtn.title = antimatterMode ? 'Antimatter mode (X to toggle)' : 'Normal mode (X to toggle)';
    // Update icon SVG
    const line = $.modeBtn.querySelector('line');
    if (antimatterMode) {
        // Add vertical line for "+" (antimatter)
        if (!$.modeBtn.querySelector('.vert-line')) {
            const svg = $.modeBtn.querySelector('svg');
            const vl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            vl.setAttribute('x1', '12'); vl.setAttribute('y1', '8');
            vl.setAttribute('x2', '12'); vl.setAttribute('y2', '16');
            vl.setAttribute('stroke', 'currentColor'); vl.setAttribute('stroke-width', '2');
            vl.classList.add('vert-line');
            svg.appendChild(vl);
        }
    } else {
        const vl = $.modeBtn.querySelector('.vert-line');
        if (vl) vl.remove();
    }
});
```

Export `antimatterMode` getter so `input.js` can read it (or use a shared state object).

Wire the `X` shortcut to click the mode button:
```js
{ key: 'X', label: 'Toggle antimatter mode', group: 'Tools', action: () => $.modeBtn.click() }
```

- [ ] **Step 3: Update hint bar for mobile**

In `ui.js`, find where `#hint-bar` text is set. Add:
```js
if (window.matchMedia('(pointer: coarse)').matches) {
    $.hintBar.textContent = 'Tap to Spawn · Pinch to Zoom · X to Toggle Mode';
}
```

- [ ] **Step 4: Modify `input.js` touch behavior**

Read `geon/src/input.js` `onTouchEnd` handler. Replace the unconditional `spawnParticle()` call with:

1. Hit-test the touch position against existing particles
2. If a particle is hit:
   - `antimatterMode === false` → select it (show Particle tab)
   - `antimatterMode === true` and particle is matter → delete it
   - `antimatterMode === true` and particle is antimatter → select it
3. If no particle hit:
   - `antimatterMode === false` → spawn normal particle
   - `antimatterMode === true` → spawn antimatter particle

The hit-test can reuse the deferred GPU click path (`_pendingClick`) or use CPU-side distance check against particle positions.

- [ ] **Step 5: Verify**

Open geon on mobile (or touch emulation). Confirm:
- Default mode: tap spawns, tap-on-particle selects
- Toggle mode: tap spawns antimatter, tap-on-particle deletes
- `X` key toggles mode on desktop
- Button shows correct icon state

- [ ] **Step 6: Commit**

```bash
git add geon/index.html geon/src/ui.js geon/src/input.js geon/styles.css
git commit -m "feat(geon): antimatter/delete toggle button + touch particle selection"
```

---

### Task 12: Shoals — Buy/Sell Toggle + Chart Touch + Bid/Ask Long-Press

**Files:**
- Modify: `shoals/index.html` (add toggle button)
- Modify: `shoals/main.js` (chart touch binding)
- Modify: `shoals/src/ui.js` (sellMode state, button wiring, hint bar)
- Modify: `shoals/src/chain-renderer.js` (respect sellMode on click)
- Modify: `shoals/src/strategy.js` (touch pan/zoom)

- [ ] **Step 1: Add toggle button to toolbar HTML**

In `shoals/index.html`, add after the reset/step buttons in the toolbar:
```html
<button id="mode-btn" class="tool-btn" aria-label="Toggle buy/sell mode" aria-pressed="false" title="Buy mode (X to toggle)">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="4,16 8,10 12,13 16,7 20,11"/>
    </svg>
</button>
```

- [ ] **Step 2: Add sellMode state and wiring in `ui.js`**

```js
let sellMode = false;
$.modeBtn = document.getElementById('mode-btn');
$.modeBtn.addEventListener('click', () => {
    sellMode = !sellMode;
    $.modeBtn.setAttribute('aria-pressed', String(sellMode));
    $.modeBtn.title = sellMode ? 'Sell mode (X to toggle)' : 'Buy mode (X to toggle)';
    $.modeBtn.style.color = sellMode ? 'var(--accent)' : '';
});
// Export sellMode for chain-renderer
window._shoalsSellMode = () => sellMode;
```

- [ ] **Step 3: Update chain-renderer.js click handler**

In `chain-renderer.js`, find the `click` handler on chain cells (line ~150). Change from always calling the buy/long action to:
```js
if (typeof _shoalsSellMode === 'function' && _shoalsSellMode()) {
    // Execute sell/short action (same as contextmenu handler)
    handleShortOption(cell);
} else {
    // Execute buy/long action (existing behavior)
    handleBuyOption(cell);
}
```

Apply the same pattern to stock and bond cell click handlers in `ui.js`.

- [ ] **Step 4: Bind chart canvas touch**

In `shoals/main.js`, find where `camera.bindWheel($.chartCanvas)` and `camera.bindMousePan($.chartCanvas)` are called (lines ~204-221). Add:
```js
camera.bindTouch($.chartCanvas);
```

- [ ] **Step 5: Add strategy canvas touch**

In `shoals/src/strategy.js`, find the `mousedown/mousemove/mouseup` pan handlers (~lines 335-360). Add parallel touch handlers:
```js
canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
        // single finger pan
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        dragging = true;
    }
}, { passive: true });

canvas.addEventListener('touchmove', function(e) {
    if (dragging && e.touches.length === 1) {
        e.preventDefault();
        var dx = e.touches[0].clientX - dragStart.x;
        // pan by dx...
        dragStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
}, { passive: false });

canvas.addEventListener('touchend', function() { dragging = false; });
```

Also bind pinch-zoom if the strategy canvas has a camera/zoom concept.

- [ ] **Step 6: Wire bid/ask tooltip long-press**

In `shoals/src/ui.js`, after creating the tooltip, call:
```js
if (window.matchMedia('(pointer: coarse)').matches) {
    bindTooltipTouch($.chainContainer, function(cx, cy) {
        // Hit-test chain cells at client coordinates
        var cell = document.elementFromPoint(cx, cy);
        if (cell && cell.dataset.tooltip) {
            return { text: cell.dataset.tooltip, screenX: cx, screenY: cy };
        }
        return null;
    }, tooltip);
}
```

- [ ] **Step 7: Update hint bar**

```js
if (window.matchMedia('(pointer: coarse)').matches) {
    $.hintBar.textContent = 'Tap to Trade · Long-press for Bid/Ask · Pinch to Zoom Chart';
}
```

- [ ] **Step 8: Verify**

Test on mobile: tap chain cell buys, toggle X then tap sells. Pinch-zoom on chart works. Long-press shows bid/ask.

- [ ] **Step 9: Commit**

```bash
git add shoals/index.html shoals/main.js shoals/src/ui.js shoals/src/chain-renderer.js shoals/src/strategy.js
git commit -m "feat(shoals): buy/sell toggle, chart touch, bid/ask long-press"
```

---

### Task 13: Cyano — Forward/Reverse Toggle + Canvas Tooltip

**Files:**
- Modify: `cyano/index.html` (add toggle button, ARIA fix on organism select)
- Modify: `cyano/src/ui.js` (reverseMode state, button wiring, hint bar)
- Modify: `cyano/src/renderer.js` (touchend direction, tooltip hit-test extraction)

- [ ] **Step 1: Add toggle button to toolbar HTML**

In `cyano/index.html`, add to the toolbar:
```html
<button id="mode-btn" class="tool-btn" aria-label="Toggle reaction direction" aria-pressed="false" title="Forward mode (X to toggle)">
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6,12 18,12"/>
        <polyline points="14,8 18,12 14,16"/>
    </svg>
</button>
```

Also add `aria-label="Organism preset"` to the organism `<select>` element.

- [ ] **Step 2: Add reverseMode state and wiring in `ui.js`**

```js
let reverseMode = false;
$.modeBtn = document.getElementById('mode-btn');
$.modeBtn.addEventListener('click', () => {
    reverseMode = !reverseMode;
    $.modeBtn.setAttribute('aria-pressed', String(reverseMode));
    $.modeBtn.title = reverseMode ? 'Reverse mode (X to toggle)' : 'Forward mode (X to toggle)';
});
// Export for renderer
window._cyanoReverseMode = () => reverseMode;
```

- [ ] **Step 3: Update renderer.js touchend**

In `cyano/src/renderer.js`, find the `touchend` handler (~line 357) that hardcodes `'forward'`. Change to:
```js
var direction = (typeof _cyanoReverseMode === 'function' && _cyanoReverseMode()) ? 'reverse' : 'forward';
```
And pass `direction` instead of `'forward'`.

- [ ] **Step 4: Extract tooltip hit-test and bind touch**

In `renderer.js`, find the `mousemove` tooltip handler (~lines 267-287). Extract the hit-test logic into a named function:
```js
function tooltipHitTest(clientX, clientY) {
    // Convert client coords to world coords
    var wx = ..., wy = ...;
    // Check enzyme hitboxes
    for (var i = 0; i < hitboxes.length; i++) {
        var hb = hitboxes[i];
        if (Math.abs(wx - hb.cx) < hb.w/2 && Math.abs(wy - hb.cy) < hb.h/2) {
            return { text: hb.label, screenX: clientX, screenY: clientY };
        }
    }
    return null;
}
```

Then at init, after creating the tooltip:
```js
if (window.matchMedia('(pointer: coarse)').matches) {
    bindTooltipTouch(canvas, tooltipHitTest, tooltip);
}
```

- [ ] **Step 5: Update hint bar**

```js
if (window.matchMedia('(pointer: coarse)').matches) {
    // Set or replace hint bar text
    $.hintBar.textContent = 'Tap Enzyme to React · Long-press for Info · Pinch to Zoom';
}
```

- [ ] **Step 6: Verify and commit**

```bash
git add cyano/index.html cyano/src/ui.js cyano/src/renderer.js
git commit -m "feat(cyano): forward/reverse toggle, canvas tooltip on touch"
```

---

### Task 14: Gerry — Touch Targets, Shortcuts, ARIA, Hint Bar

**Files:**
- Modify: `gerry/styles.css` (touch target overrides)
- Modify: `gerry/index.html` (skip link, ARIA on election close, plans dialog)
- Modify: `gerry/src/palette.js` (aria-pressed on active palette button)
- Modify: `gerry/main.js` (about panel controls, hint bar)

- [ ] **Step 1: Add touch target overrides to `gerry/styles.css`**

Append:
```css
@media (pointer: coarse) {
    .palette-btn { width: 44px; height: 44px; }
    .plan-item-btn { min-height: 44px; min-width: 44px; }
    .map-ctrl-btn { height: 44px; width: 44px; }
}
```

- [ ] **Step 2: Fix ARIA in `gerry/index.html`**

- Change skip link from `href="#hex-map"` to `href="#map-container"` and add `tabindex="-1"` to `#map-container`
- Add `role="dialog"` and `aria-label="Plans"` to `#plans-dialog`
- Add `aria-label="Close"` to `#election-close` button
- Add `role="dialog"` and `aria-label="Election results"` to `#election-overlay`

- [ ] **Step 3: Add `aria-pressed` to palette buttons**

In `gerry/src/palette.js`, find where the active palette button class is set. After setting `.active`:
```js
// Clear previous aria-pressed
btns.forEach(function(b) { b.setAttribute('aria-pressed', 'false'); });
// Set current
activeBtn.setAttribute('aria-pressed', 'true');
```

Do the same for brush-size buttons in `_forms.bindModeGroup()` if gerry uses it, or in the local brush-size handler.

- [ ] **Step 4: Update about panel controls for mobile**

In `gerry/main.js`, find the `initAboutPanel` config's controls array. Add mobile-specific instructions:
```js
var isTouch = window.matchMedia('(pointer: coarse)').matches;
controls: [
    { label: isTouch ? 'Tap hex' : 'Click hex', value: 'Paint district' },
    { label: isTouch ? 'Pinch' : 'Scroll wheel', value: 'Zoom in/out' },
    { label: isTouch ? 'Two-finger drag' : 'Middle-click + drag', value: 'Pan map' },
    { label: isTouch ? 'Toggle erase (E)' : 'Right-click hex', value: 'Erase district' },
    // ...
]
```

- [ ] **Step 5: Update hint bar**

```js
if (window.matchMedia('(pointer: coarse)').matches) {
    $.hintBar.textContent = 'Tap to Paint · Pinch to Zoom · E to Toggle Erase';
}
```

- [ ] **Step 6: Verify and commit**

```bash
git add gerry/styles.css gerry/index.html gerry/src/palette.js gerry/main.js
git commit -m "feat(gerry): touch targets, ARIA fixes, mobile hint bar"
```

---

### Task 15: Shoals + Gerry — Overlay Focus Traps and ARIA

**Files:**
- Modify: `shoals/index.html` (role="dialog" on overlays)
- Modify: `shoals/src/ui.js` (focus trap on chain overlay, trade dialog, epilogue)
- Modify: `gerry/main.js` or relevant JS (focus trap on plans dialog, election overlay)

- [ ] **Step 1: Add `role="dialog"` and `aria-label` to shoals overlays**

In `shoals/index.html`:
- Chain overlay: add `role="dialog" aria-label="Options chain" aria-modal="true"`
- Trade dialog: add `role="dialog" aria-label="Trade confirmation" aria-modal="true"`
- Epilogue overlay: add `role="dialog" aria-label="Epilogue" aria-modal="true"`

- [ ] **Step 2: Wire focus traps in shoals overlay open/close**

In `shoals/src/ui.js`, find each overlay's show/hide function. Add:
```js
// On open:
var _prevFocus = document.activeElement;
var _cleanup = trapFocus(overlayEl);
overlayEl.querySelector('button, [tabindex]')?.focus();

// On close:
_cleanup();
if (_prevFocus) _prevFocus.focus();
```

- [ ] **Step 3: Add chain overlay arrow key navigation**

In `shoals/src/chain-renderer.js`, add a `keydown` handler on the chain container:
```js
chainContainer.addEventListener('keydown', function(e) {
    var cells = Array.from(chainContainer.querySelectorAll('[tabindex="0"]'));
    var idx = cells.indexOf(document.activeElement);
    if (idx === -1) return;
    var cols = 3; // call, strike, put
    var target = null;
    if (e.key === 'ArrowRight') target = cells[idx + 1];
    else if (e.key === 'ArrowLeft') target = cells[idx - 1];
    else if (e.key === 'ArrowDown') target = cells[idx + cols];
    else if (e.key === 'ArrowUp') target = cells[idx - cols];
    if (target) { e.preventDefault(); target.focus(); }
});
```

- [ ] **Step 4: Wire focus traps in gerry**

In gerry, find the plans dialog and election overlay open/close handlers. Apply the same `trapFocus` pattern.

- [ ] **Step 5: Verify and commit**

```bash
git add shoals/index.html shoals/src/ui.js shoals/src/chain-renderer.js gerry/main.js gerry/index.html
git commit -m "feat: focus traps and ARIA on shoals/gerry overlays"
```

---

### Task 16: Geon — Engine Tab ARIA Fixes

**Files:**
- Modify: `geon/index.html` (role="switch" on engine checkboxes)
- Modify: `geon/src/ui.js` (aria-checked sync on toggle)

- [ ] **Step 1: Add ARIA to engine checkboxes**

In `geon/index.html`, find `#gpu-toggle` and `#barneshut-toggle`. Add:
```html
role="switch" aria-checked="false"
```
(Or `"true"` if the default is checked.)

- [ ] **Step 2: Sync `aria-checked` in JS**

In `geon/src/ui.js`, find the change handlers for these checkboxes. Add:
```js
el.setAttribute('aria-checked', String(el.checked));
```
after each toggle.

- [ ] **Step 3: Commit**

```bash
git add geon/index.html geon/src/ui.js
git commit -m "fix(geon): role=switch and aria-checked on engine toggles"
```

---

### Task 17: Final Verification Pass

- [ ] **Step 1: Test all 4 projects in Chrome DevTools mobile emulation**

For each project:
1. Toggle touch emulation ON
2. Verify toolbar buttons are 44px and scroll horizontally
3. Verify all toggle buttons work (X key, toolbar button)
4. Verify Tab navigation reaches all interactive elements
5. Verify `?` opens about panel with focus trapped
6. Verify Escape closes overlays and restores focus
7. Press every documented keyboard shortcut from the about panel

- [ ] **Step 2: Test on actual mobile device if available**

- [ ] **Step 3: Push all changes**

```bash
git push
```
