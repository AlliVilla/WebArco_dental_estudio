# Módulo de Consentimientos - Integración WebArco

## Descripción

El módulo de consentimientos facilita la gestión de consentimientos informados digitales para procedimientos dentales. Incluye funcionalidades para crear, firmar y listar consentimientos con seguimiento de estado de firmas.

## Estructura de Carpetas

```
src/features/consent/
├── components/
│   ├── ConsentimientosScreen.tsx      # Pantalla principal (listado)
│   ├── CrearConsentimientoScreen.tsx  # Pantalla de creación
│   ├── FormularioConsentimiento.tsx   # Formulario reutilizable
│   ├── FirmaCanvas.tsx                # Componente de firma digital
│   ├── ListadoConsentimientos.tsx     # Listado paginado
│   └── index.ts                       # Barrel export
├── services/
│   └── consentService.ts              # Servicios de API
├── types/
│   └── index.ts                       # Tipos TypeScript
└── index.ts                           # Barrel export del módulo
```

## Rutas

| Ruta | Componente | Descripción |
|------|-----------|------------|
| `/consent/list` | ConsentimientosScreen | Listado de consentimientos |
| `/consent/nuevo` | CrearConsentimientoScreen | Crear nuevo consentimiento |

## Componentes

### FirmaCanvas
Componente reutilizable para capturar firmas digitales con canvas.

**Props:**
- `label`: Etiqueta del campo
- `subtitle`: Subtítulo descriptivo
- `onCapture`: Callback cuando se guarda la firma
- `isSigned`: Indica si ya está firmado
- `disabled`: Desactiva la firma

**Uso:**
```tsx
<FirmaCanvas
  label="Firma del Paciente"
  subtitle="Ana María Rodríguez López"
  onCapture={(signature) => handleFirmaPaciente(signature)}
  isSigned={false}
/>
```

### FormularioConsentimiento
Formulario completo para crear consentimientos con validación.

**Props:**
- `pacienteName`: Nombre del paciente
- `pacienteId`: ID del paciente
- `expediente`: Número de expediente
- `onSubmit`: Callback al enviar el formulario
- `onCancel`: Callback al cancelar
- `loading`: Estado de carga

### ListadoConsentimientos
Componente de tabla filtrable y paginable de consentimientos.

**Features:**
- Búsqueda por paciente/ID/tratamiento
- Filtrado por estado
- Filtrado por mes
- Indicadores visuales de firmas
- Acciones (Imprimir/Descargar)

## Servicios

### consentService

```typescript
// Obtener lista de consentimientos
consentService.getAll(params)

// Crear nuevo consentimiento
consentService.create(data)

// Obtener detalles de un consentimiento
consentService.getById(id)

// Actualizar firmas
consentService.updateSignatures(id, data)

// Obtener estadísticas
consentService.getStats()

// Obtener para impresión/PDF
consentService.getPrintData(id)
```

## Tipos

### Estados

```typescript
type EstadoFirma = 'completo' | 'pendiente' | 'incompleto';
```

- **completo**: Tiene firmas del paciente y doctor
- **pendiente**: Tiene solo una firma
- **incompleto**: No tiene ninguna firma

## Flujos de Uso

### 1. Crear Consentimiento

1. Usuario navega a `/consent/nuevo`
2. Completa el formulario con datos del paciente, doctor, tipo de tratamiento
3. Firma como paciente usando FirmaCanvas
4. Firma como doctor usando FirmaCanvas
5. Acepta términos
6. Envía el formulario
7. Se crea el consentimiento en el backend

### 2. Ver Consentimientos

1. Usuario navega a `/consent/list`
2. Ve tabla con consentimientos
3. Puede:
   - Buscar por paciente o ID
   - Filtrar por estado (Completo/Pendiente/Incompleto)
   - Filtrar por mes
   - Descargar/Imprimir un consentimiento

## Privilegios Requeridos

| Operación | ID Privilegio |
|-----------|--------------|
| Crear consentimiento | 22 |
| Ver consentimientos | 25 |
| Firma del paciente | 23 |
| Firma del doctor | 24 |

## Validaciones

### FormularioConsentimiento

- Tipo de tratamiento: Requerido
- Doctor: Requerido
- Fecha: Requerido
- Firma del paciente: Requerida
- Firma del doctor: Requerida
- Aceptación de términos: Requerida

## Notas Importantes

### IDs Hardcodeados

Los componentes `CrearConsentimientoScreen` tienen IDs hardcodeados:
```typescript
id_paciente: 1,  // TODO: Obtener del contexto/params
id_doctor: 1,    // TODO: Obtener del usuario logueado
```

**Próximo paso:** Integrar con el contexto de autenticación para obtener el ID del usuario logueado y pasar el ID del paciente como parámetro.

### Integración con Backend

Los endpoints están en `/consents` (no `/consentimiento`):
- `POST /consents` - Crear
- `GET /consents` - Listar
- `GET /consents/:id` - Detalle
- `PATCH /consents/:id/signatures` - Actualizar firmas
- `GET /consents/stats` - Estadísticas
- `GET /consents/:id/print` - Datos para impresión

## Próximos Pasos

1. **Pantallas de Firma Separadas**: Crear pantallas dedicadas para firma del paciente y firma del doctor
2. **Generación de PDF**: Implementar descarga de consentimientos como PDF
3. **Notificaciones**: Agregar notificaciones cuando hay consentimientos pendientes
4. **Integración con Contexto**: Conectar con autenticación para obtener doctor ID
5. **Pantalla de Detalle**: Crear pantalla para ver detalles completos de un consentimiento

## Estilos y Tokens

El módulo utiliza los design tokens de WebArco:
- Colors primarios: `#0BC5DF` (cyan), `#203F49` (navy)
- Estados: Verde (`#1D9E75`), Amarillo (`#EF9F27`), Rojo (`#E24B4A`)
- Bordes: `#D3D7DA`
- Backgrounds: `#F8F9FA`, `#E6F8FB`

## Referencias

- Guidelines: [frontend/guidelines/Guidelines.md](../../guidelines/Guidelines.md)
- Backend: [backend/src/consentimiento/](../../../backend/src/consentimiento/)
