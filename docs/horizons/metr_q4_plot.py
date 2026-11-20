"""metr-q4.png: the three panels behind metr_q4.py's reading.

    python metr_q4_plot.py

(a) Claude models' horizons against AECI on three rulers, with the figure's map and the pooled one.
(b) The record series as the figure has it and rebuilt on METR's pooled ruler, each with its hyperbola and band.
(c) AECI against MCI for Claude models: the late stretch.

opus, 2026-11-20 (claude-opus-5-5)
"""
import contextlib, io, os, sys
import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import metr_q4 as Q
from fit import hyp_at

INK = dict(text='#161514', muted='#666463', accent='#983432', prussian='#3473A3', ochre='#8B681B', viridian='#317B55', violet='#7D60A6')
plt.rcParams.update({'font.family': 'serif', 'font.size': 9, 'axes.edgecolor': INK['muted'], 'axes.labelcolor': INK['text'],
                     'xtick.color': INK['muted'], 'ytick.color': INK['muted'], 'axes.spines.top': False, 'axes.spines.right': False})
fig, (axA, axB, axC) = plt.subplots(1, 3, figsize=(15, 4.8))
H = lambda v: 2.0 ** np.asarray(v)

# (a)
xs = np.linspace(124, 180, 200)
axA.plot(xs, H(Q.b0 + Q.b1 * (xs - 150)), color=INK['text'], lw=1, label=f"the figure's map, v1.1 ({1 / Q.b1:.2f} pts per doubling)")
axA.axvspan(Q.AE['Mythos Preview Early'], 180, color=INK['muted'], alpha=0.07, lw=0)
xp = np.linspace(150, 180, 100)
axA.plot(xp, H(Q.c0 + Q.c1 * (xp - 150)), color=INK['accent'], lw=1, label=f"through METR's pooled ruler ({1 / Q.c1:.2f})")
axA.plot(xp, H(Q.v0 + Q.v1 * (xp - 150)), color=INK['prussian'], lw=1, ls=(0, (4, 2)), label=f"through TH2 verifiable ({1 / Q.v1:.2f})")
axA.scatter([m['aeci'][0] for m in Q.pairs], H([m['th'][0] for m in Q.pairs]), s=18, color=INK['text'], zorder=3, label='v1.1 horizon')
axA.scatter([Q.A[Q.CHART[n]][2] for n in Q.claude], H([Q.COMB[n][1][0] for n in Q.claude]), s=22, color=INK['accent'], marker='D', zorder=3, label='pooled TH1.1 + TH2 (20 Nov)')
axA.scatter([Q.A[Q.CHART[n]][2] for n in Q.cv], H([Q.SEP['TH2 (Verifiable)'][n][1][0] for n in Q.cv]), s=22, facecolor='none', edgecolor=INK['prussian'], marker='^', zorder=3, label='TH2 verifiable (20 Nov)')
for n in Q.INTERNAL: axA.axvline(Q.A[n][2], ymax=0.04, color=INK['muted'], lw=1)
axA.set_yscale('log'); axA.set_xlim(124, 180); axA.set_xlabel('AECI (ticks: internal checkpoints)'); axA.set_ylabel('50% time horizon (hours)')
axA.set_title('(a) public Claude models: horizon on AECI', loc='left', fontsize=10, color=INK['text'])
axA.text(Q.AE['Mythos Preview Early'] + 0.7, 300, 'past the old map\'s\ncalibration', fontsize=8, color=INK['muted'], va='top')
axA.legend(fontsize=7, frameon=False, loc='upper left')

# (b)
for key, col, lab in (("the figure's series", INK['text'], "the figure's series"), ('spliced, with checkpoints', INK['accent'], "rebuilt on METR's pooled ruler")):
    R = Q.runs[key]; V = R['V']; h = V['hyp']; conv = [p[3] for p in V['points']]
    g = np.linspace(2019, min(h['ts'] - 1e-3, 2030), 800)
    axB.plot(g, H(hyp_at(g, h['a'], h['alpha'], h['ts'])), color=col, lw=1, label=f"{lab}: hyperbola, singularity {h['ts']:.2f} ({h['low']:.2f}–{h['high']:.2f})")
    bt = V['band']['t']; m = bt < 2030
    with np.errstate(over='ignore'): axB.fill_between(bt[m], H(np.minimum(V['band']['hyp'][m, 0], 30)), H(np.minimum(V['band']['hyp'][m, 1], 30)), color=col, alpha=0.08, lw=0)
    for ti, yi, c in zip(R['t'], R['y'], conv):
        axB.scatter(ti, H(yi), s=16, color=col if not c else 'white', edgecolor=col, zorder=3)
    axB.axvline(h['ts'], color=col, lw=0.6, ls=(0, (2, 3)))
axB.axhline(200, color=INK['muted'], lw=0.6, ls=(0, (1, 2))); axB.text(2019.2, 230, "200 h: the pooled suite's longest threshold", fontsize=7, color=INK['muted'])
axB.set_yscale('log'); axB.set_ylim(1e-3, 1e5); axB.set_xlim(2019, 2030); axB.set_xlabel('date (open: converted from AECI)')
axB.set_title('(b) the record, and where its hyperbola puts the singularity', loc='left', fontsize=10, color=INK['text'])
axB.legend(fontsize=7, frameon=False, loc='upper left')

# (c)
late = Q.tm >= 2025.75
axC.scatter(Q.xm[~late], Q.ya[~late], s=18, color=INK['text'], zorder=3, label='Claude, before October 2025')
axC.scatter(Q.xm[late], Q.ya[late], s=22, color=INK['accent'], marker='D', zorder=3, label='Claude, after')
xx = np.linspace(-120, 900, 200)
axC.plot(xx, Q.e0 + Q.e1 * xx, color=INK['text'], lw=1, ls=(0, (4, 2)), label=f'the early line carried forward ({Q.e1 * 100:.1f} per 100 MCI)')
axC.plot(xx, Q.bk[0] + Q.bk[1] * xx + Q.bk[2] * np.maximum(xx - Q.kink, 0), color=INK['accent'], lw=1,
         label=f'joined line: {Q.bk[1] * 100:.1f} then {(Q.bk[1] + Q.bk[2]) * 100:.1f} per 100 MCI')
for n in ('Claude Opus 5.5', 'Claude Opus 4.5', 'Claude 3.7 Sonnet'):
    axC.annotate(n[7:], (Q.MCI[n][1], Q.A[Q.CHART[n]][2]), textcoords='offset points', xytext=(5, -10), fontsize=7, color=INK['muted'])
axC.set_xlabel('MCI (METR Capability Index, 20 Nov)'); axC.set_ylabel('AECI')
axC.set_title('(c) AECI stretches against METR\'s own index', loc='left', fontsize=10, color=INK['text'])
axC.legend(fontsize=7, frameon=False, loc='upper left')

fig.tight_layout(); fig.savefig(os.path.join(HERE, 'metr-q4.png'), dpi=160); print('ok')
