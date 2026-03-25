'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface BarbershopData {
  id: string
  name: string
  address: string | null
  phone: string | null
  city: string | null
}

const TIMEZONES = [
  { value: 'America/Montevideo', label: 'America/Montevideo (Uruguay)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'America/Buenos_Aires (Argentina)' },
  { value: 'America/Santiago', label: 'America/Santiago (Chile)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (Brasil)' },
  { value: 'America/Bogota', label: 'America/Bogota (Colombia)' },
  { value: 'America/Lima', label: 'America/Lima (Perú)' },
  { value: 'America/New_York', label: 'America/New_York (Este USA)' },
  { value: 'America/Chicago', label: 'America/Chicago (Centro USA)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (Oeste USA)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (España)' },
  { value: 'UTC', label: 'UTC' },
]

const DATE_FORMATS = [
  { value: 'dd/MM/yyyy', label: 'DD/MM/AAAA (31/01/2026)' },
  { value: 'MM/dd/yyyy', label: 'MM/DD/AAAA (01/31/2026)' },
  { value: 'yyyy-MM-dd', label: 'AAAA-MM-DD (2026-01-31)' },
]

export default function ConfiguracionPage() {
  const [barbershop, setBarbershop] = useState<BarbershopData | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Sección: datos de la barbería
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopCity, setShopCity] = useState('')
  const [savingShop, setSavingShop] = useState(false)

  // Sección: seguridad
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  // Sección: preferencias
  const [timezone, setTimezone] = useState('America/Montevideo')
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy')
  const [savingPrefs, setSavingPrefs] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoadingData(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('barbershop_id')
        .eq('id', user.id)
        .single()

      if (profileError || !profile?.barbershop_id) {
        toast.error('No se pudo obtener la información de la barbería')
        return
      }

      const { data: shop, error: shopError } = await supabase
        .from('barbershops')
        .select('id, name, address, phone, city')
        .eq('id', profile.barbershop_id)
        .single()

      if (shopError || !shop) {
        toast.error('No se pudo cargar la configuración')
        return
      }

      setBarbershop(shop)
      setShopName(shop.name || '')
      setShopAddress(shop.address || '')
      setShopPhone(shop.phone || '')
      setShopCity(shop.city || '')
    } catch {
      toast.error('Error al cargar la configuración')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSaveShop = async () => {
    if (!barbershop) return
    if (!shopName.trim()) {
      toast.error('El nombre de la barbería es requerido')
      return
    }

    setSavingShop(true)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({
          name: shopName.trim(),
          address: shopAddress.trim() || null,
          phone: shopPhone.trim() || null,
          city: shopCity.trim() || null,
        })
        .eq('id', barbershop.id)

      if (error) throw error

      toast.success('Datos guardados', { description: 'La información de la barbería fue actualizada' })
      setBarbershop((prev) => prev ? { ...prev, name: shopName, address: shopAddress, phone: shopPhone, city: shopCity } : prev)
    } catch {
      toast.error('Error al guardar los datos')
    } finally {
      setSavingShop(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Completá todos los campos')
      return
    }
    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setSavingPassword(true)
    const supabase = createClient()
    try {
      // Re-autenticar con contraseña actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('No hay sesión activa')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        toast.error('Contraseña actual incorrecta')
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success('Contraseña actualizada correctamente')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setSavingPassword(false)
    }
  }

  const handleSavePrefs = async () => {
    setSavingPrefs(true)
    // Las preferencias pueden guardarse en barbershops o en un campo JSON
    // Por ahora guardamos en localStorage como fallback local
    try {
      localStorage.setItem('tz_pref', timezone)
      localStorage.setItem('date_format_pref', dateFormat)
      await new Promise((r) => setTimeout(r, 300)) // simular async
      toast.success('Preferencias guardadas')
    } catch {
      toast.error('Error al guardar preferencias')
    } finally {
      setSavingPrefs(false)
    }
  }

  const shopDirty =
    barbershop &&
    (shopName !== (barbershop.name || '') ||
      shopAddress !== (barbershop.address || '') ||
      shopPhone !== (barbershop.phone || '') ||
      shopCity !== (barbershop.city || ''))

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary text-sm">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <>
      {/* Topbar */}
      <div className="bg-bg-surface border-b-[0.5px] border-border-default px-5 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-text-primary">Configuración</h1>
          <p className="text-xs text-text-secondary mt-0.5">Ajustá los datos y preferencias de tu barbería</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* ── Datos de la barbería ── */}
        <section className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-medium text-text-primary">Datos de la barbería</h2>
              <p className="text-xs text-text-muted mt-0.5">Información pública de tu local</p>
            </div>
            {shopDirty && (
              <span className="text-[10px] text-accent-yellow bg-accent-yellow-dim px-2 py-0.5 rounded-full">
                Cambios sin guardar
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Nombre *
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Mi Barbería"
                className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-text-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Teléfono
              </label>
              <input
                type="tel"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="+598 99 123 456"
                className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-text-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Dirección
              </label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Av. 18 de Julio 1234"
                className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-text-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Ciudad
              </label>
              <input
                type="text"
                value={shopCity}
                onChange={(e) => setShopCity(e.target.value)}
                placeholder="Montevideo"
                className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-text-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSaveShop}
              disabled={savingShop || !shopDirty}
              className="bg-accent-yellow text-bg-base rounded-lg px-5 py-2 text-xs font-medium hover:bg-[#e6b83a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingShop ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 8"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </section>

        {/* ── Seguridad ── */}
        <section className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-text-primary">Seguridad</h2>
            <p className="text-xs text-text-muted mt-0.5">Cambiá tu contraseña de acceso</p>
          </div>

          <div className="space-y-3 max-w-sm">
            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPwd ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-[#444] rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showCurrentPwd ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary placeholder:text-[#444] rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showNewPwd ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la nueva contraseña"
                  autoComplete="new-password"
                  className={`w-full bg-[#222] border-[0.5px] text-text-primary placeholder:text-[#444] rounded-lg px-3 pr-10 py-2.5 text-sm focus:outline-none transition-colors ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-status-danger focus:border-status-danger'
                      : 'border-[#333] focus:border-[#555]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showConfirmPwd ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/>
                      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-status-danger mt-1">Las contraseñas no coinciden</p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleChangePassword}
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              className="bg-[#222] border-[0.5px] border-[#333] text-text-primary rounded-lg px-5 py-2 text-xs font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingPassword ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 8"/>
                  </svg>
                  Cambiando...
                </>
              ) : (
                'Cambiar contraseña'
              )}
            </button>
          </div>
        </section>

        {/* ── Preferencias ── */}
        <section className="bg-bg-surface border-[0.5px] border-border-default rounded-xl p-5">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-text-primary">Preferencias</h2>
            <p className="text-xs text-text-muted mt-0.5">Configurá la zona horaria y el formato de fecha</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Zona horaria
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors appearance-none cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-[#1a1a1a]">
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-text-muted uppercase tracking-[0.06em] mb-1.5">
                Formato de fecha
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full bg-[#222] border-[0.5px] border-[#333] text-text-primary rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#555] transition-colors appearance-none cursor-pointer"
              >
                {DATE_FORMATS.map((fmt) => (
                  <option key={fmt.value} value={fmt.value} className="bg-[#1a1a1a]">
                    {fmt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              className="bg-accent-yellow text-bg-base rounded-lg px-5 py-2 text-xs font-medium hover:bg-[#e6b83a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {savingPrefs ? (
                <>
                  <svg className="w-3 h-3 animate-spin" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 8"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                'Guardar preferencias'
              )}
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
