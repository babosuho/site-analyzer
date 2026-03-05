import { PageSpeedApiResponse } from '@/types/analysis'

const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

export class PageSpeedError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'PageSpeedError'
  }
}

export async function fetchPageSpeed(
  url: string,
  apiKey: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
): Promise<PageSpeedApiResponse> {
  const params = new URLSearchParams({
    url,
    key: apiKey,
    strategy,
    category: 'performance',
  })

  const endpoint = `${PAGESPEED_API_URL}?${params.toString()}`

  let response: Response
  try {
    response = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error) {
    throw new PageSpeedError(
      `PageSpeed API 요청 실패: ${error instanceof Error ? error.message : 'network error'}`,
    )
  }

  if (!response.ok) {
    throw new PageSpeedError(
      `PageSpeed API 오류 (HTTP ${response.status})`,
      response.status,
    )
  }

  const data = await response.json()

  if (!data.lighthouseResult) {
    throw new PageSpeedError('PageSpeed API 응답 형식이 올바르지 않습니다.')
  }

  return data as PageSpeedApiResponse
}
