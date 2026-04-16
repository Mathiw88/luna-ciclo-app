# BarberOS — Prompt completo para Claude Code

## Instrucción para Claude Code — Checklist de progreso

Este documento es el mapa completo del proyecto. A medida que avancés, **actualizá este archivo** marcando cada ítem con su estado:

| Símbolo | Significado |
|---|---|
| ✅ | Completado y funcionando |
| 🔄 | En proceso / trabajo en curso |
| ⬜ | Pendiente / no iniciado |
| 🔮 | A futuro — no implementar ahora |

**Regla:** cada vez que terminés una tarea cambiá su símbolo. Nunca borrés ítems — el historial sirve para saber qué se hizo y qué falta.

---

## Contexto del proyecto

Quiero que construyas **BarberOS**, un SaaS de gestión para barberías. El sistema tiene dos partes: un panel de administración interno (dueño y barberos) y una página pública de reservas para clientes.

El diseño ya está definido: **tema oscuro** (`#111` de fondo), **acento amarillo** (`#f5c542`), tipografía limpia, sin gradientes.

---

## Stack tecnológico

- **Framework:** Next.js 14 con App Router y TypeScript
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth con roles
- **Estilos:** Tailwind CSS + shadcn/ui
- **Email:** Resend + React Email
- **Deploy:** Vercel
- **Monitoreo de errores:** Sentry (instalar en Fase 1 desde el arranque)
- **Fuente:** Inter (Google Fonts)

> **No usar Prisma** — el cliente nativo de Supabase (`@supabase/supabase-js`) ya es type-safe y está integrado con RLS. Prisma bypasea el RLS y agrega fricción innecesaria. Usar siempre `supabase gen types typescript` para los tipos.

---

## Estructura de roles

| Rol | Acceso |
|---|---|
| `owner` | Todo el panel: dashboard, finanzas, agenda, barberos, locales, configuración |
| `barber` | Solo su agenda del día y sus ganancias personales |
| `client` | Solo la página pública de reservas (sin login) |

---

## Base de datos — Tablas Supabase

```sql
-- Empresa / marca (nivel superior)
create table barbershops (
  id uuid primary key default gen_random_uuid(),
  name text not null,              -- nombre comercial: "Barbería El Clásico"
  logo_url text,                   -- logo opcional
  city text,
  country text default 'UY',
  plan text check (plan in ('basic', 'pro', 'premium')) default 'basic',
  active boolean default true,
  trial_ends_at timestamptz,
  created_at timestamptz default now()
);

-- Locales físicos (uno o más por empresa)
create table locations (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id),
  name text not null,              -- "Sucursal Centro", "Local Pocitos"
  address text,
  city text,
  phone text,
  slug text unique not null,       -- URL: /reservas/el-clasico/sucursal-centro
  active boolean default true,
  created_at timestamptz default now()
);

-- Perfiles de usuario (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  barbershop_id uuid references barbershops(id),
  full_name text,
  role text check (role in ('owner', 'barber')),
  commission_pct integer default 50,
  active boolean default true,
  created_at timestamptz default now()
);

-- Tabla puente: qué barberos trabajan en qué locales
-- Un barbero puede estar en uno o varios locales
-- Si la barbería tiene un solo local, igual se crea el registro
create table barber_locations (
  barber_id uuid references profiles(id),
  location_id uuid references locations(id),
  commission_pct integer,          -- comisión puede variar por local (opcional)
  primary key (barber_id, location_id)
);

-- Clientes
create table clients (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id),
  full_name text not null,
  phone text,
  email text,
  created_at timestamptz default now()
);

-- Turnos (por local)
create table appointments (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id),
  barber_id uuid references profiles(id),
  client_id uuid references clients(id),
  scheduled_at timestamptz not null,
  status text check (status in ('pending', 'confirmed', 'done', 'cancelled', 'walkin')) default 'pending',
  price integer,
  notes text,
  is_walkin boolean default false,
  created_at timestamptz default now()
);

-- Ingresos (por local)
create table income_records (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id),
  appointment_id uuid references appointments(id),
  barber_id uuid references profiles(id),
  amount integer not null,
  barber_amount integer not null,
  shop_amount integer not null,
  recorded_at timestamptz default now()
);

-- Adelantos (por local)
create table advances (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id),
  barber_id uuid references profiles(id),
  amount integer not null,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Liquidaciones (por local)
create table payouts (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id),
  barber_id uuid references profiles(id),
  period_from timestamptz not null,
  period_to timestamptz not null,
  gross_amount integer not null,
  advances_total integer not null default 0,
  net_amount integer not null,
  note text,
  paid_by uuid references profiles(id),
  paid_at timestamptz default now()
);
```

