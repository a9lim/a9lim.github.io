"""brush.py — a small bristle-brush paint engine.

No image model, nothing traced, nothing rendered in advance. A painting is a
Python program that calls `Canvas.stroke(...)` a few thousand times. Each
stroke is a path with a width; the brush lays paint along it bristle by
bristle, so every stroke has streaks running its length, runs dry toward
lift-off, catches the tooth of the canvas when it is dry, can drag wet colour
it passes over, and leaves a little relief that is lit at the end.

Two studio tools besides the brush: a frisket (a cut stencil that keeps an
edge clean) and a glaze layer (strokes that lay one even transparent film, for
cast shadows and light, instead of piling up).

Coordinates are in nominal units; `scale` turns them into pixels, so a piece
can be previewed small and painted large from the same program. The social
cards are 1200 × 630 nominal, painted at twice that and reduced
(`Canvas.save_card`).

numpy + scipy + PIL only.

Written by Claude, 2026-11-11.
"""
from __future__ import annotations

from contextlib import contextmanager, nullcontext
from dataclasses import dataclass, replace

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter

F = np.float32


# ---------------------------------------------------------------- colour ----
def rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], F)


def col(*c):
    return np.array(c, F)


def mix(a, b, t):
    return np.asarray(a, F) * (1 - t) + np.asarray(b, F) * t


# -------------------------------------------------------------- geometry ----
def rot(pts, deg, c=(0.0, 0.0)):
    p = np.asarray(pts, F) - np.asarray(c, F)
    a = np.deg2rad(deg)
    ca, sa = np.cos(a), np.sin(a)
    out = np.stack([p[..., 0] * ca - p[..., 1] * sa,
                    p[..., 0] * sa + p[..., 1] * ca], -1)
    return (out + np.asarray(c, F)).astype(F)


def rect(cx, cy, w, h, deg=0.0):
    p = np.array([(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)], F)
    return rot(p, deg) + np.array([cx, cy], F)


def arc(cx, cy, r, a0=0.0, a1=360.0, n=None, ry=None, deg=0.0):
    """Points along a circular/elliptical arc, angles in degrees (y down)."""
    ry = r if ry is None else ry
    if n is None:
        n = max(8, int(abs(a1 - a0) / 360 * (10 + 2.2 * np.sqrt(max(r, ry)) * 4)))
    t = np.deg2rad(np.linspace(a0, a1, n))
    p = np.stack([r * np.cos(t), ry * np.sin(t)], -1).astype(F)
    if deg:
        p = rot(p, deg)
    return p + np.array([cx, cy], F)


def spline(pts, step=6.0, closed=False):
    """Catmull-Rom through the given points."""
    P = np.asarray(pts, F)
    if len(P) < 3:
        return P
    if closed:
        Q = np.vstack([P[-1], P, P[0], P[1]])
    else:
        Q = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        n = max(2, int(np.hypot(*(p2 - p1)) / step))
        t = np.linspace(0, 1, n, endpoint=False)[:, None].astype(F)
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t
                          + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Q[-2][None])
    return np.vstack(out).astype(F)


def resample(P, step):
    P = np.asarray(P, F)
    d = np.hypot(*(P[1:] - P[:-1]).T)
    cum = np.concatenate([[0.0], np.cumsum(d)])
    L = cum[-1]
    if L < 1e-6:
        return np.vstack([P[0], P[0] + np.array([0.5, 0.0], F)])
    n = max(2, int(np.ceil(L / step)) + 1)
    s = np.linspace(0, L, n)
    return np.stack([np.interp(s, cum, P[:, 0]), np.interp(s, cum, P[:, 1])], -1).astype(F)


def offset(P, dist):
    """Shift a polyline sideways by `dist` (positive = to its right, y down)."""
    P = np.asarray(P, F)
    t = np.gradient(P, axis=0)
    n = np.stack([-t[:, 1], t[:, 0]], -1)
    n /= np.maximum(np.hypot(n[:, 0], n[:, 1]), 1e-6)[:, None]
    return (P + n * dist).astype(F)


def path_len(P):
    P = np.asarray(P, F)
    return float(np.hypot(*(P[1:] - P[:-1]).T).sum())


