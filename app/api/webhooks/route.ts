import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db/client'
import { saveWebhook, getWebhooksByUser, deleteWebhook } from '@/lib/db/queries'

export const runtime = 'edge'

const CreateSchema = z.object({
  type: z.enum(['slack', 'discord']),
  url: z.string().url('유효한 웹훅 URL을 입력해주세요.'),
  events: z.array(z.enum(['analysis_done', 'score_drop'])).min(1),
})

export async function GET(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const webhooks = await getWebhooksByUser(getDb(), userId)
  return NextResponse.json({ webhooks })
}

export async function POST(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const id = await saveWebhook(getDb(), userId, parsed.data)
  return NextResponse.json({ id }, { status: 201 })
}

export async function PATCH(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { id?: string; test?: boolean }
  if (!body.id || !body.test) return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })

  const webhooks = await getWebhooksByUser(getDb(), userId)
  const webhook = webhooks.find((w) => w.id === body.id)
  if (!webhook) return NextResponse.json({ error: '웹훅을 찾을 수 없습니다.' }, { status: 404 })

  try {
    const testPayload =
      webhook.type === 'slack'
        ? { text: '[Site Analyzer] 웹훅 연결 테스트 성공!' }
        : { content: '[Site Analyzer] 웹훅 연결 테스트 성공!' }

    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '테스트 전송 실패' }, { status: 502 })
  }
}

export async function DELETE(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await req.json().catch(() => ({})) as { id?: string }
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  await deleteWebhook(getDb(), id, userId)
  return NextResponse.json({ ok: true })
}
