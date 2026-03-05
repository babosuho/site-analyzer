import { Analyzer } from '@/components/Analyzer'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm
                            rounded-full px-4 py-1.5 text-sm font-medium mb-6 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              무료 사이트 분석
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
              사이트 최적화 점수를
              <br />
              <span className="text-blue-200">한눈에</span> 확인하세요
            </h1>
            <p className="text-blue-100 text-lg max-w-xl mx-auto leading-relaxed">
              SEO · AEO · GEO · 페이지 속도를 분석하고
              <br />
              구체적인 개선 방안을 제공합니다.
            </p>
          </div>

          {/* 분석기 폼 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl">
            <Analyzer />
          </div>

          {/* 카테고리 설명 */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { icon: '🔍', label: 'SEO', desc: '검색 엔진 최적화' },
              { icon: '💬', label: 'AEO', desc: '답변 엔진 최적화' },
              { icon: '🤖', label: 'GEO', desc: 'AI 검색 최적화' },
              { icon: '⚡', label: 'Speed', desc: 'Core Web Vitals' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-blue-200">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 점수 기준 안내 */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span>80~100 우수</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>60~79 보통</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>0~59 개선 필요</span>
          </div>
        </div>
      </section>
    </main>
  )
}