### Lógica de locales
- Toda barbería empieza con **un solo local** creado automáticamente al registrarse
- El dueño puede agregar más locales desde Configuración cuando lo necesite
- Si solo tiene un local, la UI no muestra el selector de local (se oculta automáticamente)
- Todas las tablas operativas usan `location_id` — las finanzas son completamente independientes por local

### Row Level Security (RLS)
- `owner` ve y edita todo dentro de su `barbershop_id` (todos sus locales)
- `barber` solo ve sus propios appointments, income_records, advances y payouts, en los locales donde está asignado
- La tabla `appointments` es pública para INSERT desde la página de reservas (sin auth)
- Solo `owner` puede INSERT en `advances`, `payouts` y `locations`
- Solo `owner` puede modificar `barber_locations`

---

## Checklist de implementación

### ✅ Fase 1 — Base del proyecto
- ✅ Setup Next.js 14 + TypeScript + Tailwind + shadcn/ui
- ✅ Configurar Supabase: crear proyecto, tablas y RLS
- ✅ Configurar variables de entorno
- ✅ Layout base con sidebar (owner y barber)
- ✅ Página de login con redirección por rol
- ✅ Middleware de autenticación y protección de rutas

### ✅ Fase 2 — Panel del dueño
- ✅ Dashboard con métricas, tabs de período y selector de local
- ✅ Agenda en columnas con filtro por barbero
- ✅ Modal de ingreso por llegada con cálculo en tiempo real
- ✅ Módulo de finanzas con gráfico de barras (por local o consolidado)
- ✅ Página de barberos / personal con tabla comparativa

### ⬜ Fase 3 — Gestión de locales y asignación de barberos
- ⬜ Sección de locales en Configuración (lista de locales, agregar nuevo)
- ⬜ Formulario de nuevo local (nombre, dirección, teléfono, slug)
- ⬜ Toggles en card de barbero para asignar/desasignar locales
- ⬜ Ocultar selector de local cuando solo hay uno
- ⬜ Nombre empresa + local en header, emails y documentos

### ✅ Fase 4 — Adelantos y liquidaciones
- ✅ Página de saldos por barbero (`/finanzas/barberos`)
- ✅ Modal de registro de adelanto con validación de saldo
- ✅ Modal de liquidación con checkbox de confirmación física
- ✅ Badge PAGADO + fecha y hora del último pago en la card
- ✅ Historial de liquidaciones con check verde por fila

### ✅ Fase 5 — Vista del barbero
- ✅ Mi dashboard con card de saldo (ganado − adelantos = a cobrar)
- ✅ Mi agenda del día
- ✅ Modal de registrar corte
- ✅ Mis adelantos (solo consulta)
- ✅ Mis finanzas e historial

