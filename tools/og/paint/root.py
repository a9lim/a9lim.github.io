"""Grove.

The site's seal is 林, a grove: two trees side by side. This is the grove, in
ink on the site's own paper, after the manner of Hasegawa Tōhaku's pine
screens: a near pair of pines in full ink, others going grey behind them, and
the furthest only a stain in the fog. The fog is the bare paper. The type sits
in it, and the seal signs the sheet as a seal signs an ink painting; it is the
only red.

    python root.py [scale] [out.png]

Painted by Claude, 2026-11-11.
"""
import os
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brush import (F, Canvas, replace, rgb, mix, spline, DRY, ROUND, SOFT, LINER)  # noqa: E402

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "art", "root.png")
t0 = time.time()

PAPER = rgb("#fcfcfb")
INK = rgb("#191817")
cv = Canvas(W, H, SCALE, ground=PAPER, seed=11)
rng = cv.rng


def ink(fade):
    """Ink let down with water: 0 is full ink, 1 is the paper."""
    return mix(INK, PAPER, fade)


# A splayed, half-dry brush: each touch leaves a few parallel needles and the paper between them.
NEEDLE = replace(DRY, density=0.85, streak=0.12, gap=0.46, grain=1.5, load=0.92, dry=0.62,
                 taper=(0.03, 0.55), tip=0.6, soft=0.1, thick=0.3)
BOUGH = replace(LINER, taper=(0.05, 0.6), tip=0.2, jitter=0.02, wobble=0.5)
TRUNK = replace(DRY, density=0.9, streak=0.1, gap=0.22, grain=1.3, load=0.9, dry=0.35,
                taper=(0.02, 0.3), tip=0.55, soft=0.2, thick=0.3, wobble=0.6)
WASH = replace(SOFT, opacity=1.0, soft=0.9, density=0.2, streak=0.0, chroma=0.0, jitter=0.0)


def trunk_path(x, base, top, lean, bend, r):
    """A trunk from the ground up: it leans, and it sways once on the way."""
    h = base - top
    ys = np.linspace(base, top, 9)
    t = (base - ys) / h
    xs = x + lean * h * t + bend * h * np.sin(np.pi * t) * 0.5 + r.normal(0, 0.004 * h, 9) * t
    return spline(np.stack([xs, ys], -1), step=8.0), t


def at(path, frac):
    i = min(len(path) - 1, max(0, int(round(frac * (len(path) - 1)))))
    return path[i]


def pad(c, rx, ry, n, fade, r, lean, size=1.0, width=15.0, mode="normal", wet=0.0):
    """One mass of needles: touches of the splayed brush, springing up and away from the bough."""
    if wet > 0:      # the wet heart of the mass, where the brush was still full
        cv.glow((c[0], c[1] - 0.5 * ry - 7 * size), 0.5 * rx, ink(min(0.95, fade + 0.3)), strength=wet,
                mode="multiply", falloff=1.8)
    for _ in range(n):
        u, v = r.uniform(-1, 1), r.uniform(-1, 1)
        if u * u + v * v > 1:
            continue
        p0 = np.array([c[0] + u * rx, c[1] + v * ry + ry * 0.3])
        ang = np.deg2rad(-90 + lean + 34 * u + r.normal(0, 13))
        ln = r.uniform(16, 32) * size
        p1 = p0 + ln * np.array([np.cos(ang), np.sin(ang)])
        f = np.clip(fade + abs(r.normal(0, 0.1)) + 0.22 * (v < -0.1) * r.random(), 0, 0.97)
        cv.stroke([p0, p1], width * size * r.uniform(0.5, 1.15), ink(f), NEEDLE, mode=mode)
    for _ in range(int(n * 0.22 * wet / 0.5)):      # and a few touches of full ink low in it
        u, v = r.uniform(-0.7, 0.7), r.uniform(0.0, 0.8)
        p0 = np.array([c[0] + u * rx, c[1] + v * ry + ry * 0.3])
        ang = np.deg2rad(-90 + lean + 30 * u + r.normal(0, 10))
        p1 = p0 + r.uniform(12, 22) * size * np.array([np.cos(ang), np.sin(ang)])
        cv.stroke([p0, p1], width * size * r.uniform(0.35, 0.7), ink(fade), NEEDLE, gap=0.25, dry=0.45)


