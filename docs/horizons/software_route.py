"""Horizon and AECI against Epoch's software ECI (the 11 software and agentic-coding benchmarks of eci_gap.py), and the
horizons each route implies for recent models. Opus 5.5 (claude-opus-5-5), 2026-11-12; see AGENTS.md."""
import sys, os, runpy, io, contextlib, math
import numpy as np
RL = os.path.dirname(os.path.abspath(__file__)); sys.path[:0] = [RL]
with contextlib.redirect_stdout(io.StringIO()):
    g = runpy.run_path(f'{RL}/eci_gap.py', run_name='lib')
sc, C, DOM, PAIR, th, edi = g['sc'], g['C'], g['DOM'], g['PAIR'], g['th'], g['edi']
from series import AECI, PUBLIC, TH, NAME, day, yr
A = {a[0]: a for a in AECI}
SWE = DOM['SWE/agentic coding']
def swe(m):
    v = [(c, a) for b, (c, a) in C[m].items() if b in SWE]
    if len(v) < 2: return None
    w = np.array([a * a for _, a in v]); c = np.array([x for x, _ in v]); mu = float((w * c).sum() / w.sum())
    sd = math.sqrt(float((w * (c - mu) ** 2).sum() / w.sum())); neff = w.sum() ** 2 / (w * w).sum()
    return mu, sd / math.sqrt(max(neff - 1, 1)), len(v)
def line(x, y, label):
    x = np.asarray(x) - 150; y = np.asarray(y); n = len(x); X = np.c_[np.ones(n), x]
    b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; s = math.sqrt(r @ r / (n - 2)); Vi = np.linalg.inv(X.T @ X)
    loo = math.sqrt(np.mean([(y[i] - X[i] @ np.linalg.lstsq(X[np.arange(n) != i], y[np.arange(n) != i], rcond=None)[0]) ** 2 for i in range(n)]))
    return dict(b=b, s=s, n=n, Vi=Vi, df=n - 2, loo=loo, lo=x.min() + 150, hi=x.max() + 150, label=label)
# H-S: log2 horizon on software ECI, all labs
hs_rows = [(k, e, swe(e)) for k, e in PAIR.items() if e in sc and swe(e)]
HS = line([s[0] for _, _, s in hs_rows], [th[k] for k, _, _ in hs_rows], 'log2 h on SWE-ECI')
# A-S: software ECI on AECI, public Claude models
as_rows = [(k, e, swe(e)) for k, e in PUBLIC.items() if e in sc and swe(e)]
AS = line([A[k][2] for k, _, _ in as_rows], [s[0] for _, _, s in as_rows], 'SWE-ECI on AECI')
AS7 = line([A[k][2] for k, _, _ in as_rows if A[k][2] >= 157], [s[0] for k, _, s in as_rows if A[k][2] >= 157], 'SWE-ECI on AECI, from Opus 4.6')
HA = line([A[c][2] for c in ['3 Opus', '3.5 Sonnet', '3.5 Sonnet New', '3.7 Sonnet', 'Opus 4', 'Opus 4.5', 'Opus 4.6', 'Mythos Preview Early']],
          [th[k] for k in ['claude_3_opus_inspect', 'claude_3_5_sonnet_20240620_inspect', 'claude_3_5_sonnet_20241022_inspect', 'claude_3_7_sonnet_inspect', 'claude_4_opus_inspect', 'claude_opus_4_5_inspect', 'claude_opus_4_6_inspect', 'claude_mythos_preview_early_inspect']], 'log2 h on AECI')
for M in (HA, HS, AS, AS7):
    print(f"{M['label']:32s} n={M['n']:2d}  slope {M['b'][1]:.4f} ({1 / M['b'][1]:.2f} pts per unit)  at 150 {M['b'][0]:.2f}  scatter {M['s']:.2f}  LOO {M['loo']:.2f}  x {M['lo']:.1f}-{M['hi']:.1f}")
# lab offset on H-S for reference
print('\nAECI vs software ECI, public Claude models:')
for k, e, s in sorted(as_rows, key=lambda r: A[r[0]][2]):
    print(f"   {k:15s} AECI {A[k][2]:6.1f}  SWE {s[0]:6.1f} (±{s[1]:.1f}, {s[2]} benchmarks)  AECI-SWE {A[k][2] - s[0]:+5.1f}  resid {s[0] - (AS['b'][0] + AS['b'][1] * (A[k][2] - 150)):+5.1f}")
f = lambda M, x: M['b'][0] + M['b'][1] * (x - 150)
tq = {6: 2.447, 12: 2.179, 14: 2.145, 5: 2.571, 4: 2.776}
def pi(M, x):
    v = np.array([1, x - 150]); return tq.get(M['df'], 2.1) * M['s'] * math.sqrt(1 + v @ M['Vi'] @ v)
hrs = lambda l2: f"{2 ** l2:7.1f} h"
print('\nimplied 50% horizons: public frontier models METR has not measured (software ECI -> horizon)')
recent = sorted([m for m in sc if sc[m]['date'] >= '2026-02-01' and float(sc[m]['eci']) >= 158 and swe(m)], key=lambda m: sc[m]['date'])
for m in recent:
    s = swe(m)[0]; y = f(HS, s); p = pi(HS, s)
    aeci = next((A[k][2] for k, e in PUBLIC.items() if e == m), None)
    via_a = f"   via AECI {aeci:.1f} (H-A): {hrs(f(HA, aeci))}" if aeci else ''
    print(f"   {sc[m]['date']} {m:24s} SWE {s:6.1f}  -> {hrs(y)} (95% {2 ** (y - p):.0f}-{2 ** (y + p):.0f} h){via_a}")
print('\ninternal checkpoints: AECI -> software ECI -> horizon, against the hours view (AECI -> horizon)')
for k in ('Mythos Preview Early', 'Mythos Preview', 'Model 2 Early', 'Model 2', 'Model 3 Early', 'Model 3', 'Model 4'):
    a = A[k][2]; s = f(AS, a); s7 = f(AS7, a)
    print(f"   {k:20s} AECI {a:6.1f}  SWE {s:6.1f} (from-4.6 line {s7:6.1f})  -> {hrs(f(HS, s))}  [{hrs(f(HS, s7))}]   hours view {hrs(f(HA, a))}")
