import math
def oklch_to_srgb(L, C, h):
    a = C*math.cos(math.radians(h)); b = C*math.sin(math.radians(h))
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    r = 4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    bb = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    return r, g, bb
def in_gamut(rgb): return all(-1e-4 <= v <= 1.0001 for v in rgb)
def enc(v):
    v = min(1, max(0, v))
    return 12.92*v if v <= 0.0031308 else 1.055*v**(1/2.4) - 0.055
def hexof(rgb): return '#' + ''.join(f'{round(enc(v)*255):02X}' for v in rgb)
def lum_hex(h):
    def lin(c):
        c /= 255
        return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
    r, g, b = (int(h[i:i+2], 16) for i in (1, 3, 5))
    return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b)
def contrast(a, b):
    la, lb = lum_hex(a), lum_hex(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi+0.05)/(lo+0.05)
def fit(h, C, target, ground, dark):
    # search L so contrast against ground ~= target, reducing chroma until in gamut
    best = None
    for Ci in [C - 0.005*k for k in range(int(C/0.005))]:
        lo, hi = (0.2, 0.95)
        for _ in range(40):
            mid = (lo+hi)/2
            hx = hexof(oklch_to_srgb(mid, Ci, h))
            cr = contrast(hx, ground)
            if (cr > target) != dark: lo = mid
            else: hi = mid
        L = (lo+hi)/2
        rgb = oklch_to_srgb(L, Ci, h)
        if in_gamut(rgb): return hexof(rgb), L, Ci
    return None
inks = [
  # name, hue, chroma (light), chroma (dark), replaces
  ('indigo',    272, 0.115, 0.105, 'indigo, purple(part)'),
  ('prussian',  245, 0.100, 0.095, 'blue'),
  ('verdigris', 192, 0.075, 0.075, 'cyan'),
  ('viridian',  158, 0.095, 0.095, 'green'),
  ('sap',       128, 0.095, 0.095, 'lime'),
  ('ochre',      82, 0.100, 0.100, 'yellow'),
  ('sienna',     52, 0.105, 0.100, 'orange'),
  ('umber',      62, 0.050, 0.050, 'brown'),
  ('madder',    352, 0.120, 0.110, 'rose'),
  ('mulberry',  332, 0.110, 0.105, 'magenta'),
  ('violet',    302, 0.110, 0.100, 'purple'),
]
LIGHT, DARK = '#FCFCFB', '#121111'
PANEL_L, PANEL_D = '#F4F3F2', '#161615'
out = []
for name, h, cl, cd, rep in inks:
    tl = 5.0 if name != 'umber' else 5.6
    td = 5.4 if name != 'umber' else 4.9
    lh, lL, lC = fit(h, cl, tl, LIGHT, False)
    dh, dL, dC = fit(h, cd, td, DARK, True)
    out.append((name, lh, dh, rep))
    print(f"{name:10s} light {lh} L={lL:.3f} C={lC:.3f} cr={contrast(lh, LIGHT):.2f}/{contrast(lh, PANEL_L):.2f}   dark {dh} L={dL:.3f} C={dC:.3f} cr={contrast(dh, DARK):.2f}/{contrast(dh, PANEL_D):.2f}   ({rep})")
print('accent', contrast('#983432', LIGHT), contrast('#DC5960', DARK))
print('graphite light', contrast('#666463', LIGHT), 'dark', contrast('#949392', DARK))
import json; json.dump(out, open('inks.json', 'w'))
