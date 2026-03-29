# Elastic UI Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild a9l.im's visual identity around elastic/putty deformation — per-block clay scroll physics, metaball shader background, silly putty page transitions, and cursor proximity effects.

**Architecture:** A centralized elastic engine (`elastic.js`) manages all deformation state in a single rAF loop. Elements opt in declaratively via `data-elastic` attributes at three intensity tiers. The engine drives CSS custom properties and SVG filter parameters. A new metaball WebGL shader replaces the simplex noise background.

**Tech Stack:** Vanilla JS, WebGL, SVG filters (`feTurbulence` + `feDisplacementMap`), CSS transforms, CSS custom properties. No dependencies.

**Spec:** `docs/superpowers/specs/2026-03-28-elastic-ui-revamp-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `elastic.js` | Shared elastic engine: scroll/cursor tracking, per-element deformation, SVG filter management |

### Modified Files
| File | Change Summary |
|------|---------------|
| `shared-tokens.js` | Add `--ease-elastic` CSS custom property |
| `shared-base.css` | Update `--ease-spring`, `.tool-btn:active` squish, `data-elastic` CSS support |
| `src/shader.js` | Complete rewrite: metaball fragment shader |
| `src/router.js` | Silly putty page transitions |
| `src/animations.js` | Per-block clay scroll physics (delegates to elastic engine) |
| `src/card-effects.js` | Replace 3D tilt with elastic cursor proxy (delegates to elastic engine) |
| `src/carousel.js` | Putty swipe physics, elastic dot morphing |
| `styles.css` | `data-elastic` styling, remove shimmer pseudo-elements, transition styles, new scroll-hint |
| `index.html` | Add `data-elastic` attributes, `.el-block` wrappers, `elastic.js` script tag |

---

### Task 1: Shared Token Updates

**Files:**
- Modify: `shared-tokens.js:154-268` (inside `injectPaletteVars()`)
- Modify: `shared-base.css:22-25` (easing tokens), `shared-base.css:82-86` (`.tool-btn:active`)

- [ ] **Step 1: Add `--ease-elastic` to shared-tokens.js**

In `shared-tokens.js`, inside the `injectPaletteVars()` function, add the elastic easing custom property to the `:root` block. Insert after the `--shimmer-subtle` line (line 239) and before the `color-scheme: light;` line:

```js
  --ease-elastic: linear(0, 0.002, 0.014, 0.046, 0.108, 0.216, 0.384, 0.600, 0.726, 0.820, 0.888, 0.935, 0.966, 0.984, 0.994, 0.999, 1);
```

This is a `linear()` CSS easing approximation of the quintic smoothstep `t^3 * (t * (t * 6 - 15) + 10)`, sampled at 17 points.

- [ ] **Step 2: Update `--ease-spring` in shared-base.css**

In `shared-base.css`, replace the current `--ease-spring` value with a gooier curve:

```css
/* Old */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* New */
--ease-spring: cubic-bezier(0.22, 1.2, 0.36, 1);
```

- [ ] **Step 3: Update `.tool-btn:active` squish**

In `shared-base.css`, replace the uniform scale with a volume-conserving squish:

```css
/* Old */
.tool-btn:active {
    background: var(--border-strong);
    transform: scale(0.94);
    transition-duration: 0.05s;
}

/* New */
.tool-btn:active {
    background: var(--border-strong);
    transform: scaleY(0.90) scaleX(1.11);
    transition-duration: 0.08s;
    transition-timing-function: var(--ease-elastic);
}
```

- [ ] **Step 4: Add `data-elastic` CSS support to shared-base.css**

Append to `shared-base.css` (after the existing keyframes section, before any media queries if present at bottom):

```css
/* ─── Elastic Deformation ─── */
[data-elastic] {
    --el-sx: 1;
    --el-sy: 1;
    --el-drift-x: 0px;
    --el-drift-y: 0px;
    will-change: transform, border-radius;
}
```

- [ ] **Step 5: Verify locally**

Run: `python -m http.server` from repo root, open `http://localhost:8000`. Verify:
- No console errors
- Theme toggle still works
- Tool buttons squish with the new volume-conserving animation on click
- No visual regressions on any page

- [ ] **Step 6: Commit**

```bash
git add shared-tokens.js shared-base.css
git commit -m "feat: add elastic easing tokens and volume-conserving button squish"
```

---

### Task 2: Elastic Engine Core — Scroll Tracking

**Files:**
- Create: `elastic.js`

- [ ] **Step 1: Create elastic.js with scroll tracking**

Create `elastic.js` at the repo root. This first version implements the scroll velocity tracker and per-block clay deformation — the primary interaction system.

