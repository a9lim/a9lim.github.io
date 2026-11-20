"""Curve fits for record time horizons, the score-to-horizon map, and the bootstrap around both.

fit_horizons is the fit behind the figure at a9l.im/#fits, ported from a9lim.github.io tools/horizon-fit.mjs
(Opus 5.5) with its seeded generator, so both places draw the same replicates. parity.py compares them.

Units: t is a decimal year; horizons are log2 hours; a score is AECI (or Epoch's ECI, where a caller says so).

fable, 2026-11-11 (claude-fable-5-2)
"""
import math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from series import ECI, AECI, TH, PAIR, PUBLIC, eci_frontier, row, day

T0 = 2019.0

# ---------- one-parameter profiles: a line in a transformed date, the transform's parameter found by search
def _line(X, Y):
    """Least squares of each row of Y on the matching row of X: intercept, slope, squared error."""
    mx, my = X.mean(-1, keepdims=True), Y.mean(-1, keepdims=True); dx, dy = X - mx, Y - my
    b1 = (dx * dy).sum(-1, keepdims=True) / (dx * dx).sum(-1, keepdims=True)
    r = dy - b1 * dx
    return (my - b1 * mx)[..., 0], b1[..., 0], (r * r).sum(-1)

def profile(design, Y, lo, hi, n):
    """For each row of Y, the p that minimises the squared error of a line in design(p):
    a log-spaced grid, then golden section between the grid neighbours of the best point."""
    B, f = len(Y), lambda p: _line(design(p[:, None]), Y)[2]
    g = lo * (hi / lo) ** (np.arange(n) / (n - 1))
    X = design(g[:, None]); dx = X - X.mean(1, keepdims=True); dy = Y - Y.mean(1, keepdims=True)
    bi = ((dy * dy).sum(1)[:, None] - (dy @ dx.T) ** 2 / (dx * dx).sum(1)).argmin(1)
    a, b = np.log(g[np.maximum(bi - 1, 0)]), np.log(g[np.minimum(bi + 1, n - 1)])
    r = (math.sqrt(5) - 1) / 2
    c, d = b - r * (b - a), a + r * (b - a); fc, fd = f(np.exp(c)), f(np.exp(d))
    for _ in range(40):
        left = fc < fd
        a, b = np.where(left, a, c), np.where(left, d, b)
        new = np.where(left, b - r * (b - a), a + r * (b - a)); fn = f(np.exp(new))
        c, d, fc, fd = np.where(left, new, d), np.where(left, c, new), np.where(left, fn, fd), np.where(left, fc, fn)
    x = np.exp((a + b) / 2)
    return np.where(f(x) <= f(g[bi]), x, g[bi])

def hyp(t, Y):
    """y = a - alpha * log2(ts - t), a singularity at ts. Rows of Y -> (a, alpha, ts, sse)."""
    design = lambda gap: -np.log2(t.max() + gap - t)
    gap = profile(design, Y, 0.003, 60, 160); a, alpha, sse = _line(design(gap[:, None]), Y)
    return a, alpha, t.max() + gap, sse
def dexp(t, Y):
    """y = d0 + d1 * exp(c * (t - 2019)), a double exponential in the horizon. Rows of Y -> (d0, d1, c, sse)."""
    design = lambda c: np.exp(c * (t - T0))
    c = profile(design, Y, 0.02, 2, 120); d0, d1, sse = _line(design(c[:, None]), Y)
    return d0, d1, c, sse
def hyp_at(s, a, alpha, ts):
    """The hyperbola at dates s (last axis); infinite from the singularity on."""
    a, alpha, ts = (np.asarray(v, float)[..., None] for v in (a, alpha, ts)); s = np.asarray(s, float)
    return np.where(s < ts, a - alpha * np.log2(np.where(s < ts, ts - s, 1.0)), np.inf)
def dexp_at(s, d0, d1, c):
    d0, d1, c = (np.asarray(v, float)[..., None] for v in (d0, d1, c))
    return d0 + d1 * np.exp(c * (np.asarray(s, float) - T0))

# ---------- the bootstrap
class Rng:
    """The site's generator: mulberry32, polar normals, chi-squared as a sum of squares."""
    def __init__(self, seed): self.s, self.spare = seed & 0xFFFFFFFF, None
    def u(self):
        s = self.s = (self.s + 0x6D2B79F5) & 0xFFFFFFFF
        r = ((s ^ (s >> 15)) * (1 | s)) & 0xFFFFFFFF
        r = ((r + (((r ^ (r >> 7)) * (61 | r)) & 0xFFFFFFFF)) & 0xFFFFFFFF) ^ r
        return (r ^ (r >> 14)) / 4294967296
    def normal(self):
        if self.spare is not None:
            v, self.spare = self.spare, None; return v
        while True:
            a, b = 2 * self.u() - 1, 2 * self.u() - 1; q = a * a + b * b
            if 0 < q < 1: break
        f = math.sqrt(-2 * math.log(q) / q); self.spare = b * f
        return a * f
    def chi2(self, df):
        x = 0.0
        for _ in range(df): z = self.normal(); x += z * z
        return x
    def int(self, n): return int(self.u() * n)

def quantile(S, q):
    """Linear-interpolated quantile down the first axis of a sorted array; infinite once it reaches an infinity."""
    i = (len(S) - 1) * q; lo, hi = math.floor(i), math.ceil(i)
    with np.errstate(invalid='ignore'):
        return np.where(np.isinf(S[hi]), np.inf, S[lo] + (S[hi] - S[lo]) * (i - lo))

