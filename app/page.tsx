import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { MobileNav } from '@/components/layout/MobileNav'
import { Analyzer } from '@/components/analyzer/Analyzer'

export const runtime = 'edge'

export default async function RootPage() {
  const headersList = await headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email') ?? undefined

  if (!userId) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-60">
        <Header userEmail={userEmail} />
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">
          <div className="max-w-3xl mx-auto">
            <Analyzer />
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
