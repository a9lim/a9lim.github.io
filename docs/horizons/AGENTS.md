# horizons

The analysis behind the figure at a9l.im/#fits ("In the foothills of the
singularity", `content/home/horizons.md`, fitted at build time by
`tools/horizon-fit.mjs`). It began on 9 November 2026 as a check of Benjamin
Todd's plot of log AI time horizon against log time left until a fitted
singularity: a straight line, August 2027, exponent 5.6. It lived in another
workspace as `reverse-log` until 2026-11-20; a pointer there leads here. Work
of a9 and Claude, 11–20 November 2026. Nothing here is staged or deployed;
`data/`, the plots and `result.json` are ignored, and all but `data/`
regenerate from the scripts.

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
  `fit.fit_horizons`, `fit.hyp` and `fit.dexp` call it through `bridge.py` and
  `bridge.mjs` (one node process per Python session, JSON lines, unrounded).
- **The figure's series** is the table in `content/home/horizons.md`, read by
  `series.models()` with the build's own reader (`readHorizons`).
  `series.from_sources()` rebuilds it from METR's v1.1 file and the AECI
  readings as a check, not a second source; `python series.py` compares them.
- **Model names** are `series.REGISTRY`, one row per model in each source's
  spelling. `series.PAIRINGS` says what each internal checkpoint is, with a
  status (stated, supported, speculative) and its evidence. `series.PUBLIC`
  holds the 14 released Claude models; `series.CARD` Fable 5.2's card values.
- **Epoch's data** is the 12 November snapshot, read once in `series.py`; the
  19 November model pages are used only where a section says so.
- **Plot labels** are computed by the script that prints the number.

## Inputs

Retrieved 2026-11-11 unless dated; local copies in `data/`.

- `benchmark_results_1_1.yaml`: METR's horizons, v1.1,
  `https://metr.org/assets/benchmark_results_1_1.yaml`. Its last measured
  record holder is an early Mythos Preview checkpoint, 17.4 h (CI 8.5 to 55),
  dated 2026-04-07 (the public Mythos Preview release).
- `aeci-main.png`: the AECI chart from METR's assessment of AI R&D acceleration
  at Anthropic (5 Nov 2026),
  `https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/`.
  No numbers were published: `series.py` holds each point's pixel centroid,
  converted with the x ticks and one line through the seven y ticks (Model 4
  reads 178.63 against 178.6 in METR's text); `aeci_whiskers.py` reads the
  whiskers (95% bootstrap over benchmarks; −8/+14 at Model 4). The chart dates
  models by when most Anthropic staff could use them: 3 to 13 days before
  release for public models, 25 for Mythos 5.1.
- `epoch-2026-11-12/`: `https://epoch.ai/data/benchmark_data.zip` (scores,
  every benchmark result, fitted difficulties and slopes);
  `epoch-2026-11-19/model_pages.json`: per-benchmark scores for GPT-6.2 Astra,
  Fable 5.2 and GPT-6 Astra, from the props in Epoch's model pages.
- `openai-2026-11-18/`: the Vega-Lite datasets in OpenAI's report,
  `https://openai.com/index/research-acceleration-jagged-frontier/` (48 models
  with 90% intervals; 96 benchmark versions with category, difficulty and model
  count). openai.com refuses scripted fetches (403); they were read in the
  browser pane and copied over.
- `metr-2026-11-20/json/`: datasets behind METR's "AI R&D-relevant model
  capabilities are improving rapidly and are getting harder to measure",
  `https://metr.org/blog/2026-11-20-q4-2026-capability-update/` (each figure's
  "Data" link; plain curl works), with `post.html`/`post.txt`.
  `cad6b5d98261f80c` (Fig. 10): the pooled suite, TH1.1 plus TH2 (36 new tasks
  up to 200 h, mostly researcher-estimated times). `8835b7b420aed38c` (Fig. 11):
  TH1.1 at xhigh effort, TH2 verifiable (8 families) and MirrorCode apart.
  `e401db69f8d499a7` (Fig. 12): MCI, METR's IRT index over its own tasks, in
  days (GPT-4o 0, Opus 4.6 633). `d2d1f05c433c83d2`, `85b25e40045da867` (Figs.
  25, 23): pooled horizons under longer TH2 times and model-estimated times.
  MCI for GPT-6 Luna and Haiku 5.5 is from Fig. 39.
- `anthropic-2026-11-fable-5-2-card/`: Fable 5.2's system card (published as
  Claude Mythos 5.2),
  `https://assets.claude.com/27d60918d218125e7504bc7354c4b4626ec56b11.pdf`;
  Table 2.3.5.3.A is AECI on Anthropic's 6 November refit, Figure 2.3.5.3.B
  the internal dates.

