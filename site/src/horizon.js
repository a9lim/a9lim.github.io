// Home-page figure: record 50% time horizons with two fits, after Benjamin
// Todd's log-log chart of 9 November 2026. The points live in
// content/home/horizons.md; tools/horizon-fit.mjs fits the AECI map, both
// curves, and their bands at build time, and horizon-data.js carries the
// result. Copy comes from the i18n dictionary (c.hz.*). Drawn as SVG and
// styled through the palette's CSS variables, so a theme change needs no
// redraw; a resize, a language change, or a toggle does.

import { HORIZON } from './horizon-data.js';
import { homeReady } from './home.js';

const NS = 'http://www.w3.org/2000/svg';
const T0 = 2019;
const POINTS = HORIZON.points;

// Each y view has its own series (a model's reported value where it has one,
// converted otherwise), its own fits, and its own bands, all in its own units.
const Y = {
    hours: { dom: [-12, 21.5], ticks: () => HOUR_TICKS.map((h, i) => [Math.log2(h), u().ticks[i]]) },
    aeci:  { dom: [85, 245], ticks: () => AECI_TICKS.map((a) => [a, String(a)]) },
};
const AECI_TICKS = [100, 120, 140, 160, 180, 200, 220, 240];
// Weeks and years of work time (40 h, 2,000 h), the unit METR's horizons are in.
const HOUR_TICKS = [1 / 3600, 1 / 60, 1, 40, 2000, 200000];

function curves(view) {
    const { hyperbolic: h, doubleExponential: d } = HORIZON.views[view];
    return {
        hyp: (t) => (t < h.ts ? h.a - h.alpha * Math.log2(h.ts - t) : Infinity),
        dexp: (t) => d.d0 + d.d1 * Math.exp(d.c * (t - T0)),
    };
}

// x: calendar date, or log time left before this view's fitted singularity.
function xAxis(mode, ts) {
    return mode === 'lin'
        ? { dom: [2019, 2028], of: (t) => t, inv: (v) => v }
        : { dom: [1, Math.log10(0.25)], of: (t) => Math.log10(ts - t), inv: (v) => ts - 10 ** v };
}

// Units and dates: formatting, not copy, so they stay here.
const U = {
    en: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        month: (y, m) => `${U.en.months[m]} ${y}`,
        yr: (v) => v >= 1 ? `${v} yr` : `${Math.round(v * 12)} mo`,
        h: (v) => `${v} h`, min: (v) => `${v} min`, s: (v) => `${v} s`,
        mh: (h) => `${(h / 1e6).toFixed(1)} million h`,
        ticks: ['1 sec', '1 min', '1 hr', '1 wk', '1 yr', '100 yr'],
        sep: ' · ',
    },
    ja: {
        month: (y, m) => `${y}年${m + 1}月`,
        yr: (v) => v >= 1 ? `${v}年` : `${Math.round(v * 12)}か月`,
        h: (v) => `${v} 時間`, min: (v) => `${v} 分`, s: (v) => `${v} 秒`,
        mh: (h) => `${Math.round(h / 1e4).toLocaleString('en-US')}万時間`,
        ticks: ['1秒', '1分', '1時間', '1週', '1年', '100年'],
        sep: '・',
    },
};

const lang = () => (window._i18n && window._i18n.getLang && window._i18n.getLang() === 'ja') ? 'ja' : 'en';
const u = () => U[lang()];
const copy = (k) => (window._i18n && window._i18n.t) ? window._i18n.t('c.hz.' + k) : k;

function month(t) {
    const y = Math.floor(t);
    return u().month(y, Math.min(11, Math.floor((t - y) * 12)));
}

function hours(h) {
    const f = u();
    if (!Number.isFinite(h)) return '∞';
    if (h < 1 / 60) return f.s(Math.max(1, Math.round(h * 3600)));
    if (h < 1) return f.min(Math.round(h * 60));
    if (h < 10) return f.h(h.toFixed(1));
    if (h < 1e6) return f.h(Math.round(h).toLocaleString('en-US'));
    return f.mh(h);
}

