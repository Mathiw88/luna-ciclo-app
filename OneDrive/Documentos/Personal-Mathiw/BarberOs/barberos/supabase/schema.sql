-- BarberOS Database Schema
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- 1. Barberías
CREATE TABLE barbershops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Perfiles de usuarios (owner + barberos)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'barber')),
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  commission_pct INTEGER DEFAULT 50 CHECK (commission_pct >= 0 AND commission_pct <= 100),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Clientes
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(barbershop_id, email)
);

-- 4. Turnos
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'done', 'cancelled', 'walkin')),
  is_walkin BOOLEAN DEFAULT false,
  price INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Registros de ingresos (para liquidaciones)
CREATE TABLE income_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  barber_amount INTEGER NOT NULL,
  shop_amount INTEGER NOT NULL,
  commission_pct INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Adelantos
CREATE TABLE advances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  note TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Liquidaciones
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  barbershop_id UUID REFERENCES barbershops(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  gross_amount INTEGER NOT NULL,
  advances_amount INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_profiles_barbershop ON profiles(barbershop_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_clients_barbershop ON clients(barbershop_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_appointments_barbershop ON appointments(barbershop_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_income_barbershop ON income_records(barbershop_id);
CREATE INDEX idx_income_barber ON income_records(barber_id);
CREATE INDEX idx_income_date ON income_records(date);
CREATE INDEX idx_advances_barber ON advances(barber_id);
CREATE INDEX idx_payouts_barber ON payouts(barber_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS PARA BARBERSHOPS
-- ============================================

-- Owner puede ver su barbería
CREATE POLICY "Owner can view own barbershop"
  ON barbershops FOR SELECT
  USING (
    id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber puede ver su barbería
CREATE POLICY "Barber can view own barbershop"
  ON barbershops FOR SELECT
  USING (
    id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'barber'
    )
  );

-- Público puede ver barberías (para página de reservas)
CREATE POLICY "Public can view barbershops"
  ON barbershops FOR SELECT
  USING (true);

-- Owner puede actualizar su barbería
CREATE POLICY "Owner can update own barbershop"
  ON barbershops FOR UPDATE
  USING (
    id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLÍTICAS PARA PROFILES
-- ============================================

-- Owner puede ver todos los perfiles de su barbería
CREATE POLICY "Owner can view all profiles in barbershop"
  ON profiles FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber puede ver su propio perfil
CREATE POLICY "Barber can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Barber puede ver otros barberos de su barbería
CREATE POLICY "Barber can view other barbers in barbershop"
  ON profiles FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'barber'
    )
  );

-- Owner puede insertar perfiles en su barbería
CREATE POLICY "Owner can insert profiles in barbershop"
  ON profiles FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owner puede actualizar perfiles en su barbería
CREATE POLICY "Owner can update profiles in barbershop"
  ON profiles FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLÍTICAS PARA CLIENTS
-- ============================================

-- Owner puede ver todos los clientes
CREATE POLICY "Owner can view all clients"
  ON clients FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber puede ver clientes de su barbería
CREATE POLICY "Barber can view clients in barbershop"
  ON clients FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'barber'
    )
  );

-- Público puede crear clientes (para reservas)
CREATE POLICY "Public can insert clients"
  ON clients FOR INSERT
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS PARA APPOINTMENTS
-- ============================================

-- Owner puede ver todos los turnos
CREATE POLICY "Owner can view all appointments"
  ON appointments FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber solo ve sus propios turnos
CREATE POLICY "Barber can view own appointments"
  ON appointments FOR SELECT
  USING (barber_id = auth.uid());

-- Público puede crear turnos (para reservas)
CREATE POLICY "Public can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (true);

-- Owner puede actualizar turnos
CREATE POLICY "Owner can update appointments"
  ON appointments FOR UPDATE
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owner puede insertar turnos (walk-in)
CREATE POLICY "Owner can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLÍTICAS PARA INCOME_RECORDS
-- ============================================

-- Owner puede ver todos los ingresos
CREATE POLICY "Owner can view all income records"
  ON income_records FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber solo ve sus propios ingresos
CREATE POLICY "Barber can view own income records"
  ON income_records FOR SELECT
  USING (barber_id = auth.uid());

-- Owner puede insertar ingresos
CREATE POLICY "Owner can insert income records"
  ON income_records FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLÍTICAS PARA ADVANCES
-- ============================================

-- Owner puede ver todos los adelantos
CREATE POLICY "Owner can view all advances"
  ON advances FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber solo ve sus propios adelantos
CREATE POLICY "Barber can view own advances"
  ON advances FOR SELECT
  USING (barber_id = auth.uid());

-- Owner puede insertar adelantos
CREATE POLICY "Owner can insert advances"
  ON advances FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- POLÍTICAS PARA PAYOUTS
-- ============================================

-- Owner puede ver todas las liquidaciones
CREATE POLICY "Owner can view all payouts"
  ON payouts FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Barber solo ve sus propias liquidaciones
CREATE POLICY "Barber can view own payouts"
  ON payouts FOR SELECT
  USING (barber_id = auth.uid());

-- Owner puede insertar liquidaciones
CREATE POLICY "Owner can insert payouts"
  ON payouts FOR INSERT
  WITH CHECK (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_barbershops_updated_at
  BEFORE UPDATE ON barbershops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS DE EJEMPLO (DEMO)
-- ============================================

-- Barbería de demo
INSERT INTO barbershops (id, name, slug, address, city, phone, whatsapp, email)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Barbería Central',
  'barberia-central',
  'Av. 18 de Julio 1234',
  'Montevideo',
  '+598 91 234 567',
  '+598 91 234 567',
  'contacto@barberiacentral.uy'
);

-- NOTA: Los usuarios demo (owner y barber) deben crearse desde Supabase Auth
-- y luego insertar en profiles manualmente con sus UUIDs reales
