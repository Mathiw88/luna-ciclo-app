import { cn } from '@/lib/utils'

type BarberColor = 'yellow' | 'blue' | 'purple' | 'green'

const colorClasses: Record<BarberColor, string> = {
  yellow: 'bg-[#3a2e00] text-accent-yellow',
  blue: 'bg-[#1a2e3a] text-accent-blue',
  purple: 'bg-[#2e1a3a] text-accent-purple',
  green: 'bg-[#1a3a2e] text-accent-green',
}

interface BarberAvatarProps {
  initials: string
  color: BarberColor
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function BarberAvatar({ initials, color, size = 'md', className }: BarberAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-[34px] h-[34px] text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-[42px] h-[42px] text-sm',
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium flex-shrink-0',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    >
      {initials}
    </div>
  )
}
