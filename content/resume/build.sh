#!/usr/bin/env bash
# Builds resume.pdf from resume.tex into the requested output path.
# Invoked by tools/build.mjs. Local installations are preferred; Linux CI
# bootstraps a pinned static Tectonic binary into the ignored .build cache.

set -euo pipefail

cd "$(dirname "$0")"
OUTPUT_PATH="${1:-../../dist/resume.pdf}"
TECTONIC_VERSION="0.16.9"

TECTONIC=""
for p in tectonic /opt/homebrew/bin/tectonic /usr/local/bin/tectonic; do
  if command -v "$p" >/dev/null 2>&1; then TECTONIC="$p"; break; fi
done

if [ -z "$TECTONIC" ]; then
  PLATFORM="$(uname -s)-$(uname -m)"
  case "$PLATFORM" in
    Linux-x86_64)
      TECTONIC_TARGET="x86_64-unknown-linux-musl"
      TECTONIC_SHA256="60b13a0826ae7ad9ce34b4a2df06bff2cfcfa6dda8a915477c0cbb84e1a4a902"
      ;;
    Linux-aarch64|Linux-arm64)
      TECTONIC_TARGET="aarch64-unknown-linux-musl"
      TECTONIC_SHA256="f9aa39017dbd51f111fdb93dda222178cbe51c8193508fc567b523cc74fff9c1"
      ;;
    *)
      echo "resume: tectonic is required on $PLATFORM (macOS: brew install tectonic)" >&2
      exit 1
      ;;
  esac

  TECTONIC_CACHE="../../.build/tectonic-$TECTONIC_VERSION-$TECTONIC_TARGET"
  TECTONIC="$TECTONIC_CACHE/tectonic"
  if [ ! -x "$TECTONIC" ]; then
    TECTONIC_ARCHIVE="$TECTONIC_CACHE.tar.gz"
    TECTONIC_URL="https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40$TECTONIC_VERSION/tectonic-$TECTONIC_VERSION-$TECTONIC_TARGET.tar.gz"
    mkdir -p "$TECTONIC_CACHE"
    echo "resume: downloading Tectonic $TECTONIC_VERSION for $TECTONIC_TARGET"
    curl --fail --location --retry 3 --silent --show-error "$TECTONIC_URL" --output "$TECTONIC_ARCHIVE"
    ACTUAL_SHA256="$(sha256sum "$TECTONIC_ARCHIVE" | cut -d ' ' -f 1)"
    if [ "$ACTUAL_SHA256" != "$TECTONIC_SHA256" ]; then
      echo "resume: Tectonic archive checksum mismatch" >&2
      rm -f "$TECTONIC_ARCHIVE"
      exit 1
    fi
    tar -xzf "$TECTONIC_ARCHIVE" -C "$TECTONIC_CACHE"
    rm -f "$TECTONIC_ARCHIVE"
    chmod +x "$TECTONIC"
  fi
fi

"$TECTONIC" --chatter=minimal resume.tex
mkdir -p "$(dirname "$OUTPUT_PATH")"
mv resume.pdf "$OUTPUT_PATH"
echo "resume: $OUTPUT_PATH"
