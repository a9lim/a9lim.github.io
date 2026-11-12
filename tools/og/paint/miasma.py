"""Miasma — The wave.

A town on a plain at night, seen from a rise. Its houses stand one to a cell
on a hex lattice, as Miasma's world does, and the town is the state of a
stochastic SEIR epidemic run on that lattice from one house, stopped while
its front is still a ring. Nothing about the state is drawn by hand.

What each mark reads:
  a straw-yellow window    a susceptible house
  a faint pale red window  exposed: infected, not yet infectious
  a red window             infectious (the one red)
  an unlit house           recovered; the wave has passed
  a viridian window        vaccinated
  a tree                   an empty lot: nobody there to infect
The river has no houses on it, so the front stopped along its bank and
crossed only where a bridge let it; the red on the far bank is that. The
vaccinated quarter is where the ring is broken: the front went round it.
Churches stand on cells like any house and show their cell's state. The
fog, the moon and the rise we stand on are the weather and the view.

    python3 miasma.py [scale=2] [out=../art/miasma.png]

Painted by Claude, 2026-11-11.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from PIL import Image, ImageDraw

from brush import F, Canvas, col, mix, spline, resample, FLAT, ROUND, FILBERT, DRY, SOFT, LINE

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "art", "miasma.png")
t0 = time.time()
cv = Canvas(W, H, SCALE, ground=(0.075, 0.085, 0.07), seed=11)
rng = cv.rng


def clip01(v):
    return np.clip(v, 0, 1)


# ------------------------------------------------------------ the camera ----
# World units are lattice cells. The picture plane is vertical, so walls stay
# upright and the plain runs back to a horizon in the upper third.
FOC, HOR, VPX = 533.0, 140.0, 600.0
XC, ZC = 11.0, 27.3            # the first house
CAM = 0.4 * ZC                 # height of the eye above the plain
K = FOC * CAM
RING = 9.8                     # the front's radius when the clock stops, in cells


def proj(x, z, h=0.0):
    """Canvas position of a point x across, z away and h above the plain."""
    x, z, h = np.broadcast_arrays(np.asarray(x, float), np.asarray(z, float), np.asarray(h, float))
    return np.stack([VPX + FOC * x / z, HOR + FOC * (CAM - h) / z], -1)


def depth_at(y):
    return K / max(y - HOR, 1e-3)


# ------------------------------------------------------------- the town ----
PHI = np.deg2rad(9.0)          # the lattice sits a little off the picture plane
RIVER_HALF = 2.6
VAX_C, VAX_R = np.array([XC + 6.4, ZC - 7.2]), 3.2
BRIDGES = (XC + 3.5, XC - 15.0)          # where a bridge crosses, by x


def river_z(x):
    """Depth of the river's centre line."""
    return ZC + 9.3 - 0.12 * (x - XC) + 0.9 * np.sin(x / 7.0 + 1.0) + 0.45 * np.sin(x / 2.9)


def town_d(x, z):
    """How far out of town a point is: under 1 inside its uneven oval."""
    ang = np.arctan2(z - 38.0, (x - 3.0) * 0.8)
    edge = 1 + 0.16 * np.sin(3 * ang + 0.7) + 0.09 * np.sin(5 * ang + 2.1) + 0.05 * np.sin(9 * ang)
    return np.hypot((x - 3.0) / 44.0, (z - 38.0) / 35.0) / edge


def build_town():
    """Houses on a hex lattice; some lots are empty and grow trees."""
    r = np.random.default_rng(23)
    nq = 90
    q, rr = np.meshgrid(np.arange(-nq, nq + 1), np.arange(-nq, nq + 1))
    q, rr = q.ravel(), rr.ravel()
    u, v = q + rr / 2.0, rr * np.sqrt(3) / 2
    x = XC + u * np.cos(PHI) - v * np.sin(PHI)
    z = ZC + u * np.sin(PHI) + v * np.cos(PHI)
    d = town_d(x, z)                                         # thinning into gardens before it stops
    keep = (z > 9.5) & (z < 84.0) & (np.abs(x) < 1.15 * z + 3)
    keep &= r.random(len(x)) < clip01((1.06 - d) / 0.16)
    vacant = r.random(len(x)) < 0.11
    keep &= np.abs(z - river_z(x)) > RIVER_HALF            # no houses on the water
    vacant[(q == 0) & (rr == 0)] = False
    lots = keep & vacant
    keep &= ~vacant
    tx, tz = x[lots], z[lots]
    q, rr, x, z = q[keep], rr[keep], x[keep], z[keep]
    idx = {(a, b): i for i, (a, b) in enumerate(zip(q.tolist(), rr.tolist()))}
    nb = np.full((len(q), 6), -1, int)
    for i, (a, b) in enumerate(zip(q.tolist(), rr.tolist())):
        for j, (da, db) in enumerate(((1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1))):
            nb[i, j] = idx.get((a + da, b + db), -1)
    return x, z, nb, idx[(0, 0)], tx, tz


S_, E_, I_, R_, V_ = range(5)


