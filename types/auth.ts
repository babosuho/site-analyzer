export interface User {
  id: string
  email: string
  createdAt: string
  lastLoginAt: string | null
}

export interface JwtPayload {
  sub: string   // userId
  email: string
  iat: number
  exp: number
}

export interface AuthContext {
  userId: string
  email: string
}
