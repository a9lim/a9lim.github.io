/* ===================================================================
   shared/tokens.js — Design token source of truth for all a9l.im sites.
   Loaded in <head> before each project's colors.js, which extends
   _FONT/_PALETTE with project-specific keys then freezes both.
   =================================================================== */

// ─── Color helpers ───

/**
 * Append an alpha byte to a 6-digit hex color.
 * @param {string} hex  "#RRGGBB"
 * @param {number} a    Alpha in [0, 1]
 * @returns {string} "#RRGGBBAA"
 */
const _r = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

/**
 * Parse a 6-digit hex color into normalized [r, g, b] in [0, 1].
 * @param {string} hex  "#RRGGBB"
 * @returns {number[]}
 */
const _parseHex = (hex) => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255
];

/**
 * Convert normalized RGB to HSL.
 * @param {number} r  Red   [0, 1]
 * @param {number} g  Green [0, 1]
 * @param {number} b  Blue  [0, 1]
 * @returns {number[]} [h (0-360), s (0-1), l (0-1)]
 */
function _rgb2hsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

/**
 * Convert HSL to 6-digit hex.
 * Uses the CSS Color Level 4 algorithm (direct channel computation).
 * @param {number} h  Hue [0, 360]
 * @param {number} s  Saturation [0, 1]
 * @param {number} l  Lightness [0, 1]
 * @returns {string} "#RRGGBB"
 */
function _hsl2hex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}

/**
 * Darken a hex color by reducing saturation to 92% and lightness to 75%.
 * Used by project colors.js files to derive dark-mode variants.
 * @param {string} hex  "#RRGGBB"
 * @returns {string} "#RRGGBB"
 */
const _darken = (hex) => {
  const [h, s, l] = _rgb2hsl(..._parseHex(hex));
  return _hsl2hex(h, s * 0.92, l * 0.75);
};

/**
 * Convert OKLCH to 6-digit hex (sRGB gamut-clamped).
 * @param {number} L  Lightness [0, 1]
 * @param {number} C  Chroma   [0, ~0.4]
 * @param {number} H  Hue      [0, 360]
 * @returns {string} "#RRGGBB"
 */
function _oklch2hex(L, C, H) {
  const h = H * Math.PI / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  let l = L + 0.3963377774 * a + 0.2158037573 * b;
  let m = L - 0.1055613458 * a - 0.0638541728 * b;
  let s = L - 0.0894841775 * a - 1.2914855480 * b;
  l = l * l * l; m = m * m * m; s = s * s * s;
  let R = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  const gamma = v => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  const toHex = v => Math.round(Math.max(0, Math.min(1, gamma(v))) * 255).toString(16).padStart(2, '0');
  return '#' + toHex(R) + toHex(G) + toHex(B);
}

// ─── Font stacks ───
// Left mutable — a project's colors.js may add keys before freezing.
// Newsreader carries Latin text. Greek, Cyrillic, super/subscripts, operators
// and arrows fall through to build-time STIX Two subsets, and Japanese to a
// Shippori Mincho subset, all sized to Newsreader (static/fonts/fonts.css).
const _FONT = {
  text:  "'Newsreader', 'STIX Two Text', 'STIX Two Math', 'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif",
  code:  "ui-monospace, 'SF Mono', 'Menlo', 'Consolas', monospace",
  emoji: "'Noto Emoji', sans-serif",
};

