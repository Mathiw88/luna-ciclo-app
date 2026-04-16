'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import Logo from '@/components/shared/Logo'
import BarberAvatar from '@/components/shared/BarberAvatar'
import { createClient } from '@/lib/supabase/client'

// ─── Tipos locales ────────────────────────────────────────────────────────────

interface Barbershop {
  id: string
  name: string
  address: string | null
  city: string | null
  slug: string
}

interface BarberOption {
  id: string
  name: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'yellow'
}

interface SelectedDate {
  year: number
  month: number  // 0-indexed
  day: number
}

// ─── Utilidades de fecha ──────────────────────────────────────────────────────

function formatDateISO(date: SelectedDate): string {
  const m = String(date.month + 1).padStart(2, '0')
  const d = String(date.day).padStart(2, '0')
  return `${date.year}-${m}-${d}`
}

function formatDateLong(date: SelectedDate): string {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ]
  const jsDate = new Date(date.year, date.month, date.day)
  const diaNombre = dias[jsDate.getDay()]
  const mesNombre = meses[date.month]
  const diaCapital = diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1)
  return `${diaCapital} ${date.day} de ${mesNombre} de ${date.year}`
}

function formatDateShort(date: SelectedDate): string {
  return `${date.day}/${date.month + 1}/${date.year}`
}

function generateAllSlots(): string[] {
  const slots: string[] = []
  for (let hour = 9; hour < 19; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
    slots.push(`${String(hour).padStart(2, '0')}:30`)
  }
  return slots
}

