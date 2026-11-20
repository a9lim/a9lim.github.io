"""METR's capability update of 20 November 2026 against the figure's fit.

    python metr_q4.py      # about 40 s

METR measured public models up to Opus 5.5 and GPT-6 Astra on a new, harder suite (TH1.1 plus TH2) and put them on
an IRT index of its own tasks, MCI. The figure's late points are AECI scores carried into v1.1 hours by a map
calibrated only up to AECI 162. This checks that map against the new measurements, rebuilds the record series on
METR's new ruler, and refits.

Data: data/metr-2026-11-20/json/, the datasets behind the post's figures (each figure's "Data" link),
https://metr.org/blog/2026-11-20-q4-2026-capability-update/.

opus, 2026-11-20 (claude-opus-5-5)
"""
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from series import AECI, TH, WHISKER, REGISTRY, METR, V11 as V11KEY, CHART as CHARTCOL, names, models, row, yr, day
from fit import compare, drift, fit_horizons, FITS, aicc, r2, loo, t975, hyp_at, dexp_at

J = os.path.join(HERE, 'data', 'metr-2026-11-20', 'json')
def panels(key):
    """Each panel's tables, by name, from one of the post's datasets."""
    d = json.load(open(os.path.join(J, key + '.json')))
    out = []
    for p in d['panels']:
        tabs = {}
        for t in p['tables']: tabs.setdefault(t['name'], t['rows'])
        out.append((p.get('title'), tabs))
    return out
L2 = lambda minutes: float(np.log2(minutes / 60))
def horizons(rows, series=None):
    """METR's model rows -> {model: (decimal year, (log2 h, low, high))}."""
    return {r['model']: (yr(r['released']), (L2(r['horizon_minutes']), L2(r['horizon_minutes_low_95']), L2(r['horizon_minutes_high_95'])))
            for r in rows if series is None or r.get('series') == series}
hrs = lambda v: f'{2 ** v:,.0f} h' if 2 ** v >= 100 else f'{2 ** v:.3g} h'

COMB = horizons(panels('cad6b5d98261f80c')[0][1]['models'])                         # Figure 10: TH1.1 and TH2 pooled
SEP_ROWS = panels('8835b7b420aed38c')[0][1]['models']                               # Figure 11: the task sets apart
SEP = {s: horizons(SEP_ROWS, s) for s in ('TH1.1', 'TH2 (Verifiable)', 'MirrorCode')}
SCEN = {title: horizons(tabs['models']) for title, tabs in panels('d2d1f05c433c83d2')}   # Figure 25: longer time estimates
SCEN['Model-estimated task times'] = horizons(panels('85b25e40045da867')[1][1]['models'])  # Figure 23, right
MCI = {r['model']: (yr(r['released']), r['mci'], r['mci_low_95'], r['mci_high_95'])
       for r in panels('e401db69f8d499a7')[0][1]['models']}                         # Figure 12
MCI_TREND = panels('e401db69f8d499a7')[0][1]['frontier trends'][0]

CHART = names(METR, CHARTCOL)                                                       # METR's names -> the AECI chart's
V11 = names(METR, V11KEY)                                                           # METR's names -> the v1.1 file's keys
TH11 = {k: (t, (L2(v), L2(lo), L2(hi))) for t, v, k, s, lo, hi in TH}
A = {a[0]: a for a in AECI}                                                          # name, date, AECI, kind, record holder
AE = {n: a[2] for n, a in A.items()}                                                # AECI by chart label
score = lambda n: (round(A[n][2], 2), *WHISKER.get(n, (None, None)))

def line(x, y):
    """Least squares y = c0 + c1 x: (c0, c1, se of c1, residual sd)."""
    x, y = np.asarray(x, float), np.asarray(y, float); X = np.c_[np.ones_like(x), x]
    b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; df = len(x) - 2; s = float(np.sqrt(r @ r / df))
    return float(b[0]), float(b[1]), s / float(np.sqrt(((x - x.mean()) ** 2).sum())), s

