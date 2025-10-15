<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-10 h-10 bg-[#B8082A] rounded-lg flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.5 6L12 10.5 8.5 8 12 5.5 15.5 8zM8 10l2.5 2.5L8 15l-2.5-2.5L8 10zm8 0l2.5 2.5L16 15l-2.5-2.5L16 10zm-4 1.5L15.5 14 12 16.5 8.5 14 12 11.5z"/>
        </svg>
      </div>
      <div>
        <h3 class="text-xl font-bold text-gray-900">Dinero Integration</h3>
        <p class="text-sm text-gray-600">Automatisk fakturering og bogføring</p>
      </div>
    </div>
    
    <div v-if="!isConnected" class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p class="text-blue-800 text-sm">
          <strong>Hvad gør Dinero integrationen?</strong><br>
          • Automatisk oprettelse af kunder i Dinero<br>
          • Automatisk fakturering ved ordreafslutning<br>
          • Synkronisering af produkter og priser<br>
          • Automatisk bogføring af betalinger
        </p>
      </div>
      
      <button 
        @click="connectToDinero"
        class="w-full bg-[#B8082A] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#a10725] transition-all duration-200 flex items-center justify-center gap-2"
        :disabled="connecting"
      >
        <svg v-if="connecting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
        {{ connecting ? 'Forbinder til Visma Connect...' : 'Forbind til Dinero via Visma Connect' }}
      </button>
    </div>
    
    <div v-else class="space-y-4">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center gap-2 text-green-700 mb-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          <span class="font-semibold">Forbundet til Dinero</span>
        </div>
        <p class="text-green-700 text-sm">
          <strong>Organisation:</strong> {{ organizationName }}<br>
          <strong>Status:</strong> Aktiv og klar til brug
        </p>
      </div>
      
      <div class="flex gap-3">
        <button 
          @click="testConnection"
          class="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
          :disabled="testing"
        >
          <svg v-if="testing" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          {{ testing ? 'Tester...' : 'Test Forbindelse' }}
        </button>
        
        <button 
          @click="syncProducts"
          class="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-purple-600 transition-all duration-200 flex items-center justify-center gap-2"
          :disabled="syncing"
        >
          <svg v-if="syncing" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          {{ syncing ? 'Synkroniserer...' : 'Synk Produkter' }}
        </button>
        
        <button 
          @click="disconnect"
          class="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-red-600 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Afbryd
        </button>
      </div>
    </div>
    
    <div v-if="error" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div class="flex items-start gap-2">
        <svg class="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        <div>
          <p class="text-red-800 font-semibold text-sm">Fejl</p>
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-if="lastSync" class="mt-4 text-xs text-gray-500 text-center">
      Sidst synkroniseret: {{ formatDate(lastSync) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isConnected = ref(false)
const connecting = ref(false)
const testing = ref(false)
const syncing = ref(false)
const organizationName = ref('')
const error = ref('')
const lastSync = ref<Date | null>(null)

const toast = useToast()
const config = useRuntimeConfig()

// Get Dinero configuration from runtime config
const DINERO_CLIENT_ID = config.public.dineroClientId
const DINERO_REDIRECT_URI = `${config.public.baseUrl}/admin/dinero/callback`

onMounted(() => {
  error.value = '' // Clear any previous errors
  checkExistingConnection()
  handleAuthCallback()
})

async function checkExistingConnection() {
  try {
    const supabase = useSupabase()
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    // Try to query the table without the .single() modifier first
    const { data, error: dbError } = await supabase
      .from('DineroIntegration')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)
    
    if (dbError) {
      // Check if the error is because table doesn't exist or permission issues
      if (dbError.message.includes('relation') || 
          dbError.message.includes('does not exist') ||
          dbError.message.includes('Not Acceptable') ||
          dbError.code === '406') {
        console.log('DineroIntegration table access issue:', dbError.message)
        error.value = 'Kan ikke tilgå database. Kontakt administratoren.'
        return
      }
      console.log('No existing Dinero connection found:', dbError.message)
      return
    }
    
    // Check if we have data and take the first record
    if (data && data.length > 0) {
      const integration = data[0]
      if (integration.accessToken) {
        isConnected.value = true
        organizationName.value = integration.organizationName || 'Ukendt organisation'
        lastSync.value = integration.lastSync ? new Date(integration.lastSync) : null
      }
    }
  } catch (err: any) {
    console.log('Error checking connection:', err.message)
    // Don't show error for empty table - that's expected for new installations
    if (!err.message.includes('No rows')) {
      error.value = 'Fejl ved kontrol af forbindelse.'
    }
  }
}

function connectToDinero() {
  if (!DINERO_CLIENT_ID || DINERO_CLIENT_ID === 'your_client_id') {
    error.value = 'Dinero Client ID ikke konfigureret. Kontakt administratoren.'
    return
  }
  
  connecting.value = true
  error.value = ''
  
  // Generate state parameter for security
  const state = generateRandomString(32)
  localStorage.setItem('dinero_auth_state', state)
  
  // Test with production redirect URI to see if that works
  const testProductionRedirect = 'https://lej-go-pro-live.vercel.app/admin/dinero/callback'
  
  // Use absolute minimal parameters to test
  const authUrl = new URL('https://connect.visma.com/connect/authorize')
  authUrl.searchParams.set('client_id', DINERO_CLIENT_ID)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('redirect_uri', testProductionRedirect) // Test with production URI
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('scope', 'dineropublicapi:read')
  
  // Debug logging
  console.log('🧪 Testing with PRODUCTION redirect URI:', testProductionRedirect)
  console.log('🔗 Full Authorization URL:', authUrl.toString())
  
  // Show confirmation with both URLs
  const localUrl = authUrl.toString().replace(testProductionRedirect, DINERO_REDIRECT_URI)
  const prodUrl = authUrl.toString()
  
  const message = `Testing with PRODUCTION redirect URI:
  
PRODUCTION URL (should work):
${prodUrl}

LOCAL URL (current issue):
${localUrl}

Try the PRODUCTION URL?`
  
  const shouldRedirect = confirm(message)
  
  if (shouldRedirect) {
    window.location.href = authUrl.toString()
  } else {
    connecting.value = false
  }
}

async function handleAuthCallback() {
  // Only process callback if we're on the callback page or have URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const hasOAuthParams = urlParams.has('code') || urlParams.has('error')
  const isCallbackPage = window.location.pathname.includes('/admin/dinero/callback')
  
  if (!hasOAuthParams && !isCallbackPage) {
    console.log('⏭️ Not on callback page and no OAuth params - skipping callback processing')
    return
  }
  
  // Check for authorization code in URL params
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const error_param = urlParams.get('error')
  const error_description = urlParams.get('error_description')
  const storedState = localStorage.getItem('dinero_auth_state')
  
  // Log all URL parameters for debugging
  console.log('🔍 Auth callback URL params:', {
    code: code ? 'present' : 'missing',
    state: state ? 'present' : 'missing',
    error: error_param,
    error_description: error_description,
    storedState: storedState ? 'present' : 'missing',
    currentURL: window.location.href,
    isCallbackPage: isCallbackPage
  })
  
  if (error_param) {
    error.value = `OAuth fejl: ${error_description || error_param}`
    connecting.value = false
    return
  }
  
  if (code && state && storedState && state === storedState) {
    connecting.value = true
    try {
      await exchangeCodeForToken(code)
      localStorage.removeItem('dinero_auth_state')
      // Clean URL and redirect to admin with integrations tab
      window.history.replaceState({}, document.title, '/admin#integrations')
      
      // Reload the page to refresh the component state
      window.location.reload()
    } catch (err: any) {
      error.value = `Fejl ved autorisation: ${err.message}`
    } finally {
      connecting.value = false
    }
  } else if (storedState && !code && isCallbackPage) {
    // We're on the callback page but no code - this means authorization failed
    console.log('❌ On callback page but no authorization code received')
    error.value = 'Autorisation fejlede. Ingen kode modtaget fra Dinero.'
    connecting.value = false
  }
}

async function exchangeCodeForToken(code: string) {
  try {
    const response = await fetch('/api/dinero/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        redirectUri: DINERO_REDIRECT_URI 
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Fejl ved token udveksling')
    }
    
    if (data.success) {
      isConnected.value = true
      organizationName.value = data.organizationName
      await checkExistingConnection() // Refresh data
      
      toast.add({
        title: 'Dinero forbundet!',
        description: 'Din Dinero konto er nu forbundet succesfuldt',
        color: 'success',
        ui: {
          title: 'text-gray-900 font-semibold',
          description: 'text-gray-700'
        }
      })
    } else {
      throw new Error(data.error || 'Ukendt fejl')
    }
  } catch (err: any) {
    console.error('Token exchange error:', err)
    throw err
  }
}

async function testConnection() {
  testing.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/dinero/test')
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Test fejlede')
    }
    
    if (data.success) {
      toast.add({
        title: 'Forbindelse OK!',
        description: 'Dinero forbindelsen fungerer korrekt',
        color: 'success',
        ui: {
          title: 'text-gray-900 font-semibold',
          description: 'text-gray-700'
        }
      })
    } else {
      throw new Error(data.error || 'Test fejlede')
    }
  } catch (err: any) {
    error.value = err.message
    toast.add({
      title: 'Forbindelsesfejl',
      description: err.message,
      color: 'error',
      ui: {
        title: 'text-gray-900 font-semibold',
        description: 'text-gray-700'
      }
    })
  } finally {
    testing.value = false
  }
}

