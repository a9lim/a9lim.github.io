#!/usr/bin/env bash
# Deploy to Cloudflare: regenerate all content-derived artifacts, push, then
# verify that the newly generated deployment marker is live.
# Guards against the one real failure mode of the content/ pipeline —
# editing content/ and deploying stale generated files.

set -euo pipefail
cd "$(dirname "$0")"

# Never inherit a draft-enabled shell: draft/ is not deployable content.
export DRAFTS=0

# A dry run validates the bundle without touching production or requiring the
# local cache-purge credential.
dry_run=0
for arg in "$@"; do
  if [[ "$arg" == "--dry-run" ]]; then
    dry_run=1
    break
  fi
done

purge_token="${CLOUDFLARE_CACHE_PURGE_TOKEN:-}"
if [[ "$dry_run" == 0 && -z "$purge_token" ]]; then
  if ! command -v security >/dev/null 2>&1; then
    echo 'deploy: macOS Keychain is unavailable and CLOUDFLARE_CACHE_PURGE_TOKEN is unset' >&2
    exit 1
  fi
  if ! purge_token=$(security find-generic-password \
    -a "$(id -un)" \
    -s 'a9l.im-cloudflare-cache-purge' \
    -w 2>/dev/null); then
    echo 'deploy: Keychain item a9l.im-cloudflare-cache-purge is missing' >&2
    exit 1
  fi
fi

npm run build
npm exec -- wrangler deploy "$@"

[[ "$dry_run" == 1 ]] && exit 0

CLOUDFLARE_CACHE_PURGE_TOKEN="$purge_token" node tools/purge-cache.mjs
unset purge_token
node tools/verify-deploy.mjs
