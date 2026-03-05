import { runAnalysis } from './run-analysis'
import * as htmlFetcher from './html-fetcher'
import * as pagespeedClient from './pagespeed-client'

jest.mock('./html-fetcher')
jest.mock('./pagespeed-client')

const mockFetchHtml = htmlFetcher.fetchHtml as jest.MockedFunction<typeof htmlFetcher.fetchHtml>
const mockFetchPageSpeed = pagespeedClient.fetchPageSpeed as jest.MockedFunction<typeof pagespeedClient.fetchPageSpeed>

const GOOD_HTML = `
  <html>
    <head>
      <title>Good SEO Title Here Example Page</title>
      <meta name="description" content="A perfect meta description that is between 120 and 160 characters long to pass the SEO check properly yes really.">
      <link rel="canonical" href="https://example.com/">
      <meta property="og:title" content="Good Title">
      <meta property="og:description" content="OG desc">
      <meta property="og:image" content="https://example.com/img.jpg">
    </head>
    <body><h1>Main Heading</h1></body>
  </html>
`

const GOOD_PAGESPEED = {
  lighthouseResult: {
    categories: { performance: { score: 0.9 } },
    audits: {
      'largest-contentful-paint':              { score: 1, numericValue: 1200 },
      'experimental-interaction-to-next-paint': { score: 1, numericValue: 150 },
      'cumulative-layout-shift':               { score: 1, numericValue: 0.05 },
      'first-contentful-paint':                { score: 1, numericValue: 900 },
      'server-response-time':                  { score: 1, numericValue: 300 },
      'uses-optimized-images':   { score: 1, details: { items: [] } },
      'render-blocking-resources': { score: 1, details: { items: [] } },
      'uses-text-compression':   { score: 1 },
      'uses-long-cache-ttl':     { score: 1, details: { items: [] } },
    },
  },
}

beforeEach(() => {
  mockFetchHtml.mockReset()
  mockFetchPageSpeed.mockReset()

  mockFetchHtml.mockResolvedValue({
    url: 'https://example.com',
    html: GOOD_HTML,
    responseTimeMs: 250,
  })
  mockFetchPageSpeed.mockResolvedValue(GOOD_PAGESPEED as never)
})

describe('runAnalysis', () => {
  it('AnalysisResult 구조를 반환한다', async () => {
    const result = await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'test-key' })

    expect(result.url).toBe('https://example.com')
    expect(result.analyzedAt).toBeDefined()
    expect(typeof result.overallScore).toBe('number')
    expect(result.seo).toBeDefined()
    expect(result.aeo).toBeDefined()
    expect(result.geo).toBeDefined()
    expect(result.speed).toBeDefined()
  })

  it('overallScore는 4개 분석기 점수의 가중 평균이다', async () => {
    const result = await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'test-key' })

    const expected = Math.round(
      result.seo.score * 0.35 +
      result.aeo.score * 0.25 +
      result.geo.score * 0.20 +
      result.speed.score * 0.20
    )
    expect(result.overallScore).toBe(expected)
  })

  it('overallScore는 0~100 범위이다', async () => {
    const result = await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'test-key' })
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
  })

  it('analyzedAt은 ISO 8601 형식이다', async () => {
    const result = await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'test-key' })
    expect(() => new Date(result.analyzedAt)).not.toThrow()
    expect(new Date(result.analyzedAt).toISOString()).toBe(result.analyzedAt)
  })

  it('fetchHtml과 fetchPageSpeed를 올바른 인자로 호출한다', async () => {
    await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'my-key' })

    expect(mockFetchHtml).toHaveBeenCalledWith('https://example.com')
    expect(mockFetchPageSpeed).toHaveBeenCalledWith('https://example.com', 'my-key', 'mobile')
  })

  it('HTML 수집 실패 시 에러를 전파한다', async () => {
    mockFetchHtml.mockRejectedValueOnce(new Error('fetch failed'))

    await expect(
      runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'key' })
    ).rejects.toThrow('fetch failed')
  })

  it('PageSpeed API 실패 시에도 speed score 0으로 완료된다', async () => {
    mockFetchPageSpeed.mockRejectedValueOnce(new Error('API error'))

    const result = await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'key' })

    expect(result.speed.score).toBe(0)
    expect(result.seo).toBeDefined()
    expect(result.aeo).toBeDefined()
  })

  it('strategy 옵션을 fetchPageSpeed에 전달한다', async () => {
    await runAnalysis({ url: 'https://example.com', pageSpeedApiKey: 'key', strategy: 'desktop' })

    expect(mockFetchPageSpeed).toHaveBeenCalledWith('https://example.com', 'key', 'desktop')
  })
})
