import { SeoIssue } from '@/types/analysis'

interface IssueListProps {
  issues: SeoIssue[]
  maxVisible?: number
}

const SEVERITY_STYLES = {
  critical: {
    badge: 'bg-red-100 text-red-700 border border-red-200',
    dot: 'bg-red-500',
    label: '심각',
  },
  warning: {
    badge: 'bg-amber-100 text-amber-700 border border-amber-200',
    dot: 'bg-amber-500',
    label: '경고',
  },
  info: {
    badge: 'bg-blue-100 text-blue-700 border border-blue-200',
    dot: 'bg-blue-500',
    label: '정보',
  },
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2 }

export function IssueList({ issues, maxVisible = 5 }: IssueListProps) {
  if (issues.length === 0) {
    return (
      <p className="text-sm text-green-600 flex items-center gap-1.5">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
        이슈 없음
      </p>
    )
  }

  const sorted = [...issues].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  )
  const visible = sorted.slice(0, maxVisible)
  const hidden = sorted.length - visible.length

  return (
    <ul className="space-y-2">
      {visible.map((issue) => {
        const style = SEVERITY_STYLES[issue.severity]
        return (
          <li key={issue.id} className="flex flex-col gap-1">
            <div className="flex items-start gap-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${style.badge}`}>
                    {style.label}
                  </span>
                  <p className="text-sm text-gray-700 font-medium">{issue.message}</p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {issue.recommendation}
                </p>
              </div>
            </div>
          </li>
        )
      })}
      {hidden > 0 && (
        <li className="text-xs text-gray-400 pl-3.5">+{hidden}개 더 있음</li>
      )}
    </ul>
  )
}
