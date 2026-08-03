#!/usr/bin/env bash
set -euo pipefail

if ! command -v contentful >/dev/null 2>&1; then
  echo "Contentful CLI is required. Install with: npm i -g contentful-cli"
  exit 1
fi

: "${CONTENTFUL_MANAGEMENT_TOKEN:?CONTENTFUL_MANAGEMENT_TOKEN is required}"
: "${CONTENTFUL_SPACE_ID:?CONTENTFUL_SPACE_ID is required}"

ENVIRONMENT_ID="${CONTENTFUL_ENVIRONMENT_ID:-master}"
MODEL_FILE="$(cd "$(dirname "$0")" && pwd)/page-sections-model.json"

contentful login --management-token "$CONTENTFUL_MANAGEMENT_TOKEN"

contentful space import \
  --space-id "$CONTENTFUL_SPACE_ID" \
  --environment-id "$ENVIRONMENT_ID" \
  --content-file "$MODEL_FILE"

echo "Contentful model imported into space=$CONTENTFUL_SPACE_ID environment=$ENVIRONMENT_ID"
