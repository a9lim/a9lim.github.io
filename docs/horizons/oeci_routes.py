"""Where GPT-6.2 Astra lands on AECI's scale and in hours, by several routes, with Fable 5.2 and GPT-6 Astra as controls;
and what each index weights, from Epoch's per-benchmark scores split into domains. Opus 5.5 (claude-opus-5-5), 2026-11-19,
with a9; see AGENTS.md, "GPT-6.2 Astra by several routes".

    python oeci_routes.py

AECI-equivalent: the AECI a Claude model with the same 50% horizon would have, through the hours view's map. Routes that
land on AECI directly report that AECI and its horizon through the same map. GPT-6.2 Astra, and fresh scores for Fable 5.2
and GPT-6 Astra, come from Epoch's model pages on 2026-11-19 (data/epoch-2026-11-19/); everything else is the 12 November
download, with that download's benchmark difficulties and slopes.
"""
import json, math, os, sys, io, contextlib, itertools
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import oeci as O
from series import TH, PAIR, ON_CHART, AECI, PAGE_SCORES, PAGE_ECI
edi, C, sc, DOM = O.G['edi'], O.G['C'], O.sc, O.DOM
A = {a[0]: a for a in AECI}

# ---- fresh model pages: implied capability per benchmark, D_b + logit(p) / slope_b, away from floor and ceiling
FRESH = {}
for m, s in PAGE_SCORES.items():
    d = {}
    for b, p in s.items():
        if b in edi and 0.03 < p < 0.97: D, a = edi[b]; d[b] = (D + math.log(p / (1 - p)) / a, a)
    FRESH[m] = d
ECI_NOW = {m: v[0] for m, v in PAGE_ECI.items()}

GROUPS = {'agentic': DOM['SWE/agentic coding'] + DOM['other agentic'], 'math+science': DOM['math'] + DOM['science/knowledge'],
          'games+reasoning': DOM['reasoning/puzzles/games']}
def caps(m, table=None):
    t = (table or C)[m]; out = {}
    for g, bs in GROUPS.items():
        v = [(c, a) for b, (c, a) in t.items() if b in bs]
        out[g] = float(sum(a * a * c for c, a in v) / sum(a * a for _, a in v)) if v else None
    return out
def swe_of(t):
    v = [(c, a) for b, (c, a) in t.items() if b in DOM['SWE/agentic coding']]
    return float(sum(a * a * c for c, a in v) / sum(a * a for _, a in v)) if v else None

def nnls_fit(X, y):
    """Least squares y = c + X w with w >= 0, by trying every subset of columns (three here)."""
    best = None
    for k in range(1, X.shape[1] + 1):
        for S in itertools.combinations(range(X.shape[1]), k):
            Z = np.c_[np.ones(len(y)), X[:, S]]; b, *_ = np.linalg.lstsq(Z, y, rcond=None)
            if (b[1:] < 0).any(): continue
            r = y - Z @ b; sse = float(r @ r)
            if best is None or sse < best[0]:
                w = np.zeros(X.shape[1]); w[list(S)] = b[1:]; best = (sse, b[0], w)
    return best

def weights(name, ms, target, B=1000, seed=7):
    G = list(GROUPS); rows = [(m, caps(m)) for m in ms]; rows = [(m, c) for m, c in rows if all(c[g] is not None for g in G)]
    X = np.array([[c[g] for g in G] for _, c in rows]); y = np.array([target(m) for m, _ in rows])
    sse, c0, w = nnls_fit(X, y); R = np.random.default_rng(seed); share = []
    for _ in range(B):
        i = R.integers(0, len(y), len(y)); f = nnls_fit(X[i], y[i])
        if f and f[2].sum() > 0: share.append(f[2] / f[2].sum())
    share = np.array(share)
    print(f"  {name:34s} n={len(y):2d}  total slope {w.sum():.2f}  shares " +
          '  '.join(f"{g} {w[j] / w.sum():.2f} [{np.quantile(share[:, j], .1):.2f}-{np.quantile(share[:, j], .9):.2f}]" for j, g in enumerate(G))
          + f"  scatter {math.sqrt(sse / max(len(y) - 1 - (w > 0).sum(), 1)):.2f}")
    return c0, w

