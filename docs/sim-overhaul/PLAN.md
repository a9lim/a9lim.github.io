# Sim overhaul

The plan for rebuilding the visuals of the four browser sims (Worldline, Lumen, Miasma, Shoals). Proposed and ratified on 2026-10-24. The proposal page, with live sketches of every direction, is the private artifact https://claude.ai/artifact/JpbNYGUiciLn7gWEQivMGo (second draft). Its sketch sources are copied into `sketches/` beside this file as reference implementations; see `sketches/README.md`.

Nothing here is built yet. Work starts with phase 0 and the Worldline pilot.

## Decisions

Ratified by a9 on 2026-10-24:

- Every direction in the second draft is approved. Claude builds it however it judges best and may dispatch subagents in parallel.
- All four sims stay on the site's neutral ground in both themes. No sim gets its own background color.
- The extended palette is replaced by the inks below.
- Miasma keeps only topologies that glue every edge or none: Plane, Torus, Klein bottle and projective plane. Cylinder and Möbius are removed. Klein must glue all three edge pairs; the construction is under Miasma below.
- Worldline is the pilot.

## The shared language

The framing is "same paper, different inks". The four sims share the paper, and each sim chooses its own medium.

Shared by all four:

- The site's neutral ground in both themes.
- Newsreader for every word, in the chrome and on the canvas.
- The colophon: seal and name at the top left, the same size and place in every sim. It replaces the toolbar strip.
- A live figure caption under the scene, in italic, saying what you are looking at with its current values. It replaces the hint pill.
- Hairline structure in the controls: no cards, shadows or rounded panels.
- One set of inks for data (below).
- One red per sim, spent on the thing you would point at. Worldline: the selected body, its world line and light cone. Lumen: protons. Miasma: the disease, so painted interventions move from red to ink. Shoals: losses and down moves.
- The keyboard grammar and the about panel.

