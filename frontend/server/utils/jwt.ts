import jwt from 'jsonwebtoken'
import type { JwtPayload } from 'jsonwebtoken'

// Get JWT secrets from runtime config
function getJwtSecrets() {
  const config = useRuntimeConfig()
  return {
    accessSecret: config.jwtAccessSecret || 'your-super-secret-access-token-key-change-in-production',
    refreshSecret: config.jwtRefreshSecret || 'your-super-secret-refresh-token-key-change-in-production'
  }
}

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d' // 7 days

export interface TokenPayload {
  userId: string
  email: string
  role: string
  type: 'access' | 'refresh'
}

/**
 * Generate an access token
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
  const { accessSecret } = getJwtSecrets()
  return jwt.sign(
    { ...payload, type: 'access' },
    accessSecret,
    { 
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'lejgopro',
      audience: 'lejgopro-admin'
    }
  )
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
  const { refreshSecret } = getJwtSecrets()
  return jwt.sign(
    { ...payload, type: 'refresh' },
    refreshSecret,
    { 
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'lejgopro',
      audience: 'lejgopro-admin'
    }
  )
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const { accessSecret } = getJwtSecrets()
    const decoded = jwt.verify(token, accessSecret, {
      issuer: 'lejgopro',
      audience: 'lejgopro-admin'
    }) as TokenPayload
    
    if (decoded.type !== 'access') {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const { refreshSecret } = getJwtSecrets()
    const decoded = jwt.verify(token, refreshSecret, {
      issuer: 'lejgopro',
      audience: 'lejgopro-admin'
    }) as TokenPayload
    
    if (decoded.type !== 'refresh') {
      return null
    }
    
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Set secure HTTP-only cookie for refresh token
 */
export function setRefreshTokenCookie(event: any, token: string) {
  setCookie(event, 'refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/'
  })
}

/**
 * Clear refresh token cookie
 */
export function clearRefreshTokenCookie(event: any) {
  setCookie(event, 'refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })
}