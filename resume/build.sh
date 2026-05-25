#!/usr/bin/env bash
# Builds resume.pdf from resume.tex via tectonic and moves it to repo root.
# Invoked by _build.mjs (graceful skip if tectonic missing).

set -euo pipefail

cd "$(dirname "$0")"

TECTONIC=""
for p in tectonic /opt/homebrew/bin/tectonic /usr/local/bin/tectonic; do
  if command -v "$p" >/dev/null 2>&1; then TECTONIC="$p"; break; fi
done

if [ -z "$TECTONIC" ]; then
  echo "resume: tectonic not installed — skipping PDF build (brew install tectonic)" >&2
  exit 0
fi

"$TECTONIC" --chatter=minimal resume.tex
mv resume.pdf ../resume.pdf
echo "resume: ../resume.pdf"
