"""METR's 20 November measurements beside the public rulers: Epoch's ECI, its software and agentic subsets, OpenAI's OECI.

    python metr_rulers.py      # about a minute

metr_q4.py found that AECI stretches against METR's index (MCI) and runs ahead of METR's pooled horizons. This asks the
same of the public rulers, and then uses them to carry the public models METR hasn't measured (Fable 5.2, GPT-6.2 Astra,
Gemini 4 Carbon, ...) onto METR's pooled ruler.

1. Each ruler against MCI: points per 100 MCI before and after October 2025, and where each lab sits after.
2. Each ruler against METR's pooled horizons: points per doubling and a Claude offset (the v1.1-era maps beside them).
3. The 2026 frontier pace on each ruler, in pooled-hour doublings a year, by lab; METR's own pace beside it.
4. The public models METR hasn't measured, carried onto pooled hours by each ruler.
5. The record series on the pooled ruler extended by them, refitted.

Software and agentic ability are maximum-likelihood abilities on Epoch's software benchmarks, and on those plus the
other agentic ones, under Epoch's 12 November difficulties and slopes with saturated scores kept (aeci_subset.py), and
the 19 November model pages for GPT-6 Astra, GPT-6.2 Astra and Fable 5.2.

opus, 2026-11-20 (claude-opus-5-5)
"""
import contextlib, io, json, math, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import metr_q4 as Q, oeci as O, aeci_subset as S, aeci_imitation as I
from series import yr, row, day, TH, PAIR
from fit import compare, drift

# ---------------------------------------------------------------------------------------------------- names and values
EP = {'Claude 3.5 Sonnet (New)': 'Claude 3.5 Sonnet (October 2024)', 'Claude 3.5 Sonnet (Old)': 'Claude 3.5 Sonnet',
      'GPT-4 0314': 'GPT-4 (Mar 2023)', 'GPT-4 1106': 'GPT-4 Turbo (Nov 2023)', 'GPT-4 Turbo': 'GPT-4 Turbo (Apr 2024)',
      'GPT-4o': 'GPT-4o (May 2024)'}
ep = lambda m: EP.get(m, m)
MCI = dict(Q.MCI)                                                   # Figure 12, plus the two only Figure 39 scores
for r in Q.panels('1c31ba739b02e62d')[0][1]['models']:
    MCI.setdefault(r['model'], (yr(r['released']), r['mci'], r['mci_low_95'], r['mci_high_95']))
sc = O.sc
ECI = {m: float(sc[m]['eci']) for m in sc}
ECI.update({m: v[0] for m, v in S.R.P['eci'].items()})            # 19 November pages
DATE = {m: d['t'] for m, d in O.OECI.items()}
DATE.update({m: yr(sc[m]['date']) for m in sc})                   # Epoch's date where it has one, as everywhere here
MODELS = sorted(set(sc) | set(O.OECI) | set(S.R.P['eci']))
P = np.array([S.vec(m) for m in MODELS])
def mle(idx, nmin):
    th, n = S.theta(P, idx)
    return {m: float(t) for m, t, k in zip(MODELS, th, n) if k >= nmin}
RULERS = {'ECI': ECI, 'software': mle(I.SW, 3), 'agentic': mle(I.AG, 4), 'OECI': {m: d['v'] for m, d in O.OECI.items()},
          'AECI': {m: Q.A[c][2] for m, c in Q.CHART.items()}}
LAB = lambda m: 'Anthropic' if m.startswith('Claude') else O.lab(m)
def val(R, m):
    """A ruler's value for a METR-named or Epoch-named model."""
    return RULERS[R].get(m, RULERS[R].get(ep(m)))
def line(x, y):
    x, y = np.asarray(x, float), np.asarray(y, float); X = np.c_[np.ones_like(x), x]
    b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; df = len(x) - 2; s = float(np.sqrt(r @ r / df))
    return float(b[0]), float(b[1]), s / float(np.sqrt(((x - x.mean()) ** 2).sum())), s
OCT = 2025.75

