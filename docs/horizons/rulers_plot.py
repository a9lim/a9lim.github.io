"""Each ruler on its own, the conversions between them, and every ruler's frontier in METR's pooled hours.

    python rulers_plot.py      # about a minute; writes six PNGs

ruler-metr.png         METR's time horizons: the v1.1 file, the 20 November pooled suite (TH1.1 + TH2), TH2 verifiable
ruler-eci.png          Epoch's ECI, and the software and agentic abilities from Epoch's benchmarks (aeci_subset.py)
ruler-oeci.png         OpenAI's OECI
ruler-aeci.png         AECI as read off METR's chart, public models and internal checkpoints
ruler-conversions.png  every pair: horizon on AECI, ECI and OECI (pooled and v1.1), ECI on AECI, OECI on ECI, AECI on OECI
ruler-hours.png        each ruler's frontier carried into pooled hours by its own map, beside METR's measurements

Every fitted number comes from the modules that print it (metr_q4, metr_rulers, conversions, oeci) or is computed and
printed here. Lab colours are three of the site's inks (sienna, indigo, ochre) with grey for the rest, checked with the
dataviz validator; each lab also has its own marker.

opus, 2026-11-20 (claude-opus-5-5)
"""
import contextlib, io, os, sys
import numpy as np
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt, matplotlib.ticker
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import metr_rulers as RU, conversions as CV
Q, O = RU.Q, RU.O
from series import AECI, WHISKER, TH, NAME, ECI as ECI_SNAP, PAGE_ECI, yr, day

INK, MUTED, BORDER, GROUND, RED = '#161514', '#666463', '#E2E1E0', '#FCFCFB', '#983432'
LABS = {'Anthropic': ('#9F5D31', 'o'), 'OpenAI': ('#586AB2', 's'), 'Google': ('#8B681B', '^'), 'other': ('#8F8D8B', '.')}
RULER = {'METR': INK, 'ECI': '#586AB2', 'OECI': '#8B681B', 'AECI': '#9F5D31'}
plt.rcParams.update({'font.family': 'serif', 'font.serif': ['Georgia', 'DejaVu Serif'], 'font.size': 9.5, 'axes.edgecolor': MUTED,
                     'axes.labelcolor': INK, 'xtick.color': MUTED, 'ytick.color': MUTED, 'figure.facecolor': GROUND,
                     'axes.facecolor': GROUND, 'axes.spines.top': False, 'axes.spines.right': False})
YT = [(1 / 60, '1 min'), (10 / 60, '10 min'), (1, '1 h'), (8, '8 h'), (40, '1 wk'), (200, '5 wk'), (2000, '1 yr')]
def style(a, title, xl=None, yl=None):
    a.set_title(title, loc='left', fontsize=11, color=INK, style='italic')
    if xl: a.set_xlabel(xl)
    if yl: a.set_ylabel(yl)
    a.grid(color=BORDER, lw=0.6); a.set_axisbelow(True)
def hours_axis(a, lo=1e-3, hi=3e3):
    a.set_yscale('log'); a.set_ylim(lo, hi); a.set_yticks([v for v, _ in YT]); a.set_yticklabels([l for _, l in YT])
    a.yaxis.set_minor_formatter(matplotlib.ticker.NullFormatter())
def lab_legend(a, labs=('Anthropic', 'OpenAI', 'Google', 'other'), extra=(), loc='upper left'):
    H = [plt.Line2D([], [], marker=LABS[l][1], ls='', color=LABS[l][0], ms=6, label=l if l != 'other' else 'other labs') for l in labs]
    a.legend(handles=[*H, *extra], fontsize=8, frameon=False, loc=loc)
def records(pts):
    """Running record over (t, value, name) tuples."""
    out, best = [], -np.inf
    for p in sorted(pts):
        if p[1] > best: best = p[1]; out.append(p)
    return out
def save(fig, name): fig.tight_layout(); fig.savefig(os.path.join(HERE, name), dpi=150); plt.close(fig); print('wrote', name)
H2 = lambda l2: 2.0 ** np.asarray(l2, float)

