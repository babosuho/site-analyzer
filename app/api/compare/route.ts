import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getEnv } from '@/lib/db/client'
import { runAnalysis } from '@/lib/run-analysis'
import type { AnalysisCategory } from '@/types/analysis'

export const runtime = 'edge'

const RequestSchema = z.object({
  urls: z.array(z.string().min(1)).min(2, '최소 2개 URL이 필요합니다.').max(3, '최대 3개 URL까지 비교 가능합니다.'),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
  categories: z
    .array(z.enum(['seo', 'aeo', 'geo', 'speed']))
    .min(1)
    .optional()
    .default(['seo', 'aeo', 'geo', 'speed']),
})

export async function POST(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { urls, strategy, categories } = parsed.data

  try {
    const env = getEnv()

    // 병렬 분석 (AI는 비용 절약을 위해 비교 모드에서 제외)
    const results = await Promise.all(
      urls.map((url) =>
        runAnalysis({
          url,
          pageSpeedApiKey: env.PAGESPEED_API_KEY ?? '',
          strategy,
          categories: categories as AnalysisCategory[],
        })
      )
    )

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '비교 분석 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
