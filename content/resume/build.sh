#!/usr/bin/env bash
# Builds resume.pdf from resume.tex into the requested output path.
# Invoked by tools/build.mjs (graceful skip if tectonic is absent).

set -euo pipefail

cd "$(dirname "$0")"
OUTPUT_PATH="${1:-../../dist/resume.pdf}"

TECTONIC=""
for p in tectonic /opt/homebrew/bin/tectonic /usr/local/bin/tectonic; do
  if command -v "$p" >/dev/null 2>&1; then TECTONIC="$p"; break; fi
done

if [ -z "$TECTONIC" ]; then
  echo "resume: tectonic not installed — skipping PDF build (brew install tectonic)" >&2
  exit 0
fi

"$TECTONIC" --chatter=minimal resume.tex
mkdir -p "$(dirname "$OUTPUT_PATH")"
mv resume.pdf "$OUTPUT_PATH"
echo "resume: $OUTPUT_PATH"
