#!/usr/bin/env bash
set -euo pipefail

: "${STAGING_BASE_URL:?STAGING_BASE_URL is required for release acceptance}"
: "${STAGING_AUTH_STATE:?STAGING_AUTH_STATE is required for release acceptance}"
: "${STAGING_SUPABASE_URL:?STAGING_SUPABASE_URL is required for release acceptance}"
: "${STAGING_SUPABASE_PUBLISHABLE_KEY:?STAGING_SUPABASE_PUBLISHABLE_KEY is required for release acceptance}"

test -f "$STAGING_AUTH_STATE"
PRODUCTION_PLAYWRIGHT_BASE_URL="$STAGING_BASE_URL" \
PRODUCTION_PLAYWRIGHT_AUTH_STATE="$STAGING_AUTH_STATE" \
npm run test:production-realtime

echo 'Required authenticated release acceptance completed.'
