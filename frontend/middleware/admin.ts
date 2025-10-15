export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip authentication check for login page
  if (to.path === '/admin/login') {
    return
  }

  // Check authentication on both client and server side
  if (process.client) {
    console.log('🔍 Admin middleware: Checking authentication for', to.path)
    
    // Use the auth composable for consistent state management
    const auth = useAuth()
    
    // Check if user is already authenticated
    if (auth.isLoggedIn.value) {
      console.log('✅ User already authenticated, allowing access')
      return
    }
    
    // Try to check/refresh authentication
    console.log('🔄 Checking authentication state...')
    const isAuthenticated = await auth.checkAuth()
    
    if (!isAuthenticated) {
      console.log('❌ Authentication failed, redirecting to login')
      return navigateTo('/admin/login')
    }
    
    console.log('✅ Authentication successful, allowing access')
  } else {
    // Server-side: Just check for refresh token cookie existence
    const refreshTokenCookie = useCookie('refresh_token')
    
    if (!refreshTokenCookie.value) {
      return navigateTo('/admin/login')
    }
  }
})