# horizons

The analysis behind the figure at a9l.im/#fits ("In the foothills of the
singularity", `content/home/horizons.md`, fitted at build time by
`tools/horizon-fit.mjs`). It began as **reverse-log**, a check of one chart.
On 9 November 2026 Benjamin Todd posted a plot of AI time horizons, log
horizon against log time remaining until a fitted singularity, with a
straight line through it: singularity August 2027, exponent 5.6. a9 asked
whether that holds up.

Nothing here is staged or deployed. Scripts and this record are tracked;
`data/` (copies of METR's, Epoch's and OpenAI's files), the plots and
`result.json` are ignored and regenerate from the scripts, except the copies
in `data/`, whose sources are listed under each section's inputs.

**Status:** the check was done 2026-11-11, in three passes that day: the
check (fable, `claude-fable-5-2`, with a9), the figure and its fit (Opus
5.5, `claude-opus-5-5`), and the port of that fit back here with the check
rerun on it (another fable instance). ECI, OECI and METR's 20 November
capability update followed (sections below). It lived in another
workspace as `reverse-log` until 2026-11-20, when a9 asked for everything
about the fit in one place; a pointer there leads here. "History" at the end
says who found what.

**Short answer (11 November):** the plot reproduces. A straight line on those axes is weak
evidence for a singularity, because the singularity date is fitted to make
the line straight. On the tweet's own series the hyperbola is still the best
of the simple curves; that edge shrinks or goes away when the seven points
that are not measurements are removed, replaced or redated. The fitted date
is 2027.65 (95%: 2027.40 to 2028.00). Choices that interval does not cover,
which scores and which dates, move it as far as 2028.8. In a rolling backtest
the hyperbola forecasts this series best and is the only curve that does not
run low, again because of those seven points.

One thing does favor the hyperbola, and a9 spotted it. A single fitted date
means little: about a year out is what the method returns whether or not the
data have a singularity. But without one the date should slide later as data
arrives, and since December 2024 it has not. That holds on four of the five
series tried and fails on public Epoch ECI.

**Update (20 November):** METR has now measured public models through Opus
5.5 and GPT-6 Astra, on a new and harder suite. On it, the map that carries
the late AECI scores into hours runs 0.9 to 1.8 doublings high for the
public Claude models from AECI 160 up, and AECI stretches by about 1.55x against
METR's own capability index after October 2025. Rebuilt on METR's ruler, the
fitted singularity moves to 2028.70 (2028.14 to 2029.48), the hyperbola
loses its AICc lead, and the drift test turns against it: the date slides
out about as fast as the calendar. The figure's 2027.65 now holds only if
AECI's scale, or METR's narrow verifiable subset, is the right ruler at the
top. Epoch's ECI, its software and agentic subsets and OpenAI's OECI agree
with METR: none bends against METR's index, and through them the latest
public models put the date at 2028.7 to 2028.9. See "METR's capability
update" and "Beside the public rulers".

## Run it

    python series.py         # the figure's table checked against its sources, then the inputs as read
    python replicate.py      # tables to stdout, writes result.json (about 15 s)
    python chart.py          # horizon-singularity-check.png
    python fit.py            # Epoch's score-to-horizon map, and each series on its own
    python aeci_whiskers.py  # re-read the AECI intervals off the chart
    python three_scales.py   # Epoch's ECI as a third scale (see "ECI as a third scale")
    python conversions.py    # its ECI view under each AECI-to-ECI conversion
    python scores_vs_horizon.py; python aeci_eci_conversions.py   # the two plots for it
    python eci_gap.py        # what Claude's ECI shortfall at equal horizon is made of
    python software_route.py; python software_fit.py; python software_plot.py   # horizon through Epoch's software ECI
    python oeci.py; python oeci_plot.py   # OpenAI's OECI beside the other rulers (see "OECI"), oeci.png
    python oeci_routes.py    # what each index weights, and GPT-6.2 Astra carried onto AECI by several routes
    python aeci_subset.py    # speculative: Epoch benchmarks picked to imitate AECI (about 30 s)
    python aeci_imitation.py # that imitation against METR, and every lab on it: aeci-imitation.png
    python metr_q4.py; python metr_q4_plot.py   # METR's 20 November update against the fit (see "METR's capability update"), metr-q4.png
    python metr_rulers.py    # those measurements beside ECI, its subsets and OECI (see "Beside the public rulers")
    python regimes.py; python regimes_plot.py   # double exponential against one and two drops in the doubling time (see "Regimes or smooth acceleration"), regimes.png
    python rulers_plot.py    # each ruler on its own, the conversions between them, every ruler in pooled hours: ruler-*.png (see "Beside the public rulers")

numpy, pyyaml, matplotlib and Pillow, all in the shared venv, and node, which
runs the site's fit. `data/` is local and ignored by git: copies of METR's,
Epoch's and OpenAI's files, whose sources each section's inputs list.

## One source for each thing

Since 2026-11-20 nothing here keeps a second copy of the figure or its fit.

- **The fit** is `tools/horizon-fit.mjs`, and only that; its header
  describes it. `fit.fit_horizons`, `fit.hyp` and `fit.dexp` call it through
  `bridge.py` and `bridge.mjs`: one node process per Python session, JSON
  lines, numbers unrounded. Until then `fit.py` carried a Python port,
  generator and all, and `parity.py` checked that it agreed with the build
  to the last digit the site prints (it did, on all 3,368 numbers); both are
  gone. Switching to the bridge left `replicate.py`'s output unchanged line
  for line, and the site's `horizon-data.js` byte for byte.
- **The figure's series** is the table in `content/home/horizons.md`.
  `series.models()` reads it with the build's own reader
  (`readHorizons` in `tools/horizon-fit.mjs`). `series.from_sources()`
  rebuilds the table from METR's v1.1 file and the AECI readings, and
  `python series.py` checks the two agree. To change the series, edit the
  table; if the change comes from a new source, add the source here so the
  check still holds.
- **Model names** are `series.REGISTRY`: a row per model, in the spelling
  of each source (the figure, METR's v1.1 keys, METR's 20 November names,
  Epoch, the AECI chart). Every name map the scripts use comes from it.
  What METR's internal checkpoints are is `series.PAIRINGS`, with a status
  for each (stated, supported or speculative); `series.PUBLIC` holds
  released models only.
- **Epoch's data** is the 12 November snapshot, read once in `series.py`;
  Epoch's 19 November pages for three models are a later layer, read there
  too, and used only where a section says so. The 11 November copy of
  Epoch's scores that `series.py` used to read is gone; the sections that
  used it were rerun on the 12 November snapshot the same day, and the
  numbers below are those reruns.
- **Plot labels** are computed, not typed: a number on a plot comes from the
  script that prints it.
- **The method** is described in `tools/horizon-fit.mjs`, the series and its
  dating rules in the content file's comment, and the analysis here.

## Inputs (retrieved 2026-11-11 unless marked; local copies in `data/`)

- `epoch-2026-11-12/`: Epoch's `https://epoch.ai/data/benchmark_data.zip`
  as of 12 November (scores, every benchmark result, fitted difficulties
  and slopes). The check first ran on Epoch's scores of 11 November.
- `benchmark_results_1_1.yaml`: METR measured time horizons, v1.1, from
  `https://metr.org/assets/benchmark_results_1_1.yaml`. The last measured
  record holder is an early Mythos Preview checkpoint, 17.4 h (CI 8.5 to 55).
  The file dates it 2026-04-07, the public Mythos Preview release.
- `aeci-main.png`: the AECI chart from METR's assessment of AI R&D
  acceleration at Anthropic (5 Nov 2026),
  `https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/`.
  METR did not publish the numbers, so `series.py` holds the pixel centroid of
  every plotted point and converts with the x ticks and one line through the
  seven y ticks. Check: Model 4 reads 178.63 against 178.6 in METR's text;
  3.5 Sonnet reads 130.00, the anchor. The whiskers are METR's 95% bootstrap
  intervals over benchmarks. `aeci_whiskers.py` reads them and `series.py`
  holds the readings; they widen to −8/+14 at Model 4.
- The chart dates each model by when most Anthropic staff could use it, not
  by public release (METR's caption says so). For public models that is
  usually 3 to 13 days before release, and 25 for Mythos 5.1.

The tweet: `https://x.com/ben_j_todd/status/2119787039210049930`. The
AECI-to-horizon map is Nikola Jurkovic's,
`TH = 3.46 h * exp(0.148 * (AECI - 150))`,
`https://x.com/nikolaj2030/status/2118777653981507716`. He called it weak
evidence for scores this high. Grok found both; the first pass opened the
tweet itself.

## What was fitted

**The series** is the figure's table (`content/home/horizons.md`; its
comment gives the dating rules): 25 record holders, 18 measured (GPT-2 in
2019 to the early Mythos Preview checkpoint) and 7 internal Anthropic models
that have only an AECI score (Mythos Preview to Model 4). The chart's date
for the early checkpoint, 2026-02-24, puts it before Mythos Preview
(2026-04-01), not after it as the file's date does.

**The map** from AECI to horizon is the least-squares line through the eight
Claude models that have both (3 Opus to the early checkpoint; 3 Opus and
Opus 4 are not record holders and serve only here): 4.68 points per doubling
(95%: 4.36 to 5.06), 3.46 h at AECI 150, residual 0.23 doublings. That is
Jurkovic's map to the digits he gave.

**The fit** is the site's (`tools/horizon-fit.mjs`, whose header describes
it): two views, hours and AECI, each with a hyperbola
`a - alpha*log2(t_c - t)` and a double exponential, and intervals from
2,000 bootstrap replicates that redraw the map and resample the residuals.
The points' own intervals are not resampled, because METR's are correlated
across models (one task suite, one benchmark set).

