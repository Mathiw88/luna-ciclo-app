-- Políticas RLS para appointments

-- Primero habilitar RLS si no está habilitado
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Owners can manage appointments" ON appointments;
DROP POLICY IF EXISTS "Barbers can view their appointments" ON appointments;
DROP POLICY IF EXISTS "Public can insert appointments" ON appointments;

-- Owner puede ver/crear/editar appointments de su barbería
CREATE POLICY "Owners can manage appointments"
  ON appointments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.barbershop_id = appointments.barbershop_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.barbershop_id = appointments.barbershop_id
    )
  );

-- Barbero puede ver solo sus propios appointments
CREATE POLICY "Barbers can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (barber_id = auth.uid());

-- Público puede crear appointments (para página de reservas)
CREATE POLICY "Public can insert appointments"
  ON appointments
  FOR INSERT
  TO anon
  WITH CHECK (true);
