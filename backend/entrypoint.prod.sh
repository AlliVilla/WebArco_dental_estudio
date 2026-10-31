#!/bin/sh
set -e

echo "Cliente Prisma generado durante el build."

echo "🔧 Aplicando migraciones..."
npx prisma migrate deploy

echo "Catálogos y cuentas se provisionan explícitamente; seed automático deshabilitado."

echo "🚀 Iniciando servidor..."
exec node dist/main
