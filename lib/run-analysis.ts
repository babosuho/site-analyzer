import { AnalysisResult, AnalysisCategory, PageSpeedApiResponse, SpeedResult } from '@/types/analysis'
import { analyzeSeo } from '@/lib/analyzers/seo-analyzer'
import { analyzeAeo } from '@/lib/analyzers/aeo-analyzer'
import { analyzeGeo } from '@/lib/analyzers/geo-analyzer'
import { analyzeSpeed } from '@/lib/analyzers/speed-analyzer'
import { fetchHtml } from '@/lib/html-fetcher'
import { fetchPageSpeed } from '@/lib/pagespeed-client'
import { runAiAnalysis } from '@/lib/ai-analyzer'

export interface RunAnalysisOptions {
  url: string
  pageSpeedApiKey: string
  strategy?: 'mobile' | 'desktop'
  categories?: AnalysisCategory[]
  geminiApiKey?: string
}

const EMPTY_SPEED_RESULT: SpeedResult = {
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

function calcWeightedScore(
  scores: Array<{ score: number; weight: number }>
): number {
  const totalWeight = scores.reduce((sum, { weight }) => sum + weight, 0)
  const weightedSum = scores.reduce((sum, { score, weight }) => sum + score * weight, 0)
  return Math.round(weightedSum / totalWeight)
}

export async function runAnalysis(options: RunAnalysisOptions): Promise<AnalysisResult> {
  const {
    url,
    pageSpeedApiKey,
    strategy = 'mobile',
    categories = ['seo', 'aeo', 'geo', 'speed'],
    geminiApiKey,
  } = options

  // HTML 수집
  const { html, responseTimeMs } = await fetchHtml(url)
  const analysisInput = { url, html, responseTimeMs }

  // 선택된 카테고리만 병렬 분석
  const [seo, aeo, geo] = await Promise.all([
    categories.includes('seo') ? Promise.resolve(analyzeSeo(analysisInput)) : Promise.resolve(undefined),
    categories.includes('aeo') ? Promise.resolve(analyzeAeo(analysisInput)) : Promise.resolve(undefined),
    categories.includes('geo') ? Promise.resolve(analyzeGeo(analysisInput)) : Promise.resolve(undefined),
  ])

  // Speed 분석
  let speed = categories.includes('speed') ? EMPTY_SPEED_RESULT : undefined
  if (categories.includes('speed')) {
    try {
      const speedApiResponse: PageSpeedApiResponse = await fetchPageSpeed(url, pageSpeedApiKey, strategy)
      speed = analyzeSpeed(speedApiResponse)
    } catch {
      // API 실패는 non-fatal — score 0으로 처리
    }
  }

  // 가중치 기반 종합 점수 (선택된 카테고리만)
  const CATEGORY_WEIGHTS: Record<AnalysisCategory, number> = {
    seo: 35, aeo: 25, geo: 20, speed: 20,
  }

  const activeScores = [
    seo   ? { score: seo.score,   weight: CATEGORY_WEIGHTS.seo }   : null,
    aeo   ? { score: aeo.score,   weight: CATEGORY_WEIGHTS.aeo }   : null,
    geo   ? { score: geo.score,   weight: CATEGORY_WEIGHTS.geo }   : null,
    speed ? { score: speed.score, weight: CATEGORY_WEIGHTS.speed } : null,
  ].filter((x): x is { score: number; weight: number } => x !== null)

  const overallScore = activeScores.length > 0
    ? calcWeightedScore(activeScores)
    : 0

  // AI 분석 (API 키 있을 때만)
  let aiInsights = undefined
  let usage = undefined

  if (geminiApiKey && (seo || aeo || geo)) {
    try {
      const aiResult = await runAiAnalysis({
        url,
        html,
        seo,
        aeo,
        geo,
        apiKey: geminiApiKey,
      })
      aiInsights = aiResult.insights
      usage = aiResult.usage
    } catch {
      // AI 분석 실패는 non-fatal
    }
  }

  return {
    url,
    analyzedAt: new Date().toISOString(),
    overallScore,
    categories,
    seo,
    aeo,
    geo,
    speed,
    aiInsights,
    usage,
  }
}
