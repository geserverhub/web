#!/usr/bin/env bash
# Deploy / update GE Server Hub on Linux (GE-SERVER)
# Usage: cd ~/web && bash update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> GE Server Hub update @ $ROOT"

if [[ ! -f package.json ]]; then
  echo "ERROR: package.json not found. Run from project root (~/web)."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  echo "WARN: .env.local missing — copy from .env.local.example and configure DB."
fi

echo "==> git pull origin main"
# Drop stale local kenergy copies (invalid UTF-8) before pull restores tracked re-exports
[[ -d src/app/api/kenergy ]] && rm -rf src/app/api/kenergy
git pull origin main

echo "==> npm ci"
npm ci

echo "==> clean .next"
rm -rf .next

echo "==> npm run build"
npm run build

echo "==> verify customer-dashboard chunks"
if ! ls .next/static/chunks/app/customer-dashboard/page-*.js >/dev/null 2>&1; then
  echo "ERROR: customer-dashboard page chunk missing after build"
  exit 1
fi

echo "==> verify m-factory booking css"
if [[ ! -f public/m-factory/booking.css ]]; then
  echo "ERROR: public/m-factory/booking.css missing"
  exit 1
fi

echo "==> verify git is current"
git log -1 --oneline

echo "==> restart app (single ge-web from $ROOT)"
if command -v pm2 >/dev/null 2>&1; then
  echo "==> stop legacy/conflicting pm2 apps on port 3005"
  pm2 delete ge-web 2>/dev/null || true
  pm2 delete geserverhub 2>/dev/null || true

  pm2 start npm --name ge-web --cwd "$ROOT" -- start
  pm2 save
  pm2 status

  echo "==> who listens on 3005?"
  (ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null || true) | grep 3005 || true

  echo "==> smoke test local"
  curl -sI "http://127.0.0.1:3005/m-factory/booking.css?v=3" | head -n 1 || true
  curl -s "http://127.0.0.1:3005/m-factory" | grep -o 'm-factoryandresort.com\|booking.css\|m-factory/site' | head -n 3 || true
else
  echo "PM2 not installed. Start manually: npm run start"
  echo "Or install PM2: npm install -g pm2 && pm2 start npm --name ge-web -- start"
fi

echo "==> Done. App listens on port 3005 (next start -p 3005)"
