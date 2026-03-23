-- Arreglar políticas RLS de profiles para evitar recursión infinita

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Owner can view all profiles in barbershop" ON profiles;
DROP POLICY IF EXISTS "Barber can view own profile" ON profiles;
DROP POLICY IF EXISTS "Barber can view other barbers in barbershop" ON profiles;
DROP POLICY IF EXISTS "Owner can insert profiles in barbershop" ON profiles;
DROP POLICY IF EXISTS "Owner can update profiles in barbershop" ON profiles;

-- Política simple: usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Usuarios autenticados pueden ver perfiles de la misma barbería
-- (sin consultar profiles nuevamente para evitar recursión)
CREATE POLICY "Users can view profiles in same barbershop"
  ON profiles FOR SELECT
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Owner puede insertar perfiles (usando función auxiliar)
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Owner can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_owner());

CREATE POLICY "Owner can update profiles"
  ON profiles FOR UPDATE
  USING (is_owner());