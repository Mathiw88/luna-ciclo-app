-- Políticas RLS para income_records

DROP POLICY IF EXISTS "Owners can manage income records" ON income_records;
DROP POLICY IF EXISTS "Barbers can view their income records" ON income_records;

-- Owner puede ver/crear income_records de su barbería
CREATE POLICY "Owners can manage income records"
  ON income_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.barbershop_id = income_records.barbershop_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.barbershop_id = income_records.barbershop_id
    )
  );

-- Barbero puede ver solo sus propios income_records
CREATE POLICY "Barbers can view their income records"
  ON income_records
  FOR SELECT
  TO authenticated
  USING (barber_id = auth.uid());
