# Survey data build

`generate_data.py` turns the upstream instrument releases into the committed files in
`features/surveys/data/` and copies the licensed mental-rotation JPEGs into
`features/surveys/assets/rotation/`. Raw source datasets stay outside the repository.

The generator requires Python 3 with `numpy`, `pandas`, `lxml`, and `openpyxl`.

```bash
python features/surveys/build/generate_data.py --source-dir /path/to/survey-sources
```

The source directory must contain `BFASKeys.raw`, `newHEXACO_PI_key.raw`,
`IPIP300-120ComparisonTable.raw`, `IPIP300.dat`, `neo300.xlsx`,
`omib-item-data.xlsx`, the OMIB construction
workbooks extracted under `omib-web/`, `rotation-data.zip`, and the extracted Figshare
JPEG directory at `rotation-images/All stimuli as jpg `/.

Licensing and provenance are recorded in `features/surveys/data/manifest.json`. The ESS item
wording is adapted under CC BY-SA 4.0. ESS microdata is deliberately absent: it
requires a registered ESS user identity, so the build does not ship population norms
for PVQ-21.
