#!/usr/bin/env bash
# Deploy to Cloudflare: regenerate all content-derived artifacts, then push.
# Guards against the one real failure mode of the content/ pipeline —
# editing content/ and deploying stale generated files.

set -euo pipefail
cd "$(dirname "$0")"

# Never inherit a draft-enabled shell: draft/ is not deployable content.
export DRAFTS=0

npm run build
exec npm exec -- wrangler deploy "$@"
