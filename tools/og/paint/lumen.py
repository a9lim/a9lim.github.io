"""The Cross-section.

The social card for Lumen. A cyanobacterial thylakoid cut across, in the manner
of David Goodsell's molecular watercolours: flat washes, a darker outline, a
soft lighter body, everything at one scale (8.8 px to the nanometre; only the
protons, which are symbols, are drawn larger than life). The sac
comes in from the right and closes in its rounded margin; the paper to its left
is the stroma, where the type sits.

What each mark reads:

- The two rows of small ringed heads are the bilayer's leaflets; the ochre
  lozenges between them are the plastoquinone pool.
- Sap green is photosystem II (a dimer, its oxygen-evolving lobes hanging into
  the lumen), under its phycobilisome, the blue fan of discs that gathers its
  light. The paired grey beads leaving it are O2.
- Prussian blue is cytochrome b6f, its cytochrome f reaching into the lumen;
  the small indigo carriers there are plastocyanin on their way to
  photosystem I, the viridian trimer in the lower membrane, with ferredoxin
  (ochre) and FNR (umber) at its stromal ridge and NADPH beside them.
- The ochre machines are ATP synthase: a ring of c subunits in the membrane,
  a stalk, and the F1 head out in the stroma, with ADP and ATP (two and three
  phosphates) around it.
- The wiggles are photons, arriving from the stroma side.
- The red is protons, and only protons. How crowded the lumen is with them is
  the stored gradient; the few in file through the ring of the near synthase
  are the gradient being spent.

    python3 lumen.py [scale=2] [out=../art/lumen.png]

Painted by Claude, 2026-11-11.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from brush import F, Canvas, replace, rgb, mix, resample, spline, FILBERT, SOFT, LINER, DAB

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "art",
                                                         "lumen.png")
t0 = time.time()

PAPER = rgb("#fcfcfb")
INK = rgb("#161514")
RED = rgb("#983432")
INKS = {k: rgb(v) for k, v in dict(
    indigo="#586AB2", prussian="#3473A3", verdigris="#2A7976", viridian="#317B55", sap="#5B7637",
    ochre="#8B681B", sienna="#9F5D31", umber="#7C6049", graphite="#666463").items()}
INKS["gold"] = mix(INKS["ochre"], rgb("#b88a1e"), 0.5)      # ATP synthase: ochre, a little brighter
INKS["bronze"] = mix(INKS["ochre"], INKS["umber"], 0.6)     # its stalks and stator
INKS["leaf"] = mix(INKS["sap"], INKS["ochre"], 0.22)        # PSII's lumenal lobes: a yellower sap
INKS["lipid"] = mix(INKS["umber"], INKS["ochre"], 0.45)

cv = Canvas(W, H, SCALE, ground=PAPER, seed=11)
rng = np.random.default_rng(1858)       # geometry; the brush has its own

WASH = replace(FILBERT, streak=0.014, chroma=0.006, jitter=0.010, dry=0.0, gap=0.0, thick=0.06, grain=0.25,
               taper=(0.06, 0.1), tip=0.7)
BODY = replace(FILBERT, streak=0.024, chroma=0.010, jitter=0.016, dry=0.04, gap=0.0, thick=0.12, grain=0.3,
               taper=(0.05, 0.08), tip=0.75)
OUTL = replace(LINER, soft=0.42, wobble=0.22, thick=0.06, jitter=0.02, taper=(0.05, 0.1), tip=0.5)
BEAD = replace(DAB, soft=0.3, thick=0.1, streak=0.01, jitter=0.012, gap=0.0, grain=0.15)


# ------------------------------------------------------------- geometry ----
PX = 8.8                    # pixels to the nanometre
K = PX / 8.0                # the complexes below are written at 8 px/nm
HL = 6.5 * PX               # half the lumen's width
MT = 4.75 * PX              # the bilayer
RM = HL + MT / 2            # to the bilayer's mid-plane
RO = HL + MT                # to the sac's outer face

AXIS = resample(spline(np.array([(640, 334), (794, 307), (964, 272), (1134, 240), (1344, 208)], F), 3.0), 2.0)
_d = np.hypot(*(AXIS[1:] - AXIS[:-1]).T)
AX_S = np.concatenate([[0.0], np.cumsum(_d)])
_t = np.gradient(AXIS.astype(float), axis=0)
AX_T = _t / np.hypot(_t[:, 0], _t[:, 1])[:, None]
AX_N = np.stack([-AX_T[:, 1], AX_T[:, 0]], -1)      # toward the lower membrane
S_MAX = float(AX_S[-1])
TIP, TIP_T, TIP_N = AXIS[0].astype(float), AX_T[0], AX_N[0]


def axis_at(s):
    p = np.array([np.interp(s, AX_S, AXIS[:, 0]), np.interp(s, AX_S, AXIS[:, 1])])
    t = np.array([np.interp(s, AX_S, AX_T[:, 0]), np.interp(s, AX_S, AX_T[:, 1])])
    t /= np.hypot(*t)
    return p, t, np.array([-t[1], t[0]])


def cap_pt(theta, r):
    """Around the margin: theta 0 is the upper membrane, pi the lower."""
    return TIP + r * (np.cos(theta) * (-TIP_N) + np.sin(theta) * (-TIP_T))


def boundary(r, step=4.0):
    """The curve at distance r from the axis: along the top, round the margin, back along the bottom."""
    ss = np.arange(S_MAX, 0, -step)
    top = np.array([axis_at(s)[0] - axis_at(s)[2] * r for s in ss])
    cap = np.array([cap_pt(th, r) for th in np.linspace(0, np.pi, max(8, int(np.pi * r / step)))])
    bot = np.array([axis_at(s)[0] + axis_at(s)[2] * r for s in ss[::-1]])
    return np.vstack([top, cap, bot]).astype(F)


OUTER, INNER = boundary(RO), boundary(HL)
BAND = np.vstack([OUTER, INNER[::-1]])
LUMEN = INNER


class Frame:
    """A place on a membrane: u runs along it, v out toward the stroma."""

    def __init__(self, side, s):                # side -1: upper membrane, +1: lower
        s = s * K
        p, t, n = axis_at(s)
        self.side, self.s = side, s
        self.o, self.t, self.n = p + side * n * RM, t, side * n

    def w(self, pts):
        q = np.atleast_2d(np.asarray(pts, float)) * K
        return (self.o + q[:, :1] * self.t + q[:, 1:2] * self.n).astype(F)

    def deg(self, local_deg=0.0):
        a = np.deg2rad(local_deg)
        d = np.cos(a) * self.t + np.sin(a) * self.n
        return float(np.rad2deg(np.arctan2(d[1], d[0])))


def blob(u, v, ru, rv, deg=0.0, k=0.07, sq=2.3, seed=0, n=44):
    """A soft-cornered lump: a superellipse with a slow wobble in its radius."""
    r = np.random.default_rng(seed)
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    amp = 1 + k * (r.normal() * np.sin(th + r.uniform(0, 6.3)) + 0.8 * r.normal() * np.sin(2 * th + r.uniform(0, 6.3))
                   + 0.6 * r.normal() * np.sin(3 * th + r.uniform(0, 6.3)))
    c, s = np.cos(th), np.sin(th)
    x = ru * np.sign(c) * np.abs(c) ** (2 / sq) * amp
    y = rv * np.sign(s) * np.abs(s) ** (2 / sq) * amp
    a = np.deg2rad(deg)
    return np.stack([u + x * np.cos(a) - y * np.sin(a), v + x * np.sin(a) + y * np.cos(a)], -1)


def inside(poly, pts):
    poly = np.asarray(poly, float)
    pts = np.atleast_2d(np.asarray(pts, float))
    x, y = pts[:, 0][:, None], pts[:, 1][:, None]
    a, b = poly, np.roll(poly, -1, 0)
    cond = (a[:, 1] <= y) != (b[:, 1] <= y)
    with np.errstate(divide="ignore", invalid="ignore"):
        xi = a[:, 0] + (y - a[:, 1]) / (b[:, 1] - a[:, 1]) * (b[:, 0] - a[:, 0])
    return (np.sum(cond & (x < xi), 1) % 2) == 1


def lumen_depth(pts):
    """How far inside the lumen's wall each point is (negative: outside it)."""
    pts = np.atleast_2d(np.asarray(pts, float))
    d = np.hypot(pts[:, None, 0] - AXIS[None, ::3, 0], pts[:, None, 1] - AXIS[None, ::3, 1]).min(1)
    return HL - d


