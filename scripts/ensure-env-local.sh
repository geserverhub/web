#!/usr/bin/env bash
# Create ~/GEserverhub/.env.local when missing (never commit .env.local).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_or_default() {
  local key="$1"
  local fallback="$2"
  if [[ -n "${!key:-}" ]]; then
    printf '%s' "${!key}"
    return
  fi
  if [[ -f .env.local ]]; then
    grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
    return
  fi
  printf '%s' "$fallback"
}

if [[ -f .env.local ]]; then
  echo "OK: .env.local exists"
  exit 0
fi

if [[ -f .env.local.bak ]]; then
  cp .env.local.bak .env.local
  echo "Restored .env.local from .env.local.bak"
  exit 0
fi

DB_HOST="$(load_or_default DB_HOST localhost)"
DB_PORT="$(load_or_default DB_PORT 3306)"
DB_USER="$(load_or_default DB_USER geserverhub)"
DB_PASSWORD="$(load_or_default DB_PASSWORD "")"
DB_NAME="$(load_or_default DB_NAME goeunserverhub)"
BACKEND_URL="$(load_or_default BACKEND_URL http://127.0.0.1:8000)"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: .env.local missing and DB_PASSWORD not set."
  echo "Run on GE-SERVER:"
  echo "  DB_PASSWORD='your-mysql-password' bash scripts/ensure-env-local.sh"
  exit 1
fi

DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

cat > .env.local <<EOF
DATABASE_URL="${DATABASE_URL}"
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
BACKEND_URL=${BACKEND_URL}
EOF

echo "Created .env.local (user=${DB_USER}, db=${DB_NAME})"
