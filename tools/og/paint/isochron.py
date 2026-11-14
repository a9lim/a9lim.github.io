"""Isochron — an ocean opening on a globe.

One hemisphere of a planet, on paper. An ocean has opened about an Euler pole
that lies under the sea ice at the top, so the whole basin is a fan: the ridge
runs down its middle, and everything the ridge has made lies either side of it
in bands that widen away from the pole. The plate to the west carries a
continent on a passive margin; the plate to the east goes down a trench under
a second continent, which has a cordillera for it. The brush follows the
isochrons: every stroke on the sea floor lies along crust of one age.

What each mark reads:

- The red rule is the ridge, where the mantle reaches the surface. Its
  segments lie on great circles through the Euler pole and are offset along
  small circles about it (the transforms, drawn as fine dark rules), which is
  the only way rigid plates can part on a sphere.
- The bands are the polarity record. The field's reversals are drawn once, at
  random intervals; a band's age is its angle from the ridge over the half
  rate, so the two sides carry the same record mirrored, a band's width is
  the rate times the interval, and both shrink toward the pole. Where a
  transform offsets the ridge the bands are offset with it (fracture zones).
- The sea's value is depth: the floor deepens as the square root of its age,
  shoals over the sediment of the passive margin's shelf and the fans off its
  river mouths (which bury the bands), and drops into the trench.
- The dark rule with sawteeth is the trench, teeth on the plate that stays on
  top. The red points behind it are the arc's volcanoes; the range under them
  is hachured downslope and lit from the upper left.
- The red ringed points are hotspots, fixed in the mantle. Each has left a
  chain of seamounts on the plate that passed over it, along a small circle
  about the pole, older and smaller with distance; the eastern chain is on
  its way down the trench.
- Rivers are routed over the land's height to the sea, their weight the
  discharge (rain times the area drained). The land's colour is its climate:
  rain in a band at the equator and in the westerlies, dry subtropics, a dry
  trade-wind coast and a rain shadow behind the range, cold with latitude and
  height. Where the year stays frozen there is ice: sea ice past a hard edge,
  an ice sheet on the land, snow along the high range.
- The globe is lit from the upper left, so the far limb falls into shade.

Nothing else is red. The paper is left bare at the left, where the card's type
is set.

    python3 isochron.py [scale=2] [out=../art/isochron.png]

Painted by Claude, 2026-11-14.
"""
import heapq
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from scipy.ndimage import gaussian_filter, gaussian_filter1d, map_coordinates

from brush import (F, Canvas, replace, col, rgb, mix, arc, resample, path_len,
                   FLAT, ROUND, FILBERT, LINE, LINER, DAB, SOFT)

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                         "..", "art", "isochron.png")
SEED = 4104
t0 = time.time()
RAD = np.pi / 180


