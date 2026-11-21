"""The inputs, each read in one place: Epoch's data, AECI read off METR's chart, METR's v1.1 horizons, and the
figure's own table (content/home/horizons.md, read by the site's reader). One registry names every model across them.

    python series.py      # checks the figure's table against the sources it was made from, then prints the inputs

The figure's series is the table: models() reads it. from_sources() rebuilds it from METR's file and the AECI
readings, as a check on the table, not a second copy of it.

fable, 2026-11-11 (claude-fable-5-2). The AECI intervals and the chart dating of the early Mythos Preview
checkpoint are Opus 5.5's, from building that figure the same day; the registry, the Epoch loader and reading the
table, Opus 5.5 (claude-opus-5-5), 2026-11-20.
"""
import csv, datetime as dt, json, os, re
import numpy as np, yaml

D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data') + os.sep

def yr(d):
    if isinstance(d, str): d = dt.date.fromisoformat(d)
    y0 = dt.date(d.year, 1, 1); y1 = dt.date(d.year + 1, 1, 1)
    return d.year + (d - y0).days / (y1 - y0).days

# ---- Epoch: the 12 November snapshot of benchmark_data.zip (scores, every benchmark result, fitted difficulties and
# slopes), and Epoch's model pages for three models on 19 November, a later and partial source that the analyses
# layer on where they say so
EPOCH_DIR = D + 'epoch-2026-11-12' + os.sep
EPOCH_SCORES = {r['Model']: r for r in csv.DictReader(open(EPOCH_DIR + 'eci_scores.csv')) if r['eci']}
EPOCH_ROWS = list(csv.DictReader(open(EPOCH_DIR + 'eci_benchmarks.csv')))
EDI = {r['benchmark_name']: (float(r['edi']), float(r['estimated_slope_scaled'])) for r in csv.DictReader(open(EPOCH_DIR + 'edi_scores.csv'))}
_PAGES = json.load(open(D + os.path.join('epoch-2026-11-19', 'model_pages.json')))
SLUG = {'arc_agi_2': 'ARC-AGI-2', 'arc_agi': 'ARC-AGI', 'rli': 'Remote Labor Index', 'simplebench': 'SimpleBench', 'weirdml': 'WeirdML',
        'weirdml_v3': 'WeirdML v3', 'frontierswe': 'FrontierSWE', 'gso': 'GSO-Bench', 'balrog': 'Balrog', 'apex_agents': 'APEX-Agents',
        'posttrainbench': 'PostTrainBench', 'frontiercode': 'FrontierCode', 'proofbench': 'ProofBench', 'dtbench': 'DTBench'}
PAGE_SCORES = {m: {SLUG.get(k, k): p for k, p in v.items()} for m, v in _PAGES['scores'].items()}
PAGE_ECI = {m: tuple(v) for m, v in _PAGES['eci'].items()}       # (ECI, low, high)

ECI = {}
for m, r in EPOCH_SCORES.items():
    lo = float(r['eci_ci_low']) if r['eci_ci_low'] else float(r['eci'])
    hi = float(r['eci_ci_high']) if r['eci_ci_high'] else float(r['eci'])
    ECI[m] = (yr(r['date']), float(r['eci']), lo, hi)

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

# ---- the record series, as a9l.im's figure carries it (a9lim.github.io content/home/horizons.md)
# AECI 95% intervals: the whiskers on METR's chart (bootstrap over benchmarks), as aeci_whiskers.py reads them.
# 3.5 Sonnet is the scale's anchor and has none.
WHISKER = {'3 Opus': (117.8, 127.5), '3.5 Sonnet New': (127.4, 136.9), '3.7 Sonnet': (138.0, 143.6), 'Opus 4': (140.8, 147.1),
           'Sonnet 4.5': (144.6, 151.1), 'Opus 4.5': (148.4, 155.0), 'Opus 4.6': (153.1, 160.5),
           'Mythos Preview Early': (154.3, 169.5), 'Mythos Preview': (159.9, 172.7), 'Mythos 5': (162.5, 177.1),
           'Model 2 Early': (165.0, 181.9), 'Model 2': (166.7, 185.7), 'Model 3 Early': (169.0, 188.9),
           'Model 3': (169.2, 190.6), 'Model 4': (170.6, 192.8)}
