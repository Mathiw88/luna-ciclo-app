'use client'

import { useState } from 'react'
import Logo from '@/components/shared/Logo'
import BarberAvatar from '@/components/shared/BarberAvatar'

type BarberOption = { id: string; initials: string; name: string; tag: string; color: 'blue' | 'purple' | 'green' }

export default function ReservasPage() {
  const [step, setStep] = useState(1)
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<{ d: number; m: number; y: number } | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' })

  const barbers: BarberOption[] = [
    { id: 'lm', initials: 'LM', name: 'Lucas M.', tag: 'Disponible hoy', color: 'blue' },
    { id: 'rp', initials: 'RP', name: 'Rodrigo P.', tag: 'Disponible hoy', color: 'purple' },
    { id: 'fg', initials: 'FG', name: 'Facundo G.', tag: 'Desde las 14h', color: 'green' },
  ]

  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
  const fullSlots = ['09:00', '10:00', '11:30', '14:00', '16:00']

  const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isFormValid = formData.name.trim().length >= 2 && formData.phone.trim().length >= 8 && isEmailValid(formData.email)

  const canContinue = () => {
    if (step === 1) return !!selectedBarber
    if (step === 2) return !!selectedDate
    if (step === 3) return !!selectedTime
    if (step === 4) return isFormValid
    return true
  }

  const handleNext = () => {
    if (step === 5) {
      // Confirmar reserva - aquí iría la lógica de guardar
      alert('¡Turno confirmado!')
      return
    }
    if (step < 5) setStep(step + 1)
  }

  const handlePrev = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* Navbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-6 py-3.5 flex items-center justify-between flex-shrink-0">
        <Logo size="small" />
        <div className="text-[11px] text-text-muted">Barbería El Clásico · Montevideo</div>
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
          {step === 1 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Elegí tu barbero</h2>
              <p className="text-xs text-text-muted mb-5">Seleccioná con quién querés atenderte</p>

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
                    <div className="text-[10px] text-text-muted mt-1">{barber.tag}</div>
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
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Elegí la fecha</h2>
              <p className="text-xs text-text-muted mb-5">Los puntos verdes indican días con turnos disponibles</p>

              <div className="max-w-md">
                <div className="text-[13px] font-medium text-[#e0e0e0] text-center mb-3">Marzo 2026</div>
                <div className="grid grid-cols-7 gap-1">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} className="text-[10px] text-text-muted text-center uppercase tracking-[0.05em] py-1">{d}</div>
                  ))}
                  {[...Array(31)].map((_, i) => {
                    const day = i + 1
                    const hasSlots = [21, 22, 24, 25, 26, 27, 28].includes(day)
                    const isSelected = selectedDate?.d === day
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate({ d: day, m: 2, y: 2026 })}
                        className={`h-[34px] rounded-md flex items-center justify-center text-xs cursor-pointer border-[0.5px] relative ${
                          isSelected
                            ? 'bg-accent-yellow text-bg-base font-medium border-accent-yellow'
                            : hasSlots
                            ? 'text-[#ccc] border-transparent hover:bg-[#222] hover:border-[#333]'
                            : 'text-[#666] border-transparent'
                        }`}
                      >
                        {day}
                        {hasSlots && !isSelected && (
                          <div className="absolute bottom-1 w-1 h-1 rounded-full bg-status-done" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Elegí el horario</h2>
              <p className="text-xs text-text-muted mb-5">
                {selectedDate ? `${selectedDate.d}/${selectedDate.m + 1}/${selectedDate.y} · ` : ''}Horarios disponibles
              </p>

              <div className="grid grid-cols-4 gap-2 max-w-2xl">
                {times.map(time => {
                  const isFull = fullSlots.includes(time)
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
              </div>
            </>
          )}

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

          {step === 5 && (
            <>
              <h2 className="text-[17px] font-medium text-text-primary mb-1">Confirmá tu turno</h2>
              <p className="text-xs text-text-muted mb-5">Revisá los datos antes de confirmar</p>

              <div className="max-w-md">
                <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-4 mb-4">
                  {[
                    { label: 'Barbero', value: barbers.find(b => b.id === selectedBarber)?.name },
                    { label: 'Fecha', value: selectedDate ? `${selectedDate.d}/${selectedDate.m + 1}/${selectedDate.y}` : '' },
                    { label: 'Horario', value: selectedTime, yellow: true },
                    { label: 'Nombre', value: formData.name },
                    { label: 'Teléfono', value: formData.phone },
                    { label: 'Email', value: formData.email },
                    { label: 'Pago', value: 'En el local', green: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b-[0.5px] border-[#1e1e1e] last:border-0">
                      <span className="text-xs text-text-muted">{item.label}</span>
                      <span className={`text-[13px] font-medium ${item.yellow ? 'text-accent-yellow' : item.green ? 'text-status-done' : 'text-[#e0e0e0]'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-accent-blue-dim border-[0.5px] border-[#1e3a4a] rounded-lg px-3.5 py-3 text-xs text-accent-blue">
                  Vas a recibir una confirmación por email a <strong>{formData.email}</strong> y por WhatsApp al <strong>{formData.phone}</strong>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar */}
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
          disabled={!canContinue()}
          className="bg-accent-yellow text-bg-base rounded-lg px-[22px] py-2 text-xs font-medium hover:bg-[#e6b83a] disabled:bg-accent-yellow-dim disabled:text-[#555] disabled:cursor-default transition-colors"
        >
          {step === 5 ? 'Confirmar turno' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}
