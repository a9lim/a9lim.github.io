"""Isochron — the asymptote.

A camp on a kopje before sunrise, and the plain it looks across. Along the
horizon time runs from left to right: the card's left edge is the first
hominins, and the spire stands where the dial runs out. The night is still
over the camp. The day comes up beyond the spire.

Nothing along that horizon is placed by hand. It is one seeded run of
Isochron's people (isochron-run.json, which isochron-run.mjs writes from
`tools/people-run.mjs earthlike`) laid on the follow dial's axis, where a
doubling of whatever grows fastest takes the same width: 1.56 million years
of foragers in the first tenth, ten thousand years of farming in the next
third, 289 years of industry in the three tenths after that, and the last
five years in the last quarter.

What each mark reads:

- The spire is the minds, people's and machines' together, drawn linear: a
  unit of height is everyone alive when the dial runs out (12.2 billion). At
  that scale all of history is a line one unit high, which is why the horizon
  is flat. The curve leaves it in the last fifteenth of the card and is out of
  the picture just past the dial. The spire's left flank is the run's own
  curve, step for step, and its right edge is the vertical at the first step
  above the frame.
- A red light is people: a forager's fire, a village, a city. There are as
  many along a stretch of the horizon as the 0.45 power of the people alive
  then, alone among foragers and gathered into towns as the land is farmed
  and industry comes. The red line along the spire's foot is the same people,
  one unit high. The camp's fire is the first of them, and the lights on the
  Moon's dark side are the last: 2.4 million people live off-world when the
  dial runs out, and seven of the Moon's fourteen sites are lit.
- The fields are as thick as the farmed share of the land, furrowed either
  way, and the wild acacias thin as they spread.
- Chimneys come with fossil carbon's power, as many along a stretch as its
  orders of magnitude above a gigawatt. The brown haze above them is coal's
  sulfate, as deep as its forcing.
- A verdigris light is a machine's. On the plain a cluster of them is a
  datacenter, in proportion to compute's share of the power (a third of the
  clusters at the dial). Up the spire they are everything above the red line.

The rest is the view: the camp, the kopje, the river the towns keep to, the
acacias, the smoke on one wind, and the light. The spire is tall enough that
its top already has the Sun while the ground is in the Earth's shadow, so its
lights are on only below that line. The sky's upper left is left quiet, where
the card's type is set.

    python3 isochron.py [scale=2] [out=../art/isochron.png]

Painted by Claude, 2026-11-16.
"""
import json
import os
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import numpy as np

from brush import F, Canvas, col, mix, rect, arc, spline, FLAT, ROUND, FILBERT, DRY, SOFT, LINE, LINER

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, "..", "art", "isochron.png")
t0 = time.time()
cv = Canvas(W, H, SCALE, ground=(0.05, 0.07, 0.16), seed=1559)
rng = cv.rng


def clip01(v):
    return np.clip(v, 0, 1)


def smooth(a, b, x):
    t = clip01((np.asarray(x, float) - a) / (b - a))
    return t * t * (3 - 2 * t)


# ----------------------------------------------------------------- the run ---
RUN = json.load(open(os.path.join(HERE, "isochron-run.json")))
AX = np.array(RUN["axis"], float)
COL = {name: i for i, name in enumerate(RUN["columns"])}
FLANK = np.array(RUN["flank"], float)
UNIT = RUN["mindsPerUnit"]                    # minds to a unit of height: everyone alive at the dial
F_FARM, F_IND, F_NOW = (RUN["events"][k]["f"] for k in ("farming", "industry", "present"))


def run(name, f):
    """A column of the run at the fraction f of the way to the dial."""
    return np.interp(f, AX[:, 0], AX[:, COL[name]])


HOR = 338.0                                   # the horizon
X0, XD = 0.0, 1088.0                          # the first hominins, and the dial running out


def fx(f):
    return X0 + (XD - X0) * np.asarray(f, float)


def xf(x):
    return (np.asarray(x, float) - X0) / (XD - X0)


X_EDGE = float(fx(FLANK[-1, 0]))              # the spire's right edge: the first step above the picture
SUN = np.array([1150.0, HOR + 3.0])
MOON = np.array([930.0, 112.0])
FIRE = np.array([319.0, 488.0])
BAND = 86.0                                   # the depth of plain, in units below the horizon, that carries the run

RED = col(0.93, 0.19, 0.16)
RED_GLOW = col(0.86, 0.15, 0.12)
VERD = col(0.42, 0.84, 0.78)
VERD_GLOW = col(0.20, 0.62, 0.58)
EMBER = col(1.0, 0.36, 0.17)                  # what the camp's fire throws on rock and skin


# ------------------------------------------------------------------- light ---
def sky(x, y):
    t = clip01(y / HOR)
    c = mix(col(0.030, 0.040, 0.115), col(0.070, 0.110, 0.250), t ** 0.9)
    c = mix(c, col(0.125, 0.185, 0.350), clip01((t - 0.5) / 0.5) ** 1.6)
    d = np.hypot((x - SUN[0]) / 2.0, (y - SUN[1]) * 1.2)
    c = mix(c, col(0.270, 0.390, 0.540), 0.85 * np.exp(-(d / 520.0) ** 2))
    c = mix(c, col(0.560, 0.640, 0.650), 0.78 * np.exp(-(d / 330.0) ** 2))
    c = mix(c, col(0.990, 0.800, 0.585), 0.90 * np.exp(-(d / 185.0) ** 2))
    c = mix(c, col(1.000, 0.900, 0.700), 0.85 * np.exp(-(d / 78.0) ** 2))
    return c


def dawn(x):
    """How much of the morning a place along the horizon has."""
    return float(np.exp(-((x - SUN[0]) / 430.0) ** 2))


def ground(x, y):
    u = clip01((y - HOR) / (H - HOR))
    g = dawn(x)
    far = mix(col(0.090, 0.125, 0.235), col(0.400, 0.345, 0.385), 0.9 * g)
    far = mix(far, col(0.760, 0.560, 0.430), 0.55 * np.exp(-((x - SUN[0]) / 150.0) ** 2))
    near = mix(col(0.026, 0.034, 0.070), col(0.075, 0.062, 0.090), g)
    c = mix(far, near, u ** 0.42)
    z = 1.0 / (y - HOR + 7.0)
    patch = np.sin(x * 0.0125 + 41.0 * z) * np.sin(0.006 * x - 330.0 * z + 1.3) + 0.5 * np.sin(0.031 * x + 620.0 * z)
    return c * (1 + 0.085 * patch)


def water(x, y):
    """The river shows the sky above it, a little darker: the horizon's light far off, the zenith at our feet."""
    c = sky(x, max(8.0, HOR - 1.05 * (y - HOR) - 5))
    return mix(c, col(0.040, 0.055, 0.125), 0.22 + 0.42 * clip01((y - HOR) / (H - HOR)) ** 0.8)


def firelight(x, y, reach=95.0):
    d2 = (x - FIRE[0]) ** 2 + ((y - FIRE[1]) * 1.25) ** 2
    return 1.0 / (1 + d2 / reach ** 2) ** 1.35


# --------------------------------------------------------------------- sky ---
def in_type(x, y):
    """The quiet part of the sky, where the card's type is set."""
    return 40 < x < 560 and 36 < y < 268


