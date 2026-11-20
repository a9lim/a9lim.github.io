"""The three inputs: Epoch ECI (public), AECI read off METR's chart, METR measured time horizons.
Then the record series built from them, which is also the table behind the figure at a9l.im/#fits.

fable, 2026-11-11 (claude-fable-5-2). The AECI intervals and the chart dating of the early Mythos Preview
checkpoint are Opus 5.5's, from building that figure the same day.
"""
import csv, datetime as dt, os, re
import numpy as np, yaml

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data') + os.sep

def yr(d):
    if isinstance(d, str): d = dt.date.fromisoformat(d)
    y0 = dt.date(d.year, 1, 1); y1 = dt.date(d.year + 1, 1, 1)
    return d.year + (d - y0).days / (y1 - y0).days

# ---- Epoch ECI
ECI = {}
for r in csv.DictReader(open(D + 'eci_scores.csv')):
    if r['eci']:
        lo = float(r['eci_ci_low']) if r['eci_ci_low'] else float(r['eci'])
        hi = float(r['eci_ci_high']) if r['eci_ci_high'] else float(r['eci'])
        ECI[r['Model']] = (yr(r['date']), float(r['eci']), lo, hi)

def eci_frontier(since=2023.0):
    rows = sorted((v[0], v[1], k, v[2], v[3]) for k, v in ECI.items() if v[0] >= since)
    out, best = [], -1
    for t, e, k, lo, hi in rows:
        if e > best:
            best = e; out.append((t, e, k, lo, hi))
    return out

# ---- AECI, digitised from metr.org .../aeci-main.png (pixel centroids of the plotted points)
XT = [214, 358, 504, 650, 792, 937, 1083, 1228, 1371, 1515, 1661]
XD = [yr(dt.date(2024, 4, 1)), yr(dt.date(2024, 7, 1)), yr(dt.date(2024, 10, 1)), yr(dt.date(2025, 1, 1)),
      yr(dt.date(2025, 4, 1)), yr(dt.date(2025, 7, 1)), yr(dt.date(2025, 10, 1)), yr(dt.date(2026, 1, 1)),
      yr(dt.date(2026, 4, 1)), yr(dt.date(2026, 7, 1)), yr(dt.date(2026, 10, 1))]
YT = [381, 509, 636, 764, 1019, 1147, 1274]
YV = [190, 180, 170, 160, 140, 130, 120]
_K, _C = np.polyfit(YT, YV, 1)          # the y axis is linear: one line through the seven ticks
def aeci_at(y): return float(_K * y + _C)
def px(x, y):
    t = np.interp(x, XT, XD) if XT[0] <= x <= XT[-1] else XD[0] + (x - XT[0]) * (XD[-1] - XD[0]) / (XT[-1] - XT[0])
    return float(t), aeci_at(y)
_A = [  # name, x, y, kind, frontier
    ('3 Opus', 163.1, 1214.0, 'public', True), ('3.5 Sonnet', 334.2, 1146.7, 'public', True),
    ('3.5 Sonnet New', 518.1, 1105.8, 'public', True), ('3.7 Sonnet', 727.4, 997.2, 'public', True),
    ('Opus 4', 868.5, 957.9, 'public', True), ('Sonnet 4.5', 1068.2, 919.9, 'public', True),
    ('Opus 4.5', 1160.1, 861.9, 'public', True), ('Opus 4.6', 1264.9, 798.9, 'public', True),
    ('Mythos Preview Early', 1314.0, 734.3, 'internal', True), ('Mythos Preview', 1371.1, 691.8, 'internal', True),
    ('Opus 4.7', 1387.0, 760.5, 'public', False), ('Opus 4.8', 1447.2, 720.4, 'public', False),
    ('Mythos 5', 1467.8, 654.2, 'public', True), ('Model 2 Early', 1529.6, 614.0, 'internal', True),
    ('Opus 5', 1540.6, 644.9, 'public', False), ('Model 2', 1574.0, 584.7, 'internal', True),
    ('Mythos 5.1', 1574.0, 604.6, 'public', False), ('Model 3 Early', 1626.2, 555.2, 'internal', True),
    ('Opus 5.5', 1626.1, 577.1, 'public', False), ('Model 3', 1646.9, 547.5, 'internal', True),
    ('Model 4', 1651.7, 526.2, 'internal', True)]
AECI = [(n,) + px(x, y) + (k, f) for n, x, y, k, f in _A]

