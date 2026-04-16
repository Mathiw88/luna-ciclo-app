'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface Barber {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
}

interface AppointmentRow {
  id: string
  appointment_date: string
  appointment_time: string
  client_name: string
  barber_id: string
  status: string
  is_walkin: boolean
  price: number | null
  barber: Barber | null
}

const PAGE_SIZE = 50

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-[#0d3326]',        text: 'text-status-done',   label: 'COMPLETADO' },
  done:      { bg: 'bg-accent-blue-dim',   text: 'text-accent-blue',   label: 'REALIZADO' },
  walkin:    { bg: 'bg-accent-blue-dim',   text: 'text-accent-blue',   label: 'WALK-IN' },
  cancelled: { bg: 'bg-[#2a1010]',         text: 'text-status-danger', label: 'CANCELADO' },
  pending:   { bg: 'bg-[#222]',            text: 'text-[#666]',        label: 'PENDIENTE' },
  confirmed: { bg: 'bg-accent-yellow-dim', text: 'text-accent-yellow', label: 'PRÓXIMO' },
  no_show:   { bg: 'bg-[#2a2200]',         text: 'text-[#888]',        label: 'NO ASISTIÓ' },
}

export default function HistorialPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [activeBarberFilters, setActiveBarberFilters] = useState<Record<string, boolean>>({})
  const [activeStatusFilters, setActiveStatusFilters] = useState<Record<string, boolean>>({
    completed: true,
    done: true,
    walkin: true,
    cancelled: true,
    pending: false,
    confirmed: false,
    no_show: false,
  })

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    loadBarbers()
  }, [])

  useEffect(() => {
    setPage(0)
    loadAppointments(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, search, activeBarberFilters, activeStatusFilters])

  const loadBarbers = async () => {
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (!profile?.barbershop_id) return

      const { data } = await supabase
        .from('profiles')
        .select('id, name, initials, color')
        .eq('barbershop_id', profile.barbershop_id)
        .in('role', ['owner', 'barber'])
        .order('name')

      if (data) {
        setBarbers(data as Barber[])
        const filters: Record<string, boolean> = {}
        data.forEach((b) => { filters[b.id] = true })
        setActiveBarberFilters(filters)
      }
    } catch {
      toast.error('Error al cargar barberos')
    }
  }

  const loadAppointments = async (pageNum: number) => {
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    setLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (!profile?.barbershop_id) { setLoading(false); return }

      let query = supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          client_name,
          barber_id,
          status,
          is_walkin,
          price,
          profiles!appointments_barber_id_fkey (
            id, name, initials, color
          )
        `, { count: 'exact' })
        .eq('barbershop_id', profile.barbershop_id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

      if (dateFrom) query = query.gte('appointment_date', dateFrom)
      if (dateTo)   query = query.lte('appointment_date', dateTo)
      if (search.trim()) query = query.ilike('client_name', `%${search.trim()}%`)

      const activeStatuses = Object.entries(activeStatusFilters)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (activeStatuses.length > 0) {
        query = query.in('status', activeStatuses)
      }

      const activeBarberIds = Object.entries(activeBarberFilters)
        .filter(([, v]) => v)
        .map(([k]) => k)
      if (activeBarberIds.length > 0) {
        query = query.in('barber_id', activeBarberIds)
      }

      const { data, error, count } = await query

      if (error) throw error

      const rows: AppointmentRow[] = (data || []).map((row: Record<string, unknown>) => {
        const profileData = row.profiles as Record<string, unknown> | null
        return {
          id: row.id as string,
          appointment_date: row.appointment_date as string,
          appointment_time: row.appointment_time as string,
          client_name: row.client_name as string,
          barber_id: row.barber_id as string,
          status: row.status as string,
          is_walkin: row.is_walkin as boolean,
          price: row.price as number | null,
          barber: profileData
            ? {
                id: profileData.id as string,
                name: profileData.name as string,
                initials: profileData.initials as string,
                color: profileData.color as 'blue' | 'purple' | 'green' | 'yellow',
              }
            : null,
        }
      })

      if (pageNum === 0) {
        setAppointments(rows)
      } else {
        setAppointments((prev) => [...prev, ...rows])
      }

      setTotal(count || 0)
      setHasMore((pageNum + 1) * PAGE_SIZE < (count || 0))
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        toast.error('Error al cargar historial')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadAppointments(next)
  }

  const toggleBarberFilter = (id: string) => {
    const others = Object.entries(activeBarberFilters).some(([k, v]) => k !== id && v)
    if (!others && activeBarberFilters[id]) return
    setActiveBarberFilters((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleStatusFilter = (key: string) => {
    setActiveStatusFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-UY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const statusKeys = ['completed', 'done', 'walkin', 'cancelled', 'pending', 'confirmed', 'no_show']

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Historial de cortes</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {loading ? 'Cargando...' : `${total} registros encontrados`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Buscador */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" viewBox="0 0 14 14" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-text-muted rounded-lg pl-8 pr-3 py-2 text-xs w-48 focus:outline-none focus:border-[#555]"
            />
          </div>
          {/* Fecha desde */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Desde</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#222] border-[0.5px] border-[#333] text-text-primary rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#555]"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-text-muted">Hasta</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#222] border-[0.5px] border-[#333] text-text-primary rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#555]"
            />
          </div>
          {(dateFrom || dateTo || search) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setSearch('') }}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Filtros de barbero y estado */}
      <div className="bg-[#161616] border-b-[0.5px] border-border-default px-5 py-2 flex items-center gap-3 flex-shrink-0 flex-wrap">
        {/* Filtros barbero */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-[0.06em]">Barbero:</span>
          {barbers.map((b) => {
            const isActive = activeBarberFilters[b.id]
            const colorMap: Record<string, string> = {
              yellow: 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow',
              blue: 'bg-[#1a2e3a] text-accent-blue border-[#2a4a6a]',
              purple: 'bg-[#2e1a3a] text-[#b48af5] border-[#3a2a4a]',
              green: 'bg-[#1a3a2e] text-accent-green border-[#2a4a3a]',
            }
            return (
              <button
                key={b.id}
                onClick={() => toggleBarberFilter(b.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border-[0.5px] transition-all select-none ${
                  isActive
                    ? colorMap[b.color] || colorMap.blue
                    : 'bg-transparent text-[#555] border-[#2e2e2e] hover:border-[#444] hover:text-[#888]'
                }`}
              >
                <BarberAvatar initials={b.initials} color={b.color} size="sm" className="w-[16px] h-[16px] text-[8px]" />
                {b.name}
              </button>
            )
          })}
        </div>

        <div className="w-[0.5px] h-4 bg-border-default flex-shrink-0" />

        {/* Filtros estado */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-text-muted uppercase tracking-[0.06em]">Estado:</span>
          {statusKeys.map((key) => {
            const cfg = statusConfig[key]
            const isActive = activeStatusFilters[key]
            return (
              <button
                key={key}
                onClick={() => toggleStatusFilter(key)}
                className={`px-2.5 py-1 rounded-full text-[11px] border-[0.5px] transition-all select-none ${
                  isActive
                    ? `${cfg.bg} ${cfg.text} border-current`
                    : 'bg-transparent text-[#555] border-[#2e2e2e] hover:border-[#444] hover:text-[#888]'
                }`}
              >
                {cfg.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto">
        {loading && appointments.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-text-secondary text-sm">Cargando historial...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <svg className="w-10 h-10 text-text-muted opacity-40" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M13 14h14M13 20h10M13 26h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-text-secondary text-sm">No hay cortes con los filtros aplicados</p>
            <p className="text-text-muted text-xs">Probá cambiando el rango de fechas o los filtros</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-[#161616] border-b-[0.5px] border-border-default">
              <tr>
                {['Fecha', 'Hora', 'Cliente', 'Barbero', 'Estado', 'Precio'].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-left text-[10px] text-text-muted uppercase tracking-[0.06em] font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt, idx) => {
                const statusKey = apt.is_walkin ? 'walkin' : apt.status
                const cfg = statusConfig[statusKey] || statusConfig.pending
                return (
                  <tr
                    key={apt.id}
                    className={`border-b-[0.5px] border-[#1e1e1e] hover:bg-[#1e1e1e] transition-colors ${idx % 2 === 0 ? '' : 'bg-[#161616]'}`}
                  >
                    <td className="px-4 py-3 text-xs text-text-secondary">{formatDateDisplay(apt.appointment_date)}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary font-mono">{apt.appointment_time?.slice(0, 5)}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-text-primary">{apt.client_name || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {apt.barber ? (
                        <div className="flex items-center gap-2">
                          <BarberAvatar
                            initials={apt.barber.initials}
                            color={apt.barber.color}
                            size="sm"
                            className="w-6 h-6 text-[9px]"
                          />
                          <span className="text-xs text-text-secondary">{apt.barber.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-[5px] ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${apt.price ? 'text-text-primary' : 'text-text-muted'}`}>
                        {apt.price ? formatCurrency(apt.price) : '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Paginación */}
        {hasMore && (
          <div className="flex justify-center py-5">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-[#222] border-[0.5px] border-[#333] text-text-secondary rounded-lg px-6 py-2 text-xs hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : `Ver más (${total - appointments.length} restantes)`}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
