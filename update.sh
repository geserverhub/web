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
git pull origin main

echo "==> npm ci"
npm ci

echo "==> npm run build"
npm run build

echo "==> restart app"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe ge-web >/dev/null 2>&1; then
    pm2 restart ge-web
  else
    pm2 start npm --name ge-web -- start
    pm2 save
  fi
  pm2 status ge-web
else
  echo "PM2 not installed. Start manually: npm run start"
  echo "Or install PM2: npm install -g pm2 && pm2 start npm --name ge-web -- start"
fi

echo "==> Done. App listens on port 3005 (next start -p 3005)"
