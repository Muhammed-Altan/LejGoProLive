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

// Store access token in memory (secure approach)
let accessToken: string | null = null
let refreshPromise: Promise<any> | null = null

export const useAuth = () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value && !!accessToken)
  const isLoading = ref(false)

  /**
   * Login user with email and password
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
   * Refresh access token using refresh token from cookie
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
   * Get current access token
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