const ALL_SLOTS = generateAllSlots()

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReservasPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  // Estado de carga
  const [loadingBarbershop, setLoadingBarbershop] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Datos reales
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [barbers, setBarbers] = useState<BarberOption[]>([])

  // Stepper
  const [step, setStep] = useState(1)

  // Selecciones
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<SelectedDate | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })

  // Calendario
  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())

  // Slots
  const [bookedSlots, setBookedSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Disponibilidad por día (para el mes visible)
  const [daysWithAvailability, setDaysWithAvailability] = useState<Set<number>>(new Set())
  const [loadingAvailability, setLoadingAvailability] = useState(false)

  // Confirmación
  const [confirming, setConfirming] = useState(false)

  // ─── Carga barbería ─────────────────────────────────────────────────────────

  useEffect(() => {
    async function fetchBarbershop() {
      setLoadingBarbershop(true)
      const { data, error } = await supabase
        .from('barbershops')
        .select('id, name, address, city, slug')
        .eq('slug', params.slug)
        .single()

      if (error || !data) {
        setNotFound(true)
        setLoadingBarbershop(false)
        return
      }

      setBarbershop(data as Barbershop)

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, initials, color')
        .eq('barbershop_id', data.id)
        .in('role', ['owner', 'barber'])
        .eq('is_active', true)

      if (!profilesError && profiles) {
        setBarbers(
          profiles.map((p) => ({
            id: p.id as string,
            name: p.name as string,
            initials: p.initials as string,
            color: (p.color ?? 'blue') as 'blue' | 'purple' | 'green' | 'yellow',
          }))
        )
      }

      setLoadingBarbershop(false)
    }

    fetchBarbershop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.slug])

  // ─── Carga slots cuando cambia barbero + fecha ──────────────────────────────

  useEffect(() => {
    if (!selectedBarber || !selectedDate) {
      setBookedSlots([])
      return
    }

    async function fetchBookedSlots() {
      if (!selectedBarber || !selectedDate) return
      setLoadingSlots(true)
      const { data, error } = await supabase
        .from('appointments')
        .select('appointment_time')
        .eq('barber_id', selectedBarber)
        .eq('appointment_date', formatDateISO(selectedDate))
        .in('status', ['pending', 'confirmed', 'done'])

      if (!error && data) {
        setBookedSlots(data.map((r) => (r.appointment_time as string).slice(0, 5)))
      }
      setLoadingSlots(false)
    }

    fetchBookedSlots()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarber, selectedDate])

  // ─── Disponibilidad por día del mes actual del calendario ───────────────────

  const fetchMonthAvailability = useCallback(async () => {
    if (!selectedBarber) {
      setDaysWithAvailability(new Set())
      return
    }

    setLoadingAvailability(true)

    const year = calendarYear
    const month = calendarMonth
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // Fechas del mes desde hoy en adelante
    const dates: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      const jsDate = new Date(year, month, d)
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      if (jsDate >= todayMidnight) {
        const m = String(month + 1).padStart(2, '0')
        const dd = String(d).padStart(2, '0')
        dates.push(`${year}-${m}-${dd}`)
      }
    }

    if (dates.length === 0) {
      setDaysWithAvailability(new Set())
      setLoadingAvailability(false)
      return
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date, appointment_time')
      .eq('barber_id', selectedBarber)
      .in('appointment_date', dates)
      .in('status', ['pending', 'confirmed', 'done'])

    if (error) {
      setLoadingAvailability(false)
      return
    }

    // Agrupar slots ocupados por día
    const bookedByDay: Record<string, Set<string>> = {}
    for (const row of data ?? []) {
      const dateStr = row.appointment_date as string
      const timeStr = (row.appointment_time as string).slice(0, 5)
      if (!bookedByDay[dateStr]) bookedByDay[dateStr] = new Set()
      bookedByDay[dateStr].add(timeStr)
    }

    // Días con al menos 1 slot libre
    const available = new Set<number>()
    for (const dateStr of dates) {
      const booked = bookedByDay[dateStr] ?? new Set()
      const freeSlots = ALL_SLOTS.filter((s) => !booked.has(s))
      if (freeSlots.length > 0) {
        const day = parseInt(dateStr.split('-')[2], 10)
        available.add(day)
      }
    }

    setDaysWithAvailability(available)
    setLoadingAvailability(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBarber, calendarYear, calendarMonth])

  useEffect(() => {
    fetchMonthAvailability()
  }, [fetchMonthAvailability])

  // ─── Confirmar turno ────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!barbershop || !selectedBarber || !selectedDate || !selectedTime) return

    setConfirming(true)

    try {
      // 1. Buscar o crear cliente
      let clientId: string

      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', formData.email)
        .eq('barbershop_id', barbershop.id)
        .maybeSingle()

      if (existingClient) {
        clientId = existingClient.id as string
      } else {
        const { data: newClient, error: insertClientError } = await supabase
          .from('clients')
          .insert({
            barbershop_id: barbershop.id,
            full_name: formData.name,
            phone: formData.phone,
            email: formData.email,
          })
          .select('id')
          .single()

        if (insertClientError || !newClient) {
          throw new Error('No se pudo crear el cliente')
        }
        clientId = newClient.id as string
      }

      // 2. Crear turno
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: barbershop.id,
          barber_id: selectedBarber,
          client_id: clientId,
          client_name: formData.name,
          appointment_date: formatDateISO(selectedDate),
          appointment_time: selectedTime + ':00',
          status: 'pending',
          is_walkin: false,
        })

      if (appointmentError) {
        throw new Error('No se pudo crear el turno')
      }

      // 3. Enviar email de confirmación
      const selectedBarberName = barbers.find((b) => b.id === selectedBarber)?.name ?? ''

      await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.email,
          appointment: {
            clientName: formData.name,
            barbershopName: barbershop.name,
            barbershopAddress: barbershop.address,
            barberName: selectedBarberName,
            date: formatDateLong(selectedDate),
            time: selectedTime,
            clientEmail: formData.email,
          },
        }),
      })

      // 4. Pasar a pantalla de éxito
      setStep(6)
    } catch {
      toast.error('No pudimos confirmar tu turno. Intentá de nuevo.')
    } finally {
      setConfirming(false)
    }
  }

  // ─── Helpers de navegación ──────────────────────────────────────────────────

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isFormValid =
    formData.name.trim().length >= 2 &&
    formData.phone.trim().length >= 8 &&
    isEmailValid(formData.email)

  const canContinue = () => {
    if (step === 1) return !!selectedBarber
    if (step === 2) return !!selectedDate
    if (step === 3) return !!selectedTime
    if (step === 4) return isFormValid
    return true
  }

  const handleNext = () => {
    if (step === 5) {
      handleConfirm()
      return
    }
    if (step < 5) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  function resetAll() {
    setStep(1)
    setSelectedBarber(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setFormData({ name: '', phone: '', email: '' })
    setBookedSlots([])
    setDaysWithAvailability(new Set())
    const now = new Date()
    setCalendarYear(now.getFullYear())
    setCalendarMonth(now.getMonth())
  }

  // ─── Navegación del calendario ──────────────────────────────────────────────

  function prevMonth() {
    const now = new Date()
    if (calendarYear === now.getFullYear() && calendarMonth === now.getMonth()) return
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear((y) => y - 1)
    } else {
      setCalendarMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    // Limitar a 2 meses hacia adelante
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 1)
    const nextDate = new Date(
      calendarMonth === 11 ? calendarYear + 1 : calendarYear,
      calendarMonth === 11 ? 0 : calendarMonth + 1,
      1
    )
    if (nextDate >= maxDate) return
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear((y) => y + 1)
    } else {
      setCalendarMonth((m) => m + 1)
    }
  }

  const isAtMinMonth =
    calendarYear === today.getFullYear() && calendarMonth === today.getMonth()

  const isAtMaxMonth = (() => {
    const next = new Date(
      calendarMonth === 11 ? calendarYear + 1 : calendarYear,
      calendarMonth === 11 ? 0 : calendarMonth + 1,
      1
    )
    const max = new Date(today.getFullYear(), today.getMonth() + 2, 1)
    return next >= max
  })()

  // ─── Datos del calendario ───────────────────────────────────────────────────

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay() // 0=Dom

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  // ─── Barbero seleccionado (para resumen) ────────────────────────────────────

  const selectedBarberName = barbers.find((b) => b.id === selectedBarber)?.name ?? ''

  // ─── Slots disponibles ──────────────────────────────────────────────────────

  const todayStr = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === todayStr

  const availableSlots = ALL_SLOTS.filter((s) => {
    if (bookedSlots.includes(s)) return false
    if (isToday) {
      const now = new Date()
      const minTime = new Date(now.getTime() + 3 * 60 * 60 * 1000)
      const [slotHour, slotMin] = s.split(':').map(Number)
      const slotDate = new Date(now)
      slotDate.setHours(slotHour, slotMin, 0, 0)
      return slotDate >= minTime
    }
    return true
  })

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadingBarbershop) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-text-muted">Cargando barbería...</span>
        </div>
      </div>
    )
  }

  if (notFound || !barbershop) {
    return (
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#333] mb-3">404</div>
          <div className="text-[15px] text-text-primary mb-1">Barbería no encontrada</div>
          <div className="text-xs text-text-muted">
            El link que usaste no corresponde a ninguna barbería activa.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Navbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <Logo size="small" />
        <div className="text-[11px] text-text-muted">
          {barbershop.name}{barbershop.city ? ` · ${barbershop.city}` : ''}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Stepper lateral */}
        <div className="w-[200px] bg-[#161616] border-r-[0.5px] border-[#222] px-4 py-6 flex flex-col gap-1">
          {[
            { num: 1, label: 'Barbero' },
            { num: 2, label: 'Fecha' },
            { num: 3, label: 'Horario' },
            { num: 4, label: 'Tus datos' },
            { num: 5, label: 'Confirmar' },
          ].map((s, idx) => (
            <div key={s.num}>
              <div className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium border-[0.5px] flex-shrink-0 ${
                  step > s.num ? 'bg-[#0d3326] border-status-done text-status-done' :
                  step === s.num ? 'bg-accent-yellow border-accent-yellow text-bg-base' :
                  'border-[#2e2e2e] text-[#444]'
                }`}>
                  {step > s.num ? (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : s.num}
                </div>
                <span className={`text-xs ${
                  step > s.num ? 'text-status-done' :
                  step === s.num ? 'text-[#e0e0e0] font-medium' :
                  'text-text-muted'
                }`}>
                  {s.label}
                </span>
              </div>
              {idx < 4 && <div className="w-[0.5px] h-3.5 bg-[#222] ml-[21px]" />}
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto px-7 py-6">

          {/* Step 1 – Barbero */}
          {step === 1 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Elegí tu barbero</h2>
              <p className="text-xs text-text-muted mb-5">Seleccioná con quién querés atenderte</p>

              {barbers.length === 0 ? (
                <div className="text-xs text-text-muted">No hay barberos disponibles en este momento.</div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-w-2xl">
                  {barbers.map((barber) => (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedBarber(barber.id)}
                      className={`bg-bg-surface border-[0.5px] rounded-[10px] p-3.5 cursor-pointer transition-all text-center ${
                        selectedBarber === barber.id
                          ? 'border-accent-yellow bg-accent-yellow-dim'
                          : 'border-border-default hover:border-[#3a3a3a]'
                      }`}
                    >
                      <BarberAvatar initials={barber.initials} color={barber.color} size="xl" className="w-11 h-11 mx-auto mb-2" />
                      <div className="text-[13px] font-medium text-[#e0e0e0]">{barber.name}</div>
                      <div className={`w-4 h-4 rounded-full border-[0.5px] mx-auto mt-2 flex items-center justify-center ${
                        selectedBarber === barber.id
                          ? 'bg-accent-yellow border-accent-yellow'
                          : 'border-[#333]'
                      }`}>
                        {selectedBarber === barber.id && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2 – Fecha */}
          {step === 2 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Elegí la fecha</h2>
              <p className="text-xs text-text-muted mb-5">Los puntos verdes indican días con turnos disponibles</p>

              <div className="max-w-md">
                {/* Cabecera del mes */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={prevMonth}
                    disabled={isAtMinMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#888] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-20 disabled:cursor-default transition-colors text-sm"
                  >
                    ←
                  </button>
                  <div className="text-[13px] font-medium text-[#e0e0e0]">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                    {loadingAvailability && (
                      <span className="ml-2 inline-block w-3 h-3 border border-[#555] border-t-transparent rounded-full animate-spin align-middle" />
                    )}
                  </div>
                  <button
                    onClick={nextMonth}
                    disabled={isAtMaxMonth}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#888] hover:text-[#ccc] hover:bg-[#222] disabled:opacity-20 disabled:cursor-default transition-colors text-sm"
                  >
                    →
                  </button>
                </div>

                {/* Grid del calendario */}
                <div className="grid grid-cols-7 gap-1">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                    <div key={d} className="text-[10px] text-text-muted text-center uppercase tracking-[0.05em] py-1">
                      {d}
                    </div>
                  ))}

                  {/* Celdas vacías del inicio */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Días del mes */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const jsDate = new Date(calendarYear, calendarMonth, day)
                    const isPast = jsDate < todayMidnight
                    const hasSlots = daysWithAvailability.has(day)
                    const isSelected =
                      selectedDate?.day === day &&
                      selectedDate?.month === calendarMonth &&
                      selectedDate?.year === calendarYear

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          if (isPast) return
                          setSelectedDate({ year: calendarYear, month: calendarMonth, day })
                          setSelectedTime(null)
                        }}
                        className={`h-[34px] rounded-md flex items-center justify-center text-xs border-[0.5px] relative ${
                          isPast
                            ? 'text-[#444] border-transparent cursor-not-allowed'
                            : isSelected
                            ? 'bg-accent-yellow text-bg-base font-medium border-accent-yellow cursor-pointer'
                            : hasSlots
                            ? 'text-[#ccc] border-transparent hover:bg-[#222] hover:border-[#333] cursor-pointer'
                            : 'text-[#666] border-transparent cursor-pointer hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {day}
                        {hasSlots && !isSelected && !isPast && (
                          <div className="absolute bottom-1 w-1 h-1 rounded-full bg-status-done" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Step 3 – Horario */}
          {step === 3 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Elegí el horario</h2>
              <p className="text-xs text-text-muted mb-5">
                {selectedDate ? `${formatDateShort(selectedDate)} · ` : ''}Horarios disponibles
              </p>

              {loadingSlots ? (
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <div className="w-4 h-4 border border-[#555] border-t-transparent rounded-full animate-spin" />
                  Cargando horarios...
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-w-2xl">
                  {ALL_SLOTS.map((time) => {
                    const isFull = bookedSlots.includes(time)
                    const isSelected = selectedTime === time
                    return (
                      <button
                        key={time}
                        onClick={() => !isFull && setSelectedTime(time)}
                        disabled={isFull}
                        className={`px-2 py-2 rounded-[7px] text-xs text-center border-[0.5px] transition-colors ${
                          isSelected
                            ? 'bg-accent-yellow-dim border-accent-yellow text-accent-yellow font-medium'
                            : isFull
                            ? 'bg-[#141414] border-border-default text-[#2a2a2a] cursor-default'
                            : 'bg-bg-surface border-border-default text-[#ccc] hover:border-[#3a3a3a] hover:text-[#e0e0e0]'
                        }`}
                      >
                        {time}
                        {isFull && <div className="text-[9px] text-[#333] mt-0.5">Ocupado</div>}
                      </button>
                    )
                  })}
                  {availableSlots.length === 0 && !loadingSlots && (
                    <div className="col-span-4 text-xs text-text-muted mt-2">
                      No hay horarios disponibles para este día. Elegí otro.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Step 4 – Datos */}
          {step === 4 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Tus datos</h2>
              <p className="text-xs text-text-muted mb-5">Para confirmar tu turno necesitamos contactarte</p>

              <div className="max-w-md space-y-3.5">
                <div>
                  <label className="block text-[11px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Nombre completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Carlos González"
                    className="w-full bg-bg-surface border-[0.5px] border-[#2e2e2e] rounded-lg px-3 py-2.5 text-[13px] text-[#e0e0e0] outline-none focus:border-accent-yellow placeholder:text-[#333]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: 099 123 456"
                    className="w-full bg-bg-surface border-[0.5px] border-[#2e2e2e] rounded-lg px-3 py-2.5 text-[13px] text-[#e0e0e0] outline-none focus:border-accent-yellow placeholder:text-[#333]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Correo electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ej: carlos@gmail.com"
                    className={`w-full bg-bg-surface border-[0.5px] rounded-lg px-3 py-2.5 text-[13px] text-[#e0e0e0] outline-none focus:border-accent-yellow placeholder:text-[#333] ${
                      formData.email && !isEmailValid(formData.email) ? 'border-status-danger' : 'border-[#2e2e2e]'
                    }`}
                  />
                </div>

                <div className="bg-[#161616] border-[0.5px] border-[#222] rounded-lg px-3.5 py-3">
                  <div className="text-[11px] text-text-muted mb-1">El turno NO requiere pago anticipado</div>
                  <div className="text-[11px] text-[#444]">El pago se realiza en el local, en efectivo o débito</div>
                </div>
              </div>
            </>
          )}

          {/* Step 5 – Confirmar */}
          {step === 5 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Confirmá tu turno</h2>
              <p className="text-xs text-text-muted mb-5">Revisá los datos antes de confirmar</p>

              <div className="max-w-md">
                <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-4 mb-4">
                  {[
                    { label: 'Barbero', value: selectedBarberName },
                    { label: 'Fecha', value: selectedDate ? formatDateShort(selectedDate) : '' },
                    { label: 'Horario', value: selectedTime ?? '', yellow: true },
                    { label: 'Nombre', value: formData.name },
                    { label: 'Teléfono', value: formData.phone },
                    { label: 'Email', value: formData.email },
                    { label: 'Pago', value: 'En el local', green: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b-[0.5px] border-[#1e1e1e] last:border-0">
                      <span className="text-xs text-text-muted">{item.label}</span>
                      <span className={`text-[13px] font-medium ${item.yellow ? 'text-accent-yellow' : (item as { green?: boolean }).green ? 'text-status-done' : 'text-[#e0e0e0]'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-accent-blue-dim border-[0.5px] border-[#1e3a4a] rounded-lg px-3.5 py-3 text-xs text-accent-blue">
                  Vas a recibir una confirmación por email a <strong>{formData.email}</strong>
                </div>
              </div>
            </>
          )}

          {/* Step 6 – Éxito */}
          {step === 6 && (
            <div className="flex flex-col items-center justify-center py-10 max-w-md mx-auto text-center">
              {/* Ícono check */}
              <div className="w-16 h-16 rounded-full bg-[#0d3326] border-[0.5px] border-status-done flex items-center justify-center mb-5">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14L11 20L23 8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h2 className="text-[20px] font-semibold text-text-primary mb-2">¡Turno confirmado!</h2>
              <p className="text-xs text-text-muted mb-6">
                Te mandamos un email a <span className="text-[#e0e0e0]">{formData.email}</span> con todos los detalles
              </p>

              {/* Card resumen */}
              <div className="w-full bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-4 mb-6 text-left">
                {[
                  { label: 'Barbero', value: selectedBarberName },
                  { label: 'Fecha', value: selectedDate ? formatDateShort(selectedDate) : '' },
                  { label: 'Horario', value: selectedTime ?? '', yellow: true },
                  { label: 'Pago', value: 'En el local', green: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b-[0.5px] border-[#1e1e1e] last:border-0">
                    <span className="text-xs text-text-muted">{item.label}</span>
                    <span className={`text-[13px] font-medium ${item.yellow ? 'text-accent-yellow' : (item as { green?: boolean }).green ? 'text-status-done' : 'text-[#e0e0e0]'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={resetAll}
                className="bg-[#222] text-[#ccc] border-[0.5px] border-[#2e2e2e] rounded-lg px-5 py-2.5 text-xs hover:bg-[#2a2a2a] transition-colors"
              >
                Reservar otro turno
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar — solo hasta step 5 */}
      {step <= 5 && (
        <div className="bg-[#161616] border-t-[0.5px] border-[#222] px-7 py-3.5 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="bg-[#222] text-[#888] border-[0.5px] border-[#2e2e2e] rounded-lg px-[18px] py-2 text-xs disabled:opacity-30"
          >
            ← Volver
          </button>

          <div className="flex-1 mx-4 h-[2px] bg-[#222] rounded">
            <div className="h-full bg-accent-yellow rounded transition-all" style={{ width: `${step * 20}%` }} />
          </div>

          <button
            onClick={handleNext}
            disabled={!canContinue() || confirming}
            className="bg-accent-yellow text-bg-base rounded-lg px-[22px] py-2 text-xs font-medium hover:bg-[#e6b83a] disabled:bg-accent-yellow-dim disabled:text-[#555] disabled:cursor-default transition-colors"
          >
            {step === 5
              ? confirming
                ? 'Confirmando...'
                : 'Confirmar turno'
              : 'Continuar →'}
          </button>
        </div>
      )}
    </div>
  )
}