| View | Fitted singularity (95%) | Doublings per halving of the time left |
|---|---|---|
| Hours | 2027.65 (2027.40 to 2028.00) | 5.59 |
| AECI | 2027.63 (2027.38 to 2027.97) | 5.57 |

With the tweet's inputs typed in (the file's date for the early checkpoint,
Jurkovic's constants) the hyperbola gives 2027.63 and exponent 5.54, against
the tweet's August 2027 and 5.6. The chart's date gives 5.59, so the tweet
may already have used it; I can't tell from the plot.

**Variants**, all in the hours view. The last column compares the hyperbola
with the best of four other curves by AICc: exponential, double exponential,
quadratic, and exponential with one change of slope.

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

Other results:

- **Simulation.** 1,500 histories from each fitted curve, same dates and
  noise, record holders only, then given the tweet's treatment. From the
  double exponential (no singularity) 99% have r above 0.99 and 13% are at
  least as straight as the real data. From the one-slope-change curve: 85%
  and 1.2%. From the hyperbola itself: 82% are at least as straight.
- **One fitted date means little.** In those same histories the fitted
  singularity lands about a year past the last point whichever curve made
  them: median 1.02 yr (95%: 0.73 to 1.37) from the double exponential, 1.18
  (0.83 to 1.69) from the slope change, 0.93 (0.69 to 1.23) from the
  hyperbola. The real data's is 0.91.
- **Whether the date holds does mean something.** If the data came from the
  double exponential, the date fitted at each origin would slide later by
  about 0.9 yr per year of data. From a hyperbola it stays put. Over the 16
  origins since December 2024 the real date wandered between 2026.7 and
  2028.2 with no drift: the rank correlation of date with origin (Kendall's
  tau) is 0.00, where double-exponential histories give +0.87 and hyperbolic
  ones +0.05. From the December 2025 fit to now the date came in by 0.36 yr;
  the double exponential expects +0.70 and the slope change +1.00. The table
  gives the real tau and the share of simulated histories drifting that
  little or less.

  | Series | tau | Double exponential | Slope change | Hyperbola |
  |---|---|---|---|---|
  | The figure's | 0.00 | 1.5% | 18% | 47% |
  | A flatter map | +0.17 | 2.9% | 29% | 58% |
  | Public release dates | +0.13 | 4.3% | 30% | 53% |
  | Late AECI on Epoch's scale | +0.50 | 17% | 41% | 76% |
  | Public Epoch ECI after April 2026 | +0.68 | 43% | 64% | 86% |

  The slope change is not separated over the whole window, because its
  early dates are erratic. It is over 2026: on the first four series fewer
  than 1% of its histories have the date move as little since December 2025
  as it did. On public Epoch ECI the date did slide, by 0.76 yr, as the
  double exponential expects. This is the strongest evidence for the
  hyperbolic form in the check, and it leans on the same converted points as
  the rest. (The two Epoch rows are the 20 November reruns on Epoch's 12
  November data, which adds Gemini 4 Carbon to the public record; the
  rescaled row also drops the pre-release Fable 5.2 pair, see "Fable 5.2's
  system card".)
- **Range.** The x-axis covers 0.97 orders of magnitude, 0.69 since GPT-4.
- **Backtest.** Rolling: fit the first k record holders, then predict the
  next point and every point within half a year, from each of 17 origins
  (o1-preview on). Errors are in doublings. On the figure's series the
  hyperbola forecasts best and is the only curve without a bias: 0.69 rms
  over the next half year, bias +0.09. The double exponential has 0.88 and
  +0.72, the slope change 1.05 and +0.75; both ran low, by more in 2026
  (+0.82 and +1.25). On the measured points alone (10 origins) the slope
  change forecasts best (0.52, bias +0.05) and the hyperbola is third (0.81,
  +0.16). So the forecasting edge, like the AICc edge, comes from the seven
  converted points.
- **The date over time.** The same fit on data to April 2025 (o3) said
  2026.72, which has passed, and to August 2025 (GPT-5) 2026.97. By December
  2025 it said 2028.00, by April 2026 2027.51, and it has drifted out to
  2027.65 since. Every origin's 95% interval covered every later estimate
  bar one, so the intervals have been honest about how far the date moves.
  Leaving out any one point moves it by at most 0.04 yr.
- **Scale.** AECI runs ahead of Epoch's ECI for the same public models: +0.4
  at Opus 4.5, +6.1 at Opus 5.5. Above ECI 150, AECI is about 1.35 x ECI - 53
  over the released models.
  The map is calibrated only up to AECI 162 and used up to 179.
- **Dates.** The series mixes two dating rules: public release for the
  measured models, internal availability for the AECI ones. The gap between
  the two has grown from days to weeks, so the late points sit early relative
  to the early ones. Dating everything by public release means dropping the
  four checkpoints that have none (Model 2 Early, Model 2, Model 3 Early,
  Model 4) and taking the record over public models: Mythos Preview, Mythos 5,
  Opus 5, Mythos 5.1, Opus 5.5, then Model 3 as Fable 5.2 (2026-11-09, 48
  days after the chart's date). That gives 2027.98. The Model 3 pairing is
  the first pass's, by score and timing; METR's post does not name it, and
  Fable 5.2's system card later bore it out.
  Without that point: 2027.86 (2027.53 to 2028.37).
- **Common ground.** Every curve that fits reaches a one-work-year 50% horizon
  in 2027: hyperbola 2027.02, double exponential 2027.24, slope change
  2027.56.
- **Same data, another method.** AI Futures' update of 10 November 2026
  ("Looks Like the Intelligence Explosion Will Happen in 2027 After All",
  `https://blog.aifutures.org/p/q35-timelines-update-looks-like-the`) puts
  its Monte Carlo median for a superhuman AI researcher at July 2027, 65% by
  the end of 2027 and 84% by the end of 2028. It agrees with the fits here
  on timing. It is not independent of them: its largest input is the METR
  report that supplies the last seven points here. What it adds is a
  mechanistic model and human judgment in place of a curve. (Read through a
  fetch that returned the start and end of the post verbatim and the middle
  as a summary; these numbers are from the verbatim parts.)

## What would settle it

The curves agree on the data and disagree soon after. Record 50% horizon
each implies, with 95% bands; hours from the hours view, AECI from the AECI
view. The slope-change curve has no band, and its AECI is its hours through
the map.

| Date | Hyperbola | Double exponential | One slope change |
|---|---|---|---|
| 2027.00 | 1,700 h (690 to 5,400); AECI 192 (188 to 198) | 610 h (350 to 1,100); AECI 185 (182 to 188) | 330 h; AECI 181 |
| 2027.25 | 26,000 h (4,300 to 720,000); AECI 211 (201 to 233) | 2,100 h (1,000 to 4,500); AECI 193 (190 to 197) | 740 h; AECI 186 |
| 2027.50 | 7 million h (58,000 to ∞); AECI 251 (221 to ∞) | 7,800 h (3,200 to 21,000); AECI 202 (198 to 207) | 1,600 h; AECI 192 |

The hyperbola's and the double exponential's AECI bands touch at 2027.00 and
are clear of each other by 2027.25, so a frontier AECI or measured horizon
from spring 2027 separates them. A date passing is a poor test of the
hyperbolic family, since a refit moves the date; a singularity date that
recedes as fast as the calendar advances is the sign that the form is wrong.

## Limits

- The bootstrap treats the 25 residuals as exchangeable. They are not:
  record holders are selected, and the seven converted points share one lab
  and one conversion. The intervals and the AICc gaps are too confident on
  that count.
- The points' own uncertainty is in the bars, not in the fit's intervals. It
  is large for the converted points: Model 4 is 240 h (67 to 2,100).
- The map is one straight line. The interval covers its slope and level, not
  its shape; the flatter-map row is the one test of that.
- No curves with more than four parameters.
- A 50% horizon going to infinity is a statement about a benchmark statistic.
  Toby Ord made that point under the tweet; it is not examined here.

## ECI as a third scale

Tried 2026-11-12 on a branch of a9l.im's figure (Opus 5.5, with a9), which
a9 then dropped. Epoch's ECI joined horizon and AECI as a third y view, with
three maps (horizon on AECI, horizon on ECI, ECI on AECI). Each view fit its
own running record, where a model released the same day as a better one
doesn't count, and the pool gained the models only Epoch scores (o1-mini,
o3-mini, the GPT Pro tiers, Gemini 2.5 Pro, GPT-6 Astra). `three_scales.py`
runs it, and `conversions.py` reruns the ECI view under each AECI-to-ECI
conversion and pairing.

**What a9 took from it: Claude models score lower on ECI than other labs'
models with the same measured horizon.** On the 20 models with both (8
Claude, 12 others), Claude sits 0.42 doublings above the shared line (se
0.15), about 2 ECI points at equal horizon. The gap grows with capability:
Claude's ECI is lower by 0.5 points at a 10-minute horizon (95%: −1.1 to
2.5), 2.1 at an hour (1.1 to 3.3), and 3.9 at a working day (2.1 to 5.9).
Within one lab, ECI tracks horizon about as tightly as AECI does (scatter
0.24 doublings for Claude, 0.33 for the others, 0.23 for AECI); across labs
it doesn't. On the 7 Claude models with all three scores, AECI is a little
closer to horizon (leave-one-out 0.23 against 0.32 doublings, better on 4 of
7, not significant). The same gap shows inside Claude alone as AECI pulling
ahead of ECI: the two agree to within a point up to Opus 4.6, then part, by
6 points at Opus 5.5. `horizon-vs-scores.png` shows it.

