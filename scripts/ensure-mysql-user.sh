#!/usr/bin/env bash
# Verify MySQL login; create geserverhub@localhost via sudo if needed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env.local ]]; then
  echo "ERROR: .env.local missing — run scripts/ensure-env-local.sh first"
  exit 1
fi

load_env() {
  local key="$1"
  grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

DB_HOST="$(load_env DB_HOST)"; DB_HOST="${DB_HOST:-localhost}"
DB_PORT="$(load_env DB_PORT)"; DB_PORT="${DB_PORT:-3306}"
DB_USER="$(load_env DB_USER)"; DB_USER="${DB_USER:-geserverhub}"
DB_PASSWORD="$(load_env DB_PASSWORD)"
DB_NAME="$(load_env DB_NAME)"; DB_NAME="${DB_NAME:-goeunserverhub}"

if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_PASSWORD empty in .env.local"
  exit 1
fi

mysql_ping() {
  MYSQL_PWD="$DB_PASSWORD" mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -e "SELECT 1" >/dev/null 2>&1
}

if mysql_ping; then
  echo "OK: MySQL login ${DB_USER}@${DB_HOST}:${DB_PORT}"
  exit 0
fi

echo "WARN: cannot login as ${DB_USER} — trying sudo mysql to create user..."

if ! command -v sudo >/dev/null 2>&1; then
  echo "ERROR: sudo not available; fix MySQL user manually"
  exit 1
fi

ESC_PASS="${DB_PASSWORD//\'/\'\'}"
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${ESC_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${ESC_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

if mysql_ping; then
  echo "OK: MySQL user ${DB_USER} ready"
else
  echo "ERROR: still cannot login as ${DB_USER} after grant"
  exit 1
fi
