import { NextResponse } from 'next/server'
import { getDb, getEnv } from '@/lib/db/client'
import { getActiveMonitors, updateMonitorLastRun } from '@/lib/db/queries'
import { runAnalysis } from '@/lib/run-analysis'
import { sendScoreDropAlert } from '@/lib/email'
import type { AnalysisCategory } from '@/types/analysis'

export const runtime = 'edge'

// Cloudflare Cron Trigger 또는 수동 트리거
// wrangler.toml: [triggers] crons = ["0 0 * * *"]
export async function GET(req: Request): Promise<Response> {
  // Cron 시크릿 검증 (간단한 보안)
  const authHeader = req.headers.get('authorization')
  const env = getEnv()
  const cronSecret = env.CRON_SECRET ?? ''
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  const monitors = await getActiveMonitors(db)

  const results = await Promise.allSettled(
    monitors.map(async (monitor) => {
      const categories = JSON.parse(monitor.categories) as AnalysisCategory[]
      const result = await runAnalysis({
        url: monitor.url,
        pageSpeedApiKey: env.PAGESPEED_API_KEY ?? '',
        categories,
      })

      await updateMonitorLastRun(db, monitor.id, result.overallScore)

      // 점수 하락 경고
      if (
        monitor.last_score !== null &&
        result.overallScore < monitor.last_score - monitor.alert_threshold
      ) {
        const drop = monitor.last_score - result.overallScore
        // 사용자 이메일 조회
        const userRow = await db
          .prepare('SELECT email FROM users WHERE id = ?')
          .bind(monitor.user_id)
          .first<{ email: string }>()

        if (userRow) {
          await sendScoreDropAlert({
            to: userRow.email,
            url: monitor.url,
            previousScore: monitor.last_score,
            currentScore: result.overallScore,
            drop,
            appUrl: env.NEXT_PUBLIC_APP_URL,
            resendApiKey: env.RESEND_API_KEY,
            fromEmail: env.RESEND_FROM_EMAIL,
          })
        }
      }

      return { monitorId: monitor.id, url: monitor.url, score: result.overallScore }
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ ok: true, total: monitors.length, succeeded, failed })
}
