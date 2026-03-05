import { AnalysisResult, PageSpeedApiResponse } from '@/types/analysis'
import { analyzeSeo } from '@/lib/analyzers/seo-analyzer'
import { analyzeAeo } from '@/lib/analyzers/aeo-analyzer'
import { analyzeGeo } from '@/lib/analyzers/geo-analyzer'
import { analyzeSpeed } from '@/lib/analyzers/speed-analyzer'
import { fetchHtml } from '@/lib/html-fetcher'
import { fetchPageSpeed } from '@/lib/pagespeed-client'

export interface RunAnalysisOptions {
  url: string
  pageSpeedApiKey: string
  strategy?: 'mobile' | 'desktop'
}

// 가중치: SEO 35%, AEO 25%, GEO 20%, Speed 20%
const WEIGHTS = { seo: 0.35, aeo: 0.25, geo: 0.20, speed: 0.20 } as const

const EMPTY_SPEED_RESULT = {
  score: 0,
  issues: [],
  coreWebVitals: { lcp: null, inp: null, cls: null, fcp: null, ttfb: null },
  details: {
    totalResourcesCount: 0,
    unoptimizedImagesCount: 0,
    renderBlockingResourcesCount: 0,
    usesCompression: false,
    usesCaching: false,
  },
}

export async function runAnalysis(options: RunAnalysisOptions): Promise<AnalysisResult> {
  const { url, pageSpeedApiKey, strategy = 'mobile' } = options

  // HTML 수집 (실패 시 에러 전파)
  const { html, responseTimeMs } = await fetchHtml(url)
  const analysisInput = { url, html, responseTimeMs }

  // SEO / AEO / GEO 동기 분석
  const seo = analyzeSeo(analysisInput)
  const aeo = analyzeAeo(analysisInput)
  const geo = analyzeGeo(analysisInput)

  // Speed 분석 (PageSpeed API 실패 시 빈 결과)
  let speedApiResponse: PageSpeedApiResponse | null = null
  try {
    speedApiResponse = await fetchPageSpeed(url, pageSpeedApiKey, strategy)
  } catch {
    // API 실패는 non-fatal — speed score 0으로 처리
  }

  const speed = speedApiResponse ? analyzeSpeed(speedApiResponse) : EMPTY_SPEED_RESULT

  const overallScore = Math.round(
    seo.score   * WEIGHTS.seo   +
    aeo.score   * WEIGHTS.aeo   +
    geo.score   * WEIGHTS.geo   +
    speed.score * WEIGHTS.speed
  )

  return {
    url,
    analyzedAt: new Date().toISOString(),
    overallScore,
    seo,
    aeo,
    geo,
    speed,
  }
}
