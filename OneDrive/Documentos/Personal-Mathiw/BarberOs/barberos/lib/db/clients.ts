import { createClient } from '@/lib/supabase/server'
import type { Client } from '@/types'

export async function getOrCreateClient(data: {
  barbershopId: string
  name: string
  email?: string
  phone: string
}) {
  const supabase = await createClient()

  // Si tiene email, buscar por email
  if (data.email) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .eq('barbershop_id', data.barbershopId)
      .eq('email', data.email)
      .single()

    if (existingClient) {
      return existingClient as Client
    }
  }

  // Si no existe, crear nuevo cliente
  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      barbershop_id: data.barbershopId,
      name: data.name,
      email: data.email,
      phone: data.phone,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    throw new Error('Failed to create client')
  }

  return newClient as Client
}

export async function getClientById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  return data as Client
}

export async function getClientsByBarbershop(barbershopId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }

  return data as Client[]
}