def smoothstep(a, b, x):
    t = np.clip((np.asarray(x, float) - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def unit(v):
    v = np.asarray(v, float)
    return v / np.linalg.norm(v)


def at(lat, lon):
    return np.array([np.cos(lat * RAD) * np.cos(lon * RAD), np.cos(lat * RAD) * np.sin(lon * RAD), np.sin(lat * RAD)])


# -------------------------------------------------------------- the view ----
# Orthographic. The globe is cropped by the card at the right.
CX, CY, R = 914.0, 334.0, 330.0
LAT0, LON0, ROLL = 27.0, 0.0, -9.0
NORTH = np.array([0.0, 0.0, 1.0])
_f = at(LAT0, LON0)
_r = unit(np.cross(NORTH, _f))
_u = np.cross(_f, _r)
_cr, _sr = np.cos(ROLL * RAD), np.sin(ROLL * RAD)
VR, VU, VF = _cr * _r + _sr * _u, -_sr * _r + _cr * _u, _f


def project(p):
    p = np.asarray(p, float)
    return CX + R * (p @ VR), CY - R * (p @ VU), p @ VF


def unproject(x, y):
    """World point under a card point; off the disc, the nearest point of the limb."""
    a, b = (np.asarray(x, float) - CX) / R, -(np.asarray(y, float) - CY) / R
    r = np.hypot(a, b)
    k = np.where(r > 0.9995, 0.9995 / np.maximum(r, 1e-9), 1.0)
    a, b = a * k, b * k
    c = np.sqrt(np.clip(1 - a * a - b * b, 0, 1))
    return a[..., None] * VR + b[..., None] * VU + c[..., None] * VF, r


# ------------------------------------------------------------ the plates ----
# The two plates part about the Euler pole E. In E's own latitude and longitude
# (phi, lam) a ridge segment is a meridian and a transform a parallel.
ANCHOR = at(17.0, -2.0)                              # the ridge passes through here
_n = unit(NORTH - (NORTH @ ANCHOR) * ANCHOR)
_e = unit(np.cross(NORTH, ANCHOR))
_az, _far = 13.0 * RAD, 84.0 * RAD
E = ANCHOR * np.cos(_far) + (_n * np.cos(_az) + _e * np.sin(_az)) * np.sin(_far)
E1 = unit(ANCHOR - (ANCHOR @ E) * E)
E2 = np.cross(E, E1)
HALF_RATE = 0.30                                     # degrees of lam per Myr, each side


def pole(p):
    return np.arcsin(np.clip(p @ E, -1, 1)) / RAD, np.arctan2(p @ E2, p @ E1) / RAD


def world(phi, lam):
    phi, lam = np.asarray(phi, float) * RAD, np.asarray(lam, float) * RAD
    return (np.cos(phi) * np.cos(lam))[..., None] * E1 + (np.cos(phi) * np.sin(lam))[..., None] * E2 \
        + np.sin(phi)[..., None] * E


_g = np.random.default_rng(SEED)

# The ridge: segments between transforms, each on its own meridian.
_edges = [-80.0]
while _edges[-1] < 88:
    _edges.append(_edges[-1] + _g.uniform(11.0, 24.0))
BAND = np.array(_edges)
_o, _offs = 0.0, []
for k in range(len(BAND) - 1):
    _o = float(np.clip(0.45 * _o + _g.normal(0, 2.6), -5.5, 5.5))
    _offs.append(_o + 2.5 * np.sin(0.5 * (BAND[k] + BAND[k + 1]) * RAD * 2.2))
RIDGE = np.array(_offs)                              # lam of each segment


def ridge_lam(phi):
    return RIDGE[np.clip(np.searchsorted(BAND, phi) - 1, 0, len(RIDGE) - 1)]


# The field's reversals, in Myr before present: random intervals, drawn once.
_t, _rev = 0.0, [0.0]
while _t < 400:
    _t += 1.7 + _g.exponential(3.7)
    _rev.append(_t)
REVERSALS = np.array(_rev)


def coast_east(phi):                                 # the active margin, lam
    return 33.0 + 4.0 * np.sin(phi * RAD * 2.3 + 0.5) + 1.6 * np.sin(phi * RAD * 5.7 + 2.0)


def coast_west(phi):                                 # the passive margin
    return -37.0 + 4.5 * np.sin(phi * RAD * 2.0 + 2.2) + 2.0 * np.sin(phi * RAD * 4.9 + 0.4)


TRENCH_OFF, ARC_OFF = 2.0, 4.4                       # degrees seaward / landward of the active coast

# Hotspots, fixed in the mantle (phi, lam east of the local ridge), and the ages of the
# seamounts each has left. The plate carries a seamount away at the half rate.
HOTSPOTS = [(-19.0, -8.5), (38.0, 9.0)]
SEAMOUNTS = []                                       # (world point, age Myr, height km, radius deg)
for hp, hl in HOTSPOTS:
    side = np.sign(hl)
    lam0 = float(ridge_lam(hp)) + hl
    t = 0.0
    while True:
        lam = lam0 + side * HALF_RATE * t
        d_e, d_w = coast_east(hp) - TRENCH_OFF - lam, lam - coast_west(hp) - 6.0
        if d_e < 0 or d_w < 0:
            break
        SEAMOUNTS.append((world(hp + _g.normal(0, 0.35), lam), t,
                          4.6 * np.exp(-t / 45) * _g.uniform(0.75, 1.1), 1.05 * _g.uniform(0.8, 1.15)))
        t += _g.uniform(5.0, 9.0)
HOT = [world(hp, float(ridge_lam(hp)) + hl) for hp, hl in HOTSPOTS]


# ----------------------------------------------------------------- noise ----
def make_noise(seed, f0, octaves=5, gain=0.5, ndir=7):
    g = np.random.default_rng(seed)
    d = g.standard_normal((octaves, ndir, 3))
    d /= np.linalg.norm(d, axis=-1, keepdims=True)
    ph = g.uniform(0, 2 * np.pi, (octaves, ndir))
    norm = np.sqrt(0.5 * ndir * sum(gain ** (2 * o) for o in range(octaves)))

    def noise(p):
        out = np.zeros(p.shape[:-1], F)
        for o in range(octaves):
            for j in range(ndir):
                out += (gain ** o) * np.sin(f0 * 2 ** o * (p @ d[o, j]) + ph[o, j]).astype(F)
        return out / norm

    return noise


N_COAST, N_RANGE, N_ROUGH, N_CLIM = make_noise(1, 13.0), make_noise(2, 9.0, 2), make_noise(3, 40.0, 4), \
    make_noise(4, 6.0, 3)


# ------------------------------------------------------------ the planet ----
def planet(x, y, mouths=(), lake=None):
    """Every field of the model at card points (arrays)."""
    p, r = unproject(x, y)
    phi, lam = pole(p)
    cphi = np.cos(phi * RAD)
    lat = np.arcsin(np.clip(p[..., 2], -1, 1)) / RAD
    nc, nr, ng, nk = N_COAST(p), N_RANGE(p), N_ROUGH(p), N_CLIM(p)

    # crust
    off = ridge_lam(phi)
    age = np.abs(lam - off) / HALF_RATE
    normal = np.searchsorted(REVERSALS, age) % 2 == 1          # the present interval is normal
    d_e = (lam - coast_east(phi)) * cphi                       # degrees inland, each margin
    d_w = (coast_west(phi) - lam) * cphi
    east = lam > 0

    def shore(d):                                             # the coast's own shape, fading inland
        return np.clip(0.16 * d, -1.2, 0.3) + 0.30 * nc * (1 - 0.8 * smoothstep(1.0, 5.0, d))

    rise_e, rise_w = smoothstep(-0.5, 1.5, d_e), smoothstep(-0.5, 1.5, d_w)
    cord = 3.3 * np.exp(-((d_e - ARC_OFF) / 2.5) ** 2) * (0.72 + 0.28 * nr)
    elev_e = shore(d_e) + rise_e * (cord + 0.30 + 0.9 * np.exp(-((d_e - 10.0) / 5.0) ** 2)
                                    - 0.013 * np.clip(d_e - 12, 0, 14) + ng * (0.05 + 0.22 * cord)
                                    + 0.30 * np.abs(ng) * cord)
    old = 1.5 * np.exp(-((d_w - 8.0) / 2.8) ** 2) * np.clip(0.38 + 0.85 * nr, 0, 1.2)      # an old range, with gaps
    elev_w = shore(d_w) + rise_w * (old + 0.30 + 0.022 * np.clip(d_w, 0, 30) + ng * (0.05 + 0.2 * old))
    elev = np.where(east, elev_e, elev_w)
    land = elev > 0

    # the sea floor's depth, km
    depth = 2.5 + 0.34 * np.sqrt(np.minimum(age, 150.0))
    swell = np.zeros_like(depth)
    for q in HOT:
        swell += 0.55 * np.exp(-(np.arccos(np.clip(p @ q, -1, 1)) / (4.5 * RAD)) ** 2)
    mount = np.zeros_like(depth)
    for q, _, hgt, rad in SEAMOUNTS:
        mount = np.maximum(mount, hgt * np.exp(-(np.arccos(np.clip(p @ q, -1, 1)) / (rad * RAD)) ** 2))
    depth = depth - swell
    fan = np.zeros_like(depth)                                 # sediment off the river mouths, degrees
    for q, size in mouths:
        fan += 3.6 * size * np.exp(-(np.arccos(np.clip(p @ q, -1, 1)) / ((1.6 + 2.8 * size) * RAD)) ** 2)
    out = -elev / 0.16                                         # degrees offshore, roughly
    shelf_w = 0.06 + 0.07 * out + 5.6 * smoothstep(2.0 + fan, 4.6 + fan, out)
    shelf_e = 0.06 + 5.6 * smoothstep(0.25, 1.3, out)
    depth = np.where(east, np.minimum(depth, shelf_e) + 2.9 * np.exp(-((d_e + TRENCH_OFF) / 0.55) ** 2),
                     np.minimum(depth, shelf_w))
    buried = 1 - smoothstep(0.5, 2.4, np.where(east, shelf_e, shelf_w))
    depth = depth - mount

    # climate
    alat = np.abs(lat)
    temp = 27.0 - 46.0 * np.sin(lat * RAD) ** 2 - 6.0 * np.clip(elev, 0, None) + 1.3 * nk
    rain = 0.20 + 1.0 * np.exp(-(lat / 10.0) ** 2) + 0.62 * np.exp(-((alat - 49.0) / 14.0) ** 2)
    wester = smoothstep(26, 36, alat)                          # trades below, westerlies above
    lee = np.tanh((d_e - ARC_OFF) / 1.4)                       # -1 on the range's sea side, +1 behind it
    rain_e = rain * (1 + wester * (-0.75 * lee + 0.15) + (1 - wester) * (0.62 * lee - 0.28)) \
        * (1 + 0.5 * np.exp(-((d_e - ARC_OFF) / 2.5) ** 2))
    rain_w = rain * (1.25 - 0.3 * wester) * (0.8 + 0.6 * np.exp(-d_w / 12.0))
    rain = np.clip(np.where(east, rain_e, rain_w) * (1 + 0.18 * nk), 0.02, None)
    sea_temp = 27.0 - 46.0 * np.sin(lat * RAD) ** 2 + 1.6 * nk
    ice = np.where(land, temp < -13.5, sea_temp < -12.5)
    icef = np.where(land, -13.5 - temp, -12.5 - sea_temp)      # > 0 where frozen
    wet = np.zeros(land.shape, bool) if lake is None else (lake(x, y) > 0.5) & land & ~ice
    return dict(p=p, r=r, phi=phi, lam=lam, lat=lat, age=age, normal=normal, east=east, d_e=d_e, d_w=d_w,
                elev=elev, land=land, depth=depth, buried=buried, temp=temp, rain=rain, ice=ice, icef=icef,
                mount=mount, lake=wet)


# ---------------------------------------------------------------- colour ----
PAPER = col(0.988, 0.988, 0.984)
INK = col(0.086, 0.082, 0.078)
RED = rgb("#983432")
SEA_INK = col(0.110, 0.285, 0.455)
_DEPTHS = np.array([0.0, 0.5, 2.6, 4.5, 6.0, 8.8])
_SEA = np.array([(0.820, 0.895, 0.895), (0.700, 0.835, 0.865), (0.470, 0.665, 0.790), (0.235, 0.475, 0.655),
                 (0.130, 0.330, 0.510), (0.055, 0.160, 0.290)], F)
LAKE = col(0.560, 0.735, 0.830)
PALE, DARK = col(0.870, 0.905, 0.920), col(0.075, 0.225, 0.400)
ICE = col(0.940, 0.955, 0.965)
SNOW = col(0.955, 0.960, 0.962)
TROPIC, TEMPER, BOREAL = rgb("#3E7A4B"), rgb("#5F8148"), rgb("#4B6A52")
STEPPE, DESERT, TUNDRA, ROCK = rgb("#ADA670"), rgb("#D6C4A0"), rgb("#A39C8C"), rgb("#7C6049")
LIGHT = unit([-0.50, 0.58, 0.64])                    # in (right, up, toward us)


def colour(f, hill=None):
    d = np.clip(f["depth"], 0, 8.8)
    sea = np.stack([np.interp(d, _DEPTHS, _SEA[:, i]) for i in range(3)], -1).astype(F)
    k = (1 - f["buried"])[..., None]
    sea = np.where(f["normal"][..., None], sea + (PALE - sea) * 0.46 * k, sea + (DARK - sea) * 0.40 * k)

    t, rain, elev = f["temp"], f["rain"], f["elev"]
    wood = BOREAL + (TEMPER - BOREAL) * smoothstep(0, 9, t)[..., None]
    wood = wood + (TROPIC - wood) * smoothstep(16, 23, t)[..., None]
    c = wood + (STEPPE - wood) * (0.9 * (1 - smoothstep(0.36, 0.85, rain)))[..., None]
    c = c + (DESERT - c) * (1 - smoothstep(0.20, 0.44, rain))[..., None]
    c = c + (TUNDRA - c) * (1 - smoothstep(-7, 1, t))[..., None]
    c = c + (ROCK - c) * (0.75 * smoothstep(1.7, 3.0, elev))[..., None]
    if hill is not None:
        c = c * (1 + np.clip(hill, -0.36, 0.24))[..., None]
    c = np.where(f["lake"][..., None], LAKE, c)
    out = np.where(f["land"][..., None], c, sea)
    white = np.where(f["land"], 1.0, 0.0)[..., None] * SNOW + np.where(f["land"], 0.0, 1.0)[..., None] * ICE
    if hill is not None:
        white = white * (1 + 0.35 * np.clip(hill, -0.30, 0.26))[..., None]
    out = np.where(f["ice"][..., None], white, out)

    # the sphere's own light
    p = f["p"]
    n_l = np.clip((p @ VR) * LIGHT[0] + (p @ VU) * LIGHT[1] + (p @ VF) * LIGHT[2], 0, 1)
    return (out * (1 - 0.34 * (1 - n_l) ** 1.7)[..., None]).astype(F)


def hillshade(elev, cell):
    """Relief lit from the upper left; `cell` is the grid's spacing in card units."""
    gy, gx = np.gradient(np.clip(elev, 0, None), cell)
    return -(gx * -0.62 + gy * -0.78) * 2.3


# ------------------------------------------------------------- the rivers ---
G = 1.25                                             # routing grid, card units
gx_ = np.arange(CX - R - 4, min(W + 30, CX + R + 4), G)
gy_ = np.arange(CY - R - 4, CY + R + 4, G)
GX, GY = np.meshgrid(gx_, gy_)
grid = planet(GX, GY)
NYG, NXG = GX.shape


def gsamp(field, x, y, order=1):
    x, y = np.asarray(x, float), np.asarray(y, float)
    out = map_coordinates(np.asarray(field, F), [(np.atleast_1d(y) - gy_[0]) / G, (np.atleast_1d(x) - gx_[0]) / G],
                          order=order, mode="nearest")
    return out.reshape(x.shape)


def route(f):
    """Fill and drain the land (priority flood from the sea), then sum rain down the tree."""
    elev = np.where(f["ice"], np.clip(f["elev"], 0, None) + 0.2, f["elev"]).astype(float)
    dry = f["land"] & (f["r"] < 0.992)
    ny, nx = elev.shape
    recv = np.full(ny * nx, -1, np.int64)
    fill = elev.ravel().copy()
    done = ~dry.ravel()
    flat = elev.ravel()
    heap = []
    idx = np.flatnonzero(done.reshape(ny, nx)[1:-1, 1:-1].ravel())
    inner = (idx // (nx - 2) + 1) * nx + idx % (nx - 2) + 1
    nb = (-nx - 1, -nx, -nx + 1, -1, 1, nx - 1, nx, nx + 1)
    dry_f = dry.ravel()
    for c in inner.tolist():                         # sea cells that touch land
        if any(dry_f[c + o] for o in nb):
            heap.append((flat[c], c))
    heapq.heapify(heap)
    order = []
    while heap:
        h, c = heapq.heappop(heap)
        if dry_f[c]:
            order.append(c)
        j, i = divmod(c, nx)
        if j == 0 or i == 0 or j == ny - 1 or i == nx - 1:
            continue
        for o in nb:
            n = c + o
            if not done[n]:
                done[n] = True
                recv[n] = c
                fill[n] = max(flat[n], h + 1e-5)
                heapq.heappush(heap, (fill[n], n))
    area = 1 / np.clip(np.sqrt(np.clip(1 - f["r"] ** 2, 0, 1)), 0.12, 1)       # a cell near the limb is more ground
    acc = np.where(dry, f["rain"] * area * np.where(f["ice"], 0.25, 1.0), 0.0).ravel().copy()
    for c in reversed(order):
        acc[recv[c]] += acc[c]
    return recv, acc, dry_f, np.where(dry, (fill - elev.ravel()).reshape(ny, nx), 0.0)


RECV, ACC, DRY, POND = route(grid)
# A basin the land cannot drain fills to its sill: a lake, where it is deep and wide enough.
_lake = gaussian_filter((POND > 0.06).astype(F), 1.2)
_marsh = gaussian_filter((POND > 0.003).astype(F), 0.8)


def lake_at(x, y):
    return gsamp(_lake, x, y)


RIVER_MIN = 150.0
_is_river = DRY & (ACC > RIVER_MIN)
_up = {}
for c in np.flatnonzero(_is_river).tolist():
    _up.setdefault(int(RECV[c]), []).append(c)
RIVERS, MOUTHS = [], []                              # (polyline, discharge along it)
_seen = set()
for c in sorted(np.flatnonzero(_is_river).tolist(), key=lambda c: -ACC[c]):
    if c in _seen:
        continue
    path = [int(RECV[c]), c]                         # begin on the stem (or the sea) it joins
    _seen.add(c)
    while True:
        ups = [u for u in _up.get(path[-1], []) if u not in _seen]
        if not ups:
            break
        nxt = max(ups, key=lambda u: ACC[u])         # at each confluence the larger river runs on
        _seen.add(nxt)
        path.append(nxt)
    if len(path) < 7:
        continue
    jj, ii = np.divmod(np.array(path), NXG)
    pts = np.stack([gx_[ii], gy_[jj]], -1)
    q = np.stack([gaussian_filter1d(pts[:, 0], 2.2, mode="nearest"), gaussian_filter1d(pts[:, 1], 2.2, mode="nearest")], -1)
    q[0] = pts[0]
    RIVERS.append((q[::-1].astype(F), ACC[np.array(path)][::-1]))      # source to mouth
    if not DRY[path[0]]:
        MOUTHS.append((pts[0], float(ACC[c])))
_qmax = max(a for _, a in MOUTHS)
FANS = [(unproject(m[0], m[1])[0], (a / _qmax) ** 0.5) for m, a in MOUTHS if a > 0.04 * _qmax]

grid = planet(GX, GY, FANS, lake_at)                          # again, with the fans laid down
SLOPE = np.gradient(gaussian_filter(np.where(grid["land"], np.clip(grid["elev"], 0, None), 0.0), 1.6), G)


# -------------------------------------------------------------- contours ----
def contours(field, level, minlen=0.0):
    """Level set of a field on the routing grid, as polylines in card units (marching squares)."""
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
            return gx_[0] + (i + th[j, i]) * G, gy_[0] + j * G
        j, i = divmod(k - nhv, nx)
        return gx_[0] + i * G, gy_[0] + (j + tv[j, i]) * G

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


def on_globe(poly, margin=1.5):
    """The runs of a polyline that lie on the visible disc and the card."""
    poly = np.asarray(poly, F)
    ok = (np.hypot(poly[:, 0] - CX, poly[:, 1] - CY) < R - margin) & (poly[:, 0] < W + 8) \
        & (poly[:, 1] > -8) & (poly[:, 1] < H + 8)
    runs, start = [], None
    for i, o in enumerate(ok):
        if o and start is None:
            start = i
        if not o and start is not None:
            runs.append(poly[start:i])
            start = None
    if start is not None:
        runs.append(poly[start:])
    return [q for q in runs if len(q) >= 2]


def smooth(p, k=2.0):
    if len(p) < 5:
        return p
    q = np.stack([gaussian_filter1d(p[:, 0], k, mode="nearest"), gaussian_filter1d(p[:, 1], k, mode="nearest")], -1)
    q[0], q[-1] = p[0], p[-1]
    return q.astype(F)


def arc_on_globe(phi, lam, n=None):
    """A line given in the pole's coordinates, as its visible runs on the card."""
    phi, lam = np.broadcast_arrays(np.asarray(phi, float), np.asarray(lam, float))
    x, y, c = project(world(phi, lam))
    pts = np.stack([x, y], -1)
    pts[c < 0.02] = 1e6                              # behind the limb
    return on_globe(pts)


# ----------------------------------------------------------------- paint ----
cv = Canvas(W, H, SCALE, ground=PAPER, seed=SEED)
rng = cv.rng
S = cv.s

# The globe is stained with the model before any paint goes on: every field, at every pixel.
bx0, bx1 = int(max(0, (CX - R - 2) * S)), int(min(cv.W, (CX + R + 2) * S))
by0, by1 = int(max(0, (CY - R - 2) * S)), int(min(cv.H, (CY + R + 2) * S))
_py, _px = np.mgrid[by0:by1, bx0:bx1]
_px, _py = (_px + 0.5) / S, (_py + 0.5) / S
full = planet(_px, _py, FANS, lake_at)
stain = colour(full, hillshade(full["elev"], 1 / S))
disc = np.clip((R - np.hypot(_px - CX, _py - CY)) * S + 0.5, 0, 1).astype(F)
cv.img[by0:by1, bx0:bx1] = PAPER * (1 - disc[..., None]) + stain * disc[..., None]


def whole(m):
    out = np.zeros((cv.H, cv.W), F)
    out[by0:by1, bx0:bx1] = m
    return out


M_ICE = whole(disc * full["ice"])
M_SEA = whole(disc * (~full["land"] & ~full["ice"]))
M_LAND = whole(disc * (full["land"] & ~full["ice"] & ~full["lake"]))
M_DISC = whole(disc)
del _px, _py


def stained(x, y):
    j = int(np.clip(y * S - by0, 0, by1 - by0 - 1))
    i = int(np.clip(x * S - bx0, 0, bx1 - bx0 - 1))
    return stain[j, i]


def stamp(poly, color, opacity=1.0):
    """A cut shape, for the chart's symbols."""
    m = cv.poly_mask(np.asarray(poly, F)) * M_DISC * opacity
    cv.img[:] = cv.img * (1 - m[..., None]) + np.asarray(color, F) * m[..., None]


FLOOR = replace(FILBERT, streak=0.030, chroma=0.008, jitter=0.012, dry=0.06, thick=0.35, taper=(0.03, 0.05), tip=0.85)
GROUND = replace(FILBERT, streak=0.045, chroma=0.014, jitter=0.02, dry=0.2, thick=0.5)

# 1. The sea floor, along its isochrons: band by band outward from the ridge, each stroke on
#    one meridian of the Euler pole, between one transform's parallel and the next.
with cv.frisket(M_SEA):
    for k in range(len(RIDGE)):
        p_lo, p_hi = BAND[k], BAND[k + 1]
        pm = 0.5 * (p_lo + p_hi)
        for side in (-1, 1):
            a_max = (coast_east(pm) + 6 - RIDGE[k]) / HALF_RATE if side > 0 else (RIDGE[k] - coast_west(pm) + 9) / HALF_RATE
            for j in range(len(REVERSALS) - 1):
                a0, a1 = REVERSALS[j], REVERSALS[j + 1]
                if a0 > a_max:
                    break
                l0, l1 = RIDGE[k] + side * HALF_RATE * a0, RIDGE[k] + side * HALF_RATE * a1
                xa, ya, ca = project(world(pm, l0))
                xb, yb, cb = project(world(pm, l1))
                if min(ca, cb) < 0.03:
                    continue
                wide = float(np.hypot(xb - xa, yb - ya))
                lanes = max(1, int(round(wide / 6.5)))
                for i in range(lanes):
                    lam = l0 + (l1 - l0) * (i + 0.5) / lanes
                    s = p_lo - rng.uniform(0, 2.0)
                    while s < p_hi:
                        ln = rng.uniform(5.0, 12.0)
                        e = min(s + ln, p_hi)
                        if p_hi - e < 1.5:
                            e = p_hi
                        ph = np.linspace(max(s, p_lo), e, max(3, int((e - s) * 1.5)))
                        for q in arc_on_globe(ph, lam):
                            if len(q) < 2:
                                continue
                            if rng.random() < 0.5:
                                q = q[::-1]
                            cv.stroke(q, max(1.3, wide / lanes * 1.18), stained(*q[0]), FLOOR,
                                      color_end=stained(*q[-1]), opacity=0.86)
                        s = e + 1e-3 if e >= p_hi else e - 0.8

# 2. The land, hachured: short strokes run down the slope, so their direction is the way water goes.
_cand = np.stack([rng.uniform(gx_[0], gx_[-1], 26000), rng.uniform(gy_[0], gy_[-1], 26000)], -1)
_keep = (gsamp(grid["land"], _cand[:, 0], _cand[:, 1], 0) > 0.5) & (gsamp(grid["r"], _cand[:, 0], _cand[:, 1]) < 0.998) \
    & (gsamp(grid["lake"], _cand[:, 0], _cand[:, 1], 0) < 0.5)
_cand = _cand[_keep]
with cv.frisket(M_LAND):
    for x, y in _cand:
        if x > W + 6 or y < -6 or y > H + 6:
            continue
        pts = [np.array([x, y])]
        steep = 0.0
        for _ in range(3):
            g = np.array([float(gsamp(SLOPE[1], *pts[-1])), float(gsamp(SLOPE[0], *pts[-1]))])
            gn = float(np.hypot(*g))
            steep = max(steep, gn)
            if gn < 1e-5:
                break
            pts.append(pts[-1] - g / gn * (2.2 + 18.0 * min(gn, 0.16)))
        if len(pts) < 2:
            continue
        mid = pts[len(pts) // 2]
        cv.stroke(np.array(pts), rng.uniform(2.6, 4.6) * (1.25 - 2.2 * min(steep, 0.16)), stained(*mid), GROUND,
                  opacity=0.8)

# 3. Ice. On land it flows down its own surface; at sea it drifts round the pole.
_cand = np.stack([rng.uniform(gx_[0], gx_[-1], 9000), rng.uniform(gy_[0], gy_[-1], 9000)], -1)
_keep = (gsamp(grid["ice"], _cand[:, 0], _cand[:, 1], 0) > 0.5) & (gsamp(grid["r"], _cand[:, 0], _cand[:, 1]) < 0.998)
with cv.frisket(M_ICE):
    for x, y in _cand[_keep]:
        if y < -6:
            continue
        p0 = unproject(x, y)[0]
        if float(gsamp(grid["land"], x, y, 0)) > 0.5:
            g = np.array([float(gsamp(SLOPE[1], x, y)), float(gsamp(SLOPE[0], x, y))])
            gn = float(np.hypot(*g))
            if gn < 1e-5:
                continue
            q = np.array([[x, y], np.array([x, y]) - g / gn * 9.0])
        else:
            east = unit(np.cross(NORTH, p0))
            pts = [unit(p0 + east * t) for t in np.linspace(-0.05, 0.05, 5)]
            px, py, _ = project(np.array(pts))
            q = np.stack([px, py], -1)
        cv.stroke(q, rng.uniform(3.5, 6.0), stained(x, y), GROUND, opacity=0.75, streak=0.02, chroma=0.004)

# 4. Rivers, source to mouth, their weight the discharge.
with cv.frisket(M_LAND):
    for pts, q in sorted(RIVERS, key=lambda r: r[1][-1]):
        for run in on_globe(pts, 0.5):
            dry = gsamp(_marsh, run[:, 0], run[:, 1]) < 0.5      # a river breaks where its basin is filled
            if dry.sum() < 4:
                continue
            run = run[np.argmax(dry):len(dry) - np.argmax(dry[::-1])]
            wgt = 0.7 + 1.9 * (q[-1] / _qmax) ** 0.45
            cv.stroke(run, wgt, mix(SEA_INK, stained(*run[len(run) // 2]), 0.18), LINER, taper=(0.6, 0.02), tip=0.25,
                      opacity=0.92)

# 5. The coast and the ice's edge: hairlines.
for poly in contours(grid["elev"], 0.0, minlen=6):
    for run in on_globe(smooth(poly, 1.2), 1.0):
        if float(gsamp(grid["icef"], *run[len(run) // 2])) > 0:
            continue
        cv.stroke(run, 0.8, mix(INK, SEA_INK, 0.45), LINE, opacity=0.55)
for poly in contours(gaussian_filter(grid["icef"], 1.0), 0.0, minlen=10):
    for run in on_globe(smooth(poly, 1.5), 1.0):
        cv.stroke(run, 0.8, mix(INK, SEA_INK, 0.6), LINE, opacity=0.5)

# 6. Seamounts, paler for standing nearer the surface; those that break it are islands.
for q, age, hgt, rad in SEAMOUNTS:
    x, y, c = project(q)
    if c < 0.05:
        continue
    f1 = planet(np.array([x]), np.array([y]), FANS)
    if bool(f1["ice"][0]) or bool(f1["land"][0]):
        continue
    k = 0.55 + 0.45 * float(c)
    cv.dab((x, y), k * rad * R * RAD * (0.35 + 0.65 * np.sqrt(hgt / 4.6)), stained(x, y), opacity=1.0, soft=0.35)
    if float(f1["depth"][0]) < 0:
        cv.dab((x, y), k * (1.0 + 1.3 * min(1.0, -float(f1["depth"][0]) / 2)), mix(ROCK, INK, 0.25), opacity=0.9)

# 7. The trench: a rule, with sawteeth on the plate that stays on top.
_phi = np.arange(BAND[0], BAND[-1], 0.25)
_trench = coast_east(_phi) - TRENCH_OFF / np.cos(_phi * RAD)
TOOTH, TOOTH_GAP = 6.4, 16.0
for run in arc_on_globe(_phi, _trench):
    run = resample(run, 2.0)
    cv.stroke(run, 1.5, INK, LINE, opacity=0.9)
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*(run[1:] - run[:-1]).T))])
    for s in np.arange(TOOTH_GAP / 2, d[-1] - 4, TOOTH_GAP):
        i = int(np.searchsorted(d, s))
        t = unit(run[min(i + 2, len(run) - 1)] - run[max(i - 2, 0)])
        c_here = project(unproject(run[i, 0], run[i, 1])[0])[2]
        over = np.array([t[1], -t[0]])                # toward the continent
        probe = run[i] + over * 6
        if float(gsamp(grid["d_e"], *probe)) < float(gsamp(grid["d_e"], *run[i])):
            over = -over
        k = 0.55 + 0.45 * float(c_here)               # symbols shrink toward the limb, with the ground
        stamp([run[i] - t * TOOTH * 0.62 * k, run[i] + t * TOOTH * 0.62 * k, run[i] + over * TOOTH * k], INK, 0.92)

# 8. Transforms: fine rules along the pole's parallels, from one ridge segment to the next.
for k in range(len(RIDGE) - 1):
    lam = np.linspace(RIDGE[k], RIDGE[k + 1], 12)
    for run in arc_on_globe(BAND[k + 1], lam):
        cv.stroke(run, 1.15, INK, LINE, opacity=0.8)

# 9. The red: the ridge, the arc's volcanoes, the hotspots.
for k in range(len(RIDGE)):
    ph = np.linspace(BAND[k], BAND[k + 1], 24)
    for run in arc_on_globe(ph, RIDGE[k]):
        cv.stroke(run, 3.3, RED, LINE, jitter=0.0, soft=0.22, thick=0.5)
_arc = coast_east(_phi) + ARC_OFF / np.cos(_phi * RAD)
for run in arc_on_globe(_phi, _arc):
    run = resample(run, 2.0)
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*(run[1:] - run[:-1]).T))])
    s = 6.0
    while s < d[-1]:
        i = int(np.searchsorted(d, s))
        x, y = run[i] + rng.normal(0, 1.2, 2)
        c_here = float(np.sqrt(max(0.0, 1 - ((x - CX) ** 2 + (y - CY) ** 2) / R ** 2)))
        if float(gsamp(grid["land"], x, y, 0)) > 0.5:
            cv.dab((x, y), 2.5 * (0.55 + 0.45 * c_here), RED, jitter=0.0, gap=0.0, streak=0.01, soft=0.25, thick=0.9)
        s += rng.uniform(13.0, 20.0)
for q in HOT:
    x, y, c = project(q)
    if c > 0.05:
        cv.dab((x, y), 2.6, RED, jitter=0.0, gap=0.0, streak=0.01, soft=0.25, thick=0.9)
        cv.stroke(arc(x, y, 6.4, 0, 360, n=40), 1.25, RED, LINE, jitter=0.0)

# 10. The limb.
cv.stroke(arc(CX, CY, R, 0, 360, n=400), 0.9, INK, LINE, opacity=0.5)

os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
cv.save_card(OUT, relief=0.4, tooth=0.02)
print(f"{cv.count} strokes, {len(RIVERS)} rivers, {cv.W}x{cv.H}, {time.time() - t0:.1f}s -> {OUT}")
