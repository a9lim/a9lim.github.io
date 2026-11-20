// The fit behind the home-page time-horizon figure (content/home/horizons.md),
// and the only implementation of it: tools/build.mjs runs it for the site, and
// the analysis in docs/horizons/ calls it through docs/horizons/bridge.mjs.
// Deterministic: a seeded generator drives every draw, so `build.mjs --check`
// reproduces the output exactly.
//
// Units: t is a decimal year; horizons are log2 hours; AECI is AECI.
//
// 0. readHorizons reads the content file's two tables (the record series and
//    the calibration-only models) into rows for the fit.
// 1. The AECI–horizon map: least squares of log2 horizon on AECI through
//    every model with both values, log2 h = b0 + b1·(AECI − 150).
// 2. Two views of the record series. "hours" takes each model's measured
//    horizon and converts AECI-only models through the map; "aeci" takes each
//    model's AECI and converts horizon-only models through the inverse map.
// 3. In each view, a hyperbola y = a − alpha·log2(ts − t) (profiled over ts)
//    and a double exponential y = d0 + d1·exp(c·(t − 2019)) (profiled over c).
// 4. Bands and the singularity interval: B bootstrap replicates. Each draws
//    the map's parameters from their sampling distribution (multivariate t),
//    moves the converted points accordingly, resamples the fit's residuals,
//    and refits. The points' own intervals are not resampled: METR's
//    intervals share one task suite (horizons) or one benchmark set (AECI)
//    across models, so independent draws would overstate the noise.
// 5. Point intervals: native ones are METR's; converted ones come from
//    Monte Carlo over the source interval, the map's parameters, and the
//    map's residual scatter.
// 6. The singularity as of each release: the hyperbola refit in the hours
//    view with only the models, and the map pairs, released by then, each
//    with its own bootstrap. Until AECI-only models arrive (April 2026) the
//    hours view needs no map, so this runs back to the fifth model, the
//    first that leaves the bootstrap two residuals to work with (with one,
//    it reports a tight interval around a meaningless fit). Its profile runs
//    to 1,000 years; an interval that reaches that far has no top, and its
//    high is null.
//
// fitRaw returns every number unrounded; fitHorizons rounds it for the site.

import { mdBlocksOf, parseTableBlock } from './md-table.mjs';

const T0 = 2019;

