'use client'

import { useState, useEffect } from 'react'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { calculateIncome } from '@/lib/utils'
import CompleteAppointmentModal from '@/components/owner/CompleteAppointmentModal'
import NewAppointmentModal from '@/components/owner/NewAppointmentModal'
import WalkInModal from '@/components/owner/WalkInModal'
import EditAppointmentModal from '@/components/owner/EditAppointmentModal'
import AppointmentActionsMenu from '@/components/owner/AppointmentActionsMenu'
import { createClient } from '@/lib/supabase/client'

interface Barber {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
  commission_pct: number
  count: number
}

interface Appointment {
  id: string
  barber_id: string
  client_name: string
  appointment_time: string
  status: string
  price: number | null
  is_walkin: boolean
}

export default function AgendaPage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({})

  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string
    barberId: string
    clientName: string
    time: string
    barber: {
      name: string
      initials: string
      color: 'blue' | 'purple' | 'green' | 'yellow'
      commission: number
    }
  } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false)
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [selectedAppointmentForActions, setSelectedAppointmentForActions] = useState<Appointment | null>(null)

  // Cargar barberos y appointments
  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient()

    // Cargar barberos activos
    const { data: barbersData, error: barbersError } = await supabase
      .from('profiles')
      .select('id, name, initials, color, commission_pct')
      .eq('barbershop_id', 'a0000000-0000-0000-0000-000000000001')
      .eq('is_active', true)
      .order('role', { ascending: false })
      .order('name')

    console.log('Barbers:', barbersData, 'Error:', barbersError)

    // Cargar appointments del día
    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('barbershop_id', 'a0000000-0000-0000-0000-000000000001')
      .eq('appointment_date', selectedDate)
      .order('appointment_time')

    console.log('Date:', selectedDate)
    console.log('Appointments:', appointmentsData, 'Error:', appointmentsError)

    if (barbersData) {
      // Contar turnos por barbero
      const barbersWithCount = barbersData.map(b => ({
        ...b,
        count: appointmentsData?.filter(a => a.barber_id === b.id).length || 0
      }))
      setBarbers(barbersWithCount)

      // Inicializar filtros (todos activos)
      const filters: Record<string, boolean> = {}
      barbersWithCount.forEach(b => filters[b.id] = true)
      setActiveFilters(filters)
    }

    if (appointmentsData) {
      setAppointments(appointmentsData)
    }

    setLoading(false)
  }

  const typeMap = {
    done: { cardClass: 'bg-[#0d2a1e] border-l-status-done', badge: 'bg-[#0d3326] text-status-done', label: 'LISTO' },
    confirmed: { cardClass: 'bg-accent-yellow-dim border-l-accent-yellow', badge: 'bg-accent-yellow-dim text-accent-yellow', label: 'PRÓXIMO' },
    pending: { cardClass: 'bg-[#1e1e1e] border-l-[#383838]', badge: 'bg-[#252525] text-[#555]', label: 'PENDIENTE' },
    walkin: { cardClass: 'bg-accent-blue-dim border-l-accent-blue', badge: 'bg-accent-blue-dim text-accent-blue', label: 'WALK-IN' },
  }

  const toggleFilter = (id: string) => {
    const othersActive = Object.entries(activeFilters).some(([key, val]) => key !== id && val)
    if (!othersActive && activeFilters[id]) return
    setActiveFilters(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const activeBarbers = barbers.filter(b => activeFilters[b.id])

  // Generar slots de tiempo
  const timeSlots = []
  for (let hour = 9; hour < 19; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  const currentTime = new Date().toTimeString().slice(0, 5)
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  const handleAppointmentClick = (appointment: Appointment) => {
    const barber = barbers.find(b => b.id === appointment.barber_id)
    if (!barber) return

    setSelectedAppointment({
      id: appointment.id,
      barberId: appointment.barber_id,
      clientName: appointment.client_name,
      time: appointment.appointment_time,
      barber: {
        name: barber.name,
        initials: barber.initials,
        color: barber.color,
        commission: barber.commission_pct,
      },
    })
    setIsModalOpen(true)
  }

  const handleModalConfirm = async (data: { clientName: string; amount: number }) => {
    if (!selectedAppointment) return

    const supabase = createClient()

    try {
      // 1. Actualizar appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          client_name: data.clientName,
          status: 'done',
          price: data.amount,
        })
        .eq('id', selectedAppointment.id)

      if (appointmentError) throw appointmentError

      // 2. Calcular comisiones
      const income = calculateIncome(data.amount, selectedAppointment.barber.commission)

      // 3. Crear income_record
      const { error: incomeError } = await supabase
        .from('income_records')
        .upsert({
          appointment_id: selectedAppointment.id,
          barber_id: selectedAppointment.barberId,
          barbershop_id: 'a0000000-0000-0000-0000-000000000001',
          total_amount: data.amount,
          barber_amount: income.barberAmount,
          shop_amount: income.shopAmount,
          commission_pct: selectedAppointment.barber.commission,
          date: selectedDate,
        })

      if (incomeError) throw incomeError

      // Recargar datos
      await loadData()
      setIsModalOpen(false)
      setSelectedAppointment(null)

    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error al guardar los cambios')
    }
  }

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentForActions) return

    const confirmed = confirm('¿Estás seguro de que deseas cancelar este turno?')
    if (!confirmed) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', selectedAppointmentForActions.id)

      if (error) throw error

      alert('✅ Turno cancelado correctamente')
      await loadData()
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      alert('Error al cancelar el turno')
    }
  }

  const handleNoShow = async () => {
    if (!selectedAppointmentForActions) return

    const confirmed = confirm('¿Marcar este turno como "No asistió"?')
    if (!confirmed) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', selectedAppointmentForActions.id)

      if (error) throw error

      alert('✅ Turno marcado como "No asistió"')
      await loadData()
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error al actualizar el turno')
    }
  }

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    walkin: appointments.filter(a => a.is_walkin).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">Cargando agenda...</p>
      </div>
    )
  }

  return (
    <>
      <CompleteAppointmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAppointment(null)
        }}
        onConfirm={handleModalConfirm}
        appointment={selectedAppointment}
      />

      <NewAppointmentModal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => setIsNewAppointmentModalOpen(false)}
        onConfirm={loadData}
      />

      <WalkInModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        onConfirm={loadData}
        selectedDate={selectedDate}
      />

      <EditAppointmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedAppointmentForActions(null)
        }}
        onConfirm={loadData}
        appointment={selectedAppointmentForActions ? {
          id: selectedAppointmentForActions.id,
          barber_id: selectedAppointmentForActions.barber_id,
          client_name: selectedAppointmentForActions.client_name,
          appointment_date: selectedDate,
          appointment_time: selectedAppointmentForActions.appointment_time,
        } : null}
      />

      <AppointmentActionsMenu
        isOpen={isActionsMenuOpen}
        position={menuPosition}
        onClose={() => {
          setIsActionsMenuOpen(false)
          // NO limpiar selectedAppointmentForActions aquí
        }}
        onEdit={() => {
          setIsActionsMenuOpen(false)
          setIsEditModalOpen(true)
        }}
        onCancel={handleCancelAppointment}
        onNoShow={handleNoShow}
        appointmentStatus={selectedAppointmentForActions?.status || ''}
      />

      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-[18px] py-[13px] flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[19px] font-medium text-text-primary">Agenda</h1>
          <p className="text-[11px] text-text-secondary mt-0.5">
            {stats.total} turnos hoy · {stats.pending} pendientes · {stats.walkin} walk-in
          </p>
        </div>
        <div className="flex gap-[7px]">
          <button className="bg-[#222] text-[#ccc] border-[0.5px] border-[#333] rounded-[7px] px-3 py-1.5 text-[11px] hover:bg-[#2a2a2a] transition-colors">
            Vista lista
          </button>
          <button
            onClick={() => setIsWalkInModalOpen(true)}
            className="bg-accent-blue text-bg-base rounded-[7px] px-[13px] py-1.5 text-[11px] font-medium flex items-center gap-[5px] hover:brightness-110 transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v9M2 6.5h9" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Ingreso por llegada
          </button>
          <button
            onClick={() => setIsNewAppointmentModalOpen(true)}
            className="bg-accent-yellow text-bg-base rounded-[7px] px-[13px] py-1.5 text-[11px] font-medium flex items-center gap-[5px] hover:bg-[#e6b83a] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v9M2 6.5h9" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            Nuevo turno
          </button>
        </div>
      </div>

      {/* Barra de día */}
      <div className="bg-[#161616] border-b-[0.5px] border-border-default px-[18px] py-2 flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={() => {
            const prev = new Date(selectedDate)
            prev.setDate(prev.getDate() - 1)
            setSelectedDate(prev.toISOString().split('T')[0])
          }}
          className="bg-[#222] border-[0.5px] border-[#333] text-[#777] rounded-[7px] px-[11px] py-1 text-[11px] hover:bg-[#2a2a2a] transition-colors"
        >
          ← Ayer
        </button>
        <span className="text-[13px] font-medium text-[#e0e0e0] flex-1 text-center">
          {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-UY', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </span>
        <button
          onClick={() => {
            const next = new Date(selectedDate)
            next.setDate(next.getDate() + 1)
            setSelectedDate(next.toISOString().split('T')[0])
          }}
          className="bg-[#222] border-[0.5px] border-[#333] text-[#777] rounded-[7px] px-[11px] py-1 text-[11px] hover:bg-[#2a2a2a] transition-colors"
        >
          Mañana →
        </button>
      </div>

      {/* Filtro por barbero */}
      <div className="bg-[#161616] border-b-[0.5px] border-border-default px-[18px] py-2 flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] text-text-muted uppercase tracking-[0.06em] flex-shrink-0">Barbero:</span>
        {barbers.map((barber) => {
          const isActive = activeFilters[barber.id]
          const colorClasses = {
            yellow: 'bg-accent-yellow-dim text-accent-yellow border-accent-yellow',
            blue: 'bg-[#1a2e3a] text-accent-blue border-[#2a4a6a]',
            purple: 'bg-[#2e1a3a] text-accent-purple border-[#3a2a4a]',
            green: 'bg-[#1a3a2e] text-accent-green border-[#2a4a3a]',
          }
          return (
            <button
              key={barber.id}
              onClick={() => toggleFilter(barber.id)}
              className={`flex items-center gap-1.5 px-[11px] py-[5px] rounded-[20px] text-[11px] border-[0.5px] transition-all select-none ${
                isActive
                  ? colorClasses[barber.color]
                  : 'bg-transparent text-[#666] border-[#2e2e2e] hover:border-[#444] hover:text-[#999]'
              }`}
            >
              <BarberAvatar
                initials={barber.initials}
                color={barber.color}
                size="sm"
                className="w-[18px] h-[18px] text-[8px]"
              />
              {barber.name}
            </button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-3.5 px-[18px] py-1.5 bg-[#161616] border-b-[0.5px] border-border-default flex-shrink-0">
        <div className="flex items-center gap-[5px] text-[10px] text-text-muted">
          <div className="w-[7px] h-[7px] rounded-full bg-status-done" />
          Listo
        </div>
        <div className="flex items-center gap-[5px] text-[10px] text-text-muted">
          <div className="w-[7px] h-[7px] rounded-full bg-accent-yellow" />
          Próximo
        </div>
        <div className="flex items-center gap-[5px] text-[10px] text-text-muted">
          <div className="w-[7px] h-[7px] rounded-full bg-[#444]" />
          Pendiente
        </div>
        <div className="flex items-center gap-[5px] text-[10px] text-text-muted">
          <div className="w-[7px] h-[7px] rounded-full bg-accent-blue" />
          Walk-in
        </div>
      </div>

      {/* Grilla */}
      <div className="flex-1 overflow-auto">
        {/* Header de columnas */}
        <div className="sticky top-0 z-10 bg-[#161616] border-b-[0.5px] border-border-default flex">
          <div className="w-14 min-w-[56px] flex-shrink-0 bg-[#161616] border-r-[0.5px] border-[#222]" />
          {activeBarbers.map((barber) => (
            <div key={barber.id} className="flex-1 min-w-[170px] px-[13px] py-[11px] border-r-[0.5px] border-[#222] last:border-r-0 flex items-center gap-2">
              <BarberAvatar initials={barber.initials} color={barber.color} size="md" className="w-7 h-7 text-[10px]" />
              <div className="flex-1">
                <div className="text-xs font-medium text-[#e0e0e0]">{barber.name}</div>
                <div className="text-[10px] text-text-muted">{barber.count} turnos hoy</div>
              </div>
              <div className="w-[7px] h-[7px] rounded-full bg-status-done flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Filas de horarios */}
        <div>
          {timeSlots.map((time) => {
            const isHighlight = isToday && time === currentTime
            return (
              <div
                key={time}
                className={`flex min-h-[62px] border-b-[0.5px] border-[#1c1c1c] ${isHighlight ? 'bg-[#1a1600]' : ''}`}
              >
                <div className={`w-14 min-w-[56px] flex-shrink-0 px-2 pt-2.5 border-r-[0.5px] border-[#222] text-[10px] text-right ${isHighlight ? 'text-accent-yellow font-medium' : 'text-[#444]'}`}>
                  {time}
                </div>
                {activeBarbers.map((barber) => {
                  const appointment = appointments.find(a => a.barber_id === barber.id && a.appointment_time.slice(0, 5) === time)
                  const typeKey = appointment?.is_walkin ? 'walkin' : appointment?.status || 'pending'
                  const typeStyle = typeMap[typeKey as keyof typeof typeMap] || typeMap.pending

                  return (
                    <div key={barber.id} className="flex-1 min-w-[170px] px-2 py-1.5 border-r-[0.5px] border-[#1c1c1c] last:border-r-0">
                      {appointment ? (
                        <div
                          onClick={() => handleAppointmentClick(appointment)}
                          onContextMenu={(e) => {
                            e.preventDefault()
                            setMenuPosition({ x: e.clientX, y: e.clientY })
                            setSelectedAppointmentForActions(appointment)
                            setIsActionsMenuOpen(true)
                          }}
                          className={`rounded-[7px] px-2.5 py-2 border-l-[3px] cursor-pointer hover:brightness-110 transition-all ${typeStyle.cardClass}`}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-0.5">
                            <span className="text-xs font-medium text-[#e0e0e0] truncate flex-1">{appointment.client_name}</span>
                            <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${typeStyle.badge}`}>
                              {typeStyle.label}
                            </span>
                          </div>
                          <div className={`text-[11px] font-medium mt-0.5 ${appointment.price ? 'text-[#ccc]' : 'text-[#333]'}`}>
                            {appointment.price ? `$${appointment.price}` : '—'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#252525] italic px-1 py-2 block">libre</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
