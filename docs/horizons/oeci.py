"""OpenAI's OECI (research-acceleration report, 18 Nov 2026) against AECI, Epoch's ECI and software ECI, and METR horizons.
Opus 5.5 (claude-opus-5-5), 2026-11-19, with a9; see AGENTS.md, "OECI".

    python oeci.py      # tables to stdout

The OECI numbers are the Vega-Lite datasets embedded in the report page (read in the browser; openai.com refuses
scripted fetches), copied to data/openai-2026-11-18/. The trend there is OpenAI's: a line through the 9 OpenAI record
releases, taking the highest OECI on each release date.
"""
import csv, math, os, sys, io, contextlib, runpy, datetime as dt
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from series import AECI, PUBLIC, TH, PAIR, yr
from fit import FITS, aicc, hyp
with contextlib.redirect_stdout(io.StringIO()):
    G = runpy.run_path(f'{HERE}/eci_gap.py', run_name='lib')
sc, cap, DOM = G['sc'], G['cap'], G['DOM']
SWE = DOM['SWE/agentic coding']

OD = os.path.join(HERE, 'data', 'openai-2026-11-18')
OECI = {r['model']: dict(t=yr(r['release']), date=r['release'], v=float(r['oeci']), lo=float(r['low90']), hi=float(r['high90']),
                         openai=r['provider'] == 'OpenAI') for r in csv.DictReader(open(f'{OD}/oeci.csv'))}
BENCH = list(csv.DictReader(open(f'{OD}/oeci_benchmarks.csv')))

def lab(m):
    if m in OECI and OECI[m]['openai']: return 'OpenAI'
    if m.startswith('Claude'): return 'Anthropic'
    if m in sc: return {'OpenAI': 'OpenAI', 'Anthropic': 'Anthropic', 'Google DeepMind': 'Google'}.get(sc[m]['Organization'], 'other')
    return 'Google' if m.startswith('Gemini') else 'other'

# ---- AECI for public Claude models (by public release date) and the internal checkpoints (by METR's chart date)
A = {a[0]: a for a in AECI}
AECI_PUB = {e: A[k][2] for k, e in PUBLIC.items() if k != 'Model 3'}               # Model 3 = Fable 5.2 is unconfirmed
AECI_INT = [(a[0], a[1], a[2]) for a in AECI if a[3] == 'internal']

def swe(m): return cap(m, SWE, 2) if m in sc else None

def records(pts):
    """Running record, one point per date (the best that day), as OpenAI and the rest of reverse-log take it."""
    pts = sorted(pts); out, best, i = [], -1e9, 0
    while i < len(pts):
        j = i
        while j < len(pts) and pts[j][0] == pts[i][0]: j += 1
        top = max(pts[i:j], key=lambda p: p[1])
        if top[1] > best: best = top[1]; out.append(top)
        i = j
    return out

def series(index, who, since=2025.55):
    """(t, score, name) records for one index and one lab ('all' for every lab)."""
    if index == 'OECI': pts = [(d['t'], d['v'], m) for m, d in OECI.items()]
    elif index == 'ECI': pts = [(yr(sc[m]['date']), float(sc[m]['eci']), m) for m in sc]
    elif index == 'SWE-ECI': pts = [(yr(sc[m]['date']), swe(m), m) for m in sc if swe(m) is not None]
    elif index == 'AECI': pts = [(yr(sc[m]['date']), v, m) for m, v in AECI_PUB.items() if m in sc]
    elif index == 'AECI+internal':
        pts = [(yr(sc[m]['date']), v, m) for m, v in AECI_PUB.items() if m in sc] + [(t, v, n) for n, t, v in AECI_INT]
        return records([p for p in pts if p[0] >= since])
    pts = [p for p in pts if p[0] >= since and (who == 'all' or lab(p[2]) == who)]
    return records(pts)

