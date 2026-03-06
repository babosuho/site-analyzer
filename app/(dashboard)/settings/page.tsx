'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Globe, Webhook } from 'lucide-react'
import type { WebhookRow } from '@/types/analysis'
import { cn } from '@/lib/cn'

type WebhookType = 'slack' | 'discord'

export default function SettingsPage() {
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<{ type: WebhookType; url: string }>({
    type: 'slack',
    url: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<Record<string, 'ok' | 'fail' | 'loading'>>({})

  async function fetchWebhooks() {
    try {
      const res = await fetch('/api/webhooks')
      if (!res.ok) throw new Error('웹훅 목록을 불러오지 못했습니다.')
      const data = await res.json()
      setWebhooks(data.webhooks ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchWebhooks() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url.trim() || isSaving) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: form.type, url: form.url.trim(), events: ['analysis_done'] }),
      })
      if (!res.ok) throw new Error('웹훅 생성에 실패했습니다.')
      setShowForm(false)
      setForm({ type: 'slack', url: '' })
      await fetchWebhooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('이 웹훅을 삭제하시겠습니까?')) return
    await fetch('/api/webhooks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchWebhooks()
  }

  async function handleTest(webhook: WebhookRow) {
    setTestResult((prev) => ({ ...prev, [webhook.id]: 'loading' }))
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: webhook.id, test: true }),
      })
      setTestResult((prev) => ({ ...prev, [webhook.id]: res.ok ? 'ok' : 'fail' }))
    } catch {
      setTestResult((prev) => ({ ...prev, [webhook.id]: 'fail' }))
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 웹훅 섹션 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Webhook size={16} className="text-slate-500" />
              웹훅 연동
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">분석 완료 시 Slack 또는 Discord로 알림을 받을 수 있습니다.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus size={15} />
            웹훅 추가
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {/* 추가 폼 */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">새 웹훅 추가</h3>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">플랫폼</label>
              <div className="flex gap-2">
                {(['slack', 'discord'] as WebhookType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg border transition-colors',
                      form.type === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                    )}
                  >
                    {t === 'slack' ? 'Slack' : 'Discord'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                웹훅 URL
              </label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder={
                  form.type === 'slack'
                    ? 'https://hooks.slack.com/services/...'
                    : 'https://discord.com/api/webhooks/...'
                }
                required
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 웹훅 목록 */}
        {webhooks.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <Globe size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">등록된 웹훅이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {webhooks.map((wh) => {
              const tr = testResult[wh.id]
              return (
                <div key={wh.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    wh.type === 'slack' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                  )}>
                    {wh.type === 'slack' ? 'SL' : 'DC'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {wh.type === 'slack' ? 'Slack' : 'Discord'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{wh.url}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tr === 'ok' && <span className="text-xs text-green-600 font-medium">전송 성공</span>}
                    {tr === 'fail' && <span className="text-xs text-red-600 font-medium">전송 실패</span>}
                    <button
                      onClick={() => handleTest(wh)}
                      disabled={tr === 'loading'}
                      className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
                    >
                      {tr === 'loading' ? '테스트 중...' : '테스트'}
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 이벤트 안내 */}
      <section className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-1">
        <p className="font-semibold text-slate-700">지원 이벤트</p>
        <p><code className="bg-white px-1 py-0.5 rounded">analysis_done</code> — 분석 완료 시 결과 알림</p>
        <p className="text-slate-400 mt-2">추후 더 많은 이벤트가 지원될 예정입니다.</p>
      </section>
    </div>
  )
}
