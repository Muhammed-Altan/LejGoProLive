import { verifyAccessToken, extractTokenFromHeader } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  // Only accept GET requests
  if (getMethod(event) !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Get authorization header
    const authHeader = getHeader(event, 'authorization')
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No token provided'
      })
    }

    // Verify the access token
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }

    // Return user info
    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    }

  } catch (error: any) {
    // Handle validation errors
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error('Token verification error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})