# ---- Fable 5.2's system card (published under Claude Mythos 5.2), https://assets.claude.com/27d60918d218125e7504bc7354c4b4626ec56b11.pdf,
# Table 2.3.5.3.A: AECI on Anthropic's 6 November fit, with global and local 95% intervals, and the internal dates its
# Figure 2.3.5.3.B plots (read off the figure's ticks). Its Mythos 5.2 is METR's Model 3 and its unreleased internal
# research model is METR's Model 4, by date and score; METR's own note in the card names its tested snapshot Model 3 Early.
# The card's AECI is the snapshot Anthropic judged most capable on AI R&D, not necessarily the release snapshot.
CARD = {   # name in the card: (AECI, global low, global high, local low, local high, the AECI chart's label, date plotted)
    'Claude Mythos Preview': (165.71, 162.70, 169.65, 164.01, 168.00, 'Mythos Preview', None),
    'Claude Mythos 5': (168.68, 165.24, 172.99, 167.72, 169.72, 'Mythos 5', None),
    'Claude Opus 5': (169.40, 165.83, 173.89, 168.27, 170.73, 'Opus 5', None),
    'Claude Mythos 5.1': (172.62, 168.51, 177.63, 171.41, 174.10, 'Mythos 5.1', '2026-08-07'),
    'Claude Opus 5.5': (174.78, 170.33, 180.29, 173.47, 176.40, 'Opus 5.5', '2026-09-09'),
    'Claude Mythos 5.2': (177.12, 172.42, 182.94, 175.75, 178.48, 'Model 3', '2026-09-21'),
    'Internal model': (178.78, 173.75, 185.18, 177.08, 180.59, 'Model 4', '2026-09-25'),
}

