# Verificación de correcciones de seguridad

Fecha: 31 de octubre de 2026. Verificación local; no equivale a una prueba del servicio desplegado.

## Resultados

- `npm run build`: backend NestJS y frontend React/TypeScript compilan.
- `npm test --workspace=backend -- --runInBand`: cinco suites, 54 pruebas aprobadas. Incluye 29 pruebas nuevas de seguridad.
- `node node_modules/prisma/build/index.js validate --schema backend/prisma/schema.prisma`: esquema válido.
- Auditoría npm de producción del workspace: antes 32 paquetes afectados (uno crítico, 15 altos y 16 moderados); después cero. Los lockfiles independientes de backend/frontend usados por Docker también reportan cero en producción.
- Auditoría incluyendo herramientas de desarrollo: 34 avisos pendientes, 33 moderados y uno bajo; ninguno alto o crítico. Principalmente cadenas de Nest CLI, Jest y ESLint (glob/minimatch/deepmerge). Su corrección automática propone cambios mayores o degradaciones; no se aplicaron sin un plan de compatibilidad. Estos avisos no están resueltos y no se ocultan con `--force`.
- ExcelJS: exportación/importación XLSX en memoria con celdas combinadas, números y fecha; exportación streaming en memoria; ambas correctas tras los overrides.
- `git diff --check`: sin errores de espacios. Se aplicó Prettier a los archivos de código modificados.

Los JSON completos se conservan en [evidencias](./evidencias). Los logs locales `build.log` y `tests.log` están excluidos por la regla global de logs del repositorio.

## Trazabilidad de hallazgos

- S01: JWT y privilegios antes de descarga, nombres restringidos, confinamiento mediante ruta real y rechazo de separadores, rutas absolutas y doble codificación. Pruebas HTTP de traversal y de sesión ausente.
- S02: seed Docker automático deshabilitado, catálogos separados, seed demo bloqueado en producción y sin contraseñas conocidas, script explícito para administrador con cambio obligatorio. No se ejecutó ninguno; las cuentas ya insertadas requieren revisión y rotación por el responsable.
- S03: sin montajes estáticos de uploads; autorización por vínculo clínico/consentimiento o por propietario del archivo temporal. Galería, firmas e impresión usan solicitudes autenticadas. Archivos versionados conservados pendientes de revisión del propietario.
- S04: respuesta de login con campos permitidos, perfiles sin contraseña y filtrado recursivo de hashes en relaciones; se conserva la serialización de importes Prisma.Decimal. Prueba de salida anidada. El frontend sanea la copia antigua del usuario al cargar.
- S05: firma Twilio validada con URL configurada, sin logs del cuerpo ni respuestas cobrables automáticas. Correo con tokens aleatorios ligados a cita/acción, vencimiento, confirmación GET y consumo transaccional POST; historial externo con origen y sin atribución falsa a doctor. Pruebas de firma válida/falsa, manipulación, vencimiento, acción/cita incorrecta y consumo previo.
- S06: subida autenticada, privilegios, límites, validación binaria antes de escribir, extensión derivada del contenido, UUID y cuota de disco. Firmas multipart validadas en memoria y almacenadas como base64 autorizado. Pruebas de MIME falso y tamaño excesivo. No se borran huérfanos automáticamente.
- S07: arranque sin secretos fuertes/diferentes rechazado, sin claves de respaldo, algoritmo HS256 explícito. Pruebas de secretos ausentes/iguales.
- S08: sesión persistida y usuario activo consultados en cada autenticación, access de 15 minutos, refresh rotatorio con hash y actualización condicional; revocación en logout/desactivación, cambios de contraseña invalidan tokens previos y cambio obligatorio aplicado en backend. Pruebas de cuentas desactivadas, sesión revocada, credenciales cambiadas, replay y acceso al cambio obligatorio.
- S09: reporte de resultados exige privilegio financiero 2. Prueba de denegación a inventario 63 y aceptación con financiero 2.
- Medidas adicionales: límites por IP y cuenta, validación de Origin para mutaciones con cookies, Helmet, documentación deshabilitada en producción, guard de privilegios deniega por omisión, decoradores faltantes añadidos, errores con `data:null` y uploads sin doble envoltura JSON.

## Ajustes necesarios para verificar

- Se corrigieron dos referencias a una variable inexistente y el tipo de respuesta Axios del servicio de citas que bloqueaban TypeScript.
- Los mocks existentes de cierres omitían PrismaClient y pagoConsulta. Se corrigieron los fixtures; el helper de fechas ahora compara días naturales en vez de redondear una diferencia que incluía las 23:59:59 finales. No se alteraron los cálculos del servicio de cierres.

## Límites y pendientes operativos

- Migración preparada sin aplicar. Antes de publicar: respaldo, validación en base separada y aplicación controlada. No se probó la migración contra PostgreSQL ni se tocaron datos existentes.
- No se inspeccionaron secretos ni la cuenta de Render; falta verificar configuración y comportamiento desde el proxy público.
- No se construyeron ni arrancaron imágenes Docker. Los Dockerfiles y sus lockfiles se actualizaron; la verificación realizada es de código/build local y auditoría.
- No se enviaron correos/WhatsApp ni se desplegó. Envíos y tareas requieren activación explícita.
- Revisar cuentas demo existentes y contenido/historial de imágenes con el responsable. No se eliminaron datos, cuentas ni imágenes.
- Los límites en memoria y cuota local requieren coordinación externa si se usan varias réplicas. La política de acceso a pacientes conserva los privilegios del expediente; una restricción adicional por doctor necesita una regla de negocio explícita.

Configuración y pasos: [CONFIGURACION.md](./CONFIGURACION.md). Registro de actividad: [BITACORA.md](./BITACORA.md).