def epidemic(x, z, nb, seed):
    """Stochastic SEIR on the lattice, neighbour to neighbour; returns each house's compartment."""
    r = np.random.default_rng(41)
    rb = np.random.default_rng(5)                 # the bridges' own dice
    n = len(x)
    st = np.zeros(n, int)
    vd = np.hypot(x - VAX_C[0], z - VAX_C[1]) / (VAX_R * (1 + 0.18 * np.sin(4 * np.arctan2(z - VAX_C[1], x - VAX_C[0]))))
    st[(vd < 1) & (r.random(n) < 0.85)] = V_
    st[(vd >= 1) & (vd < 1.45) & (r.random(n) < 0.3)] = V_
    st[seed] = I_
    links = []                                    # a bridge joins the houses at its two ends
    for bx in BRIDGES:
        zr = river_z(bx)
        near = np.argsort(np.hypot(x - bx, z - (zr - RIVER_HALF - 0.6)))[:2]
        far = np.argsort(np.hypot(x - bx, z - (zr + RIVER_HALF + 0.6)))[:2]
        links += [(a, b) for a in near for b in far]
    links = np.array(links)
    beta, beta_bridge = 0.16, 0.06                # per infectious neighbour, per tick
    dist = np.hypot(x - x[seed], z - z[seed])
    ang = np.arctan2(z - z[seed], x - x[seed])
    front = (ang < np.deg2rad(-100)) | (ang > np.deg2rad(160))   # measured where nothing is in its way
    t_left = np.zeros(n, int)
    t_left[seed] = 12
    for tick in range(600):
        inf = st == I_
        k = (inf[nb] & (nb >= 0)).sum(1)
        p = 1 - (1 - beta) ** k
        kb = np.zeros(n)
        np.add.at(kb, links[:, 1], inf[links[:, 0]])
        np.add.at(kb, links[:, 0], inf[links[:, 1]])
        t_left[st > 0] -= 1
        ne = (st == S_) & ((r.random(n) < p) | (rb.random(n) < 1 - (1 - beta_bridge) ** kb))
        ni = (st == E_) & (t_left <= 0)
        nr = inf & (t_left <= 0)
        st[ne] = E_
        t_left[ne] = r.integers(1, 4, ne.sum())                                  # incubation, ticks
        st[ni] = I_
        t_left[ni] = np.maximum(4, np.round(r.normal(13, 2.5, ni.sum()))).astype(int)   # infectious period
        st[nr] = R_
        live = (st == I_) & front
        if live.sum() > 6 and np.mean(dist[live]) >= RING:
            break
    return st, tick


X, Z, NB, SEED, TREE_X, TREE_Z = build_town()
STATE, TICKS = epidemic(X, Z, NB, SEED)
N = len(X)

# ---------------------------------------------------------------- colour ----
HAZE = col(0.185, 0.205, 0.175)        # the air at the horizon
FOG = col(0.37, 0.405, 0.345)
STRAW = col(1.00, 0.91, 0.62)
# The red is the site's dark-theme accent, #DC5960, a little brighter because here it is a lamp;
# the viridian is the dark-theme ink, #4F9770, likewise.
WINDOW = {S_: STRAW, E_: col(0.66, 0.38, 0.38), I_: col(0.95, 0.23, 0.25), V_: col(0.38, 0.74, 0.56)}
GLOW = {S_: (col(0.92, 0.82, 0.50), 0.17), E_: (col(0.72, 0.22, 0.24), 0.08), I_: (col(0.82, 0.07, 0.11), 0.38),
        V_: (col(0.25, 0.62, 0.43), 0.16)}
AIR = {S_: 0.028, E_: 0.03, I_: 0.11, V_: 0.035}
ROOFS = (col(0.118, 0.130, 0.118), col(0.142, 0.142, 0.126), col(0.106, 0.122, 0.126), col(0.132, 0.120, 0.104))
WALLS = (col(0.074, 0.080, 0.072), col(0.096, 0.096, 0.086), col(0.066, 0.074, 0.074), col(0.088, 0.080, 0.070))
MOON = np.array([968.0, 56.0])


def hazek(z):
    return 1 - np.exp(-np.maximum(z - 14.0, 0) / 62.0)


def haze(c, z, k=1.0):
    return mix(c, HAZE, k * hazek(z))


def sky(x, y):
    t = clip01(y / HOR)
    c = mix(col(0.046, 0.054, 0.046), col(0.100, 0.115, 0.096), t ** 1.4)
    c = mix(c, HAZE, clip01((t - 0.6) / 0.4) ** 1.5)
    d = np.hypot((x - MOON[0]) / 2.1, y - MOON[1])
    return mix(c, col(0.33, 0.37, 0.31), 0.6 * np.exp(-(d / 105.0) ** 2))


def ground(x, y):
    z = depth_at(y)
    c = mix(col(0.052, 0.062, 0.050), col(0.080, 0.093, 0.074), clip01((z - 12) / 30.0))
    return haze(c, z)


# -------------------------------------------------------------- the rise ----
_cr = np.random.default_rng(8)
CREST = spline(np.array([(-20, 316), (80, 312), (180, 317), (290, 321), (380, 332), (452, 351), (508, 378),
                         (552, 412), (592, 452), (634, 496), (684, 538), (748, 576), (830, 606), (930, 628),
                         (1010, 646)], F), 6)
