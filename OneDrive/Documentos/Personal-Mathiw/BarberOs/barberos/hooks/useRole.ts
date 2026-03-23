'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { Profile } from '@/types'

export function useRole() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching profile:', error)
        } else {
          setProfile(data)
        }
        setLoading(false)
      })
  }, [user, supabase])

  return {
    role: profile?.role,
    barbershopId: profile?.barbershop_id,
    profile,
    loading,
  }
}
