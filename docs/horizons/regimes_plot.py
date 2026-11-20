"""regimes.png: the panels behind regimes.py.

    python regimes_plot.py      # about a minute (it runs regimes.py first)

(a, b) Two record series with the double exponential, one break and two breaks, run on to 2028: the figure's series,
       where the second drop comes from the checkpoints on the v1.1 map, and METR's pooled suite with the checkpoints.
(c)    Each curve's doubling time on the pooled series, against the measured pace in three windows.
(d)    Double exponential against two breaks: where the real series sits among histories simulated from each.
(e)    A second drop: where the real series sits among one-break histories.
(f)    Half-year forecast errors from rolling origins.

Colours are three of the site's inks (indigo, ochre, madder), checked with the dataviz validator; each curve also has
its own line style. Red marks the real series' statistic.

opus, 2026-11-20 (claude-opus-5-5)
"""
import contextlib, io, os, sys
import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt, matplotlib.ticker
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import regimes as R
from series import yr

INK, MUTED, BORDER, GROUND, RED = '#161514', '#666463', '#E2E1E0', '#FCFCFB', '#983432'
MODEL = {'double exponential': ('#586AB2', '-', 'o', 'double exponential'),
         'one slope change': ('#8B681B', (0, (6, 2.5)), 's', 'one drop'),
         'two slope changes': ('#A65179', (0, (6, 2, 1.5, 2)), '^', 'two drops')}
plt.rcParams.update({'font.family': 'serif', 'font.serif': ['Georgia', 'DejaVu Serif'], 'font.size': 9.5, 'axes.edgecolor': MUTED,
                     'axes.labelcolor': INK, 'xtick.color': MUTED, 'ytick.color': MUTED, 'figure.facecolor': GROUND,
                     'axes.facecolor': GROUND, 'axes.spines.top': False, 'axes.spines.right': False})
KEYS = list(R.SERIES)
SHORT = ["the figure's (old AECI map)", 'v1.1 measured', 'v1.1, then pooled, measured', '  + checkpoints, pooled map',
         '  + public models through ECI']
RUNS = {KEYS[0]: R.Q.runs["the figure's series"], KEYS[3]: R.Q.runs['spliced, with checkpoints']}
fig, ax = plt.subplots(2, 3, figsize=(17, 10))
title = lambda a, s: a.set_title(s, loc='left', fontsize=11, color=INK, style='italic')
grid = np.linspace(2019.0, 2028.2, 900)
YT = [(1 / 60, '1 min'), (1, '1 h'), (8, '8 h'), (40, '1 wk'), (200, '5 wk'), (2000, '1 yr'), (20000, '10 yr')]

# (a, b) the series and the three curves, on to 2028
for a, key, name in ((ax[0, 0], KEYS[0], "(a) the figure's series: the second drop is the checkpoints on the old map"),
                     (ax[0, 1], KEYS[3], "(b) METR's pooled suite with the checkpoints: one drop does"),):
    o = R.out[key]; t, y, F = o['t'], o['y'], o['F']; conv = [p[3] for p in RUNS[key]['V']['points']]
    a.axvspan(t.max(), grid[-1], color=MUTED, alpha=0.06, lw=0)
    a.axhline(200, color=MUTED, lw=0.7, ls=(0, (1, 2))); a.text(2019.1, 200 * 1.25, "200 h: the pooled suite's longest threshold", fontsize=8, color=MUTED)
    for m, (col, ls, mk, lab) in MODEL.items():
        f = F[m]; a.plot(grid, 2.0 ** f['pred'](grid), color=col, lw=1.6, ls=ls, label=lab)
        for c in ((f['c'],) if m == 'one slope change' else f['c'] if m == 'two slope changes' else ()):
            a.plot([c], [2.0 ** float(f['pred'](c))], marker='|', ms=11, mew=1.6, color=col)
    a.scatter(t[[not c for c in conv]], 2.0 ** y[[not c for c in conv]], s=20, color=INK, zorder=4, label='measured')
    if any(conv): a.scatter(t[conv], 2.0 ** y[conv], s=22, facecolor=GROUND, edgecolor=INK, lw=1.1, zorder=4, label='converted from AECI')
    a.set_yscale('log'); a.set_ylim(5e-4, 3e5); a.set_xlim(2019, grid[-1])
    a.set_yticks([v for v, _ in YT]); a.set_yticklabels([l for _, l in YT]); a.set_xlabel('date (shaded: past the data)')
    a.grid(color=BORDER, lw=0.6); a.set_axisbelow(True); title(a, name)
    a.legend(fontsize=8, frameon=False, loc='upper left', bbox_to_anchor=(0, 0.93))
