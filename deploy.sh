#!/usr/bin/env bash
# Deploy to Cloudflare: regenerate all content-derived artifacts, then push.
# Guards against the one real failure mode of the content/ pipeline —
# editing content/ and deploying stale generated files.

set -euo pipefail
cd "$(dirname "$0")"

node _build.mjs
npx --yes wrangler@latest deploy "$@"
