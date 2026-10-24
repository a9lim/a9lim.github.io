# Sketches

Reference implementations from the proposal page (second draft, 2026-10-24). They are toy models standing in for each sim's engine, so their physics, biology and markets are illustrative. What carries over to the real sims is the drawing: the layouts, the transforms and the bindings named in `../PLAN.md`.

- `core.js`: shared helpers (tokens, color mixing, the sketch loop with resize, visibility and theme handling, captions). Every `sk-*.js` runs in the same scope.
- `sk-worldline.js`: the canvas that tilts from the plane into spacetime: history sampling, the boost and the Lab/Observer animation, slice intersection, proper-time beads, photon Doppler color, and pions.
- `sk-lumen.js`: the Goodsell-style membrane and the octilinear transit map of the full carbon network, with four condition presets.
- `sk-miasma.js`: the hexagonal atlas with `topology.js`-style gluing, faded copies beyond glued edges, chevrons and isochrones. It implements the old six topologies; the plan reduces them to four and changes Klein.
- `sk-shoals.js`: the Brief, the markets page with the sandbox (`sh_Markets`), and the race page (`sh_Race`).
- `sec-*.html`, `head.html`, `top.html`: the page's sections and styles.
- `inks.py`, `inks.json`: the palette fit, with contrast checks against canvas and panel in both themes.

To rebuild the page, run `python3 build2.py OUT.html`, or `--only worldline` for one section. Then run `node shoot.mjs OUT.html OUTDIR cv-wl light 1280` to screenshot a figure. The shoot script loads Playwright from `~/Work/Exploratory`. The four "now" screenshots weren't kept, so those images are blank.