def paint_sky():
    whole = np.array([(-40, -30), (W + 40, -30), (W + 40, HOR + 8), (-40, HOR + 8)], F)
    cv.fill(whole, sky, FILBERT, width=44, angle=-3, length=(220, 480), overlap=0.52, streak=0.016, chroma=0.006,
            jitter=0.008, frisket=False, dry=0)
    cv.fill(whole, sky, FILBERT, width=32, angle=3, length=(180, 420), overlap=0.42, curve=7, streak=0.014,
            chroma=0.006, jitter=0.008, frisket=False, opacity=0.6, pickup=0.25, shuffle=True)
    # stars, going out toward the morning
    n = 0
    while n < 300:
        x, y = rng.uniform(0, W), rng.uniform(0, HOR - 14)
        d = np.hypot((x - SUN[0]) / 2.0, (y - SUN[1]) * 1.2)
        vis = clip01((d - 250) / 380) * clip01(1.12 - 0.55 * y / HOR)
        if in_type(x, y):
            vis *= 0.16
        if rng.random() > vis:
            continue
        n += 1
        mag = rng.random() ** 3.2
        if in_type(x, y):
            mag *= 0.35
        c = mix(sky(x, y), mix(col(0.74, 0.82, 1.0), col(1.0, 0.93, 0.82), rng.random()), (0.40 + 0.60 * mag) * (0.35 + 0.65 * vis))
        cv.dab((x, y), 0.7 + 1.2 * mag, c, soft=0.5, thick=0.25)
        if mag > 0.55:
            cv.glow((x, y), 4.5 + 5 * mag, c, 0.22)


def paint_moon():
    """An old Moon ahead of the Sun: a thin lit limb, earthshine on the rest, and the city on its dark side."""
    r = 15.5
    to_sun = (SUN - MOON) / np.hypot(*(SUN - MOON))
    disc = arc(MOON[0], MOON[1], r)
    cv.glow(MOON, 30, col(0.30, 0.40, 0.56), 0.16)
    cv.fill(disc, mix(sky(*MOON), col(0.300, 0.360, 0.480), 0.62), FILBERT, width=5, angle=30, length=(10, 30),
            streak=0.03, dry=0, thick=0.1)
    for cx, cy, rr in ((-4.5, -3.5, 4.2), (2.5, 3.5, 3.0), (-2.0, 6.0, 2.4), (5.0, -6.5, 2.2)):   # maria
        cv.dab(MOON + (cx, cy), rr, mix(sky(*MOON), col(0.205, 0.250, 0.365), 0.75), soft=0.6, thick=0, opacity=0.7)
    # the lit limb: the disc less a disc shifted away from the Sun
    lit = cv.poly_mask(disc) * (1 - cv.poly_mask(arc(MOON[0] - to_sun[0] * 4.6, MOON[1] - to_sun[1] * 4.6, r * 1.03), feather=0.35))
    with cv.frisket(lit):
        cv.fill(arc(MOON[0], MOON[1], r + 1), col(1.0, 0.955, 0.86), FILBERT, width=4, angle=-40, length=(10, 30),
                streak=0.02, dry=0, frisket=False, thick=0.3)
    cv.glow(MOON + to_sun * r * 0.8, 9, col(1.0, 0.92, 0.78), 0.22)
    # the city: as many of its fourteen sites lit as the people off-world have grown, from a thousand to ten billion
    grown = clip01((np.log10(max(run("space", 1.0), 1.0)) - 3) / 7)
    sites = [(-6.5, 1.5), (-3.0, -1.5), (-8.0, -4.5), (-1.0, 2.5), (-5.0, 5.5), (-9.5, 0.5), (0.5, -5.0),
             (-3.5, -7.5), (2.0, 0.0), (-7.0, 8.0), (-11.0, -3.0), (-0.5, 7.5), (3.5, -8.5), (-4.5, -11.0)]
    for cx, cy in sites[:int(round(grown * len(sites)))]:
        p = MOON + (cx, cy) + rng.normal(0, 0.25, 2)
        cv.glow(p, 1.7, RED_GLOW, 0.34, falloff=1.6)
        cv.dab(p, 0.50, RED, soft=0.4, thick=0.2)


def paint_clouds():
    """Bars of cloud low in the east, lit from underneath."""
    for _ in range(9):
        x0, y0 = rng.uniform(470, 1230), rng.uniform(HOR - 128, HOR - 26)
        if y0 < 276:
            x0 = max(x0, 640.0)                                    # clear of the type
        size = 0.55 + (y0 - (HOR - 128)) / 160
        for j in range(rng.integers(2, 5)):
            x = x0 + abs(rng.normal(0, 70))
            y = y0 + j * rng.uniform(2.2, 5.0)
            ln = rng.uniform(120, 380) * size
            w = rng.uniform(3.5, 10) * (1.25 - 0.5 * (y0 - (HOR - 128)) / 102)
            near = np.exp(-((x + ln / 2 - SUN[0]) / 400.0) ** 2)
            body = mix(sky(x + ln / 2, y), col(0.185, 0.165, 0.290), 0.55)
            path = spline([(x, y + rng.normal(0, 1.2)), (x + ln * 0.3, y - rng.uniform(0, 3.5)),
                           (x + ln * 0.7, y - rng.uniform(0, 2.5)), (x + ln, y + rng.normal(0, 1.2))], 6)
            cv.stroke(path, w, body, FILBERT, taper=(0.35, 0.45), tip=0.05, dry=0.45, grain=1.1, streak=0.03, opacity=0.9)
            cv.stroke(path + np.array([0, w * 0.36], F), max(1.3, w * 0.36), mix(body, col(1.0, 0.66, 0.50), 0.2 + 0.75 * near),
                      ROUND, taper=(0.35, 0.45), tip=0.05, opacity=0.4 + 0.5 * near)


def paint_sun_glow():
    cv.glow(SUN, 150, col(1.0, 0.80, 0.56), 0.20)
    cv.glow(SUN, 62, col(1.0, 0.88, 0.66), 0.36)


def paint_sun():
    """Its upper limb, through the haze."""
    above = np.array([(SUN[0] - 60, HOR - 60), (SUN[0] + 60, HOR - 60), (SUN[0] + 60, HOR - 0.3), (SUN[0] - 60, HOR - 0.3)], F)
    with cv.frisket(above):
        cv.fill(arc(SUN[0], SUN[1], 21, n=72), col(1.0, 0.968, 0.850), FLAT, width=5, angle=0, length=(50, 90), overlap=0.5,
                streak=0.006, chroma=0.002, dry=0, gap=0, jitter=0.004, thick=0.1, taper=(0, 0), tip=1.0)
        cv.fill(arc(SUN[0], SUN[1] + 4, 14, n=60), col(1.0, 0.995, 0.950), FLAT, width=4, angle=0, length=(40, 70), overlap=0.5,
                streak=0.004, chroma=0.001, dry=0, gap=0, jitter=0.003, thick=0.05, opacity=0.7, taper=(0, 0), tip=1.0)
    cv.glow(SUN + (0, -8), 30, col(1.0, 0.94, 0.78), 0.50)
    cv.stroke([(SUN[0] - 130, HOR - 1.0), (SUN[0] + 80, HOR - 1.0)], 2.2, col(1.0, 0.93, 0.76), SOFT, opacity=0.6,
              taper=(0.45, 0.3), tip=0.05, soft=0.8)


# ------------------------------------------------------------------- spire ---
def spire_outline():
    """The run's curve, from where it leaves the ground to where it leaves the picture, and the vertical there."""
    x = fx(FLANK[:, 0])
    y = HOR - FLANK[:, 1] / UNIT
    top = int(np.argmax(y < -14)) + 1 if (y < -14).any() else len(y)      # as far as one step above the frame
    flank = np.stack([x[:top], y[:top]], -1)
    return np.vstack([[(x[0] - 6.0, HOR + 1.0)], flank, [(X_EDGE, y[top - 1]), (X_EDGE, HOR + 1.0)]]).astype(F), flank


