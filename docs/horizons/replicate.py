"""Reproduce the log vs reverse-log singularity fit, then test what it shows.

    python replicate.py      # prints the tables, writes result.json
    python chart.py          # draws horizon-singularity-check.png from result.json

The series, the map and the intervals are the ones behind the figure at a9l.im/#fits (fit.fit_horizons).

fable, 2026-11-11 (claude-fable-5-2)
"""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, json
from series import AECI, ECI, PUBLIC, WHISKER, models, row, eci_frontier, day, paired
from fit import FITS, fit_horizons, compare, fit_hyp, fit_dexp, fit_pw, hyp, hyp_at, dexp_at, epoch_pairs, aeci_on_eci, dedupe, t975, drift, rolling
HERE = os.path.dirname(os.path.abspath(__file__))
hours = lambda v: f'{2 ** v:,.0f} h' if 2 ** v >= 100 else f'{2 ** v:.3g} h'
never = lambda v, tmax: 'never' if v > tmax + 55 else f'{v:.2f}'

# ---- the series: 18 measured record holders, then 7 AECI record holders; two more models calibrate the map
S, CAL = models()
F = fit_horizons(S, CAL); VH, VA = F['views']['hours'], F['views']['aeci']
t, y, names = np.array([m['t'] for m in S]), VH['y'], [m['name'] for m in S]
b0, b1 = F['map']; q = t975(F['map_n'] - 2) * F['map_slope_sd']
print(f"map: {1 / b1:.2f} AECI points per doubling (95% {1 / (b1 + q):.2f} to {1 / (b1 - q):.2f}), {2 ** b0:.2f} h at AECI 150, "
      f"n={F['map_n']}, residual sd {F['map_sd']:.2f} doublings")
print('series (≈ converted through the map; 95% intervals):')
for m, ph, pa in zip(S, VH['points'], VA['points']):
    iv = lambda p, f: '' if p[1] is None else f' ({f(p[1])} to {f(p[2])})'
    print(f"  {day(m['t'])}  {m['name']:29s} {'≈' if ph[3] else ' '} {hours(ph[0]):>9s}{iv(ph, hours):24s} {'≈' if pa[3] else ' '} AECI {pa[0]:6.1f}{iv(pa, lambda v: f'{v:.1f}')}")
for view, V in F['views'].items():
    h, d = V['hyp'], V['dexp']
    print(f"{view} view: singularity {h['ts']:.2f} (95% {h['low']:.2f} to {h['high']:.2f}), exponent {h['exponent']:.2f} doublings per halving of the time left; double exponential c={d['c']:.3f}/yr")

runs = {}; main = runs["the figure's series"] = compare("The figure's series (measured, then AECI through the map)", S, CAL)
h = main['fits']['hyperbolic']
# straightness in the tweet's own coordinates
xx = -np.log2(h['ts'] - t); obs_r = float(np.corrcoef(xx, y)[0, 1])
print(f"  in log h vs log(t_c - t): Pearson r = {obs_r:.4f}; x spans {np.log10((h['ts'] - t.min()) / (h['ts'] - t.max())):.2f} orders of magnitude ({np.log10((h['ts'] - 2023.19) / (h['ts'] - t.max())):.2f} since GPT-4)")
print(f"  each doubling shorter by {100 * (1 - 2 ** (-1 / h['b'][1])):.1f}%")

# ---- the tweet exactly: its date for the early Mythos Preview checkpoint, Jurkovic's constants
St, _ = models(early='file'); tt = np.array([m['t'] for m in St])
yt = np.array([m['th'][0] if m['th'] else np.log2(3.46 * np.exp(0.148 * (m['aeci'][0] - 150))) for m in St]); ht = fit_hyp(tt, yt)
print(f"\nas posted (early Mythos Preview at 2026-04-07, TH = 3.46 h * exp(0.148 * (AECI - 150))): t_c={ht['ts']:.2f} ({day(ht['ts']):%b %Y}), "
      f"exponent {ht['b'][1]:.2f}, r={np.corrcoef(-np.log2(ht['ts'] - tt), yt)[0, 1]:.4f}   [the tweet: August 2027, 5.6]")