// ─── Palette ───
// Left mutable — each project's colors.js adds keys then freezes.
//
// Neutrals are near-achromatic (OKLCH chroma < 0.004), so the ground reads
// neither blue-white nor beige. The accent is per theme: oxblood on the light
// ground, a lighter red on the dark one. Every text role clears 4.5:1 on every
// surface in both themes (lowest: dark accent on elevated, 4.66:1).
//
// The inks are the data hues: eleven pigments fitted in OKLCH at chroma
// 0.05–0.12, each paired per theme so it clears 4.5:1 on canvas and panel in
// both, and any ink can set text (docs/sim-overhaul/sketches/inks.py). Red is
// not an ink: the accent is the one red. Graphite, the neutral data hue, is
// textMuted. Inks differ per theme, so canvas and WebGPU code reads them from
// _themePalette() on every theme change, as it reads the accent.
const _INKS = {
  //            light      dark
  indigo:    ['#586AB2', '#7486CB'],
  prussian:  ['#3473A3', '#548EBE'],
  verdigris: ['#2A7976', '#4A9593'],
  viridian:  ['#317B55', '#4F9770'],
  sap:       ['#5B7637', '#779252'],
  ochre:     ['#8B681B', '#A8843C'],
  sienna:    ['#9F5D31', '#BC7950'],
  umber:     ['#7C6049', '#997D64'],
  madder:    ['#A65179', '#C07095'],
  mulberry:  ['#97588E', '#B275A9'],
  violet:    ['#7D60A6', '#977DBF'],
};
const _inksFor = (i) => Object.fromEntries(Object.entries(_INKS).map(([k, v]) => [k, v[i]]));

const _PALETTE = {
  light: {
    canvas:        '#FCFCFB',  // L 0.991 — page ground
    panelSolid:    '#F4F3F2',  // L 0.965 — inset blocks, chips, solid HUD panels
    elevated:      '#FFFFFF',  // L 1.000 — the rare raised surface
    text:          '#161514',  // L 0.196
    textSecondary: '#42413F',  // L 0.376
    textMuted:     '#666463',  // L 0.505 — also graphite, the neutral data hue
    accent:        '#983432',  // oklch(0.470 0.135 25) — oxblood
    inks:          _inksFor(0),
  },

  dark: {
    canvas:        '#121111',  // L 0.179
    panelSolid:    '#161615',  // L 0.200
    elevated:      '#1B1A1A',  // L 0.219
    text:          '#ECEBEA',  // L 0.941
    textSecondary: '#BEBDBC',  // L 0.799
    textMuted:     '#949392',  // L 0.664
    accent:        '#DC5960',  // oklch(0.635 0.164 20)
    inks:          _inksFor(1),
  },
};

/**
 * Load every face canvas text can draw with: Newsreader roman and italic and
 * the STIX Two fallback slices. Canvas drawing never starts a webfont download
 * by itself, so a project waits on this before measuring or redrawing text;
 * shared/colophon.js starts it on every .sim-body page. Memoized; resolves
 * (never rejects) once the faces have loaded or failed.
 * @returns {Promise<void>}
 */
let _textFontsReady = null;
function _loadTextFonts() {
  if (!_textFontsReady) {
    const fonts = document.fonts;
    const sample = 'Aα₂∇→';  // one character from each slice
    _textFontsReady = !fonts ? Promise.resolve() : Promise.all([
      fonts.load(`400 16px ${_FONT.text}`, sample),
      fonts.load(`italic 400 16px ${_FONT.text}`, sample),
    ]).then(() => {}, () => {});
  }
  return _textFontsReady;
}

/**
 * The palette for the theme currently on <html data-theme>.
 * Canvas and WebGPU renderers read per-theme colors (including `accent`)
 * through this on every theme change rather than caching one theme.
 * @returns {object} _PALETTE.light or _PALETTE.dark
 */
const _themePalette = () =>
  document.documentElement.dataset.theme === 'dark' ? _PALETTE.dark : _PALETTE.light;

