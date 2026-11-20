"""oeci.png: OECI beside AECI, Epoch's ECI and software ECI. Opus 5.5 (claude-opus-5-5), 2026-11-19; see AGENTS.md, "OECI"."""
import sys, os, io, contextlib, datetime as dt
import numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt, matplotlib.dates as mdates
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
with contextlib.redirect_stdout(io.StringIO()):
    import oeci as O
    from series import models, day, yr
    from fit import fit_horizons, hyp_at, dexp_at

COL = {'OECI': '#3b6fb6', 'ECI': '#6b6b6b', 'SWE-ECI': '#2a9d8f', 'AECI': '#d1495b'}
MK = {'OECI': 'o', 'ECI': 'D', 'SWE-ECI': '^', 'AECI': 's'}
D = lambda t: dt.datetime.combine(day(t), dt.time())
SINCE = 2025.55

def pts(index, who):
    if index == 'OECI': return [(d['t'], d['v'], m) for m, d in O.OECI.items() if O.lab(m) == who]
    f = (lambda m: float(O.sc[m]['eci'])) if index == 'ECI' else O.swe
    if index in ('ECI', 'SWE-ECI'):
        return [(yr(O.sc[m]['date']), f(m), m) for m in O.OECI if m in O.sc and O.lab(m) == who and f(m) is not None]
    return [(yr(O.sc[m]['date']), v, m) for m, v in O.AECI_PUB.items() if m in O.sc]

def draw(ax, index, who, label=None):
    p = [q for q in pts(index, who) if q[0] >= SINCE]
    rec = O.records(p); c = COL[index]
    ax.scatter([D(t) for t, *_ in p], [v for _, v, _ in p], s=14, marker=MK[index], color=c, alpha=0.25, lw=0)
    ax.plot([D(t) for t, *_ in rec], [v for _, v, _ in rec], '-', marker=MK[index], ms=5, color=c, lw=1.6, label=label or index)
    return rec

fig = plt.figure(figsize=(14, 10.5)); gs = fig.add_gridspec(2, 2, hspace=0.32, wspace=0.34)
axC, axO, axR, axB = (fig.add_subplot(gs[i, j]) for i, j in ((0, 0), (0, 1), (1, 0), (1, 1)))

# (a) Claude models on four rulers, with reverse-log's AECI-view curves and Fable 5.2 carried onto AECI
for ix in ('OECI', 'ECI', 'SWE-ECI'): draw(axC, ix, 'Anthropic')
rec = draw(axC, 'AECI', 'Anthropic', 'AECI (public, release date)')
it = [(t, v, n) for n, t, v in O.AECI_INT if t >= SINCE]
axC.scatter([D(t) for t, *_ in it], [v for _, v, _ in it], marker='s', s=34, facecolor='white', edgecolor=COL['AECI'], lw=1.3,
            label='AECI internal checkpoints (chart date)', zorder=3)
for t, v, n in it:
    if n in ('Mythos Preview', 'Model 4'): axC.annotate(n, (D(t), v), xytext=(-6, 6), textcoords='offset points', fontsize=7.5, ha='right', color=COL['AECI'])
s, c = models(); V = fit_horizons(s, c, views=('aeci',))['views']['aeci']
g = np.linspace(2025.8, 2026.97, 120); gd = [D(x) for x in g]
hy = np.ravel(hyp_at(g, *[V['hyp'][k] for k in ('a', 'alpha', 'ts')])); de = np.ravel(dexp_at(g, *[V['dexp'][k] for k in ('d0', 'd1', 'c')]))
axC.plot(gd, hy, color='k', lw=0.9, ls=(0, (5, 3)), alpha=0.7, label='reverse-log hyperbola (AECI view)')
axC.plot(gd, de, color='k', lw=0.9, ls=(0, (1, 2)), alpha=0.7, label='reverse-log double exponential')
pa = [m for m in O.OECI if m in O.AECI_PUB]; bb, _, _ = O.line_fit([O.OECI[m]['v'] for m in pa], [O.AECI_PUB[m] for m in pa])
fa = lambda o: bb[0] + bb[1] * (o - 160); F = O.OECI['Claude Fable 5.2']
axC.errorbar([D(F['t'])], [fa(F['v'])], yerr=[[fa(F['v']) - fa(F['lo'])], [fa(F['hi']) - fa(F['v'])]], fmt='*', ms=13, color=COL['AECI'],
             mfc='white', mew=1.3, capsize=3, lw=1, zorder=4, label='Fable 5.2: OECI carried onto AECI (90%)')
axC.set_title('Claude models on four rulers', loc='left', fontsize=12, fontweight='bold')

# (b) OpenAI models on three rulers, with OpenAI's own trend
for ix in ('OECI', 'ECI', 'SWE-ECI'): draw(axO, ix, 'OpenAI')
axO.plot([D(yr('2025-08-07')), D(yr('2026-11-17'))], [148.8, 169.7], color=COL['OECI'], ls='--', lw=1, label="OpenAI's trend: 16.4 OECI/yr")
for m in ('GPT-5.6 Sol', 'GPT-6 Astra', 'GPT-6.2 Astra'):
    axO.annotate(m, (D(O.OECI[m]['t']), O.OECI[m]['v']), xytext=(-6, 7), textcoords='offset points', fontsize=7.5, ha='right', color=COL['OECI'])
