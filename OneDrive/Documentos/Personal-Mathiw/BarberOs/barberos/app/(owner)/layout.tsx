'use client'

import { useState, useEffect } from 'react'
import OwnerSidebar from '@/components/owner/OwnerSidebar'
import { createClient } from '@/lib/supabase/client'

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [barbershopName, setBarbershopName] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBarbershopName() {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (!profile?.barbershop_id) return

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('name')
        .eq('id', profile.barbershop_id)
        .single()

      if (barbershop?.name) {
        setBarbershopName(barbershop.name)
      }
    }

    fetchBarbershopName()
  }, [])

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:z-auto lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <OwnerSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-bg-surface border-b-[0.5px] border-border-default flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 -ml-1"
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="text-[15px] font-medium text-text-primary">
            {barbershopName ?? '...'}
          </span>
        </div>

        {children}
      </main>
    </div>
  )
}
