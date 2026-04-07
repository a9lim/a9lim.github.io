# Command Center UI Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the a9l.im visual language from soft/organic to sharp/geometric engineering aesthetic — Evangelion NERV HQ meets Palantir Foundry.

**Architecture:** Token-first approach — change shared-tokens.js and shared-base.css first (cascades into all sims), then rework root site CSS for HUD/opaque surface split, rewrite the WebGL shader, and surgically fix sim breakage.

**Tech Stack:** CSS custom properties, WebGL/GLSL, Recursive variable font, existing shared-*.js module system.

---

### Task 1: Radius Token Consolidation

**Files:**
- Modify: `shared-base.css:13-27` (token definitions)
- Modify: `shared-tokens.js:199` (shadow tokens referencing radius)

- [ ] **Step 1: Replace radius token definitions in shared-base.css**

In `shared-base.css`, replace the four radius tokens with one:

```css
/* ─── Layout Tokens ─── */
:root {
    --radius: 2px;

    --toolbar-h: 52px;
    --panel-w: 350px;

    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

This also removes `--ease-spring` and `--ease-elastic` (spec Section 6).

- [ ] **Step 2: Migrate all radius references in shared-base.css**

Find-and-replace across the file:
- `var(--radius-sm)` → `var(--radius)`
- `var(--radius-md)` → `var(--radius)`
- `var(--radius-lg)` → `var(--radius)`
- `var(--radius-pill)` → `var(--radius)`

Also find any `calc()` expressions that reference the old tokens (e.g., `calc(var(--radius-md) - 2px)`) and replace with `var(--radius)`.

- [ ] **Step 3: Migrate all --ease-spring references in shared-base.css**

Find-and-replace: `var(--ease-spring)` → `var(--ease-out)`

- [ ] **Step 4: Migrate radius and easing references in styles.css (root site)**

Same find-and-replace operations as Steps 2 and 3, applied to `styles.css`.

- [ ] **Step 5: Migrate radius references in all sim stylesheets**

Apply the same radius find-and-replace to:
- `scripture/styles.css`
- `shoals/styles.css`
- `gerry/styles.css`
- `cyano/styles.css`
- `geon/styles.css`

Also migrate `--ease-spring` → `--ease-out` in `cyano/styles.css` (2 instances).

- [ ] **Step 6: Migrate hardcoded border-radius values**

Search all `.css` files for hardcoded `border-radius` values that aren't `0`, `50%`, or `var(--radius)`. Replace non-circular values (anything that isn't `50%` or `0`) with `var(--radius)` where they represent UI element rounding. Leave `border-radius: 0` and `border-radius: 50%` (circles for avatars/dots) as-is.

- [ ] **Step 7: Migrate --ease-spring references in styles.css**

Find-and-replace in `styles.css`: `var(--ease-spring)` → `var(--ease-out)` (~20 instances).

- [ ] **Step 8: Test locally**

Run: `cd /Users/a9lim/Work/a9lim.github.io && python -m http.server 8000`

Open `http://localhost:8000` and verify:
- All elements have 2px radius (cards, buttons, toggles, tags, navbar, inputs)
- No broken layouts from missing token references
- No pill-shaped elements remaining
- No bouncy/elastic animations remaining

- [ ] **Step 9: Commit**

```bash
git add shared-base.css styles.css scripture/styles.css shoals/styles.css gerry/styles.css cyano/styles.css geon/styles.css
git commit -m "refactor: consolidate radius tokens to single --radius: 2px, remove spring/elastic easing"
```

---

### Task 2: Typography — font-variation-settings

**Files:**
- Modify: `shared-base.css:29-37` (body base)

- [ ] **Step 1: Add font-variation-settings to body**

In `shared-base.css`, update the body base block:

```css
/* ─── Body Base ─── */
body {
    background: var(--bg-canvas);
    color: var(--text);
    font-family: var(--font-mono);
    font-variation-settings: 'MONO' 1, 'CASL' 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    transition: background-color 0.5s var(--ease-out), color 0.4s var(--ease-out);
}
```

This changes `font-family` from `var(--font-sans)` to `var(--font-mono)` and adds the variation settings. Since all font vars now resolve to Recursive, this is belt-and-suspenders — but `--font-mono` is the semantically correct token.

- [ ] **Step 2: Test locally**

Open `http://localhost:8000` and verify:
- All text renders in Recursive with linear (non-casual) letterforms
- No FOUT or missing characters
- Scripture reading pane is readable (may need line-height adjustment in Task 7)

