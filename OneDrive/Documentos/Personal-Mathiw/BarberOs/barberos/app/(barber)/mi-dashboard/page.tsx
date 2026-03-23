'use client'

import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency } from '@/lib/utils'

export default function MiDashboardPage() {
  const appointments = [
    { time: '09:00', client: 'Nicolás Fernández', status: 'done', price: 600 },
    { time: '10:30', client: 'Mateo Álvarez', status: 'done', price: 500 },
    { time: '12:00', client: 'Ezequiel Mora', status: 'done', price: 600 },
    { time: '14:00', client: 'Sebastián Torres', status: 'next', price: null, note: 'Próximo turno' },
    { time: '15:30', client: 'Ignacio Blanco', status: 'pending', price: null },
    { time: '11:15', client: 'Cliente sin turno', status: 'walkin', price: 450, note: '11:15 · registrado manual' },
  ]

  const earnings = [
    { time: '09:00', client: 'Nicolás F.', total: 600, mine: 300 },
    { time: '10:30', client: 'Mateo A.', total: 500, mine: 250 },
    { time: '11:15', client: 'Walk-in', total: 450, mine: 225 },
    { time: '12:00', client: 'Ezequiel M.', total: 600, mine: 300 },
    { time: '14:00', client: 'Sebastián T.', total: null, mine: null },
    { time: '15:30', client: 'Ignacio B.', total: null, mine: null },
  ]

  const statusStyles = {
    done: { bg: 'bg-[#0d3326]', text: 'text-status-done', bar: 'bg-status-done', label: 'LISTO' },
    next: { bg: 'bg-accent-blue-dim', text: 'text-accent-blue', bar: 'bg-accent-blue', label: 'PRÓXIMO' },
    pending: { bg: 'bg-[#222]', text: 'text-[#666]', bar: 'bg-[#444]', label: 'PENDIENTE' },
    walkin: { bg: 'bg-accent-yellow-dim', text: 'text-accent-yellow', bar: 'bg-accent-yellow', label: 'WALK-IN' },
  }

  const totalEarned = earnings.filter(e => e.mine).reduce((sum, e) => sum + (e.mine || 0), 0)

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-3.5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-medium text-text-primary">Mi dashboard</h1>
          <p className="text-xs text-text-secondary mt-0.5">Viernes 20 de marzo · 2026</p>
        </div>
        <button className="bg-accent-blue text-bg-base rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-[#4da8e0] transition-colors">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Registrar corte
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Welcome card */}
        <div className="bg-[#1a2e3a] border-[0.5px] border-[#1e3a4a] rounded-xl px-5 py-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-[#e0e0e0]">Buenas tardes, Lucas</h2>
            <p className="text-xs text-accent-blue mt-1">Tenés 3 turnos pendientes para hoy</p>
          </div>
          <div className="text-[28px] font-medium text-accent-blue">14:02</div>
        </div>

        {/* 3 Métricas */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Cortes hoy</div>
            <div className="text-xl font-medium text-text-primary">6</div>
            <div className="text-[11px] text-accent-blue mt-1">3 pendientes</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Gané hoy</div>
            <div className="text-xl font-medium text-text-primary">{formatCurrency(1800)}</div>
            <div className="text-[11px] text-accent-green mt-1">de $3.600 recaudados</div>
          </div>

          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-[10px] p-3.5">
            <div className="text-[10px] text-text-secondary uppercase tracking-[0.06em] mb-1.5">Gané este mes</div>
            <div className="text-xl font-medium text-text-primary">{formatCurrency(37200)}</div>
            <div className="text-[11px] text-accent-yellow mt-1">128 cortes · 50%</div>
          </div>
        </div>

        {/* Dos columnas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Mi agenda de hoy */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-sm font-medium text-[#e0e0e0]">Mi agenda de hoy</span>
              <span className="bg-accent-blue-dim text-accent-blue text-[10px] font-medium px-2 py-1 rounded-[5px]">
                PRÓXIMO: 14:00
              </span>
            </div>

            <div className="space-y-0">
              {appointments.map((apt, idx) => {
                const style = statusStyles[apt.status as keyof typeof statusStyles]
                return (
                  <div key={idx} className="flex items-center gap-2.5 py-2.5 border-b-[0.5px] border-[#222] last:border-0">
                    <span className="text-xs text-text-muted w-10 flex-shrink-0">{apt.time}</span>
                    <div className={`w-[3px] rounded-sm self-stretch min-h-8 ${style.bar}`} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-[#e0e0e0]">{apt.client}</div>
                      {apt.note && <div className="text-[11px] text-text-muted">{apt.note}</div>}
                    </div>
                    <span className={`text-[10px] font-medium px-[7px] py-0.5 rounded-[5px] ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className={`text-[13px] font-medium ${apt.price ? 'text-text-primary' : 'text-[#333]'}`}>
                      {apt.price ? formatCurrency(apt.price) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mis ganancias de hoy */}
          <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
            <div className="text-sm font-medium text-[#e0e0e0] mb-3">Mis ganancias de hoy</div>

            {/* Header */}
            <div className="flex justify-between mb-2">
              <span className="text-[10px] text-text-muted uppercase tracking-[0.05em]">Hora</span>
              <span className="text-[10px] text-text-muted uppercase tracking-[0.05em]">Cliente</span>
              <span className="text-[10px] text-text-muted uppercase tracking-[0.05em]">Total</span>
              <span className="text-[10px] text-text-muted uppercase tracking-[0.05em]">Yo gané</span>
            </div>

            {/* Filas */}
            <div className="space-y-0">
              {earnings.map((earn, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center py-2 border-b-[0.5px] border-[#1e1e1e] last:border-0 ${!earn.mine ? 'opacity-40' : ''}`}
                >
                  <span className="text-[11px] text-text-muted w-10">{earn.time}</span>
                  <span className="text-xs text-[#ccc] flex-1">{earn.client}</span>
                  <span className={`text-xs w-12 text-right ${earn.total ? 'text-[#888]' : 'text-[#333]'}`}>
                    {earn.total ? formatCurrency(earn.total) : '—'}
                  </span>
                  <span className={`text-[13px] font-medium w-14 text-right ${earn.mine ? 'text-accent-green' : 'text-[#333]'}`}>
                    {earn.mine ? formatCurrency(earn.mine) : '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Separador */}
            <div className="h-[0.5px] bg-border-default my-2.5" />

            {/* Totales */}
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary">Total ganado hasta ahora</span>
              <span className="text-base font-medium text-accent-green">{formatCurrency(totalEarned)}</span>
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-xs text-text-secondary">Estimado fin del día</span>
              <span className="text-sm font-medium text-accent-yellow">≈ {formatCurrency(2700)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
