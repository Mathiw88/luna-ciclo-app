-- Insertar appointments de prueba para HOY (usando CURRENT_DATE)
-- Esto permitirá ver horarios ocupados y libres

-- IMPORTANTE: Primero eliminar appointments viejos de fechas pasadas
DELETE FROM appointments
WHERE barbershop_id = 'a0000000-0000-0000-0000-000000000001'
AND appointment_date < CURRENT_DATE;

-- Eliminar appointments de hoy para evitar duplicados
DELETE FROM appointments
WHERE barbershop_id = 'a0000000-0000-0000-0000-000000000001'
AND appointment_date = CURRENT_DATE;

-- Insertar turnos para HOY usando CURRENT_DATE
INSERT INTO appointments (barbershop_id, barber_id, appointment_date, appointment_time, status, is_walkin, client_name, price)
VALUES
  -- Lucas Martínez (e8e26a1f-e585-49a3-8320-66c9dd0b7e7a)
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', CURRENT_DATE, '09:00', 'done', false, 'Nicolás Fernández', 600),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', CURRENT_DATE, '10:30', 'done', false, 'Mateo Álvarez', 500),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', CURRENT_DATE, '12:00', 'done', false, 'Ezequiel Mora', 600),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', CURRENT_DATE, '14:00', 'confirmed', false, 'Sebastián Torres', NULL),
  ('a0000000-0000-0000-0000-000000000001', 'e8e26a1f-e585-49a3-8320-66c9dd0b7e7a', CURRENT_DATE, '16:00', 'pending', false, 'Ignacio Blanco', NULL),

  -- Rodrigo Pérez (d1cddae3-749a-4824-9e5d-81d473bd4fe8)
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe8', CURRENT_DATE, '09:00', 'done', false, 'Diego Suárez', 500),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe8', CURRENT_DATE, '11:00', 'done', true, 'Cliente walk-in', 450),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe8', CURRENT_DATE, '12:00', 'done', false, 'Camilo Sosa', 500),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe8', CURRENT_DATE, '14:00', 'confirmed', false, 'Marcos Benítez', NULL),
  ('a0000000-0000-0000-0000-000000000001', 'd1cddae3-749a-4824-9e5d-81d473bd4fe8', CURRENT_DATE, '15:00', 'pending', false, 'Camilo Pereyra', NULL),

  -- Facundo González (e1185984-5d75-44a3-a955-978ad1e25992)
  ('a0000000-0000-0000-0000-000000000001', 'e1185984-5d75-44a3-a955-978ad1e25992', CURRENT_DATE, '09:00', 'done', false, 'Hernán Vega', 450),
  ('a0000000-0000-0000-0000-000000000001', 'e1185984-5d75-44a3-a955-978ad1e25992', CURRENT_DATE, '10:00', 'done', false, 'Tomás Ríos', 550),
  ('a0000000-0000-0000-0000-000000000001', 'e1185984-5d75-44a3-a955-978ad1e25992', CURRENT_DATE, '15:00', 'pending', false, 'Andrés Méndez', NULL);

-- Verificar los turnos creados
SELECT
  client_name,
  appointment_date,
  appointment_time,
  status,
  price
FROM appointments
WHERE barbershop_id = 'a0000000-0000-0000-0000-000000000001'
AND appointment_date = CURRENT_DATE
ORDER BY appointment_time;
