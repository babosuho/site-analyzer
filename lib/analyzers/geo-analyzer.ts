import * as cheerio from 'cheerio'
import { AnalysisInput, GeoResult, SeoIssue } from '@/types/analysis'

const WEIGHTS = {
  https: 15,
  authorInfo: 20,
  datePublished: 10,
  dateModified: 5,
  aboutPage: 10,
  externalCitations: 10,
  organizationSchema: 15,
  articleSchema: 15,
} as const

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

function parseJsonLdBlocks(html: string): unknown[] {
  const $ = cheerio.load(html)
  const blocks: unknown[] = []
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      blocks.push(JSON.parse($(el).text()))
    } catch {
      // ignore malformed JSON
    }
  })
  return blocks
}

function getSchemaField(blocks: unknown[], type: string, field: string): unknown {
  for (const b of blocks) {
    if (typeof b !== 'object' || b === null) continue
    const obj = b as Record<string, unknown>
    if (obj['@type'] === type && obj[field] !== undefined) {
      return obj[field]
    }
  }
  return undefined
}

function hasSchemaType(blocks: unknown[], type: string): boolean {
  return blocks.some((b) => {
    if (typeof b !== 'object' || b === null) return false
    return (b as Record<string, unknown>)['@type'] === type
  })
}

export function analyzeGeo(input: AnalysisInput): GeoResult {
  const $ = cheerio.load(input.html)
  const issues: SeoIssue[] = []
  let score = 0

  const jsonLdBlocks = parseJsonLdBlocks(input.html)

  // ── HTTPS ─────────────────────────────────────────────────
  const isHttps = input.url.startsWith('https://')
  if (isHttps) {
    score += WEIGHTS.https
  } else {
    issues.push({
      id: 'not-https',
      severity: 'critical',
      message: '사이트가 HTTPS를 사용하지 않습니다.',
      recommendation: 'SSL 인증서를 설치하고 모든 트래픽을 HTTPS로 리다이렉트하세요.',
    })
  }

  // ── Author Info ───────────────────────────────────────────
  const authorFromSchema = getSchemaField(jsonLdBlocks, 'Article', 'author')
  const authorFromHtml =
    $('[class*="author"], [rel="author"], [itemprop="author"]').length > 0

  const hasAuthorInfo = !!authorFromSchema || authorFromHtml
  if (hasAuthorInfo) {
    score += WEIGHTS.authorInfo
  } else {
    issues.push({
      id: 'missing-author',
      severity: 'warning',
      message: '저자 정보가 없습니다.',
      recommendation: 'Article Schema의 "author" 필드 또는 HTML의 저자 표시 요소를 추가하세요.',
    })
  }

  // ── Date Published ────────────────────────────────────────
  const datePublishedFromSchema = getSchemaField(jsonLdBlocks, 'Article', 'datePublished')
  const datePublishedFromHtml = $('[itemprop="datePublished"], time[datetime]').length > 0
  const hasDatePublished = !!datePublishedFromSchema || datePublishedFromHtml

  if (hasDatePublished) {
    score += WEIGHTS.datePublished
  } else {
    issues.push({
      id: 'missing-date-published',
      severity: 'info',
      message: '발행일 정보가 없습니다.',
      recommendation: 'Article Schema에 datePublished를 추가하거나 <time datetime="..."> 요소를 사용하세요.',
    })
  }

  // ── Date Modified ─────────────────────────────────────────
  const dateModifiedFromSchema = getSchemaField(jsonLdBlocks, 'Article', 'dateModified')
  const hasDateModified = !!dateModifiedFromSchema

  if (hasDateModified) {
    score += WEIGHTS.dateModified
  }

  // ── About Page ────────────────────────────────────────────
  const hasAboutPage =
    $('a[href*="/about"]').length > 0 ||
    $('a[href*="about.html"]').length > 0

  if (hasAboutPage) {
    score += WEIGHTS.aboutPage
  } else {
    issues.push({
      id: 'missing-about-page',
      severity: 'info',
      message: 'About 페이지 링크가 없습니다.',
      recommendation: 'E-E-A-T 신호를 높이기 위해 About/소개 페이지 링크를 추가하세요.',
    })
  }

  // ── External Citations ────────────────────────────────────
  const urlHost = (() => {
    try {
      return new URL(input.url).host
    } catch {
      return ''
    }
  })()

  let externalCitationsCount = 0
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (href.startsWith('http') && !href.includes(urlHost)) {
      externalCitationsCount++
    }
  })

  if (externalCitationsCount >= 2) {
    score += WEIGHTS.externalCitations
  } else if (externalCitationsCount === 1) {
    score += WEIGHTS.externalCitations * 0.5
  } else {
    issues.push({
      id: 'no-external-citations',
      severity: 'info',
      message: '외부 인용/참고 링크가 없습니다.',
      recommendation: '신뢰할 수 있는 외부 소스를 인용하면 콘텐츠 신뢰도가 높아집니다.',
    })
  }

  // ── Organization Schema ───────────────────────────────────
  const hasOrganizationSchema = hasSchemaType(jsonLdBlocks, 'Organization')
  if (hasOrganizationSchema) {
    score += WEIGHTS.organizationSchema
  } else {
    issues.push({
      id: 'missing-organization-schema',
      severity: 'warning',
      message: 'Organization 구조화 데이터가 없습니다.',
      recommendation: 'Schema.org Organization 타입으로 브랜드 정보를 구조화하세요.',
    })
  }

  // ── Article Schema ────────────────────────────────────────
  const hasArticleSchema = hasSchemaType(jsonLdBlocks, 'Article')
  if (hasArticleSchema) {
    score += WEIGHTS.articleSchema
  } else {
    issues.push({
      id: 'missing-article-schema',
      severity: 'info',
      message: 'Article 구조화 데이터가 없습니다.',
      recommendation: '콘텐츠 페이지에 Article Schema를 추가하면 AI 검색 엔진이 콘텐츠를 더 잘 이해합니다.',
    })
  }

  return {
    score: clamp(score, 0, 100),
    issues,
    details: {
      hasAuthorInfo,
      hasDatePublished,
      hasDateModified,
      isHttps,
      hasAboutPage,
      externalCitationsCount,
      hasOrganizationSchema,
      hasArticleSchema,
    },
  }
}
