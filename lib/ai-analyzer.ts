import { GoogleGenerativeAI } from '@google/generative-ai'
import { calcCostUsd } from '@/lib/ai-cost'
import type { AiInsights, ApiUsage, SeoResult, AeoResult, GeoResult } from '@/types/analysis'

interface AiAnalysisInput {
  url: string
  html: string
  seo?: SeoResult
  aeo?: AeoResult
  geo?: GeoResult
  apiKey: string
}

interface AiAnalysisOutput {
  insights: AiInsights
  usage: ApiUsage
}

const SYSTEM_PROMPT = `당신은 웹사이트 SEO/AEO/GEO 전문가입니다.
제공된 HTML과 분석 데이터를 바탕으로 간결하고 실용적인 인사이트를 JSON으로 반환하세요.
반드시 유효한 JSON만 응답하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.`

function buildPrompt(input: AiAnalysisInput): string {
  const scores = [
    input.seo ? `SEO: ${input.seo.score}점` : null,
    input.aeo ? `AEO: ${input.aeo.score}점` : null,
    input.geo ? `GEO: ${input.geo.score}점` : null,
  ].filter(Boolean).join(', ')

  // HTML을 요약해서 토큰 절약 (첫 3000자)
  const htmlSummary = input.html.slice(0, 3000)

  return `${SYSTEM_PROMPT}

URL: ${input.url}
분석 점수: ${scores}

HTML (첫 3000자):
${htmlSummary}

다음 JSON 형식으로 응답하세요:
{
  "contentQuality": "콘텐츠 품질에 대한 2-3문장 자연어 평가",
  "topRecommendations": ["개선사항1", "개선사항2", "개선사항3"],
  "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3", "핵심키워드4", "핵심키워드5"],
  "eeatScore": 75
}

규칙:
- contentQuality: 200자 이내의 구체적인 한국어 평가
- topRecommendations: 가장 중요한 개선사항 최대 3개, 각 50자 이내
- keywords: 페이지 핵심 키워드 3-5개
- eeatScore: E-E-A-T(경험·전문성·권위성·신뢰성) 종합 점수 0-100`
}

export async function runAiAnalysis(input: AiAnalysisInput): Promise<AiAnalysisOutput> {
  const genAI = new GoogleGenerativeAI(input.apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent(buildPrompt(input))
  const raw = result.response.text()

  // JSON 블록이 있으면 추출, 없으면 그대로 파싱
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/) ?? raw.match(/({[\s\S]*})/)
  const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw

  let insights: AiInsights
  try {
    insights = JSON.parse(jsonStr.trim()) as AiInsights
  } catch {
    insights = {
      contentQuality: '콘텐츠 분석을 완료할 수 없었습니다.',
      topRecommendations: [],
      keywords: [],
      eeatScore: 0,
    }
  }

  const usage: ApiUsage = {
    inputTokens: 0,
    outputTokens: 0,
    costUsd: calcCostUsd(0, 0),
  }

  return { insights, usage }
}
