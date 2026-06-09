# Reglas del proyecto — WebArco Dental Studio

## Formato de respuesta API

Todas las respuestas de la API deben seguir el formato estándar:

### Éxito (2xx)
```json
{
  "success": true,
  "data": { ... },
  "message": "Mensaje descriptivo"
}
```

### Error (4xx/5xx)
```json
{
  "success": false,
  "data": null,
  "message": "Descripción del error"
}
```

### Implementación
- El formato lo aplican automáticamente `ResponseInterceptor` y `AllExceptionsFilter` registrados globalmente en `main.ts`.
- Los controladores/servicios NO deben devolver `{ success, data, message }` manualmente.
- Si un servicio retorna un objeto con propiedad `message`, el interceptor la extrae y la usa como mensaje de la respuesta; el resto se coloca dentro de `data`.
- Si el servicio no retorna `message`, se asigna uno por defecto según el código HTTP.

## Sistema de Privilegios

Cada endpoint de la API está protegido por privilegios. Los privilegios se definen en `prisma/seeders/privilegios.js` y su asignación a roles en `prisma/seeders/rolesprivilegios.js`.

### Lista completa de privilegios

| ID | Nombre | Módulo |
|----|--------|--------|
| 1 | DASHBOARD_GENERAL | Dashboard |
| 2 | DASHBOARD_FINANCIERO | Dashboard |
| 3 | ODONTOGRAMA_VER | Odontograma |
| 4 | ODONTOGRAMA_EDITAR | Odontograma |
| 5 | ODONTOGRAMA_HISTORIAL | Odontograma |
| 6 | USUARIOS_VER | Usuarios |
| 7 | USUARIOS_CREAR | Usuarios |
| 8 | USUARIOS_EDITAR | Usuarios |
| 9 | USUARIOS_PERFIL | Usuarios |
| 10 | FINANCIERO_INGRESO_CREAR | Pagos |
| 11 | FINANCIERO_EGRESO_CREAR | Pagos |
| 12 | FINANCIERO_VER_INGRESOS | Pagos |
| 13 | FINANCIERO_VER_EGRESOS | Pagos |
| 14 | CIERRES_CREAR | Cierres |
| 15 | CIERRES_VER | Cierres |
| 16 | PACIENTES_VER | Persona |
| 17 | PACIENTES_CREAR | Persona |
| 18 | PACIENTES_EDITAR | Persona |
| 19 | PACIENTES_BUSCAR | Persona |
| 20 | EXPEDIENTE_VER | Expediente Clínico |
| 21 | EXPEDIENTE_REGISTRAR_ATENCION | Expediente Clínico |
| 22 | CONSENTIMIENTOS_CREAR | Consentimientos |
| 23 | CONSENTIMIENTOS_FIRMAR_PACIENTE | Consentimientos |
| 24 | CONSENTIMIENTOS_FIRMAR_DOCTOR | Consentimientos |
| 25 | CONSENTIMIENTOS_VER | Consentimientos |
| 26 | CITAS_VER | Citas |
| 27 | CITAS_CREAR | Citas |
| 28 | CITAS_EDITAR | Citas |
| 29 | CITAS_DETALLE | Citas |
| 30 | RECORDATORIOS_VER | Recordatorios |
| 31 | RECORDATORIOS_HISTORIAL | Recordatorios |
| 45 | RECORDATORIOS_RESPONDER | Recordatorios |
| 32 | FOOTER_VER | Footer |
| 33 | ROL_VER | Roles |
| 34 | ROL_CREAR | Roles |
| 35 | ROL_EDITAR | Roles |
| 36 | PRIVILEGIO_VER | Privilegios |
| 37 | ANTECEDENTES_VER | Antecedentes |
| 38 | ANTECEDENTES_CREAR | Antecedentes |
| 39 | ANTECEDENTES_EDITAR | Antecedentes |
| 40 | CONSULTAS_VER | Consultas |
| 41 | CONSULTAS_CREAR | Consultas |
| 42 | CONSULTAS_EDITAR | Consultas |
| 43 | CONSULTAS_ELIMINAR | Consultas |
| 44 | CITAS_ELIMINAR | Citas |

### Reglas
- Los IDs de privilegios son inmutables. No reasignar IDs existentes.
- Para agregar un nuevo privilegio, añadirlo al final de `privilegios.js` con el ID siguiente.
- Actualizar `rolesprivilegios.js` para asignar el nuevo privilegio a los roles correspondientes.
- En los controllers, usar `@Privileges(id)` sobre cada endpoint. El guard `PrivilegesGuard` valida que el rol del usuario tenga al menos uno de los privilegios requeridos.
- Si un endpoint requiere múltiples privilegios (cualquiera de ellos basta), usar `@Privileges(id1, id2, ...)`.