```js
/* ═══════════════════════════════════════════════
   elastic.js — Shared elastic deformation engine for a9l.im
   Loaded as <script> after shared-tokens.js.
   Exposes window._elastic for consumer modules.
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Constants ───
  var TIERS = { light: 0.4, medium: 0.7, heavy: 1.0 };
  var VEL_BASELINE = 25;        // px/frame for normalization
  var VEL_SMOOTH = 0.15;        // EMA factor for scroll velocity
  var ONSET_RATE = 0.20;        // lerp rate: scroll onset (snappy)
  var RECOVERY_RATE = 0.06;     // lerp rate: scroll recovery (viscous)
  var MAX_COMPRESSION = 0.40;   // 40% max scaleY reduction
  var FORCE_POWER = 0.7;        // pow() exponent for distance falloff

  // ─── Quintic smoothstep ───
  function gooey(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // ─── State ───
  var lastScrollY = window.scrollY;
  var smoothVelocity = 0;
  var blocks = [];        // { el, tier, sy, sx, ty, force }
  var running = false;
  var rafId = 0;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Registration ───
  function scanElements() {
    blocks = [];
    var els = document.querySelectorAll('[data-elastic]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tierName = el.getAttribute('data-elastic') || 'medium';
      var tierScale = TIERS[tierName] || TIERS.medium;
      // Skip elements inside .sim-toolbar (toolbar never deforms)
      if (el.closest('.sim-toolbar')) continue;
      blocks.push({
        el: el,
        tier: tierScale,
        sy: 1, sx: 1, ty: 0,
        force: 0
      });
    }
  }

  // ─── Scroll Deformation ───
  function tickScroll() {
    var scrollY = window.scrollY;
    var rawVel = scrollY - lastScrollY;
    lastScrollY = scrollY;

    smoothVelocity += (rawVel - smoothVelocity) * VEL_SMOOTH;

    var absVel = Math.abs(smoothVelocity);
    var normalizedVel = Math.min(1, absVel / VEL_BASELINE);
    var scrollingDown = smoothVelocity > 0;
    var vh = window.innerHeight;

    // Compute per-block force
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var rect = b.el.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var vp = Math.max(0, Math.min(1, center / vh));

      var targetForce;
      if (scrollingDown) {
        targetForce = normalizedVel * Math.pow(Math.max(0, 1 - vp), FORCE_POWER);
      } else {
        targetForce = normalizedVel * Math.pow(Math.max(0, vp), FORCE_POWER);
      }
      targetForce *= b.tier;

      var rate = targetForce > b.force ? ONSET_RATE : RECOVERY_RATE;
      b.force += (targetForce - b.force) * rate;
    }

    // Compute deformation + accumulated push
    var accPush = 0;
    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var rect = b.el.getBoundingClientRect();
      var naturalH = b.sy !== 0 ? rect.height / b.sy : rect.height;

      var targetSy = 1 - b.force * MAX_COMPRESSION;
      var targetSx = 1 / targetSy;

      var rateY = targetSy < b.sy ? ONSET_RATE : RECOVERY_RATE;
      var rateX = targetSx > b.sx ? ONSET_RATE : RECOVERY_RATE;

      b.sy += (targetSy - b.sy) * rateY;
      b.sx += (targetSx - b.sx) * rateX;

      var targetTy = accPush;
      var ratePush = Math.abs(targetTy) > Math.abs(b.ty) ? ONSET_RATE * 0.5 : RECOVERY_RATE;
      b.ty += (targetTy - b.ty) * ratePush;

      b.el.style.transform =
        'translateY(' + b.ty.toFixed(1) + 'px) ' +
        'scaleX(' + b.sx.toFixed(4) + ') ' +
        'scaleY(' + b.sy.toFixed(4) + ')';

      // Set CSS custom properties for any CSS consumers
      b.el.style.setProperty('--el-sx', b.sx.toFixed(4));
      b.el.style.setProperty('--el-sy', b.sy.toFixed(4));

      var heightLost = naturalH * (1 - b.sy);
      accPush -= heightLost;
    }
  }

  // ─── Main Loop ───
  function tick() {
    if (!running) return;
    tickScroll();
    rafId = requestAnimationFrame(tick);
  }

  function start() {
    if (running || reducedMotion) return;
    running = true;
    lastScrollY = window.scrollY;
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
  }

  // ─── Lifecycle ───
  function init() {
    if (reducedMotion) return;
    scanElements();
    if (blocks.length === 0) return;
    start();

    // Pause when tab hidden
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else { scanElements(); start(); }
    });
  }

  // Auto-init on DOMContentLoaded or immediately if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───
  window._elastic = {
    rescan: function () { scanElements(); if (!running && blocks.length) start(); },
    start: start,
    stop: stop,
    gooey: gooey,
    getVelocity: function () { return smoothVelocity; }
  };
})();
```

- [ ] **Step 2: Verify the file loads without errors**

Run: `python -m http.server` from repo root. Open browser console at `http://localhost:8000`. Type `_elastic` — should return the API object. No errors.

- [ ] **Step 3: Commit**

```bash
git add elastic.js
git commit -m "feat: add elastic engine core with scroll velocity tracking and per-block clay deformation"
```

---

### Task 3: Elastic Engine — Cursor Effects

**Files:**
- Modify: `elastic.js`

- [ ] **Step 1: Add cursor tracking and proximity effects to elastic.js**

Add cursor state variables after the scroll state variables (after `var reducedMotion = ...`):

```js
  // ─── Cursor State ───
  var mouseX = -9999, mouseY = -9999;
  var isTouch = 'ontouchstart' in window;
  var PROXIMITY = 250;          // px radius of influence
  var DRIFT_MAX_HEAVY = 4;      // px max magnetic drift
  var BULGE_MAX = 8;            // px max border-radius bulge
  var DRIFT_LERP = 0.06;
  var BULGE_LERP = 0.08;
  var RADIUS_RECOVERY = 0.04;

  if (!isTouch) {
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
  }
```

Extend each block's state in `scanElements()` — update the `blocks.push` call to include cursor fields:

```js
      blocks.push({
        el: el,
        tier: tierScale,
        // Scroll state
        sy: 1, sx: 1, ty: 0, force: 0,
        // Cursor state
        driftX: 0, driftY: 0,
        bulge: 0,
        br: [0, 0, 0, 0],       // border-radius delta per corner
        baseBr: 14               // default, overridden for pills etc.
      });
```

Add a `tickCursor()` function after `tickScroll()`:

