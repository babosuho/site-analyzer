import * as cheerio from 'cheerio'
import { AnalysisInput, SeoIssue, SeoResult } from '@/types/analysis'

const TITLE_MIN = 10
const TITLE_MAX = 60
const META_DESC_MIN = 80
const META_DESC_MAX = 160

// Scoring weights (must sum to 100)
const WEIGHTS = {
  title: 20,
  metaDescription: 20,
  h1: 15,
  ogTags: 10,
  canonical: 5,
  schemaOrg: 10,
  images: 10,
  links: 10,
} as const

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

export function analyzeSeo(input: AnalysisInput): SeoResult {
  const $ = cheerio.load(input.html)
  const issues: SeoIssue[] = []
  let deductions = 0

  // ── Title ─────────────────────────────────────────────────
  const titleEl = $('title').first()
  const title = titleEl.length ? titleEl.text().trim() : null
  const titleLength = title ? title.length : null

  if (!title) {
    issues.push({
      id: 'missing-title',
      severity: 'critical',
      message: '페이지 <title> 태그가 없습니다.',
      recommendation: '<head> 안에 <title>페이지 제목</title>을 추가하세요.',
    })
    deductions += WEIGHTS.title
  } else if (titleLength! < TITLE_MIN) {
    issues.push({
      id: 'title-too-short',
      severity: 'warning',
      message: `제목이 너무 짧습니다 (${titleLength}자). 최소 ${TITLE_MIN}자 권장.`,
      recommendation: '클릭을 유도하는 구체적이고 풍부한 제목을 작성하세요.',
    })
    deductions += WEIGHTS.title * 0.5
  } else if (titleLength! > TITLE_MAX) {
    issues.push({
      id: 'title-too-long',
      severity: 'warning',
      message: `제목이 너무 깁니다 (${titleLength}자). 최대 ${TITLE_MAX}자 권장.`,
      recommendation: '검색 결과에서 잘리지 않도록 60자 이내로 줄이세요.',
    })
    deductions += WEIGHTS.title * 0.3
  }

  // ── Meta Description ──────────────────────────────────────
  const metaDescEl = $('meta[name="description"]').first()
  const metaDescription = metaDescEl.length ? metaDescEl.attr('content')?.trim() ?? null : null
  const metaDescriptionLength = metaDescription ? metaDescription.length : null

  if (!metaDescription) {
    issues.push({
      id: 'missing-meta-description',
      severity: 'critical',
      message: 'meta description이 없습니다.',
      recommendation: '120~160자의 페이지 요약 meta description을 추가하세요.',
    })
    deductions += WEIGHTS.metaDescription
  } else if (metaDescriptionLength! < META_DESC_MIN) {
    issues.push({
      id: 'meta-description-too-short',
      severity: 'warning',
      message: `meta description이 너무 짧습니다 (${metaDescriptionLength}자).`,
      recommendation: '클릭률 향상을 위해 120자 이상으로 작성하세요.',
    })
    deductions += WEIGHTS.metaDescription * 0.5
  } else if (metaDescriptionLength! > META_DESC_MAX) {
    issues.push({
      id: 'meta-description-too-long',
      severity: 'warning',
      message: `meta description이 너무 깁니다 (${metaDescriptionLength}자).`,
      recommendation: '160자 이내로 줄이세요.',
    })
    deductions += WEIGHTS.metaDescription * 0.3
  }

  // ── H1 ───────────────────────────────────────────────────
  const h1Count = $('h1').length

  if (h1Count === 0) {
    issues.push({
      id: 'missing-h1',
      severity: 'critical',
      message: 'H1 태그가 없습니다.',
      recommendation: '각 페이지에 핵심 키워드를 포함한 H1을 하나 추가하세요.',
    })
    deductions += WEIGHTS.h1
  } else if (h1Count > 1) {
    issues.push({
      id: 'multiple-h1',
      severity: 'warning',
      message: `H1 태그가 ${h1Count}개 있습니다. 1개만 권장됩니다.`,
      recommendation: 'H1은 페이지당 1개만 사용하고 나머지는 H2~H6으로 변경하세요.',
    })
    deductions += WEIGHTS.h1 * 0.4
  }

  // ── OG Tags ───────────────────────────────────────────────
  const hasOgTitle = $('meta[property="og:title"]').length > 0
  const hasOgDescription = $('meta[property="og:description"]').length > 0
  const hasOgImage = $('meta[property="og:image"]').length > 0
  const hasOgTags = hasOgTitle && hasOgDescription && hasOgImage

  if (!hasOgTags) {
    issues.push({
      id: 'missing-og-tags',
      severity: 'warning',
      message: 'Open Graph 태그(og:title, og:description, og:image)가 누락되었습니다.',
      recommendation: 'SNS 공유 시 미리보기를 위해 OG 태그를 추가하세요.',
    })
    deductions += WEIGHTS.ogTags
  }

  // ── Canonical ─────────────────────────────────────────────
  const hasCanonical = $('link[rel="canonical"]').length > 0

  if (!hasCanonical) {
    issues.push({
      id: 'missing-canonical',
      severity: 'info',
      message: 'canonical 태그가 없습니다.',
      recommendation: '<link rel="canonical" href="...">를 추가해 중복 콘텐츠 문제를 방지하세요.',
    })
    deductions += WEIGHTS.canonical
  }

  // ── Schema.org ────────────────────────────────────────────
  const schemaScripts = $('script[type="application/ld+json"]')
  const hasSchemaOrg = schemaScripts.length > 0

  if (!hasSchemaOrg) {
    issues.push({
      id: 'missing-schema-org',
      severity: 'warning',
      message: 'JSON-LD 구조화 데이터가 없습니다.',
      recommendation: 'Schema.org JSON-LD로 구조화 데이터를 추가하면 리치 결과 노출이 가능합니다.',
    })
    deductions += WEIGHTS.schemaOrg
  }

  // ── Images ────────────────────────────────────────────────
  const images = $('img')
  let imagesMissingAlt = 0
  images.each((_, el) => {
    const alt = $(el).attr('alt')
    if (alt === undefined || alt === null) {
      imagesMissingAlt++
    }
  })

  if (imagesMissingAlt > 0) {
    issues.push({
      id: 'images-missing-alt',
      severity: 'warning',
      message: `이미지 ${imagesMissingAlt}개에 alt 속성이 없습니다.`,
      recommendation: '모든 이미지에 의미 있는 alt 텍스트를 추가하세요.',
    })
    deductions += WEIGHTS.images * Math.min(imagesMissingAlt / images.length, 1)
  }

  // ── Links ─────────────────────────────────────────────────
  const urlHost = (() => {
    try {
      return new URL(input.url).host
    } catch {
      return ''
    }
  })()

  let internalLinksCount = 0
  let externalLinksCount = 0

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (href.startsWith('/') || href.startsWith('#') || href.includes(urlHost)) {
      internalLinksCount++
    } else if (href.startsWith('http')) {
      externalLinksCount++
    }
  })

  // ── robots meta ───────────────────────────────────────────
  const hasRobotsMeta = $('meta[name="robots"]').length > 0

  // ── Score ─────────────────────────────────────────────────
  const score = clamp(100 - deductions, 0, 100)

  return {
    score,
    issues,
    details: {
      title,
      titleLength,
      metaDescription,
      metaDescriptionLength,
      h1Count,
      hasCanonical,
      hasRobotsMeta,
      hasOgTags,
      hasSchemaOrg,
      imagesMissingAlt,
      internalLinksCount,
      externalLinksCount,
    },
  }
}
