# Surveys plan

The finished feature is an open psychometric battery at `a9l.im/surveys/`: a root-site
page with its own header nav item beside `/sims`, `/projects`, and `/blog`. It is not a
sim and not a submodule. It measures personality, values, and cognitive ability with
openly licensed instruments, scores everything client-side, and reports the result as a
**human model card**.

The data, scoring, local storage, generator, and the `POST /api/surveys` contribution
endpoint exist; `AGENTS.md` in this directory describes them. The frontend is unbuilt,
so nothing is user-visible yet.

## Concept

- **Results as a model card.** The results page follows ML model-card structure:
  metadata, intended use, evaluation results, distribution shift, limitations.
- **No naked point estimates.** Every score renders as an interval or density: an SEM
  band from published reliabilities for Likert scales, the IRT posterior SD for
  ability, and within-person spread across retakes. Shortening the battery visibly
  widens the bands.
- **Several scoring lenses over one item bank.** The user picks scoring keys; the
  battery is the union of their items, and the results page can re-render the same
  responses under any key whose items were answered (partial coverage shows wider
  bands and a coverage warning rather than a refusal).
- **Local-first.** Sittings and history stay in the browser with JSON export/import.
  The only network write is an explicit, separate "contribute this sitting to the open
  pool" action after the user has seen their results.
- v1 is English-only.

## Instruments and licensing

