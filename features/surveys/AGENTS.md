# Surveys

Foundation for the open psychometric battery planned at `a9l.im/surveys/`: committed
instrument data, client-side battery construction and scoring, local sitting storage,
the offline data generator, and tests. The frontend is unbuilt, so nothing here is
staged or user-visible; the contribution endpoint `POST /api/surveys` is live in the
Worker. This directory belongs to the root repository (not a submodule); the root
`AGENTS.md` covers the shared layer, design system, build, and deployment.
`PLAN.md` holds the product design, instrument licensing decisions, and remaining work.

## Running and checking

```bash
node --test features/surveys/tests/*.test.mjs   # scoring, battery, and Worker API contracts
for f in features/surveys/src/*.js worker/surveys.js; do node --check "$f"; done
python3 -c 'import ast; ast.parse(open("features/surveys/build/generate_data.py").read())'
```

The root `npm test` runs the same test files after the site checks. `api.test.mjs`
drives `POST /api/surveys` through `worker/index.js` against a stub D1 binding; that
module imports `.build/content.generated.mjs`, so the test needs a completed root build.

## Layout

- `src/scoring.js` — battery construction (`buildBattery`), depth normalization,
  Spearman–Brown reliability, norm-cell selection, Likert/PVQ/2PL scoring, quality flags.
- `src/data.js` — fetches the static data from `/surveys/data/`; NEO norms load on demand.
- `src/storage.js` — schema-v1 sittings and drafts in `localStorage`, JSON export/import.
- `data/items/` — `ipip.json` (the shared IPIP bank and 5-point accuracy scale) and
  `pvq21.json` (adapted ESS wording, 6-point scale).
- `data/keys/` — `neo300`, `bfas`, `hexaco`: domains, scales (α, full item count), and
  item→scale/direction entries with priority ranks.
- `data/norms/ipip-neo/neo300.json` — empirical NEO-300 quantiles per demographic cell.
- `data/irt/` — OMIB matrices and Ganis–Kievit rotation trials with 2PL `a`/`b`.
- `data/priority/` — the depth-control rankings, each with its method string.
- `data/manifest.json` — source-file hashes, BFAS item replacements, norm provenance.
- `assets/rotation/` — the 96 rotation JPEGs copied from the Figshare release.
- `build/generate_data.py` — deterministic source-to-artifact generator; `build/README.md`
  lists its inputs.
- `tests/` — `scoring.test.mjs`, `api.test.mjs`.

Outside this directory: `worker/surveys.js` (validation and storage), the
`/api/surveys` branch at the top of `worker/index.js`'s fetch handler,
`db/migrations/0001_surveys.sql` (the `survey_contributions` table), and the
`SURVEYS_DB` D1 binding in `wrangler.jsonc`.

## How it works

### Data pipeline

`build/generate_data.py --source-dir <dir>` reads the upstream releases listed in
`build/README.md` and writes `data/` and `assets/rotation/`; raw sources stay outside
the repository. It derives NEO-300 priorities (within-scale item–rest
correlations) and norm cells from Johnson's data, emitting a cell only with ≥ 1,000
adult records; it ranks ability items by greedy maximin 2PL information; the PVQ-21
wording is embedded in the script.

### Battery and scoring

- An IPIP item's ID is `ipip-` plus the first 12 hex digits of the SHA-1 of its
  normalized wording, so wordings shared by several keys dedupe when `buildBattery`
  unions the selected keys.
- `buildBattery(data, config, seed)` takes `config.depthPercent` (normalized to an
  integer 20–100), and takes the top ⌈p·n⌉ items per scale for Likert keys, per value
  for PVQ (source order), and per bank for OMIB and rotation (priority rank). The
  personality block is shuffled deterministically from `seed`, and up to two
  instructed-response attention items are inserted into it.
- `scorePersonalityKey` prorates each scale to a full-length raw score; with a norm
  cell it returns a percentile and a 95% band from SEM = SD·√(1−r), otherwise a 0–100
  response-scale position (`metric: 'response-scale'`). Only NEO-300 has norms.
- `scorePVQ` ipsatizes value means and returns the two Schwartz axes; `scoreIRT` is a
  grid EAP with a standard-normal prior and expects responses already scored 0/1.
- `qualityFlags` derives timing, straight-lining, and attention-check flags.

### Local storage

Sittings live under `a9lim.surveys.sittings.v1` and an in-progress draft under
`a9lim.surveys.draft.v1`. Exports are `{type: 'a9lim-surveys-export', schema_version: 1,
exported_at, sittings}`; import validates every sitting and merges by `id`.

### Contribution API

`contributeSurvey` accepts one schema-v1 JSON body and answers with `no-store`,
`noindex` JSON:

- 503 without `SURVEYS_DB`; 403 unless `Origin` equals the request origin; 415 for a
  non-JSON content type; 413 above 256 KiB; 400 for unparseable JSON; 422 for any
  schema violation; 429 when the same IP made a valid contribution in the last five
  minutes (tracked in memory per isolate); 409 for a repeated `submission_id`; 201 on insert. Other methods get 405.
- The schema requires `consent_version: '2026-07-19'`, `license: 'CC0-1.0'`, a UUID
  `submission_id`, a battery (`depth_percent` 20–100, keys from `neo300`/`bfas`/`hexaco`,
  `values`/`omib`/`rotation` booleans), whitelisted coarse demographics, at most 750
  responses with ID-pattern-checked keys, and the ten quality flags.
- Responses are raw choices: 1–6 for Likert items, `same`/`different` for rotation, and a
  20-bit string for OMIB in the format of the item's `solution`. The pool stores no scores.
- The month is taken from the server clock. The client IP exists only as an in-memory,
  per-isolate rate-limit key and is never written.

## Conventions

- `schema_version` stays 1: nothing has shipped that would need a migration, so
  sittings, exports, the API, and the D1 `CHECK` constraint all pin it.
- Item responses are canonical and scores are recomputed, so improved keys or norms
  apply to old sittings and pool rows.
- Personality has one NEO profile, `neo300`; shorter batteries are depth samples of it
  scored against the same norms with coverage-adjusted reliability. Separate
  IPIP-NEO-120 or Mini-IPIP profiles would break that nesting.
  `IPIP300-120ComparisonTable.raw` is read only for the NEO-300 facet names and α values.
- Every score carries an interval; nothing renders a bare point estimate.
- Demographics are adult-only and coarse. Only `sex_assigned_at_birth` values `female`
  and `male` select the sex-keyed norm cells; current `gender` never does. Ethnicity
  and sexual orientation are not part of schema v1.
- `data/` and `assets/rotation/` are generator output. A generator change is checked by
  regenerating into a temporary `--output-dir`/`--asset-dir` and diffing against the
  committed files; both are committed together.
- The paths in `src/data.js` and the rotation items' `left`/`right` URLs assume the
  feature is served at `/surveys/`.
- Each item, key, and IRT file carries its instrument's license and source; the
  evidence for each license is in `PLAN.md`.
- New consent text needs a new `consent_version` in both the frontend and
  `worker/surveys.js`.
- The remote D1 database is `a9lim-surveys`; its ID in `wrangler.jsonc` is
  configuration, not a secret. Schema changes are new numbered files in
  `db/migrations/`.

## Open work

The frontend, site integration, and the open compliance items are in `PLAN.md`
("Remaining work"). Three foundation issues will surface with the frontend: the
Worker's country allowlist does not match the norm cells' country names, the 750-response
cap is below the 850 responses of a full-depth battery with every block, and ability
block length scales with depth to the full banks.
