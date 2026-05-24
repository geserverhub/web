#!/usr/bin/env bash
# GEserverhub local update: pull web.git → restore DB → build → run
# Usage: cd ~/GEserverhub && bash update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PM2_APP="GEserverhub"
cd "$ROOT"

echo "==> GEserverhub update @ $ROOT"

if [[ ! -f package.json ]]; then
  echo "ERROR: run from project root (~/GEserverhub)"
  exit 1
fi

echo "==> [1/4] git pull origin main (geserverhub/web)"
git fetch origin main
git pull --ff-only origin main
git log -1 --oneline

echo "==> [2/4] stop app (free port 3005 before install)"
if command -v pm2 >/dev/null 2>&1; then
  pm2 stop "$PM2_APP" 2>/dev/null || true
  pm2 delete ge-web 2>/dev/null || true
  pm2 delete geserverhub 2>/dev/null || true
fi
if [[ -f scripts/kill-port.mjs ]]; then
  node scripts/kill-port.mjs 3005 || true
else
  fuser -k 3005/tcp 2>/dev/null || true
fi

if [[ ! -f .env.local ]]; then
  echo "ERROR: .env.local missing — create it first (see .env.local.example)"
  echo "  DB_USER=geserverhub  DB_NAME=goeunserverhub  DB_PASSWORD=..."
  exit 1
fi

echo "==> [3/4] npm ci + database restore + build"
unset NODE_ENV
if ! npm ci --ignore-scripts --no-audit --no-fund; then
  echo "WARN: npm ci failed — clean node_modules and retry"
  rm -rf node_modules
  npm ci --ignore-scripts --no-audit --no-fund
fi

bash scripts/db-restore.sh database/geserverhub.sql

rm -rf .next
npm run build

echo "==> [4/4] run (pm2 $PM2_APP on port 3005)"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe "$PM2_APP" >/dev/null 2>&1; then
    pm2 restart "$PM2_APP" --update-env
  else
    pm2 start npm --name "$PM2_APP" --cwd "$ROOT" -- start
  fi
  pm2 save
  pm2 status
else
  echo "PM2 not found — run: npm run start"
fi

echo "==> Done. http://127.0.0.1:3005"
