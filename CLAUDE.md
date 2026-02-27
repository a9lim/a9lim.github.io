# CLAUDE.md

Part of the **a9l.im** portfolio. This is the root site — it hosts the shared design system files consumed by all sub-projects. See parent `site-meta/CLAUDE.md` for the full shared design system specification.

## Overview

Portfolio site for **a9l.im**, hosted via GitHub Pages at `a9lim.github.io`. Custom domain configured via `CNAME` file. Multi-page SPA with landing, projects, blog, and about/contact pages.

| Sibling Project | Repo | Path |
|----------------|------|------|
| Relativistic N-Body Sim | `a9lim/physsim` | `/physsim` |
| Cellular Metabolism Sim | `a9lim/biosim` | `/biosim` |
| Gerrymandering Simulator | `a9lim/gerry` | `/gerry` |

## Running Locally

```bash
python -m http.server
# Navigate to http://localhost:8000
```

No build step, no dependencies. Static files served directly via GitHub Pages.

## Architecture

Traditional page layout (not floating panels over canvas like the simulation sub-projects). WebGL shader background provides animated noise texture.

### Deployment

- GitHub Pages repo (`a9lim.github.io` → serves as root of `a9l.im`)
- Custom domain: `a9l.im` (set in `CNAME` file — do not delete)
- Sub-projects are separate repos deployed as GitHub Pages project sites (e.g. `a9l.im/physsim`)

### Shared Files (hosted here, consumed by all projects)

This repo hosts two shared files that all sub-projects load:

- **`shared-tokens.js`**: Color math helpers (`_r`, `_parseHex`, `_rgb2hsl`, `_hsl2hex`, `_darken`), `_FONT`, `_PALETTE` with shared design tokens (surfaces, text, accent, shadows, `extended` sub-object with 10 cross-project colors). Sub-projects load via `<script src="/shared-tokens.js">` then extend with project-specific keys in their own `colors.js`.
- **`shared-base.css`**: Reset, layout tokens, body base, `.glass`, `.tool-btn` (34×34 sim-style), shared keyframes, intro screen, sidebar stat patterns, tab system, control group/row, slider value, preset dialog, shared responsive blocks (900px/600px/440px), form controls, `prefers-reduced-motion`. Sub-projects load via `<link href="/shared-base.css">`.

**Do not break these files** — all four projects depend on them.

## Color System

This site's `colors.js` is minimal — it does not add project-specific palette colors. The root site uses only the shared tokens from `shared-tokens.js` (surfaces, text, accent, shadows).

## UI & Layout

- **Traditional page layout** — uses `page-container` / `page-section` pattern, not floating panels over a canvas
- **No intro screen** — root site uses a hero section instead
- **WebGL shader background**: `#shader-bg` canvas provides animated noise texture. Opacity varies by theme (0.4 light, 0.3 dark).
- **Scroll-triggered fade-ins**: `.fade-in` + `.visible` with staggered `transition-delay` via `:nth-child`
- **Blog**: Renders markdown from fetched `.md` files. Blog content typography in `.blog-content` styles.

### Root Site Overrides (styles.css)

- **`--toolbar-h: 56px`** (shared default is 52px) — taller navbar for the portfolio site
- **`.tool-btn`**: overridden to 36×36, `inline-flex`, `border: none`, `color: var(--text-secondary)` (shared base is 34×34 sim-style)

## Key Patterns

- **Theme toggle**: Light/dark via `data-theme` on `<html>`. `<html data-theme="light">` in markup.
- **`.glass`** (from shared-base.css): applied to `#navbar`.
- **No hardcoded colors in CSS** — all via `var(--*)`.
- **Fonts via `<link>` tags** in HTML, not `@import` in CSS.

## Gotchas

- **Do not delete `CNAME`** — it configures the `a9l.im` custom domain.
- **Shared files are critical** — `shared-tokens.js` and `shared-base.css` are loaded by all four projects. Breaking changes here break everything.
- **Root site uses relative paths** for shared files (`shared-base.css`, `shared-tokens.js`) — sub-projects use absolute paths (`/shared-base.css`, `/shared-tokens.js`).
