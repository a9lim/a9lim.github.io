"""Shoals — the shoal is the chart.

Shallow water in daylight, seen from straight above. A sand shoal lies under
clear water, and its edge, read left to right, is a price path: two years of
daily closes drawn from Shoals' own model (geometric Brownian motion with
Heston variance and Merton jumps, the Dynamic preset's constants, sixteen
substeps a day), softened by a few days as water softens sand. Under the
curve is sand and turquoise shallows; above it the bottom drops away.

What each mark reads:

- The edge of the shoal is the smoothed close. Behind it the sand ridges run
  parallel to it, each an older shoreline of the same path, smoother the
  further back it lies.
- Colour is depth: sand seen through water that takes the red out of the
  light first, then the green. Off the edge the bottom falls away fastest
  where the path fell: the shelf is broad off the run-up and short off the
  break.
- The swell comes in from the upper left. Its crests are the level sets of
  its travel time over this bottom at the shallow-water speed, so they slow,
  bunch up and turn to face the shoal, wrap round the point, and break into
  foam where the edge faces them. Over the shoal what is left of them runs
  on as wavelets.
- The red buoys are the down moves: one moored off the edge on every day the
  close fell by more than 3.5%, larger for a larger fall. Nothing else is red.
- The boat keeps to the deep side of the run-up, short of the break.

The sea is kept quiet at the top left, where the card's type is set.

    python3 shoals.py [scale=2] [out=../art/shoals.png]

Painted by Claude, 2026-11-11.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from scipy.ndimage import distance_transform_edt, gaussian_filter, gaussian_filter1d, map_coordinates
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import dijkstra

from brush import (F, Canvas, replace, col, mix, arc, resample, path_len,
                   FLAT, ROUND, FILBERT, DRY, SOFT, LINE, LINER)

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                         "..", "art", "shoals.png")
t0 = time.time()

# ------------------------------------------------------------- the price ----
# projects/shoals/src/config.js, PRESETS[5] (Dynamic), and src/simulation.js substep().
MODEL = dict(mu=0.48, theta=0.06, kappa=2.5, xi=0.4, rho=-0.6, lam=0.6, muJ=-0.02, sigmaJ=0.04)
YEAR, SUB, DAYS, SEED = 252, 16, 504, 169346


def price_path(seed=SEED, days=DAYS, p=MODEL):
    """Daily closes of one run: Heston variance (Milstein), Merton jumps, log-price update."""
    r = np.random.default_rng(seed)
    n = days * SUB
    z1, zb = r.standard_normal(n), r.standard_normal(n)
    nj, zj = r.poisson(p["lam"] / (YEAR * SUB), n), r.standard_normal(n)
    z2 = p["rho"] * z1 + np.sqrt(1 - p["rho"] ** 2) * zb
    dt = 1 / (YEAR * SUB)
    sdt = np.sqrt(dt)
    k = np.exp(p["muJ"] + 0.5 * p["sigmaJ"] ** 2) - 1
    v, ls = p["theta"], 0.0
    logs = np.zeros(n + 1)
    for i in range(n):
        vp = max(v, 0.0)
        sq = np.sqrt(vp)
        v = max(vp + p["kappa"] * (p["theta"] - vp) * dt + p["xi"] * sq * sdt * z2[i]
                + 0.25 * p["xi"] ** 2 * (z2[i] ** 2 - 1) * dt, 0.0)
        jump = p["muJ"] * nj[i] + p["sigmaJ"] * np.sqrt(nj[i]) * zj[i]
        ls += (p["mu"] - p["lam"] * k - 0.5 * vp) * dt + sq * sdt * z1[i] + jump
        logs[i + 1] = ls
    return 100 * np.exp(logs[::SUB])


CLOSE = price_path()
RET = np.diff(np.log(CLOSE))                       # RET[d - 1] is day d's move
X0, PX = -36.0, 2.46                               # day -> x
Y_LOW, Y_HIGH = 548.0, 126.0                       # the run's low and high -> y
SOFTEN = 2.6                                       # days the sea smooths over


def day_x(d):
    return X0 + PX * np.asarray(d, float)


def price_y(c):
    return Y_LOW - (np.asarray(c, float) - CLOSE.min()) / (CLOSE.max() - CLOSE.min()) * (Y_LOW - Y_HIGH)


# ------------------------------------------------------------ the bottom ----
M, G = 96, 2                                       # margin round the card, grid cell (nominal units)
gx = np.arange(-M, W + M + G, G, dtype=float)
gy = np.arange(-M, H + M + G, G, dtype=float)
NX, NY = len(gx), len(gy)
XX, YY = np.meshgrid(gx, gy)

_soft = gaussian_filter1d(np.concatenate([np.full(60, CLOSE[0]), CLOSE, np.full(60, CLOSE[-1])]), SOFTEN)
_days = np.arange(-60, DAYS + 61)
EDGE_Y = np.interp(gx, day_x(_days), price_y(_soft))       # the shoal's edge, y at each grid x


def edge_y(x):
    return np.interp(x, gx, EDGE_Y)


inside = YY > EDGE_Y[None, :]
D = (distance_transform_edt(~inside) - distance_transform_edt(inside)) * G     # > 0 over deep water
D = gaussian_filter(D - np.sign(D) * 0.5 * G, 1.2).astype(F)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


# Away from the edge the sea forgets its detail: the contours the brush follows, and the
# old shorelines in the lagoon, come from the distance smoothed more the further it is.
_w1, _w2 = smoothstep(16, 80, np.abs(D)), smoothstep(110, 320, np.abs(D))
DF = D * (1 - _w1) + gaussian_filter(D, 14 / G) * _w1
DF = (DF * (1 - _w2) + gaussian_filter(D, 46 / G) * _w2).astype(F)
_dy, _dx = np.gradient(D, G)
_dn = np.maximum(np.hypot(_dx, _dy), 1e-6)
NXF, NYF = (_dx / _dn).astype(F), (_dy / _dn).astype(F)     # unit normal, toward deep water


def samp(field, x, y, cell=G, order=1):
    x, y = np.asarray(x, float), np.asarray(y, float)
    out = map_coordinates(field, [(np.atleast_1d(y) + M) / cell, (np.atleast_1d(x) + M) / cell],
                          order=order, mode="nearest")
    return out.reshape(x.shape)


def noise(sigma, seed):
    a = gaussian_filter(np.random.default_rng(seed).standard_normal((NY, NX)), sigma / G)
    return (a / a.std()).astype(F)


N_RIDGE, N_BROAD, N_MOTTLE = noise(46, 11), noise(150, 12), noise(22, 13)

# Depth, in arbitrary metres. Outside the edge a rim of sand slope, a drop, and a shelf
# running out to deep water; rim and shelf are both short where the path fell and the
# edge stands upright, so the bottom falls away fastest off the break. Inside, the bar's
# crest, and behind it a lagoon whose ridges are older copies of the edge.
_lie = gaussian_filter(NYF ** 2, 12 / G)            # 1 where the edge lies flat, 0 where it stands
RIM = 9 + 20 * _lie
SHELF = 34 + 190 * _lie ** 1.5
_past = np.clip(D - RIM, 0, None)
_out = np.where(D < RIM, 0.32 + 1.5 * np.clip(D, 0, None) / RIM,
                1.82 + 0.125 * np.minimum(_past, 26) + 9.0 * np.clip((_past - 26) / SHELF, 0, 1)
                + 0.11 * np.clip(_past - 26 - SHELF, 0, None))
_s = np.clip(-DF, 0, None)
_lagoon = 0.15 + 1.75 * (1 - np.exp(-np.clip(_s - 10, 0, None) / 190))
_wave = 62 + 0.14 * _s
_ridge = 0.5 + 0.5 * np.cos(2 * np.pi * (_s - 6 + 26 * N_RIDGE) / _wave)
_in = _lagoon - 0.60 * _ridge * np.clip((_s - 6) / 40, 0, 1) * (0.35 + 0.65 * np.exp(-_s / 300)) \
    + 0.14 * N_MOTTLE * np.clip(_s / 60, 0, 1)
DEPTH = np.where(D > 0, _out, np.clip(_in, 0.06, None)).astype(F)

SAND = col(0.965, 0.915, 0.775)
DEEP = col(0.018, 0.180, 0.228)
ABSORB = col(0.38, 0.070, 0.032)


def water(h, tone=0.0):
    """Sand seen through h of water: the bottom filtered there and back, plus what the water scatters."""
    h = np.asarray(h, F)[..., None]
    scat = 1 - np.exp(-0.105 * h)
    c = SAND * np.exp(-1.6 * ABSORB * h) * (1 - 0.86 * scat) + DEEP * scat
    return (c * (1 + np.asarray(tone, F)[..., None])).astype(F)


def tone_at(x, y):
    return 0.085 * samp(N_BROAD, x, y)


def colour_at(x, y, lift=0.0):
    return water(samp(DEPTH, x, y) + lift, tone_at(x, y))


# -------------------------------------------------------------- the swell ---
# Travel time of a plane swell over this bottom: shortest paths from the open sea at
# the shallow-water speed, c ∝ √depth below a depth of 14 and constant beyond it.
SWELL = np.array([0.50, 0.866])                    # direction of travel: down and to the right
CELL = 4
_h = DEPTH[::CELL // G, ::CELL // G]
cy, cx = _h.shape
FEEL = 14.0
_slow = 1 / np.sqrt(np.clip(_h, 0.5, FEEL) / FEEL)
_idx = np.arange(cy * cx).reshape(cy, cx)
_rows, _cols, _wts = [], [], []
for dj, di in ((0, 1), (1, 0), (1, 1), (1, -1), (1, 2), (2, 1), (2, -1), (1, -2)):
    a = _idx[: cy - dj, max(0, -di): cx - max(0, di)]
    b = _idx[dj:, max(0, di): cx + min(0, di)]
    _rows.append(a.ravel())
    _cols.append(b.ravel())
    _wts.append((np.hypot(dj, di) * CELL * 0.5 * (_slow.ravel()[a] + _slow.ravel()[b])).ravel())
_src = cy * cx                                     # the open sea: the top and left sides, on the incoming front
_bx = np.concatenate([np.arange(cx), np.zeros(cy, int)])
_by = np.concatenate([np.zeros(cx, int), np.arange(cy)])
_t0 = (_bx * SWELL[0] + _by * SWELL[1]) * CELL
_rows.append(np.full(len(_bx), _src))
_cols.append(_by * cx + _bx)
_wts.append(_t0 - _t0.min() + 1.0)
_graph = coo_matrix((np.concatenate(_wts), (np.concatenate(_rows), np.concatenate(_cols))),
                    shape=(_src + 1, _src + 1)).tocsr()
TRAVEL = gaussian_filter(dijkstra(_graph, directed=False, indices=_src)[:_src].reshape(cy, cx), 1.3).astype(F)
_ty, _tx = np.gradient(TRAVEL, CELL)
_tn = np.maximum(np.hypot(_tx, _ty), 1e-6)
TDX, TDY = (_tx / _tn).astype(F), (_ty / _tn).astype(F)     # the way the swell is going, everywhere


def swell_dir(x, y):
    return np.stack([samp(TDX, x, y, CELL), samp(TDY, x, y, CELL)], -1)


def exposure(x, y):
    """How squarely the swell meets the edge here (0 in the lee, 1 head-on), by how far it has turned."""
    d = swell_dir(x, y)
    n = np.stack([samp(NXF, x, y), samp(NYF, x, y)], -1)
    head_on = np.clip(-(d * n).sum(-1), 0, 1)
    unturned = np.clip((d * SWELL).sum(-1), 0, 1) ** 2
    return head_on * (0.25 + 0.75 * unturned)


# -------------------------------------------------------------- contours ----
def contours(field, level, cell, minlen=0.0):
    """Level set of a gridded field as polylines in nominal units (marching squares)."""
    b = field > level
    ny, nx = field.shape
    with np.errstate(divide="ignore", invalid="ignore"):
        th = (level - field[:, :-1]) / (field[:, 1:] - field[:, :-1])
        tv = (level - field[:-1, :]) / (field[1:, :] - field[:-1, :])
    ch = b[:, :-1] != b[:, 1:]
    cv_ = b[:-1, :] != b[1:, :]
    top, bot, lef, rig = ch[:-1, :], ch[1:, :], cv_[:, :-1], cv_[:, 1:]
    jj, ii = np.mgrid[0:ny - 1, 0:nx - 1]
    nhv = ny * nx
    ids = ((top, jj * nx + ii), (bot, (jj + 1) * nx + ii), (lef, nhv + jj * nx + ii), (rig, nhv + jj * nx + ii + 1))
    cnt = top.astype(int) + bot + lef + rig
    two, four = cnt == 2, cnt == 4
    pairs = []
    for a in range(4):
        for c in range(a + 1, 4):
            m = two & ids[a][0] & ids[c][0]
            pairs.append(np.stack([ids[a][1][m], ids[c][1][m]], 1))
    pairs.append(np.stack([ids[0][1][four], ids[2][1][four]], 1))
    pairs.append(np.stack([ids[1][1][four], ids[3][1][four]], 1))
    adj = {}
    for p, q in np.vstack(pairs).tolist():
        adj.setdefault(p, []).append(q)
        adj.setdefault(q, []).append(p)

    def point(k):
        if k < nhv:
            j, i = divmod(k, nx)
            return (i + th[j, i]) * cell - M, j * cell - M
        j, i = divmod(k - nhv, nx)
        return i * cell - M, (j + tv[j, i]) * cell - M

    seen, out = set(), []

    def walk(k):
        path = [k]
        seen.add(k)
        while True:
            nxt = [n for n in adj[k] if n not in seen]
            if not nxt:
                return path
            k = nxt[0]
            seen.add(k)
            path.append(k)

    for k in [k for k, v in adj.items() if len(v) == 1]:
        if k not in seen:
            out.append(walk(k))
    for k in adj:
        if k not in seen:
            p = walk(k)
            out.append(p + [p[0]])
    polys = [np.array([point(k) for k in p], F) for p in out if len(p) > 2]
    return [p for p in polys if path_len(p) >= minlen]


def pieces(poly, lo, hi, rng, overlap=0.1, step=3.0):
    """Cut a polyline into strokes of random length."""
    p = resample(poly, step)
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*(p[1:] - p[:-1]).T))])
    s = -rng.uniform(0, lo)
    while s < d[-1]:
        ln = rng.uniform(lo, hi)
        m = (d >= s) & (d <= s + ln)
        if m.sum() >= 3:
            yield p[m]
        s += ln * (1 - overlap)


def on_card(p, pad=40.0):
    return (p[:, 0].max() > -pad) and (p[:, 0].min() < W + pad) and (p[:, 1].max() > -pad) and (p[:, 1].min() < H + pad)


def smooth(p, k=2.0):
    if len(p) < 5:
        return p
    q = np.stack([gaussian_filter1d(p[:, 0], k, mode="nearest"), gaussian_filter1d(p[:, 1], k, mode="nearest")], -1)
    q[0], q[-1] = p[0], p[-1]
    return q.astype(F)


# ----------------------------------------------------------------- paint ----
cv = Canvas(W, H, SCALE, ground=water(30.0), seed=SEED)
rng = cv.rng

# The ground is stained with the depth before any paint goes on, so no gap shows bare canvas.
_py, _px = np.mgrid[0:cv.H, 0:cv.W]
_px, _py = (_px + 0.5) / cv.s, (_py + 0.5) / cv.s
cv.img[:] = water(samp(DEPTH, _px, _py), tone_at(_px, _py))
del _px, _py

# The type sits on the deep water at the top left; the sea keeps quiet under it.
def hush(x, y):
    return float(np.clip(max((x - 470) / 150, (y - 372) / 80), 0, 1))


WATER = replace(FILBERT, streak=0.030, chroma=0.008, jitter=0.012, dry=0.1, thick=0.35)
SHALLOW = replace(FILBERT, streak=0.040, chroma=0.012, jitter=0.018, dry=0.12, thick=0.45)

# 1. The bottom, laid in along its own contours from the open sea inward and from the
#    lagoon outward, so the last strokes are the ones that draw the edge.
levels = []
d = 620.0
while d > 0.5:
    levels.append(d)
    d -= 0.5 * float(np.clip(4.0 + 0.2 * d, 4.0, 34.0))
d = -640.0
while d < -0.5:
    levels.append(d)
    d += 0.5 * float(np.clip(4.0 + 0.2 * -d, 4.0, 30.0))
levels += [3.0, 1.2, -1.5, -3.5, -6.0]
for lv in levels:
    width = float(np.clip(4.0 + 0.2 * abs(lv), 4.0, 34.0 if lv > 0 else 30.0)) * 1.25
    span = (60, 170) if abs(lv) < 40 else (150, 400)
    for poly in contours(DF, lv, G, minlen=12):
        for p in pieces(poly, *span, rng):
            if not on_card(p, width):
                continue
            if rng.random() < 0.5:
                p = p[::-1]
            c0, c1 = colour_at(p[0, 0], p[0, 1]), colour_at(p[-1, 0], p[-1, 1])
            cv.stroke(p, width * rng.uniform(0.9, 1.15), c0, WATER if lv > 30 else SHALLOW, color_end=c1)


# 2. The swell. Each crest is a line of equal travel time, one wavelength after the last:
#    a darker back and a lighter face, steepening as the water shoals (Green's law).
WAVELENGTH = 36.0
FOAM = col(0.975, 0.985, 0.97)
SKY = col(0.62, 0.86, 0.88)
t_lo, t_hi = float(TRAVEL.min()), float(TRAVEL.max())
for lv in np.arange(t_lo + 6, t_hi, WAVELENGTH):
    for poly in contours(TRAVEL, lv, CELL, minlen=50):
        for p in pieces(smooth(poly, 3.0), 90, 300, rng, overlap=-0.1):
            mid = p[len(p) // 2]
            if not on_card(p, 10) or rng.random() < 0.12:
                continue
            keep = samp(D, p[:, 0], p[:, 1]) > 4
            if keep.sum() < 6:
                continue
            p = p[keep]
            mid = p[len(p) // 2]
            h = float(samp(DEPTH, mid[0], mid[1]))
            steep = float(np.clip((FEEL / max(h, 0.8)) ** 0.25, 1, 2.0))
            lee = 0.3 + 0.7 * float(np.clip((swell_dir(mid[0], mid[1]) * SWELL).sum(), 0, 1)) ** 2
            q = steep * lee * (0.3 + 0.7 * hush(mid[0], mid[1]))
            gap = WAVELENGTH * float(np.sqrt(np.clip(h, 0.5, FEEL) / FEEL))
            way = swell_dir(p[:, 0], p[:, 1])
            cv.stroke(p - way * 0.30 * gap, 0.55 * gap, col(0.45, 0.62, 0.70), SOFT, mode="multiply",
                      opacity=0.13 * q, wobble=1.0)
            cv.lit_line(p + way * 0.08 * gap, 0.34 * gap, lambda x, y: mix(colour_at(x, y), SKY, 0.55), SOFT,
                        chunk=60.0, opacity=0.20 * q, soft=0.8, taper=(0.2, 0.2), tip=0.8)
            if h < 5.5 and lee > 0.6:                # close in, the crest itself catches the light
                def glint(x, y):
                    rise = float(np.clip((FEEL / max(float(samp(DEPTH, x, y)), 0.8)) ** 0.25, 1, 2.0)) - 1
                    return mix(colour_at(x, y), FOAM, 0.28 * rise * lee)

                cv.lit_line(p, 1.3, glint, LINER, chunk=30.0, opacity=0.8, taper=(0.3, 0.3), tip=0.3)

# 3. Over the shoal the swell is spent: what is left runs on as wavelets, a third the height
#    and a third the length, their light netting the sand.
for lv in np.arange(t_lo + 6, t_hi, WAVELENGTH / 3):
    for poly in contours(TRAVEL, lv, CELL, minlen=30):
        for p in pieces(smooth(poly, 2.0), 24, 80, rng, overlap=-0.6):
            mid = p[len(p) // 2]
            dm = float(samp(D, mid[0], mid[1]))
            if not on_card(p, 4) or dm > -9:
                continue
            h = float(samp(DEPTH, mid[0], mid[1]))
            if h < 0.22 or rng.random() > 0.6:
                continue
            fade = float(np.exp(dm / 260))
            base = colour_at(mid[0], mid[1])
            cv.stroke(p, 1.1, mix(base, FOAM, 0.22 * fade + 0.05), LINER, opacity=0.55, wobble=0.5,
                      taper=(0.4, 0.4), tip=0.1)

# 4. Dry sand: the highest of the bar stands clear of the water.
DRY_SAND = col(0.990, 0.960, 0.865)
for lv in np.arange(-3.0, -60.0, -2.6):
    for poly in contours(DF, lv, G, minlen=12):
        for p in pieces(poly, 16, 70, rng, overlap=0.15):
            mid = p[len(p) // 2]
            if on_card(p, 4) and float(samp(DEPTH, mid[0], mid[1])) < 0.17:
                cv.stroke(p, rng.uniform(2.8, 4.6), DRY_SAND, DRY, opacity=0.7, thick=0.6, grain=1.0, gap=0.2,
                          taper=(0.3, 0.3), tip=0.3)

# 5. Foam, where the swell breaks on the edge: most where the edge faces it, none in the lee.
EDGE = [smooth(c, 1.2) for c in contours(D, 0.0, G, minlen=200)]


def edge_points(step):
    out = []
    for c in EDGE:
        out.append(resample(c, step))
    return np.vstack(out)


for off, wid, chance in ((17.0, 1.4, 0.22), (12.0, 2.0, 0.45), (8.0, 3.0, 0.8), (5.0, 4.2, 1.0),
                         (2.0, 4.0, 1.0), (-1.5, 2.8, 0.7), (-5.5, 1.8, 0.4), (-10.0, 1.4, 0.25)):
    for poly in contours(D, off, G, minlen=40):
        for p in pieces(poly, 7, 34, rng, overlap=-0.25):
            mid = p[len(p) // 2]
            if not on_card(p, 4):
                continue
            e = float(exposure(mid[0], mid[1]))
            if rng.random() > chance * e ** 0.8 * 1.25:
                continue
            cv.stroke(p, wid * rng.uniform(0.7, 1.3) * (0.6 + 0.6 * e), FOAM, DRY, opacity=0.5 + 0.45 * e,
                      wobble=0.6, grain=1.3, thick=0.9)
for q in edge_points(3.0):                          # the wash it throws up the bar
    e = float(exposure(q[0], q[1]))
    if not (-10 < q[0] < W + 10) or rng.random() > 0.09 * e:
        continue
    n = np.array([samp(NXF, q[0], q[1]), samp(NYF, q[0], q[1])]).ravel()
    t = np.array([-n[1], n[0]])
    a = q + n * rng.uniform(-1, 4) + t * rng.uniform(-2, 2)
    b = a - n * rng.uniform(4, 13) * (0.5 + e) + t * rng.uniform(-9, 9)
    cv.stroke([a, (a + b) / 2 + t * rng.uniform(-1.5, 1.5), b], rng.uniform(1.0, 2.2), FOAM, LINER,
              opacity=0.35 + 0.4 * e, dry=0.7, grain=1.2, taper=(0.05, 0.6), tip=0.2)

for q in edge_points(2.0):                          # and the flecks left behind it
    e = float(exposure(q[0], q[1]))
    if (-10 < q[0] < W + 10) and rng.random() < 0.5 * e:
        n = np.array([samp(NXF, q[0], q[1]), samp(NYF, q[0], q[1])]).ravel()
        cv.dab(q + n * rng.uniform(-14, 16) + rng.normal(0, 1.5, 2), rng.uniform(0.6, 1.5), FOAM,
               opacity=rng.uniform(0.5, 0.95))

# 6. The boat, on the deep side of the run-up and short of the break, and the wake it has left.
lane = max(contours(DF, 44.0, G, minlen=400), key=path_len)
lane = smooth(resample(lane if lane[0, 0] < lane[-1, 0] else lane[::-1], 3.0), 16.0)
arc_s = np.concatenate([[0.0], np.cumsum(np.hypot(*(lane[1:] - lane[:-1]).T))])
i_boat = int(np.argmin(np.abs(arc_s - (arc_s[int(np.argmin(lane[:, 1]))] - 150))))
BOAT = lane[i_boat]
HEAD = lane[i_boat + 2] - lane[i_boat - 2]
HEAD = HEAD / np.hypot(*HEAD)
PORT = np.array([HEAD[1], -HEAD[0]])
astern = lane[:i_boat + 1][::-1]                    # the lane behind her, nearest first
aft = np.concatenate([[0.0], np.cumsum(np.hypot(*(astern[1:] - astern[:-1]).T))])
WAKE = 430.0
for a0 in np.arange(10, WAKE, 26):                  # the churned water astern, widening and fading
    m = (aft >= a0) & (aft <= a0 + 34)
    if m.sum() < 3:
        continue
    k = a0 / WAKE
    base = colour_at(*astern[m][len(astern[m]) // 2])
    cv.stroke(astern[m], 4.5 + 13 * k ** 0.7, mix(base, FOAM, 0.62 * (1 - k) ** 1.5 + 0.04), SOFT,
              opacity=0.85, soft=0.5, taper=(0.3, 0.3))
for a0 in np.arange(8, 120, 9):                     # foam in it, close astern
    m = (aft >= a0) & (aft <= a0 + rng.uniform(8, 16))
    if m.sum() >= 3 and rng.random() < 1.1 - a0 / 120:
        side = PORT * rng.uniform(-1, 1) * (1.5 + a0 * 0.03)
        cv.stroke(astern[m] + side, rng.uniform(1.4, 3.0), FOAM, DRY, opacity=0.9 - 0.5 * a0 / 120, grain=1.3)
for sgn in (-1, 1):                                 # the two arms of the wake, 19.5° off her track
    m = (aft >= 4) & (aft <= 150)
    tan = np.gradient(astern[m], axis=0)
    tan /= np.maximum(np.hypot(tan[:, 0], tan[:, 1]), 1e-6)[:, None]
    nor = np.stack([tan[:, 1], -tan[:, 0]], -1)
    arm = astern[m] + nor * sgn * (2.5 + (aft[m] - 4) * np.tan(np.radians(19.5)))[:, None]
    for i0 in range(0, len(arm) - 6, 9):
        k = i0 / len(arm)
        seg = arm[i0:i0 + 11]
        base = colour_at(*seg[len(seg) // 2])
        cv.stroke(seg, 2.0 - 1.0 * k, mix(base, FOAM, 0.6 * (1 - k) ** 1.5), LINER, opacity=0.85, wobble=0.3)


def boat_pt(fore, port=0.0):
    return BOAT + HEAD * fore + PORT * port


LOA, BEAM = 42.0, 12.5
with cv.layer(col(0.25, 0.40, 0.46), "multiply", 0.55, blur=1.2):          # her shadow on the water
    cv.stroke([boat_pt(-LOA / 2) + (4, 5), boat_pt(LOA / 2 - 3) + (4, 5)], BEAM, (0, 0, 0), ROUND,
              taper=(0.1, 0.5), tip=0.3)
hull = [boat_pt(-LOA / 2), boat_pt(-LOA / 4), boat_pt(LOA / 6), boat_pt(LOA / 2)]
cv.stroke(hull, BEAM, col(0.985, 0.975, 0.95), ROUND, taper=(0.05, 0.55), tip=0.12, streak=0.01, jitter=0.0,
          soft=0.12, thick=0.9, gap=0.0)
_shade = 1.0 if PORT @ np.array([0.6, 0.8]) > 0 else -1.0                           # the side away from the sun
cv.stroke([boat_pt(-LOA / 2 + 1, _shade * (BEAM / 2 - 0.8)), boat_pt(LOA / 6, _shade * (BEAM / 2 - 0.9)),
           boat_pt(LOA / 2 - 4, _shade * 1.6)], 1.3, col(0.62, 0.66, 0.70), LINER, opacity=0.9, gap=0.0)
cv.stroke([boat_pt(-LOA / 2 + 2.5), boat_pt(LOA / 5)], BEAM - 4.2, col(0.80, 0.69, 0.52), ROUND,
          taper=(0.05, 0.5), tip=0.25, streak=0.03, jitter=0.0, thick=0.3, gap=0.0)    # the deck
cv.stroke([boat_pt(-5.0), boat_pt(5.0)], BEAM - 4.4, col(0.97, 0.97, 0.96), FLAT, taper=(0, 0), tip=1.0,
          streak=0.0, jitter=0.0, dry=0.0, thick=0.9, gap=0.0)                         # the wheelhouse roof
cv.stroke([boat_pt(6.0, -3.2), boat_pt(6.0, 3.2)], 1.5, col(0.13, 0.20, 0.24), LINE)   # its windscreen
for sgn in (-1, 1):                                                                     # the bow wave
    cv.stroke([boat_pt(LOA / 2 - 2, sgn * 1.5), boat_pt(LOA / 3, sgn * (BEAM / 2 + 0.5)),
               boat_pt(LOA / 8, sgn * (BEAM / 2 + 2.5))], 1.6, FOAM, LINER, opacity=0.85, taper=(0.1, 0.6), tip=0.2)

# 7. The buoys: one on every day the close fell by more than 3.5%, moored off the edge there.
RED = col(0.840, 0.215, 0.245)
down = [d for d in range(1, DAYS + 1) if np.exp(RET[d - 1]) - 1 < -0.035]
for d in sorted(down, key=lambda d: RET[d - 1], reverse=True):       # the worst is painted last
    fall = 1 - np.exp(RET[d - 1])
    x = float(day_x(d - 0.5))
    foot = np.array([x, float(edge_y(x))])
    n = np.array([samp(NXF, *foot), samp(NYF, *foot)]).ravel()
    c = foot + n * 15.0
    for _ in range(3):                              # stand it 15 off the edge, wherever the edge turns
        c = c + n * (15.0 - float(samp(D, c[0], c[1])))
    r = 5.2 + 66 * fall
    cur = swell_dir(c[0], c[1]).ravel()             # it lies to the set of the sea
    base = colour_at(c[0], c[1])
    cv.stroke([c - cur * r * 0.6, c - cur * (r + 9) + n * 1.5, c - cur * (r + 19) + n * 4.5], 1.0,
              mix(base, col(0.02, 0.07, 0.09), 0.6), LINER, opacity=0.7, dry=0.95, taper=(0.0, 0.8), tip=0.1,
              grain=0.6)                            # its mooring, going down
    with cv.layer(col(0.20, 0.36, 0.42), "multiply", 0.7, blur=1.0):
        cv.dab(c + (0.42 * r, 0.52 * r), r * 1.02, (0, 0, 0))
    for a0 in (200, 20):                            # the ring of water it parts
        cv.stroke(arc(c[0], c[1], r + 3.2, a0, a0 + 120), 1.0, mix(base, FOAM, 0.5), LINER, opacity=0.7)
    cv.dab(c, r, RED, streak=0.015, jitter=0.0, soft=0.14, thick=1.0, gap=0.0)
    cv.stroke(arc(c[0], c[1], r * 0.62, 20, 110), r * 0.5, mix(RED, col(0.45, 0.07, 0.11), 0.75), ROUND,
              opacity=0.7, jitter=0.0, gap=0.0)     # its far side, away from the sun
    cv.stroke(arc(c[0], c[1], r * 0.58, 195, 285), r * 0.36, mix(RED, col(1.0, 0.55, 0.55), 0.55), ROUND,
              opacity=0.8, jitter=0.0, gap=0.0)     # and the side that has it
    cv.dab(c, max(1.2, r * 0.2), col(0.98, 0.96, 0.92), jitter=0.0, thick=1.0, gap=0.0)      # the lantern

os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
cv.save_card(OUT, relief=0.4, tooth=0.02)
print(f"{cv.count} strokes, {cv.W}x{cv.H}, {time.time() - t0:.1f}s -> {OUT}")
