import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, getEnv } from '@/lib/db/client'
import { verifyAndConsumeOtp, upsertUser, updateLastLogin } from '@/lib/db/queries'
import { signJwt, makeAuthCookie } from '@/lib/auth'

export const runtime = 'edge'

const Schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP는 6자리 숫자입니다.'),
})

export async function POST(req: Request): Promise<Response> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  }

  const { email, otp } = parsed.data

  try {
    const db = getDb()
    const env = getEnv()

    const valid = await verifyAndConsumeOtp(db, email, otp)
    if (!valid) {
      return NextResponse.json(
        { error: '인증 코드가 올바르지 않거나 만료되었습니다.' },
        { status: 401 }
      )
    }

    const user = await upsertUser(db, email)
    await updateLastLogin(db, user.id)

    const token = await signJwt({ sub: user.id, email: user.email }, env.JWT_SECRET)
    const cookie = makeAuthCookie(token)

    return NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email } },
      { headers: { 'Set-Cookie': cookie } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : '인증 처리 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
