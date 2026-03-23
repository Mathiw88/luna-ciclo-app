'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface BarberBalance {
  periodFrom: string
  periodTo: string
  grossAmount: number
  advancesAmount: number
  netAmount: number
  lastPayoutDate: string | null
}

export function useBarberBalance(barberId: string | null) {
  const [balance, setBalance] = useState<BarberBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!barberId) {
      setBalance(null)
      setLoading(false)
      return
    }

    async function fetchBalance() {
      try {
        // Obtener última liquidación
        const { data: lastPayout } = await supabase
          .from('payouts')
          .select('*')
          .eq('barber_id', barberId)
          .order('paid_at', { ascending: false })
          .limit(1)
          .single()

        const periodFrom = lastPayout
          ? new Date(lastPayout.paid_at).toISOString().split('T')[0]
          : '2000-01-01'

        const today = new Date().toISOString().split('T')[0]

        // Obtener ingresos
        const { data: incomes } = await supabase
          .from('income_records')
          .select('barber_amount')
          .eq('barber_id', barberId)
          .gte('date', periodFrom)
          .lte('date', today)

        const grossAmount = incomes?.reduce((sum, inc) => sum + inc.barber_amount, 0) || 0

        // Obtener adelantos
        const { data: advances } = await supabase
          .from('advances')
          .select('amount')
          .eq('barber_id', barberId)
          .gte('created_at', lastPayout?.paid_at || '2000-01-01')

        const advancesAmount = advances?.reduce((sum, adv) => sum + adv.amount, 0) || 0

        setBalance({
          periodFrom,
          periodTo: today,
          grossAmount,
          advancesAmount,
          netAmount: grossAmount - advancesAmount,
          lastPayoutDate: lastPayout?.paid_at || null,
        })
      } catch (error) {
        console.error('Error fetching barber balance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [barberId, supabase])

  return { balance, loading }
}
