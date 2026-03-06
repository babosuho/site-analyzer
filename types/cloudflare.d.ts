declare global {
  interface D1Result<T = unknown> {
    results: T[]
    success: boolean
    meta: Record<string, unknown>
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement
    first<T = unknown>(colName?: string): Promise<T | null>
    run(): Promise<D1Result>
    all<T = unknown>(): Promise<D1Result<T>>
    raw<T = unknown[]>(): Promise<T[]>
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement
    exec(query: string): Promise<{ count: number; duration: number }>
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>
    dump(): Promise<ArrayBuffer>
  }
}

export interface CloudflareEnv {
  DB: D1Database
  GEMINI_API_KEY: string
  PAGESPEED_API_KEY: string
  CRON_SECRET: string
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  JWT_SECRET: string
  NEXT_PUBLIC_APP_URL: string
}

declare module '@cloudflare/next-on-pages' {
  interface CloudflareNextOnPagesEnv extends CloudflareEnv {}
}
