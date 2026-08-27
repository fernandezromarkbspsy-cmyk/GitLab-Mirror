#!/usr/bin/env bash

set -Eeuo pipefail

readonly APP_DIR="/opt/soc5-outbound"
readonly BRANCH="main"
readonly TARGET_REVISION="${TARGET_REVISION:-}"
readonly DEFAULT_REMOTE_REF="origin/$BRANCH"
readonly HEALTH_URL="http://127.0.0.1:8080/up"
readonly ROOT_ENV_SECRET_ID="${ROOT_ENV_SECRET_ID:-soc5-outbound/root-env}"
readonly BACKEND_ENV_SECRET_ID="${BACKEND_ENV_SECRET_ID:-soc5-outbound/backend-env}"

write_secret_env_file() {
  local secret_id="$1"
  local target_path="$2"
  local tmp_path

  tmp_path="$(mktemp)"
  aws secretsmanager get-secret-value \
    --secret-id "$secret_id" \
    --query SecretString \
    --output text > "$tmp_path"

  if [[ ! -s "$tmp_path" || "$(cat "$tmp_path")" == "None" ]]; then
    rm -f "$tmp_path"
    echo "Deployment refused: AWS Secrets Manager secret $secret_id is empty or not a string secret." >&2
    exit 1
  fi

  chmod 600 "$tmp_path"
  mv "$tmp_path" "$target_path"
}

exec 9>/tmp/soc5-outbound-deploy.lock
echo "Waiting for the production deployment lock..."
if ! flock -w 600 9; then
  echo "Timed out after 10 minutes waiting for another production deployment." >&2
  exit 1
fi
echo "Production deployment lock acquired."

cd "$APP_DIR"

if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
  echo "Deployment refused: tracked files on EC2 contain local changes." >&2
  git status --short
  exit 1
fi

umask 077
echo "Loading production environment from AWS Secrets Manager..."
write_secret_env_file "$ROOT_ENV_SECRET_ID" .env
write_secret_env_file "$BACKEND_ENV_SECRET_ID" backend/.env

if [[ ! -f .env ]]; then
  echo "Deployment refused: $APP_DIR/.env is missing." >&2
  exit 1
fi

if [[ ! -f backend/.env ]]; then
  echo "Deployment refused: $APP_DIR/backend/.env is missing." >&2
  exit 1
fi

for variable in SUPABASE_URL SUPABASE_PUBLISHABLE_KEY; do
  if ! grep -Eq "^${variable}=.+" .env; then
    echo "Deployment refused: $variable is missing or empty in $APP_DIR/.env." >&2
    exit 1
  fi
done

for variable in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
  if ! grep -Eq "^${variable}=.+" backend/.env; then
    echo "Deployment refused: $variable is missing or empty in $APP_DIR/backend/.env." >&2
    exit 1
  fi
done

if ! grep -Eq '^APP_KEY=.+$' backend/.env; then
  echo "Deployment refused: APP_KEY is missing or empty in $APP_DIR/backend/.env." >&2
  exit 1
fi

if ! grep -Eq '^SUPABASE_(PUBLISHABLE_KEY|ANON_KEY)=.+' backend/.env; then
  echo "Deployment refused: SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY must be set in $APP_DIR/backend/.env." >&2
  exit 1
fi

# Redis is optional. The application now defaults to file/sync drivers so a
# free-tier or missing Redis service cannot block sign-in or deployment.
# Keep any Redis settings in backend/.env only if you intentionally use Redis
# for non-critical workloads.

# Secrets remain mode 600; source files pulled below need normal read access so
# the non-root application user can read them after Docker copies the context.
umask 022

if [[ -n "$TARGET_REVISION" ]]; then
  echo "Fetching target revision $TARGET_REVISION..."
  # Deploy the exact commit selected by GitHub Actions instead of updating the
  # local branch tip. This avoids failures when the EC2 checkout has diverged
  # from origin/main but still allows the workflow to deploy the intended SHA.
  git fetch --no-tags --prune origin "$TARGET_REVISION"

  if ! git cat-file -e "$TARGET_REVISION^{commit}"; then
    echo "Deployment refused: target revision $TARGET_REVISION is not available after fetching the repository." >&2
    exit 1
  fi

  current_revision="$(git rev-parse --short HEAD)"
  target_revision="$(git rev-parse --short "$TARGET_REVISION")"
  echo "Updating checkout from $current_revision to $target_revision..."
  git reset --hard "$TARGET_REVISION"
else
  echo "Fetching default branch $DEFAULT_REMOTE_REF..."
  git fetch --no-tags --prune origin "$BRANCH"

  if ! git cat-file -e "$DEFAULT_REMOTE_REF^{commit}"; then
    echo "Deployment refused: $DEFAULT_REMOTE_REF is not available after fetching the repository." >&2
    exit 1
  fi

  current_revision="$(git rev-parse --short HEAD)"
  target_revision="$(git rev-parse --short "$DEFAULT_REMOTE_REF")"
  echo "Updating checkout from $current_revision to $target_revision..."
  git reset --hard "$DEFAULT_REMOTE_REF"
fi
git ls-files -z | xargs -0 chmod a+r

echo "Validating Compose configuration..."
docker compose config --quiet

echo "Building application images..."
docker compose build

echo "Starting application..."
if ! docker compose up -d --remove-orphans; then
  echo "Application containers failed to start." >&2
  docker compose ps
  docker compose logs --tail=100 api
  exit 1
fi

echo "Waiting for API health..."
for attempt in {1..24}; do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' soc5-outbound-api-1 2>/dev/null || true)"
  if [[ "$status" == "healthy" ]]; then
    break
  fi
  if [[ "$attempt" == "24" ]]; then
    echo "API did not become healthy." >&2
    docker compose ps
    docker compose logs --tail=100 api
    exit 1
  fi
  sleep 5
done

echo "Checking API authentication configuration..."
if ! docker compose exec -T api \
  curl --fail --silent --show-error --max-time 5 http://127.0.0.1:8000/api/auth/status >/dev/null; then
  echo "API authentication readiness check failed." >&2
  docker compose logs --tail=100 api
  exit 1
fi

echo "Waiting for the public health endpoint..."
for attempt in {1..24}; do
  if curl --fail --silent --show-error --max-time 5 "$HEALTH_URL" >/dev/null; then
    echo "Public health endpoint is ready."
    break
  fi
  if [[ "$attempt" == "24" ]]; then
    echo "Public health endpoint did not become ready." >&2
    docker compose ps
    docker compose logs --tail=100 web
    exit 1
  fi
  sleep 5
done

echo "Deployment completed successfully."
docker compose ps
git log -1 --oneline
