# WebArco Dental Studio — Frontend Guidelines

> Guía de diseño y desarrollo para el proyecto **WebArco Dental Studio**.
> Toda pantalla nueva, componente o feature **debe** seguir estas reglas detallas despues del prompt.


>Prompt a utilizar cuando vayan a crear una pantalla.

Eres un desarrollador frontend senior trabajando en el proyecto WebArco Dental Studio.
Debes generar código React + TypeScript siguiendo ESTRICTAMENTE las siguientes reglas:

─────────────────────────────────────────
 ARQUITECTURA
─────────────────────────────────────────
- El componente va en: src/features/<modulo>/components/NombrePantalla.tsx
- Usa function declarations: export function NombrePantalla() { ... }
- Exporta la interfaz de props junto al componente (PascalCase: NombrePantallaProps)
- Cada feature tiene su barrel export en index.ts
- **Sub-módulos complejos:** Se agrupan en subcarpetas dentro de `components/` de un feature. Deben tener la siguiente estructura limpia y anidada (ej: `odontograma` o `expediente`):
  ```text
  src/features/<modulo>/components/<sub-modulo-complejo>/
  ├── components/           # Vistas/componentes internos (ej. OdontogramaScreen.tsx)
  ├── services/             # Servicios específicos del sub-módulo (opcional)
  ├── types/                # Tipos específicos del sub-módulo (opcional)
  └── index.ts              # Barrel export (export * from './components/...')
  ```

─────────────────────────────────────────
 ORDEN DE IMPORTS (respetar siempre)
─────────────────────────────────────────
1. React y librerías de terceros (react-router-dom, lucide-react)
2. Componentes reutilizables → import { DataTable, ConfirmModal, FormSection, FullWidthField } from '../components';
3. UIKit / Contextos      → import { Button, Input, Select, Card, Alert, Toggle, StatusBadge, FieldBadge, SectionBlock, PasswordInput, Avatar, Combobox } from '../context';
4. Servicios, hooks, utils → import { api } from '../services/api'; | import { formatCurrency, formatDate } from '../utils/formatters';
5. Tipos locales del feature → import type { MiTipo } from '../types';

─────────────────────────────────────────
 DESIGN TOKENS — Usa SOLO estos colores
─────────────────────────────────────────
#0BC5DF  → primary (botones, links, iconos activos)
#0899B0  → primary-dark (hover)
#E6F8FB  → primary-light (backgrounds sutiles, badges)
#203F49  → navy (textos principales, headings)
#1D9E75  → success
#EF9F27  → warning
#E24B4A  → danger
#F8F9FA  → gray-50 (background inputs, filas alternas)
#F1F3F4  → gray-100 (background secciones)
#D3D7DA  → gray-300 (bordes, divisores)
#888F94  → gray-500 (texto secundario, placeholders)
#5F656A  → gray-700 (texto terciario)

❌ NO inventar colores. NO usar #333, #eee, #fff arbitrarios.

─────────────────────────────────────────
 REGLAS DE ESTILO
─────────────────────────────────────────
- Inline styles son la norma en componentes (no crear CSS por componente)
- **Tema y Dark Mode:** Utilizar siempre variables CSS del tema (`var(--background)`, `var(--foreground)`, `var(--card)`, `var(--border)`, `var(--arco-primary)`) en lugar de colores hexadecimales fijos, para garantizar la compatibilidad automática con el modo oscuro.
- Llamar a `useTheme()` al inicio de los componentes principales para reaccionar a los cambios de tema.
- Border-radius: 8px inputs | 10px botones/dropdowns | 12px cards | 14px form sections | 16px DataTable
- Font sizes: 11px labels uppercase | 13px body/celdas | 14px inputs/subtítulos | 16px títulos sección | 18px títulos de página
- Font weights: 400 normal | 500 medium | 600 semibold
- Usar flexbox/gap en lugar de margin entre hermanos
- NO usar position: absolute salvo que sea estrictamente necesario

─────────────────────────────────────────
 COMPONENTES — Reglas de uso