Owned by each sim: its medium, its choice of inks and what the red means there, its renderer (WebGPU where the scene needs it, Canvas or DOM where it doesn't), a control layout shaped to the medium instead of one sidebar for all, and a signature view.

Three rules apply inside every scene. They become an "Inside the scene" subsection of the root AGENTS.md design system.

1. **Depict, don't decorate.** The site's ban on glow, grain, shimmer and flourish still holds for chrome. Inside a scene, an effect ships only if it reads a quantity in the model (density is concentration, line weight is flux, bead spacing is proper time). An effect whose quantity can't be named doesn't ship.
2. **Open on a living frame.** No splash screen and no empty state. Each sim boots into its best preset, already running.
3. **Pattern before hue.** Where a scene encodes state, pair color with a pattern (stipple, hatching, dash, bead), so the scene survives grayscale and color-vision differences.

## Inks

Eleven inks named for pigments, each with its own light and dark value. They were fitted in OKLCH at chroma 0.05 to 0.12, and every one clears 4.5:1 against the canvas and the panel in both themes, so any ink can set text. The generator is `sketches/inks.py`.

| Ink | Light | Dark | Replaces |
|---|---|---|---|
| indigo | `#586AB2` | `#7486CB` | indigo |
| prussian | `#3473A3` | `#548EBE` | blue |
| verdigris | `#2A7976` | `#4A9593` | cyan |
| viridian | `#317B55` | `#4F9770` | green |
| sap | `#5B7637` | `#779252` | lime |
| ochre | `#8B681B` | `#A8843C` | yellow |
| sienna | `#9F5D31` | `#BC7950` | orange |
| umber | `#7C6049` | `#997D64` | brown |
| madder | `#A65179` | `#C07095` | rose |
| mulberry | `#97588E` | `#B275A9` | magenta |
| violet | `#7D60A6` | `#977DBF` | purple |

Red leaves the set: uses of `extended.red` move to the accent. Uses of `extended.slate` move to graphite, the site's own `textMuted`.

Migration is one pass with no aliases. `_PALETTE.extended` and `--ext-*` are replaced by theme-paired inks, and every reference in the four projects is renamed in the same change. As of 2026-10-24 there are about 60 JS references and 80 CSS references; Shoals' `strategy.js` destructures the palette. Inks are theme-dependent, unlike the old extended set, so canvas and WebGPU code must read them on every theme change, the way it reads the accent today.

## shared/

Keep a shared skeleton and give each sim its own skin. Going fully standalone would copy the accessibility and input code four times without changing anything visible.

| File | Fate |
|---|---|
| `shortcuts`, `touch`, `haptics`, `utils`, `camera` | Keep. Behavior with no look. |
| `dropdown`, `forms`, `tabs`, `tooltip` | Keep the logic and drop the styling; each sim styles its own controls. |
| `about`, `info` | Keep. The about panel is part of the shared colophon. |
| `toolbar` | Becomes `colophon`: seal, name, play and step, theme, help. Each sim places everything else. Add a small caption helper beside it. |
| `base.css` | Split. The shared part keeps the reset, focus, accessibility, colophon, caption and about panel. The HUD surfaces (toolbar strip, boxed sidebar, zoom stack, hint pill) move to `shared/hud.css`, which unconverted sims keep loading during the transition. Delete `hud.css` when the last sim converts. |
| `tokens` | Shrinks to ground, text, accent, type and the inks. |
| `sparkline` | Moves into the sims; each medium draws its own small charts. |

Shared globals and class names are an API used by every project, so each change is checked across all four (root AGENTS.md, "Shared layer").

## Worldline: the canvas tilts into spacetime

The bubble-chamber plate from the first draft is dropped: Worldline's bodies, bosons and fields don't behave like detector tracks. The spacetime view moves onto the main canvas instead.

- **Camera.** The canvas opens as today's plane. Dragging down tilts it, and every trail rises into its world line. Horizontal drag turns it. Plane and Spacetime buttons ease between the two. The plane view is the same camera looking straight down the time axis, so the 2D and 3D views never disagree.
- **Frames.** A boost slider sets the observer's speed. Lab and Observer buttons show one spacetime two ways. In lab coordinates the observer's present is a plane tilted by Δt = v Δx. In the observer's coordinates the plane is flat and everything else shears, and light stays on 45° lines. The sketch animates between the two by boosting at rapidity ψ = s·φ, with s eased from 0 to 1.
- **The present.** The observer's slice is t_φ = γ(t_now − |v|·L), set far enough into the lab's past that everything shown is computed. Bodies, photons and pions are drawn where their world lines cross it, as the Frames feature already does.
- **Bindings.** Height above the plane is time before the present. Beads mark equal proper time, so the traveling twin lays down fewer beads between meetings. Rings under the selected body are its past light cone. Photon color is lab energy against the emitter's rest frame, from sienna (redshift) through graphite to indigo (blueshift). Pions are mulberry, on timelike lines beaded by their own clocks. Disks are the rest-frame disk contracted along the motion, with the spoke turning on proper time. The lab box's corners are dashed world lines.
- **Kept from the plate draft:** proper-time beads, Doppler-colored photons, line-integral-convolution textures for the E and B fields, contour relief for the Higgs and axion fields (Kibble–Zurek walls as the φ = 0 contour), and a real star field behind the lensing plane.
- **Frame tab.** Its spacetime plot becomes redundant. The tab keeps the frame controls and the lag readout and drops the plot.
- **Build.** A second camera in the existing WebGPU pipeline: instanced line strips from the world-line history buffer the sim already keeps for signal delay and frames, an orbit camera, and the boost applied as a Lorentz transform in the vertex shader. Reference: `sketches/sk-worldline.js`, which carries the frame math, slice intersection and caption logic.
- **Milestones.** (1) Shell: colophon, caption and controls. (2) The tilt in lab coordinates. (3) The boost and the Lab/Observer animation. (4) Field textures, scalar relief and the lensing star field.

## Lumen: the cross-section

- **Membrane.** A cross-section in the manner of David Goodsell's molecular paintings: lipids, complexes and carriers at roughly true relative size. Flat fills, a darker outline and a soft lighter body; no bitmaps, so it themes and scales. Protons in the lumen are the red, and their count is the stored gradient. ATP synthase turns with proton flow, at twelve protons a turn, releasing one ATP every third of a turn. Photons are Feynman wiggles. Plastoquinone and plastocyanin shuttle with electron flux, and O₂ leaves PSII.
- **Network.** The full carbon network as a transit map: octilinear, Beck-style ticks for single stations, capsules and rings for interchanges, one ink per line, and line weight and train speed bound to flux. Shared intermediates are drawn once as interchanges (G6P, F6P, F1,6BP, G3P, 1,3-BPG, 3-PGA, R5P, Pyruvate, Acetyl-CoA). Calvin runs back along the glycolysis corridor on its own track, Krebs is a circle line, and β-oxidation is a loop with an acetyl-CoA spur. Gluconeogenesis runs trains backward on the glycolysis line. The lines follow Lumen's own reactions in `src/reactions/`.
- **Interaction.** Lumen advances reactions when enzyme labels are clicked. In the map, clicking a segment fires its enzyme. Autoplay keeps its schedule.
- **Signature.** The organism presets change the specimen, not only the switches: a cyanobacterial thylakoid, folded mitochondrial cristae for the animal cell, and the purple membrane of a halophilic archaeon with bacteriorhodopsin in its lattice.
- **Phones.** The map turns upright, and the real sim pans and zooms it.
- **Build.** Canvas 2D. The reaction engine stays; the renderer and layout are new. Reference: `sketches/sk-lumen.js`, which carries the octilinear layout, the parallel-corridor offsets and the four condition presets.

## Miasma: the atlas

- **Medium.** A plate from a nineteenth-century epidemiological atlas, in the line of John Snow's 1854 cholera map, on Miasma's real world: the inscribed regular hexagon of hex cells. The disease is the red (solid for infectious, pale for exposed). Recovered cells are stipple, vaccinated cells are hatching in an ink (four strains would take four hatch angles), and deaths are small crosses. Empty cells are a pale ground. Isochrones contour each cell's first-exposure tick every eight days, with collision-checked labels every twenty-four. The plate has a Reference cartouche, a scale bar and a plate title.
- **Glued edges.** Glued edges carry fundamental-polygon chevrons, one, two or three per pair, pointing the same way for a translation and opposite ways for a twist. Open edges get a heavier rule with outward hachures, like a coastline. Faded copies of the world sit beyond each glued edge with the right transform, so a wave visibly leaves one edge and continues from its partner. The 3D surfaces from the first draft are dropped.
- **Topologies.** Only Plane, Torus, Klein bottle and projective plane remain. In `src/topology.js` terms, with lattice vectors T1 = (2R+1, −R), T2 = (R, R+1) and T3 = (−R−1, 2R+1):
  - **Plane.** No gluing.
  - **Torus.** All three pairs translate.
  - **Projective plane.** All three pairs glue antipodally (p ↦ 2c − p, then translate into the hex). For a single opposite pair this map is the same as a twist. RP² can't be flat (χ = 1), so its three corner pairs each sum to 240°. Those defects are inherent.
  - **Klein bottle.** Keep pair 3 (the N and S edges) as a translation. Glue the two edges that meet at the E corner (NE and SE) to each other by a glide reflection whose axis is the vertical line through their midpoints, and do the same for the two edges meeting at the W corner (NW and SW). This is the Dirichlet domain of the flat Klein bottle group pg with a triangular orbit. Both corner classes sum to 360°, so the lattice has no defects. (Derived 2026-10-24 by boundary-word vertex classes; see the table below.) The glide axis has to be a mirror line of the cell lattice, so R may need a parity adjustment. If the lattice won't cooperate, the fallback is two opposite pairs twisted plus one translated: still a Klein bottle (χ = 0), but with two corner defects of 240° and 480°.

  | Gluing of all three pairs | χ | Orientable | Corner angle sums |
  |---|---|---|---|
  | three translations | 0 | yes (torus) | 360°, 360° |
  | one twist, two translations | −1 | no (not Klein) | 720° |
  | two twists, one translation | 0 | no (Klein, with defects) | 240°, 480° |
  | three twists, i.e. antipodal | 1 | no (RP²) | 240°, 240°, 240° |
  | one translation, the other four glued at shared corners by glide reflection | 0 | no (flat Klein) | 360°, 360° |

  Tests in `topology.test.mjs` must check that the neighbor relation is symmetric, that every cell has six distinct neighbors on the torus and Klein, and each surface's χ and orientability. Remove the Cylinder and Möbius enum values, presets and UI. A stored setting naming a removed topology falls back to the default.
- **Around the plate.** The stacked-area counts become Nightingale's rose of 1858. The lineage forest becomes a time-scaled phylogeny. The oncoviral preset reskins the lattice as an H&E-stained histology slide.
- **Build.** The sketch is Canvas 2D at R = 22. The real grid is larger (about 10,600 cells at default), so measure first. If Canvas can't hold 60 fps, draw the lattice from a state texture in WebGPU with a Canvas fallback. Contours run on the CPU every few ticks. Reference: `sketches/sk-miasma.js`, which carries the hex world, the ghost-tile transforms, the chevrons and the isochrones.

## Shoals: the Brief

- **Medium.** The interface becomes *The Meridian Brief*, the firm's own morning note, which the event files already quote. Each sim day is an edition, and an extra edition marks a regime change or crisis. Prices are set like newspaper agate tables. Event popups arrive as dispatches, and the epilogue is the last edition. The candles are redrawn in Tufte's manner: the close as a line over a band of the day's range, with news days marked.
- **Markets page.** Every market is a curve, drawn identically as small multiples: the HCN path, the Vasicek yield curve, the VXHCN futures term structure, the option smile, the Cambria compute forward curve, and the Consensus implied crossing curves for R2–R5. Each says in one line what it prices. News moves them together through the real coupled model and leaves a ghost of the prior curves.
- **Sandbox.** Clicking a point on any curve adds that contract (click again for short, again to remove). An agate book lists the legs. A scenario grid prices the book over HCN moves at horizon against how far the race gets, from the red (losses) through the paper to viridian (gains), with one plain sentence on what the book is betting on. It needs a keyboard path to add legs; the sketch has none.
- **Race page.** Modeled on the Epoch Capabilities Index (https://epoch.ai/eci): one capability scale with every public release placed by date. Here the scale is Shoals' rung ladder R1–R5. It shows releases per lab, filled certifications, hollow unadjudicated claims, and the released frontier. On each rung still ahead, Consensus's implied crossing date is drawn as a distribution. The self-graded Fixedpoint Index sits apart, labeled unlisted. The epilogue reveals the hidden internal tracks. The quote path must never read hidden state; that rule is in `src/race/consensus.js`.
- **Build.** Mostly DOM and Canvas 2D; the volatility surface is a small mesh. The market and event engines are untouched. Reference: `sketches/sk-shoals.js` (the Brief, `sh_Markets` and `sh_Race`).

## Order of work

0. **Shared skeleton, by hand.** The inks in `tokens.js` with every project's extended keys renamed, `colophon` and the caption helper, the `base.css` / `hud.css` split, and the "Inside the scene" subsection and inks table in the root AGENTS.md design system. One session.
1. **Worldline pilot.** Milestones as above. It settles how the colophon, caption and a 3D camera live inside the shared chrome.
2. **Lumen, Miasma and Shoals in parallel.** One agent per submodule, each confined to its own `projects/<name>/`, with a brief made from this file and that sim's AGENTS.md. Agents leave their changes uncommitted and never run the parent `npm run build` (it deletes and recreates `dist/`). The coordinator reviews each diff, commits inside each submodule, then bumps the parent's pointers in one commit. Stage explicitly in the parent, because a9 edits concurrently.
3. **Signature milestones.** The boost and field textures in Worldline, the organism specimens in Lumen, Nightingale's rose and the phylogeny in Miasma, the sandbox and race page in Shoals.

## Verification

- Headless Chromium against `./dev.sh` (wrangler dev), or a static build. Playwright and Chromium 1243 are installed with Exploratory (`~/Work/Exploratory/node_modules/playwright-core`; the Chrome for Testing binary is under `~/Library/Caches/ms-playwright/chromium-1243/`). WebGPU works there headless with `--enable-unsafe-webgpu`. `sketches/shoot.mjs` is a figure-screenshot harness to adapt.
- For every sim: light 1280, dark 1280 and phone 390 screenshots; no console errors; no horizontal overflow; 60 fps on the default preset; reduced-motion opens on a still, complete frame.
- Parent `npm test` before any deploy, plus Miasma's topology tests and each project's own tests.
- `./deploy.sh` ships the working tree, so say so before deploying. After deploying changes to assets, load the live site and check for console errors and 404s.