# ---------------------------------------------------------------------------------------------------- 1. against MCI
print('=== 1. Each ruler against MCI (METR\'s index of its own tasks; 0.94 pooled doublings per 100 MCI).')
print('    Slopes in ruler points per 100 MCI. Residual: where each lab\'s post-October-2025 models sit against the line')
print('    fitted to every lab before October 2025, in ruler points. Split by date, the subsets have only 6 early models;')
print('    the joined line below, split at Opus 4.5\'s MCI, is the test to read.')
STRETCH = {}
for R in RULERS:
    ms = [m for m in MCI if val(R, m) is not None]
    x = np.array([MCI[m][1] for m in ms]); y = np.array([val(R, m) for m in ms]); t = np.array([MCI[m][0] for m in ms])
    e, l = t < OCT, t >= OCT
    out = f"  {R:9s} n={len(ms):2d}"
    if e.sum() >= 4:
        e0, e1, e1se, _ = line(x[e], y[e]); l0, l1, l1se, _ = line(x[l], y[l])
        STRETCH[R] = l1 / e1
        res = {g: [yy - (e0 + e1 * xx) for m, xx, yy, tt in zip(ms, x, y, t) if tt >= OCT and LAB(m) == g] for g in ('Anthropic', 'OpenAI')}
        cells = '  '.join(f"{g} {np.mean(v):+5.1f} (n={len(v)})" for g, v in res.items() if v)
        out += f"  before {e1 * 100:5.2f} (se {e1se * 100:.2f}, n={e.sum()})  after {l1 * 100:5.2f} (se {l1se * 100:.2f}, n={l.sum()})  ratio {l1 / e1:.2f}   {cells}"
    else:
        l0, l1, l1se, _ = line(x[l], y[l]); out += f"  after October 2025 only: {l1 * 100:5.2f} per 100 MCI (se {l1se * 100:.2f}, n={l.sum()})"
    print(out)
# one joined line per ruler, its slope changing at Opus 4.5's MCI: steadier than fitting the few early models apart
KINK = MCI['Claude Opus 4.5'][1]
print(f"  joined line, slope change at MCI {KINK:.0f} (Opus 4.5), every lab and Claude alone: points per 100 MCI before -> after (ratio, se)")
for R in RULERS:
    for who in ('every lab', 'Claude'):
        ms = [m for m in MCI if val(R, m) is not None and (who == 'every lab' or LAB(m) == 'Anthropic')]
        x = np.array([MCI[m][1] for m in ms]); y = np.array([val(R, m) for m in ms])
        if (x < KINK).sum() < 4 or (x > KINK).sum() < 4: continue
        X = np.c_[np.ones_like(x), x, np.maximum(x - KINK, 0)]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b
        cov = (r @ r / (len(y) - 3)) * np.linalg.inv(X.T @ X); g = np.array([0, -b[2] / b[1] ** 2, 1 / b[1]])
        print(f"    {R:9s} {who:9s} n={len(ms):2d}  {b[1] * 100:5.2f} -> {(b[1] + b[2]) * 100:5.2f}  "
              f"(x{(b[1] + b[2]) / b[1]:.2f}, se {math.sqrt(g @ cov @ g):.2f}; change {b[2] / math.sqrt(cov[2, 2]):+.1f} se)")
# the late slopes on one shared set of models, so model choice can't differ between rulers
shared = [m for m in MCI if MCI[m][0] >= OCT and all(val(R, m) is not None for R in ('ECI', 'software', 'agentic', 'OECI'))]
print(f"  on the {len(shared)} post-October models every public ruler scores ({', '.join(m.replace('Claude ', '') for m in shared)}):")
for R in ('ECI', 'software', 'agentic', 'OECI'):
    _, b1, b1se, s = line([MCI[m][1] for m in shared], [val(R, m) for m in shared])
    print(f"    {R:9s} {b1 * 100:5.2f} per 100 MCI (se {b1se * 100:.2f}), scatter {s:.2f}")
for g in ('Anthropic', 'OpenAI'):
    sub = [m for m in shared if LAB(m) == g]
    print(f"    {g} only ({len(sub)}): " + '  '.join(f"{R} {line([MCI[m][1] for m in sub], [val(R, m) for m in sub])[1] * 100:.2f}" for R in ('ECI', 'software', 'agentic', 'OECI')))

