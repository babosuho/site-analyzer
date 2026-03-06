'use client'

import { useState, useTransition } from 'react'
import { Plus, X, GitCompare } from 'lucide-react'
import type { AnalysisResult, AnalysisCategory } from '@/types/analysis'
import { ScoreGauge } from '@/components/analyzer/ScoreGauge'
import { CategorySelector } from '@/components/analyzer/CategorySelector'
import { cn } from '@/lib/cn'

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

const COMPARE_METRICS = [
  { key: 'overallScore', label: '종합 점수' },
  { key: 'seo',   label: 'SEO' },
  { key: 'aeo',   label: 'AEO' },
  { key: 'geo',   label: 'GEO' },
  { key: 'speed', label: 'Speed' },
] as const

function getScore(result: AnalysisResult, key: string): number | null {
  if (key === 'overallScore') return result.overallScore
  const cat = result[key as 'seo' | 'aeo' | 'geo' | 'speed']
  return cat?.score ?? null
}

function ScoreCell({ score, isBest }: { score: number | null; isBest: boolean }) {
  if (score === null) return <td className="px-4 py-3 text-center text-slate-300 text-sm">-</td>
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'
  return (
    <td className={cn('px-4 py-3 text-center text-sm font-bold', color)}>
      {score}
      {isBest && <span className="ml-1 text-[10px] bg-green-100 text-green-700 px-1 rounded">최고</span>}
    </td>
  )
}

export function CompareView() {
  const [urls, setUrls] = useState<string[]>(['', ''])
  const [categories, setCategories] = useState<AnalysisCategory[]>(['seo', 'aeo', 'geo'])
  const [results, setResults] = useState<AnalysisResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function updateUrl(i: number, value: string) {
    setUrls(urls.map((u, idx) => (idx === i ? value : u)))
  }

  function addUrl() {
    if (urls.length < 3) setUrls([...urls, ''])
  }

  function removeUrl(i: number) {
    if (urls.length <= 2) return
    setUrls(urls.filter((_, idx) => idx !== i))
  }

  async function handleCompare() {
    const normalizedUrls = urls.map(normalizeUrl).filter(Boolean)
    if (normalizedUrls.length < 2) {
      setError('최소 2개의 URL을 입력해주세요.')
      return
    }

    setError(null)
    setResults(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: normalizedUrls, categories }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setResults(data.results)
      } catch (e) {
        setError(e instanceof Error ? e.message : '비교 분석 중 오류가 발생했습니다.')
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* URL 입력 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">비교할 URL 입력 (최대 3개)</h2>
        <div className="space-y-2">
          {urls.map((url, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-slate-400 w-4 shrink-0">{i + 1}</span>
              <input
                type="text"
                value={url}
                onChange={(e) => updateUrl(i, e.target.value)}
                placeholder={`example${i + 1}.com`}
                disabled={isPending}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              {urls.length > 2 && (
                <button onClick={() => removeUrl(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {urls.length < 3 && (
          <button
            onClick={addUrl}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus size={14} /> URL 추가
          </button>
        )}

        <CategorySelector selected={categories} onChange={setCategories} disabled={isPending} />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleCompare}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <GitCompare size={16} />
          {isPending ? '분석 중...' : '비교 분석 시작'}
        </button>
      </div>

      {/* 비교 결과 */}
      {results && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* 종합 점수 게이지 */}
          <div className="grid divide-x divide-slate-100" style={{ gridTemplateColumns: `repeat(${results.length}, 1fr)` }}>
            {results.map((r) => (
              <div key={r.url} className="p-5 flex flex-col items-center gap-2">
                <p className="text-xs text-slate-500 text-center break-all">{r.url}</p>
                <ScoreGauge score={r.overallScore} size="sm" />
              </div>
            ))}
          </div>

          {/* 점수 비교 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs border-t border-slate-100">
                  <th className="text-left px-4 py-2.5 font-medium">항목</th>
                  {results.map((r) => (
                    <th key={r.url} className="text-center px-4 py-2.5 font-medium truncate max-w-[120px]">
                      {new URL(r.url).hostname}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {COMPARE_METRICS.map(({ key, label }) => {
                  const scores = results.map((r) => getScore(r, key))
                  const max = Math.max(...scores.filter((s): s is number => s !== null))
                  return (
                    <tr key={key} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700 text-xs">{label}</td>
                      {results.map((r, i) => (
                        <ScoreCell key={i} score={scores[i]} isBest={scores[i] === max && max > 0} />
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