**What the gap is: domain mix, not a measurement bias on either side**
(`eci_gap.py`, on Epoch's per-benchmark scores and fitted benchmark
parameters, retrieved 2026-11-12 into `data/epoch-2026-11-12/`). Each score
implies a capability on the ECI scale through Epoch's own difficulty and
slope (the link reproduces the scores, r = 0.96).

- Against its own ECI, Claude does best on agentic coding and research:
  MirrorCode +9 points relative to OpenAI and Google, DeepResearch Bench +11,
  GDPval +5, GSO and PostTrainBench +4, and METR's time horizons themselves
  +3.6. It does worst on GeoBench (−19), chess and VPCT (−8), MATH Level 5
  (−6), GPQA (−5) and AIME (−4).
- Measured on Epoch's software and agentic-coding benchmarks alone, Claude
  sits on the other labs' horizon line: offset −0.22 doublings (se 0.31),
  against +0.48 (0.18) on the full ECI for the same 16 models. Adding the
  other agentic benchmarks gives −0.29 (0.29). Leaving out the agentic
  benchmarks raises it to +0.71 (0.16). Leaving out math alone cuts it to
  +0.15 (0.22).
- The same holds without any regression: on frontier models, Claude's
  software capability runs 1.6 points above its ECI, while OpenAI's runs 1.1
  below and Google's 1.5 below. That 2.9-point spread is about the size of
  the gap.
- METR's suite is software, ML and cybersecurity tasks. So the horizon
  measures the domain where Claude is relatively strongest, and ECI averages
  in math, science knowledge and vision, where it is relatively weakest.
  Horizon tracks Epoch's independent agentic benchmarks the same way across
  labs, to within about ±0.3 doublings, so METR's per-model scaffolds (plain
  ReAct for every Claude model, triframe for OpenAI's reasoning models) show
  no Claude-specific lift at that precision.
- AECI is Anthropic's own run of Epoch's IRT code, on 15 Anthropic-chosen
  benchmarks (names redacted; categories math, software, science,
  multimodal, language and other). It uses about 5 to 7 times Epoch's token
  budget per task (METR's 5 November post, read through a fetch).
  - Against Epoch's software measure for the same public Claude models, AECI
    has run a steady 1.5 to 3 points ahead since Opus 4.7. That fits an
    elicitation offset.
  - Against Epoch's science measure, AECI runs up to 16 points ahead (Opus
    5.5). So most of the AECI–ECI divergence is Claude's science and
    knowledge scores lagging its agentic ones.
  - A steady offset does no harm to the hours view, because that view
    calibrates AECI on horizons directly. What the data can't check is
    AECI's slope past the last measured horizon (AECI 162, used up to 179).
- For timelines (synthesis): if AI R&D automation runs on agentic software
  and ML engineering, the horizon and AECI views measure the right thing,
  and the ECI view's later date reflects capabilities further from that
  loop. The open risks to the hours view are AECI's own trend: Anthropic-run,
  saturating, with METR's link-function range of 1.1x to 2.9x. Cross-lab
  bias is not one of them.
- **Horizon through Epoch's software ECI** (`software_route.py`,
  `software_fit.py`, `software-eci.png`). Horizon on software ECI has no lab
  offset: 4.13 points per doubling, scatter 0.58, 16 models. Software ECI on
  AECI is close to a straight line for the 14 public Claude models: 0.82
  software points per AECI point, with AECI 1.5 to 3 ahead since Opus 4.7.
  - For public Claude models the two routes to a horizon agree: Opus 5 60 h
    both ways, Fable 5.1 95 against 97, Opus 5.5 116 against 133. So
    Epoch's independent software benchmarks back the AECI map where they
    overlap.
  - For the internal checkpoints the software route runs 0.2 to 0.4
    doublings lower: Model 4 at 182 to 211 h, against 240. The fitted
    singularity moves to 2027.71 to 2027.78 (95% about 2027.3 to 2028.5).
  - With no AECI at all (measured horizons, then public Claude models
    through software ECI, last Opus 5.5 at 116 h) the fit is 2027.96 (2027.50
    to 2028.75). The hyperbola stays 3.7 AICc ahead, and 9.5% of
    double-exponential histories drift as little.
  - The best public non-Claude model on this route is GPT-6 Astra at about
    59 h.
- Public models alone, on Epoch's measures, are inconclusive about the
  hyperbola. The record on Epoch's software measure fits 2028.13 (2027.45 to
  2030.13), with the hyperbola 1.7 AICc behind. Other measures run the fitted
  date out to the search bound. The hyperbola's support still comes from the
  internal checkpoints.

Other results:

- The horizon and AECI views fit 2027.70 with the Pro models added. The ECI
  view fits 2028.3 to 2028.8, depending on the conversion and the pairings,
  with the hyperbola 2 to 14 AICc behind and the drift test failing (tau
  about +0.9; 70% to 95% of double-exponential histories drift as little). On
  ECI's scale the evidence for the hyperbola goes away. (Rerun 20 November on
  Epoch's 12 November data; on the 11 November scores it was 2028.4 to
  2028.7, 4 to 12 behind.)
- The AECI-to-ECI relation bends (`aeci-eci-conversions.png`). Through the 14
  public Claude pairs, a straight line leaves 1.00 ECI of scatter, a quadratic
  0.71, two lines joined at AECI 156.0 leave 0.56, and a line through the 8
  pairs above 150 leaves 0.36. The curved maps put the late checkpoints about
  1.5 ECI lower (Model 4 at 171.4 to 172.0, against 173.1).
- Internal checkpoints paired with public releases: Model 2 Early as Fable
  5.1 and Model 2 as Opus 5.5 sit within 0.6 ECI of their projections.
  Both pairings are speculative (`series.PAIRINGS`), since each of those
  public models has its own point on the chart. Fable 5.2 (released 2026-11-09) sits above every charted
  checkpoint once the map bends: by 2.0 ECI at Model 4, 3.2 at Model 3 and
  3.6 at Model 3 Early. Its ECI corresponds to an AECI near 181.4, past the
  end of METR's chart. On the straight map it is level with Model 4 (+0.3).
  Those are on Epoch's 12 November value, 173.4. The first run had its 11
  November value, 174.2, with gaps of 2.7, 3.9 and 4.4, each outside the
  map's 95% band; the band wasn't rechecked at the smaller gaps. The Model 3
  Early pairing came from outside speculation.
- Converting AECI to ECI by way of horizon, not directly, gives the hours
  answer back (2027.77). But it contradicts the direct pairs: it would put
  Opus 5.5 near ECI 176, where Epoch has 168.5.

## OECI

Added 2026-11-19 (Opus 5.5, with a9). OpenAI's research-acceleration report
of 18 November 2026,
`https://openai.com/index/research-acceleration-jagged-frontier/`,
introduces OECI. It is Epoch's method run on public benchmarks plus
internal OpenAI ones, and it scores 20 OpenAI and 28 other models. The
report fits 16.4 points/yr to OpenAI's 9 record releases since GPT-5,
against Epoch's 14/yr since late 2024. a9's question: does it show less
acceleration than AECI? `oeci.py` prints the tables and `oeci_plot.py`
draws `oeci.png`.

**Input:** `data/openai-2026-11-18/` holds the Vega-Lite datasets
embedded in the page. That is 48 models with 90% bootstrap intervals, and
96 benchmark versions with category, difficulty and how many models each
was fitted on (four have names). openai.com refuses scripted fetches
(WebFetch and curl got 403), so the datasets were read in the browser
pane and copied over. `oeci.py` reproduces OpenAI's line: 16.39/yr,
148.7 to 169.7.

- **No ruler shows curvature inside OECI's window.** From August 2025 to
  November 2026, a straight line in points (an exponential in horizon)
  is best or tied by AICc on every record series. That holds for OECI,
  ECI, software ECI, AECI, and AECI with the internal checkpoints. The
  hyperbola elsewhere in this check comes from the long window: the
  2026 pace sits well above the pace of 2019 to 2024. OECI starts at
  GPT-5, so it can't test that shape. OpenAI's own series bends a
  little: 7/yr over its first three records, 19.4/yr in 2026, and a
  quadratic term of +14 ± 6 pts/yr², mostly from GPT-6 Astra. AICc
  still prefers the line.
