// Home-page figures: record 50% time horizons with two fits, after Benjamin
// Todd's log-log chart of 9 November 2026, and below them the hyperbola refit
// as of each release. The points live in content/home/horizons.md;
// tools/horizon-fit.mjs fits the AECI map, both curves, their bands, and the
// refits at build time, and horizon-data.js carries the result. Copy comes
// from the i18n dictionary (c.hz.*). Drawn as SVG and styled through the
// palette's CSS variables, so a theme change needs no redraw; a resize, a
// language change, or a toggle does.
//
// A toggle tweens. Each figure draws a view (a leaf of toggle settings with a
// key), or mid-way a blend of two, {a, b, e}, which is itself a view: every mark sits at the eased mix of
// where the two views put it, and what only one view shows fades with e. A
// toggle mid-way starts from what is on screen.

import { HORIZON } from './horizon-data.js';
import { homeReady } from './home.js';

const NS = 'http://www.w3.org/2000/svg';
const T0 = 2019;
const POINTS = HORIZON.points;
const MAP = HORIZON.map;

// Each y view has its own series (a model's reported value where it has one,
// converted otherwise), its own fits, and its own bands, all in its own units.
// The horizon axis spans what the AECI axis does through the map, so a model
// on the map sits at the same height in both.
const toHours = (a) => MAP.b0 + MAP.b1 * (a - 150);
const toAeci = (h) => 150 + (h - MAP.b0) / MAP.b1;
const AECI_TICKS = [80, 100, 120, 140, 160, 180, 200, 220, 240];
// Weeks and years of work time (40 h, 2,000 h), the unit METR's horizons are in.
const HOUR_TICKS = [1 / 3600, 1 / 60, 1, 40, 2000, 200000];
const Y = {
    aeci: { dom: [80, 240], title: 'axisAeci', ticks: () => AECI_TICKS.map((a) => [a, String(a)]) },
    hours: { dom: [toHours(80), toHours(240)], title: 'axisHorizon', ticks: () => HOUR_TICKS.map((h, i) => [Math.log2(h), u().ticks[i]]) },
};

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
        // a span of time, as in time left: "1.9 yr", "9 mo", "3 wk"
        span: (v) => v >= 1 ? `${v < 10 ? v.toFixed(1) : Math.round(v)} yr` : v * 12 >= 1 ? `${Math.round(v * 12)} mo` : `${Math.round(v * 52)} wk`,
        units: ['sec', 'min', 'hr', 'day', 'wk', 'yr'],
        amount: (n, unit) => `${n} ${unit}`,
        ticks: ['1 sec', '1 min', '1 hr', '1 wk', '1 yr', '100 yr'],
        sep: ' · ',
    },
    ja: {
        month: (y, m) => `${y}年${m + 1}月`,
        yr: (v) => v >= 1 ? `${v}年` : `${Math.round(v * 12)}か月`,
        span: (v) => v >= 1 ? `${v < 10 ? v.toFixed(1) : Math.round(v)}年` : v * 12 >= 1 ? `${Math.round(v * 12)}か月` : `${Math.round(v * 52)}週`,
        units: ['秒', '分', '時間', '日', '週', '年'],
        amount: (n, unit) => `${n}${unit}`,
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

// Work time, as on the axis: a day is 8 hours, a week 40, a year 2,000.
const UNIT_HOURS = [1 / 3600, 1 / 60, 1, 8, 40, 2000];

function hours(h) {
    const f = u();
    if (!Number.isFinite(h)) return '∞';
    let i = UNIT_HOURS.length - 1;
    while (i > 0 && h < UNIT_HOURS[i]) i--;
    const v = h / UNIT_HOURS[i];
    return f.amount(v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US'), f.units[i]);
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

// "fitted singularity Aug 2027 (95%: May 2027 – Dec 2027)"; ∞ for no top
function singText(h) {
    return copy('caption')
        .replace('{date}', month(h.ts))
        .replace('{low}', month(h.low))
        .replace('{high}', Number.isFinite(h.high) ? month(h.high) : '∞')
        .replace('{exponent}', h.exponent == null ? '' : h.exponent.toFixed(2));
}

// A span of time left; none once it has passed, ∞ with no top.
function span(v) {
    return !Number.isFinite(v) ? '∞' : v <= 0 ? '0' : u().span(v);
}

// ── Tweening ──

const TWEEN_MS = 650;
const still = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const leaves = (v, out = []) => { if (v.a) { leaves(v.a, out); leaves(v.b, out); } else out.push(v); return out; };
// a value mixed between two views; a view that has none leaves it to the other
const mix = (p, q, e) => (Number.isFinite(p) ? (Number.isFinite(q) ? p + (q - p) * e : p) : q);
const at = (v, f) => (v.a ? mix(at(v.a, f), at(v.b, f), v.e) : f(v));

// The site's --ease-out, as a function of progress.
function siteEase() {
    const m = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').match(/cubic-bezier\(([^)]+)\)/);
    const [x1, y1, x2, y2] = m ? m[1].split(',').map(Number) : [0.23, 1, 0.32, 1];
    const b = (p1, p2, s) => 3 * p1 * s * (1 - s) ** 2 + 3 * p2 * s * s * (1 - s) + s ** 3;
    return (p) => {
        let lo = 0, hi = 1, s = p;
        for (let i = 0; i < 24; i++) { s = (lo + hi) / 2; if (b(x1, x2, s) < p) lo = s; else hi = s; }
        return b(y1, y2, s);
    };
}

// Holds a figure's view and moves it to the next, drawing each frame; draw
// gets the view and whether it has settled.
function tweener(draw) {
    let view = null, raf = 0, ease = null;
    return {
        go(next) {
            if (view && !view.a && view.key === next.key) return;
            cancelAnimationFrame(raf);
            if (!view || still()) { view = next; draw(view, true); return; }
            ease = ease || siteEase();
            const from = view, start = performance.now();
            const step = (t) => {
                const p = Math.min(1, (t - start) / TWEEN_MS);
                view = p < 1 ? { a: from, b: next, e: ease(p) } : next;
                draw(view, p === 1);
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        },
        redraw() { if (view) draw(view, !view.a); },
    };
}

// ── Shared frame ──

// Both figures take the same height for the same width.
const figHeight = (W) => Math.round(Math.max(320, Math.min(W < 560 ? W : W * 0.62, window.innerHeight - 280, 640)));

// Margins, with the left one wide enough for every view's y labels, so the
// plot area stays put when y flips.
function frame(svg, W, H, labels) {
    const m = { l: 0, r: 10, t: 40, b: 46 };
    let widest = 0;
    for (const lab of labels) {
        const txt = node('text', { class: 'hz-tick' }, svg, lab);
        widest = Math.max(widest, txt.getComputedTextLength());
        svg.removeChild(txt);
    }
    m.l = Math.ceil(widest) + 14;
    return { W, H, m, pw: W - m.l - m.r, ph: H - m.t - m.b };
}

// One view's scales. Past the wall (the singularity, on the log x axis) a
// date lies off the right edge.
function scales(L, xv, ydom, wall) {
    const { W, H, m, pw, ph } = L;
    const sx = (v) => m.l + (v - xv.dom[0]) / (xv.dom[1] - xv.dom[0]) * pw;
    const sy = (v) => m.t + ph - (v - ydom[0]) / (ydom[1] - ydom[0]) * ph;
    return {
        xv,
        x: (t) => Math.max(-4 * W, Math.min(5 * W, t >= wall ? Infinity : sx(xv.of(t)))),
        y: (v) => Math.max(-4 * H, Math.min(5 * H, sy(v))),
    };
}

// Pixel positions under a view, from each leaf's scales: X of a date (or of
// a date that depends on the leaf), Y of a value in the leaf's y view, O the
// share of the view that shows something.
function mixer(view, S) {
    return {
        X: (g) => at(view, (l) => S.get(l).x(typeof g === 'function' ? g(l) : g)),
        Y: (g) => at(view, (l) => S.get(l).y(g(l))),
        O: (p) => at(view, (l) => (p(l) ? 1 : 0)),
    };
}

const fade = (el, o) => { if (o < 0.999) el.setAttribute('opacity', o.toFixed(3)); return el; };
const inPlot = (L, x) => x >= L.m.l - 1 && x <= L.m.l + L.pw + 1;

// Grid, ticks, titles and marks. Every tick has a position under each leaf
// (g, a value or a function of the leaf) and shows where show(leaf) holds, so
// ticks shared by two views ride the mixed scale and the rest fade with it.
function drawAxes(svg, L, P, spec) {
    const { W, m, pw, ph } = L;
    const inY = (y) => y >= m.t - 1 && y <= m.t + ph + 1;
    for (const { g, lab, show } of spec.yTicks) {
        const o = P.O(show), y = P.Y(g);
        if (o < 0.005 || !inY(y)) continue;
        fade(node('line', { class: 'hz-grid', x1: m.l, x2: m.l + pw, y1: y, y2: y }, svg), o);
        fade(node('text', { class: 'hz-tick', 'text-anchor': 'end', x: m.l - 10, y: y + 4.5 }, svg, lab), o);
    }
    for (const { g, lab, show } of spec.xTicks) {
        const o = P.O(show), x = P.X(g);
        if (o < 0.005 || !inPlot(L, x)) continue;
        fade(node('line', { class: 'hz-grid', x1: x, x2: x, y1: m.t, y2: m.t + ph }, svg), o);
        fade(node('line', { class: 'hz-axis', x1: x, x2: x, y1: m.t + ph, y2: m.t + ph + 5 }, svg), o);
        const txt = fade(node('text', { class: 'hz-tick', x, y: m.t + ph + 22, 'text-anchor': 'middle' }, svg, lab), o);
        const half = txt.getComputedTextLength() / 2;
        if (x + half > W) txt.setAttribute('x', W - half);
    }
    for (const [list, at] of [[spec.yTitles, { x: 0, y: m.t - 14 }], [spec.xTitles, { x: m.l + pw, y: L.H - 4, 'text-anchor': 'end' }]]) {
        for (const title of new Set(list.map((t) => t.title))) {
            const o = P.O((l) => list.some((t) => t.title === title && t.show(l)));
            if (o >= 0.005) fade(node('text', { class: 'hz-title', ...at }, svg, copy(title)), o);
        }
    }
    node('line', { class: 'hz-axis', x1: m.l, x2: m.l + pw, y1: m.t + ph, y2: m.t + ph }, svg);
    let prev = -Infinity, row = 0;
    for (const mk of spec.marks) {
        const x = P.X(mk.g);
        if (mk.o < 0.005 || !inPlot(L, x)) continue;
        fade(node('line', { class: mk.cls, x1: x, x2: x, y1: m.t, y2: m.t + ph }, svg), mk.o);
        const txt = fade(node('text', { class: 'hz-mark', 'text-anchor': 'middle' }, svg, mk.lab), mk.o);
        const tw = txt.getComputedTextLength();
        const cx = Math.min(W - m.r - tw / 2, x);
        row = cx - tw / 2 < prev + 8 ? row + 1 : 0;
        txt.setAttribute('x', cx);
        txt.setAttribute('y', m.t - 8 - row * 15);
        prev = cx + tw / 2;
    }
}

// The plot area's clip, widened by pad, and a group drawn inside it.
function plotGroup(svg, L, id, pad = 0) {
    const { m, pw, ph } = L;
    node('rect', { x: m.l - pad, y: m.t - pad, width: pw + 2 * pad, height: ph + 2 * pad }, node('clipPath', { id }, node('defs', {}, svg)));
    return node('g', { 'clip-path': `url(#${id})` }, svg);
}
// A singularity's 95% interval as a strip, faded with o.
function singStrip(g, L, P, lowOf, highOf, o) {
    if (o < 0.005) return;
    const xa = P.X(lowOf), xb = P.X(highOf);
    const x0 = Math.max(L.m.l, Math.min(xa, xb)), x1 = Math.min(L.m.l + L.pw, Math.max(xa, xb));
    fade(node('rect', { class: 'hz-sing-band', x: x0, y: L.m.t, width: Math.max(0, x1 - x0), height: L.ph }, g), o);
}

const pathOf = (pts) => pts.length > 1 ? 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L') : '';
const finite = ([x, y]) => Number.isFinite(x) && Number.isFinite(y);

// Dates for drawing the fits under any view: even through 2019–2028 for the
// date axis, and log-spaced toward the singularity for the log axis.
const FIT_DATES = (() => {
    const ts = HORIZON.views.hours.hyperbolic.ts, out = [];
    for (let i = 0; i <= 480; i++) out.push(2017.5 + 10.5 * i / 480);
    for (let i = 0; i <= 240; i++) out.push(ts - 10 ** (1 - 1.7 * i / 240));
    return out.sort((a, b) => a - b);
})();
const CURVES = { aeci: curves('aeci'), hours: curves('hours') };

export function initHorizon() {
    const fig = document.getElementById('horizon-fig');
    const cap = document.getElementById('horizon-cap');
    if (!fig || !cap) return;

    const VV = HORIZON.views;
    const state = { x: 'log', y: 'aeci', focus: -1 };
    const now = decimalYear(new Date());
    let L = null;     // size and margins, kept through a tween
    let geo = null;   // the settled view's scales, for pointer lookups
    let layer = null; // hover marks, redrawn without a full render

    const tw = tweener(draw);
    const leaf = () => ({ x: state.x, y: state.y, key: `${state.x}/${state.y}` });
    bindToggles('horizon-fig', state, () => tw.go(leaf()));

    function draw(view, settled) {
        const f = u();
        const W = Math.max(280, fig.clientWidth), H = figHeight(W), narrow = W < 560;
        while (fig.firstChild) fig.removeChild(fig.firstChild);
        const svg = node('svg', { class: 'horizon-svg', width: W, height: H, role: 'img', 'aria-label': copy('alt'), tabindex: '0' }, fig);
        const yViews = {};
        for (const k in Y) yViews[k] = { dom: Y[k].dom, title: Y[k].title, ticks: Y[k].ticks() };
        if (!L || L.W !== W || L.H !== H) L = frame(svg, W, H, Object.values(yViews).flatMap((yv) => yv.ticks.map(([, lab]) => lab)));
        const { m, ph } = L;

        const S = new Map();
        for (const l of leaves(view)) {
            if (S.has(l)) continue;
            const ts = VV[l.y].hyperbolic.ts, xv = xAxis(l.x, ts);
            S.set(l, { ...scales(L, xv, Y[l.y].dom, l.x === 'log' ? ts : Infinity), ts, fn: CURVES[l.y] });
        }
        const P = mixer(view, S);
        const sing = (l) => VV[l.y].hyperbolic;

        const isLin = (l) => l.x === 'lin', isLog = (l) => l.x === 'log';
        const xTicks = [];
        for (let yr = 2019; yr <= 2028; yr += narrow ? 2 : 1) xTicks.push({ g: yr, lab: narrow ? `’${String(yr).slice(2)}` : String(yr), show: isLin });
        for (const v of [8, 4, 2, 1, 0.5, 0.25]) xTicks.push({ g: (l) => S.get(l).ts - v, lab: f.yr(v), show: isLog });
        // a view's y ticks sit where the map puts them in the other view
        const yTicks = [];
        for (const k in yViews) {
            for (const [v, lab] of yViews[k].ticks) {
                yTicks.push({ g: (l) => (l.y === k ? v : k === 'aeci' ? toHours(v) : toAeci(v)), lab, show: (l) => l.y === k });
            }
        }
        drawAxes(svg, L, P, {
            yTicks,
            yTitles: Object.keys(Y).map((k) => ({ title: Y[k].title, show: (l) => l.y === k })),
            xTicks,
            xTitles: [{ title: 'axisDate', show: isLin }, { title: 'axisLeft', show: isLog }],
            marks: [
                { g: now, cls: 'hz-today', lab: copy('today'), o: 1 },
                { g: (l) => sing(l).ts, cls: 'hz-sing', lab: copy('singularity'), o: P.O((l) => l.x === 'lin') },
            ],
        });

        const g = plotGroup(svg, L, 'hz-clip');
        singStrip(g, L, P, (l) => sing(l).low, (l) => sing(l).high, P.O((l) => l.x === 'lin'));

        // bands: 95% of the bootstrap curves; Infinity past a replicate's singularity
        for (const name of ['dexp', 'hyp']) {
            const lower = [], upper = [];
            for (const t of FIT_DATES) {
                const x = P.X(t);
                const lo = P.Y((l) => (bandAt(l.y, name, t) || [NaN])[0]);
                const hi = P.Y((l) => (bandAt(l.y, name, t) || [NaN, NaN])[1]);
                if (!(Number.isFinite(x) && Number.isFinite(lo) && Number.isFinite(hi))) continue;
                lower.push([x, lo]);
                upper.push([x, hi]);
            }
            if (lower.length > 1) node('path', { class: `hz-band-${name}`, d: pathOf([...lower, ...upper.reverse()]) + 'Z' }, g);
        }

        // curves
        for (const [name, cls] of [['dexp', 'hz-dexp'], ['hyp', 'hz-hyp']]) {
            const pts = FIT_DATES.map((t) => [P.X(t), P.Y((l) => S.get(l).fn[name](t))]).filter(finite);
            node('path', { class: cls, d: pathOf(pts) }, g);
        }

        // error bars, then points; a model reported in one view and converted
        // in the other crossfades its glyph
        const pt = (l, i) => VV[l.y].points[i];
        const xy = POINTS.map((p, i) => [P.X(p.t), P.Y((l) => pt(l, i)[0])]);
        const conv = POINTS.map((p, i) => P.O((l) => pt(l, i)[3] === 1));
        POINTS.forEach((p, i) => {
            const ob = P.O((l) => pt(l, i)[1] != null);
            if (ob < 0.005) return;
            const x = xy[i][0], y0 = P.Y((l) => pt(l, i)[1] ?? NaN), y1 = P.Y((l) => pt(l, i)[2] ?? NaN);
            if (!Number.isFinite(y0) || !Number.isFinite(y1)) return;
            if (conv[i] < 0.995) fade(node('line', { class: 'hz-bar', x1: x, x2: x, y1: y0, y2: y1 }, g), ob * (1 - conv[i]));
            if (conv[i] > 0.005) fade(node('line', { class: 'hz-bar hz-bar-conv', x1: x, x2: x, y1: y0, y2: y1 }, g), ob * conv[i]);
            for (const y of [y0, y1]) fade(node('line', { class: 'hz-bar', x1: x - 3, x2: x + 3, y1: y, y2: y }, g), ob);
        });
        const pts = node('g', {}, svg);
        POINTS.forEach((p, i) => {
            const [x, y] = xy[i];
            if (conv[i] > 0.005) fade(node('path', { class: 'hz-pt-d', d: DIAMOND(x, y, 5) }, pts), conv[i]);
            if (conv[i] < 0.995) fade(node('circle', { class: 'hz-pt-m', cx: x, cy: y, r: 3.6 }, pts), 1 - conv[i]);
        });

        if (!settled) return;
        const s = S.get(view);
        layer = node('g', {}, svg);
        geo = { m, pw: L.pw, ph, xv: s.xv, xOf: s.x, yOf: s.y, xy, fn: s.fn };
        wire(svg);
        hover(state.focus >= 0 ? { point: state.focus } : null);
    }

    function idle() {
        cap.textContent = singText(VV[state.y].hyperbolic);
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
        wirePointer(svg, geo, () => POINTS.length, state, hover, (i) => ({ point: i }));
    }

    watch(fig, () => { L = null; tw.redraw(); }, () => tw.redraw());
    tw.go(leaf());
    initRefits(now);
    if (location.hash === '#fits') pinIntoView(document.getElementById('fits'));
}

// Toggle buttons for a figure: each sets its axis's view.
function bindToggles(figId, state, changed) {
    const opts = document.querySelectorAll(`.horizon-bar[data-for="${figId}"] .horizon-opt`);
    for (const b of opts) {
        b.addEventListener('click', () => {
            if (state[b.dataset.axis] === b.dataset.view) return;
            state[b.dataset.axis] = b.dataset.view;
            state.focus = -1;
            for (const o of opts) if (o.dataset.axis === b.dataset.axis) o.setAttribute('aria-pressed', String(o === b));
            changed();
        });
    }
}

// Pointer and keys over a settled figure: the nearest mark within 14 px, else
// a date under the pointer; arrows step through the marks.
function wirePointer(svg, geo, count, state, hover, mark) {
    const pick = (ev) => {
        const r = svg.getBoundingClientRect();
        const px = ev.clientX - r.left, py = ev.clientY - r.top;
        let best = -1, bd = 14 * 14;
        geo.xy.forEach(([x, y], i) => {
            const d = (x - px) ** 2 + (y - py) ** 2;
            if (d < bd) { bd = d; best = i; }
        });
        if (best >= 0) return mark(best);
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
            const n = count();
            state.focus = state.focus < 0
                ? (ev.key === 'ArrowRight' ? 0 : n - 1)
                : (state.focus + (ev.key === 'ArrowRight' ? 1 : n - 1)) % n;
            hover(mark(state.focus));
        } else if (ev.key === 'Escape') {
            state.focus = -1;
            hover(null);
        }
    });
    svg.addEventListener('blur', () => { state.focus = -1; hover(null); });
}

// Redraw on a resize (width from the figure, height from the window too), on
// a language change and once the webfont lands, which both move labels.
function watch(fig, relabel, resize) {
    let size = '';
    const resized = () => {
        const s = fig.clientWidth + 'x' + window.innerHeight;
        if (s !== size) { size = s; resize(); }
    };
    new ResizeObserver(resized).observe(fig);
    window.addEventListener('resize', resized);
    if (window._i18n && window._i18n.onChange) window._i18n.onChange(relabel);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(relabel);
}

// The hours-view hyperbola refit with only the models released by each date
// (tools/horizon-fit.mjs): one step per release, held until the next. y is
// the singularity a refit puts, or the time it then left until it; that
// shrinks as the date nears the refit's singularity, so in time left each
// step runs down, and the last runs into today's fitted date. A null high is
// an interval with no top.
const AS_OF = (HORIZON.asOf || []).map(([i, ts, low, high]) => ({ i, t: POINTS[i].t, ts, low, high: high ?? Infinity }));

// A refit's singularity v at date t, in each y view's units.
const REFIT_Y = {
    date: { title: 'singularity', of: (v) => v },
    left: { title: 'axisToGo', of: (v, t) => v - t },
};

// Round ticks on a linear scale, at least 28 px apart.
function linTicks(lo, hi, ph, fmt) {
    const step = [1, 2, 5, 10, 20].find((k) => ph * k / (hi - lo) >= 28) || 50;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push([v, fmt(v)]);
    return out;
}

// Far shows every refit; near starts where they settle, at the first refit
// after which none puts the singularity 4 years away or more. In each, the
// date axis starts at the first whole year and spans as many years as the
// time-left axis, so the two share their gridlines.
const NEAR_LEFT = 4;
function zooms() {
    const left = AS_OF.map((r) => r.ts - r.t);
    let jn = AS_OF.length - 1;
    while (jn > 0 && left[jn - 1] < NEAR_LEFT) jn--;
    const zoom = (j0, x0) => {
        const span = Math.ceil(Math.max(...left.slice(j0))) + 1, y0 = Math.ceil(x0);
        return { x: [x0, 2028], date: [y0, y0 + span], left: [0, span] };
    };
    return {
        far: zoom(0, Math.floor((AS_OF[0].t - 0.2) * 2) / 2),
        near: zoom(jn, Math.floor((AS_OF[jn].t - 0.1) * 4) / 4),
    };
}

function initRefits(now) {
    const fig = document.getElementById('refit-fig');
    const cap = document.getElementById('refit-cap');
    if (!fig || !cap || !AS_OF.length) return;

    const state = { zoom: 'far', y: 'left', focus: -1 };
    const fit = HORIZON.views.hours.hyperbolic; // today's fit, for the marks
    const Z = zooms();
    const date = { of: (t) => t, inv: (v) => v };
    // dates for each refit's step, denser where the last dives
    const STEPS = AS_OF.map((r, j) => {
        const b = j + 1 < AS_OF.length ? AS_OF[j + 1].t : 2028;
        const out = [];
        for (let i = 0; i <= 64; i++) out.push(r.t + (b - r.t) * i / 64);
        for (let i = 0; i <= 60; i++) { const t = r.ts - 10 ** (-3 * i / 60); if (t > r.t && t < b) out.push(t); }
        return out.sort((p, q) => p - q);
    });
    const DIAG = Array.from({ length: 121 }, (_, i) => Z.far.x[0] - 0.5 + 6 * i / 120);
    let L = null, geo = null, layer = null;

    const tw = tweener(draw);
    const leaf = () => ({ zoom: state.zoom, y: state.y, key: `${state.zoom}/${state.y}` });
    bindToggles('refit-fig', state, () => tw.go(leaf()));

    function draw(view, settled) {
        const f = u();
        const W = Math.max(280, fig.clientWidth), H = figHeight(W), narrow = W < 560;
        while (fig.firstChild) fig.removeChild(fig.firstChild);
        const svg = node('svg', { class: 'horizon-svg', width: W, height: H, role: 'img', 'aria-label': copy('refitAlt'), tabindex: '0' }, fig);
        const ph0 = H - 86;
        const fmt = { date: String, left: (v) => (v ? f.yr(v) : '0') };
        const ticks = {};
        for (const z in Z) for (const y in fmt) ticks[`${z}/${y}`] = linTicks(...Z[z][y], ph0, fmt[y]);
        if (!L || L.W !== W || L.H !== H) L = frame(svg, W, H, Object.values(ticks).flat().map(([, lab]) => lab));
        const { m, ph } = L;

        const S = new Map();
        for (const l of leaves(view)) {
            if (!S.has(l)) S.set(l, { ...scales(L, { dom: Z[l.zoom].x, ...date }, Z[l.zoom][l.y], Infinity), of: REFIT_Y[l.y].of });
        }
        const P = mixer(view, S);
        const val = (v, t) => P.Y((l) => S.get(l).of(v, t));

        // y ticks: a date tick sits, under time left, where its gridline does
        // (the two axes share them), and the other way round
        const yTicks = [];
        for (const y in fmt) {
            const seen = new Set();
            for (const z in Z) {
                for (const [v, lab] of ticks[`${z}/${y}`]) {
                    if (seen.has(v)) continue;
                    seen.add(v);
                    yTicks.push({
                        g: (l) => (l.y === y ? v : y === 'date' ? v - Z[l.zoom].date[0] : v + Z[l.zoom].date[0]),
                        lab,
                        show: (l) => l.y === y && ticks[`${l.zoom}/${y}`].some(([w]) => w === v),
                    });
                }
            }
        }
        const xTicks = [];
        for (let yr = Math.ceil(Z.far.x[0]); yr <= 2028; yr++) {
            xTicks.push({ g: yr, lab: narrow ? `’${String(yr).slice(2)}` : String(yr), show: (l) => !narrow || (yr - Math.ceil(Z[l.zoom].x[0])) % 2 === 0 });
        }
        drawAxes(svg, L, P, {
            yTicks,
            yTitles: Object.keys(REFIT_Y).map((y) => ({ title: REFIT_Y[y].title, show: (l) => l.y === y })),
            xTicks,
            xTitles: [{ title: 'axisDate', show: () => true }],
            marks: [
                { g: now, cls: 'hz-today', lab: copy('today'), o: 1 },
                { g: fit.ts, cls: 'hz-sing', lab: copy('singularity'), o: 1 },
            ],
        });

        const g = plotGroup(svg, L, 'refit-clip');
        singStrip(g, L, P, fit.low, fit.high, 1);

        // in date, the singularities already past: below the diagonal, where
        // a refit's singularity would be the date itself
        const od = P.O((l) => l.y === 'date');
        if (od >= 0.005) {
            const diag = DIAG.map((t) => [P.X(t), val(t, t)]).filter(finite);
            if (diag.length > 1) {
                const bottom = m.t + ph;
                fade(node('path', { class: 'hz-past', d: `${pathOf(diag)}L${diag[diag.length - 1][0].toFixed(1)} ${bottom}L${diag[0][0].toFixed(1)} ${bottom}Z` }, g), od);
                fade(node('path', { class: 'hz-diag', d: pathOf(diag) }, g), od);
            }
        }

        AS_OF.forEach((r, j) => {
            const upper = STEPS[j].map((t) => [P.X(t), val(r.high, t)]);
            const lower = STEPS[j].map((t) => [P.X(t), val(r.low, t)]).reverse();
            const pts = [...upper, ...lower].filter(finite);
            if (pts.length > 2) node('path', { class: 'hz-band-hyp', d: pathOf(pts) + 'Z' }, g);
        });
        const line = AS_OF.flatMap((r, j) => STEPS[j].map((t) => [P.X(t), val(r.ts, t)])).filter(finite);
        node('path', { class: 'hz-hyp', d: pathOf(line) }, g);

        // releases zoomed out of the plot leave it with the steps
        const dots = plotGroup(svg, L, 'refit-dots', 4);
        const xy = AS_OF.map((r) => [P.X(r.t), val(r.ts, r.t)]);
        for (const [x, y] of xy) node('circle', { class: 'hz-dot-hyp', cx: x, cy: y, r: 3.2 }, dots);

        if (!settled) return;
        const s = S.get(view);
        layer = node('g', {}, svg);
        const shown = xy.map(([x, y]) => (inPlot(L, x) && y >= m.t - 4 && y <= m.t + ph + 4 ? [x, y] : [NaN, NaN]));
        geo = { m, pw: L.pw, ph, xv: s.xv, xOf: s.x, yOf: s.y, of: s.of, xy: shown };
        wirePointer(svg, geo, () => AS_OF.length, state, hover, (j) => ({ refit: j }));
        hover(state.focus >= 0 ? { refit: state.focus } : null);
    }

    // the refit's singularity in date, else the time it leaves from t
    const readout = (r, t) => state.y === 'date' ? singText(r) : copy('captionLeft')
        .replace('{left}', span(r.ts - t))
        .replace('{low}', span(r.low - t))
        .replace('{high}', span(r.high - t));

    function hover(h) {
        if (!geo) return;
        const f = u();
        while (layer.firstChild) layer.removeChild(layer.firstChild);
        if (!h || h.refit != null) {
            const j = h ? h.refit : AS_OF.length - 1, r = AS_OF[j];
            if (h && Number.isFinite(geo.xy[j][0])) node('circle', { class: 'hz-ring', cx: geo.xy[j][0], cy: geo.xy[j][1], r: 9 }, layer);
            cap.textContent = [POINTS[r.i].name, month(r.t), readout(r, r.t)].join(f.sep);
            return;
        }
        const t = h.t, x = geo.xOf(t);
        node('line', { class: 'hz-cross', x1: x, x2: x, y1: geo.m.t, y2: geo.m.t + geo.ph }, layer);
        let j = -1;
        AS_OF.forEach((r, k) => { if (r.t <= t) j = k; });
        if (j < 0) { cap.textContent = month(t); return; }
        const r = AS_OF[j], py = geo.yOf(geo.of(r.ts, t));
        if (py >= geo.m.t && py <= geo.m.t + geo.ph) node('circle', { class: 'hz-dot-hyp', cx: x, cy: py, r: 3.2 }, layer);
        cap.textContent = [month(t), POINTS[r.i].name, readout(r, t)].join(f.sep);
    }

    watch(fig, () => { L = null; tw.redraw(); }, () => tw.redraw());
    tw.go(leaf());
}
