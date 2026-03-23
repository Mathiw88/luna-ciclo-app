'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

export default function MisFinanzasPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState({ gross: 0, advances: 0, net: 0 })
  const [stats, setStats] = useState({ cuts: 0, revenue: 0, commission: 0, earned: 0 })
  const [advances, setAdvances] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener perfil del barbero
      const { data: profile } = await supabase
        .from('profiles')
        .select('commission_pct')
        .eq('id', user.id)
        .single()

      // Fecha inicio del mes
      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Obtener ingresos del mes
      const { data: incomes } = await supabase
        .from('income_records')
        .select('barber_amount, total_amount')
        .eq('barber_id', user.id)
        .gte('date', periodStart)

      const grossAmount = (incomes || []).reduce((sum, inc) => sum + inc.barber_amount, 0)
      const totalRevenue = (incomes || []).reduce((sum, inc) => sum + inc.total_amount, 0)

      // Obtener adelantos
      const { data: advancesData } = await supabase
        .from('advances')
        .select('id, amount, note, created_at')
        .eq('barber_id', user.id)
        .order('created_at', { ascending: false })

      const totalAdvances = (advancesData || []).reduce((sum, a) => sum + a.amount, 0)

      // Obtener liquidaciones
      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('barber_id', user.id)
        .order('paid_at', { ascending: false })

      setBalance({
        gross: grossAmount,
        advances: totalAdvances,
        net: grossAmount - totalAdvances,
      })

      setStats({
        cuts: incomes?.length || 0,
        revenue: totalRevenue,
        commission: profile?.commission_pct || 0,
        earned: grossAmount,
      })

      setAdvances(advancesData || [])
      setPayouts(payoutsData || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const periods = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'quarter', label: 'Últimos 3 meses' },
  ]

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  }

  const formatPeriod = (from: string, to: string) => {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    return `${fromDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} - ${toDate.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Mis finanzas</h1>
        <p className="text-sm text-text-secondary mt-1">
          Tus ganancias, adelantos y liquidaciones
        </p>
      </div>

      {/* Saldo destacado */}
      <div className="bg-gradient-to-br from-accent-blue to-[#4a9fd4] rounded-xl p-6 border-[0.5px] border-accent-blue/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-white/70 uppercase tracking-[0.06em] mb-1.5">
              Tu saldo disponible
            </div>
            <div className="text-4xl font-semibold text-white mb-2">
              {formatCurrency(balance.net)}
            </div>
            <div className="text-xs text-white/80">
              Ganaste {formatCurrency(balance.gross)}, recibiste {formatCurrency(balance.advances)} en adelantos
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs de período */}
      <div className="flex gap-2 pb-2 border-b-[0.5px] border-border-default overflow-x-auto">
        {periods.map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedPeriod === period.id
                ? 'bg-accent-blue text-bg-base'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Resumen del período */}
      <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-5">
        <h2 className="text-sm font-medium text-text-primary mb-4">Resumen del período</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-[0.06em] mb-1.5">
              Cortes realizados
            </div>
            <div className="text-2xl font-semibold text-text-primary">{stats.cuts}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-[0.06em] mb-1.5">
              Ingresos brutos
            </div>
            <div className="text-2xl font-semibold text-text-primary">
              {formatCurrency(stats.revenue)}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-[0.06em] mb-1.5">
              Tu comisión
            </div>
            <div className="text-2xl font-semibold text-accent-blue">{stats.commission}%</div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-[0.06em] mb-1.5">
              Ganaste
            </div>
            <div className="text-2xl font-semibold text-accent-green">
              {formatCurrency(stats.earned)}
            </div>
          </div>
        </div>
      </div>

      {/* Adelantos recibidos */}
      <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b-[0.5px] border-border-default">
          <h2 className="text-sm font-medium text-text-primary">Adelantos recibidos</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Dinero que ya recibiste por adelantado
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-border-subtle">
                <th className="text-left px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Fecha
                </th>
                <th className="text-left px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Monto
                </th>
                <th className="text-left px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Nota
                </th>
                <th className="text-left px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Registrado por
                </th>
              </tr>
            </thead>
            <tbody>
              {advances.map((advance) => (
                <tr key={advance.id} className="border-b-[0.5px] border-border-subtle last:border-0">
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {formatDateShort(advance.created_at)}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-accent-blue">
                    {formatCurrency(advance.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-muted">
                    {advance.note || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    Dueño
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-bg-base/50">
                <td className="px-5 py-3.5 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Total
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold text-accent-blue">
                  {formatCurrency(balance.advances)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Liquidaciones (historial) */}
      <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b-[0.5px] border-border-default">
          <h2 className="text-sm font-medium text-text-primary">Liquidaciones</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Historial de pagos completos (cierres de período)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-border-subtle">
                <th className="text-left px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Período
                </th>
                <th className="text-right px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Bruto
                </th>
                <th className="text-right px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Adelantos
                </th>
                <th className="text-right px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Neto pagado
                </th>
                <th className="text-left px-5 py-3 text-xs text-text-muted uppercase tracking-[0.06em] font-medium">
                  Fecha de pago
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout) => (
                <tr key={payout.id} className="border-b-[0.5px] border-border-subtle last:border-0">
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {formatPeriod(payout.periodFrom, payout.periodTo)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-text-primary">
                    {formatCurrency(payout.gross)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right text-status-danger">
                    -{formatCurrency(payout.advances)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-right font-medium text-accent-green">
                    {formatCurrency(payout.net)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">
                    {formatDateShort(payout.paid_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {payouts.length === 0 && (
          <div className="px-5 py-8 text-center">
            <div className="text-sm text-text-muted">No hay liquidaciones registradas aún</div>
          </div>
        )}
      </div>
    </div>
  )
}