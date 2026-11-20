"""Smooth acceleration or regimes? The double exponential against an exponential whose doubling time drops twice.

    python regimes.py      # about two minutes

a9's question, 2026-11-20. Both curves accelerate. The double exponential's doubling time shrinks smoothly, by the same
factor every year; the two-break exponential holds a doubling time, drops to a shorter one, then drops again, and
from its last knot on it predicts no further acceleration. On each record series:

1. The five simple curves plus the two-break exponential: AICc, BIC, leave-one-out error (the knots refitted in every
   fold), and each acceleration model's doubling times.
2. Each against histories simulated from the other (same dates and noise, record holders only): how often the other
   model's history fits as unevenly as the real one, a test between non-nested models by simulation. Then whether a
   second drop is needed at all: one break against two, from one-break histories.
3. Forecasts from rolling origins: the next point and every point within half a year.
4. What each says next.

opus, 2026-11-20 (claude-opus-5-5)
"""
import contextlib, io, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import metr_q4 as Q, metr_rulers as RU
from series import day
from fit import fit_lin, fit_dexp, fit_hyp, fit_pw, fit_pw2, breaks, dexp, aicc, loo, rolling, PW2_GRID, T0

FITTERS = (fit_lin, fit_dexp, fit_hyp, fit_pw, fit_pw2)
S, CAL = Q.models()
meas = [m for m in S if m['th']]
SERIES = {
    "the figure's series (v1.1, then AECI through the v1.1 map)": (Q.runs["the figure's series"]['t'], Q.runs["the figure's series"]['y']),
    'v1.1 measured only, 2019 to Feb 2026': (np.array([m['t'] for m in meas]), np.array([m['th'][0] for m in meas])),
    "v1.1 to GPT-4 Turbo, then METR's pooled suite (measured only)": (Q.runs['spliced, measured only']['t'], Q.runs['spliced, measured only']['y']),
    'the same with the internal checkpoints through the pooled map': (Q.runs['spliced, with checkpoints']['t'], Q.runs['spliced, with checkpoints']['y']),
    'the same measured series, then public models through ECI': (RU.runs['ECI']['t'], RU.runs['ECI']['y']),
    "METR's pooled suite alone, 2024 to Sep 2026": (Q.runs['pooled only']['t'], Q.runs['pooled only']['y']),
}
bic = lambda n, sse, p: n * np.log(sse / n) + (p + 1) * np.log(n)
months = lambda dbl_per_yr: 12 / dbl_per_yr
def dexp_months(f, s):
    d0, d1 = f['b']; return months(d1 * f['c'] * np.exp(f['c'] * (np.asarray(s) - T0)))

def simulate(f, t, n_sims, rng):
    sd = np.sqrt(f['sse'] / (len(t) - f['p']))
    return np.maximum.accumulate(f['pred'](t) + rng.normal(0, sd, (n_sims, len(t))), axis=1)
def dexp_vs_pw2(t, Y):
    """AICc(double exponential) - AICc(two breaks) for each row: positive means the breaks fit better."""
    n = len(t); g = np.arange(t.min() + 0.25, t.max() - 0.15 + 1e-9, PW2_GRID['step'])
    s_d = dexp(t, Y)[3]; s_p = breaks(t, Y, 2, g, PW2_GRID['min_gap'], PW2_GRID['min_pts'])[0]
    return aicc(n, s_d, 3) - aicc(n, s_p, 6)