def fit_horizons(series, calibration=(), B=2000, seed=20261111, views=('hours', 'aeci')):
    """The map, then in each view a hyperbola and a double exponential with 95% bootstrap bands.

    1. The score-horizon map: least squares of log2 horizon on score through every model with both,
       log2 h = b0 + b1 * (score - 150).
    2. Two views of the record series. 'hours' takes each model's measured horizon and converts score-only
       models through the map; 'aeci' takes each model's score and converts horizon-only models back.
    3. Each replicate draws the map's parameters from their sampling distribution (multivariate t), moves the
       converted points accordingly, resamples the fit's residuals, and refits. The points' own intervals are
       not resampled: METR's share one task suite (horizons) or one benchmark set (AECI) across models, so
       independent draws would overstate the noise.
    4. Point intervals: a model's own where it has them; for a converted point, Monte Carlo over the source
       interval, the map's parameters, and the map's residual scatter.
    """
    R, t, n = Rng(seed), np.array([m['t'] for m in series]), len(series)
    pairs = [m for m in [*series, *calibration] if m['th'] and m['aeci']]
    out = dict(map=None, views={})
    if len(pairs) > 2:
        x, y = np.array([m['aeci'][0] - 150 for m in pairs]), np.array([m['th'][0] for m in pairs])
        mx, sxx = x.mean(), ((x - x.mean()) ** 2).sum(); (b0,), (b1,), (sse,) = _line(x[None], y[None])
        df = len(pairs) - 2; s2 = sse / df
        v11 = s2 / sxx; c00 = math.sqrt(s2 / len(pairs) + mx * mx * v11); c10 = -mx * v11 / c00; c11 = math.sqrt(v11 - c10 * c10)
        out.update(map=(float(b0), float(b1)), map_sd=math.sqrt(s2), map_n=len(pairs), map_slope_sd=math.sqrt(v11))
        def draw():
            z0, z1 = R.normal(), R.normal(); k = math.sqrt(R.chi2(df) / df)
            return b0 + c00 * z0 / k, b1 + (c10 * z0 + c11 * z1) / k
    value = {'hours': lambda m, mp: m['th'][0] if m['th'] else mp[0] + mp[1] * (m['aeci'][0] - 150),
             'aeci': lambda m, mp: m['aeci'][0] if m['aeci'] else 150 + (m['th'][0] - mp[0]) / mp[1]}
    for view in views:
        own, src = ('th', 'aeci') if view == 'hours' else ('aeci', 'th')
        y = np.array([value[view](m, out['map']) for m in series]); conv = [not m[own] for m in series]

        points = []
        for m, yi in zip(series, y):
            if m[own]:
                points.append((*m[own], False)); continue
            v, lo, hi = m[src]; d = np.empty(4000)
            for k in range(4000):
                mp = draw(); e = math.sqrt(s2) * R.normal() / math.sqrt(R.chi2(df) / df)
                if lo is None: sv = v
                else: z = R.normal(); sv = v + z * ((v - lo) if z < 0 else (hi - v)) / 1.96      # a split normal
                d[k] = mp[0] + mp[1] * (sv - 150) + e if view == 'hours' else 150 + (sv - e - mp[0]) / mp[1]
            d.sort(); points.append((float(yi), float(quantile(d, 0.025)), float(quantile(d, 0.975)), True))

        H, D = hyp(t, y[None]), dexp(t, y[None])
        grid = np.sort(np.r_[T0 + 9 * np.arange(160) / 159, H[2] - 10 ** (1 - 1.61 * np.arange(160) / 159)])
        fitted = hyp_at(t, *H[:3])[0], dexp_at(t, *D[:3])[0]
        Y = np.empty((2, B, n))
        for b in range(B):
            shift = np.zeros(n)
            if out['map']:
                mp = draw(); shift = np.array([value[view](m, mp) - yi if c else 0.0 for m, yi, c in zip(series, y, conv)])
            for j in (0, 1):
                Y[j, b] = fitted[j] + shift + (y - fitted[j])[[R.int(n) for _ in range(n)]]
        Hb, Db = hyp(t, Y[0]), dexp(t, Y[1])
        ts = np.sort(Hb[2])
        band = {k: np.c_[quantile(S, 0.025), quantile(S, 0.975)] for k, S in
                (('hyp', np.sort(hyp_at(grid, *Hb[:3]), 0)), ('dexp', np.sort(dexp_at(grid, *Db[:3]), 0)))}
        a, alpha, t_s, sse = (float(v[0]) for v in H); d0, d1, c, dsse = (float(v[0]) for v in D)
        out['views'][view] = dict(
            y=y, points=points, band=dict(t=grid, **band),
            # exponent: doublings of horizon per halving of the time left
            hyp=dict(a=a, alpha=alpha, ts=t_s, low=float(quantile(ts, 0.025)), high=float(quantile(ts, 0.975)), sse=sse,
                     exponent=alpha if view == 'hours' else alpha * out['map'][1]),
            dexp=dict(d0=d0, d1=d1, c=c, sse=dsse))
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
    for nm, x in (('Mythos Preview Early (AECI 162.3; measured 1045 min)', 162.3), ('GPT-5 (150)', 150), ('Fable 5.2 (ECI 174.2)', 174.24), ('Model 4 (AECI 178.6)', 178.6)):
        print(f'  {nm}: {to_th(x):.0f} min = {to_th(x) / 60:.1f} h')
    A = {a[0]: a for a in AECI}
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