function decimalYear(d) {
    const y = d.getUTCFullYear();
    const a = Date.UTC(y, 0, 1), b = Date.UTC(y + 1, 0, 1);
    return y + (d.getTime() - a) / (b - a);
}

function node(tag, attrs, parent, text) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
}

// /#fits lands on the figure, but the cards above it fill in after load and
// push it down, and so do fonts that load late (Japanese text starts its font
// only once the hydrated cards render it). Scroll to it now, again once the
// cards are in, after every font load, and on any layout change, until the
// visitor scrolls or the page has been still for five seconds.
function pinIntoView(el) {
    if (!el) return;
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    const opts = { capture: true, passive: true };
    let done = false, timer = 0;
    const stop = () => {
        done = true;
        clearTimeout(timer);
        ro.disconnect();
        if (document.fonts) document.fonts.removeEventListener('loadingdone', go);
        for (const e of events) window.removeEventListener(e, stop, opts);
    };
    const go = () => {
        if (done) return;
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
        clearTimeout(timer);
        if (document.visibilityState === 'visible') timer = setTimeout(stop, 5000);
    };
    const ro = new ResizeObserver(go);
    for (const e of events) window.addEventListener(e, stop, opts);
    if (document.fonts) document.fonts.addEventListener('loadingdone', go);
    ro.observe(el.closest('.home-wrap') || document.body);
    go();
    Promise.all([homeReady, document.fonts ? document.fonts.ready : null]).then(go);
}

const DIAMOND = (x, y, r) => `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`;

// "12 h (95%: 5.3 h – 61 h)", with ≈ in front of a converted value
function reading(view, i) {
    const [v, lo, hi, converted] = HORIZON.views[view].points[i];
    const pre = converted ? '≈ ' : '';
    if (view === 'aeci') {
        const d = converted ? 0 : 1;
        return `${pre}AECI ${v.toFixed(d)}${lo == null ? '' : ` (95%: ${lo.toFixed(d)}–${hi.toFixed(d)})`}`;
    }
    return `${pre}${hours(2 ** v)}${lo == null ? '' : ` (95%: ${hours(2 ** lo)} – ${hours(2 ** hi)})`}`;
}

// A fit's 95% band at time t, interpolated on the view's band grid; Infinity
// where the band runs past a bootstrap replicate's singularity.
function bandAt(view, name, t) {
    const band = HORIZON.views[view].band, grid = band.t;
    if (!(t > grid[0] && t < grid[grid.length - 1])) return null;
    let lo = 0, hi = grid.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (grid[mid] <= t) lo = mid; else hi = mid; }
    const f = grid[hi] > grid[lo] ? (t - grid[lo]) / (grid[hi] - grid[lo]) : 0;
    const at = (k) => {
        const a = band[name][lo][k], b = band[name][hi][k];
        return a == null || b == null ? Infinity : a + (b - a) * f;
    };
    return [at(0), at(1)];
}

// "hyperbolic AECI 193 (95%: 186–205)", "double exponential 1,924 h (95%: 980 h – 3,900 h)"
function fitReading(view, y, band) {
    const v = !Number.isFinite(y) ? '∞' : view === 'aeci' ? `AECI ${y.toFixed(0)}` : hours(2 ** y);
    if (!band || !Number.isFinite(band[0])) return v;
    const ci = view === 'aeci'
        ? `${band[0].toFixed(0)}–${Number.isFinite(band[1]) ? band[1].toFixed(0) : '∞'}`
        : `${hours(2 ** band[0])} – ${hours(2 ** band[1])}`;
    return `${v} (95%: ${ci})`;
}

