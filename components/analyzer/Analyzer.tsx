'use client'

import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { AnalysisResult, AnalysisCategory, SeoIssue, CoreWebVitals } from '@/types/analysis'
import { ScoreGauge } from './ScoreGauge'
import { CategoryCard } from './CategoryCard'
import { CategorySelector } from './CategorySelector'
import { AiInsightsCard } from './AiInsightsCard'
import { ReportDownload } from '@/components/pdf/ReportDownload'
import { cn } from '@/lib/cn'

type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AnalysisResult }
  | { status: 'error'; message: string }

// ── URL 정규화: https:// 자동 프리픽스 ─────────────────────────
function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function scoreLabel(score: number) {
  if (score >= 80) return { text: '우수', color: 'text-green-600' }
  if (score >= 60) return { text: '보통', color: 'text-amber-600' }
  return { text: '개선 필요', color: 'text-red-600' }
}

export function Analyzer() {
  const [urlInput, setUrlInput] = useState('')
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile')
  const [categories, setCategories] = useState<AnalysisCategory[]>(['seo', 'aeo', 'geo', 'speed'])
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()

  const isLoading = state.status === 'loading' || isPending
  const hasSpeed = categories.includes('speed')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!urlInput.trim() || isLoading) return

    const url = normalizeUrl(urlInput)
    setState({ status: 'loading' })

    startTransition(async () => {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, strategy, categories }),
        })

        const data = await res.json()

        if (!res.ok) {
          setState({ status: 'error', message: data.error ?? '분석 중 오류가 발생했습니다.' })
          return
        }

        setState({ status: 'success', result: data as AnalysisResult })
      } catch {
        setState({ status: 'error', message: '서버에 연결할 수 없습니다.' })
      }
    })
  }

  return (
    <div className="w-full space-y-4">
      {/* URL 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* URL 입력 */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="example.com 또는 https://example.com"
              required
              disabled={isLoading}
              className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !urlInput.trim()}
            className={cn(
              'px-5 py-3 rounded-xl text-sm font-semibold shadow-sm transition-all whitespace-nowrap',
              'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isLoading ? '분석 중...' : '분석 시작'}
          </button>
        </div>

        {/* 카테고리 선택 */}
        <CategorySelector
          selected={categories}
          onChange={setCategories}
          disabled={isLoading}
        />

        {/* 기기 선택 */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">기기:</span>
          {(['mobile', 'desktop'] as const).map((s) => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value={s}
                checked={strategy === s}
                onChange={() => setStrategy(s)}
                className="accent-indigo-600"
                disabled={isLoading}
              />
              <span className="text-xs text-slate-700">{s === 'mobile' ? '모바일' : '데스크톱'}</span>
            </label>
          ))}
          {hasSpeed && (
            <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ml-auto">
              Speed 포함 시 20~30초 소요
            </span>
          )}
        </div>
      </form>

      {/* 로딩 */}
      {isLoading && (
        <div className="mt-8 flex flex-col items-center gap-4 py-8">
          <div className="flex gap-2">
            {categories.map((cat, i) => (
              <div
                key={cat}
                className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {cat.toUpperCase()}
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">사이트를 분석하고 있습니다...</p>
        </div>
      )}

      {/* 오류 */}
      {state.status === 'error' && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.message}
        </div>
      )}

      {/* 결과 */}
      {state.status === 'success' && <Results result={state.result} />}
    </div>
  )
}

function Results({ result }: { result: AnalysisResult }) {
  const { text, color } = scoreLabel(result.overallScore)
  const analyzedAt = new Date(result.analyzedAt).toLocaleString('ko-KR')

  type CategoryCardData = { title: string; subtitle: string; icon: string; score: number; issues: SeoIssue[]; cwv?: CoreWebVitals }
  const categoryCards: CategoryCardData[] = [
    result.seo   && { title: 'SEO',   subtitle: 'Search Engine Optimization',     icon: '🔍', score: result.seo.score,   issues: result.seo.issues },
    result.aeo   && { title: 'AEO',   subtitle: 'Answer Engine Optimization',     icon: '💬', score: result.aeo.score,   issues: result.aeo.issues },
    result.geo   && { title: 'GEO',   subtitle: 'Generative Engine Optimization', icon: '🤖', score: result.geo.score,   issues: result.geo.issues },
    result.speed && { title: 'Speed', subtitle: 'Core Web Vitals & 성능',          icon: '⚡', score: result.speed.score, issues: result.speed.issues, cwv: result.speed.coreWebVitals },
  ].filter(Boolean) as CategoryCardData[]

  return (
    <div className="mt-6 space-y-5">
      {/* 종합 점수 */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row items-center gap-5">
        <ScoreGauge score={result.overallScore} size="lg" label="종합 점수" />
        <div className="text-center sm:text-left flex-1 min-w-0">
          <p className="text-xs text-slate-400 mb-1">분석 URL</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 text-sm font-medium hover:underline break-all"
          >
            {result.url}
          </a>
          <div className="mt-2 flex items-center gap-2 justify-center sm:justify-start flex-wrap">
            <span className={`text-base font-bold ${color}`}>{text}</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-400">{analyzedAt} 분석</span>
          </div>
          {/* 카테고리 점수 요약 */}
          <div className="mt-3 flex gap-4 justify-center sm:justify-start flex-wrap">
            {categoryCards.map(({ title, score }) => {
              const c = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
              return (
                <div key={title} className="flex flex-col items-center">
                  <span className={`text-sm font-bold ${c}`}>{score}</span>
                  <span className="text-[10px] text-slate-400">{title}</span>
                </div>
              )
            })}
          </div>
        </div>
        {/* PDF 다운로드 */}
        <ReportDownload result={result} />
      </div>

      {/* AI 인사이트 */}
      {result.aiInsights && (
        <AiInsightsCard insights={result.aiInsights} usage={result.usage} />
      )}

      {/* 카테고리 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categoryCards.map((card) => (
          <CategoryCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  )
}