def paint_spire():
    poly, flank = spire_outline()

    def lit(hgt):
        """How far up the Sun has already reached it: the ground is still in the Earth's shadow."""
        return smooth(96, 205, hgt)

    def body(x, y):
        hgt = HOR - y
        c = mix(col(0.066, 0.078, 0.146), col(0.110, 0.140, 0.250), smooth(40, 200, hgt))
        c = mix(c, sky(x, HOR - 4) * 0.62, 0.50 * np.exp(-hgt / 46.0))               # its foot stands in the morning's air
        sun = mix(col(0.800, 0.520, 0.400), col(1.000, 0.885, 0.700), smooth(120, 330, hgt))
        return mix(c, sun, 0.88 * lit(hgt))

    cv.fill(poly, body, FLAT, width=5, angle=90, length=(60, 180), overlap=0.45, streak=0.022, chroma=0.006, dry=0,
            gap=0, jitter=0.012, thick=0.2, bleed=0.4)
    # the Sun finds the edge the curve never crosses
    edge = np.array([(X_EDGE + 0.2, HOR - 1.0), (X_EDGE + 0.2, -6.0)], F)
    cv.lit_line(edge, 1.25, lambda x, y: mix(col(1.0, 0.84, 0.62), col(1.0, 0.95, 0.82), smooth(40, 330, HOR - y)), LINE,
                chunk=26, opacity=0.9)
    up = np.arange(HOR - 100, -8, -6.0)
    shade = np.stack([np.interp(up, flank[::-1, 1], flank[::-1, 0]) + 0.35, up], -1)
    cv.lit_line(shade, 0.9, lambda x, y: col(0.150, 0.140, 0.220), LINE, chunk=26, opacity=0.55)            # the side away from it
    # machines' lights up it, thinning with height
    xs, ys = flank[:, 0], flank[:, 1]
    n = 0
    while n < 300:
        hgt = (HOR - 3.0) * rng.random() ** 2.6 + 2.6
        y = HOR - hgt
        xl = float(np.interp(-y, -ys, xs))                    # the flank at this height
        if xl > X_EDGE - 0.8:
            continue
        x = rng.uniform(xl + 0.5, X_EDGE - 0.5)
        if rng.random() > (X_EDGE - xl) / 34.0 + 0.25:           # fewer where it is thin
            continue
        n += 1
        if rng.random() < lit(hgt) * 0.92:                       # lights are for the part still in the night
            continue
        b = rng.uniform(0.55, 1.0) * (1 - 0.35 * hgt / HOR)
        cv.glow((x, y), 2.0, VERD_GLOW, 0.34 * b, falloff=1.6)
        cv.dab((x, y), 0.46 + 0.25 * rng.random(), VERD * b, soft=0.5, thick=0.15)
    # and the people, one unit high along its foot
    for x in np.arange(poly[0][0] - 4, X_EDGE + 0.5, 1.55):
        p = (x + rng.normal(0, 0.3), HOR - 0.7 + rng.normal(0, 0.15))
        cv.glow(p, 2.2, RED_GLOW, 0.36, falloff=1.6)
        cv.dab(p, 0.55, RED, soft=0.45, thick=0.15)


def paint_near_cloud():
    """A bar of cloud nearer than the spire, which is a long way off and very tall."""
    for x, y, ln, w in ((948, HOR - 58, 262, 5.2),):
        body = mix(sky(x + ln / 2, y), col(0.215, 0.185, 0.300), 0.50)
        path = spline([(x, y + 0.8), (x + ln * 0.3, y - 2.2), (x + ln * 0.7, y - 1.4), (x + ln, y + 0.6)], 6)
        cv.stroke(path, w, body, FILBERT, taper=(0.35, 0.45), tip=0.05, dry=0.4, grain=1.0, streak=0.03, opacity=0.92)
        cv.stroke(path + np.array([0, w * 0.36], F), max(1.3, w * 0.36), mix(body, col(1.0, 0.70, 0.52), 0.85), ROUND,
                  taper=(0.35, 0.45), tip=0.05, opacity=0.85)


# ------------------------------------------------------------------ ground ---
def paint_ground():
    edges = [HOR, 342, 348, 357, 369, 386, 410, 444, 492, 556, H + 30]
    for y0, y1 in zip(edges[:-1], edges[1:]):
        w = float(np.clip((y1 - y0) * 0.55, 2.4, 34))
        band = np.array([(-40, y0), (W + 40, y0), (W + 40, y1 + 0.8), (-40, y1 + 0.8)], F)
        cv.fill(band, ground, FLAT, width=w, angle=rng.normal(0, 0.3), length=(w * 8, w * 22), overlap=0.45,
                streak=0.028, dry=0.05, gap=0.0, jitter=0.035)
    low = np.array([(-40, HOR + 34), (W + 40, HOR + 34), (W + 40, H + 30), (-40, H + 30)], F)
    cv.fill(low, ground, FILBERT, width=17, angle=2.5, length=(70, 240), overlap=0.3, curve=5, streak=0.02, dry=0.25,
            grain=0.9, jitter=0.03, opacity=0.5, pickup=0.25, shuffle=True, frisket=False)
    # the grain of the grass, nearer the eye
    for _ in range(230):
        y = HOR + 26 + (H - HOR - 20) * rng.random() ** 1.6
        x = rng.uniform(-20, W + 20)
        s = (y - HOR) / (H - HOR)
        ln = rng.uniform(26, 190) * (0.25 + s)
        c = ground(x, y) * rng.choice([0.78, 0.88, 1.12, 1.22])
        cv.stroke([(x, y), (x + ln, y + rng.normal(0, 1.4 * s))], 1.0 + 6.0 * s * rng.random(), c, DRY, opacity=0.5,
                  taper=(0.2, 0.5), tip=0.15)


RIVER = np.array([(1078, 339.6, 0.45), (1036, 342.2, 0.70), (990, 345.6, 0.95), (940, 344.8, 1.15), (888, 348.6, 1.4),
                  (836, 352.6, 1.7), (782, 352.4, 2.0), (730, 357.0, 2.4), (684, 362.8, 3.0), (650, 370.0, 3.8),
                  (641, 380.0, 4.8), (668, 391.0, 6.2), (724, 402.0, 8.0), (770, 418.0, 10.5), (762, 440.0, 14.0),
                  (704, 462.0, 18.0), (652, 492.0, 22.0), (678, 526.0, 28.0), (756, 560.0, 37.0), (828, 604.0, 50.0),
                  (850, 664.0, 66.0)], float)


def river_banks():
    c = spline(RIVER[:, :2], 4)
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*(c[1:] - c[:-1]).T))])
    k = np.concatenate([[0.0], np.cumsum(np.hypot(*(RIVER[1:, :2] - RIVER[:-1, :2]).T))])
    hw = np.interp(d, k * d[-1] / k[-1], RIVER[:, 2]) * 0.74
    hw = hw * (1 + 0.16 * np.sin(d * 0.045 + 1.0) + 0.10 * np.sin(d * 0.11 + 4.0))
    t = np.gradient(c, axis=0)
    nrm = np.stack([-t[:, 1], t[:, 0]], -1)
    nrm /= np.maximum(np.hypot(nrm[:, 0], nrm[:, 1]), 1e-6)[:, None]
    # seen this low, a reach that runs across the picture is foreshortened and one that runs toward the eye is not
    squash = np.stack([np.ones(len(c)), np.full(len(c), 0.42)], -1)
    return c, (c + nrm * hw[:, None] * squash).astype(F), (c - nrm * hw[:, None] * squash).astype(F), hw


