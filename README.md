# WebArco Dental Studio

Sistema de gestión dental. Backend construido con [NestJS](https://nestjs.com/) v11 + [Prisma](https://www.prisma.io/) v7 + PostgreSQL.

## Requisitos

- Node.js >= 20
- PostgreSQL 16
- npm
- Docker y Docker Compose (opcional, para ejecución con contenedores)

## 🐳 Ejecución con Docker Compose (recomendado)

```bash
# 1. Copiar y configurar variables de entorno (solo la primera vez)
cp .env_example .env

# 2. Levantar los servicios
docker compose up -d
```

Esto inicia:
- **PostgreSQL 16** en `localhost:6767` (configurable via `POSTGRES_PORT` en `.env`)
- **Backend** en `http://localhost:3030` (configurable via `BACKEND_PORT` en `.env`)

Al arrancar, el backend muestra:

```
⚙️  Generando cliente Prisma...
🔧 Aplicando migraciones...
🌱 Plantando semillas...
✅ ¡Entorno listo! 🚀 Iniciando servidor...
```

### Comandos útiles

```bash
# Ver logs del backend
docker compose logs -f backend

# Detener servicios
docker compose down

# Reiniciar base de datos desde cero (borra todos los datos)
docker compose down -v
docker compose up -d

# Acceder a Prisma Studio (explorar datos)
npx prisma studio
```

## 💻 Ejecución con BD en Docker + backend local

Corré solo PostgreSQL en Docker y el backend de forma local (ideal para desarrollo con hot-reload rápido).

### 1. Iniciar PostgreSQL

```bash
docker run -d \
  --name dental_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=webarcodental \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/webarcodental"
PORT=3030
```

### 3. Instalar dependencias y preparar la base de datos

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 4. Iniciar el servidor

```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

### 5. Detener la BD cuando no se use

```bash
docker stop dental_db && docker rm dental_db
```

## 🔧 Ejecución completamente local (sin Docker)

### 1. Configurar la base de datos

Asegurate de tener PostgreSQL instalado y corriendo, y creá la base de datos:

```bash
createdb webarcodental
```

### 2. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env` y ajustar usuario, contraseña, host y puerto según tu configuración local.

### 3. Instalar dependencias y preparar la base de datos

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

### 4. Iniciar el servidor

```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📖 Documentación de la API (Scalar)

Una vez corriendo el backend:

```
http://localhost:3030/reference
```

## 📋 Scripts disponibles

Todos los scripts se ejecutan desde `backend/`:

| Script | Descripción |
|---|---|
| `npm run start:dev` | Iniciar en modo desarrollo (hot-reload) |
| `npm run build` | Compilar a JavaScript |
| `npm run start:prod` | Iniciar en modo producción |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:e2e` | Ejecutar tests end-to-end |
| `npm run prisma:generate` | Regenerar cliente Prisma |
| `npm run prisma:studio` | Abrir Prisma Studio (UI web para ver/editar datos) |
| `npm run prisma:migrate` | Crear y aplicar migraciones en desarrollo |
| `npm run prisma:deploy` | Aplicar migraciones pendientes (producción) |
| `npm run prisma:seed` | Ejecutar seed de datos |
| `npm run prisma:push` | Sincronizar schema con BD sin migración |
| `npm run prisma:reset` | Resetear BD (borra datos, re-ejecuta migraciones + seed) |
| `npm run lint` | Ejecutar linter |

### Comandos directos con npx

```bash
# Ver estado de migraciones
npx prisma migrate status

# Abrir Prisma Studio
npx prisma studio

# Regenerar cliente después de cambiar el schema
npx prisma generate
```

## 🌱 Datos iniciales (seed)

Al ejecutar `npx prisma db seed` se insertan:

- 18 departamentos de Honduras con sus municipios
- Roles y privilegios del sistema
- 5 personas de ejemplo
- Usuarios de prueba
- 6 preguntas de antecedentes médicos
- Numeración dental (permanentes y temporales)
- 4 tipos de pagos predefinidos

## 🗺️ Flujo de trabajo con migraciones

```bash
# 1. Hacer cambios en prisma/schema.prisma
# 2. Crear migración
npm run prisma:migrate

# 3. Aplicar migraciones pendientes (en producción)
npm run prisma:deploy

# 4. Regenerar cliente Prisma
npm run prisma:generate

# 5. Si algo sale mal, resetear
npm run prisma:reset
```

## 📁 Estructura del proyecto

```
backend/
├── prisma/
│   ├── schema.prisma       # Modelo de datos
│   ├── migrations/         # Migraciones
│   └── seed.ts             # Datos iniciales
├── src/
│   ├── common/             # Interceptors, filters, guards globales
│   ├── consentimiento/     # Módulo de consentimientos informados
│   ├── reminder/           # Módulo de recordatorios
│   ├── cita/               # Módulo de citas
│   ├── ...                 # Otros módulos
│   ├── app.module.ts       # Módulo raíz
│   └── main.ts             # Punto de entrada
├── docker-compose.yml
├── Dockerfile
└── package.json
```