def slope(rec, t0=None, t1=None):
    r = [p for p in rec if (t0 is None or p[0] >= t0) and (t1 is None or p[0] <= t1)]
    if len(r) < 3: return None
    t = np.array([p[0] for p in r]); y = np.array([p[1] for p in r]); X = np.c_[np.ones_like(t), t - t.mean()]
    b, *_ = np.linalg.lstsq(X, y, rcond=None); res = y - X @ b; s2 = res @ res / max(len(t) - 2, 1)
    return float(b[1]), float(math.sqrt(s2 / ((t - t.mean()) ** 2).sum())), len(t)

def curvature(rec):
    """Quadratic in score: acceleration in points per year per year, with its se; and the AICc table."""
    t = np.array([p[0] for p in rec]); y = np.array([p[1] for p in rec]); n = len(t); tc = t - t.mean()
    X = np.c_[np.ones(n), tc, tc ** 2]; b, *_ = np.linalg.lstsq(X, y, rcond=None); res = y - X @ b
    s2 = res @ res / max(n - 3, 1); se = math.sqrt(s2 * np.linalg.inv(X.T @ X)[2, 2])
    fits = {f['name']: f for f in (F(t, y) for F in FITS)}
    for f in fits.values(): f['aicc'] = aicc(n, f['sse'], f['p'])
    return 2 * b[2], 2 * se, fits

def horizon_maps():
    """Points per doubling of METR horizon on each index. ECI and software ECI: least squares over the METR-Epoch pairs with a
    Claude offset (eci_gap.py's regression). AECI: the hours view's map (series.py, 8 Claude models). OECI: only 5 models have a
    METR horizon, too few with a lab offset, so its map is ECI's divided by OECI's within-lab slope on ECI."""
    th = {k: math.log2(v / 60) for _, v, k, *_ in TH}
    out = {}
    for name, f in (('ECI', lambda e: float(sc[e]['eci'])), ('SWE-ECI', swe)):
        v = [(f(e), th[k], 'claude' in k) for k, e in PAIR.items() if e in sc and f(e) is not None]
        X = np.c_[np.ones(len(v)), [a - 150 for a, _, _ in v], [float(c) for *_, c in v]]
        b, *_ = np.linalg.lstsq(X, np.array([y for _, y, _ in v]), rcond=None); out[name] = 1 / b[1]
    from series import ON_CHART
    ks = [k for k in ON_CHART if k in th]
    b = np.polyfit([A[ON_CHART[k]][2] for k in ks], [th[k] for k in ks], 1); out['AECI'] = 1 / b[0]
    for g in ('OpenAI', 'Anthropic'):
        ms = [m for m in OECI if m in sc and lab(m) == g]
        out[f'OECI/{g}'] = out['ECI'] * line_fit([float(sc[m]['eci']) for m in ms], [OECI[m]['v'] for m in ms])[0][1]
    return out

RATE_ROWS = [('OECI', 'OpenAI'), ('OECI', 'Anthropic'), ('ECI', 'OpenAI'), ('ECI', 'Anthropic'), ('SWE-ECI', 'OpenAI'),
             ('SWE-ECI', 'Anthropic'), ('AECI', 'Anthropic'), ('AECI+internal', 'Anthropic')]
def matched(index, who):
    """ECI or software ECI records over the models OECI also scores, so model choice can't differ between the rulers."""
    f = (lambda m: float(sc[m]['eci'])) if index == 'ECI' else swe
    return records([(yr(sc[m]['date']), f(m), m) for m in OECI if m in sc and lab(m) == who and f(m) is not None])
def rates(t0=2026.0):
    """2026 frontier slope on each index, in points/yr and in horizon doublings/yr through that index's map."""
    M = horizon_maps(); out = []
    for ix, who in RATE_ROWS:
        rec = matched(ix, who) if ix in ('ECI', 'SWE-ECI') else series(ix, who)
        s = slope(rec, t0); ppd = M[f'OECI/{who}'] if ix == 'OECI' else M['AECI' if ix.startswith('AECI') else ix]
        out.append(dict(index=ix, lab=who, pts=s[0], se=s[1], n=s[2], ppd=ppd, dbl=s[0] / ppd, dbl_se=s[1] / ppd, rec=rec))
    return out