# ======================================================================================================== 1. rulers
print('=== 1. Three rulers on the same models, log2 of the ratio (doublings). v1.1 is the file the figure measures with;')
print('    "TH1.1 now" is METR\'s rerun of the same tasks at xhigh effort; "pooled" adds TH2 (Figure 10).')
print(f"  {'model':26s} {'v1.1':>8s} {'TH1.1 now':>10s} {'pooled':>8s}   now-v1.1  pooled-v1.1")
for n, k in V11.items():
    now = SEP['TH1.1'].get(n); p = COMB.get(n)
    if k not in TH11 or not (now or p): continue
    v = TH11[k][1][0]
    print(f"  {n:26s} {hrs(v):>8s} {hrs(now[1][0]) if now else '':>10s} {hrs(p[1][0]) if p else '':>8s}   "
          f"{(now[1][0] - v if now else float('nan')):+8.2f}  {(p[1][0] - v if p else float('nan')):+8.2f}")
d = [COMB[n][1][0] - TH11[V11[n]][1][0] for n in ('GPT-4o', 'o1', 'GPT-5', 'Claude Opus 4.5')]
print(f"  pooled minus v1.1 below 5 h (GPT-4o, o1, GPT-5, Opus 4.5): mean {np.mean(d):+.2f} doublings; at Opus 4.6 (v1.1 12 h, saturating) "
      f"{COMB['Claude Opus 4.6'][1][0] - TH11['claude_opus_4_6_inspect'][1][0]:+.2f}")

# ======================================================================================================== 2. the map
S, CAL = models()
pairs = [m for m in [*S, *CAL] if m['th'] and m['aeci']]
b0, b1, b1se, bsd = line([m['aeci'][0] - 150 for m in pairs], [m['th'][0] for m in pairs])
print(f"\n=== 2. The figure's map (v1.1, {len(pairs)} Claude models to AECI {max(m['aeci'][0] for m in pairs):.1f}): "
      f"{1 / b1:.2f} points per doubling, {2 ** b0:.2f} h at 150, scatter {bsd:.2f} doublings")
print('    Against METR\'s new measurements of public Claude models. Residual = measured minus the map, in doublings.')
print(f"  {'model':18s} {'AECI':>6s} {'map (v1.1 h)':>12s} {'pooled':>8s} {'resid':>6s} {'TH2 verif.':>10s} {'MCI':>6s}")
claude = [n for n in COMB if n in CHART]
for n in claude:
    a = A[CHART[n]][2]; p = b0 + b1 * (a - 150); v = SEP['TH2 (Verifiable)'].get(n)
    print(f"  {n[7:]:18s} {a:6.1f} {hrs(p):>12s} {hrs(COMB[n][1][0]):>8s} {COMB[n][1][0] - p:+6.2f} {hrs(v[1][0]) if v else '':>10s} {MCI[n][1]:6.0f}")
x = [A[CHART[n]][2] - 150 for n in claude]; y = [COMB[n][1][0] for n in claude]
c0, c1, c1se, csd = line(x, y); q = t975(len(x) - 2) * c1se
print(f"  pooled hours on AECI, these {len(x)}: {1 / c1:.2f} points per doubling (95% {1 / (c1 + q):.2f} to {1 / (c1 - q):.2f}), "
      f"{2 ** c0:.2f} h at 150, scatter {csd:.2f}")
r0, r1, r1se, _ = line(x, [yy - (b0 + b1 * xx) for xx, yy in zip(x, y)])
print(f"  residual on AECI: {r1 * 10:+.2f} doublings per 10 points (se {r1se * 10:.2f}); the map overstates the pooled ruler by "
      f"{-(r0 + r1 * (AE['Mythos Preview Early'] - 150)):.2f} doublings at AECI {AE['Mythos Preview Early']:.1f} and "
      f"{-(r0 + r1 * (AE['Model 4'] - 150)):.2f} at {AE['Model 4']:.1f}")
V = SEP['TH2 (Verifiable)']; cv = [n for n in claude if n in V]
v0, v1, v1se, vsd = line([A[CHART[n]][2] - 150 for n in cv], [V[n][1][0] for n in cv]); q = t975(len(cv) - 2) * v1se
print(f"  TH2 verifiable on AECI ({len(cv)} models): {1 / v1:.2f} points per doubling (95% {1 / (v1 + q):.2f} to {1 / (v1 - q):.2f}), "
      f"scatter {vsd:.2f}; {V['Claude Opus 5.5'][1][0] - (b0 + b1 * (AE['Opus 5.5'] - 150)):+.2f} doublings against the map at Opus 5.5, "
      f"{V['Claude Opus 4.6'][1][0] - (b0 + b1 * (AE['Opus 4.6'] - 150)):+.2f} at Opus 4.6")
