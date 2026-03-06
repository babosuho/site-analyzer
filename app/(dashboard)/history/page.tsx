'use client'

import { useState, useEffect } from 'react'
import { TrendChart } from '@/components/history/TrendChart'
import { HistoryTable } from '@/components/history/HistoryTable'
import type { AnalysisRow } from '@/types/analysis'

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string>('')

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/history')
        if (!res.ok) throw new Error('이력을 불러오지 못했습니다.')
        const data = await res.json()
        setAnalyses(data.analyses ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const uniqueUrls = [...new Set(analyses.map((a) => a.url))]

  const trendData = analyses
    .filter((a) => !selectedUrl || a.url === selectedUrl)
    .slice()
    .reverse()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* URL 필터 */}
      {uniqueUrls.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 shrink-0">URL 필터:</span>
          <button
            onClick={() => setSelectedUrl('')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              !selectedUrl
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 text-slate-600 hover:border-indigo-300'
            }`}
          >
            전체
          </button>
          {uniqueUrls.map((url) => (
            <button
              key={url}
              onClick={() => setSelectedUrl(url)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors max-w-[200px] truncate ${
                selectedUrl === url
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-slate-200 text-slate-600 hover:border-indigo-300'
              }`}
            >
              {url.replace(/^https?:\/\//, '')}
            </button>
          ))}
        </div>
      )}

      {/* 트렌드 차트 */}
      {trendData.length >= 2 ? (
        <TrendChart analyses={trendData} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          트렌드 차트를 보려면 같은 URL을 2회 이상 분석하세요.
        </div>
      )}

      {/* 이력 테이블 */}
      {analyses.length > 0 ? (
        <HistoryTable analyses={selectedUrl ? analyses.filter((a) => a.url === selectedUrl) : analyses} />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          아직 분석 이력이 없습니다. 먼저 사이트를 분석해보세요.
        </div>
      )}
    </div>
  )
}