# ======================================================================================================= METR
fig, a = plt.subplots(figsize=(10.5, 6.6))
v11 = [(t, np.log2(v / 60), np.log2(lo / 60), np.log2(hi / 60), NAME.get(k, k), s) for t, v, k, s, lo, hi in TH]
for t, y, lo, hi, n, s in v11:
    a.plot([t, t], H2([lo, hi]), color=INK, lw=0.7, alpha=0.35)
    a.scatter([t], H2(y), s=24, color=INK if s else GROUND, edgecolor=INK, lw=1, zorder=4)
pool = sorted((t, th[0], th[1], th[2], n) for n, (t, th) in Q.COMB.items())
prec = {r[2] for r in records([(t, y, n) for t, y, _, _, n in pool])}
for t, y, lo, hi, n in pool:
    a.plot([t + 0.02] * 2, H2([lo, min(hi, np.log2(3e3))]), color=RULER['ECI'], lw=0.8, alpha=0.45)
    a.scatter([t + 0.02], H2(y), s=30, marker='s', color=RULER['ECI'] if n in prec else GROUND, edgecolor=RULER['ECI'], lw=1.1, zorder=5)
for n, (t, th) in Q.SEP['TH2 (Verifiable)'].items():
    a.scatter([t - 0.02], H2(th[0]), s=26, marker='^', color=GROUND, edgecolor=RULER['OECI'], lw=1.1, zorder=4)
tr = Q.panels('cad6b5d98261f80c')[0][1]['frontier trends'][0]
a.plot([yr(tr['from']), yr(tr['to'])], [tr['horizon_minutes_from'] / 60, tr['horizon_minutes_to'] / 60], color=RULER['ECI'], lw=1.2, ls=(0, (5, 3)))
a.annotate(f"METR's pooled line: {tr['doubling_months']:.1f}-month doubling", (yr(tr['from']), tr['horizon_minutes_from'] / 60), xytext=(8, -14),
           textcoords='offset points', fontsize=8, color=INK)
for n in ('Claude Opus 5.5', 'GPT-6 Astra'):
    t, th = Q.COMB[n]; a.annotate(n.replace('Claude ', ''), (t, H2(th[0])), xytext=(-6, 6) if n == 'GPT-6 Astra' else (8, -12), textcoords='offset points', fontsize=8,
                                  ha='right' if n == 'GPT-6 Astra' else 'left', color=INK)
t_, v_ = next((t, v) for t, v, k, *_ in TH if k == 'claude_mythos_preview_early_inspect')
a.annotate('Mythos Preview (early)', (t_, v_ / 60), xytext=(-6, 6), textcoords='offset points', fontsize=8, ha='right', color=INK)
a.axhline(200, color=MUTED, lw=0.7, ls=(0, (1, 2))); a.text(2019.1, 240, "200 h: the pooled suite's longest threshold", fontsize=8, color=MUTED)
hours_axis(a, 5e-4, 3e3); a.set_xlim(2019, 2027)
style(a, "METR's time horizons: the v1.1 file and the 20 November pooled suite (filled: record holders; bars: 95%)", 'release date', '50% time horizon')
a.legend(handles=[plt.Line2D([], [], marker='o', ls='', color=INK, ms=6, label='v1.1 (TH1.1 at the time)'),
                  plt.Line2D([], [], marker='s', ls='', color=RULER['ECI'], ms=6, label='pooled TH1.1 + TH2, 20 Nov'),
                  plt.Line2D([], [], marker='^', ls='', mfc=GROUND, mec=RULER['OECI'], ms=6, label='TH2 verifiable, 20 Nov')], fontsize=8, frameon=False, loc='upper left')
save(fig, 'ruler-metr.png')

# ======================================================================================================= ECI, software, agentic
ECI_ALL = {m: v for m, v in ECI_SNAP.items()}
for m, (v, lo, hi) in PAGE_ECI.items():
    ECI_ALL[m] = (RU.DATE.get(m, ECI_SNAP.get(m, (np.nan,))[0]), v, lo, hi)