The tweet: `https://x.com/ben_j_todd/status/2119787039210049930`. The map is
Nikola Jurkovic's, `TH = 3.46 h * exp(0.148 * (AECI - 150))`,
`https://x.com/nikolaj2030/status/2118777653981507716`, which he called weak
evidence for scores this high.

## Before changing the figure's inputs

- Edit the table in `content/home/horizons.md`; no fit numbers live anywhere
  else. A row from a new source needs that source in `series.from_sources()`
  so `python series.py` still agrees.
- Keep the content file's dating rules: measured models by public release,
  AECI points by the chart's internal dates.
- Records are running records. Restarting one at a later date lets in models
  below the standing record; a model released the same day as a better one
  doesn't count.
- Keep AECI from METR's chart, one fit of 21 points. The card is a later
  refit, and splicing it in would mix fits.
- New names go in `series.REGISTRY` (two spellings of one model were once
  counted twice), checkpoint identities in `series.PAIRINGS`. Pre-release
  snapshots stay out of `series.PUBLIC`: Model 3's AECI is a snapshot METR
  found stronger than the release, so pairing it with the release's ECI or
  OECI compares two snapshots.
- The map is calibrated to AECI 162 and used up to 179, and METR's pooled
  suite says it runs high there. Anything added above 162 through it inherits
  that.

## The 11 November check

`replicate.py`, `chart.py`. **Series**: 25 record holders, 18 measured (GPT-2
to the early Mythos Preview checkpoint, which the chart dates 2026-02-24,
before Mythos Preview) and 7 internal Anthropic models with only AECI (Mythos
Preview to Model 4). **Map**: least squares through the eight Claude models
with both (3 Opus to the early checkpoint), 4.68 points per doubling (95% 4.36
to 5.06), 3.46 h at AECI 150, residual 0.23 doublings: Jurkovic's map to the
digits he gave. **Fit**: the site's, hours and AECI views, a hyperbola
`a - alpha*log2(t_c - t)` and a double exponential in each, 2,000 bootstrap
replicates that redraw the map and resample residuals. Redrawing the map
matters: its slope interval alone moves the date from 2027.52 to 2027.80. The
points' own intervals aren't resampled, since METR's are correlated across
models. The hours view fits 2027.65 (2027.40 to 2028.00) with 5.59 doublings
per halving of the time left, the AECI view 2027.63 (2027.38 to 2027.97) and
5.57. The tweet's inputs (the file's date for the early checkpoint, Jurkovic's
constants) give 2027.63 and 5.54, against its August 2027 and 5.6.

**Variants** (hours view; AICc margin over the best of exponential, double
exponential, quadratic and one slope change):

| Series | Fitted singularity (95%) | Hyperbola against the rest |
|---|---|---|
| The figure's | 2027.65 (2027.40 to 2028.00), r 0.997 | ahead by 10 |
| Early checkpoint dated as the file dates it | 2027.63 (2027.38 to 2027.98) | ahead by 11 |
| Measured only | 2027.73 (2027.23 to 2028.48) | tied |
| GPT-4 onward | 2027.60 (2027.29 to 2028.23) | behind by 3 |
| A flatter map past the last measured model (5.26 points per doubling) | 2027.89 (2027.65 to 2028.20) | ahead by 4.5 |
| Public release dates throughout | 2027.98 (2027.66 to 2028.48) | ahead by 2 |
| Late AECI rescaled onto Epoch's scale | 2028.30 (2027.85 to 2028.93) | behind by 3 |
| Public Epoch ECI after April 2026 instead of AECI | 2028.77 (2028.19 to 2029.69) | behind by 9 |