out = {}
for label, (t, y) in SERIES.items():
    t, y = np.asarray(t, float), np.asarray(y, float); n = len(t)
    print(f'\n=== {label}: n={n}, {day(t.min())} to {day(t.max())}')
    F = {}
    for fitter in FITTERS:
        f = fitter(t, y); F[f['name']] = f
        a, b_ = aicc(n, f['sse'], f['p']), bic(n, f['sse'], f['p'])
        print(f"  {f['name']:19s} p={f['p']}  rmse {np.sqrt(f['sse'] / n):.3f}  AICc {a:7.2f}  BIC {b_:7.2f}  LOO {loo(t, y, fitter):.3f}")
    d, p2 = F['double exponential'], F['two slope changes']
    c1, c2 = p2['c']; s1, s2, s3 = p2['b'][1], p2['b'][1] + p2['b'][2], p2['b'][1] + p2['b'][2] + p2['b'][3]
    print(f"  two breaks: doubling time {months(s1):.1f} months to {day(c1)}, {months(s2):.1f} to {day(c2)}, then {months(s3):.1f}")
    print(f"  double exponential: doubling time {dexp_months(d, 2020):.1f} months in 2020, {dexp_months(d, 2024):.1f} in 2024, "
          f"{dexp_months(d, t.max()):.1f} at the last point; it shrinks {100 * (1 - np.exp(-d['c'])):.0f}% a year")
    one = F['one slope change']; print(f"  one break: {months(one['b'][1]):.1f} months to {day(one['c'])}, then {months(one['b'][1] + one['b'][2]):.1f}")
    D = aicc(n, d['sse'], 3) - aicc(n, p2['sse'], 6)
    rng = np.random.default_rng(11)
    under_d = dexp_vs_pw2(t, simulate(d, t, 500, rng)); under_p = dexp_vs_pw2(t, simulate(p2, t, 500, rng))
    print(f"  AICc(double exponential) - AICc(two breaks) = {D:+.2f}; from double-exponential histories median {np.median(under_d):+.2f}, "
          f"{np.mean(under_d >= D):.0%} at least this; from two-break histories median {np.median(under_p):+.2f}, {np.mean(under_p <= D):.0%} at most this")
    # is there a second drop? one break against two, from histories with one break (nested, so a likelihood-ratio-like test)
    g = np.arange(t.min() + 0.25, t.max() - 0.15 + 1e-9, PW2_GRID['step'])
    def one_vs_two(Y):
        s1 = breaks(t, Y, 1, np.linspace(t.min() + 0.25, t.max() - 0.15, 400))[0]
        s2 = breaks(t, Y, 2, g, PW2_GRID['min_gap'], PW2_GRID['min_pts'])[0]
        return aicc(n, s1, 4) - aicc(n, s2, 6)
    D12 = aicc(n, one['sse'], 4) - aicc(n, p2['sse'], 6); under_1 = one_vs_two(simulate(one, t, 500, rng))
    print(f"  a second drop: AICc(one break) - AICc(two) = {D12:+.2f}; one-break histories reach that {np.mean(under_1 >= D12):.0%} of the time")
    # the second knot pushed back to where three dates follow it
    s3_, C3, B3 = breaks(t, y, 2, g, PW2_GRID['min_gap'], 3)
    if np.isfinite(s3_[0]):
        q = B3[0]; print(f"  with three dates after each knot: {months(q[1]):.1f} months to {day(C3[0, 0])}, {months(q[1] + q[2]):.1f} to {day(C3[0, 1])}, "
                         f"then {months(q[1] + q[2] + q[3]):.1f}; AICc {aicc(n, s3_[0], 6):.2f}")
    out[label] = dict(t=t, y=y, F=F, D=D, under_d=under_d, under_p=under_p, D12=D12, under_1=under_1)

print('\n=== forecasts from rolling origins (doublings; + means the curve ran low)')
for label in list(SERIES)[:5]:
    t, y = out[label]['t'], out[label]['y']; k0 = int(np.searchsorted(t, 2024.69)) + 1
    rolling(label, t, y, (('all origins', 0), ('origins from 2025.5', 2025.5)), kmin=k0, fitters=FITTERS)

print('\n=== what each says next: record horizon (hours), with its doubling time then')
for label in (list(SERIES)[0], list(SERIES)[3], list(SERIES)[4]):
    F = out[label]['F']; d, o, p2 = F['double exponential'], F['one slope change'], F['two slope changes']
    so, s3 = o['b'][1] + o['b'][2], p2['b'][1] + p2['b'][2] + p2['b'][3]
    print(f'  {label}:')
    for s in (2027.0, 2027.5, 2028.0):
        print(f"    {s:.1f}: double exponential {2 ** float(d['pred'](s)):,.0f} h ({dexp_months(d, s):.1f}-month doubling), "
              f"one break {2 ** float(o['pred'](s)):,.0f} h ({months(so):.1f}), two breaks {2 ** float(p2['pred'](s)):,.0f} h ({months(s3):.1f})")
