# Frontend — WebArco Dental Studio

Este directorio contiene la interfaz web del sistema WebArco Dental Studio. Está construido con React 19 + TypeScript + Vite y está pensado para administrar la operación clínica: agenda, pacientes, odontograma, facturación y otras vistas de gestión.

## Resumen del frontend

### Qué lleva
- React 19 + TypeScript
- Vite como herramienta de desarrollo y build
- React Router para navegación por pestañas y rutas
- Axios para consumo de la API del backend
- Zustand para estado ligero
- Lucide React para iconografía
- Un kit de interfaz propio en `src/context/UIKit.tsx`

### Qué tiene actualmente
- Dashboard principal
- Agenda / citas
- Módulo de pacientes
- Odontograma de paciente
- Consentimientos
- Gestión de ingresos / caja
- Pantallas de inventario, estadísticas y configuración
- Diseño / UI Kit de referencia

### Cómo está compuesto
- `src/main.tsx`: punto de entrada, inicializa `ThemeProvider` y `BrowserRouter`
- `src/App.tsx`: definición de rutas principales del sistema
- `src/page layouts/MainLayout.tsx`: layout base con sidebar, top bar y `Outlet`
- `src/components/`: componentes globales reutilizables
- `src/context/`: tema, UIKit y pantallas de diseño
- `src/features/`: módulos de negocio (appointments, billing, patients, auth, settings, etc.)
- `src/services/api.ts`: instancia central de Axios con interceptores de token y respuesta

## Estructura principal

```text
src/
├── App.tsx
├── main.tsx
├── components/          # Sidebar, TopBar, DataTable, ConfirmModal, etc.
├── context/             # ThemeProvider, UIKit, DesignSystemScreen
├── features/            # Módulos por dominio de negocio
├── hooks/               # Hooks reutilizables
├── page layouts/        # Layout principal y dashboard
├── services/            # Axios y conexión con backend
├── styles/              # Estilos globales y tokens
└── utils/               # Helpers y formatters
```

## Cómo ejecutar el frontend

Desde esta carpeta:

```bash
npm install
npm run dev
```

La app queda disponible normalmente en:

```text
http://localhost:5173
```

## Cómo compilar

```bash
npm run build
```

## Cómo editarlo

1. Crear o modificar una pantalla en `src/features/<modulo>/components/`.
2. Si la pantalla necesita rutas, registrarla en `src/App.tsx`.
3. Si debe aparecer en el menú principal, actualizar `src/components/Sidebar.tsx` y el mapa de rutas de `src/page layouts/MainLayout.tsx`.
4. Usar `src/services/api.ts` para consumir el backend con el formato `{ success, data, message }`.
5. Seguir las convenciones de diseño y arquitectura descritas en `guidelines/Guidelines.md`.

## Reglas importantes para nuevas pantallas

- Usar `src/features/<modulo>/components/NuevaPantalla.tsx` para nuevas vistas.
- Mantener la navegación real con rutas (`react-router-dom`).
- Reutilizar los componentes del UIKit en `src/context/UIKit.tsx`.
- Evitar colores arbitrarios; usar la paleta definida en la guía.
- Preferir `DataTable`, `ConfirmModal`, `FormSection` y `Button` cuando corresponda.

## Archivos clave para tocar

- `src/App.tsx` → rutas principales
- `src/page layouts/MainLayout.tsx` → layout, título, breadcrumbs y menú
- `src/components/Sidebar.tsx` → navegación lateral
- `src/services/api.ts` → conexión con el backend
- `src/context/UIKit.tsx` → componentes visuales reutilizables
- `guidelines/Guidelines.md` → reglas de desarrollo del frontend

## Nota de entorno

El proyecto compila correctamente con la configuración actual. Puedes validar cambios con:

```bash
npm run build
```