| Domain | Instrument | In the data | License | Obligations |
|---|---|---|---|---|
| Big Five, 30 facets | IPIP-NEO-300 (Goldberg) | 300 items | Public domain (IPIP blanket grant: any purpose, commercial or not, no permission needed) | citation courtesy |
| Big Five, 10 aspects | BFAS (DeYoung, Quilty & Peterson 2007, IPIP keys) | 100 items | Public domain, except two items flagged on the IPIP key page: footnote (c) newly written, footnote (d) BFI-derived | both replaced with IPIP-NEO items; the swap is recorded in `data/manifest.json` |
| HEXACO, 24 facets | IPIP-HEXACO (Ashton, Lee & Goldberg 2007) | 240 items | Public domain | citation |
| Schwartz values, 10 values / 2 axes | ESS Human Values Scale (PVQ-21), from the ESS source questionnaire | 21 items | CC BY-SA 4.0 (ESS documentation license) | attribution; share-alike on the adapted wording (gendered portraits rewritten in singular they) |
| Matrix reasoning | Open Matrices Item Bank (Koch et al. 2022) | 219 items (the 220 published, less one without 2PL parameters) | GPLv3, stated in the article; the OSF project carries no license field or file | license notice and source link on the site |
| Mental rotation | Ganis & Kievit 2015 stimuli | 96 same/different trials over the 12 objects in the published validation sample | CC BY 4.0 (Figshare record) | attribution |
| Matrix reasoning, overflow | MaRs-IB (Chierchia et al. 2019) | not included | CC BY-NC 3.0 (`License.txt` in the OSF project's license component) | citation; non-commercial use, which fits this site |

Verbal ability has no clean instrument (ICAR is gated; VIQT and WordSum licensing is
unverifiable). The options are to skip it or to author original vocabulary items: word
lists are not copyrightable, only curated test sets are. Authored items would be marked
"uncalibrated, norms pending" until pool data supports an IRT calibration.

Rejected instruments, each a plausible re-proposal:

- **ICAR** — PsychArchives serves the items under a gated "Scientific Use License"
  despite the public-domain framing; only the readme is public.
- **HMT** (matrices) — access requires emailing the authors.
- **HEXACO-PI-R** — its authors do not allow collection through publicly accessible
  online surveys; IPIP-HEXACO is the intended public-domain substitute.
- **PVQ-RR or PVQ copies from Schwartz's repository** — CC BY-NC-ND, which forbids the
  adapted wording; the ESS copy is the source.
- **SSVS** — no license statement exists anywhere.
- **openpsychometrics VIQT and MGKT** — their Creative Commons grant names four other
  instruments, not these.
- **O*NET Interest Profiler** — usable in principle, but the tools-developer license's
  validation-study clause, mandatory modification notice, and trademark rules are not
  worth carrying for one domain. Vocational interests are therefore out of v1.

## Battery and depth

- Items are shared across keys: an IPIP item's ID is a hash of its normalized wording,
  so a wording used by NEO-300 and IPIP-HEXACO is asked once.
- Depth is a whole-number percentage from 20 to 100, shown with the resulting item
  count and estimated time.
  - **Likert keys:** each scale of each selected key contributes its top ⌈p·n⌉ items by
    priority rank. NEO-300 ranks are within-scale item–rest correlations from Johnson's
    IPIP-NEO-300 response data; BFAS and IPIP-HEXACO use a sign-balanced source order
    because no public item-level calibration sample exists for them.
  - **PVQ-21:** the first ⌈p·n⌉ items of each value, in source order.
  - **Ability:** the top ⌈p·n⌉ items of each bank, ranked by greedy maximin 2PL test
    information over θ = −2 … 2.
- IPIP-NEO-120 and Mini-IPIP are not separate profiles. The single NEO-300 key sampled
  by depth keeps every shortened battery nested in one item bank and makes the
  precision trade explicit.
- As the slider moves, the UI shows the predicted interval width (Spearman–Brown on the
  administered fraction), so shortening is a visible precision trade.
- Instructed-response attention items are mixed into the personality block.
- Client-side computerized adaptive testing for ability is a later option; the 2PL EAP
  scorer it needs already exists.

## Scoring

- **Likert with norms (NEO-300):** the answered items' mean is prorated to a full-scale
  raw score and converted to a percentile by interpolating the norm cell's quantiles.
  The 95% band uses SEM = SD·√(1−r), where r is α Spearman–Brown-adjusted for the
  administered fraction.
- **Likert without norms (BFAS, IPIP-HEXACO):** a 0–100 position on the response scale
  with a conservative band, labeled as a response-scale score rather than a percentile.
- **Domains:** the mean of the available facets' centers and band endpoints.
- **Values:** value means are ipsatized against the person's mean over all answered
  items (Schwartz's convention). The two axes are differences of higher-order group
  means: openness to change (self-direction, stimulation, hedonism) against
  conservation (security, conformity, tradition), and self-transcendence
  (universalism, benevolence) against self-enhancement (achievement, power).
- **Ability:** 2PL EAP θ with a standard-normal prior and the posterior SD as the band.
  Percentiles are relative to the calibration sample and labeled as such. OMIB was
  calibrated on German medical-school applicants (N = 2,561), an above-average sample.
  Rotation parameters approximate a 2PL from the published validation sample (N = 54):
  empirical difficulty, bounded point-biserial discrimination. It is the weakest
  calibration in the battery, and the model card says so.
- Responses are canonical; scores are always recomputed from them, so new keys and
  norms apply retroactively to old sittings and pool rows.

## Norms

- **IPIP-NEO-300:** empirical percentile tables from Johnson's OSF IPIP-NEO-300 data,
  for adult respondents by age band, sex, and country and their two- and three-way
  combinations. A cell is emitted only with n ≥ 1,000; the overall adult cell holds
  about 240k respondents. A published norms paper (EJPA) built tables from the same
  data. The most specific matching cell wins, falling back to broader cells.
- **PVQ-21:** no population norms. ESS microdata requires a registered ESS identity
  and is CC BY-NC-SA, so derived tables would inherit that license. Values are
  reported as an ipsatized profile.
- **Ability:** the published calibration samples only, labeled.
- **BFAS and IPIP-HEXACO:** none yet. Where only published means and SDs exist,
  normal-approximation percentiles are acceptable if visibly flagged as parametric.
- The raw datasets are hundreds of MB, so norms come from an offline generator with
  committed deterministic output, not from the deploy build.

## Demographics

All fields are optional and coarse at collection time, so precise values never exist
anywhere: adult age band, sex assigned at birth, current gender, country, and education
level. Only `female`/`male` sex assigned at birth selects the source data's
sex-specific norm cells; current gender is stored separately and never selects a norm.
Ethnicity and sexual orientation are out of v1. A native-English flag belongs with
verbal norms if verbal ships.

## Results: the model card

1. **Model details** — sitting dates, battery composition, depth, keys, schema version;
   retakes listed like checkpoint revisions.
2. **Intended use** — self-exploration, with the not-a-clinical-instrument disclaimer.
3. **Evaluation results** — per domain, interval bars or small densities per scale,
   percentile against the selected reference population, a key selector that
   re-renders the same responses under another lens, facet drill-down.
4. **Distribution shift** — retake overlay: past sittings per scale with within-person
   spread, and an average-versus-latest toggle.
5. **Limitations** — generated from the sitting: shortened form, single sitting versus
   retest, norm-sample mismatch (OMIB's calibration sample, rotation's N = 54),
   self-report caveats, attention-check status.
6. **Export** — the full sitting and scores as JSON; a shareable card image later.

## Pool

- **Write path (built):** one D1 table behind a same-origin, rate-limited POST. A row
  holds the schema version, the server-assigned month, coarse demographics, battery
  configuration, item-level responses, quality flags, the consent-text version, and the
  data license (CC0-1.0). Item-level responses rather than scores let the pool support
  re-keying, IRT calibration of authored items, and publication as an open dataset
  with its license fixed from the first row.
- Consent copy states that contributions are anonymous, that aggregate display is
  thresholded, and that the dataset may be published openly. Contribution is a
  separate explicit act after seeing results.
- Quality flags (attention checks, completion time, straight-lining, self-reported
  honesty, "taken before") travel with the row. The pool filters on them; the user's
  own results are never gated.
- **Read path (later):** empirical percentiles per demographic cell unlock at
  n ≥ 1,000, over a fixed menu of marginals and a few curated two-way cells, never
  free cross-tabs, with rounded percentiles and the threshold enforced server-side.
  Coarse buckets, a fixed menu, a server-side threshold, and rounding remove most of
  the re-identification surface without differential privacy.

## Site integration

- **Page:** `features/surveys/` gains an `index.html` shell and app JS/CSS. It consumes
  `/shared/base.css` and the `/shared/*.js` modules; `forms.js` mode groups and slider
  bindings are the survey's main UI primitives.
- **Staging:** `src/data.js` fetches `/surveys/data/…` and rotation items reference
  `/surveys/assets/rotation/…`, so `tools/stage-assets.mjs` must copy the page, `src/`,
  `data/`, and `assets/` into `dist/surveys/` and keep `build/`, `tests/`, and the docs
  out. `tests/deploy-layout/run.mjs` currently forbids both `surveys/` and `features/`
  in `dist/`; the `surveys/` rule changes with the staging.
- **Serving:** `/surveys/` is a plain static page (`html_handling:
  auto-trailing-slash`) and stays out of `run_worker_first`. The Worker already routes
  `/api/surveys` through the existing `/api/*` entry.
- **Navigation:** a header link in `site/index.html` (desktop navbar and mobile menu)
  and a `nav.*` label in `site/i18n.js` (EN and JA). The link carries no `data-page`,
  because the router intercepts `[data-page]` links as SPA routes. The page owns its
  own `<head>` metadata. There is no project-grid card: it is a page of the site, not
  a portfolio item.
- **Build and SEO:** a `/surveys/` entry in the main sitemap (`tools/build.mjs`);
  `/surveys/*` cache and security entries in `static/_headers` within its 100-rule
  limit; an OG card through `tools/og/generate.js`; JSON-LD for WebApplication,
  FAQPage, and BreadcrumbList, plus Dataset once the pool publishes.
- **Licenses and credits panel** (required): IPIP citation, OMIB GPLv3 notice and OSF
  link, Ganis & Kievit CC BY attribution, ESS CC BY-SA note on the adapted wording,
  MaRs-IB citation if it is used.

## Remaining work

### Before launch

- The frontend: battery setup (keys, depth, optional blocks, demographics), the item
  runner for Likert, matrix, and rotation trials, the model card, retake history,
  export/import, the contribution flow, and the site integration above.
- Foundation fixes the frontend will hit:
  - The Worker's country allowlist (`worker/surveys.js`) does not match the norm
    cells. It holds 9-character truncations (`Netherlan`, `New Zeala`, `Philippin`,
    …) and countries without a cell, while the cells use full names and include
    `Thailand`. One country vocabulary should serve both.
  - The Worker caps a contribution at 750 responses, but all three keys plus values
    and both ability blocks reach 850 at full depth; the cap is crossed at depth 83.
  - Ability blocks scale with depth up to the full banks (219 matrices at about 45 s
    each), so a full-depth battery with every block estimates about 4.5 hours and even
    20% includes 44 matrices. The intent is a fixed-length, information-maximizing ability subset
    rather than a share of the bank; the length is undecided.
- Compliance:
  - [x] BFAS items (c) and (d) replaced with IPIP equivalents (`data/manifest.json`).
  - [x] MaRs-IB license confirmed as CC BY-NC 3.0; relevant only if its items are added.
  - [ ] OMIB: the OSF project has no license field or file, so the GPLv3 grant rests on
        the article's own statement (the manifest cites it). Accept that or ask the
        authors.
  - [ ] Verbal: skip in v1, or author items marked uncalibrated.
  - [ ] Values norms: stay norm-free, or register for ESS microdata and publish derived
        tables under CC BY-NC-SA.
  - [ ] Data and privacy page: what is stored where, the consent text, the no-IP-
        retention statement, and the pool's publication intent and CC0 license. The
        Worker accepts one `consent_version`; new consent text needs a new version on
        both sides.
  - [ ] Not-a-clinical-instrument disclaimer; no diagnostic screens anywhere in scope.
  - [ ] Licenses and credits panel.

### Later

- Pool read path, pool-derived norm tables beside the published ones, and a first open
  dataset release once volume warrants.
- An authored vocabulary bank calibrated from pool responses; the pool closes the gap
  licensing left open.
- Client-side CAT for ability.
- Vocational interests through a verified-open instrument. The first candidate is ORVIS
  (Oregon Vocational Interest Scales; Pozzebon, Visser, Ashton, Lee & Goldberg 2010),
  from the same Oregon public-domain program as IPIP; its license is unverified.
- More domains where a genuinely open instrument exists; Japanese translation through
  the root i18n pattern.

## References

- IPIP permission: https://ipip.ori.org/newPermission.htm ; keys:
  https://ipip.ori.org/newMultipleconstructs.htm, https://ipip.ori.org/BFASKeys.htm
  (footnotes c and d), https://ipip.ori.org/newHEXACO_PI_key.htm ; IPIP-NEO keys
  mirror: https://osf.io/ycvdk/
- Johnson's IPIP-NEO data: https://osf.io/tbmh5/ (components `wxvth`, `sxeq5`; no
  formal license tag), basis of the norms paper doi:10.1027/1015-5759/a000644
- HEXACO-PI-R online-collection restriction: https://hexaco.org/hexaco-inventory
- ESS licenses: https://www.europeansocialsurvey.org/contact/disclaimer (data
  CC BY-NC-SA 4.0, documentation CC BY-SA 4.0); PVQ-21 source questionnaire:
  https://www.europeansocialsurvey.org/sites/default/files/2023-06/ESS_core_questionnaire_human_values.pdf ;
  microdata: https://ess.sikt.no/
- Schwartz repository (NC-ND, not a source): doi:10.9707/2307-0919.1173
- O*NET licenses: https://www.onetcenter.org/license_tools.html and
  https://www.onetcenter.org/license_toolsdev.html
- OMIB: article https://pmc.ncbi.nlm.nih.gov/articles/PMC9326670/ (GPLv3 in the
  abstract); items and 2PL parameters https://osf.io/4km79/
- MaRs-IB: https://royalsocietypublishing.org/doi/10.1098/rsos.190232 ; items
  https://osf.io/g96f4/ ; license component https://osf.io/rd5jv/ ; IRT follow-up
  (MIT): https://github.com/ndawlab/mars-irt
- Ganis & Kievit stimuli (CC BY 4.0): https://doi.org/10.6084/m9.figshare.1045385
- ICAR gating: https://www.psycharchives.org/jspui/handle/20.500.12034/17526
- HMT gating: https://access.gesis.org/zis/655