function rng(seed) {
    let s = seed >>> 0;
    const u = () => {
        s = (s + 0x6D2B79F5) >>> 0;
        let r = Math.imul(s ^ (s >>> 15), 1 | s);
        r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
    let spare = null;
    const normal = () => {
        if (spare !== null) { const v = spare; spare = null; return v; }
        let a, b, q;
        do { a = 2 * u() - 1; b = 2 * u() - 1; q = a * a + b * b; } while (q >= 1 || q === 0);
        const f = Math.sqrt(-2 * Math.log(q) / q);
        spare = b * f;
        return a * f;
    };
    const chi2 = (df) => { let x = 0; for (let i = 0; i < df; i++) { const z = normal(); x += z * z; } return x; };
    return { u, normal, chi2, int: (n) => Math.floor(u() * n) };
}

// y = b0 + b1·x by least squares
function line(x, y) {
    const n = x.length;
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
    const mx = sx / n, my = sy / n;
    let sxx = 0, sxy = 0;
    for (let i = 0; i < n; i++) { const dx = x[i] - mx; sxx += dx * dx; sxy += dx * (y[i] - my); }
    const b1 = sxy / sxx, b0 = my - b1 * mx;
    let sse = 0;
    for (let i = 0; i < n; i++) { const r = y[i] - b0 - b1 * x[i]; sse += r * r; }
    return { b0, b1, sse, mx, sxx };
}

// Minimize f over a log-spaced grid, then golden-section between the grid
// neighbours of the best point.
function profile(f, lo, hi, n) {
    const g = [];
    for (let i = 0; i < n; i++) g.push(lo * (hi / lo) ** (i / (n - 1)));
    let bi = 0, bv = Infinity;
    for (let i = 0; i < n; i++) { const v = f(g[i]); if (v < bv) { bv = v; bi = i; } }
    let a = Math.log(g[Math.max(0, bi - 1)]), b = Math.log(g[Math.min(n - 1, bi + 1)]);
    const r = (Math.sqrt(5) - 1) / 2;
    let c = b - r * (b - a), d = a + r * (b - a);
    let fc = f(Math.exp(c)), fd = f(Math.exp(d));
    for (let k = 0; k < 40; k++) {
        if (fc < fd) { b = d; d = c; fd = fc; c = b - r * (b - a); fc = f(Math.exp(c)); }
        else { a = c; c = d; fc = fd; d = a + r * (b - a); fd = f(Math.exp(d)); }
    }
    const x = Math.exp((a + b) / 2);
    return f(x) <= bv ? x : g[bi];
}

export function fitHyp(t, y, maxGap = 60) {
    const tmax = Math.max(...t);
    const x = new Float64Array(t.length);
    const at = (gap) => { for (let i = 0; i < t.length; i++) x[i] = -Math.log2(tmax + gap - t[i]); return line(x, y); };
    const gap = profile((g) => at(g).sse, 0.003, maxGap, 160);
    const { b0, b1, sse } = at(gap);
    const ts = tmax + gap;
    return { a: b0, alpha: b1, ts, sse, f: (s) => (s < ts ? b0 - b1 * Math.log2(ts - s) : Infinity) };
}

export function fitDexp(t, y) {
    const x = new Float64Array(t.length);
    const at = (c) => { for (let i = 0; i < t.length; i++) x[i] = Math.exp(c * (t[i] - T0)); return line(x, y); };
    const c = profile((k) => at(k).sse, 0.02, 2, 120);
    const { b0, b1, sse } = at(c);
    return { d0: b0, d1: b1, c, sse, f: (s) => b0 + b1 * Math.exp(c * (s - T0)) };
}

function quantile(sorted, q) {
    const i = (sorted.length - 1) * q, lo = Math.floor(i), hi = Math.ceil(i);
    if (sorted[hi] === Infinity) return Infinity; // past a replicate's singularity
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

// Draw one value from a 95% interval read as a split normal around v.
function drawFrom(R, v, lo, hi) {
    const z = R.normal();
    return v + z * (z < 0 ? v - lo : hi - v) / 1.96;
}

// The AECI–horizon map through these pairs, and a sampler for its parameters
// (multivariate t, from the least-squares covariance with x centred at 150).
function fitMap(pairs, R) {
    const px = pairs.map((m) => m.aeci.v - 150), py = pairs.map((m) => m.th.v);
    const L = line(px, py);
    const n = pairs.length, df = n - 2;
    const s2 = L.sse / df;
    const v11 = s2 / L.sxx, v01 = -L.mx * v11, v00 = s2 / n + L.mx * L.mx * v11;
    const c00 = Math.sqrt(v00), c10 = v01 / c00, c11 = Math.sqrt(v11 - c10 * c10);
    const map = { b0: L.b0, b1: L.b1, s: Math.sqrt(s2), n, df, slopeSd: Math.sqrt(v11) };
    const drawMap = () => {
        const z0 = R.normal(), z1 = R.normal(), k = Math.sqrt(R.chi2(df) / df);
        return { b0: L.b0 + (c00 * z0) / k, b1: L.b1 + (c10 * z0 + c11 * z1) / k };
    };
    return { map, drawMap };
}
const toAeci = (y, m) => 150 + (y - m.b0) / m.b1;
const toHours = (a, m) => m.b0 + m.b1 * (a - 150);
const VIEWS = {
    hours: (m, mp) => (m.th ? m.th.v : toHours(m.aeci.v, mp)),
    aeci: (m, mp) => (m.aeci ? m.aeci.v : toAeci(m.th.v, mp)),
};

// ---------------------------------------------------------------- 0. the table
// Decimal year, as the fits use it: year + elapsed days / days in the year.
function decimalYear(iso, where) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(iso + 'T00:00:00Z'))) {
        throw new Error(`${where}: bad date "${iso}"`);
    }
    const y = Number(iso.slice(0, 4));
    const a = Date.UTC(y, 0, 1), b = Date.UTC(y + 1, 0, 1);
    return y + (Date.parse(iso + 'T00:00:00Z') - a) / (b - a);
}
const NUM = /^\d+(?:\.\d+)?$/;
// A value with an optional 95% interval "lo–hi"; horizons become log2 hours.
function reading(v, ci, where, what, toUnits) {
    if (v === '') {
        if (ci !== '') throw new Error(`${where}: ${what} interval without a value`);
        return null;
    }
    if (!NUM.test(v)) throw new Error(`${where}: bad ${what} "${v}"`);
    const out = { v: toUnits(Number(v)), lo: null, hi: null };
    if (ci !== '') {
        const m = ci.match(/^(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)$/);
        if (!m || !(Number(m[1]) <= Number(v) && Number(v) <= Number(m[2]))) throw new Error(`${where}: bad ${what} interval "${ci}"`);
        out.lo = toUnits(Number(m[1]));
        out.hi = toUnits(Number(m[2]));
    }
    return out;
}
const log2h = (min) => Math.log2(min / 60);

/**
 * The body of content/home/horizons.md (frontmatter removed): its source note,
 * the record series table and the calibration-only table.
 * @returns {{series, calibration, notes: string[]}}
 */
