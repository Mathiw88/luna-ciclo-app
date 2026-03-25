'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import AdvanceModal from '@/components/owner/AdvanceModal'
import PayoutModal from '@/components/owner/PayoutModal'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type AvatarColor = 'blue' | 'purple' | 'green' | 'yellow'

type Person = {
  id: string
  name: string
  initials: string
  color: AvatarColor
  commission_pct: number
  role: 'owner' | 'barber'
}

type Advance = {
  id: string
  amount: number
  note: string | null
  created_at: string
}

type PersonBalance = {
  person: Person
  gross: number
  advances: number
  net: number
  advancesList: Advance[]
  lastPaidAt: string | null
  lastIncomeDate: string | null
}

type PayoutHistoryRow = {
  id: string
  period_from: string
  period_to: string
  gross_amount: number
  advances_amount: number
  net_amount: number
  paid_at: string
  profiles: { name: string } | null
}

export default function FinanzasBarberosPage() {
  const [balances, setBalances] = useState<PersonBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false)
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false)
  const [selectedPersonForPayout, setSelectedPersonForPayout] = useState<PersonBalance | null>(null)
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const fetchBalances = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Obtener el barbershop_id del usuario actual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('No autenticado')

      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (profileError || !currentProfile) throw new Error('No se encontro el perfil')

      const shopId = currentProfile.barbershop_id as string

      // Traer owners y barbers activos de esta barberia
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, initials, color, commission_pct, role')
        .eq('barbershop_id', shopId)
        .in('role', ['owner', 'barber'])
        .eq('is_active', true)

      if (profilesError) throw profilesError

      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const balancesData: PersonBalance[] = []

      for (const profile of profiles ?? []) {
        // Ingresos del periodo (filtrado por barbershop_id para respetar RLS)
        const { data: incomes, error: incomeError } = await supabase
          .from('income_records')
          .select('barber_amount, date')
          .eq('barbershop_id', shopId)
          .eq('barber_id', profile.id)
          .gte('date', periodStart)
          .order('date', { ascending: false })

        if (incomeError) throw incomeError

        const grossAmount = (incomes ?? []).reduce((sum, inc) => sum + inc.barber_amount, 0)
        const lastIncomeDate = incomes && incomes.length > 0 ? incomes[0].date : null

        // Adelantos (solo para barbers, owners no tienen)
        let advancesList: Advance[] = []
        let totalAdvances = 0

        if (profile.role === 'barber') {
          const { data: advances, error: advError } = await supabase
            .from('advances')
            .select('id, amount, note, created_at')
            .eq('barbershop_id', shopId)
            .eq('barber_id', profile.id)
            .gte('created_at', periodStart)
            .order('created_at', { ascending: false })

          if (advError) throw advError

          advancesList = advances ?? []
          totalAdvances = advancesList.reduce((sum, a) => sum + a.amount, 0)
        }

        // Ultimo pago (payout)
        const { data: lastPayoutData, error: payoutErr } = await supabase
          .from('payouts')
          .select('paid_at')
          .eq('barbershop_id', shopId)
          .eq('barber_id', profile.id)
          .order('paid_at', { ascending: false })
          .limit(1)

        if (payoutErr) throw payoutErr

        const lastPaidAt =
          lastPayoutData && lastPayoutData.length > 0 ? lastPayoutData[0].paid_at : null

        balancesData.push({
          person: {
            id: profile.id,
            name: profile.name,
            initials: profile.initials,
            color: profile.color as AvatarColor,
            commission_pct: profile.commission_pct,
            role: profile.role as 'owner' | 'barber',
          },
          gross: grossAmount,
          advances: totalAdvances,
          net: grossAmount - totalAdvances,
          advancesList,
          lastPaidAt,
          lastIncomeDate,
        })
      }

      // Owners primero, luego barbers
      balancesData.sort((a, b) => {
        if (a.person.role === b.person.role) return 0
        return a.person.role === 'owner' ? -1 : 1
      })

      setBalances(balancesData)

      // Historial de liquidaciones
      setHistoryLoading(true)
      const { data: historyData, error: historyError } = await supabase
        .from('payouts')
        .select('id, period_from, period_to, gross_amount, advances_amount, net_amount, paid_at, profiles(name)')
        .eq('barbershop_id', shopId)
        .order('paid_at', { ascending: false })
        .limit(50)

      if (historyError) throw historyError
      setPayoutHistory((historyData as unknown as PayoutHistoryRow[]) ?? [])
    } catch (error) {
      console.error('Error general:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  const handleAdvanceConfirm = async (data: {
    barberId: string
    barberName: string
    amount: number
    note: string
  }) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Error', { description: 'Debes estar autenticado' })
        return
      }

      const { error } = await supabase.from('advances').insert({
        barber_id: data.barberId,
        amount: data.amount,
        note: data.note || null,
        created_by: user.id,
      })

      if (error) throw error

      toast.success('Adelanto registrado', {
        description: `${formatCurrency(data.amount)} para ${data.barberName}`,
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
      minute: '2-digit',
    })
  }

  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} a las ${hours}:${minutes}`
  }

  const formatPeriod = (from: string, to: string) => {
    const f = new Date(from)
    const t = new Date(to)
    const fDay = f.getDate().toString().padStart(2, '0')
    const fMonth = (f.getMonth() + 1).toString().padStart(2, '0')
    const tDay = t.getDate().toString().padStart(2, '0')
    const tMonth = (t.getMonth() + 1).toString().padStart(2, '0')
    return `${fDay}/${fMonth} → ${tDay}/${tMonth}`
  }

  const handleOpenPayoutModal = (balance: PersonBalance) => {
    setSelectedPersonForPayout(balance)
    setIsPayoutModalOpen(true)
  }

  const handlePayoutConfirm = async () => {
    if (!selectedPersonForPayout) return

    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Error', { description: 'Debes estar autenticado' })
        return
      }

      const { error: payoutError } = await supabase.from('payouts').insert({
        barber_id: selectedPersonForPayout.person.id,
        period_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split('T')[0],
        period_to: new Date().toISOString().split('T')[0],
        gross_amount: selectedPersonForPayout.gross,
        advances_amount: selectedPersonForPayout.advances,
        net_amount: selectedPersonForPayout.net,
        paid_by: user.id,
      })

      if (payoutError) throw payoutError

      toast.success('Periodo liquidado', {
        description: `${selectedPersonForPayout.person.name} - ${formatCurrency(selectedPersonForPayout.net)}`,
      })

      fetchBalances()
      setSelectedPersonForPayout(null)
    } catch (error) {
      console.error('Error al liquidar:', error)
      toast.error('Error al liquidar periodo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Cargando...</div>
      </div>
    )
  }

  // Solo los barbers pueden recibir adelantos; se usa en el modal
  const barberBalances = balances.filter((b) => b.person.role === 'barber')

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Adelantos y liquidaciones</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Gestion de pagos y saldos del personal
          </p>
        </div>
        {barberBalances.length > 0 && (
          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="bg-accent-yellow text-bg-base border-[0.5px] border-accent-yellow/30 rounded-lg px-3.5 py-2 text-xs flex items-center gap-1.5 hover:bg-[#e6b83a] transition-colors font-medium"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Registrar adelanto
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {balances.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No hay personal registrado.
          </div>
        ) : (
          balances.map((balance) => {
            const isOwner = balance.person.role === 'owner'

            // Determinar si el barber esta en estado PAGADO
            const isPaid =
              balance.lastPaidAt != null &&
              (balance.lastIncomeDate == null || balance.lastPaidAt >= balance.lastIncomeDate)
            const showPaidState = isPaid && balance.net <= 0

            return (
              <div
                key={balance.person.id}
                className="bg-bg-surface border-[0.5px] border-border-default rounded-xl overflow-hidden"
              >
                {/* Header de la card */}
                <div className="px-5 py-4 border-b-[0.5px] border-border-default flex items-center justify-between relative">
                  {/* Badge PAGADO */}
                  {showPaidState && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-status-done bg-status-done/10 border border-status-done/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      PAGADO
                    </span>
                  )}

                  <div className="flex items-center gap-3">
                    <BarberAvatar
                      initials={balance.person.initials}
                      color={balance.person.color}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-text-primary">
                          {balance.person.name}
                        </div>
                        {isOwner && (
                          <span className="text-[10px] font-medium text-accent-yellow bg-[#3a2a00]/60 px-1.5 py-0.5 rounded uppercase">
                            Dueno
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted">
                        {isOwner
                          ? balance.person.commission_pct > 0
                            ? `Comision ${balance.person.commission_pct}%`
                            : 'Dueno de la barberia'
                          : `Comision ${balance.person.commission_pct}%`}
                      </div>
                      {/* Ultimo pago */}
                      {showPaidState && balance.lastPaidAt && (
                        <div className="text-[11px] text-text-muted mt-0.5">
                          Ultimo pago: {formatDateFull(balance.lastPaidAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[10px] text-text-muted uppercase">Bruto</div>
                      <div className={`text-lg font-medium ${showPaidState ? 'text-text-muted' : 'text-text-primary'}`}>
                        {showPaidState ? formatCurrency(0) : formatCurrency(balance.gross)}
                      </div>
                    </div>

                    {/* Adelantos: solo visible para barbers */}
                    {!isOwner && (
                      <div className="text-right">
                        <div className="text-[10px] text-text-muted uppercase">Adelantos</div>
                        <div className={`text-lg font-medium ${showPaidState ? 'text-text-muted' : 'text-status-danger'}`}>
                          -{showPaidState ? formatCurrency(0) : formatCurrency(balance.advances)}
                        </div>
                      </div>
                    )}

                    <div className="text-right">
                      <div className="text-[10px] text-text-muted uppercase">Neto</div>
                      <div className="text-xl font-semibold text-text-muted">
                        {showPaidState ? formatCurrency(0) : formatCurrency(balance.net)}
                      </div>
                    </div>

                    {/* Botones de accion */}
                    <div className="flex items-center gap-2">
                      {/* Adelanto: solo para barbers */}
                      {!isOwner && (
                        <button
                          onClick={() => {
                            setIsAdvanceModalOpen(true)
                          }}
                          className="rounded-lg px-3 py-2 text-xs font-medium border-[0.5px] transition-colors bg-accent-yellow-dim text-accent-yellow border-accent-yellow/30 hover:bg-[#3a2a00]/80"
                        >
                          + Adelanto
                        </button>
                      )}

                      {/* Liquidar o Ver historial */}
                      {showPaidState ? (
                        <a
                          href="#historial-liquidaciones"
                          className="rounded-lg px-3.5 py-2 text-xs font-medium border-[0.5px] transition-colors bg-[#222] text-[#555] border-[#333] cursor-default select-none"
                        >
                          Ver historial
                        </a>
                      ) : (
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
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabla de adelantos (solo barbers con adelantos, y no en estado pagado) */}
                {!isOwner && !showPaidState && balance.advancesList.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-[0.5px] border-border-subtle bg-bg-base/50">
                        <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">
                          Fecha
                        </th>
                        <th className="text-right text-[10px] text-text-muted uppercase px-5 py-2">
                          Monto
                        </th>
                        <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">
                          Nota
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {balance.advancesList.map((adv) => (
                        <tr key={adv.id} className="border-b-[0.5px] border-border-subtle last:border-0">
                          <td className="px-5 py-3 text-xs text-text-secondary">
                            {formatDate(adv.created_at)}
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-accent-yellow text-right">
                            {formatCurrency(adv.amount)}
                          </td>
                          <td className="px-5 py-3 text-xs text-text-muted">{adv.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : !isOwner && !showPaidState ? (
                  <div className="px-5 py-8 text-center text-sm text-text-muted">
                    No hay adelantos registrados
                  </div>
                ) : null}
              </div>
            )
          })
        )}

        {/* Historial de liquidaciones */}
        <div id="historial-liquidaciones" className="bg-bg-surface border-[0.5px] border-border-default rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b-[0.5px] border-border-default">
            <h2 className="text-sm font-medium text-text-primary">Historial de liquidaciones</h2>
            <p className="text-xs text-text-muted mt-0.5">Todas las liquidaciones registradas</p>
          </div>

          {historyLoading ? (
            <div className="px-5 py-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-4 bg-bg-base rounded animate-pulse" />
                  <div className="h-3 w-32 bg-bg-base rounded animate-pulse" />
                  <div className="h-3 w-24 bg-bg-base rounded animate-pulse" />
                  <div className="h-3 w-20 bg-bg-base rounded animate-pulse" />
                  <div className="h-3 w-16 bg-bg-base rounded animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : payoutHistory.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-text-muted">
              Sin liquidaciones registradas
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-[0.5px] border-border-subtle bg-bg-base/50">
                  <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2 w-8" />
                  <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">
                    Fecha pago
                  </th>
                  <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">
                    Barbero
                  </th>
                  <th className="text-left text-[10px] text-text-muted uppercase px-5 py-2">
                    Periodo
                  </th>
                  <th className="text-right text-[10px] text-text-muted uppercase px-5 py-2">
                    Bruto
                  </th>
                  <th className="text-right text-[10px] text-text-muted uppercase px-5 py-2">
                    Adelantos
                  </th>
                  <th className="text-right text-[10px] text-text-muted uppercase px-5 py-2">
                    Neto
                  </th>
                </tr>
              </thead>
              <tbody>
                {payoutHistory.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b-[0.5px] border-border-subtle last:border-0 cursor-pointer hover:bg-bg-surface"
                  >
                    <td className="px-5 py-3 w-8">
                      {/* Checkmark verde */}
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        className="text-status-done"
                      >
                        <path
                          d="M2.5 7L5.5 10L11.5 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {formatDateFull(row.paid_at)}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-primary font-medium">
                      {row.profiles?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary whitespace-nowrap">
                      {formatPeriod(row.period_from, row.period_to)}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary text-right whitespace-nowrap">
                      {formatCurrency(row.gross_amount)}
                    </td>
                    <td className="px-5 py-3 text-xs text-text-secondary text-right whitespace-nowrap">
                      -{formatCurrency(row.advances_amount)}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-status-done text-right whitespace-nowrap">
                      {formatCurrency(row.net_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AdvanceModal
        isOpen={isAdvanceModalOpen}
        onClose={() => setIsAdvanceModalOpen(false)}
        onConfirm={handleAdvanceConfirm}
      />

      {selectedPersonForPayout && (
        <PayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => {
            setIsPayoutModalOpen(false)
            setSelectedPersonForPayout(null)
          }}
          onConfirm={handlePayoutConfirm}
          barber={{
            ...selectedPersonForPayout.person,
            color: (selectedPersonForPayout.person.color === 'yellow' ? 'blue' : selectedPersonForPayout.person.color) as 'blue' | 'purple' | 'green',
          }}
          balance={{
            gross: selectedPersonForPayout.gross,
            advances: selectedPersonForPayout.advances,
            net: selectedPersonForPayout.net,
          }}
          advances={selectedPersonForPayout.advancesList}
          periodFrom={new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            1
          ).toISOString()}
          periodTo={new Date().toISOString()}
        />
      )}
    </>
  )
}
