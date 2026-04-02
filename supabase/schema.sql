-- =====================
-- PROFILES
-- =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'driver')),
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'driver')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- CLIENTS
-- =====================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  zone TEXT,
  visit_frequency_days INT NOT NULL DEFAULT 7,
  photo_url TEXT,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients readable by authenticated" ON clients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update clients" ON clients
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated delete clients" ON clients
  FOR DELETE TO authenticated USING (true);

CREATE INDEX idx_clients_zone ON clients(zone);
CREATE INDEX idx_clients_active ON clients(active) WHERE active = true;

-- =====================
-- ROUTES
-- =====================
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  total_distance_km DOUBLE PRECISION,
  total_time_min DOUBLE PRECISION,
  optimized_order UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Routes readable by authenticated" ON routes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins create routes" ON routes
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Driver or admin update routes" ON routes
  FOR UPDATE TO authenticated
  USING (
    driver_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =====================
-- VISITS
-- =====================
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  stop_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  visited_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visits readable by authenticated" ON visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert visits" ON visits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Driver or admin update visits" ON visits
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = visits.route_id
      AND (r.driver_id = auth.uid() OR
           EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE INDEX idx_visits_route ON visits(route_id);
CREATE INDEX idx_visits_client ON visits(client_id);
CREATE INDEX idx_visits_visited_at ON visits(visited_at);

-- =====================
-- STORAGE: crear bucket "client-photos" desde el dashboard de Supabase
-- Public: true, File size limit: 500KB, MIME: image/jpeg, image/png, image/webp
-- =====================