Public dates drop the four checkpoints with none and take Model 3 as Fable 5.2
(2026-11-09); without that point, 2027.86 (2027.53 to 2028.37). The rescaling is
AECI ≈ 1.35 x ECI − 53 over released models above ECI 150.

- **Straightness proves little.** Of 1,500 histories simulated from the fitted
  double exponential (same dates and noise, record holders only), 13% are at
  least as straight as the real data; from one slope change, 1.2%. The x-axis
  spans 0.97 orders of magnitude, 0.69 since GPT-4.
- **One fitted date means little.** Whichever curve made the histories, the
  date lands about a year past the last point (medians 0.93 to 1.18 yr; the
  real data's is 0.91).
- **Whether the date holds does mean something.** Under a double exponential the date fitted
  at each origin slides about 0.9 yr later per year of data; under a hyperbola
  it stays. Over 16 origins since December 2024 the real date wandered between
  2026.7 and 2028.2 with Kendall's tau 0.00 (double-exponential histories
  +0.87, hyperbolic +0.05): 1.5% of double-exponential histories drift as
  little, 18% of slope-change ones, 47% of hyperbolic ones. A flatter map,
  public dates and late AECI on Epoch's scale give tau +0.17, +0.13 and +0.50
  (2.9%, 4.3% and 17% of double-exponential histories). On public Epoch ECI
  the date slid 0.76 yr (tau +0.68, 43%), as the double exponential expects.
  This was the check's strongest evidence for the hyperbola, and it leans on
  the same converted points.
- **Backtest** (rolling, 17 origins, half-year errors in doublings): the
  hyperbola forecasts best and alone without bias (0.69 rms, bias +0.09;
  double exponential 0.88 and +0.72), but on measured points alone the slope
  change is best (0.52) and the hyperbola third (0.81). Every origin's 95%
  interval covered every later estimate bar one; leaving out any one point
  moves the date by at most 0.04 yr.
- **Common ground.** Every fitting curve reaches a one-work-year 50% horizon in
  2027 (hyperbola 2027.02, double exponential 2027.24, slope change 2027.56).
  AI Futures (10 November,
  `https://blog.aifutures.org/p/q35-timelines-update-looks-like-the`) puts a
  superhuman AI researcher at July 2027, but its largest input is the same
  METR report.

## What would settle it

Record 50% horizon each curve implies (hours from the hours view, AECI from
the AECI view; the slope change has no band):

| Date | Hyperbola | Double exponential | One slope change |
|---|---|---|---|
| 2027.00 | 1,700 h (690 to 5,400); AECI 192 (188 to 198) | 610 h (350 to 1,100); AECI 185 (182 to 188) | 330 h; AECI 181 |
| 2027.25 | 26,000 h (4,300 to 720,000); AECI 211 (201 to 233) | 2,100 h (1,000 to 4,500); AECI 193 (190 to 197) | 740 h; AECI 186 |
| 2027.50 | 7 million h (58,000 to ∞); AECI 251 (221 to ∞) | 7,800 h (3,200 to 21,000); AECI 202 (198 to 207) | 1,600 h; AECI 192 |

The AECI bands separate by 2027.25, so a frontier AECI or horizon from spring
2027 decides. A date passing is a poor test, since a refit moves it; a date
receding as fast as the calendar is the sign the form is wrong, and on METR's
pooled ruler it now does. On that ruler (series with the checkpoints):

| Date | Hyperbola | Double exponential |
|---|---|---|
| 2027.00 | 142 h (94 to 230) | 106 h (80 to 145) |
| 2027.25 | 430 h (230 to 990) | 239 h (168 to 361) |
| 2027.50 | 1,600 h (630 to 7,100) | 560 h (360 to 960) |

