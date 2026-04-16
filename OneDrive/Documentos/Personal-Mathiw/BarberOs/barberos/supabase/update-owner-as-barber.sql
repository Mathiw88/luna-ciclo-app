-- Actualizar el perfil del dueño para que también sea barbero
-- El dueño trabaja como barbero con comisión 100% y color amarillo distintivo

UPDATE profiles
SET
  commission_pct = 100,
  color = 'yellow',
  initials = 'MR'
WHERE role = 'owner'
  AND barbershop_id = 'a0000000-0000-0000-0000-000000000001';

-- Verificar el cambio
SELECT id, name, role, commission_pct, color, initials
FROM profiles
WHERE barbershop_id = 'a0000000-0000-0000-0000-000000000001'
ORDER BY role DESC, name;
