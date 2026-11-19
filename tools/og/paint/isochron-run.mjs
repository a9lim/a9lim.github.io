// FROZEN (a9, 2026-11-19): Isochron's card stays as painted however the sim changes, so this isn't run
// again. It's kept as the record of how the card's run was made, against the model of 2026-11-16 (it reads
// `lineages`, which the model no longer has).
//
// The run Isochron's card is painted from: a seeded history of the people's model
// (projects/isochron/tools/people-run.mjs), laid on the follow dial's axis, as
// isochron-run.json beside this file. The painting reads only that.
//
//   (cd projects/isochron && QUIET=1 AFTER=30 OUT=/tmp/run.json node tools/people-run.mjs earthlike)
//   node tools/og/paint/isochron-run.mjs /tmp/run.json
//
// The axis is the follow dial's wall-clock (tools/people/fit.mjs, followDial: a doubling
// of what grows fastest takes 10 s, within the dial's range), as a fraction f of the way
// from the first hominins (0) to the moment the dial runs out (1).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const iso = path.resolve(here, '..', '..', '..', 'projects', 'isochron');
const { paceOf } = await import(path.join(iso, 'src', 'engine', 'people.js'));

const src = process.argv[2];
if (!src) throw new Error('usage: node isochron-run.mjs <run.json from tools/people-run.mjs>');
const run = JSON.parse(readFileSync(src, 'utf8'));
const h = run.history;
const first = {};
for (const e of run.events) if (!(e.kind in first)) first[e.kind] = e.t;
if (first.dial == null) throw new Error('this run never reaches the dial');

// The follow dial's wall-clock at each step (as followDial: 10 s a doubling, the page's
// floor before the first tip and its ~80 kyr/s ceiling, the dial's 2.8 h/s at the bottom).
const wall = [0];
let present = false;
for (let k = 1; k < h.length; k++) {
  const b = h[k];
  present = present || b.beta >= 0.15;
  const g = paceOf(h.slice(Math.max(0, k - 20), k + 1), present);
  const floor = b.zmax > 1 || b.farm > 0 ? 0 : 5e3;
  const rate = Math.min(8e4, Math.max(floor, g > 1e-7 ? Math.max(10 ** -3.5, Math.LN2 / g / 10) : 1e7));
  wall.push(wall[k - 1] + b.dt / rate);
}
const at = t => { const i = h.findIndex(x => x.t >= t); return i < 0 ? h.length - 1 : i; };
const iDial = at(first.dial), wDial = wall[iDial];
const f = k => wall[k] / wDial;
const sig = (x, n = 4) => (Number.isFinite(x) ? +x.toPrecision(n) : 0);

// The history thinned to steps of 1/240 of the axis, up to the dial.
const KEYS = ['people', 'minds', 'farm', 'ind', 'Ef', 'Ecomp', 'aer', 'beta', 'space', 'co2', 'lineages'];
const axis = [];
let next = 0;
for (let k = 0; k <= iDial; k++) {
  if (f(k) < next && k < iDial) continue;
  next = f(k) + 1 / 240;
  axis.push([sig(f(k), 5), sig(first.dial - h[k].t, 5), ...KEYS.map(key => sig(h[k][key]))]);
}

// The flank: every step from where the minds are half again the people (the curve leaving
// the ground) to the first one past 450 times the people at the dial (above the picture,
// where a unit of height is everyone alive).
const scale = h[iDial].people;
const flank = [];
for (let k = 0; k < h.length; k++) {
  if (h[k].minds < 1.5 * h[k].people || !(h[k].t > first.present)) continue;
  flank.push([sig(f(k), 6), sig(h[k].minds, 5)]);
  if (h[k].minds > 450 * scale) break;
}

const out = {
  seed: run.seed,
  ending: (run.events.find(e => e.kind === 'ending') || {}).text || null,
  wallAtDial: sig(wDial),
  mindsPerUnit: sig(scale, 5),
  events: Object.fromEntries(['tip', 'farming', 'industry', 'present', 'dial']
    .filter(k => first[k] != null).map(k => [k, { f: sig(f(at(first[k])), 5), yearsBeforeDial: sig(first.dial - first[k], 5) }])),
  columns: ['f', 'yearsBeforeDial', ...KEYS],
  axis,
  flank,
};
const dst = path.join(here, 'isochron-run.json');
writeFileSync(dst, JSON.stringify(out).replace(/\],\[/g, '],\n[') + '\n');
console.log(`${axis.length} rows on the axis, ${flank.length} on the flank; the dial at ${wDial.toFixed(0)} s; a unit of height is ${scale.toPrecision(4)} minds → ${dst}`);
console.log(Object.entries(out.events).map(([k, v]) => `${k} f ${v.f} (${v.yearsBeforeDial} yr before the dial)`).join(' · '));
