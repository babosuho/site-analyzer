import { Resend } from 'resend'

interface SendOtpOptions {
  to: string
  otp: string
  appUrl: string
  resendApiKey: string
  fromEmail: string
}

export async function sendOtpEmail({
  to,
  otp,
  appUrl,
  resendApiKey,
  fromEmail,
}: SendOtpOptions): Promise<void> {
  const resend = new Resend(resendApiKey)

  const { error } = await resend.emails.send({
    from: `Site Analyzer <${fromEmail}>`,
    to: [to],
    subject: `[Site Analyzer] 로그인 인증 코드: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1e1b4b; margin: 0;">Site Analyzer</h1>
          <p style="color: #6b7280; margin-top: 8px;">SEO · AEO · GEO · 속도 분석 플랫폼</p>
        </div>

        <div style="background: #f8fafc; border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
          <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">로그인 인증 코드입니다.</p>
          <div style="background: #4f46e5; color: white; font-size: 36px; font-weight: 700; letter-spacing: 8px; padding: 16px 32px; border-radius: 12px; display: inline-block;">
            ${otp}
          </div>
          <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0;">이 코드는 10분 후 만료됩니다.</p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          본인이 요청하지 않았다면 이 이메일을 무시하세요.<br>
          <a href="${appUrl}" style="color: #4f46e5;">${appUrl}</a>
        </p>
      </div>
    `,
  })

  if (error) {
    throw new Error(`이메일 발송 실패: ${error.message}`)
  }
}

interface SendAlertOptions {
  to: string
  url: string
  previousScore: number
  currentScore: number
  drop: number
  appUrl: string
  resendApiKey: string
  fromEmail: string
}

export async function sendScoreDropAlert({
  to,
  url,
  previousScore,
  currentScore,
  drop,
  appUrl,
  resendApiKey,
  fromEmail,
}: SendAlertOptions): Promise<void> {
  const resend = new Resend(resendApiKey)

  await resend.emails.send({
    from: `Site Analyzer <${fromEmail}>`,
    to: [to],
    subject: `[Site Analyzer] 경고: ${url} 점수가 ${drop}점 하락했습니다`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #dc2626;">점수 하락 경고</h1>
        <p style="color: #374151;">모니터링 중인 사이트의 점수가 하락했습니다.</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">분석 URL</p>
          <p style="margin: 4px 0 16px; font-weight: 600; color: #111827; word-break: break-all;">${url}</p>
          <div style="display: flex; gap: 32px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">이전 점수</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #374151;">${previousScore}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">현재 점수</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #dc2626;">${currentScore}</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">변화</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #dc2626;">-${drop}</p>
            </div>
          </div>
        </div>
        <a href="${appUrl}/history" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          상세 분석 보기
        </a>
      </div>
    `,
  })
}
