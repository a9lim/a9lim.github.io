"""Plot: horizon on software ECI, and software ECI on AECI (software-eci.png). Opus 5.5, 2026-11-12."""
import sys, os, io, contextlib, math, runpy
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt, matplotlib.patheffects as pe
with contextlib.redirect_stdout(io.StringIO()):
    G = runpy.run_path(os.path.join(HERE, 'software_route.py'), run_name='lib')
HA, HS, AS, swe, sc, A, PAIR, PUBLIC, th, f, pi = G['HA'], G['HS'], G['AS'], G['swe'], G['sc'], G['A'], G['PAIR'], G['PUBLIC'], G['th'], G['f'], G['pi']
INK, MUTED, BORDER, GROUND, FIT, OTHER, ACCENT = '#161514', '#666463', '#E2E1E0', '#FCFCFB', '#3473A3', '#8B681B', '#983432'
plt.rcParams.update({'font.family': 'serif', 'font.serif': ['Georgia', 'DejaVu Serif'], 'font.size': 11, 'axes.edgecolor': MUTED,
                     'axes.labelcolor': MUTED, 'xtick.color': MUTED, 'ytick.color': MUTED, 'figure.facecolor': GROUND, 'axes.facecolor': GROUND})
halo = [pe.withStroke(linewidth=3.5, foreground=GROUND)]
fig, (ax, bx) = plt.subplots(1, 2, figsize=(13.5, 6.4), gridspec_kw={'width_ratios': [1.15, 1]})
# left: horizon on software ECI
g = np.linspace(128, HS['hi'], 100); ge = np.linspace(HS['hi'], 176, 60)
ax.axvspan(HS['hi'], 176, color=MUTED, alpha=0.07, lw=0); ax.text(HS['hi'] + 0.4, -4.6, 'extrapolated', fontsize=9, color=MUTED, style='italic')
for gg, al, ls in ((g, 0.12, '-'), (ge, 0.06, (0, (2, 2)))):
    ax.fill_between(gg, [f(HS, x) - pi(HS, x) for x in gg], [f(HS, x) + pi(HS, x) for x in gg], color=FIT, alpha=al, lw=0)
    ax.plot(gg, [f(HS, x) for x in gg], color=FIT, lw=2, ls=ls)
for k, e in PAIR.items():
    s = swe(e)
    if not s: continue
    cl = 'claude' in k
    ax.plot([s[0] - s[1], s[0] + s[1]], [th[k]] * 2, color=INK if cl else OTHER, lw=0.8, alpha=0.4)
    ax.scatter([s[0]], [th[k]], s=40, zorder=5, color=INK if cl else GROUND, edgecolor=GROUND if cl else OTHER, linewidth=1.5 if cl else 1.6)
lab = {}
for k, e in PUBLIC.items():
    if A[k][2] < 160 or not swe(e): continue
    s = swe(e)[0]; y = f(HA, A[k][2])
    ax.scatter([s], [y], marker='D', s=44, facecolor=GROUND, edgecolor=ACCENT, linewidth=1.7, zorder=6)
    off = {'Mythos 5': (8, -13), 'Opus 5.5': (8, -13)}.get(k, (-8, 5))
    ax.annotate(k, (s, y), xytext=off, textcoords='offset points', fontsize=8.5, color=ACCENT, ha='left' if off[0] > 0 else 'right', path_effects=halo, zorder=8)
YT = [(-np.log2(60), '1 min'), (np.log2(10 / 60), '10 min'), (0, '1 hr'), (3, '1 day'), (np.log2(40), '1 wk'), (np.log2(200), '5 wk')]
ax.set_yticks([v for v, _ in YT]); ax.set_yticklabels([l for _, l in YT]); ax.set_ylim(-5, 8.6); ax.set_xlim(128, 176)
ax.set_xlabel("Epoch's software ECI (11 software and agentic-coding benchmarks)"); ax.set_ylabel('50% time horizon (METR), work time')
ax.text(0.02, 0.98, f"16 METR-measured models: {1 / HS['b'][1]:.2f} points per doubling, scatter {HS['s']:.2f} doublings, no lab offset (-0.2 ± 0.3)\n"
        "red: public Claude models at their software ECI, with the horizon the AECI map gives them", transform=ax.transAxes, va='top', fontsize=9, color=INK, linespacing=1.5)
