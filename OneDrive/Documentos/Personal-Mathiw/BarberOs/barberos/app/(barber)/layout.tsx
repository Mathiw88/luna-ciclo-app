import BarberSidebar from '@/components/barber/BarberSidebar'

export default function BarberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <BarberSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
