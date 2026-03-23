'use client'

import BarberAvatar from '@/components/shared/BarberAvatar'
import { formatCurrency } from '@/lib/utils'

export default function BarberosPage() {
  const barbers = [
    {
      initials: 'LM',
      name: 'Lucas M.',
      since: 'Desde enero 2024',
      active: true,
      cuts: 128,
      revenue: 74400,
      earned: 37200,
      commission: 50,
      color: 'blue' as const,
    },
    {
      initials: 'RP',
      name: 'Rodrigo P.',
      since: 'Desde marzo 2024',
      active: true,
      cuts: 104,
      revenue: 58200,
      earned: 29100,
      commission: 50,
      color: 'purple' as const,
    },
    {
      initials: 'FG',
      name: 'Facundo G.',
      since: 'Desde agosto 2024',
      active: true,
      cuts: 87,
      revenue: 44850,
      earned: 20182,
      commission: 45,
      color: 'green' as const,
    },
  ]

  const totals = {
    cuts: barbers.reduce((sum, b) => sum + b.cuts, 0),
    revenue: barbers.reduce((sum, b) => sum + b.revenue, 0),
    earned: barbers.reduce((sum, b) => sum + b.earned, 0),
    shop: barbers.reduce((sum, b) => sum + (b.revenue - b.earned), 0),
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Barberos / Personal</h1>
          <p className="text-xs text-text-secondary mt-0.5">3 activos · 0 inactivos</p>
        </div>
        <button className="bg-accent-yellow text-bg-base rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-[#e6b83a] transition-colors">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          Agregar barbero
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Grilla de cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {barbers.map((barber, idx) => (
            <div key={idx} className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
              {/* Top */}
              <div className="flex items-center gap-3 mb-3.5">
                <BarberAvatar initials={barber.initials} color={barber.color} size="xl" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#e0e0e0]">{barber.name}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{barber.since}</div>
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${barber.active ? 'bg-status-done' : 'bg-[#444]'}`} />
              </div>

              {/* Separador */}
              <div className="h-[0.5px] bg-[#222] mb-3" />

              {/* Stats */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Cortes este mes</span>
                  <span className="text-xs font-medium text-[#ccc]">{barber.cuts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Recaudado</span>
                  <span className="text-xs font-medium text-accent-yellow">{formatCurrency(barber.revenue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-text-muted">Ganó este mes</span>
                  <span className="text-xs font-medium text-accent-green">{formatCurrency(barber.earned)}</span>
                </div>
              </div>

              {/* Badge de comisión */}
              <div className="inline-block bg-accent-yellow-dim text-accent-yellow text-[11px] font-medium px-2 py-1 rounded-[5px] mt-2">
                Comisión {barber.commission}%
              </div>

              {/* Acciones */}
              <div className="flex gap-1.5 mt-3">
                <button className="flex-1 bg-[#222] text-[#888] border-[0.5px] border-[#333] rounded-md px-2 py-1.5 text-[11px] hover:bg-[#2a2a2a] transition-colors">
                  Editar
                </button>
                <button className="flex-1 bg-[#1a2e3a] text-accent-blue border-[0.5px] border-[#1e3a4a] rounded-md px-2 py-1.5 text-[11px] hover:bg-[#1e3544] transition-colors">
                  Ver historial
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla comparativa */}
        <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
          <div className="text-sm font-medium text-[#e0e0e0] mb-3.5">
            Comparativa del mes — todos los barberos
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-[0.5px] border-[#222]">
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Barbero</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Cortes</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Recaudado</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Comisión</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Ganó</th>
                  <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">Para barbería</th>
                </tr>
              </thead>
              <tbody>
                {barbers.map((barber, idx) => (
                  <tr key={idx} className="border-b-[0.5px] border-[#1e1e1e]">
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-2">
                        <BarberAvatar initials={barber.initials} color={barber.color} size="sm" />
                        <span className="text-xs font-medium text-[#e0e0e0]">{barber.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-xs text-[#ccc]">{barber.cuts}</td>
                    <td className="px-2 py-2.5 text-xs text-accent-yellow">{formatCurrency(barber.revenue)}</td>
                    <td className="px-2 py-2.5 text-xs text-[#ccc]">{barber.commission}%</td>
                    <td className="px-2 py-2.5 text-xs text-accent-green">{formatCurrency(barber.earned)}</td>
                    <td className="px-2 py-2.5 text-xs text-[#ccc]">{formatCurrency(barber.revenue - barber.earned)}</td>
                  </tr>
                ))}
                {/* Fila de totales */}
                <tr className="bg-[#1e1e1e]">
                  <td className="px-2 py-2.5 text-[11px] text-[#888]">TOTAL</td>
                  <td className="px-2 py-2.5 text-xs font-medium text-[#e0e0e0]">{totals.cuts}</td>
                  <td className="px-2 py-2.5 text-xs font-medium text-accent-yellow">{formatCurrency(totals.revenue)}</td>
                  <td className="px-2 py-2.5 text-xs text-[#888]">—</td>
                  <td className="px-2 py-2.5 text-xs font-medium text-accent-green">{formatCurrency(totals.earned)}</td>
                  <td className="px-2 py-2.5 text-xs font-medium text-[#e0e0e0]">{formatCurrency(totals.shop)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