### 🔄 Fase 6 — Reservas públicas y email
- ✅ Página pública `/reservas/[slug]` — si empresa tiene 1 local, empieza en paso "Barbero"
- ⬜ Página pública `/reservas/[slug]/[location-slug]` — entra directo al local
- ⬜ Paso 1 (multi-local): selector de local con nombre, dirección y disponibilidad
- ✅ Stepper completo: Local (si aplica) → Barbero → Fecha → Horario → Tus datos → Confirmar
- ✅ Validación de email en tiempo real
- ✅ Pantalla de éxito post-confirmación
- ✅ Template de email con React Email (nombre empresa + local)
- ✅ Envío de confirmación con Resend

### 🔄 Fase 7 — Configuración y ajustes
- ✅ Página de configuración: datos de empresa (nombre, logo)
- ⬜ Gestión de locales: ver, agregar, editar, activar/desactivar
- ✅ Edición de perfil de barbero (nombre, comisión global, estado)
- ✅ Historial de cortes con filtros por local y barbero

### 🔮 Fase 8 — Multi-tenant (a futuro)
- 🔮 Página `/registro` para onboarding de nueva barbería
- 🔮 Rol `superadmin` con panel de gestión global
- 🔮 Lógica de planes: basic (1 local, 2 barberos) / pro (3 locales, 5 barberos) / premium (ilimitado)
- 🔮 Período de prueba de 14 días al registrarse
- 🔮 Panel de métricas globales para superadmin

---

## Páginas y rutas

```
✅ /                               → Redirige a /login
✅ /login                          → Login dueño y barbero
✅ /dashboard                      → Dashboard del dueño
✅ /finanzas                       → Finanzas por local o consolidado
✅ /finanzas/barberos              → Saldos, adelantos y liquidaciones
✅ /agenda                         → Agenda en columnas por barbero
✅ /ingreso-manual                 → Modal walk-in
✅ /barberos                       → Gestión de barberos + asignación de locales
✅ /historial                      → Historial de cortes
✅ /configuracion                  → Datos empresa + gestión de locales
✅ /mi-dashboard                   → Dashboard del barbero
✅ /mi-dashboard/adelantos         → Consulta de adelantos del barbero
✅ /reservas/[slug]                → Reservas (selector de local si hay más de uno)
⬜ /reservas/[slug]/[local-slug]   → Reservas directo a un local específico
🔮 /registro                       → Onboarding nueva barbería
🔮 /admin                          → Panel superadmin
```

---

## Pantallas — descripción detallada

### ✅ 1. Login (`/login`)
- Fondo oscuro `#111`, logo BarberOS a la izquierda
- Formulario: email + contraseña
- Botones demo: "Dueño (demo)" y "Barbero (demo)"
- Panel derecho con tarjetas de roles con check amarillo
- Login exitoso: `owner` → `/dashboard`, `barber` → `/mi-dashboard`
- Validación inline: borde rojo en campos vacíos

---

### ✅ 2. Layout del panel (sidebar)

**Owner:**
```
PRINCIPAL      → Dashboard, Finanzas
AGENDA         → Agenda (badge pendientes), Ingreso manual
GESTIÓN        → Barberos / Personal, Historial de cortes
SISTEMA        → Configuración
```

**Barbero:**
```
MI DÍA         → Mi dashboard (badge pendientes), Mi agenda
REGISTRO       → Registrar corte
MIS GANANCIAS  → Mis finanzas, Adelantos (badge), Historial
```

**Selector de local (solo si hay más de uno):**
Aparece debajo del logo en el sidebar. Dropdown con los locales de la empresa. Al cambiar, toda la data del panel se filtra por ese local. Si solo hay un local, este selector no se muestra.

- Ítem activo owner: fondo `#2a2200`, texto `#f5c542`
- Ítem activo barbero: fondo `#0d1f33`, texto `#5bb8f5`

---

### ✅ 3. Dashboard del dueño (`/dashboard`)

**Header del topbar muestra:** `[Nombre empresa] — [Nombre local activo]`
Ejemplo: `Barbería El Clásico — Sucursal Centro`

Si hay más de un local, aparece también un tab o selector para ver "Todos los locales" (vista consolidada).