# ----------------------------------------------------------------- brush ----
@dataclass(frozen=True)
class Brush:
    density: float = 0.45       # bristles per nominal unit of width
    streak: float = 0.05        # value difference between neighbouring bristles
    chroma: float = 0.015       # colour difference between neighbouring bristles
    jitter: float = 0.025       # how much each loading of the brush differs
    load: float = 1.0           # paint on the brush at touch-down
    dry: float = 0.0            # how much of it is gone by lift-off
    grain: float = 0.5          # how strongly canvas tooth breaks a dry stroke
    gap: float = 0.03           # chance a bristle carries almost nothing
    soft: float = 0.10          # edge softness as a fraction of half-width
    taper: tuple = (0.15, 0.25)  # fraction of the length spent pressing in / lifting off
    tip: float = 0.35           # width at the very ends (1 = square-ended flat)
    pickup: float = 0.0         # how much wet colour it drags along
    thick: float = 0.5          # impasto
    opacity: float = 1.0
    mode: str = "normal"        # normal | multiply | screen | add
    wobble: float = 0.0         # hand tremor, nominal units


FLAT = Brush(density=0.5, streak=0.06, taper=(0.04, 0.08), tip=0.85, dry=0.25, soft=0.06)
ROUND = Brush(density=0.4, streak=0.035, taper=(0.2, 0.35), tip=0.15)
FILBERT = Brush(density=0.45, streak=0.05, taper=(0.12, 0.2), tip=0.5, dry=0.15)
DRY = replace(FLAT, load=0.85, dry=0.6, grain=1.1, gap=0.12, streak=0.08)
SOFT = Brush(density=0.25, streak=0.012, chroma=0.005, soft=0.6, taper=(0.1, 0.1), tip=0.8,
             thick=0.0, opacity=0.5, jitter=0.01)
LINE = Brush(density=1.0, streak=0.0, chroma=0.0, jitter=0.0, taper=(0.0, 0.0), tip=1.0,
             soft=0.3, thick=0.15, gap=0.0)
LINER = replace(LINE, taper=(0.08, 0.15), tip=0.45, jitter=0.01)
DAB = Brush(density=0.5, streak=0.03, taper=(0.0, 0.0), tip=1.0, soft=0.2, thick=0.8)
KNIFE = Brush(density=0.18, streak=0.09, gap=0.18, taper=(0.0, 0.0), tip=1.0, dry=0.45,
              grain=1.3, thick=1.0, soft=0.04)
CHALK = Brush(density=0.9, streak=0.05, gap=0.1, load=1.0, dry=0.15, grain=1.15,
              taper=(0.05, 0.05), tip=0.8, soft=0.3, thick=0.1, jitter=0.01)
PENCIL = replace(CHALK, gap=0.1, grain=1.2, load=0.9, dry=0.1, opacity=0.85)


