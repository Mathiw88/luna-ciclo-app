'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import Calendar from '@/components/shared/Calendar'
import { createClient } from '@/lib/supabase/client'

interface Barber {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
  commission_pct: number
}

interface EditAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  appointment: {
    id: string
    barber_id: string
    client_name: string
    appointment_date: string
    appointment_time: string
  } | null
}

export default function EditAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  appointment,
}: EditAppointmentModalProps) {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loadingBarbers, setLoadingBarbers] = useState(true)

  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [clientName, setClientName] = useState('')

  // Cargar barberos y prellenar datos al abrir
  useEffect(() => {
    if (isOpen && appointment) {
      loadBarbers()
      setSelectedBarberId(appointment.barber_id)
      setSelectedDate(appointment.appointment_date)
      setSelectedTime(appointment.appointment_time.slice(0, 5)) // "09:00:00" -> "09:00"
      setClientName(appointment.client_name)
    } else {
      // Reset al cerrar
      setSelectedBarberId('')
      setSelectedDate('')
      setSelectedTime('')
      setClientName('')
    }
  }, [isOpen, appointment])

  const loadBarbers = async () => {
    setLoadingBarbers(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, initials, color, commission_pct')
      .eq('barbershop_id', 'a0000000-0000-0000-0000-000000000001')
      .eq('is_active', true)
      .order('role', { ascending: false })
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

    // Obtener appointments del barbero en esa fecha (excluyendo el actual)
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('barber_id', selectedBarberId)
      .eq('appointment_date', selectedDate)
      .neq('id', appointment?.id || '')

    if (error) {
      console.error('Error loading appointments:', error)
      setAvailableSlots([])
      setLoadingSlots(false)
      return
    }

    // Generar todos los slots posibles
    const allSlots: string[] = []
    for (let hour = 9; hour < 19; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`)
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }

    // Filtrar ocupados
    const occupiedTimes = new Set((appointments || []).map((a: any) => a.appointment_time.slice(0, 5)))
    const available = allSlots.filter(slot => !occupiedTimes.has(slot))

    setAvailableSlots(available)
    setLoadingSlots(false)
  }

  const handleConfirm = async () => {
    if (!selectedBarberId || !selectedDate || !selectedTime || !clientName.trim() || !appointment) {
      alert('Por favor completa todos los campos')
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          barber_id: selectedBarberId,
          appointment_date: selectedDate,
          appointment_time: selectedTime + ':00',
          client_name: clientName.trim(),
        })
        .eq('id', appointment.id)

      if (error) {
        console.error('Update error details:', error)
        throw error
      }

      alert('✅ Turno actualizado correctamente')
      onConfirm()
      onClose()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error al actualizar el turno')
    }
  }

  if (!isOpen || !appointment) return null

  const canContinue = selectedBarberId && selectedDate && selectedTime && clientName.trim()

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
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
            <h2 className="text-lg font-medium text-text-primary">Editar turno</h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Modificar detalles del turno agendado
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
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

          {/* Seleccionar barbero */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-3">
              Barbero *
            </label>
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
                Horario *
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

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t-[0.5px] border-border-default flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 bg-[#222] text-text-secondary border-[0.5px] border-[#333] rounded-lg px-4 py-2 text-sm hover:bg-[#2a2a2a] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canContinue}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              canContinue
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