Topbar: fecha, "Exportar" y "+ Ingreso por llegada". Tabs: Hoy · Esta semana · Este mes · Mes anterior · Mes siguiente. 4 métricas. Dos columnas: agenda de hoy + barberos activos.

**Estados de turno:**
| Estado | Color | Badge |
|---|---|---|
| `done` | `#4dd4a0` | LISTO |
| `confirmed` | `#f5c542` | PRÓXIMO |
| `pending` | `#444` | PENDIENTE |
| `walkin` | `#5bb8f5` | WALK-IN |

---

### ✅ 4. Finanzas (`/finanzas`)

Si hay más de un local: tabs para filtrar por local + opción "Consolidado" que suma todos.
Tabs de período. 4 métricas. Gráfico de barras por día. Tabla por barbero.

---

### ✅ 5. Agenda (`/agenda`)

Grilla en columnas por barbero. Filtro por chips. Navegación por día. Solo muestra barberos asignados al local activo.

---

### ✅ 6. Modal ingreso por llegada

Nombre cliente (opcional) + selector de barbero (solo los del local activo) + monto. Cálculo en tiempo real. Al confirmar: `appointment (is_walkin: true)` + `income_record`.

---

### ✅ 7. Barberos / Personal (`/barberos`)

**Card por barbero — con asignación de locales:**

```
┌──────────────────────────────────────────┐
│  LM  Lucas M.                            │
│      Desde enero 2024  ● activo          │
│                                          │
│  Stats del mes: 128 cortes · $37.200     │
│  Comisión global: 50%                    │
│                                          │
│  Locales asignados:                      │
│  ┌─────────────────────┬──────────────┐  │
│  │ ● Sucursal Centro   │   toggle ON  │  │
│  │ ● Local Pocitos     │   toggle ON  │  │
│  │ ○ Sucursal Malvín   │  toggle OFF  │  │
│  └─────────────────────┴──────────────┘  │
│                                          │
│  [ Editar ]        [ Ver historial ]     │
└──────────────────────────────────────────┘
```

- Cada toggle hace UPDATE inmediato en `barber_locations` (INSERT o DELETE)
- Si la barbería tiene un solo local, la sección "Locales asignados" no se muestra — el barbero queda asignado automáticamente
- El toggle es instantáneo, sin botón de guardar
- Si se desactiva un toggle, los turnos futuros del barbero en ese local no se cancelan — solo deja de aparecer en la agenda de ese local para nuevos turnos

Tabla comparativa al pie con totales por barbero.

---

### 🔄 8. Configuración (`/configuracion`)

**Sección: Datos de la empresa**
- Nombre comercial (aparece en todo el sistema, emails y documentos)
- Logo (opcional, aparece en emails y página de reservas)
- Ciudad / país

**Sección: Locales**

Lista de locales activos. Si solo hay uno, igual se muestra pero sin opción de eliminarlo.

```
┌──────────────────────────────────────────────┐
│ Sucursal Centro                    ● activo  │
│ Av. 18 de Julio 1234 · Montevideo            │
│ /reservas/el-clasico/centro                  │
│                          [ Editar ] [ Link ] │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ Local Pocitos                      ● activo  │
│ Av. Brasil 2800 · Montevideo                 │
│ /reservas/el-clasico/pocitos                 │
│                          [ Editar ] [ Link ] │
└──────────────────────────────────────────────┘

[ + Agregar nuevo local ]
```

**Formulario de nuevo local / editar local:**
- Nombre del local (ej: "Sucursal Centro")
- Dirección
- Teléfono
- Slug (se genera automático desde el nombre, editable)
- Activo / inactivo

Al crear un nuevo local, se muestra vacío en la agenda y sin barberos asignados. El dueño los asigna desde `/barberos`.

---

### ✅ 9. Adelantos y liquidaciones (`/finanzas/barberos`)