# ---- METR measured time horizons (minutes), v1.1
TH = []
for k, v in yaml.safe_load(open(D + 'benchmark_results_1_1.yaml'))['results'].items():
    m = v['metrics']
    TH.append((yr(v['release_date']), m['p50_horizon_length']['estimate'], k, bool(m.get('is_sota')),
               m['p50_horizon_length']['ci_low'], m['p50_horizon_length']['ci_high']))
TH.sort()

# METR model -> Epoch ECI model (public models that have both)
PAIR = {'gpt_4': 'GPT-4 (Mar 2023)', 'gpt_4_1106_inspect': 'GPT-4 Turbo (Nov 2023)', 'claude_3_opus_inspect': 'Claude 3 Opus',
        'gpt_4_turbo_inspect': 'GPT-4 Turbo (Apr 2024)', 'gpt_4o_inspect': 'GPT-4o (May 2024)',
        'claude_3_5_sonnet_20240620_inspect': 'Claude 3.5 Sonnet', 'o1_preview': 'o1-preview',
        'claude_3_5_sonnet_20241022_inspect': 'Claude 3.5 Sonnet (October 2024)', 'o1_inspect': 'o1',
        'claude_3_7_sonnet_inspect': 'Claude 3.7 Sonnet', 'o3_inspect': 'o3', 'claude_4_opus_inspect': 'Claude Opus 4',
        'claude_4_1_opus_inspect': 'Claude Opus 4.1', 'gpt_5_2025_08_07_inspect': 'GPT-5', 'gemini_3_pro': 'Gemini 3 Pro',
        'claude_opus_4_5_inspect': 'Claude Opus 4.5', 'gpt_5_2': 'GPT-5.2', 'claude_opus_4_6_inspect': 'Claude Opus 4.6',
        'gemini_3_1_pro': 'Gemini 3.1 Pro', 'gpt_5_4': 'GPT-5.4'}

# ---- the record series, as a9l.im's figure carries it (a9lim.github.io content/home/horizons.md)
# AECI 95% intervals: the whiskers on METR's chart (bootstrap over benchmarks), as aeci_whiskers.py reads them.
# 3.5 Sonnet is the scale's anchor and has none.
WHISKER = {'3 Opus': (117.8, 127.5), '3.5 Sonnet New': (127.4, 136.9), '3.7 Sonnet': (138.0, 143.6), 'Opus 4': (140.8, 147.1),
           'Sonnet 4.5': (144.6, 151.1), 'Opus 4.5': (148.4, 155.0), 'Opus 4.6': (153.1, 160.5),
           'Mythos Preview Early': (154.3, 169.5), 'Mythos Preview': (159.9, 172.7), 'Mythos 5': (162.5, 177.1),
           'Model 2 Early': (165.0, 181.9), 'Model 2': (166.7, 185.7), 'Model 3 Early': (169.0, 188.9),
           'Model 3': (169.2, 190.6), 'Model 4': (170.6, 192.8)}
# METR's keys: the name the figure shows, and the model's point on the AECI chart where it has one
NAME = {'gpt2': 'GPT-2', 'davinci_002': 'davinci-002', 'gpt_3_5_turbo_instruct': 'GPT-3.5 Turbo Instruct', 'gpt_4': 'GPT-4',
        'gpt_4_1106_inspect': 'GPT-4 Turbo', 'gpt_4o_inspect': 'GPT-4o', 'claude_3_5_sonnet_20240620_inspect': 'Claude 3.5 Sonnet',
        'o1_preview': 'o1-preview', 'claude_3_5_sonnet_20241022_inspect': 'Claude 3.5 Sonnet (Oct 2024)', 'o1_inspect': 'o1',
        'claude_3_7_sonnet_inspect': 'Claude 3.7 Sonnet', 'o3_inspect': 'o3', 'gpt_5_2025_08_07_inspect': 'GPT-5',
        'gemini_3_pro': 'Gemini 3 Pro', 'claude_opus_4_5_inspect': 'Claude Opus 4.5', 'gpt_5_2': 'GPT-5.2',
        'claude_opus_4_6_inspect': 'Claude Opus 4.6', 'claude_mythos_preview_early_inspect': 'Mythos Preview (early)',
        'claude_3_opus_inspect': 'Claude 3 Opus', 'claude_4_opus_inspect': 'Claude Opus 4'}
ON_CHART = {'claude_3_opus_inspect': '3 Opus', 'claude_3_5_sonnet_20240620_inspect': '3.5 Sonnet',
            'claude_3_5_sonnet_20241022_inspect': '3.5 Sonnet New', 'claude_3_7_sonnet_inspect': '3.7 Sonnet',
            'claude_4_opus_inspect': 'Opus 4', 'claude_opus_4_5_inspect': 'Opus 4.5', 'claude_opus_4_6_inspect': 'Opus 4.6',
            'claude_mythos_preview_early_inspect': 'Mythos Preview Early'}
