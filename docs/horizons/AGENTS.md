# horizons

The analysis behind the figure at a9l.im/#fits ("In the foothills of the
singularity", `content/home/horizons.md`, fitted at build time by
`tools/horizon-fit.mjs`). It began on 9 November 2026 as a check of Benjamin
Todd's plot of log AI time horizon against log time left until a fitted
singularity: a straight line, August 2027, exponent 5.6. It lived in another
workspace as `reverse-log` until 2026-11-20; a pointer there leads here. Work
of a9 and Claude, 11–20 November 2026. Nothing here is staged or deployed;
`data/`, the plots and `result.json` are ignored, and all but `data/`
regenerate from the scripts, which print every number.

**Where it stands.** The plot reproduces (2027.65, 95% 2027.40 to 2028.00),
but a straight line on those axes is weak evidence: the singularity date is
fitted to make it straight. What favored the hyperbola (a9's point) is that
the date hasn't slid later as data arrived since December 2024. That and the
hyperbola's AICc edge both rest on seven internal checkpoints carried into
hours by the AECI map above AECI 162. METR's 20 November measurements put the
map 0.9 to 1.8 doublings high from AECI 160 up; on METR's ruler the date is
2028.70 (2028.14 to 2029.48), the hyperbola loses its lead, and the date
slides out about as fast as the calendar. Epoch's ECI, its subsets and
OpenAI's OECI agree with METR. The figure's 2027.65 holds only if AECI's
scale, or METR's narrow verifiable subset, is the right ruler at the top.

## Run it

    python series.py         # the figure's table checked against its sources; inputs and pairings
    python aeci_whiskers.py  # re-read the AECI intervals off METR's chart
    python replicate.py; python chart.py   # the 11 November check: tables, result.json, horizon-singularity-check.png
    python fit.py            # the score-to-horizon map, and each series on its own
    python three_scales.py; python conversions.py   # ECI as a third view, under each conversion
    python scores_vs_horizon.py; python aeci_eci_conversions.py   # its two plots
    python eci_gap.py        # what Claude's ECI shortfall at equal horizon is made of
    python software_route.py; python software_fit.py; python software_plot.py   # horizon through Epoch's software ECI
    python oeci.py; python oeci_plot.py   # OECI beside the other rulers, oeci.png
    python oeci_routes.py    # what each index weights; GPT-6.2 Astra carried onto AECI by several routes
    python aeci_subset.py    # speculative: Epoch benchmarks picked to imitate AECI (about 30 s)
    python aeci_imitation.py # that imitation against METR, every lab on it: aeci-imitation.png
    python metr_q4.py; python metr_q4_plot.py   # METR's 20 November update against the fit, metr-q4.png
    python metr_rulers.py    # those measurements beside ECI, its subsets and OECI (about a minute)
    python rulers_plot.py    # ruler-*.png: each ruler, the conversions, every ruler in pooled hours
    python regimes.py; python regimes_plot.py   # double exponential against one and two breaks, regimes.png

numpy, pyyaml, matplotlib and Pillow (shared venv), and node for the site's fit.

## One source for each thing

- **The fit** is `tools/horizon-fit.mjs` alone; its header describes it.
  `fit.py` calls it through `bridge.py` and `bridge.mjs` (one node process per
  Python session, JSON lines, unrounded).
- **The figure's series** is the table in `content/home/horizons.md`, read by
  `series.models()` with the build's own reader. `series.from_sources()`
  rebuilds it from METR's v1.1 file and the AECI readings as a check, not a
  second source; `python series.py` compares them.
- **Model names** are `series.REGISTRY`; `series.PAIRINGS` says what each
  internal checkpoint is, with a status (stated, supported, speculative) and
  its evidence; `series.PUBLIC` holds the 14 released Claude models;
  `series.CARD` Fable 5.2's card values.
- **Epoch's data** is the 12 November snapshot; the 19 November model pages
  are used only where a study says so. Plot labels are computed.

## Inputs

Retrieved 2026-11-11 unless dated; local copies in `data/`.

- `benchmark_results_1_1.yaml`: METR's horizons, v1.1,
  `https://metr.org/assets/benchmark_results_1_1.yaml`.
- `aeci-main.png`: the AECI chart in METR's assessment of AI R&D acceleration
  at Anthropic (5 Nov 2026),
  `https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/`.
  No numbers were published; `series.py` holds each point's pixel centroid
  (Model 4 reads 178.63 against 178.6 in METR's text). The chart dates models
  by internal availability, 3 to 13 days before release for public models.
- `epoch-2026-11-12/`: `https://epoch.ai/data/benchmark_data.zip`;
  `epoch-2026-11-19/model_pages.json`: the props in Epoch's model pages for
  GPT-6.2 Astra, Fable 5.2 and GPT-6 Astra.
- `openai-2026-11-18/`: the Vega-Lite datasets in
  `https://openai.com/index/research-acceleration-jagged-frontier/`.
  openai.com refuses scripted fetches (403); read in the browser pane.
- `metr-2026-11-20/json/`: each figure's "Data" link in
  `https://metr.org/blog/2026-11-20-q4-2026-capability-update/` (plain curl
  works): `cad6b5d98261f80c` the pooled suite (Fig. 10), `8835b7b420aed38c`
  its task sets apart (Fig. 11), `e401db69f8d499a7` MCI (Fig. 12),
  `d2d1f05c433c83d2` and `85b25e40045da867` alternative task times (Figs. 25,
  23); MCI for GPT-6 Luna and Haiku 5.5 from Fig. 39.
- `anthropic-2026-11-fable-5-2-card/`: Fable 5.2's system card (as Claude
  Mythos 5.2),
  `https://assets.claude.com/27d60918d218125e7504bc7354c4b4626ec56b11.pdf`,
  Table 2.3.5.3.A and Figure 2.3.5.3.B.
- The tweet, `https://x.com/ben_j_todd/status/2119787039210049930`, and
  Nikola Jurkovic's map, `TH = 3.46 h * exp(0.148 * (AECI - 150))`,
  `https://x.com/nikolaj2030/status/2118777653981507716`.

## Before changing the figure's inputs

- Edit the table in `content/home/horizons.md`; no fit numbers live anywhere
  else. A row from a new source needs that source in `series.from_sources()`.
- Keep the content file's dating rules: measured models by public release,
  AECI points by the chart's internal dates.
- Records are running records: restarting one later lets in models below the
  standing record, and a model released the same day as a better one doesn't
  count.
- Keep AECI from METR's chart, one fit of 21 points; the card is a later
  refit, and splicing it in would mix fits.
- New names go in `series.REGISTRY`, checkpoint identities in
  `series.PAIRINGS`. Pre-release snapshots (Model 3) stay out of
  `series.PUBLIC`, or a pairing compares two snapshots.
- The map is calibrated to AECI 162 and used up to 179, and METR's pooled
  suite says it runs high there; anything added above 162 inherits that.

## What would settle it, and limits

- On the figure's fit the hyperbola's and double exponential's AECI bands
  separate by 2027.25, so a frontier AECI or horizon from spring 2027 decides.
  A date passing is a poor test, since a refit moves it; a date receding as
  fast as the calendar is the sign the form is wrong, and on METR's pooled
  ruler it now does.
- On the pooled ruler every curve reaches 200 h, the suite's longest
  threshold, in the first half of 2027, so the suite probably runs out before
  it separates them.
- The bootstrap treats the 25 residuals as exchangeable; record holders are
  selected and the seven converted points share one lab and one conversion,
  so intervals and AICc gaps are too confident. The points' own uncertainty
  is in the bars, not the fit's intervals (Model 4 240 h, 67 to 2,100).
- The map is one straight line; its interval covers slope and level, not
  shape. No curves with more than four parameters. A 50% horizon going to
  infinity is a statement about a benchmark statistic (Toby Ord, under the
  tweet); not examined here.

## Studies

**The 11 November check** (`replicate.py`). Does the plot hold up? The map is
the least-squares line through the eight Claude models with both scores (4.68
points per doubling, 95% 4.36 to 5.06), which is Jurkovic's. On the tweet's
series the hyperbola leads by 10 AICc, but the lead shrinks or goes when the seven
converted points are removed, replaced or redated; dating everything by public
release gives 2027.98, public Epoch ECI in place of late AECI 2028.77. Only 13%
of double-exponential histories are at least as straight as the data, but the fitted
date lands about a year out whichever curve made them. The date's path is what
separates them: since December 2024 its drift is Kendall's tau 0.00, which only
1.5% of double-exponential histories drift as little; it leans on the same converted
points.

**ECI as a third scale** (`three_scales.py`, `eci_gap.py`,
`software_route.py`). On ECI the hyperbola's support goes (2028.3 to 2028.8,
2 to 14 AICc behind). Claude sits 0.42 doublings (se 0.15) above other labs'
horizon line on ECI; that is domain mix, not measurement bias: on Epoch's
software and agentic benchmarks alone its offset is −0.22 (se 0.31). Epoch's
software ECI backs the AECI route for public Claude models and puts the
checkpoints 0.2 to 0.4 doublings lower.

