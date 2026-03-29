'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/shared/Logo'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  active?: boolean
  onClick?: () => void
}

function NavItem({ href, icon, label, badge, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-[13px] transition-all duration-300 relative group',
        active
          ? 'bg-gradient-to-r from-accent-yellow-dim to-transparent text-accent-yellow border-l-2 border-accent-yellow shadow-md'
          : 'text-text-secondary hover:bg-[#1a1a1a] hover:text-[#e0e0e0] hover:translate-x-1'
      )}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-r from-accent-yellow/10 to-transparent rounded-lg" />
      )}
      <div className={cn("w-[15px] h-[15px] flex-shrink-0 transition-transform duration-300 relative z-10", active && "scale-110")}>{icon}</div>
      <span className="flex-1 relative z-10">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto badge-yellow relative z-10">
          {badge}
        </span>
      )}
    </Link>
  )
}

interface OwnerSidebarProps {
  onClose?: () => void
}

export default function OwnerSidebar({ onClose }: OwnerSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [agendaBadge, setAgendaBadge] = useState(0)

  useEffect(() => {
    const fetchBadge = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('barbershop_id')
          .eq('id', user.id)
          .single()

        if (!profile?.barbershop_id) return

        const today = new Date().toISOString().split('T')[0]

        const { count } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('barbershop_id', profile.barbershop_id)
          .eq('appointment_date', today)
          .in('status', ['pending', 'confirmed'])

        setAgendaBadge(count ?? 0)
      } catch {
        // silent
      }
    }
    fetchBadge()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="w-[220px] min-w-[220px] bg-gradient-to-br from-[#1a1a1a] via-[#161616] to-[#0d0d0d] border-r-[0.5px] border-[#2e2e2e] flex flex-col h-screen relative overflow-hidden">
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent-yellow/[0.03] via-transparent to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="px-4 py-[18px] border-b-[0.5px] border-border-default relative z-10">
        <Logo size="default" />
      </div>

      {/* User Card */}
      <div className="m-2.5 card-glass p-2.5 flex items-center gap-2.5 border-[0.5px] border-accent-yellow/20 hover:border-accent-yellow/40 transition-all duration-300 relative z-10">
        <BarberAvatar initials="MR" color="yellow" size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#e8e8e8] truncate">Marcos Rodríguez</div>
          <div className="text-[10px] text-accent-yellow uppercase tracking-[0.06em]">Dueño</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto relative z-10">
        {/* PRINCIPAL */}
        <div className="text-[9px] text-text-muted uppercase tracking-[0.1em] px-2 pt-2.5 pb-1">
          Principal
        </div>
        <NavItem
          href="/dashboard"
          active={pathname === '/dashboard'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <rect x="1" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/>
              <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" fill="currentColor"/>
              <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor"/>
              <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" fill="currentColor"/>
            </svg>
          }
          label="Dashboard"
        />
        <NavItem
          href="/finanzas"
          active={pathname === '/finanzas'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <path d="M2 4h11M2 7.5h11M2 11h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }
          label="Finanzas"
        />
        <NavItem
          href="/finanzas/barberos"
          active={pathname === '/finanzas/barberos'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <path d="M7.5 2v11M12 5H9.5a2 2 0 000 4h1a2 2 0 010 4H7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          }
          label="Liquidación / Adelantos"
        />

        {/* AGENDA */}
        <div className="text-[9px] text-text-muted uppercase tracking-[0.1em] px-2 pt-2.5 pb-1">
          Agenda
        </div>
        <NavItem
          href="/agenda"
          active={pathname === '/agenda'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <rect x="1" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 1v3M10 1v3M1 6.5h13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          }
          label="Agenda"
          badge={agendaBadge}
        />

        {/* GESTIÓN */}
        <div className="text-[9px] text-text-muted uppercase tracking-[0.1em] px-2 pt-2.5 pb-1">
          Gestión
        </div>
        <NavItem
          href="/barberos"
          active={pathname === '/barberos'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <circle cx="5.5" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1 13c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <path d="M10.5 6.5c1.5 0 3.5.8 3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="11.5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          }
          label="Barberos / Personal"
        />
        <NavItem
          href="/historial"
          active={pathname === '/historial'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <path d="M2 4h11M2 7.5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M10 11h2M11 10v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          }
          label="Historial de cortes"
        />

        {/* SISTEMA */}
        <div className="text-[9px] text-text-muted uppercase tracking-[0.1em] px-2 pt-2.5 pb-1">
          Sistema
        </div>
        <NavItem
          href="/configuracion"
          active={pathname === '/configuracion'}
          onClick={onClose}
          icon={
            <svg viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M2.9 2.9l1.4 1.4M10.7 10.7l1.4 1.4M2.9 12.1l1.4-1.4M10.7 4.3l1.4-1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          }
          label="Configuración"
        />
      </nav>

      {/* Footer - Cerrar sesión */}
      <div className="px-2 py-2.5 border-t-[0.5px] border-border-default relative z-10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] text-status-danger hover:bg-gradient-to-r hover:from-[#2a1a1a] hover:to-transparent transition-all duration-300 hover:translate-x-1"
        >
          <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v9a1 1 0 001 1h3M10 10.5l3-3-3-3M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
