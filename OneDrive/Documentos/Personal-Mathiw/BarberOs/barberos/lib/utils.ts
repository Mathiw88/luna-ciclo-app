import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0'
  }
  return amount.toLocaleString('es-AR')
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function calculateIncome(amount: number, commissionPct: number) {
  const barberAmount = Math.round(amount * commissionPct / 100)
  const shopAmount = amount - barberAmount
  return { barberAmount, shopAmount }
}
