import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/client'
import { getAnalysesByUser, getAnalysesForUrl, getUserUsageStats } from '@/lib/db/queries'

export const runtime = 'edge'

export async function GET(req: Request): Promise<Response> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: '인증 필요' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)

  const db = getDb()

  if (url) {
    const analyses = await getAnalysesForUrl(db, userId, url, limit)
    return NextResponse.json({ analyses })
  }

  const [analyses, usage] = await Promise.all([
    getAnalysesByUser(db, userId, limit),
    getUserUsageStats(db, userId),
  ])

  return NextResponse.json({ analyses, usage })
}
