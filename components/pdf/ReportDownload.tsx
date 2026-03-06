'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import type { AnalysisResult } from '@/types/analysis'

interface Props {
  result: AnalysisResult
}

function scoreLabel(score: number) {
  if (score >= 80) return '우수'
  if (score >= 60) return '보통'
  return '개선 필요'
}

export function ReportDownload({ result }: Props) {
  const [isGenerating, setIsGenerating] = useState(false)

  async function handleDownload() {
    setIsGenerating(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { createElement } = await import('react')
      const {
        Document, Page, Text, View, StyleSheet, Link,
      } = await import('@react-pdf/renderer')

      const styles = StyleSheet.create({
        page: { fontFamily: 'Helvetica', padding: 40, fontSize: 10, color: '#1e293b' },
        header: { marginBottom: 24 },
        title: { fontSize: 20, fontWeight: 'bold', color: '#4f46e5', marginBottom: 4 },
        subtitle: { fontSize: 10, color: '#64748b' },
        section: { marginBottom: 16 },
        sectionTitle: { fontSize: 13, fontWeight: 'bold', marginBottom: 8, color: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
        scoreRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 8 },
        scoreLabel: { fontSize: 11, color: '#475569' },
        scoreValue: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5' },
        categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
        categoryBox: { width: '22%', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 4 },
        categoryName: { fontSize: 8, color: '#64748b', marginBottom: 2 },
        categoryScore: { fontSize: 12, fontWeight: 'bold' },
        issueItem: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'flex-start' },
        issueDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
        issueText: { flex: 1, fontSize: 9, color: '#475569', lineHeight: 1.4 },
        aiBox: { backgroundColor: '#eef2ff', padding: 10, borderRadius: 6, marginBottom: 8 },
        aiText: { fontSize: 9, color: '#3730a3', lineHeight: 1.5 },
        keyword: { backgroundColor: '#e0e7ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, marginRight: 4, marginBottom: 4 },
        keywordText: { fontSize: 8, color: '#4338ca' },
        footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
        footerText: { fontSize: 8, color: '#94a3b8' },
        url: { fontSize: 9, color: '#4f46e5' },
      })

      const severityColor = (sev: string) =>
        sev === 'critical' ? '#ef4444' : sev === 'warning' ? '#f59e0b' : '#64748b'

      const catScore = (score: number | undefined) =>
        score !== undefined ? score.toString() : 'N/A'

      const catColor = (score: number | undefined) =>
        !score ? '#94a3b8' : score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'

      const allIssues = [
        ...(result.seo?.issues ?? []),
        ...(result.aeo?.issues ?? []),
        ...(result.geo?.issues ?? []),
        ...(result.speed?.issues ?? []),
      ].filter((i) => i.severity === 'critical' || i.severity === 'warning').slice(0, 10)

      const doc = createElement(Document, {},
        createElement(Page, { size: 'A4', style: styles.page },
          // Header
          createElement(View, { style: styles.header },
            createElement(Text, { style: styles.title }, 'Site Analysis Report'),
            createElement(Text, { style: styles.subtitle }, `Generated: ${new Date(result.analyzedAt).toLocaleString('ko-KR')}`),
          ),

          // URL + Overall Score
          createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, '분석 결과 요약'),
            createElement(View, { style: styles.scoreRow },
              createElement(View, {},
                createElement(Text, { style: styles.scoreLabel }, '분석 URL'),
                createElement(Text, { style: styles.url }, result.url),
              ),
              createElement(View, { style: { alignItems: 'flex-end' } },
                createElement(Text, { style: styles.scoreLabel }, '종합 점수'),
                createElement(Text, { style: { ...styles.scoreValue, color: catColor(result.overallScore) } },
                  `${result.overallScore}점 (${scoreLabel(result.overallScore)})`
                ),
              ),
            ),
          ),

          // Category Scores
          createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, '카테고리별 점수'),
            createElement(View, { style: styles.categoryGrid },
              ...[
                { label: 'SEO', score: result.seo?.score },
                { label: 'AEO', score: result.aeo?.score },
                { label: 'GEO', score: result.geo?.score },
                { label: 'Speed', score: result.speed?.score },
              ].filter(c => c.score !== undefined).map(({ label, score }) =>
                createElement(View, { key: label, style: styles.categoryBox },
                  createElement(Text, { style: styles.categoryName }, label),
                  createElement(Text, { style: { ...styles.categoryScore, color: catColor(score) } }, catScore(score)),
                )
              ),
            ),
          ),

          // Issues
          allIssues.length > 0 && createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, '주요 개선 항목'),
            ...allIssues.map((issue, i) =>
              createElement(View, { key: i, style: styles.issueItem },
                createElement(View, { style: { ...styles.issueDot, backgroundColor: severityColor(issue.severity) } }),
                createElement(Text, { style: styles.issueText },
                  `[${issue.severity.toUpperCase()}] ${issue.message} — ${issue.recommendation}`
                ),
              )
            ),
          ),

          // AI Insights
          result.aiInsights && createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, 'AI 인사이트'),
            createElement(View, { style: styles.aiBox },
              createElement(Text, { style: styles.aiText }, result.aiInsights.contentQuality),
            ),
            result.aiInsights.topRecommendations.length > 0 && createElement(View, { style: { marginTop: 6 } },
              createElement(Text, { style: { fontSize: 10, fontWeight: 'bold', marginBottom: 4 } }, '핵심 개선 권장사항'),
              ...result.aiInsights.topRecommendations.map((rec, i) =>
                createElement(Text, { key: i, style: { fontSize: 9, color: '#475569', marginBottom: 2 } },
                  `${i + 1}. ${rec}`
                )
              ),
            ),
            result.aiInsights.keywords.length > 0 && createElement(View, { style: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' } },
              ...result.aiInsights.keywords.map((kw, i) =>
                createElement(View, { key: i, style: styles.keyword },
                  createElement(Text, { style: styles.keywordText }, kw),
                )
              ),
            ),
          ),

          // Footer
          createElement(View, { style: styles.footer, fixed: true },
            createElement(Text, { style: styles.footerText }, 'Site Analyzer'),
            createElement(Text, { style: styles.footerText }, result.url),
          ),
        )
      )

      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const hostname = new URL(result.url).hostname
      a.download = `site-report-${hostname}-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
    >
      <Download size={15} />
      {isGenerating ? 'PDF 생성 중...' : 'PDF 저장'}
    </button>
  )
}
