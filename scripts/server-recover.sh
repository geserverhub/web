#!/usr/bin/env bash
# GE-SERVER full recovery: env + MySQL + pull + build + PM2 GEserverhub
# Usage: cd ~/GEserverhub && DB_PASSWORD='...' bash scripts/server-recover.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PM2_APP="GEserverhub"
cd "$ROOT"

echo "==> GEserverhub RECOVER @ $ROOT"

bash scripts/ensure-env-local.sh
bash scripts/ensure-mysql-user.sh
bash update.sh

echo "==> smoke test"
sleep 3
if curl -sf "http://127.0.0.1:3005/" >/dev/null; then
  echo "OK: homepage http://127.0.0.1:3005/"
else
  echo "WARN: homepage not responding yet — check: pm2 logs $PM2_APP"
fi

pm2 status || true
