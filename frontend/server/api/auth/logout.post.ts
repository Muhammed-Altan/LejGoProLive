import { clearRefreshTokenCookie } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Clear the refresh token cookie
    clearRefreshTokenCookie(event)

    return {
      success: true,
      message: 'Logout successful'
    }

  } catch (error: any) {
    console.error('Logout error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})