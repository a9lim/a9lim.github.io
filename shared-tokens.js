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
  display: "'Recursive', 'SF Mono', 'Menlo', monospace",
  sans:    "'Recursive', 'SF Mono', 'Menlo', monospace",
  serif:   "'Recursive', 'SF Mono', 'Menlo', monospace",
  mono:    "'Recursive', 'SF Mono', 'Menlo', monospace",
};

// ─── Palette ───
// Left mutable — each project's colors.js adds keys then freezes.
//
// OKLCH-native: all neutrals share H=270 (cold blue-violet slate);
// extended chromatic colors locked to L=0.62, C=0.17 for strict
// perceptual uniformity across hues (gamut-capped where needed).
// Dual accent: red + blue.
const _PALETTE = {
  accent:         '#E11107',  // oklch(0.53  0.225  29)  — primary brand
  accentLight:    '#E95142',  // oklch(0.64  0.19   29)
  secondary:      '#488ACB',  // oklch(0.62  0.12  250)  — data/status
  secondaryLight: '#73A9E1',  // oklch(0.72  0.10  250)

  light: {
    canvas:        '#F4F5F8',  // oklch(0.970 0.004 270)
    panelSolid:    '#F9FAFC',  // oklch(0.985 0.003 270)
    elevated:      '#FDFDFF',  // oklch(0.995 0.002 270)
    text:          '#010203',  // oklch(0.08 0.010 270)
    textSecondary: '#0C0D12',  // oklch(0.16 0.010 270)
    textMuted:     '#1E1F23',  // oklch(0.24 0.008 270)
  },

  dark: {
    canvas:        '#06070B',  // oklch(0.13 0.010 270)
    panelSolid:    '#0E0F14',  // oklch(0.17 0.010 270)
    elevated:      '#191A1F',  // oklch(0.22 0.010 270)
    text:          '#F4F5F9',  // oklch(0.97 0.005 270)
    textSecondary: '#D8DBE0',  // oklch(0.89 0.008 270)
    textMuted:     '#BFC1C6',  // oklch(0.81 0.008 270)
  },

  // Cross-project semantic colors — OKLCH L=0.62, C=0.17 uniform
  // (gamut-capped to sRGB ceiling where needed)
  extended: {
    blue:    '#0091C9',  // oklch(0.62 0.132 235)  — gamut max
    green:   '#009F68',  // oklch(0.62 0.140 160)  — gamut max
    slate:   '#808696',  // oklch(0.62 0.025 270)  — intentionally muted
    orange:  '#CA6800',  // oklch(0.62 0.154  55)  — gamut max
    rose:    '#D35182',  // oklch(0.62 0.170   0)
    purple:  '#9769DC',  // oklch(0.62 0.170 300)
    brown:   '#B97500',  // oklch(0.62 0.134  70)  — gamut max
    red:     '#DA534F',  // oklch(0.62 0.170  25)
    cyan:    '#009A9A',  // oklch(0.62 0.106 195)  — gamut max
    yellow:  '#998700',  // oklch(0.62 0.129 100)  — gamut max
    magenta: '#BD5AB6',  // oklch(0.62 0.170 330)
    lime:    '#449D2E',  // oklch(0.62 0.170 140)
    indigo:  '#6B79EA',  // oklch(0.62 0.170 275)
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
    ['bg-panel',       'panelSolid',    0.32,  0.35],
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
  --font-sans:    ${_FONT.sans};
  --font-serif:   ${_FONT.serif};
  --font-mono:    ${_FONT.mono};

${gen(L, false)}

  --accent:            ${P.accent};
  --accent-light:      ${P.accentLight};
  --accent-subtle:     ${_r(P.accent, 0.078)};
  --accent-glow:       ${_r(P.accent, 0.18)};
  --secondary:         ${P.secondary};
  --secondary-light:   ${P.secondaryLight};
  --secondary-subtle:  ${_r(P.secondary, 0.078)};
  --secondary-glow:    ${_r(P.secondary, 0.18)};
  --text-on-accent: ${L.elevated};

  --shadow-hover: 0 2px 4px #0000000a, 0 4px 16px #00000012, 0 8px 32px #0000000a;
  --shadow-glow: 0 0 30px ${_r(P.accent, 0.2)}, 0 0 80px ${_r(P.accent, 0.12)}, 0 0 120px ${_r(P.accent, 0.06)};

  --tog-bg:             ${togBg};
  --tog-shadow:         none;

  --overlay-base:     ${L.text};
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
  --overlay-tint:     ${_r('#FFFFFF', 0.133)};
  --shimmer:          ${_r('#FFFFFF', 0.063)};
  color-scheme: light;
}
[data-theme="dark"] {
${gen(D, true)}

  --shadow-hover: 0 2px 4px #00000033, 0 4px 16px #0000003d, 0 8px 32px #00000028;
  --shadow-glow: 0 0 30px ${_r(P.accent, 0.25)}, 0 0 80px ${_r(P.accent, 0.15)}, 0 0 120px ${_r(P.accent, 0.08)};

  --text-on-accent: ${D.elevated};

  --tog-bg:             ${D.panelSolid};
  --tog-shadow:         none;

  --overlay-base:     ${D.canvas};
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
