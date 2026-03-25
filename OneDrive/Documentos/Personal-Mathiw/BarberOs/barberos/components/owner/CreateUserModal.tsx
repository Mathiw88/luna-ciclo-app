'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

type Role = 'barber' | 'owner'
type AvatarColor = 'blue' | 'purple' | 'green' | 'yellow'

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (name: string) => void
  barbershopId: string
}

interface FormData {
  name: string
  email: string
  password: string
  role: Role
  commission: number
  color: AvatarColor
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  commission?: string
}

const COLOR_OPTIONS: { value: AvatarColor; bg: string; ring: string }[] = [
  { value: 'blue',   bg: 'bg-[#1e3a5f]',  ring: 'ring-[#3b82f6]' },
  { value: 'purple', bg: 'bg-[#2d1f4a]',  ring: 'ring-[#a855f7]' },
  { value: 'green',  bg: 'bg-[#1a3a2a]',  ring: 'ring-[#22c55e]' },
  { value: 'yellow', bg: 'bg-[#3a2a00]',  ring: 'ring-[#f4c430]' },
]

const COLOR_DOT: Record<AvatarColor, string> = {
  blue:   'bg-[#3b82f6]',
  purple: 'bg-[#a855f7]',
  green:  'bg-[#22c55e]',
  yellow: 'bg-[#f4c430]',
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSuccess,
  barbershopId,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'barber',
    commission: 50,
    color: 'blue',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  if (!isOpen) return null

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      newErrors.email = 'Ingresá un email válido'
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }
    if (formData.role === 'barber') {
      if (formData.commission < 1 || formData.commission > 100) {
        newErrors.commission = 'La comisión debe estar entre 1 y 100'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    setServerError(null)
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          role: formData.role,
          barbershopId,
          commissionPct: formData.role === 'barber' ? formData.commission : 50,
          color: formData.color,
          initials: getInitials(formData.name),
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setServerError(json.error ?? 'Error al crear el usuario')
        return
      }

      onSuccess(formData.name.trim())
      handleClose()
    } catch {
      setServerError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', email: '', password: '', role: 'barber', commission: 50, color: 'blue' })
    setErrors({})
    setServerError(null)
    setShowPassword(false)
    onClose()
  }

  const initials = getInitials(formData.name) || 'AB'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl w-full max-w-[540px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-border-default">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Crear usuario</h2>
            <p className="text-xs text-text-secondary mt-0.5">Barbero o dueño con acceso al sistema</p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#222] transition-colors"
          >
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Nombre */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
              Nombre completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="Lucas Martínez"
              className={`w-full bg-bg-base border-[0.5px] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                errors.name ? 'border-status-danger' : 'border-border-default focus:border-accent-yellow'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-status-danger mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
              placeholder="lucas@barberia.com"
              className={`w-full bg-bg-base border-[0.5px] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                errors.email ? 'border-status-danger' : 'border-border-default focus:border-accent-yellow'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-status-danger mt-1">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
              Contraseña temporal *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 8 caracteres"
                className={`w-full bg-bg-base border-[0.5px] rounded-lg px-3 py-2 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                  errors.password ? 'border-status-danger' : 'border-border-default focus:border-accent-yellow'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-status-danger mt-1">{errors.password}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
              Rol
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Barbero */}
              <button
                type="button"
                onClick={() => setFormData((f) => ({ ...f, role: 'barber' }))}
                className={`p-3 rounded-lg border-[0.5px] text-left transition-all ${
                  formData.role === 'barber'
                    ? 'bg-[#1a2e3a] border-accent-blue'
                    : 'bg-bg-base border-border-default hover:border-[#444]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">✂️</span>
                  <span className="text-sm font-medium text-text-primary">Barbero</span>
                  {formData.role === 'barber' && (
                    <span className="ml-auto text-[10px] text-accent-blue font-medium bg-[#1e3a4a] px-1.5 py-0.5 rounded">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-tight">
                  Puede registrar cortes, ve sus ingresos y puede recibir adelantos.
                </p>
              </button>

              {/* Dueño */}
              <button
                type="button"
                onClick={() => setFormData((f) => ({ ...f, role: 'owner' }))}
                className={`p-3 rounded-lg border-[0.5px] text-left transition-all ${
                  formData.role === 'owner'
                    ? 'bg-accent-yellow-dim border-accent-yellow'
                    : 'bg-bg-base border-border-default hover:border-[#444]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">👑</span>
                  <span className="text-sm font-medium text-text-primary">Dueño</span>
                  {formData.role === 'owner' && (
                    <span className="ml-auto text-[10px] text-accent-yellow font-medium bg-[#3a2a00]/60 px-1.5 py-0.5 rounded">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-text-muted leading-tight">
                  Acceso total al sistema. También puede atender clientes como barbero.
                </p>
              </button>
            </div>
          </div>

          {/* Comisión (solo para barberos) */}
          {formData.role === 'barber' && (
            <div>
              <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
                Comisión % *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.commission}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, commission: parseInt(e.target.value) || 0 }))
                  }
                  className={`w-full bg-bg-base border-[0.5px] rounded-lg px-3 py-2 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                    errors.commission ? 'border-status-danger' : 'border-border-default focus:border-accent-yellow'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">%</span>
              </div>
              {errors.commission && (
                <p className="text-xs text-status-danger mt-1">{errors.commission}</p>
              )}
            </div>
          )}

          {/* Color del avatar */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-2">
              Color del avatar
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData((f) => ({ ...f, color: opt.value }))}
                  className={`w-8 h-8 rounded-full transition-all ${COLOR_DOT[opt.value]} ${
                    formData.color === opt.value
                      ? 'ring-2 ring-offset-2 ring-offset-bg-surface ' + opt.ring
                      : 'opacity-60 hover:opacity-90'
                  }`}
                />
              ))}

              {/* Preview del avatar */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-text-muted">Vista previa:</span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    formData.color === 'blue'
                      ? 'bg-[#1e3a5f] text-[#60a5fa]'
                      : formData.color === 'purple'
                      ? 'bg-[#2d1f4a] text-[#c084fc]'
                      : formData.color === 'green'
                      ? 'bg-[#1a3a2a] text-[#4ade80]'
                      : 'bg-[#3a2a00] text-[#f4c430]'
                  }`}
                >
                  {initials}
                </div>
              </div>
            </div>
          </div>

          {/* Error de servidor */}
          {serverError && (
            <div className="bg-[#2a1a1a] border-[0.5px] border-status-danger/40 rounded-lg px-4 py-3">
              <p className="text-sm text-status-danger">{serverError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t-[0.5px] border-border-default">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 bg-[#222] text-text-secondary border-[0.5px] border-[#333] rounded-lg px-4 py-2 text-sm hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-accent-yellow text-bg-base rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#e6b83a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Creando...
              </>
            ) : (
              'Crear usuario'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
