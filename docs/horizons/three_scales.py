"""The figure's fit with Epoch's ECI as a third scale beside horizon and AECI.

Three maps, each a line through the models scored on both of its scales:
  H-A  log2 hours on AECI   the 8 Claude models with a METR horizon and an AECI (the site's map)
  H-E  log2 hours on ECI    the 20 public models with a METR horizon and an Epoch ECI
  A-E  ECI on AECI          the Claude models on METR's AECI chart that Epoch also scores (conversions.py tries others)
Three views. In each, a model takes its own value on that scale where it has one, else converts:
  hours: horizon, else AECI (H-A), else ECI (H-E)
  aeci:  AECI, else horizon (H-A inverse), else ECI by way of horizon (--direct: A-E inverse)
  eci:   ECI, else AECI (A-E), else horizon (H-E inverse)
The pool is the figure's 25 models plus every ECI-only model since 2023 (scored by Epoch, not measured by METR,
not on the AECI chart). In each view the series is the running record of the pool on that view's scale; a model
released the same day as a better one is not a record. Bootstrap as the site: each replicate redraws all three
maps, moves converted points, resamples residuals, refits.

    python three_scales.py                              # no internal pairings; Fable 5.2 is its own ECI-only point
    python three_scales.py --f52=model3 --m2=internal   # Fable 5.2 = Model 3; Model 2 Early = Fable 5.1, Model 2 = Opus 5.5 (speculative)

Opus 5.5 (claude-opus-5-5), 2026-11-12, for a branch of a9l.im's figure that a9 dropped. See AGENTS.md.
"""
import sys, math
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from series import ECI, AECI, PAIR, PUBLIC, PAIRINGS, NAME, models, day, yr, eci_frontier
from fit import hyp, dexp, hyp_at, FITS, aicc, epoch_pairs, quantile, fit_dexp, fit_pw, fit_hyp

DIRECT = '--direct' in sys.argv           # AECI view: ECI-only models through the AECI-ECI map instead of through hours
CHAIN = '--chain' in sys.argv            # ECI view: AECI-only models go AECI -> hours -> ECI instead of through A-E

S, CAL = models()
A = {a[0]: a for a in AECI}
key = {v: k for k, v in NAME.items()}
ecirow = lambda e: (ECI[e][1], ECI[e][2], ECI[e][3])
# which internal checkpoint takes Fable 5.2's ECI: 'model3' or 'early' (both Fable 5.2 before release; series.PAIRINGS), or 'none'
# (Fable 5.2 its own public point). Model 4 was an option until Fable 5.2's system card showed it is another model.
F52 = next((a.split('=')[1] for a in sys.argv if a.startswith('--f52=')), 'none')
MODEL2 = '--model2' in sys.argv          # Model 2 takes Opus 5.5's ECI
# Model 2 ~ Opus 5.5 and Model 2 Early ~ Fable 5.1: 'internal' (the internal rows carry the ECI and calibrate the map
# in place of the public pairs) or 'public' (the internal rows carry it; the map keeps the public pairs)
M2 = next((a.split('=')[1] for a in sys.argv if a.startswith('--m2=')), 'none')
SAMEDAY = '--no-sameday' not in sys.argv   # a model dominated by a same-day release is not a record
M2PAIR = {k: PAIRINGS[k][0] for k in ('Model 2', 'Model 2 Early')}      # speculative (series.PAIRINGS)
PUB = dict(PUBLIC)
if F52 in ('model3', 'early'): k = {'model3': 'Model 3', 'early': 'Model 3 Early'}[F52]; PUB[k] = PAIRINGS[k][0]
elif F52 != 'none': raise SystemExit(f'--f52={F52}: model3, early or none')
for m in S:
    e = PAIR.get(key.get(m['name'])) or PUB.get(m['name'])
    if MODEL2 and m['name'] == 'Model 2': e = 'Claude Opus 5.5'
    if M2 != 'none' and m['name'] in M2PAIR: e = M2PAIR[m['name']]
    m['eci'] = ecirow(e) if e else None