ax[0, 0].set_ylabel('record 50% time horizon')

# (c) doubling time: the curves on the pooled series against the measured pace by window
a = ax[0, 2]; o = R.out[KEYS[3]]; F = o['F']
d = F['double exponential']; a.plot(grid, R.dexp_months(d, grid), color=MODEL['double exponential'][0], lw=1.6, label='double exponential')
for m in ('one slope change', 'two slope changes'):
    f = F[m]; col, ls, _, lab = MODEL[m]; knots = (f['c'],) if m == 'one slope change' else f['c']
    edges = [2019.0, *knots, grid[-1]]; slopes = np.cumsum(f['b'][1:])
    for i in range(len(edges) - 1):
        a.plot(edges[i:i + 2], [R.months(slopes[i])] * 2, color=col, lw=1.6, ls=ls, label=lab if i == 0 else None)
        if i: a.plot([edges[i]] * 2, [R.months(slopes[i - 1]), R.months(slopes[i])], color=col, lw=1.0, ls=ls)
f0 = R.out[KEYS[0]]['F']['two slope changes']; s0 = np.cumsum(f0['b'][1:]); e0 = [2019.0, *f0['c'], grid[-1]]
for i in range(3):
    a.plot(e0[i:i + 2], [R.months(s0[i])] * 2, color=MODEL['two slope changes'][0], lw=1.6, ls=(0, (1, 1.5)),
           label="two drops on the figure's series" if i == 0 else None)
a.annotate(f"{R.months(s0[2]):.1f} mo", (grid[-1], R.months(s0[2])), xytext=(0, -11), textcoords='offset points', fontsize=8, color=INK, ha='right')
for k, (v, se, n, t0, t1) in enumerate(R.PACES):
    mid = (t0 + t1) / 2
    a.plot([t0, t1], [R.months(v)] * 2, color=INK, lw=3, solid_capstyle='butt', alpha=0.85, label='measured pace by window (68%)' if k == 0 else None)
    a.plot([mid, mid], [R.months(v + se), R.months(v - se)], color=INK, lw=1.2)
    a.annotate(f'{R.months(v):.1f} mo', (t0, R.months(v)), xytext=(1, -12) if k == 0 else (-4, -3), textcoords='offset points',
               fontsize=8, color=INK, ha='left' if k == 0 else 'right')
tr = R.TREND; t_from, t_to = yr(tr["from"]), yr(tr["to"])
a.plot([t_from, t_to], [tr['doubling_months']] * 2, color=MUTED, lw=1, ls=(0, (2, 2)))
a.annotate(f"METR's line, {tr['doubling_months']:.1f} mo", (t_from, tr['doubling_months']), xytext=(-2, 6), textcoords='offset points', fontsize=8, color=MUTED, ha='right')
a.set_yscale('log'); a.set_ylim(1.2, 24); a.set_xlim(2019, grid[-1])
a.set_yticks([1.5, 2, 3, 4, 6, 8, 12, 18]); a.set_yticklabels(['1.5', '2', '3', '4', '6', '8', '12', '18'])
a.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
a.set_ylabel('doubling time (months)'); a.set_xlabel('date')
a.grid(color=BORDER, lw=0.6); a.set_axisbelow(True); title(a, '(c) doubling time: smooth, stepped, and measured')
a.legend(fontsize=8, frameon=False, loc='upper right')