# ---- variants
bare = lambda m: row(m['name'], m['t'], m['th'])                                  # a measured model without its score
compare('early Mythos Preview at its public release (the tweet\'s dating)', St, CAL)
compare('measured only, 2019 to early 2026', [m for m in S if m['th']], CAL)
compare("GPT-4 onward only", [m for m in S if m['t'] >= 2023.19], CAL)
# public Epoch ECI record holders after the last measurement instead of AECI, through Epoch's own map; public dates throughout
pub = [row(k, tt_, aeci=(e, lo, hi)) for tt_, e, k, lo, hi in dedupe(eci_frontier(2023.0)) if tt_ > 2026.27]
runs['public Epoch ECI after April 2026'] = compare('measured + public Epoch ECI record holders after April 2026', sorted([bare(m) for m in St if m['th']] + pub, key=lambda m: m['t']), epoch_pairs())
# AECI put back on Epoch's scale above 150, where it runs ahead
k1, k0 = aeci_on_eci(); resc = lambda a: None if a is None else (a - k0) / k1
runs["late AECI on Epoch's scale"] = compare(f"late AECI put back on Epoch's scale (AECI = {k1:.2f} * ECI {k0:+.1f} above 150)",
        [m if m['th'] else row(m['name'], m['t'], aeci=tuple(resc(a) for a in m['aeci'])) for m in S], CAL)
# a map that flattens at the top: 5.26 points per doubling past the last measured model, the slope of Epoch's map among
# models above ECI 140 (fit.py). The late points are then fixed values, so the interval carries no map uncertainty.
e_ = next(m for m in S if m['name'] == 'Mythos Preview (early)'); flat = lambda a: (e_['th'][0] + (a - e_['aeci'][0]) / 5.26, None, None)
runs['a flatter map past the last measured model'] = compare('5.26 points per doubling above the last measured model', [m if m['th'] else row(m['name'], m['t'], flat(m['aeci'][0])) for m in S], CAL)
# one dating rule: every model at its public release. Internal-only checkpoints have none and drop out. Public models
# on the AECI chart take Epoch's release date, Mythos Preview the date METR's horizon file gives its early checkpoint,
# and the record is taken over those.
A = {a[0]: a for a in AECI}; early = next(m for m in St if m['name'] == 'Mythos Preview (early)')
score = lambda k: (round(A[k][2], 2), *WHISKER.get(k, (None, None)))
rel = sorted([(early['t'], 'Mythos Preview'), *((ECI[e][0], k) for k, e in {**PUBLIC, **paired('supported')}.items() if ECI[e][0] > early['t'])])
best, late = early['aeci'][0], []
for tt_, k in rel:
    if A[k][2] > best: best = A[k][2]; late.append(row(k, tt_, aeci=score(k)))
print('\npublic release dates for the late models:', ', '.join(f"{m['name']} {day(m['t'])} ({(day(m['t']) - day(A[m['name']][1])).days} days after the chart's date)" for m in late))
runs['public release dates throughout'] = compare('public release dates throughout (internal-only checkpoints dropped)', [*[m for m in St if m['th']], *late], CAL)
compare('the same, without Model 3 as Fable 5.2', [*[m for m in St if m['th']], *late[:-1]], CAL)

# ---- backtest, rolling origin: fit the first k record holders, predict what came next
rolling("the figure's series", t, y, (('all origins', 0), ('origins from 2026', 2026.0)))
meas = np.array([bool(m['th']) for m in S]); rolling('measured only', t[meas], y[meas], (('all origins', 0),))

print('\n=== the fitted date by origin, with its 95% interval and how many later estimates that interval covers')
bt = []
for k in range(10, len(t) + 1):
    V = fit_horizons(S[:k], CAL, views=('hours',))['views']['hours']['hyp']; bt.append((float(t[k - 1]), V['ts'], V['low'], V['high'], k))
for i, (tk, ts_, lo, hi, k) in enumerate(bt):
    later = [b[1] for b in bt[i + 1:]]
    print(f"  k={k:2d}, to {day(tk)} ({names[k - 1]:28s}): t_c={ts_:.2f} [{lo:.2f}..{never(hi, tk)}]  lead {ts_ - tk:.2f} yr" + (f"   covers {sum(lo <= v <= hi for v in later)} of {len(later)}" if later else ''))
jk = sorted((fit_hyp(np.delete(t, i), np.delete(y, i))['ts'], names[i]) for i in range(len(t)))
print(f"jackknife: leaving one point out moves the date between {jk[0][0]:.2f} (without {jk[0][1]}) and {jk[-1][0]:.2f} (without {jk[-1][1]})")

