'use client'

import { cn } from '@/lib/cn'
import type { AnalysisCategory } from '@/types/analysis'

const CATEGORIES: { id: AnalysisCategory; label: string; icon: string; desc: string; slow?: boolean }[] = [
  { id: 'seo',   label: 'SEO',   icon: '🔍', desc: '검색 엔진 최적화' },
  { id: 'aeo',   label: 'AEO',   icon: '💬', desc: '답변 엔진 최적화' },
  { id: 'geo',   label: 'GEO',   icon: '🤖', desc: 'AI 검색 최적화' },
  { id: 'speed', label: 'Speed', icon: '⚡', desc: 'Core Web Vitals', slow: true },
]

interface CategorySelectorProps {
  selected: AnalysisCategory[]
  onChange: (next: AnalysisCategory[]) => void
  disabled?: boolean
}

export function CategorySelector({ selected, onChange, disabled }: CategorySelectorProps) {
  function toggle(id: AnalysisCategory) {
    if (disabled) return
    const next = selected.includes(id)
      ? selected.filter((c) => c !== id)
      : [...selected, id]
    // 최소 1개는 선택 유지
    if (next.length === 0) return
    onChange(next)
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-slate-500 font-medium">분석 항목 선택</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {CATEGORIES.map(({ id, label, icon, desc, slow }) => {
          const active = selected.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all text-left',
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-base">{icon}</span>
              <div className="min-w-0">
                <div className="font-semibold text-xs leading-tight">{label}</div>
                <div className="text-[10px] leading-tight opacity-70 truncate">{desc}</div>
              </div>
              {slow && active && (
                <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 px-1 rounded shrink-0">느림</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
