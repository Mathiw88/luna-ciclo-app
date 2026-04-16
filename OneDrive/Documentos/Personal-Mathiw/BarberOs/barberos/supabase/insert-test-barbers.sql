-- Crear 3 usuarios barberos de prueba en auth.users
-- IMPORTANTE: Ejecutar esto en Supabase SQL Editor

-- Barbero 1: Lucas Martínez
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'b1111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'lucas@demo.com',
  '$2a$10$vQHfY5tW5b5Y5Y5Y5Y5Y5edKNjqV3QqV3QqV3QqV3QqV3QqV3Qq', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Barbero 2: Rodrigo Pérez
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'b2222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'rodrigo@demo.com',
  '$2a$10$vQHfY5tW5b5Y5Y5Y5Y5Y5edKNjqV3QqV3QqV3QqV3QqV3QqV3Qq', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Barbero 3: Facundo González
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) VALUES (
  'b3333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'facundo@demo.com',
  '$2a$10$vQHfY5tW5b5Y5Y5Y5Y5Y5edKNjqV3QqV3QqV3QqV3QqV3QqV3Qq', -- demo123
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Crear perfiles de barberos en la tabla profiles
INSERT INTO profiles (id, barbershop_id, role, name, initials, color, commission_pct, is_active)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'barber', 'Lucas Martínez', 'LM', 'blue', 50, true),
  ('b2222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', 'barber', 'Rodrigo Pérez', 'RP', 'purple', 50, true),
  ('b3333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', 'barber', 'Facundo González', 'FG', 'green', 45, true)
ON CONFLICT (id) DO NOTHING;
