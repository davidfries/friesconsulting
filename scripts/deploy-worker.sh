#!/usr/bin/env bash
set -euo pipefail

# Deploy cloudflare/worker.js using credentials from .env (or shell environment).
# Usage:
#   ./scripts/deploy-worker.sh
#   DRY_RUN=1 ./scripts/deploy-worker.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "Error: CLOUDFLARE_API_TOKEN is required (set in .env or environment)." >&2
  exit 1
fi

if [[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "Error: CLOUDFLARE_ACCOUNT_ID is required (set in .env or environment)." >&2
  exit 1
fi

if [[ -z "${B2_ORIGIN:-}" || "${B2_ORIGIN}" == *"REPLACE_WITH_BUCKET_NAME"* ]]; then
  echo "Error: B2_ORIGIN must be set to your Backblaze B2 friendly bucket URL." >&2
  echo "Example: B2_ORIGIN=https://f001.backblazeb2.com/file/your-bucket-name" >&2
  exit 1
fi

EXTRA_FLAGS=()
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "Running Wrangler deploy in DRY_RUN mode..."
  EXTRA_FLAGS=("--dry-run")
fi

npx --yes wrangler deploy \
  --config cloudflare/wrangler.toml \
  --var "B2_ORIGIN:${B2_ORIGIN}" \
  "${EXTRA_FLAGS[@]}"