# ---------------------------------------------------------------- canvas ----
class Canvas:
    def __init__(self, w, h, scale=1.0, ground=(0.5, 0.45, 0.4), seed=1):
        self.w, self.h, self.s = w, h, float(scale)
        self.W, self.H = int(round(w * scale)), int(round(h * scale))
        self.img = np.empty((self.H, self.W, 3), F)
        self.img[:] = np.asarray(ground, F)
        self.hgt = np.zeros((self.H, self.W), F)
        self.rng = np.random.default_rng(seed)
        self.tooth = self._make_tooth()
        self.masks = []
        self._cov = None
        self.count = 0

    # -- surface --------------------------------------------------------
    def _make_tooth(self):
        H, W, s = self.H, self.W, self.s
        r = np.random.default_rng(7)

        def norm(a):
            return (a - a.mean()) / (a.std() + 1e-6)

        fine = norm(gaussian_filter(r.random((H, W)).astype(F), 0.7 * s))
        coarse = norm(gaussian_filter(r.random((H, W)).astype(F), 3.0 * s))
        yy, xx = np.mgrid[0:H, 0:W].astype(F)
        f = 2 * np.pi / (3.4 * s)
        weave = np.sin(xx * f) + np.sin(yy * f)
        t = 0.5 + 0.17 * fine + 0.07 * coarse + 0.06 * weave
        return np.clip(t, 0, 1).astype(F)

    # -- frisket (stencil) ---------------------------------------------
    def poly_mask(self, polys, feather=0.0):
        if isinstance(polys, np.ndarray) and polys.ndim == 2:
            polys = [polys]
        polys = [np.asarray(p, F) * self.s for p in polys]
        allp = np.vstack(polys)
        pad = 2 + int(3 * feather * self.s)
        x0 = max(0, int(np.floor(allp[:, 0].min())) - pad)
        y0 = max(0, int(np.floor(allp[:, 1].min())) - pad)
        x1 = min(self.W, int(np.ceil(allp[:, 0].max())) + pad)
        y1 = min(self.H, int(np.ceil(allp[:, 1].max())) + pad)
        m = np.zeros((self.H, self.W), F)
        if x1 <= x0 or y1 <= y0:
            return m
        ss = 3
        im = Image.new("L", ((x1 - x0) * ss, (y1 - y0) * ss), 0)
        d = ImageDraw.Draw(im)
        for p in polys:
            d.polygon([((x - x0) * ss, (y - y0) * ss) for x, y in p], fill=255)
        im = im.resize((x1 - x0, y1 - y0), Image.BOX)
        sub = np.asarray(im, F) / 255
        if feather > 0:
            sub = gaussian_filter(sub, feather * self.s)
        m[y0:y1, x0:x1] = sub
        return m

    def _as_mask(self, m):
        if isinstance(m, np.ndarray) and m.shape == (self.H, self.W):
            return m
        return self.poly_mask(m)

    @contextmanager
    def frisket(self, m, feather=0.0):
        m = self._as_mask(m)
        if feather > 0:
            m = gaussian_filter(m, feather * self.s)
        self.masks.append(m if not self.masks else self.masks[-1] * m)
        try:
            yield m
        finally:
            self.masks.pop()

    @contextmanager
    def layer(self, color, mode="multiply", opacity=1.0, blur=0.0):
        """Strokes inside lay one even film (a glaze) instead of piling up."""
        self._cov = np.zeros((self.H, self.W), F)
        try:
            yield
        finally:
            cov, self._cov = self._cov, None
            if blur > 0:
                cov = gaussian_filter(cov, blur * self.s)
            ys, xs = np.nonzero(cov > 1e-3)
            if len(ys):
                y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
                a = (cov[y0:y1, x0:x1] * opacity)[..., None]
                self._blend(self.img[y0:y1, x0:x1], np.asarray(color, F), a, mode)

    @staticmethod
    def _blend(sub, c, a, mode):
        if mode == "normal":
            sub *= (1 - a)
            sub += c * a
        elif mode == "multiply":
            sub *= 1 - a * (1 - c)
        elif mode == "screen":
            sub[:] = 1 - (1 - np.clip(sub, 0, 1)) * (1 - a * np.clip(c, 0, 1))
        elif mode == "add":
            sub += a * c
        else:
            raise ValueError(mode)

    # -- the stroke -----------------------------------------------------
    def stroke(self, pts, width, color, brush=ROUND, color_end=None, **over):
        if over:
            brush = replace(brush, **over)
        rng, s = self.rng, self.s
        hw = max(0.3, width * s * 0.5)
        P = resample(np.asarray(pts, F) * s, max(1.5, hw * 0.7))
        n = len(P)
        if brush.wobble > 0 and n > 2:
            t = np.linspace(0, 1, n)
            w = brush.wobble * s * (np.sin(t * rng.uniform(4, 9) + rng.uniform(0, 6.3))
                                    + 0.5 * np.sin(t * rng.uniform(11, 23) + rng.uniform(0, 6.3)))
            P = (P + _normals(P) * w[:, None]).astype(F)
        pad = hw + 2
        x0 = max(0, int(P[:, 0].min() - pad))
        y0 = max(0, int(P[:, 1].min() - pad))
        x1 = min(self.W, int(P[:, 0].max() + pad) + 2)
        y1 = min(self.H, int(P[:, 1].max() + pad) + 2)
        if x1 <= x0 or y1 <= y0:
            return
        h, w_ = y1 - y0, x1 - x0
        d2 = np.full((h, w_), 1e12, F)
        tt = np.zeros((h, w_), F)
        sd = np.zeros((h, w_), F)
        seg = P[1:] - P[:-1]
        sl = np.hypot(seg[:, 0], seg[:, 1])
        cum = np.concatenate([[0.0], np.cumsum(sl)]).astype(F)
        L = float(cum[-1])
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
            sp = np.clip((xs * dx + ys * dy) / (l * l), 0, 1)
            ex = xs - sp * dx
            ey = ys - sp * dy
            dd = ex * ex + ey * ey
            sub = (slice(sy0 - y0, sy1 - y0), slice(sx0 - x0, sx1 - x0))
            m = dd < d2[sub]
            d2[sub] = np.where(m, dd, d2[sub])
            tt[sub] = np.where(m, cum[i] + sp * l, tt[sub])
            sd[sub] = np.where(m, (dx * ys - dy * xs) / l, sd[sub])
        if L < 1e-6:
            return
        t = tt / L
        d = np.sqrt(d2)
        # pressure: swell in, lift off
        t_in, t_out = brush.taper
        prof = np.ones_like(t)
        if t_in > 0:
            prof = np.where(t < t_in, brush.tip + (1 - brush.tip) * np.sin(0.5 * np.pi * t / t_in), prof)
        if t_out > 0:
            prof = np.where(t > 1 - t_out,
                            brush.tip + (1 - brush.tip) * np.sin(0.5 * np.pi * (1 - t) / t_out), prof)
        hwt = np.maximum(hw * prof, 0.3)
        softpx = max(0.7, brush.soft * hw)
        edge = np.clip((hwt - d) / softpx + 0.5, 0, 1)
        if not edge.any():
            return
        # bristles
        nb = max(3, int(width * brush.density))
        b_load = rng.uniform(0.62, 1.0, nb).astype(F)
        b_load[rng.random(nb) < brush.gap] = 0.12
        b_val = rng.normal(0, brush.streak, nb).astype(F)
        b_chr = rng.normal(0, brush.chroma, (nb, 3)).astype(F)
        b_hgt = rng.uniform(0, 1, nb).astype(F)
        u = np.clip(sd / hwt, -1, 1)
        fb = (u * 0.5 + 0.5) * (nb - 1)
        i0 = fb.astype(np.int32)
        fr = fb - i0
        i1 = np.minimum(i0 + 1, nb - 1)
        bl = b_load[i0] * (1 - fr) + b_load[i1] * fr
        rem = brush.load - brush.dry * t ** 1.3
        tooth = self.tooth[y0:y1, x0:x1]
        wet = bl * rem + brush.grain * (tooth - 0.5) * (1.15 - rem)
        cover = np.clip((wet - 0.36) / 0.2, 0, 1)
        a = edge * cover * brush.opacity
        if self.masks:
            a = a * self.masks[-1][y0:y1, x0:x1]
        self.count += 1
        if self._cov is not None:
            c = self._cov[y0:y1, x0:x1]
            c[:] = 1 - (1 - c) * (1 - a)
            return
        # colour
        c0 = np.asarray(color, F)
        lum = min(1.2, 0.25 + float(np.mean(c0)))       # dark paint varies less in absolute terms
        base = c0 + lum * (rng.normal(0, brush.jitter) + rng.normal(0, brush.jitter * 0.4, 3))
        tint = (b_val[:, None] + b_chr) * lum
        cpx = tint[i0] * (1 - fr)[..., None] + tint[i1] * fr[..., None]
        sub_img = self.img[y0:y1, x0:x1]
        if brush.pickup > 0:
            px = np.clip(P[:, 0].astype(int), 0, self.W - 1)
            py = np.clip(P[:, 1].astype(int), 0, self.H - 1)
            under = self.img[py, px]
            carried = np.empty((n, 3), F)
            cur = base.astype(F)
            k = 1 - (1 - brush.pickup) ** (sl.mean() / max(hw, 1.0))
            for j in range(n):
                cur = cur + k * (under[j] - cur)
                carried[j] = cur
            fi = t * (n - 1)
            j0 = fi.astype(np.int32)
            jf = (fi - j0)[..., None]
            j1 = np.minimum(j0 + 1, n - 1)
            cpx = cpx + carried[j0] * (1 - jf) + carried[j1] * jf
        else:
            cpx = cpx + base
            if color_end is not None:       # the colour may turn along the stroke
                cpx = cpx + (np.asarray(color_end, F) - c0) * t[..., None]
        self._blend(sub_img, cpx, a[..., None], brush.mode)
        if brush.thick > 0 and brush.mode == "normal":
            bh = b_hgt[i0] * (1 - fr) + b_hgt[i1] * fr
            ridge = 0.5 + 0.7 * bh + 0.6 * np.exp(-((1 - np.abs(u)) / 0.15) ** 2)
            hs = self.hgt[y0:y1, x0:x1]
            hs[:] = hs * (1 - 0.85 * a) + a * brush.thick * ridge

    # -- conveniences ---------------------------------------------------
    def line(self, p0, p1, width, color, brush=LINE, **over):
        self.stroke([p0, p1], width, color, brush, **over)

    def dab(self, p, r, color, brush=DAB, **over):
        ang = self.rng.uniform(0, 2 * np.pi)
        d = np.array([np.cos(ang), np.sin(ang)]) * r * 0.25
        p = np.asarray(p, float)
        self.stroke([p - d, p + d], 2 * r, color, brush, **over)

    def glow(self, p, r, color, strength=1.0, mode="screen", falloff=2.0):
        """One touch of a very soft round brush."""
        s = self.s
        cx, cy, R = p[0] * s, p[1] * s, r * s
        x0, x1 = max(0, int(cx - 2.6 * R)), min(self.W, int(cx + 2.6 * R) + 1)
        y0, y1 = max(0, int(cy - 2.6 * R)), min(self.H, int(cy + 2.6 * R) + 1)
        if x1 <= x0 or y1 <= y0:
            return
        xs = (np.arange(x0, x1, dtype=F) - cx)[None, :]
        ys = (np.arange(y0, y1, dtype=F) - cy)[:, None]
        a = strength * np.exp(-(xs * xs + ys * ys) / (R * R) * falloff)
        if self.masks:
            a = a * self.masks[-1][y0:y1, x0:x1]
        self.count += 1
        self._blend(self.img[y0:y1, x0:x1], np.asarray(color, F), a[..., None], mode)

    def fill(self, poly, color, brush=FLAT, width=24.0, angle=0.0, overlap=0.3,
             length=(140, 320), frisket=True, wander=1.5, bleed=0.6, shuffle=False, curve=0.0,
             **over):
        """Hatch a polygon with strokes. `color` may be a function of (x, y)."""
        rng = self.rng
        poly = np.asarray(poly, F)
        c = poly.mean(0)
        q = rot(poly - c, -angle)
        a_, b_ = q, np.roll(q, -1, 0)
        step = width * (1 - overlap)
        jobs = []
        for y in np.arange(q[:, 1].min() + step * 0.35, q[:, 1].max(), step):
            y = float(y) + 1e-3
            m = (a_[:, 1] <= y) != (b_[:, 1] <= y)
            if not m.any():
                continue
            xs = np.sort(a_[m, 0] + (y - a_[m, 1]) / (b_[m, 1] - a_[m, 1]) * (b_[m, 0] - a_[m, 0]))
            for xa, xb in zip(xs[0::2], xs[1::2]):
                ext = bleed * width if frisket else -0.4 * width
                xa, xb = xa - ext, xb + ext
                if xb - xa < 1:
                    continue
                x = xa
                while x < xb:
                    ln = rng.uniform(*length)
                    xe = min(x + ln, xb)
                    if xb - xe < 0.3 * length[0]:
                        xe = xb
                    jobs.append((x, y + rng.normal(0, wander), xe, y + rng.normal(0, wander)))
                    if xe >= xb:
                        break
                    x = xe - 0.12 * ln
        if shuffle:
            rng.shuffle(jobs)
        with (self.frisket(poly) if frisket else nullcontext()):
            for xa, ya, xb, yb in jobs:
                p = np.array([[xa, ya], [(xa + xb) / 2, (ya + yb) / 2 + rng.normal(0, curve)], [xb, yb]], F)
                if curve > 0:
                    p = spline(p, step=max(4.0, width * 0.5))
                if rng.random() < 0.5:
                    p = p[::-1]
                p = rot(p, angle) + c
                if callable(color):
                    cc, ce = color(float(p[0][0]), float(p[0][1])), color(float(p[-1][0]), float(p[-1][1]))
                else:
                    cc, ce = color, None
                self.stroke(p, width * rng.uniform(0.9, 1.1), cc, brush, color_end=ce, **over)

    def lit_line(self, pts, width, color, brush=LINE, chunk=70.0, **over):
        """A long line whose colour follows a function of position."""
        P = resample(np.asarray(pts, F), min(chunk, 4.0))
        d = np.concatenate([[0.0], np.cumsum(np.hypot(*(P[1:] - P[:-1]).T))])
        k = max(1, int(round(d[-1] / chunk)))
        bounds = np.linspace(0, d[-1], k + 1)
        for i in range(k):
            q = P[(d >= bounds[i] - 1e-3) & (d <= bounds[i + 1] + 2.0)]
            if len(q) < 2:
                continue
            mid = q[len(q) // 2]
            self.stroke(q, width, color(float(mid[0]), float(mid[1])), brush, **over)

    def dashed(self, pts, width, color, dash=22.0, gap=14.0, brush=LINE, **over):
        P = resample(np.asarray(pts, F), 3.0)
        d = np.concatenate([[0.0], np.cumsum(np.hypot(*(P[1:] - P[:-1]).T))])
        s0 = 0.0
        while s0 < d[-1]:
            s1 = min(s0 + dash * self.rng.uniform(0.85, 1.15), d[-1])
            m = (d >= s0) & (d <= s1)
            if m.sum() >= 2:
                q = P[m]
                mid = q[len(q) // 2]
                cc = color(float(mid[0]), float(mid[1])) if callable(color) else color
                self.stroke(q, width, cc, brush, **over)
            s0 = s1 + gap * self.rng.uniform(0.85, 1.15)

    # -- finishing ------------------------------------------------------
    def finish(self, relief=0.55, tooth=0.03, light=(-0.6, -0.8)):
        H = gaussian_filter(self.hgt, 0.55 * self.s)
        gy, gx = np.gradient(H)
        shade = -(gx * light[0] + gy * light[1])
        img = self.img * (1 + relief * np.clip(shade, -0.5, 0.5))[..., None]
        img = img * (1 + tooth * (self.tooth - 0.5) * 2)[..., None]
        return np.clip(img, 0, 1)

    def save(self, path, size=None, **kw):
        img = self.finish(**kw)
        out = (img * 255 + np.random.default_rng(3).uniform(0, 1, img.shape)).clip(0, 255).astype(np.uint8)
        im = Image.fromarray(out)
        if size is not None and size != im.size:
            im = im.resize(size, Image.LANCZOS)
        im.save(path)
        return path

    def save_card(self, path, **kw):
        """Save at the nominal size, whatever scale the piece was painted at."""
        return self.save(path, size=(int(self.w), int(self.h)), **kw)


def _normals(P):
    t = np.gradient(P, axis=0)
    n = np.stack([-t[:, 1], t[:, 0]], -1)
    return n / np.maximum(np.hypot(n[:, 0], n[:, 1]), 1e-6)[:, None]


# ------------------------------------------------------------ small font ----
GLYPHS = {
    "1": [[(0.2, 0.4), (0.55, 0.0), (0.55, 1.6)]],
    "2": [[(0.0, 0.38), (0.28, 0.02), (0.76, 0.02), (1.0, 0.40), (0.0, 1.6), (1.05, 1.6)]],
    "7": [[(0.0, 0.0), (1.0, 0.0), (0.35, 1.6)]],
    "4": [[(0.78, 1.6), (0.78, 0.0), (0.0, 1.1), (1.05, 1.1)]],
    "I": [[(0.5, 0.0), (0.5, 1.6)]],
}


def glyph_paths(text, origin, size, deg=0.0, spacing=1.45):
    """Polylines for a few hand-drawn glyphs; size = glyph width in units."""
    out = []
    x = 0.0
    for ch in text:
        for path in GLYPHS.get(ch, []):
            p = np.array(path, F) * size + np.array([x, 0], F)
            out.append(rot(p, deg) + np.asarray(origin, F))
        x += size * (0.75 if ch in "1I" else spacing)
    return out