# ---------------------------------------------------------------- paint ----
OBSTACLES = []      # what the lumen's protons have to leave room for
KEEPOUT = []        # (side, s0, s1): stretches of membrane a complex occupies


def closed(poly, start=None):
    k = int(rng.integers(len(poly))) if start is None else start
    q = np.roll(np.asarray(poly, F), -k, 0)
    return np.vstack([q, q[:2]])


def wash(poly, color, brush=WASH, angle=None, w=None, **over):
    poly = np.asarray(poly, F)
    bw, bh = float(np.ptp(poly[:, 0])), float(np.ptp(poly[:, 1]))
    w = w or float(np.clip(min(bw, bh) / 2.3, 3.0, 26.0))
    L = max(bw, bh)
    if angle is None:
        angle = (90.0 if bh > bw else 0.0) + rng.uniform(-18, 18)
    cv.fill(poly, color, brush, width=w, angle=angle, overlap=0.45, length=(0.7 * L + 6, 1.5 * L + 12),
            wander=0.35, bleed=0.9, **over)


def shape(poly, ink, tone=0.0, lw=1.8, angle=None, lift=0.5):
    """One molecule, or one subunit of one: wash, pooled edge, lighter body, outline."""
    poly = np.asarray(poly, F)
    body = mix(ink, PAPER, float(np.clip(0.31 + tone, 0.0, 0.92)))
    line = mix(ink, INK, 0.5)
    wash(poly, body, BODY, angle)
    c = poly.mean(0)
    r = 0.5 * np.sqrt(float(np.ptp(poly[:, 0])) * float(np.ptp(poly[:, 1])))
    with cv.frisket(poly):
        cv.stroke(closed(poly), max(3.0, 0.3 * r), mix(body, line, 0.42), SOFT, opacity=0.5)
        cv.glow(c - np.array([0.18, 0.22]) * r, 0.8 * r, mix(body, PAPER, 0.62), lift, mode="normal")
    cv.stroke(closed(poly), lw, line, OUTL)


