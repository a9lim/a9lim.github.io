---
heading: In the foothills of the singularity
alt: Record 50% time horizons of AI models since 2019, with a hyperbolic and a double-exponential fit.
keyHyperbolic: hyperbolic
keyDoubleExponential: double exponential
keyReported: reported
keyConverted: converted
axisDate: date
axisLeft: time before the singularity
axisAeci: AECI
axisHorizon: 50% time horizon
today: today
singularity: fitted singularity
caption: fitted singularity {date} (95%: {low} – {high})
# The build fits everything from the two tables below (tools/horizon-fit.mjs):
# the AECI–horizon map through every model that has both values (it comes out
# as Nikola Jurkovic's, x.com/nikolaj2030/status/2118777653981507716), then a hyperbola and a double exponential in each y view,
# with 95% bands from 2,000 bootstrap replicates that redraw the map and
# resample each fit's residuals.
#
# Intervals are METR's 95%: horizons from METR's file, AECI read off the
# whiskers of METR's chart (3.5 Sonnet is the AECI anchor and has none).
# Dates are public releases, except internal checkpoints, which take the date
# METR's AECI chart gives them (when most Anthropic staff could use them). The
# early Mythos Preview checkpoint is one: METR's horizon file gives it the
# public Mythos Preview release, 7 April 2026.
---
Measured: [METR v1.1](https://metr.org/time-horizons/), to April 2026. AECI: [METR’s 5 November 2026 scores](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/). Inspired by [Benjamin Todd’s chart](https://x.com/ben_j_todd/status/2119787039210049930) of 9 November. Fits by Claude.

| Model | Date | Horizon (min) | Horizon 95% | AECI | AECI 95% |
| --- | --- | --- | --- | --- | --- |
| GPT-2 | 2019-02-14 | 0.05378 | 0.009994–0.1418 | | |
| davinci-002 | 2020-05-28 | 0.1441 | 0.09332–0.2212 | | |
| GPT-3.5 Turbo Instruct | 2022-03-15 | 0.5992 | 0.2551–1.116 | | |
| GPT-4 | 2023-03-14 | 3.987 | 1.933–7.995 | | |
| GPT-4 Turbo | 2023-11-06 | 4.045 | 1.867–8.443 | | |
| GPT-4o | 2024-05-13 | 6.991 | 4.001–12.91 | | |
| Claude 3.5 Sonnet | 2024-06-20 | 11.4 | 5.49–22.38 | 130.00 | |
| o1-preview | 2024-09-12 | 20.33 | 11.72–33.38 | | |
| Claude 3.5 Sonnet (Oct 2024) | 2024-10-22 | 20.52 | 10.14–40.82 | 133.20 | 127.4–136.9 |
| o1 | 2024-12-05 | 38.83 | 21.16–64.95 | | |
| Claude 3.7 Sonnet | 2025-02-24 | 60.39 | 33.01–104.2 | 141.71 | 138.0–143.6 |
| o3 | 2025-04-16 | 119.7 | 74.62–190.9 | | |
| GPT-5 | 2025-08-07 | 203 | 112.6–405.6 | | |
| Gemini 3 Pro | 2025-11-18 | 224.3 | 139.6–379.2 | | |
| Claude Opus 4.5 | 2025-11-24 | 293 | 161.7–623.7 | 152.32 | 148.4–155.0 |
| GPT-5.2 | 2025-12-11 | 352.2 | 198.1–815.2 | | |
| Claude Opus 4.6 | 2026-02-05 | 718.8 | 316.7–3634 | 157.26 | 153.1–160.5 |
| Mythos Preview (early) | 2026-02-24 | 1045 | 508.9–3304 | 162.32 | 154.3–169.5 |
| Mythos Preview | 2026-04-01 | | | 165.65 | 159.9–172.7 |
| Mythos 5 | 2026-06-01 | | | 168.60 | 162.5–177.1 |
| Model 2 Early | 2026-07-10 | | | 171.75 | 165.0–181.9 |
| Model 2 | 2026-08-07 | | | 174.04 | 166.7–185.7 |
| Model 3 Early | 2026-09-09 | | | 176.36 | 169.0–188.9 |
| Model 3 | 2026-09-22 | | | 176.96 | 169.2–190.6 |
| Model 4 | 2026-09-25 | | | 178.63 | 170.6–192.8 |

| Calibration only | Date | Horizon (min) | Horizon 95% | AECI | AECI 95% |
| --- | --- | --- | --- | --- | --- |
| Claude 3 Opus | 2024-03-04 | 3.952 | 1.706–8.765 | 124.72 | 117.8–127.5 |
| Claude Opus 4 | 2025-05-22 | 100.4 | 59.99–163.5 | 144.79 | 140.8–147.1 |