fig, ax = plt.subplots(1, 3, figsize=(17, 6.2), gridspec_kw=dict(width_ratios=[1.5, 1, 1]))
def by_lab(a, pts, since, ci=None):
    """pts: {model: (t, value)}. All models since `since`, by lab; each lab's running record as a step line."""
    for lab, (col, mk) in LABS.items():
        P = [(t, v, m) for m, (t, v) in pts.items() if t >= since and RU.LAB(m) == lab]
        if not P: continue
        a.scatter([p[0] for p in P], [p[1] for p in P], s=14 if lab == 'other' else 22, marker=mk, color=col, alpha=0.55 if lab == 'other' else 0.9, zorder=3)
        if lab != 'other':
            r = records(P); a.step([p[0] for p in r] + [2026.9], [p[1] for p in r] + [r[-1][1]], where='post', color=col, lw=1.2)
            if ci:
                for t, v, m in r:
                    if m in ci: a.plot([t, t], ci[m], color=col, lw=0.8, alpha=0.6)
            t, v, m = r[-1]; dy = {'OpenAI': 5, 'Anthropic': -11, 'Google': -4}[lab]
            a.annotate(m.replace('Claude ', ''), (t, v), xytext=(5, dy), textcoords='offset points', fontsize=7.5, color=INK)
by_lab(ax[0], {m: (v[0], v[1]) for m, v in ECI_ALL.items()}, 2023.0, ci={m: (v[2], v[3]) for m, v in ECI_ALL.items()})
style(ax[0], "(a) Epoch's ECI: steps are each lab's record (bars: 95%)", 'release date', 'ECI (12 Nov, with the 19 Nov pages)')
ax[0].set_ylim(100, 180); ax[0].set_xlim(2023, 2026.95); lab_legend(ax[0])
for a, R, name in ((ax[1], 'software', '(b) software ability'), (ax[2], 'agentic', '(c) agentic ability (software + other agentic)')):
    by_lab(a, {m: (RU.DATE[m], v) for m, v in RU.RULERS[R].items() if m in RU.DATE}, 2024.0)
    style(a, name + ', on ECI\'s scale', 'release date', 'ability (Epoch difficulties and slopes)'); a.set_xlim(2024, 2026.95)
save(fig, 'ruler-eci.png')

# ======================================================================================================= OECI
fig, a = plt.subplots(figsize=(10.5, 6.4))
for m, d in O.OECI.items():
    lab = RU.LAB(m); col, mk = LABS[lab]
    a.plot([d['t'], d['t']], [d['lo'], d['hi']], color=col, lw=0.7, alpha=0.4)
    a.scatter([d['t']], [d['v']], s=16 if lab == 'other' else 26, marker=mk, color=col, alpha=0.6 if lab == 'other' else 0.95, zorder=3)
print('OECI record lines:')
rate_lines = []
for lab in ('OpenAI', 'Anthropic'):
    r = O.series('OECI', lab); s = O.slope(r)
    t = np.array([p[0] for p in r]); v = np.array([p[1] for p in r]); b = np.polyfit(t, v, 1)
    a.plot([t.min(), t.max()], np.polyval(b, [t.min(), t.max()]), color=LABS[lab][0], lw=1.3, ls=(0, (5, 3)))
    rate_lines.append(plt.Line2D([], [], color=LABS[lab][0], lw=1.3, ls=(0, (5, 3)), label=f"{lab}'s records: {s[0]:.1f} points a year"))
    print(f'  {lab}: {s[0]:.2f} ± {s[1]:.2f} points a year over {s[2]} records')
for m in ('GPT-6.2 Astra', 'Claude Fable 5.2', 'GPT-6 Astra', 'Claude Opus 5.5'):
    d = O.OECI[m]; left = m == 'Claude Fable 5.2'
    a.annotate(m.replace('Claude ', ''), (d['t'], d['v']), xytext=(-6, 4) if left else (5, -3), textcoords='offset points', fontsize=7.5, color=INK,
               ha='right' if left else 'left')
style(a, "OpenAI's OECI (18 November; bars are its 90% intervals; dashed: each lab's records)", 'release date', 'OECI')
a.set_xlim(2025.55, 2026.95); lab_legend(a, extra=rate_lines)
save(fig, 'ruler-oeci.png')

