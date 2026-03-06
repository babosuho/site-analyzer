import type { AnalysisResult } from '@/types/analysis'

interface WebhookPayload {
  url: string
  overallScore: number
  categories: Record<string, number | undefined>
  analyzedAt: string
  appUrl: string
}

function buildPayload(result: AnalysisResult, appUrl: string): WebhookPayload {
  return {
    url: result.url,
    overallScore: result.overallScore,
    categories: {
      SEO: result.seo?.score,
      AEO: result.aeo?.score,
      GEO: result.geo?.score,
      Speed: result.speed?.score,
    },
    analyzedAt: result.analyzedAt,
    appUrl,
  }
}

function scoreEmoji(score: number): string {
  if (score >= 80) return '🟢'
  if (score >= 60) return '🟡'
  return '🔴'
}

export async function sendSlackWebhook(
  webhookUrl: string,
  result: AnalysisResult,
  appUrl: string
): Promise<void> {
  const payload = buildPayload(result, appUrl)
  const emoji = scoreEmoji(result.overallScore)

  const body = {
    text: `${emoji} 사이트 분석 완료: ${result.url}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${emoji} 사이트 분석 완료*\n<${result.url}|${result.url}>`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*종합 점수*\n${result.overallScore}점` },
          { type: 'mrkdwn', text: `*SEO*\n${payload.categories.SEO ?? 'N/A'}점` },
          { type: 'mrkdwn', text: `*AEO*\n${payload.categories.AEO ?? 'N/A'}점` },
          { type: 'mrkdwn', text: `*GEO*\n${payload.categories.GEO ?? 'N/A'}점` },
          { type: 'mrkdwn', text: `*Speed*\n${payload.categories.Speed ?? 'N/A'}점` },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '상세 보기' },
            url: `${appUrl}/history`,
          },
        ],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Slack 웹훅 전송 실패: ${res.status}`)
  }
}

export async function sendDiscordWebhook(
  webhookUrl: string,
  result: AnalysisResult,
  appUrl: string
): Promise<void> {
  const payload = buildPayload(result, appUrl)
  const color = result.overallScore >= 80 ? 0x22c55e : result.overallScore >= 60 ? 0xf59e0b : 0xef4444

  const body = {
    embeds: [
      {
        title: `사이트 분석 완료`,
        url: result.url,
        description: result.url,
        color,
        fields: [
          { name: '종합 점수', value: `**${result.overallScore}점**`, inline: true },
          { name: 'SEO', value: `${payload.categories.SEO ?? 'N/A'}점`, inline: true },
          { name: 'AEO', value: `${payload.categories.AEO ?? 'N/A'}점`, inline: true },
          { name: 'GEO', value: `${payload.categories.GEO ?? 'N/A'}점`, inline: true },
          { name: 'Speed', value: `${payload.categories.Speed ?? 'N/A'}점`, inline: true },
        ],
        footer: { text: 'Site Analyzer' },
        timestamp: result.analyzedAt,
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(`Discord 웹훅 전송 실패: ${res.status}`)
  }
}

export async function triggerWebhooks(
  webhooks: Array<{ type: string; url: string; events: string }>,
  result: AnalysisResult,
  appUrl: string
): Promise<void> {
  const tasks = webhooks
    .filter((wh) => {
      const events = JSON.parse(wh.events) as string[]
      return events.includes('analysis_done')
    })
    .map(async (wh) => {
      try {
        if (wh.type === 'slack') {
          await sendSlackWebhook(wh.url, result, appUrl)
        } else if (wh.type === 'discord') {
          await sendDiscordWebhook(wh.url, result, appUrl)
        }
      } catch {
        // 웹훅 실패는 non-fatal
      }
    })

  await Promise.allSettled(tasks)
}
