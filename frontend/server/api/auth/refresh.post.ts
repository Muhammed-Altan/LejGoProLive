import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken,
  setRefreshTokenCookie 
} from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Get refresh token from cookie
    const refreshToken = getCookie(event, 'refresh_token')

    if (!refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: 'No refresh token provided'
      })
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken)

    if (!decoded) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid refresh token'
      })
    }

    // Generate new tokens
    const tokenPayload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    }

    const newAccessToken = generateAccessToken(tokenPayload)
    const newRefreshToken = generateRefreshToken(tokenPayload)

    // Update the refresh token cookie
    setRefreshTokenCookie(event, newRefreshToken)

    // Return new access token
    return {
      success: true,
      accessToken: newAccessToken,
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
    console.error('Token refresh error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})