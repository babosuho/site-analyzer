'use client'

import { useState, useTransition } from 'react'
import { AnalysisResult } from '@/types/analysis'
import { ScoreGauge } from './ScoreGauge'
import { CategoryCard } from './CategoryCard'

type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AnalysisResult }
  | { status: 'error'; message: string }

function scoreLabel(score: number) {
  if (score >= 80) return { text: '우수', color: 'text-green-600' }
  if (score >= 60) return { text: '보통', color: 'text-amber-600' }
  return { text: '개선 필요', color: 'text-red-600' }
}

export function Analyzer() {
  const [url, setUrl] = useState('')
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile')
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })
  const [isPending, startTransition] = useTransition()

  const isLoading = state.status === 'loading' || isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || isLoading) return

    setState({ status: 'loading' })

    startTransition(async () => {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim(), strategy }),
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
    <div className="w-full">
      {/* URL 입력 폼 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
              https://
            </span>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="example.com"
              required
              disabled={isLoading}
              className="w-full pl-[72px] pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900
                         placeholder:text-gray-400 text-sm shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm
                       hover:bg-blue-700 active:bg-blue-800
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors whitespace-nowrap"
          >
            {isLoading ? '분석 중...' : '분석 시작'}
          </button>
        </div>

        {/* 전략 선택 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">기기:</span>
          {(['mobile', 'desktop'] as const).map(s => (
            <label key={s} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value={s}
                checked={strategy === s}
                onChange={() => setStrategy(s)}
                className="accent-blue-600"
              />
              <span className="text-xs text-gray-700 capitalize">{s === 'mobile' ? '모바일' : '데스크톱'}</span>
            </label>
          ))}
        </div>
      </form>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {['SEO', 'AEO', 'GEO', 'Speed'].map((label, i) => (
              <div
                key={label}
                className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold
                           animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                {label}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">사이트를 분석하고 있습니다...</p>
          <p className="text-xs text-gray-400">PageSpeed 측정 포함 시 20~30초 소요될 수 있습니다.</p>
        </div>
      )}

      {/* 오류 상태 */}
      {state.status === 'error' && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
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

  return (
    <div className="mt-8 space-y-6">
      {/* 종합 점수 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-6">
        <ScoreGauge score={result.overallScore} size="lg" label="종합 점수" />
        <div className="text-center sm:text-left">
          <p className="text-xs text-gray-400 mb-1">분석 URL</p>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm font-medium hover:underline break-all"
          >
            {result.url}
          </a>
          <div className="mt-2 flex items-center gap-2 justify-center sm:justify-start">
            <span className={`text-lg font-bold ${color}`}>{text}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-400">{analyzedAt} 분석</span>
          </div>
          {/* 카테고리 점수 요약 */}
          <div className="mt-3 flex gap-3 justify-center sm:justify-start">
            {[
              { label: 'SEO', score: result.seo.score },
              { label: 'AEO', score: result.aeo.score },
              { label: 'GEO', score: result.geo.score },
              { label: 'Speed', score: result.speed.score },
            ].map(({ label, score }) => {
              const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
              return (
                <div key={label} className="flex flex-col items-center">
                  <span className={`text-sm font-bold ${color}`}>{score}</span>
                  <span className="text-[10px] text-gray-400">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 카테고리 카드 2×2 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CategoryCard
          title="SEO"
          subtitle="Search Engine Optimization"
          icon="🔍"
          score={result.seo.score}
          issues={result.seo.issues}
        />
        <CategoryCard
          title="AEO"
          subtitle="Answer Engine Optimization"
          icon="💬"
          score={result.aeo.score}
          issues={result.aeo.issues}
        />
        <CategoryCard
          title="GEO"
          subtitle="Generative Engine Optimization"
          icon="🤖"
          score={result.geo.score}
          issues={result.geo.issues}
        />
        <CategoryCard
          title="Speed"
          subtitle="Core Web Vitals & 성능"
          icon="⚡"
          score={result.speed.score}
          issues={result.speed.issues}
          cwv={result.speed.coreWebVitals}
        />
      </div>
    </div>
  )
}
