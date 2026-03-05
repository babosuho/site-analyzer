import { PageSpeedApiResponse, SeoIssue, SpeedResult } from '@/types/analysis'

// ── Core Web Vitals 임계값 (Google 기준) ────────────────────
const CWV = {
  lcp:  { good: 2500,  poor: 4000  },  // ms
  inp:  { good: 200,   poor: 500   },  // ms
  cls:  { good: 0.1,   poor: 0.25  },  // score
  fcp:  { good: 1800,  poor: 3000  },  // ms
  ttfb: { good: 800,   poor: 1800  },  // ms
} as const

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

function auditValue(response: PageSpeedApiResponse, key: keyof PageSpeedApiResponse['lighthouseResult']['audits']): number | null {
  return response.lighthouseResult.audits[key]?.numericValue ?? null
}

function auditItems(response: PageSpeedApiResponse, key: keyof PageSpeedApiResponse['lighthouseResult']['audits']): unknown[] {
  return response.lighthouseResult.audits[key]?.details?.items ?? []
}

function auditScore(response: PageSpeedApiResponse, key: keyof PageSpeedApiResponse['lighthouseResult']['audits']): number | null {
  return response.lighthouseResult.audits[key]?.score ?? null
}

export function analyzeSpeed(response: PageSpeedApiResponse): SpeedResult {
  const issues: SeoIssue[] = []
  const audits = response.lighthouseResult.audits

  // ── Lighthouse 점수 → 0~100 ───────────────────────────────
  const perfScore = response.lighthouseResult.categories.performance?.score ?? 0
  const score = clamp(Math.round(perfScore * 100), 0, 100)

  // ── CWV 파싱 ──────────────────────────────────────────────
  const lcp  = auditValue(response, 'largest-contentful-paint')
  const inp  = auditValue(response, 'experimental-interaction-to-next-paint')
  const cls  = auditValue(response, 'cumulative-layout-shift')
  const fcp  = auditValue(response, 'first-contentful-paint')
  const ttfb = auditValue(response, 'server-response-time')

  // ── LCP 이슈 ──────────────────────────────────────────────
  if (lcp !== null) {
    if (lcp >= CWV.lcp.poor) {
      issues.push({
        id: 'lcp-poor',
        severity: 'critical',
        message: `LCP가 너무 느립니다 (${Math.round(lcp)}ms). 기준: 2,500ms 이하.`,
        recommendation: '가장 큰 이미지/텍스트 블록을 최적화하세요. 이미지 preload, CDN 적용, 서버 응답 시간 단축을 검토하세요.',
      })
    } else if (lcp >= CWV.lcp.good) {
      issues.push({
        id: 'lcp-needs-improvement',
        severity: 'warning',
        message: `LCP 개선 필요 (${Math.round(lcp)}ms). 목표: 2,500ms 이하.`,
        recommendation: '이미지 크기 최적화, 렌더링 차단 리소스 제거, 서버 캐싱을 적용하세요.',
      })
    }
  }

  // ── INP 이슈 ──────────────────────────────────────────────
  if (inp !== null) {
    if (inp >= CWV.inp.poor) {
      issues.push({
        id: 'inp-poor',
        severity: 'critical',
        message: `INP가 너무 느립니다 (${Math.round(inp)}ms). 기준: 200ms 이하.`,
        recommendation: '긴 JavaScript 작업을 분할하고, 이벤트 핸들러를 최적화하세요.',
      })
    } else if (inp >= CWV.inp.good) {
      issues.push({
        id: 'inp-needs-improvement',
        severity: 'warning',
        message: `INP 개선 필요 (${Math.round(inp)}ms). 목표: 200ms 이하.`,
        recommendation: 'JavaScript 실행 시간을 줄이고 메인 스레드 차단을 최소화하세요.',
      })
    }
  }

  // ── CLS 이슈 ──────────────────────────────────────────────
  if (cls !== null) {
    if (cls >= CWV.cls.poor) {
      issues.push({
        id: 'cls-poor',
        severity: 'critical',
        message: `CLS가 너무 높습니다 (${cls.toFixed(3)}). 기준: 0.1 이하.`,
        recommendation: '이미지/광고/임베드에 width·height 명시, 동적 콘텐츠 삽입 위치를 고정하세요.',
      })
    } else if (cls >= CWV.cls.good) {
      issues.push({
        id: 'cls-needs-improvement',
        severity: 'warning',
        message: `CLS 개선 필요 (${cls.toFixed(3)}). 목표: 0.1 이하.`,
        recommendation: '레이아웃 이동을 유발하는 요소를 점검하세요.',
      })
    }
  }

  // ── TTFB 이슈 ─────────────────────────────────────────────
  if (ttfb !== null) {
    if (ttfb >= CWV.ttfb.poor) {
      issues.push({
        id: 'ttfb-poor',
        severity: 'critical',
        message: `TTFB가 너무 느립니다 (${Math.round(ttfb)}ms). 기준: 800ms 이하.`,
        recommendation: '서버 성능 개선, CDN 적용, 데이터베이스 쿼리 최적화를 검토하세요.',
      })
    } else if (ttfb >= CWV.ttfb.good) {
      issues.push({
        id: 'ttfb-needs-improvement',
        severity: 'warning',
        message: `TTFB 개선 필요 (${Math.round(ttfb)}ms). 목표: 800ms 이하.`,
        recommendation: '서버 캐싱(Redis 등)을 적용하고 응답 크기를 줄이세요.',
      })
    }
  }

  // ── 이미지 최적화 ──────────────────────────────────────────
  const unoptimizedImages = auditItems(response, 'uses-optimized-images')
  const unoptimizedImagesCount = unoptimizedImages.length

  if (unoptimizedImagesCount > 0) {
    issues.push({
      id: 'unoptimized-images',
      severity: 'warning',
      message: `최적화되지 않은 이미지가 ${unoptimizedImagesCount}개 있습니다.`,
      recommendation: 'WebP/AVIF 포맷으로 변환하고 next/image 또는 <picture> 요소를 사용하세요.',
    })
  }

  // ── 렌더 블로킹 리소스 ────────────────────────────────────
  const renderBlockingItems = auditItems(response, 'render-blocking-resources')
  const renderBlockingResourcesCount = renderBlockingItems.length

  if (renderBlockingResourcesCount > 0) {
    issues.push({
      id: 'render-blocking-resources',
      severity: 'warning',
      message: `렌더링을 차단하는 리소스가 ${renderBlockingResourcesCount}개 있습니다.`,
      recommendation: 'CSS는 <link rel="preload">로 미리 로드하고, JS는 defer/async 속성을 추가하세요.',
    })
  }

  // ── 텍스트 압축 ───────────────────────────────────────────
  const compressionScore = auditScore(response, 'uses-text-compression')
  const usesCompression = compressionScore !== null && compressionScore > 0

  if (!usesCompression && audits['uses-text-compression'] !== undefined) {
    issues.push({
      id: 'no-compression',
      severity: 'warning',
      message: '텍스트 압축(gzip/brotli)이 적용되지 않았습니다.',
      recommendation: '서버에서 gzip 또는 brotli 압축을 활성화하세요.',
    })
  }

  // ── 캐싱 ──────────────────────────────────────────────────
  const cachingItems = auditItems(response, 'uses-long-cache-ttl')
  const usesCaching = cachingItems.length === 0 && audits['uses-long-cache-ttl'] !== undefined

  if (!usesCaching && audits['uses-long-cache-ttl'] !== undefined) {
    issues.push({
      id: 'no-caching',
      severity: 'warning',
      message: '정적 리소스에 장기 캐싱이 설정되지 않았습니다.',
      recommendation: 'Cache-Control 헤더에 max-age=31536000을 설정하고 파일명에 해시를 포함하세요.',
    })
  }

  return {
    score,
    issues,
    coreWebVitals: { lcp, inp, cls, fcp, ttfb },
    details: {
      totalResourcesCount: 0,
      unoptimizedImagesCount,
      renderBlockingResourcesCount,
      usesCompression,
      usesCaching,
    },
  }
}
