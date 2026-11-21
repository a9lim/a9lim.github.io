"""The agentic imitation of AECI (aeci_subset.py) against METR's measured horizons, then every lab's models on it.
Opus 5.5 (claude-opus-5-5), 2026-11-19, with a9; see AGENTS.md, "Picking benchmarks to imitate AECI".

    python aeci_imitation.py      # tables, then aeci-imitation.png

Approximated AECI = the line of AECI on agentic ability (Epoch's software + other agentic benchmarks, maximum likelihood with
saturated scores kept) through the 14 public Claude models. Speculative: one lab's index, imitated from another's benchmarks.
"""
import math, os, sys, io, contextlib, datetime as dt
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import aeci_subset as S
    import oeci as O
from series import TH, PAIR, AECI, ON_CHART, yr, day, NAME
sc = S.sc; A = {a[0]: a for a in AECI}
AG = [S.BI[b] for b in O.DOM['SWE/agentic coding'] + O.DOM['other agentic'] if b in S.BI]
SW = [S.BI[b] for b in O.DOM['SWE/agentic coding'] if b in S.BI]
ALL = list(range(len(S.BENCH)))

def ability(models, idx):
    """MLE ability, a jackknife standard error over the model's own benchmarks (benchmark sampling, as Epoch's bootstrap
    intervals are; one-trial Fisher information would treat a whole benchmark as one item), and the number of benchmarks."""
    P = np.array([S.vec(m) for m in models]); th, n = S.theta(P, idx)
    has = ~np.isnan(P[:, idx]); J = np.full(has.shape, np.nan)
    for j in range(len(idx)):
        if has[:, j].any():
            sub = [x for k, x in enumerate(idx) if k != j]; tj, nj = S.theta(P[has[:, j]], sub); J[has[:, j], j] = np.where(nj > 0, tj, np.nan)
    m_ = np.nanmean(J, 1); se = np.sqrt((n - 1) / np.maximum(n, 1) * np.nansum((J - m_[:, None]) ** 2, 1))
    return th, np.where(n >= 2, se, np.nan), n

th_c, _, _ = ability(S.CL, AG); B, _ = S.line(th_c, S.YC)
def approx(th): return B[0] + B[1] * (th - 160)
HAf = np.polyfit([A[ON_CHART[k]][2] for k in ON_CHART if k in {k for _, _, k, *_ in TH}],
                 [math.log2(v / 60) for k in ON_CHART for _, v, kk, *_ in TH if kk == k], 1)
hours = lambda a: 2 ** np.polyval(HAf, a)
LAB = lambda m: O.lab(m) if m in sc else 'other'

def horizon_table():
    th_h = {k: math.log2(v / 60) for _, v, k, *_ in TH}; date = {k: t for t, _, k, *_ in TH}
    pe = [(k, e) for k, e in PAIR.items() if e in sc]
    meas = {'published ECI': np.array([float(sc[e]['eci']) for _, e in pe])}
    for name, idx in (('all benchmarks (MLE)', ALL), ('software only (MLE)', SW), ('software + agentic (MLE)', AG)):
        t, se, n = ability([e for _, e in pe], idx); meas[name] = np.where(n >= 2, t, np.nan)
    meas['software ECI (implied, old)'] = np.array([O.swe(e) if O.swe(e) is not None else np.nan for _, e in pe])
    keep = np.all([~np.isnan(v) for v in meas.values()], axis=0)
    y = np.array([th_h[k] for k, _ in pe])[keep]; c = np.array(['claude' in k for k, _ in pe], float)[keep]
    t = np.array([date[k] for k, _ in pe])[keep]; early = t < 2025.45
    print(f"METR measured horizon on each ability, same {keep.sum()} models ({int(c.sum())} Claude); forward = fit before mid-2025, "
          f"predict the {int((~early).sum())} after ({', '.join(NAME.get(k, k) for (k, _), kp in zip(pe, keep) if kp and date[k] >= 2025.45)})")
    print(f"  {'ability':28s} {'pts/dbl':>7s} {'scatter':>7s} {'LOO':>6s} {'Claude offset':>14s} {'scatter w/':>10s} {'forward':>8s} {'fwd bias':>8s} {'early pts/dbl':>13s}")
    for name, v in meas.items():
        x = v[keep] - 150; X = np.c_[np.ones_like(x), x]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b
        loo = [y[i] - np.r_[1, x[i]] @ np.linalg.lstsq(np.delete(X, i, 0), np.delete(y, i), rcond=None)[0] for i in range(len(y))]
        X2 = np.c_[X, c]; b2, *_ = np.linalg.lstsq(X2, y, rcond=None); r2 = y - X2 @ b2; s2 = r2 @ r2 / (len(y) - 3)
        se = math.sqrt(s2 * np.linalg.inv(X2.T @ X2)[2, 2])
        bf, *_ = np.linalg.lstsq(X[early], y[early], rcond=None); ef = y[~early] - X[~early] @ bf
        print(f"  {name:28s} {1 / b[1]:7.2f} {math.sqrt(r @ r / (len(y) - 2)):7.2f} {math.sqrt(np.mean(np.square(loo))):6.2f} "
              f"{b2[2]:+7.2f} ({se:.2f}) {math.sqrt(s2):10.2f} {math.sqrt(np.mean(ef ** 2)):8.2f} {ef.mean():+8.2f} {1 / bf[1]:13.2f}")
    print('  (doublings of horizon; offset > 0: Claude has the longer horizon at equal ability)')

