'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import WalkInModal from '@/components/owner/WalkInModal'
import { formatCurrency, calculateIncome } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Period = 'today' | 'week' | 'month' | 'prev-month' | 'next-month'

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)

  const handleWalkInConfirm = async (data: {
    clientName: string
    barberId: string
    time: string
    amount: number
  }) => {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Error', { description: 'Debes estar autenticado' })
        return
      }

      // Obtener el perfil del dueño para tener barbershop_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.barbershop_id) {
        toast.error('Error al obtener información de la barbería')
        return
      }

      // Obtener comisión del barbero
      const { data: barber, error: barberError } = await supabase
        .from('profiles')
        .select('commission_pct')
        .eq('id', data.barberId)
        .single()

      if (barberError || !barber) {
        toast.error('Error al obtener información del barbero')
        return
      }

      const today = new Date().toISOString().split('T')[0]

      // Crear appointment walk-in (marcado como DONE porque ya se realizó, pero sin cobrar aún)
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: profile.barbershop_id,
          barber_id: data.barberId,
          client_id: null,
          client_name: data.clientName,
          appointment_date: today,
          appointment_time: data.time,
          status: 'done', // 'done' = realizado pero sin cobrar
          is_walkin: true,
        })
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // Solo crear income_record si hay monto ingresado
      if (data.amount && data.amount > 0) {
        // Calcular montos
        const income = calculateIncome(data.amount, barber.commission_pct)

        // Insertar income_record vinculado al appointment
        const { error: incomeError } = await supabase
          .from('income_records')
          .insert({
            barbershop_id: profile.barbershop_id,
            barber_id: data.barberId,
            appointment_id: appointment.id,
            date: today,
            total_amount: data.amount,
            barber_amount: income.barberAmount,
            shop_amount: income.shopAmount,
            commission_pct: barber.commission_pct,
          })

        if (incomeError) throw incomeError

        toast.success('Corte registrado y cobrado', {
          description: `${data.time} - $${formatCurrency(data.amount)} - ${data.clientName}`,
        })
      } else {
        toast.success('Corte registrado', {
          description: `${data.time} - ${data.clientName} - Pendiente de cobro`,
        })
      }

      // TODO: Recargar dashboard con datos reales
    } catch (error) {
      console.error('Error al registrar corte walk-in:', error)
      toast.error('Error al registrar corte')
    }
  }

  // Mock data - esto se reemplazará con datos reales de Supabase
  const metrics = {
    revenue: 8450,
    cuts: 14,
    shopAmount: 4225,
    shopPct: 50,
    barbersToPay: 4225,
    barbersCount: 3,
  }

  const todayAppointments = [
    { time: '09:00', client: 'Nicolás Fernández', barber: 'Lucas M.', status: 'done', price: 600 },
    { time: '10:30', client: 'Mateo Álvarez', barber: 'Rodrigo P.', status: 'done', price: 500 },
    { time: '14:00', client: 'Sebastián Torres', barber: 'Lucas M.', status: 'next', price: null },
    { time: '15:30', client: 'Andrés Méndez', barber: 'Facundo G.', status: 'pending', price: null },
    { time: '11:15', client: 'Cliente por llegada', barber: 'Rodrigo P.', status: 'walkin', price: 450 },
  ]

  const barbersToday = [
    { initials: 'LM', name: 'Lucas M.', cuts: 6, pct: 50, earned: 1800, total: 3600, progress: 75, color: 'blue' as const },
    { initials: 'RP', name: 'Rodrigo P.', cuts: 5, pct: 50, earned: 1500, total: 3000, progress: 60, color: 'purple' as const },
    { initials: 'FG', name: 'Facundo G.', cuts: 3, pct: 45, earned: 855, total: 1900, progress: 40, color: 'green' as const },
  ]

  const statusColors = {
    done: { bg: 'bg-[#0d3326]', text: 'text-status-done', bar: 'bg-status-done', label: 'LISTO' },
    next: { bg: 'bg-accent-yellow-dim', text: 'text-accent-yellow', bar: 'bg-accent-yellow', label: 'PRÓXIMO' },
    pending: { bg: 'bg-[#222]', text: 'text-[#888]', bar: 'bg-[#555]', label: 'PENDIENTE' },
    walkin: { bg: 'bg-accent-blue-dim', text: 'text-accent-blue', bar: 'bg-accent-blue', label: 'WALK-IN' },
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Dashboard</h1>
          <p className="text-xs text-text-secondary mt-0.5">Viernes, 20 de marzo de 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-[#222] text-[#ccc] border-[0.5px] border-[#333] rounded-lg px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-[#2a2a2a] transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3 6.5l3.5 3.5 3.5-3.5M1 11h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exportar
          </button>
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="bg-accent-yellow text-bg-base rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-[#e6b83a] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v9M2 6.5h9" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Ingreso por llegada
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Tabs de período */}
        <div className="flex gap-1.5 mb-4">
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
        <div className="grid grid-cols-4 gap-2.5 mb-4">
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M7 4v3.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Recaudado hoy
            </div>
            <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.revenue)}</div>
            <div className="text-[11px] text-accent-green mt-1">↑ 12% vs ayer</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <path d="M2 12L5 5l3 4 2-2.5L13 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cortes realizados
            </div>
            <div className="text-[22px] font-medium text-text-primary">{metrics.cuts}</div>
            <div className="text-[11px] text-accent-green mt-1">↑ 2 más que ayer</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">
              <svg className="w-3.5 h-3.5 opacity-50" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 6h12" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
              Para la barbería
            </div>
            <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.shopAmount)}</div>
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
            <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.barbersToPay)}</div>
            <div className="text-[11px] text-accent-yellow mt-1">{metrics.barbersCount} barberos activos</div>
          </div>
        </div>

        {/* Dos columnas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Agenda de hoy */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-sm font-medium text-[#e0e0e0]">Agenda de hoy</span>
              <span className="text-xs text-accent-yellow cursor-pointer hover:underline">Ver completa →</span>
            </div>

            <div className="space-y-0">
              {todayAppointments.map((apt, idx) => {
                const status = statusColors[apt.status as keyof typeof statusColors]
                return (
                  <div key={idx} className="flex items-start gap-2.5 py-2.5 border-b-[0.5px] border-[#222] last:border-0">
                    <span className="text-xs text-text-muted w-10 flex-shrink-0 pt-0.5">{apt.time}</span>
                    <div className={`w-[3px] rounded-sm self-stretch min-h-[36px] ${status.bar}`} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-[#e0e0e0]">{apt.client}</div>
                      <div className="text-[11px] text-text-muted">con {apt.barber}</div>
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
          </div>

          {/* Barberos hoy */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-sm font-medium text-[#e0e0e0]">Barberos — hoy</span>
              <span className="text-xs text-accent-yellow cursor-pointer hover:underline">Ver todos →</span>
            </div>

            <div className="space-y-0">
              {barbersToday.map((barber, idx) => (
                <div key={idx} className="flex items-center gap-2.5 py-2.5 border-b-[0.5px] border-[#222] last:border-0">
                  <BarberAvatar initials={barber.initials} color={barber.color} size="md" />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium text-[#e0e0e0]">{barber.name}</div>
                    <div className="text-[11px] text-text-muted">{barber.cuts} cortes · {barber.pct}%</div>
                    <div className="h-[3px] bg-[#222] rounded-sm mt-1.5">
                      <div
                        className={`h-full rounded-sm ${barber.color === 'blue' ? 'bg-accent-blue' : barber.color === 'purple' ? 'bg-accent-purple' : 'bg-accent-green'}`}
                        style={{ width: `${barber.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">{formatCurrency(barber.earned)}</div>
                    <div className="text-[11px] text-text-muted">de {formatCurrency(barber.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onConfirm={handleWalkInConfirm}
      />
    </>
  )
}