```js
  // ─── Cursor Deformation ───
  function tickCursor() {
    if (isTouch) return;

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      var rect = b.el.getBoundingClientRect();
      var elCx = rect.left + rect.width / 2;
      var elCy = rect.top + rect.height / 2;
      var dx = mouseX - elCx;
      var dy = mouseY - elCy;
      var dist = Math.sqrt(dx * dx + dy * dy);

      var influence = Math.max(0, 1 - dist / PROXIMITY);
      influence = influence * influence; // quadratic falloff

      var driftMax = DRIFT_MAX_HEAVY * b.tier;
      var bulgeMax = BULGE_MAX * b.tier;

      // Magnetic drift
      var targetDriftX = dist > 0 ? (dx / dist) * influence * driftMax : 0;
      var targetDriftY = dist > 0 ? (dy / dist) * influence * driftMax : 0;
      b.driftX += (targetDriftX - b.driftX) * DRIFT_LERP;
      b.driftY += (targetDriftY - b.driftY) * DRIFT_LERP;

      // Bulge amount
      var targetBulge = influence * bulgeMax;
      b.bulge += (targetBulge - b.bulge) * BULGE_LERP;

      // Asymmetric border-radius
      if (b.tier > 0.4 && influence > 0.01) {
        var nx = rect.width > 0 ? Math.max(-1, Math.min(1, (mouseX - elCx) / (rect.width / 2))) : 0;
        var ny = rect.height > 0 ? Math.max(-1, Math.min(1, (mouseY - elCy) / (rect.height / 2))) : 0;
        var bulgeR = b.bulge * 2.5;
        b.br[0] += (bulgeR * Math.max(0, (-nx + -ny) / 2) - b.br[0]) * BULGE_LERP;
        b.br[1] += (bulgeR * Math.max(0, (nx + -ny) / 2) - b.br[1]) * BULGE_LERP;
        b.br[2] += (bulgeR * Math.max(0, (nx + ny) / 2) - b.br[2]) * BULGE_LERP;
        b.br[3] += (bulgeR * Math.max(0, (-nx + ny) / 2) - b.br[3]) * BULGE_LERP;
      } else {
        b.br[0] += (0 - b.br[0]) * RADIUS_RECOVERY;
        b.br[1] += (0 - b.br[1]) * RADIUS_RECOVERY;
        b.br[2] += (0 - b.br[2]) * RADIUS_RECOVERY;
        b.br[3] += (0 - b.br[3]) * RADIUS_RECOVERY;
      }

      // Set CSS custom properties
      b.el.style.setProperty('--el-drift-x', b.driftX.toFixed(2) + 'px');
      b.el.style.setProperty('--el-drift-y', b.driftY.toFixed(2) + 'px');

      // Accent glow
      if (influence > 0.01 && b.tier >= 0.7) {
        var shadowAlpha = (influence * 0.3).toFixed(2);
        b.el.style.boxShadow = '0 4px 30px rgba(225,17,7,' + shadowAlpha + ')';
      } else {
        b.el.style.boxShadow = '';
      }
    }
  }
```

Update the transform application in `tickScroll()` to include drift and border-radius. Replace the `b.el.style.transform = ...` block and the two `setProperty` lines below it with:

```js
      b.el.style.transform =
        'translateX(' + b.driftX.toFixed(2) + 'px) ' +
        'translateY(' + (b.ty + b.driftY).toFixed(1) + 'px) ' +
        'scaleX(' + b.sx.toFixed(4) + ') ' +
        'scaleY(' + b.sy.toFixed(4) + ')';

      b.el.style.setProperty('--el-sx', b.sx.toFixed(4));
      b.el.style.setProperty('--el-sy', b.sy.toFixed(4));
      b.el.style.setProperty('--el-drift-x', b.driftX.toFixed(2) + 'px');
      b.el.style.setProperty('--el-drift-y', b.driftY.toFixed(2) + 'px');

      // Border-radius morphing
      if (b.br[0] > 0.1 || b.br[1] > 0.1 || b.br[2] > 0.1 || b.br[3] > 0.1) {
        var base = b.baseBr;
        b.el.style.borderRadius =
          (base + b.br[0]).toFixed(1) + 'px ' +
          (base + b.br[1]).toFixed(1) + 'px ' +
          (base + b.br[2]).toFixed(1) + 'px ' +
          (base + b.br[3]).toFixed(1) + 'px';
      } else if (b.el.style.borderRadius) {
        b.el.style.borderRadius = '';
      }
```

Update the `tick()` function to call both:

```js
  function tick() {
    if (!running) return;
    tickScroll();
    tickCursor();
    rafId = requestAnimationFrame(tick);
  }
```

Expose cursor position for the shader:

```js
  window._elastic = {
    rescan: function () { scanElements(); if (!running && blocks.length) start(); },
    start: start,
    stop: stop,
    gooey: gooey,
    getVelocity: function () { return smoothVelocity; },
    getCursor: function () { return { x: mouseX, y: mouseY }; },
    isTouch: isTouch
  };
```

- [ ] **Step 2: Verify cursor effects work**

Open `http://localhost:8000`, open console, confirm no errors. At this point elements need `data-elastic` attributes to respond — we'll add those in Task 7. For now verify `_elastic.getCursor()` returns cursor coordinates.

- [ ] **Step 3: Commit**

```bash
git add elastic.js
git commit -m "feat: add cursor proximity effects to elastic engine (drift, bulge, border-radius morphing)"
```

---

### Task 4: Elastic Engine — SVG Filter System

**Files:**
- Modify: `elastic.js`

- [ ] **Step 1: Add SVG filter injection and scroll-driven parameter updates**

Add after the cursor state variables:

```js
  // ─── SVG Filters ───
  var filterSvg = null;
  var filterTurb = null;
  var filterDisplace = null;
  var BASE_FREQ = 0.012;
  var MAX_DISP_SCALE = 35;

  function injectFilters() {
    if (reducedMotion) return;
    filterSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    filterSvg.setAttribute('style', 'position:absolute;width:0;height:0;');
    filterSvg.setAttribute('aria-hidden', 'true');

    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', 'elastic-warp');
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '120%');
    filter.setAttribute('height', '120%');

    filterTurb = document.createElementNS('http://www.w3.org/2000/svg', 'feTurbulence');
    filterTurb.setAttribute('type', 'turbulence');
    filterTurb.setAttribute('baseFrequency', String(BASE_FREQ));
    filterTurb.setAttribute('numOctaves', '3');
    filterTurb.setAttribute('seed', '5');
    filterTurb.setAttribute('result', 'noise');

    filterDisplace = document.createElementNS('http://www.w3.org/2000/svg', 'feDisplacementMap');
    filterDisplace.setAttribute('in', 'SourceGraphic');
    filterDisplace.setAttribute('in2', 'noise');
    filterDisplace.setAttribute('scale', '0');
    filterDisplace.setAttribute('xChannelSelector', 'R');
    filterDisplace.setAttribute('yChannelSelector', 'G');

    filter.appendChild(filterTurb);
    filter.appendChild(filterDisplace);
    defs.appendChild(filter);
    filterSvg.appendChild(defs);
    document.body.appendChild(filterSvg);
  }
```

Add a function to update filter parameters based on scroll velocity, called from `tickScroll()`:

```js
  function tickFilters() {
    if (!filterTurb || !filterDisplace) return;
    var absVel = Math.abs(smoothVelocity);
    var normalizedVel = Math.min(1, absVel / VEL_BASELINE);

    // Ramp displacement scale with velocity
    var dispScale = normalizedVel * MAX_DISP_SCALE;
    filterDisplace.setAttribute('scale', dispScale.toFixed(1));

    // Increase turbulence frequency slightly with velocity
    var freq = BASE_FREQ + normalizedVel * 0.02;
    filterTurb.setAttribute('baseFrequency', freq.toFixed(4));
  }
```

