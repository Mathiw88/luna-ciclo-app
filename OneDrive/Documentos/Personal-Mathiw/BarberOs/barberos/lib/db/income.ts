import { createClient } from '@/lib/supabase/server'
import type { IncomeRecord } from '@/types'

export async function createIncomeRecord(data: {
  barbershopId: string
  barberId: string
  appointmentId?: string
  date: string
  totalAmount: number
  barberAmount: number
  shopAmount: number
  commissionPct: number
}) {
  const supabase = await createClient()

  const { data: income, error } = await supabase
    .from('income_records')
    .insert({
      barbershop_id: data.barbershopId,
      barber_id: data.barberId,
      appointment_id: data.appointmentId,
      date: data.date,
      total_amount: data.totalAmount,
      barber_amount: data.barberAmount,
      shop_amount: data.shopAmount,
      commission_pct: data.commissionPct,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating income record:', error)
    throw new Error('Failed to create income record')
  }

  return income as IncomeRecord
}

export async function getIncomeByPeriod(
  barbershopId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('income_records')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching income:', error)
    return []
  }

  return data as IncomeRecord[]
}

export async function getBarberIncome(
  barberId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('income_records')
    .select('*')
    .eq('barber_id', barberId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching barber income:', error)
    return []
  }

  return data as IncomeRecord[]
}

export async function getDailyIncome(
  barbershopId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('income_records')
    .select('date, total_amount')
    .eq('barbershop_id', barbershopId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching daily income:', error)
    return []
  }

  // Agrupar por fecha
  const dailyMap = new Map<string, number>()

  data.forEach((record) => {
    const current = dailyMap.get(record.date) || 0
    dailyMap.set(record.date, current + record.total_amount)
  })

  return Array.from(dailyMap.entries()).map(([date, total]) => ({
    date,
    total,
  }))
}

export async function getBarberStats(
  barbershopId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient()

  const { data: incomes, error } = await supabase
    .from('income_records')
    .select(`
      *,
      barber:profiles(id, name, initials, color, commission_pct)
    `)
    .eq('barbershop_id', barbershopId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) {
    console.error('Error fetching barber stats:', error)
    return []
  }

  // Agrupar por barbero
  const barberMap = new Map<string, {
    barber: any
    cuts: number
    revenue: number
    earned: number
  }>()

  incomes.forEach((income: any) => {
    const barberId = income.barber_id
    const current = barberMap.get(barberId) || {
      barber: income.barber,
      cuts: 0,
      revenue: 0,
      earned: 0,
    }

    barberMap.set(barberId, {
      ...current,
      cuts: current.cuts + 1,
      revenue: current.revenue + income.total_amount,
      earned: current.earned + income.barber_amount,
    })
  })

  return Array.from(barberMap.values())
}
