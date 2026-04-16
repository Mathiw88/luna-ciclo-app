'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AdvanceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    barberId: string
    barberName: string
    amount: number
    note: string
  }) => void
}

type Barber = {
  id: string
  initials: string
  name: string
  color: 'blue' | 'purple' | 'green'
  availableBalance: number
}

export default function AdvanceModal({ isOpen, onClose, onConfirm }: AdvanceModalProps) {
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isOpen) return

    const fetchBarbers = async () => {
      const supabase = createClient()
      setLoading(true)

      try {
        // Obtener barberos de la barbería
        const { data: barbersData, error } = await supabase
          .from('profiles')
          .select('id, name, initials, color, commission_pct')
          .eq('role', 'barber')
          .eq('is_active', true)

        if (error) throw error

        // Mapear a nuestro formato (por ahora con balance mock)
        const mappedBarbers: Barber[] = (barbersData || []).map((b) => {
          return {
            id: b.id,
            initials: b.initials || '??',
            name: b.name || 'Sin nombre',
            color: (b.color as 'blue' | 'purple' | 'green') || 'blue',
            availableBalance: 10000, // Mock por ahora, después calculamos el real
          }
        })

        setBarbers(mappedBarbers)
      } catch (error) {
        console.error('Error al cargar barberos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarbers()
  }, [isOpen])

  if (!isOpen) return null

  const selectedBarber = barbers.find(b => b.id === selectedBarberId)
  const amountNum = parseFloat(amount) || 0
  const isValid = selectedBarberId && amountNum > 0 && amountNum <= (selectedBarber?.availableBalance || 0)

  const handleConfirm = () => {
    if (!isValid || !selectedBarberId || !selectedBarber) return

    onConfirm({
      barberId: selectedBarberId,
      barberName: selectedBarber.name,
      amount: amountNum,
      note: note.trim(),
    })

    // Reset form
    setSelectedBarberId(null)
    setAmount('')
    setNote('')
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
      <div className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl w-full max-w-[580px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-border-default">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Registrar adelanto</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Adelanto de sueldo a barbero
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
          {/* Seleccionar barbero */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Seleccionar barbero *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {loading ? (
                <div className="col-span-3 text-center py-8 text-text-muted text-sm">
                  Cargando barberos...
                </div>
              ) : barbers.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-text-muted text-sm">
                  No hay barberos disponibles
                </div>
              ) : (
                barbers.map((barber) => {
                  const isSelected = selectedBarberId === barber.id
                  return (
                    <button
                      key={barber.id}
                      onClick={() => setSelectedBarberId(barber.id)}
                      className={`relative p-3 rounded-lg border-[0.5px] transition-all ${
                        isSelected
                          ? 'bg-accent-yellow-dim border-accent-yellow'
                          : 'bg-bg-base border-border-default hover:border-[#444]'
                      }`}
                    >
                      {/* Check icon */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-accent-yellow rounded-full flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l2.5 2.5L9 1" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}

                      <div className="flex flex-col items-center gap-2">
                        <BarberAvatar
                          initials={barber.initials}
                          color={barber.color}
                          size="xl"
                          className="w-12 h-12"
                        />
                        <div className="text-center">
                          <div className="text-xs font-medium text-text-primary">{barber.name}</div>
                          <div className="text-[10px] text-text-muted mt-0.5">
                            Disponible: {formatCurrency(barber.availableBalance)}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Monto del adelanto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                max={selectedBarber?.availableBalance || 0}
                className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
              />
            </div>
            {selectedBarber && amountNum > selectedBarber.availableBalance && (
              <p className="text-xs text-status-danger mt-1.5">
                El monto excede el saldo disponible ({formatCurrency(selectedBarber.availableBalance)})
              </p>
            )}
          </div>

          {/* Nota opcional */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Motivo del adelanto"
              className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
            />
          </div>

          {/* Preview */}
          {selectedBarber && amountNum > 0 && amountNum <= selectedBarber.availableBalance && (
            <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Barbero</span>
                <span className="text-sm font-medium text-text-primary">{selectedBarber.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Saldo actual</span>
                <span className="text-sm font-medium text-text-primary">
                  {formatCurrency(selectedBarber.availableBalance)}
                </span>
              </div>
              <div className="h-[0.5px] bg-border-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Adelanto a entregar</span>
                <span className="text-sm font-medium text-accent-yellow">
                  -{formatCurrency(amountNum)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-text-secondary">Nuevo saldo</span>
                <span className="text-base font-semibold text-accent-green">
                  {formatCurrency(selectedBarber.availableBalance - amountNum)}
                </span>
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
            disabled={!isValid}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isValid
                ? 'bg-accent-yellow text-bg-base hover:bg-[#e6b83a]'
                : 'bg-[#222] text-[#555] cursor-not-allowed'
            }`}
          >
            Registrar adelanto
          </button>
        </div>
      </div>
    </div>
  )
}