Call `injectFilters()` inside `init()` before `scanElements()`:

```js
  function init() {
    if (reducedMotion) return;
    injectFilters();
    scanElements();
    if (blocks.length === 0) return;
    start();
    // ... rest of init
  }
```

Call `tickFilters()` at the end of `tickScroll()`:

```js
  function tickScroll() {
    // ... existing scroll code ...
    tickFilters();
  }
```

- [ ] **Step 2: Verify SVG filter injects**

Open `http://localhost:8000`, inspect DOM — an SVG with `#elastic-warp` filter should be present in `<body>`. Console should show no errors.

- [ ] **Step 3: Commit**

```bash
git add elastic.js
git commit -m "feat: add SVG filter system to elastic engine (feTurbulence + feDisplacementMap)"
```

---

### Task 5: Metaball Shader

**Files:**
- Modify: `src/shader.js` (complete rewrite)

- [ ] **Step 1: Rewrite shader.js with metaball fragment shader**

Replace the entire contents of `src/shader.js`:

```js
// ─── Metaball WebGL Shader Background ───
// Replaces the simplex noise shader with a lava-lamp metaball field.
// Same architecture: half-res, on-demand, idle timeout, visibility pause.

import { getTheme } from './theme.js';

var VERT_SRC = [
  'attribute vec2 pos;',
  'void main() { gl_Position = vec4(pos, 0.0, 1.0); }'
].join('\n');

// MAX_BLOBS must match the uniform array size
var MAX_BLOBS = 8;
var MOBILE_BLOBS = 4;

var FRAG_SRC = [
  'precision mediump float;',
  'uniform float u_time;',
  'uniform vec2  u_res;',
  'uniform vec3  u_accent;',
  'uniform vec3  u_accentLight;',
  'uniform vec3  u_canvasLight;',
  'uniform vec3  u_canvasDark;',
  'uniform float u_dark;',
  'uniform float u_scrollVel;',
  'uniform vec2  u_cursor;',
  'uniform int   u_blobCount;',
  'uniform vec2  u_blobs[8];',    // xy positions in [0,1] UV space
  'uniform float u_blobR[8];',    // radii
  '',
  'void main() {',
  '  vec2 uv = gl_FragCoord.xy / u_res;',
  '  float aspect = u_res.x / u_res.y;',
  '  vec2 p = vec2(uv.x * aspect, uv.y);',
  '',
  '  // Metaball field: sum of (r^2 / dist^2) for each blob',
  '  float field = 0.0;',
  '  for (int i = 0; i < 8; i++) {',
  '    if (i >= u_blobCount) break;',
  '    vec2 bPos = vec2(u_blobs[i].x * aspect, u_blobs[i].y);',
  '',
  '    // Scroll velocity stretches blobs elliptically',
  '    vec2 diff = p - bPos;',
  '    float stretch = 1.0 + abs(u_scrollVel) * 0.8;',
  '    diff.y *= stretch;',
  '',
  '    float d2 = dot(diff, diff);',
  '    float r = u_blobR[i];',
  '    field += (r * r) / max(d2, 0.0001);',
  '  }',
  '',
  '  // Threshold with smooth edges',
  '  float edge = smoothstep(0.8, 2.0, field);',
  '  float core = smoothstep(2.0, 5.0, field);',
  '',
  '  // Color: accent core, accent-light edges',
  '  vec3 color = mix(u_accentLight, u_accent, core);',
  '',
  '  // Vignette',
  '  float vig = 1.0 - length(uv - 0.5) * 0.9;',
  '  vig = smoothstep(0.0, 0.7, vig);',
  '',
  '  // Alpha: subtle in light mode, more visible in dark',
  '  float alpha = edge * vig * mix(0.20, 0.35, u_dark);',
  '',
  '  gl_FragColor = vec4(color, alpha);',
  '}'
].join('\n');

function compileShader(gl, src, type) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function initShader($) {
  var canvas = $.shaderBg;
  var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
  if (!gl) return;

  var vs = compileShader(gl, VERT_SRC, gl.VERTEX_SHADER);
  var fs = compileShader(gl, FRAG_SRC, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  var posLoc = gl.getAttribLocation(prog, 'pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var uTime        = gl.getUniformLocation(prog, 'u_time');
  var uRes         = gl.getUniformLocation(prog, 'u_res');
  var uAccent      = gl.getUniformLocation(prog, 'u_accent');
  var uAccentLight = gl.getUniformLocation(prog, 'u_accentLight');
  var uCanvasLight = gl.getUniformLocation(prog, 'u_canvasLight');
  var uCanvasDark  = gl.getUniformLocation(prog, 'u_canvasDark');
  var uDark        = gl.getUniformLocation(prog, 'u_dark');
  var uScrollVel   = gl.getUniformLocation(prog, 'u_scrollVel');
  var uCursor      = gl.getUniformLocation(prog, 'u_cursor');
  var uBlobCount   = gl.getUniformLocation(prog, 'u_blobCount');
  var uBlobs       = gl.getUniformLocation(prog, 'u_blobs');
  var uBlobR       = gl.getUniformLocation(prog, 'u_blobR');

  var [ar, ag, ab] = _parseHex(_PALETTE.accent);
  var [alr, alg, alb] = _parseHex(_PALETTE.accentLight);
  var [clr, clg, clb] = _parseHex(_PALETTE.light.canvas);
  var [cdr, cdg, cdb] = _parseHex(_PALETTE.dark.canvas);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Blob setup
  var isMobile = window.innerWidth <= 900;
  var blobCount = isMobile ? MOBILE_BLOBS : MAX_BLOBS;
  var dprScale = isMobile ? 0.35 : 0.5;

  // Initialize blob positions and velocities
  var blobX = [], blobY = [], blobVx = [], blobVy = [], blobR = [];
  for (var i = 0; i < blobCount; i++) {
    blobX.push(0.15 + Math.random() * 0.7);
    blobY.push(0.15 + Math.random() * 0.7);
    blobVx.push((Math.random() - 0.5) * 0.008);
    blobVy.push((Math.random() - 0.5) * 0.006);
    blobR.push(0.06 + Math.random() * 0.08);
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.floor(window.innerWidth * dpr * dprScale);
    var h = Math.floor(window.innerHeight * dpr * dprScale);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      gl.viewport(0, 0, w, h);
    }
  }

  var startTime = performance.now();
  var raf = 0;
  var rendering = false;
  var idleTimer = 0;

  function updateBlobs(dt) {
    // Cursor attraction
    var cursor = typeof _elastic !== 'undefined' ? _elastic.getCursor() : { x: -9999, y: -9999 };
    var cursorU = cursor.x / window.innerWidth;
    var cursorV = 1 - cursor.y / window.innerHeight; // flip Y for GL

    for (var i = 0; i < blobCount; i++) {
      // Drift toward cursor (lazy, 12% of distance)
      if (cursor.x > 0) {
        var dxC = cursorU - blobX[i];
        var dyC = cursorV - blobY[i];
        blobVx[i] += dxC * 0.0002;
        blobVy[i] += dyC * 0.0002;
      }

      // Update positions
      blobX[i] += blobVx[i] * dt;
      blobY[i] += blobVy[i] * dt;

      // Soft bounce off edges
      if (blobX[i] < 0.05) { blobX[i] = 0.05; blobVx[i] *= -0.5; }
      if (blobX[i] > 0.95) { blobX[i] = 0.95; blobVx[i] *= -0.5; }
      if (blobY[i] < 0.05) { blobY[i] = 0.05; blobVy[i] *= -0.5; }
      if (blobY[i] > 0.95) { blobY[i] = 0.95; blobVy[i] *= -0.5; }

      // Damping
      blobVx[i] *= 0.998;
      blobVy[i] *= 0.998;
    }
  }

  function render() {
    resize();
    var now = performance.now();
    var t = (now - startTime) / 1000;
    var isDark = getTheme() === 'dark' ? 1.0 : 0.0;
    var scrollVel = typeof _elastic !== 'undefined' ? _elastic.getVelocity() / 25 : 0;

    updateBlobs(1);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform3f(uAccent, ar, ag, ab);
    gl.uniform3f(uAccentLight, alr, alg, alb);
    gl.uniform3f(uCanvasLight, clr, clg, clb);
    gl.uniform3f(uCanvasDark, cdr, cdg, cdb);
    gl.uniform1f(uDark, isDark);
    gl.uniform1f(uScrollVel, Math.max(-1, Math.min(1, scrollVel)));

    var cursor = typeof _elastic !== 'undefined' ? _elastic.getCursor() : { x: -9999, y: -9999 };
    gl.uniform2f(uCursor, cursor.x / window.innerWidth, 1 - cursor.y / window.innerHeight);
    gl.uniform1i(uBlobCount, blobCount);

    // Pack blob positions and radii into flat arrays
    var posArr = new Float32Array(MAX_BLOBS * 2);
    var rArr = new Float32Array(MAX_BLOBS);
    for (var i = 0; i < blobCount; i++) {
      posArr[i * 2] = blobX[i];
      posArr[i * 2 + 1] = blobY[i];
      rArr[i] = blobR[i];
    }
    gl.uniform2fv(uBlobs, posArr);
    gl.uniform1fv(uBlobR, rArr);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function startLoop() {
    if (rendering) return;
    rendering = true;
    (function loop() {
      if (!rendering) return;
      render();
      raf = requestAnimationFrame(loop);
    })();
  }

  function stopLoop() {
    rendering = false;
    cancelAnimationFrame(raf);
  }

  function scheduleIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(stopLoop, 1000);
  }

  function requestRender() {
    startLoop();
    scheduleIdle();
  }

  window.addEventListener('scroll', requestRender, { passive: true });
  window.addEventListener('resize', requestRender, { passive: true });
  window.addEventListener('mousemove', requestRender, { passive: true });
  var themeObs = new MutationObserver(requestRender);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { stopLoop(); clearTimeout(idleTimer); }
    else requestRender();
  });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    render();
    return;
  }

  // Expose scatter/coalesce for page transitions
  window._shaderBlobs = {
    scatter: function () {
      for (var i = 0; i < blobCount; i++) {
        var angle = (i / blobCount) * Math.PI * 2;
        blobVx[i] += Math.cos(angle) * 0.03;
        blobVy[i] += Math.sin(angle) * 0.03;
      }
    },
    coalesce: function () {
      for (var i = 0; i < blobCount; i++) {
        blobVx[i] *= 0.3;
        blobVy[i] *= 0.3;
      }
    },
    requestRender: requestRender
  };

  startLoop();
  setTimeout(function () { if (rendering) scheduleIdle(); }, 2000);
}
```

