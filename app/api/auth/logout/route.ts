import { NextResponse } from 'next/server'
import { makeClearCookie } from '@/lib/auth'

export const runtime = 'edge'

export async function POST(): Promise<Response> {
  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': makeClearCookie() } }
  )
}
