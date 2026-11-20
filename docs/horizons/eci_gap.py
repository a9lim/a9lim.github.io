"""What Claude's ECI shortfall at equal METR horizon is made of. Opus 5.5 (claude-opus-5-5), 2026-11-12; see AGENTS.md.

    python eci_gap.py

1. Each benchmark's implied capability, D_b + logit(score) / slope_b with Epoch's fitted difficulty and slope, minus the
   model's ECI, averaged by lab over frontier models (ECI >= 140, since June 2024).
2. Domain capabilities: the slope^2-weighted mean of implied capability over one domain's benchmarks.
3. log2 METR horizon on each measure with a Claude offset, over the 20 models METR and Epoch both cover.
4. Which domains carry the offset, and AECI against Epoch's domain measures for public Claude models.
5. The record series on each Epoch measure (public models only), fitted like the figure.
"""
import sys, csv, math, collections
import os; HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
from series import TH, PAIR, EDI as edi, EPOCH_SCORES as sc, EPOCH_ROWS
rows = [r for r in EPOCH_ROWS if r['Model'] in sc]
lab = lambda m: {'Anthropic': 'Anthropic', 'OpenAI': 'OpenAI', 'Google DeepMind': 'Google'}.get(sc[m]['Organization'], 'other')
DOM = {
  'SWE/agentic coding': ['Aider polyglot', 'WeirdML', 'WeirdML v3', 'Terminal Bench', 'Cybench', 'GSO-Bench', 'MirrorCode', 'FrontierCode', 'FrontierSWE', 'PostTrainBench', 'ExploitBench'],
  'other agentic': ['The Agent Company', 'OSWorld', 'OSWorld 2.0', 'GDPval', 'APEX-Agents', 'Remote Labor Index', 'DeepResearch Bench', 'Balrog'],
  'math': ['MATH level 5', 'OTIS Mock AIME 2024-2025', 'FrontierMath-Tiers-1-3-v2-Private', 'FrontierMath-2025-02-28-Private', 'FrontierMath-Tier-4-v2-Private', 'FrontierMath-Tier-4-2025-07-01-Private', 'ProofBench', 'GSM8K'],
  'science/knowledge': ['GPQA diamond', 'SimpleQA Verified', 'MMLU', 'TriviaQA', 'ARC AI2', 'OpenBookQA', 'GeoBench'],
  'reasoning/puzzles/games': ['ARC-AGI', 'ARC-AGI-2', 'SimpleBench', 'Chess Puzzles', 'Mystery Game Puzzles', 'EBR-bench', 'SpireClimb', 'VPCT', 'Furniture Assembly', 'DTBench', 'BBH'],
}
ALL_BUT_METR = [b for b in edi if b != 'METR Time Horizons']
# benchmark-implied capability for each (model, benchmark) away from the floor and ceiling
C = collections.defaultdict(dict)
for r in rows:
    p = float(r['performance']); b = r['benchmark']
    if 0.03 < p < 0.97 and b in edi:
        d, a = edi[b]; C[r['Model']][b] = (d + math.log(p / (1 - p)) / a, a)
def cap(m, bs, nmin=2):
    v = [(c, a) for b, (c, a) in C[m].items() if b in bs]
    if len(v) < nmin: return None
    w = np.array([a * a for _, a in v]); return float(np.sum(w * [c for c, _ in v]) / w.sum())

# 1. per-benchmark residual (implied minus ECI) for frontier models, by lab
front = [m for m in sc if float(sc[m]['eci']) >= 140 and sc[m]['date'] >= '2024-06-01']
print(f"frontier models (ECI>=140, since 2024-06): " + ', '.join(f"{l} {sum(lab(m) == l for m in front)}" for l in ('Anthropic', 'OpenAI', 'Google', 'other')))
print(f"{'benchmark':36s} {'Anthropic':>14s} {'OpenAI':>14s} {'Google':>14s}   A - (O,G)")
out = []
for b in edi:
    g = {l: [C[m][b][0] - float(sc[m]['eci']) for m in front if b in C[m] and lab(m) == l] for l in ('Anthropic', 'OpenAI', 'Google')}
    if len(g['Anthropic']) >= 2 and len(g['OpenAI']) + len(g['Google']) >= 3:
        oth = g['OpenAI'] + g['Google']; out.append((np.mean(g['Anthropic']) - np.mean(oth), b, g))
