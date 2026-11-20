"""Horizon on AECI and on ECI, split by lab: which index tracks METR's horizons. Opus 5.5, 2026-11-12."""
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt, matplotlib.patheffects as pe
from series import AECI, ECI, TH, PAIR, ON_CHART, NAME, WHISKER

INK, MUTED, BORDER, GROUND, FIT, OTHER = '#161514', '#666463', '#E2E1E0', '#FCFCFB', '#3473A3', '#8B681B'
plt.rcParams.update({'font.family': 'serif', 'font.serif': ['Georgia', 'DejaVu Serif'], 'font.size': 11, 'axes.edgecolor': MUTED,
                     'axes.labelcolor': MUTED, 'xtick.color': MUTED, 'ytick.color': MUTED, 'figure.facecolor': GROUND, 'axes.facecolor': GROUND})
halo = [pe.withStroke(linewidth=3.5, foreground=GROUND)]
A = {a[0]: a for a in AECI}
th = {k: tuple(np.log2(x / 60) for x in (v, lo, hi)) for t, v, k, s, lo, hi in TH}
short = lambda k: NAME.get(k, {'claude_4_1_opus_inspect': 'Claude Opus 4.1', 'gemini_3_1_pro': 'Gemini 3.1 Pro', 'gpt_5_4': 'GPT-5.4',
                              'gpt_4_turbo_inspect': 'GPT-4 Turbo (Apr 2024)'}.get(k, k)).replace('Claude ', '')
# rows: key, score, score lo, score hi, horizon (log2 h), lo, hi, is Claude
HA = [(k, A[c][2], *WHISKER.get(c, (None, None)), *th[k], True) for k, c in ON_CHART.items()]
HE = [(k, *ECI[e][1:], *th[k], 'claude' in k) for k, e in PAIR.items()]
TQ = {6: 2.447, 18: 2.101}

def line(rows):
    x = np.array([r[1] for r in rows]); y = np.array([r[4] for r in rows]); n = len(x)
    X = np.c_[np.ones(n), x - 150]; b, *_ = np.linalg.lstsq(X, y, rcond=None); r = y - X @ b; s = np.sqrt(r @ r / (n - 2))
    Vi = np.linalg.inv(X.T @ X)
    loo = [y[i] - X[i] @ np.linalg.lstsq(X[np.arange(n) != i], y[np.arange(n) != i], rcond=None)[0] for i in range(n)]
    pi = lambda g: TQ[n - 2] * s * np.sqrt(1 + Vi[0, 0] + 2 * Vi[0, 1] * (g - 150) + Vi[1, 1] * (g - 150) ** 2)
    return dict(b=b, s=s, n=n, loo=np.sqrt(np.mean(np.square(loo))), f=lambda g: b[0] + b[1] * (g - 150), pi=pi, hi=x.max(), lo=x.min())

YT = [(-np.log2(60), '1 min'), (np.log2(10 / 60), '10 min'), (0, '1 hr'), (3, '1 day'), (np.log2(40), '1 wk'), (np.log2(200), '5 wk')]
fig, axes = plt.subplots(1, 2, figsize=(13, 6.4), sharey=True)
panels = [(axes[0], HA, 'AECI (METR)', (119, 181), 179, 'the 7 AECI-only checkpoints are converted up to here'),
          (axes[1], HE, 'ECI (Epoch)', (116, 178), 174.24, 'ECI-only models are converted up to here')]