Every curve reaches 200 h, the pooled suite's longest threshold, in the first
half of 2027 (METR's own line at 2027.53, its "July 2027"), with bands
overlapping, so the suite probably runs out before it separates them. One 2024
break and the double exponential ("Regimes") are 82 h against 106 h at 2027.0
and 960 h against 3,700 h by 2028.0.

## Limits

- The bootstrap treats the 25 residuals as exchangeable. They aren't: record
  holders are selected, and the seven converted points share one lab and one
  conversion, so intervals and AICc gaps are too confident.
- The points' own uncertainty is in the bars, not the fit's intervals, and it
  is large for converted points (Model 4 240 h, 67 to 2,100).
- The map is one straight line, calibrated only to AECI 162 and used to 179;
  its interval covers slope and level, not shape.
- No curves with more than four parameters.
- A 50% horizon going to infinity is a statement about a benchmark statistic
  (Toby Ord, under the tweet); not examined here.

## ECI as a third scale

Epoch's ECI as a third view (2026-11-12, on a branch of the figure a9
dropped), each view on its own running record, the pool gaining models only
Epoch scores. `three_scales.py`, `conversions.py`, `eci_gap.py`,
`software_route.py`, `software_fit.py`.

- **On ECI the hyperbola's support goes**: 2028.3 to 2028.8 by conversion and
  pairings, hyperbola 2 to 14 AICc behind, drift test failing (tau about +0.9).
- **Claude scores lower on ECI than other labs at equal measured horizon**:
  0.42 doublings above the shared line (se 0.15, 20 models), about 2 ECI
  points, growing to 3.9 at a working day. Inside Claude, AECI and ECI agree
  within a point to Opus 4.6, then part by 6 at Opus 5.5.
- **The gap is domain mix, not measurement bias** (`eci_gap.py`). Against its
  own ECI Claude is strongest on agentic coding and research (MirrorCode +9,
  DeepResearch Bench +11) and weakest on GeoBench (−19), math and science QA.
  On Epoch's software and agentic-coding benchmarks alone Claude sits on the
  other labs' horizon line (offset −0.22, se 0.31, against +0.48 on full ECI).
  Horizon tracks Epoch's agentic benchmarks the same way across labs to about
  ±0.3 doublings, so METR's per-model scaffolds show no Claude-specific lift.
- **AECI** is Anthropic's run of Epoch's IRT code on 15 Anthropic-chosen
  benchmarks at about 5 to 7 times Epoch's token budget. Against Epoch's
  software measure it runs a steady 1.5 to 3 ahead since Opus 4.7, an
  elicitation offset the hours view absorbs; against science, up to 16 ahead.
- **Through Epoch's software ECI** horizon has no lab offset (4.13 points per
  doubling, 16 models) and agrees with the AECI route for public Claude models
  (Opus 5.5 116 h against 133). For the checkpoints it runs 0.2 to 0.4
  doublings lower, moving the date to 2027.71 to 2027.78; with no AECI at all,
  2027.96 (2027.50 to 2028.75), hyperbola 3.7 AICc ahead.
- Synthesis: if AI R&D automation runs on agentic software and ML engineering,
  the horizon and AECI views measure the right thing, and the open risk is
  AECI's own trend (Anthropic-run, saturating, METR's link-function range of
  1.1x to 2.9x), not cross-lab bias.

## OECI

OpenAI's 18 November report introduces OECI, Epoch's method on public plus
internal OpenAI benchmarks, fitting 16.4 points/yr to OpenAI's records since
GPT-5 against Epoch's 14/yr. a9's question: does it show less acceleration
than AECI? `oeci.py` (reproduces OpenAI's 16.39/yr), `oeci_plot.py`,
`oeci_routes.py`.

- **No ruler curves inside OECI's window** (August 2025 to November 2026): a
  straight line in points is best or tied by AICc on every record series. OECI
  starts at GPT-5, so it can't test the long-window shape.
- **In horizon units every ruler is fast.** 2026 frontier pace in doublings a
  year, OpenAI and Claude: OECI 4.6 and 4.5, ECI 4.5 and 4.8, software ECI 5.4
  and 5.3; AECI 6.1. OECI's map is derived (ECI's 4.74 points per doubling
  times OECI's within-lab slope on ECI, 0.89 for OpenAI, 0.87 on the 19
  November pages), since only five OECI models have a METR horizon. Its 2026
  pace is a 2.6-month doubling, so "16.4 against 14" understates it.