class Map:
    """y = b0 + b1 * (x - 150) by least squares, with draws of (b0, b1) from their multivariate t."""
    def __init__(self, x, y, label):
        x = np.asarray(x, float) - 150; y = np.asarray(y, float); n = len(x); mx = x.mean(); sxx = ((x - mx) ** 2).sum()
        b1 = ((x - mx) * (y - y.mean())).sum() / sxx; b0 = y.mean() - b1 * mx
        self.df = n - 2; s2 = ((y - b0 - b1 * x) ** 2).sum() / self.df
        v11 = s2 / sxx; v01 = -mx * v11; v00 = s2 / n + mx * mx * v11
        self.L = np.linalg.cholesky([[v00, v01], [v01, v11]]); self.b = np.array([b0, b1]); self.s = math.sqrt(s2)
        self.n, self.lo, self.hi, self.label = n, x.min() + 150, x.max() + 150, label
    def draw(self, R):
        return self.b + self.L @ R.standard_normal(2) / math.sqrt(R.chisquare(self.df) / self.df)

pairsHA = [m for m in [*S, *CAL] if m['th'] and m['aeci']]
EP = epoch_pairs()
pubAE = list(PUB.items())
if M2 == 'internal': pubAE = [(k, v) for k, v in pubAE if k not in ('Opus 5.5', 'Mythos 5.1')] + list(M2PAIR.items())
MAPS = dict(HA=Map([m['aeci'][0] for m in pairsHA], [m['th'][0] for m in pairsHA], 'log2 h on AECI'),
            HE=Map([m['aeci'][0] for m in EP], [m['th'][0] for m in EP], 'log2 h on ECI'),
            AE=Map([A[k][2] for k, v in pubAE], [ECI[v][1] for k, v in pubAE], 'ECI on AECI'))
fwd = lambda b, x: b[0] + b[1] * (x - 150)
inv = lambda b, y: 150 + (y - b[0]) / b[1]

def val(view, m, mp):
    th, a, e = (m[k] and m[k][0] for k in ('th', 'aeci', 'eci'))
    if view == 'hours':
        return th if th is not None else fwd(mp['HA'], a) if a is not None else fwd(mp['HE'], e)
    if view == 'aeci':
        return a if a is not None else inv(mp['HA'], th) if th is not None else (inv(mp['AE'], e) if DIRECT else inv(mp['HA'], fwd(mp['HE'], e)))
    if CHAIN and e is None:                  # every conversion through hours: no direct AECI-ECI map
        return inv(mp['HE'], th if th is not None else fwd(mp['HA'], a))
    return e if e is not None else fwd(mp['AE'], a) if a is not None else inv(mp['HE'], th)
OWN = dict(hours='th', aeci='aeci', eci='eci')
central = {k: M.b for k, M in MAPS.items()}

# ECI-only candidates
taken = set(PAIR.values()) | set(PUB.values()) | ({"Claude Opus 5.5"} if M2 != "none" or F52 != "none" else set())
CAND = [dict(name=k, t=t, th=None, aeci=None, eci=(e, lo, hi)) for k, (t, e, lo, hi) in ECI.items() if t >= 2023.0 and k not in taken]


def record(pool, view):
    out, best = [], -np.inf
    P = sorted(pool, key=lambda m: m['t'])
    for i, m in enumerate(P):
        v = val(view, m, central)
        if SAMEDAY and any(q['t'] == m['t'] and val(view, q, central) > v for q in P): continue
        if v > best: best = v; out.append(m)
    return out


def drift(t, y, kmin=10, since=2025.95, n=1500):
    """replicate.py's test: Kendall's tau of fitted date against origin, and the share of simulated histories at or below it."""
    ks = np.arange(kmin, len(t) + 1); x = t[ks - 1]; i, j = np.triu_indices(len(ks), 1)
    def stat(Y):
        D = np.stack([hyp(t[:k], Y[:, :k])[2] for k in ks], 1)
        return np.sign((x[j] - x[i]) * (D[:, j] - D[:, i])).mean(1)
    obs = float(stat(y[None])[0]); rng = np.random.default_rng(4); out = {}
    for fitter in (fit_dexp, fit_pw, fit_hyp):
        g = fitter(t, y); sd = np.sqrt(g['sse'] / (len(t) - g['p']))
        sim = stat(np.maximum.accumulate(g['pred'](t) + rng.normal(0, sd, (n, len(t))), axis=1))
        out[g['name']] = float(np.mean(sim <= obs))
    return obs, out


