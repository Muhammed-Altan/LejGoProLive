import { 
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
    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { email, password, rememberMe } = body

    // Get admin credentials from runtime config
    const ADMIN_EMAIL = config.adminEmail
    const ADMIN_PASSWORD = config.adminPassword

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Admin credentials not configured'
      })
    }

    // Validate required fields
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Validate admin credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // Generate tokens
    const tokenPayload = {
      userId: 'admin',
      email: ADMIN_EMAIL,
      role: 'admin'
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    // Set refresh token as HTTP-only cookie
    setRefreshTokenCookie(event, refreshToken)

    // Return access token and user info
    return {
      success: true,
      accessToken,
      user: {
        id: 'admin',
        email: ADMIN_EMAIL,
        role: 'admin'
      },
      message: 'Login successful'
    }

  } catch (error: any) {
    // Handle validation errors
    if (error.statusCode) {
      throw error
    }

    // Handle unexpected errors
    console.error('Login error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})