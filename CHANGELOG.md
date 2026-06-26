# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
Versionado semántico según [SemVer](https://semver.org/lang/es/).

---

## [Unreleased]

### Pendiente

* Notificaciones en tiempo real (branch `alternative/notification_center`)
* Módulo de estado de resultados financieros (`feature/EstadoResultado`)
* Mejoras de responsividad en facturación (`facturazion_responsive`)
* Cambios en egresos (`feat/cambios_egresos`)

---

## [1.3.0] — 2026-06-25

### Agregado

* Endpoint `PATCH /consents/:id/signatures` acepta tanto `multipart/form-data` (Multer) como JSON con base64
* Soporte de `firma_paciente` y `firma_doctor` como Data URL en el body del `CREATE /consents`
* Helper `procesarBase64SiEsNecesario` en `ConsentimientoService` para conversión automática base64 → archivo en disco
* Método `canvasToFile` en `consentimientoService` del frontend para convertir canvas de firma a `File`
* Filtro de consentimientos por mes y año en `GET /consents`
* Snapshot histórico de firma del doctor (`firma_doctor_snapshot`) — la firma queda ligada a la consulta, no al perfil del doctor

### Corregido

* **Fix #3**: Endpoint de impresión usa `firma_doctor_snapshot` en lugar del perfil actual del doctor
* **Fix #4**: Nombre completo del doctor calculado dinámicamente en `imprimir()`
* **Fix #5**: Nombre completo del paciente incluye segundo nombre y segundo apellido
* **Fix #9**: Campo `diagnostico` disponible en respuesta de `imprimir()`
* **Fix #16**: Cálculo de rango de fechas cuando solo se pasa `anio` sin `mes` (evitaba desbordamiento de mes 12)
* Guard `PrivilegesGuard` adjunta `privilegios` al objeto `request.user` correctamente

---

## [1.2.0] — 2026-06-17

### Agregado

* Módulo `consentimiento` completo: CRUD, stats, endpoint de impresión
* Firma digital del paciente y del doctor con Multer (subida de imagen)
* Endpoint `GET /consents/stats` devuelve conteos por estado (completo/pendiente/incompleto)
* Campo `estado_firmas` calculado en memoria (sin columna extra en BD)
* Filtros de búsqueda en `GET /consents`: por paciente, tratamiento, doctor, estado y rango de fechas

### Cambiado

* `ResponseInterceptor` ahora extrae `message`/`mensaje` del payload antes de envolver en envelope
* `AllExceptionsFilter` unifica errores HTTP y excepciones no controladas en el mismo formato `{ success, data, message }`

### Corregido

* Corrección en módulo de consentimientos frontend: migración de datos mock a API live (`fix/consent`, `fix/Consentimiento`, `fix/doctorsConsent`)
* Paginación en `DataTable` cambiada de antd a implementación propia (`Change_Data_Table_Pagination`)

---

## [1.1.0] — 2026-06-14

### Agregado

* Módulo `expediente-clinico` con registro de visitas y antecedentes médicos
* Módulo `finanzas` con egresos, cierres y estado de resultados
* Botón de exportación a Excel en lista financiera
* Guards de autenticación (`JwtAuthGuard`) y autorización por privilegios (`PrivilegesGuard`)
* Decorator `@Privileges()` para protección por privilegio en endpoints individuales
* Frontend: módulo de pacientes con correcciones en expedientes (`correcciones-pacientes`, `feature/correciones-expedientes-pacientes`)

### Cambiado

* Dashboard y módulo de inventario ahora son responsivos (`DashYInvt_responsive`)

### Corregido

* Correcciones en flujo de login frontend (`Correciones_login`)

---

## [1.0.0] — 2026-06-09

### Agregado

* Estructura inicial del monorepo (workspaces `backend` / `frontend`)
* Backend NestJS con Prisma + PostgreSQL
* Autenticación JWT con access token (8h) y refresh token (7d) vía HTTP cookies
* Endpoint `POST /auth/login` con validación de usuario activo y carga de privilegios
* Endpoint `POST /auth/forgot-password` con token de reset ligado al hash actual de la contraseña (composite secret)
* Endpoint `PUT /auth/reset-password` con validación de token y bloqueo de reutilización de contraseña
* Endpoint `POST /auth/refresh` para renovar access token sin re-login
* `BrevoService` para envío de correos transaccionales vía Brevo API
* Template HTML de correo para recuperación de contraseña (`buildResetPasswordEmail`)
* `ValidationPipe` global con `whitelist: true` y `transform: true`
* Configuración CORS para múltiples orígenes via `CORS_ORIGINS`
* Módulo `cita` (creación, consulta, cambio de estado, recordatorios)
* Módulo `paciente`/`persona` con antecedentes médicos y odontograma
* Módulo `inventario` con categorías, insumos y unidades de medida
* Frontend React + Vite + TypeScript con Tailwind CSS
* Sistema de rutas y contexto de autenticación en frontend
* Docker Compose para desarrollo y producción
* Seed inicial: departamentos y municipios de Honduras, roles, privilegios, datos de prueba
* Documentación de API con Scalar (`GET /reference`)

---

## Guía de versionado

```
MAYOR.MENOR.PARCHE

MAYOR — cambios incompatibles con versiones anteriores (ej: renombrar endpoints, cambiar estructura de respuesta)
MENOR — nueva funcionalidad compatible hacia atrás (ej: nuevo módulo, nuevo endpoint)
PARCHE — correcciones de bugs compatibles hacia atrás
```

### Convención de ramas

| Prefijo        | Propósito                       |
| -------------- | ------------------------------- |
| `feature/`     | Nueva funcionalidad             |
| `fix/`         | Corrección de bug               |
| `feat/`        | Alias de feature (legacy)       |
| `alternative/` | Exploración / prototipo         |
| `main`         | Rama principal, siempre estable |

### Convención de commits (recomendado)

```
tipo(alcance): descripción corta en imperativo

Ejemplos:
feat(consentimiento): agregar endpoint de impresión con snapshot de firma
fix(auth): corregir expiración de refresh token en zona horaria HN
chore(prisma): migración para campo firma_doctor_snapshot
docs(readme): actualizar instrucciones de instalación con Docker
```

Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