def river_mask():
    c, left, right, hw = river_banks()
    return cv.poly_mask(np.vstack([left, right[::-1]]))


def paint_river(mask):
    c, left, right, hw = river_banks()
    with cv.frisket(mask):
        for y in np.arange(HOR + 1, H + 12, 2.0):
            s = (y - HOR) / (H - HOR)
            w = 1.4 + 7.0 * s
            xs = c[np.abs(c[:, 1] - y) < 8 + 30 * s, 0]
            if not len(xs):
                continue
            x0, x1 = xs.min() - 80 * s - 14, xs.max() + 80 * s + 14
            x = x0
            while x < x1:
                ln = rng.uniform(26, 100) * (0.4 + 1.6 * s)
                cv.stroke([(x, y + rng.normal(0, 0.3)), (x + ln, y + rng.normal(0, 0.3))], w, water(x + ln / 2, y), FLAT,
                          streak=0.02, dry=0, gap=0, jitter=0.014, taper=(0.02, 0.02), tip=0.9, thick=0.1)
                x += ln * 0.8
        # the current: slack water darker under the near bank, a few bright riffles
        for _ in range(150):
            y = HOR + 40 + (H - HOR - 30) * rng.random() ** 1.2
            s = (y - HOR) / (H - HOR)
            xs = c[np.abs(c[:, 1] - y) < 10, 0]
            if not len(xs):
                continue
            x = rng.uniform(xs.min() - 60 * s, xs.max() + 60 * s)
            ln = rng.uniform(10, 46) * (0.4 + 1.2 * s)
            bright = rng.random() < 0.45
            cc = water(x, y) * (1.32 if bright else 0.66)
            cv.stroke([(x, y), (x + ln, y + rng.normal(0, 0.4))], 0.8 + 1.8 * s * rng.random(), cc, DRY, opacity=0.5,
                      taper=(0.3, 0.4), tip=0.1)
    # the far reach is a thread of the morning
    far = c[c[:, 1] < HOR + 34]
    cv.lit_line(far, 1.5, lambda x, y: mix(water(x, y), sky(x + 60, HOR - 5), 0.6) * 1.06, LINE, chunk=18, opacity=0.92)
    # the banks: a dark lip toward the eye
    for bank in (left, right):
        m = bank[:, 1] > HOR + 40
        if m.sum() > 2:
            cv.lit_line(bank[m], 1.5, lambda x, y: ground(x, y) * 0.5, LINER, chunk=40, opacity=0.6)
            for p in bank[m][:: 3]:                                        # reeds
                if rng.random() < 0.55:
                    continue
                s = (p[1] - HOR) / (H - HOR)
                for _ in range(rng.integers(2, 6)):
                    q = p + (rng.normal(0, 5 * s + 1), rng.normal(0, 1.5 * s))
                    hgt = rng.uniform(4, 15) * (0.25 + s)
                    cv.stroke([q, q + (rng.normal(0, hgt * 0.3), -hgt)], max(0.7, hgt * 0.10), ground(q[0], q[1]) * rng.choice([0.4, 0.55, 1.3]),
                              ROUND, taper=(0.0, 0.8), tip=0.1)


def paint_mist():
    """The night's air lying in the low ground, between the settled plain and the eye."""
    with cv.layer(col(0.330, 0.390, 0.530), mode="normal", opacity=0.13, blur=5.0):
        for _ in range(26):
            y = rng.uniform(420, 500)
            x = rng.uniform(380, W + 60)
            ln = rng.uniform(160, 520)
            xs = np.linspace(x - ln / 2, x + ln / 2, 5)
            cv.stroke(spline(np.stack([xs, y + rng.normal(0, 1.6, 5)], -1), 10), rng.uniform(4, 12), 0, SOFT, opacity=1.0,
                      taper=(0.3, 0.3), tip=0.1, soft=0.8, gap=0, streak=0)


# ---------------------------------------------------------------- the band ---
def band_y(u):
    """A depth in the band: more of it lies far off."""
    return HOR + 1.6 + (BAND - 1.6) * u ** 1.75


def depth(y):
    return clip01((y - HOR) / BAND)


def wet(mask, x, y):
    i, j = int(y * cv.s), int(x * cv.s)
    return 0 <= i < cv.H and 0 <= j < cv.W and mask[i, j] > 0.3


def paint_wild(mask):
    """Acacias on the far plain: all of it at first, what the fields leave after."""
    n = 0
    while n < 150:
        f0 = rng.uniform(-0.02, 1.08)
        y0 = band_y(rng.random()) + 2
        for _ in range(int(1 + rng.pareto(1.6) * 2.5) if rng.random() < 0.7 else 1):
            x = float(fx(f0)) + rng.normal(0, 9 + 30 * depth(y0))
            y = y0 + rng.normal(0, 0.6 + 2.2 * depth(y0))
            farmed = run("farm", clip01(float(xf(x))))
            if y < HOR + 2 or rng.random() < farmed * 1.12 or wet(mask, x, y):
                continue
            s = depth(y)
            k = rng.uniform(0.6, 1.5)
            w, hgt = (2.0 + 9.0 * s) * k, (0.8 + 2.3 * s) * k
            c = mix(ground(x, y), col(0.020, 0.030, 0.050), 0.62)
            cv.stroke([(x - w / 2, y - hgt * 0.9), (x + w / 2, y - hgt * 0.9 + rng.normal(0, 0.2))], hgt, c, FILBERT,
                      taper=(0.25, 0.25), tip=0.3, dry=0.1, streak=0.02)
            if s > 0.25:
                cv.line((x, y), (x + rng.normal(0, 0.5), y - hgt * 0.9), 0.5 + 0.7 * s, c)
        n += 1


FIELD = (col(0.250, 0.330, 0.190), col(0.330, 0.360, 0.200), col(0.420, 0.370, 0.220), col(0.160, 0.215, 0.165),
         col(0.215, 0.175, 0.150), col(0.300, 0.290, 0.170))


def paint_fields(mask):
    """Parcels, as much of the land as the run farms at each moment; furrowed, the pattern before the hue."""
    n = 0
    tries = 0
    while n < 1500 and tries < 60000:
        tries += 1
        f = rng.uniform(F_FARM, 1.06)
        farmed = run("farm", min(f, 1.0))
        if rng.random() > farmed / 0.87:
            continue
        y = HOR + 2.6 + (BAND * 1.35) * rng.random() ** 1.5
        x = float(fx(f))
        if wet(mask, x, y) or x > X_EDGE + 70:
            continue
        s = (y - HOR) / BAND
        if rng.random() < smooth(0.40, 1.30, s):                      # the settled land thins toward the eye
            continue
        n += 1
        w = (16 + 50 * rng.random()) * (0.16 + min(s, 1.2))
        d = max(1.1, (2.4 + 6.0 * rng.random()) * min(s, 1.2))
        lean = np.clip((600 - x) / 520, -1, 1) * d * 1.3
        quad = np.array([(x - w / 2 + lean / 2, y - d / 2), (x + w / 2 + lean / 2, y - d / 2),
                         (x + w / 2 - lean / 2, y + d / 2), (x - w / 2 - lean / 2, y + d / 2)], F)
        g = dawn(x)
        base = FIELD[rng.integers(len(FIELD))]
        tone = mix(base, col(0.20, 0.24, 0.30) * (base.sum() / 0.74), 0.55 * (1 - g))
        c = mix(ground(x, y), tone * (0.50 + 0.80 * g) + col(0.10, 0.045, 0.02) * g, 0.62 * (1 - 0.78 * smooth(0.45, 1.3, s)))
        cv.fill(quad, c, FLAT, width=max(1.0, d * 0.6), angle=0, length=(w, w * 2), overlap=0.3, streak=0.03, dry=0.05,
                gap=0, jitter=0.03, thick=0.15, bleed=0.2)
        if d > 2.6 and rng.random() < 0.5:                            # furrows across the eye
            k = int(2 + d / 1.6)
            for j in range(1, k):
                t = j / k
                a, b = quad[0] + (quad[3] - quad[0]) * t, quad[1] + (quad[2] - quad[1]) * t
                cv.stroke([a, b], 0.45, c * 0.66, LINE, opacity=0.6)
        elif d > 2.0:                                                 # or away from it
            k = int(3 + w / 5.0)
            for j in range(1, k):
                t = j / k
                a, b = quad[0] + (quad[1] - quad[0]) * t, quad[3] + (quad[2] - quad[3]) * t
                cv.stroke([a, b], 0.45, c * 0.68, LINE, opacity=0.5)


