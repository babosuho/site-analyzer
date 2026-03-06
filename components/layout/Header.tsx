'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'

const PAGE_TITLES: Record<string, string> = {
  '/':         '사이트 분석기',
  '/history':  '분석 이력',
  '/compare':  '비교 분석',
  '/monitor':  '정기 모니터링',
  '/usage':    'AI 사용량',
  '/settings': '설정',
}

interface HeaderProps {
  userEmail?: string
}

export function Header({ userEmail }: HeaderProps) {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? 'Site Analyzer'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      {/* 모바일 메뉴 버튼 + 타이틀 */}
      <div className="flex items-center gap-3">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* 모바일 로고 */}
        <div className="flex lg:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Site Analyzer</span>
        </div>

        <h1 className="hidden lg:block text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      {/* 사용자 정보 */}
      {userEmail && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-indigo-700">
              {userEmail[0].toUpperCase()}
            </span>
          </div>
          <span className="hidden sm:block text-sm text-slate-600 max-w-[160px] truncate">
            {userEmail}
          </span>
        </div>
      )}

      {/* 모바일 드롭다운 메뉴 */}
      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} />
      )}
    </header>
  )
}

const NAV_ITEMS = [
  { href: '/',        label: '분석기' },
  { href: '/history', label: '분석 이력' },
  { href: '/compare', label: '비교 분석' },
  { href: '/monitor', label: '모니터링' },
  { href: '/usage',   label: 'AI 사용량' },
  { href: '/settings',label: '설정' },
]

function MobileMenu({ onClose }: { onClose: () => void }) {
  const pathname = usePathname()

  return (
    <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-200 shadow-lg lg:hidden z-50">
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              'block px-4 py-2.5 rounded-lg text-sm transition-colors',
              pathname === href
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-slate-700 hover:bg-slate-50'
            )}
          >
            {label}
          </Link>
        ))}
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="block w-full text-left px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          로그아웃
        </button>
      </nav>
    </div>
  )
}