def part(fr, u, v, ru, rv, deg=0.0, ink="sap", tone=0.0, k=0.07, sq=2.4, seed=0, lw=1.8, mirror=False, lift=0.5):
    if mirror:
        u, deg = -u, -deg
    if v - max(ru, rv) < -MT / 2 - 3:        # reaches into the lumen
        OBSTACLES.append(fr.w(blob(u, v, ru + 6, rv + 6, deg, k, sq, seed)))
    shape(fr.w(blob(u, v, ru, rv, deg, k, sq, seed)), INKS[ink] if isinstance(ink, str) else ink, tone, lw * K,
          angle=fr.deg((90 if rv > ru else 0) + deg) + rng.uniform(-12, 12), lift=lift)


def bead(p, r, color, rim=0.3, hole=None):
    """A small round thing: a darker rim and a lighter middle."""
    cv.dab(p, r, mix(color, INK, rim), BEAD)
    cv.dab(p, r * 0.62, color if hole is None else hole, BEAD)


# ---------------------------------------------------------------- ground ----
GROUND = replace(WASH, streak=0.004, chroma=0.0015, jitter=0.003, thick=0.0, soft=0.5, grain=0.1)


def paint_ground():
    # the stroma: paper at the left, the faintest wash toward the sac
    tint = mix(INKS["sap"], INKS["ochre"], 0.45)

    def stroma(x, y):
        t = np.clip((x - 400) / 760, 0, 1)
        near = np.exp(-(max(0.0, -lumen_depth([(x, y)])[0] - MT) / 190.0) ** 2) * np.clip((x - 330) / 240, 0, 1)
        return mix(PAPER, tint, 0.012 + 0.035 * t ** 1.4 + 0.05 * near)

    whole = np.array([(-90, -90), (W + 90, -90), (W + 90, H + 90), (-90, H + 90)], F)
    cv.fill(whole, stroma, GROUND, width=70, angle=-10, overlap=0.6, length=(260, 600), frisket=False, curve=8,
            wander=3)
    cv.fill(whole, stroma, GROUND, width=52, angle=-14, overlap=0.5, length=(200, 480), frisket=False, curve=12,
            wander=3, opacity=0.6, shuffle=True)

    # the lumen: a pale wash of its own colour, a little deeper along its walls
    water = mix(INKS["verdigris"], INKS["viridian"], 0.3)

    def lumen(x, y):
        d = float(np.clip(lumen_depth([(x, y)])[0] / HL, 0, 1))
        return mix(PAPER, water, 0.32 - 0.10 * d)

    cv.fill(LUMEN, lumen, WASH, width=26, angle=-10, overlap=0.5, length=(120, 300), curve=4, wander=1.5)
    cv.fill(LUMEN, lumen, WASH, width=18, angle=-13, overlap=0.4, length=(80, 220), curve=6, wander=2,
            opacity=0.5, shuffle=True)
    with cv.frisket(LUMEN):
        cv.stroke(np.vstack([INNER, INNER[:1]]), 9 * K, mix(PAPER, water, 0.46), SOFT, opacity=0.5)

    # the bilayer's ground
    def band(x, y):
        return mix(PAPER, INKS["lipid"], 0.2 + 0.03 * np.sin(x / 37.0))

    cv.fill(BAND, band, WASH, width=15, angle=-10, overlap=0.5, length=(70, 200), curve=3, wander=1.0)