def chimney_share(f):
    """One more chimney for each order of magnitude of fossil power a stretch burns, from a gigawatt."""
    return max(0.0, np.log10(max(run("Ef", min(f, 1.0)), 1.0)) - 9.0) / 4.6


def paint_industry(mask):
    stacks = []
    tries = 0
    while len(stacks) < 64 and tries < 20000:
        tries += 1
        f = rng.uniform(F_IND, 1.03)
        if rng.random() > chimney_share(f):
            continue
        hgt = rng.uniform(3.2, 7.5)
        y = band_y(rng.random() ** 1.3) + hgt + 1.5
        x = float(fx(f))
        if wet(mask, x, y) or abs(x - X_EDGE) < 3:
            continue
        stacks.append((x, y, hgt * (0.55 + 0.9 * depth(y))))
    stacks.sort(key=lambda t: t[1])
    for x, y, hgt in stacks:
        k = 0.5 + depth(y)
        c = mix(ground(x, y), col(0.026, 0.028, 0.048), 0.80)
        side = rng.choice([-1, 1])
        shed = rect(x + side * 3.2 * k, y - 0.8 * k, 6.5 * k * rng.uniform(0.8, 1.4), 1.9 * k)
        cv.fill(shed, c, FLAT, width=max(1.0, 1.4 * k), angle=0, length=(6, 20), streak=0.02, dry=0, gap=0, jitter=0.01, thick=0.2)
        cv.stroke([(x, y), (x, y - hgt)], 0.75 + 0.55 * depth(y), c, LINE, taper=(0.0, 0.0))
    return stacks


def paint_smoke(stacks):
    """Each chimney's plume, bent by one wind, and coal's sulfate lying over the stretch that burns it."""
    for x, y, hgt in stacks:
        top = np.array([x, y - hgt])
        rise, drift = rng.uniform(2.5, 6) + 0.05 * (y - HOR), rng.uniform(50, 150)
        path = spline([top, top + (drift * 0.05, -rise * 0.62), top + (drift * 0.22, -rise * 0.96),
                       top + (drift * 0.60, -rise * 1.08 + rng.normal(0, 0.8)), top + (drift, -rise * 1.12 + rng.normal(0, 1.2))], 3)
        c = mix(col(0.330, 0.350, 0.450), col(0.800, 0.600, 0.520), dawn(x + 120))          # the morning is on the nearer ones
        with cv.layer(c, mode="normal", opacity=0.30, blur=0.8):
            cv.stroke(path, 1.3 + 2.0 * rng.random(), 0, SOFT, opacity=0.95, taper=(0.03, 0.75), tip=0.35, soft=0.55, gap=0, streak=0)
    # the haze: one film, as deep as the sulfate's forcing
    worst = np.abs(AX[:, COL["aer"]]).max()
    with cv.layer(col(0.455, 0.345, 0.365), mode="normal", opacity=0.46, blur=4.0):
        for _ in range(70):
            f = rng.uniform(F_IND, 1.05)
            deep = abs(run("aer", min(f, 1.0))) / worst
            if rng.random() > deep:
                continue
            x = float(fx(f))
            y = HOR - 2 - rng.uniform(0, 22) * deep
            ln = rng.uniform(60, 170)
            cv.stroke([(x - ln / 2, y + rng.normal(0, 1)), (x, y + rng.normal(0, 1.2)), (x + ln / 2, y + rng.normal(0, 1))],
                      rng.uniform(4, 11) * (0.4 + deep), 0, SOFT, opacity=0.55 * deep, taper=(0.3, 0.3), tip=0.1, soft=0.8,
                      gap=0, streak=0)


def light(p, r, core, glowc, b=1.0, air=2.2):
    cv.glow(p, air * (0.6 + r), glowc, 0.20 * b, falloff=1.7)
    cv.dab(p, r, mix(core, col(1.0, 0.86, 0.80), 0.30 * max(0.0, b - 0.7) / 0.3), soft=0.4, thick=0.12, opacity=0.55 + 0.45 * b)


def paint_lights(mask):
    """People: as many lights along the horizon as the 0.45 power of the people alive then."""
    c_riv = spline(RIVER[:, :2], 4)

    def river_y(x):
        m = c_riv[:, 1] < HOR + 34
        return float(np.interp(x, c_riv[m, 0][::-1], c_riv[m, 1][::-1])) if c_riv[m, 0].min() < x < c_riv[m, 0].max() else None

    f = np.linspace(0, 1.0, 600)
    lam = 0.110 * (run("people", f) / 1e6) ** 0.45                      # lights to a unit of the horizon
    cum = np.concatenate([[0.0], np.cumsum(0.5 * (lam[1:] + lam[:-1]) * np.diff(fx(f)))])
    total = int(cum[-1])
    placed = 0
    while placed < total:
        fc = float(np.interp(rng.uniform(0, cum[-1]), cum, f))
        together = run("farm", fc) * 0.5 + run("ind", fc) * 0.5             # foragers camp alone; farmers and cities gather
        size = 1 if rng.random() > together * 1.4 + 0.02 else int(min(90, 2 + rng.pareto(1.15) * (2 + 10 * run("ind", fc))))
        x0 = float(fx(fc))
        ry = river_y(x0)
        y0 = band_y(rng.random())
        if ry is not None and rng.random() < 0.45 * together:             # towns keep to the river
            y0 = ry + rng.normal(0, 2.2) + rng.choice([-1, 1]) * 1.6
        s0 = depth(y0)
        if rng.random() < smooth(0.45, 1.0, s0) * 0.97:
            continue
        sx = (2.6 + 2.3 * np.sqrt(size)) * (0.40 + 1.2 * s0)
        compute = run("Ecomp", fc) / max(run("Ef", fc), 1.0) if fc > F_NOW else 0.0
        machines = rng.random() < 6.0 * compute                         # a datacenter, lit in the machines' colour
        for _ in range(size):
            x, y = x0 + rng.normal(0, sx), y0 + rng.normal(0, 0.11 * sx + 0.2)
            placed += 1
            if y < HOR + 1.2 or wet(mask, x, y) or x > X_EDGE + 40:
                continue
            s = depth(y)
            b = rng.uniform(0.35, 1.0) ** 1.4 * (0.75 + 0.25 * run("ind", fc))
            r = (0.30 + 0.26 * rng.random()) * (0.8 + 0.8 * s)
            if machines:
                light((x, y), r * 1.1, VERD, VERD_GLOW, b)
            else:
                light((x, y), r, RED, RED_GLOW, b)


