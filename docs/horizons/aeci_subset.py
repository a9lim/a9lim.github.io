"""Speculative: pick Epoch benchmarks one at a time to reproduce AECI on the public Claude models, check whether the pick
generalises, and carry GPT-6.2 Astra and Fable 5.2 through it. Not evidence: 14 models, ~50 benchmarks to choose from.
Opus 5.5 (claude-opus-5-5), 2026-11-19, with a9; see AGENTS.md, "Picking benchmarks to imitate AECI".

    python aeci_subset.py

A model's capability on a subset S is the maximum-likelihood ability under Epoch's own benchmark difficulties and slopes
(12 November fit): fractional scores p_b, sum_b a_b (p_b - sigmoid(a_b (theta - D_b))) = 0, with a weak N(160, 100^2) prior
so that a model at 100% everywhere stays finite. Unlike oeci_routes.py this keeps saturated scores.
"""
import csv, json, math, os, sys, io, contextlib, collections, datetime as dt
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import oeci as O
    import oeci_routes as R
from series import TH, PAIR, PUBLIC, AECI, ON_CHART, yr, EPOCH_ROWS, PAGE_SCORES
edi, sc = O.G['edi'], O.sc
A = {a[0]: a for a in AECI}
BENCH = sorted(b for b in edi if b != 'METR Time Horizons')          # horizon itself is the thing we convert into
BI = {b: i for i, b in enumerate(BENCH)}
DIFF = np.array([edi[b][0] for b in BENCH]); SLOPE = np.array([edi[b][1] for b in BENCH])
PERF = collections.defaultdict(dict)
for r in EPOCH_ROWS:
    if r['benchmark'] in BI: PERF[r['Model']][r['benchmark']] = float(r['performance'])
for m, s in PAGE_SCORES.items():                                      # 19 November model pages override
    for b, p in s.items():
        if b in BI and p <= 1: PERF[m][b] = p
def vec(m):
    v = np.full(len(BENCH), np.nan)
    for b, p in PERF[m].items(): v[BI[b]] = p
    return v

def theta(P, S):
    """MLE ability for each row of P (models x benchmarks, nan = missing) on benchmark indices S."""
    p = P[:, S]; a = SLOPE[S]; d = DIFF[S]; ok = ~np.isnan(p); p0 = np.where(ok, p, 0.0); th = np.full(len(P), 160.0)
    for _ in range(60):
        s = 1 / (1 + np.exp(-a * (th[:, None] - d)))
        g = (ok * a * (p0 - s)).sum(1) - (th - 160) / 1e4; h = -(ok * a * a * s * (1 - s)).sum(1) - 1e-4
        th = th - np.clip(g / h, -15, 15)
    return th, ok.sum(1)

def line(x, y):
    X = np.c_[np.ones(len(x)), np.asarray(x) - 160]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b
    return b, float(r @ r)

# the 14 public Claude models with an AECI, in date order
CL = sorted([e for k, e in PUBLIC.items() if k != 'Model 3' and e in sc], key=lambda e: sc[e]['date'])
AE = {e: A[k][2] for k, e in PUBLIC.items() if k != 'Model 3'}
PC = np.array([vec(m) for m in CL]); YC = np.array([AE[m] for m in CL])
CAND = [i for i in range(len(BENCH)) if (~np.isnan(PC[:, i])).sum() >= 3]

def score(S, rows, need=1):
    th, n = theta(PC[rows], S)
    if (n < need).any(): return np.inf, None
    b, sse = line(th, YC[rows]); return math.sqrt(sse / max(len(rows) - 2, 1)), b

def greedy(rows, kmax=15):
    S, path = [], []
    for _ in range(kmax):
        best = min(((score(S + [c], rows)[0], c) for c in CAND if c not in S), default=(np.inf, None))
        if best[1] is None or not np.isfinite(best[0]): break
        S = S + [best[1]]; path.append((list(S), best[0]))
    return path

def predict(S, rows, P):
    th_fit, _ = theta(PC[rows], S); b, _ = line(th_fit, YC[rows]); th, n = theta(P, S)
    return b[0] + b[1] * (th - 160), n

