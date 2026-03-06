// ============================================================
// Core Analysis Types
// ============================================================

export interface AnalysisInput {
  url: string
  html: string
  responseTimeMs: number
}

// ─── SEO ────────────────────────────────────────────────────

export interface SeoIssue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  message: string
  recommendation: string
}

export interface SeoResult {
  score: number // 0-100
  issues: SeoIssue[]
  details: {
    title: string | null
    titleLength: number | null
    metaDescription: string | null
    metaDescriptionLength: number | null
    h1Count: number
    hasCanonical: boolean
    hasRobotsMeta: boolean
    hasOgTags: boolean
    hasSchemaOrg: boolean
    imagesMissingAlt: number
    internalLinksCount: number
    externalLinksCount: number
  }
}

// ─── AEO ────────────────────────────────────────────────────

export interface AeoResult {
  score: number
  issues: SeoIssue[]
  details: {
    hasFaqSchema: boolean
    hasHowToSchema: boolean
    questionHeadingsCount: number
    hasDirectAnswerParagraph: boolean
    hasListContent: boolean
    hasTableContent: boolean
  }
}

// ─── GEO ────────────────────────────────────────────────────

export interface GeoResult {
  score: number
  issues: SeoIssue[]
  details: {
    hasAuthorInfo: boolean
    hasDatePublished: boolean
    hasDateModified: boolean
    isHttps: boolean
    hasAboutPage: boolean
    externalCitationsCount: number
    hasOrganizationSchema: boolean
    hasArticleSchema: boolean
  }
}

// ─── Speed ──────────────────────────────────────────────────

export interface CoreWebVitals {
  lcp: number | null  // Largest Contentful Paint (ms)
  inp: number | null  // Interaction to Next Paint (ms)
  cls: number | null  // Cumulative Layout Shift (score)
  fcp: number | null  // First Contentful Paint (ms)
  ttfb: number | null // Time to First Byte (ms)
}

export interface SpeedResult {
  score: number
  issues: SeoIssue[]
  coreWebVitals: CoreWebVitals
  details: {
    totalResourcesCount: number
    unoptimizedImagesCount: number
    renderBlockingResourcesCount: number
    usesCompression: boolean
    usesCaching: boolean
  }
}

// ─── PageSpeed API ──────────────────────────────────────────

export interface PageSpeedAudit {
  score: number | null
  numericValue?: number
  displayValue?: string
  details?: {
    items?: unknown[]
    overallSavingsMs?: number
  }
}

export interface PageSpeedApiResponse {
  lighthouseResult: {
    categories: {
      performance?: { score: number | null }
    }
    audits: {
      'largest-contentful-paint'?: PageSpeedAudit
      'experimental-interaction-to-next-paint'?: PageSpeedAudit
      'cumulative-layout-shift'?: PageSpeedAudit
      'first-contentful-paint'?: PageSpeedAudit
      'server-response-time'?: PageSpeedAudit
      'total-byte-weight'?: PageSpeedAudit
      'uses-optimized-images'?: PageSpeedAudit
      'render-blocking-resources'?: PageSpeedAudit
      'uses-text-compression'?: PageSpeedAudit
      'uses-long-cache-ttl'?: PageSpeedAudit
    }
  }
}

// ─── Categories ─────────────────────────────────────────────

export type AnalysisCategory = 'seo' | 'aeo' | 'geo' | 'speed'

// ─── AI Insights ────────────────────────────────────────────

export interface AiInsights {
  contentQuality: string        // 콘텐츠 품질 자연어 평가
  topRecommendations: string[]  // 우선순위 개선 항목 (최대 3개)
  keywords: string[]            // 핵심 키워드 추출
  eeatScore: number             // EEAT 신뢰도 점수 (0-100)
}

// ─── API Usage ──────────────────────────────────────────────

export interface ApiUsage {
  inputTokens: number
  outputTokens: number
  costUsd: number
}

// ─── Aggregate ──────────────────────────────────────────────

export interface AnalysisResult {
  id?: string                 // DB 저장 후 생성
  url: string
  analyzedAt: string
  overallScore: number
  categories: AnalysisCategory[]
  seo?: SeoResult
  aeo?: AeoResult
  geo?: GeoResult
  speed?: SpeedResult
  aiInsights?: AiInsights
  usage?: ApiUsage
}

export type SeverityLevel = 'critical' | 'warning' | 'info'

// ─── DB Row Types ────────────────────────────────────────────

export interface AnalysisRow {
  id: string
  user_id: string
  url: string
  categories: string
  overall_score: number
  seo_score: number | null
  aeo_score: number | null
  geo_score: number | null
  speed_score: number | null
  result_json: string
  ai_input_tokens: number
  ai_output_tokens: number
  ai_cost_usd: number
  created_at: string
}

export interface MonitorRow {
  id: string
  user_id: string
  url: string
  categories: string
  schedule: 'daily' | 'weekly'
  last_run_at: string | null
  last_score: number | null
  alert_threshold: number
  is_active: number
  created_at: string
}

export interface WebhookRow {
  id: string
  user_id: string
  type: 'slack' | 'discord'
  url: string
  events: string
  is_active: number
}