# ---------------------------------------------------------------- lipids ----
HEAD_R = 3.7 * K
SPACING = 8.7 * K


def kept_out(side, s):
    return any(sd == side and a <= s <= b for sd, a, b in KEEPOUT)


def lipid(p, inward, lean):
    """A head on the surface and two tails toward the mid-plane."""
    perp = np.array([-inward[1], inward[0]])
    tail = mix(PAPER, INKS["umber"], 0.5 + rng.uniform(-0.06, 0.06))
    for side in (-1, 1):
        a = p + inward * (HEAD_R * 0.8) + perp * side * 1.5 * K
        b = p + inward * (MT / 2 - 1.5) + perp * (side * 1.5 * K + lean + rng.normal(0, 1.2))
        m = (a + b) / 2 + perp * rng.normal(0, 1.0)
        cv.stroke([a, m, b], 1.7 * K, tail, LINER, soft=0.5, thick=0.03)
    head = mix(PAPER, INKS["lipid"], 0.5 + rng.uniform(-0.05, 0.08))
    bead(p, HEAD_R, head, rim=0.34, hole=mix(head, PAPER, 0.5))


def paint_lipids():
    for side in (-1, 1):
        for leaf in (1, -1):                     # outer leaflet, inner leaflet
            s = 3.0 + rng.uniform(0, SPACING)
            while s < S_MAX:
                if not kept_out(side, s):
                    p, t, n = axis_at(s)
                    out = side * n
                    lipid(p + out * (RM + leaf * (MT / 2 - HEAD_R)) + t * rng.normal(0, 0.5), -leaf * out,
                          rng.normal(0, 1.4))
                s += SPACING * rng.uniform(0.92, 1.1)
    for leaf in (1, -1):                         # round the margin
        r = RM + leaf * (MT / 2 - HEAD_R)
        n = int(np.pi * r / SPACING)
        for th in np.linspace(0, np.pi, n + 2)[1:-1]:
            p = cap_pt(th + rng.normal(0, 0.006), r)
            radial = (p - TIP) / np.hypot(*(p - TIP))
            lipid(p, -leaf * radial, rng.normal(0, 1.2))