- **AECI's extra pace comes from its ruler.** On the same 7 public Claude
  models AECI moves 1.49 points per OECI point (se 0.08) and 1.36 per ECI
  point. On OECI, ECI or software ECI, Claude's and OpenAI's 2026 paces can't
  be told apart.
- **Across labs OECI carries no agentic information beyond math, science and games.** Only 9 of 96 benchmarks are fitted
  on 20 or more of the 48 models, none of them software, computer-use,
  cybersecurity or AI research. Regressed on Epoch's domain groups, OECI puts
  agentic at 0.00 (bootstrap 10–90%: 0.00 to 0.00), math+science 0.57, games
  0.43. With a common slope Claude sits 2.9 (se 0.5) below OpenAI.
- **GPT-6.2 Astra** (ECI 174.17), as the AECI a Claude model with the same
  horizon would have: 180 to 183 carried straight onto AECI's 2026 Claude
  line; 168 to 177 (50 to 190 h) through METR-calibrated maps or rebuilt domain
  components; 171.5 to 175 on the software route, the one that matched AECI
  for public Claude models (Model 4 is 178.6). On any one ruler Fable 5.2 and
  GPT-6.2 Astra are within −1 to +4 points: which ruler matters more than which
  lab. Caveats: the domain estimates drop saturated scores (both models are at
  100% on FrontierMath Tier 4); GPT-6.2 Astra has one agentic benchmark,
  MirrorCode; Epoch's 174 rests mostly on games.

### Picking benchmarks to imitate AECI

a9's idea, flagged by a9 as speculative and not evidence. `aeci_subset.py`,
`aeci_imitation.py`. The estimator is each model's maximum-likelihood ability
on a subset under Epoch's difficulties and slopes, saturated scores kept,
prior N(160, 100²); on all 56 benchmarks it reproduces Epoch's ECI (slope
0.99, r 0.998). An N(160, 30²) prior shrinks low-information models toward
160; don't use it.

- **Picking by fit overfits**: in nested leave-one-out every pick size from 1
  to 15 does worse than the full set (1.8 to 6.2 rms against 1.1).
