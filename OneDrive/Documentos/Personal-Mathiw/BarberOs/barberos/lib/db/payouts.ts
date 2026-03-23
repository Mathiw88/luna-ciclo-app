import { createClient } from '@/lib/supabase/server'
import type { Payout } from '@/types'
import { getBarberIncome } from './income'
import { getTotalAdvancesSince } from './advances'

export async function createPayout(data: {
  barbershopId: string
  barberId: string
  periodFrom: string
  periodTo: string
  grossAmount: number
  advancesAmount: number
  netAmount: number
  paidBy: string
}) {
  const supabase = await createClient()

  const { data: payout, error } = await supabase
    .from('payouts')
    .insert({
      barbershop_id: data.barbershopId,
      barber_id: data.barberId,
      period_from: data.periodFrom,
      period_to: data.periodTo,
      gross_amount: data.grossAmount,
      advances_amount: data.advancesAmount,
      net_amount: data.netAmount,
      paid_by: data.paidBy,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating payout:', error)
    throw new Error('Failed to create payout')
  }

  return payout as Payout
}

export async function getPayoutHistory(barberId: string, limit?: number) {
  const supabase = await createClient()

  let query = supabase
    .from('payouts')
    .select(`
      *,
      paid_by_profile:profiles!payouts_paid_by_fkey(name)
    `)
    .eq('barber_id', barberId)
    .order('paid_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching payout history:', error)
    return []
  }

  return data as Payout[]
}

export async function getLastPayout(barberId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('barber_id', barberId)
    .order('paid_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    // No hay liquidaciones previas
    return null
  }

  return data as Payout
}

export async function getBarberBalance(barberId: string, barbershopId: string) {
  // Obtener última liquidación
  const lastPayout = await getLastPayout(barberId)

  // Fecha desde la cual calcular
  const periodFrom = lastPayout
    ? new Date(lastPayout.paid_at).toISOString().split('T')[0]
    : '2000-01-01' // Si no hay liquidaciones, desde el inicio

  const today = new Date().toISOString().split('T')[0]

  // Calcular ingresos brutos
  const incomes = await getBarberIncome(barberId, periodFrom, today)
  const grossAmount = incomes.reduce((sum, inc) => sum + inc.barber_amount, 0)

  // Calcular adelantos
  const advancesAmount = await getTotalAdvancesSince(
    barberId,
    lastPayout?.paid_at || '2000-01-01'
  )

  // Calcular neto
  const netAmount = grossAmount - advancesAmount

  return {
    periodFrom,
    periodTo: today,
    grossAmount,
    advancesAmount,
    netAmount,
    lastPayout,
  }
}