def pine(x, base, top, lean=0.0, bend=0.0, fade=0.0, girth=13.0, seed=0, crown=0.5, spread=1.0,
         needles=1.0, root_fade=None):
    """A tall pine. `fade` is how far back in the fog it stands."""
    r = np.random.default_rng(seed)
    path, _ = trunk_path(x, base, top, lean, bend, r)
    h = base - top
    size = h / 560.0

    # The trunk, brushed from the leader down: the brush is full at the top and has run
    # dry by the root, where the fog is.
    rf = fade + 0.5 * (1 - fade) if root_fade is None else root_fade
    down = path[: int(len(path) * 0.97)][::-1]
    w = girth * size
    cv.stroke(down, w, ink(min(0.97, fade + 0.1)), TRUNK, color_end=ink(min(0.97, rf + 0.12)),
              taper=(0.9, 0.0), tip=0.3, dry=0.5)
    cv.stroke(down + [0.26 * w, 0], w * 0.4, ink(fade), TRUNK, color_end=ink(rf), taper=(0.9, 0.0), tip=0.3,
              gap=0.35, dry=0.7)

    # Boughs and their needles, from the lowest up to the leader.
    tiers = int(8 + 4 * r.random())
    side = 1 if r.random() < 0.5 else -1
    for i in range(tiers):
        u = i / (tiers - 1)
        frac = (1 - crown) + crown * (0.02 + 0.9 * u ** 0.85)
        p = at(path, frac)
        side = -side if r.random() < 0.78 else side
        reach = spread * size * (92 * (1 - u) ** 0.6 + 16) * r.uniform(0.55, 1.15)
        up = np.deg2rad(r.uniform(8, 38) + 18 * u)
        tip = p + reach * np.array([side * np.cos(up), -np.sin(up)])
        mid = (p + tip) / 2 + np.array([0, r.uniform(0.04, 0.14) * reach])
        b = spline([p, mid, tip], step=5.0)
        cv.stroke(b, max(1.0, 2.8 * size * (1 - 0.55 * u)), ink(min(0.97, fade + 0.08)), BOUGH)
        k = int(2 + 2.2 * (1 - u) + r.random())
        for j in range(k):
            sfrac = 0.3 + 0.7 * (j + r.random()) / k
            c = at(b, sfrac) + r.normal(0, 3 * size, 2)
            rx = (reach * r.uniform(0.16, 0.3) + 10 * size) * (0.75 + 0.5 * sfrac)
            pad(c, rx, rx * r.uniform(0.32, 0.55), int(needles * (7 + 0.3 * rx / size)), fade, r,
                lean=side * (14 + 22 * sfrac), size=size, wet=0.6 * (1 - fade) ** 0.5)
    # the leader
    pad(at(path, 0.97) + [0, 4 * size], 13 * size, 22 * size, int(needles * 14), fade, r, 0, size=size)
    return path


def ghost(x, base, top, lean, bend, fade, seed, girth=11.0, spread=1.0):
    """A pine far back: one even stain, no more."""
    r = np.random.default_rng(seed)
    path, _ = trunk_path(x, base, top, lean, bend, r)
    h = base - top
    size = h / 560.0
    with cv.layer(ink(fade), mode="multiply", opacity=1.0, blur=1.6):
        cv.stroke(path[: int(len(path) * 0.98)], girth * size, ink(0), TRUNK, gap=0.3)
        tiers = int(8 + 5 * r.random())
        side = 1
        for i in range(tiers):
            u = i / (tiers - 1)
            p = at(path, 0.5 + 0.47 * u ** 0.85)
            side = -side
            reach = spread * size * (88 * (1 - u) ** 0.6 + 16) * r.uniform(0.55, 1.15)
            c = p + np.array([side * reach * r.uniform(0.35, 0.8), -r.uniform(0.15, 0.5) * reach])
            cv.stroke(spline([p, (p + c) / 2 + [0, 3], c], step=6.0), 2.4 * size, ink(0), BOUGH)
            pad(c, reach * 0.36 + 6 * size, reach * 0.2 + 5 * size, 12, 0.0, r, side * 20, size=size)
        pad(at(path, 0.97), 12 * size, 20 * size, 9, 0.0, r, 0, size=size)