// ─── CSS custom property injection ───
// Generates light-mode vars at :root and dark-mode overrides at [data-theme="dark"].
// Entries with alpha values (lA/dA) produce 8-digit hex; others pass through raw.
(function injectPaletteVars() {
  const P = _PALETTE, L = P.light, D = P.dark;

  // [css-prop-name, palette-key, light-alpha?, dark-alpha?]
  const themed = [
    ['bg-canvas',      'canvas'],
    ['bg-panel',       'panelSolid',    0.84,  0.86],
    ['bg-panel-solid', 'panelSolid'],
    ['bg-elevated',    'elevated'],
    ['bg-hover',       'text',          0.039, 0.051],

    ['text',           'text'],
    ['text-secondary', 'textSecondary'],
    ['text-muted',     'textMuted'],

    ['accent',         'accent'],
    ['accent-line',    'accent',        0.40,  0.40],
    ['accent-subtle',  'accent',        0.078, 0.10],

    ['border',         'text',          0.12,  0.13],
    ['border-strong',  'text',          0.22,  0.24],
    ['slider-track',   'text',          0.08,  0.10],
    ['tog-bg',         'text',          0.16,  0.20],
  ];

  const gen = (T, dark) => themed.map(([name, key, lA, dA]) => {
    const a = dark ? (dA ?? lA) : lA;
    return `  --${name}: ${a != null ? _r(T[key], a) : T[key]};`;
  }).join('\n');

  const genInks = (T) => Object.entries(T.inks).map(([k, v]) => `  --ink-${k}: ${v};`).join('\n');

  const style = document.createElement('style');
  style.id = 'palette-vars';
  style.textContent = `:root {
  --font-text:  ${_FONT.text};
  --font-code:  ${_FONT.code};
  --font-emoji: ${_FONT.emoji};

${gen(L, false)}

  --text-on-accent: ${L.elevated};
${genInks(L)}
  color-scheme: light;
}
[data-theme="dark"] {
${gen(D, true)}

  --text-on-accent: ${D.elevated};
${genInks(D)}
  color-scheme: dark;
}`;
  document.head.appendChild(style);

  // Theme-color <meta> is set by shared/colophon.js syncThemeColor() on theme init/toggle.
})();

/**
 * Convert HSL (h: 0–360, s: 0–1, l: 0–1) to normalized [r, g, b] floats (0–1).
 * Complements _parseHex (hex→RGB) and _rgb2hsl (RGB→HSL) for full round-trip.
 * @param {number} h  Hue 0–360
 * @param {number} s  Saturation 0–1
 * @param {number} l  Lightness 0–1
 * @returns {[number, number, number]}
 */
function _hsl2rgb(h, s, l) {
  var c = (1 - Math.abs(2 * l - 1)) * s;
  var x = c * (1 - Math.abs((h / 60) % 2 - 1));
  var m = l - c / 2;
  var r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return [r + m, g + m, b + m];
}

// Expose as globals — ES6 modules in each project read these from window
window._r = _r;
window._parseHex = _parseHex;
window._rgb2hsl = _rgb2hsl;
window._hsl2hex = _hsl2hex;
window._hsl2rgb = _hsl2rgb;
window._darken = _darken;
window._oklch2hex = _oklch2hex;
window._FONT = _FONT;
window._PALETTE = _PALETTE;
window._INKS = _INKS;
window._themePalette = _themePalette;
window._loadTextFonts = _loadTextFonts;

/**
 * Freeze _PALETTE (light, dark, their inks) and _FONT.
 * Called by each project's colors.js after extending with project-specific keys.
 */
function _freezeTokens() {
  Object.freeze(_PALETTE.light.inks);
  Object.freeze(_PALETTE.dark.inks);
  Object.freeze(_PALETTE.light);
  Object.freeze(_PALETTE.dark);
  Object.freeze(_FONT);
  Object.freeze(_PALETTE);
}

/**
 * Inject project-specific CSS custom properties via a <style> tag.
 * @param {string} lightCSS  CSS variable declarations for :root (light mode)
 * @param {string} darkCSS   CSS variable declarations for [data-theme="dark"]
 * @param {string} [id='project-vars']  Style element ID
 */
function _injectProjectVars(lightCSS, darkCSS, id) {
  var style = document.createElement('style');
  style.id = id || 'project-vars';
  style.textContent = ':root {\n' + lightCSS + '\n}\n'
    + '[data-theme="dark"] {\n' + (darkCSS || '') + '\n}';
  document.head.appendChild(style);
}

window._freezeTokens = _freezeTokens;
window._injectProjectVars = _injectProjectVars;
