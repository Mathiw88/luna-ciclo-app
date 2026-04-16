import { createClient } from '@/lib/supabase/server'
import type { Appointment, AppointmentStatus } from '@/types'

export async function getAppointmentsByDay(barbershopId: string, date: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      barber:profiles(id, name, initials, color),
      client:clients(id, name, email, phone)
    `)
    .eq('barbershop_id', barbershopId)
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
    return []
  }

  return data as Appointment[]
}

export async function getAvailableSlots(barberId: string, date: string) {
  const supabase = await createClient()

  // Obtener todos los turnos ocupados para ese barbero en esa fecha
  const { data: bookedSlots, error } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('barber_id', barberId)
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed', 'done'])

  if (error) {
    console.error('Error fetching booked slots:', error)
    return []
  }

  // Generar slots de 30 minutos de 9:00 a 18:00
  const slots: string[] = []
  for (let hour = 9; hour < 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    slots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  // Filtrar slots ocupados
  const bookedTimes = bookedSlots.map(s => s.appointment_time)
  const availableSlots = slots.filter(slot => !bookedTimes.includes(slot))

  return availableSlots
}

export async function createAppointment(data: {
  barbershopId: string
  barberId: string
  clientId: string
  clientName: string
  appointmentDate: string
  appointmentTime: string
  status?: AppointmentStatus
  isWalkin?: boolean
  price?: number
  notes?: string
}) {
  const supabase = await createClient()

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      barbershop_id: data.barbershopId,
      barber_id: data.barberId,
      client_id: data.clientId,
      client_name: data.clientName,
      appointment_date: data.appointmentDate,
      appointment_time: data.appointmentTime,
      status: data.status || 'pending',
      is_walkin: data.isWalkin || false,
      price: data.price,
      notes: data.notes,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating appointment:', error)
    throw new Error('Failed to create appointment')
  }

  return appointment as Appointment
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
  price?: number
) {
  const supabase = await createClient()

  const updateData: { status: AppointmentStatus; price?: number } = { status }
  if (price !== undefined) {
    updateData.price = price
  }

  const { data, error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating appointment:', error)
    throw new Error('Failed to update appointment')
  }

  return data as Appointment
}

export async function getTodayAppointments(barbershopId: string) {
  const today = new Date().toISOString().split('T')[0]
  return getAppointmentsByDay(barbershopId, today)
}

export async function getBarberAppointmentsByDay(barberId: string, date: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      client:clients(id, name, email, phone)
    `)
    .eq('barber_id', barberId)
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('Error fetching barber appointments:', error)
    return []
  }

  return data as Appointment[]
}
