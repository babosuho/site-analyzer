'use client'

import { useEffect, useState } from 'react'
import { Zap, DollarSign, TrendingUp, BarChart2 } from 'lucide-react'

interface UsageData {
  totalAnalyses: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  recentAnalyses: Array<{
    url: string
    createdAt: string
    overallScore: number
    costUsd: number
    inputTokens: number
    outputTokens: number
  }>
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'indigo',
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color?: 'indigo' | 'green' | 'amber' | 'blue'
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-xl font-bold text-slate-900 truncate">{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatCost(usd: number): string {
  if (usd < 0.01) return `$${(usd * 100).toFixed(2)}¢`
  return `$${usd.toFixed(4)}`
}

export function UsageStats() {
  const [data, setData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch('/api/history?limit=100')
        if (!res.ok) throw new Error('사용량 데이터를 불러오지 못했습니다.')
        const json = await res.json()
        setData(json.usage ?? {
          totalAnalyses: json.analyses?.length ?? 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCostUsd: 0,
          recentAnalyses: (json.analyses ?? []).slice(0, 10).map((a: {
            url: string
            created_at: string
            overall_score: number
            ai_cost_usd?: number
            ai_input_tokens?: number
            ai_output_tokens?: number
          }) => ({
            url: a.url,
            createdAt: a.created_at,
            overallScore: a.overall_score,
            costUsd: a.ai_cost_usd ?? 0,
            inputTokens: a.ai_input_tokens ?? 0,
            outputTokens: a.ai_output_tokens ?? 0,
          })),
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsage()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
    )
  }

  if (!data) return null

  const avgCostPerAnalysis = data.totalAnalyses > 0
    ? data.totalCostUsd / data.totalAnalyses
    : 0

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={BarChart2}
          label="총 분석 횟수"
          value={data.totalAnalyses.toString()}
          sub="전체 누적"
          color="indigo"
        />
        <StatCard
          icon={Zap}
          label="총 Input 토큰"
          value={formatTokens(data.totalInputTokens)}
          sub={`Output: ${formatTokens(data.totalOutputTokens)}`}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="총 API 비용"
          value={formatCost(data.totalCostUsd)}
          sub="Claude API (USD)"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="분석당 평균 비용"
          value={formatCost(avgCostPerAnalysis)}
          sub="평균 (USD)"
          color="amber"
        />
      </div>

      {/* 요금 안내 */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 text-xs text-indigo-700 space-y-1">
        <p className="font-semibold text-indigo-900">Claude API 요금 기준 (claude-sonnet-4-5)</p>
        <div className="flex gap-6 mt-1">
          <span>Input: $3.00 / 1M 토큰</span>
          <span>Output: $15.00 / 1M 토큰</span>
        </div>
      </div>

      {/* 최근 분석 비용 내역 */}
      {data.recentAnalyses.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">최근 분석 내역</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-4 py-2.5 font-medium">URL</th>
                  <th className="text-center px-3 py-2.5 font-medium">점수</th>
                  <th className="text-center px-3 py-2.5 font-medium">Input</th>
                  <th className="text-center px-3 py-2.5 font-medium">Output</th>
                  <th className="text-center px-3 py-2.5 font-medium">비용</th>
                  <th className="text-right px-4 py-2.5 font-medium">일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentAnalyses.map((a, i) => {
                  const scoreColor =
                    a.overallScore >= 80
                      ? 'text-green-600'
                      : a.overallScore >= 60
                      ? 'text-amber-600'
                      : 'text-red-600'
                  return (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 max-w-[180px] truncate text-slate-700">
                        {a.url.replace(/^https?:\/\//, '')}
                      </td>
                      <td className={`px-3 py-3 text-center font-bold ${scoreColor}`}>{a.overallScore}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{formatTokens(a.inputTokens)}</td>
                      <td className="px-3 py-3 text-center text-slate-500">{formatTokens(a.outputTokens)}</td>
                      <td className="px-3 py-3 text-center text-slate-700 font-medium">
                        {a.costUsd > 0 ? formatCost(a.costUsd) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {new Date(a.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.recentAnalyses.length === 0 && (
        <div className="text-center py-12 text-slate-400 text-sm">
          아직 AI 분석 내역이 없습니다.
        </div>
      )}
    </div>
  )
}
