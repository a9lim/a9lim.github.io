"""Draw the three-panel figure from result.json.

fable, 2026-11-11 (claude-fable-5-2)
"""
import json, os, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import FixedLocator, NullLocator

R = json.load(open(os.path.join(HERE, 'result.json')))
V = R['views']['hours']; H, D = V['hyp'], V['dexp']
t, y, names = np.array(R['t']), np.array(V['y']), R['names']
P = np.array([[np.nan if v is None else v for v in p[:3]] for p in V['points']]); der = np.array([p[3] for p in V['points']])
tc, al, a0 = H['ts'], H['alpha'], H['a']
bt = np.array(V['band']['t']); band = {k: np.array(V['band'][k], float) for k in ('hyp', 'dexp')}
MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()
month = lambda d: f'{MONTHS[min(11, int((d % 1) * 12))]} {int(d)}'
SURF, INK, INK2, GRID = '#fcfcfb', '#0b0b0b', '#52514e', '#e4e3df'
BLUE, ORANGE, AQUA = '#2a78d6', '#eb6834', '#1baf7a'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10.5, 'axes.edgecolor': '#b9b8b2', 'axes.linewidth': 0.8,
                     'text.color': INK, 'axes.labelcolor': INK2, 'xtick.color': INK2, 'ytick.color': INK2,
                     'axes.spines.top': False, 'axes.spines.right': False, 'figure.facecolor': SURF, 'axes.facecolor': SURF})
hyp = lambda s: a0 - al * np.log2(tc - s)
pw = lambda s: R['pw'][0] + R['pw'][1] * s + R['pw'][2] * np.maximum(s - R['pw'][3], 0)
dex = lambda s: D['d0'] + D['d1'] * np.exp(D['c'] * (s - 2019.0))
YT = {np.log2(1 / 3600): '1 sec', np.log2(1 / 60): '1 min', 0: '1 hour', np.log2(40): '1 work-week', np.log2(2000): '1 work-year',
      np.log2(2000 * 100): '100 work-years'}

def yaxis(ax, lo, hi):
    ax.set_ylim(lo, hi); ks = [k for k in YT if lo <= k <= hi]
    ax.yaxis.set_major_locator(FixedLocator(ks)); ax.set_yticklabels([YT[k] for k in ks]); ax.yaxis.set_minor_locator(NullLocator())
    ax.grid(axis='y', color=GRID, lw=0.8); ax.set_axisbelow(True)

def points(ax, x):
    ax.vlines(x, P[:, 1], P[:, 2], color=INK2, lw=0.9, alpha=0.55, zorder=3)
    ax.scatter(x[~der], y[~der], s=42, color=INK, edgecolor=SURF, linewidth=1.2, zorder=4, label='measured by METR')
    ax.scatter(x[der], y[der], s=52, marker='D', facecolor=SURF, edgecolor=INK, linewidth=1.5, zorder=4, label='converted from AECI score')

def shade(ax, name, color, x=lambda s: s, top=60):
    """A fit's 95% band; past a replicate's singularity its upper edge is off the chart."""
    ok = np.isfinite(band[name][:, 0]) & (bt < tc - 1e-6 if name == 'hyp' else True)
    ax.fill_between(x(bt[ok]), band[name][ok, 0], np.where(np.isfinite(band[name][ok, 1]), band[name][ok, 1], top), color=color, alpha=0.16, lw=0, zorder=1)

fig, axs = plt.subplots(1, 3, figsize=(16.5, 5.6), dpi=170, gridspec_kw={'width_ratios': [1, 1.25, 1.0], 'wspace': 0.40})

# (a) the tweet's plot
ax = axs[0]; left = lambda s: np.log10(tc - s)
xs = np.linspace(np.log10(tc - 2018.9), np.log10(0.55), 100)
shade(ax, 'hyp', BLUE, left)
ax.plot(xs, a0 - al * np.log2(10 ** xs), color=BLUE, lw=2, zorder=2)
points(ax, left(t)); ax.set_xlim(xs[0] + 0.012, xs[-1]); yaxis(ax, np.log2(1 / 3600) - 1, np.log2(2000) + 2.2)
xt = [8, 5, 3, 2, 1, 0.6]; ax.set_xticks(np.log10(xt)); ax.set_xticklabels([f'{v:g} yr' for v in xt])
ax.set_xlabel('time left until the fitted singularity (log scale)')
ax.set_title('1. The tweet’s plot reproduces', loc='left', fontsize=12.5, fontweight='bold', pad=26)
ax.text(0, 1.035, f'50% time horizon. Fit lands on {month(tc)}, exponent {al:.2f}, r = {R["obs_r"]:.3f}', transform=ax.transAxes, color=INK2, fontsize=9.8)
ax.legend(loc='lower right', frameon=False, fontsize=9.5, handletextpad=0.3)
for nm, dx, dy, ha in (('GPT-2', 0.025, -1.3, 'left'), ('GPT-4', 0.02, 1.1, 'right'), ('Model 4', -0.17, 2.5, 'right')):      # the axis runs right to left
    i = names.index(nm); x = left(t[i]); ax.annotate(nm, (x, y[i]), (x - dx, y[i] + dy), fontsize=9, color=INK2, ha=ha)

