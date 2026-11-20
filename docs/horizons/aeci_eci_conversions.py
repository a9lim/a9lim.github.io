"""Four AECI-to-ECI conversions through the 14 public Claude models on both scales: conversions.py's maps, drawn.
Opus 5.5, 2026-11-12."""
import sys, os, io, contextlib; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np, matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt, matplotlib.patheffects as pe
from series import AECI, ECI, PUBLIC
with contextlib.redirect_stdout(io.StringIO()):
    from conversions import FORMS
INK, MUTED, BORDER, GROUND, ACCENT = '#161514', '#666463', '#E2E1E0', '#FCFCFB', '#983432'
C = {'linear': '#3473A3', 'above150': '#2A7976', 'hinge': '#7D60A6', 'quad': '#8B681B'}
plt.rcParams.update({'font.family': 'serif', 'font.serif': ['Georgia', 'DejaVu Serif'], 'font.size': 11, 'axes.edgecolor': MUTED,
                     'axes.labelcolor': MUTED, 'xtick.color': MUTED, 'ytick.color': MUTED, 'figure.facecolor': GROUND, 'axes.facecolor': GROUND})
halo = [pe.withStroke(linewidth=3.5, foreground=GROUND)]
A = {a[0]: a for a in AECI}
P = [(k, A[k][2], ECI[v][1]) for k, v in PUBLIC.items() if k != 'Model 3']
def drawn(M):
    return lambda a: np.array([M.feat(v, None) for v in np.atleast_1d(a)]) @ M.b
F = {k: (f"{FORMS[f].label} (scatter {FORMS[f].s:.2f})", drawn(FORMS[f]), FORMS[f].lo) for k, f in
     (('linear', 'linear'), ('quad', 'quadratic'), ('hinge', 'hinge'), ('above150', 'top'))}
fig, ax = plt.subplots(figsize=(10, 6.4))
x0, x1 = 140, 182
ax.plot([x0, x1], [x0, x1], ls=(0, (2, 3)), lw=1, color=MUTED); ax.text(166.5, 168, 'AECI = ECI', fontsize=9, color=MUTED, rotation=33)
f52 = ECI['Claude Fable 5.2'][1:]
ax.axhspan(f52[1], f52[2], color=ACCENT, alpha=0.06, lw=0); ax.axhline(f52[0], color=ACCENT, lw=1.2, ls=(0, (5, 3)))
ax.text(140.6, f52[0] + 0.4, f'Fable 5.2, ECI {f52[0]:.1f} (95%: {f52[1]:.1f}–{f52[2]:.1f})', fontsize=9, color=ACCENT)
for k, (lab, f, start) in F.items():
    g = np.linspace(max(x0, start if start >= 150 else x0), 174.64, 100); ge = np.linspace(174.64, 180, 30)
    ax.plot(g, f(g), color=C[k], lw=2, label=lab); ax.plot(ge, f(ge), color=C[k], lw=2, ls=(0, (2, 2)))
ax.scatter([p[1] for p in P], [p[2] for p in P], s=40, color=INK, edgecolor=GROUND, linewidth=1.5, zorder=5)
for k, a, e in P:
    if a >= 150:
        off = (-8, 6) if k == 'Mythos 5' else (6, -12)
        ax.annotate(k, (a, e), xytext=off, textcoords='offset points', fontsize=9, color=INK, ha='right' if off[0] < 0 else 'left', path_effects=halo, zorder=8)
for k in ('Mythos Preview Early', 'Mythos Preview', 'Model 2 Early', 'Model 2', 'Model 3 Early', 'Model 3', 'Model 4'):
    a = A[k][2]; ax.plot([a, a], [140, 141.2], color=INK, lw=1.2)
    ax.annotate(k.replace('Mythos Preview Early', 'MP early').replace('Mythos Preview', 'MP').replace('Model ', 'M'), (a, 141.4), fontsize=8, color=INK, rotation=90, ha='center', va='bottom', path_effects=halo)
ax.text(147.5, 143.0, 'AECI of the checkpoints that get converted:', fontsize=9, color=MUTED, style='italic')
ax.axvspan(174.64, 180, color=MUTED, alpha=0.06, lw=0)
ax.set_xlim(x0, x1); ax.set_ylim(140, 180); ax.set_xlabel('AECI (METR)'); ax.set_ylabel('ECI (Epoch)')
ax.grid(color=BORDER, lw=0.8); ax.set_axisbelow(True)
for sp in ('top', 'right'): ax.spines[sp].set_visible(False)
ax.set_title('AECI to ECI: four conversions through the 14 public Claude pairs (dotted past the last pair)', loc='left', fontsize=12, color=INK, style='italic')
ax.legend(loc='lower right', bbox_to_anchor=(1.0, 0.17), frameon=False, fontsize=9.5)
fig.tight_layout(); fig.savefig(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'aeci-eci-conversions.png'), dpi=160); print('ok')