- **In horizon units the rulers mostly agree, and all of them are
  fast.** Divide each ruler's 2026 frontier pace by its points per
  doubling and you get, in doublings/yr: OECI 4.6 for OpenAI and 4.5
  for Claude, ECI 4.5 and 4.8, software ECI 5.4 and 5.3, AECI 6.1 (6.2
  with the checkpoints). ECI and software ECI are taken over OECI's own
  model set. METR's measured record ran 1.4/yr from 2019 to 2023 and
  3.5/yr from 2024 to early 2026. OECI's map is derived, not fitted:
  ECI's 4.74 points per doubling times OECI's within-lab slope on ECI
  (0.89 for OpenAI, 1.01 for Claude). Only five OECI models have a METR
  horizon, too few to carry a lab offset. So "16.4 against 14"
  understates what OECI shows, for three reasons. An OECI point is
  about 0.89 ECI points for OpenAI models. The window includes the slow
  end of 2025. And in horizon units the 2026 pace is a 2.6-month
  doubling.
- **AECI's extra pace comes from its ruler.** On the same 7 public
  Claude models, AECI moves 1.49 points per OECI point (se 0.08) and
  1.36 per ECI point; software ECI moves 1.13 per OECI point. Measured
  on OECI, ECI or software ECI, Claude's and OpenAI's 2026 paces can't
  be told apart. The hyperbola hangs on which ruler tracks horizon above
  the last measurement. That is the same open risk as before: AECI's
  slope past AECI 162.
- **OECI's broad coverage is non-agentic.** Only 9 of the 96 benchmarks
  are fitted on 20 or more of the 48 models: three games, two math, two
  science, one language and one multimodal. No software, computer-use,
  cybersecurity or AI-research benchmark reaches more than 10 models;
  those categories hold 22% of model-benchmark pairs. So for most
  non-OpenAI models, OECI rests on the domains where `eci_gap.py` found
  Claude relatively weakest. That fits the offsets: OECI minus ECI is
  −3.8 for Claude, −0.3 for OpenAI, −1.2 for Google and −2.4 for the
  rest. With a common slope, Claude sits 2.9 (se 0.5) below OpenAI. The
  page doesn't say which models the internal agentic benchmarks cover;
  that they are mostly recent OpenAI models is a guess.
- **Fable 5.2 carried onto AECI.** Fable 5.2 has OECI 169.7. The Claude
  line of AECI on OECI maps that to AECI 182.4, and the line through
  ECI gives 181.3. Both extrapolate about 5 points past the last pair,
  and the two indices share public benchmarks, so they aren't
  independent. OECI's own 90% interval maps to AECI 176.6 to 187.0. The
  AECI-view curves at Fable 5.2's likely internal date (mid to late
  October) give: hyperbola 181.1 to 182.4, double exponential 178.4 to
  179.3, slope change 176.7 to 177.3. At the public release date they
  give 184.3 and 180.5. The central value sits on the hyperbola and
  above the double exponential, but its interval covers all three
  curves. It is above Model 4 (178.6) without ruling out that Fable 5.2
  is Model 4.

### GPT-6.2 Astra by several routes

Added the same day. a9 asked two things: does OECI weight non-RSI tasks
more and AECI less, and where does GPT-6.2 Astra land when it is carried
back by several routes, including splitting ECI into domains and
reweighting them? `oeci_routes.py` answers both. By the 19th Epoch had
scored GPT-6.2 Astra: ECI 174.17 (170.3 to 178.6) on 11 benchmarks, tied
with Fable 5.2 at 173.5. Its per-benchmark scores, and fresh scores for
Fable 5.2 and GPT-6 Astra, are in
`data/epoch-2026-11-19/model_pages.json`, read from the props embedded
in Epoch's model page.

- **Weights.** I regressed each index, with non-negative weights, on
  Epoch's three domain groups: agentic (software plus other agentic),
  math+science, and games+reasoning.
  - ECI itself splits 0.23 / 0.45 / 0.32 across those groups.
  - OECI, over the 43 shared models, puts agentic at 0.00 (bootstrap
    10–90%: 0.00 to 0.00), math+science at 0.57 and games at 0.43.
    Across labs, OECI carries no agentic information beyond the other
    two groups. For OECI, then, the answer is yes.
  - AECI's weights can't be identified from 14 collinear Claude models
    (agentic 0.05, range 0.00 to 0.36).
  - Reweighting can't reproduce AECI's 2026 stretch. On the 2026 Claude
    models, per OECI point, Epoch's agentic group moves 1.24,
    math+science 1.20, games 1.03, and AECI 1.49. In log terms, domain
    mix is about half of the stretch. The rest belongs to AECI itself:
    benchmark choice within a domain, the 5–7x token budget, the
    harness, or ceilings on the public benchmarks. Nothing here tells
    those apart.
- **Routes.** Each route is reported as an AECI-equivalent: the AECI a
  Claude model with the same horizon would have, through the hours-view
  map. Model 4 is 178.6 (240 h).

  | Route | GPT-6.2 Astra | Fable 5.2 |
  |---|---|---|
  | OECI or ECI straight onto the 2026 Claude AECI line | 182.3 to 183.3 (410–480 h) | 181.4 to 182.4 |
  | The same, OECI less OpenAI's lead at equal ECI (2.2) | 180.1 (300 h) | – |
  | Reweighted domains onto the 2026 Claude AECI line, agentic share 0 to 1 | 177.2 to 172.4 | 178.2 to 174.8 |
  | ECI to METR horizon, with the lab offset | 172.3 (95 h) | 173.6 (115 h) |
  | OECI to ECI or software ECI on OpenAI's lines, then horizon | 170.6 to 171.4 (73–82 h) | – |
  | Software ECI to horizon: GPT-6 Astra's, carried forward by the MirrorCode gain or by the ECI gain | 171.5 to 174.8 (84–137 h) | 169.4 (61 h; no MirrorCode) |
  | Reweighted domains to METR horizon, agentic share 0 to 1 | 168.1 to 171.5 | 172.3 to 173.7 |

- **Reading.** Which ruler you use matters more than which lab.
  Carried straight onto AECI's 2026 Claude line, GPT-6.2 Astra is 180 to
  183: level with Fable 5.2 and above Model 4. Through METR-calibrated
  maps or rebuilt components it is 168 to 177, which is 50 to 190 h,
  around Model 2 to Model 3 and below Model 4. On any one ruler, Fable
  5.2 and GPT-6.2 Astra are within −1 to +4 AECI points of each other.
  Mostly Fable 5.2 leads by 1 to 2, a third to half a doubling, once
  agentic work is weighted or Claude's horizon offset is applied. The
  software route is the one that matched AECI for public Claude models
  through Opus 5.5, and it puts GPT-6.2 Astra at 171.5 to 175 (84–137 h).
- **Caveats.**
  - The domain capabilities use only unsaturated scores (3–97%), so they
    can't see ceilings. GPT-6.2 Astra is at 100% on FrontierMath Tier 4
    and OTIS; Fable 5.2 is at 100% on Tier 4 and ProofBench.
  - GPT-6.2 Astra has one agentic benchmark, MirrorCode.
  - Fable 5.2's software estimate lacks MirrorCode, which was Opus 5.5's
    best software benchmark at 177.9.
  - Epoch's 174 for GPT-6.2 Astra rests mostly on games: that group sits
    at 175.5, against 166 to 170 for its other groups.
  - Benchmark difficulties and slopes come from the 12 November fit.
- **From GPT-6 Astra to GPT-6.2 Astra** the gain is +2.0 on the
  composites over 2.5 months, +1.4 on OECI, and +5.0 on Epoch's early
  ECI, mostly from games.
- **Superseded in part** by the next section. The "about half the
  stretch" estimate used implied capabilities with the saturated scores
  dropped. With a likelihood estimate that keeps them, domain mix
  accounts for the 2026 bend.

### Picking benchmarks to imitate AECI

a9's idea, flagged by a9 as speculative and not evidence: choose
individual Epoch benchmarks to reproduce AECI. `aeci_subset.py` runs it.

**The estimator.** A model's ability on any subset of benchmarks is the
maximum-likelihood ability under Epoch's difficulties and slopes, using
fractional scores and keeping saturated ones, with an N(160, 100²) prior
so that all-100% models stay finite. On all 56 benchmarks it reproduces
Epoch's published ECI: on the 125 models at 140 or above, slope 0.99,
r 0.998, scatter 0.53. A first try with an N(160, 30²) prior shrank
low-information models toward 160 (slope 1.36); don't use it.