def fog(x0, x1, y, thick, strength, n=7, seed=0):
    """A veil of fog: the paper coming back up through the ink, in soft touches along a drift."""
    r = np.random.default_rng(seed)
    for _ in range(n):
        xa = r.uniform(x0, x1 - 120)
        xb = min(x1, xa + r.uniform(160, 420))
        yy = y + r.normal(0, thick * 0.3)
        rad = thick * r.uniform(0.55, 1.0)
        k = max(2, int((xb - xa) / (0.5 * rad)))
        for t in np.linspace(0, 1, k):
            cv.glow((xa + t * (xb - xa), yy + 8 * np.sin(3 * t + seed)), rad, PAPER,
                    strength=strength * 0.42 * np.sin(np.pi * (0.08 + 0.84 * t)), mode="normal", falloff=1.6)


def damp(x0, x1, y, thick, strength, n=5, seed=0):
    """Where the fog itself has a little tone: a breath of grey on the sheet."""
    r = np.random.default_rng(seed)
    for _ in range(n):
        xa = r.uniform(x0, x1 - 150)
        xb = min(x1, xa + r.uniform(240, 560))
        yy = y + r.normal(0, thick * 0.35)
        rad = thick * r.uniform(0.6, 1.1)
        k = max(2, int((xb - xa) / (0.5 * rad)))
        for t in np.linspace(0, 1, k):
            cv.glow((xa + t * (xb - xa), yy + 10 * np.sin(2.5 * t + seed)), rad, ink(0.72),
                    strength=strength * 0.3 * np.sin(np.pi * (0.08 + 0.84 * t)), mode="multiply", falloff=1.4)


# ------------------------------------------------------------------ the sheet
# The fog has a little body on the right, where the grove is; the left stays bare.
damp(600, 1260, 250, 150, 0.16, n=6, seed=1)
damp(720, 1260, 480, 130, 0.14, n=5, seed=2)

# Furthest: stains above the type, their feet lost before they reach it.
ghost(452, 340, 122, 0.03, 0.02, 0.90, seed=21, girth=9)
ghost(548, 366, 92, -0.05, -0.03, 0.86, seed=22, girth=10)
ghost(1172, 430, 128, -0.04, 0.02, 0.84, seed=24, girth=10)
ghost(770, 430, 96, 0.03, -0.02, 0.80, seed=25, girth=11)
fog(380, 700, 350, 90, 0.9, n=9, seed=3)
fog(660, 1230, 430, 70, 0.55, n=6, seed=4)

# The middle of the grove.
pine(668, 520, 138, lean=-0.06, bend=0.05, fade=0.60, girth=12, seed=31, needles=0.8)
pine(1118, 560, 62, lean=-0.03, bend=0.03, fade=0.42, girth=13, seed=33, needles=0.9)
fog(600, 1230, 528, 64, 0.62, n=8, seed=5)

# The near pair: 木 and 木.
pine(858, 680, 66, lean=-0.05, bend=0.05, fade=0.12, girth=19, seed=75, crown=0.5, spread=0.86, needles=1.3)
pine(1022, 700, 30, lean=0.045, bend=-0.035, fade=0.0, girth=22, seed=68, crown=0.5, spread=0.98, needles=1.45)
fog(700, 1230, 612, 50, 0.6, n=7, seed=6)

# Ink has no hue: put every tone back on the one line between the ink and the paper.
lum = cv.img.mean(-1, keepdims=True)
t = np.clip((lum - INK.mean()) / (PAPER.mean() - INK.mean()), 0, 1)
cv.img[:] = INK + (PAPER - INK) * t

cv.save_card(OUT, relief=0.35, tooth=0.012)
print(f"{cv.count} strokes, {cv.W}x{cv.H}, {time.time() - t0:.1f}s -> {OUT}")
