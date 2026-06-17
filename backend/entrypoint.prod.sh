#!/bin/sh
set -e

echo "⚙️  Generando cliente Prisma..."
npx prisma generate

echo "🔧 Aplicando migraciones..."
npx prisma migrate deploy

echo "🌱 Plantando semillas..."
npx prisma db seed

echo "🚀 Iniciando servidor..."
exec node dist/main