export function readHorizons(body, rel) {
    const blocks = mdBlocksOf(body);
    const isTable = (b) => b.trimStart().startsWith('|');
    const tables = blocks.filter(isTable);
    const notes = blocks.filter((b) => !isTable(b));
    if (tables.length !== 2) throw new Error(`${rel}: expected the series table and the calibration table, got ${tables.length} tables`);
    if (notes.length !== 1) throw new Error(`${rel}: expected one source note, got ${notes.length}`);
    const parseRows = (block, first) => {
        const t = parseTableBlock(block, rel);
        const want = [first, 'Date', 'Horizon (min)', 'Horizon 95%', 'AECI', 'AECI 95%'];
        if (t.header.join('|') !== want.join('|')) throw new Error(`${rel}: table header must be ${want.join(' | ')}`);
        return t.rows.map(([name, date, th, thCi, aeci, aeciCi], i) => {
            const where = `${rel}: ${first} row ${i + 1}`;
            if (!name) throw new Error(`${where}: missing model`);
            const m = {
                name,
                date,
                t: decimalYear(date, where),
                th: reading(th, thCi, where, 'horizon', log2h),
                aeci: reading(aeci, aeciCi, where, 'AECI', (x) => x),
            };
            if (!m.th && !m.aeci) throw new Error(`${where}: needs a horizon or an AECI`);
            return m;
        });
    };
    const series = parseRows(tables[0], 'Model');
    const calibration = parseRows(tables[1], 'Calibration only');
    for (let i = 1; i < series.length; i++) {
        if (series[i].t < series[i - 1].t) throw new Error(`${rel}: series rows must be in date order (${series[i].name})`);
    }
    return { series, calibration, notes };
}

// ---------------------------------------------------------------- 1–6. the fit
/**
 * Every number unrounded. The analysis passes views: ['hours'] and asOf: false
 * when it needs only the main fit; a series with no converted models in the
 * requested views and fewer than three map pairs runs without a map.
 * @param {Array<{name, t, th: {v, lo, hi}|null, aeci: {v, lo, hi}|null}>} series  plotted models (th in log2 hours)
 * @param {Array<{th, aeci}>} calibration  extra models used only for the map
 */
