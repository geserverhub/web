#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env() {
  local key="$1"
  grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

DB_HOST="$(load_env DB_HOST)"; DB_HOST="${DB_HOST:-localhost}"
DB_PORT="$(load_env DB_PORT)"; DB_PORT="${DB_PORT:-3306}"
DB_USER="$(load_env DB_USER)"; DB_USER="${DB_USER:-geserverhub}"
DB_PASSWORD="$(load_env DB_PASSWORD)"
DB_NAME="$(load_env DB_NAME)"; DB_NAME="${DB_NAME:-goeunserverhub}"
BACKUP="${1:-$ROOT/database/geserverhub.sql}"

if [[ ! -f .env.local ]]; then
  echo "ERROR: .env.local missing"
  exit 1
fi
if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_PASSWORD empty in .env.local"
  exit 1
fi
if [[ ! -f "$BACKUP" ]]; then
  echo "ERROR: backup not found: $BACKUP"
  exit 1
fi

echo "==> Ensure MySQL user and database..."
ESC_PASS="${DB_PASSWORD//\'/\'\'}"
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${ESC_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${ESC_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

export MYSQL_PWD="$DB_PASSWORD"
MYSQL=(mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER")

echo "==> Import $BACKUP ..."
"${MYSQL[@]}" "$DB_NAME" < "$BACKUP"

echo "==> Apply migrations..."
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-energy-geserverhub.sql"
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-mfactory-inquiry.sql"
"${MYSQL[@]}" "$DB_NAME" < "$ROOT/prisma/migrate-mfactory-booking-v2.sql"

echo "==> prisma generate..."
npx prisma generate

echo "==> Verify..."
"${MYSQL[@]}" "$DB_NAME" -e "SELECT COUNT(*) AS mfactory_rows FROM MFactoryInquiry;"

echo "Done. Database '$DB_NAME' restored."
