import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from '@/types/auth'

const COOKIE_NAME = 'sa_token'
const EXPIRES_IN = 60 * 60 * 24 * 7 // 7일 (초)

function getSecret(jwtSecret: string): Uint8Array {
  return new TextEncoder().encode(jwtSecret)
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  jwtSecret: string
): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${EXPIRES_IN}s`)
    .sign(getSecret(jwtSecret))
}

export async function verifyJwt(
  token: string,
  jwtSecret: string
): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(jwtSecret))
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

export function makeAuthCookie(token: string): string {
  return [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${EXPIRES_IN}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
  ].join('; ')
}

export function makeClearCookie(): string {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax; Secure`
}

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match?.[1] ?? null
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
