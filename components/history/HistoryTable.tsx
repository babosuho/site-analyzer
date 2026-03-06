'use client'

import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import type { AnalysisRow } from '@/types/analysis'
import { cn } from '@/lib/cn'

interface HistoryTableProps {
  analyses: AnalysisRow[]
  onSelectUrl?: (url: string) => void
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-300 text-xs">-</span>
  const color =
    score >= 80 ? 'bg-green-100 text-green-700' :
    score >= 60 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
  return (
    <span className={cn('inline-block text-xs font-semibold px-2 py-0.5 rounded-full', color)}>
      {score}
    </span>
  )
}

export function HistoryTable({ analyses, onSelectUrl }: HistoryTableProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        분석 이력이 없습니다. 분석기에서 사이트를 분석해보세요.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-500 text-xs">
            <th className="text-left px-4 py-3 font-medium">URL</th>
            <th className="text-center px-3 py-3 font-medium">종합</th>
            <th className="text-center px-3 py-3 font-medium">SEO</th>
            <th className="text-center px-3 py-3 font-medium">AEO</th>
            <th className="text-center px-3 py-3 font-medium">GEO</th>
            <th className="text-center px-3 py-3 font-medium">Speed</th>
            <th className="text-right px-4 py-3 font-medium">분석일</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {analyses.map((row) => (
            <tr key={row.id} className="bg-white hover:bg-slate-50 transition-colors group">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => onSelectUrl?.(row.url)}
                    className="text-indigo-600 hover:underline text-xs truncate max-w-[200px] text-left"
                  >
                    {row.url}
                  </button>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <ExternalLink size={12} className="text-slate-400" />
                  </a>
                </div>
              </td>
              <td className="px-3 py-3 text-center">
                <ScoreBadge score={row.overall_score} />
              </td>
              <td className="px-3 py-3 text-center"><ScoreBadge score={row.seo_score} /></td>
              <td className="px-3 py-3 text-center"><ScoreBadge score={row.aeo_score} /></td>
              <td className="px-3 py-3 text-center"><ScoreBadge score={row.geo_score} /></td>
              <td className="px-3 py-3 text-center"><ScoreBadge score={row.speed_score} /></td>
              <td className="px-4 py-3 text-right text-xs text-slate-400 whitespace-nowrap">
                {format(new Date(row.created_at), 'yy.MM.dd HH:mm')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
