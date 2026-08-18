#!/usr/bin/env bash
# Deploy to Cloudflare: regenerate all content-derived artifacts, push, then
# verify that the newly generated deployment marker is live.
# Guards against the one real failure mode of the content/ pipeline —
# editing content/ and deploying stale generated files.

set -euo pipefail
cd "$(dirname "$0")"

# Never inherit a draft-enabled shell: draft/ is not deployable content.
export DRAFTS=0

npm run build
npm exec -- wrangler deploy "$@"

# A dry run never changes production, so there is nothing live to verify.
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    exit 0
  fi
done

node tools/verify-deploy.mjs