# ------------------------------------------------------------ the foreground ---
def acacia(base, hgt, lean=0.0, seed=0, rim=0.0):
    """An umbrella thorn: a leaning trunk, a few forks, and a flat crown in layers."""
    r = np.random.default_rng(seed)
    bx, by = base
    dark = mix(ground(bx, by), col(0.012, 0.016, 0.030), 0.86)
    top = np.array([bx + lean * hgt, by - hgt * 0.62])
    trunk = spline([(bx, by), (bx + lean * hgt * 0.25, by - hgt * 0.28), top], 3)
    cv.stroke(trunk, hgt * 0.062, dark, ROUND, taper=(0.0, 0.3), tip=0.6, streak=0.02)
    crown_w = hgt * 1.25
    for k in range(5):
        t = (k + 0.5) / 5 - 0.5
        tip = top + (t * crown_w * 0.86, -hgt * (0.30 - 0.20 * abs(t)) + r.normal(0, hgt * 0.02))
        mid = top + (t * crown_w * 0.42, -hgt * 0.10)
        cv.stroke(spline([top + (0, hgt * 0.06), mid, tip], 3), hgt * 0.030, dark, ROUND, taper=(0, 0.6), tip=0.3)
    cy = top[1] - hgt * 0.30
    for layer in range(3):
        y = cy + (layer - 1) * hgt * 0.055
        wd = crown_w * (0.62 + 0.38 * (1 - abs(layer - 1) * 0.5)) * (1.0 if layer else 0.8)
        n = int(7 + wd / 9)
        for i in range(n):
            x = top[0] + (i / (n - 1) - 0.5) * wd + r.normal(0, hgt * 0.02)
            ww = hgt * r.uniform(0.16, 0.30)
            cv.stroke([(x - ww / 2, y + r.normal(0, hgt * 0.012)), (x + ww / 2, y + r.normal(0, hgt * 0.012))],
                      hgt * r.uniform(0.055, 0.085), dark * r.uniform(0.9, 1.15), FILBERT, taper=(0.3, 0.3), tip=0.25, dry=0.3,
                      grain=0.9, streak=0.03)
    if rim > 0:                                                       # first light along the top of the crown, from the east
        for i in range(int(crown_w / 7)):
            x = top[0] + r.uniform(-0.12, 0.5) * crown_w
            cv.stroke([(x - 3, cy - hgt * 0.085 + r.normal(0, 0.6)), (x + 3, cy - hgt * 0.085 + r.normal(0, 0.6))], 0.9,
                      col(0.62, 0.47, 0.44), LINER, opacity=0.5 * rim)


BOULDERS = [  # back to front: outline, the centre and radii its roundness is shaded about
    ([(30, 670), (18, 548), (44, 464), (92, 412), (150, 393), (210, 403), (252, 442), (272, 506), (282, 670)], (150, 505, 132, 116)),
    ([(-40, 670), (-40, 502), (2, 472), (48, 484), (78, 534), (90, 670)], (20, 570, 70, 102)),
    ([(158, 670), (164, 570), (186, 518), (226, 496), (300, 491), (392, 491), (448, 499), (480, 530), (494, 594), (506, 670)],
     (332, 594, 172, 106)),
    ([(46, 670), (56, 608), (100, 580), (170, 584), (208, 612), (218, 670)], (132, 640, 86, 62)),
    ([(420, 670), (430, 614), (464, 586), (520, 580), (560, 600), (582, 670)], (500, 644, 82, 66)),
]
LEDGE = 491.0


def paint_kopje():
    def rock(cx, cy, rx, ry):
        def c(x, y):
            nx, ny = (x - cx) / rx, (y - cy) / ry
            rr = min(1.0, nx * nx + ny * ny)
            nz = np.sqrt(1 - rr)
            to_fire = np.array([FIRE[0] - x, (FIRE[1] - 10) - y, 46.0])
            to_fire /= np.linalg.norm(to_fire)
            lam = max(0.0, nx * to_fire[0] + ny * to_fire[1] + nz * to_fire[2])
            east = max(0.0, 0.55 * nx - 0.62 * ny + 0.25 * nz)             # the morning, from the upper right
            base = mix(col(0.040, 0.044, 0.078), col(0.082, 0.090, 0.140), 0.5 + 0.5 * (-ny))
            return base + col(0.150, 0.160, 0.235) * east ** 1.6 + EMBER * 0.78 * lam * firelight(x, y, 120)
        return c

    for outline, (cx, cy, rx, ry) in BOULDERS:
        poly = spline(np.array(outline, F), 6, closed=True)
        with cv.layer(col(0.30, 0.28, 0.36), "multiply", 0.55, blur=3.0):       # where it stands against the one behind
            top = poly[poly[:, 1] < cy + 10]
            cv.stroke(top[np.argsort(top[:, 0])] + (0, -3), 9, 0, SOFT, opacity=1, soft=0.8)
        shade = rock(cx, cy, rx, ry)
        ang = rng.uniform(-24, -10)
        cv.fill(poly, shade, FILBERT, width=20, angle=ang, length=(50, 130), overlap=0.5, curve=7, streak=0.018,
                chroma=0.006, dry=0.03, grain=0.3, gap=0, jitter=0.015, thick=0.4)
        cv.fill(poly, shade, FILBERT, width=13, angle=ang + 55, length=(30, 80), overlap=0.35, curve=5, streak=0.016,
                chroma=0.006, dry=0.05, grain=0.4, gap=0, jitter=0.012, opacity=0.5, pickup=0.3, shuffle=True, thick=0.3)
        # the light along its shoulder
        top = poly[poly[:, 1] < cy - ry * 0.25]
        top = top[np.argsort(top[:, 0])]
        cv.lit_line(top, 1.2, lambda x, y: col(0.130, 0.150, 0.235) + EMBER * 0.55 * firelight(x, y, 90) + col(0.20, 0.16, 0.16) * dawn(x + 520),
                    LINER, chunk=24, opacity=0.6)
    # the grain of granite, and its joints
    for _ in range(420):
        x, y = rng.uniform(-10, 580), rng.uniform(396, 632)
        i, j = int(y * cv.s), int(x * cv.s)
        here = cv.img[min(i, cv.H - 1), min(max(j, 0), cv.W - 1)]
        cv.dab((x, y), rng.uniform(0.5, 1.3), here * rng.choice([0.72, 0.84, 1.18, 1.32]), soft=0.5, thick=0.2, opacity=0.5)
    for x, y, ln, a in ((70, 470, 60, 0.9), (196, 430, 48, 1.25), (118, 540, 40, 0.3), (300, 560, 70, 0.12), (410, 540, 44, 0.8),
                        (238, 600, 50, -0.2), (24, 590, 40, 1.1), (470, 620, 36, 0.4)):
        path = [(x, y), (x + 0.5 * ln * np.cos(a) + rng.normal(0, 2), y + 0.5 * ln * np.sin(a) + rng.normal(0, 2)),
                (x + ln * np.cos(a), y + ln * np.sin(a))]
        cv.stroke(spline(path, 3), 1.3, col(0.020, 0.022, 0.042), LINER, opacity=0.55)
    # the ledge: what the fire lights around itself
    cv.glow(FIRE + (0, 8), 70, EMBER, 0.20)
    with cv.frisket(spline(np.array(BOULDERS[2][0], F), 6, closed=True)):
        for _ in range(60):
            x = FIRE[0] + rng.normal(0, 60)
            y = LEDGE + 3 + abs(rng.normal(0, 7))
            k = firelight(x, y, 78)
            cv.stroke([(x - 10, y), (x + 10, y + rng.normal(0, 0.6))], rng.uniform(1.5, 4.0), EMBER * (0.25 + 0.75 * k), DRY,
                      opacity=0.45 * k + 0.04, taper=(0.3, 0.3), tip=0.3)