# was the v1.1 map steep at its top because v1.1 saturates there? Refit it without the two models above 10 h
low = [m for m in pairs if 2 ** m['th'][0] < 10]
s0, s1_, s1se, ssd = line([m['aeci'][0] - 150 for m in low], [m['th'][0] for m in low]); q = t975(len(low) - 2) * s1se
print(f"  the v1.1 map without Opus 4.6 and the early checkpoint ({len(low)} models to AECI {max(m['aeci'][0] for m in low):.1f}): "
      f"{1 / s1_:.2f} points per doubling (95% {1 / (s1_ + q):.2f} to {1 / (s1_ - q):.2f}); it puts Opus 5.5 at "
      f"{hrs(s0 + s1_ * (AE['Opus 5.5'] - 150))} and Model 4 at {hrs(s0 + s1_ * (AE['Model 4'] - 150))}")
x4, x3 = AE['Model 4'] - 150, AE['Model 3'] - 150
print(f"  the pooled map puts Model 4 at {hrs(c0 + c1 * x4)} and Model 3 at {hrs(c0 + c1 * x3)}; the v1.1 map {hrs(b0 + b1 * x4)} and {hrs(b0 + b1 * x3)}")

# MCI against AECI, Claude models: does AECI run ahead of METR's own index late on, as it runs ahead of ECI?
cm = [n for n in MCI if n in CHART]
xm, ya, tm = (np.array(v) for v in zip(*[(MCI[n][1], A[CHART[n]][2], MCI[n][0]) for n in cm]))
m0, m1, m1se, msd = line(xm, ya)
early = tm < 2025.75
e0, e1, e1se, _ = line(xm[early], ya[early])
print(f"\n  AECI on MCI, {len(cm)} Claude models: {m1 * 100:.2f} AECI points per 100 MCI (se {m1se * 100:.2f}), scatter {msd:.2f}")
print(f"  the same line fitted before October 2025 ({early.sum()} models, {e1 * 100:.2f} per 100 MCI) and carried forward: AECI above it by")
for n, xx, yy, tt in zip(cm, xm, ya, tm):
    if tt >= 2025.75: print(f"    {n[7:]:24s} MCI {xx:5.0f}  AECI {yy:6.1f}  {yy - (e0 + e1 * xx):+5.1f}")
late = ~early
l0, l1, l1se, _ = line(xm[late], ya[late])
print(f"  slope before October 2025 {e1 * 100:.2f} (se {e1se * 100:.2f}), after ({late.sum()} models) {l1 * 100:.2f} (se {l1se * 100:.2f}); "
      f"ratio {l1 / e1:.2f} (delta-method se {l1 / e1 * np.hypot(e1se / e1, l1se / l1):.2f})")
# MCI's early values have wide intervals (about ±100), which flatten the early slope of AECI on MCI. Regress the other way too.
f0, f1, f1se, _ = line(ya[early], xm[early]); g0, g1, g1se, _ = line(ya[late], xm[late])
print(f"  the other way, MCI per AECI point: {f1:.1f} (se {f1se:.1f}) before, {g1:.1f} (se {g1se:.1f}) after; ratio {f1 / g1:.2f}")
# one joined line with a change of slope at Opus 4.5's MCI, all 14 at once
kink = MCI['Claude Opus 4.5'][1]; Xk = np.c_[np.ones_like(xm), xm, np.maximum(xm - kink, 0)]
bk, *_ = np.linalg.lstsq(Xk, ya, rcond=None); rk = ya - Xk @ bk; sk = np.sqrt(rk @ rk / (len(ya) - 3))
cov = sk ** 2 * np.linalg.inv(Xk.T @ Xk)
print(f"  joined line, slope change at Opus 4.5: {bk[1] * 100:.2f} then {(bk[1] + bk[2]) * 100:.2f} per 100 MCI; the change "
      f"{bk[2] * 100:+.2f} (se {np.sqrt(cov[2, 2]) * 100:.2f}); scatter {sk:.2f} against {msd:.2f} for one line")