CREST[:, 1] += np.convolve(_cr.normal(0, 1.6, len(CREST)), np.ones(9) / 9, "same")


def crest_y(x):
    return np.interp(x, CREST[:, 0], CREST[:, 1], right=1e9)


def hidden(bx, by, tall):
    """Behind the rise we are standing on."""
    return by - tall > crest_y(bx) + 4


# ------------------------------------------------------------------- sky ----
def fog_layer(strokes, opacity, colour=FOG, blur=5.0):
    """One even film of fog: (x0, x1, y, width) strokes, feathered."""
    with cv.layer(colour, mode="normal", opacity=opacity, blur=blur):
        for x0, x1, y, wd in strokes:
            n = max(3, int((x1 - x0) / 120))
            xs = np.linspace(x0, x1, n)
            ys = y + rng.normal(0, wd * 0.12, n)
            cv.stroke(spline(np.stack([xs, ys], -1), 10), wd, FOG, SOFT, opacity=1.0, taper=(0.3, 0.3), tip=0.1, soft=0.8,
                      gap=0, streak=0, load=1.0)


def bank(y, n, spread, wd, x0=-120, x1=W + 120, lmin=300, lmax=900):
    out = []
    for _ in range(n):
        ln = rng.uniform(lmin, lmax)
        x = rng.uniform(x0, x1 - ln * 0.5)
        out.append((x, x + ln, y + rng.normal(0, spread), wd * rng.uniform(0.6, 1.3)))
    return out


def paint_sky():
    whole = np.array([(-40, -30), (W + 40, -30), (W + 40, HOR + 6), (-40, HOR + 6)], F)
    cv.fill(whole, sky, FILBERT, width=34, angle=-2, length=(260, 560), overlap=0.55, streak=0.012, chroma=0.004,
            jitter=0.005, frisket=False, dry=0)
    cv.fill(whole, sky, FILBERT, width=26, angle=2, length=(200, 460), overlap=0.45, curve=5, streak=0.010,
            chroma=0.004, jitter=0.005, frisket=False, opacity=0.6, pickup=0.3, shuffle=True)
    # the moon, behind the fog
    cv.glow(MOON, 46, col(0.50, 0.55, 0.45), 0.30)
    cv.glow(MOON, 13, col(0.78, 0.82, 0.68), 0.55, falloff=1.4)
    cv.dab(MOON, 5.2, col(0.80, 0.84, 0.72), soft=0.7, thick=0, opacity=0.7)
    # long bars of cloud across it
    for _ in range(10):
        x0, y0 = rng.uniform(560, 1150), rng.uniform(20, 108)
        ln, w = rng.uniform(180, 460), rng.uniform(4, 10)
        path = spline([(x0, y0 + rng.normal(0, 1.5)), (x0 + ln * 0.35, y0 - rng.uniform(0, 3)),
                       (x0 + ln * 0.7, y0 - rng.uniform(0, 2)), (x0 + ln, y0 + rng.normal(0, 1.5))], 6)
        cv.stroke(path, w, sky(x0 + ln / 2, y0) * 0.74, FILBERT, taper=(0.4, 0.5), tip=0.05, dry=0.35, grain=0.9,
                  streak=0.015, opacity=0.75)


# ---------------------------------------------------------------- ground ----
def paint_ground():
    edges = [HOR, 148, 157, 168, 182, 200, 224, 256, 298, 352, 424, 520, H + 30]
    for y0, y1 in zip(edges[:-1], edges[1:]):
        w = float(np.clip((y1 - y0) * 0.55, 2.4, 34))
        band = np.array([(-40, y0 - 0.5), (W + 40, y0 - 0.5), (W + 40, y1 + 0.5), (-40, y1 + 0.5)], F)
        cv.fill(band, ground, FLAT, width=w, angle=rng.normal(0, 0.4), length=(w * 7, w * 20), overlap=0.45,
                streak=0.02, dry=0.05, gap=0.0, jitter=0.02)
    # fields beyond the town: strips of a slightly different dark, and hedges
    for _ in range(220):
        z = 16 + 300 * rng.random() ** 2.2
        y = HOR + K / z
        x = rng.uniform(-40, W + 40)
        ln = rng.uniform(80, 460) * clip01(30 / z + 0.25)
        wd = max(1.0, K * rng.uniform(0.6, 2.5) / z ** 2)
        c = ground(x, y) * rng.choice([0.84, 0.92, 1.10, 1.18])
        cv.stroke([(x, y), (x + ln, y + rng.normal(0, 0.6))], wd, c, DRY, opacity=0.5, taper=(0.15, 0.3), tip=0.3)
    # far farms and hamlets, a light or two each
    for _ in range(13):
        z0 = rng.uniform(95, 420)
        x0 = rng.uniform(-1.1, 1.1) * z0
        for _ in range(int(rng.integers(1, 5))):
            p = proj(x0 + rng.normal(0, 4), z0 + rng.normal(0, 6))
            b = rng.uniform(0.45, 1.0)
            cv.glow(p, 3.0, GLOW[S_][0], 0.14 * b)
            cv.dab(p, 0.7, mix(STRAW * b, HAZE * 1.6, 0.5 * hazek(z0)), soft=0.5, thick=0)


