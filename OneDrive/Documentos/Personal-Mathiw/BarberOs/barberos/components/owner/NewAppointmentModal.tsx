'use client'

import { useState, useEffect } from 'react'
import { X, Clock } from 'lucide-react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import Calendar from '@/components/shared/Calendar'
import { createClient } from '@/lib/supabase/client'

interface Barber {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
}

interface NewAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function NewAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
}: NewAppointmentModalProps) {
  const [step, setStep] = useState(1) // 1: barbero, 2: fecha/hora, 3: datos cliente
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loadingBarbers, setLoadingBarbers] = useState(true)

  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Datos del cliente
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')

  // Cargar barberos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadBarbers()
    } else {
      // Reset al cerrar
      setStep(1)
      setSelectedBarberId('')
      setSelectedDate('')
      setSelectedTime('')
      setClientName('')
      setClientPhone('')
      setClientEmail('')
      setNotes('')
    }
  }, [isOpen])

  const loadBarbers = async () => {
    setLoadingBarbers(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, initials, color')
      .eq('barbershop_id', 'a0000000-0000-0000-0000-000000000001')
      .eq('is_active', true)
      .order('role', { ascending: false }) // Owner primero
      .order('name')

    if (error) {
      console.error('Error loading barbers:', error)
    } else {
      setBarbers(data as Barber[])
    }
    setLoadingBarbers(false)
  }

  // Cargar slots disponibles cuando se selecciona barbero y fecha
  useEffect(() => {
    if (selectedBarberId && selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedBarberId, selectedDate])

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    const supabase = createClient()

    // Obtener appointments del barbero en esa fecha
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('barber_id', selectedBarberId)
      .eq('appointment_date', selectedDate)

    if (error) {
      console.error('Error loading appointments:', error)
      setAvailableSlots([])
      setLoadingSlots(false)
      return
    }

    // Generar todos los slots posibles (09:00 a 19:00, cada 30 min)
    const allSlots: string[] = []
    for (let hour = 9; hour < 19; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Filtrar ocupados (appointment_time viene como "09:00:00", necesitamos solo "09:00")
    const occupiedTimes = new Set((appointments || []).map((a: any) => a.appointment_time.slice(0, 5)))
    const available = allSlots.filter(slot => !occupiedTimes.has(slot))

    setAvailableSlots(available)
    setLoadingSlots(false)
  }

  const handleConfirm = async () => {
    if (!selectedBarberId || !selectedDate || !selectedTime || !clientName.trim()) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    const supabase = createClient()

    try {
      // Crear el appointment
      const { error } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: 'a0000000-0000-0000-0000-000000000001',
          barber_id: selectedBarberId,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          client_name: clientName,
          status: 'pending',
          is_walkin: false,
          notes: notes || null,
        })

      if (error) throw error

      alert('✅ Turno agendado correctamente')
      onConfirm()
      onClose()
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al agendar el turno')
    }
  }

  if (!isOpen) return null

  const canContinue = () => {
    if (step === 1) return selectedBarberId !== ''
    if (step === 2) return selectedDate !== '' && selectedTime !== ''
    if (step === 3) return clientName.trim() !== ''
    return false
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl w-full max-w-[600px] mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-border-default flex-shrink-0">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Nuevo turno</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {step === 1 && 'Selecciona el barbero'}
              {step === 2 && 'Selecciona fecha y horario'}
              {step === 3 && 'Datos del cliente'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 px-5 py-3 border-b-[0.5px] border-border-default flex-shrink-0">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= num
                  ? 'bg-accent-yellow text-bg-base'
                  : 'bg-[#222] text-text-muted'
              }`}>
                {num}
              </div>
              {num < 3 && <div className={`flex-1 h-[1px] mx-2 ${step > num ? 'bg-accent-yellow' : 'bg-[#222]'}`} />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Paso 1: Seleccionar barbero */}
          {step === 1 && (
            <div>
              {loadingBarbers ? (
                <div className="text-center py-8 text-text-secondary">Cargando barberos...</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {barbers.map((barber) => (
                    <button
                      key={barber.id}
                      onClick={() => setSelectedBarberId(barber.id)}
                      className={`border-[0.5px] rounded-lg p-4 transition-all ${
                        selectedBarberId === barber.id
                          ? 'bg-accent-yellow-dim border-accent-yellow'
                          : 'bg-bg-base border-border-default hover:border-[#444]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BarberAvatar
                          initials={barber.initials}
                          color={barber.color}
                          size="lg"
                        />
                        <div className="text-left">
                          <div className={`text-sm font-medium ${
                            selectedBarberId === barber.id ? 'text-accent-yellow' : 'text-text-primary'
                          }`}>
                            {barber.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Fecha y horario */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Fecha */}
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-3">
                  Fecha del turno *
                </label>
                <Calendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  minDate={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Horarios */}
              {selectedDate && (
                <div>
                  <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Horario disponible *
                  </label>
                  {loadingSlots ? (
                    <div className="text-center py-3 text-text-secondary text-sm">
                      Cargando horarios...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-3 text-center text-sm text-text-muted">
                      No hay horarios disponibles en esta fecha
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-text-muted mb-2">
                        {availableSlots.length} horarios disponibles
                      </div>
                      <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
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
            </div>
          )}

          {/* Paso 3: Datos del cliente */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
                  Teléfono (opcional)
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="099 123 456"
                  className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="juan@example.com"
                  className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors"
                />
                <p className="text-[10px] text-text-muted mt-1">Para enviar confirmación por email</p>
              </div>

              <div>
                <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Corte clásico, barba..."
                  rows={3}
                  className="w-full bg-bg-base border-[0.5px] border-border-default rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-yellow transition-colors resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t-[0.5px] border-border-default flex-shrink-0">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-[#222] text-text-secondary border-[0.5px] border-[#333] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors"
            >
              ← Atrás
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-[#222] text-text-secondary border-[0.5px] border-[#333] rounded-lg px-4 py-2 text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canContinue()}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                canContinue()
                  ? 'bg-accent-yellow text-bg-base hover:bg-[#e6b83a]'
                  : 'bg-[#222] text-[#555] cursor-not-allowed'
              }`}
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!canContinue()}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                canContinue()
                  ? 'bg-accent-yellow text-bg-base hover:bg-[#e6b83a]'
                  : 'bg-[#222] text-[#555] cursor-not-allowed'
              }`}
            >
              Agendar turno
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
