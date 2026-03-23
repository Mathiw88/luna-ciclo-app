'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRole } from './useRole'
import type { Barbershop } from '@/types'

export function useBarbershop() {
  const { barbershopId } = useRole()
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!barbershopId) {
      setBarbershop(null)
      setLoading(false)
      return
    }

    supabase
      .from('barbershops')
      .select('*')
      .eq('id', barbershopId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching barbershop:', error)
        } else {
          setBarbershop(data)
        }
        setLoading(false)
      })
  }, [barbershopId, supabase])

  return { barbershop, loading }
}