# ----------------------------------------------------------------- river ----
def water(x, y):
    d = abs(x - MOON[0])
    c = mix(col(0.205, 0.235, 0.205), col(0.43, 0.48, 0.40), np.exp(-(d / 300.0) ** 2))
    return c * (0.94 + 0.06 * np.sin(x * 0.045))


def paint_river():
    xs = np.linspace(-60, 60, 260)
    zc = river_z(xs)
    near, far = proj(xs, zc - RIVER_HALF), proj(xs, zc + RIVER_HALF)
    poly = np.vstack([near, far[::-1]])
    with cv.frisket(poly, feather=0.6):
        cv.fill(np.array([(-40, 255), (W + 40, 280), (W + 40, 350), (-40, 325)], F), water, FLAT, width=7, angle=2.6,
                length=(160, 460), overlap=0.45, frisket=False, streak=0.018, dry=0.05, gap=0, jitter=0.01)
        # the moon's road on the water, and slack current elsewhere
        for _ in range(70):
            x = rng.normal(MOON[0], 70)
            y = 0.5 * (np.interp(x, near[:, 0], near[:, 1]) + np.interp(x, far[:, 0], far[:, 1])) + rng.uniform(-9, 9)
            ln = rng.uniform(8, 34)
            cv.stroke([(x - ln / 2, y), (x + ln / 2, y + ln * 0.045)], rng.uniform(0.9, 1.6), col(0.62, 0.67, 0.56), LINE,
                      opacity=rng.uniform(0.25, 0.7))
        for _ in range(90):
            x = rng.uniform(0, W)
            y = 0.5 * (np.interp(x, near[:, 0], near[:, 1]) + np.interp(x, far[:, 0], far[:, 1])) + rng.uniform(-9, 9)
            ln = rng.uniform(20, 90)
            cv.stroke([(x - ln / 2, y), (x + ln / 2, y + ln * 0.045)], rng.uniform(0.8, 1.4), water(x, y) * rng.choice([0.8, 1.2]),
                      LINE, opacity=0.4)
    # the banks: mud on the far side, reeds on ours
    cv.lit_line(far, 1.5, lambda x, y: col(0.075, 0.085, 0.07), LINE, opacity=0.85)
    cv.lit_line(near + (0, 0.6), 2.0, lambda x, y: col(0.06, 0.07, 0.056), LINE, opacity=0.9)


def reflections():
    """Lights on the far bank stand in the water under them."""
    d = Z - (river_z(X) + RIVER_HALF)
    for i in np.nonzero((d > 0) & (d < 1.6) & (STATE != R_))[0]:
        if STATE[i] == S_ and RV[i] > 0.6:
            continue
        p = proj(X[i], river_z(X[i]) + RIVER_HALF)
        b = (1 - d[i] / 1.6) * (1.0 if STATE[i] != E_ else 0.5)
        s = FOC / Z[i]
        ln = s * (0.35 + 0.5 * RB[i]) * (0.6 + 0.4 * b)
        for k in range(3):                              # broken by the current
            y0 = p[1] + 1.5 + ln * k / 3
            cv.stroke([(p[0] + rng.normal(0, 0.7), y0), (p[0] + rng.normal(0, 0.7), y0 + ln / 3.6)], max(1.3, s * 0.12),
                      WINDOW[STATE[i]] * 0.85, SOFT, opacity=0.5 * b * (1 - 0.25 * k), soft=0.6, taper=(0.2, 0.4), tip=0.3)


def bridges():
    for bx in BRIDGES:
        zr = river_z(bx)
        a, b = proj(bx, zr - RIVER_HALF - 0.4), proj(bx - 0.3, zr + RIVER_HALF + 0.4)
        s = FOC / zr
        for t in (0.25, 0.5, 0.75):                         # piers, and their shadow on the water
            m = a + (b - a) * t
            cv.line(m + (0, 0.5), m + (0.3 * s, 0.34 * s), max(1.2, 0.18 * s), col(0.070, 0.080, 0.068))
        cv.line(a + (0.15 * s, 0.2 * s), b + (0.15 * s, 0.2 * s), max(1.6, 0.26 * s), col(0.070, 0.080, 0.068))
        cv.line(a, b, max(1.3, 0.2 * s), haze(col(0.27, 0.29, 0.25), zr, 0.6))


