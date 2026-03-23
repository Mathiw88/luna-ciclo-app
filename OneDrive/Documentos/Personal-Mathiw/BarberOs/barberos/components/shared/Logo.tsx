export default function Logo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: { container: 'w-7 h-7 rounded-lg', svg: 'w-4 h-4', title: 'text-sm', sub: 'text-[8px]' },
    default: { container: 'w-8 h-8 rounded-lg', svg: 'w-[18px] h-[18px]', title: 'text-[15px]', sub: 'text-[9px]' },
    large: { container: 'w-10 h-10 rounded-[10px]', svg: 'w-[22px] h-[22px]', title: 'text-[22px]', sub: 'text-[10px]' },
  }

  const s = sizes[size]

  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.container} bg-accent-yellow flex items-center justify-center flex-shrink-0`}>
        <svg className={s.svg} viewBox="0 0 18 18" fill="none">
          <path d="M4 14L9 4L14 14" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 10.5h6" stroke="#111" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <div className={`${s.title} font-medium text-accent-yellow tracking-[0.02em]`}>BarberOS</div>
        <div className={`${s.sub} text-text-muted tracking-[0.1em] uppercase leading-none mt-0.5`}>
          Sistema de gestión
        </div>
      </div>
    </div>
  )
}
