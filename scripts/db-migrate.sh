#!/usr/bin/env bash
# Apply idempotent SQL migrations (keeps existing booking/data rows).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env() {
  local key="$1"
  local val=""
  if [[ -f .env.local ]]; then
    val="$(grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
  fi
  printf '%s' "$val"
}

DB_HOST="$(load_env DB_HOST)"; DB_HOST="${DB_HOST:-localhost}"
DB_PORT="$(load_env DB_PORT)"; DB_PORT="${DB_PORT:-3306}"
DB_USER="$(load_env DB_USER)"; DB_USER="${DB_USER:-geserverhub}"
DB_PASSWORD="$(load_env DB_PASSWORD)"
DB_NAME="$(load_env DB_NAME)"; DB_NAME="${DB_NAME:-goeunserverhub}"

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client not found. Install: sudo apt install mysql-client"
  exit 1
fi

MYSQL=(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER")
if [[ -n "$DB_PASSWORD" ]]; then
  export MYSQL_PWD="$DB_PASSWORD"
fi

echo "Ensuring database '$DB_NAME' exists..."
"${MYSQL[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "Applying migrations (energy + M-Factory booking)..."
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-energy-geserverhub.sql"
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-mfactory-inquiry.sql"
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-mfactory-booking-v2.sql"

echo "Running prisma generate..."
npx prisma generate

echo "Done. Migrations applied on '$DB_NAME'."