- **Picking by fit overfits.** Greedy selection drives the in-sample
  scatter of AECI on the 14 public Claude models from 2.3 down to 0.6.
  Redone inside a nested leave-one-out, every pick size from 1 to 15
  does worse than the full benchmark set: 1.8 to 6.2 rms against 1.1.
  The most-picked benchmarks are OTIS, DTBench, Balrog, PostTrainBench
  and MMLU. They are chosen for coverage (which benchmarks span 2024 and
  2026 Claude models), not for content. Carried to the frontier, the
  picks are unstable: GPT-6.2 Astra lands anywhere from 170 to 188
  depending on how many benchmarks are picked. Over 300 bootstrap picks
  of 8 its median is 171 (169 to 182).
- **Picking by domain works.** Epoch's software and agentic benchmarks
  were fitted through Opus 4.8 and asked to predict the next four Claude
  releases. They predict AECI for Fable 5, Opus 5, Fable 5.1 and Opus
  5.5 to within 0.5 points rms. The full set misses them by 1.9, all on
  the low side, and greedy picks miss by 2.7 to 4.3. That is four
  models, so it is suggestive rather than settled. AECI runs 1.26
  points per point of agentic ability, the same slope in 2026 as over
  the whole range. So the AECI–ECI bend is domain mix, and what's left
  is a constant scale factor. The agentic composite is also close to
  lab-neutral against METR horizons: the Claude offset is +0.29
  doublings, against +0.51 for the full set.
- **Carried by matched benchmarks.** A new model's agentic scores are
  compared with a sibling's on the same benchmarks. Fable 5.2 against
  Opus 5.5, on 5 shared agentic benchmarks: +2.0 ability, so AECI 177.1
  (190 h). That is at Model 3 (177.0) and below Model 4. It revises
  "Fable 5.2 carried onto AECI" above: the 181 to 182 from straight
  lines rides on Fable 5.2's non-agentic gains, such as SimpleQA at 94%.
  GPT-6.2 Astra against GPT-6 Astra, on MirrorCode alone: +2.0, so AECI
  173.1 (106 h), or 171.7 (87 h) horizon-equivalent. Both rest on very
  few benchmarks, and for GPT-6.2 Astra on the one where OpenAI is
  weakest.

**Against METR, and every lab on it** (`aeci_imitation.py`,
`aeci-imitation.png`). The approximated AECI is the line of AECI on
agentic ability through the 14 public Claude models:
162.0 + 1.26 × (ability − 160). Standard errors are a jackknife over each
model's own benchmarks.

- **METR horizons, the same 16 measured models (8 Claude)**, in doublings:

  | Ability | Points per doubling | Scatter | Leave-one-out | Claude offset |
  |---|---|---|---|---|
  | Published ECI | 4.87 | 0.39 | 0.44 | +0.48 (0.18) |
  | Software + agentic | 3.93 | 0.49 | 0.53 | −0.07 (0.27) |

  The agentic measure is noisier but lab-neutral: one line serves every
  lab. ECI fits better only once Claude gets its own offset (scatter
  0.33). In the forward test (fit before mid-2025, predict the 8 models
  after), every measure over-predicts the later horizons: ECI by 0.32
  doublings, agentic by 1.37. The agentic measure does worst because
  its early fit is steep (2.9 points per doubling, against 3.9 on all
  the data), and models before mid-2025 have few agentic benchmarks.
  That can't be told apart from real bending. That every measure
  over-predicts may mean METR's suite runs short at the top. That is a
  guess, and if true it would bear on the hours view's map above its
  calibrated range.
- **The labs on it.** In 2026 OpenAI's frontier climbs 26.6 points/yr,
  Claude's 25.9 and Google's 22.2 (5.7, 5.5 and 4.8 doublings/yr at 4.68
  points each). From Fable 5 in June, Claude leads by 2 to 5 points, a
  half to one doubling. GPT-6 Astra (3 September) is 170.6 ± 1.5 (73 h),
  Fable 5.1 (1 September) 172.9, Opus 5.5 174.0 ± 1.3 (121 h, against a
  real AECI of 174.6), Gemini 4 Argon 169.2 ± 1.7, and Fable 5.2 175.6 ±
  3.0 (153 h). On a shared agentic ruler OpenAI is speeding up as fast as
  Anthropic. That answers the original OECI question from a third
  direction.

## METR's capability update

Added 2026-11-20 (Opus 5.5, with a9). METR's "AI R&D-relevant model
capabilities are improving rapidly and are getting harder to measure",
`https://metr.org/blog/2026-11-20-q4-2026-capability-update/`, measures
public models up to Opus 5.5 and GPT-6 Astra. a9 asked what it does to the
fit. `metr_q4.py` prints everything below and `metr_q4_plot.py` draws
`metr-q4.png`.

**Input:** `data/metr-2026-11-20/json/` holds the datasets behind the post's
figures (each figure has a "Data" link; plain curl works), and
`post.html`/`post.txt` the page. This time nothing was read off a chart. The
ones used:

- `cad6b5d98261f80c` (Figure 10): 50% horizons for 15 models on the pooled
  suite, TH1.1 plus TH2. TH2 is 36 new tasks up to a 200-hour threshold,
  mostly with researcher-estimated times. Highest: GPT-6 Astra 40 h (13 to
  2,645), Opus 5.5 39 h (12 to 1,253), Fable 5.1 30 h, Opus 5 20 h. Fitted
  trend 3.61-month doubling (2.08 to 4.94), r² 0.986.
- `8835b7b420aed38c` (Figure 11): the task sets apart. TH1.1 rerun at
  xhigh effort, to GPT-5.4; TH2 verifiable (8 families) for 2026 models,
  with a 1.65-month doubling (0.79 to 3.99); MirrorCode.
- `e401db69f8d499a7` (Figure 12): MCI, METR's IRT index over its own tasks
  (TH1.1, TH2, MirrorCode), for 30 models. Its unit is a day: GPT-4o is 0
  and Opus 4.6, released 633 days later, is 633. Frontier pace 28.9 points
  a month, no acceleration overall. It also scores the early Mythos Preview
  checkpoint (671).
- `d2d1f05c433c83d2` and `85b25e40045da867` (Figures 25 and 23): the pooled
  horizons under longer TH2 time estimates and under model-estimated task
  times.

**Three rulers.** The pooled suite reads about what v1.1 read for models
below 5 h: GPT-4o, o1, GPT-5 and Opus 4.5 average −0.09 doublings against
the v1.1 file. TH1.1 rerun at xhigh effort reads 0.3 to 0.8 doublings above
v1.1, and up to 1.8 where it saturates (GPT-5.4). The harder TH2 tasks offset
the stronger elicitation, so the pooled ruler splices onto v1.1 at GPT-4o
with no adjustment. At Opus 4.6 the pooled ruler reads 0.9 doublings below
v1.1, which by then was saturating (12 h, interval to 60 h).

**The map, past AECI 162.** The figure's map (4.68 points per doubling) was
calibrated to AECI 162 and used up to 179. METR now measures the public
Claude models between 152 and 175:

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
  8.59; scatter 0.17), not 4.68. The residual falls by 0.77 doublings per
  10 AECI points (se 0.08). Through the pooled map Model 4 is 50 h and
  Model 3 43 h, against 240 h and 188 h through the figure's.
- Saturation at the top of v1.1 doesn't explain it. Refitted without Opus
  4.6 and the early checkpoint, the v1.1 map is 4.57 points per doubling,
  and it puts Opus 5.5 at 152 h.
- TH2 verifiable disagrees. On it AECI buys a doubling every 4.33 points
  (3.68 to 5.27), the old map's slope, about 3 doublings lower in level.
- MCI sides with the pooled ruler. Pooled hours are linear in MCI across
  every lab: 0.94 doublings per 100 MCI, scatter 0.21, no curvature. MCI's
  frontier pace is therefore a 3.7-month doubling, matching METR's 3.6.
- **AECI stretches against MCI.** On the 14 Claude models MCI scores, AECI
  moved 4.30 points per 100 MCI before October 2025 (5 models) and 6.71
  after (9 models). The ratio is 1.56 (se 0.18), and 1.54 regressed the
  other way. A joined line with its change at Opus 4.5 cuts the scatter from
  2.0 to 1.3, and the change is 4.4 standard errors. Carried forward, the
  early line has Opus 5.5 10.6 AECI points below its score. A 1.55x stretch
  is about the 1.53x slope change the Opus 5.5 system card reports for
  public Anthropic models (METR, Appendix H). METR itself finds an Anthropic
  slope change in MCI of 1.26x calibrated on every lab and 1.46x calibrated
  on Anthropic alone, both with intervals from about 0.6 to 2 or 3. That
  matches what the OECI section found against OECI, ECI and software ECI:
  AECI's extra pace comes from its ruler.

**The series on the pooled ruler.** v1.1 records to GPT-4 Turbo, then the
pooled records from GPT-4o, then (third row on) the internal checkpoints at
the chart's dates through the pooled map. With the checkpoints in, the 2026
record runs Opus 4.6, Mythos Preview Early, Mythos Preview, Fable 5, Model 2
Early, Model 2, GPT-6 Astra, Model 3 and Model 4.

