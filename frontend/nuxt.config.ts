// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@pinia/nuxt'],
  ssr: true,
  nitro: {
    preset: 'vercel',
    serveStatic: true
  },
  experimental: {
    payloadExtraction: false
  },
  runtimeConfig: {
    public: {
      // Default to local backend; override via NUXT_PUBLIC_API_BASE
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      // Base URL for Vercel deployment
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      // Supabase configuration
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      // Dinero integration configuration
      dineroClientId: process.env.DINERO_CLIENT_ID,
    },
    // Private keys (only available on server-side)
    dineroClientSecret: process.env.DINERO_CLIENT_SECRET,
    // JWT secrets for admin authentication
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    // Admin credentials
    adminEmail: process.env.ADMIN_EMAIL,
    adminPassword: process.env.ADMIN_PASSWORD,
  },
  app: {
    head: {
      title: 'LejGoPro',
    }
  },
  css: ['@/assets/css/main.css'],
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error']
    }
  },
  devServer: {
    port: 3000
  },
})