# ---- one registry of names. A row per model the analyses name, in the spelling of each source:
#   the figure's (and this check's) name | METR v1.1 key | METR's 20 November name | Epoch's name | AECI chart label
REGISTRY = [
    ('GPT-2', 'gpt2', None, None, None),
    ('davinci-002', 'davinci_002', None, None, None),
    ('GPT-3.5 Turbo Instruct', 'gpt_3_5_turbo_instruct', None, None, None),
    ('GPT-4', 'gpt_4', 'GPT-4 0314', 'GPT-4 (Mar 2023)', None),
    ('GPT-4 Turbo', 'gpt_4_1106_inspect', 'GPT-4 1106', 'GPT-4 Turbo (Nov 2023)', None),
    ('Claude 3 Opus', 'claude_3_opus_inspect', 'Claude 3 Opus', 'Claude 3 Opus', '3 Opus'),
    ('GPT-4 Turbo (Apr 2024)', 'gpt_4_turbo_inspect', 'GPT-4 Turbo', 'GPT-4 Turbo (Apr 2024)', None),
    ('GPT-4o', 'gpt_4o_inspect', 'GPT-4o', 'GPT-4o (May 2024)', None),
    ('Claude 3.5 Sonnet', 'claude_3_5_sonnet_20240620_inspect', 'Claude 3.5 Sonnet (Old)', 'Claude 3.5 Sonnet', '3.5 Sonnet'),
    ('o1-preview', 'o1_preview', 'o1-preview', 'o1-preview', None),
    ('Claude 3.5 Sonnet (Oct 2024)', 'claude_3_5_sonnet_20241022_inspect', 'Claude 3.5 Sonnet (New)', 'Claude 3.5 Sonnet (October 2024)', '3.5 Sonnet New'),
    ('o1', 'o1_inspect', 'o1', 'o1', None),
    ('Claude 3.7 Sonnet', 'claude_3_7_sonnet_inspect', 'Claude 3.7 Sonnet', 'Claude 3.7 Sonnet', '3.7 Sonnet'),
    ('o3', 'o3_inspect', 'o3', 'o3', None),
    ('Claude Opus 4', 'claude_4_opus_inspect', 'Claude Opus 4', 'Claude Opus 4', 'Opus 4'),
    ('Claude Opus 4.1', 'claude_4_1_opus_inspect', 'Claude Opus 4.1', 'Claude Opus 4.1', None),
    ('GPT-5', 'gpt_5_2025_08_07_inspect', 'GPT-5', 'GPT-5', None),
    ('Claude Sonnet 4.5', None, None, 'Claude Sonnet 4.5', 'Sonnet 4.5'),
    ('Gemini 3 Pro', 'gemini_3_pro', 'Gemini 3 Pro', 'Gemini 3 Pro', None),
    ('GPT-5.1-Codex-Max', 'gpt_5_1_codex_max_inspect', 'GPT-5.1-Codex-Max', None, None),
    ('Claude Opus 4.5', 'claude_opus_4_5_inspect', 'Claude Opus 4.5', 'Claude Opus 4.5', 'Opus 4.5'),
    ('GPT-5.2', 'gpt_5_2', 'GPT-5.2', 'GPT-5.2', None),
    ('GPT-5.3-Codex', 'gpt_5_3_codex', 'GPT-5.3-Codex', None, None),
    ('Claude Opus 4.6', 'claude_opus_4_6_inspect', 'Claude Opus 4.6', 'Claude Opus 4.6', 'Opus 4.6'),
    ('Gemini 3.1 Pro', 'gemini_3_1_pro', 'Gemini 3.1 Pro', 'Gemini 3.1 Pro', None),
    ('GPT-5.4', 'gpt_5_4', 'GPT-5.4', 'GPT-5.4', None),
    ('Mythos Preview (early)', 'claude_mythos_preview_early_inspect', 'Claude Mythos Preview (early)', None, 'Mythos Preview Early'),
    ('Mythos Preview', None, None, None, 'Mythos Preview'),
    ('Claude Opus 4.7', None, 'Claude Opus 4.7', 'Claude Opus 4.7', 'Opus 4.7'),
    ('GPT-5.5', None, 'GPT-5.5', 'GPT-5.5', None),
    ('Claude Opus 4.8', None, 'Claude Opus 4.8', 'Claude Opus 4.8', 'Opus 4.8'),
    ('Claude Fable 5', None, 'Claude Fable 5', 'Claude Fable 5', 'Mythos 5'),
    ('GPT-5.6 Sol', None, 'GPT-5.6 Sol', 'GPT-5.6 Sol', None),
    ('Model 2 Early', None, None, None, 'Model 2 Early'),
    ('Claude Opus 5', None, 'Claude Opus 5', 'Claude Opus 5', 'Opus 5'),
    ('Model 2', None, None, None, 'Model 2'),
    ('Claude Fable 5.1', None, 'Claude Fable 5.1', 'Claude Fable 5.1', 'Mythos 5.1'),
    ('GPT-6 Astra', None, 'GPT-6 Astra', 'GPT-6 Astra', None),
    ('Model 3 Early', None, None, None, 'Model 3 Early'),
    ('Claude Opus 5.5', None, 'Claude Opus 5.5', 'Claude Opus 5.5', 'Opus 5.5'),
    ('GPT-6 Luna', None, 'GPT-6 Luna', 'GPT-6 Luna', None),
    ('Model 3', None, None, None, 'Model 3'),
    ('Model 4', None, None, None, 'Model 4'),
    ('Claude Haiku 5.5', None, 'Claude Haiku 5.5', 'Claude Haiku 5.5', None),
]
FIG, V11, METR, EPOCH, CHART = range(5)
def names(a, b):
    """{name in source a: name in source b} over the registry rows that have both."""
    return {r[a]: r[b] for r in REGISTRY if r[a] and r[b]}
NAME = names(V11, FIG)                  # v1.1 key -> the figure's name
PAIR = names(V11, EPOCH)                # the 20 v1.1 models Epoch also scores
ON_CHART = names(V11, CHART)            # the 8 v1.1 models on METR's AECI chart
# AECI chart point -> the same or sibling public model in Epoch's index. Model 3 as Fable 5.2 began as a guess by score
# and timing; Fable 5.2's system card bears it out (CARD above), though its AECI is a pre-release snapshot's. The
# analyses written before the card drop it as unconfirmed.
PUBLIC = {**names(CHART, EPOCH), 'Model 3': 'Claude Fable 5.2'}
EARLY = 'claude_mythos_preview_early_inspect'

def day(t):
    """The date of a decimal year, to the nearest day."""
    y = int(t); y0 = dt.date(y, 1, 1)
    return y0 + dt.timedelta(days=round((t - y) * (dt.date(y + 1, 1, 1) - y0).days))

def row(name, t, th=None, aeci=None):
    """One model: a decimal year, then (value, low, high) for its horizon in log2 hours and for its score, or None."""
    return dict(name=name, t=float(t), th=th, aeci=aeci)

