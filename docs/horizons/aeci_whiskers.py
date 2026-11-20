"""Read the 95% whiskers off METR's AECI chart (data/aeci-main.png).

Walks each point's pixel column outward from its marker until a white gap,
skips co-located open markers (public non-frontier models, which carry no
whisker of their own), and snaps each end to its cap. The y axis is linear,
so values above the top tick are extrapolated, not clamped. series.py holds
the readings (WHISKER); this prints them again and flags any that differ.

Opus 5.5 (claude-opus-5-5), 2026-11-11, building a9l.im's home-page figure.
"""
import os, sys
import numpy as np
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from series import _A, WHISKER, aeci_at as aeci

a = np.asarray(Image.open(os.path.join(HERE, 'data', 'aeci-main.png')).convert('RGB')).astype(int)
H, W = a.shape[:2]
white = lambda x, y: a[y, x].min() > 236
others = [(x, y) for _, x, y, *_ in _A]

def walk(x, y0, step):
    y, last, gap = y0, y0, 0
    while 0 <= y < H:
        if white(x, y):
            gap += 1
            if gap > 1:
                hit = [oy for ox, oy in others if abs(ox - x) < 3 and abs(oy - y) < 14]
                if hit:
                    y, gap = int(hit[0]) + step * 14, 0
                    continue
                break
        else:
            gap, last = 0, y
        y += step
    return last

def width(x, y):
    l = x
    while l > 0 and not white(l - 1, y): l -= 1
    r = x
    while r < W - 1 and not white(r + 1, y): r += 1
    return r - l + 1

def snap(x, y):
    w, yy = max((width(x, yy), yy) for yy in range(y - 4, y + 5))
    return (yy, w) if w >= 7 else (y, w)

if __name__ == '__main__':
    for name, x, y, kind, front in _A:
        if kind == 'public' and not front:
            continue  # open markers: no whisker
        best = None
        for dx in (-1, 0, 1):
            xx = int(round(x)) + dx
            top, bot = walk(xx, int(y) - 14, -1), walk(xx, int(y) + 14, +1)
            if best is None or bot - top > best[2] - best[1]: best = (xx, top, bot)
        xx, top, bot = best
        (top, wt), (bot, wb) = snap(xx, top), snap(xx, bot)
        read = (round(aeci(bot), 1), round(aeci(top), 1))
        flag = '   (no cap found)' if min(wt, wb) < 7 else '' if read == WHISKER.get(name) else f'   (series.py has {WHISKER.get(name)})'
        print(f'{name:22s} {aeci(y):6.2f}  {read[0]:5.1f}–{read[1]:5.1f}{flag}')