def grass(x0, x1, y0, y1, n, tall=(5, 15)):
    """Clumps of it, each a fan of blades."""
    for _ in range(n):
        x, y = rng.uniform(x0, x1), y0 + (y1 - y0) * rng.random() ** 0.7
        k = 0.45 + (y - HOR) / (H - HOR)
        tone = rng.choice([0.5, 0.62, 1.35, 1.6])
        for _ in range(rng.integers(3, 9)):
            hgt = rng.uniform(*tall) * k
            bx = x + rng.normal(0, 3.0 * k)
            bend = rng.normal(0, 0.45)
            c = ground(bx, y) * tone * rng.uniform(0.85, 1.15) + EMBER * 0.30 * firelight(bx, y, 90)
            cv.stroke(spline([(bx, y), (bx + bend * hgt * 0.35, y - hgt * 0.6), (bx + bend * hgt, y - hgt)], 2), max(0.7, hgt * 0.085), c,
                      ROUND, taper=(0.0, 0.8), tip=0.1)


# ----------------------------------------------------------------- the camp ---
SKIN = col(0.026, 0.028, 0.052)                # a body against the light: almost the night's colour


class Body:
    """A figure drawn from its feet: u across (toward where it faces), v up, in units of its height."""

    def __init__(self, base, hgt, facing=1):
        self.b, self.h, self.f = np.asarray(base, float), float(hgt), facing

    def at(self, u, v):
        return self.b + (self.f * u * self.h, -v * self.h)

    def pts(self, uv):
        return np.array([self.at(u, v) for u, v in uv], F)

    def path(self, uv):
        return spline(self.pts(uv), 2) if len(uv) > 2 else self.pts(uv)

    def limb(self, uv, w, c=SKIN, brush=LINE, **kw):
        cv.stroke(self.path(uv), w * self.h, c, brush, **kw)

    def shape(self, uv, c=SKIN, w=0.07, angle=90):
        cv.fill(spline(self.pts(uv), 2, closed=True), c, FILBERT, width=max(1.4, w * self.h), angle=angle,
                length=(self.h * 0.3, self.h), overlap=0.45, streak=0.02, dry=0, gap=0, jitter=0.01, thick=0.3, bleed=0.3)

    def head(self, u, v, r=0.066, hair=()):
        cv.dab(self.at(u, v), r * self.h, SKIN, soft=0.22, thick=0.3)
        for hu, hv, hr in hair:
            cv.dab(self.at(hu, hv), hr * self.h, SKIN, soft=0.3, thick=0.3)

    def rim(self, uv, c, w=0.018, op=0.8):
        cv.stroke(self.path(uv), max(0.8, w * self.h), c, LINER, opacity=op)


WARM = col(1.0, 0.43, 0.21)
COOL = col(0.52, 0.52, 0.64)


def shadow(pts, w, op=0.5):
    with cv.layer(col(0.20, 0.17, 0.24), "multiply", op, blur=1.8):
        cv.stroke(np.array(pts, F), w, 0, SOFT, opacity=1, taper=(0.02, 0.6), tip=0.3, soft=0.4)


def lookout():
    """Standing on the highest rock with a spear, looking the way the river runs."""
    m = Body((153, 394.5), 80, 1)
    m.limb([(0.285, 0.0), (0.245, 1.14)], 0.017)                                    # the spear
    m.limb([(0.245, 1.14), (0.242, 1.25)], 0.036, brush=ROUND, taper=(0.15, 0.85), tip=0.05)
    m.limb([(-0.070, 0.0), (-0.060, 0.25), (-0.035, 0.50)], 0.085)
    m.limb([(0.075, 0.0), (0.066, 0.25), (0.035, 0.50)], 0.085)
    m.limb([(-0.090, 0.012), (0.020, 0.012)], 0.036)
    m.limb([(0.060, 0.012), (0.170, 0.012)], 0.036)
    m.shape([(-0.130, 0.800), (-0.020, 0.850), (0.120, 0.805), (0.160, 0.620), (0.150, 0.400), (0.020, 0.360), (-0.180, 0.390),
             (-0.178, 0.620)])                                                       # a hide over the shoulders
    m.limb([(0.110, 0.775), (0.200, 0.675), (0.255, 0.735)], 0.050)                  # the arm on the spear
    m.limb([(-0.120, 0.775), (-0.165, 0.610), (-0.150, 0.470)], 0.050)
    m.limb([(0.0, 0.83), (0.014, 0.90)], 0.056)
    m.head(0.022, 0.936, r=0.064, hair=((-0.016, 0.948, 0.058), (-0.034, 0.905, 0.044)))
    # what light there is: the fire from below on his right, the east on his face and shoulder
    m.rim([(0.166, 0.60), (0.156, 0.42)], WARM, op=0.42)
    m.rim([(0.108, 0.03), (0.100, 0.25), (0.072, 0.47)], WARM, op=0.36)
    m.rim([(0.272, 0.05), (0.262, 0.55)], WARM, 0.010, op=0.36)
    m.rim([(0.078, 0.976), (0.090, 0.934), (0.076, 0.890)], COOL, 0.014, op=0.75)
    m.rim([(0.062, 0.832), (0.130, 0.800), (0.164, 0.700)], COOL, 0.014, op=0.55)
    m.rim([(0.254, 0.78), (0.248, 1.12)], COOL, 0.009, op=0.55)


def seated(base, facing, hgt=78, stick=False):
    """Sitting at the fire, knees up, leaning toward it."""
    m = Body(base, hgt, facing)
    m.limb([(-0.04, 0.085), (0.02, 0.26), (0.10, 0.44)], 0.215, brush=FILBERT, taper=(0.1, 0.15), tip=0.7, streak=0.02)   # the back
    m.shape([(-0.135, 0.06), (-0.125, 0.30), (-0.03, 0.495), (0.085, 0.515), (0.055, 0.36), (-0.02, 0.09)])              # a hide
    m.limb([(0.0, 0.085), (0.150, 0.215), (0.262, 0.305)], 0.090)                    # thigh
    m.limb([(0.262, 0.305), (0.290, 0.150), (0.305, 0.025)], 0.072)                  # shin
    m.limb([(0.285, 0.014), (0.375, 0.014)], 0.034)                                  # foot
    m.limb([(0.110, 0.450), (0.215, 0.330), (0.300, 0.345)], 0.048)                  # the arm, to the knee
    m.limb([(0.110, 0.47), (0.140, 0.53)], 0.056)
    m.head(0.165, 0.578, hair=((0.128, 0.592, 0.062), (0.105, 0.545, 0.050)))
    if stick:
        m.limb([(0.300, 0.345), (0.585, 0.130)], 0.012)
    # the fire is in front of them
    m.rim([(0.226, 0.606), (0.238, 0.566), (0.214, 0.524)], WARM, 0.017, op=0.95)       # face
    m.rim([(0.150, 0.470), (0.235, 0.366), (0.318, 0.372)], WARM, 0.015, op=0.85)       # arm
    m.rim([(0.300, 0.300), (0.324, 0.150), (0.338, 0.040)], WARM, 0.017, op=0.90)       # shin
    m.rim([(0.130, 0.245), (0.270, 0.345)], WARM, 0.013, op=0.50)                       # thigh
    m.rim([(0.150, 0.50), (0.120, 0.40), (0.075, 0.26)], WARM, 0.013, op=0.40)          # chest
    return m


