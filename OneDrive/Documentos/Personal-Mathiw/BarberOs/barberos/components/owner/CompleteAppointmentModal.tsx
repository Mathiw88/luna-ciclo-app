'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency, calculateIncome } from '@/lib/utils'

interface CompleteAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: { clientName: string; amount: number }) => void
  appointment: {
    id: string
    clientName: string
    time: string
    barber: {
      name: string
      initials: string
      color: 'blue' | 'purple' | 'green' | 'yellow'
      commission: number
    }
  } | null
}

export default function CompleteAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  appointment,
}: CompleteAppointmentModalProps) {
  const [clientName, setClientName] = useState('')
  const [amount, setAmount] = useState('')

  // Inicializar campos cuando se abre el modal
  useEffect(() => {
    if (appointment) {
      setClientName(appointment.clientName)
    }
  }, [appointment])

  if (!isOpen || !appointment) return null

  const amountNum = parseFloat(amount) || 0
  const income = amountNum > 0 ? calculateIncome(amountNum, appointment.barber.commission) : null

  const handleConfirm = () => {
    if (amountNum <= 0 || !clientName.trim()) return
    onConfirm({
      clientName: clientName.trim(),
      amount: amountNum,
    })
    setClientName('')
    setAmount('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl w-full max-w-[480px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-border-default">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Completar turno</h2>
            <p className="text-xs text-text-secondary mt-0.5">Ingresar detalles del servicio realizado</p>
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
          {/* Detalles del turno */}
          <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <BarberAvatar
                initials={appointment.barber.initials}
                color={appointment.barber.color}
                size="lg"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-text-primary">{appointment.barber.name}</div>
                <div className="text-xs text-text-muted">{appointment.barber.commission}% comisión</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-muted">Hora</div>
                <div className="text-sm font-medium text-accent-yellow">{appointment.time}</div>
              </div>
            </div>
          </div>

          {/* Nombre del cliente */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Nombre del cliente *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente"
              className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
            />
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Monto del servicio *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
              />
            </div>
          </div>

          {/* Cálculo en tiempo real */}
          {income && (
            <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Total del servicio</span>
                <span className="text-sm font-medium text-text-primary">${formatCurrency(amountNum)}</span>
              </div>
              <div className="h-[0.5px] bg-border-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">
                  Gana el barbero ({appointment.barber.commission}%)
                </span>
                <span className="text-sm font-medium text-accent-green">${formatCurrency(income.barberAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">
                  Para la barbería ({100 - appointment.barber.commission}%)
                </span>
                <span className="text-sm font-medium text-text-primary">${formatCurrency(income.shopAmount)}</span>
              </div>
            </div>
          )}
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
            disabled={amountNum <= 0 || !clientName.trim()}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              amountNum > 0 && clientName.trim()
                ? 'bg-accent-yellow text-bg-base hover:bg-[#e6b83a]'
                : 'bg-[#222] text-[#555] cursor-not-allowed'
            }`}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}
