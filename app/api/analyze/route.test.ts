import { POST } from './route'
import * as runAnalysisModule from '@/lib/run-analysis'

jest.mock('@/lib/run-analysis')

const mockRunAnalysis = runAnalysisModule.runAnalysis as jest.MockedFunction<typeof runAnalysisModule.runAnalysis>

const MOCK_RESULT = {
  url: 'https://example.com',
  analyzedAt: new Date().toISOString(),
  overallScore: 78,
  seo:   { score: 80, issues: [], details: {} as never },
  aeo:   { score: 70, issues: [], details: {} as never },
  geo:   { score: 75, issues: [], details: {} as never },
  speed: { score: 90, issues: [], coreWebVitals: { lcp: null, inp: null, cls: null, fcp: null, ttfb: null }, details: {} as never },
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockRunAnalysis.mockReset()
  mockRunAnalysis.mockResolvedValue(MOCK_RESULT as never)
  process.env.PAGESPEED_API_KEY = 'test-api-key'
})

describe('POST /api/analyze', () => {
  it('유효한 URL로 요청 시 200과 AnalysisResult 반환', async () => {
    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.url).toBe('https://example.com')
    expect(body.overallScore).toBe(78)
    expect(body.seo).toBeDefined()
  })

  it('URL 없으면 400 반환', async () => {
    const req = makeRequest({})
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBeDefined()
  })

  it('빈 문자열 URL이면 400 반환', async () => {
    const req = makeRequest({ url: '' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('http/https가 아닌 URL이면 400 반환', async () => {
    const req = makeRequest({ url: 'ftp://example.com' })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('잘못된 JSON이면 400 반환', async () => {
    const req = new Request('http://localhost/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid-json',
    })
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('strategy 파라미터를 runAnalysis에 전달한다', async () => {
    const req = makeRequest({ url: 'https://example.com', strategy: 'desktop' })
    await POST(req)

    expect(mockRunAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: 'desktop' })
    )
  })

  it('strategy 기본값은 mobile이다', async () => {
    const req = makeRequest({ url: 'https://example.com' })
    await POST(req)

    expect(mockRunAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ strategy: 'mobile' })
    )
  })

  it('분석 실패 시 500 반환', async () => {
    mockRunAnalysis.mockRejectedValueOnce(new Error('fetch failed'))

    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBeDefined()
  })

  it('CORS 헤더를 포함한다', async () => {
    const req = makeRequest({ url: 'https://example.com' })
    const res = await POST(req)

    expect(res.headers.get('Access-Control-Allow-Origin')).toBeDefined()
  })
})
