# WebArco Dental Studio

Sistema de gestión dental. Backend construido con [NestJS](https://nestjs.com/) v11 + [Prisma](https://www.prisma.io/) v7 + PostgreSQL.

## Requisitos

- Node.js >= 20
- PostgreSQL 16
- npm
- Docker y Docker Compose (opcional, para ejecución con contenedores)

## Ejecución con Docker Compose (recomendado)

```bash
# Clonar el repositorio y entrar al directorio
cd WebArco_dental_estudio

# Levantar los servicios
docker-compose up -d
```

Esto inicia:
- **PostgreSQL 16** en `localhost:6767` (configurable via `POSTGRES_PORT` en `.env`)
- **Backend** en `http://localhost:3030` (configurable via `BACKEND_PORT` en `.env`)

Al arrancar, el backend ejecuta automáticamente:
1. Migraciones de Prisma (`npx prisma migrate deploy`)
2. Seed de datos iniciales (`npx prisma db seed`)
3. Servicio en modo desarrollo con hot-reload

Para ver los logs:
```bash
docker-compose logs -f backend
```

Para detener:
```bash
docker-compose down
```

Para reiniciar la base de datos desde cero (borra todos los datos):
```bash
docker-compose down -v
docker-compose up -d
```

## Ejecución con BD en Docker + backend local

Corré solo PostgreSQL en Docker y el backend de forma local (ideal para desarrollo con hot-reload rápido).

### 1. Iniciar PostgreSQL en Docker

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

Editar `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/webarcodental"
PORT=3030
```

### 3. Instalar dependencias y preparar la base de datos

```bash
cd backend
npm install
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

El servidor se levanta en `http://localhost:3030`.

### 5. Detener la BD cuando no se use

```bash
docker stop dental_db && docker rm dental_db
```

## Ejecución completamente local (sin Docker)

### 1. Configurar la base de datos

Asegurate de tener PostgreSQL instalado y corriendo localmente, y creá la base de datos:

```bash
createdb webarcodental
```

### 2. Configurar variables de entorno

Editar `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/webarcodental"
PORT=3030
```

Ajustá el usuario, contraseña, host y puerto según tu configuración local de PostgreSQL.

### 3. Instalar dependencias y preparar la base de datos

```bash
cd backend
npm install
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

El servidor se levanta en `http://localhost:3030`.

## Documentación de la API (Scalar)

Una vez corriendo el backend, la documentación interactiva está disponible en:

```
http://localhost:3030/reference
```

Desde ahí se pueden probar todos los endpoints directamente.

## Scripts disponibles

Todos los scripts se ejecutan desde `backend/`:

| Script | Descripción |
|---|---|
| `npm run start:dev` | Iniciar en modo desarrollo (hot-reload) |
| `npm run build` | Compilar a JavaScript |
| `npm run start:prod` | Iniciar en modo producción |
| `npm run test` | Ejecutar tests unitarios |
| `npm run test:e2e` | Ejecutar tests end-to-end |
| `npm run prisma:studio` | Abrir Prisma Studio (UI para ver/editar datos) |
| `npm run prisma:migrate` | Crear y aplicar migraciones |
| `npm run prisma:deploy` | Aplicar migraciones pendientes |
| `npm run prisma:seed` | Ejecutar seed de datos |
| `npm run prisma:reset` | Resetear base de datos (borra todo y re-ejecuta migraciones + seed) |
| `npm run lint` | Ejecutar linter |

## Datos iniciales (seed)

Al ejecutar `npx prisma db seed` se insertan:

- 18 departamentos de Honduras con sus municipios
- Roles y privilegios del sistema
- 5 personas de ejemplo
- Usuarios de prueba
- 6 preguntas de antecedentes médicos
- Numeración dental (permanentes y temporales)