EARLY = 'claude_mythos_preview_early_inspect'
# AECI chart point -> the same or sibling public model in Epoch's index
PUBLIC = {'3 Opus': 'Claude 3 Opus', '3.5 Sonnet': 'Claude 3.5 Sonnet', '3.5 Sonnet New': 'Claude 3.5 Sonnet (October 2024)',
          '3.7 Sonnet': 'Claude 3.7 Sonnet', 'Opus 4': 'Claude Opus 4', 'Sonnet 4.5': 'Claude Sonnet 4.5', 'Opus 4.5': 'Claude Opus 4.5',
          'Opus 4.6': 'Claude Opus 4.6', 'Opus 4.7': 'Claude Opus 4.7', 'Opus 4.8': 'Claude Opus 4.8', 'Mythos 5': 'Claude Fable 5',
          'Opus 5': 'Claude Opus 5', 'Mythos 5.1': 'Claude Fable 5.1', 'Opus 5.5': 'Claude Opus 5.5', 'Model 3': 'Claude Fable 5.2'}

def day(t):
    """The date of a decimal year, to the nearest day."""
    y = int(t); y0 = dt.date(y, 1, 1)
    return y0 + dt.timedelta(days=round((t - y) * (dt.date(y + 1, 1, 1) - y0).days))

def row(name, t, th=None, aeci=None):
    """One model: a decimal year, then (value, low, high) for its horizon in log2 hours and for its score, or None."""
    return dict(name=name, t=float(t), th=th, aeci=aeci)

def models(early='chart'):
    """(record series, calibration-only models), rounded as the figure's table prints them.

    Measured record holders take their public release date. Internal checkpoints take the date METR's AECI
    chart gives them (when most Anthropic staff could use them). The early Mythos Preview checkpoint is one;
    early='file' dates it as METR's horizon file and the tweet do, by the public Mythos Preview release."""
    A = {a[0]: a for a in AECI}
    score = lambda n: (round(A[n][2], 2), *WHISKER.get(n, (None, None)))
    series, calibration = [], []
    for t, v, k, sota, lo, hi in TH:
        n = ON_CHART.get(k)
        if not (sota or n): continue
        if k == EARLY and early == 'chart': t = yr(day(A[n][1]))
        th = tuple(float(np.log2(float(f'{x:.4g}') / 60)) for x in (v, lo, hi))
        (series if sota else calibration).append(row(NAME.get(k, k), t, th, score(n) if n else None))
    last = A[ON_CHART[EARLY]][1]            # AECI record holders after the last measured one
    series += [row(a[0], yr(day(a[1])), aeci=score(a[0])) for a in AECI if a[4] and a[1] > last]
    return sorted(series, key=lambda r: r['t']), calibration

def table():
    """The figure's two tables, as lines of content/home/horizons.md."""
    cells = lambda r, fv, fc: ('', '') if r is None else (fv(r[0]), '' if r[1] is None else f'{fc(r[1])}–{fc(r[2])}')
    g4, out = lambda x: f'{x:.4g}', []
    for head, rows in zip(('Model', 'Calibration only'), models()):
        out += [f'| {head} | Date | Horizon (min) | Horizon 95% | AECI | AECI 95% |', '| --- | --- | --- | --- | --- | --- |']
        for r in rows:
            th = r['th'] and tuple(60 * 2 ** x for x in r['th'])
            c = (r['name'], day(r['t']).isoformat(), *cells(th, g4, g4), *cells(r['aeci'], lambda x: f'{x:.2f}', lambda x: f'{x:.1f}'))
            out.append(re.sub(' +', ' ', '| ' + ' | '.join(c) + ' |'))      # an empty cell is "| |"
    return out

if __name__ == '__main__':
    print('\n'.join(table()) + '\n')
    print('AECI (digitised):')
    for a in AECI: print(f'  {a[0]:22s} {a[1]:.3f}  {a[2]:6.1f}  {a[3]:8s} {"frontier" if a[4] else ""}')
    print('check: Model 4 should be 178.6; 3.5 Sonnet 130')
    print('ECI frontier:')
    for f in eci_frontier(): print(f'  {f[0]:.3f} {f[1]:6.1f} {f[2]}')
    miss = [v for v in PAIR.values() if v not in ECI]; print('missing pairs', miss)
    print('unpaired METR models:', [k for _, _, k, _, _, _ in TH if k not in PAIR])