─────────────────────────────────────────
- SIEMPRE usar DataTable cuando la pantalla muestra una lista/tabla.
- **Tipado de DataTable:** Los tipos/modelos de datos genéricos pasados a `DataTable<T>` deben definirse utilizando alias de tipo (`type`) en lugar de interfaces (`interface`), para satisfacer la restricción `Record<string, unknown>` (ya que las interfaces de TypeScript carecen de una firma de índice de cadena implícita).
- SIEMPRE usar ConfirmModal para acciones destructivas (eliminar, cancelar)
- SIEMPRE usar FormSection + FullWidthField para formularios
- Button de UIKit (src/context) en formularios e interfaces → variantes: primary | secondary | ghost | danger | tamaños: sm | md | lg
- Iconos de lucide-react únicamente → size={16} en botones, size={18} en secciones, size={20} en headers
- Estado UI con useState | Datos derivados con useMemo | Persistencia con useLocalStorage

─────────────────────────────────────────
 NAVEGACIÓN
─────────────────────────────────────────
- Usar useNavigate() para navegación programática
- Usar <Link> para navegación declarativa
- NO usar estado interno (activeTab) para simular cambio de pantallas
- Rutas: /feature | /feature/sub-feature

─────────────────────────────────────────
 API Y SERVICIOS
─────────────────────────────────────────
- Instancia Axios centralizada: import { api } from '../services/api';
- Servicios en: src/features/<modulo>/services/<modulo>Service.ts
- Formato de respuesta del backend: { success, data, message }
- Token Bearer se adjunta automáticamente desde localStorage

─────────────────────────────────────────
 UTILS
─────────────────────────────────────────
- formatCurrency(n)   → "L. 1,500.00"
- formatDate(iso)     → "7 jun 2026"
- formatIdentity(s)   → "0801-1990-12345"

─────────────────────────────────────────

Ahora genera la siguiente pantalla:

[DESCRIBE AQUÍ TU PANTALLA — ejemplo:]
"Pantalla de listado de citas del módulo appointments. Muestra una tabla con columnas: paciente, fecha, hora, doctor, estado. Tiene un botón para crear nueva cita. Permite filtrar por estado (Programada, Confirmada, Cancelada). Al hacer clic en eliminar, muestra un ConfirmModal de tipo danger."




---

## Tabla de contenidos

