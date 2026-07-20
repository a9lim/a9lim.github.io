#!/usr/bin/env bash
# Build the deployable asset tree and start the pinned local Worker runtime.

set -euo pipefail

cd "$(dirname "$0")"
npm run build
exec npm exec -- wrangler dev "$@"
