'use client'

import { Calendar, X, UserX, Edit3 } from 'lucide-react'

interface AppointmentActionsMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  onEdit: () => void
  onCancel: () => void
  onNoShow: () => void
  appointmentStatus: string
}

export default function AppointmentActionsMenu({
  isOpen,
  position,
  onClose,
  onEdit,
  onCancel,
  onNoShow,
  appointmentStatus,
}: AppointmentActionsMenuProps) {
  if (!isOpen) return null

  // Permitir editar/marcar solo turnos que no están cancelados o no_show
  const canEdit = appointmentStatus !== 'cancelled' && appointmentStatus !== 'no_show'

  return (
    <>
      {/* Overlay invisible para cerrar al hacer click afuera */}
      <div
        className="fixed inset-0 z-40"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      />

      {/* Menu */}
      <div
        className="fixed z-50 bg-bg-surface border-[0.5px] border-border-default rounded-lg shadow-xl min-w-[200px]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        <div className="py-1">
          {canEdit && (
            <>
              <button
                onClick={() => {
                  onEdit()
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-[#222] transition-colors"
              >
                <Edit3 className="w-4 h-4 text-text-secondary" />
                Editar turno
              </button>

              <button
                onClick={() => {
                  onNoShow()
                  onClose()
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-[#222] transition-colors"
              >
                <UserX className="w-4 h-4 text-text-secondary" />
                No asistió
              </button>

              <div className="h-[0.5px] bg-border-default my-1" />
            </>
          )}

          <button
            onClick={() => {
              onCancel()
              onClose()
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-status-danger hover:bg-[#1a0d0d] transition-colors"
          >
            <X className="w-4 h-4" />
            Eliminar turno
          </button>
        </div>
      </div>
    </>
  )
}