- [ ] **Step 2: Remove old shader imports from animations.js**

In `src/animations.js`, remove the `getScrollNorm` export and `scrollNorm` variable and `updateScrollNorm` function (lines 1-16). The elastic engine now owns scroll state. Replace with:

```js
// ─── Scroll Animations & Fade-Ins ───
// `.fade-in` (page-nav triggered) and `.scroll-reveal` (IntersectionObserver).
// Scroll deformation is handled by elastic.js.
```

Keep `triggerFadeIns`, `initNavbarScroll`, and `initScrollReveal` but remove the `updateScrollNorm()` call from the `onScroll` handler inside `initScrollReveal`. The `onScroll` function becomes:

```js
    function onScroll() {
        if (stripeBand && stripeSection && !stripeTicking) {
            stripeTicking = true;
            requestAnimationFrame(() => {
                const rect = stripeSection.getBoundingClientRect();
                const vh = window.innerHeight;
                const progress = 1 - (rect.top / vh);
                const tx = clamp((progress - 0.15) * 180 - 120, -120, 10);
                stripeBand.style.transform = `translateX(${tx}%) rotate(-3deg)`;
                stripeTicking = false;
            });
        }
    }
```

Also update `src/shader.js` import in `main.js` — no changes needed since the export name `initShader` hasn't changed. But remove the `getScrollNorm` import from `src/shader.js` since the new shader uses `_elastic.getVelocity()` directly.

- [ ] **Step 3: Verify metaball shader renders**

Open `http://localhost:8000`. You should see red/accent-colored metaball blobs drifting in the background instead of the simplex noise. Scroll and verify the blobs elongate. Move cursor and verify blobs drift lazily toward it.

