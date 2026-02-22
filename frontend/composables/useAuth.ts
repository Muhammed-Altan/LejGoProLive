interface User {
  id: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoggedIn: boolean
  isLoading: boolean
}

/**
 * Authentication Composable
 * 
 * Manages user authentication state and JWT tokens
 * 
 * Features:
 * - Login/logout functionality
 * - Access token refresh (automatic)
 * - Secure token storage in memory (not localStorage for security)
 * - Refresh token stored in httpOnly cookie (handled by server)
 * 
 * Security:
 * - Access tokens stored in memory (cleared on page refresh)
 * - Refresh tokens in httpOnly cookies (can't be accessed by JavaScript)
 * - Automatic token refresh when expired
 * - Prevents multiple simultaneous refresh requests
 */

// Store access token in memory only (more secure than localStorage)
let accessToken: string | null = null

// Promise to prevent multiple simultaneous refresh requests
let refreshPromise: Promise<any> | null = null

export const useAuth = () => {
  // Reactive user state
  const user = ref<User | null>(null)
  
  // Computed property: user is logged in if both user and token exist
  const isLoggedIn = computed(() => !!user.value && !!accessToken)
  
  // Loading state for async operations
  const isLoading = ref(false)

  /**
   * Login user with email and password
   * 
   * @param email - User email address
   * @param password - User password (plain text - hashed on server)
   * @param rememberMe - If true, refresh token lasts 30 days; if false, session only
   * @returns Success status and message or error
   */
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    console.log('🚀 useAuth.login called with:', { email, passwordLength: password.length, rememberMe })
    isLoading.value = true
    
    try {
      console.log('📡 Making login request to /api/auth/login...')
      const response = await $fetch<{
        success: boolean
        accessToken: string
        user: User
        message: string
      }>('/api/auth/login', {
        method: 'POST',
        body: {
          email,
          password,
          rememberMe
        }
      })

      console.log('📥 Login response received:', response)

      if (response.success) {
        // Store access token in memory
        accessToken = response.accessToken
        user.value = response.user

        console.log('✅ Login successful, tokens stored')
        return { success: true, message: response.message }
      }

      console.log('❌ Login response indicates failure')
      return { success: false, error: 'Login failed' }
    } catch (error: any) {
      console.error('Login error:', error)
      return { 
        success: false, 
        error: error.data?.message || error.message || 'Login failed' 
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Logout user
   * 
   * - Calls server to clear refresh token cookie
   * - Clears local access token and user state
   * - Redirects to admin login page
   */
  const logout = async () => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local state regardless of API call success
      accessToken = null
      user.value = null
      
      // Redirect to login page
      await navigateTo('/admin/login')
    }
  }

  /**
   * Refresh access token using refresh token from httpOnly cookie
   * 
   * - Prevents multiple simultaneous refresh requests
   * - Returns existing promise if refresh already in progress
   * - Clears tokens on failure (user must log in again)
   * 
   * @returns true if refresh successful, false otherwise
   */
  const refreshToken = async (): Promise<boolean> => {
    console.log('🔄 refreshToken called')
    
    // Prevent multiple simultaneous refresh requests
    if (refreshPromise) {
      console.log('⏳ Refresh already in progress, waiting...')
      try {
        await refreshPromise
        return !!accessToken
      } catch {
        return false
      }
    }

    refreshPromise = (async () => {
      try {
        console.log('📡 Making refresh request to /api/auth/refresh...')
        const response = await $fetch<{
          success: boolean
          accessToken: string
          user: User
        }>('/api/auth/refresh', {
          method: 'POST'
        })

        console.log('📥 Refresh response:', response)

        if (response.success) {
          accessToken = response.accessToken
          user.value = response.user
          console.log('✅ Token refreshed successfully')
          return true
        }

        console.log('❌ Refresh response indicates failure')
        return false
      } catch (error: any) {
        console.error('Token refresh failed:', error)
        // Clear invalid state
        accessToken = null
        user.value = null
        return false
      } finally {
        refreshPromise = null
      }
    })()

    try {
      return await refreshPromise
    } catch {
      return false
    }
  }

  /**
   * Get current access token from memory
   * 
   * @returns Access token string or null if not logged in
   */
  const getAccessToken = (): string | null => {
    return accessToken
  }

  /**
   * Initialize authentication state on app start
   */
  const initialize = async () => {
    // Try to refresh token on app initialization
    // This will restore the session if a valid refresh token exists
    await refreshToken()
  }

  /**
   * Check if user is authenticated and token is valid
   */
  const checkAuth = async (): Promise<boolean> => {
    console.log('🔍 checkAuth called, current accessToken:', !!accessToken)
    console.log('🔍 current user:', user.value)
    
    if (!accessToken) {
      console.log('🔄 No access token, attempting refresh...')
      // Try to refresh token
      const refreshed = await refreshToken()
      console.log('🔄 Refresh result:', refreshed)
      return refreshed
    }
    
    console.log('✅ Access token exists, user is authenticated')
    // Token exists, assume it's valid
    // Token validation happens on server-side for each protected request
    return true
  }

  /**
   * Make authenticated API requests
   */
  const authenticatedFetch = async <T = any>(url: string, options: any = {}): Promise<T> => {
    const token = getAccessToken()
    
    if (!token) {
      throw new Error('No access token available')
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }

    try {
      return await $fetch(url, {
        ...options,
        headers
      }) as T
    } catch (error: any) {
      // If token is expired, try to refresh and retry
      if (error.status === 401) {
        const refreshed = await refreshToken()
        
        if (refreshed) {
          const newToken = getAccessToken()
          return await $fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`
            }
          }) as T
        } else {
          // Refresh failed, redirect to login
          await logout()
          throw error
        }
      }
      
      throw error
    }
  }

  return {
    // State
    user: readonly(user),
    isLoggedIn,
    isLoading: readonly(isLoading),
    
    // Methods
    login,
    logout,
    refreshToken,
    getAccessToken,
    initialize,
    checkAuth,
    authenticatedFetch
  }
}