- **Picking by domain works.** Software and agentic benchmarks fitted through
  Opus 4.8 predict AECI for the next four Claude releases to 0.5 points rms;
  the full set misses by 1.9, all low. Four models: suggestive, not settled.
  AECI runs 1.26 points per point of agentic ability, the same slope in 2026
  as over the whole range, so the AECI–ECI bend is domain mix plus a constant
  scale factor. (`oeci_routes.py`'s domain estimates, which drop saturated
  scores, had put domain mix at about half of AECI's 2026 stretch.)
- **Against METR horizons** the agentic measure is noisier than ECI (scatter
  0.49 against 0.39) but lab-neutral (Claude offset −0.07, se 0.27, against
  +0.48). Fitted before mid-2025, every measure over-predicts the later
  horizons. That METR's suite runs short at the top is a guess from this; if
  true it bears on the map above its calibrated range.
- **On it**, in 2026 OpenAI's frontier climbs 26.6 points/yr, Claude's 25.9,
  Google's 22.2: OpenAI is speeding up as fast as Anthropic.

## METR's capability update

METR's 20 November post measures public models through Opus 5.5 and GPT-6
Astra. a9 asked what it does to the fit. `metr_q4.py`, `metr_q4_plot.py`. On
the pooled suite GPT-6 Astra is 40 h (13 to 2,645) and METR's trend a
3.61-month doubling (2.08 to 4.94); TH2 verifiable doubles every 1.65 months
in 2026. Below 5 h the pooled suite reads what v1.1 read (−0.09 doublings over
GPT-4o, o1, GPT-5 and Opus 4.5), so it splices onto v1.1 at GPT-4o unadjusted;
TH1.1 at xhigh effort reads 0.3 to 0.8 doublings above v1.1, and the harder
TH2 tasks offset that stronger elicitation.

**The map past AECI 162**, now measured:

| Model | AECI | Map (v1.1 hours) | Pooled | Residual (doublings) | TH2 verifiable | MCI |
|---|---|---|---|---|---|---|
| Opus 4.5 | 152.3 | 4.9 h | 4.6 h | −0.09 | | 533 |
| Opus 4.6 | 157.3 | 10 h | 6.4 h | −0.66 | 1.1 h | 633 |
| Opus 4.7 | 160.3 | 16 h | 8.4 h | −0.92 | 2.5 h | 631 |
| Opus 4.8 | 163.4 | 25 h | 12 h | −1.09 | 3.6 h | 709 |
| Fable 5 | 168.6 | 54 h | 16 h | −1.80 | 6.1 h | 779 |
| Opus 5 | 169.3 | 61 h | 20 h | −1.60 | 10 h | 796 |
| Fable 5.1 | 172.5 | 97 h | 30 h | −1.68 | 15 h | 839 |
| Opus 5.5 | 174.6 | 133 h | 39 h | −1.77 | 20 h | 854 |

- On the pooled ruler AECI buys a doubling every 7.32 points (95% 6.37 to
  8.59), not 4.68. Through it Model 4 is 50 h and Model 3 43 h, against 240 h
  and 188 h. v1.1's saturation doesn't explain it: without Opus 4.6 and the
  early checkpoint the v1.1 map is 4.57 points per doubling.
- TH2 verifiable disagrees: 4.33 points per doubling, the old slope, about 3
  doublings lower in level.
- MCI sides with the pooled suite: pooled hours are linear in MCI across every
  lab (0.94 doublings per 100 MCI, no curvature).
- **AECI stretches against MCI**: 4.30 points per 100 MCI before October 2025,
  6.71 after, a ratio of 1.56 (se 0.18); a joined line changing at Opus 4.5
  puts the change at 4.4 standard errors. That is about the 1.53x slope change
  the Opus 5.5 system card reports (METR, Appendix H). METR's own Anthropic
  slope change in MCI is 1.26x calibrated on every lab, 1.46x on Anthropic
  alone, intervals about 0.6 to 2 or 3.

**The series on the pooled ruler** (v1.1 records to GPT-4 Turbo, pooled from
GPT-4o, and from the third row the checkpoints through the pooled map):

| Series | Fitted singularity (95%) | Hyperbola against the rest | Drift: tau, move since Dec 2025 | Share of hyperbolic histories drifting less |
|---|---|---|---|---|
| Pooled records alone (GPT-4o to GPT-6 Astra) | 2087 (2030 to never) | behind by 4.7 (an exponential, 3.6-month doubling, is best) | +1.00, +0.78 yr | — |
| v1.1 then pooled, measured only | 2028.85 (2028.22 to 2029.82) | tied (+0.1) | +0.67, +0.97 yr | 87%, 95% |
| The same with the checkpoints | 2028.70 (2028.14 to 2029.48) | behind by 1.9 | +0.87, +0.83 yr | 97%, 92% |
| Longer Train a Program and Minecraft times | 2028.88 (2028.28 to 2029.72) | behind by 2.9 | +0.85, +0.96 yr | 97%, 95% |
| TH2 times above score 0.5 four times longer | 2029.01 (2028.39 to 2029.89) | behind by 4.0 | +0.89, +1.10 yr | 98%, 96% |
| Model-estimated task times | 2027.77 (2027.43 to 2028.29) | ahead by 4.3 | −0.50, −0.29 yr | 25%, 34% |
| The figure's series (for reference) | 2027.65 (2027.40 to 2028.00) | ahead by 9.8 | 0.00, −0.36 yr | 47%, 17% |

On rows two to five the date moved out 0.8 to 1.1 years in the 0.8 years
since December 2025, which hyperbolic histories do 2% to 14% of the time and
double-exponential and slope-change ones 14% to 62%. The exception,
model-estimated times, compresses the older models (o1 0.3 h) and puts GPT-6
Astra at 65 h. On MCI as the series a straight line is best; with the
checkpoints carried onto MCI (Model 4 at 926) the best curve is one slope
change at the end of 2025 (1.28x), all five curves within 2 AICc.

**Reading** (synthesis): the fork is the ruler at the top. On the pooled
suite or MCI the singularity moves to late 2028 or leaves, and the date is
sliding; on AECI or TH2 verifiable, mid-2027 stands. For the figure: METR
warns (footnote 54) that switching to the harder TH2 makes the pooled trend
look slower while the switch is under way. Against it: METR guesses narrow
sets like TH2 verifiable run fast, and its two broader summaries take the
first side. I lean that way, without much confidence, because MCI needs no
human time estimates and still agrees; but an IRT index lags at the frontier.
Nothing here measures the checkpoints: the pooled map puts Model 4 at 50 h, a
third of a doubling above GPT-6 Astra's measured 40 h.

**Limits.** Pooled horizons above 20 h have intervals of one to two orders of
magnitude; the fits use point estimates. The pooled map has 8 points over 22
AECI points, seven of them also on the TH2 verifiable map, which disagrees.
METR dates by public release; the checkpoints keep the chart's dates.

### Beside the public rulers

How METR's measurements compare with ECI, its software and agentic subsets,
and OECI. `metr_rulers.py` (abilities from `aeci_subset.py`'s estimator on the
19 November pages), `rulers_plot.py`; `ruler-hours.png` shows the section in
one picture.

- **Against MCI only AECI bends.** One joined line per ruler, its slope
  changing at Opus 4.5's MCI: ECI, software and agentic change by ×1.03 to
  ×1.16 (se 0.09 to 0.30), on every lab or Claude alone; AECI by ×1.51 (se
  0.14). OECI scores almost nothing before the kink and is the most compressed
  ruler after it. AECI's records climb 15.4 points a year before October 2025
  and 29.3 after, the 1.9x METR reports.
- **Against pooled hours** (log2 h on the ruler, with a Claude offset) ECI,
  software, agentic and OECI need 4.69 to 5.34 points per doubling, AECI 7.32
  (6.54 to 8.30), MCI 106 with one line for every lab. Calibrated on v1.1, the
  public routes miss the pooled measurements since April 2026 by about half a
  doubling (−0.45 to −0.52), AECI by one and a half (−1.48): a third of AECI's miss is a change
  of ruler every index shares, the rest, about a doubling, its own. OECI's
  Claude offset (+0.81, se 0.09) is its non-agentic weighting.
- **The 2026 pace agrees** once each ruler is calibrated on pooled hours: a
  2.5 to 3.9-month doubling for Anthropic and OpenAI on every ruler, AECI
  included. Every lab's measured pooled record climbs 4.4 ± 0.4 doublings a
  year in 2026, against 3.3 for METR's line since 2024, about 1.3x.
- **Unmeasured public models** (Fable 5.2 73 to 76 h through ECI and OECI;
  GPT-6.2 Astra 67 h and 47 h) refit to 2028.74 (2028.21 to 2029.53) through
  ECI and 2028.71 (2028.19 to 2029.47) through OECI, the date out 0.84 to 0.97
  years since December 2025.

**Reading** (synthesis): METR's measurements and the public rulers agree on
2028.7 to 2028.9. The one input that says mid-2027 is AECI's scale above Opus
4.5, and no public ruler, nor METR's index, shows that bend. None of it checks
the checkpoints, which only AECI scores.

## Regimes or smooth acceleration

a9 asked whether the evidence favors a double exponential or an exponential
whose doubling time drops twice. `regimes.py`, `regimes_plot.py`. The
two-break curve is `fit.fit_pw2` (knots on a 0.05-year grid, at least half a
year apart, two dates after each); the breaks predict no acceleration after
the last knot. The second column is how often each model's own histories fit
at least as unevenly as the real series; small counts against it.

| Series | AICc: double exp. / one break / two | Simulated: double-exp. / two-break histories as uneven | A second drop by chance (one-break histories) | Half-year forecast rmse: double exp. / one / two |
|---|---|---|---|---|
| The figure's | −26.8 / −16.2 / **−38.7** | 2% / 24% | 0% | 0.88 / 1.05 / 1.19 (hyperbola 0.69) |
| v1.1 measured only | −18.5 / **−20.1** / −14.1 | 32% / 18% | 55% | 0.74 / **0.52** / 0.88 |
| v1.1, then pooled, measured | **−22.6** / −21.6 / −14.4 | 52% / 11% | 69% | **0.33** / 0.45 / 0.66 |
| The same with the checkpoints (pooled map) | −26.8 / **−27.9** / −19.5 | 48% / 15% | 92% | **0.21** / 0.32 / 0.42 |
| The same measured, then public models through ECI | **−24.0** / −20.9 / −18.9 | 31% / 17% | 21% | **0.40** / 0.55 / 0.74 |

- **One drop is real**: spring 2024, from an 8.5 to 8.6-month doubling to 3.3
  to 3.6, on every measured series including v1.1 alone, so not the change of
  ruler. Its knot sits between GPT-4 Turbo (November 2023) and GPT-4o (May
  2024).
- **A second drop is not in the measured data**: one-break histories gain as
  much by chance (55% to 92%). It wins only on the figure's series, where it
  (December 2025, 3.5 → 1.9 months) is the checkpoints through the v1.1 map.
- **The data don't choose between smooth acceleration and one drop** (AICc
  within 1 to 3). Forecasts lean to the double exponential on the pooled
  ruler; one break runs low. METR's records double every 8.5 months in
  2019–2023, 3.4 in 2024–25 and 2.7 in 2026, only 1.9 standard errors from
  2024–25.
