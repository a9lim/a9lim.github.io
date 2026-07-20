# AGENTS.md

Survey-specific instructions for `features/surveys/`. The repository-root `AGENTS.md` still
applies; this file adds the contracts that are easy to miss when working on the
psychometrics project.

## Current boundary

This directory currently contains the survey data, scoring, persistence, build, and
test foundation. The first frontend was deliberately removed so it can be redesigned
in a future session.

- Do not add a survey page, navigation entry, static route, sitemap entry, OG image,
  or other public frontend integration unless a9 explicitly asks for that frontend
  pass.
- `features/surveys/` is intentionally excluded from `dist/`. The Worker API remains
  live independently of static survey files.
- The future v1 frontend is English-only unless a9 revisits localization.
- When the frontend returns, consume the root shared design system and utilities
  before adding survey-specific equivalents.

## Stable v1 model

- Keep `schema_version: 1`. There is no published or committed predecessor that
  requires a migration to v2.
- Personality has one nested IPIP-NEO profile: `neo300`. Do not recreate Mini-IPIP,
  IPIP-NEO-120, or separate NEO profiles for different lengths.
- Battery length is `depth_percent`, a whole number from 20 through 100. Internally,
  `buildBattery` receives the camel-case `depthPercent`. Each Likert scale contributes
  the top `ceil(depth * item_count)` ranked items, so the slider is continuous while
  the effective item set advances in deterministic per-scale steps.
- The other personality lenses are BFAS and IPIP-HEXACO. Values use PVQ-21; ability
  uses OMIB and the Ganis-Kievit mental-rotation bank.
- Item responses are canonical. Scores are recomputed from responses so later
  scoring improvements can apply to old local sittings and contributed rows.
- Never present naked point estimates. Personality output carries reliability- and
  coverage-aware intervals; ability output carries an IRT posterior interval.
- Shortened NEO batteries use the one NEO-300 norm profile with coverage-adjusted
  reliability. Do not create depth-specific norm/profile files unless a9 changes the
  product model.
- Pool contributions and generated NEO norm cells are adult-only. Accepted age bands
  are `18-24`, `25-34`, `35-44`, `45-54`, `55-64`, and `65+`. The generator still
  requires at least 1,000 complete records before emitting a demographic norm cell;
  accepted demographics without a supported cell fall back to a broader norm.
- Keep sex assigned at birth and current gender as separate, optional fields. The
  source NEO norm cells are keyed by binary `sex`; only `female` and `male`
  `sex_assigned_at_birth` values may select those cells. Current gender never selects
  a sex norm.
- Do not add ethnicity or sexual-orientation fields to schema v1.

## File map

- `data/items/` — shared item banks and response formats.
- `data/keys/` — item-to-scale mappings and directions for `neo300`, `bfas`, and
  `hexaco`.
- `data/norms/ipip-neo/neo300.json` — empirical NEO-300 percentile cells.
- `data/irt/` — ability items and 2PL parameters.
- `data/priority/` — deterministic item rankings used by the depth control.
- `data/manifest.json` — source hashes, licensing/provenance notes, and documented
  instrument substitutions.
- `src/scoring.js` — battery construction and all client-side scoring routines.
- `src/data.js` — static-data loader and norm cache.
- `src/storage.js` — schema-v1 local sittings, drafts, import, and export.
- `build/generate_data.py` — deterministic source-to-artifact pipeline.
- `tests/` — scoring, battery, and Worker API contracts.

The API and deployment pieces cross the directory boundary:

- `../../worker/surveys.js` owns `POST /api/surveys` payload validation and storage.
- `../../worker/index.js` routes the endpoint.
- `../../db/migrations/0001_surveys.sql` owns the D1 schema.
- `../../wrangler.jsonc` binds `SURVEYS_DB`; `../../tools/stage-assets.mjs` excludes
  this entire feature from static deployment.

## Generated data

Treat `build/generate_data.py` plus the upstream releases as the source of truth for
`data/` and `assets/rotation/`. Do not hand-maintain generated JSON or copied stimuli.

- Raw survey datasets stay outside the repository.
- Required upstream filenames and Python dependencies are listed in `build/README.md`.
- Preserve source hashes and licensing/provenance in `data/manifest.json`.
- `IPIP300-120ComparisonTable.raw` remains an upstream metadata source for the
  NEO-300 alpha values; its name is not permission to regenerate a NEO-120 key.
- If generator logic changes, regenerate into a temporary directory first and diff it
  against the committed artifacts. Commit generator and artifact changes together.

Generator command:

```bash
python features/surveys/build/generate_data.py --source-dir /path/to/survey-sources
```

## API and privacy

The contribution endpoint is intentionally small and write-only.

- Personal sittings remain local unless the user explicitly contributes one.
- Accept only schema-valid, same-origin JSON POSTs with `depth_percent` and the
  supported key IDs.
- Store no IP address or request metadata. The in-memory IP-derived value is only a
  short rate-limit key.
- Keep demographics coarse and optional, contribution consent explicit, and the
  contributed data license `CC0-1.0`.
- Store item-level responses rather than frozen scores.
- The existing remote D1 database is `a9lim-surveys`; its database ID is configuration,
  not a secret. Do not destroy, recreate, or migrate it without explicit authorization.

## Licensing

Do not loosen or guess instrument licensing. `data/manifest.json` and the build source
record the implemented provenance.

- IPIP keys/items are public domain.
- The adapted ESS PVQ-21 wording is CC BY-SA 4.0.
- OMIB carries its GPLv3 source obligation.
- Ganis-Kievit rotation stimuli are CC BY 4.0 and must retain attribution.
- The two non-clean BFAS items are replaced with documented IPIP equivalents.

Verify any new identifier, license, DOI, dataset, or instrument against its live
primary source before adding it.

## Verification

For ordinary scoring/data/API work, run:

```bash
node --test features/surveys/tests/*.test.mjs
node --check features/surveys/src/scoring.js
node --check features/surveys/src/data.js
node --check worker/index.js
node --check worker/surveys.js
git diff --check
```

When root Worker or deployment configuration changes, also run:

```bash
npm run build
npm exec -- wrangler deploy --dry-run
npm run check
```

When the generator changes, additionally run a full source-to-temporary-output build
and confirm that the diff is exactly the intended artifact change.
