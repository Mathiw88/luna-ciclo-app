export type Role = 'owner' | 'barber'

export type AppointmentStatus = 'pending' | 'confirmed' | 'done' | 'cancelled' | 'walkin'

export interface Barbershop {
  id: string
  name: string
  address: string | null
  phone: string | null
  city: string | null
  slug: string
  created_at: string
}

export interface Profile {
  id: string
  barbershop_id: string
  full_name: string
  role: Role
  commission_pct: number
  active: boolean
  created_at: string
}

export interface Client {
  id: string
  barbershop_id: string
  full_name: string
  phone: string | null
  email: string | null
  created_at: string
}

export interface Appointment {
  id: string
  barbershop_id: string
  barber_id: string
  client_id: string
  scheduled_at: string
  status: AppointmentStatus
  price: number | null
  notes: string | null
  is_walkin: boolean
  created_at: string
}

export interface IncomeRecord {
  id: string
  barbershop_id: string
  appointment_id: string
  barber_id: string
  amount: number
  barber_amount: number
  shop_amount: number
  recorded_at: string
}

export interface Advance {
  id: string
  barbershop_id: string
  barber_id: string
  amount: number
  note: string | null
  created_by: string
  created_at: string
}

export interface Payout {
  id: string
  barbershop_id: string
  barber_id: string
  period_from: string
  period_to: string
  gross_amount: number
  advances_total: number
  net_amount: number
  note: string | null
  paid_by: string
  paid_at: string
}
