#!/usr/bin/env bash
# Local dev loop for the Cloudflare Worker.
#
# Why this exists: `wrangler dev` in 4.87 honors `.assetsignore` for deploys
# but not for the local asset walk, so oversized repository metadata and
# scripture/raw source material can choke the workerd spawn. We build a
# symlink farm of just the servable paths and point wrangler at that.
#
# Edits to source files are reflected immediately (symlinks). Only re-run
# this script if you add/remove a top-level path or a scripture subdir.
# Canonical blog markdown is exposed explicitly at content/posts/.

set -euo pipefail

REPO="$(cd "$(dirname "$0")" && pwd)"
DEV="$REPO/_dev-assets"

rm -rf "$DEV"
mkdir "$DEV"

# Top-level: link everything except dev-only / oversized / runtime state
shopt -s dotglob nullglob
for item in "$REPO"/*; do
  name=$(basename "$item")
  case "$name" in
    .git|.github|.claude|.wrangler|_dev-assets|node_modules) continue ;;
    _worker.js|_build.mjs|_content.generated.mjs|content|AGENTS.md|CLAUDE.md|dev.sh|deploy.sh) continue ;;
    *) ln -s "$item" "$DEV/$name" ;;
  esac
done

mkdir "$DEV/content"
ln -s "$REPO/content/posts" "$DEV/content/posts"

# scripture/raw is source-only and large — link sibling-by-sibling instead
rm -f "$DEV/scripture"
mkdir "$DEV/scripture"
for item in "$REPO/scripture"/*; do
  name=$(basename "$item")
  [ "$name" = "raw" ] && continue
  ln -s "$item" "$DEV/scripture/$name"
done

# Dev-only wrangler config pointing at the farm
cat > "$REPO/wrangler.dev.jsonc" <<EOF
{
  "name": "a9lim",
  "main": "$REPO/_worker.js",
  "compatibility_date": "2026-04-05",
  "assets": {
    "directory": "$DEV",
    "binding": "ASSETS",
    "not_found_handling": "none",
    "html_handling": "auto-trailing-slash"
  },
  "analytics_engine_datasets": [
    { "binding": "VIEWS", "dataset": "a9lim_views" }
  ]
}
EOF

echo "→ asset farm: $DEV"
echo "→ starting wrangler dev (Ctrl+C to stop)"
exec npx --yes wrangler@latest dev --config "$REPO/wrangler.dev.jsonc" "$@"
