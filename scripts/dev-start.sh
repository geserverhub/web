#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

node scripts/kill-port.mjs 3005
node scripts/clean-next.mjs

WSL_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo ""
echo "=============================================="
echo "  Next.js dev server"
echo "  http://localhost:3005"
if [[ -n "${WSL_IP}" ]]; then
  echo "  http://${WSL_IP}:3005   (use this if Windows shows ERR_CONNECTION_REFUSED)"
fi
echo "=============================================="
echo ""

exec npx next dev -p 3005 -H 0.0.0.0
