# Survey data build

`generate_data.py` turns the upstream instrument releases into the committed files in
`features/surveys/data/` and copies the licensed mental-rotation JPEGs into
`features/surveys/assets/rotation/`. Raw sources stay outside the repository. It needs
Python 3 with `numpy`, `pandas`, `lxml`, and `openpyxl`.

```bash
python3 features/surveys/build/generate_data.py --source-dir /path/to/survey-sources
# --output-dir and --asset-dir redirect the output, e.g. to diff a regeneration
```

The source directory holds:

| Path | Upstream |
|---|---|
| `BFASKeys.raw`, `newHEXACO_PI_key.raw`, `IPIP300-120ComparisonTable.raw` | the pages of the same names at `https://ipip.ori.org/*.htm`, saved byte for byte |
| `neo300.xlsx` | `IPIP-NEO-300 scoring tool_2.xlsx`, https://osf.io/ycvdk/ |
| `IPIP300.dat` | Johnson's IPIP-NEO-300 responses, https://osf.io/wxvth/ |
| `omib-item-data.xlsx` | OMIB `Item Data.xlsx`, https://osf.io/4km79/ |
| `rotation-data/Behavioural_data/sub*.xlsx` | `Behavioural_data.zip`, extracted, from https://doi.org/10.6084/m9.figshare.1045385 |
| `rotation-images/All stimuli as jpg /` (trailing space) | `All stimuli as jpg .zip`, extracted, from the same Figshare record |

`data/manifest.json` records the SHA-256 of the six non-rotation inputs, the two BFAS
item replacements, and norm provenance. The PVQ-21 wording (ESS, adapted under
CC BY-SA 4.0) is embedded in the script. ESS microdata is deliberately absent: it
requires a registered ESS identity, so the build ships no population norms for PVQ-21.