def quinones():
    """The plastoquinone pool, in the bilayer's mid-plane."""
    for side, s in [(-1, 176), (-1, 196), (-1, 322), (-1, 340), (-1, 356), (-1, 552), (1, 44),
                    (1, 284), (1, 304), (1, 322), (1, 452), (1, 474)]:
        p, t, n = axis_at(s * K)
        c = p + side * n * (RM + rng.uniform(-5, 5))
        d = t * np.cos(a := rng.uniform(-0.9, 0.9)) + n * np.sin(a)
        ring = mix(INKS["ochre"], PAPER, 0.18)
        cv.stroke([c - d * 4.2 * K, c + d * 4.2 * K], 6.4 * K, mix(ring, INK, 0.35), LINER, soft=0.3, tip=0.9)
        cv.stroke([c - d * 3.4 * K, c + d * 3.4 * K], 3.8 * K, mix(ring, PAPER, 0.25), LINER, soft=0.3, tip=0.9)
        cv.stroke([c + d * 4.5 * K, c + d * 10 * K + n * rng.normal(0, 2)], 1.5 * K, mix(ring, INK, 0.2), LINER,
                  soft=0.5)


# -------------------------------------------------------------- complexes ----
def reserve(side, s, a, b):
    KEEPOUT.append((side, s + a * K, s + b * K))


def photosystem_ii(fr):
    for m in (False, True):
        sd = 20 if m else 0
        # the oxygen-evolving side, hanging in the lumen
        part(fr, 12, -31, 14, 10, 0, "leaf", 0.10, seed=sd + 1, mirror=m)
        part(fr, 64, -32, 13, 10, 8, "leaf", 0.14, seed=sd + 2, mirror=m)
        part(fr, 33, -43, 21, 13, -10, "leaf", 0.02, seed=sd + 3, mirror=m)      # PsbO
        part(fr, 74, -47, 10, 9, 0, "leaf", 0.20, seed=sd + 4, mirror=m)         # PsbV
        part(fr, 52, -55, 9, 7, 0, "leaf", 0.26, seed=sd + 5, mirror=m)          # PsbU
        # small stromal loops
        part(fr, 26, 24, 11, 5, 0, "sap", 0.16, seed=sd + 6, mirror=m, sq=2.0)
        part(fr, 60, 24, 10, 5, 0, "sap", 0.20, seed=sd + 7, mirror=m, sq=2.0)
        # the membrane core: CP47, D2, D1, CP43, and a small subunit at the rim
        part(fr, 82, 2, 6.5, 22, 0, "sap", 0.22, seed=sd + 8, mirror=m, sq=3.0)
        part(fr, 67, 0, 13, 26, 0, "sap", 0.06, seed=sd + 9, mirror=m, sq=3.0)
        part(fr, 15, 0, 15, 27, 0, "sap", 0.00, seed=sd + 10, mirror=m, sq=3.0)
        part(fr, 50, -1, 10.5, 25, 0, "sap", -0.10, seed=sd + 11, mirror=m, sq=3.0)
        part(fr, 33, 1, 10.5, 25, 0, "sap", -0.04, seed=sd + 12, mirror=m, sq=3.0)


def phycobilisome(fr):
    """The antenna on photosystem II's stromal face: a core of three cylinders, seen end on, and rods of discs."""
    cy = 71
    for a in (14, 166, 54, 126):
        for j in (2, 1, 0):
            r = 97 + 23 + 46 * j
            u, v = r * np.cos(np.deg2rad(a)), cy + 26 + r * np.sin(np.deg2rad(a))
            tilt = a + float(np.random.default_rng(700 + a + j).normal(0, 2.5))
            part(fr, u, v, 22, 37, tilt, "indigo", 0.27 + 0.05 * j + (0.04 if j == 1 else 0), k=0.045, sq=3.3,
                 seed=100 + a + j, lw=1.4, lift=0.35)
            d = np.array([-np.sin(np.deg2rad(tilt)), np.cos(np.deg2rad(tilt))])        # a disc is two trimers
            cv.stroke(fr.w([np.array([u, v]) - d * 31, np.array([u, v]) + d * 31]), 1.2 * K,
                      mix(INKS["indigo"], INK, 0.2), OUTL, opacity=0.45)
    for u, v, sd in [(0, cy + 76, 3), (-44, cy, 1), (44, cy, 2)]:
        part(fr, u, v, 42, 42, 0, "prussian", 0.31, k=0.025, sq=2.0, seed=90 + sd, lw=1.5, lift=0.45)
        c = fr.w([(u, v)])[0]
        hole = np.array([c + 9 * K * np.array([np.cos(t), np.sin(t)]) for t in np.linspace(0, 6.4, 30)])
        with cv.frisket(hole):
            cv.glow(c, 9 * K, mix(INKS["prussian"], INK, 0.2), 0.3, mode="normal")
        cv.stroke(hole, 1.3 * K, mix(INKS["prussian"], INK, 0.3), OUTL, opacity=0.5)