dom_of = {b: d for d, bs in DOM.items() for b in bs}
for diff, b, g in sorted(out):
    cell = lambda v: f"{np.mean(v):+6.1f} (n={len(v):2d})" if v else f"{'':14s}"
    print(f"{b[:36]:36s} {cell(g['Anthropic'])} {cell(g['OpenAI'])} {cell(g['Google'])}   {diff:+5.1f}  {dom_of.get(b, '')}")

# 2. domain capability minus ECI, by lab, frontier models
print('\ndomain ECI minus overall ECI, frontier models, mean (models):')
for d, bs in DOM.items():
    cells = []
    for l in ('Anthropic', 'OpenAI', 'Google'):
        v = [cap(m, bs) - float(sc[m]['eci']) for m in front if lab(m) == l and cap(m, bs) is not None]
        cells.append(f"{l} {np.mean(v):+5.1f} ({len(v)})" if v else f"{l} -")
    print(f"  {d:26s} " + '   '.join(cells))

# 3. METR horizon on each capability measure, with a Claude offset, over the METR-Epoch pairs
th = {k: math.log2(v / 60) for t, v, k, s, lo, hi in TH}
pairs = [(k, e) for k, e in PAIR.items() if e in sc]
print(f'\nlog2 horizon on each capability, {len(pairs)} METR-Epoch pairs: Claude offset in doublings (se), and in that measure\'s points')
for name, f in [('ECI (published)', lambda e: float(sc[e]['eci'])), ('ECI-like, all but METR TH', lambda e: cap(e, ALL_BUT_METR))] + [(d, (lambda bs: lambda e: cap(e, bs))(bs)) for d, bs in DOM.items()]:
    v = [(f(e), th[k], 'claude' in k) for k, e in pairs]; v = [x for x in v if x[0] is not None]
    x = np.array([a for a, _, _ in v]); y = np.array([b for _, b, _ in v]); c = np.array([z for *_, z in v], float)
    X = np.c_[np.ones(len(x)), x - 150, c]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; s2 = r @ r / (len(x) - 3)
    se = math.sqrt(s2 * np.linalg.inv(X.T @ X)[2, 2]); X0 = X[:, :2]; b0, *_ = np.linalg.lstsq(X0, y, rcond=None); r0 = y - X0 @ b0
    print(f"  {name:28s} n={len(x):2d} ({int(c.sum())} Claude)  offset {b[2]:+.2f} ({se:.2f})  = {b[2] / b[1]:+.1f} pts   scatter without offset {math.sqrt(r0 @ r0 / (len(x) - 2)):.2f}, with {math.sqrt(s2):.2f}")

# 4. which domains carry the offset; AECI against Epoch's domain measures
from series import AECI, PUBLIC
pairs = [(k, e) for k, e in PAIR.items() if e in sc]
allb = [b for b in edi if b != 'METR Time Horizons']
def offset(f, keep=None):
    v = [(f(e), th[k], 'claude' in k, k) for k, e in pairs]; v = [x for x in v if x[0] is not None and (keep is None or x[3] in keep)]
    x = np.array([a[0] for a in v]); y = np.array([a[1] for a in v]); c = np.array([a[2] for a in v], float)
    X = np.c_[np.ones(len(x)), x - 150, c]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; s2 = r @ r / (len(x) - 3)
    return b[2], math.sqrt(s2 * np.linalg.inv(X.T @ X)[2, 2]), len(x), {a[3] for a in v}