- [ ] **Step 4: Commit**

```bash
git add src/shader.js src/animations.js
git commit -m "feat: replace simplex noise shader with metaball lava lamp background"
```

---

### Task 6: Page Transitions

**Files:**
- Modify: `src/router.js`
- Modify: `styles.css`

- [ ] **Step 1: Add transition styles to styles.css**

Add after the `.page-section.active` block (after line 175):

```css
/* ─── Putty Page Transitions ─── */
.page-section {
    transform-origin: center center;
    will-change: transform;
}

.page-transition-wrap {
    overflow: hidden;
    position: relative;
}
```

- [ ] **Step 2: Rewrite router.js with putty transitions**

Replace the entire `navigateTo` function in `src/router.js`:

```js
var transitioning = false;

function gooeyStep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function animate(duration, onUpdate) {
    return new Promise(function (resolve) {
        var start = performance.now();
        function tick(now) {
            var t = Math.min(1, (now - start) / duration);
            onUpdate(t);
            if (t < 1) requestAnimationFrame(tick);
            else resolve();
        }
        requestAnimationFrame(tick);
    });
}

export function navigateTo(page, slug, { $, pages, navLinks, triggerFadeIns, showBlogPost, showBlogListing }) {
    var currentPage = document.querySelector('.page-section.active');
    var targetPage = document.getElementById('page-' + page);
    if (!targetPage) return;

    // Update nav state immediately
    navLinks.forEach(l => l.classList.remove('active'));
    navLinks.forEach(l => {
        if (l.dataset.page === page) l.classList.add('active');
    });
    $.mobileNav.classList.remove('open');
    $.menuToggle.setAttribute('aria-expanded', 'false');

    // Blog state
    if (page === 'blog') {
        if (slug) showBlogPost(slug);
        else showBlogListing();
    }

    // Same page or no current — skip transition
    if (!currentPage || currentPage === targetPage || transitioning) {
        if (currentPage) currentPage.classList.remove('active');
        targetPage.classList.add('active');
        window.scrollTo({ top: 0 });
        targetPage.setAttribute('tabindex', '-1');
        targetPage.focus({ preventScroll: true });
        triggerFadeIns(targetPage);
        return;
    }

    // Reduced motion — simple swap
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        currentPage.classList.remove('active');
        targetPage.classList.add('active');
        window.scrollTo({ top: 0 });
        triggerFadeIns(targetPage);
        return;
    }

    transitioning = true;
    var dir = 1; // could vary by page order, keeping simple for now

    // Scatter metaball blobs during transition
    if (window._shaderBlobs) _shaderBlobs.scatter();

    // Phase 1: Pull & Thin outgoing (400ms)
    animate(400, function (t) {
        var v = gooeyStep(t);
        var pullX = v * 500 * dir;
        var stretchX = 1 + v * 1.2;
        var squishY = 1 / stretchX;
        var skew = v * v * 8 * dir;
        currentPage.style.transform =
            'translateX(' + pullX + 'px) scaleX(' + stretchX + ') scaleY(' + squishY + ') skewX(' + skew + 'deg)';
    }).then(function () {
        currentPage.classList.remove('active');
        currentPage.style.transform = '';

        targetPage.classList.add('active');
        window.scrollTo({ top: 0 });

        if (window._shaderBlobs) _shaderBlobs.coalesce();

        // Phase 2: Ooze in incoming (400ms)
        return animate(400, function (t) {
            var v = gooeyStep(t);
            var startX = -600 * dir;
            var x = startX * (1 - v);
            var scX = 0.35 + v * 0.65;
            var scY = 1 / (0.35 + v * 0.65);
            var skew = -10 * dir * (1 - v) * (1 - v);
            targetPage.style.transform =
                'translateX(' + x + 'px) scaleX(' + scX + ') scaleY(' + scY + ') skewX(' + skew + 'deg)';
        });
    }).then(function () {
        targetPage.style.transform = '';
        targetPage.setAttribute('tabindex', '-1');
        targetPage.focus({ preventScroll: true });
        triggerFadeIns(targetPage);
        transitioning = false;

        // Rescan elastic elements for the new page
        if (typeof _elastic !== 'undefined') _elastic.rescan();
        if (window._shaderBlobs) _shaderBlobs.requestRender();
    });
}
```

- [ ] **Step 3: Verify page transitions**

Navigate between pages. The outgoing page should stretch sideways like putty and slide off-screen. The incoming page should ooze in from the opposite side, starting compressed and decompressing. Toolbar should stay fixed.

- [ ] **Step 4: Commit**

```bash
git add src/router.js styles.css
git commit -m "feat: add silly putty page transitions with metaball shader scatter/coalesce"
```

---

### Task 7: HTML Markup — Add Elastic Attributes

**Files:**
- Modify: `index.html`
- Modify: `src/carousel.js`
- Modify: `src/projects-page.js`

- [ ] **Step 1: Add elastic.js script tag to index.html**

In `index.html`, add the elastic.js script tag after `shared-utils.js` (after line 30):

```html
    <script src="elastic.js"></script>
```

- [ ] **Step 2: Add `data-elastic` attributes and `.el-block` wrappers to index.html**

Wrap each content section in `.el-block` divs and add `data-elastic` attributes. Update the `<main>` content:

In `#page-home` section, wrap the hero in an el-block:

```html
        <div class="el-block" data-elastic="heavy">
        <div class="hero">
            <h1 class="hero-tagline fade-in">
                Building <em>interactive</em> simulations
            </h1>
            <p class="hero-sub fade-in">
                Exploring physics, biology, finance, and political science through code. Open-source tools for understanding complex systems.
            </p>
            <div class="scroll-hint fade-in">
                <span>Scroll</span>
                <div class="scroll-hint-line"></div>
            </div>
        </div>
        </div>
```

Wrap the stripe section:

```html
        <div class="el-block" data-elastic="medium">
        <div class="stripe-section" aria-hidden="true">
            <div class="stripe-band"></div>
        </div>
        </div>
```

Wrap the carousel section:

```html
        <div class="el-block" data-elastic="heavy">
        <div class="carousel-section">
```

(Close the el-block div after the carousel-dots div.)

Wrap the inspire section:

```html
        <div class="el-block" data-elastic="medium">
        <div class="inspire-section scroll-reveal">
```

