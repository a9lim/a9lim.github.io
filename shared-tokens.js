/* ===================================================================
   shared-tokens.js — Design token source of truth for all a9l.im sites.
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
// Left mutable — cyano extends with `emoji` before freezing
const _FONT = {
  display: "'Merriweather', Georgia, 'Times New Roman', serif",
  body:      "'Lato', system-ui, -apple-system, sans-serif",
  bodySerif: "'Crimson Text', Georgia, 'Times New Roman', serif",
  mono:      "'Recursive', 'SF Mono', 'Menlo', monospace",
};

// ─── Palette ───
// Left mutable — each project's colors.js adds keys then freezes.
//
// OKLCH-harmonized: all neutrals share H=255 (cool blue-gray);
// extended chromatic colors share L≈0.60–0.67, C≈0.10–0.17 for
// perceptually uniform brightness & saturation across hues.
const _PALETTE = {
  accent:      '#E11107',  // oklch(0.53  0.225  29)
  accentLight: '#E95142',  // oklch(0.64  0.19   29)

  light: {
    canvas:        '#EBEFF4',  // oklch(0.950 0.008 255)
    panelSolid:    '#F2F5F8',  // oklch(0.968 0.005 255)
    elevated:      '#F9FAFC',  // oklch(0.985 0.003 255)
    text:          '#0B1016',  // oklch(0.170 0.015 255)
    textSecondary: '#4E545C',  // oklch(0.445 0.015 255)
    textMuted:     '#777C83',  // oklch(0.585 0.012 255)
  },

  dark: {
    canvas:        '#080B11',  // oklch(0.150 0.013 255)
    panelSolid:    '#10151C',  // oklch(0.195 0.015 255)
    elevated:      '#191F25',  // oklch(0.235 0.015 255)
    text:          '#E1E5E9',  // oklch(0.920 0.007 255)
    textSecondary: '#878D94',  // oklch(0.640 0.012 255)
    textMuted:     '#4E5359',  // oklch(0.440 0.012 255)
  },

  // Cross-project semantic colors — OKLCH-harmonized (L≈0.60, C≈0.13)
  extended: {
    blue:    '#3590BF',  // oklch(0.62 0.11 235)
    green:   '#2CA470',  // oklch(0.64 0.13 160)
    slate:   '#767C85',  // oklch(0.585 0.015 255)
    orange:  '#C48225',  // oklch(0.66 0.13  70)
    rose:    '#C5547C',  // oklch(0.60 0.15   0)
    purple:  '#8160B5',  // oklch(0.56 0.13 300)
    brown:   '#945D36',  // oklch(0.53 0.09  55)
    red:     '#C84341',  // oklch(0.57 0.17  25)
    cyan:    '#31A5A5',  // oklch(0.66 0.10 195)
    yellow:  '#B9A624',  // oklch(0.72 0.14 100)
    magenta: '#AA55A4',  // oklch(0.58 0.15 330)
    lime:    '#5FAB4D',  // oklch(0.67 0.15 140)
    indigo:  '#5C69BC',  // oklch(0.55 0.13 275)
  },
};

// ─── CSS custom property injection ───
// Generates light-mode vars at :root and dark-mode overrides at [data-theme="dark"].
// Entries with alpha values (lA/dA) produce 8-digit hex; others pass through raw.
(function injectPaletteVars() {
  const P = _PALETTE, L = P.light, D = P.dark;

  // [css-prop-name, palette-key, light-alpha?, dark-alpha?]
  const themed = [
    ['bg-canvas',      'canvas'],
    ['bg-panel',       'panelSolid',    0.55,  0.58],
    ['bg-panel-solid', 'panelSolid'],
    ['bg-elevated',    'elevated'],
    ['bg-hover',       'text',          0.039, 0.051],

    ['text',           'text'],
    ['text-secondary', 'textSecondary'],
    ['text-muted',     'textMuted'],

    ['border',         'text',          0.078, 0.059],
    ['border-strong',  'text',          0.141, 0.122],
    ['slider-track',   'text',          0.06,  0.06],
  ];

  // Derive toggle track bg: desaturated, lightened version of textMuted
  const [tH, tS] = _rgb2hsl(..._parseHex(L.textMuted));
  const togBg = _hsl2hex(tH, tS * 0.5, 0.80);

  const gen = (T, dark) => themed.map(([name, key, lA, dA]) => {
    const a = dark ? (dA ?? lA) : lA;
    return `  --${name}: ${a != null ? _r(T[key], a) : T[key]};`;
  }).join('\n');

  const style = document.createElement('style');
  style.id = 'palette-vars';
  style.textContent = `:root {
  --font-display: ${_FONT.display};
  --font-body:    ${_FONT.body};
  --font-body-serif: ${_FONT.bodySerif};
  --font-mono:    ${_FONT.mono};

${gen(L, false)}

  --accent:        ${P.accent};
  --accent-light:  ${P.accentLight};
  --accent-subtle: ${_r(P.accent, 0.078)};
  --accent-glow:   ${_r(P.accent, 0.18)};

  --shadow-xs: 0 1px 2px #00000008;
  --shadow-sm: 0 1px 3px #0000000a, 0 2px 8px #00000008;
  --shadow-md: 0 2px 4px #0000000a, 0 4px 16px #00000012, 0 8px 32px #0000000a;
  --shadow-lg: 0 4px 8px #0000000a, 0 8px 24px #00000014, 0 16px 56px #0000001a;
  --shadow-xl: 0 8px 16px #0000000f, 0 16px 48px #0000001a, 0 32px 80px #00000022;
  --shadow-glow: 0 0 20px ${_r(P.accent, 0.15)}, 0 0 60px ${_r(P.accent, 0.08)};
  --shadow-glow-lg: 0 0 30px ${_r(P.accent, 0.2)}, 0 0 80px ${_r(P.accent, 0.12)}, 0 0 120px ${_r(P.accent, 0.06)};

  --tog-bg:             ${togBg};
  --tog-thumb-on:       ${L.elevated};
  --tog-border:         ${_r(L.text, 0.059)};
  --tog-shadow:         none;
  --tog-thumb-shadow:   transparent;
  --tog-checked-inset:  transparent;

  --intro-warm:       ${_r(P.accentLight, 0.08)};
  --intro-warm-hover: ${_r(P.accentLight, 0.12)};
  --intro-cool:       ${_r(P.extended.blue, 0.04)};
  --backdrop:         #0000004d;

  --overlay-base:     ${L.text};
  --overlay-60:       ${_r(L.text, 0.376)};
  --overlay-87:       ${_r(L.text, 0.867)};
  --overlay-full:     ${L.text};
  --overlay-hover-12: ${_r(L.text, 0.125)};
  --overlay-hover-25: ${_r(L.text, 0.25)};
  --overlay-hover-19: ${_r(L.text, 0.188)};
  --card-bg-end:      ${L.panelSolid};
  --ext-blue:         ${P.extended.blue};
  --ext-green:        ${P.extended.green};
  --ext-slate:        ${P.extended.slate};
  --ext-orange:       ${P.extended.orange};
  --ext-rose:         ${P.extended.rose};
  --ext-purple:       ${P.extended.purple};
  --ext-brown:        ${P.extended.brown};
  --ext-red:          ${P.extended.red};
  --ext-cyan:         ${P.extended.cyan};
  --ext-yellow:       ${P.extended.yellow};
  --ext-magenta:      ${P.extended.magenta};
  --ext-lime:         ${P.extended.lime};
  --ext-indigo:       ${P.extended.indigo};
  --overlay-text:     #FFFFFF;
  --overlay-text-dim: ${_r('#FFFFFF', 0.8)};
  --overlay-tint:     ${_r('#FFFFFF', 0.133)};
  --overlay-tint-dim: ${_r('#FFFFFF', 0.733)};
  --shimmer:          ${_r('#FFFFFF', 0.063)};
  --shimmer-subtle:   ${_r('#FFFFFF', 0.05)};
  color-scheme: light;
}
[data-theme="dark"] {
${gen(D, true)}

  --shadow-xs: 0 1px 2px #00000022;
  --shadow-sm: 0 1px 3px #00000033, 0 2px 8px #00000028;
  --shadow-md: 0 2px 4px #00000033, 0 4px 16px #0000003d, 0 8px 32px #00000028;
  --shadow-lg: 0 4px 8px #00000033, 0 8px 24px #00000044, 0 16px 56px #00000055;
  --shadow-xl: 0 8px 16px #00000044, 0 16px 48px #00000055, 0 32px 80px #00000066;
  --shadow-glow: 0 0 20px ${_r(P.accent, 0.2)}, 0 0 60px ${_r(P.accent, 0.1)};
  --shadow-glow-lg: 0 0 30px ${_r(P.accent, 0.25)}, 0 0 80px ${_r(P.accent, 0.15)}, 0 0 120px ${_r(P.accent, 0.08)};

  --backdrop: #00000080;

  --tog-bg:             ${D.panelSolid};
  --tog-thumb-on:       var(--text);
  --tog-border:         ${_r(D.text, 0.059)};
  --tog-shadow:         none;
  --tog-thumb-shadow:   ${_r(L.text, 0.451)};
  --tog-checked-inset:  ${_r(L.text, 0.2)};

  --overlay-base:     ${D.canvas};
  --overlay-60:       ${_r(D.canvas, 0.314)};
  --overlay-87:       ${_r(D.canvas, 0.8)};
  --overlay-full:     ${D.canvas};
  --overlay-hover-12: ${_r(D.canvas, 0.125)};
  --overlay-hover-25: ${_r(D.canvas, 0.25)};
  --overlay-hover-19: ${_r(D.canvas, 0.188)};
  --card-bg-end:      ${D.elevated};
  color-scheme: dark;
}`;
  document.head.appendChild(style);

  // Theme-color <meta> is set by shared-toolbar.js _syncThemeColor() on theme init/toggle.
  // No duplicate here — toolbar owns theme-color lifecycle.
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

/**
 * Freeze _PALETTE (extended, light, dark) and _FONT.
 * Called by each project's colors.js after extending with project-specific keys.
 */
function _freezeTokens() {
  Object.freeze(_PALETTE.extended);
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
