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

// ─── Font stacks ───
// Left mutable — biosim extends with `emoji` before freezing
const _FONT = {
  display: "'Noto Serif', Georgia, 'Times New Roman', serif",
  body:    "'Noto Sans', system-ui, -apple-system, sans-serif",
  mono:    "'Noto Sans Mono', 'SF Mono', 'Menlo', monospace",
};

// ─── Palette ───
// Left mutable — each project's colors.js adds keys then freezes
const _PALETTE = {
  accent:      '#E11107',
  accentLight: '#F04A3E',

  light: {
    canvas:        '#EAECEF',
    panelSolid:    '#F2F4F7',
    elevated:      '#F8F9FB',
    text:          '#181B20',
    textSecondary: '#6B7280',
    textMuted:     '#9CA3AF',
  },

  dark: {
    canvas:        '#0B0C0F',
    panelSolid:    '#151720',
    elevated:      '#1C1E28',
    text:          '#E2E4E9',
    textSecondary: '#8B8FA0',
    textMuted:     '#505462',
  },

  // Cross-project semantic colors (biosim pathways, gerry parties, physsim particles)
  extended: {
    blue:    '#3892B8',
    green:   '#3A9C68',
    slate:   '#848890',
    orange:  '#B88C38',
    rose:    '#C25478',
    purple:  '#9472BC',
    brown:   '#A86E3E',
    red:     '#C25454',
    cyan:    '#00A09C',
    yellow:  '#A89C2E',
    magenta: '#B460AA',
    lime:    '#6EA840',
    indigo:  '#6880C0',
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
  --font-mono:    ${_FONT.mono};

${gen(L, false)}

  --accent:        ${P.accent};
  --accent-light:  ${P.accentLight};
  --accent-subtle: ${_r(P.accent, 0.078)};
  --accent-glow:   ${_r(P.accent, 0.18)};

  --shadow-sm: 0 1px 4px #0000000a, 0 0 0 1px #00000005;
  --shadow-md: 0 4px 20px #0000000f, 0 0 0 1px #00000005;
  --shadow-lg: 0 12px 48px #0000001a, 0 0 0 1px #00000005;

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

  --shadow-sm: 0 1px 4px #00000033, 0 0 0 1px #ffffff08;
  --shadow-md: 0 4px 20px #0000004d, 0 0 0 1px #ffffff08;
  --shadow-lg: 0 12px 48px #00000066, 0 0 0 1px #ffffff08;

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
})();

// Expose as globals — ES6 modules in each project read these from window
window._r = _r;
window._parseHex = _parseHex;
window._rgb2hsl = _rgb2hsl;
window._hsl2hex = _hsl2hex;
window._darken = _darken;
window._FONT = _FONT;
window._PALETTE = _PALETTE;
