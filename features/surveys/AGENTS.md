# Surveys

The planned open psychometric battery at `a9l.im/surveys/`: personality, values and ability from openly licensed instruments, scored client-side and reported as a "human model card" with an interval on every score. The data, scoring, local storage, generator and the live `POST /api/surveys` endpoint exist; the frontend doesn't, so nothing here is staged.

```bash
node --test 'features/surveys/tests/*.test.mjs'   # scoring and the Worker API (after a root build)
python3 features/surveys/build/generate_data.py --source-dir DIR   # regenerate data/ and assets/ (build/README.md)
```

## Layout

- `src/scoring.js` — `buildBattery`, depth, Spearman–Brown reliability, norm cells, Likert/PVQ/2PL EAP scoring, quality flags.
- `src/data.js` (fetches `/surveys/data/`), `src/storage.js` (schema-v1 sittings in `localStorage`, JSON export/import).
- `data/` and `assets/rotation/` — generator output: items, keys, NEO-300 norms, IRT banks, priority ranks, `manifest.json` (input hashes, the BFAS replacements, provenance).
- Outside: `worker/surveys.js`, `db/migrations/0001_surveys.sql`, the `SURVEYS_DB` binding (`a9lim-surveys`).

## Contracts

- `buildBattery(data, config, seed)` takes the top ⌈p·n⌉ items per scale (p = depth, 20–100%) by priority rank, dedupes IPIP items by a hash of their wording, shuffles the personality block from `seed` and inserts two attention items.
- The API takes one schema-v1 body (consent `2026-07-19`, license `CC0-1.0`, UUID `submission_id`, coarse demographics, ≤ 750 raw responses, the quality flags): 503 without D1, 403 cross-origin, 413/415/400/422 for bad bodies, 429 within five minutes per IP (in memory, never stored), 409 on a repeated id, 201 on insert. The month comes from the server clock.

## Conventions

- `schema_version` stays 1 until something ships. Responses are canonical and scores are recomputed, so new keys and norms apply to old sittings and pool rows.
- One NEO profile (`neo300`); shorter batteries are depth samples of it, so every battery nests in one item bank.
- Only `sex_assigned_at_birth` `female`/`male` selects sex-keyed norm cells; current `gender` never does. Demographics are adult-only and coarse.
- `data/` and `assets/` change only by regenerating (diff a regeneration in a temporary `--output-dir`); commit both together.
- New consent text needs a new `consent_version` in the frontend and `worker/surveys.js`.

## Instruments and licenses

| Instrument | License | Obligation |
|---|---|---|
| IPIP-NEO-300, BFAS keys, IPIP-HEXACO (ipip.ori.org) | public domain | citation; BFAS footnote (c)/(d) items replaced (`manifest.json`) |
| ESS PVQ-21 (Human Values Scale) | CC BY-SA 4.0 | attribution; share-alike on the adapted wording |
| Open Matrices Item Bank (Koch et al. 2022; PMC9326670, osf.io/4km79) | GPLv3, stated in the article only | notice and source link |
| Ganis & Kievit 2015 rotation stimuli (doi:10.6084/m9.figshare.1045385) | CC BY 4.0 | attribution |

Not usable: ICAR and HMT (gated), HEXACO-PI-R (no public online collection), Schwartz's PVQ copies (NC-ND), SSVS (no license), openpsychometrics' VIQT/MGKT (not covered by its grant), O*NET (license terms). PVQ-21 has no norms: ESS microdata is registered-access and NC-SA.

## Before launch

- The frontend: setup, the item runner (Likert, matrices, rotation), the model card, retakes, export/import, the contribution flow; staging into `dist/surveys/` (the site test then allows `surveys/`), a nav link without `data-page`, sitemap, `_headers` entries, JSON-LD, and a licenses and credits panel.
- Foundation fixes: the Worker's country allowlist (9-letter truncations) doesn't match the norm cells; the 750-response cap is below a full battery's 850; ability blocks scale with depth to the full banks (~4.5 h at 100%) and should be a fixed-length, information-maximizing subset.
- Open: OMIB's license rests on the article; verbal ability (skip, or authored uncalibrated items); a data and privacy page; the not-a-clinical-instrument disclaimer.