For `#page-projects`, wrap the page-container:

```html
        <div class="el-block" data-elastic="medium">
        <div class="page-container">
```

For `#page-blog`, wrap the page-container:

```html
        <div class="el-block" data-elastic="medium">
        <div class="page-container">
```

For `#page-about`, wrap the page-container and the map section each:

```html
        <div class="el-block" data-elastic="medium">
        <div class="page-container">
            ...
        </div>
        </div>

        <div class="el-block" data-elastic="medium">
        <div class="map-section" aria-hidden="true">
```

Add `data-elastic="heavy"` to individual project cards and carousel cards via their render functions.

- [ ] **Step 3: Add `data-elastic` to dynamically rendered cards**

In `src/carousel.js`, add `data-elastic="heavy"` to the carousel card markup. Change line 12:

```js
        return `<a href="${escapeHtml(p.href)}" class="carousel-card scroll-reveal" data-elastic="heavy"${ext}>
```

In `src/projects-page.js`, add `data-elastic="heavy"` to project cards. Change line 9:

```js
        return `<a href="${escapeHtml(p.href)}" class="project-card glass fade-in" data-elastic="heavy"${ext}>
```

- [ ] **Step 4: Verify elastic effects are visible**

Open `http://localhost:8000`. Scroll on the home page — content blocks should compress with the clay physics. Move cursor near project cards — they should drift and border-radius should morph.

- [ ] **Step 5: Commit**

```bash
git add index.html src/carousel.js src/projects-page.js
git commit -m "feat: add data-elastic attributes and el-block wrappers for elastic deformation"
```

---

### Task 8: Replace Card Tilt with Elastic Cursor

**Files:**
- Modify: `src/card-effects.js`
- Modify: `src/carousel.js`
- Modify: `styles.css`

- [ ] **Step 1: Simplify card-effects.js**

The elastic engine now handles cursor proximity effects. Replace the contents of `src/card-effects.js`:

```js
// ─── Card Effects ───
// Previously handled 3D perspective tilt + shimmer. Now the elastic engine
// (elastic.js) handles cursor proximity effects (drift, bulge, border-radius).
// This module is kept as a thin proxy for the initCardTilt calls in carousel.js.

/**
 * No-op — elastic.js handles card effects via data-elastic attributes.
 * Kept for API compatibility with carousel.js.
 * @returns {null}
 */
export function initCardTilt() {
    return null;
}
```

- [ ] **Step 2: Remove shimmer pseudo-element styles from styles.css**

Remove the `.project-card::after` shimmer block (the `::after` with `radial-gradient` and `--mouse-x`/`--mouse-y`). Find and remove this block (around lines 339-354):

```css
/* Remove this entire block */
.project-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--shimmer), transparent 40%);
    opacity: 0;
    transition: opacity 0.3s var(--ease-out);
    pointer-events: none;
    border-radius: inherit;
    z-index: 3;
}

.project-card:hover::after {
    opacity: 1;
}
```

Also remove the `.carousel-card::after` shimmer block (around lines 1108-1122):

```css
/* Remove this entire block */
.carousel-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--shimmer-subtle), transparent 50%);
    opacity: 0;
    transition: opacity 0.3s var(--ease-out);
    pointer-events: none;
    z-index: 3;
    border-radius: inherit;
}

.carousel-card:hover::after {
    opacity: 1;
}
```

- [ ] **Step 3: Update card hover transforms in styles.css**

The elastic engine handles hover transforms now. Simplify the project card hover (around line 328):

```css
/* Old */
.project-card:hover,
.project-card.visible:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow: var(--shadow-lg);
    color: var(--text);
}

/* New — elastic engine handles transform; keep shadow */
.project-card:hover,
.project-card.visible:hover {
    box-shadow: var(--shadow-lg);
    color: var(--text);
}
```

Similarly for carousel card hover (around line 1036):

```css
/* Old */
.carousel-card:hover {
    transform: translateY(-6px) scale(1.03);
    box-shadow: var(--shadow-lg);
}

/* New */
.carousel-card:hover {
    box-shadow: var(--shadow-lg);
}
```

- [ ] **Step 4: Verify no shimmer, elastic effects work on cards**

Hover over cards — they should drift toward cursor and border-radius should morph (from elastic engine). No shimmer gradient should appear. No 3D tilt.

- [ ] **Step 5: Commit**

```bash
git add src/card-effects.js src/carousel.js styles.css
git commit -m "feat: replace 3D card tilt and shimmer with elastic cursor proximity effects"
```

---

### Task 9: Carousel Putty Physics

**Files:**
- Modify: `src/carousel.js`
- Modify: `styles.css`

- [ ] **Step 1: Add putty stretch to carousel dot active state**

In `styles.css`, update the `.carousel-dot.active` block (around line 1101):

```css
/* Old */
.carousel-dot.active {
    width: 28px;
    background: var(--accent);
    transform: none;
}

/* New — asymmetric border-radius for organic feel */
.carousel-dot.active {
    width: 28px;
    background: var(--accent);
    transform: none;
    border-radius: 40% 60% 55% 45% / 50% 50% 50% 50%;
    transition: background 0.25s var(--ease-out), width 0.5s var(--ease-elastic), transform 0.25s var(--ease-spring), border-radius 0.5s var(--ease-elastic);
}
```

- [ ] **Step 2: Add putty physics to carousel swipe**

In `src/carousel.js`, update the `touchmove` handler to apply putty stretch to cards during drag. Replace the existing touchmove handler (around line 107-113):

```js
    carouselTrack.addEventListener('touchmove', (e) => {
        if (!touchDragging || isMobile()) return;
        e.preventDefault();
        touchCurrentX = e.touches[0].clientX;
        const delta = touchCurrentX - touchStartX;
        const stretch = 1 + Math.abs(delta) / 800 * 0.3;
        const squish = 1 / stretch;
        carouselTrack.style.transform = 'translateX(' + (-baseOffset + delta) + 'px) scaleX(' + stretch.toFixed(4) + ') scaleY(' + squish.toFixed(4) + ')';
    }, { passive: false });
```

Update `touchend` to animate the spring-back (replace around line 115-123):

