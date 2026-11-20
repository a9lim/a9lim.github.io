// The analysis's way into the site's fit (tools/horizon-fit.mjs), so the fit has one implementation.
// fit.py starts this once and speaks JSON lines to it: one request per line on stdin, one reply per line on stdout.
//
//   {"op": "read"}                                        -> the figure's table: {series, calibration}
//   {"op": "fit", "series", "calibration", "B", "seed", "views", "asOf"}  -> fitRaw's result
//   {"op": "hyp", "t", "Y", "maxGap"}                     -> a hyperbola per row of Y: {a, alpha, ts, sse}
//   {"op": "dexp", "t", "Y"}                              -> a double exponential per row: {d0, d1, c, sse}
//
// Non-finite numbers go out as the bare tokens Infinity, -Infinity and NaN, which Python's json reads.
import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { fitDexp, fitHyp, fitRaw, readHorizons } from '../../tools/horizon-fit.mjs';

const CONTENT = fileURLToPath(new URL('../../content/home/horizons.md', import.meta.url));
const TOKEN = { inf: 'Infinity', '-inf': '-Infinity', nan: 'NaN' };
const encode = (o) => JSON.stringify(o, (_, v) => {
    if (ArrayBuffer.isView(v)) return Array.from(v);
    if (typeof v === 'number' && !Number.isFinite(v)) return `__${Number.isNaN(v) ? 'nan' : v > 0 ? 'inf' : '-inf'}__`;
    return v;
}).replace(/"__(-?inf|nan)__"/g, (_, w) => TOKEN[w]);

const rows = (Y, fit, keys) => {
    const out = Object.fromEntries(keys.map((k) => [k, []]));
    for (const y of Y) { const f = fit(y); for (const k of keys) out[k].push(f[k]); }
    return out;
};

const OPS = {
    read: () => {
        const text = readFileSync(CONTENT, 'utf8');
        const body = text.replace(/^---\n[\s\S]*?\n---\n/, '');
        const { series, calibration } = readHorizons(body, 'content/home/horizons.md');
        return { series, calibration };
    },
    fit: (q) => fitRaw(q.series, q.calibration, { B: q.B, seed: q.seed, views: q.views, asOf: q.asOf }),
    hyp: (q) => rows(q.Y, (y) => fitHyp(q.t, y, q.maxGap ?? 60), ['a', 'alpha', 'ts', 'sse']),
    dexp: (q) => rows(q.Y, (y) => fitDexp(q.t, y), ['d0', 'd1', 'c', 'sse']),
};

const rl = createInterface({ input: process.stdin, terminal: false });
rl.on('line', (line) => {
    let reply;
    try {
        const q = JSON.parse(line);
        reply = { ok: OPS[q.op](q) };
    } catch (e) {
        reply = { error: String(e && e.stack || e) };
    }
    process.stdout.write(encode(reply) + '\n');
});
