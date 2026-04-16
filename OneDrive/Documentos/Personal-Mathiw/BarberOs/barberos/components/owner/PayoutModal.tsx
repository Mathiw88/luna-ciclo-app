'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency } from '@/lib/utils'

interface PayoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (confirmed: boolean) => void
  barber: {
    id: string
    name: string
    initials: string
    color: 'blue' | 'purple' | 'green'
  }
  balance: {
    gross: number
    advances: number
    net: number
  }
  advances: Array<{
    amount: number
    note: string | null
    created_at: string
  }>
  periodFrom: string
  periodTo: string
}

export default function PayoutModal({
  isOpen,
  onClose,
  onConfirm,
  barber,
  balance,
  advances,
  periodFrom,
  periodTo,
}: PayoutModalProps) {
  const [confirmed, setConfirmed] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (!confirmed) return
    onConfirm(true)
    setConfirmed(false)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl w-full max-w-[580px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-border-default">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Liquidar período</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Cierre de período y pago final
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Barbero */}
          <div className="flex items-center gap-3 pb-3 border-b-[0.5px] border-border-subtle">
            <BarberAvatar
              initials={barber.initials}
              color={barber.color}
              size="xl"
            />
            <div>
              <div className="text-sm font-medium text-text-primary">{barber.name}</div>
              <div className="text-xs text-text-muted mt-0.5">
                Período: {formatDate(periodFrom)} - {formatDate(periodTo)}
              </div>
            </div>
          </div>

          {/* Resumen financiero */}
          <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Total ganado (bruto)</span>
              <span className="text-sm font-medium text-text-primary">
                ${formatCurrency(balance.gross)}
              </span>
            </div>

            {advances.length > 0 && (
              <>
                <div className="h-[0.5px] bg-border-subtle" />
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-text-secondary">Adelantos descontados</span>
                    <span className="text-sm font-medium text-status-danger">
                      -${formatCurrency(balance.advances)}
                    </span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {advances.map((adv, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[11px] text-text-muted">
                          {formatDate(adv.created_at)}
                          {adv.note && ` · ${adv.note}`}
                        </span>
                        <span className="text-[11px] text-status-danger">
                          -${formatCurrency(adv.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="h-[0.5px] bg-border-default" />

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-secondary">Neto a entregar</span>
              <span className={`text-2xl font-semibold ${
                balance.net > 0 ? 'text-accent-green' : balance.net < 0 ? 'text-status-danger' : 'text-text-muted'
              }`}>
                ${formatCurrency(balance.net)}
              </span>
            </div>
          </div>

          {/* Advertencia si saldo negativo */}
          {balance.net < 0 && (
            <div className="bg-status-danger/10 border-[0.5px] border-status-danger/30 rounded-lg p-3">
              <div className="text-xs text-status-danger">
                ⚠️ El barbero tiene saldo negativo. Los adelantos superan lo ganado en este período.
              </div>
            </div>
          )}

          {/* Checkbox de confirmación */}
          <div className="bg-accent-yellow-dim border-[0.5px] border-accent-yellow/30 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-accent-yellow/50 bg-bg-base text-accent-yellow focus:ring-accent-yellow focus:ring-offset-0"
              />
              <div>
                <div className="text-xs font-medium text-accent-yellow">
                  Confirmo que el pago físico fue entregado
                </div>
                <div className="text-[11px] text-accent-yellow/70 mt-1">
                  Esta acción cerrará el período y marcará el saldo como pagado.
                  No se podrá deshacer.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t-[0.5px] border-border-default">
          <button
            onClick={onClose}
            className="flex-1 bg-[#222] text-text-secondary border-[0.5px] border-[#333] rounded-lg px-4 py-2 text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!confirmed}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              confirmed
                ? 'bg-accent-green text-bg-base hover:bg-[#45c48e]'
                : 'bg-[#222] text-[#555] cursor-not-allowed'
            }`}
          >
            Liquidar período
          </button>
        </div>
      </div>
    </div>
  )
}