**OECI** (`oeci.py`). Does OpenAI's index show less acceleration than AECI? In
horizon units it is as fast (2026 pace 4.6 doublings a year for OpenAI, 4.5
for Claude), and AECI's extra pace comes from its ruler: 1.49 AECI points per
OECI point (se 0.08). Across labs OECI carries no agentic information beyond
math, science and games (agentic weight 0.00).

**GPT-6.2 Astra by several routes** (`oeci_routes.py`). As the AECI of a
Claude model with the same horizon, it is 180 to 183 carried straight onto
AECI and 168 to 177 through METR-calibrated maps (Model 4 is 178.6): which
ruler matters more than which lab. Its estimate rests mostly on games and one
agentic benchmark.

**Picking benchmarks to imitate AECI** (`aeci_subset.py`,
`aeci_imitation.py`; a9's idea, speculative). Picking by fit overfits; picking
by domain works: software and agentic benchmarks fitted through Opus 4.8
predict the next four Claude AECIs to 0.5 points rms, against 1.9 for the full
set, so the AECI–ECI bend is domain mix plus a constant scale factor. Four
models: suggestive, not settled.

**METR's capability update** (`metr_q4.py`). On METR's pooled suite AECI buys
a doubling every 7.32 points (95% 6.37 to 8.59), not 4.68, and against MCI
AECI stretched 1.56x (se 0.18) after October 2025. Rebuilt on that ruler the
fit gives 2028.70 (2028.14 to 2029.48) and the date moved out 0.8 to 1.1 years
since December 2025. TH2 verifiable alone keeps the old slope (4.33). Reading
(synthesis): the fork is the ruler at the top. I lean to the pooled suite,
without much confidence, because MCI needs no human time estimates and agrees
with it; against that, an IRT index lags at the frontier, and METR warns the
switch to TH2 slows the pooled trend while it is under way.

**Beside the public rulers** (`metr_rulers.py`, `ruler-hours.png`). Against
MCI only AECI bends (×1.51, se 0.14; the public rulers ×1.03 to ×1.16).
Calibrated on pooled hours, every ruler gives a 2.5 to 3.9-month doubling in
2026 and the singularity at 2028.7 to 2028.9. None of it checks the
checkpoints, which only AECI scores.

**Regimes or smooth acceleration** (`regimes.py`). One drop in the doubling
time is real (spring 2024, 8.5 to 8.6 months down to 3.3 to 3.6); a second
appears only on the figure's series, where it is the checkpoints through the
v1.1 map. Smooth acceleration and one drop are within 1 to 3 AICc. Knots count
as one parameter each, which flatters the break models in AICc.

**Fable 5.2's system card** (`series.CARD`). Model 3 is Fable 5.2 (card
177.12, chart 176.96) and Model 4 an unreleased internal research model (card
178.78, chart 178.63); the card is a later refit, and swapping it in moves the
date from 2027.645 to 2027.639. Matched agentic benchmarks had predicted 177.1;
ECI and OECI 181.3 to 182.4. The card's own 1.88x slope change rests on its
two newest points.