# ======================================================================================================= AECI
fig, a = plt.subplots(figsize=(10.5, 6.4))
col = LABS['Anthropic'][0]
for n, t, v, kind, front in AECI:
    if n in WHISKER: a.plot([t, t], WHISKER[n], color=col, lw=0.8, alpha=0.5)
    a.scatter([t], [v], s=30, marker='o' if kind == 'public' else 'D', color=col if kind == 'public' else GROUND, edgecolor=col, lw=1.2, zorder=4)
    if n in ('Model 4', 'Opus 5.5', 'Mythos Preview Early', 'Opus 4.5', '3.7 Sonnet'):
        a.annotate(n, (t, v), xytext=(8, -12) if n == 'Opus 5.5' else (-6, 6), textcoords='offset points', fontsize=7.5, color=INK,
                   ha='left' if n == 'Opus 5.5' else 'right')
rec = [(t, v, n) for n, t, v, k, f in AECI if f]
print('AECI record lines (chart dates):')
for lo_, hi_, ls in ((2024.0, 2025.75, (0, (5, 3))), (2025.75, 2027, '-')):
    r = [p for p in rec if lo_ <= p[0] < hi_]; t = np.array([p[0] for p in r]); v = np.array([p[1] for p in r]); b = np.polyfit(t, v, 1)
    a.plot([t.min(), t.max()], np.polyval(b, [t.min(), t.max()]), color=INK, lw=1.1, ls=ls)
    a.annotate(f'{b[0]:.1f} points a year', (t.mean(), np.polyval(b, t.mean())), xytext=(8, -14), textcoords='offset points', fontsize=8, color=INK)
    print(f'  {day(lo_)} to {day(min(hi_, t.max()))}: {b[0]:.2f} points a year over {len(r)} records')
style(a, "AECI as read off METR's 5 November chart (dates: when most Anthropic staff could use each model; bars: 95%)", 'date', 'AECI')
a.legend(handles=[plt.Line2D([], [], marker='o', ls='', color=col, ms=6, label='public Claude model'),
                  plt.Line2D([], [], marker='D', ls='', mfc=GROUND, mec=col, ms=6, label='internal checkpoint'),
                  plt.Line2D([], [], color=INK, lw=1.1, label='line through the records, before and after October 2025')], fontsize=8, frameon=False, loc='upper left')
save(fig, 'ruler-aeci.png')

# ======================================================================================================= conversions
fig, ax = plt.subplots(2, 3, figsize=(17, 10.5))
def scatter_lab(a, xs, ys, names, hollow=False):
    for x, y, m in zip(xs, ys, names):
        lab = RU.LAB(m); c, mk = LABS[lab]
        a.scatter([x], [y], s=26, marker=mk, color=GROUND if hollow else c, edgecolor=c, lw=1.1, zorder=4, alpha=0.9)
def map_lines(a, R, H, xs, ls, label):
    n, b0, b1, b1se, off, offse, s = RU.fitmap(R, H)
    g = np.linspace(min(xs) - 2, max(xs) + 2, 50)
    a.plot(g, H2(b0 + b1 * (g - 150)), color=INK, lw=1.2, ls=ls, label=f'{label}: {1 / b1:.2f} points per doubling')
    if off: a.plot(g, H2(b0 + b1 * (g - 150) + off), color=LABS['Anthropic'][0], lw=1.0, ls=ls, label=f'  Claude {off:+.2f} doublings')
for a, R, title in ((ax[0, 0], 'AECI', '(a) horizon on AECI'), (ax[0, 1], 'ECI', '(b) horizon on ECI'), (ax[0, 2], 'OECI', '(c) horizon on OECI')):
    pm = [m for m in RU.COMB if RU.val(R, m) is not None]; vm = [m for m in RU.V11H if RU.val(R, m) is not None]
    scatter_lab(a, [RU.val(R, m) for m in pm], [H2(RU.COMB[m][1][0]) for m in pm], pm)
    scatter_lab(a, [RU.val(R, m) for m in vm], [H2(RU.V11H[m][1][0]) for m in vm], vm, hollow=True)
    map_lines(a, R, RU.COMB, [RU.val(R, m) for m in pm], '-', 'pooled')
    if len(vm) >= 7: map_lines(a, R, RU.V11H, [RU.val(R, m) for m in vm], (0, (4, 2)), 'v1.1')
    if R == 'AECI':
        for n in Q.INTERNAL: a.axvline(Q.AE[n], ymax=0.04, color=INK, lw=1)
    hours_axis(a, 1e-2, 3e3); style(a, title + ' (filled: pooled, 20 Nov; hollow: v1.1)', R, '50% time horizon' if R == 'AECI' else None)
    a.legend(fontsize=7.5, frameon=False, loc='upper left')
