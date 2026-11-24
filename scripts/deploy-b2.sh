#!/usr/bin/env bash
set -euo pipefail

# Build and sync dist/ to a Backblaze B2 bucket.
# Usage:
#   B2_BUCKET="my-bucket-name" ./scripts/deploy-b2.sh
#   B2_BUCKET="my-bucket-name" DRY_RUN=1 ./scripts/deploy-b2.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source ".env"
  set +a
fi

if [[ -z "${B2_BUCKET:-}" ]]; then
  echo "Error: B2_BUCKET environment variable is required." >&2
  echo "Example: B2_BUCKET=friesconsulting-site ./scripts/deploy-b2.sh" >&2
  exit 1
fi

echo "Building and verifying production bundle..."
npm run typecheck
npm run build
npm run verify

DRY_FLAGS=()
if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "Running in DRY_RUN mode (no files will be modified remotely)."
  DRY_FLAGS=("--dry-run")
fi

if command -v b2 >/dev/null 2>&1; then
  echo "Syncing dist/ to b2://${B2_BUCKET} using Backblaze B2 CLI..."
  b2 sync --delete --replace-newer "${DRY_FLAGS[@]}" dist "b2://${B2_BUCKET}"
elif command -v rclone >/dev/null 2>&1; then
  REMOTE="${RCLONE_REMOTE:-b2}"
  echo "Syncing dist/ to ${REMOTE}:${B2_BUCKET} using rclone..."
  rclone sync "${DRY_FLAGS[@]}" dist "${REMOTE}:${B2_BUCKET}" --fast-list
elif command -v aws >/dev/null 2>&1; then
  if [[ -z "${B2_S3_ENDPOINT:-}" ]]; then
    echo "Error: B2_S3_ENDPOINT is required when using aws s3 sync (e.g. https://s3.us-west-004.backblazeb2.com)." >&2
    exit 1
  fi
  echo "Syncing dist/ to s3://${B2_BUCKET} via ${B2_S3_ENDPOINT}..."
  aws s3 sync dist "s3://${B2_BUCKET}" --endpoint-url "${B2_S3_ENDPOINT}" --delete "${DRY_FLAGS[@]}"
else
  echo "Error: None of 'b2', 'rclone', or 'aws' CLI tools were found in PATH." >&2
  exit 1
fi

echo "Done."