| Series | Fitted singularity (95%) | Hyperbola against the rest | Drift: tau, move since Dec 2025 | Share of hyperbolic histories drifting less |
|---|---|---|---|---|
| Pooled records alone (GPT-4o to GPT-6 Astra) | 2087 (2030 to never) | behind by 4.7 (an exponential, 3.6-month doubling, is best) | +1.00, +0.78 yr | — |
| v1.1 then pooled, measured only | 2028.85 (2028.22 to 2029.82) | tied (+0.1) | +0.67, +0.97 yr | 87%, 95% |
| The same with the checkpoints | 2028.70 (2028.14 to 2029.48) | behind by 1.9 | +0.87, +0.83 yr | 97%, 92% |
| Longer Train a Program and Minecraft times | 2028.88 (2028.28 to 2029.72) | behind by 2.9 | +0.85, +0.96 yr | 97%, 95% |
| TH2 times above score 0.5 four times longer | 2029.01 (2028.39 to 2029.89) | behind by 4.0 | +0.89, +1.10 yr | 98%, 96% |
| Model-estimated task times | 2027.77 (2027.43 to 2028.29) | ahead by 4.3 | −0.50, −0.29 yr | 25%, 34% |
| The figure's series (for reference) | 2027.65 (2027.40 to 2028.00) | ahead by 9.8 | 0.00, −0.36 yr | 47%, 17% |

The drift on the pooled ruler is what the double exponential and the slope
change produce, and what a hyperbola rarely does: on the four rows from the
second to the fifth, their histories drift at least this much 14% to 62% of
the time, and hyperbolic ones 2% to 14%. Over the 0.8 years since December
2025 the fitted date moved out 0.8 to 1.1 years. "What would settle it" named that as
the sign the form is wrong. The exception is model-estimated task times, which
compress the older models (o1 0.3 h, GPT-5 1.9 h) and put GPT-6 Astra at 65 h;
on those the date holds and the hyperbola leads.

**MCI as the series.** On MCI's frontier (19 records, GPT-4o to GPT-6
Astra) a straight line is best by 3.2 AICc; the hyperbola puts its
singularity in 2072. With the internal checkpoints carried onto MCI by the
post-October-2025 Claude line (Model 4 at 926), the best curve is one change
of slope at the end of 2025, from 28.0 to 35.8 MCI a month (1.28x), and the
hyperbola puts its singularity in 2033. All five curves are within 2 AICc.

**What comes next, on the pooled ruler** (the series with the checkpoints):

| Date | Hyperbola | Double exponential |
|---|---|---|
| 2027.00 | 142 h (94 to 230) | 106 h (80 to 145) |
| 2027.25 | 430 h (230 to 990) | 239 h (168 to 361) |
| 2027.50 | 1,600 h (630 to 7,100) | 560 h (360 to 960) |

Every curve reaches 200 h, the pooled suite's longest threshold, in the first
half of 2027: hyperbola 2027.08, double exponential 2027.20, slope change
2027.36, METR's line (from its fitted 27 h at GPT-6 Astra) 2027.53, which is
METR's "July 2027". The bands overlap through early 2027, so the pooled suite
probably runs out before it separates the curves. On the AECI side the
11 November table above still stands.

**Reading** (synthesis):

- The figure's hyperbola rested on the seven converted points, and they
  rested on the map above AECI 162. METR has now measured the public models
  in that range, and on its main ruler they sit well below the map, by more
  the higher the score. METR's index agrees with its main ruler and says
  AECI's scale stretched by about the size of the reported acceleration.
- The case for the figure as it stands is that the pooled ruler deflates at
  the top. TH2 is harder per hour than TH1.1, and METR warns (its footnote
  54) that switching from one to the other makes the pooled trend look
  slower while the switch is under way. TH2 verifiable, on its own, tracks
  AECI at the old map's slope and doubles every 1.65 months in 2026. METR's
  own guess is that narrow sets run fast: TH2 verifiable has 8 families,
  and MirrorCode ran a 1.8-month doubling in the second half of 2025, while
  TH1.1 grew more slowly.
- So the fork is the ruler at the top. On METR's pooled suite or MCI, public
  models through September 2026 show no acceleration, the singularity moves
  to late 2028 or leaves, and the date is sliding. On AECI or TH2 verifiable
  the figure's mid-2027 stands. Two of METR's three summaries, the broader
  ones, take the first side. I lean that way, without much confidence,
  because MCI needs no human time estimates and still agrees with the
  pooled suite. Against that, METR notes that an IRT index is a lagging
  indicator at the frontier, where few tasks still separate the best
  models.
- Nothing here measures the internal checkpoints. The pooled map puts Model
  4 at 50 h, a third of a doubling above GPT-6 Astra's measured 40 h; Astra
  came out three weeks before Model 4's chart date.

**Limits.**
- The pooled horizons above 20 h have intervals spanning one to two orders
  of magnitude (GPT-6 Astra 13 to 2,645 h). The fits use point estimates, as
  everywhere here.
- The pooled map has 8 points over 22 AECI points, and seven of those
  models are also on the TH2 verifiable map; the two maps disagree about the
  same models.
- MCI's early Claude values carry ±100 intervals, which flatten the early
  slope of AECI on MCI; the reverse regression gives the same ratio, so
  this isn't what makes the stretch.
- METR dates models by public release; the internal checkpoints keep the AECI
  chart's dates, as in the figure.

### Beside the public rulers

Added the same day. a9 asked how METR's new measurements compare with
Epoch's ECI, its software and agentic subsets, and OECI. `metr_rulers.py`
answers. Software and agentic ability are the maximum-likelihood abilities
of `aeci_subset.py` (saturated scores kept, 19 November model pages); MCI
for GPT-6 Luna and Haiku 5.5 comes from METR's Figure 39.

- **Against MCI only AECI bends.** One joined line per ruler, its slope
  changing at Opus 4.5's MCI, points per 100 MCI before and after:

  | Ruler | Every lab | Claude alone |
  |---|---|---|
  | ECI | 4.67 → 4.83 (×1.03, se 0.09) | 4.55 → 5.28 (×1.16, se 0.15) |
  | Software | 4.71 → 4.88 (×1.04, se 0.21) | 4.83 → 5.25 (×1.09, se 0.30) |
  | Agentic | 4.67 → 4.90 (×1.05, se 0.20) | 4.78 → 5.04 (×1.05, se 0.27) |
  | AECI | – | 4.62 → 6.96 (×1.51, se 0.14; 4.4 se) |

  OECI scores almost nothing before the kink. On the 15 later models every
  public ruler scores, OECI moves 3.6 points per 100 MCI, against 4.4 to 4.7
  for the others: it is the most compressed of them. Split by date at
  October 2025 instead, the software and agentic subsets seem to stretch
  (×1.4), but that split leaves them six early models; the joined line uses
  every model below the kink and shows nothing.
- **Against pooled hours** (log2 h on the ruler with a Claude offset), with
  the same regression on the v1.1 file beside it:

  | Ruler | Pooled: points per doubling (95%) | Claude offset | v1.1 | v1.1 map's miss since April 2026 |
  |---|---|---|---|---|
  | ECI (15 models) | 5.02 (4.73 to 5.36) | +0.25 (0.13) | 4.74, +0.42 | −0.49 (Opus 5.5 −0.51) |
  | Software (13) | 5.34 (4.74 to 6.11) | −0.47 (0.16) | 4.59, +0.08 | −0.52 (Opus 5.5 −0.76) |
  | Agentic (13) | 5.33 (4.76 to 6.06) | −0.39 (0.15) | 4.66, −0.09 | −0.45 (Opus 5.5 −0.54) |
  | OECI (12) | 4.69 (4.31 to 5.13) | +0.81 (0.09) | too few (5) | – |
  | AECI (8, Claude) | 7.32 (6.54 to 8.30) | – | 4.68 | −1.48 (Opus 5.5 −1.77) |
  | MCI (15) | 106 MCI per doubling, one line for every lab | – | – | – |

  Every route calibrated on v1.1 overshoots the pooled measurements since
  April 2026: the public ones by about half a doubling, AECI by one and a
  half. (The v1.1 column was first printed with the two Claude 3.5 Sonnets
  counted twice, once under each source's spelling; the registry fixed that
  the same day, and these are the corrected numbers.) So about a third of AECI's miss is a change of ruler that every
  index shares (v1.1 saturating at the top, and TH2 harder per hour than
  TH1.1). The rest, about a doubling, is AECI's own. On the pooled ruler the
  Claude offset shrinks on ECI and turns negative on the agentic subsets:
  Claude's pooled horizons trail its agentic scores, relative to OpenAI's.
  OECI's large offset is its non-agentic weighting (see "OECI").