# MCI against the pooled horizon, across labs: METR's two summaries of the same runs
cx = [n for n in COMB if n in MCI]
k0, k1, k1se, ksd = line([MCI[n][1] for n in cx], [COMB[n][1][0] for n in cx])
xq = np.array([MCI[n][1] for n in cx]); yq = np.array([COMB[n][1][0] for n in cx]); Xq = np.c_[np.ones_like(xq), xq, (xq - xq.mean()) ** 2]
bq, *_ = np.linalg.lstsq(Xq, yq, rcond=None)
print(f"\n  pooled hours on MCI, {len(cx)} models of every lab: {k1 * 100:.3f} doublings per 100 MCI, scatter {ksd:.2f}; "
      f"curvature {bq[2] * 1e4:+.3f} doublings per 100² MCI")
print(f"  MCI's frontier line, {MCI_TREND['mci_points_per_month']:.1f} points a month, is {MCI_TREND['mci_points_per_month'] * k1:.3f} doublings a month: "
      f"a {1 / (MCI_TREND['mci_points_per_month'] * k1):.1f}-month doubling")

# ======================================================================================================== 3. the series on the new ruler
def record(rows, value):
    """The running record by date over rows, by value(row)."""
    out, best = [], -np.inf
    for m in sorted(rows, key=lambda m: m['t']):
        if value(m) > best: best = value(m); out.append(m)
    return out
early_v11 = [m for m in S if m['th'] and m['t'] < 2024.36]                         # GPT-2 to GPT-4 Turbo, v1.1
INTERNAL = [a[0] for a in AECI if a[3] == 'internal' and a[4]]                      # Mythos Preview Early to Model 4

def new_series(H, internal=True, splice=True):
    """The record series on a pooled ruler H: v1.1 before GPT-4o (spliced), H from GPT-4o on, then (internal=True) the
    internal checkpoints at the chart's dates through a map fitted on the public Claude models H measures."""
    pub = [row(n, t, th, score(CHART[n]) if n in CHART else None) for n, (t, th) in H.items()]
    conv = [row(n, yr(day(A[n][1])), aeci=score(n)) for n in INTERNAL] if internal else []
    if internal:
        p = [m for m in pub if m['aeci']]; g0, g1, *_ = line([m['aeci'][0] - 150 for m in p], [m['th'][0] for m in p])
        val = lambda m: m['th'][0] if m['th'] else g0 + g1 * (m['aeci'][0] - 150)
    else: val = lambda m: m['th'][0]
    rec = record([*pub, *conv], val)
    cal = [m for m in pub if m['aeci'] and m not in rec]
    return ([*early_v11, *rec] if splice else rec), cal

print('\n=== 3. The record series rebuilt on the pooled ruler')
runs = {}
s1, c1_ = new_series(COMB, internal=False, splice=False)
runs['pooled only'] = compare("METR's pooled records alone (GPT-4o to GPT-6 Astra)", s1, c1_)
s2, c2_ = new_series(COMB, internal=False)
runs['spliced, measured only'] = compare('v1.1 to GPT-4 Turbo, then the pooled records (measured only)', s2, c2_)
s3, c3_ = new_series(COMB)
print('  series with the checkpoints:', ', '.join(f"{m['name']} {day(m['t'])}" for m in s3 if m['t'] > 2026))
runs['spliced, with checkpoints'] = compare('the same, with the internal checkpoints through the pooled map', s3, c3_)
for title, H in SCEN.items():
    if title.startswith('Standard'): continue
    s, c = new_series(H); runs[title] = compare(f'with checkpoints, {title.lower()}', s, c)
runs["the figure's series"] = compare("The figure's series as it stands (v1.1 hours, AECI through the v1.1 map)", S, CAL)

print('\n=== does the date hold still? (fit.drift; tau +1 is a date that always slides later, move is since December 2025)')
for name, r in runs.items():
    k = min(10, int((r['t'] <= 2025.95).sum()))
    if len(r['t']) - k < 5: print(f'  {name}: too few origins'); continue
    (tau, move), o = drift(r['t'], r['y'], kmin=k)
    cells = '  '.join(f"{g.split()[0]} [{mt:+.2f}; {pt:.3f} | {mm:+.2f}; {pm:.3f}]" for g, ((mt, pt), (mm, pm)) in o.items())
    print(f'  {name}: tau {tau:+.2f}, move {move:+.2f}    {cells}')