def models(early='chart'):
    """(record series, calibration-only models): the figure's two tables, read by the site's reader (bridge.mjs).

    Measured record holders take their public release date. Internal checkpoints take the date METR's AECI
    chart gives them (when most Anthropic staff could use them). The early Mythos Preview checkpoint is one;
    early='file' dates it as METR's horizon file and the tweet do, by the public Mythos Preview release."""
    from bridge import js
    r = js('read'); tup = lambda v: None if v is None else (v['v'], v['lo'], v['hi'])
    series, calibration = ([row(m['name'], m['t'], tup(m['th']), tup(m['aeci'])) for m in r[k]] for k in ('series', 'calibration'))
    if early == 'file':
        t = next(t for t, _, k, *_ in TH if k == EARLY)
        series = sorted((row(m['name'], t, m['th'], m['aeci']) if m['name'] == NAME[EARLY] else m for m in series), key=lambda m: m['t'])
    return series, calibration

def from_sources():
    """The figure's two tables rebuilt from METR's v1.1 file and the AECI readings above, rounded as the table prints
    them. A check on the table (python series.py), not a second source of it."""
    A = {a[0]: a for a in AECI}
    score = lambda n: (round(A[n][2], 2), *WHISKER.get(n, (None, None)))
    series, calibration = [], []
    for t, v, k, sota, lo, hi in TH:
        n = ON_CHART.get(k)
        if not (sota or n): continue
        if k == EARLY: t = yr(day(A[n][1]))
        th = tuple(float(np.log2(float(f'{x:.4g}') / 60)) for x in (v, lo, hi))
        (series if sota else calibration).append(row(NAME.get(k, k), t, th, score(n) if n else None))
    last = A[ON_CHART[EARLY]][1]            # AECI record holders after the last measured one
    series += [row(a[0], yr(day(a[1])), aeci=score(a[0])) for a in AECI if a[4] and a[1] > last]
    return sorted(series, key=lambda r: r['t']), calibration

def table():
    """The figure's two tables as from_sources() makes them, as lines of content/home/horizons.md."""
    cells = lambda r, fv, fc: ('', '') if r is None else (fv(r[0]), '' if r[1] is None else f'{fc(r[1])}–{fc(r[2])}')
    g4, out = lambda x: f'{x:.4g}', []
    for head, rows in zip(('Model', 'Calibration only'), from_sources()):
        out += [f'| {head} | Date | Horizon (min) | Horizon 95% | AECI | AECI 95% |', '| --- | --- | --- | --- | --- | --- |']
        for r in rows:
            th = r['th'] and tuple(60 * 2 ** x for x in r['th'])
            c = (r['name'], day(r['t']).isoformat(), *cells(th, g4, g4), *cells(r['aeci'], lambda x: f'{x:.2f}', lambda x: f'{x:.1f}'))
            out.append(re.sub(' +', ' ', '| ' + ' | '.join(c) + ' |'))      # an empty cell is "| |"
    return out

if __name__ == '__main__':
    here = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'content', 'home', 'horizons.md')
    theirs = [l.rstrip() for l in open(here) if l.startswith('|')]; mine = table()
    print('the figure\'s table against its sources:', 'identical' if mine == theirs else 'DIFFERENT')
    for a, b in zip(mine, theirs):
        if a != b: print('  sources:', a, '\n  table:  ', b)
    A_ = {a[0]: a for a in AECI}
    print("Fable 5.2's system card against the readings of METR's chart (AECI, then date):")
    for n, (v, gl, gh, ll, lh, lab, d) in CARD.items():
        print(f"  {n:22s} card {v:6.2f} (global {gl:.1f}–{gh:.1f})  chart's {lab:15s} {A_[lab][2]:6.2f}  {v - A_[lab][2]:+.2f}"
              + (f"   dated {d}, chart {day(A_[lab][1])}" if d else ''))
    print('AECI (digitised):')
    for a in AECI: print(f'  {a[0]:22s} {a[1]:.3f}  {a[2]:6.1f}  {a[3]:8s} {"frontier" if a[4] else ""}')
    print('check: Model 4 should be 178.6; 3.5 Sonnet 130')
    print('ECI frontier:')
    for f in eci_frontier(): print(f'  {f[0]:.3f} {f[1]:6.1f} {f[2]}')
    miss = [v for v in PAIR.values() if v not in ECI]; print('missing pairs', miss)
    print('unpaired METR models:', [k for _, _, k, _, _, _ in TH if k not in PAIR])
