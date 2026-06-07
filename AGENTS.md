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