# ---------------------------------------------------------------- houses ----
def shape(poly, color, streak=0.035, angle=0.0, opacity=1.0, grain=0.22, thick=0.35, jitter=0.02):
    """A small flat shape laid in one pass with the knife: a polygon with clean edges, streaked along `angle`."""
    P = np.asarray(poly, float) * cv.s
    x0, x1 = max(0, int(np.floor(P[:, 0].min())) - 1), min(cv.W, int(np.ceil(P[:, 0].max())) + 2)
    y0, y1 = max(0, int(np.floor(P[:, 1].min())) - 1), min(cv.H, int(np.ceil(P[:, 1].max())) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    ss = 4
    im = Image.new("L", ((x1 - x0) * ss, (y1 - y0) * ss), 0)
    ImageDraw.Draw(im).polygon([((x - x0) * ss, (y - y0) * ss) for x, y in P], fill=255)
    a = np.asarray(im.resize((x1 - x0, y1 - y0), Image.BOX), F) / 255
    if not a.any():
        return
    tooth = cv.tooth[y0:y1, x0:x1]
    a = a * np.clip(1 + grain * (tooth - 0.62) * 2, 0, 1) * opacity
    if cv.masks:
        a = a * cv.masks[-1][y0:y1, x0:x1]
    c0 = np.asarray(color, F)
    lum = min(1.2, 0.25 + float(c0.mean()))
    ca, sa = np.cos(np.deg2rad(angle)), np.sin(np.deg2rad(angle))
    v = (np.arange(y0, y1, dtype=F)[:, None] * ca - np.arange(x0, x1, dtype=F)[None, :] * sa) / max(1.0, 1.3 * cv.s)
    nb = int(v.max() - v.min()) + 3
    bristle = rng.normal(0, streak, nb).astype(F)
    f = v - v.min()
    i0 = f.astype(np.int32)
    fr = f - i0
    tint = bristle[i0] * (1 - fr) + bristle[i0 + 1] * fr
    cpx = c0 + lum * (tint[..., None] + rng.normal(0, jitter) + rng.normal(0, jitter * 0.4, 3).astype(F))
    sub = cv.img[y0:y1, x0:x1]
    aa = a[..., None]
    sub *= 1 - aa
    sub += cpx * aa
    if thick > 0:
        hs = cv.hgt[y0:y1, x0:x1]
        hs[:] = hs * (1 - 0.85 * a) + a * thick * (0.6 + 0.5 * (tint / max(streak, 1e-3) * 0.3 + 0.5))
    cv.count += 1


_hr = np.random.default_rng(5)
RW, RH, RT, RB, RC, RV = (_hr.random(N) for _ in range(6))
RK = _hr.integers(0, 4, N)
RX, RZ = _hr.normal(0, 0.07, N), _hr.normal(0, 0.05, N)
GABLE = _hr.random(N) < 0.28


def window(px, py, ww, wh, st, z, b, s):
    dark = st == R_
    if dark and s <= 12:
        return
    c = col(0.030, 0.035, 0.030) if dark else mix(WINDOW[st] * b, HAZE * 1.7, 0.45 * hazek(z))
    if s > 13:                                        # a pane with corners
        shape([(px - ww / 2, py - wh / 2), (px + ww / 2, py - wh / 2), (px + ww / 2, py + wh / 2), (px - ww / 2, py + wh / 2)],
              c, streak=0.012, grain=0.0, thick=0.0 if dark else 0.25, jitter=0.012, opacity=0.85 if dark else 1.0)
    else:
        cv.stroke([(px - ww / 2, py), (px + ww / 2, py)], wh, c, LINE, soft=0.3, thick=0.3)


def light(p, s, st, z, b, big=1.0):
    """A window, and if someone is home the little air it lights."""
    ww, wh = max(1.3, s * 0.085) * min(big, 1.0) ** 0.5, max(1.3, s * 0.10)
    if st != R_:
        gc, gs = GLOW[st]
        k = b * (1 - 0.45 * hazek(z))
        if big >= 1.0:                                # the fog takes the colour of what is lit under it
            cv.glow(p, 3.0 + 1.05 * s, gc, AIR[st] * k)
        cv.glow(p, (1.6 + 0.26 * s) * big, gc, gs * k, falloff=1.6)
    window(p[0], p[1], ww, wh, st, z, b, s)


def house(i):
    """One house, a box and a roof standing on its cell, projected like everything else."""
    x, z, st = X[i] + RX[i], Z[i] + RZ[i], STATE[i]
    s = FOC / z
    bx, by = proj(x, z)
    if bx < -50 or bx > W + 50 or by - 0.8 * s > H + 4 or hidden(bx, by, 1.1 * s):
        return
    wx, dz = 0.48 + 0.18 * RW[i] + (0.22 if RV[i] > 0.93 else 0.0), 0.40 + 0.10 * RH[i]
    hw = 0.19 + 0.05 * RH[i]
    hr = hw + 0.15 + 0.07 * RT[i]
    zf, zb = z - dz / 2, z + dz / 2
    tone = (0.78 + 0.44 * RT[i]) * (0.86 if st == R_ else 1.0)
    roofc = haze(ROOFS[RK[i]] * tone, z)
    wallc = haze(WALLS[RK[i]] * tone, z)
    b = 0.70 + 0.30 * RB[i]
    side = -1.0 if RC[i] < 0.5 else 1.0
    o = 0.045
    if s < 12.5:                                      # far: a wall, a roof, and a light if the row in front leaves room
        row = CAM / z * 0.866
        shape(proj([x - wx / 2, x + wx / 2, x + wx / 2, x - wx / 2], zf, np.array([0, 0, hw, hw])), wallc)
        shape(np.vstack([proj([x - wx / 2 - o, x + wx / 2 + o], zf, hw), proj([x + wx / 2 + o, x - wx / 2 - o], z, hr)]), roofc)
        if st != S_ or RV[i] < clip01(row / (0.55 * hr)):
            light(proj(x + side * wx * 0.18, zf, hw * 1.25), s, st, z, b, 1.5)
        return
    near = bx < VPX                                   # which end wall faces us
    xs = x + (wx / 2 if near else -wx / 2)
    endc = wallc * (1.25 if near else 0.8)           # the moon is to the right
    if GABLE[i]:                                      # gable to the lane
        wx *= 0.8
        xs = x + (wx / 2 if near else -wx / 2)
        shape(proj(xs, [zf, zb, zb, zf], np.array([0, 0, hw, hw])), endc)
        shape(proj([x - wx / 2, x + wx / 2, x + wx / 2, x, x - wx / 2], zf, np.array([0, 0, hw, hr, hw])), wallc)
        for sg, k in ((-1, 0.86), (1, 1.14)):          # two slopes running back from the gable
            e = x + sg * (wx / 2 + o)
            shape(np.vstack([proj(e, zf - o, hw - 0.02), proj(x, zf - o, hr), proj(x, zb, hr), proj(e, zb, hw - 0.02)]),
                  roofc * k, angle=90)
        if s > 20:                                    # the door
            shape(proj(np.array([-0.045, 0.045, 0.045, -0.045]) - side * wx * 0.2 + x, zf, np.array([0, 0, hw * 0.7, hw * 0.7])),
                  wallc * 0.5, thick=0)
        light(proj(x, zf, hw + (hr - hw) * 0.28), s, st, z, b)
        if st != R_ and s > 20 and RV[i] < 0.5:
            light(proj(x + side * wx * 0.2, zf, hw * 0.52), s, st, z, b * 0.75, 0.75)
        return
    shape(proj(xs, [zf, zb, zb, z, zf], np.array([0, 0, hw, hr, hw])), endc)
    shape(proj([x - wx / 2, x + wx / 2, x + wx / 2, x - wx / 2], zf, np.array([0, 0, hw, hw])), wallc)
    shape(np.vstack([proj([x - wx / 2 - o, x + wx / 2 + o], zf - o, hw - 0.02), proj([x + wx / 2 + o, x - wx / 2 - o], z, hr)]),
          roofc, streak=0.05)
    if s > 15:                                        # the ridge takes what light the sky has; a chimney
        cv.stroke(proj([x - wx / 2 - o, x + wx / 2 + o], z, hr) + (0, 0.5), max(0.9, s * 0.035), mix(roofc * 1.5, FOG, 0.25),
                  LINE, opacity=0.5)
        cx = x - side * wx * (0.12 + 0.2 * RV[i])
        shape(proj(np.array([-0.04, 0.04, 0.04, -0.04]) + cx, z - 0.06, np.array([hr - 0.07, hr - 0.07, hr + 0.1, hr + 0.1])),
              wallc * 0.95, thick=0.5)
    if s > 20:                                        # the door
        shape(proj(np.array([-0.045, 0.045, 0.045, -0.045]) - side * wx * 0.07 + x, zf, np.array([0, 0, hw * 0.72, hw * 0.72])),
              wallc * 0.5, thick=0)
    if st != R_ and s > 17:                           # its light lies on the ground in front
        gc, gs = GLOW[st]
        cv.glow(proj(x + side * wx * 0.22, zf - 0.16), 0.32 * s, gc, gs * b * 0.4)
    light(proj(x + side * wx * 0.22, zf, hw * 0.55), s, st, z, b)
    if st != R_ and s > 22 and (RV[i] < 0.3 or RV[i] > 0.93):   # a second room, dimmer
        light(proj(x - side * wx * 0.30, zf, hw * 0.55), s, st, z, b * 0.7, 0.7)


def church(x, z, st):
    s = FOC / z
    bx, by = proj(x, z)
    if hidden(bx, by, 2.4 * s):
        return
    wc = haze(col(0.118, 0.126, 0.110), z)
    rc = haze(col(0.165, 0.176, 0.156), z)
    wx, dz, hw, hr = 1.25, 0.56, 0.42, 0.80
    zf, zb = z - dz / 2, z + dz / 2
    near = bx < VPX
    xs = x + (wx / 2 if near else -wx / 2)
    shape(proj(xs, [zf, zb, zb, z, zf], np.array([0, 0, hw, hr, hw])), wc * (1.25 if near else 0.8))
    shape(proj([x - wx / 2, x + wx / 2, x + wx / 2, x - wx / 2], zf, np.array([0, 0, hw, hw])), wc)
    shape(np.vstack([proj([x - wx / 2, x + wx / 2 + 0.04], zf - 0.04, hw), proj([x + wx / 2 + 0.04, x - wx / 2], z, hr)]), rc,
          streak=0.05)
    tx, tw, th, sp = x - wx / 2 - 0.02, 0.19, 1.2, 2.45         # the tower and its spire
    txs = tx + (tw if near else -tw)
    shape(proj(txs, [zf - 0.05, zf + 2 * tw, zf + 2 * tw, zf - 0.05], np.array([0, 0, th, th])), wc * (1.3 if near else 0.8))
    shape(proj([tx - tw, tx + tw, tx + tw, tx - tw], zf - 0.05, np.array([0, 0, th, th])), wc * 1.06)
    shape(np.vstack([proj([txs, txs], [zf - 0.05, zf + 2 * tw], th), proj(tx, zf + tw, sp)]), rc * (1.2 if near else 0.75))
    shape(np.vstack([proj([tx - tw - 0.02, tx + tw + 0.02], zf - 0.05, th), proj(tx, zf + tw, sp)]), rc * 0.95)
    if st != R_:
        gc, gs = GLOW[st]
        cv.glow(proj(x, zf, hw * 0.5), 0.7 * s, gc, gs * 0.6)
    for off in (-0.34, -0.12, 0.10, 0.32):            # lancets down the nave, one in the tower
        p = proj(x + off * wx, zf, hw * 0.52)
        window(p[0], p[1], max(1.3, 0.055 * s), hw * 0.56 * s, st, z, 0.95, s)
    p = proj(tx, zf - 0.05, th * 0.78)
    window(p[0], p[1], max(1.2, 0.07 * s), 0.17 * s, st, z, 0.95, s)


_tr = np.random.default_rng(6)
TREE_R = _tr.random((len(TREE_X), 4))


def tree(j):
    x, z = TREE_X[j], TREE_Z[j]
    s = FOC / z
    bx, by = proj(x, z)
    if bx < -30 or bx > W + 30 or by > H + 30 or hidden(bx, by, s):
        return
    c = haze(col(0.062, 0.078, 0.058) * (0.85 + 0.4 * TREE_R[j, 0]), z)
    r = s * (0.16 + 0.08 * TREE_R[j, 1])
    for k in range(3 if s > 12 else 2):
        ox = (TREE_R[j, (k + 1) % 4] - 0.5) * s * 0.34
        oy = -r * (0.9 + 0.7 * TREE_R[j, (k + 2) % 4])
        cv.dab((bx + ox, by + oy), r * (0.8 + 0.4 * TREE_R[j, k]), c * (1.0 + 0.12 * k), soft=0.35, thick=0.5, streak=0.05)
    if s > 14:                                        # the moon finds the top
        cv.dab((bx + 0.3 * r, by - 2.0 * r), 0.5 * r, mix(c * 1.5, FOG, 0.1), soft=0.6, thick=0.2, opacity=0.6)


def lanes():
    """The lanes between the rows of the lattice."""
    u = np.linspace(-75, 75, 500)
    for k in range(-75, 76):
        v = (k + 0.5) * np.sqrt(3) / 2
        x = XC + u * np.cos(PHI) - v * np.sin(PHI)
        z = ZC + u * np.sin(PHI) + v * np.cos(PHI)
        ok = (z > 10.5) & (town_d(x, z) < 0.98) & (np.abs(z - river_z(x)) > RIVER_HALF + 0.2) & (np.abs(x) < 1.15 * z + 2)
        run = []
        for j in range(len(u) + 1):
            if j < len(u) and ok[j]:
                run.append(j)
                continue
            if len(run) > 3:
                zz = float(z[run].mean())
                sm = FOC / zz
                if sm * CAM / zz * 0.866 > 2.2:              # where the rows still stand apart
                    cv.stroke(proj(x[run], z[run]), max(1.0, 0.085 * sm), haze(col(0.098, 0.106, 0.088), zz), LINE,
                              opacity=0.55, jitter=0.02)
            run = []


def paint_town():
    items = [(Z[i] + RZ[i], 0, i) for i in range(N)] + [(TREE_Z[j], 1, j) for j in range(len(TREE_X))]
    items.sort(key=lambda t: -t[0])
    churches = set()
    for cx, cz in ((XC - 1.8, ZC + 1.3), (XC - 1.0, 15.2), (XC + 17, 46.0), (-22.0, 52.0)):
        churches.add(int(np.argmin(np.hypot(X - cx, Z - cz))))
    # fog lies in banks between the rows: each is laid once everything behind it is painted
    banks = [
        (66.0, lambda: fog_layer(bank(211, 9, 4, 15), 0.55, blur=6)),                      # the town's far edge is lost in it
        (52.0, lambda: fog_layer(bank(232, 6, 4, 9, lmin=260, lmax=640), 0.30)),
        (45.0, lambda: fog_layer([(700, 1150, 244, 7), (860, 1300, 249, 6)], 0.22, blur=4)),
        (river_z(XC) + RIVER_HALF + 3, lambda: fog_layer(bank(256, 4, 3, 7, x0=-100, x1=700, lmin=240, lmax=560), 0.30)),
        (river_z(XC) + RIVER_HALF + 2.9, lambda: fog_layer(bank(262, 3, 3, 6, x0=900, x1=W + 200, lmin=240, lmax=460), 0.26)),
        (river_z(XC) - RIVER_HALF, lambda: fog_layer([(-80, 430, 283, 9), (60, 600, 290, 7), (-60, 300, 296, 8)], 0.36, blur=4)),
        (river_z(XC) - RIVER_HALF - 0.1, lambda: fog_layer([(1010, 1300, 317, 8), (1080, 1300, 324, 6)], 0.24, blur=4)),
        (23.0, lambda: fog_layer(bank(352, 3, 5, 8, x0=620, lmin=240, lmax=520), 0.085)),
        (15.5, lambda: fog_layer(bank(470, 3, 8, 10, x0=660, lmin=260, lmax=520), 0.06)),
    ]
    for zz, kind, i in items:
        while banks and zz < banks[0][0]:
            banks.pop(0)[1]()
        if kind == 1:
            tree(i)
        elif i in churches:
            church(X[i], Z[i], STATE[i])
        else:
            house(i)


DARK = col(0.030, 0.036, 0.030)


def bare_tree(base, height, lean, seed):
    """A thorn on the slope, leaning with the wind."""
    r = np.random.default_rng(seed)

    def limb(p, ang, ln, wd, depth):
        pts, a = [np.asarray(p, float)], ang
        for _ in range(4):
            a += r.normal(0.04, 0.13)
            pts.append(pts[-1] + ln / 4 * np.array([np.sin(a), -np.cos(a)]))
        cv.stroke(pts, wd, DARK, ROUND, taper=(0.0, 0.5), tip=0.45)
        if depth:
            for _ in range(int(r.integers(2, 4))):
                q = pts[int(r.integers(2, 5))]
                limb(q, a + r.normal(0.1, 0.6), ln * r.uniform(0.5, 0.72), max(0.8, wd * 0.58), depth - 1)

    limb(base, lean, height * 0.42, height * 0.058, 4)


def paint_rise():
    poly = np.vstack([CREST, [(1010, 660), (-20, 660)]])

    def slope(x, y):
        # nearly black, a little lighter along the crest where the town's light reaches
        k = np.exp(-max(y - crest_y(x), 0) / 30.0)
        return mix(col(0.034, 0.040, 0.033), col(0.070, 0.080, 0.062), k)

    cv.fill(poly, slope, FLAT, width=22, angle=16, length=(90, 260), overlap=0.5, streak=0.018, dry=0.05, gap=0.0,
            jitter=0.010, curve=5)
    cv.fill(poly, slope, FILBERT, width=14, angle=22, length=(60, 180), overlap=0.3, streak=0.016, dry=0.2, opacity=0.6,
            jitter=0.010, curve=6, shuffle=True)
    # a fence along the top, some of it down
    posts = [p for p in resample(CREST, 43.0) if 20 < p[0] < 500]
    tops = []
    for k, p in enumerate(posts):
        h = rng.uniform(13, 17)
        lean = rng.normal(0, 0.07)
        top = p + (lean * h, -h)
        cv.stroke([p + (0, 3), top], rng.uniform(2.2, 3.0), DARK, LINE, jitter=0.01)
        tops.append(top)
    for a_, b_ in zip(tops[:-1], tops[1:]):
        if rng.random() < 0.16:
            continue
        for drop, sag in ((3.0, 1.6), (9.0, 2.2)):
            mid = (a_ + b_) / 2 + (0, drop + sag)
            cv.stroke(spline([a_ + (0, drop), mid, b_ + (0, drop)], 5), 1.1, DARK, LINE, opacity=0.95)
    # grass along the crest, against the light
    for p in resample(CREST, 2.2):
        if p[1] > H + 10:
            continue
        for _ in range(2):
            h = rng.uniform(3, 8) * (2.2 if rng.random() < 0.08 else 1.0)
            lean = rng.normal(0.3, 0.35)
            q = p + (rng.normal(0, 1.5), rng.uniform(0, 3))
            c = DARK if rng.random() < 0.8 else col(0.085, 0.095, 0.072)        # a blade the town's light finds
            cv.stroke([q, q + (lean * h * 0.5, -h * 0.6), q + (lean * h, -h)], rng.uniform(0.8, 1.5), c, ROUND,
                      taper=(0.0, 0.8), tip=0.1)
    bare_tree((548, crest_y(548) + 5), 96, 0.2, 4)


# ----------------------------------------------------------------- paint ----
paint_sky()
paint_ground()
fog_layer(bank(HOR + 4, 10, 6, 22), 0.50, blur=8)          # the horizon is lost in it
fog_layer(bank(HOR + 24, 8, 6, 14), 0.30, blur=6)
fog_layer([(640, 1300, HOR + 1, 15), (760, 1300, HOR + 9, 11), (500, 1000, HOR - 4, 9)], 0.34, col(0.47, 0.51, 0.43), blur=9)
paint_river()
reflections()
bridges()
lanes()
paint_town()
# the near corner is let go dark, so the eye stays with the ring
with cv.layer(col(0.42, 0.46, 0.40), mode="multiply", opacity=0.6, blur=42):
    cv.stroke([(760, 668), (1280, 668)], 110, FOG, SOFT, opacity=1.0, taper=(0.4, 0.0), tip=0.2, soft=0.9, gap=0, streak=0)
    cv.stroke([(1262, 420), (1262, 700)], 120, FOG, SOFT, opacity=1.0, taper=(0.5, 0.0), tip=0.2, soft=0.9, gap=0, streak=0)
paint_rise()

cv.save_card(OUT, relief=0.35, tooth=0.02)
census = ", ".join(f"{k} {int((STATE == v).sum())}" for k, v in (("S", S_), ("E", E_), ("I", I_), ("R", R_), ("V", V_)))
print(f"{cv.count} strokes, {cv.W}x{cv.H}, {time.time() - t0:.1f}s; {N} houses at tick {TICKS}: {census} -> {OUT}")