- **The 2026 pace agrees across every ruler once each is calibrated on
  pooled hours.** Records from 1 January, in pooled doublings a year, to 22
  September (METR's window):

  | Lab | ECI | Software | Agentic | OECI | AECI | MCI | Pooled, measured |
  |---|---|---|---|---|---|---|---|
  | Anthropic | 4.1 | 3.8 | 4.1 | 4.0 | 3.7 | 3.5 | 4.3 ± 0.3 |
  | OpenAI | 3.1 | 3.8 | 4.0 | 4.4 | – | 4.5 | 4.8 ± 1.5 |

  That is a 2.5 to 3.9-month doubling everywhere, AECI included: its 27
  points a year are 3.7 doublings through its pooled map. Through 17
  November, with Fable 5.2 and GPT-6.2 Astra, Anthropic's pace is 4.5 (ECI)
  to 4.6 (OECI) and OpenAI's 3.8 to 4.1. Every lab's measured pooled record
  climbs 4.4 ± 0.4 doublings a year in 2026, against 3.3 for METR's line
  since 2024: a speed-up of about 1.3x, the size of METR's Anthropic slope
  change in MCI (1.26x) and of the MCI view with the checkpoints (1.28x).
- **The public models METR hasn't measured,** on pooled hours: Fable 5.2
  (9 November) 73 h through ECI, 76 h through OECI, 40 h through the agentic
  subset and 29 h through software, which lacks MirrorCode for it; GPT-6.2
  Astra (17 November) 67 h through ECI and 47 h through OECI; Gemini 4
  Carbon 37 h through ECI.
- **Refitted,** the pooled record extended by those models: through ECI
  2028.74 (2028.21 to 2029.53), through OECI 2028.71 (2028.19 to 2029.47),
  the hyperbola ahead by 1.5 and 1.8 AICc; through the subsets nothing
  clears GPT-6 Astra and the fit stays at 2028.85, tied. The date moved out
  0.84 to 0.97 years since December 2025; 5% to 11% of hyperbolic
  histories move that far, and 22% to 40% of double-exponential ones.

**Plots** (`rulers_plot.py`, added the same day at a9's request). Each
ruler has a plot of its own: `ruler-metr.png`, `ruler-eci.png` (with the
software and agentic abilities), `ruler-oeci.png` and `ruler-aeci.png`.
`ruler-conversions.png` plots every pair of rulers. `ruler-hours.png` puts
each ruler's frontier in pooled hours through its own map. It shows the
section in one picture: ECI, OECI and AECI through the pooled map run with
METR's measurements, while AECI through the figure's v1.1 map pulls away
after Mythos Preview. The script prints three numbers of its own:
- AECI's records climb 15.4 points a year before October 2025 and 29.3
  after (chart dates, internal checkpoints included). That is the 1.9x METR
  reports.
- On OECI, Anthropic's records climb 21.4 points a year against OpenAI's
  16.4.
- OECI moves 0.87 points per ECI point for OpenAI and 1.01 for Anthropic.
  These use ECI with the 19 November pages, which add GPT-6.2 Astra; the
  OECI section, written before them, has 0.89 for OpenAI.

**Reading** (synthesis): METR's new measurements and the public rulers
agree with each other. A week ago the public rulers alone, calibrated on
v1.1, put the singularity at 2028.0 to 2028.8 ("ECI as a third scale",
"OECI"); on METR's pooled ruler they put it at 2028.7 to 2028.9, and so do
METR's own records. The one input that says mid-2027 is AECI's scale above
Opus 4.5, and no public ruler, nor METR's index, shows that bend. The
earlier finding that AECI's extra pace "comes from its ruler" (OECI
section) now has a measurement behind it. What none of this can check is
the internal checkpoints themselves, which only AECI scores.

## Regimes or smooth acceleration

Added 2026-11-20 (Opus 5.5, with a9). a9 asked whether the evidence favors
a double exponential or an exponential whose doubling time drops twice.
`regimes.py` answers. The two-break curve is `fit.fit_pw2`: knots on a
0.05-year grid, at least half a year apart, with at least two dates after
each. It shares `fit.breaks` with the one-break curve. Both curves
accelerate, in different ways. The double exponential's doubling time
shrinks by the same factor every year, about 20% on the measured series.
The breaks hold it, then drop it, and from the last knot on they predict no
more acceleration.

| Series | AICc: double exp. / one break / two | Simulated: double-exp. / two-break histories as uneven | A second drop by chance (one-break histories) | Half-year forecast rmse: double exp. / one / two |
|---|---|---|---|---|
| The figure's | −26.8 / −16.2 / **−38.7** | 2% / 24% | 0% | 0.88 / 1.05 / 1.19 (hyperbola 0.69) |
| v1.1 measured only | −18.5 / **−20.1** / −14.1 | 32% / 18% | 55% | 0.74 / **0.52** / 0.88 |
| v1.1, then pooled, measured | **−22.6** / −21.6 / −14.4 | 52% / 11% | 69% | **0.33** / 0.45 / 0.66 |
| The same with the checkpoints (pooled map) | −26.8 / **−27.9** / −19.5 | 48% / 15% | 92% | **0.21** / 0.32 / 0.42 |
| The same measured, then public models through ECI | **−24.0** / −20.9 / −18.9 | 31% / 17% | 21% | **0.40** / 0.55 / 0.74 |

The second column is how often each model's own simulated histories fit at
least as unevenly as the real series. A small share counts against that
model. On METR's pooled suite alone (12 points, 2024 to 2026) a straight
exponential is best by AICc. Its best two breaks are a slowdown and then a
speed-up (2.9 → 4.9 → 2.2 months), not two drops.

- **One drop is real and robust.** Every measured series puts it in spring
  2024, from a doubling time of 8.5 to 8.6 months to one of 3.3 to 3.6. It
  shows on v1.1 alone, so it isn't the change of ruler. Its knot sits in
  the gap between GPT-4 Turbo (November 2023) and GPT-4o (May 2024), so its
  date is good to a few months.
- **A second drop is not in the measured data.** Adding a second break to
  one is what one-break histories gain by chance (55% to 92% of them do as
  well). On the pooled ruler with the checkpoints, the best two breaks put
  nothing after 2024 at all (2021 and 2024, then 3.4 months). Through
  public ECI the second drop is weak (21%), resting on four points after a
  knot in July 2026 (Opus 5, Fable 5.1, GPT-6 Astra, Fable 5.2).
- **Two drops win only on the figure's series** (2% of double-exponential
  histories, 0% of one-break ones). There the second drop (December 2025,
  3.5 → 1.9 months) is the internal checkpoints through the v1.1 map: the
  stretch the METR sections found, and the same evidence the hyperbola
  rests on.
- **The data don't choose between smooth acceleration and one drop.** Their
  AICc is within 1 to 3, and each model's histories routinely fit like the
  real series. Forecasts lean to the double exponential. On the pooled ruler
  its half-year errors are 0.21 to 0.40 doublings, against 0.32 to 0.55 for
  one break, which runs low (bias +0.13 to +0.19, against +0.03 to +0.12).
  Measured window by window, METR's records double every 8.5 months
  from 2019 to 2023, 3.4 in 2024 and 2025, and 2.7 in 2026 (4.4 ± 0.4
  doublings a year). The 2026 pace is faster than one break's 3.4 to 3.5
  months and about the double exponential's 2.8 at the last point. Taken by
  itself it is a step, but it is 1.9 standard errors from 2024–25's pace,
  and none of the fits needs a knot for it. On v1.1 alone, one break
  forecasts best (0.52 against 0.74).
- **Reading** (synthesis): smooth acceleration, or one regime change in
  2024 with 2026 running a little ahead of it; not two drops. The two
  readings part quickly. On the pooled ruler with the checkpoints, by 2028.0
  the double exponential is at 3,700 h (2.1-month doubling) and one break at
  960 h (3.4-month). By 2027.0 they are 106 h against 82 h, inside METR's
  200 h ceiling.
- **The plot** (`regimes.png`). (a, b) are the figure's series and the
  pooled one with the checkpoints, each with the three curves run on to
  2028. (c) is each curve's doubling time against the measured windows. (d)
  and (e) are the simulation tests, where the red diamond is the real
  series. (f) is the half-year forecast errors.
- **Limits:** knots count as one parameter each, which flatters the break
  models in AICc; the simulations and leave-one-out refit the knots and
  don't have that problem. Record holders are selected, and the splice at
  GPT-4o sits right where the 2024 knot lands. The v1.1-only rows, with one
  ruler throughout, put the knot in the same place.

## Fable 5.2's system card

Added 2026-11-20 (Opus 5.5, with a9). a9 supplied Fable 5.2's system card,
published under the name Claude Mythos 5.2,
`https://assets.claude.com/27d60918d218125e7504bc7354c4b4626ec56b11.pdf`.
A copy and its AECI figure are in `data/anthropic-2026-11-fable-5-2-card/`.
Its Table 2.3.5.3.A gives AECI on Anthropic's 6 November fit, and its
Figure 2.3.5.3.B plots the models at their internal dates. `series.CARD`
holds both, and `python series.py` sets them beside the readings of METR's
chart.

| Card | AECI (global 95%) | METR's chart, as read | Card date / chart date |
|---|---|---|---|
| Mythos Preview | 165.71 (162.7–169.7) | 165.65 | – |
| Mythos 5 (Fable 5) | 168.68 (165.2–173.0) | 168.60 | – |
| Opus 5 | 169.40 (165.8–173.9) | 169.33 | – |
| Mythos 5.1 (Fable 5.1) | 172.62 (168.5–177.6) | 172.48 | 7 Aug / 7 Aug |
| Opus 5.5 | 174.78 (170.3–180.3) | 174.64 | 9 Sep / 9 Sep |
| **Mythos 5.2 (Fable 5.2)** | **177.12 (172.4–182.9)** | Model 3, 176.96 | 21 Sep / 22 Sep |
| Internal research model | 178.78 (173.8–185.2) | Model 4, 178.63 | 25 Sep / 25 Sep |