swe = DOM['SWE/agentic coding']; ag = swe + DOM['other agentic']
o, se, n, keep16 = offset(lambda e: cap(e, swe))
print(f"same {n} models: published ECI offset {offset(lambda e: float(sc[e]['eci']), keep16)[0]:+.2f} ({offset(lambda e: float(sc[e]['eci']), keep16)[1]:.2f}); SWE-only {o:+.2f} ({se:.2f})")
for name, bs in [('SWE + other agentic', ag), ('all but science/knowledge', [b for b in allb if b not in DOM['science/knowledge']]),
                 ('all but math', [b for b in allb if b not in DOM['math']]), ('all but agentic', [b for b in allb if b not in ag]),
                 ('all but science/knowledge and math', [b for b in allb if b not in DOM['science/knowledge'] + DOM['math']])]:
    o, se, n, _ = offset(lambda e: cap(e, bs))
    print(f"  {name:36s} n={n:2d}  Claude offset {o:+.2f} ({se:.2f}) doublings")
# public Claude models: AECI against Epoch's overall and domain capabilities
A = {a[0]: a for a in AECI}
print('\npublic Claude models: AECI minus each Epoch measure (ECI points)')
print(f"{'model':16s} {'AECI':>6s} {'ECI':>6s} {'A-ECI':>6s} {'A-SWE':>6s} {'A-agent':>7s} {'A-math':>6s} {'A-sci':>6s}")
for k, e in PUBLIC.items():
    if k == 'Model 3' or e not in sc: continue
    a = A[k][2]; vals = [float(sc[e]['eci']), cap(e, swe), cap(e, ag), cap(e, DOM['math']), cap(e, DOM['science/knowledge'])]
    print(f"{k:16s} {a:6.1f} " + ' '.join(f"{a - v:+6.1f}" if v is not None else f"{'-':>6s}" for v in vals))

# 5. record series on Epoch's own measures, public models only
from fit import hyp, FITS, aicc, quantile
from series import yr
import three_scales as T
swe = DOM['SWE/agentic coding']; ag = swe + DOM['other agentic']; allb = [b for b in edi if b != 'METR Time Horizons']
for name, f in [('published ECI', lambda m: float(sc[m]['eci'])), ('ECI-like, all but METR TH', lambda m: cap(m, allb, 4)),
                ('SWE/agentic coding', lambda m: cap(m, swe, 2)), ('SWE + other agentic', lambda m: cap(m, ag, 3))]:
    pts = sorted((yr(sc[m]['date']), f(m), m) for m in sc if sc[m]['date'] >= '2023-01-01' and f(m) is not None)
    rec, best = [], -1e9
    i = 0
    while i < len(pts):
        j = i
        while j < len(pts) and pts[j][0] == pts[i][0]: j += 1
        top = max(pts[i:j], key=lambda p: p[1])
        if top[1] > best: best = top[1]; rec.append(top)
        i = j
    t = np.array([p[0] for p in rec]); y = np.array([p[1] for p in rec]); n = len(t)
    H = hyp(t, y[None]); fh = (H[0][0] - H[1][0] * np.log2(H[2][0] - t))
    R = np.random.default_rng(1); Y = fh + (y - fh)[R.integers(0, n, (2000, n))]; ts = np.sort(hyp(t, Y)[2])
    fits = {q['name']: q for q in (F(t, y) for F in FITS)}
    for q in fits.values(): q['aicc'] = aicc(n, q['sse'], q['p'])
    lead = min(q['aicc'] for k, q in fits.items() if k != 'hyperbolic') - fits['hyperbolic']['aicc']
    tau, share = T.drift(t, y, kmin=8)
    print(f"{name:26s} n={n:2d}, to {rec[-1][2]} ({rec[-1][1]:.1f}): singularity {H[2][0]:.2f} (95% {quantile(ts, 0.025):.2f}-{quantile(ts, 0.975):.2f})  "
          f"AICc lead {lead:+.1f}  tau {tau:+.2f} [dexp {share['double exponential']:.2f}]")
    print('    last records: ' + ', '.join(f"{m} {v:.0f}" for _, v, m in rec[-6:]))
