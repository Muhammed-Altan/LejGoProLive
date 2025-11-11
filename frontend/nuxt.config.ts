// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/image', '@pinia/nuxt'],
  ssr: true,
  routeRules: {
    // Static pages (prerendered at build time)
    '/': { prerender: true },
    '/faq': { prerender: true },
    '/handelsbetingelser': { prerender: true },
    '/privatlivspolitik': { prerender: true },
    '/hvorfor': { prerender: true },
    '/kontakt': { prerender: true },
    
    // Dynamic pages - use SWR (Stale-While-Revalidate)
    '/products': { swr: 3600 }, // Cache 1 hour, regenerate in background
    
    // API caching (coordinates with Netlify headers)
    '/api/products': { swr: 600 }, // 10 minutes
    '/api/inventory-status': { swr: 300 }, // 5 minutes
    // '/api/availability/check': { swr: 60 }, // 1 minute - DISABLED due to POST request issues
    
    // Never cache these (client-side only or sensitive data)
    '/admin/**': { ssr: false },
    '/checkout': { ssr: false },
    '/api/booking/**': { cache: false },
    '/api/payment/**': { cache: false },
    '/api/availability/**': { cache: false }, // Disable caching for all availability endpoints,
  },
  nitro: {
    preset: 'netlify',
    serveStatic: true,
    compressPublicAssets: true,
    minify: true,
    prerender: {
      routes: [
        '/faq',
        '/handelsbetingelser',
        '/privatlivspolitik',
        '/hvorfor',
        '/kontakt'
      ],
      crawlLinks: false,
      ignore: ['/admin', '/checkout', '/payment']
    }
  },
  experimental: {
    payloadExtraction: false
  },
  runtimeConfig: {
    public: {
      // Default to local backend; override via NUXT_PUBLIC_API_BASE
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      // Base URL for Netlify deployment
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || process.env.URL || 'http://localhost:3000',
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
      link: [
        {
          rel: 'stylesheet',
          id: 'silktide-consent-manager-css',
          href: '/silktide-consent-manager.css'
        },
        {
          rel: 'stylesheet',
          id: 'cookie-banner-danish-css',
          href: '/cookie-banner-danish.css'
        }
      ],
      script: [
        {
          src: '/silktide-consent-manager.js'
        },
        {
          innerHTML: `
            silktideCookieBannerManager.updateCookieBannerConfig({
              background: {
                showBackground: true
              },
              cookieIcon: {
                position: "bottomLeft"
              },
              text: {
                banner: {
                  description: "<p>Vi bruger cookies på vores hjemmeside for at forbedre din brugeroplevelse, levere personligt indhold og analysere vores trafik.</p>",
                  acceptAllButtonText: "Accepter alle",
                  rejectNonEssentialButtonText: "Afvis ikke-nødvendige",
                  preferencesButtonText: "Præferencer"
                },
                preferences: {
                  title: "Tilpas dine cookie-præferencer",
                  description: "<p>Vi respekterer din ret til privatliv. Du kan vælge ikke at tillade nogle typer cookies. Dine cookie-præferencer vil gælde på tværs af vores hjemmeside.</p>",
                  creditLinkText: "Få dette banner gratis"
                }
              },
              cookieTypes: [
                {
                  id: "necessary",
                  name: "Nødvendige cookies",
                  description: "Disse cookies er nødvendige for at hjemmesiden fungerer korrekt.",
                  required: true
                },
                {
                  id: "analytics",
                  name: "Analyse cookies",
                  description: "Disse cookies hjælper os med at forstå, hvordan besøgende bruger hjemmesiden.",
                  required: false
                },
                {
                  id: "marketing",
                  name: "Marketing cookies", 
                  description: "Disse cookies bruges til at vise relevante annoncer.",
                  required: false
                }
              ]
            });
          `,
          type: 'text/javascript'
        }
      ]
    }
  },
  css: ['@/assets/css/main.css'],
  image: {
    quality: 80,
    format: ['webp', 'jpg', 'png'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
    densities: [1, 2],
    domains: ['static.gopro.com'],
    alias: {
      eventyr: '/eventyr',
      'hero-bg': '/hero-bg',
    },
    presets: {
      product: {
        modifiers: {
          format: 'webp',
          quality: 85,
          fit: 'cover',
        }
      },
      thumbnail: {
        modifiers: {
          format: 'webp',
          quality: 75,
          width: 150,
          height: 150,
          fit: 'cover',
        }
      },
      hero: {
        modifiers: {
          format: 'webp',
          quality: 90,
          fit: 'cover',
        }
      }
    }
  },
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error']
    }
  },
  devServer: {
    port: 3000
  },
})