```js
    carouselTrack.addEventListener('touchend', () => {
        if (!touchDragging || isMobile()) return;
        touchDragging = false;
        carouselTrack.style.transition = 'transform 0.5s var(--ease-elastic)';
        const delta = touchCurrentX - touchStartX;
        if (delta < -SWIPE_THRESHOLD) goToPage(currentPage + 1);
        else if (delta > SWIPE_THRESHOLD) goToPage(currentPage - 1);
        else goToPage(currentPage);
        // Reset stretch after transition
        setTimeout(() => {
            carouselTrack.style.transition = '';
        }, 500);
    });
```

- [ ] **Step 3: Verify carousel swipe stretch**

On desktop, touch-drag the carousel (or test by temporarily lowering the isMobile threshold). Cards should stretch in the drag direction and spring back.

- [ ] **Step 4: Commit**

```bash
git add src/carousel.js styles.css
git commit -m "feat: add putty stretch physics to carousel swipe and organic dot morphing"
```

---

### Task 10: Style Cleanup and Polish

**Files:**
- Modify: `styles.css`
- Modify: `index.html`

- [ ] **Step 1: Add `.el-block` base styles**

In `styles.css`, add after the `.page-section.active` animation block (after line 180):

```css
/* ─── Elastic Blocks ─── */
.el-block {
    transform-origin: center center;
    will-change: transform;
}
```

- [ ] **Step 2: Update page transition overflow**

The `#page-home.active` needs to clip during transitions. In `styles.css`, update the `#page-home.active` block (around line 196):

```css
#page-home.active {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 0;
    padding-bottom: 0;
    overflow: hidden;
}
```

Also add overflow hidden to the main content area for transition clipping. Add to `main` (if no existing rule, add one):

```css
#main-content {
    overflow: hidden;
    position: relative;
}
```

- [ ] **Step 3: Remove the `@keyframes pageEnter` animation**

The putty transition replaces the old fade-up. Remove (around line 177):

```css
/* Remove this */
@keyframes pageEnter {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
}
```

And update `.page-section.active` to remove the animation reference:

```css
/* Old */
.page-section.active {
    display: block;
    animation: pageEnter 0.35s var(--ease-out) both;
}

/* New */
.page-section.active {
    display: block;
}
```

- [ ] **Step 4: Verify full site works end-to-end**

Test all pages: Home (scroll deformation, carousel, hero), Projects (card effects), Blog (list and post views), About (bio, contact, map). Verify:
- Scroll compresses blocks with clay physics
- Page transitions use putty morph
- Cursor effects work on cards
- Metaball shader renders and reacts
- Theme toggle works
- Mobile nav works
- No console errors

- [ ] **Step 5: Commit**

```bash
git add styles.css index.html
git commit -m "feat: style cleanup — elastic block base styles, transition overflow clipping, remove old page animation"
```

---

### Task 11: Mobile and Reduced Motion

**Files:**
- Modify: `elastic.js`
- Modify: `styles.css`

- [ ] **Step 1: Add reduced-motion fallback to styles.css**

Add at the end of styles.css, before the touch-friendly targets media query:

```css
/* ─── Reduced Motion ─── */
@media (prefers-reduced-motion: reduce) {
    .el-block,
    [data-elastic],
    .page-section,
    .carousel-track,
    .carousel-card {
        transform: none !important;
        transition: opacity 0.3s !important;
        will-change: auto !important;
        filter: none !important;
    }
    .carousel-dot.active {
        border-radius: var(--radius-pill);
    }
}
```

- [ ] **Step 2: Add performance auto-downgrade to elastic.js**

In `elastic.js`, add a frame time monitor inside the `tick()` function. Add before the `tick()` function:

```js
  var frameTimes = [];
  var degraded = false;
```

Update `tick()`:

```js
  function tick() {
    if (!running) return;
    var frameStart = performance.now();
    tickScroll();
    tickCursor();
    var elapsed = performance.now() - frameStart;

    // Auto-downgrade if frames consistently exceed 16ms
    if (!degraded) {
      frameTimes.push(elapsed);
      if (frameTimes.length > 60) frameTimes.shift();
      if (frameTimes.length === 60) {
        var avg = 0;
        for (var j = 0; j < frameTimes.length; j++) avg += frameTimes[j];
        avg /= frameTimes.length;
        if (avg > 14) {
          degraded = true;
          // Remove SVG filter to reduce load
          if (filterSvg && filterSvg.parentNode) {
            filterSvg.parentNode.removeChild(filterSvg);
          }
          filterTurb = null;
          filterDisplace = null;
        }
      }
    }

    rafId = requestAnimationFrame(tick);
  }
```

- [ ] **Step 3: Verify reduced motion**

In browser DevTools, enable "prefers-reduced-motion: reduce" in the Rendering tab. Verify all elastic deformation is disabled, simple opacity transitions work for page nav, and no SVG filters are applied.

- [ ] **Step 4: Commit**

```bash
git add elastic.js styles.css
git commit -m "feat: add reduced motion fallback and performance auto-downgrade"
```

---

### Task 12: Final Integration Test

**Files:** None (verification only)

- [ ] **Step 1: Full manual test — desktop**

Open `http://localhost:8000` in Chrome and Firefox. Test:
1. Home page loads with metaball shader background
2. Scroll down — blocks compress with clay physics, top first
3. Scroll up — blocks compress from bottom
4. Navigate to Projects — putty transition, toolbar stays fixed
5. Cards have elastic cursor effects (drift, border-radius morph)
6. Navigate to Blog — transition works, blog posts load
7. Navigate to About — transition, map renders, contact section has elastic
8. Theme toggle — shader adjusts, all effects continue
9. Fast scrolling — no jank, metaball blobs elongate
10. Idle — elements fully at rest, no breathing/animation

- [ ] **Step 2: Full manual test — mobile**

Open at 375px width (mobile simulation). Test:
1. Carousel uses native scroll-snap
2. Hamburger menu works
3. Scroll deformation works via touch
4. No cursor effects (touch device)
5. Metaball shader renders (fewer blobs)
6. Page transitions work

- [ ] **Step 3: Reduced motion test**

Enable reduced motion in DevTools Rendering tab. Verify:
1. No elastic deformation
2. Simple page transitions
3. Shader renders once as static
4. No SVG filters

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: elastic UI revamp — metaball shader, clay scroll physics, putty transitions, cursor proximity effects"
```