Los adelantos y liquidaciones son por local. Si un barbero trabaja en 2 locales, tiene saldo independiente en cada uno.

**Card por barbero:** saldo bruto · adelantos · saldo neto · botón "+ Adelanto" · botón "Liquidar"

**Modal "+ Adelanto":** monto + nota + saldo disponible. Adelanto ≤ saldo bruto.

**Modal "Liquidar":**
- Resumen período, bruto, adelantos detallados, neto en amarillo
- Checkbox: "Confirmo que el pago físico fue entregado al barbero"
- Al confirmar: INSERT en `payouts` con `paid_at = now()`

**Post-pago:**
- Badge verde "PAGADO" en la card
- "Último pago: DD/MM/YYYY a las HH:MM"
- Botón pasa a "Ver liquidación" en gris
- Al acumularse nuevo saldo: todo vuelve a amarillo

**Historial:**
```
✓  20/03/2026 14:32  |  01/03 → 20/03  |  $37.200  |  -$5.000  |  $32.200
```

---

### ✅ 10. Mi dashboard — barbero (`/mi-dashboard`)

Acento azul `#5bb8f5`. Welcome card + hora. 3 métricas. Card de saldo:
```
Ganado este período:    $X.XXX
Adelantos recibidos:  - $X.XXX
────────────────────────────────
A cobrar:               $X.XXX
```
Agenda del día. Tabla de ganancias corte por corte.

Si el barbero trabaja en más de un local, ve un selector para filtrar su agenda por local.

---

### 🔄 11. Reservas públicas

**URL `/reservas/[slug]`** — entrada general de la empresa

- Si tiene **1 solo local**: empieza directo en el paso "Barbero" (mismo flujo de antes)
- Si tiene **2 o más locales**: agrega el paso "Local" como primer paso del stepper

**URL `/reservas/[slug]/[local-slug]`** — entrada directa a un local específico
- Siempre empieza en el paso "Barbero", saltando el selector de local
- Útil para que cada sucursal tenga su propio QR o link en el local físico

**Stepper completo (multi-local):** Local → Barbero → Fecha → Horario → Tus datos → Confirmar

**Paso "Local" (solo si hay más de uno):**
- Cards con nombre del local, dirección y ciudad
- Check amarillo al seleccionar
- Al elegir local, el siguiente paso filtra solo los barberos de ese local

**Paso "Barbero":** tarjetas con avatar, nombre, disponibilidad. Solo barberos del local seleccionado.

**Paso "Tus datos":** Nombre completo · Teléfono · Email (validación en tiempo real). Aviso: pago en el local.

**Pantalla de éxito:** check verde, resumen, confirmación por email y WhatsApp.

---

### ✅ 12. Email de confirmación

Header: logo empresa + `[Nombre empresa] · [Nombre local]`
Ejemplo: `Barbería El Clásico · Sucursal Centro`

Badge verde. Caja de detalles (hora en amarillo, barbero, dirección del local específico, pago en local). Aviso de corte en el momento. Link cancelación hasta 2hs antes.

---

## Identidad de marca — dónde aparece el nombre

| Lugar | Formato |
|---|---|
| Sidebar del panel | `[Nombre empresa]` |
| Topbar del panel | `[Nombre empresa] — [Nombre local]` |
| Página de reservas | `[Nombre empresa]` grande + `[Nombre local]` chico |
| Email de confirmación | `[Nombre empresa] · [Nombre local]` |
| PDF de liquidación | Membrete: `[Nombre empresa] — [Nombre local]` |
| URL de reservas | `/reservas/[slug-empresa]/[slug-local]` |

---

## Diseño — tokens de color

