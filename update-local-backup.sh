#!/bin/bash

set -e

echo "==================================="
echo " GEserverhub AUTO UPDATE"
echo "==================================="

cd ~/GEserverhub || exit

echo ""
echo "1. Pull latest code..."
git pull web main --no-rebase

echo ""
echo "2. Restore package-lock..."
git restore package-lock.json || true

echo ""
echo "3. Clean old build..."
rm -rf .next

echo ""
echo "4. Install packages..."
npm install

echo ""
echo "5. Generate Prisma client..."
npx prisma generate

echo ""
echo "6. Push database schema..."
npx prisma db push

echo ""
echo "7. Run migrations..."
npx prisma migrate deploy || true

echo ""
echo "8. Seed database..."
npx prisma db seed || true

echo ""
echo "9. Build Next.js..."
npm run build

echo ""
echo "10. Restart PM2..."
pm2 restart geserverhub || pm2 start npm --name geserverhub -- start

echo ""
echo "11. Save PM2..."
pm2 save

echo ""
echo "==================================="
echo " UPDATE COMPLETE"
echo "==================================="
