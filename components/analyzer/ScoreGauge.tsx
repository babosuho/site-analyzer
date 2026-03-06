interface ScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

function scoreColor(score: number) {
  if (score >= 80) return { stroke: '#22c55e', text: 'text-green-500' }
  if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-500' }
  return { stroke: '#ef4444', text: 'text-red-500' }
}

const SIZES = {
  sm: { radius: 28, stroke: 5, viewBox: 72, fontSize: 'text-lg', labelSize: 'text-xs' },
  md: { radius: 42, stroke: 6, viewBox: 100, fontSize: 'text-2xl', labelSize: 'text-xs' },
  lg: { radius: 60, stroke: 8, viewBox: 140, fontSize: 'text-4xl', labelSize: 'text-sm' },
}

export function ScoreGauge({ score, size = 'md', label }: ScoreGaugeProps) {
  const { radius, stroke, viewBox, fontSize, labelSize } = SIZES[size]
  const { stroke: strokeColor, text } = scoreColor(score)

  const center = viewBox / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={viewBox} height={viewBox} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={strokeColor} strokeWidth={stroke}
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold leading-none ${fontSize} ${text}`}>{score}</span>
        </div>
      </div>
      {label && <span className={`font-medium text-slate-500 ${labelSize}`}>{label}</span>}
    </div>
  )
}
