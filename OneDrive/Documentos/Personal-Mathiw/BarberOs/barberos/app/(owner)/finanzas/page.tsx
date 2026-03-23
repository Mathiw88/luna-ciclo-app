'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import AdvanceModal from '@/components/owner/AdvanceModal'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Period = 'today' | 'week' | 'month' | 'prev-month' | 'next-month'

export default function FinanzasPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)

  const handleAdvanceConfirm = async (data: { barberId: string; barberName: string; amount: number; note: string }) => {
    const supabase = createClient()

    try {
      // Obtener el user ID del owner actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Error', { description: 'Debes estar autenticado' })
        return
      }

      // Insertar el adelanto en la base de datos
      const { error } = await supabase
        .from('advances')
        .insert({
          barber_id: data.barberId,
          amount: data.amount,
          note: data.note || null,
          created_by: user.id,
        })

      if (error) throw error

      toast.success('Adelanto registrado', {
        description: `$${formatCurrency(data.amount)} para ${data.barberName}`,
      })
    } catch (error) {
      console.error('Error al registrar adelanto:', error)
      toast.error('Error al registrar adelanto', {
        description: 'No se pudo guardar el adelanto. Intenta nuevamente.',
      })
    }
  }

  const metrics = {
    totalRevenue: 48200,
    totalCuts: 82,
    shopAmount: 24650,
    shopPct: 51,
    paidToBarbers: 23550,
    barbersCount: 3,
  }

  const dailyIncome = [
    { day: 'Lun', value: 6200 },
    { day: 'Mar', value: 5800 },
    { day: 'Mié', value: 7100 },
    { day: 'Jue', value: 8900 },
    { day: 'Vie', value: 8450 },
    { day: 'Sáb', value: 11750 },
  ]

  const maxValue = Math.max(...dailyIncome.map(d => d.value))
  const bestDay = dailyIncome.reduce((prev, current) => prev.value > current.value ? prev : current)

  const barbers = [
    { initials: 'LM', name: 'Lucas M.', cuts: 32, revenue: 19200, commission: 50, earned: 9600, shop: 9600, progress: 72, color: 'blue' as const },
    { initials: 'RP', name: 'Rodrigo P.', cuts: 28, revenue: 16800, commission: 50, earned: 8400, shop: 8400, progress: 58, color: 'purple' as const },
    { initials: 'FG', name: 'Facundo G.', cuts: 22, revenue: 12200, commission: 45, earned: 5490, shop: 6710, progress: 40, color: 'green' as const },
  ]

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Finanzas</h1>
          <p className="text-xs text-text-secondary mt-0.5">Resumen financiero de la barbería</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="bg-accent-yellow text-bg-base border-[0.5px] border-accent-yellow/30 rounded-lg px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-[#e6b83a] transition-colors font-medium"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Registrar adelanto
          </button>
          <button className="bg-[#222] text-[#ccc] border-[0.5px] border-[#333] rounded-lg px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-[#2a2a2a] transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v8M3 6.5l3.5 3.5 3.5-3.5M1 11h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Exportar PDF
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
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Total recaudado</div>
            <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="text-[11px] text-accent-green mt-1">↑ 9% vs semana anterior</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Cortes realizados</div>
            <div className="text-[22px] font-medium text-text-primary">{metrics.totalCuts}</div>
            <div className="text-[11px] text-accent-green mt-1">↑ 6 más que semana ant.</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Para la barbería</div>
            <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.shopAmount)}</div>
            <div className="text-[11px] text-accent-yellow mt-1">{metrics.shopPct}% promedio</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Pagado a barberos</div>
            <div className="text-[22px] font-medium text-text-primary">{formatCurrency(metrics.paidToBarbers)}</div>
            <div className="text-[11px] text-accent-yellow mt-1">{metrics.barbersCount} barberos activos</div>
          </div>
        </div>

        {/* Dos columnas: Gráfico + Resumen */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-3 mb-3">
          {/* Gráfico de barras */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="text-sm font-medium text-[#e0e0e0] mb-3.5">Ingresos por día</div>

            <div className="h-[180px] flex items-end gap-2 pb-5 relative">
              {dailyIncome.map((item, idx) => {
                const height = Math.round((item.value / maxValue) * 140)
                const isBest = item.value === bestDay.value

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-[#888] mb-0.5">
                      ${(item.value / 1000).toFixed(1)}k
                    </span>
                    <div
                      className={`w-full rounded-t ${isBest ? 'bg-accent-yellow' : 'bg-[#2a2a2a]'} relative overflow-hidden`}
                      style={{ height: `${height}px` }}
                    >
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t ${isBest ? 'bg-accent-yellow' : 'bg-[#3a6a8a]'}`}
                        style={{ height: '100%' }}
                      />
                    </div>
                    <span className="text-[10px] text-text-muted">{item.day}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Resumen semanal */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="text-sm font-medium text-[#e0e0e0] mb-3.5">Resumen semanal</div>

            <div className="space-y-0">
              {dailyIncome.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1">
                  <span className="text-xs text-text-secondary">{item.day}</span>
                  <span className={`text-[13px] font-medium ${item.value === bestDay.value ? 'text-accent-green' : 'text-[#e0e0e0]'}`}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}

              <div className="h-[0.5px] bg-border-default my-3.5" />

              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-text-secondary">Ticket promedio</span>
                <span className="text-[13px] font-medium text-accent-yellow">$587</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs text-text-secondary">Mejor día</span>
                <span className="text-[13px] font-medium text-accent-yellow">Sábado</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de detalle por barbero */}
        <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
          <div className="text-sm font-medium text-[#e0e0e0] mb-3.5">Detalle por barbero — esta semana</div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[0.5px] border-[#222]">
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Barbero</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Cortes</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Recaudado</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Comisión</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Ganó</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Barbería</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Progreso</th>
                </tr>
              </thead>
              <tbody>
                {barbers.map((barber, idx) => (
                  <tr key={idx} className="border-b-[0.5px] border-[#1e1e1e] last:border-0">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <BarberAvatar initials={barber.initials} color={barber.color} size="sm" />
                        <span className="text-xs font-medium text-[#e0e0e0]">{barber.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-xs text-[#ccc]">{barber.cuts}</td>
                    <td className="px-2 py-2.5 text-xs text-accent-yellow">{formatCurrency(barber.revenue)}</td>
                    <td className="px-2 py-2.5 text-xs text-[#ccc]">{barber.commission}%</td>
                    <td className="px-2 py-2.5 text-xs text-accent-green">{formatCurrency(barber.earned)}</td>
                    <td className="px-2 py-2.5 text-xs text-[#ccc]">{formatCurrency(barber.shop)}</td>
                    <td className="px-2 py-2.5">
                      <div className="w-20 h-[3px] bg-[#222] rounded-sm">
                        <div
                          className={`h-full rounded-sm ${
                            barber.color === 'blue' ? 'bg-accent-blue' :
                            barber.color === 'purple' ? 'bg-accent-purple' :
                            'bg-accent-green'
                          }`}
                          style={{ width: `${barber.progress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de adelantos */}
      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onConfirm={handleAdvanceConfirm}
      />
    </>
  )
}