async function syncProducts() {
  syncing.value = true
  error.value = ''
  
  try {
    const response = await fetch('/api/dinero/sync-products', {
      method: 'POST'
    })
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Synkronisering fejlede')
    }
    
    if (data.success) {
      lastSync.value = new Date()
      toast.add({
        title: 'Produkter synkroniseret!',
        description: `${data.syncedCount || 0} produkter blev synkroniseret til Dinero`,
        color: 'success',
        ui: {
          title: 'text-gray-900 font-semibold',
          description: 'text-gray-700'
        }
      })
    } else {
      throw new Error(data.error || 'Synkronisering fejlede')
    }
  } catch (err: any) {
    error.value = err.message
    toast.add({
      title: 'Synkroniseringsfejl',
      description: err.message,
      color: 'error',
      ui: {
        title: 'text-gray-900 font-semibold',
        description: 'text-gray-700'
      }
    })
  } finally {
    syncing.value = false
  }
}

async function disconnect() {
  try {
    const response = await fetch('/api/dinero/disconnect', { 
      method: 'POST' 
    })
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Fejl ved afbrydelse')
    }
    
    if (data.success) {
      isConnected.value = false
      organizationName.value = ''
      lastSync.value = null
      error.value = ''
      
      toast.add({
        title: 'Forbindelse afbrudt!',
        description: 'Dinero forbindelsen er afbrudt succesfuldt',
        color: 'success',
        ui: {
          title: 'text-gray-900 font-semibold',
          description: 'text-gray-700'
        }
      })
    }
  } catch (err: any) {
    error.value = err.message
    toast.add({
      title: 'Fejl ved afbrydelse',
      description: err.message,
      color: 'error',
      ui: {
        title: 'text-gray-900 font-semibold',
        description: 'text-gray-700'
      }
    })
  }
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function testRedirectUrl() {
  const authUrl = new URL('https://connect.visma.com/connect/authorize')
  authUrl.searchParams.set('client_id', DINERO_CLIENT_ID)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'dineropublicapi:read dineropublicapi:write')
  authUrl.searchParams.set('redirect_uri', DINERO_REDIRECT_URI)
  authUrl.searchParams.set('state', 'test-state-123')
  
  console.log('🧪 Test URL:', authUrl.toString())
  alert(`Test URL: ${authUrl.toString()}\n\nCopy this URL and test it manually in a new tab.`)
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('da-DK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
/* Add any custom styles if needed */
</style>