def cytochrome_b6f(fr):
    for m in (False, True):
        sd = 40 if m else 30
        part(fr, 24, -44, 9, 22, 22, "prussian", 0.10, seed=sd + 1, mirror=m)     # cytochrome f
        part(fr, 7, -33, 11, 9, 0, "prussian", 0.20, seed=sd + 2, mirror=m)        # the Rieske head
        part(fr, 15, 23, 10, 4.5, 0, "prussian", 0.2, seed=sd + 3, mirror=m, sq=2.0)
        part(fr, 40, 2, 5.5, 21, 0, "prussian", 0.22, seed=sd + 4, mirror=m, sq=3.0)
        part(fr, 29, 1, 9.5, 24, 0, "prussian", 0.04, seed=sd + 5, mirror=m, sq=3.0)
        part(fr, 11, 0, 11.5, 26, 0, "prussian", -0.08, seed=sd + 6, mirror=m, sq=3.0)


def photosystem_i(fr, centres=(0, -45, 45)):
    """A trimer from the side: one monomer behind, two in front."""
    for i, c in enumerate(centres):
        back = 0.16 if (i == 0 and len(centres) == 3) else 0.0
        sd = 50 + 10 * i
        part(fr, c, -25, 17, 6, 0, "viridian", 0.18 + back, seed=sd + 1, sq=2.0)             # PsaF, lumen side
        for u, v, ru, rv, tone in [(-14, 31, 13, 9, 0.14), (20, 30, 10, 8, 0.2), (4, 37, 11, 9, 0.06)]:
            part(fr, c + u, v, ru, rv, 0, "viridian", tone + back, seed=sd + int(u) + 20)     # PsaD, E, C
        part(fr, c - 40, 1, 6, 22, 0, "viridian", 0.2 + back, seed=sd + 5, sq=3.0)
        part(fr, c + 40, 1, 6, 22, 0, "viridian", 0.2 + back, seed=sd + 6, sq=3.0)
        part(fr, c - 19, 0, 19, 27, 0, "viridian", -0.04 + back, seed=sd + 7, sq=3.0)         # PsaA
        part(fr, c + 19, 0, 19, 27, 0, "viridian", 0.03 + back, seed=sd + 8, sq=3.0)          # PsaB


def atp_synthase(fr, sd=0, flip=False, spending=False):
    m = flip
    g = "gold"
    # peripheral stalk, behind the head
    stalk = np.array([(37, 6), (47, 40), (50, 86), (44, 124), (26, 141), (6, 144)], float)
    if m:
        stalk[:, 0] *= -1
    sp = spline(fr.w(stalk), 3.0)
    cv.stroke(sp, 9.5 * K, mix(INKS["bronze"], INK, 0.5), OUTL, wobble=0.0, tip=0.9)
    cv.stroke(sp, 6.0 * K, mix(INKS["bronze"], PAPER, 0.5), OUTL, wobble=0.0, tip=0.9)
    # the head: three of its six subunits face us, and two more show between them
    part(fr, -15, 122, 13, 30, 6, g, 0.22, seed=sd + 1, sq=2.6, mirror=m)
    part(fr, 17, 122, 13, 30, -6, g, 0.26, seed=sd + 2, sq=2.6, mirror=m)
    part(fr, 0, 62, 9, 26, -6, "bronze", 0.16, seed=sd + 3, sq=2.6, mirror=m)                 # the central stalk
    part(fr, -30, 97, 15, 34, -9, g, -0.02, seed=sd + 4, sq=2.6, mirror=m)
    part(fr, 31, 97, 15, 34, 9, g, 0.04, seed=sd + 5, sq=2.6, mirror=m)
    part(fr, 0, 95, 16, 36, 0, g, 0.12, seed=sd + 6, sq=2.6, mirror=m)
    part(fr, 4, 139, 17, 8, 0, "bronze", 0.24, seed=sd + 7, sq=2.2, mirror=m)                 # delta, on top
    part(fr, -7, 36, 11, 8, 0, "bronze", 0.28, seed=sd + 8, sq=2.2, mirror=m)                 # epsilon
    # in the membrane: subunit a beside the ring of c subunits
    part(fr, 39, 0, 12, 26, 0, "bronze", 0.1, seed=sd + 9, sq=3.2, mirror=m)
    for i, u in enumerate((-22, -11, 0, 11, 22)):
        part(fr, u, 0, 6.4, 27 - 1.6 * abs(i - 2), 0, g, 0.0 + 0.07 * (i % 2) + 0.03 * abs(i - 2), k=0.03, sq=3.4,
             seed=sd + 10 + i, mirror=m, lw=1.5)
    if spending:
        u = -27.5 if m else 27.5
        return [fr.w([(u + du, v)])[0] for du, v in [(1, -47), (-1, -33), (0, -19), (0.5, -4), (-0.5, 11),
                                                      (1, 27), (7, 44), (19, 58)]]
    return []


