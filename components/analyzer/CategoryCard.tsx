import { SeoIssue, CoreWebVitals } from '@/types/analysis'
import { ScoreGauge } from './ScoreGauge'
import { IssueList } from './IssueList'
import { CwvGrid } from './CwvGrid'

interface CategoryCardProps {
  title: string
  subtitle: string
  icon: string
  score: number
  issues: SeoIssue[]
  cwv?: CoreWebVitals
}

function scoreBorderColor(score: number) {
  if (score >= 80) return 'border-t-green-500'
  if (score >= 60) return 'border-t-amber-500'
  return 'border-t-red-500'
}

export function CategoryCard({ title, subtitle, icon, score, issues, cwv }: CategoryCardProps) {
  const criticalCount = issues.filter((i) => i.severity === 'critical').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 border-t-4 ${scoreBorderColor(score)} overflow-hidden`}>
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <ScoreGauge score={score} size="sm" />
      </div>

      {issues.length > 0 && (
        <div className="flex gap-2 px-5 pb-3">
          {criticalCount > 0 && (
            <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
              심각 {criticalCount}
            </span>
          )}
          {warningCount > 0 && (
            <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
              경고 {warningCount}
            </span>
          )}
        </div>
      )}

      {cwv && (
        <div className="px-5 pb-3">
          <CwvGrid cwv={cwv} />
        </div>
      )}

      <div className="mx-5 border-t border-slate-100" />
      <div className="p-5 pt-3">
        <IssueList issues={issues} maxVisible={4} />
      </div>
    </div>
  )
}
