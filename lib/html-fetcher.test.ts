import { fetchHtml, HtmlFetchError } from './html-fetcher'

// fetch를 전역 모킹
const mockFetch = jest.fn()
global.fetch = mockFetch

function makeResponse(html: string, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
    headers: { get: (key: string) => headers[key.toLowerCase()] ?? null },
  }
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchHtml', () => {
  it('HTML과 응답 시간을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse('<html><body>Hello</body></html>'))

    const result = await fetchHtml('https://example.com')

    expect(result.html).toContain('Hello')
    expect(result.responseTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.url).toBe('https://example.com')
  })

  it('User-Agent 헤더를 설정한다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse('<html></html>'))

    await fetchHtml('https://example.com')

    const callArgs = mockFetch.mock.calls[0][1]
    expect(callArgs.headers['User-Agent']).toMatch(/site-analyzer/i)
  })

  it('HTTP 오류 시 HtmlFetchError를 던진다', async () => {
    mockFetch.mockResolvedValue(makeResponse('', 403))

    await expect(fetchHtml('https://example.com')).rejects.toThrow(HtmlFetchError)
    await expect(fetchHtml('https://example.com')).rejects.toThrow('403')
  })

  it('네트워크 오류 시 HtmlFetchError를 던진다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

    await expect(fetchHtml('https://example.com')).rejects.toThrow(HtmlFetchError)
  })

  it('빈 HTML 응답 시 HtmlFetchError를 던진다', async () => {
    mockFetch.mockResolvedValueOnce(makeResponse('   '))

    await expect(fetchHtml('https://example.com')).rejects.toThrow(HtmlFetchError)
  })

  it('잘못된 URL 형식 시 HtmlFetchError를 던진다', async () => {
    await expect(fetchHtml('not-a-url')).rejects.toThrow(HtmlFetchError)
  })
})