ax.set_title('horizon on software ECI', loc='left', fontsize=12, color=INK, style='italic')
# right: software ECI on AECI
g = np.linspace(122, 181, 100)
bx.plot([122, 181], [122, 181], ls=(0, (2, 3)), lw=1, color=MUTED); bx.text(170.5, 173.5, 'AECI = software ECI', fontsize=9, color=MUTED, rotation=37)
bx.fill_between(g, [f(AS, x) - pi(AS, x) for x in g], [f(AS, x) + pi(AS, x) for x in g], color=FIT, alpha=0.1, lw=0)
bx.plot(g[g <= AS['hi']], [f(AS, x) for x in g[g <= AS['hi']]], color=FIT, lw=2); bx.plot(g[g >= AS['hi']], [f(AS, x) for x in g[g >= AS['hi']]], color=FIT, lw=2, ls=(0, (2, 2)))
for k, e in PUBLIC.items():
    if not swe(e): continue
    s, se, nb = swe(e); a = A[k][2]
    bx.plot([a, a], [s - se, s + se], color=INK, lw=0.8, alpha=0.4); bx.scatter([a], [s], s=40, color=INK, edgecolor=GROUND, linewidth=1.5, zorder=5)
    if a >= 157 or k in ('3 Opus', '3.7 Sonnet'):
        off = {'Opus 4.6': (-6, 6)}.get(k, (6, -12))
        bx.annotate(k, (a, s), xytext=off, textcoords='offset points', fontsize=8.5, color=INK, ha='right' if off[0] < 0 else 'left', path_effects=halo, zorder=8)
for k in ('Mythos Preview Early', 'Mythos Preview', 'Model 2 Early', 'Model 2', 'Model 3 Early', 'Model 3', 'Model 4'):
    a = A[k][2]; bx.plot([a, a], [122, 123.4], color=INK, lw=1.2)
bx.text(150.5, 124.0, 'AECI of the internal checkpoints:', fontsize=8.5, color=MUTED, style='italic')
bx.set_xlim(122, 181); bx.set_ylim(122, 181); bx.set_xlabel('AECI (METR)'); bx.set_ylabel("Epoch's software ECI")
bx.text(0.02, 0.98, f"14 public Claude models: {AS['b'][1]:.2f} software points per AECI point, scatter {AS['s']:.1f}\nAECI runs 1.5 to 3 points ahead since Opus 4.7",
        transform=bx.transAxes, va='top', fontsize=9, color=INK, linespacing=1.5)
bx.set_title('software ECI on AECI', loc='left', fontsize=12, color=INK, style='italic')
for a_ in (ax, bx):
    a_.grid(color=BORDER, lw=0.8); a_.set_axisbelow(True)
    for sp in ('top', 'right'): a_.spines[sp].set_visible(False)
H = [plt.Line2D([], [], marker='o', ls='', color=INK, ms=6, label='Claude model'), plt.Line2D([], [], marker='o', ls='', mfc=GROUND, mec=OTHER, mew=1.6, ms=6, label='other lab'),
     plt.Line2D([], [], color=FIT, lw=2, label='least squares (95% prediction band)'), plt.Line2D([], [], marker='D', ls='', mfc=GROUND, mec=ACCENT, mew=1.7, ms=6, label='horizon from the AECI map')]
fig.legend(handles=H, loc='lower center', ncol=4, frameon=False, fontsize=10, bbox_to_anchor=(0.5, -0.005))
fig.tight_layout(rect=(0, 0.06, 1, 1)); fig.savefig(os.path.join(HERE, 'software-eci.png'), dpi=160); print('ok')