# ======================================================================================================== 4. what each says next
print("\n=== 4. Implied record pooled horizon (95% band), and when each curve reaches 200 h, METR's longest threshold")
R3 = runs['spliced, with checkpoints']; Vh = R3['V']
def at(V, key, d):
    f = hyp_at(d, *[V['hyp'][k] for k in ('a', 'alpha', 'ts')]) if key == 'hyp' else dexp_at(d, *[V['dexp'][k] for k in ('d0', 'd1', 'c')])
    with np.errstate(invalid='ignore'): lo, hi = (np.interp(d, V['band']['t'], V['band'][key][:, j]) for j in (0, 1))
    return float(np.ravel(f)[0]), float(lo), float(hi)
for dd in (2027.0, 2027.25, 2027.5):
    cells = []
    for nm, key in (('hyperbola', 'hyp'), ('double exponential', 'dexp')):
        v, lo, hi = at(Vh, key, dd)
        cells.append(f"{nm} {hrs(v) if np.isfinite(v) else 'past it'} ({hrs(lo)} to {hrs(hi) if np.isfinite(hi) else '∞'})")
    print(f'  {dd:.2f}: ' + ' | '.join(cells))
grid = np.linspace(R3['t'].max(), 2030, 8000)
for k in ('exponential', 'hyperbolic', 'double exponential', 'one slope change'):
    f = R3['fits'][k]; g = grid[grid < f['ts'] - 1e-3] if k == 'hyperbolic' else grid
    i = int(np.argmax(f['pred'](g) >= np.log2(200))); print(f"  {k:19s} reaches 200 h at {g[i]:.2f}")
mt = COMB['GPT-6 Astra']; tr = panels('cad6b5d98261f80c')[0][1]['frontier trends'][0]
print(f"  METR's line ({tr['doubling_months']:.2f}-month doubling from {tr['horizon_minutes_to'] / 60:.1f} h on {tr['to']}) reaches 200 h at "
      f"{yr(tr['to']) + tr['doubling_months'] / 12 * np.log2(12000 / tr['horizon_minutes_to']):.2f}")

# ======================================================================================================== 5. MCI as a series
print('\n=== 5. MCI as the series. Its unit is a day of 2024-26 progress: GPT-4o is 0 and Opus 4.6, released 633 days later, is 633')
fr = record([dict(name=n, t=v[0], y=v[1]) for n, v in MCI.items() if v[0] >= 2024.3], lambda m: m['y'])
t5, y5 = np.array([m['t'] for m in fr]), np.array([m['y'] for m in fr])
print(f"  {len(fr)} records, {fr[0]['name']} to {fr[-1]['name']}")
best = {}
for fitter in FITS:
    f = fitter(t5, y5); f['aicc'] = aicc(len(t5), f['sse'], f['p']); best[f['name']] = f
    extra = f" t_c={f['ts']:.2f}" if f['name'] == 'hyperbolic' else ''
    print(f"  {f['name']:19s} AICc {f['aicc']:7.2f}  rmse {np.sqrt(f['sse'] / len(t5)):5.1f}  LOO {loo(t5, y5, fitter):5.1f}{extra}")

# the MCI view with the internal checkpoints: AECI carried onto MCI by the post-October-2025 Claude line
conv5 = [dict(name=n, t=yr(day(A[n][1])), y=(A[n][2] - l0) / l1) for n in INTERNAL]
fr5 = record([*[dict(name=n, t=v[0], y=v[1]) for n, v in MCI.items() if v[0] >= 2024.3 and n not in ('Claude Mythos Preview (early)',)], *conv5],
             lambda m: m['y'])
t6, y6 = np.array([m['t'] for m in fr5]), np.array([m['y'] for m in fr5])
print(f"\n  with the internal checkpoints ({', '.join(f'{m['name']} {m['y']:.0f}' for m in fr5 if m in conv5)}):")
for fitter in FITS:
    f = fitter(t6, y6); f['aicc'] = aicc(len(t6), f['sse'], f['p'])
    extra = f" t_c={f['ts']:.2f}" if f['name'] == 'hyperbolic' else f" break {f['c']:.2f}, {f['b'][1] / 12:.1f} -> {(f['b'][1] + f['b'][2]) / 12:.1f} MCI a month" if f['name'] == 'one slope change' else ''
    print(f"  {f['name']:19s} AICc {f['aicc']:7.2f}  rmse {np.sqrt(f['sse'] / len(t6)):5.1f}  LOO {loo(t6, y6, fitter):5.1f}{extra}")
