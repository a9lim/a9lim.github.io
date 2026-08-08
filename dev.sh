#!/usr/bin/env bash
# Build the deployable asset tree and start the pinned local Worker runtime.

set -euo pipefail

cd "$(dirname "$0")"

# draft/ renders alongside content/ locally. `DRAFTS=0 ./dev.sh` previews the
# deployable tree instead.
export DRAFTS="${DRAFTS:-1}"

npm run build
exec npm exec -- wrangler dev "$@"