def everyone(since='2024-01-01', nmin=3):
    ms = [m for m in sc if sc[m]['date'] >= since and float(sc[m]['eci']) >= 135]
    th, se, n = ability(ms, AG)
    return [dict(m=ms[i], t=yr(sc[ms[i]]['date']), lab=LAB(ms[i]), v=float(approx(th[i])), se=float(B[1] * se[i]), n=int(n[i]))
            for i in range(len(ms)) if n[i] >= nmin]

if __name__ == '__main__':
    print(f"approximated AECI = {B[0]:.1f} + {B[1]:.3f} (agentic ability - 160), 14 public Claude models\n")
    horizon_table()
    rows = everyone()
    print(f"\n{len(rows)} models since 2024 with 3+ agentic benchmarks. Frontier by lab, last six records:")
    for lab in ('OpenAI', 'Anthropic', 'Google'):
        rec = O.records([(r['t'], r['v'], r['m']) for r in rows if r['lab'] == lab])
        print(f"  {lab:9s} " + ', '.join(f"{m} {v:.1f}" for t, v, m in rec[-6:]))
        s = O.slope(rec, 2026.0); s25 = O.slope(rec, 2025.0, 2026.0)
        print(f"            2025 {s25[0] if s25 else float('nan'):5.1f} pts/yr, 2026 {s[0] if s else float('nan'):5.1f} pts/yr "
              f"({(s[0] / 4.68) if s else float('nan'):.1f} doublings/yr at 4.68 points each)")
    for m in ('Claude Fable 5.2', 'GPT-6 Astra', 'GPT-6.1 Sol', 'Claude Opus 5.5', 'Gemini 4 Argon', 'GPT-6.2 Astra'):
        r = next((r for r in rows if r['m'] == m), None)
        if r: print(f"  {m:18s} {r['v']:6.1f} ± {r['se']:.1f}  ({hours(r['v']):.0f} h, {r['n']} benchmarks)")
        else: print(f"  {m:18s} fewer than 3 agentic benchmarks")

    # ---- the figure
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt, matplotlib.dates as mdates
    LABELS = {'Claude Fable 5.2': (-6, 8), 'Claude Opus 5.5': (-8, 8), 'Claude Fable 5': (-6, 6), 'GPT-6 Astra': (-6, 4), 'GPT-5.6 Sol': (-6, 6),
              'Gemini 4 Argon': (14, -14), 'GPT-5.2': (-6, 6)}
    COL = {'Anthropic': '#c96442', 'OpenAI': '#2f6db5', 'Google': '#3a9b5c', 'other': '#a0a0a0'}
    D = lambda t: dt.datetime.combine(day(t), dt.time())
    fig, (ax, bx) = plt.subplots(1, 2, figsize=(15, 6.6), gridspec_kw=dict(width_ratios=[1.75, 1], wspace=0.42))
    for lab in ('other', 'Google', 'OpenAI', 'Anthropic'):
        rr = [r for r in rows if r['lab'] == lab]
        ax.errorbar([D(r['t']) for r in rr], [r['v'] for r in rr], yerr=[r['se'] for r in rr], fmt='o', ms=4.5 if lab != 'other' else 3,
                    color=COL[lab], alpha=0.35 if lab == 'other' else 0.55, elinewidth=0.7, lw=0, zorder=2)
        if lab == 'other': continue
        rec = O.records([(r['t'], r['v'], r['m']) for r in rr])
        ax.plot([D(t) for t, *_ in rec], [v for _, v, _ in rec], '-o', color=COL[lab], ms=5.5, lw=1.8, zorder=3,
                label={'Anthropic': 'Claude', 'OpenAI': 'OpenAI', 'Google': 'Google'}[lab] + ' (approximated AECI; record joined)')
        for t, v, m in rec:
            if m in LABELS: ax.annotate(m.replace('Claude ', ''), (D(t), v), xytext=LABELS[m], textcoords='offset points', ha='right', fontsize=7.5, color=COL[lab])
    # real AECI: public Claude by release date, internal checkpoints by METR's chart date
    pub = [(yr(sc[e]['date']), A[k][2]) for k, e in S.PUBLIC.items() if e in sc and sc[e]['date'] >= '2024-01-01']
    ax.scatter([D(t) for t, _ in pub], [v for _, v in pub], marker='s', s=26, facecolor='none', edgecolor='k', lw=1, zorder=4,
               label="Anthropic's AECI, public Claude models")
    it = [(a[1], a[2], a[0]) for a in AECI if a[3] == 'internal']
    ax.scatter([D(t) for t, *_ in it], [v for _, v, _ in it], marker='D', s=22, facecolor='white', edgecolor='#555', lw=1, zorder=4,
               label="Anthropic's AECI, internal checkpoints (chart date)")
    ax.annotate('Model 4', (D(it[-1][0]), it[-1][1]), xytext=(-6, 5), textcoords='offset points', ha='right', fontsize=7.5, color='#555')
    # GPT-6.2 Astra: one agentic benchmark, carried from GPT-6 Astra on it (aeci_subset.py, section 5)
    g6 = next(r for r in rows if r['m'] == 'GPT-6 Astra'); P2 = np.array([S.vec('GPT-6.2 Astra'), S.vec('GPT-6 Astra')])
    sh = [i for i in AG if not np.isnan(P2[:, i]).any()]; tt, _ = S.theta(P2, sh); v62 = g6['v'] + B[1] * float(tt[0] - tt[1])
    ax.scatter([D(O.OECI['GPT-6.2 Astra']['t'])], [v62], marker='o', s=40, facecolor='white', edgecolor=COL['OpenAI'], lw=1.5, zorder=5,
               label='GPT-6.2 Astra, carried from GPT-6 Astra on MirrorCode alone')
    ax.annotate('GPT-6.2 Astra', (D(O.OECI['GPT-6.2 Astra']['t']), v62), xytext=(4, -12), textcoords='offset points', ha='center', fontsize=7.5, color=COL['OpenAI'])
    ax.set_xlim(D(2024.0), D(2026.97)); ax.set_ylim(118, 186); ax.grid(alpha=0.25, lw=0.6)
    ax.xaxis.set_major_locator(mdates.MonthLocator(bymonth=(1, 7))); ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
    ax.set_ylabel('approximated AECI (agentic ability through the Claude line)')
    ra = ax.twinx(); ra.set_ylim(*ax.get_ylim()); hs = [0.25, 1, 4, 16, 64, 256]
    ra.set_yticks([(math.log2(h) - HAf[1]) / HAf[0] for h in hs]); ra.set_yticklabels([f'{h:g} h' for h in hs])
    ra.set_ylabel("50% horizon through the hours view's map")
    ax.legend(fontsize=7.5, loc='upper left', frameon=False)
    ax.set_title('Every lab on an imitation of AECI', loc='left', fontsize=12, fontweight='bold')
    ax.text(0.99, 0.02, 'models with 3+ of Epoch\'s software and agentic benchmarks; bars ±1 se', transform=ax.transAxes,
            ha='right', va='bottom', fontsize=7, color='#555')
    # right: METR's measured horizons against the imitation
    th_h = {k: math.log2(v / 60) for _, v, k, *_ in TH}; pe = [(k, e) for k, e in PAIR.items() if e in sc]
    t_, se_, n_ = ability([e for _, e in pe], AG)
    for (k, e), t, s, n in zip(pe, t_, se_, n_):
        if n < 2: continue
        lab = 'Anthropic' if 'claude' in k else LAB(e)
        bx.errorbar([approx(t)], [2 ** th_h[k]], xerr=[B[1] * s], fmt='o', ms=5, color=COL[lab], elinewidth=0.7, alpha=0.85)
        if e in ('GPT-5', 'GPT-5.4', 'Claude Opus 4.6', 'o3', 'Gemini 3.1 Pro', 'Claude 3.7 Sonnet'):
            bx.annotate(e.replace('Claude ', ''), (approx(t), 2 ** th_h[k]), xytext=(5, -3), textcoords='offset points', fontsize=7, color=COL[lab])
    xx = np.linspace(125, 175, 50); bx.plot(xx, hours(xx), color='k', lw=1, ls='--', label="hours view's map (AECI to horizon, 8 Claude models)")
    bx.set_yscale('log', base=2); bx.set_yticks([1 / 60 * 4, 0.25, 1, 4, 16]); bx.set_yticklabels(['4 min', '15 min', '1 h', '4 h', '16 h'])
    bx.set_xlabel('approximated AECI'); bx.set_ylabel("METR's measured 50% horizon"); bx.grid(alpha=0.25, lw=0.6)
    for lab, nm in (('Anthropic', 'Claude'), ('OpenAI', 'OpenAI'), ('Google', 'Google')): bx.scatter([], [], color=COL[lab], label=nm)
    bx.legend(fontsize=7.5, loc='upper left', frameon=False)
    bx.set_title("Checked against METR's measurements", loc='left', fontsize=12, fontweight='bold')
    fig.suptitle('Approximated AECI: Epoch\'s agentic benchmarks, scaled to match AECI on 14 public Claude models', x=0.06, ha='left',
                 fontsize=13.5, fontweight='bold', y=1.0)
    fig.text(0.06, 0.945, f"approx. AECI = {B[0]:.1f} + {B[1]:.2f} × (agentic ability − 160). Speculative: it assumes AECI would treat other labs' models "
             "like Claude's at equal agentic ability. Epoch data 12 Nov, with 19 Nov pages for GPT-6.2 Astra, GPT-6 Astra and Fable 5.2.",
             fontsize=8, color='#444', ha='left')
    fig.savefig(os.path.join(HERE, 'aeci-imitation.png'), dpi=150, bbox_inches='tight', facecolor='white')
    print('\nwrote aeci-imitation.png')
