'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Period = 'today' | 'week' | 'month' | 'prev-month' | 'next-month'

interface IncomeRecord {
  id: string
  barber_id: string
  total_amount: number
  barber_amount: number
  shop_amount: number
}

interface BarberProfile {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
  commission_pct: number
}

interface Appointment {
  id: string
  appointment_time: string
  client_name: string
  status: 'pending' | 'confirmed' | 'done' | 'completed' | 'cancelled' | 'walkin' | 'no_show'
  price: number | null
  barber: {
    name: string
    initials: string
    color: 'blue' | 'purple' | 'green' | 'yellow'
  } | null
}

interface BarberToday {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
  commission_pct: number
  cuts: number
  earned: number
  total: number
  progress: number
}

interface Metrics {
  revenue: number
  cuts: number
  shopAmount: number
  shopPct: number
  barbersToPay: number
  barbersCount: number
}

function getPeriodDates(period: Period): { start: string; end: string } {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  switch (period) {
    case 'today':
      return { start: today, end: today }
    case 'week': {
      const day = now.getDay()
      const mondayOffset = day === 0 ? -6 : 1 - day
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0],
      }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      }
    }
    case 'prev-month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      }
    }
    case 'next-month': {
      const start = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)
      return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
      }
    }
  }
}

const statusColors = {
  completed: { bg: 'bg-[#0d3326]', text: 'text-status-done', bar: 'bg-status-done', label: 'COMPLETADO' },
  done: { bg: 'bg-accent-blue-dim', text: 'text-accent-blue', bar: 'bg-accent-blue', label: 'REALIZADO' },
  confirmed: { bg: 'bg-accent-yellow-dim', text: 'text-accent-yellow', bar: 'bg-accent-yellow', label: 'PRÓXIMO' },
  pending: { bg: 'bg-[#222]', text: 'text-[#888]', bar: 'bg-[#555]', label: 'PENDIENTE' },
  walkin: { bg: 'bg-accent-blue-dim', text: 'text-accent-blue', bar: 'bg-accent-blue', label: 'WALK-IN' },
  cancelled: { bg: 'bg-[#222]', text: 'text-[#555]', bar: 'bg-[#444]', label: 'CANCELADO' },
  no_show: { bg: 'bg-[#222]', text: 'text-[#555]', bar: 'bg-[#444]', label: 'NO ASISTIÓ' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('today')
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [loadingToday, setLoadingToday] = useState(false)
  const [metrics, setMetrics] = useState<Metrics>({
    revenue: 0,
    cuts: 0,
    shopAmount: 0,
    shopPct: 0,
    barbersToPay: 0,
    barbersCount: 0,
  })
  const [exporting, setExporting] = useState(false)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [barbersToday, setBarbersToday] = useState<BarberToday[]>([])

  const todayDate = new Date().toISOString().split('T')[0]
  const todayLabel = new Date().toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  // Initialize: get user + barbershop_id
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      setLoadingInit(true)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          toast.error('Error de autenticación')
          return
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('barbershop_id')
          .eq('id', user.id)
          .single()
        if (profileError || !profile?.barbershop_id) {
          toast.error('No se pudo obtener la barbería')
          return
        }
        setBarbershopId(profile.barbershop_id)
      } catch {
        toast.error('Error al inicializar el dashboard')
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [])

  // Fetch metrics when period or barbershopId changes
  const fetchMetrics = useCallback(async (bsId: string, p: Period) => {
    const supabase = createClient()
    setLoadingMetrics(true)
    try {
      const { start, end } = getPeriodDates(p)

      // Obtener IDs de owners para excluirlos de "A pagar a barberos"
      const { data: ownerProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('barbershop_id', bsId)
        .eq('role', 'owner')

      const ownerIds = new Set((ownerProfiles ?? []).map(o => o.id))

      const { data: incomes, error } = await supabase
        .from('income_records')
        .select('id, barber_id, total_amount, barber_amount, shop_amount')
        .eq('barbershop_id', bsId)
        .gte('date', start)
        .lte('date', end)

      if (error) throw error

      const records = (incomes ?? []) as IncomeRecord[]
      const revenue = records.reduce((sum, r) => sum + r.total_amount, 0)
      // Solo contar barber_amount de barberos reales (no owners)
      const barbersToPay = records
        .filter(r => !ownerIds.has(r.barber_id))
        .reduce((sum, r) => sum + r.barber_amount, 0)
      const shopAmount = records.reduce((sum, r) => sum + r.shop_amount, 0)
      const cuts = records.length
      const shopPct = revenue > 0 ? Math.round((shopAmount / revenue) * 100) : 0

      // Count unique active barbers (excl. owners) in this period
      const uniqueBarberIds = new Set(
        records.filter(r => !ownerIds.has(r.barber_id)).map(r => r.barber_id)
      )

      setMetrics({
        revenue,
        cuts,
        shopAmount,
        shopPct,
        barbersToPay,
        barbersCount: uniqueBarberIds.size,
      })
    } catch {
      toast.error('Error al cargar métricas')
    } finally {
      setLoadingMetrics(false)
    }
  }, [])

  // Fetch today's appointments and barbers
  const fetchToday = useCallback(async (bsId: string) => {
    const supabase = createClient()
    setLoadingToday(true)
    try {
      // Today's appointments
      const { data: appts, error: apptError } = await supabase
        .from('appointments')
        .select('id, appointment_time, client_name, status, price, barber:profiles!barber_id(name, initials, color)')
        .eq('barbershop_id', bsId)
        .eq('appointment_date', todayDate)
        .order('appointment_time')

      if (apptError) throw apptError

      setTodayAppointments(
        ((appts ?? []) as unknown as Appointment[])
      )

      // Active barbers
      const { data: barbers, error: barbersError } = await supabase
        .from('profiles')
        .select('id, name, initials, color, commission_pct')
        .eq('barbershop_id', bsId)
        .in('role', ['owner', 'barber'])
        .eq('is_active', true)
        .order('name')

      if (barbersError) throw barbersError

      const activeBarbers = (barbers ?? []) as BarberProfile[]

      // Today's income per barber
      const { data: todayIncomes, error: incomeError } = await supabase
        .from('income_records')
        .select('barber_id, barber_amount, total_amount')
        .eq('barbershop_id', bsId)
        .eq('date', todayDate)

      if (incomeError) throw incomeError

      const incomeByBarber = new Map<string, { earned: number; total: number }>()
      for (const rec of (todayIncomes ?? []) as { barber_id: string; barber_amount: number; total_amount: number }[]) {
        const prev = incomeByBarber.get(rec.barber_id) ?? { earned: 0, total: 0 }
        incomeByBarber.set(rec.barber_id, {
          earned: prev.earned + rec.barber_amount,
          total: prev.total + rec.total_amount,
        })
      }

      // Today's cuts count per barber
      const { data: todayCuts, error: cutsError } = await supabase
        .from('appointments')
        .select('barber_id')
        .eq('barbershop_id', bsId)
        .eq('appointment_date', todayDate)
        .in('status', ['done', 'completed', 'walkin'])

      if (cutsError) throw cutsError

      const cutsByBarber = new Map<string, number>()
      for (const apt of (todayCuts ?? []) as { barber_id: string }[]) {
        cutsByBarber.set(apt.barber_id, (cutsByBarber.get(apt.barber_id) ?? 0) + 1)
      }

      const barbersData: BarberToday[] = activeBarbers.map(b => {
        const inc = incomeByBarber.get(b.id) ?? { earned: 0, total: 0 }
        const cuts = cutsByBarber.get(b.id) ?? 0
        const progress = inc.total > 0 ? Math.round((inc.earned / inc.total) * 100) : 0
        return {
          id: b.id,
          name: b.name,
          initials: b.initials,
          color: (b.color as 'blue' | 'purple' | 'green' | 'yellow') || 'blue',
          commission_pct: b.commission_pct,
          cuts,
          earned: inc.earned,
          total: inc.total,
          progress,
        }
      })

      setBarbersToday(barbersData)
    } catch {
      toast.error('Error al cargar datos de hoy')
    } finally {
      setLoadingToday(false)
    }
  }, [todayDate])

  // Trigger fetches once barbershopId is available
  useEffect(() => {
    if (!barbershopId) return
    fetchMetrics(barbershopId, period)
  }, [barbershopId, period, fetchMetrics])

  useEffect(() => {
    if (!barbershopId) return
    fetchToday(barbershopId)
  }, [barbershopId, fetchToday])

  const handleExport = async () => {
    if (!barbershopId) return
    setExporting(true)
    try {
      const supabase = createClient()
      const { start, end } = getPeriodDates(period)
      const { data, error } = await supabase
        .from('income_records')
        .select('date, total_amount, barber_amount, shop_amount, commission_pct, profiles(name)')
        .eq('barbershop_id', barbershopId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })

      if (error) throw error

      type ExportRow = {
        date: string
        total_amount: number
        barber_amount: number
        shop_amount: number
        commission_pct: number
        profiles: { name: string } | { name: string }[] | null
      }

      const rows = (data ?? []) as unknown as ExportRow[]

      const header = ['Fecha', 'Barbero', 'Total', 'Barbero (parte)', 'Barbería (parte)', 'Comisión %'].join(',')
      const lines = rows.map((r) => {
        // Supabase puede retornar profiles como array o como objeto dependiendo de la relación
        const profileName = Array.isArray(r.profiles)
          ? (r.profiles[0]?.name ?? '')
          : (r.profiles?.name ?? '')
        return [
          r.date,
          profileName,
          r.total_amount.toLocaleString('es-AR'),
          r.barber_amount.toLocaleString('es-AR'),
          r.shop_amount.toLocaleString('es-AR'),
          r.commission_pct,
        ].join(',')
      })

      const csv = [header, ...lines].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ingresos-${period}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Exportado correctamente')
    } catch {
      toast.error('Error al exportar')
    } finally {
      setExporting(false)
    }
  }

  const isLoading = loadingInit || loadingMetrics || loadingToday

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-4 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 flex-shrink-0">
        <div>
          <h1 className="text-[20px] sm:text-[22px] font-medium text-text-primary">Dashboard</h1>
          <p className="text-xs text-text-secondary mt-0.5 capitalize">{todayLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || !barbershopId}
            className="bg-[#222] text-[#ccc] border-[0.5px] border-[#333] rounded-lg px-3 sm:px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="animate-spin">
                  <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3" strokeOpacity="0.3"/>
                  <path d="M6.5 1a5.5 5.5 0 0 1 5.5 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Exportando...
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M6.5 1v8M3 6.5l3.5 3.5 3.5-3.5M1 11h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Exportar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4">
        {/* Tabs de período */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'week', label: 'Esta semana' },
            { id: 'month', label: 'Este mes' },
            { id: 'prev-month', label: 'Mes anterior' },
            { id: 'next-month', label: 'Mes siguiente' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as Period)}
              className={`px-3.5 py-1.5 rounded-[20px] text-xs border-[0.5px] transition-colors ${
                period === tab.id
                  ? 'bg-accent-yellow text-bg-base font-medium border-accent-yellow'
                  : 'bg-transparent text-text-secondary border-[#2e2e2e] hover:bg-[#222] hover:text-[#ccc]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4v3.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Recaudado
            </div>
            {loadingMetrics ? (
              <div className="h-[28px] bg-[#222] rounded animate-pulse w-24" />
            ) : (
              <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.revenue)}</div>
            )}
            <div className="text-[11px] text-text-muted mt-1">{metrics.cuts} cortes</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <path d="M2 12L5 5l3 4 2-2.5L13 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cortes realizados
            </div>
            {loadingMetrics ? (
              <div className="h-[28px] bg-[#222] rounded animate-pulse w-12" />
            ) : (
              <div className="text-[22px] font-medium text-text-primary">{metrics.cuts}</div>
            )}
            <div className="text-[11px] text-text-muted mt-1">{metrics.barbersCount} barbero{metrics.barbersCount !== 1 ? 's' : ''}</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 6h12" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Para la barbería
            </div>
            {loadingMetrics ? (
              <div className="h-[28px] bg-[#222] rounded animate-pulse w-24" />
            ) : (
              <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.shopAmount)}</div>
            )}
            <div className="text-[11px] text-accent-yellow mt-1">{metrics.shopPct}% promedio</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M9.5 6c1.2 0 3 .7 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              A pagar a barberos
            </div>
            {loadingMetrics ? (
              <div className="h-[28px] bg-[#222] rounded animate-pulse w-24" />
            ) : (
              <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.barbersToPay)}</div>
            )}
            <div className="text-[11px] text-accent-yellow mt-1">{metrics.barbersCount} barbero{metrics.barbersCount !== 1 ? 's' : ''} activo{metrics.barbersCount !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Dos columnas */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-3">
          {/* Agenda de hoy */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-sm font-medium text-[#e0e0e0]">Agenda de hoy</span>
              <span onClick={() => router.push('/agenda')} className="text-xs text-accent-yellow cursor-pointer hover:underline">Ver completa →</span>
            </div>

            {loadingToday ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2.5 py-2">
                    <div className="w-10 h-3 bg-[#222] rounded animate-pulse" />
                    <div className="w-[3px] h-9 bg-[#222] rounded animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-[#222] rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-[#222] rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="py-6 text-center text-text-muted text-sm">
                No hay turnos registrados para hoy
              </div>
            ) : (
              <div className="space-y-0 max-h-[360px] overflow-y-auto pr-1">
                {todayAppointments.slice(0, 8).map((apt) => {
                  const statusKey = apt.status as keyof typeof statusColors
                  const status = statusColors[statusKey] ?? statusColors.pending
                  const timeDisplay = apt.appointment_time.substring(0, 5)
                  const barberName = apt.barber?.name ?? '—'
                  return (
                    <div key={apt.id} className="flex items-start gap-2.5 py-2.5 border-b-[0.5px] border-[#222] last:border-0">
                      <span className="text-xs text-text-muted w-10 flex-shrink-0 pt-0.5">{timeDisplay}</span>
                      <div className={`w-[3px] rounded-sm self-stretch min-h-[36px] ${status.bar}`} />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#e0e0e0]">{apt.client_name}</div>
                        <div className="text-[11px] text-text-muted">con {barberName}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-medium px-[7px] py-0.5 rounded-[5px] ${status.bg} ${status.text}`}>
                          {status.label}
                        </span>
                        <span className={`text-[13px] font-medium ${apt.price ? 'text-text-primary' : 'text-[#444]'}`}>
                          {apt.price ? formatCurrency(apt.price) : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {todayAppointments.length > 8 && (
              <div className="mt-2 pt-2 border-t-[0.5px] border-[#222] text-center">
                <span onClick={() => router.push('/agenda')} className="text-xs text-text-muted cursor-pointer hover:text-accent-yellow transition-colors">
                  +{todayAppointments.length - 8} turnos más — Ver agenda completa
                </span>
              </div>
            )}
          </div>

          {/* Barberos hoy */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-sm font-medium text-[#e0e0e0]">Barberos — hoy</span>
              <span className="text-xs text-accent-yellow cursor-pointer hover:underline">Ver todos →</span>
            </div>

            {loadingToday ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-2.5 py-2">
                    <div className="w-8 h-8 bg-[#222] rounded-full animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-[#222] rounded animate-pulse w-2/3" />
                      <div className="h-2.5 bg-[#222] rounded animate-pulse w-1/3" />
                      <div className="h-[3px] bg-[#222] rounded animate-pulse w-full mt-1" />
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="h-3 bg-[#222] rounded animate-pulse w-16" />
                      <div className="h-2.5 bg-[#222] rounded animate-pulse w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : barbersToday.length === 0 ? (
              <div className="py-6 text-center text-text-muted text-sm">
                No hay barberos activos
              </div>
            ) : (
              <div className="space-y-0">
                {barbersToday.map((barber) => {
                  const barColor =
                    barber.color === 'blue' ? 'bg-accent-blue' :
                    barber.color === 'purple' ? 'bg-accent-purple' :
                    barber.color === 'yellow' ? 'bg-accent-yellow' :
                    'bg-accent-green'
                  return (
                    <div key={barber.id} className="flex items-center gap-2.5 py-2.5 border-b-[0.5px] border-[#222] last:border-0">
                      <BarberAvatar initials={barber.initials} color={barber.color} size="md" />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium text-[#e0e0e0]">{barber.name}</div>
                        <div className="text-[11px] text-text-muted">{barber.cuts} cortes · {barber.commission_pct}%</div>
                        <div className="h-[3px] bg-[#222] rounded-sm mt-1.5">
                          <div
                            className={`h-full rounded-sm ${barColor}`}
                            style={{ width: `${barber.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-text-primary">{formatCurrency(barber.earned)}</div>
                        <div className="text-[11px] text-text-muted">de {formatCurrency(barber.total)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && loadingInit && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-base/60 z-10">
          <div className="text-text-secondary text-sm">Cargando dashboard...</div>
        </div>
      )}

    </>
  )
}
