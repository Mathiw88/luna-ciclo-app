-- Políticas RLS para la tabla payouts

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Owners can manage payouts" ON payouts;
DROP POLICY IF EXISTS "Barbers can view their payouts" ON payouts;

-- Política para que owners puedan crear/ver payouts de su barbería
CREATE POLICY "Owners can manage payouts"
  ON payouts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.barbershop_id = (
        SELECT barbershop_id FROM profiles WHERE id = payouts.barber_id
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
      AND profiles.barbershop_id = (
        SELECT barbershop_id FROM profiles WHERE id = payouts.barber_id
      )
    )
  );

-- Política para que barberos puedan ver solo sus propias liquidaciones
CREATE POLICY "Barbers can view their payouts"
  ON payouts
  FOR SELECT
  TO authenticated
  USING (barber_id = auth.uid());
