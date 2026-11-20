"""Curve fits for record time horizons, the score-to-horizon map, and the bootstrap around both.

The figure's fit has one implementation, the site's tools/horizon-fit.mjs. fit_horizons, hyp and dexp call it through
bridge.mjs (one node process per Python session, JSON lines); the rest of this file is analysis built on them: the
other simple curves, AICc, leave-one-out, the drift test.

Units: t is a decimal year; horizons are log2 hours; a score is AECI (or Epoch's ECI, where a caller says so).

fable, 2026-11-11 (claude-fable-5-2); the bridge in place of the port, Opus 5.5 (claude-opus-5-5), 2026-11-20.
"""
import math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from series import ECI, AECI, TH, PAIR, PUBLIC, eci_frontier, row, day
from bridge import js

T0 = 2019.0

def hyp(t, Y, max_gap=60):
    """y = a - alpha * log2(ts - t), a singularity at ts, fitted to each row of Y -> (a, alpha, ts, sse)."""
    r = js('hyp', t=np.asarray(t, float), Y=np.atleast_2d(np.asarray(Y, float)), maxGap=max_gap)
    return tuple(np.array(r[k], float) for k in ('a', 'alpha', 'ts', 'sse'))
def dexp(t, Y):
    """y = d0 + d1 * exp(c * (t - 2019)), a double exponential in the horizon, fitted to each row of Y -> (d0, d1, c, sse)."""
    r = js('dexp', t=np.asarray(t, float), Y=np.atleast_2d(np.asarray(Y, float)))
    return tuple(np.array(r[k], float) for k in ('d0', 'd1', 'c', 'sse'))
def hyp_at(s, a, alpha, ts):
    """The hyperbola at dates s (last axis); infinite from the singularity on."""
    a, alpha, ts = (np.asarray(v, float)[..., None] for v in (a, alpha, ts)); s = np.asarray(s, float)
    return np.where(s < ts, a - alpha * np.log2(np.where(s < ts, ts - s, 1.0)), np.inf)
def dexp_at(s, d0, d1, c):
    d0, d1, c = (np.asarray(v, float)[..., None] for v in (d0, d1, c))
    return d0 + d1 * np.exp(c * (np.asarray(s, float) - T0))

def quantile(S, q):
    """Linear-interpolated quantile down the first axis of a sorted array; infinite once it reaches an infinity."""
    i = (len(S) - 1) * q; lo, hi = math.floor(i), math.ceil(i)
    with np.errstate(invalid='ignore'):
        return np.where(np.isinf(S[hi]), np.inf, S[lo] + (S[hi] - S[lo]) * (i - lo))

def fit_horizons(series, calibration=(), B=2000, seed=20261111, views=('hours', 'aeci')):
    """tools/horizon-fit.mjs fitRaw on these rows: the map, then in each view a hyperbola and a double exponential with
    95% bootstrap bands, point intervals for converted models, every number unrounded. (Its header describes the fit.)"""
    obj = lambda v: None if v is None else dict(v=float(v[0]), lo=None if v[1] is None else float(v[1]), hi=None if v[2] is None else float(v[2]))
    rows = lambda ms: [dict(name=m['name'], t=float(m['t']), th=obj(m['th']), aeci=obj(m['aeci'])) for m in ms]
    r = js('fit', series=rows(series), calibration=rows(calibration), B=B, seed=seed, views=list(views), asOf=False)
    m = r['map']
    out = dict(map=None if m is None else (m['b0'], m['b1']), views={})
    if m: out.update(map_sd=m['s'], map_n=m['n'], map_slope_sd=m['slopeSd'])
    for view, V in r['views'].items():
        h, d = V['hyperbolic'], V['doubleExponential']
        out['views'][view] = dict(
            y=np.array(V['y'], float), points=[(p[0], p[1], p[2], bool(p[3])) for p in V['points']],
            band=dict(t=np.array(V['band']['t'], float), hyp=np.array(V['band']['hyp'], float), dexp=np.array(V['band']['dexp'], float)),
            hyp=dict(a=h['a'], alpha=h['alpha'], ts=h['ts'], low=h['low'], high=h['high'], sse=h['sse'], exponent=h['exponent']),
            dexp=dict(d0=d['d0'], d1=d['d1'], c=d['c'], sse=d['sse']))
    return out

# ---------- the simple curves side by side
def ols(X, y):
    b, *_ = np.linalg.lstsq(X, y, rcond=None)
    r = y - X @ b
    return b, float(r @ r)
def r2(y, sse): return 1 - sse / float(((y - y.mean()) ** 2).sum())
def aicc(n, sse, p):          # p counts mean parameters; +1 for the variance
    k = p + 1
    return n * np.log(sse / n) + 2 * k + (2 * k * (k + 1) / (n - k - 1) if n - k - 1 > 0 else np.inf)

def fit_lin(t, y):
    b, sse = ols(np.c_[np.ones_like(t), t], y); return dict(name='exponential', p=2, sse=sse, pred=lambda s: b[0] + b[1] * s, b=b)
