'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import AdvanceModal from '@/components/owner/AdvanceModal'
import PayoutModal from '@/components/owner/PayoutModal'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type Barber = {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green'
  commission_pct: number
}

type Advance = {
  id: string
  amount: number
  note: string | null
  created_at: string
}

type BarberBalance = {
  barber: Barber
  gross: number
  advances: number
  net: number
  advancesList: Advance[]
}

export default function FinanzasBarberosPage() {
  const [balances, setBalances] = useState<BarberBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [selectedBarberForPayout, setSelectedBarberForPayout] = useState<BarberBalance | null>(null)

  useEffect(() => {
    fetchBalances()
  }, [])

  const fetchBalances = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      console.log('Iniciando fetch de balances...')

      // Obtener barberos
      const { data: barbers, error: barbersError } = await supabase
        .from('profiles')
        .select('id, name, initials, color, commission_pct')
        .eq('role', 'barber')
        .eq('is_active', true)

      if (barbersError) {
        console.error('Error barberos:', barbersError)
        throw barbersError
      }

      console.log('Barberos:', barbers)

      const balancesData: BarberBalance[] = []

      for (const barber of barbers || []) {
        // Calcular fecha de inicio del mes
        const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split('T')[0]

        // Obtener ingresos del barbero desde el inicio del mes
        const { data: incomes, error: incomeError } = await supabase
          .from('income_records')
          .select('barber_amount')
          .eq('barber_id', barber.id)
          .gte('date', periodStart)

        if (incomeError) {
          console.error('Error ingresos:', incomeError)
          throw incomeError
        }

        const grossAmount = (incomes || []).reduce((sum, inc) => sum + inc.barber_amount, 0)

        // Obtener adelantos
        const { data: advances, error: advError } = await supabase
          .from('advances')
          .select('id, amount, note, created_at')
          .eq('barber_id', barber.id)
          .order('created_at', { ascending: false })

        if (advError) {
          console.error('Error adelantos:', advError)
          throw advError
        }

        const totalAdvances = (advances || []).reduce((sum, a) => sum + a.amount, 0)

        balancesData.push({
          barber: {
            id: barber.id,
            name: barber.name,
            initials: barber.initials,
            color: barber.color as any,
            commission_pct: barber.commission_pct,
          },
          gross: grossAmount,
          advances: totalAdvances,
          net: grossAmount - totalAdvances,
          advancesList: advances || [],
        })
      }

      console.log('Balances calculados:', balancesData)
      setBalances(balancesData)
    } catch (error) {
      console.error('Error general:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAdvanceConfirm = async (data: { barberId: string; barberName: string; amount: number; note: string }) => {
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Error', { description: 'Debes estar autenticado' })
        return
      }

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

      fetchBalances()
    } catch (error) {
      console.error('Error al registrar adelanto:', error)
      toast.error('Error al registrar adelanto')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleOpenPayoutModal = (balance: BarberBalance) => {
    setSelectedBarberForPayout(balance)
    setIsPayoutModalOpen(true)
  }

  const handlePayoutConfirm = async () => {
    if (!selectedBarberForPayout) return

    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Error', { description: 'Debes estar autenticado' })
        return
      }

      // Crear el payout (liquidación)
      const { error: payoutError } = await supabase
        .from('payouts')
        .insert({
          barber_id: selectedBarberForPayout.barber.id,
          period_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
          period_to: new Date().toISOString().split('T')[0],
          gross_amount: selectedBarberForPayout.gross,
          advances_amount: selectedBarberForPayout.advances,
          net_amount: selectedBarberForPayout.net,
          paid_by: user.id,
        })

      if (payoutError) throw payoutError

      toast.success('Período liquidado', {
        description: `${selectedBarberForPayout.barber.name} - $${formatCurrency(selectedBarberForPayout.net)}`,
      })

      // Recargar balances
      fetchBalances()
      setSelectedBarberForPayout(null)
    } catch (error) {
      console.error('Error al liquidar:', error)
      toast.error('Error al liquidar período')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Cargando...</div>
      </div>
    )
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Adelantos y liquidaciones</h1>
          <p className="text-xs text-text-secondary mt-0.5">Gestión de pagos y saldos de barberos</p>
        </div>
        <button
          onClick={() => setIsAdvanceModalOpen(true)}
          className="bg-accent-yellow text-bg-base border-[0.5px] border-accent-yellow/30 rounded-lg px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-[#e6b83a] transition-colors font-medium"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Registrar adelanto
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {balances.map((balance) => (
          <div key={balance.barber.id} className="bg-bg-surface border-[0.5px] border-border-default rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b-[0.5px] border-border-default flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarberAvatar
                  initials={balance.barber.initials}
                  color={balance.barber.color}
                  size="lg"
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">{balance.barber.name}</div>
                  <div className="text-xs text-text-muted">Comisión {balance.barber.commission_pct}%</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] text-text-muted uppercase">Bruto</div>
                  <div className="text-lg font-medium text-text-primary">${formatCurrency(balance.gross)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-text-muted uppercase">Adelantos</div>
                  <div className="text-lg font-medium text-status-danger">-${formatCurrency(balance.advances)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-text-muted uppercase">Neto</div>
                  <div className={`text-xl font-semibold ${balance.net > 0 ? 'text-accent-green' : 'text-text-muted'}`}>
                    ${formatCurrency(balance.net)}
                  </div>
                </div>
                <button
                  onClick={() => handleOpenPayoutModal(balance)}
                  disabled={balance.net <= 0}
                  className={`rounded-lg px-3.5 py-2 text-xs font-medium border-[0.5px] transition-colors ${
                    balance.net > 0
                      ? 'bg-accent-green text-bg-base border-accent-green/30 hover:bg-[#45c48e]'
                      : 'bg-[#222] text-[#555] border-[#333] cursor-not-allowed'
                  }`}
                >
                  Liquidar
                </button>
              </div>
            </div>

            {/* Tabla */}
            {balance.advancesList.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="border-b-[0.5px] border-border-subtle bg-bg-base/50">
                    <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">Fecha</th>
                    <th className="text-right text-[10px] text-text-muted uppercase px-5 py-2">Monto</th>
                    <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {balance.advancesList.map((adv) => (
                    <tr key={adv.id} className="border-b-[0.5px] border-border-subtle last:border-0">
                      <td className="px-5 py-3 text-xs text-text-secondary">{formatDate(adv.created_at)}</td>
                      <td className="px-5 py-3 text-sm font-medium text-accent-yellow text-right">${formatCurrency(adv.amount)}</td>
                      <td className="px-5 py-3 text-xs text-text-muted">{adv.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-text-muted">
                No hay adelantos registrados
              </div>
            )}
          </div>
        ))}
      </div>

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onConfirm={handleAdvanceConfirm}
      />

      {selectedBarberForPayout && (
        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => {
            setIsPayoutModalOpen(false)
            setSelectedBarberForPayout(null)
          }}
          onConfirm={handlePayoutConfirm}
          barber={selectedBarberForPayout.barber}
          balance={{
            gross: selectedBarberForPayout.gross,
            advances: selectedBarberForPayout.advances,
            net: selectedBarberForPayout.net,
          }}
          advances={selectedBarberForPayout.advancesList}
          periodFrom={new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()}
          periodTo={new Date().toISOString()}
        />
      )}
    </>
  )
}