```css
--bg-base: #111;          --bg-surface: #1a1a1a;
--bg-elevated: #222;      --bg-subtle: #161616;
--accent-yellow: #f5c542; --accent-yellow-dim: #2a2200;
--accent-blue: #5bb8f5;   --accent-blue-dim: #0d1f33;
--accent-purple: #c084f5; --accent-purple-dim: #2e1a3a;
--accent-green: #4dd4a0;  --accent-green-dim: #0d3326;
--text-primary: #f0f0f0;  --text-secondary: #888;
--text-muted: #555;       --text-disabled: #333;
--border: #2a2a2a;        --border-subtle: #1e1e1e;
--status-done: #4dd4a0;   --status-next: #f5c542;
--status-pending: #444;   --status-walkin: #5bb8f5;
--status-danger: #c04040;
```

---

## Avatares de barberos

| Barbero | Fondo | Texto |
|---|---|---|
| Lucas M. (LM) | `#1a2e3a` | `#5bb8f5` |
| Rodrigo P. (RP) | `#2e1a3a` | `#c084f5` |
| Facundo G. (FG) | `#1a3a2e` | `#4dd4a0` |
| Dueño (MR) | `#3a2e00` | `#f5c542` |

---

## Lógica de negocio

```typescript
// Comisión por corte
function calculateIncome(amount: number, commissionPct: number) {
  const barberAmount = Math.round(amount * commissionPct / 100);
  return { barberAmount, shopAmount: amount - barberAmount };
}

// Comisión del barbero: usa la del local si existe, si no la global del perfil
function getBarberCommission(barberLocation: BarberLocation, profile: Profile): number {
  return barberLocation.commission_pct ?? profile.commission_pct;
}

// Saldo pendiente del barbero (por local)
function calculateBarberBalance(incomeRecords, advances) {
  const grossAmount = incomeRecords.reduce((s, r) => s + r.barber_amount, 0);
  const advancesTotal = advances.reduce((s, a) => s + a.amount, 0);
  return { grossAmount, advancesTotal, netAmount: grossAmount - advancesTotal };
}

// Validación de adelanto
function canRegisterAdvance(amount: number, balance: number): boolean {
  return amount > 0 && amount <= balance;
}

// Mostrar selector de local solo si hay más de uno
function shouldShowLocationSelector(locations: Location[]): boolean {
  return locations.length > 1;
}
```

---

## Validaciones

- Email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Monto: entero positivo mínimo 1
- Nombre: mínimo 2 caracteres
- Teléfono: mínimo 8 caracteres
- Fecha de turno: no puede ser en el pasado
- Adelanto: no puede superar el saldo bruto acumulado
- Slug de local: solo letras minúsculas, números y guiones

---

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
CRON_SECRET=
```

---

## 🔮 Arquitectura multi-tenant (a futuro — no implementar ahora)

El sistema ya está preparado. Para escalar solo hace falta:

- 🔮 Página `/registro` — onboarding en 3 pasos (datos empresa → cuenta dueño → primer local)
- 🔮 Rol `superadmin` — ve todas las empresas, activa/desactiva, métricas globales
- 🔮 Planes con límites: basic (1 local, 2 barberos) / pro (3 locales, 5 barberos) / premium (ilimitado)
- 🔮 Período de prueba 14 días
- 🔮 Panel `/admin` para superadmin

---

## Notas finales

- Montos con separador de miles: `$8.450`
- Porcentajes como enteros: `50` = 50%
- Reservas públicas: sin autenticación
- Pagos: fuera del sistema (efectivo/débito en el local)
- Si la empresa tiene 1 solo local, toda la UI de "selector de local" se oculta automáticamente
- Al crear una empresa se crea automáticamente el primer local
- Las finanzas son completamente independientes por local
- Un barbero puede trabajar en varios locales con comisiones distintas por local
- El nombre de la empresa aparece en todos los documentos, emails y la página de reservas
- Sistema para Uruguay: fechas DD/MM/YYYY, moneda $
- Adelantos: solo el dueño los registra, el barbero solo consulta
- Liquidaciones: `net = gross − advances`, con `paid_at` exacto
- Multi-tenant: preparado en BD, se activa en Fase 8