def fit_quad(t, y):
    t0 = t.mean(); b, sse = ols(np.c_[np.ones_like(t), t - t0, (t - t0) ** 2], y)
    return dict(name='quadratic', p=3, sse=sse, pred=lambda s: b[0] + b[1] * (s - t0) + b[2] * (s - t0) ** 2, b=b)
def fit_dexp(t, y):
    d0, d1, c, sse = (float(v[0]) for v in dexp(t, y[None]))
    return dict(name='double exponential', p=3, sse=sse, c=c, b=(d0, d1), pred=lambda s: d0 + d1 * np.exp(c * (s - T0)))
def fit_hyp(t, y):
    a, alpha, ts, sse = (float(v[0]) for v in hyp(t, y[None]))      # pred stays finite past ts, so errors there are large, not infinite
    return dict(name='hyperbolic', p=3, sse=sse, ts=ts, b=(a, alpha), pred=lambda s: a - alpha * np.log2(np.maximum(ts - s, 1e-9)))
def fit_pw(t, y):
    best = None
    for c in np.linspace(t.min() + 0.25, t.max() - 0.15, 400):
        b, sse = ols(np.c_[np.ones_like(t), t, np.maximum(t - c, 0)], y)
        if best is None or sse < best[0]: best = (sse, c, b)
    sse, c, b = best
    return dict(name='one slope change', p=4, sse=sse, c=c, b=b, pred=lambda s: b[0] + b[1] * s + b[2] * np.maximum(s - c, 0))
FITS = (fit_lin, fit_dexp, fit_quad, fit_hyp, fit_pw)

def loo(t, y, fitter):
    e = []
    for i in range(len(t)):
        m = np.ones(len(t), bool); m[i] = False
        f = fitter(t[m], y[m]); e.append(y[i] - f['pred'](t[i]))
    return float(np.sqrt(np.mean(np.square(e))))

def compare(label, series, calibration=(), **kw):
    """Print the five curves on a series' horizons, the hyperbola's bootstrap interval, and its AICc lead."""
    F = fit_horizons(series, calibration, views=('hours',), **kw); V = F['views']['hours']
    t, y, n = np.array([m['t'] for m in series]), V['y'], len(series)
    print(f'\n=== {label}: n={n}, {t.min():.2f} to {t.max():.2f}')
    if any(p[3] for p in V['points']): print(f"  map: {1 / F['map'][1]:.2f} points per doubling, {2 ** F['map'][0]:.2f} h at 150 (n={F['map_n']}); {sum(p[3] for p in V['points'])} points converted")
    fits = {}
    for fitter in FITS:
        f = fitter(t, y); fits[f['name']] = f; f['aicc'] = aicc(n, f['sse'], f['p'])
        ex = {'exponential': lambda: f"doubling time {12 / f['b'][1]:.1f} months",
              'double exponential': lambda: f"c={f['c']:.2f}/yr", 'quadratic': lambda: '',
              'hyperbolic': lambda: f"t_c={f['ts']:.2f} [95% {V['hyp']['low']:.2f}..{'never' if V['hyp']['high'] > t.max() + 55 else format(V['hyp']['high'], '.2f')}] alpha={f['b'][1]:.2f}",
              'one slope change': lambda: f"break {f['c']:.2f}; doubling time {12 / f['b'][1]:.1f} -> {12 / (f['b'][1] + f['b'][2]):.1f} months"}[f['name']]()
        print(f"  {f['name']:19s} p={f['p']} R2={r2(y, f['sse']):.4f} rmse={np.sqrt(f['sse'] / n):.3f} AICc={f['aicc']:7.2f} LOO={loo(t, y, fitter):.3f}  {ex}")
    lead = min(f['aicc'] for k, f in fits.items() if k != 'hyperbolic') - fits['hyperbolic']['aicc']
    print(f"  hyperbola against the best of the rest: AICc {lead:+.1f}")
    return dict(F=F, V=V, t=t, y=y, fits=fits, lead=lead)

def dedupe(rows):
    """One point per date: keep the best model released that day."""
    d = {}
    for t, v, *rest in rows:
        if t not in d or v > d[t][1]: d[t] = (t, v, *rest)
    return [d[k] for k in sorted(d)]

def epoch_pairs():
    """The 20 public models with both a measured horizon and an Epoch ECI: the calibration for Epoch's scale."""
    th = {k: (v, lo, hi) for _, v, k, _, lo, hi in TH}
    return [row(k, ECI[e][0], tuple(float(np.log2(x / 60)) for x in th[k]), ECI[e][1:]) for k, e in PAIR.items()]

def aeci_on_eci():
    """AECI as a line in Epoch's ECI above ECI 150, over the models scored on both: (slope, intercept)."""
    A = {a[0]: a[2] for a in AECI}
    x, y = np.array([[ECI[v][1], A[k]] for k, v in PUBLIC.items() if ECI[v][1] >= 150]).T
    return np.polyfit(x, y, 1)

def t975(df):
    """The two-sided 95% point of Student's t, by quadrature."""
    x = np.linspace(0, 80, 800001); c = np.cumsum((1 + x * x / df) ** (-(df + 1) / 2))
    return float(x[np.searchsorted(c / c[-1], 0.95)])

