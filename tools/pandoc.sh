#!/usr/bin/env bash
# Runs Pandoc for the content build. Local installations are preferred; Linux
# CI bootstraps the pinned release into the ignored .build cache.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PANDOC_VERSION="3.10.2"

PANDOC=""
for p in pandoc /opt/homebrew/bin/pandoc /usr/local/bin/pandoc; do
  if command -v "$p" >/dev/null 2>&1; then PANDOC="$p"; break; fi
done

if [ -z "$PANDOC" ]; then
  PLATFORM="$(uname -s)-$(uname -m)"
  case "$PLATFORM" in
    Linux-x86_64)
      PANDOC_TARGET="linux-amd64"
      PANDOC_SHA256="c7edd535941c48be6a362081a748272837de81ae11777202d9c341d3d8261c9a"
      ;;
    Linux-aarch64|Linux-arm64)
      PANDOC_TARGET="linux-arm64"
      PANDOC_SHA256="1c4d69f2a092bd47cb180e58a4aab7b9637101ced928252458c7d41a7f7fa71d"
      ;;
    *)
      echo "content: pandoc is required on $PLATFORM (macOS: brew install pandoc)" >&2
      exit 1
      ;;
  esac

  PANDOC_CACHE="$ROOT/.build/pandoc-$PANDOC_VERSION-$PANDOC_TARGET"
  PANDOC="$PANDOC_CACHE/bin/pandoc"
  if [ ! -x "$PANDOC" ]; then
    PANDOC_ARCHIVE="$PANDOC_CACHE.tar.gz"
    PANDOC_URL="https://github.com/jgm/pandoc/releases/download/$PANDOC_VERSION/pandoc-$PANDOC_VERSION-$PANDOC_TARGET.tar.gz"
    mkdir -p "$PANDOC_CACHE"
    echo "content: downloading Pandoc $PANDOC_VERSION for $PANDOC_TARGET" >&2
    curl --fail --location --retry 3 --silent --show-error "$PANDOC_URL" --output "$PANDOC_ARCHIVE"
    ACTUAL_SHA256="$(sha256sum "$PANDOC_ARCHIVE" | cut -d ' ' -f 1)"
    if [ "$ACTUAL_SHA256" != "$PANDOC_SHA256" ]; then
      echo "content: Pandoc archive checksum mismatch" >&2
      rm -f "$PANDOC_ARCHIVE"
      exit 1
    fi
    tar -xzf "$PANDOC_ARCHIVE" -C "$PANDOC_CACHE" --strip-components=1
    rm -f "$PANDOC_ARCHIVE"
    chmod +x "$PANDOC"
  fi
fi

exec "$PANDOC" "$@"