export function fitRaw(series, calibration, { B = 2000, seed = 20261111, views = ['hours', 'aeci'], asOf = true } = {}) {
    const R = rng(seed);

    // 1. map
    const pairs = [...series, ...calibration].filter((m) => m.th && m.aeci);
    const needsMap = views.some((view) => series.some((m) => !(view === 'hours' ? m.th : m.aeci)));
    if (needsMap && pairs.length < 3) throw new Error('horizon fit: converted models need a map with three pairs');
    const M = pairs.length > 2 ? fitMap(pairs, R) : null;
    const map = M && M.map, drawMap = M ? M.drawMap : () => null;
    const df = map && map.df;

    // 2. views
    const t = series.map((m) => m.t);
    const out = { map, views: {}, asOf: null };
    for (const view of views) {
        const value = VIEWS[view];
        const y = series.map((m) => value(m, map));
        const converted = series.map((m) => (view === 'hours' ? !m.th : !m.aeci));

        // 5. point intervals
        const points = series.map((m, i) => {
            const own = view === 'hours' ? m.th : m.aeci;
            if (own) return [own.v, own.lo, own.hi, 0];
            const src = view === 'hours' ? m.aeci : m.th;
            const N = 4000, d = new Float64Array(N);
            for (let k = 0; k < N; k++) {
                const mp = drawMap();
                const e = (map.s * R.normal()) / Math.sqrt(R.chi2(df) / df);
                const v = src.lo != null ? drawFrom(R, src.v, src.lo, src.hi) : src.v;
                d[k] = view === 'hours' ? toHours(v, mp) + e : toAeci(v - e, mp);
            }
            d.sort();
            return [y[i], quantile(d, 0.025), quantile(d, 0.975), 1];
        });

        // 3. central fits
        const hyp = fitHyp(t, y), dex = fitDexp(t, y);

        // band grid: dates, plus log-spaced times before this view's singularity
        const grid = [];
        for (let i = 0; i < 160; i++) grid.push(T0 + (9 * i) / 159);
        for (let i = 0; i < 160; i++) grid.push(hyp.ts - 10 ** (1 - (1.61 * i) / 159));
        grid.sort((a, b) => a - b);
        const G = grid.length;

        // 4. bootstrap
        const hypFit = t.map((s) => hyp.f(s)), dexFit = t.map((s) => dex.f(s));
        const hypRes = y.map((v, i) => v - hypFit[i]), dexRes = y.map((v, i) => v - dexFit[i]);
        const curves = { hyp: new Float64Array(B * G), dexp: new Float64Array(B * G) };
        const ts = new Float64Array(B);
        const yb = new Float64Array(y.length);
        for (let b = 0; b < B; b++) {
            const mp = drawMap();
            const shift = series.map((m, i) => (converted[i] ? value(m, mp) - y[i] : 0));
            for (const [name, fit, fitted, res] of [['hyp', fitHyp, hypFit, hypRes], ['dexp', fitDexp, dexFit, dexRes]]) {
                for (let i = 0; i < y.length; i++) yb[i] = fitted[i] + shift[i] + res[R.int(y.length)];
                const f = fit(t, yb);
                if (name === 'hyp') ts[b] = f.ts;
                const row = curves[name];
                for (let g = 0; g < G; g++) row[b * G + g] = f.f(grid[g]);
            }
        }
        ts.sort();
        const band = { t: grid };
        for (const name of ['hyp', 'dexp']) {
            const col = new Float64Array(B);
            band[name] = grid.map((_, g) => {
                for (let b = 0; b < B; b++) col[b] = curves[name][b * G + g];
                col.sort();
                return [quantile(col, 0.025), quantile(col, 0.975)];
            });
        }

        out.views[view] = {
            y, converted, points, band,
            // exponent: doublings of horizon per halving of the time left
            hyperbolic: { a: hyp.a, alpha: hyp.alpha, ts: hyp.ts, sse: hyp.sse, low: quantile(ts, 0.025), high: quantile(ts, 0.975),
                          exponent: view === 'hours' ? hyp.alpha : hyp.alpha * map.b1 },
            doubleExponential: { d0: dex.d0, d1: dex.d1, c: dex.c, sse: dex.sse },
        };
    }
    if (!asOf) return out;

    // 6. the singularity as of each release, on a stream of its own so the
    //    fits above don't move; the refit with every model is the full fit,
    //    so it reports the full fit's numbers
    const RA = rng(seed + 1);
    out.asOf = [];
    for (let k = 5; k <= series.length; k++) {
        const S = series.slice(0, k), asof = S[k - 1].t;
        if (k < series.length && series[k].t === asof) continue; // same-day releases enter together
        if (k === series.length) {
            const h = out.views.hours.hyperbolic;
            out.asOf.push([k - 1, h.ts, h.low, h.high]);
            continue;
        }
        const converted = S.map((m) => !m.th);
        const P = pairs.filter((m) => m.t <= asof);
        if (converted.some(Boolean) && P.length < 3) throw new Error(`horizon fit: as of ${S[k - 1].name}, converted models need a map with three pairs`);
        const MK = converted.some(Boolean) ? fitMap(P, RA) : null;
        const tk = S.map((m) => m.t);
        const y = S.map((m) => VIEWS.hours(m, MK && MK.map));
        const hyp = fitHyp(tk, y, 1000);
        const fitted = tk.map((s) => hyp.f(s)), res = y.map((v, i) => v - fitted[i]);
        const ts = new Float64Array(B), yb = new Float64Array(k);
        for (let b = 0; b < B; b++) {
            const mp = MK && MK.drawMap();
            for (let i = 0; i < k; i++) yb[i] = fitted[i] + (converted[i] ? VIEWS.hours(S[i], mp) - y[i] : 0) + res[RA.int(k)];
            ts[b] = fitHyp(tk, yb, 1000).ts;
        }
        ts.sort();
        const high = quantile(ts, 0.975);
        out.asOf.push([k - 1, hyp.ts, quantile(ts, 0.025), high > asof + 999 ? null : high]);
    }
    return out;
}

const r4 = (v) => (Number.isFinite(v) ? Math.round(v * 1e4) / 1e4 : null);
const r3 = (v) => (Number.isFinite(v) ? Math.round(v * 1e3) / 1e3 : null);

/** The fit as the site carries it (src/horizon-data.js): fitRaw, rounded. */
export function fitHorizons(series, calibration, { B = 2000, seed = 20261111 } = {}) {
    const raw = fitRaw(series, calibration, { B, seed });
    const m = raw.map;
    const out = { map: { b0: r4(m.b0), b1: r4(m.b1), s: r4(m.s), n: m.n }, views: {} };
    for (const [view, v] of Object.entries(raw.views)) {
        const h = v.hyperbolic, d = v.doubleExponential;
        out.views[view] = {
            points: v.points.map(([a, lo, hi, c]) => [r4(a), r4(lo), r4(hi), c]),
            hyperbolic: { a: r4(h.a), alpha: r4(h.alpha), ts: r4(h.ts), low: r4(h.low), high: r4(h.high), exponent: r4(h.exponent) },
            doubleExponential: { d0: r4(d.d0), d1: r4(d.d1), c: r4(d.c) },
            band: { t: v.band.t.map(r4), hyp: v.band.hyp.map((p) => p.map(r3)), dexp: v.band.dexp.map((p) => p.map(r3)) },
        };
    }
    out.asOf = raw.asOf.map(([k, ts, lo, hi]) => [k, r4(ts), r4(lo), hi == null ? null : r4(hi)]);
    return out;
}