# (b) same points, three curves
ax = axs[1]; s = np.linspace(2019, 2028.6, 1200)
sh = s[s < tc - 0.012]
ax.axvspan(2026.74, 2028.6, color='#f1f0ec', zorder=0, lw=0)
ax.axvspan(H['low'], H['high'], color=BLUE, alpha=0.10, zorder=0, lw=0)
ax.axvline(tc, color=BLUE, lw=1, ls=(0, (3, 3)), zorder=1)
shade(ax, 'dexp', ORANGE); shade(ax, 'hyp', BLUE)
ax.plot(sh, hyp(sh), color=BLUE, lw=2, zorder=3, label='hyperbolic (finite-time singularity)')
ax.plot(s, dex(s), color=ORANGE, lw=2, zorder=3, label='double exponential (no singularity)')
ax.plot(s, pw(s), color=AQUA, lw=2, zorder=3, label='exponential with one change of slope')
points(ax, t); yaxis(ax, np.log2(1 / 3600) - 1, np.log2(2000 * 100) + 1.5)
ax.set_xlim(2019, 2028.6); ax.set_xticks(range(2019, 2029))
ax.text(2028.55, np.log2(1 / 3600) - 0.3, 'no data yet', color=INK2, fontsize=9, va='bottom', ha='right')
ax.set_title('2. Three curves fit the same points, then part ways', loc='left', fontsize=12.5, fontweight='bold', pad=26)
ax.text(0, 1.035, 'Same points against the calendar. All three reach a work-year horizon in 2027', transform=ax.transAxes, color=INK2, fontsize=9.8)
ax.text(H['high'] + 0.05, np.log2(40) - 1.2, f'fitted\nsingularity\n{month(tc)}\n(95%: {month(H["low"])}\nto {month(H["high"])})', color=INK2, fontsize=8.6, ha='left', va='top')
h, l = ax.get_legend_handles_labels(); ax.legend(h[:3], l[:3], loc='upper left', frameon=False, fontsize=9.5)
ax.set_xlabel('date the model existed')

# (c) straightness under no singularity
ax = axs[2]; bins = np.linspace(0.984, 0.9995, 42)
for key, c, lab in (('one slope change', AQUA, 'one change of slope'), ('double exponential', ORANGE, 'double exponential')):
    ax.hist(R['null'][key], bins=bins, histtype='stepfilled', facecolor=c, alpha=0.22, edgecolor='none')
    ax.hist(R['null'][key], bins=bins, histtype='step', color=c, lw=2, label=lab)
ax.axvline(R['obs_r'], color=INK, lw=2); top = ax.get_ylim()[1]
ax.text(R['obs_r'] + 0.0003, top * 0.97, 'the real\ndata', color=INK, fontsize=9.5, ha='left', va='top')
ax.set_yticks([]); ax.spines['left'].set_visible(False)
ax.set_xlabel('straightness r of the line, singularity date fitted')
ax.set_xlim(0.984, 1.0); ax.set_xticks([0.985, 0.99, 0.995, 1.0])
ax.set_title('3. Straight lines without a singularity', loc='left', fontsize=12.5, fontweight='bold', pad=26)
ax.text(0, 1.035, '1,500 simulated histories per curve', transform=ax.transAxes, color=INK2, fontsize=9.8)
ax.legend(loc='upper left', frameon=False, fontsize=9.5, title='data generated from', title_fontsize=9.5, alignment='left')
b0, b1 = R['map']
fig.text(0.008, 0.012, f'Data: METR time horizons v1.1 (measured, to early 2026); AECI read off METR’s 5 Nov 2026 chart, converted with the least-squares map through the eight models that have both '
         f'({2 ** b0:.2f} h at AECI 150, {1 / b1:.2f} points per doubling).\nRecord holders only. Bars, bands and the shaded date: 95%, from 2,000 bootstrap replicates that redraw the map and resample residuals.',
         color=INK2, fontsize=8.6, linespacing=1.5)
fig.subplots_adjust(left=0.075, right=0.985, top=0.83, bottom=0.19)
fig.savefig(os.path.join(HERE, 'horizon-singularity-check.png'), facecolor=SURF)
print('saved')
