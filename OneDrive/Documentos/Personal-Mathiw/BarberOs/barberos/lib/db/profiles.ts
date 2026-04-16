import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export async function getProfile(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function getBarbers(barbershopId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .in('role', ['owner', 'barber'])
    .eq('is_active', true)
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('Error fetching barbers:', error)
    return []
  }

  return data as Profile[]
}

export async function getAllBarbers(barbershopId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .in('role', ['owner', 'barber'])
    .order('joined_at', { ascending: true })

  if (error) {
    console.error('Error fetching all barbers:', error)
    return []
  }

  return data as Profile[]
}

export async function updateProfile(
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  return data as Profile
}

export async function createBarber(data: {
  barbershopId: string
  userId: string
  name: string
  initials: string
  color?: string
  commissionPct?: number
}) {
  const supabase = await createClient()

  const { data: barber, error } = await supabase
    .from('profiles')
    .insert({
      id: data.userId,
      barbershop_id: data.barbershopId,
      role: 'barber',
      name: data.name,
      initials: data.initials,
      color: data.color || 'blue',
      commission_pct: data.commissionPct || 50,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating barber:', error)
    throw new Error('Failed to create barber')
  }

  return barber as Profile
}
