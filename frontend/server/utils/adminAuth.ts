import { verifyAccessToken, extractTokenFromHeader } from './jwt'
import type { TokenPayload } from './jwt'

/**
 * Authenticate admin API request
 * Checks for valid JWT token and admin role
 */
export function authenticateAdmin(event: any): TokenPayload {
  // Get authorization header
  const authHeader = getHeader(event, 'authorization')
  
  // Extract token from header
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing authorization token'
    })
  }
  
  // Verify token
  const decoded = verifyAccessToken(token)
  
  if (!decoded) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token'
    })
  }
  
  // Check if user has admin role
  if (decoded.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
  
  return decoded
}

/**
 * Middleware wrapper for admin API endpoints
 * Automatically handles authentication and passes user info to the handler
 */
export function withAdminAuth<T>(handler: (event: any, user: TokenPayload) => T) {
  return (event: any) => {
    const user = authenticateAdmin(event)
    return handler(event, user)
  }
}