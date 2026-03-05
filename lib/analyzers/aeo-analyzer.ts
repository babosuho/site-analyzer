import * as cheerio from 'cheerio'
import { AnalysisInput, AeoResult, SeoIssue } from '@/types/analysis'

const QUESTION_WORDS = /^(what|how|why|when|where|who|which|can|does|is|are|do|should|will|would|무엇|어떻게|왜|언제|어디|누가|어느)/i
const ANSWER_PARA_MIN_WORDS = 15
const ANSWER_PARA_MAX_WORDS = 120

const WEIGHTS = {
  faqSchema: 25,
  howToSchema: 15,
  questionHeadings: 20,
  directAnswer: 20,
  listContent: 10,
  tableContent: 10,
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

function hasSchemaType(blocks: unknown[], type: string): boolean {
  return blocks.some((b) => {
    if (typeof b !== 'object' || b === null) return false
    const obj = b as Record<string, unknown>
    return obj['@type'] === type
  })
}

export function analyzeAeo(input: AnalysisInput): AeoResult {
  const $ = cheerio.load(input.html)
  const issues: SeoIssue[] = []
  let score = 0

  const jsonLdBlocks = parseJsonLdBlocks(input.html)

  // ── FAQ Schema ────────────────────────────────────────────
  const hasFaqSchema = hasSchemaType(jsonLdBlocks, 'FAQPage')
  if (hasFaqSchema) {
    score += WEIGHTS.faqSchema
  } else {
    issues.push({
      id: 'no-faq-schema',
      severity: 'warning',
      message: 'FAQPage 구조화 데이터가 없습니다.',
      recommendation: '자주 묻는 질문을 FAQPage Schema로 마크업하면 Featured Snippet 노출 가능성이 높아집니다.',
    })
  }

  // ── HowTo Schema ──────────────────────────────────────────
  const hasHowToSchema = hasSchemaType(jsonLdBlocks, 'HowTo')
  if (hasHowToSchema) {
    score += WEIGHTS.howToSchema
  }

  // ── Question Headings ─────────────────────────────────────
  let questionHeadingsCount = 0
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().trim()
    if (QUESTION_WORDS.test(text)) {
      questionHeadingsCount++
    }
  })

  if (questionHeadingsCount > 0) {
    score += Math.min(WEIGHTS.questionHeadings, questionHeadingsCount * 10)
  } else {
    issues.push({
      id: 'no-question-headings',
      severity: 'warning',
      message: '질문형 제목(H2~H3)이 없습니다.',
      recommendation: '"What is X?", "How to Y?" 형태의 질문형 소제목을 사용해 Answer Engine에 최적화하세요.',
    })
  }

  // ── Direct Answer Paragraph ───────────────────────────────
  let hasDirectAnswerParagraph = false
  $('p').each((_, el) => {
    const words = $(el).text().trim().split(/\s+/)
    if (words.length >= ANSWER_PARA_MIN_WORDS && words.length <= ANSWER_PARA_MAX_WORDS) {
      hasDirectAnswerParagraph = true
      return false // break
    }
  })

  if (hasDirectAnswerParagraph) {
    score += WEIGHTS.directAnswer
  } else {
    issues.push({
      id: 'no-direct-answer',
      severity: 'info',
      message: '40~100 단어의 간결한 답변 단락이 없습니다.',
      recommendation: '핵심 질문에 대한 30~100 단어의 직접 답변 단락을 추가하면 Featured Snippet 노출에 유리합니다.',
    })
  }

  // ── List Content ──────────────────────────────────────────
  const hasListContent = $('ul li, ol li').length > 0
  if (hasListContent) {
    score += WEIGHTS.listContent
  }

  // ── Table Content ─────────────────────────────────────────
  const hasTableContent = $('table').length > 0
  if (hasTableContent) {
    score += WEIGHTS.tableContent
  }

  return {
    score: clamp(score, 0, 100),
    issues,
    details: {
      hasFaqSchema,
      hasHowToSchema,
      questionHeadingsCount,
      hasDirectAnswerParagraph,
      hasListContent,
      hasTableContent,
    },
  }
}
