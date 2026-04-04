# Mejoras futuras para Rutas

## 1. Persistencia de rutas y visitas en Supabase

Crear las tablas `routes` y `visits` para:
- Guardar historial de rutas realizadas (fecha, distancia, tiempo)
- Registrar cada visita con timestamp
- Alimentar el algoritmo de "Sugerir clientes" que prioriza los que llevan mas tiempo sin visitar

### SQL para crear las tablas

```sql
-- Tabla de rutas
CREATE TABLE IF NOT EXISTS routes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date DEFAULT CURRENT_DATE,
  driver_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  total_distance_km numeric,
  total_time_min integer,
  optimized_order text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Tabla de visitas (cada parada de una ruta)
CREATE TABLE IF NOT EXISTS visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id uuid REFERENCES routes(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id),
  stop_order integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  visited_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS (Row Level Security)
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their routes" ON routes
  FOR ALL USING (auth.uid() = driver_id OR auth.uid() = created_by);

CREATE POLICY "Users can manage visits of their routes" ON visits
  FOR ALL USING (
    route_id IN (SELECT id FROM routes WHERE driver_id = auth.uid() OR created_by = auth.uid())
  );
```

## 2. Sugerir clientes (requiere tabla visits)

El boton "Sugerir clientes" usa `useLastVisits` para calcular urgencia por cliente.
El codigo ya existe en `src/lib/clustering.ts` (`calcUrgency`, `selectClientsForToday`).
Solo hay que:
1. Crear las tablas de arriba
2. Restaurar el import de `useLastVisits` y `calcUrgency` en RouteBuilder
3. Re-agregar el boton "Sugerir clientes" con `handleAutoSelect`

## 3. Vista admin en tiempo real

Panel donde el admin ve las paradas completadas del conductor actualizandose en vivo.
Requiere Supabase Realtime (suscripcion a cambios en tabla `visits`).

## 4. Navegacion GPS turn-by-turn

Al tocar un cliente en la ruta, abrir Google Maps o Waze con direcciones paso a paso:
```
https://www.google.com/maps/dir/?api=1&destination={lat},{lng}&travelmode=driving
```