# ---------------------------------------------------------------------------------------------------- 2. against pooled hours
print("\n=== 2. Each ruler against METR's pooled horizons: log2 h = c + (R - 150) / ppd + offset x Claude")
print('    The same regression on the v1.1 file\'s horizons (to GPT-5.4 and the early Mythos Preview checkpoint) beside it.')
COMB = Q.COMB
V11H = {PAIR[k]: (t, (math.log2(v / 60),)) for t, v, k, *_ in TH if k in PAIR}
V11H.update({Q.ON_CHART_M[k]: (t, (math.log2(v / 60),)) for t, v, k, *_ in TH if k in Q.ON_CHART_M})
def fitmap(R, H):
    ms = [m for m in H if val(R, m) is not None]
    x = np.array([val(R, m) - 150 for m in ms]); y = np.array([H[m][1][0] for m in ms]); c = np.array([LAB(m) == 'Anthropic' for m in ms], float)
    if c.sum() in (0, len(c)) or len(ms) < 7:
        b0, b1, b1se, s = line(x, y); return len(ms), b0, b1, b1se, 0.0, float('nan'), s
    X = np.c_[np.ones_like(x), x, c]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; s = float(np.sqrt(r @ r / (len(y) - 3)))
    cov = s * s * np.linalg.inv(X.T @ X); b0, b1, off = (float(v) for v in b)
    return len(ms), b0, b1, float(np.sqrt(cov[1, 1])), off, float(np.sqrt(cov[2, 2])), s
MAP = {}
print(f"  {'':9s} {'pooled (20 Nov)':>58s}   {'v1.1':>40s}   ratio")
for R in RULERS:
    n, b0, b1, b1se, off, offse, s = fitmap(R, COMB); MAP[R] = (b0, b1, off); q = 1.96 * b1se
    n_, a0, a1, a1se, aoff, aoffse, as_ = fitmap(R, V11H)
    old = (f"n={n_:2d} {1 / a1:5.2f} ppd Claude {aoff:+.2f} ({aoffse:.2f}) scatter {as_:.2f}   {a1 / b1:.2f}" if n_ >= 7 or R == 'AECI'
           else f"n={n_:2d}: too few")
    print(f"  {R:9s} n={n:2d} {1 / b1:5.2f} ppd ({1 / (b1 + q):.2f}–{1 / (b1 - q):.2f}) Claude {off:+.2f} ({offse:.2f}) scatter {s:.2f}   {old}")
print("  MCI       n=15 106.5 MCI per doubling, scatter 0.21, one line for every lab (metr_q4.py)")
print("  How far each ruler's v1.1-era map overshoots METR's pooled measurement (doublings, measured minus map):")
for R in RULERS:
    n_, a0, a1, _, aoff, _, _ = fitmap(R, V11H)
    if n_ < 7 and R != 'AECI': continue
    ms = [m for m in COMB if val(R, m) is not None and COMB[m][0] >= 2026.25]
    res = {m: COMB[m][1][0] - (a0 + a1 * (val(R, m) - 150) + aoff * (LAB(m) == 'Anthropic')) for m in ms}
    top = '  '.join(f"{m.replace('Claude ', '')} {res[m]:+.2f}" for m in ('Claude Opus 5.5', 'GPT-6 Astra') if m in res)
    print(f"    {R:9s} mean over {len(ms)} models since April 2026 {np.mean(list(res.values())):+.2f};  {top}")

# ---------------------------------------------------------------------------------------------------- 3. 2026 pace
print('\n=== 3. 2026 frontier pace (records from 1 January), in ruler points a year and in pooled doublings a year')
def rec(R, g, t1=None):
    pts = [(DATE.get(m, DATE.get(ep(m))), v, m) for m, v in RULERS[R].items() if LAB(m) == g]
    if R == 'AECI': pts = [(MCI[m][0], v, m) for m, v in RULERS[R].items() if m in MCI]
    return O.records([p for p in pts if p[0] is not None and p[0] >= 2025.55 and (t1 is None or p[0] <= t1)])
def rate(R, g, t1=None):
    r = rec(R, g, t1); s = O.slope(r, 2026.0)
    if s is None: return None
    return s[0], s[1], s[2], s[0] / (1 / MAP[R][1]), r[-1]
mrec = lambda g: O.records([(MCI[m][0], MCI[m][1], m) for m in MCI if LAB(m) == g and MCI[m][0] >= 2025.55])
print(f"  {'':10s} {'through 22 September (METR\'s window)':>48s}   {'through 17 November':>40s}")
for g in ('Anthropic', 'OpenAI', 'Google'):
    for R in ('ECI', 'software', 'agentic', 'OECI') + (('AECI',) if g == 'Anthropic' else ()):
        a, b = rate(R, g, 2026.73), rate(R, g)
        if a is None and b is None: continue
        f = lambda z: '' if z is None else f"{z[0]:5.1f} ±{z[1]:4.1f} pts/yr = {z[3]:4.1f} dbl/yr (n={z[2]}, last {z[4][2].replace('Claude ', '')})"
        print(f"  {g:10s}{R:9s} {f(a):48s}   {f(b)}")
    m = O.slope(mrec(g), 2026.0)
    if m: print(f"  {g:10s}{'MCI':9s} {m[0]:5.0f} ±{m[1]:4.0f} MCI/yr = {m[0] * 0.00939:4.1f} dbl/yr (n={m[2]}), METR's window")
    pr = O.records([(t, th[0], n) for n, (t, th) in COMB.items() if LAB(n) == g])
    s = O.slope(pr, 2026.0)
    if s: print(f"  {g:10s}{'pooled':9s} measured: {s[0]:4.1f} ±{s[1]:3.1f} dbl/yr (n={s[2]})")