def metr_rates():
    """Doublings per year of METR's measured record horizon, by period (record holders only)."""
    pts = [(t, math.log2(v / 60)) for t, v, k, sota, *_ in TH if sota]
    res = {}
    for a, b in ((2019.0, 2024.0), (2024.0, 2026.5)):
        q = [(t, y) for t, y in pts if a <= t < b]
        res[(a, b)] = (float(np.polyfit([t for t, _ in q], [y for _, y in q], 1)[0]), len(q))
    return res

def line_fit(x, y):
    x = np.asarray(x, float); y = np.asarray(y, float); X = np.c_[np.ones_like(x), x - 160]
    b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; s2 = r @ r / (len(x) - 2)
    return b, math.sqrt(s2 * np.linalg.inv(X.T @ X)[1, 1]), math.sqrt(s2)

if __name__ == '__main__':
    # ---- 0. OpenAI's own trend, reproduced
    oa = series('OECI', 'OpenAI', since=2025.0)
    t = np.array([p[0] for p in oa]); y = np.array([p[1] for p in oa]); b = np.polyfit(t, y, 1)
    print(f"OpenAI's trend: {len(oa)} records, {b[0]:.2f} pts/yr; fit {np.polyval(b, yr('2025-08-07')):.1f} at 2025-08-07, "
          f"{np.polyval(b, yr('2026-11-17')):.1f} at 2026-11-17  (report: 16.4/yr, 148.8 -> 169.7)")
    print('  residuals: ' + ', '.join(f"{m} {v - np.polyval(b, tt):+.1f}" for tt, v, m in oa))

    # ---- 1. what OECI measures: the benchmark table
    print('\nOECI benchmarks (96 versions): by category, how many, how many models each touches, difficulty')
    cats = sorted({r['category'] for r in BENCH})
    tot_pairs = sum(int(r['fitted_models']) for r in BENCH)
    for c in cats:
        rs = [r for r in BENCH if r['category'] == c]; nm = [int(r['fitted_models']) for r in rs]; d = [float(r['difficulty']) for r in rs]
        print(f"  {c:34s} {len(rs):3d} benchmarks, {sum(nm):4d} model-benchmark pairs ({sum(nm) / tot_pairs:5.1%}), "
              f"median {int(np.median(nm)):2d} models each, max {max(nm):2d}; difficulty {min(d):.0f}-{max(d):.0f}, {sum(x > 170.3 for x in d)} above GPT-6.2 Astra")
    wide = [r for r in BENCH if int(r['fitted_models']) >= 20]
    print(f"  benchmarks fitted on >= 20 of the 48 models: {len(wide)} -- " + ', '.join(f"{r['category']} ({r['fitted_models']})" for r in wide))
    agentic = {'AI research', 'Computer and tool use', 'Cybersecurity', 'Software and hardware engineering'}
    print(f"  share of model-benchmark pairs that are agentic/software/AI-research: "
          f"{sum(int(r['fitted_models']) for r in BENCH if r['category'] in agentic) / tot_pairs:.1%}; "
          f"if the 48 models each had the 9 wide benchmarks, the rest average {(tot_pairs - sum(int(r['fitted_models']) for r in wide)) / 48:.1f} pairs a model")

    # ---- 2. OECI against Epoch's ECI, same models, with lab offsets
    both = [m for m in OECI if m in sc]
    x = np.array([float(sc[m]['eci']) for m in both]); yv = np.array([OECI[m]['v'] for m in both])
    L = [lab(m) for m in both]
    print(f'\nOECI against Epoch ECI, {len(both)} shared models')
    for g in ('OpenAI', 'Anthropic', 'Google', 'other'):
        d = [yv[i] - x[i] for i in range(len(both)) if L[i] == g]
        if d: print(f"  {g:10s} n={len(d):2d}  OECI - ECI  mean {np.mean(d):+5.2f}  sd {np.std(d, ddof=1) if len(d) > 1 else 0:4.2f}")
    X = np.c_[np.ones(len(x)), x - 160] + 0; D = np.array([[l == g for g in ('Anthropic', 'Google', 'other')] for l in L], float)
    XX = np.c_[X, D]; bb, *_ = np.linalg.lstsq(XX, yv, rcond=None); r = yv - XX @ bb; s2 = r @ r / (len(x) - XX.shape[1])
    se = np.sqrt(np.diag(s2 * np.linalg.inv(XX.T @ XX)))
    print(f"  OECI = {bb[0]:.2f} + {bb[1]:.3f} (se {se[1]:.3f}) * (ECI - 160) + lab offset vs OpenAI: "
          f"Anthropic {bb[2]:+.2f} ({se[2]:.2f}), Google {bb[3]:+.2f} ({se[3]:.2f}), other {bb[4]:+.2f} ({se[4]:.2f}); scatter {math.sqrt(s2):.2f}")
    for g in ('OpenAI', 'Anthropic'):
        idx = [i for i in range(len(both)) if L[i] == g]
        bg, seg, sg = line_fit(x[idx], yv[idx])
        print(f"  within {g:9s}: OECI on ECI slope {bg[1]:.3f} ({seg:.3f}), scatter {sg:.2f}, n={len(idx)}")
    print('  Claude, OECI on software ECI and on AECI (public pairs):')
    cl = [m for m in both if lab(m) == 'Anthropic']
    for m in sorted(cl, key=lambda m: OECI[m]['t']):
        s = swe(m); a = AECI_PUB.get(m)
        print(f"    {m:20s} {OECI[m]['date']}  OECI {OECI[m]['v']:6.1f}  ECI {float(sc[m]['eci']):6.1f}  SWE {s if s is None else round(s, 1)!s:>6}  AECI {a if a is None else round(a, 1)!s:>6}")
    pa = [m for m in cl if m in AECI_PUB]
    ba, sea, sa = line_fit([OECI[m]['v'] for m in pa], [AECI_PUB[m] for m in pa])
    print(f"  AECI on OECI, {len(pa)} public Claude pairs: slope {ba[1]:.3f} ({sea:.3f}), AECI {ba[0]:.1f} at OECI 160, scatter {sa:.2f}")
    print(f"  Fable 5.2: OECI 169.7 -> AECI {ba[0] + ba[1] * (169.7 - 160):.1f} on that line (Model 3 reads {A['Model 3'][2]:.1f}, Model 4 {A['Model 4'][2]:.1f})")
    po = [m for m in both if lab(m) == 'OpenAI' and swe(m) is not None]
    for g, ms in (('OpenAI', po), ('Anthropic', [m for m in cl if swe(m) is not None])):
        bs_, ses_, ss_ = line_fit([swe(m) for m in ms], [OECI[m]['v'] for m in ms])
        print(f"  OECI on software ECI, {g:9s} n={len(ms):2d}: slope {bs_[1]:.3f} ({ses_:.3f}), OECI {bs_[0]:.1f} at SWE 160, scatter {ss_:.2f}")

    # ---- 3. METR horizons on OECI, the few models with both
    th = {k: math.log2(v / 60) for _, v, k, *_ in TH}
    mp = [(k, e) for k, e in PAIR.items() if e in OECI]
    print(f"\nMETR-measured models with an OECI: {len(mp)} -- " + ', '.join(f"{e} ({2 ** th[k]:.1f} h)" for k, e in mp))
    for name, f in (('OECI', lambda e: OECI[e]['v']), ('ECI', lambda e: float(sc[e]['eci']))):
        bh, seh, sh = line_fit([f(e) for _, e in mp], [th[k] for k, _ in mp])
        print(f"  log2 h on {name:4s}: {1 / bh[1]:.2f} points per doubling (slope se {seh:.3f}), scatter {sh:.2f} doublings")

    # ---- 4. each lab's frontier on each index, same window (since mid-2025)
    print('\nRecord series since 2025-07-20 (OECI starts at GPT-5, 2025-08-07): slope in points/yr (se, n)')
    print(f"  {'index':14s} {'lab':10s} {'whole window':>20s} {'to 2026-01':>18s} {'2026 on':>18s}  accel pts/yr^2 (se)   last record")
    rows = [('OECI', 'OpenAI'), ('OECI', 'Anthropic'), ('OECI', 'all'), ('ECI', 'OpenAI'), ('ECI', 'Anthropic'), ('ECI', 'all'),
            ('SWE-ECI', 'OpenAI'), ('SWE-ECI', 'Anthropic'), ('AECI', 'Anthropic'), ('AECI+internal', 'Anthropic')]
    for ix, who in rows:
        rec = series(ix, who)
        f = lambda s: '-' if s is None else f"{s[0]:5.1f} ({s[1]:4.1f}, {s[2]:2d})"
        acc, acc_se, fits = curvature(rec)
        print(f"  {ix:14s} {who:10s} {f(slope(rec)):>20s} {f(slope(rec, None, 2026.0)):>18s} {f(slope(rec, 2026.0)):>18s}  "
              f"{acc:+6.1f} ({acc_se:4.1f})          {rec[-1][2]} {rec[-1][1]:.1f}")
    print('\n  ECI and software ECI over OECI\'s own model set (no Pro tiers, no models OECI lacks):')
    for ix in ('ECI', 'SWE-ECI'):
        for who in ('OpenAI', 'Anthropic'):
            rec = matched(ix, who); f = lambda s: '-' if s is None else f"{s[0]:5.1f} ({s[1]:4.1f}, {s[2]:2d})"
            print(f"  {ix:14s} {who:10s} {f(slope(rec)):>20s} {f(slope(rec, None, 2026.0)):>18s} {f(slope(rec, 2026.0)):>18s}")

    M = horizon_maps()
    print('\n2026 rates in horizon doublings per year, each index through its own map (points per doubling):')
    print('  maps: ' + ', '.join(f"{k} {v:.2f}" for k, v in M.items()))
    for r in rates():
        print(f"  {r['index']:14s} {r['lab']:10s} {r['pts']:5.1f} pts/yr ({r['se']:.1f}, n={r['n']:2d}) / {r['ppd']:.2f} = "
              f"{r['dbl']:4.2f} doublings/yr ({r['dbl_se']:.2f}), doubling time {12 / r['dbl']:.1f} months")
    for (a, b), (s, n) in metr_rates().items():
        print(f"  METR measured record {a:.0f}-{b:.1f}: {s:.2f} doublings/yr (n={n}), doubling time {12 / s:.1f} months")

    # ---- 5. Fable 5.2 through OECI and ECI onto AECI, against the curves' predictions (python oeci.py; see AGENTS.md)
    pa = [m for m in OECI if m in AECI_PUB and m in sc]
    for name, f in (('OECI', lambda m: OECI[m]['v']), ('ECI', lambda m: float(sc[m]['eci']))):
        bb, seb, sb = line_fit([f(m) for m in pa], [AECI_PUB[m] for m in pa]); x0 = f('Claude Fable 5.2') - 160
        print(f"  Fable 5.2 via {name:4s}: AECI {bb[0] + bb[1] * x0:.1f} (line through {len(pa)} public Claude pairs, slope {bb[1]:.2f}, "
              f"extrapolated {x0 - (max(f(m) for m in pa) - 160):.1f} {name} points past the last pair)")

    print('\n  AICc on each series (lower is better; "exponential" = a straight line in points, as in fit.py):')
    for ix, who in rows:
        rec = series(ix, who); acc, acc_se, fits = curvature(rec)
        best = min(q['aicc'] for q in fits.values())
        print(f"  {ix:14s} {who:10s} n={len(rec):2d}  " + '  '.join(f"{k} {q['aicc'] - best:+5.1f}" for k, q in fits.items())
              + f"   hyperbola date {fits['hyperbolic']['ts']:.2f}")
