import { NextResponse } from 'next/server'
import { z } from 'zod'
import { runAnalysis } from '@/lib/run-analysis'

const RequestSchema = z.object({
  url: z
    .string()
    .min(1, 'URL을 입력해주세요.')
    .url('올바른 URL 형식이 아닙니다.')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'http 또는 https URL만 지원합니다.'
    ),
  strategy: z.enum(['mobile', 'desktop']).optional().default('mobile'),
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(req: Request): Promise<Response> {
  // JSON 파싱
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: '요청 본문이 올바른 JSON 형식이 아닙니다.' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  // 입력값 검증
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues?.[0]?.message ?? parsed.error.message
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const { url, strategy } = parsed.data
  const pageSpeedApiKey = process.env.PAGESPEED_API_KEY ?? ''

  // 분석 실행
  try {
    const result = await runAnalysis({ url, pageSpeedApiKey, strategy })
    return NextResponse.json(result, { status: 200, headers: CORS_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.'
    return NextResponse.json(
      { error: message },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