for ax, rows, xl, (x0, x1), xmax, note in panels:
    L = line(rows)
    g = np.linspace(x0, L.hi if False else L['hi'], 200); ge = np.linspace(L['hi'], xmax, 50)
    ax.axvspan(L['hi'], xmax, color=MUTED, alpha=0.07, lw=0)
    ax.text(L['hi'] + 0.5, -4.7, 'extrapolated', fontsize=9, color=MUTED, style='italic')
    ax.fill_between(g, L['f'](g) - L['pi'](g), L['f'](g) + L['pi'](g), color=FIT, alpha=0.12, lw=0)
    ax.fill_between(ge, L['f'](ge) - L['pi'](ge), L['f'](ge) + L['pi'](ge), color=FIT, alpha=0.06, lw=0)
    ax.plot(g, L['f'](g), color=FIT, lw=2); ax.plot(ge, L['f'](ge), color=FIT, lw=2, ls=(0, (2, 2)))
    for k, xv, xlo, xhi, yv, ylo, yhi, cl in rows:
        c = INK if cl else OTHER
        ax.plot([xv, xv], [ylo, yhi], color=c, lw=0.8, alpha=0.35, zorder=2)
        if xlo is not None and xhi is not None and xhi > xlo: ax.plot([xlo, xhi], [yv, yv], color=c, lw=0.8, alpha=0.35, zorder=2)
        ax.scatter([xv], [yv], s=40, zorder=5, color=c if cl else GROUND, edgecolor=GROUND if cl else OTHER, linewidth=1.5 if cl else 1.6)
    if rows is HE:
        for sub, col in ((True, INK), (False, OTHER)):
            S = line([r for r in rows if r[7] == sub]); gg = np.linspace(S['lo'], S['hi'], 50)
            ax.plot(gg, S['f'](gg), color=col, lw=1.1, ls=(0, (5, 3)), zorder=3)
        lab = {'gpt_5_4': (6, -12), 'gemini_3_1_pro': (-8, 6), 'claude_opus_4_6_inspect': (-8, 6), 'gpt_4': (6, -12), 'o1_inspect': (6, -12), 'claude_4_opus_inspect': (-8, 6)}
        sub = {s: line([r for r in rows if r[7] == s]) for s in (True, False)}
        txt = (f"all 20: {1 / L['b'][1]:.2f} points per doubling, scatter {L['s']:.2f} doublings (leave-one-out {L['loo']:.2f})\n"
               f"Claude 8: {1 / sub[True]['b'][1]:.2f} per doubling, scatter {sub[True]['s']:.2f}  ·  others 12: {1 / sub[False]['b'][1]:.2f}, scatter {sub[False]['s']:.2f}\n"
               f"at ECI 150, Claude {2 ** sub[True]['f'](150):.1f} h, others {2 ** sub[False]['f'](150):.1f} h")
    else:
        lab = {'claude_mythos_preview_early_inspect': (-8, 6), 'claude_opus_4_6_inspect': (-8, 6), 'claude_3_opus_inspect': (8, -12), 'claude_3_7_sonnet_inspect': (8, -12), 'claude_opus_4_5_inspect': (8, -12)}
        txt = f"8 Claude models: {1 / L['b'][1]:.2f} points per doubling, scatter {L['s']:.2f} doublings (leave-one-out {L['loo']:.2f})"
    for k, xv, _, _, yv, *_ in rows:
        if k in lab: ax.annotate(short(k), (xv, yv), xytext=lab[k], textcoords='offset points', fontsize=9, color=INK, ha='right' if lab[k][0] < 0 else 'left', path_effects=halo, zorder=8)
    ax.text(0.02, 0.98, txt, transform=ax.transAxes, va='top', fontsize=9.2, color=INK, linespacing=1.5)
    ax.set_xlim(x0, x1); ax.set_ylim(-5, 8.6); ax.set_xlabel(xl)
    ax.set_yticks([v for v, _ in YT]); ax.set_yticklabels([l for _, l in YT])
    ax.grid(color=BORDER, lw=0.8); ax.set_axisbelow(True)
    for sp in ('top', 'right'): ax.spines[sp].set_visible(False)
axes[0].set_ylabel('50% time horizon (METR), work time')
axes[0].set_title('horizon on AECI', loc='left', fontsize=12, color=INK, style='italic')
axes[1].set_title('horizon on ECI', loc='left', fontsize=12, color=INK, style='italic')
H = [plt.Line2D([], [], marker='o', ls='', color=INK, ms=6, label='Claude model'),
     plt.Line2D([], [], marker='o', ls='', mfc=GROUND, mec=OTHER, mew=1.6, ms=6, label='other lab'),
     plt.Line2D([], [], color=FIT, lw=2, label='least squares, all models (95% prediction band)'),
     plt.Line2D([], [], color=MUTED, lw=1.1, ls=(0, (5, 3)), label='least squares within one lab')]
fig.legend(handles=H, loc='lower center', ncol=4, frameon=False, fontsize=10, bbox_to_anchor=(0.5, -0.005))
fig.text(0.5, 0.075, "On the 7 Claude models with all three, AECI tracks horizon a little closer: leave-one-out 0.23 vs 0.32 doublings, better on 4 of 7.",
         ha='center', fontsize=10, color=MUTED, style='italic')
fig.tight_layout(rect=(0, 0.1, 1, 1))
fig.savefig(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'horizon-vs-scores.png'), dpi=160); print('ok')
