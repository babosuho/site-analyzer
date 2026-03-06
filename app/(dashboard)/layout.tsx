import { headers } from 'next/headers'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const userEmail = headersList.get('x-user-email') ?? undefined

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="lg:pl-60">
        <Header userEmail={userEmail} />
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
