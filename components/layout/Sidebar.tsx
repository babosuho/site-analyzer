'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  History,
  GitCompare,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'

const NAV_ITEMS = [
  { href: '/',        label: '분석기',    icon: LayoutDashboard },
  { href: '/history', label: '분석 이력', icon: History },
  { href: '/compare', label: '비교 분석', icon: GitCompare },
  { href: '/monitor', label: '모니터링',  icon: Bell },
  { href: '/usage',   label: 'AI 사용량', icon: BarChart3 },
  { href: '/settings',label: '설정',      icon: Settings },
]

async function handleLogout() {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-slate-900 text-white fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Site Analyzer</p>
          <p className="text-[10px] text-slate-400">SEO · AEO · GEO · Speed</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