- [ ] **Step 3: Commit**

```bash
git add shared-base.css
git commit -m "feat: set Recursive MONO 1 CASL 0 as global font-variation-settings"
```

---

### Task 3: Shadow Token Overhaul

**Files:**
- Modify: `shared-tokens.js:200-210` (shadow token definitions in light mode)
- Modify: `shared-tokens.js:252-258` (shadow token definitions in dark mode)
- Modify: `shared-base.css` (shadow references)
- Modify: `styles.css` (shadow references)

- [ ] **Step 1: Replace shadow tokens in shared-tokens.js**

In the light-mode `:root` block of `injectPaletteVars()`, replace the shadow definitions:

```js
  --shadow-hover: 0 1px 3px #0000000a, 0 2px 8px #00000008;
  --shadow-hover-lg: 0 2px 4px #0000000a, 0 4px 16px #00000012, 0 8px 32px #0000000a;
  --shadow-glow: 0 0 20px ${_r(P.accent, 0.15)}, 0 0 60px ${_r(P.accent, 0.08)};
  --shadow-glow-lg: 0 0 30px ${_r(P.accent, 0.2)}, 0 0 80px ${_r(P.accent, 0.12)}, 0 0 120px ${_r(P.accent, 0.06)};
```

Remove `--shadow-xs`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`.

- [ ] **Step 2: Replace dark-mode shadow tokens**

In the `[data-theme="dark"]` block, replace:

```js
  --shadow-hover: 0 1px 3px #00000033, 0 2px 8px #00000028;
  --shadow-hover-lg: 0 2px 4px #00000033, 0 4px 16px #0000003d, 0 8px 32px #00000028;
  --shadow-glow: 0 0 20px ${_r(P.accent, 0.2)}, 0 0 60px ${_r(P.accent, 0.1)};
  --shadow-glow-lg: 0 0 30px ${_r(P.accent, 0.25)}, 0 0 80px ${_r(P.accent, 0.15)}, 0 0 120px ${_r(P.accent, 0.08)};