axO.set_title('OpenAI models on three rulers', loc='left', fontsize=12, fontweight='bold')
for ax in (axC, axO):
    ax.set_xlim(D(2025.55), D(2026.97)); ax.set_ylim(140, 192); ax.grid(alpha=0.25, lw=0.6)
    ax.xaxis.set_major_locator(mdates.MonthLocator(bymonth=(1, 4, 7, 10))); ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
    ax.set_ylabel('index points (each on its own scale)'); ax.legend(fontsize=7.5, loc='upper left', frameon=False)
axC.text(0.99, 0.02, 'records joined; faint = non-record models.\nECI and software ECI over the models OECI scores.', transform=axC.transAxes,
         ha='right', va='bottom', fontsize=7, color='#555')

# (c) the rulers against each other: same models, x = OECI
for who, fc in (('Anthropic', None), ('OpenAI', 'white')):
    for ix in ('ECI', 'SWE-ECI', 'AECI'):
        ms = [m for m in O.OECI if (O.AECI_PUB.get(m) if ix == 'AECI' else (m in O.sc and O.lab(m) == who and (ix == 'ECI' or O.swe(m) is not None)))]
        if ix == 'AECI' and who == 'OpenAI': continue
        f = (lambda m: O.AECI_PUB[m]) if ix == 'AECI' else (lambda m: float(O.sc[m]['eci'])) if ix == 'ECI' else O.swe
        x = np.array([O.OECI[m]['v'] for m in ms]); y = np.array([f(m) for m in ms]); b, se, _ = O.line_fit(x, y)
        axR.scatter(x, y, marker=MK[ix], s=26, color=COL[ix], facecolor=fc or COL[ix], lw=1.1)
        xx = np.array([x.min(), x.max()]); axR.plot(xx, b[0] + b[1] * (xx - 160), color=COL[ix], lw=1.2, ls='-' if fc is None else '--',
                                                    label=f"{ix} on OECI, {'Claude' if fc is None else 'OpenAI'}: slope {b[1]:.2f}")
axR.plot([138, 176], [138, 176], color='k', lw=0.6, alpha=0.4); axR.text(168.5, 166.2, 'y = x', fontsize=7.5, alpha=0.6)
axR.set_xlim(138, 172); axR.set_ylim(136, 180); axR.grid(alpha=0.25, lw=0.6)
axR.set_xlabel('OECI'); axR.set_ylabel('the same model on another index')
axR.legend(fontsize=7.5, loc='upper left', frameon=False, title='filled: Claude   hollow: OpenAI', title_fontsize=7.5)
axR.set_title('Same models, different rulers', loc='left', fontsize=12, fontweight='bold')

# (d) 2026 frontier rates in horizon doublings per year
R = O.rates(); mr = O.metr_rates()
ylab = [f"{r['index'].replace('+internal', ' + internal')} · {'Claude' if r['lab'] == 'Anthropic' else 'OpenAI'}" for r in R]
y = np.arange(len(R))[::-1]
for yi, r in zip(y, R):
    c = COL['AECI' if r['index'].startswith('AECI') else r['index']]
    axB.barh(yi, r['dbl'], xerr=r['dbl_se'], color=c if r['lab'] == 'Anthropic' else 'white', edgecolor=c, hatch=None if r['lab'] == 'Anthropic' else '////',
             lw=1.2, height=0.62, error_kw=dict(lw=1, capsize=2, ecolor='#333'))
for yi, r in zip(y, R):
    axB.text(r['dbl'] + r['dbl_se'] + 0.12, yi, f"{r['pts']:.1f} pts/yr ÷ {r['ppd']:.2f} → {12 / r['dbl']:.1f}-month doubling", va='center', fontsize=7.5)
axB.set_yticks(y); axB.set_yticklabels(ylab, fontsize=8.5)
for (a, b), (s_, n) in mr.items():
    axB.axvline(s_, color='k', lw=0.8, ls=':', alpha=0.7)
    axB.text(s_, len(R) - 0.35, f"METR measured\n{a:.0f}–{'early 2026' if b > 2026 else f'{b:.0f}'}\n{12 / s_:.1f}-mo doubling", fontsize=7, ha='center', va='bottom')
axB.set_xlim(0, 10.2); axB.set_ylim(-0.7, len(R) + 0.9); axB.set_xlabel('2026 frontier rate, doublings of 50% horizon per year (± 1 se of the slope)')
axB.set_title("2026 pace on each ruler, in horizon units", loc='left', fontsize=12, fontweight='bold')
axB.grid(axis='x', alpha=0.25, lw=0.6)

fig.suptitle("OpenAI's OECI beside AECI, Epoch's ECI and Epoch's software ECI", x=0.06, ha='left', fontsize=14, fontweight='bold', y=0.975)
fig.text(0.06, 0.935, "OECI: OpenAI, 18 Nov 2026 (embedded chart data). AECI: METR's 5 Nov chart, digitised. ECI: Epoch, 12 Nov. "
         "Points per doubling: ECI and software ECI regressed on METR horizons; AECI the hours-view map; OECI = ECI's × OECI's within-lab slope on ECI.",
         fontsize=8, color='#444', ha='left', wrap=True)
fig.savefig(os.path.join(HERE, 'oeci.png'), dpi=150, bbox_inches='tight', facecolor='white')
print('wrote oeci.png')
