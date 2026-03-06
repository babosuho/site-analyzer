import { nanoid } from 'nanoid'
import type { User } from '@/types/auth'
import type { AnalysisResult, AnalysisRow, MonitorRow, WebhookRow } from '@/types/analysis'

// ─── Users ────────────────────────────────────────────────────

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db
    .prepare('SELECT id, email, created_at, last_login_at FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; created_at: string; last_login_at: string | null }>()

  if (!row) return null
  return { id: row.id, email: row.email, createdAt: row.created_at, lastLoginAt: row.last_login_at }
}

export async function createUser(db: D1Database, email: string): Promise<User> {
  const id = nanoid()
  await db
    .prepare('INSERT INTO users (id, email) VALUES (?, ?)')
    .bind(id, email)
    .run()

  return { id, email, createdAt: new Date().toISOString(), lastLoginAt: null }
}

export async function upsertUser(db: D1Database, email: string): Promise<User> {
  const existing = await getUserByEmail(db, email)
  if (existing) return existing
  return createUser(db, email)
}

export async function updateLastLogin(db: D1Database, userId: string): Promise<void> {
  await db
    .prepare('UPDATE users SET last_login_at = datetime(\'now\') WHERE id = ?')
    .bind(userId)
    .run()
}

// ─── OTP ─────────────────────────────────────────────────────

export async function createOtp(db: D1Database, email: string, token: string): Promise<void> {
  const id = nanoid()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10분
  await db
    .prepare('INSERT INTO otp_tokens (id, email, token, expires_at) VALUES (?, ?, ?, ?)')
    .bind(id, email, token, expiresAt)
    .run()
}

export async function verifyAndConsumeOtp(
  db: D1Database,
  email: string,
  token: string
): Promise<boolean> {
  const row = await db
    .prepare(
      'SELECT id, expires_at, used FROM otp_tokens WHERE email = ? AND token = ? ORDER BY created_at DESC LIMIT 1'
    )
    .bind(email, token)
    .first<{ id: string; expires_at: string; used: number }>()

  if (!row) return false
  if (row.used === 1) return false
  if (new Date(row.expires_at) < new Date()) return false

  await db.prepare('UPDATE otp_tokens SET used = 1 WHERE id = ?').bind(row.id).run()
  return true
}

// ─── Analyses ────────────────────────────────────────────────

export async function saveAnalysis(
  db: D1Database,
  userId: string,
  result: AnalysisResult
): Promise<string> {
  const id = nanoid()
  await db
    .prepare(
      `INSERT INTO analyses
       (id, user_id, url, categories, overall_score, seo_score, aeo_score, geo_score, speed_score,
        result_json, ai_input_tokens, ai_output_tokens, ai_cost_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      userId,
      result.url,
      JSON.stringify(result.categories),
      result.overallScore,
      result.seo?.score ?? null,
      result.aeo?.score ?? null,
      result.geo?.score ?? null,
      result.speed?.score ?? null,
      JSON.stringify(result),
      result.usage?.inputTokens ?? 0,
      result.usage?.outputTokens ?? 0,
      result.usage?.costUsd ?? 0
    )
    .run()

  return id
}

export async function getAnalysesByUser(
  db: D1Database,
  userId: string,
  limit = 20
): Promise<AnalysisRow[]> {
  const { results } = await db
    .prepare(
      'SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .bind(userId, limit)
    .all<AnalysisRow>()

  return results
}

export async function getAnalysesForUrl(
  db: D1Database,
  userId: string,
  url: string,
  limit = 30
): Promise<AnalysisRow[]> {
  const { results } = await db
    .prepare(
      'SELECT * FROM analyses WHERE user_id = ? AND url = ? ORDER BY created_at ASC LIMIT ?'
    )
    .bind(userId, url, limit)
    .all<AnalysisRow>()

  return results
}

export async function getUserUsageStats(
  db: D1Database,
  userId: string
): Promise<{ totalAnalyses: number; totalCostUsd: number; totalInputTokens: number; totalOutputTokens: number }> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) as total, SUM(ai_cost_usd) as cost,
              SUM(ai_input_tokens) as input_tokens, SUM(ai_output_tokens) as output_tokens
       FROM analyses WHERE user_id = ?`
    )
    .bind(userId)
    .first<{ total: number; cost: number | null; input_tokens: number | null; output_tokens: number | null }>()

  return {
    totalAnalyses: row?.total ?? 0,
    totalCostUsd: row?.cost ?? 0,
    totalInputTokens: row?.input_tokens ?? 0,
    totalOutputTokens: row?.output_tokens ?? 0,
  }
}

// ─── Monitors ────────────────────────────────────────────────

export async function createMonitor(
  db: D1Database,
  userId: string,
  data: { url: string; categories: string[]; schedule: 'daily' | 'weekly'; alertThreshold: number }
): Promise<string> {
  const id = nanoid()
  await db
    .prepare(
      'INSERT INTO monitors (id, user_id, url, categories, schedule, alert_threshold) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(id, userId, data.url, JSON.stringify(data.categories), data.schedule, data.alertThreshold)
    .run()

  return id
}

export async function getMonitorsByUser(db: D1Database, userId: string): Promise<MonitorRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM monitors WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all<MonitorRow>()

  return results
}

export async function getActiveMonitors(db: D1Database): Promise<MonitorRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM monitors WHERE is_active = 1')
    .all<MonitorRow>()

  return results
}

export async function updateMonitorLastRun(
  db: D1Database,
  id: string,
  score: number
): Promise<void> {
  await db
    .prepare('UPDATE monitors SET last_run_at = datetime(\'now\'), last_score = ? WHERE id = ?')
    .bind(score, id)
    .run()
}

export async function toggleMonitor(db: D1Database, id: string, userId: string, active: boolean): Promise<void> {
  await db
    .prepare('UPDATE monitors SET is_active = ? WHERE id = ? AND user_id = ?')
    .bind(active ? 1 : 0, id, userId)
    .run()
}

export async function deleteMonitor(db: D1Database, id: string, userId: string): Promise<void> {
  await db.prepare('DELETE FROM monitors WHERE id = ? AND user_id = ?').bind(id, userId).run()
}

// ─── Webhooks ────────────────────────────────────────────────

export async function saveWebhook(
  db: D1Database,
  userId: string,
  data: { type: 'slack' | 'discord'; url: string; events: string[] }
): Promise<string> {
  const id = nanoid()
  await db
    .prepare(
      'INSERT INTO webhooks (id, user_id, type, url, events) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, userId, data.type, data.url, JSON.stringify(data.events))
    .run()

  return id
}

export async function getWebhooksByUser(db: D1Database, userId: string): Promise<WebhookRow[]> {
  const { results } = await db
    .prepare('SELECT * FROM webhooks WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all<WebhookRow>()

  return results
}

export async function deleteWebhook(db: D1Database, id: string, userId: string): Promise<void> {
  await db.prepare('DELETE FROM webhooks WHERE id = ? AND user_id = ?').bind(id, userId).run()
}
