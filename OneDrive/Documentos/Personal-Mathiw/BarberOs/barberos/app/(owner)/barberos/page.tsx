'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'
import BarberAvatar from '@/components/shared/BarberAvatar'
import CreateUserModal from '@/components/owner/CreateUserModal'
import EditBarberModal from '@/components/owner/EditBarberModal'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type AvatarColor = 'blue' | 'purple' | 'green' | 'yellow'

type ProfileRow = {
  id: string
  name: string
  initials: string
  color: AvatarColor
  commission_pct: number
  role: 'owner' | 'barber'
  is_active: boolean
}

type BarberStats = ProfileRow & {
  cuts: number
  revenue: number
  earned: number
}

export default function BarberosPage() {
  const router = useRouter()
  const [barbers, setBarbers] = useState<BarberStats[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [editBarber, setEditBarber] = useState<BarberStats | null>(null)

  const fetchBarbers = useCallback(async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Obtener usuario actual y su barbershop_id
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('No autenticado')

      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (profileError || !currentProfile) throw new Error('No se encontró el perfil')

      const shopId = currentProfile.barbershop_id as string
      setBarbershopId(shopId)

      // Traer todos los perfiles de la barbería (owners + barbers)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, initials, color, commission_pct, role, is_active')
        .eq('barbershop_id', shopId)
        .in('role', ['owner', 'barber'])
        .eq('is_active', true)
        .order('role', { ascending: false }) // owners primero

      if (profilesError) throw profilesError

      // Calcular fecha de inicio del mes actual
      const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0]

      // Para cada perfil calcular estadísticas del mes
      const statsPromises = (profiles ?? []).map(async (profile) => {
        const { data: incomes } = await supabase
          .from('income_records')
          .select('total_amount, barber_amount')
          .eq('barber_id', profile.id)
          .gte('date', periodStart)

        const cuts = (incomes ?? []).length
        const revenue = (incomes ?? []).reduce((sum, r) => sum + r.total_amount, 0)
        const earned = (incomes ?? []).reduce((sum, r) => sum + r.barber_amount, 0)

        return {
          ...(profile as ProfileRow),
          cuts,
          revenue,
          earned,
        }
      })

      const statsData = await Promise.all(statsPromises)
      setBarbers(statsData)
    } catch (error) {
      console.error('Error al cargar barberos:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBarbers()
  }, [fetchBarbers])

  const handleUserCreated = (name: string) => {
    toast.success('Usuario creado', {
      description: `${name} ya puede ingresar al sistema`,
    })
    fetchBarbers()
  }

  const totals = {
    cuts: barbers.reduce((sum, b) => sum + b.cuts, 0),
    revenue: barbers.reduce((sum, b) => sum + b.revenue, 0),
    earned: barbers.reduce((sum, b) => sum + b.earned, 0),
    shop: barbers.reduce((sum, b) => sum + (b.revenue - b.earned), 0),
  }

  const activeCount = barbers.filter((b) => b.is_active).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-text-secondary">Cargando...</div>
      </div>
    )
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Barberos / Personal</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {activeCount} activo{activeCount !== 1 ? 's' : ''} · 0 inactivos
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-accent-yellow text-bg-base rounded-lg px-4 py-2 text-xs font-medium flex items-center gap-1.5 hover:bg-[#e6b83a] transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          Agregar barbero
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {barbers.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">
            No hay personal registrado todavía.
          </div>
        ) : (
          <>
            {/* Grilla de cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4"
                >
                  {/* Edit button */}
                  <button
                    onClick={() => setEditBarber(barber)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded hover:bg-[#2a2a2a] text-text-muted hover:text-text-secondary transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>

                  {/* Top */}
                  <div className="flex items-center gap-3 mb-3.5">
                    <BarberAvatar initials={barber.initials} color={barber.color} size="xl" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#e0e0e0] truncate">{barber.name}</div>
                      {barber.role === 'owner' && (
                        <div className="text-[10px] text-accent-yellow uppercase tracking-[0.06em] mt-0.5">
                          Dueño
                        </div>
                      )}
                    </div>
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        barber.is_active ? 'bg-status-done' : 'bg-[#444]'
                      }`}
                    />
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
                      <span className="text-xs font-medium text-accent-yellow">
                        {formatCurrency(barber.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-text-muted">Ganó este mes</span>
                      <span className="text-xs font-medium text-accent-green">
                        {formatCurrency(barber.earned)}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {barber.role === 'owner' && (
                      <div className="inline-block bg-[#3a2a00]/60 text-accent-yellow text-[11px] font-medium px-2 py-1 rounded-[5px]">
                        Dueño
                      </div>
                    )}
                    {barber.commission_pct > 0 && (
                      <div className="inline-block bg-accent-yellow-dim text-accent-yellow text-[11px] font-medium px-2 py-1 rounded-[5px]">
                        Comisión {barber.commission_pct}%
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1.5 mt-3">
                    <button
                      onClick={() => setEditBarber(barber)}
                      className="flex-1 bg-[#222] text-[#888] border-[0.5px] border-[#333] rounded-md px-2 py-1.5 text-[11px] hover:bg-[#2a2a2a] transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => router.push(`/historial?barber=${barber.id}`)}
                      className="flex-1 bg-[#1a2e3a] text-accent-blue border-[0.5px] border-[#1e3a4a] rounded-md px-2 py-1.5 text-[11px] hover:bg-[#1e3544] transition-colors"
                    >
                      Ver historial
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabla comparativa */}
            <div className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-4">
              <div className="text-sm font-medium text-[#e0e0e0] mb-3.5">
                Comparativa del mes — todo el personal
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-[0.5px] border-[#222]">
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Barbero
                      </th>
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Rol
                      </th>
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Cortes
                      </th>
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Recaudado
                      </th>
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Comisión
                      </th>
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Ganó
                      </th>
                      <th className="text-left text-[11px] text-text-muted font-normal uppercase tracking-[0.05em] px-2 py-1.5">
                        Para barbería
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {barbers.map((barber) => (
                      <tr key={barber.id} className="border-b-[0.5px] border-[#1e1e1e]">
                        <td className="px-2 py-2.5">
                          <div className="flex items-center gap-2">
                            <BarberAvatar initials={barber.initials} color={barber.color} size="sm" />
                            <span className="text-xs font-medium text-[#e0e0e0]">{barber.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5">
                          {barber.role === 'owner' ? (
                            <span className="text-[10px] font-medium text-accent-yellow bg-[#3a2a00]/60 px-1.5 py-0.5 rounded">
                              DUEÑO
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-accent-blue bg-[#1a2e3a] px-1.5 py-0.5 rounded">
                              BARBERO
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-[#ccc]">{barber.cuts}</td>
                        <td className="px-2 py-2.5 text-xs text-accent-yellow">
                          {formatCurrency(barber.revenue)}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-[#ccc]">
                          {barber.commission_pct > 0 ? `${barber.commission_pct}%` : '—'}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-accent-green">
                          {formatCurrency(barber.earned)}
                        </td>
                        <td className="px-2 py-2.5 text-xs text-[#ccc]">
                          {formatCurrency(barber.revenue - barber.earned)}
                        </td>
                      </tr>
                    ))}
                    {/* Fila de totales */}
                    <tr className="bg-[#1e1e1e]">
                      <td className="px-2 py-2.5 text-[11px] text-[#888]" colSpan={2}>
                        TOTAL
                      </td>
                      <td className="px-2 py-2.5 text-xs font-medium text-[#e0e0e0]">{totals.cuts}</td>
                      <td className="px-2 py-2.5 text-xs font-medium text-accent-yellow">
                        {formatCurrency(totals.revenue)}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-[#888]">—</td>
                      <td className="px-2 py-2.5 text-xs font-medium text-accent-green">
                        {formatCurrency(totals.earned)}
                      </td>
                      <td className="px-2 py-2.5 text-xs font-medium text-[#e0e0e0]">
                        {formatCurrency(totals.shop)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de creación */}
      {barbershopId && (
        <CreateUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleUserCreated}
          barbershopId={barbershopId}
        />
      )}

      {/* Modal de edición */}
      <EditBarberModal
        isOpen={!!editBarber}
        barber={editBarber}
        onClose={() => setEditBarber(null)}
        onSaved={() => {
          setEditBarber(null)
          fetchBarbers()
        }}
      />
    </>
  )
}
