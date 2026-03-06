import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb, getEnv } from '@/lib/db/client'
import { createOtp } from '@/lib/db/queries'
import { generateOtp } from '@/lib/auth'
import { sendOtpEmail } from '@/lib/email'

export const runtime = 'edge'

const Schema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요.'),
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

  const { email } = parsed.data

  try {
    const db = getDb()
    const env = getEnv()
    const otp = generateOtp()

    await createOtp(db, email, otp)
    await sendOtpEmail({
      to: email,
      otp,
      appUrl: env.NEXT_PUBLIC_APP_URL,
      resendApiKey: env.RESEND_API_KEY,
      fromEmail: env.RESEND_FROM_EMAIL,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '이메일 발송 중 오류가 발생했습니다.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
