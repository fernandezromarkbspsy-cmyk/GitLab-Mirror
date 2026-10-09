#!/usr/bin/env bash
set -euo pipefail

npm run check:conflicts
git diff --check
npm --prefix frontend run check:encoding
npm --prefix frontend run check:robots
npm --prefix frontend audit --package-lock-only --audit-level=high
npm audit --package-lock-only --audit-level=high
composer --working-dir=backend validate --no-check-publish
composer --working-dir=backend audit --locked --no-dev --abandoned=ignore

grep -Fq 'location = /auth/seatalk/callback' frontend/nginx.conf
! grep -Fq 'location ^~ /auth/seatalk/callback' frontend/nginx.conf
grep -Fq 'wss://*.supabase.co' frontend/nginx.conf
grep -Fq 'wss://*.supabase.in' frontend/nginx.conf

manifest=docs/deployment/supabase-migration-manifest.txt
test -f "$manifest"
grep -v '^#' "$manifest" | grep -v '^$' | while IFS= read -r migration; do
  test -f "supabase/migrations/$migration"
done

echo 'Release static gates passed.'
