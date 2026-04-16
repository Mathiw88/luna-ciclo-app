'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CalendarProps {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  minDate?: string
}

export default function Calendar({ selectedDate, onSelectDate, minDate }: CalendarProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isDateDisabled = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    const dateStr = date.toISOString().split('T')[0]

    if (minDate) {
      return dateStr < minDate
    }

    return false
  }

  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    )
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false
    const date = new Date(currentYear, currentMonth, day)
    const dateStr = date.toISOString().split('T')[0]
    return dateStr === selectedDate
  }

  const handleDayClick = (day: number) => {
    if (isDateDisabled(day)) return
    const date = new Date(currentYear, currentMonth, day)
    const dateStr = date.toISOString().split('T')[0]
    onSelectDate(dateStr)
  }

  const daysInMonth = getDaysInMonth(currentMonth, currentYear)
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

  const days = []
  // Espacios vacíos antes del primer día
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />)
  }
  // Días del mes
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        disabled={isDateDisabled(day)}
        className={`
          aspect-square rounded-md text-[11px] font-medium transition-all
          ${isSelected(day)
            ? 'bg-accent-yellow text-bg-base'
            : isToday(day)
            ? 'bg-accent-yellow-dim text-accent-yellow border-[0.5px] border-accent-yellow'
            : isDateDisabled(day)
            ? 'text-[#333] cursor-not-allowed'
            : 'text-text-primary hover:bg-[#222]'
          }
        `}
      >
        {day}
      </button>
    )
  }

  return (
    <div className="bg-bg-base border-[0.5px] border-border-default rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={handlePrevMonth}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#222] transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-text-secondary" />
        </button>
        <div className="text-xs font-medium text-text-primary">
          {monthNames[currentMonth]} {currentYear}
        </div>
        <button
          onClick={handleNextMonth}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[#222] transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-1.5">
        {dayNames.map((name) => (
          <div key={name} className="text-center text-[9px] text-text-muted uppercase">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-2.5 border-t-[0.5px] border-border-default">
        <div className="flex items-center gap-1.5 text-[9px] text-text-muted">
          <div className="w-3 h-3 rounded bg-accent-yellow-dim border-[0.5px] border-accent-yellow" />
          Hoy
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-text-muted">
          <div className="w-3 h-3 rounded bg-accent-yellow" />
          Seleccionado
        </div>
      </div>
    </div>
  )
}
