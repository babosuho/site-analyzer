import type { AiInsights, ApiUsage } from '@/types/analysis'
import { formatCostUsd, formatTokens } from '@/lib/ai-cost'
import { Sparkles } from 'lucide-react'

interface AiInsightsCardProps {
  insights: AiInsights
  usage?: ApiUsage
}

export function AiInsightsCard({ insights, usage }: AiInsightsCardProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-indigo-900">AI 인사이트</h3>
        </div>
        {usage && (
          <div className="flex items-center gap-2 text-[10px] text-indigo-500 bg-white/60 rounded-full px-2.5 py-1">
            <span>{formatTokens(usage.inputTokens + usage.outputTokens)} 토큰</span>
            <span>•</span>
            <span>{formatCostUsd(usage.costUsd)}</span>
          </div>
        )}
      </div>

      {/* 콘텐츠 품질 */}
      <div>
        <p className="text-xs text-indigo-600 font-medium mb-1">콘텐츠 품질 평가</p>
        <p className="text-sm text-slate-700 leading-relaxed">{insights.contentQuality}</p>
      </div>

      {/* EEAT 점수 */}
      <div className="flex items-center gap-3">
        <div className="text-xs text-indigo-600 font-medium shrink-0">E-E-A-T 점수</div>
        <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all"
            style={{ width: `${insights.eeatScore}%` }}
          />
        </div>
        <span className="text-sm font-bold text-indigo-700 w-8 text-right">{insights.eeatScore}</span>
      </div>

      {/* 키워드 */}
      {insights.keywords.length > 0 && (
        <div>
          <p className="text-xs text-indigo-600 font-medium mb-1.5">핵심 키워드</p>
          <div className="flex flex-wrap gap-1.5">
            {insights.keywords.map((kw) => (
              <span
                key={kw}
                className="text-xs bg-white/70 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 개선 권고 */}
      {insights.topRecommendations.length > 0 && (
        <div>
          <p className="text-xs text-indigo-600 font-medium mb-1.5">우선 개선 사항</p>
          <ol className="space-y-1.5">
            {insights.topRecommendations.map((rec, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-700">
                <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