# (d, e) the real series among simulated ones; (f) rolling forecasts
rows = np.arange(5)[::-1]
def strip(a, row, v, col, dy):
    q = np.percentile(v, [5, 25, 50, 75, 95])
    a.plot([q[0], q[4]], [row + dy] * 2, color=col, lw=1)
    a.add_patch(plt.Rectangle((q[1], row + dy - 0.11), q[3] - q[1], 0.22, facecolor=col, alpha=0.35, edgecolor=col, lw=1))
    a.plot([q[2]] * 2, [row + dy - 0.11, row + dy + 0.11], color=col, lw=1.6)
for a, name, xl in ((ax[1, 0], '(d) double exponential or two drops?', 'AICc(double exponential) − AICc(two drops): right favors two drops'),
                    (ax[1, 1], '(e) is there a second drop?', 'AICc(one drop) − AICc(two drops): right favors a second drop')):
    for row, key in zip(rows, KEYS[:5]):
        o = R.out[key]
        if a is ax[1, 0]:
            strip(a, row, o['under_d'], MODEL['double exponential'][0], 0.16); strip(a, row, o['under_p'], MODEL['two slope changes'][0], -0.16)
            obs = o['D']
        else:
            strip(a, row, o['under_1'], MODEL['one slope change'][0], 0); obs = o['D12']
        a.plot([obs], [row], marker='D', ms=7, color=RED, zorder=5)
    a.axvline(0, color=MUTED, lw=0.8)
    a.set_yticks(rows); a.set_yticklabels(SHORT); a.set_ylim(-0.6, 4.6); a.set_xlabel(xl)
    a.grid(axis='x', color=BORDER, lw=0.6); a.set_axisbelow(True); title(a, name)
H = [plt.Line2D([], [], color=MODEL['double exponential'][0], lw=6, alpha=0.5, label='from double-exponential histories'),
     plt.Line2D([], [], color=MODEL['two slope changes'][0], lw=6, alpha=0.5, label='from two-drop histories'),
     plt.Line2D([], [], marker='D', ls='', color=RED, label='the real series')]
ax[1, 0].set_xlim(None, 44); ax[1, 0].legend(handles=H, fontsize=8, frameon=False, loc='center right')
ax[1, 1].legend(handles=[plt.Line2D([], [], color=MODEL['one slope change'][0], lw=6, alpha=0.5, label='from one-drop histories'), H[2]],
                fontsize=8, frameon=False, loc='lower right')

a = ax[1, 2]
for row, key in zip(rows, KEYS[:5]):
    half = R.out[key]['rolling']['half']
    for j, (m, (col, ls, mk, lab)) in enumerate([*MODEL.items(), ('hyperbolic', (MUTED, '-', 'x', 'hyperbola'))]):
        e = np.concatenate([v for _, v in half[m]]); a.plot([np.sqrt(np.mean(e ** 2))], [row + 0.24 - 0.16 * j], marker=mk, ms=7,
                                                           ls='', color=col, mfc=col if mk != 'x' else None, label=lab if row == rows[0] else None)
a.set_yticks(rows); a.set_yticklabels(SHORT); a.set_ylim(-0.6, 4.6); a.set_xlim(0, None)
a.set_xlabel('rms error of every forecast up to half a year ahead (doublings)')
a.grid(axis='x', color=BORDER, lw=0.6); a.set_axisbelow(True); title(a, '(f) forecasts from rolling origins (lower is better)')
a.legend(fontsize=8, frameon=False, loc='lower right')

fig.tight_layout(); fig.savefig(os.path.join(HERE, 'regimes.png'), dpi=150); print('ok')