def carrier(p, ink, r, seed, tone=0.1, deg=0.0, obstacle=True):
    r = r * K
    poly = blob(p[0], p[1], r * 1.12, r * 0.9, deg, 0.08, 2.2, seed)
    if obstacle:
        OBSTACLES.append(blob(p[0], p[1], r * 1.12 + 6.5, r * 0.9 + 6.5, deg, 0.08, 2.2, seed).astype(F))
    shape(poly, INKS[ink], tone, 1.6 * K)


def oxygen(p, deg):
    a = np.deg2rad(deg)
    d = np.array([np.cos(a), np.sin(a)]) * 3.9 * K
    c = mix(PAPER, mix(INKS["graphite"], INKS["prussian"], 0.35), 0.6)
    for q in (p - d, p + d):
        bead(q, 4.7 * K, c, rim=0.45, hole=mix(c, PAPER, 0.55))


def nucleotide(p, deg, ink, phosphates):
    """A cofactor in the stroma: a base, a sugar and a tail of phosphates (three on ATP, two on ADP)."""
    a = np.deg2rad(deg)
    d = np.array([np.cos(a), np.sin(a)])
    c = mix(INKS[ink], PAPER, 0.38)
    bead(p, 3.6 * K, c, rim=0.32, hole=mix(c, PAPER, 0.3))
    bead(p + d * 5.4 * K, 2.7 * K, mix(c, PAPER, 0.25), rim=0.35)
    for i in range(phosphates):
        q = p + d * (9.6 + 3.5 * i) * K + np.array([-d[1], d[0]]) * (0.5 * i * i - 0.5) * K
        cv.dab(q, 1.9 * K, mix(c, INK, 0.15), BEAD)


def photon(end, heading, length, amp=6.0, lam=21.0, seed=0.0):
    """A wave packet arriving at `end`, travelling along `heading` (degrees, y down)."""
    a = np.deg2rad(heading)
    d = np.array([np.cos(a), np.sin(a)])
    n = np.array([-d[1], d[0]])
    start = np.asarray(end, float) - d * length
    s = np.linspace(0, length, int(length / 1.5))
    env = np.clip(s / (0.45 * length), 0, 1) ** 1.5 * np.clip((length - s) / (12.0 * K), 0, 1) ** 0.5
    pts = start + s[:, None] * d + (amp * K * env * np.sin(2 * np.pi * s / (lam * K) + seed))[:, None] * n
    cv.stroke(pts, 2.3 * K, mix(INKS["ochre"], rgb("#b9891a"), 0.4), LINER, soft=0.45, taper=(0.45, 0.03), tip=0.12,
              thick=0.04)


