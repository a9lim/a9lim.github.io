"""Does the fit here agree with the one a9l.im was built with?

    python parity.py [path to a9lim.github.io]      # default: this repo (../..); needs node and a built dist/

Compares the table (series.py against content/home/horizons.md) and every number the site's build emits
(fit.py against dist/src/horizon-data.js). The two fits share a seed and a generator, so they should differ
only by rounding in the last digit the site prints.

fable, 2026-11-11 (claude-fable-5-2)
"""
import json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from series import models, table
from fit import fit_horizons

site = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..'))
theirs = [l.rstrip() for l in open(os.path.join(site, 'content', 'home', 'horizons.md')) if l.startswith('|')]
mine = table()
print('table:', 'identical' if mine == theirs else 'DIFFERENT')
for a, b in zip(mine, theirs):
    if a != b: print('  here:', a, '\n  site:', b)

js = "import(process.argv[1]).then(m => console.log(JSON.stringify(m.HORIZON)))"
H = json.loads(subprocess.run(['node', '-e', js, os.path.join(site, 'dist', 'src', 'horizon-data.js')], capture_output=True, text=True, check=True).stdout)
F = fit_horizons(*models())
worst = {}
def diff(what, a, b, digits):
    """a here, b on the site (null where infinite); count disagreements after rounding as the site does."""
    a, b = np.asarray(a, float).ravel(), np.array([np.inf if v is None else v for v in np.ravel(b)], float)
    with np.errstate(invalid='ignore'): d = np.where(np.isinf(a) | np.isinf(b), np.where(np.isinf(a) & np.isinf(b), 0, np.inf), np.abs(a - b))
    worst[what] = (float(d.max()), int((np.abs(d) > 0.5000001 * 10 ** -digits).sum()), len(d))
diff('map', [*F['map'], F['map_sd']], [H['map'][k] for k in ('b0', 'b1', 's')], 4)
for view, V in F['views'].items():
    S = H['views'][view]
    diff(f'{view} points', [p[:3] for p in V['points'] if p[1] is not None], [p[:3] for p in S['points'] if p[1] is not None], 4)
    diff(f'{view} hyperbola', [V['hyp'][k] for k in ('a', 'alpha', 'ts', 'low', 'high', 'exponent')], [S['hyperbolic'][k] for k in ('a', 'alpha', 'ts', 'low', 'high', 'exponent')], 4)
    diff(f'{view} double exponential', [V['dexp'][k] for k in ('d0', 'd1', 'c')], [S['doubleExponential'][k] for k in ('d0', 'd1', 'c')], 4)
    diff(f'{view} band grid', V['band']['t'], S['band']['t'], 4)
    for k in ('hyp', 'dexp'): diff(f'{view} {k} band', V['band'][k], S['band'][k], 3)
print('fit: largest difference from the site, and numbers that round differently')
for k, (d, bad, n) in worst.items(): print(f'  {k:28s} {d:.1e}   {bad} of {n}')