def ols(x, y, dummy=None):
    x = np.asarray(x, float); cols = [np.ones_like(x), x] + ([np.asarray(dummy, float)] if dummy is not None else [])
    X = np.c_[tuple(cols)]; b, *_ = np.linalg.lstsq(X, np.asarray(y, float), rcond=None); return b

if __name__ == '__main__':
    th = {k: math.log2(v / 60) for _, v, k, *_ in TH}
    # maps
    ks = [k for k in ON_CHART if k in th]
    HA = ols([A[ON_CHART[k]][2] - 150 for k in ks], [th[k] for k in ks])                       # log2 h on AECI (Claude)
    pe = [(k, e) for k, e in PAIR.items() if e in sc]
    HE = ols([float(sc[e]['eci']) - 150 for _, e in pe], [th[k] for k, _ in pe], ['claude' in k for k, _ in pe])
    ps = [(k, e) for k, e in PAIR.items() if e in sc and O.swe(e) is not None]
    HS = ols([O.swe(e) - 150 for _, e in ps], [th[k] for k, _ in ps], ['claude' in k for k, _ in ps])
    aeci_eq = lambda l2: 150 + (l2 - HA[0]) / HA[1]
    hours = lambda a: 2 ** (HA[0] + HA[1] * (a - 150))
    pa = [m for m in O.OECI if m in O.AECI_PUB and m in sc]
    AO = ols([O.OECI[m]['v'] - 160 for m in pa], [O.AECI_PUB[m] for m in pa])               # AECI on OECI, Claude
    AE = ols([float(sc[m]['eci']) - 160 for m in pa], [O.AECI_PUB[m] for m in pa])          # AECI on ECI, Claude
    oa = [m for m in O.OECI if m in sc and O.lab(m) == 'OpenAI']
    OE = ols([float(sc[m]['eci']) - 160 for m in oa], [O.OECI[m]['v'] for m in oa])         # OECI on ECI, OpenAI
    oas = [m for m in oa if O.swe(m) is not None]
    OS = ols([O.swe(m) - 160 for m in oas], [O.OECI[m]['v'] for m in oas])                  # OECI on SWE-ECI, OpenAI
    both = [m for m in O.OECI if m in sc]
    LAB = ols([float(sc[m]['eci']) - 160 for m in both], [O.OECI[m]['v'] for m in both], [O.lab(m) == 'Anthropic' for m in both])
    print(f"maps: AECI {1 / HA[1]:.2f} pts/doubling, {2 ** HA[0]:.2f} h at 150 | ECI {1 / HE[1]:.2f}, Claude {HE[2]:+.2f} doublings | "
          f"SWE-ECI {1 / HS[1]:.2f}, Claude {HS[2]:+.2f} | AECI = {AO[0]:.1f} + {AO[1]:.3f} (OECI-160) | AECI = {AE[0]:.1f} + {AE[1]:.3f} (ECI-160) | "
          f"OpenAI OECI = {OE[0]:.1f} + {OE[1]:.3f} (ECI-160) | OECI Claude offset at equal ECI {LAB[2]:+.2f}")

    # ---- 1. what each index weights: three domain groups, non-negative weights, bootstrap 10-90%
    print('\nEffective weights, index regressed on Epoch domain capabilities (agentic = SWE + other agentic):')
    allm = [m for m in sc if float(sc[m]['eci']) >= 140 and sc[m]['date'] >= '2024-06-01']
    weights('ECI itself (frontier, all labs)', allm, lambda m: float(sc[m]['eci']))
    weights('OECI (shared models, all labs)', both, lambda m: O.OECI[m]['v'])
    weights('OECI (OpenAI models)', oa, lambda m: O.OECI[m]['v'])
    weights('OECI (Claude models)', [m for m in both if O.lab(m) == 'Anthropic'], lambda m: O.OECI[m]['v'])
    from series import PUBLIC
    cl = {e: A[k][2] for k, e in PUBLIC.items() if k != 'Model 3' and e in sc}
    weights('AECI (public Claude models)', list(cl), lambda m: cl[m])
    ag = [m for m in cl if caps(m)['agentic'] is not None]
    for g in GROUPS:
        ms = [m for m in cl if caps(m)[g] is not None and m in O.OECI]
        if len(ms) > 3:
            b = ols([caps(m)[g] - 160 for m in ms], [O.OECI[m]['v'] for m in ms]); b2 = ols([O.OECI[m]['v'] - 160 for m in ms], [caps(m)[g] for m in ms])
            print(f"    Claude, {g:16s} on OECI: slope {b2[1]:.2f} (n={len(ms)})")
    print('  domain capabilities, as used below:')
    for m in ('Claude Opus 5.5', 'GPT-6 Astra', 'GPT-6.1 Sol'):
        print(f"    {m:22s} (12 Nov) " + '  '.join(f"{g} {v:.1f}" if v else f"{g} -" for g, v in caps(m).items()))
    for m in FRESH:
        print(f"    {m:22s} (19 Nov) " + '  '.join(f"{g} {v:.1f}" if v else f"{g} -" for g, v in caps(m, FRESH).items())
              + f"   benchmarks: {', '.join(sorted(FRESH[m]))}")

    # ---- 2. the routes
    def row(label, aeci=None, l2=None, note=''):
        if aeci is not None: l2 = HA[0] + HA[1] * (aeci - 150)
        a = aeci_eq(l2); print(f"    {label:58s} AECI-eq {a:6.1f}   {2 ** l2:6.0f} h   {note}")
        return a
    m4 = A['Model 4'][2]; print(f'\nRoutes onto AECI. Model 4 is {m4:.1f} ({2 ** (HA[0] + HA[1] * (m4 - 150)):.0f} h on the hours view); Fable 5.2 runs as a control.')
    out = {}
    for m in ('GPT-6.2 Astra', 'Claude Fable 5.2', 'GPT-6 Astra'):
        claude = m.startswith('Claude'); o = O.OECI[m]['v']; e = ECI_NOW[m]; ce = caps(m, FRESH)
        print(f"  {m}: OECI {o}, ECI {e} (19 Nov)")
        r = []
        r.append(row('1 OECI -> AECI, Claude line', aeci=AO[0] + AO[1] * (o - 160), note='no lab correction'))
        if not claude:
            r.append(row('2 OECI minus its OpenAI lead at equal ECI -> AECI, Claude line', aeci=AO[0] + AO[1] * (o + LAB[2] - 160)))
        r.append(row('3 ECI -> AECI, Claude line', aeci=AE[0] + AE[1] * (e - 160), note='no lab correction'))
        r.append(row('4 ECI -> hours (ECI map, lab offset) -> AECI-eq', l2=HE[0] + HE[1] * (e - 150) + HE[2] * claude))
        if not claude:
            e_from_o = 160 + (o - OE[0]) / OE[1]
            r.append(row(f'5 OECI -> ECI {e_from_o:.1f} (OpenAI line) -> hours -> AECI-eq', l2=HE[0] + HE[1] * (e_from_o - 150)))
            s_from_o = 160 + (o - OS[0]) / OS[1]
            r.append(row(f'6 OECI -> software ECI {s_from_o:.1f} (OpenAI line) -> hours', l2=HS[0] + HS[1] * (s_from_o - 150)))
        # software ECI: Fable 5.2 from its fresh page; GPT-6.2 Astra has only MirrorCode, so carry GPT-6 Astra's forward
        if m == 'GPT-6.2 Astra':
            base = O.swe('GPT-6 Astra'); dmc = FRESH[m]['MirrorCode'][0] - FRESH['GPT-6 Astra']['MirrorCode'][0]
            for lab_, s in ((f'GPT-6 Astra {base:.1f} + MirrorCode gain {dmc:+.1f}', base + dmc), (f'GPT-6 Astra + its ECI gain {e - ECI_NOW["GPT-6 Astra"]:+.1f}', base + e - ECI_NOW['GPT-6 Astra'])):
                r.append(row(f'7 software ECI {s:.1f} ({lab_}) -> hours', l2=HS[0] + HS[1] * (s - 150)))
        else:
            s = swe_of(FRESH[m]) if m == 'Claude Fable 5.2' else O.swe(m)
            r.append(row(f'7 software ECI {s:.1f} -> hours', l2=HS[0] + HS[1] * (s - 150) + HS[2] * claude))
        out[m] = r
        print(f"    {'spread':58s} AECI-eq {min(r):.1f} to {max(r):.1f}")

    # ---- 3. reweighting: rebuild each model from its domain capabilities with a chosen agentic share, then carry it onto AECI
    # two ways: (a) the Claude line of AECI on that composite (AECI's own ruler); (b) METR horizons regressed on that composite
    # with a Claude offset, then AECI-equivalent (the horizon ruler). Non-agentic weight keeps ECI's own math+science : games split.
    G = list(GROUPS); rest = np.array([0.45, 0.32]) / 0.77
    def dom(m):
        if m == 'GPT-6.2 Astra':      # agentic: GPT-6 Astra's, moved by the MirrorCode gain (its only agentic benchmark)
            c = caps(m, FRESH); c['agentic'] = caps('GPT-6 Astra', FRESH)['agentic'] + FRESH[m]['MirrorCode'][0] - FRESH['GPT-6 Astra']['MirrorCode'][0]; return c
        return caps(m, FRESH)                 # all three from the same 19 November pages
    print('\nReweighted composites (agentic share s; the rest split as in ECI). AECI line = AECI on composite over public Claude;'
          ' hours = METR horizons on composite with a Claude offset.')
    print(f"  {'s':>5s}  {'slope all/2026':>15s}  {'pts/doubling':>12s} {'Claude offset':>13s}   " + '   '.join(f"{m:>26s}" for m in ('GPT-6.2 Astra', 'Claude Fable 5.2', 'GPT-6 Astra')))
    for s_ in (0.0, 0.23, 0.5, 0.75, 1.0):
        w = np.r_[s_, (1 - s_) * rest]; comp = lambda c: float(np.dot(w, [c[g] for g in G])) if all(c[g] is not None for g in G) else None
        pc = [(m, comp(caps(m))) for m in cl]; pc = [(m, x) for m, x in pc if x is not None]
        AC = ols([x - 160 for _, x in pc], [cl[m] for m, _ in pc])
        p26 = [(m, x) for m, x in pc if cl[m] >= 157]; A26 = ols([x - 160 for _, x in p26], [cl[m] for m, _ in p26])   # Opus 4.6 on
        hp = [(k, comp(caps(e))) for k, e in PAIR.items() if e in sc]; hp = [(k, x) for k, x in hp if x is not None]
        HC = ols([x - 150 for _, x in hp], [th[k] for k, _ in hp], ['claude' in k for k, _ in hp])
        cells = []
        for m in ('GPT-6.2 Astra', 'Claude Fable 5.2', 'GPT-6 Astra'):
            x = comp(dom(m)); a1 = AC[0] + AC[1] * (x - 160); a3 = A26[0] + A26[1] * (x - 160)
            a2 = aeci_eq(HC[0] + HC[1] * (x - 150) + HC[2] * m.startswith('Claude'))
            cells.append(f"{x:5.1f}: line {a1:5.1f} / 2026 line {a3:5.1f}, hours {a2:5.1f}")
        print(f"  {s_:5.2f}  {AC[1]:6.2f} / {A26[1]:5.2f}  {1 / HC[1]:12.2f} {HC[2]:+13.2f}   " + '   '.join(cells) + f"   (n {len(pc)}/{len(p26)} Claude, {len(hp)} METR)")