if __name__ == '__main__':
    # 0. the estimator against Epoch's published ECI, all benchmarks
    ms = [m for m in sc if PERF[m]]; P = np.array([vec(m) for m in ms]); th, n = theta(P, list(range(len(BENCH))))
    e = np.array([float(sc[m]['eci']) for m in ms]); k = n >= 4; b, sse = line(th[k], e[k])
    print(f"MLE on all {len(BENCH)} benchmarks against Epoch's ECI, {k.sum()} models with 4+: slope {b[1]:.3f}, "
          f"r {np.corrcoef(th[k], e[k])[0, 1]:.4f}, scatter {math.sqrt(sse / (k.sum() - 2)):.2f}")
    ALL = list(range(len(BENCH)))
    rows = np.arange(len(CL))
    print(f"\nAECI on the full-benchmark ability, {len(CL)} Claude models: scatter {score(ALL, rows)[0]:.2f}")

    # 1. greedy path on all 14
    path = greedy(rows)
    print('\nGreedy pick on all 14 (scatter = in-sample residual sd of AECI on the subset ability):')
    for S, s in path: print(f"  {len(S):2d}  {s:5.2f}  + {BENCH[S[-1]]}")

    # 2. honest error: nested leave-one-out (the pick redone without the held-out model), against baselines
    print('\nNested leave-one-out error (AECI points), pick redone each time; baselines refit each time:')
    base = {'all benchmarks (ECI-like)': ALL, 'software/agentic coding': [BI[b] for b in O.DOM['SWE/agentic coding'] if b in BI],
            'software + other agentic': [BI[b] for b in O.DOM['SWE/agentic coding'] + O.DOM['other agentic'] if b in BI]}
    for name, S in base.items():
        err = [YC[i] - predict(S, np.delete(rows, i), PC[[i]])[0][0] for i in rows]
        print(f"  {name:30s} rms {math.sqrt(np.mean(np.square(err))):5.2f}   2026 models {math.sqrt(np.mean(np.square(err[-7:]))):5.2f}")
    loo = collections.defaultdict(list)
    for i in rows:
        p = greedy(np.delete(rows, i), 15)
        for S, _ in p: loo[len(S)].append(YC[i] - predict(S, np.delete(rows, i), PC[[i]])[0][0])
    for kk in (1, 2, 3, 5, 8, 12, 15):
        if len(loo[kk]) == len(rows):
            v = np.array(loo[kk]); print(f"  greedy pick of {kk:2d}                 rms {math.sqrt(np.mean(v ** 2)):5.2f}   2026 models {math.sqrt(np.mean(v[-7:] ** 2)):5.2f}")

    # 3. forward test: pick on models released before June 2026, predict the four after
    early = np.array([i for i, m in enumerate(CL) if sc[m]['date'] < '2026-06-01']); late = np.array([i for i in rows if i not in early])
    print(f"\nForward test: pick on {len(early)} models to {CL[early[-1]]}, predict " + ', '.join(CL[i] for i in late))
    fp = greedy(early, 15)
    for name, S in list(base.items()) + [(f'greedy {len(S)}', S) for S, _ in fp if len(S) in (2, 3, 5, 8, 12)]:
        pr, _ = predict(S, early, PC[late]); err = YC[late] - pr
        print(f"  {name:30s} errors " + ' '.join(f"{x:+5.1f}" for x in err) + f"   rms {math.sqrt(np.mean(err ** 2)):4.2f}")

    # 4. carry the frontier through picks: the full-data path, and 300 bootstrap picks
    targets = ['GPT-6.2 Astra', 'Claude Fable 5.2', 'GPT-6 Astra', 'GPT-6.1 Sol', 'Gemini 4 Argon']
    PT = np.array([vec(m) for m in targets])
    th_h = {k: math.log2(v / 60) for _, v, k, *_ in TH}
    HA = np.polyfit([A[ON_CHART[k]][2] for k in ON_CHART if k in th_h], [th_h[k] for k in ON_CHART if k in th_h], 1)
    hours = lambda a: 2 ** np.polyval(HA, a)
    def lab_offset(S):
        """Claude offset of METR horizon on this subset's ability (doublings): how Claude-favouring the pick is."""
        pe = [(k, e) for k, e in PAIR.items() if e in sc]; Pm = np.array([vec(e) for _, e in pe]); t, n = theta(Pm, S); ok = n >= 1
        y = np.array([th_h[k] for k, _ in pe]); c = np.array(['claude' in k for k, _ in pe], float)
        X = np.c_[np.ones(ok.sum()), t[ok] - 150, c[ok]]; bb, *_ = np.linalg.lstsq(X, y[ok], rcond=None); return bb[2], int(ok.sum())
    print('\nThe frontier through the picks (AECI scale; hours through the hours-view map; benchmarks used in brackets):')
    print(f"  {'pick':30s} " + ' '.join(f"{t:>22s}" for t in targets) + "   Claude offset vs METR")
    for name, S in list(base.items()) + [(f'greedy {len(S)}', S) for S, _ in path if len(S) in (3, 5, 8, 12, 15)]:
        pr, n = predict(S, rows, PT); off, no = lab_offset(S)
        print(f"  {name:30s} " + ' '.join(f"{v:6.1f} {hours(v):5.0f}h [{k:2d}]" if k else f"{'no coverage':>22s}" for v, k in zip(pr, n))
              + f"   {off:+.2f} ({no} models)")
    rng = np.random.default_rng(11); boot = []; freq = collections.Counter()
    for _ in range(300):
        rr = rng.choice(rows, len(rows)); rr = np.unique(rr) if len(np.unique(rr)) >= 8 else rows
        p = greedy(rr, 8)
        if not p: continue
        S = p[-1][0]; freq.update(BENCH[s] for s in S); pr, n = predict(S, rr, PT); boot.append(np.where(n > 0, pr, np.nan))
    boot = np.array(boot)
    print(f"\n  bootstrap picks of 8 ({len(boot)} runs), median and 10-90%:")
    for j, t in enumerate(targets):
        v = boot[:, j][~np.isnan(boot[:, j])]
        print(f"    {t:18s} {np.median(v):6.1f}  ({np.quantile(v, .1):.1f} to {np.quantile(v, .9):.1f}), {hours(np.median(v)):4.0f} h, covered in {len(v)} runs")
    print('  most-picked: ' + ', '.join(f"{b} {c / len(boot):.0%}" for b, c in freq.most_common(12)))

    # 5. the agentic imitation, carried by matched benchmarks: a new model's few agentic scores against a sibling's on the same
    # benchmarks, the difference added to the sibling's own AECI (Opus 5.5, real) or agentic-route AECI (GPT-6 Astra)
    AG = base['software + other agentic']; th_ag, _ = theta(PC, AG); b_ag, sse = line(th_ag, YC)
    b26, sse26 = line(th_ag[-7:], YC[-7:])
    print(f"\nAECI on agentic ability: slope {b_ag[1]:.2f}, scatter {math.sqrt(sse / 12):.2f} (14 models); 2026 models only: slope {b26[1]:.2f}, scatter {math.sqrt(sse26 / 5):.2f}")
    off, _ = lab_offset(AG)
    for new, sib, sib_aeci in (('GPT-6.2 Astra', 'GPT-6 Astra', None), ('Claude Fable 5.2', 'Claude Opus 5.5', AE['Claude Opus 5.5'])):
        vn, vs = vec(new), vec(sib); S = [i for i in AG if not np.isnan(vn[i]) and not np.isnan(vs[i])]
        tn, _ = theta(vn[None], S); ts, _ = theta(vs[None], S); d = float(tn[0] - ts[0])
        if sib_aeci is None: sib_aeci = float(predict(AG, rows, vs[None])[0][0])
        a = sib_aeci + b_ag[1] * d; claude = new.startswith('Claude')
        aeq = a if claude else a - off / (1 / 4.68)          # the offset in doublings, at the hours view's 4.68 points each
        print(f"  {new:17s} vs {sib:16s} on {len(S)} shared agentic benchmarks ({', '.join(BENCH[i] for i in S)}): {d:+.1f} ability "
              f"-> AECI {a:.1f} ({hours(a):.0f} h); horizon-equivalent {aeq:.1f} ({hours(aeq):.0f} h)")
    print(f"  (horizon-equivalent: an OpenAI model's AECI-route value less the Claude offset of horizon on agentic ability, {off:+.2f} doublings)")