def child():
    """The one who has seen it."""
    m = Body((436, 497), 49, 1)
    m.limb([(-0.07, 0.0), (-0.055, 0.24), (-0.03, 0.47)], 0.092)
    m.limb([(0.09, 0.0), (0.075, 0.24), (0.04, 0.47)], 0.092)
    m.limb([(-0.09, 0.014), (0.02, 0.014)], 0.042)
    m.limb([(0.07, 0.014), (0.19, 0.014)], 0.042)
    m.limb([(0.0, 0.44), (0.012, 0.60), (0.03, 0.775)], 0.205, brush=FILBERT, taper=(0.1, 0.2), tip=0.7)
    m.limb([(0.09, 0.745), (0.275, 0.815), (0.460, 0.905)], 0.048)                     # the arm, out toward the spire
    m.limb([(-0.085, 0.745), (-0.135, 0.585), (-0.115, 0.450)], 0.050)
    m.limb([(0.025, 0.79), (0.04, 0.85)], 0.066)
    m.head(0.050, 0.898, r=0.082, hair=((0.010, 0.915, 0.076), (-0.012, 0.860, 0.058)))
    # the fire behind, the morning ahead
    m.rim([(-0.112, 0.76), (-0.150, 0.60), (-0.130, 0.46)], WARM, 0.020, op=0.85)
    m.rim([(-0.103, 0.03), (-0.090, 0.24), (-0.073, 0.46)], WARM, 0.020, op=0.80)
    m.rim([(-0.052, 0.960), (-0.080, 0.890), (-0.066, 0.800)], WARM, 0.018, op=0.75)
    m.rim([(0.122, 0.938), (0.140, 0.895), (0.118, 0.852)], COOL, 0.018, op=0.80)
    m.rim([(0.12, 0.772), (0.285, 0.840), (0.460, 0.926)], COOL, 0.012, op=0.60)


def flame(base, hgt, hw, sway, c, wiggle=0.0):
    """A tongue of fire: a teardrop leaning the way it sways."""
    b = np.asarray(base, float)
    pts = [b + (-hw * 0.72, 0.5), b + (-hw * 1.04, -hgt * 0.20), b + (-hw * 0.62 + sway * 0.45 + wiggle, -hgt * 0.58),
           b + (sway, -hgt), b + (hw * 0.50 + sway * 0.55 - wiggle, -hgt * 0.60), b + (hw * 1.02, -hgt * 0.22), b + (hw * 0.72, 0.5)]
    poly = spline(np.array(pts, F), 1.5, closed=True)
    cv.fill(poly, c, ROUND, width=max(1.6, hw * 0.55), angle=90, length=(hgt * 0.5, hgt * 1.2), overlap=0.5, streak=0.03, dry=0,
            gap=0, jitter=0.02, thick=0.35, bleed=0.2, taper=(0.1, 0.5), tip=0.2)


def fire():
    f = FIRE
    for a, b in (((-20, 3.5), (13, -1.5)), ((-12, -1.5), (20, 3.5)), ((-6, 5), (5, -4))):       # the wood
        cv.stroke([f + a, f + b], 3.8, col(0.045, 0.028, 0.032), ROUND, taper=(0.1, 0.1), tip=0.6)
    cv.glow(f + (0, -12), 190, EMBER, 0.085)
    cv.glow(f + (0, -12), 84, EMBER, 0.24)
    cv.glow(f + (0, -12), 32, col(1.0, 0.40, 0.20), 0.60)
    deep, red, hot, pale = col(0.60, 0.065, 0.065), col(0.93, 0.185, 0.115), col(1.0, 0.46, 0.25), col(1.0, 0.80, 0.60)
    flame(f + (-12, 1), 22, 5.0, -5, deep)
    flame(f + (12, 1), 25, 5.5, 6, deep)
    flame(f + (0, 1), 46, 12.5, 3, deep, 1.5)
    flame(f + (-9, 1), 19, 4.2, -3, red)
    flame(f + (10, 1), 21, 4.4, 4, red)
    flame(f + (0, 1), 37, 9.5, 2, red, 1.0)
    flame(f + (0.5, 1), 26, 6.2, 1, hot, 0.5)
    flame(f + (0.5, 0.5), 14, 3.6, 0, pale)
    flame(f + (5, -44), 9, 2.2, 3, red)                                              # a lick that has let go
    cv.glow(f + (0, -9), 12, col(1.0, 0.72, 0.52), 0.50)
    # smoke, taken by the same wind as the chimneys'
    path = spline([f + (3, -48), f + (10, -84), f + (40, -128), f + (104, -166), f + (196, -190), f + (300, -202)], 5)
    with cv.layer(col(0.36, 0.33, 0.40), mode="normal", opacity=0.20, blur=3.0):
        cv.stroke(path, 17, 0, SOFT, opacity=1, taper=(0.04, 0.6), tip=0.12, soft=0.8, gap=0, streak=0)
    with cv.layer(EMBER, mode="screen", opacity=0.12, blur=2.5):
        cv.stroke(path[: len(path) // 4], 10, 0, SOFT, opacity=1, taper=(0.05, 0.9), tip=0.1, soft=0.8)
    for _ in range(30):                                                              # sparks
        t = rng.random() ** 1.5
        i = int(t * (len(path) - 1) * 0.45)
        p = path[i] + rng.normal(0, 2.4 + 8 * t, 2)
        cv.glow(p, 2.2, EMBER, 0.5 * (1 - t))
        cv.dab(p, 0.55, col(1.0, 0.62, 0.38) * (1 - 0.5 * t), soft=0.5)


def paint_camp():
    shadow([(266, LEDGE + 4), (170, LEDGE + 12)], 15, 0.5)
    shadow([(372, LEDGE + 4), (476, LEDGE + 12)], 15, 0.5)
    shadow([(442, LEDGE + 8), (492, LEDGE + 16)], 8, 0.4)
    lookout()
    fire()
    seated((260, LEDGE + 0.5), 1)
    seated((378, LEDGE + 0.5), -1, stick=True)
    child()


def vignette():
    for p, r, k in (((0, H), 420, 0.40), ((W, H), 430, 0.40), ((W / 2, H + 240), 620, 0.30), ((0, 0), 380, 0.22)):
        cv.glow(p, r, col(0.48, 0.50, 0.70), k, mode="multiply", falloff=1.3)


paint_sky()
paint_moon()
paint_clouds()
paint_sun_glow()
paint_spire()
paint_near_cloud()
paint_ground()
river = river_mask()
paint_wild(river)
paint_fields(river)
paint_river(river)
chimneys = paint_industry(river)
paint_lights(river)
paint_smoke(chimneys)
paint_sun()
paint_mist()
for base, hgt, lean, seed, rim in (((566, 454), 34, -0.06, 3, 0.0), ((842, 446), 22, 0.05, 11, 0.5), ((906, 462), 30, -0.04, 12, 0.7),
                                   ((604, 432), 17, 0.04, 13, 0.0), ((1128, 478), 42, -0.05, 8, 0.8), ((968, 548), 80, 0.07, 5, 1.0)):
    acacia(base, hgt, lean=lean, seed=seed, rim=rim)
grass(560, W, 500, 634, 54)
paint_kopje()
paint_camp()
grass(0, 600, 604, 636, 34, tall=(9, 22))
vignette()

cv.save_card(OUT)
print(f"{cv.count} strokes, {cv.W}x{cv.H}, {time.time() - t0:.1f}s -> {OUT}")
