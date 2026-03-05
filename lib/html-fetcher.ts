export class HtmlFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HtmlFetchError'
  }
}

export interface FetchHtmlResult {
  url: string
  html: string
  responseTimeMs: number
}

const USER_AGENT = 'site-analyzer/1.0 (+https://github.com/babosuho/site-analyzer)'

export async function fetchHtml(url: string): Promise<FetchHtmlResult> {
  // URL 형식 검증
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new HtmlFetchError(`유효하지 않은 URL: ${url}`)
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new HtmlFetchError(`지원하지 않는 프로토콜: ${parsed.protocol}`)
  }

  const startedAt = Date.now()

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      },
      signal: AbortSignal.timeout(20_000),
      redirect: 'follow',
    })
  } catch (error) {
    throw new HtmlFetchError(
      `HTML 수집 실패: ${error instanceof Error ? error.message : '네트워크 오류'}`
    )
  }

  if (!response.ok) {
    throw new HtmlFetchError(`서버가 ${response.status} 오류를 반환했습니다.`)
  }

  const responseTimeMs = Date.now() - startedAt
  const html = await response.text()

  if (!html.trim()) {
    throw new HtmlFetchError('빈 HTML 응답을 받았습니다.')
  }

  return { url, html, responseTimeMs }
}
