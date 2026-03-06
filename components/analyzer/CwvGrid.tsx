import { CoreWebVitals } from '@/types/analysis'

interface CwvGridProps {
  cwv: CoreWebVitals
}

function metricStatus(value: number, good: number, poor: number) {
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

const STATUS_STYLES = {
  good: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500', label: '좋음' },
  'needs-improvement': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', label: '개선 필요' },
  poor: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500', label: '나쁨' },
  na: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500', dot: 'bg-slate-400', label: '측정 불가' },
}

function formatValue(value: number, unit: string): string {
  if (unit === 'ms') return `${(value / 1000).toFixed(1)}s`
  if (unit === 'score') return value.toFixed(3)
  return `${value}${unit}`
}

const METRICS = [
  { label: 'LCP', unit: 'ms', good: 2500, poor: 4000, key: 'lcp' as keyof CoreWebVitals, description: 'Largest Contentful Paint' },
  { label: 'INP', unit: 'ms', good: 200, poor: 500, key: 'inp' as keyof CoreWebVitals, description: 'Interaction to Next Paint' },
  { label: 'CLS', unit: 'score', good: 0.1, poor: 0.25, key: 'cls' as keyof CoreWebVitals, description: 'Cumulative Layout Shift' },
  { label: 'FCP', unit: 'ms', good: 1800, poor: 3000, key: 'fcp' as keyof CoreWebVitals, description: 'First Contentful Paint' },
  { label: 'TTFB', unit: 'ms', good: 800, poor: 1800, key: 'ttfb' as keyof CoreWebVitals, description: 'Time to First Byte' },
]

export function CwvGrid({ cwv }: CwvGridProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {METRICS.map(({ label, unit, good, poor, key, description }) => {
        const value = cwv[key]
        const status = value === null ? 'na' : metricStatus(value, good, poor)
        const style = STATUS_STYLES[status]

        return (
          <div key={label} className={`flex flex-col items-center gap-1 rounded-lg border p-2 ${style.bg} ${style.border}`} title={description}>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider">{label}</span>
            <span className={`text-sm font-bold ${style.text}`}>
              {value === null ? '—' : formatValue(value, unit)}
            </span>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              <span className={`text-[9px] ${style.text}`}>{style.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
