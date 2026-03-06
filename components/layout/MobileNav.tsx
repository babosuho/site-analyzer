'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, History, GitCompare, Bell, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/cn'

const TABS = [
  { href: '/',        label: '분석',   icon: LayoutDashboard },
  { href: '/history', label: '이력',   icon: History },
  { href: '/compare', label: '비교',   icon: GitCompare },
  { href: '/monitor', label: '알림',   icon: Bell },
  { href: '/usage',   label: '사용량', icon: BarChart3 },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 safe-area-bottom">
      <div className="flex items-center">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] transition-colors',
                active ? 'text-indigo-600' : 'text-slate-400'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className={active ? 'font-semibold' : ''}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
