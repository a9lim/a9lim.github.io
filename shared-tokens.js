/* ===================================================================
   shared-tokens.js — Shared design tokens for all a9l.im sites
   Loads in <head> before project-specific colors.js.
   Injects CSS custom properties for shared surfaces, text, and accent.

   Sub-projects extend _FONT / _PALETTE with project-specific keys,
   then freeze both objects in their own colors.js.
   =================================================================== */

// ---------- Alpha helper (appends alpha byte to hex) ----------
const _r = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');

// ---------- Color Math Helpers ----------
const _parseHex = (hex) => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255
];
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
function _hsl2hex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  const toHex = v => Math.round(v * 255).toString(16).padStart(2, '0');
  return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}
const _darken = (hex) => {
  const [h, s, l] = _rgb2hsl(..._parseHex(hex));
  return _hsl2hex(h, s * 0.92, l * 0.75);
};

// ---------- Font Constants ----------
// Not frozen here — biosim extends with `emoji`
const _FONT = {
  display: "'Instrument Serif', Georgia, 'Times New Roman', serif",
  body:    "'Geist', system-ui, -apple-system, sans-serif",
  mono:    "'Geist Mono', 'SF Mono', 'Menlo', monospace",
};

// ---------- Palette ----------
// Not frozen here — sub-projects extend with project-specific keys
const _PALETTE = {
  accent:      '#FE3B01',
  accentLight: '#FF6B3D',

  light: {
    canvas:        '#F0EDE4',
    panelSolid:    '#FCFAF4',
    elevated:      '#FDFBF5',
    text:          '#1A1612',
    textSecondary: '#78706A',
    textMuted:     '#A8A098',
  },

  dark: {
    canvas:        '#0C0B09',
    panelSolid:    '#181612',
    elevated:      '#1E1C18',
    text:          '#E8E2D4',
    textSecondary: '#8A8278',
    textMuted:     '#5A544C',
  },

  // Extended palette — shared across biosim/gerry/physsim
  // Not frozen here — sub-projects freeze in their colors.js
  extended: {
    blue:   '#5898ba',
    green:  '#52a87a',
    slate:  '#847a70',
    orange: '#d9924c',
    rose:   '#c85c74',
    purple: '#a882bc',
    brown:  '#9e6842',
    red:    '#cc4c3c',
    cyan:   '#48b4aa',
    yellow: '#dbb850',
  },
};

// ---------- CSS Custom Property Injection ----------
(function injectPaletteVars() {
  const P = _PALETTE, L = P.light, D = P.dark;

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

  --intro-warm:       ${_r(P.accentLight, 0.08)};
  --intro-warm-hover: ${_r(P.accentLight, 0.12)};
  --intro-cool:       ${_r('#5898ba', 0.04)};
  --backdrop:         #0000004d;
  color-scheme: light;
}
[data-theme="dark"] {
${gen(D, true)}

  --shadow-sm: 0 1px 4px #00000033, 0 0 0 1px #ffffff08;
  --shadow-md: 0 4px 20px #0000004d, 0 0 0 1px #ffffff08;
  --shadow-lg: 0 12px 48px #00000066, 0 0 0 1px #ffffff08;

  --backdrop: #00000080;
  color-scheme: dark;
}`;
  document.head.appendChild(style);
})();