# (d) ECI on AECI, the public Claude pairs and conversions.py's maps
a = ax[1, 0]; P = CV.pairs
a.scatter([p[1] for p in P], [p[3] for p in P], s=26, color=LABS['Anthropic'][0], zorder=4)
g = np.linspace(124, 180, 100)
for k, ls in (('linear', (0, (4, 2))), ('hinge', '-')):
    M = CV.FORMS[k]; a.plot(g, [M.predict(x, None, M.b) for x in g], color=INK, lw=1.1, ls=ls, label=f'{M.label} (scatter {M.s:.2f})')
a.plot(g, g, color=MUTED, lw=0.8, ls=(0, (1, 2)), label='AECI = ECI')
for n in Q.INTERNAL: a.axvline(Q.AE[n], ymax=0.04, color=INK, lw=1)
style(a, '(d) ECI on AECI: the 14 public Claude models', 'AECI', 'ECI'); a.legend(fontsize=7.5, frameon=False, loc='upper left')
# (e) OECI on ECI, by lab
a = ax[1, 1]; ms = [m for m in O.OECI if RU.val('ECI', m) is not None]
scatter_lab(a, [RU.val('ECI', m) for m in ms], [O.OECI[m]['v'] for m in ms], ms)
print('OECI on ECI, per lab:')
for lab in ('OpenAI', 'Anthropic'):
    sub = [m for m in ms if RU.LAB(m) == lab]; x = np.array([RU.val('ECI', m) for m in sub]); y = np.array([O.OECI[m]['v'] for m in sub])
    b = np.polyfit(x, y, 1); gg = np.linspace(x.min(), x.max(), 20)
    a.plot(gg, np.polyval(b, gg), color=LABS[lab][0], lw=1.2, label=f'{lab}: {b[0]:.2f} OECI per ECI point, {np.polyval(b, 165) - 165:+.1f} at ECI 165')
    print(f'  {lab}: {b[0]:.3f} OECI per ECI point (n={len(sub)}); OECI - ECI at 165: {np.polyval(b, 165) - 165:+.2f}')
gg = np.linspace(140, 176, 10); a.plot(gg, gg, color=MUTED, lw=0.8, ls=(0, (1, 2)), label='OECI = ECI')
style(a, '(e) OECI on ECI, every model both score', 'ECI', 'OECI'); a.legend(fontsize=7.5, frameon=False, loc='upper left')
# (f) AECI on OECI, the public Claude models with both
a = ax[1, 2]; cl = [m for m in O.OECI if RU.val('AECI', m) is not None]
x = np.array([O.OECI[m]['v'] for m in cl]); y = np.array([RU.val('AECI', m) for m in cl]); b = np.polyfit(x, y, 1)
a.scatter(x, y, s=26, color=LABS['Anthropic'][0], zorder=4)
for m, xx, yy in zip(cl, x, y): a.annotate(m.replace('Claude ', ''), (xx, yy), xytext=(5, -11 if m == 'Claude Fable 5' else -3), textcoords='offset points', fontsize=7.5, color=INK)
gg = np.linspace(x.min() - 1, x.max() + 1, 20); a.plot(gg, np.polyval(b, gg), color=INK, lw=1.2, label=f'{b[0]:.2f} AECI points per OECI point')
a.plot(gg, gg, color=MUTED, lw=0.8, ls=(0, (1, 2)), label='AECI = OECI')
print(f'AECI on OECI: {b[0]:.3f} per point over {len(cl)} public Claude models')
style(a, '(f) AECI on OECI: the public Claude models with both', 'OECI', 'AECI'); a.legend(fontsize=7.5, frameon=False, loc='upper left')
fig.legend(handles=[plt.Line2D([], [], marker=LABS[l][1], ls='', color=LABS[l][0], ms=6, label=l if l != 'other' else 'other labs') for l in LABS],
           loc='lower center', ncol=4, frameon=False, fontsize=9)
