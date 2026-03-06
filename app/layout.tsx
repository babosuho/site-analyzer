import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Site Analyzer — SEO · AEO · GEO · Speed',
  description: '웹사이트의 SEO, AEO, GEO, 페이지 속도를 분석하고 개선 방안을 제공합니다.',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
