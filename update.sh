#!/usr/bin/env bash
# Deploy / update GE Server Hub on Linux (GE-SERVER)
# Usage: cd ~/GEserverhub && bash update.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> GE Server Hub update @ $ROOT"

if [[ ! -f package.json ]]; then
  echo "ERROR: package.json not found. Run from project root (~/GEserverhub)."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  echo "WARN: .env.local missing — copy from .env.local.example and configure DB."
fi

echo "==> git pull origin main"
# Drop stale local kenergy copies (invalid UTF-8) before pull restores tracked re-exports
[[ -d src/app/api/kenergy ]] && rm -rf src/app/api/kenergy
git fetch origin main
git reset --hard origin/main

echo "==> verify git is current (must match github.com/geserverhub/web main)"
git log -1 --oneline

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

echo "==> verify m-factory CSS bundled in layout"
if ! grep -rq "m-factory-layout\|mf-booking" .next 2>/dev/null; then
  echo "WARN: m-factory styles not found in .next (layout import may be missing)"
fi

echo "==> free port 3005 (kill orphan next-server not managed by PM2)"
if [[ -f scripts/kill-port.mjs ]]; then
  node scripts/kill-port.mjs 3005 || true
else
  fuser -k 3005/tcp 2>/dev/null || true
fi
sleep 1

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

  echo "==> smoke test local (wait for next start)"
  sleep 5
  HTML="$(curl -sf "http://127.0.0.1:3005/m-factory" || true)"
  if [[ -z "$HTML" ]]; then
    echo "ERROR: /m-factory returned empty response"
    exit 1
  fi
  if echo "$HTML" | grep -q 'm-factoryandresort.com' && echo "$HTML" | grep -q 'mf-booking'; then
    echo "OK: /m-factory serves current booking page"
  else
    echo "ERROR: /m-factory still serves stale HTML"
    echo "       Expected: m-factoryandresort.com + mf-booking in HTML"
    echo "       Fix: node scripts/kill-port.mjs 3005 && pm2 delete ge-web && pm2 start npm --name ge-web --cwd \"$ROOT\" -- start"
    exit 1
  fi
  CSS_LINKS="$(echo "$HTML" | grep -o '_next/static/css/[^"]*' | sort -u | wc -l | tr -d ' ')"
  echo "OK: $CSS_LINKS bundled CSS link(s) in /m-factory HTML"
else
  echo "PM2 not installed. Start manually: npm run start"
  echo "Or install PM2: npm install -g pm2 && pm2 start npm --name ge-web -- start"
fi

echo "==> Done. App listens on port 3005 (next start -p 3005)"