fig.tight_layout(rect=(0, 0.03, 1, 1)); fig.savefig(os.path.join(HERE, 'ruler-conversions.png'), dpi=150); plt.close(fig); print('wrote ruler-conversions.png')

# ======================================================================================================= every ruler in pooled hours
fig, a = plt.subplots(figsize=(11.5, 7))
since = 2024.3
def to_hours(R, m):
    v = RU.val(R, m); b0, b1, off = RU.MAP[R]; return b0 + b1 * (v - 150) + off * (RU.LAB(m) == 'Anthropic')
for R, mk in (('ECI', 's'), ('OECI', '^')):
    P = [(RU.DATE[m], to_hours(R, m), m) for m in RU.RULERS[R] if m in RU.DATE and RU.DATE[m] >= since and RU.LAB(m) != 'other']
    r = O.records(P)
    a.step([p[0] for p in r] + [2026.95], H2([p[1] for p in r] + [r[-1][1]]), where='post', color=RULER[R], lw=1.3, label=f'{R} records, through its pooled map')
    a.scatter([p[0] for p in r], H2([p[1] for p in r]), s=24, marker=mk, color=RULER[R], zorder=4)
# AECI, public and internal at the chart's dates, through the pooled map and through the figure's (v1.1) map
recA = records([(t, v, n) for n, t, v, k, f in AECI if t >= since])
c0, c1 = Q.c0, Q.c1; lo_p = min(RU.val('AECI', m) for m in RU.COMB if RU.val('AECI', m) is not None)
inr = [p for p in recA if p[1] >= lo_p]
a.plot([p[0] for p in inr], H2([c0 + c1 * (p[1] - 150) for p in inr]), color=RULER['AECI'], lw=1.3, marker='D', ms=4.5,
       label=f'AECI records (internal included), through the pooled map (calibrated from AECI {lo_p:.0f})')
a.plot([p[0] for p in recA], H2([Q.b0 + Q.b1 * (p[1] - 150) for p in recA]), color=RULER['AECI'], lw=1.1, ls=(0, (4, 2)), marker='D', ms=4.5,
       mfc=GROUND, label=f"the same through the figure's v1.1 map (calibrated to AECI {max(m['aeci'][0] for m in Q.pairs):.0f})")
pool = records([(t, th[0], n) for n, (t, th) in Q.COMB.items()])
for t, y, n in pool:
    lo, hi = Q.COMB[n][1][1:]; a.plot([t, t], H2([lo, min(hi, np.log2(3e3))]), color=INK, lw=0.8, alpha=0.4)
a.scatter([p[0] for p in pool], H2([p[1] for p in pool]), s=34, color=INK, zorder=5, label="METR's pooled records, measured (95%)")
for n in ('Model 4', 'Mythos Preview'):
    t, v = next((t, v) for nn, t, v, *_ in AECI if nn == n)
    a.annotate(n, (t, H2(Q.b0 + Q.b1 * (v - 150))), xytext=(-6, 4), textcoords='offset points', fontsize=7.5, color=INK, ha='right')
for m, R, dy in (('Claude Fable 5.2', 'OECI', 5), ('GPT-6.2 Astra', 'ECI', -12)):
    a.annotate(m.replace('Claude ', ''), (RU.DATE[m], H2(to_hours(R, m))), xytext=(-4, dy), textcoords='offset points', fontsize=7.5, color=INK, ha='right')
a.axhline(200, color=MUTED, lw=0.7, ls=(0, (1, 2))); a.text(2024.32, 240, "200 h: the pooled suite's longest threshold", fontsize=8, color=MUTED)
hours_axis(a, 0.05, 3e3); a.set_xlim(since, 2026.95)
style(a, "Every ruler's frontier in METR's pooled hours (each through its own map, with its Claude offset)", 'date (AECI at the chart\'s dates)', '50% time horizon, pooled suite')
a.legend(fontsize=8, frameon=False, loc='upper left')
save(fig, 'ruler-hours.png')