# ---- simulation: same dates, same noise, record holders only. Two generators have no singularity; the third is the hyperbola itself
rng = np.random.default_rng(1); null = {}
print(f"\n=== simulated histories: how straight the tweet's line comes out, and how far past the last point the fitted singularity lands (observed r {obs_r:.4f}, lead {h['ts'] - t.max():.2f} yr)")
for gen_name in ('one slope change', 'double exponential', 'hyperbolic'):
    g = main['fits'][gen_name]; sd = np.sqrt(g['sse'] / (len(t) - g['p']))
    Y = np.maximum.accumulate(g['pred'](t) + rng.normal(0, sd, (1500, len(t))), axis=1)
    a_, al_, ts_, _ = hyp(t, Y); lead = ts_ - t.max()
    rr = np.array([np.corrcoef(-np.log2(c - t), yy)[0, 1] for c, yy in zip(ts_, Y)]); null[gen_name] = rr.tolist()
    print(f"  from '{gen_name}', noise sd {sd:.2f} doublings:")
    print(f"     r: median {np.median(rr):.4f}; share above 0.99: {np.mean(rr > 0.99):.3f}; share at least as straight as observed: {np.mean(rr >= obs_r):.3f}")
    print(f"     lead: median {np.median(lead):.2f} yr, 95% {np.quantile(lead, 0.025):.2f} to {np.quantile(lead, 0.975):.2f}; share within 2 yr {np.mean(lead < 2):.2f}")

# ---- does the date hold still? Under a hyperbola the fitted date stays put as data arrives; without a singularity it slides later
print('\n=== does the date hold still? tau: rank correlation of fitted date with origin, every origin since December 2024 (+1 is a date that always slides later).')
print('    move: the fit on everything minus the fit on data to December 2025, in years. In brackets: what histories from each curve give (median; share at or below the real value)')
for name, r in runs.items():
    (tau, move), o = drift(r['t'], r['y'])
    print(f'  {name}: tau {tau:+.2f}, move {move:+.2f}')
    for g, ((mt, pt), (mm, pm)) in o.items(): print(f'      {g:19s} tau [{mt:+.2f}; {pt:.3f}]   move [{mm:+.2f}; {pm:.3f}]')

# ---- what each fit says next: this is where the curves can be told apart
def at(V, name, d):
    """A curve and its 95% band at date d, in the view's units."""
    f = hyp_at(d, *[V['hyp'][k] for k in ('a', 'alpha', 'ts')]) if name == 'hyp' else dexp_at(d, *[V['dexp'][k] for k in ('d0', 'd1', 'c')])
    with np.errstate(invalid='ignore'): lo, hi = (np.interp(d, V['band']['t'], V['band'][name][:, j]) for j in (0, 1))
    return float(np.ravel(f)[0]), float(lo), float(hi if np.isfinite(hi) else np.inf)
pw_ = main['fits']['one slope change']
print('\n=== implied record 50% horizon, with 95% bands; 2,000 h = 1 work-year')
for d in (2027.0, 2027.25, 2027.5, 2028.0):
    for label, V, fmt in (('hours', VH, hours), ('AECI ', VA, lambda v: f'{v:.0f}')):
        cells = []
        for name, key in (('hyperbolic', 'hyp'), ('double exponential', 'dexp')):
            v, lo, hi = at(V, key, d)
            cells.append(f'{name}: past its singularity' if not np.isfinite(v) else f"{name}: {fmt(v)} ({fmt(lo)} to {fmt(hi) if np.isfinite(hi) else '∞'})")
        p = float(pw_['pred'](d)); cells.append(f"one slope change: {hours(p) if label == 'hours' else format(150 + (p - b0) / b1, '.0f')}")
        print(f'  {d:.2f} {label}: ' + ' | '.join(cells))
grid = np.linspace(t.max(), 2029, 6000)
for k in ('hyperbolic', 'double exponential', 'one slope change'):
    v = main['fits'][k]; g = grid[grid < v['ts'] - 1e-3] if k == 'hyperbolic' else grid
    p = v['pred'](g); i = int(np.argmax(p >= np.log2(2000))); print(f'  {k} reaches one work-year at {g[i]:.2f}')

clean = lambda o: {k: clean(v) for k, v in o.items()} if isinstance(o, dict) else o.tolist() if isinstance(o, np.ndarray) else o
json.dump(clean({'names': names, 't': t, 'views': F['views'], 'map': F['map'], 'pw': [*pw_['b'], pw_['c']], 'bt': bt, 'null': null, 'obs_r': obs_r}),
          open(os.path.join(HERE, 'result.json'), 'w'))