- **Reading** (synthesis): smooth acceleration, or one regime change in 2024
  with 2026 a little ahead of it; not two drops.
- **Limits.** Knots count as one parameter each in AICc, which flatters the
  break models; the simulations and leave-one-out refit them. The splice at
  GPT-4o sits where the 2024 knot lands, but v1.1 alone puts it there too.

## Fable 5.2's system card

`series.CARD`; `python series.py` sets it beside the readings of METR's chart.

- **Model 3 is Fable 5.2, and Model 4 is not.** The card's Fable 5.2 (177.12,
  21 Sep) matches Model 3 (176.96, 22 Sep); its unreleased internal research
  model (178.78, 25 Sep) matches Model 4 (178.63, 25 Sep). METR's note in the
  card names the snapshot it tested Model 3 Early. The card scores the
  snapshot Anthropic judged most capable on AI R&D, and METR says the snapshot
  it tested was stronger on AI R&D than the release. Model 2 and Model 2 Early stay
  speculative (`series.PAIRINGS`).
- **Two fits, not a misreading.** The card's values are Anthropic's later
  refit ("each refit reestimates the whole scale"), 0.06 to 0.16 above the
  chart with order and gaps intact. The figure keeps the chart: swapping the
  card into the four rows it covers moves the date from 2027.645 to 2027.639.
- **The agentic routes predicted it; the broad indices didn't.** Fable 5.2's
  agentic scores matched against Opus 5.5 (5 shared benchmarks) gave 177.1,
  within 0.02 of the card. ECI and OECI carried straight onto AECI gave 181.3
  to 182.4, 4 to 5 high, because its gains sit outside agentic work (SimpleQA
  at 94%). Where AECI goes, the agentic benchmarks follow.
- **The card's own trend**: 15.3 points a year rising to 28.7 at an October
  2025 breakpoint, 1.88x (95% 1.62–2.28). A slope change beats a one-time jump
  at Mythos Preview in 100 of 100 refits, 84 without the internal model, 37
  without it and Fable 5.2: the late acceleration rests on the two newest
  points, as the second drop does under "Regimes".
