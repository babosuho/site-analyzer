'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'

type Step = 'email' | 'otp'

export default function LoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '이메일 전송에 실패했습니다.')
      setMessage(`${email}로 인증코드를 전송했습니다.`)
      setStep('otp')
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!otp.trim() || isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '인증에 실패했습니다.')
      window.location.href = '/'
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="p-2 bg-indigo-600 rounded-xl">
          <BarChart3 size={22} className="text-white" />
        </div>
        <span className="text-xl font-bold text-white">Site Analyzer</span>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-7">
        <h1 className="text-lg font-bold text-slate-900 mb-1">
          {step === 'email' ? '이메일로 시작하기' : '인증코드 입력'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {step === 'email'
            ? '이메일 주소를 입력하면 6자리 인증코드를 보내드립니다.'
            : message ?? `${email}로 전송된 6자리 코드를 입력하세요.`}
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '전송 중...' : '인증코드 받기'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">인증코드 (6자리)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                required
                disabled={isLoading}
                autoFocus
                className="w-full text-center text-2xl font-bold tracking-[0.5em] border border-slate-200 rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">코드는 10분간 유효합니다.</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '확인 중...' : '로그인'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError(null); setMessage(null) }}
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              이메일 다시 입력
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        Site Analyzer © {new Date().getFullYear()}
      </p>
    </div>
  )
}
