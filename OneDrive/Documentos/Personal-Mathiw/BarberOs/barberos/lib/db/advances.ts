import { createClient } from '@/lib/supabase/server'
import type { Advance } from '@/types'

export async function createAdvance(data: {
  barbershopId: string
  barberId: string
  amount: number
  note?: string
  createdBy: string
}) {
  const supabase = await createClient()

  const { data: advance, error } = await supabase
    .from('advances')
    .insert({
      barbershop_id: data.barbershopId,
      barber_id: data.barberId,
      amount: data.amount,
      note: data.note,
      created_by: data.createdBy,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating advance:', error)
    throw new Error('Failed to create advance')
  }

  return advance as Advance
}

export async function getAdvanceHistory(barberId: string, limit?: number) {
  const supabase = await createClient()

  let query = supabase
    .from('advances')
    .select(`
      *,
      created_by_profile:profiles!advances_created_by_fkey(name)
    `)
    .eq('barber_id', barberId)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching advance history:', error)
    return []
  }

  return data as Advance[]
}

export async function getAdvancesSince(barberId: string, since: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('advances')
    .select('*')
    .eq('barber_id', barberId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching advances since:', error)
    return []
  }

  return data as Advance[]
}

export async function getTotalAdvancesSince(barberId: string, since: string) {
  const advances = await getAdvancesSince(barberId, since)
  return advances.reduce((sum, adv) => sum + adv.amount, 0)
}