def run(series, view, B=2000, seed=1):
    R = np.random.default_rng(seed)
    t = np.array([m['t'] for m in series]); n = len(t)
    y = np.array([val(view, m, central) for m in series]); conv = np.array([not m[OWN[view]] for m in series])
    H = hyp(t, y[None]); fh = hyp_at(t, *H[:3])[0]
    Y = np.empty((B, n))
    for b in range(B):
        mp = {k: M.draw(R) for k, M in MAPS.items()}
        shift = np.array([val(view, m, mp) - yi if c else 0.0 for m, yi, c in zip(series, y, conv)])
        Y[b] = fh + shift + (y - fh)[R.integers(0, n, n)]
    ts = np.sort(hyp(t, Y)[2])
    k = dict(hours=1, aeci=MAPS['HA'].b[1], eci=MAPS['HE'].b[1])[view]
    fits = {f['name']: f for f in (g(t, y) for g in FITS)}
    for f in fits.values(): f['aicc'] = aicc(n, f['sse'], f['p'])
    lead = min(f['aicc'] for nm, f in fits.items() if nm != 'hyperbolic') - fits['hyperbolic']['aicc']
    tau, share = drift(t, y)
    return dict(n=n, conv=int(conv.sum()), ts=H[2][0], lo=quantile(ts, 0.025), hi=quantile(ts, 0.975), exp=H[1][0] * k, lead=lead, tau=tau, share=share)


def show(label, r):
    s = r['share']
    print(f"  {label:34s} n={r['n']:2d} ({r['conv']:2d} conv)  {r['ts']:.2f} ({r['lo']:.2f}-{r['hi']:.2f})  exp {r['exp']:.2f}  "
          f"AICc {r['lead']:+5.1f}  tau {r['tau']:+.2f}  [dexp {s['double exponential']:.3f} | slope {s['one slope change']:.2f} | hyp {s['hyperbolic']:.2f}]")


if __name__ == '__main__':
    print(f'maps   Fable 5.2 = {F52}, Model 2s: {M2}, same-day rule: {SAMEDAY}')
    for k, M in MAPS.items():
        print(f"  {k} {M.label:15s} n={M.n:2d}  b0={M.b[0]:.3f} b1={M.b[1]:.4f}  resid sd {M.s:.2f}  x calibrated {M.lo:.1f}-{M.hi:.1f}")
    print(f"  H-A: {1 / MAPS['HA'].b[1]:.2f} AECI pts/doubling; H-E: {1 / MAPS['HE'].b[1]:.2f} ECI pts/doubling; A-E: {MAPS['AE'].b[1]:.3f} ECI per AECI point")

    print("\nthe figure's 25 models on the ECI scale (* converted):")
    for m in S:
        v = val('eci', m, central); src = 'own' if m['eci'] else 'from AECI' if m['aeci'] else 'from horizon'
        print(f"  {day(m['t'])} {m['name']:29s} {'*' if not m['eci'] else ' '} ECI {v:6.1f}  {src}")

    print('\nsingularity (95%), exponent in doublings per halving of the time left, hyperbola AICc lead, drift tau [share of histories drifting as little]')
    print("the figure's series, as is:")
    for view in ('hours', 'aeci', 'eci'): show(view, run(S, view))
    pool = [*S, *CAND]
    print('\nfigure + ECI-only models since 2023, running record of the pool in each view:')
    for view in ('hours', 'aeci', 'eci'):
        sr = record(pool, view); ids = {id(m) for m in sr}
        show(view, run(sr, view))
        added = [f"{m['name']} {day(m['t']):%Y-%m}" for m in sr if not any(m is s for s in S)]
        print(f"      in:  {', '.join(added)}")
        print(f"      out: {', '.join(m['name'] for m in S if id(m) not in ids) or '-'}")
