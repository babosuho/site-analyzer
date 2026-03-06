import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db/client'
import {
  createMonitor,
  getMonitorsByUser,
  toggleMonitor,
  deleteMonitor,
} from '@/lib/db/queries'

export const runtime = 'edge'

const CreateSchema = z.object({
  url: z.string().min(1),
  categories: z.array(z.enum(['seo', 'aeo', 'geo', 'speed'])).min(1),
  schedule: z.enum(['daily', 'weekly']).default('weekly'),
  alertThreshold: z.number().int().min(1).max(100).default(10),
})

export async function GET(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const monitors = await getMonitorsByUser(getDb(), userId)
  return NextResponse.json({ monitors })
}

export async function POST(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const id = await createMonitor(getDb(), userId, parsed.data)
  return NextResponse.json({ id }, { status: 201 })
}

export async function PATCH(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id, active } = await req.json().catch(() => ({})) as { id?: string; active?: boolean }
  if (!id || typeof active !== 'boolean') {
    return NextResponse.json({ error: '잘못된 요청' }, { status: 400 })
  }

  await toggleMonitor(getDb(), id, userId, active)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { id } = await req.json().catch(() => ({})) as { id?: string }
  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  await deleteMonitor(getDb(), id, userId)
  return NextResponse.json({ ok: true })
}
