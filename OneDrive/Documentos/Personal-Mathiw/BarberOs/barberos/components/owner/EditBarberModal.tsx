'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type AvatarColor = 'blue' | 'purple' | 'green' | 'yellow'

interface EditBarberModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  barber: {
    id: string
    name: string
    commission_pct: number
    is_active: boolean
    color: string
    initials: string
  } | null
}

interface FormData {
  name: string
  commission_pct: number
  is_active: boolean
  color: AvatarColor
}

interface FormErrors {
  name?: string
  commission_pct?: string
}

const COLOR_OPTIONS: { value: AvatarColor; dot: string; ring: string }[] = [
  { value: 'blue',   dot: 'bg-[#5bb8f5]', ring: 'ring-[#5bb8f5]' },
  { value: 'purple', dot: 'bg-[#c084f5]', ring: 'ring-[#c084f5]' },
  { value: 'green',  dot: 'bg-[#4dd4a0]', ring: 'ring-[#4dd4a0]' },
  { value: 'yellow', dot: 'bg-[#f5c542]', ring: 'ring-[#f5c542]' },
]

const AVATAR_STYLES: Record<AvatarColor, string> = {
  blue:   'bg-[#1e3a5f] text-[#5bb8f5]',
  purple: 'bg-[#2d1f4a] text-[#c084f5]',
  green:  'bg-[#1a3a2a] text-[#4dd4a0]',
  yellow: 'bg-[#3a2a00] text-[#f5c542]',
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function EditBarberModal({
  isOpen,
  onClose,
  onSaved,
  barber,
}: EditBarberModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    commission_pct: 50,
    is_active: true,
    color: 'blue',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (barber) {
      setFormData({
        name: barber.name,
        commission_pct: barber.commission_pct,
        is_active: barber.is_active,
        color: (barber.color as AvatarColor) ?? 'blue',
      })
      setErrors({})
    }
  }, [barber])

  if (!isOpen || !barber) return null

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    }
    if (formData.commission_pct < 0 || formData.commission_pct > 100) {
      newErrors.commission_pct = 'La comisión debe estar entre 0 y 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const trimmedName = formData.name.trim()
      const newInitials = getInitials(trimmedName)

      const { error } = await supabase
        .from('profiles')
        .update({
          name: trimmedName,
          commission_pct: formData.commission_pct,
          is_active: formData.is_active,
          color: formData.color,
          initials: newInitials,
        })
        .eq('id', barber.id)

      if (error) throw error

      toast.success('Barbero actualizado')
      onSaved()
      onClose()
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  const previewInitials = getInitials(formData.name) || barber.initials || '?'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-bg-surface border-[0.5px] border-border-default rounded-xl w-full max-w-[460px] mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-[0.5px] border-border-default">
          <div>
            <h2 className="text-lg font-medium text-text-primary">Editar barbero</h2>
            <p className="text-xs text-text-secondary mt-0.5">Modificá los datos del perfil</p>
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
              Nombre *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="Lucas Martínez"
              className={`w-full bg-bg-base border-[0.5px] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                errors.name
                  ? 'border-status-danger'
                  : 'border-border-default focus:border-accent-yellow'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-status-danger mt-1">{errors.name}</p>
            )}
          </div>

          {/* Comisión */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
              Comisión % *
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={formData.commission_pct}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    commission_pct: parseInt(e.target.value) || 0,
                  }))
                }
                className={`w-full bg-bg-base border-[0.5px] rounded-lg px-3 py-2 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors ${
                  errors.commission_pct
                    ? 'border-status-danger'
                    : 'border-border-default focus:border-accent-yellow'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                %
              </span>
            </div>
            {errors.commission_pct && (
              <p className="text-xs text-status-danger mt-1">{errors.commission_pct}</p>
            )}
          </div>

          {/* Estado */}
          <div>
            <label className="text-xs text-text-secondary uppercase tracking-[0.06em] block mb-1.5">
              Estado
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData((f) => ({ ...f, is_active: true }))}
                className={`py-2 px-3 rounded-lg border-[0.5px] text-sm font-medium transition-all ${
                  formData.is_active
                    ? 'bg-accent-yellow-dim border-accent-yellow text-accent-yellow'
                    : 'bg-bg-base border-border-default text-text-muted hover:border-[#444]'
                }`}
              >
                Activo
              </button>
              <button
                type="button"
                onClick={() => setFormData((f) => ({ ...f, is_active: false }))}
                className={`py-2 px-3 rounded-lg border-[0.5px] text-sm font-medium transition-all ${
                  !formData.is_active
                    ? 'bg-[#2a1a1a] border-[#ff6b6b] text-[#ff6b6b]'
                    : 'bg-bg-base border-border-default text-text-muted hover:border-[#444]'
                }`}
              >
                Inactivo
              </button>
            </div>
          </div>

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
                  className={`w-8 h-8 rounded-full transition-all ${opt.dot} ${
                    formData.color === opt.value
                      ? 'ring-2 ring-offset-2 ring-offset-bg-surface ' + opt.ring
                      : 'opacity-60 hover:opacity-90'
                  }`}
                />
              ))}

              {/* Avatar preview */}
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] text-text-muted">Vista previa:</span>
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                    AVATAR_STYLES[formData.color]
                  }`}
                >
                  {previewInitials}
                </div>
              </div>
            </div>
          </div>
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
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
