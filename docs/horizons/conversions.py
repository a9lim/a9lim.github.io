"""ECI view of the three-scale fit under different AECI -> ECI conversions, for one pairing setting (argv as three_scales).

    python conversions.py --f52=model4 --m2=internal     # the dropped branch's pairings
    python conversions.py                                # no internal pairings; Fable 5.2 its own ECI-only point
    python conversions.py --nof52                        # no internal pairings, Fable 5.2 left out

Opus 5.5 (claude-opus-5-5), 2026-11-12.
"""
import sys, math
import numpy as np
import three_scales as T
from three_scales import A, ECI, day

NOF52 = '--nof52' in sys.argv
pairs = [(k, A[k][2], A[k][1], ECI[v][1]) for k, v in T.pubAE]   # name, AECI, chart date, ECI


class DesignMap:
    """ECI = features(AECI, date) @ b by least squares, with multivariate-t draws of b."""
    def __init__(self, feat, rows, label):
        self.feat, self.label = feat, label
        X = np.array([feat(a, t) for _, a, t, _ in rows]); y = np.array([e for *_, e in rows])
        self.b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ self.b
        self.n, p = X.shape; self.df = self.n - p; self.s = math.sqrt(r @ r / self.df)
        self.L = np.linalg.cholesky(self.s ** 2 * np.linalg.inv(X.T @ X)); self.p = p
        self.lo, self.hi = min(a for _, a, _, _ in rows), max(a for _, a, _, _ in rows)
        # leave-one-out error, overall and for the pairs above AECI 160
        e = []
        for i in range(self.n):
            m = np.arange(self.n) != i; bi, *_ = np.linalg.lstsq(X[m], y[m], rcond=None); e.append(y[i] - X[i] @ bi)
        e = np.array(e); top = np.array([a >= 160 for _, a, _, _ in rows])
        self.loo, self.loo_top = float(np.sqrt(np.mean(e ** 2))), float(np.sqrt(np.mean(e[top] ** 2)))
        self.aicc = self.n * math.log((r @ r) / self.n) + 2 * (p + 1) + 2 * (p + 1) * (p + 2) / (self.n - p - 2)
    def predict(self, a, t, b): return float(np.asarray(self.feat(a, t)) @ b)
    def draw(self, R): return self.b + self.L @ R.standard_normal(self.p) / math.sqrt(R.chisquare(self.df) / self.df)


def best_knot(make, grid, rows):
    return min(grid, key=lambda k: DesignMap(make(k), rows, '').s * math.sqrt(DesignMap(make(k), rows, '').df))

top = [r for r in pairs if r[1] >= 150]
kA = best_knot(lambda k: lambda a, t: [1, a - 150, max(0.0, a - k)], np.arange(140, 170.01, 0.5), pairs)
kT = best_knot(lambda k: lambda a, t: [1, a - 150, max(0.0, t - k)], np.arange(2025.3, 2026.6, 0.02), pairs)
FORMS = {
    'linear': DesignMap(lambda a, t: [1, a - 150], pairs, 'linear, all pairs'),
    'quadratic': DesignMap(lambda a, t: [1, a - 150, (a - 150) ** 2], pairs, 'quadratic'),
    'hinge': DesignMap(lambda a, t: [1, a - 150, max(0.0, a - kA)], pairs, f'two lines, joined at AECI {kA:.1f}'),
    'top': DesignMap(lambda a, t: [1, a - 150], top, 'linear, pairs above AECI 150'),
    'date': DesignMap(lambda a, t: [1, a - 150, max(0.0, t - kT)], pairs, f'linear + a gap opening from {day(kT)}'),
    'chain': None,
}

CAND = [c for c in T.CAND if not (NOF52 and c['name'] == 'Claude Fable 5.2')]
pool = [*T.S, *CAND]
INTERNAL = [m for m in T.S if m['aeci'] and not m['eci'] and not m['th']]

print(f"pairing: Fable 5.2 = {T.F52}{' (left out)' if NOF52 and T.F52 == 'none' else ''}, Model 2s: {T.M2}; {len(pairs)} AECI-ECI pairs")
print(f"{'conversion':42s} {'sd':>5s} {'LOO':>5s} {'LOO>160':>7s} {'AICc':>6s}   " + '  '.join(f"{m['name'][:13]:>13s}" for m in INTERNAL))
for name, M in FORMS.items():
    if M is None:
        proj = [T.inv(T.MAPS['HE'].b, T.fwd(T.MAPS['HA'].b, m['aeci'][0])) for m in INTERNAL]
        print(f"{'through horizon (no direct map)':42s} {'':>5s} {'':>5s} {'':>7s} {'':>6s}   " + '  '.join(f'{v:13.1f}' for v in proj)); continue
    proj = [M.predict(m['aeci'][0], m['t'], M.b) for m in INTERNAL]
    print(f"{M.label:42s} {M.s:5.2f} {M.loo:5.2f} {M.loo_top:7.2f} {M.aicc:6.1f}   " + '  '.join(f'{v:13.1f}' for v in proj))

print('\nECI view: singularity (95%), exponent, hyperbola AICc lead, drift tau [share of double-exponential | slope-change | hyperbolic histories drifting as little]')
base_val = T.val
for name, M in FORMS.items():
    def val(view, m, mp, M=M, name=name):
        if view == 'eci' and m['eci'] is None and m['aeci'] is not None:
            if name == 'chain': return T.inv(mp['HE'], T.fwd(mp['HA'], m['aeci'][0]))
            return M.predict(m['aeci'][0], m['t'], mp['AE'])
        return base_val(view, m, mp)
    T.val = val
    if M is not None: T.MAPS['AE'] = M
    T.central = {k: Mp.b for k, Mp in T.MAPS.items()}
    sr = T.record(pool, 'eci')
    r = T.run(sr, 'eci')
    T.show(name, r)
    ids = {id(m) for m in sr}
    late = [f"{m['name']}" for m in sr if m['t'] > 2026.1]
    print(f"      after Feb 2026: {', '.join(late)}")