- **Model 3 is Fable 5.2, and Model 4 is not.** The card's Fable 5.2 point
  matches Model 3 by date and score. Its unreleased internal research
  model, "somewhat more capable" than Fable 5.2 and scored on 15
  benchmarks against Fable 5.2's 37, matches Model 4. METR's note in the
  card names the snapshot it tested Model 3 Early (9 September, 176.36).
  The card's Fable 5.2 score is the snapshot Anthropic judged most capable
  on AI R&D, not necessarily the release snapshot. METR also says the
  snapshot it tested was stronger on AI R&D than the released model.
- **Two fits, not a misreading.** METR's text gives Model 4 as 178.6, and
  the reading matches it (178.63); the card puts the same model at 178.78.
  The card's 6 November fit is a later refit, as the card says of itself
  ("each refit reestimates the whole scale"). That is why its values run
  0.06 to 0.16 above METR's chart, with the order and gaps intact.
- **What the card changes in the data.** The figure and every series here
  keep METR's chart. It is one fit with all 21 points, including the
  snapshots the card leaves out, and splicing the card's seven values in
  would mix fits. The card is kept beside the chart as a check
  (`series.CARD`). What it does change is what the checkpoints are, now in
  `series.PAIRINGS`, with a status for each:

  | Checkpoint | What it is | Status | Evidence |
  |---|---|---|---|
  | Model 3 Early | Fable 5.2 before release | stated | METR's note in the card |
  | Model 3 | Fable 5.2 before release | supported | the card's Fable 5.2: 21 Sep, 177.12 (chart: 22 Sep, 176.96) |
  | Model 4 | an unreleased internal research model | supported | the card: 25 Sep, 178.78 (chart: 25 Sep, 178.63) |
  | Model 2 | Opus 5.5? | speculative | score only; Opus 5.5 has its own point a month later |
  | Model 2 Early | Fable 5.1? | speculative | score only; Fable 5.1 has its own point |

  `series.PUBLIC` holds the 14 released models only. Model 3 stays out of
  it: its AECI is a pre-release snapshot's, which METR found stronger on AI
  R&D than the release, so pairing it with the released model's ECI or
  OECI would compare two snapshots. Until 20 November, `fit.aeci_on_eci`
  included that pair while every other analysis dropped it. Without it,
  late AECI rescales onto Epoch's scale as 1.35 x ECI − 53 rather than
  1.22 x ECI − 32, which agrees with the 1.36 AECI points per ECI point the
  OECI section found. The variant that uses it moves from 2028.15 to
  2028.30 (see "Variants").
- **Fable 5.2 against Model 4, on one fit:** 177.12 against 178.78, 1.7
  points below. Their local intervals, which compare a model with its
  predecessors, overlap slightly (175.8–178.5 against 177.1–180.6). In
  pooled hours that is 43 h against 50 h; through the figure's v1.1 map it
  is 192 h against 246 h.
- **The agentic routes predicted it, and the broad indices didn't.**
  Before the card, these routes estimated Fable 5.2's AECI as follows.
  Agentic benchmarks matched against Opus 5.5 gave 177.1 ("Picking
  benchmarks to imitate AECI"), within 0.02 of the card. The agentic
  imitation gave 175.6 ± 3.0. ECI and OECI carried straight onto AECI gave
  181.3 to 182.4, 4 to 5 points high. In pooled hours the agentic route
  gave 40 h, against 43 h from the card's AECI. ECI and OECI gave 73 to
  76 h. The broad indices overstate Fable 5.2 because its gains sit outside
  agentic work, which is the domain-mix finding again. Where AECI goes,
  the agentic benchmarks follow.
- **The card's own trend:** 15.3 points a year, rising to 28.7 at a
  breakpoint in October 2025, a 1.88x slope change (95% 1.62–2.28); 32 of
  100 refits reach 2x. `ruler-aeci.png` gets 15.4 and 29.3 from the chart
  readings. A slope change beats a one-time jump at Mythos Preview in 100
  of 100 refits. Without the internal model it wins 84; without both the
  internal model and Fable 5.2, 37. Anthropic's case for the late
  acceleration rests on its two newest points, as the second drop does in
  "Regimes or smooth acceleration".
- **Earlier statements this settles.** The OECI section left open whether
  Fable 5.2 is Model 4; it isn't. The first pass's pairing of Model 3 with
  Fable 5.2 stands. The ECI section found Fable 5.2 above every charted
  checkpoint once the map bends. On AECI itself it isn't; the gap there is
  ECI's domain mix, not Fable 5.2's lead.
- **The figure doesn't change.** Its series already has Model 3 and Model
  4, under METR's labels; the content file's comment says what they are.
  The plots label them from `series.PAIRINGS`, and leave the speculative
  ones unlabelled.

## History

- **First pass** (fable). The check, with the tweet's inputs: the file's date
  for the early checkpoint, Jurkovic's constants, profile-likelihood
  intervals. It gave 2027.64 (2027.44 to 2027.89).
- **The figure** (Opus 5.5, building a9l.im's home page). Found that the
  chart dates the early checkpoint before Mythos Preview, that Jurkovic's map
  is the least-squares line through the eight pairs, and that its slope
  interval alone moves the date from 2027.52 to 2027.80, which the first
  pass's interval left out. Read the AECI whiskers. Wrote the site's fit: the map from the table, the two views, the
  bootstrap.
- **The port** (fable). `series.py` builds the site's table, `fit.py`
  carries the site's fit, `replicate.py` reruns the whole check on it, and
  the chart shows the bars and bands. What moved:
  - Measured only went from 2027.92 to 2027.73. That is the redating: the
    last measured point is six weeks earlier.
  - The public-ECI row was wrong in the first pass. It restarted the record
    in April 2026, which let in three models below the standing record (Qwen
    3.6 35B-A3B, Opus 4.7, GPT-5.5). With the running record it has six late
    points and reads 2028.56, hyperbola behind by 5; it read 2028.59, tied.
  - AECI is read with one line through all the y ticks instead of from tick
    to tick. Values moved by at most 0.02.
  - The backtest is rolling, from every origin, instead of eight chosen
    cutoffs, and the simulation reports where the fitted date lands as well
    as how straight the line is.
  - I first wrote that the date carries little, from the single-fit
    simulation. a9 pointed out that it had stayed between 2027.5 and 2028
    since late 2025. Simulating the date's whole path showed that this is
    what separates the curves, and the drift test went in.
  - The public-dates row is new. The row that put AECI through Epoch's map
    (4.74 points per doubling) is gone; that slope is inside the map's
    interval now.
- **ECI as a third scale** (Opus 5.5, with a9, 2026-11-12). Added for a
  branch of the site's figure and then dropped. `three_scales.py`,
  `conversions.py` and the two plots come from it, as does the Claude ECI
  offset in "ECI as a third scale". Then `eci_gap.py`, which takes the offset
  apart by benchmark: it is domain mix, with no measurement bias found.
- **OECI** (Opus 5.5, with a9, 2026-11-19). `oeci.py`, `oeci_plot.py`,
  `oeci.png` and `data/openai-2026-11-18/`; see "OECI". Then
  `oeci_routes.py` and `data/epoch-2026-11-19/`, for a9's question about
  weights and GPT-6.2 Astra. Then `aeci_subset.py`, a9's idea of picking
  benchmarks to imitate AECI, and `aeci_imitation.py` with
  `aeci-imitation.png`, which checks it against METR and puts every lab
  on it.
- **METR's capability update** (Opus 5.5, with a9, 2026-11-20). The move
  into this repo, `drift` moved from `replicate.py` into
  `fit.py` so other scripts can use it, then `metr_q4.py`, `metr_q4_plot.py`,
  `metr-q4.png` and `data/metr-2026-11-20/`; see "METR's capability update".
  Then `metr_rulers.py`, for a9's question about the public rulers.
- **One source for each thing** (Opus 5.5, with a9, 2026-11-20). The
  Python port of the fit and `parity.py` replaced by the bridge to
  `tools/horizon-fit.mjs`; the figure's series read from the content table;
  one registry of names; one Epoch snapshot, with the sections that used the
  11 November copy rerun; plot labels computed. See "One source for each
  thing".
- **Regimes or smooth acceleration** (Opus 5.5, with a9, 2026-11-20).
  `fit.breaks` generalizes the one-break curve to any number of knots,
  vectorized over histories; `fit.rolling` moved out of `replicate.py`; then
  `regimes.py`.
- **Fable 5.2's system card** (Opus 5.5, with a9, 2026-11-20). `series.CARD`
  and the section of that name.
- **Pairings with a status** (Opus 5.5, with a9, 2026-11-20).
  `series.PAIRINGS` replaces the Model 3 filters written into nine scripts.
  The contradicted `--f52=model4` option is gone. `fit.aeci_on_eci` now
  uses released models only, like the rest; the plots label the
  identified checkpoints.
