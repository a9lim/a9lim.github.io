"""The singularity fit with late horizons from the software-ECI route, and with no AECI at all. Opus 5.5, 2026-11-12."""
import sys, os, io, contextlib, math, runpy
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
with contextlib.redirect_stdout(io.StringIO()):
    G = runpy.run_path(os.path.join(HERE, 'software_route.py'), run_name='lib')
sys.argv = ['x']
import three_scales as T
from fit import hyp, hyp_at, FITS, aicc, quantile
from series import models, yr, day
HA, HS, AS, AS7, swe, sc, A, PAIR = G['HA'], G['HS'], G['AS'], G['AS7'], G['swe'], G['sc'], G['A'], G['PAIR']
S, _ = models()
def mk(M):
    L = np.linalg.cholesky(M['s'] ** 2 * M['Vi'])
    return lambda R: M['b'] + L @ R.standard_normal(2) / math.sqrt(R.chisquare(M['df']) / M['df'])
draws = {'HA': mk(HA), 'HS': mk(HS), 'AS': mk(AS), 'AS7': mk(AS7)}
f = lambda b, x: b[0] + b[1] * (x - 150)
measured = [dict(name=m['name'], t=m['t'], y=lambda mp, v=m['th'][0]: v, conv=False) for m in S if m['th']]
internal = [m for m in S if not m['th']]
last = max(m['t'] for m in measured)
public = [m for m in sc if yr(sc[m]['date']) > last and m not in PAIR.values() and swe(m)]
def series(route, with_public, with_internal=True):
    out = list(measured)
    if with_internal:
        for m in internal:
            a = m['aeci'][0]
            fn = (lambda mp, a=a: f(mp['HA'], a)) if route == 'HA' else (lambda mp, a=a, k=route: f(mp['HS'], f(mp[k], a)))
            out.append(dict(name=m['name'], t=m['t'], y=fn, conv=True))
    if with_public:
        for m in public:
            out.append(dict(name=m, t=yr(sc[m]['date']), y=lambda mp, s=swe(m)[0]: f(mp['HS'], s), conv=True))
    central = {k: M['b'] for k, M in (('HA', HA), ('HS', HS), ('AS', AS), ('AS7', AS7))}
    out.sort(key=lambda m: m['t']); rec, best, i = [], -1e9, 0
    while i < len(out):
        j = i
        while j < len(out) and out[j]['t'] == out[i]['t']: j += 1
        top = max(out[i:j], key=lambda m: m['y'](central))
        if top['y'](central) > best: best = top['y'](central); rec.append(top)
        i = j
    return rec, central
def run(label, route, with_public, with_internal=True, B=2000):
    rec, central = series(route, with_public, with_internal)
    t = np.array([m['t'] for m in rec]); y = np.array([m['y'](central) for m in rec]); n = len(t)
    H = hyp(t, y[None]); fh = hyp_at(t, *H[:3])[0]; R = np.random.default_rng(1); Y = np.empty((B, n))
    for b in range(B):
        mp = {k: d(R) for k, d in draws.items()}
        Y[b] = np.array([m['y'](mp) for m in rec]) + (y - fh)[R.integers(0, n, n)]
    ts = np.sort(hyp(t, Y)[2])
    fits = {q['name']: q for q in (F(t, y) for F in FITS)}
    for q in fits.values(): q['aicc'] = aicc(n, q['sse'], q['p'])
    lead = min(q['aicc'] for k, q in fits.items() if k != 'hyperbolic') - fits['hyperbolic']['aicc']
    tau, share = T.drift(t, y)
    late = [f"{m['name']} {day(m['t']):%b} {2 ** m['y'](central):.0f}h" for m in rec if m['t'] > last]
    print(f"{label:58s} n={n}  {H[2][0]:.2f} ({quantile(ts, 0.025):.2f}-{quantile(ts, 0.975):.2f})  alpha {H[1][0]:.2f}  AICc {lead:+.1f}  tau {tau:+.2f} [dexp {share['double exponential']:.3f}]")
    print('      after the last measurement: ' + ', '.join(late))
run('hours view (internal checkpoints AECI -> horizon)', 'HA', False)
run('internal via AECI -> software ECI -> horizon', 'AS', False)
run('  same, AECI -> software line from Opus 4.6', 'AS7', False)
run('internal via software route + public software-ECI models', 'AS', True)
run('no AECI: measured + public models via software ECI only', 'AS', True, with_internal=False)
