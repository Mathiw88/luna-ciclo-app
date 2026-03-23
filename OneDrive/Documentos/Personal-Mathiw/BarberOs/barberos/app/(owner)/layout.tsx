import OwnerSidebar from '@/components/owner/OwnerSidebar'

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <OwnerSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
