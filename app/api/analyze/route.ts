import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, getEnv } from '@/lib/db/client'
import { runAnalysis } from '@/lib/run-analysis'
import { saveAnalysis, getWebhooksByUser } from '@/lib/db/queries'
import { triggerWebhooks } from '@/lib/webhook'
import type { AnalysisCategory } from '@/types/analysis'

export const runtime = 'edge'

const RequestSchema = z.object({
  url: z.string().min(1, 'URL을 입력해주세요.').refine(
    (url) => { try { new URL(url); return true } catch { return false } },
    '올바른 URL 형식이 아닙니다.'
  ),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
  categories: z
    .array(z.enum(['seo', 'aeo', 'geo', 'speed']))
    .min(1, '하나 이상의 분석 항목을 선택해주세요.')
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
    return NextResponse.json({ error: '요청 본문이 올바른 JSON 형식이 아닙니다.' }, { status: 400 })
  }

  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? parsed.error.message },
      { status: 400 }
    )
  }

  const { url, strategy, categories } = parsed.data

  try {
    const env = getEnv()
    const db = getDb()

    const result = await runAnalysis({
      url,
      pageSpeedApiKey: env.PAGESPEED_API_KEY ?? '',
      strategy,
      categories: categories as AnalysisCategory[],
      geminiApiKey: env.GEMINI_API_KEY ?? '',
    })

    const id = await saveAnalysis(db, userId, result)
    const resultWithId = { ...result, id }

    getWebhooksByUser(db, userId)
      .then((webhooks) => triggerWebhooks(webhooks, resultWithId, env.NEXT_PUBLIC_APP_URL))
      .catch(() => {})

    return NextResponse.json(resultWithId, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