# --------------------------------------------------------------- protons ----
def protons(extra):
    """Crowded in the lumen, all but absent outside it."""
    pts = []
    x0, y0 = float(LUMEN[:, 0].min()), float(LUMEN[:, 1].min())
    x1, y1 = W + 12.0, float(LUMEN[:, 1].max())
    cand = np.stack([rng.uniform(x0, x1, 12000), rng.uniform(y0, y1, 12000)], -1)
    ok = lumen_depth(cand) > 5.6 * K
    for poly in OBSTACLES:
        ok &= ~inside(poly, cand)
    for p in cand[ok]:
        if not pts or np.hypot(*(np.array(pts) - p).T).min() > 9.8 * K:
            pts.append(p)
    pts = pts + list(extra)
    order = np.argsort([p[0] + p[1] for p in pts])
    for i in order:
        p = pts[i]
        c = RED * (1 + rng.normal(0, 0.05)) + rng.normal(0, 0.012, 3)
        cv.dab(p, 3.8 * K, mix(c, INK, 0.3), BEAD)
        cv.dab(p - np.array([0.35, 0.45]) * K, 2.7 * K, mix(c, rgb("#b23a36"), 0.5), BEAD)
    return len(pts)


# ------------------------------------------------------------------ paint ----
top_atp, top_b6f, top_psii = Frame(-1, 108), Frame(-1, 262), Frame(-1, 452)
bot_psi, bot_atp, bot_b6f = Frame(1, 178), Frame(1, 388), Frame(1, 548)
for fr, a, b in [(top_atp, -30, 52), (top_b6f, -47, 47), (top_psii, -90, 90), (bot_psi, -91, 91),
                 (bot_atp, -52, 30), (bot_b6f, -47, 47)]:
    reserve(fr.side, fr.s, a, b)

paint_ground()
paint_lipids()
quinones()

phycobilisome(top_psii)
photosystem_ii(top_psii)
cytochrome_b6f(top_b6f)
cytochrome_b6f(bot_b6f)
photosystem_i(bot_psi)
atp_synthase(bot_atp, sd=300, flip=True)
transit = atp_synthase(top_atp, sd=200, spending=True)

# plastocyanin: leaving cytochrome f, crossing the lumen, docked under photosystem I
carrier(top_b6f.w([(-58, -47)])[0], "indigo", 12.5, 401, 0.12, 20)
carrier(top_b6f.w([(-98, -76)])[0], "indigo", 12.5, 402, 0.16, -30)
carrier(bot_psi.w([(20, -45)])[0], "indigo", 12.5, 403, 0.12, 10)
# ferredoxin at photosystem I's stromal ridge and on its way to FNR, and the NADPH that makes
carrier(bot_psi.w([(-49, 52)])[0], "ochre", 11, 410, 0.2, 0, obstacle=False)
carrier(bot_psi.w([(-6, 71)])[0], "ochre", 10.5, 412, 0.26, 40, obstacle=False)
carrier(bot_psi.w([(34, 80)])[0], "umber", 19, 411, 0.14, 20, obstacle=False)
for (u, v), dg in [((70, 104), 200), ((30, 122), 150)]:
    nucleotide(bot_psi.w([(u, v)])[0], dg, "viridian", 2)
# ADP in, ATP out, at each head
for fr, sign, pts in [(top_atp, 1, [((-68, 126), 20, 3), ((-86, 84), -30, 2), ((-62, 170), 60, 3)]),
                      (bot_atp, -1, [((-66, 128), 20, 3), ((-86, 90), -30, 2), ((-50, 172), 70, 3)])]:
    for (u, v), dg, n in pts:
        nucleotide(fr.w([(sign * u, v)])[0], dg, "ochre", n)

# oxygen leaving photosystem II
for (u, v), dg in [((-2, -68), 30), ((42, -82), -40), ((98, -64), 70)]:
    q = top_psii.w([(u, v)])[0]
    OBSTACLES.append(blob(q[0], q[1], 14 * K, 14 * K, 0, 0, 2, 0).astype(F))
    oxygen(q, dg)
oxygen(bot_atp.w([(72, 40)])[0], 15)

n_protons = protons(transit)

photon(bot_psi.w([(-86, 27)])[0], -57, 170, seed=0.0)
photon(bot_psi.w([(89, 27)])[0], -108, 150, seed=2.0)
photon(top_psii.w([(-243, 112)])[0], 30, 120, lam=19, seed=1.0)

cv.save_card(OUT, relief=0.3, tooth=0.014)
print(f"{cv.count} strokes, {n_protons} protons, {cv.W}x{cv.H}, {time.time() - t0:.1f}s -> {OUT}")