```

Remove `--shadow-xs` through `--shadow-xl`.

- [ ] **Step 3: Migrate shadow references in shared-base.css**

Find-and-replace:
- `var(--shadow-xs)` → `var(--shadow-hover)`
- `var(--shadow-sm)` → `var(--shadow-hover)`
- `var(--shadow-md)` → `var(--shadow-hover-lg)`
- `var(--shadow-lg)` → `var(--shadow-hover-lg)`
- `var(--shadow-xl)` → `var(--shadow-hover-lg)`

Also remove the `.elevation-1` through `.elevation-4` utility classes if present (they referenced the old tiers).

- [ ] **Step 4: Migrate shadow references in styles.css**

Same find-and-replace as Step 3, applied to `styles.css` (~5 instances).

- [ ] **Step 5: Migrate shadow references in sim stylesheets**

Check and migrate `shoals/styles.css` (1 instance of `--shadow-sm`).

- [ ] **Step 6: Commit**

```bash
git add shared-tokens.js shared-base.css styles.css shoals/styles.css
git commit -m "refactor: collapse shadow tokens to hover/hover-lg/glow/glow-lg"
```

---

### Task 4: Glass & HUD Surface Treatment

**Files:**
- Modify: `shared-base.css:40-47` (.glass class)
- Modify: `shared-base.css` (all backdrop-filter instances)
- Modify: `shared-tokens.js` (--bg-panel opacity)
- Modify: `styles.css` (navbar, contact card, footer surface treatment)
- Modify: `scripture/styles.css` (backdrop-filter instances)
- Modify: `shoals/styles.css` (backdrop-filter instances)

- [ ] **Step 1: Update .glass class in shared-base.css**

Replace the `.glass` class with HUD-tuned parameters:

```css
/* ─── Glass Panel (HUD overlay) ─── */
.glass {
    background: var(--bg-panel);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: none;
    box-shadow: none;
    transition: box-shadow 0.2s var(--ease-out), background 0.2s var(--ease-out);
}
```

Changes: blur `20px` → `8px`, `saturate(1.5)` removed, transition timing `0.3s` → `0.2s`.

- [ ] **Step 2: Reduce --bg-panel opacity in shared-tokens.js**

In the `themed` array inside `injectPaletteVars()`, change the `bg-panel` alpha values:

```js
['bg-panel',       'panelSolid',    0.32,  0.35],
```

Was `0.55` / `0.58`. This makes HUD elements more transparent (30-35% opacity).

- [ ] **Step 3: Update all other backdrop-filter instances in shared-base.css**

Search for remaining `blur(20px)` and update to `blur(8px)`. Also remove `saturate(1.5)` from all instances.

- [ ] **Step 4: Make structural elements opaque in styles.css**

For cards, blog entries, contact card, and footer — ensure they use solid backgrounds instead of `.glass`. Find elements that currently use `.glass` or `var(--bg-panel)` but should be opaque per the spec, and change them to `var(--bg-elevated)` or `var(--bg-panel-solid)`.

Key elements to make opaque:
- `.project-card` — should use `background: var(--bg-elevated)`
- `.blog-entry` — should use `background: var(--bg-elevated)`
- `.contact-section` — remove `.glass` class, use `background: var(--bg-elevated)`
- `footer` — use `background: var(--bg-panel-solid)`

- [ ] **Step 5: Add HUD line accents to navbar**

In `styles.css`, add a faint accent underline to the navbar:

```css
#navbar {
    border-bottom: 1px solid var(--accent-subtle);
}
```

And add a subtle glow to the active nav link:

```css
.nav-link.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
}
```

- [ ] **Step 6: Update backdrop-filter in sim stylesheets**

In `scripture/styles.css`: change all `blur(20px) saturate(1.5)` to `blur(8px)` and all `blur(12px) saturate(1.5)` to `blur(8px)`. Remove `saturate(1.5)` from all instances.

In `shoals/styles.css`: same changes for `.settings-dropdown`.

- [ ] **Step 7: Test locally**

Verify:
- Navbar is highly transparent — grid/shader visible through
- Cards and blog entries are solid/opaque
- Contact card is opaque
- Active nav link has accent underline with faint glow
- Scripture overlays show reduced blur

- [ ] **Step 8: Commit**

```bash
git add shared-base.css shared-tokens.js styles.css scripture/styles.css shoals/styles.css
git commit -m "feat: split surfaces into opaque (structural) and HUD (translucent), reduce glass blur to 8px"
```

---

### Task 5: WebGL Shader Rewrite

**Files:**
- Modify: `src/shader.js:23-100` (FRAG_SRC constant — full replacement)

- [ ] **Step 1: Replace the fragment shader**

Replace the `FRAG_SRC` constant in `src/shader.js` with the new geometric dual-layer shader. The vertex shader and all JS scaffolding (uniforms, render loop, resize, events) remain unchanged.

```js
const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  uniform vec3  u_accent;
  uniform vec3  u_canvasLight;
  uniform vec3  u_canvasDark;
  uniform float u_dark;
  uniform float u_scroll;

  // ── Simplex noise (Ashima Arts) ──
  vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
  vec3 permute(vec3 x) { return mod289((x * 34.0 + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time * 0.12;
    float sc = u_scroll * 0.5;

    // ── Layer 1: Dot grid substrate ──
    // Evenly spaced points with subtle luminosity variation
    float gridSize = 25.0;
    vec2 gridUV = fract(uv * u_res / gridSize);
    float dotDist = length(gridUV - 0.5);
    float dot = smoothstep(0.08, 0.02, dotDist);

    // Vary dot brightness with slow noise field
    float dotNoise = snoise(uv * 3.0 + vec2(t * 0.3, sc)) * 0.5 + 0.5;
    float dotLayer = dot * dotNoise * mix(0.06, 0.04, u_dark);

    // ── Layer 2: Topographic contours ──
    // Noise field rendered as sharp isolines
    float field = snoise(uv * 2.5 + vec2(t * 0.5 + sc, t * 0.2));
    float field2 = snoise(uv * 1.2 + vec2(-t * 0.3, t * 0.4 + sc * 0.6));
    float combined = field * 0.6 + field2 * 0.4;

    // Extract isolines: sharp bands at regular intervals
    float contourFreq = 12.0;
    float contourRaw = fract(combined * contourFreq);
    // Sharp line at each contour crossing
    float contour = 1.0 - smoothstep(0.0, 0.06, abs(contourRaw - 0.5) - 0.44);

    // Accent hotspots at contour density peaks
    float density = abs(dFdx(combined) * u_res.x) + abs(dFdy(combined) * u_res.y);
    float hotspot = smoothstep(1.5, 4.0, density * contourFreq);

    // ── Compose ──
    vec3 canvasBg = mix(u_canvasLight, u_canvasDark, u_dark);

    // Contour lines in subtle white
    float contourAlpha = contour * mix(0.08, 0.06, u_dark);

    // Accent bleed at hotspots
    vec3 contourColor = mix(vec3(1.0), u_accent, hotspot * 0.6);

    // Angular vignette: darken corners more than edges
    vec2 vUV = abs(uv - 0.5) * 2.0;
    float vig = 1.0 - pow(max(vUV.x, vUV.y), 2.5) * 0.6;

    // Final composite
    float alpha = (dotLayer + contourAlpha) * vig;
    vec3 color = mix(vec3(1.0), contourColor, contour / max(contour + dotLayer * 10.0, 0.001));

    gl_FragColor = vec4(color * canvasBg + contourColor * contourAlpha * 2.0, alpha);
  }
`;
```

Key differences from the old shader:
- **Dot grid**: `fract()` grid with `smoothstep` point rendering, brightness modulated by slow noise
- **Contour lines**: `fract(noise * freq)` isolines with `smoothstep` edge sharpening — creates topographic bands
- **Hotspots**: `dFdx`/`dFdy` derivative-based density detection — accent color bleeds where contours cluster
- **Angular vignette**: `max(vUV.x, vUV.y)` corner emphasis instead of radial `length()`
- **Slower animation**: time multiplier reduced from `0.18` to `0.12`

Note: `dFdx`/`dFdy` require the `OES_standard_derivatives` extension in WebGL 1. Add the extension request.

- [ ] **Step 2: Enable OES_standard_derivatives**

In the `initShader` function in `src/shader.js`, after getting the WebGL context (line 115), add:

```js
gl.getExtension('OES_standard_derivatives');
```

And add `#extension GL_OES_standard_derivatives : enable` at the top of the fragment shader (before the `precision` statement — extensions must come first in GLSL):

```glsl
#extension GL_OES_standard_derivatives : enable
precision mediump float;
```

- [ ] **Step 3: Test locally**

Open `http://localhost:8000` and verify:
- Dot grid is visible as subtle points across the background
- Topographic contour lines are visible and slowly shifting
- Accent color appears at areas where contours cluster
- Corners are darker than edges (angular vignette)
- Scrolling shifts the field
- Theme toggle transitions smoothly
- No WebGL errors in console

- [ ] **Step 4: Test reduced motion**

In Chrome DevTools, toggle `prefers-reduced-motion: reduce`. Verify the shader renders once and stops (existing behavior from the render loop, no shader changes needed).

- [ ] **Step 5: Commit**

```bash
git add src/shader.js
git commit -m "feat: replace organic noise shader with geometric dot-grid + topographic contour system"
```

---

### Task 6: Shimmer & Interaction Effect Tuning

**Files:**
- Modify: `styles.css` (card effects, CTA, hero, carousel)
- Modify: `src/card-effects.js` (mouse-tracking shimmer parameters)

- [ ] **Step 1: Tighten card shimmer in card-effects.js**

Read `src/card-effects.js` and adjust the radial gradient shimmer:
- Reduce radius from `600px` to `300px`
- Reduce opacity (the shimmer color should be more subtle)
- Sharper falloff (less feathering at the edge)

- [ ] **Step 2: Add accent side-line to project cards in styles.css**

Add a `::before` pseudo-element for a left accent line that slides in on hover:

```css
.project-card::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--accent);
    opacity: 0;
    transition: opacity 0.2s var(--ease-out);
}

.project-card:hover::before {
    opacity: 1;
    box-shadow: 0 0 12px var(--accent-glow);
}
```

Note: check if `.project-card::before` is already used (the exploration found a gradient overlay). If so, use `::after` or restructure.

- [ ] **Step 3: Update CTA button hover effect**

In `styles.css`, find `.hero-cta` (or the main CTA class). Replace any sweep/shimmer animation with a luminosity shift:

```css
.hero-cta:hover {
    background: var(--accent-light);
    box-shadow: var(--shadow-glow);
}
```

Remove any `::before` sweep animation on the CTA if present.

- [ ] **Step 4: Slow the hero tagline gradient animation**

Find the `gradient-shift` or `hero-gradient` keyframe animation in `styles.css`. Change the duration from `4s` to `8s` for a more deliberate pace.

- [ ] **Step 5: Update carousel cards**

Add the same accent side-line treatment to `.carousel-card` as project cards (Step 2). Also ensure carousel dot navigation works with `--radius: 2px` (dots become small squares — verify this looks intentional).

- [ ] **Step 6: Standardize transition timing**

Search `styles.css` for transition durations. Standardize:
- Hover color/opacity transitions: `0.2s var(--ease-out)`
- Transform/slide transitions: `0.3s var(--ease-out)`

Replace any `0.5s` hover transitions with `0.2s` and any `0.4s` transforms with `0.3s`.

- [ ] **Step 7: Remove text-shadow shimmer effects**

Search `styles.css` for `text-shadow` on hover states. Remove shimmer text-shadows (e.g., the carousel h3 hover glow). Keep any text-shadow that's used for readability (e.g., text over images).

- [ ] **Step 8: Test locally**

Verify:
- Card hover shows tighter spotlight shimmer + accent left line with faint glow
- CTA hover is a clean luminosity shift, no sweep
- Hero gradient cycles slowly (8s)
- Carousel dots are square
- No bouncy transitions remain
- All hover timings feel snappy (0.2s)

- [ ] **Step 9: Commit**

```bash
git add styles.css src/card-effects.js
git commit -m "feat: tighten shimmer, add accent side-lines, standardize timing to 0.2s/0.3s"
```

---

### Task 7: Sim-Level Surgical Fixes

**Files:**
- Modify: `scripture/styles.css` (reading pane line-height)
- Modify: various sim stylesheets (verify no visual breakage)

- [ ] **Step 1: Scripture reading pane readability**

In `scripture/styles.css`, find the reading pane text styles (`.verse-text` or similar). Increase `line-height` to `1.75` and add `letter-spacing: 0.01em` for mono readability at length.

- [ ] **Step 2: Visual audit — open each sim**

Start the local server and open each sim in sequence:
- `http://localhost:8000/geon/`
- `http://localhost:8000/cyano/`
- `http://localhost:8000/gerry/`
- `http://localhost:8000/shoals/`
- `http://localhost:8000/scripture/`

For each, check:
- Toolbar renders correctly (glass/HUD treatment, no broken layouts)
- Sidebar panels look correct
- Mode toggles work (accent indicator slides)
- Tags and labels are readable
- No visual artifacts from radius/shadow/easing changes

- [ ] **Step 3: Fix any breakage found in audit**

Apply surgical fixes. Common issues to watch for:
- Elements that relied on `--radius-pill` for their shape (e.g., toggle thumbs, status dots)
- Animations that relied on `--ease-spring` for their feel
- Glass panels that look wrong with reduced blur

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: surgical sim fixes for command-center UI token changes"
```

---

### Task 8: 404 Page & Miscellaneous

**Files:**
- Modify: `404.html` (font references, radius)

- [ ] **Step 1: Update 404.html**

The 404 page has inline styles. Update:
- `font-family: var(--font-sans)` → `font-family: var(--font-mono)`
- Add `font-variation-settings: 'MONO' 1, 'CASL' 0` to the body style
- Replace any hardcoded border-radius with `2px`

- [ ] **Step 2: Commit**

```bash
git add 404.html
git commit -m "fix: update 404 page to command-center UI tokens"
```

---

### Task 9: Final Integration Test

- [ ] **Step 1: Full site walkthrough**

Navigate every route:
- `/` (hero, carousel)
- `/projects` (project grid)
- `/blog` (blog listing)
- `/blog/{any-slug}` (blog post)
- `/about` (contact, world map)
- Each sim's index page

Verify the overall aesthetic is cohesive: sharp geometry, monospace everything, HUD overlays translucent with subtle glow, structural elements opaque, shader shows dot grid + contour lines.

- [ ] **Step 2: Dark/light mode toggle on every page**

Toggle theme on each page. Verify smooth transitions, correct colors, shader adapts.

- [ ] **Step 3: Mobile check (≤900px)**

Resize to mobile width. Verify:
- Carousel uses native scroll-snap (no transform)
- Navbar hamburger works
- Mode toggles don't overflow
- Text is readable at mobile sizes with mono font

- [ ] **Step 4: Performance check**

Open DevTools Performance tab. Verify:
- Shader stops rendering after 1s idle (no continuous GPU usage)
- No layout thrashing from the CSS changes
- Page load is not noticeably slower

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration test fixes for command-center UI overhaul"
```
