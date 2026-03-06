import { getRequestContext } from '@cloudflare/next-on-pages'
import type { CloudflareEnv } from '@/types/cloudflare'

export function getDb(): D1Database {
  try {
    const env = getEnv()
    return env.DB
  } catch {
    throw new Error(
      'D1 데이터베이스에 접근할 수 없습니다. ' +
      '로컬 개발 시 `wrangler pages dev` 를 사용하세요.'
    )
  }
}

export function getEnv(): CloudflareEnv {
  const { env } = getRequestContext()
  return env as unknown as CloudflareEnv
}
