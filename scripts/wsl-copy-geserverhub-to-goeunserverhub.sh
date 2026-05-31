#!/usr/bin/env bash
# Copy WSL MySQL database geserverhub → goeunserverhub (app expects goeunserverhub).
# Run in WSL (sudo asks for your Ubuntu password, not MySQL root):
#   cd /mnt/c/web/web
#   bash scripts/wsl-copy-geserverhub-to-goeunserverhub.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env() {
  local key="$1"
  grep -E "^${key}=" .env.local | tail -1 | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

DB_USER="$(load_env DB_USER)"; DB_USER="${DB_USER:-geserverhub}"
DB_PASSWORD="$(load_env DB_PASSWORD)"
SRC_DB=geserverhub
DST_DB=goeunserverhub

if [[ -z "$DB_PASSWORD" ]]; then
  echo "ERROR: DB_PASSWORD empty in .env.local"
  exit 1
fi

ESC_PASS="${DB_PASSWORD//\'/\'\'}"
echo "==> Create ${DST_DB} and grant ${DB_USER} (sudo)..."
sudo mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${ESC_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${ESC_PASS}';
GRANT ALL PRIVILEGES ON \`${DST_DB}\`.* TO '${DB_USER}'@'localhost';
GRANT ALL PRIVILEGES ON \`${DST_DB}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

export MYSQL_PWD="$DB_PASSWORD"
if ! mysql -ugeserverhub -e "USE ${SRC_DB}" 2>/dev/null; then
  echo "Source database ${SRC_DB} not found — skip copy."
  exit 0
fi

echo "==> Copy ${SRC_DB} → ${DST_DB} ..."
mysqldump -u"$DB_USER" "$SRC_DB" | mysql -u"$DB_USER" "$DST_DB"

echo "==> Verify..."
mysql -u"$DB_USER" "$DST_DB" -e "SELECT COUNT(*) AS users FROM User;"
echo "Done. Use DB_NAME=goeunserverhub in .env.local and: npm run db:check"
