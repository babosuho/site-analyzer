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

// ─── Aggregate ──────────────────────────────────────────────

export interface AnalysisResult {
  url: string
  analyzedAt: string
  overallScore: number
  seo: SeoResult
  aeo: AeoResult
  geo: GeoResult
  speed: SpeedResult
}

export type SeverityLevel = 'critical' | 'warning' | 'info'
