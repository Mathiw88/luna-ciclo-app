-- Insertar appointments para HOY (fecha real del sistema)
-- Esto usa CURRENT_DATE en vez de hardcodear la fecha

-- Primero eliminar appointments antiguos si quieres empezar limpio
-- DELETE FROM appointments WHERE appointment_date < CURRENT_DATE;

-- Insertar appointments para HOY usando CURRENT_DATE
INSERT INTO appointments (barbershop_id, barber_id, client_id, client_name, appointment_date, appointment_time, status, is_walkin)
VALUES
  -- Lucas Martínez (e8e26a1f-e585-49a3-8320-66c9dd0b7e7a)
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', NULL, 'Nicolás Fernández', CURRENT_DATE, '09:00', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', NULL, 'Mateo Álvarez', CURRENT_DATE, '10:30', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', NULL, 'Ezequiel Mora', CURRENT_DATE, '12:00', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', NULL, 'Sebastián Torres', CURRENT_DATE, '14:00', 'confirmed', false),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', NULL, 'Ignacio Blanco', CURRENT_DATE, '16:00', 'pending', false),

  -- Rodrigo Pérez (d1cddae3-749a-4824-9e5d-81d473bd4fe0)
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe0', NULL, 'Diego Suárez', CURRENT_DATE, '09:00', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe0', NULL, 'Cliente walk-in', CURRENT_DATE, '11:00', 'walkin', true),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe0', NULL, 'Camilo Sosa', CURRENT_DATE, '12:00', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe0', NULL, 'Marcos Benítez', CURRENT_DATE, '14:00', 'confirmed', false),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe0', NULL, 'Camilo Pereyra', CURRENT_DATE, '15:00', 'pending', false),

  -- Facundo González (e1185984-5d75-44a3-a955-978ad1e25992)
  ('a0000000-0000-0000-0000-000000000001', 'e1185984-5d75-44a3-a955-978ad1e25992', NULL, 'Hernán Vega', CURRENT_DATE, '09:00', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'e1185984-5d75-44a3-a955-978ad1e25992', NULL, 'Tomás Ríos', CURRENT_DATE, '10:00', 'done', false),
  ('a0000000-0000-0000-0000-000000000001', 'e1185984-5d75-44a3-a955-978ad1e25992', NULL, 'Andrés Méndez', CURRENT_DATE, '15:00', 'pending', false);

-- Verificar que se insertaron correctamente
SELECT barber_id, appointment_date, appointment_time, status
FROM appointments
WHERE appointment_date = CURRENT_DATE
ORDER BY appointment_time;