s = O.slope(O.records([(t, th[0], n) for n, (t, th) in COMB.items()]), 2026.0)
print(f"  every lab, pooled measured: {s[0]:.1f} ±{s[1]:.1f} doublings a year (n={s[2]}); METR's line since 2024: {12 / 3.61:.1f}")

# ---------------------------------------------------------------------------------------------------- 4. carried onto pooled hours
LATE = ['Claude Sonnet 5.5', 'GPT-6.1 Sol', 'Gemini 4 Argon', 'GPT-6.1 Terra', 'Gemini 4 Carbon', 'Claude Fable 5.2', 'GPT-6.2 Sol', 'GPT-6.2 Astra']
def pooled(R, m):
    v = val(R, m)
    if v is None: return None
    b0, b1, off = MAP[R]; return b0 + b1 * (v - 150) + off * (LAB(m) == 'Anthropic')
hrs = Q.hrs
print("\n=== 4. Public models METR hasn't measured, carried onto pooled hours (GPT-6 Astra measured 40 h, Opus 5.5 39 h)")
print(f"  {'model':20s} {'date':10s} " + ' '.join(f"{R:>10s}" for R in ('ECI', 'software', 'agentic', 'OECI')))
for m in ['GPT-6 Astra', 'Claude Opus 5.5'] + LATE:
    d = DATE.get(m)
    print(f"  {m:20s} {str(day(d)) if d else '':10s} " + ' '.join(f"{(hrs(pooled(R, m)) if pooled(R, m) is not None else '–'):>10s}" for R in ('ECI', 'software', 'agentic', 'OECI')))

# ---------------------------------------------------------------------------------------------------- 5. refits
print('\n=== 5. The pooled record extended by those models, through each ruler (no internal checkpoints)')
base, _ = Q.new_series(Q.COMB, internal=False)
runs = {}
for R in ('ECI', 'software', 'agentic', 'OECI'):
    b0, b1, off = MAP[R]
    adj = lambda m: val(R, m) + off / b1 * (LAB(m) == 'Anthropic')          # the Claude offset folded into the score
    meas = [row(r['name'], r['t'], r['th'], (adj(r['name']), None, None) if r['t'] > 2024.3 and val(R, r['name']) is not None else None)
            for r in base]                                                        # scores only for the pooled models
    late = [row(m, DATE[m], aeci=(adj(m), None, None)) for m in LATE if val(R, m) is not None and DATE.get(m)]
    cal = [row(m, COMB[m][0], COMB[m][1], (adj(m), None, None)) for m in COMB if val(R, m) is not None and m not in {r['name'] for r in base}]
    best, keep = max(r['th'][0] for r in meas), []
    for m in sorted(late, key=lambda m: m['t']):
        h = b0 + b1 * (m['aeci'][0] - 150)
        if h > best: best = h; keep.append(m)
    print(f"  {R}: adds " + ', '.join(f"{m['name']} {day(m['t'])} {hrs(b0 + b1 * (m['aeci'][0] - 150))}" for m in keep))
    runs[R] = compare(f'pooled record, then later public models through {R}', [*meas, *keep], cal)
print('\n  does the date hold still? (tau, move since December 2025; share of double-exponential | hyperbolic histories drifting less)')
for R, r in runs.items():
    k = min(10, int((r['t'] <= 2025.95).sum()))
    (tau, move), o = drift(r['t'], r['y'], kmin=k)
    print(f"  {R:9s} tau {tau:+.2f}, move {move:+.2f}   double exp. {o['double exponential'][0][1]:.2f}/{o['double exponential'][1][1]:.2f}"
          f"   hyperbolic {o['hyperbolic'][0][1]:.2f}/{o['hyperbolic'][1][1]:.2f}")
