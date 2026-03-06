'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Bell, BellOff, RefreshCw } from 'lucide-react'
import type { MonitorRow } from '@/types/analysis'
import { cn } from '@/lib/cn'

export const runtime = 'edge'

const CATEGORIES = ['seo', 'aeo', 'geo', 'speed'] as const

function normalizeUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

export default function MonitorPage() {
  const [monitors, setMonitors] = useState<MonitorRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    url: '',
    categories: ['seo', 'aeo', 'geo'] as string[],
    schedule: 'weekly' as 'daily' | 'weekly',
    alertThreshold: 10,
  })
  const [isSaving, setIsSaving] = useState(false)

  async function fetchMonitors() {
    try {
      const res = await fetch('/api/monitor')
      if (!res.ok) throw new Error('모니터 목록을 불러오지 못했습니다.')
      const data = await res.json()
      setMonitors(data.monitors ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchMonitors() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.url.trim() || isSaving) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: normalizeUrl(form.url),
          categories: form.categories,
          schedule: form.schedule,
          alertThreshold: form.alertThreshold,
        }),
      })
      if (!res.ok) throw new Error('모니터 생성에 실패했습니다.')
      setShowForm(false)
      setForm({ url: '', categories: ['seo', 'aeo', 'geo'], schedule: 'weekly', alertThreshold: 10 })
      await fetchMonitors()
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggle(id: string, isActive: number) {
    await fetch('/api/monitor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: isActive ? 0 : 1 }),
    })
    await fetchMonitors()
  }

  async function handleDelete(id: string) {
    if (!confirm('이 모니터를 삭제하시겠습니까?')) return
    await fetch('/api/monitor', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await fetchMonitors()
  }

  function toggleCategory(cat: string) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.length > 1 ? f.categories.filter((c) => c !== cat) : f.categories
        : [...f.categories, cat],
    }))
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">정기 모니터링</h2>
          <p className="text-xs text-slate-500 mt-0.5">점수 하락 시 이메일 알림을 받을 수 있습니다.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} />
          모니터 추가
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">새 모니터 설정</h3>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">모니터링 URL</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="example.com"
              required
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">분석 항목</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
                    form.categories.includes(cat)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                  )}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">주기</label>
              <select
                value={form.schedule}
                onChange={(e) => setForm({ ...form, schedule: e.target.value as 'daily' | 'weekly' })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">알림 임계값 (점 하락 시)</label>
              <input
                type="number"
                value={form.alertThreshold}
                onChange={(e) => setForm({ ...form, alertThreshold: Number(e.target.value) })}
                min={1}
                max={50}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
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

      {/* 모니터 목록 */}
      {monitors.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Bell size={32} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">등록된 모니터가 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">모니터를 추가하면 정기적으로 점수를 확인하고 이메일로 알려드립니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monitors.map((m) => {
            const cats = JSON.parse(m.categories) as string[]
            return (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{m.url}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">
                      {m.schedule === 'daily' ? '매일' : '매주'}
                    </span>
                    <span className="text-xs text-slate-400">
                      -{m.alert_threshold}점 이하 알림
                    </span>
                    {m.last_run_at && (
                      <span className="text-xs text-slate-400">
                        마지막: {new Date(m.last_run_at).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                    {m.last_score !== null && (
                      <span className={cn(
                        'text-xs font-bold',
                        m.last_score >= 80 ? 'text-green-600' : m.last_score >= 60 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {m.last_score}점
                      </span>
                    )}
                    <div className="flex gap-1">
                      {cats.map((c) => (
                        <span key={c} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {c.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(m.id, m.is_active)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      m.is_active
                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                        : 'text-slate-400 bg-slate-100 hover:bg-slate-200'
                    )}
                    title={m.is_active ? '비활성화' : '활성화'}
                  >
                    {m.is_active ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 안내 */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-xs text-amber-800 flex gap-2">
        <RefreshCw size={14} className="shrink-0 mt-0.5" />
        <p>모니터링은 Cloudflare Cron Trigger에 의해 자동 실행됩니다. 로컬 환경에서는 <code>/api/monitor/run</code>을 수동 호출해야 합니다.</p>
      </div>
    </div>
  )
}
