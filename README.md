# Rutas - Optimizador de Entregas

PWA para optimizar rutas de reparto en El Pedregal, Arequipa. Permite a los conductores planificar y ejecutar entregas de forma eficiente.

## Funcionalidades

- **Gestion de clientes**: CRUD con fotos, ubicacion en mapa, busqueda y paginacion
- **Optimizacion de rutas**: Algoritmo TSP (nearest-neighbor + 2-opt) para encontrar el mejor orden de visitas
- **GPS integrado**: La ruta inicia desde la ubicacion actual del conductor
- **Ejecucion de reparto**: Marcar cada parada como "Entregado" o "No entregado", con alerta de proximidad GPS
- **Reordenamiento**: Cambiar el orden de paradas durante el reparto
- **Reporte CSV**: Descargar resumen del reparto al finalizar
- **Modo offline**: La ruta activa se guarda en localStorage, fotos y tiles se cachean para funcionar sin senal
- **PWA instalable**: Se instala como app nativa en Android/iOS

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Mapas**: Leaflet + React-Leaflet con tiles CartoDB Positron
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: OSRM (gratuito) con fallback a Google Directions (opcional)
- **Build**: Vite 6 + vite-plugin-pwa
- **Deploy**: Vercel (free tier)

## Desarrollo

```bash
npm install
npm run dev
```

La app corre en `http://localhost:5173`.

## Variables de entorno

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key

# Opcional: Google Directions como fallback cuando OSRM no responde
VITE_GOOGLE_MAPS_KEY=tu_google_api_key
```

## Build y deploy

```bash
npm run build
```

En Vercel, configurar las variables de entorno en Settings > Environment Variables.

## Estructura del proyecto

```
src/
  components/
    clients/     # ClientList, ClientCard, ClientForm, PhotoCapture
    map/         # MapView, LocationPicker, mapIcons
    routes/      # RouteBuilder, RoutePreview, RouteSummary
    layout/      # AppShell, BottomNav, ProtectedRoute
  hooks/         # useClients, useRoutes, useGeolocation, useAuth, useOffline
  lib/           # tsp.ts, routing.ts, osrm.ts, supabase.ts
  pages/         # ClientsPage, MapPage, RoutePage, AdminPage, LoginPage
  types/         # TypeScript interfaces
  utils/         # constants.ts, formatters.ts
```