def eci_map(verbose=False):
    """log2(TH in minutes) = b0 + b1 * ECI, fitted on the 20 public models that have both."""
    th = {k: v for _, v, k, *_ in TH}
    e = np.array([ECI[PAIR[k]][1] for k in PAIR]); l2 = np.log2([th[k] for k in PAIR])
    b, sse = ols(np.c_[np.ones_like(e), e], l2)
    if verbose:
        print(f'log2(TH minutes) = {b[0]:.2f} + {b[1]:.4f} * ECI   n={len(e)}  R2={r2(l2, sse):.3f}  resid sd={np.sqrt(sse / (len(e) - 2)):.2f} doublings  -> {1 / b[1]:.2f} ECI points per doubling')
        bq, sseq = ols(np.c_[np.ones_like(e), e - 140, (e - 140) ** 2], l2)
        print(f'  quadratic term {bq[2]:+.5f} (R2 {r2(l2, sseq):.3f}); AICc lin {aicc(len(e), sse, 2):.1f} quad {aicc(len(e), sseq, 3):.1f}')
        hi = e >= 140
        bh, _ = ols(np.c_[np.ones(hi.sum()), e[hi]], l2[hi]); print(f'  ECI>=140 only: {1 / bh[1]:.2f} points per doubling (n={hi.sum()})')
    return b

# ---------- does the date hold still? Under a hyperbola the fitted date stays put as data arrives; without a singularity it slides later
def drift(t, y, kmin=10, since=2025.95, n=1500):
    """Kendall's tau between origin and fitted date over every origin from kmin, and how far the date moved from the
    fit on data to `since` to the fit on everything; each with the share of simulated histories at or below it."""
    ks = np.arange(kmin, len(t) + 1); x = t[ks - 1]; i, j = np.triu_indices(len(ks), 1); k0 = list(ks).index(int((t <= since).sum()))
    def stat(Y):
        D = np.stack([hyp(t[:k], Y[:, :k])[2] for k in ks], 1)
        return np.sign((x[j] - x[i]) * (D[:, j] - D[:, i])).mean(1), D[:, -1] - D[:, k0]
    obs = [float(v[0]) for v in stat(y[None])]; rng = np.random.default_rng(4); out = {}
    for fitter in (fit_dexp, fit_pw, fit_hyp):
        g = fitter(t, y); sd = np.sqrt(g['sse'] / (len(t) - g['p']))
        sim = stat(np.maximum.accumulate(g['pred'](t) + rng.normal(0, sd, (n, len(t))), axis=1))
        out[g['name']] = [(float(np.median(v)), float(np.mean(v <= o))) for v, o in zip(sim, obs)]
    return obs, out


if __name__ == '__main__':
    b = eci_map(verbose=True)
    to_th = lambda x: 2 ** (b[0] + b[1] * np.asarray(x, float))          # minutes
    A = {a[0]: a for a in AECI}; mp = A['Mythos Preview Early'][2]; f52 = ECI['Claude Fable 5.2'][1]; m4 = A['Model 4'][2]
    for nm, x in ((f'Mythos Preview Early at its AECI, {mp:.1f}', mp), ('GPT-5 (ECI 150)', 150), (f'Fable 5.2 (ECI {f52:.1f})', f52), (f'Model 4 at its AECI, {m4:.1f}', m4)):
        print(f'  {nm}: {to_th(x):.0f} min = {to_th(x) / 60:.1f} h')
    print('AECI vs Epoch ECI, same or sibling model, and how far the AECI chart dates it ahead of the public release:')
    for k, v in PUBLIC.items():
        print(f'   {k:15s} AECI {A[k][2]:6.1f}  ECI {ECI[v][1]:6.1f}  diff {A[k][2] - ECI[v][1]:+.1f}   {(day(ECI[v][0]) - day(A[k][1])).days:3d} days')
    s = aeci_on_eci(); print(f'   above ECI 150: AECI = {s[0]:.2f} * ECI {s[1]:+.1f}')

    # ---------- the series, each on its own: scores go through Epoch's map
    cal = epoch_pairs(); h = lambda v, lo, hi: tuple(float(np.log2(x / 60)) for x in (v, lo, hi))
    compare('Epoch ECI record holders -> horizon', [row(k, t, aeci=(e, lo, hi)) for t, e, k, lo, hi in dedupe(eci_frontier(2023.19))], cal)
    compare('AECI record holders (Anthropic, incl. internal) -> horizon', [row(a[0], a[1], aeci=(a[2], None, None)) for a in AECI if a[4]], cal)
    sota = dedupe([(t, v, k, lo, hi) for t, v, k, s_, lo, hi in TH if s_])
    compare("METR measured horizon, record holders 2023+, METR's dates", [row(k, t, h(v, lo, hi)) for t, v, k, lo, hi in sota if t >= 2023])
    compare("METR measured horizon, record holders 2019+, METR's dates", [row(k, t, h(v, lo, hi)) for t, v, k, lo, hi in sota])