export function initHorizon() {
    const fig = document.getElementById('horizon-fig');
    const cap = document.getElementById('horizon-cap');
    if (!fig || !cap) return;

    const state = { x: 'log', y: 'aeci', focus: -1 };
    const now = decimalYear(new Date());
    let geo = null;   // the last draw's scales, for pointer lookups
    let layer = null; // hover marks, redrawn without a full render

    const opts = document.querySelectorAll('.horizon-opt');
    for (const b of opts) {
        b.addEventListener('click', () => {
            state[b.dataset.axis] = b.dataset.view;
            for (const o of opts) if (o.dataset.axis === b.dataset.axis) o.setAttribute('aria-pressed', String(o === b));
            render();
        });
    }

    function render() {
        const f = u();
        const V = HORIZON.views[state.y];
        const yv = Y[state.y];
        const xv = xAxis(state.x, V.hyperbolic.ts);
        const fn = curves(state.y);
        const W = Math.max(280, fig.clientWidth);
        const narrow = W < 560;
        const H = Math.round(Math.max(320, Math.min(narrow ? W : W * 0.62, window.innerHeight - 280, 640)));
        const m = { l: 0, r: 10, t: 40, b: 46 };
        const ph = H - m.t - m.b;
        const sy = (v) => m.t + ph - (v - yv.dom[0]) / (yv.dom[1] - yv.dom[0]) * ph;
        const clampY = (v) => Math.max(-4 * H, Math.min(5 * H, v));
        const yOf = (v) => clampY(sy(v));

        while (fig.firstChild) fig.removeChild(fig.firstChild);
        const svg = node('svg', { class: 'horizon-svg', width: W, height: H, role: 'img', 'aria-label': copy('alt'), tabindex: '0' }, fig);

        // y labels for both views, so the plot area stays put when y flips
        let widest = 0;
        const yText = {};
        for (const k in Y) {
            yText[k] = Y[k].ticks().map(([v, lab]) => {
                const txt = node('text', { class: 'hz-tick', 'text-anchor': 'end' }, svg, lab);
                widest = Math.max(widest, txt.getComputedTextLength());
                return [v, txt];
            });
        }
        m.l = Math.ceil(widest) + 14;
        const pw = W - m.l - m.r;
        const sx = (v) => m.l + (v - xv.dom[0]) / (xv.dom[1] - xv.dom[0]) * pw;
        const xOf = (t) => sx(xv.of(t));
        const inX = (t) => {
            if (state.x === 'log' && t >= V.hyperbolic.ts) return false;
            const v = xv.of(t);
            return v >= Math.min(...xv.dom) - 1e-9 && v <= Math.max(...xv.dom) + 1e-9;
        };
        for (const k in yText) {
            for (const [v, txt] of yText[k]) {
                if (k !== state.y) { svg.removeChild(txt); continue; }
                txt.setAttribute('x', m.l - 10);
                txt.setAttribute('y', sy(v) + 4.5);
                node('line', { class: 'hz-grid', x1: m.l, x2: m.l + pw, y1: sy(v), y2: sy(v) }, svg);
            }
        }
        node('text', { class: 'hz-title', x: 0, y: m.t - 14 }, svg, copy(state.y === 'aeci' ? 'axisAeci' : 'axisHorizon'));

        // x ticks and grid
        let xTicks;
        if (state.x === 'lin') {
            xTicks = [];
            for (let yr = 2019; yr <= 2028; yr += narrow ? 2 : 1) xTicks.push([yr, narrow ? `’${String(yr).slice(2)}` : String(yr)]);
        } else {
            xTicks = [8, 4, 2, 1, 0.5, 0.25].map((v) => [Math.log10(v), f.yr(v)]);
        }
        for (const [v, lab] of xTicks) {
            const x = sx(v);
            node('line', { class: 'hz-grid', x1: x, x2: x, y1: m.t, y2: m.t + ph }, svg);
            node('line', { class: 'hz-axis', x1: x, x2: x, y1: m.t + ph, y2: m.t + ph + 5 }, svg);
            const txt = node('text', { class: 'hz-tick', x, y: m.t + ph + 22, 'text-anchor': 'middle' }, svg, lab);
            const half = txt.getComputedTextLength() / 2;
            if (x + half > W) txt.setAttribute('x', W - half);
        }
        node('line', { class: 'hz-axis', x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph }, svg);
        node('text', { class: 'hz-title', x: m.l + pw, y: H - 4, 'text-anchor': 'end' }, svg, copy(state.x === 'lin' ? 'axisDate' : 'axisLeft'));

        // today, and the singularity (on the date axis only; on the log axis it is infinitely far right)
        const marks = [[now, 'hz-today', copy('today')]];
        if (state.x === 'lin') marks.push([V.hyperbolic.ts, 'hz-sing', copy('singularity')]);
        let prev = -Infinity, row = 0;
        for (const [t, cls, lab] of marks) {
            const x = xOf(t);
            node('line', { class: cls, x1: x, x2: x, y1: m.t, y2: m.t + ph }, svg);
            const txt = node('text', { class: 'hz-mark', 'text-anchor': 'middle' }, svg, lab);
            const tw = txt.getComputedTextLength();
            const cx = Math.min(W - m.r - tw / 2, x);
            row = cx - tw / 2 < prev + 8 ? row + 1 : 0;
            txt.setAttribute('x', cx);
            txt.setAttribute('y', m.t - 8 - row * 15);
            prev = cx + tw / 2;
        }

        const clip = 'hz-clip';
        node('rect', { x: m.l, y: m.t, width: pw, height: ph }, node('clipPath', { id: clip }, node('defs', {}, svg)));
        const g = node('g', { 'clip-path': `url(#${clip})` }, svg);

        // bands: 95% of the bootstrap curves; null means past the replicate's singularity
        for (const name of ['dexp', 'hyp']) {
            const lower = [], upper = [];
            V.band.t.forEach((t, i) => {
                const [lo, hi] = V.band[name][i];
                if (!inX(t) || lo == null) return;
                const x = xOf(t).toFixed(1);
                lower.push(`${x} ${yOf(lo).toFixed(1)}`);
                upper.push(`${x} ${(hi == null ? -4 * H : yOf(hi)).toFixed(1)}`);
            });
            if (lower.length > 1) node('path', { class: `hz-band-${name}`, d: `M${lower.join('L')}L${upper.reverse().join('L')}Z` }, g);
        }

        // curves
        const N = 480;
        for (const [name, cls] of [['dexp', 'hz-dexp'], ['hyp', 'hz-hyp']]) {
            let d = '';
            for (let i = 0; i <= N; i++) {
                const t = xv.inv(xv.dom[0] + (xv.dom[1] - xv.dom[0]) * i / N);
                const y = fn[name](t);
                if (!Number.isFinite(y)) break;
                d += (d ? 'L' : 'M') + xOf(t).toFixed(1) + ' ' + yOf(y).toFixed(1);
            }
            node('path', { class: cls, d }, g);
        }

        // error bars, then points
        const xy = V.points.map(([v], i) => [xOf(POINTS[i].t), yOf(v)]);
        V.points.forEach(([, lo, hi, converted], i) => {
            if (lo == null) return;
            const x = xy[i][0], y0 = yOf(lo), y1 = yOf(hi);
            const cls = converted ? 'hz-bar hz-bar-conv' : 'hz-bar';
            node('line', { class: cls, x1: x, x2: x, y1: y0, y2: y1 }, g);
            for (const y of [y0, y1]) node('line', { class: 'hz-bar', x1: x - 3, x2: x + 3, y1: y, y2: y }, g);
        });
        const pts = node('g', {}, svg);
        V.points.forEach(([, , , converted], i) => {
            const [x, y] = xy[i];
            if (converted) node('path', { class: 'hz-pt-d', d: DIAMOND(x, y, 5) }, pts);
            else node('circle', { class: 'hz-pt-m', cx: x, cy: y, r: 3.6 }, pts);
        });

        layer = node('g', {}, svg);
        geo = { m, pw, ph, sx, xv, xOf, yOf, xy, fn, V };
        wire(svg);
        hover(state.focus >= 0 ? { point: state.focus } : null);
    }

    function idle() {
        const h = HORIZON.views[state.y].hyperbolic;
        cap.textContent = copy('caption')
            .replace('{date}', month(h.ts))
            .replace('{low}', month(h.low))
            .replace('{high}', month(h.high))
            .replace('{exponent}', h.exponent.toFixed(2));
    }

    function hover(h) {
        if (!geo) return;
        const f = u();
        while (layer.firstChild) layer.removeChild(layer.firstChild);
        if (!h) { idle(); return; }
        if (h.point != null) {
            const i = h.point, p = POINTS[i];
            const [x, y] = geo.xy[i];
            node('circle', { class: 'hz-ring', cx: x, cy: y, r: 9 }, layer);
            cap.textContent = [p.name, month(p.t), reading('hours', i), reading('aeci', i)].join(f.sep);
            return;
        }
        const t = h.t;
        const x = geo.xOf(t);
        node('line', { class: 'hz-cross', x1: x, x2: x, y1: geo.m.t, y2: geo.m.t + geo.ph }, layer);
        const parts = [month(t)];
        for (const [name, cls, key] of [['hyp', 'hz-dot-hyp', 'keyHyperbolic'], ['dexp', 'hz-dot-dexp', 'keyDoubleExponential']]) {
            const y = geo.fn[name](t);
            if (Number.isFinite(y)) {
                const py = geo.yOf(y);
                if (py >= geo.m.t && py <= geo.m.t + geo.ph) node('circle', { class: cls, cx: x, cy: py, r: 3.2 }, layer);
            }
            parts.push(`${copy(key)} ${fitReading(state.y, y, bandAt(state.y, name, t))}`);
        }
        cap.textContent = parts.join(f.sep);
    }

    function wire(svg) {
        const pick = (ev) => {
            const r = svg.getBoundingClientRect();
            const px = ev.clientX - r.left, py = ev.clientY - r.top;
            let best = -1, bd = 14 * 14;
            geo.xy.forEach(([x, y], i) => {
                const d = (x - px) ** 2 + (y - py) ** 2;
                if (d < bd) { bd = d; best = i; }
            });
            if (best >= 0) return { point: best };
            if (px < geo.m.l || px > geo.m.l + geo.pw || py < geo.m.t - 6 || py > geo.m.t + geo.ph) return null;
            const v = geo.xv.dom[0] + (px - geo.m.l) / geo.pw * (geo.xv.dom[1] - geo.xv.dom[0]);
            return { t: geo.xv.inv(v) };
        };
        svg.addEventListener('pointermove', (ev) => { state.focus = -1; hover(pick(ev)); });
        svg.addEventListener('pointerdown', (ev) => { state.focus = -1; hover(pick(ev)); });
        svg.addEventListener('pointerleave', (ev) => { if (ev.pointerType === 'mouse') hover(null); });
        svg.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') {
                ev.preventDefault();
                const n = POINTS.length;
                state.focus = state.focus < 0
                    ? (ev.key === 'ArrowRight' ? 0 : n - 1)
                    : (state.focus + (ev.key === 'ArrowRight' ? 1 : n - 1)) % n;
                hover({ point: state.focus });
            } else if (ev.key === 'Escape') {
                state.focus = -1;
                hover(null);
            }
        });
        svg.addEventListener('blur', () => { state.focus = -1; hover(null); });
    }

    // Width comes from the figure, height from the window as well.
    let size = '';
    const resized = () => {
        const s = fig.clientWidth + 'x' + window.innerHeight;
        if (s !== size) { size = s; render(); }
    };
    new ResizeObserver(resized).observe(fig);
    window.addEventListener('resize', resized);
    if (window._i18n && window._i18n.onChange) window._i18n.onChange(render);
    // Label placement measures text, so redo it once the webfont lands.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
    render();
    if (location.hash === '#fits') pinIntoView(document.getElementById('fits'));
}
