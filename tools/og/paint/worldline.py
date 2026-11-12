"""Worldline — The Past Hangs Beneath the Present.

Worldline's spacetime view as a nocturne. The present is a sheet seen at a
tilt, catching a faint light; time runs downward, so each body's world line
hangs beneath the sheet into the dark. Nothing is drawn above it.

Everything is placed by one oblique projection, screen = O + S·(x + a·y,
b·y + h), with space and time at one scale: h is time before the present, and
light moving along x keeps to 45°.

  disks on the sheet   bodies now: sienna positive, prussian negative,
                       graphite neutral, with the sim's marks (+, −, a spoke)
  a helix              a charge circling in a magnetic field
  a double helix       a bound pair
  a straight line      a free body
  beads                equal steps of each body's own proper time, so a fast
                       body's beads sit further apart (by γ)
  the fade downward    age
  a dimmer stretch     the line seen through the sheet, before it clears the
                       near edge
  ochre lines          photons the circling charges radiated, each from its
                       emission event to where it is now
  the red              the selected body: its disk, its world line, its past
                       light cone (four rings and the two generators that
                       graze the view, the back of each ring dashed), and on
                       the sheet the rings its last clock ticks have grown to

The rest is atmosphere: the glints on the sheet, the light it lets down under
its near edge, and the red light inside the cone.

    python3 worldline.py [scale] [out.png]

Painted by Claude, 2026-11-11.
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np

from brush import F, Canvas, replace, rgb, col, mix, rect, FLAT, FILBERT

W, H = 1200, 630
SCALE = float(sys.argv[1]) if len(sys.argv) > 1 else 2.0
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                                         "..", "art", "worldline.png")
t0 = time.time()
cv = Canvas(W, H, SCALE, ground=(0.04, 0.034, 0.075), seed=11)
rng = cv.rng


def clip01(v):
    return np.clip(v, 0, 1)


# ------------------------------------------------------------ projection ----
S = 58.0                    # px per unit of length, and of time
A, B = 0.55, -0.32          # the plane's depth axis on the screen
X0, Y0 = 340.0, 250.0       # the sheet's near-left corner
XD, YD = 16.5, 8.8          # the sheet, in world units (it runs off the right edge)
SEEN = 0.45                 # a line seen through the sheet
HF = 7.5                    # the age at which a line has faded out


def scr(x, y, h=0.0):
    x, y, h = np.broadcast_arrays(np.asarray(x, float), np.asarray(y, float), np.asarray(h, float))
    return np.stack([X0 + S * (x + A * y), Y0 + S * (B * y + h)], -1).astype(F)


def under_sheet(x, y, h):
    """Is the event (x, y, h) seen through the sheet?"""
    yp = y + h / B
    xp = x + A * (y - yp)
    return (h > 1e-6) & (yp >= 0) & (yp <= YD) & (xp >= 0) & (xp <= XD)


SHEET = scr([0, XD, XD, 0], [0, 0, YD, YD])

# ---------------------------------------------------------------- palette ---
SIENNA = rgb("#BC7950")
PRUSSIAN = rgb("#548EBE")
GRAPHITE = rgb("#949392")
OCHRE = rgb("#A8843C")
RED = rgb("#D63A46")        # the one red
RED_HI = rgb("#DC5960")
FILM = col(0.335, 0.315, 0.565)
EDGE = col(0.80, 0.80, 1.00)


LIGHT_X = 935.0            # where the sheet's light is strongest


def bg(x, y):
    t = clip01(y / H)
    c = mix(col(0.080, 0.060, 0.148), col(0.028, 0.022, 0.060), t ** 0.8)
    lx = np.exp(-((x - LIGHT_X) / 330.0) ** 2)
    ly = np.exp(-max(y - Y0, 0.0) / 190.0) * np.exp(-(max(Y0 - y, 0.0) / 140.0) ** 2)
    return c + lx * ly * col(0.060, 0.044, 0.118)


def lit(xs, ys):
    """How much of the faint light a point of the sheet catches."""
    yp = (ys - Y0) / (S * B)
    k = np.exp(-((xs - LIGHT_X) / 350.0) ** 2)
    return k * (0.16 + 0.84 * clip01(1 - yp / YD) ** 1.25)


def film(xs, ys):
    return mix(bg(xs, ys), FILM, 0.05 + 0.70 * lit(xs, ys))


# ----------------------------------------------------------------- ribbon ---
def ribbon(pts, width, alpha, color, caps=(True, True), streak=0.035, soft=0.34, thick=0.22, mode="normal"):
    """A liner stroke whose width and opacity follow the path.

    The engine's stroke carries one width and one opacity; a world line thins and
    fades with age along its length, so this lays the whole line in one pass.
    `width` and `alpha` are per point (or scalars). Butt ends (`caps` False) let
    two ribbons meet without doubling.
    """
    s = cv.s
    P = np.asarray(pts, F) * s
    n = len(P)
    if n < 2:
        return
    hw = np.broadcast_to(np.asarray(width, F), (n,)) * s * 0.5
    al = np.broadcast_to(np.asarray(alpha, F), (n,))
    if float(al.max()) <= 0.004:
        return
    seg = P[1:] - P[:-1]
    sl = np.hypot(seg[:, 0], seg[:, 1])
    cum = np.concatenate([[0.0], np.cumsum(sl)])
    pad = float(hw.max()) + 2.5
    x0 = max(0, int(P[:, 0].min() - pad))
    y0 = max(0, int(P[:, 1].min() - pad))
    x1 = min(cv.W, int(P[:, 0].max() + pad) + 2)
    y1 = min(cv.H, int(P[:, 1].max() + pad) + 2)
    if x1 <= x0 or y1 <= y0:
        return
    d2 = np.full((y1 - y0, x1 - x0), 1e12, F)
    tt = np.zeros_like(d2)
    sd = np.zeros_like(d2)
    for i in range(n - 1):
        l = float(sl[i])
        if l < 1e-6:
            continue
        ax, ay = P[i]
        bx, by = P[i + 1]
        sx0 = max(x0, int(min(ax, bx) - pad))
        sx1 = min(x1, int(max(ax, bx) + pad) + 2)
        sy0 = max(y0, int(min(ay, by) - pad))
        sy1 = min(y1, int(max(ay, by) + pad) + 2)
        if sx1 <= sx0 or sy1 <= sy0:
            continue
        dx, dy = float(seg[i, 0]), float(seg[i, 1])
        xs = (np.arange(sx0, sx1, dtype=F) + 0.5 - ax)[None, :]
        ys = (np.arange(sy0, sy1, dtype=F) + 0.5 - ay)[:, None]
        spu = (xs * dx + ys * dy) / (l * l)
        sp = np.clip(spu, 0, 1)
        ex = xs - sp * dx
        ey = ys - sp * dy
        dd = ex * ex + ey * ey
        if i == 0 and not caps[0]:
            dd = np.where(spu < 0, 1e12, dd)
        if i == n - 2 and not caps[1]:
            dd = np.where(spu > 1, 1e12, dd)
        sub = (slice(sy0 - y0, sy1 - y0), slice(sx0 - x0, sx1 - x0))
        m = dd < d2[sub]
        d2[sub] = np.where(m, dd, d2[sub])
        tt[sub] = np.where(m, cum[i] + sp * l, tt[sub])
        sd[sub] = np.where(m, (dx * ys - dy * xs) / l, sd[sub])
    d = np.sqrt(d2)
    hwp = np.maximum(np.interp(tt.ravel(), cum, hw).reshape(tt.shape), 0.3).astype(F)
    alp = np.interp(tt.ravel(), cum, al).reshape(tt.shape).astype(F)
    softpx = np.maximum(0.7, soft * hwp)
    a = np.clip((hwp - d) / softpx + 0.5, 0, 1) * alp
    if not a.any():
        return
    if cv.masks:
        a = a * cv.masks[-1][y0:y1, x0:x1]
    cv.count += 1
    c0 = np.asarray(color, F)
    nb = max(3, int(float(hw.max()) * 2 / s * 1.2))
    b_val = rng.normal(0, streak, nb).astype(F)
    u = np.clip(sd / hwp, -1, 1)
    fb = (u * 0.5 + 0.5) * (nb - 1)
    i0 = fb.astype(np.int32)
    fr = fb - i0
    i1 = np.minimum(i0 + 1, nb - 1)
    tint = (b_val[i0] * (1 - fr) + b_val[i1] * fr) * min(1.2, 0.25 + float(c0.mean()))
    cpx = c0[None, None, :] + tint[..., None]
    cv._blend(cv.img[y0:y1, x0:x1], cpx, a[..., None], mode)
    if thick > 0 and mode == "normal":
        hs = cv.hgt[y0:y1, x0:x1]
        hs[:] = hs * (1 - 0.85 * a) + a * thick * (0.6 + 0.6 * np.exp(-((1 - np.abs(u)) / 0.2) ** 2))


def dashes(pts, width, alpha, color, dash=7.0, gap=5.0, **kw):
    P = np.asarray(pts, F)
    al = np.broadcast_to(np.asarray(alpha, F), (len(P),))
    wd = np.broadcast_to(np.asarray(width, F), (len(P),))
    d = np.concatenate([[0.0], np.cumsum(np.hypot(*(P[1:] - P[:-1]).T))])
    s0 = 0.0
    while s0 < d[-1]:
        s1 = min(s0 + dash, d[-1])
        m = (d >= s0) & (d <= s1)
        if m.sum() >= 2:
            ribbon(P[m], wd[m], al[m], color, **kw)
        s0 = s1 + gap


# ------------------------------------------------------------ world lines ---
DTAU = 0.6                  # the beads' step of proper time
DH = 0.04                   # sampling step in lab time


def fade(h):
    return clip01(1 - h / HF) ** 1.15


class Line:
    """One body: where it was at each age h, how fast it goes, its ink."""

    def __init__(self, ink, v, pos, phase=None, w=3.4, sel=False, hmax=HF):
        self.ink, self.v, self.pos, self.phase, self.w, self.sel = ink, v, pos, phase, w, sel
        self.gamma = 1.0 / np.sqrt(1.0 - v * v)
        self.h = np.arange(0.0, hmax + DH, DH)
        self.xy = pos(self.h)
        self.depth = float(self.xy[0, 1])                  # how far back on the sheet it lies

    def now(self):
        return self.xy[0]

    def front(self, h=None):
        """+1 on the side of a helix turned toward the viewer, −1 behind; 0 for a straight line."""
        if self.phase is None:
            return np.zeros_like(self.h if h is None else np.asarray(h, float))
        return -np.sin(self.phase(self.h if h is None else np.asarray(h, float)))

    def air(self):
        return 1.0 - 0.42 * clip01(self.depth / YD)        # further back, fainter

    def alpha(self, h=None, xy=None):
        h = self.h if h is None else np.asarray(h, float)
        xy = self.xy if xy is None else xy
        a = fade(h) * self.air() * (1 + 0.22 * self.front(h))
        a = a * np.where(under_sheet(xy[:, 0], xy[:, 1], h), SEEN, 1.0)
        return clip01(a * (1.0 if self.sel else 0.9))

    def width(self, h=None):
        h = self.h if h is None else np.asarray(h, float)
        return self.w * (0.42 + 0.58 * fade(h)) * (1 + 0.42 * self.front(h)) * (0.72 + 0.28 * self.air())

    def arcs(self):
        """(is_front, index range) for each stretch between the turns of a helix."""
        f = self.front() >= 0
        cuts = np.flatnonzero(f[1:] != f[:-1]) + 1
        edges = np.concatenate([[0], cuts, [len(f)]])
        return [(bool(f[a]), a, min(b + 1, len(f))) for a, b in zip(edges[:-1], edges[1:]) if b - a >= 1]

    def paint(self, only=None):
        pts = scr(self.xy[:, 0], self.xy[:, 1], self.h)
        al, wd = self.alpha(), self.width()
        if only is None:
            ribbon(pts, wd, al, self.ink)
            return
        arcs = self.arcs()
        for k, (is_front, a, b) in enumerate(arcs):
            if is_front == only and b - a >= 2:
                ribbon(pts[a:b], wd[a:b], al[a:b], self.ink, caps=(k == 0, k == len(arcs) - 1))

    def beads(self):
        hb = np.arange(1, 40) * DTAU * self.gamma
        hb = hb[hb < HF]
        xy = self.pos(hb)
        al = self.alpha(hb, xy)
        fr = self.front(hb)
        tip = mix(self.ink, col(1.0, 0.93, 0.93) if self.sel else col(0.96, 0.96, 1.0), 0.5 if self.sel else 0.48)
        for (x, y), h, a, f in zip(xy, hb, al, fr):
            if a < 0.03:
                continue
            p = scr(x, y, h)
            r = (1.3 + 2.1 * fade(h)) * (1 + 0.25 * f) * (1.2 if self.sel else 1.0) * (0.75 + 0.25 * self.air())
            if a > 0.22:
                cv.glow(p, r * 3.8, self.ink, 0.36 * a)
            cv.dab(p, r, tip, soft=0.45, thick=0.5, opacity=float(clip01((0.25 if self.sel else 0.18) + 0.95 * a)))


def circling(c, r, v, phi0, sense=1.0, drift=(0.0, 0.0)):
    w = v / r
    c, drift = np.asarray(c, float), np.asarray(drift, float)

    def phase(h):
        return phi0 - sense * w * h

    def pos(h):
        h = np.asarray(h, float)
        p = phase(h)
        return c[None, :] - drift[None, :] * h[:, None] + r * np.stack([np.cos(p), np.sin(p)], -1)

    def heading(h):
        """Unit velocity at age h."""
        p = phase(h)
        return sense * np.array([-np.sin(p), np.cos(p)])

    return pos, phase, heading


def free(p0, vel):
    p0, vel = np.asarray(p0, float), np.asarray(vel, float)
    return lambda h: p0[None, :] - vel[None, :] * np.asarray(h, float)[:, None]


# the selected body: a charge circling in a magnetic field
sel_pos, sel_phase, sel_heading = circling((9.10, 1.62), 0.56, 0.80, np.deg2rad(205), sense=1.0)
SEL = Line(RED, 0.80, sel_pos, sel_phase, w=6.6, sel=True)

# a bound pair, drifting slowly
pair_c, pair_r, pair_v, pair_u = (12.38, 2.60), 0.37, 0.52, (-0.03, 0.0)
pa_pos, pa_phase, _ = circling(pair_c, pair_r, pair_v, np.deg2rad(20), drift=pair_u)
pb_pos, pb_phase, _ = circling(pair_c, pair_r, pair_v, np.deg2rad(200), drift=pair_u)
PAIR = [Line(SIENNA, pair_v, pa_pos, pa_phase, w=4.6), Line(PRUSSIAN, pair_v, pb_pos, pb_phase, w=4.6)]

# another circling charge, far back
far_pos, far_phase, far_heading = circling((3.74, 7.30), 0.44, 0.70, np.deg2rad(60), sense=-1.0)
FAR = Line(SIENNA, 0.70, far_pos, far_phase, w=4.2)

# free bodies
FREE = [
    Line(GRAPHITE, 0.42, free((1.55, 4.85), (-0.42, 0.0)), w=3.8),
    Line(PRUSSIAN, 0.0, free((8.30, 7.8), (0.0, 0.0)), w=3.6),
]

BODIES = [SEL] + PAIR + [FAR] + FREE

# ---------------------------------------------------------------- photons ---
# (emitter position at emission, age of emission, heading) → the photon's line
PHOTONS = []
for k in (1, 2, 3, 4):
    he = k * DTAU * SEL.gamma                     # radiated at the selected body's ticks
    PHOTONS.append((sel_pos(np.array([he]))[0], he, sel_heading(he)))
for he in (2.2, 3.4):
    PHOTONS.append((far_pos(np.array([he]))[0], he, far_heading(he)))
# only those still on the sheet are in the picture
PHOTONS = [(e, he, d) for e, he, d in PHOTONS
           if 0 <= e[0] + he * d[0] <= XD and 0 <= e[1] + he * d[1] <= YD
           and X0 + S * (e[0] + he * d[0] + A * (e[1] + he * d[1])) < W - 20]


# ============================================================ the picture ===
def paint_ground():
    whole = rect(W / 2, H / 2, W + 60, H + 60)
    cv.fill(whole, bg, FILBERT, width=46, angle=90, length=(170, 420), overlap=0.45, curve=7,
            streak=0.022, chroma=0.010, jitter=0.014, frisket=False)
    cv.fill(whole, bg, FILBERT, width=30, angle=86, length=(120, 330), overlap=0.3, curve=9,
            streak=0.020, chroma=0.010, jitter=0.012, frisket=False, opacity=0.55, pickup=0.2, shuffle=True)
    # the dark gathers at the corners
    with cv.layer(col(0.35, 0.33, 0.5), mode="multiply", opacity=0.5, blur=60):
        for p in [(-40, 700), (1260, 700), (-60, -40), (1260, -60)]:
            cv.dab(p, 170, col(0, 0, 0))


def paint_sheet():
    under = replace(FLAT, streak=0.03, dry=0.05, gap=0.0, grain=0.4)
    cv.fill(SHEET, film, under, width=13, angle=0, length=(150, 380), overlap=0.45, wander=0.8, bleed=0.2)
    with cv.frisket(SHEET):
        # the light it catches: short touches along x, larger and further apart toward the near edge
        glint = replace(FLAT, streak=0.04, dry=0.3, grain=0.7, gap=0.05, taper=(0.4, 0.45), tip=0.12, thick=0.2, soft=0.5)
        for _ in range(1900):
            x, y = rng.uniform(0, XD), YD * rng.uniform(0, 1) ** 1.5
            px, py = scr(x, y)
            k = float(lit(px, py))
            if rng.random() > 0.05 + 1.1 * k:
                continue
            near = 1 - y / YD
            ln = (14 + 52 * near) * rng.uniform(0.5, 1.4)
            c = mix(FILM, col(0.80, 0.80, 1.0), rng.uniform(0.15, 0.85) * (0.35 + 0.65 * k))
            cv.stroke([(px - ln / 2, py + rng.normal(0, 0.3)), (px + ln / 2, py + rng.normal(0, 0.3))],
                      (0.8 + 1.5 * near) * rng.uniform(0.7, 1.2), c, glint,
                      opacity=float(clip01((0.08 + 0.5 * k) * rng.uniform(0.5, 1.0))))
        # the lab's rulers, every two units
        ys = np.linspace(0, YD, 60)
        for x in np.arange(2, XD, 2.0):
            p = scr(np.full_like(ys, x), ys)
            ribbon(p, 1.0, 0.03 + 0.20 * lit(p[:, 0], p[:, 1]), col(0.62, 0.62, 0.90), thick=0)
        xs = np.linspace(0, XD, 120)
        for y in np.arange(2, YD, 2.0):
            p = scr(xs, np.full_like(xs, y))
            ribbon(p, 1.0, 0.03 + 0.20 * lit(p[:, 0], p[:, 1]), col(0.62, 0.62, 0.90), thick=0)
        # the rings the selected body's last ticks have grown to: each tick's light, now
        th = np.linspace(0, 2 * np.pi, 220)
        for k in range(1, 6):
            hk = k * DTAU * SEL.gamma
            cx, cy = sel_pos(np.array([hk]))[0]
            p = scr(cx + hk * np.cos(th), cy + hk * np.sin(th))
            ribbon(p, 1.6 - 0.12 * k, (0.80 - 0.13 * k) * (0.3 + 0.7 * lit(p[:, 0], p[:, 1])), RED, thick=0.1)


def paint_depth():
    """The light the sheet lets down: the recent past is still dimly lit, the old past is not."""
    shaft = replace(FILBERT, streak=0.02, chroma=0.004, jitter=0.02, soft=0.6, dry=0.72, grain=0.16, gap=0.0,
                    taper=(0.02, 0.55), tip=0.7, thick=0.0, mode="screen")
    for _ in range(150):
        x = rng.normal(LIGHT_X, 250)
        if not 350 < x < W + 30:
            continue
        k = np.exp(-((x - LIGHT_X) / 330.0) ** 2)
        ln = rng.uniform(70, 300) * (0.5 + 0.5 * k)
        cv.stroke([(x, Y0 + 1), (x + rng.normal(0, 1.5), Y0 + 1 + ln)], rng.uniform(12, 44),
                  col(0.31, 0.26, 0.55), shaft, opacity=float(rng.uniform(0.04, 0.095) * (0.4 + 0.6 * k)))


def cone_geometry():
    th = np.linspace(-np.pi, np.pi, 7200, endpoint=False)
    u = (np.cos(th) + A * np.sin(th)) / (1 + B * np.sin(th))
    return th[np.argmin(u)], th[np.argmax(u)]


CONE_REACH = 2.9
TH_L, TH_R = cone_geometry()


def cone_ring(h, th):
    ax, ay = SEL.now()
    return scr(ax + h * np.cos(th), ay + h * np.sin(th), np.full_like(th, h))


def front_arc(n=120):
    """From the right generator round the near side to the left one."""
    a, b = TH_R, TH_L
    if b > a:
        b -= 2 * np.pi
    return np.linspace(a, b, n)


def back_arc(n=120):
    a, b = TH_R, TH_L
    if b < a:
        b += 2 * np.pi
    return np.linspace(a, b, n)


def cone_alpha(th, h):
    """A ring's stretch that is seen through the sheet is dimmer, like a line's."""
    ax, ay = SEL.now()
    x, y = ax + h * np.cos(th), ay + h * np.sin(th)
    return np.where(under_sheet(x, y, h), SEEN, 1.0)


def paint_cone_back():
    apex = scr(*SEL.now())
    # the light inside it: touches laid from the apex down the cone, running dry
    ax, ay = SEL.now()
    poly = np.vstack([apex[None], cone_ring(CONE_REACH * 1.12, front_arc(60))])
    ray = replace(FILBERT, streak=0.025, chroma=0.004, jitter=0.02, soft=0.55, dry=0.74, grain=0.16, gap=0.0,
                  taper=(0.02, 0.5), tip=0.5, thick=0.0)
    gl = scr(ax + np.cos(TH_L), ay + np.sin(TH_L), 1.0) - apex
    gr = scr(ax + np.cos(TH_R), ay + np.sin(TH_R), 1.0) - apex
    a_l, a_r = np.arctan2(gl[1], gl[0]), np.arctan2(gr[1], gr[0])
    reach = CONE_REACH * S * 1.3
    with cv.frisket(poly, feather=2.5):
        for _ in range(260):
            ang = rng.uniform(a_r, a_l)                     # evenly across the cone as it is seen
            r0 = reach * 0.62 * np.sqrt(rng.uniform(0, 1))  # and evenly down it; each touch runs dry
            d = np.array([np.cos(ang), np.sin(ang)])
            ln = reach * rng.uniform(0.3, 0.62)
            k = 1 - r0 / reach
            cv.stroke([apex + r0 * d, apex + (r0 + ln) * d], rng.uniform(10, 26) * (0.6 + 1.2 * r0 / reach),
                      col(0.56, 0.085, 0.135), ray, opacity=float(rng.uniform(0.03, 0.07) * k ** 1.6))
    # the far half of each ring, dashed
    for k in range(1, 5):
        hh = CONE_REACH * k / 4
        th = back_arc(90)
        al = (0.62 - 0.085 * k) * cone_alpha(th, hh)
        dashes(cone_ring(hh, th), 1.2, al, RED, dash=6.5, gap=5.5, thick=0.05)


def paint_cone_front():
    ax, ay = SEL.now()
    hs = np.linspace(0.0, CONE_REACH * 1.22, 90)
    for th0 in (TH_L, TH_R):
        p = scr(ax + hs * np.cos(th0), ay + hs * np.sin(th0), hs)
        al = 0.85 * clip01(1 - hs / (CONE_REACH * 1.22)) ** 0.8
        al = al * np.where(under_sheet(ax + hs * np.cos(th0), ay + hs * np.sin(th0), hs), SEEN, 1.0)
        ribbon(p, 1.7 - 0.7 * hs / hs[-1], al, RED, thick=0.15)
    for k in range(1, 5):
        hh = CONE_REACH * k / 4
        th = front_arc(120)
        mid = np.sin(np.linspace(0, np.pi, len(th))) ** 0.5       # the ring is nearest, and clearest, in front
        al = (1.0 - 0.13 * k) * cone_alpha(th, hh) * (0.5 + 0.5 * mid)
        ribbon(cone_ring(hh, th), (1.05 + 0.85 * mid) * (1 - 0.05 * k), al, RED, thick=0.15)


def paint_photons():
    for (ex, ey), he, d in PHOTONS:
        hs = np.linspace(he, 0.0, 60)
        x = ex + (he - hs) * d[0]
        y = ey + (he - hs) * d[1]
        p = scr(x, y, hs)
        al = (0.30 + 0.45 * (1 - hs / he)) * (0.55 + 0.45 * fade(he))
        al = al * np.where(under_sheet(x, y, hs), SEEN + 0.15, 1.0)
        ribbon(p, 1.25, al, OCHRE, thick=0.05)


def paint_photon_marks():
    """Each photon where it is now: a short wave packet lying on the sheet."""
    for (ex, ey), he, d in PHOTONS:
        px, py = ex + he * d[0], ey + he * d[1]
        if not (0 <= px <= XD and 0 <= py <= YD):
            continue
        n = np.array([-d[1], d[0]])
        s = np.linspace(-0.26, 0.26, 40)
        env = np.exp(-(s / 0.15) ** 2)
        wig = 0.075 * env * np.sin(s * 2 * np.pi / 0.17)
        p = scr(px + s * d[0] + wig * n[0], py + s * d[1] + wig * n[1])
        k = 0.55 + 0.45 * lit(*scr(px, py))
        ribbon(p, 1.5, k * (0.25 + 0.75 * env), mix(OCHRE, col(1.0, 0.9, 0.6), 0.35), thick=0.2)


def disk(c, rad, n=40):
    th = np.linspace(0, 2 * np.pi, n, endpoint=False)
    return scr(c[0] + rad * np.cos(th), c[1] + rad * np.sin(th))


def paint_body(line, rad, mark):
    c = line.now()
    p = scr(*c)
    k = float(0.45 + 0.55 * lit(p[0], p[1])) if not line.sel else 1.0
    ink = line.ink
    here = film(float(p[0]), float(p[1]))
    # the light it sheds on the sheet under it
    with cv.frisket(SHEET):
        if line.sel:
            cv.glow((p[0], p[1] + 1.5), rad * S * 2.4, col(0.70, 0.12, 0.18), 0.42, mode="normal", falloff=2.4)
        else:
            cv.glow((p[0], p[1] + 1.5), rad * S * 1.25, ink, 0.16 * k)
    poly = disk(c, rad)
    body = mix(here, ink, 0.80 if line.sel else 0.62) * (0.6 + 0.4 * k)
    cv.fill(poly, body, FILBERT, width=max(3.0, rad * S * 0.5), angle=8, length=(10, 40), overlap=0.5,
            streak=0.03, jitter=0.01, thick=0.6)
    rim = np.vstack([poly, poly[:1]])
    ribbon(rim, 1.5 if line.sel else 1.25, 0.95, mix(ink, col(1, 1, 1), 0.28 if line.sel else 0.18) * (0.62 + 0.38 * k),
           thick=0.3)
    mk = mix(ink, col(1, 1, 1), 0.62) * (0.62 + 0.38 * k)
    r = rad * 0.5
    if mark in "+-":
        ribbon(scr([c[0] - r, c[0] + r], [c[1], c[1]]), 1.35, 0.95, mk, thick=0.2)
        if mark == "+":
            ribbon(scr([c[0], c[0]], [c[1] - r, c[1] + r]), 1.35, 0.95, mk, thick=0.2)
    elif mark == "|":
        a = np.deg2rad(118)
        ribbon(scr([c[0], c[0] + rad * 0.9 * np.cos(a)], [c[1], c[1] + rad * 0.9 * np.sin(a)]), 1.3, 0.95, mk, thick=0.2)


def paint_edges():
    xs = np.linspace(0, XD, 160)
    near = scr(xs, np.zeros_like(xs))
    ribbon(near, 1.7, 0.10 + 0.82 * lit(near[:, 0], near[:, 1]), EDGE, thick=0.3)
    ribbon(near + np.array([0, 1.6], F), 3.2, 0.03 + 0.16 * lit(near[:, 0], near[:, 1]), col(0.5, 0.48, 0.8), thick=0)
    far = scr(xs, np.full_like(xs, YD))
    ribbon(far, 1.0, 0.05 + 0.9 * lit(far[:, 0], far[:, 1]), EDGE * 0.7, thick=0.1)
    ys = np.linspace(0, YD, 40)
    left = scr(np.zeros_like(ys), ys)
    ribbon(left, 1.1, 0.07 + 0.3 * lit(left[:, 0], left[:, 1]), EDGE * 0.8, thick=0.1)


# ------------------------------------------------------------------ paint ---
paint_ground()
paint_sheet()
paint_depth()

# what hangs beneath, far to near
for ln in sorted([FAR] + FREE, key=lambda l: -l.depth):
    ln.paint()
    ln.beads()
paint_cone_back()
for only in (False, True):                      # the pair: the strand behind first
    for ln in PAIR:
        ln.paint(only)
for ln in PAIR:
    ln.beads()
paint_photons()
SEL.paint()
SEL.beads()
paint_cone_front()

paint_edges()
paint_photon_marks()
for ln, rad, mark in sorted([(FAR, 0.21, "+"), (FREE[0], 0.23, "|"), (FREE[1], 0.20, "-"),
                             (PAIR[0], 0.19, "+"), (PAIR[1], 0.19, "-"), (SEL, 0.27, "-")],
                            key=lambda t: -t[0].depth):
    paint_body(ln, rad, mark)

cv.save_card(OUT, relief=0.4, tooth=0.02)
print(f"{cv.count} strokes, {cv.W}x{cv.H}, {time.time() - t0:.1f}s -> {OUT}")
