'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency, calculateIncome } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface WalkInModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedDate?: string
}

type Barber = {
  id: string
  initials: string
  name: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
  commission: number
}

export default function WalkInModal({ isOpen, onClose, onConfirm, selectedDate }: WalkInModalProps) {
  const [clientName, setClientName] = useState('')
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const fetchBarbers = async () => {
      const supabase = createClient()
      setLoading(true)

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, initials, color, commission_pct')
          .eq('barbershop_id', 'a0000000-0000-0000-0000-000000000001')
          .eq('is_active', true)
          .order('role', { ascending: false })
          .order('name')

        if (error) throw error

        setBarbers((data || []).map(b => ({
          id: b.id,
          initials: b.initials,
          name: b.name,
          color: (b.color as 'blue' | 'purple' | 'green' | 'yellow') || 'blue',
          commission: b.commission_pct,
        })))
      } catch (error) {
        console.error('Error al cargar barberos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBarbers()
  }, [isOpen])

  // Cargar horarios disponibles cuando se selecciona un barbero
  useEffect(() => {
    if (!selectedBarberId) {
      setAvailableSlots([])
      setSelectedTime(null)
      return
    }

    const fetchAvailableSlots = async () => {
      const supabase = createClient()
      setLoadingSlots(true)

      try {
        const today = selectedDate || new Date().toISOString().split('T')[0]

        console.log('Fetching appointments for barber:', selectedBarberId, 'date:', today)

        // Obtener turnos ocupados hoy para este barbero
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('barber_id', selectedBarberId)
          .eq('appointment_date', today)

        console.log('Appointments response:', appointments, 'error:', error)

        if (error) throw error

        // Horarios posibles (cada 30 min de 9:00 a 20:00)
        const allSlots: string[] = []
        for (let hour = 9; hour < 20; hour++) {
          allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
          allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
        }

        // Filtrar ocupados - normalizar formato de hora (puede venir como "09:00:00" o "09:00")
        const occupiedTimes = new Set(
          (appointments || []).map(a => {
            const time = a.appointment_time
            return time.substring(0, 5) // Tomar solo HH:MM (sin segundos)
          })
        )

        const available = allSlots.filter(slot => !occupiedTimes.has(slot))

        setAvailableSlots(available)
      } catch (error) {
        console.error('Error al cargar horarios:', error)
      } finally {
        setLoadingSlots(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedBarberId])

  if (!isOpen) return null

  const selectedBarber = barbers.find(b => b.id === selectedBarberId)
  const amountNum = parseFloat(amount) || 0
  const income = selectedBarber ? calculateIncome(amountNum, selectedBarber.commission) : null

  const handleConfirm = async () => {
    if (!selectedBarberId || !selectedTime || !selectedBarber) return

    const supabase = createClient()
    const today = selectedDate || new Date().toISOString().split('T')[0]

    try {
      // 1. Crear el appointment
      const { data: appointmentData, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: 'a0000000-0000-0000-0000-000000000001',
          barber_id: selectedBarberId,
          appointment_date: today,
          appointment_time: selectedTime + ':00',
          client_name: clientName.trim() || 'Cliente walk-in',
          status: 'done',
          is_walkin: true,
          price: amountNum > 0 ? amountNum : null,
        })
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // 2. Crear income_record solo si se ingresó un monto
      if (amountNum > 0 && income) {
        const { error: incomeError } = await supabase
          .from('income_records')
          .insert({
            appointment_id: appointmentData.id,
            barber_id: selectedBarberId,
            barbershop_id: 'a0000000-0000-0000-0000-000000000001',
            total_amount: amountNum,
            barber_amount: income.barberAmount,
            shop_amount: income.shopAmount,
            commission_pct: selectedBarber.commission,
            date: today,
          })

        if (incomeError) throw incomeError
      }

      alert('✅ Corte walk-in registrado correctamente')

      // Reset form
      setClientName('')
      setSelectedBarberId(null)
      setSelectedTime(null)
      setAmount('')

      onConfirm()
      onClose()
    } catch (error) {
      console.error('Error creating walk-in:', error)
      alert('Error al registrar el corte')
    }
  }

  const isValid = selectedBarberId && selectedTime

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
            <h2 className="text-lg font-medium text-text-primary">Registrar corte walk-in</h2>
            <p className="text-xs text-text-secondary mt-0.5">Ingreso manual de corte por llegada</p>
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
          {/* Cliente */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Nombre del cliente (opcional)
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Sin nombre"
              className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
            />
          </div>

          {/* Barbero */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Seleccionar barbero *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {loading ? (
                <div className="col-span-3 text-center py-4 text-text-secondary text-sm">
                  Cargando barberos...
                </div>
              ) : barbers.length === 0 ? (
                <div className="col-span-3 text-center py-4 text-text-secondary text-sm">
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
                          <div className="text-[10px] text-text-muted mt-0.5">{barber.commission}% comisión</div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Horario */}
          {selectedBarberId && (
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
                Horario del corte *
              </label>
              {loadingSlots ? (
                <div className="text-center py-3 text-text-secondary text-sm">
                  Cargando horarios...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-3 text-center text-sm text-text-muted">
                  No hay horarios disponibles hoy
                </div>
              ) : (
                <>
                  <div className="text-xs text-text-muted mb-2">
                    {availableSlots.length} horarios disponibles
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-lg border-[0.5px] text-sm font-medium transition-all ${
                        selectedTime === slot
                          ? 'bg-accent-yellow-dim border-accent-yellow text-accent-yellow'
                          : 'bg-bg-base border-border-default text-text-primary hover:border-[#444]'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                </>
              )}
            </div>
          )}

          {/* Monto */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Monto del corte (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg pl-7 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
              />
            </div>
          </div>

          {/* Cálculo en tiempo real */}
          {income && amountNum > 0 && (
            <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">Total del corte</span>
                <span className="text-sm font-medium text-text-primary">${formatCurrency(amountNum)}</span>
              </div>
              <div className="h-[0.5px] bg-border-subtle" />
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">
                  Gana el barbero ({selectedBarber?.commission}%)
                </span>
                <span className="text-sm font-medium text-accent-green">${formatCurrency(income.barberAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-secondary">
                  Para la barbería ({100 - (selectedBarber?.commission || 0)}%)
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
            disabled={!isValid}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isValid
                ? 'bg-accent-yellow text-bg-base hover:bg-[#e6b83a]'
                : 'bg-[#222] text-[#555] cursor-not-allowed'
            }`}
          >
            Confirmar ingreso
          </button>
        </div>
      </div>
    </div>
  )
}
