'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { format } from 'date-fns'
import type { AnalysisRow } from '@/types/analysis'

interface TrendChartProps {
  analyses: AnalysisRow[]
}

export function TrendChart({ analyses }: TrendChartProps) {
  const data = analyses.map((a) => ({
    date: format(new Date(a.created_at), 'MM/dd'),
    종합: a.overall_score,
    SEO: a.seo_score ?? undefined,
    AEO: a.aeo_score ?? undefined,
    GEO: a.geo_score ?? undefined,
    Speed: a.speed_score ?? undefined,
  }))

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-400">
        트렌드 차트를 보려면 같은 URL을 2회 이상 분석하세요.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          formatter={(v) => v != null ? `${v}점` : ""}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
        <Line type="monotone" dataKey="종합" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="SEO"  stroke="#0ea5e9" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="AEO"  stroke="#8b5cf6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="GEO"  stroke="#ec4899" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="Speed" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  )
}
