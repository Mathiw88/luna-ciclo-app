import { createClient } from '@/lib/supabase/server'
import type { Barbershop } from '@/types'

export async function getBarbershopBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching barbershop:', error)
    return null
  }

  return data as Barbershop
}

export async function getBarbershopById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching barbershop:', error)
    return null
  }

  return data as Barbershop
}

export async function updateBarbershop(
  id: string,
  updates: Partial<Omit<Barbershop, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('barbershops')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating barbershop:', error)
    throw new Error('Failed to update barbershop')
  }

  return data as Barbershop
}
