import { analyzeSpeed } from './speed-analyzer'
import { PageSpeedApiResponse } from '@/types/analysis'

// ── 헬퍼: PageSpeed API 응답 픽스처 ────────────────────────────
function makeApiResponse(overrides: Partial<PageSpeedApiResponse['lighthouseResult']['audits']> = {}, perfScore = 0.9): PageSpeedApiResponse {
  return {
    lighthouseResult: {
      categories: {
        performance: { score: perfScore },
      },
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
        ...overrides,
      },
    },
  }
}

describe('analyzeSpeed', () => {
  // ── 점수 변환 ─────────────────────────────────────────────

  it('Lighthouse 90점 → score 90 반환', () => {
    const result = analyzeSpeed(makeApiResponse({}, 0.9))
    expect(result.score).toBe(90)
  })

  it('Lighthouse 50점 → score 50 반환', () => {
    const result = analyzeSpeed(makeApiResponse({}, 0.5))
    expect(result.score).toBe(50)
  })

  it('score는 0~100 범위', () => {
    const result = analyzeSpeed(makeApiResponse({}, 1.0))
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  // ── Core Web Vitals 파싱 ──────────────────────────────────

  it('LCP 값을 ms로 파싱', () => {
    const result = analyzeSpeed(makeApiResponse({
      'largest-contentful-paint': { score: 1, numericValue: 2100 },
    }))
    expect(result.coreWebVitals.lcp).toBe(2100)
  })

  it('INP 값을 ms로 파싱', () => {
    const result = analyzeSpeed(makeApiResponse({
      'experimental-interaction-to-next-paint': { score: 0.5, numericValue: 350 },
    }))
    expect(result.coreWebVitals.inp).toBe(350)
  })

  it('CLS 값을 파싱', () => {
    const result = analyzeSpeed(makeApiResponse({
      'cumulative-layout-shift': { score: 0.8, numericValue: 0.08 },
    }))
    expect(result.coreWebVitals.cls).toBeCloseTo(0.08)
  })

  it('FCP 값을 ms로 파싱', () => {
    const result = analyzeSpeed(makeApiResponse({
      'first-contentful-paint': { score: 0.9, numericValue: 1500 },
    }))
    expect(result.coreWebVitals.fcp).toBe(1500)
  })

  it('TTFB 값을 ms로 파싱', () => {
    const result = analyzeSpeed(makeApiResponse({
      'server-response-time': { score: 0.5, numericValue: 900 },
    }))
    expect(result.coreWebVitals.ttfb).toBe(900)
  })

  it('audit 누락 시 null 반환', () => {
    const response: PageSpeedApiResponse = {
      lighthouseResult: {
        categories: { performance: { score: 0.7 } },
        audits: {},
      },
    }
    const result = analyzeSpeed(response)
    expect(result.coreWebVitals.lcp).toBeNull()
    expect(result.coreWebVitals.inp).toBeNull()
    expect(result.coreWebVitals.cls).toBeNull()
  })

  // ── LCP 이슈 감지 ─────────────────────────────────────────

  it('LCP > 4000ms → critical 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'largest-contentful-paint': { score: 0, numericValue: 5000 },
    }))
    const issue = result.issues.find(i => i.id === 'lcp-poor')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('LCP 2500~4000ms → warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'largest-contentful-paint': { score: 0.5, numericValue: 3000 },
    }))
    const issue = result.issues.find(i => i.id === 'lcp-needs-improvement')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('warning')
  })

  it('LCP < 2500ms → 이슈 없음', () => {
    const result = analyzeSpeed(makeApiResponse({
      'largest-contentful-paint': { score: 1, numericValue: 2000 },
    }))
    expect(result.issues.find(i => i.id?.startsWith('lcp'))).toBeUndefined()
  })

  // ── INP 이슈 감지 ─────────────────────────────────────────

  it('INP > 500ms → critical 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'experimental-interaction-to-next-paint': { score: 0, numericValue: 600 },
    }))
    const issue = result.issues.find(i => i.id === 'inp-poor')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('INP 200~500ms → warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'experimental-interaction-to-next-paint': { score: 0.5, numericValue: 350 },
    }))
    const issue = result.issues.find(i => i.id === 'inp-needs-improvement')
    expect(issue).toBeDefined()
  })

  // ── CLS 이슈 감지 ─────────────────────────────────────────

  it('CLS >= 0.25 → critical 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'cumulative-layout-shift': { score: 0, numericValue: 0.3 },
    }))
    const issue = result.issues.find(i => i.id === 'cls-poor')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('CLS 0.1~0.25 → warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'cumulative-layout-shift': { score: 0.5, numericValue: 0.15 },
    }))
    const issue = result.issues.find(i => i.id === 'cls-needs-improvement')
    expect(issue).toBeDefined()
  })

  // ── TTFB 이슈 감지 ────────────────────────────────────────

  it('TTFB > 1800ms → critical 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'server-response-time': { score: 0, numericValue: 2000 },
    }))
    const issue = result.issues.find(i => i.id === 'ttfb-poor')
    expect(issue).toBeDefined()
    expect(issue!.severity).toBe('critical')
  })

  it('TTFB 800~1800ms → warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'server-response-time': { score: 0.5, numericValue: 1000 },
    }))
    const issue = result.issues.find(i => i.id === 'ttfb-needs-improvement')
    expect(issue).toBeDefined()
  })

  // ── 최적화 이슈 감지 ──────────────────────────────────────

  it('미최적화 이미지 있으면 warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'uses-optimized-images': { score: 0, details: { items: [{}, {}] } },
    }))
    const issue = result.issues.find(i => i.id === 'unoptimized-images')
    expect(issue).toBeDefined()
    expect(result.details.unoptimizedImagesCount).toBe(2)
  })

  it('렌더 블로킹 리소스 있으면 warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'render-blocking-resources': { score: 0, details: { items: [{}] } },
    }))
    const issue = result.issues.find(i => i.id === 'render-blocking-resources')
    expect(issue).toBeDefined()
    expect(result.details.renderBlockingResourcesCount).toBe(1)
  })

  it('압축 미사용 시 warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'uses-text-compression': { score: 0 },
    }))
    const issue = result.issues.find(i => i.id === 'no-compression')
    expect(issue).toBeDefined()
    expect(result.details.usesCompression).toBe(false)
  })

  it('캐싱 미설정 시 warning 이슈', () => {
    const result = analyzeSpeed(makeApiResponse({
      'uses-long-cache-ttl': { score: 0, details: { items: [{}, {}] } },
    }))
    const issue = result.issues.find(i => i.id === 'no-caching')
    expect(issue).toBeDefined()
    expect(result.details.usesCaching).toBe(false)
  })

  // ── 최적화된 페이지 → 이슈 없음 ──────────────────────────

  it('모든 항목 통과 시 CRITICAL/WARNING 이슈 없음', () => {
    const result = analyzeSpeed(makeApiResponse({}, 0.95))
    const blocking = result.issues.filter(i => i.severity === 'critical' || i.severity === 'warning')
    expect(blocking).toHaveLength(0)
  })

  // ── details 구조 ──────────────────────────────────────────

  it('details 필드 구조가 올바름', () => {
    const result = analyzeSpeed(makeApiResponse())
    expect(typeof result.details.unoptimizedImagesCount).toBe('number')
    expect(typeof result.details.renderBlockingResourcesCount).toBe('number')
    expect(typeof result.details.usesCompression).toBe('boolean')
    expect(typeof result.details.usesCaching).toBe('boolean')
  })
})