1. [Arquitectura del Proyecto](#1-arquitectura-del-proyecto)
2. [Estructura de Carpetas](#2-estructura-de-carpetas)
3. [Convenciones de Nombres](#3-convenciones-de-nombres)
4. [Rutas y Navegación](#4-rutas-y-navegación)
5. [Design Tokens (Paleta de Colores)](#5-design-tokens-paleta-de-colores)
6. [Componentes Reutilizables — `src/components`](#6-componentes-reutilizables--srccomponents)
7. [UIKit — `src/context/UIKit.tsx`](#7-uikit--srccontextuikittsx)
8. [Hooks Personalizados](#8-hooks-personalizados)
9. [Servicios y API](#9-servicios-y-api)
10. [Utils / Formatters](#10-utils--formatters)
11. [Reglas de Layout](#11-reglas-de-layout)
12. [Reglas de Estilo CSS](#12-reglas-de-estilo-css)
13. [Reglas de Código TypeScript/React](#13-reglas-de-código-typescriptreact)

---

## 1. Arquitectura del Proyecto

| Capa              | Responsabilidad                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| `components/`     | Componentes genéricos y reutilizables (DataTable, ConfirmModal, Sidebar, etc.)  |
| `context/`        | UIKit primitivo, ThemeContext, DesignSystemScreen                                |
| `features/`       | Módulos de negocio con sub-carpetas `components/`, `services/`, `types/`        |
| `page layouts/`   | Layouts principales (MainLayout, Dashboard)                                     |
| `hooks/`          | Custom hooks reutilizables                                                       |
| `services/`       | Instancia de Axios y configuración de API                                        |
| `styles/`         | Archivos CSS globales y tokens de tema                                           |
| `types/`          | Tipos globales del proyecto                                                      |
| `utils/`          | Funciones utilitarias puras (formatters, helpers)                                |

---

## 2. Estructura de Carpetas

```
src/
├── assets/                     # Imágenes y recursos estáticos
├── components/                 # ⭐ Componentes reutilizables globales
│   ├── index.ts                # Barrel export — SIEMPRE importar desde aquí
│   ├── DataTable.tsx           # Tabla genérica con búsqueda, filtros, paginación
│   ├── ConfirmModal.tsx        # Modal de confirmación (danger / info)
│   ├── Button.tsx              # Botón con variantes (primary / secondary)
│   ├── Sidebar.tsx             # Sidebar de navegación principal
│   ├── Spinner.tsx             # Indicador de carga
│   ├── TopBar.tsx              # Barra superior con título, breadcrumbs y búsqueda
│   └── figma/
│       └── ImageWithFallback.tsx
├── context/                    # ⭐ UIKit primitivo y contextos globales
│   ├── index.ts                # Barrel export
│   ├── UIKit.tsx               # Componentes primitivos (Button, Input, Select, etc.)
│   ├── ThemeContext.tsx         # Provider de tema (light/dark)
│   └── DesignSystemScreen.tsx  # Pantalla de referencia del design system
├── features/                   # Módulos de negocio
│   ├── appointments/           # Gestión de citas y agenda
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── auth/                   # Autenticación y control de acceso
│   ├── billing/                # Facturación y caja (ingresos/egresos)
│   │   ├── components/
│   │   ├── services/
│   │   └── types/
│   ├── cierres/                # Cierres de caja (diarios/mensuales)
│   ├── consent/                # Firma y gestión de consentimientos informados
│   ├── consultations/          # Consultas clínicas e historial
│   ├── inventory/              # Control de insumos e inventario
│   ├── patients/               # Gestión de expedientes de pacientes
│   │   ├── components/
│   │   │   ├── consentimientos/# Sub-módulo para firmas de consentimiento del paciente
│   │   │   ├── expediente/     # Sub-módulo para ficha y datos clínicos del paciente
│   │   │   └── odontograma/    # Sub-módulo para odontograma interactivo
│   │   ├── services/
│   │   └── types/
│   ├── reminders/              # Recordatorios de citas (WhatsApp, SMS, Correo)
│   ├── reports/                # Reportes financieros y operativos
│   ├── settings/               # Configuración general y del sistema
│   ├── treatments/             # Catálogo de tratamientos y precios
│   └── users/                  # Administración de usuarios y roles
├── hooks/
│   └── useLocalStorage.ts
├── page layouts/
│   ├── MainLayout.tsx          # Layout principal con Sidebar + TopBar + Outlet
│   └── Dashboard.tsx
├── services/
│   └── api.ts                  # Instancia Axios con interceptores
├── styles/
│   ├── theme.css               # Design tokens CSS
│   ├── fonts.css
│   ├── globals.css
│   └── index.css
├── types/
│   └── api.ts
├── utils/
│   └── formatters.ts           # formatCurrency, formatDate, formatIdentity
├── App.tsx                     # Definición de rutas (react-router-dom)
├── main.tsx                    # Entry point (BrowserRouter + ThemeProvider)
└── index.css                   # Estilos globales base
```

---

## 3. Convenciones de Nombres

### Archivos

| Tipo                 | Convención           | Ejemplo                         |
| -------------------- | -------------------- | ------------------------------- |
| Componente React     | `PascalCase.tsx`     | `DataTable.tsx`, `TopBar.tsx`   |
| Hook                 | `camelCase.ts`       | `useLocalStorage.ts`            |
| Servicio             | `camelCase.ts`       | `odontogramaService.ts`         |
| Tipo / Interfaz      | `camelCase.ts`       | `api.ts`                        |
| Utilidad             | `camelCase.ts`       | `formatters.ts`                 |
| CSS                  | `kebab-case.css`     | `theme.css`, `globals.css`      |
| Barrel export        | `index.ts`           | Siempre se llama `index.ts`     |

### Código

| Elemento           | Convención     | Ejemplo                      |
| ------------------ | -------------- | ---------------------------- |
| Componente         | `PascalCase`   | `DataTable`, `ConfirmModal`  |
| Props interface    | `PascalCase`   | `DataTableProps`             |
| Hook               | `camelCase`    | `useLocalStorage`            |
| Función utilidad   | `camelCase`    | `formatCurrency`             |
| Variable / State   | `camelCase`    | `isLoading`, `filterValues`  |
| Tipo genérico      | `PascalCase`   | `Column<T>`, `RowAction<T>`  |
| CSS variable       | `--kebab-case` | `--arco-primary`             |

---

## 4. Rutas y Navegación

- Usa **`react-router-dom`** con `<Routes>`, `<Route>` y `<Outlet>`.
- **NO** uses estado interno (`activeTab`) para cambiar pantallas. Cada pantalla tiene su URL real.
- `MainLayout` actúa como layout padre con `<Outlet />` para renderizar las rutas hijas.
- La navegación se hace con `useNavigate()` (programática) o `<Link>` (declarativa).

### Convención de rutas

| Patrón                    | Ejemplo                           |
| ------------------------- | --------------------------------- |
| `/feature`                | `/dashboard`, `/agenda`           |
| `/feature/sub-feature`    | `/patients/list`, `/billing/income` |
| Redirect al sub-default   | `/patients` → `/patients/list`    |

### Agregar una pantalla nueva

1. Crea el componente en `src/features/<module>/components/NuevaPantalla.tsx`.
2. Agrégala como `<Route>` en `src/App.tsx`.
3. Agrega la config de título/breadcrumbs en `screenConfig` dentro de `MainLayout.tsx`.
4. Si necesita entrada en el sidebar, agrégala en `Sidebar.tsx` (con `subItems` si es sub-ruta).

---

## 5. Design Tokens (Paleta de Colores)

Definidos en `src/styles/theme.css`. Usa **siempre** estos valores en componentes inline o CSS:

### Colores de Marca

| Token                   | Valor     | Uso                                |
| ----------------------- | --------- | ---------------------------------- |
| `--arco-primary`        | `#0BC5DF` | Color principal (botones, links)   |
| `--arco-primary-dark`   | `#0899B0` | Hover del color principal          |
| `--arco-primary-light`  | `#E6F8FB` | Backgrounds sutiles, badges activos|
| `--arco-navy`           | `#203F49` | Textos principales, headings       |
| `--arco-success`        | `#1D9E75` | Estados exitosos, confirmaciones   |
| `--arco-warning`        | `#EF9F27` | Alertas, estados de advertencia    |
| `--arco-danger`         | `#E24B4A` | Errores, eliminaciones, peligro    |

### Escala de Grises

| Token               | Valor     | Uso                                 |
| -------------------- | --------- | ----------------------------------- |
| `--arco-gray-50`     | `#F8F9FA` | Background de inputs, rows alternas |
| `--arco-gray-100`    | `#F1F3F4` | Background de secciones, muted      |
| `--arco-gray-300`    | `#D3D7DA` | Bordes, divisores                   |
| `--arco-gray-500`    | `#888F94` | Texto secundario, placeholders      |
| `--arco-gray-700`    | `#5F656A` | Texto terciario                     |
| `--arco-gray-900`    | `#203F49` | Texto principal (= --arco-navy)     |

### Hardcoded Values y Variables CSS (Estilos Inline)

Cuando uses inline styles en componentes, prefiere **siempre las variables CSS del tema** (ej. `var(--background)`, `var(--foreground)`, `var(--card)`, `var(--border)`, `var(--arco-primary)`) en lugar de colores hexadecimales fijos. Esto garantiza la compatibilidad automática con el modo oscuro (Dark Mode).

Si requieres colores fijos de marca para elementos que no cambian con el tema, usa **exclusivamente los valores hex** de la paleta anterior. **NO inventes colores nuevos**.

```tsx
// ✅ Correcto (Compatible con Dark Mode)
style={{ color: 'var(--foreground)', background: 'var(--background)', border: '1px solid var(--border)' }}

// ✅ Correcto (Usando colores fijos de la paleta autorizada)
style={{ color: '#203F49', background: '#F8F9FA', border: '1px solid #D3D7DA' }}

// ❌ Incorrecto (Color inventado)
style={{ color: '#333', background: '#eee' }}
```

---

## 6. Componentes Reutilizables — `src/components`

> **REGLA**: Toda pantalla que necesite una tabla, modal de confirmación o sección de formulario
> **DEBE** usar estos componentes. No duplicar markup.

### Cómo importar

```tsx
// ✅ Siempre importa desde el barrel
import { DataTable, ConfirmModal } from '../components';

// ❌ No importar directo del archivo
import { DataTable } from '../components/DataTable';
```

---

### 6.1 `DataTable<T>`

Tabla genérica con búsqueda, filtros dropdown, paginación y acciones por fila.

**Archivo**: `src/components/DataTable.tsx`

#### Props principales

| Prop               | Tipo                                              | Descripción                                         |
| ------------------ | ------------------------------------------------- | --------------------------------------------------- |
| `columns`          | `Column<T>[]`                                     | Definición de columnas con `key`, `label`, `render`  |
| `data`             | `T[]`                                             | Array de datos                                       |
| `title`            | `string`                                          | Título del header de la tabla                        |
| `description`      | `string`                                          | Subtítulo descriptivo                                |
| `searchable`       | `boolean` (default `true`)                        | Mostrar barra de búsqueda                            |
| `searchPlaceholder`| `string`                                          | Placeholder del input de búsqueda                    |
| `searchKeys`       | `(keyof T)[]`                                     | Claves sobre las que buscar                          |
| `filters`          | `FilterDef[]`                                     | Definición de filtros dropdown                       |
| `pageSize`         | `number` (default `10`)                           | Filas por página                                     |
| `primaryAction`    | `{ label, icon?, onClick }`                       | Botón principal del header                           |
| `secondaryActions` | `{ label, icon?, onClick }[]`                     | Botones secundarios del header                       |
| `rowActions`       | `(row: T) => RowAction<T>[]`                      | Acciones por fila (iconos tipo botón)                |
| `getRowKey`        | `(row: T, index: number) => string`               | Generador de key único por fila                      |
| `emptyMessage`     | `string`                                          | Mensaje cuando no hay datos                          |

#### Ejemplo de uso

```tsx
import { DataTable, Column, FilterDef } from '../components';
import { Plus, Eye, Trash2 } from 'lucide-react';

const columns: Column<Patient>[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'identidad', label: 'Identidad' },
  { key: 'estado', label: 'Estado', render: (val) => <StatusBadge status={val as string} /> },
];

const filters: FilterDef[] = [
  { key: 'estado', placeholder: 'Estado', options: [
    { value: 'activo', label: 'Activo' },
    { value: 'inactivo', label: 'Inactivo' },
  ]},
];

<DataTable
  columns={columns}
  data={patients}
  title="Registro de Pacientes"
  description="Gestión completa de pacientes"
  searchPlaceholder="Buscar paciente..."
  searchKeys={['nombre', 'identidad']}
  filters={filters}
  primaryAction={{ label: 'Nuevo Paciente', icon: <Plus size={16} />, onClick: handleNew }}
  rowActions={(row) => [
    { icon: <Eye size={16} />, label: 'Ver', onClick: () => viewPatient(row) },
    { icon: <Trash2 size={16} />, label: 'Eliminar', onClick: () => deletePatient(row), danger: true },
  ]}
  getRowKey={(row) => String(row.id)}
/>
```

---

### 6.2 `FormSection`

Contenedor de sección de formulario con icono, título y grid configurable.

**Archivo**: `src/components/DataTable.tsx` (exportado junto a DataTable)

#### Props

| Prop       | Tipo                | Descripción                               |
| ---------- | ------------------- | ----------------------------------------- |
| `icon`     | `React.ReactNode`   | Icono de la sección (color cyan)          |
| `title`    | `string`            | Título de la sección                      |
| `columns`  | `1 \| 2 \| 3` (default `2`) | Columnas del grid interno        |
| `children` | `React.ReactNode`   | Campos del formulario                     |
| `style`    | `CSSProperties`     | Estilos adicionales                       |

#### Ejemplo

```tsx
import { FormSection, FullWidthField } from '../components';
import { Input, Select } from '../context';
import { User } from 'lucide-react';

<FormSection icon={<User size={18} />} title="Datos Personales" columns={2}>
  <Input label="Nombre" badge="required" />
  <Input label="Apellido" badge="required" />
  <FullWidthField>
    <Input label="Dirección" />
  </FullWidthField>
</FormSection>
```

---

### 6.3 `FullWidthField`

Helper para que un campo ocupe todas las columnas de un `FormSection`.

```tsx
<FullWidthField>
  <Input label="Notas" />
</FullWidthField>
```

---

### 6.4 `ConfirmModal`

Modal de confirmación con variante `danger` (rojo) e `info` (cyan).

**Archivo**: `src/components/ConfirmModal.tsx`

#### Props

| Prop            | Tipo                   | Descripción                          |
| --------------- | ---------------------- | ------------------------------------ |
| `open`          | `boolean`              | Controla visibilidad                 |
| `onClose`       | `() => void`           | Cerrar modal                         |
| `onConfirm`     | `() => void`           | Acción de confirmación               |
| `variant`       | `'danger' \| 'info'`   | Estilo visual del modal              |
| `title`         | `string`               | Título                               |
| `description`   | `string`               | Texto descriptivo                    |
| `confirmLabel`  | `string` (default `'Confirmar'`) | Texto del botón                |
| `cancelLabel`   | `string` (default `'Cancelar'`)  | Texto del botón cancelar       |
| `loading`       | `boolean`              | Estado de carga del botón confirmar  |

#### Ejemplo

```tsx
import { ConfirmModal } from '../components';

<ConfirmModal
  open={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  variant="danger"
  title="Eliminar Paciente"
  description="¿Estás seguro de eliminar este paciente? Esta acción no se puede deshacer."
  confirmLabel="Eliminar"
/>
```

---

### 6.5 `Sidebar`

Barra lateral de navegación principal. Soporta items con `subItems` para sub-rutas anidadas.

**Archivo**: `src/components/Sidebar.tsx`

---

### 6.6 `TopBar`

Barra superior fija con título, breadcrumbs, búsqueda global y notificaciones.

**Archivo**: `src/components/TopBar.tsx`

---

### 6.7 `Button` (componentes)

Botón simple con variantes `primary` / `secondary` y estado `isLoading`.

**Archivo**: `src/components/Button.tsx`

> ⚠️ Para formularios e interfaces inline, prefiere el `Button` de `src/context/UIKit.tsx` que tiene más variantes (`primary`, `secondary`, `ghost`, `danger`) y más tamaños (`sm`, `md`, `lg`).

---

### 6.8 `Spinner`

Indicador de carga circular animado.

**Archivo**: `src/components/Spinner.tsx`

```tsx
import { Spinner } from '../components';
<Spinner size={32} color="var(--primary)" />
```

---

## 7. UIKit — `src/context/UIKit.tsx`

> Componentes **primitivos** del design system. Importar desde `src/context`.

```tsx
import { Button, Input, Select, Card, Alert, Toggle, Avatar, FieldBadge, StatusBadge, SectionBlock, PasswordInput, Combobox } from '../context';
```

### Componentes disponibles

| Componente       | Descripción                                             |
| ---------------- | ------------------------------------------------------- |
| `Button`         | Botón con variantes `primary`, `secondary`, `ghost`, `danger` y tamaños `sm`, `md`, `lg` |
| `Input`          | Input con label, badge (required/optional/conditional), error, hint, icono |
| `PasswordInput`  | Input de contraseña con toggle de visibilidad            |
| `Select`         | Select nativo estilizado con label, badge, error         |
| `Combobox`       | Input con buscador, dropdown y opción de creación inline |
| `Card`           | Contenedor con borde y border-radius 12px                |
| `SectionBlock`   | Bloque gris con título uppercase                         |
| `Alert`          | Banner con variantes `info`, `success`, `warning`, `error` |
| `Toggle`         | Switch toggle on/off                                     |
| `Avatar`         | Círculo con iniciales                                    |
| `FieldBadge`     | Badge de campo: Requerido / Opcional / Condicional       |
| `StatusBadge`    | Badge de estado: Programada, Confirmada, Cancelada, etc. |

### Regla de uso Button

- **Dentro de formularios y pantallas**: Usa `Button` de `UIKit` (`src/context`).
- **Dentro de `DataTable` headers**: `DataTable` ya usa `Button` de `UIKit` internamente.
- **El `Button` de `src/components/Button.tsx`**: Solo se usa para casos legacy con clases CSS.

---

## 8. Hooks Personalizados

### `useLocalStorage<T>(key, initialValue)`

**Archivo**: `src/hooks/useLocalStorage.ts`

```tsx
import { useLocalStorage } from '../hooks/useLocalStorage';

const [value, setValue] = useLocalStorage('my_key', defaultValue);
```

### `useTheme()`

**Archivo**: `src/context/ThemeContext.tsx`

```tsx
import { useTheme } from '../context';

const { theme, toggleTheme } = useTheme();
```

---

## 9. Servicios y API

### Instancia Axios

**Archivo**: `src/services/api.ts`

- Base URL: `VITE_API_URL` o `http://localhost:3030`.
- Token Bearer: Se adjunta automáticamente desde `localStorage('webarco_auth_token')`.
- Las respuestas se parsean al formato envelope del backend: `{ success, data, message }`.

### Servicios por Feature

Cada feature tiene su propio archivo de servicio dentro de `src/features/<module>/services/`.

```tsx
// ✅ Correcto
import { api } from '../../../services/api';

export const patientService = {
  getAll: () => api.get('/patients'),
  getById: (id: number) => api.get(`/patients/${id}`),
  create: (data: CreatePatientDto) => api.post('/patients', data),
};
```

---

## 10. Utils / Formatters

**Archivo**: `src/utils/formatters.ts`

| Función            | Descripción                                    | Ejemplo de salida         |
| ------------------- | ---------------------------------------------- | ------------------------- |
| `formatCurrency(n)` | Formato de Lempiras hondureños                 | `L. 1,500.00`            |
| `formatDate(iso)`   | Fecha legible en español                       | `7 jun 2026`             |
| `formatIdentity(s)` | Formato de identidad Honduras (13 dígitos)     | `0801-1990-12345`        |

```tsx
import { formatCurrency, formatDate } from '../utils/formatters';
```

---

## 11. Reglas de Layout

* **No usar `position: absolute`** salvo que sea estrictamente necesario. Preferir flexbox y grid.
* El `MainLayout` ya provee el contenedor con `padding` para el contenido — no agregar padding extra al `<Outlet>`.
* Usar `gap` en lugar de `margin` entre elementos hermanos siempre que sea posible.
* Sidebar tiene ancho fijo de **240px** (expandido) y **72px** (colapsado). El contenido se ajusta con `transition` en `margin-left`.

---

## 12. Reglas de Estilo CSS

* **Inline styles** son la norma para componentes del UIKit y componentes reutilizables (están en JSX inline).
* **Tema y Dark Mode**: Utiliza siempre variables CSS del tema (`var(--background)`, `var(--foreground)`, `var(--card)`, `var(--border)`, `var(--arco-primary)`) en lugar de colores hexadecimales fijos en los inline styles. Esto garantiza la compatibilidad automática con el modo oscuro. Llama a `useTheme()` al inicio de los componentes principales para reaccionar a los cambios de tema.
* **CSS files** (`theme.css`, `globals.css`) solo para tokens globales y reset.
* **NO crear clases CSS por componente** a menos que el componente sea verdaderamente global.
* **Border-radius estándar**: `8px` para inputs, `10px` para botones y dropdowns, `12px` para cards, `14px` para form sections, `16px` para DataTable.
* **Font sizes**: `11px` (labels uppercase), `13px` (texto body / celdas), `14px` (inputs / subtítulos), `16px` (títulos de sección), `18px` (títulos de página).
* **Font weights**: `400` (normal), `500` (medium), `600` (semibold).

---

## 13. Reglas de Código TypeScript/React

### Generales

* Usa **function declarations** (`export function MyComponent()`) en lugar de `const MyComponent = () =>` para componentes.
* Exporta tipos e interfaces junto al componente. No crear archivos `.d.ts` para tipos de props.
* Usa **genéricos** (`<T>`) cuando el componente maneja datos dinámicos (ver `DataTable<T>`).
* **Tipado de DataTable**: Los tipos/modelos de datos genéricos pasados a `DataTable<T>` deben definirse utilizando alias de tipo (`type`) en lugar de interfaces (`interface`) para satisfacer la restricción `Record<string, unknown>` (las interfaces carecen de firma de índice implícita en TypeScript).
* **Sub-módulos complejos**: Se agrupan en subcarpetas dentro de `components/` de un feature. Deben tener la siguiente estructura limpia y anidada (ej: `odontograma` o `expediente`):
  ```text
  src/features/<modulo>/components/<sub-modulo-complejo>/
  ├── components/           # Vistas/componentes internos (ej. OdontogramaScreen.tsx)
  ├── services/             # Servicios específicos del sub-módulo (opcional)
  ├── types/                # Tipos específicos del sub-módulo (opcional)
  └── index.ts              # Barrel export (export * from './components/...')
  ```
* Cada feature debe tener su barrel export `index.ts`.

### Imports

```tsx
// 1. React y librerías de terceros
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Trash2 } from 'lucide-react';

// 2. Componentes reutilizables (desde barrel)
import { DataTable, ConfirmModal, FormSection } from '../components';

// 3. UIKit / Contextos
import { Button, Input, Select, Card } from '../context';

// 4. Servicios, hooks, utils
import { api } from '../services/api';
import { formatCurrency } from '../utils/formatters';

// 5. Tipos locales del feature
import type { Patient } from '../types';
```

### Iconos

* Usa **`lucide-react`** para todos los iconos.
* Tamaño estándar: `size={16}` para botones, `size={18}` para secciones, `size={20}` para headers.

### Estado y Datos

* Estado local: `useState` para estado de UI (modals, filtros, búsqueda).
* Datos derivados: `useMemo` para filtrado/paginación pesada.
* Persistencia local: `useLocalStorage` hook para datos que deben sobrevivir a refresh.
* Tema global: `ThemeProvider` + `useTheme()`.

---

## Resumen de Imports Rápidos

```tsx
// Componentes de tabla, modal y formulario
import { DataTable, ConfirmModal, FormSection, FullWidthField } from '../components';

// Primitivos de UI (inputs, botones, cards, alerts)
import { Button, Input, Select, Card, Alert, Toggle, Avatar, StatusBadge, FieldBadge, SectionBlock, PasswordInput, Combobox } from '../context';

// Navegación
import { useNavigate, useLocation } from 'react-router-dom';

// Iconos
import { Plus, Eye, Trash2, Search, Edit2 } from 'lucide-react';

// API
import { api } from '../services/api';

// Utilidades
import { formatCurrency, formatDate, formatIdentity } from '../utils/formatters';

// Hooks
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../context';
```

---

> **Referencia visual del design system**: Navega a `/design` en la app para ver todos los componentes renderizados.
