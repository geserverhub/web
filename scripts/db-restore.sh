#!/usr/bin/env bash
# Restore local MySQL from GEserverhub backup (goeunserverhub_db.sql)
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

DB_HOST="$(load_env DB_HOST)"
DB_PORT="$(load_env DB_PORT)"
DB_USER="$(load_env DB_USER)"
DB_PASSWORD="$(load_env DB_PASSWORD)"
DB_NAME="$(load_env DB_NAME)"
BACKEND_URL="$(load_env BACKEND_URL)"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-geserverhub}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-goeunserverhub}"

BACKUP="${1:-$ROOT/database/geserverhub.sql}"
if [[ ! -f "$BACKUP" ]]; then
  echo "Backup not found: $BACKUP"
  echo "Run: git pull geserverhub main"
  exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "mysql client not found. Install: sudo apt install mysql-client"
  exit 1
fi

MYSQL=(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER")
if [[ -n "$DB_PASSWORD" ]]; then
  export MYSQL_PWD="$DB_PASSWORD"
fi

echo "Creating database '$DB_NAME' if missing..."
"${MYSQL[@]}" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo "Importing $BACKUP ..."
"${MYSQL[@]}" "$DB_NAME" < "$BACKUP"

echo "Applying energy + M-Factory migrations (idempotent)..."
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-energy-geserverhub.sql"
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-mfactory-inquiry.sql"
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-mfactory-booking-v2.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -n "$DB_PASSWORD" ]]; then
    DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  else
    DATABASE_URL="mysql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  fi
fi

if [[ -f .env.local ]] && grep -q '^DATABASE_URL=' .env.local 2>/dev/null; then
  :
else
  {
    echo "DATABASE_URL=\"$DATABASE_URL\""
    echo "DB_HOST=$DB_HOST"
    echo "DB_PORT=$DB_PORT"
    echo "DB_USER=$DB_USER"
    echo "DB_NAME=$DB_NAME"
    [[ -n "$DB_PASSWORD" ]] && echo "DB_PASSWORD=$DB_PASSWORD"
    echo "BACKEND_URL=${BACKEND_URL:-http://127.0.0.1:8000}"
  } >> .env.local
  echo "Appended DATABASE_URL to .env.local"
fi

echo "Running prisma generate..."
npx prisma generate

if [[ -f update_clients.cjs ]]; then
  echo "Syncing client cards (update_clients.cjs)..."
  node update_clients.cjs || true
fi

echo "Done. Database '$DB_NAME' restored from backup."
