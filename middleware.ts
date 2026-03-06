import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
}

const PUBLIC_PATHS = ['/login', '/api/auth/send', '/api/auth/verify', '/api/auth/logout']

function getSecret(jwtSecret: string): Uint8Array {
  return new TextEncoder().encode(jwtSecret)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 공개 경로는 인증 불필요
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get('sa_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // JWT_SECRET은 Cloudflare 환경변수에서 가져옴
  // 미들웨어는 getRequestContext() 대신 env 직접 접근
  const jwtSecret = (process.env.JWT_SECRET ?? '') as string

  if (!jwtSecret) {
    // 환경변수 미설정 시 로그인 페이지로
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const { payload } = await jwtVerify(token, getSecret(jwtSecret))
    const res = NextResponse.next()
    // 후속 API route에서 userId 접근 가능하도록 헤더 추가
    res.headers.set('x-user-id', payload.sub ?? '')
    res.headers.set('x-user-email', (payload['email'] as string) ?? '')
    return res
  } catch {
    // 토큰 만료/변조
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.delete('sa_token')
    return res
  }
}
