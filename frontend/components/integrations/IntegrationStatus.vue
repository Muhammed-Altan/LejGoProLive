<template>
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="text-xl font-bold text-gray-900">System Integrationer</h3>
        <p class="text-sm text-gray-600">Status for alle tjenester og API'er</p>
      </div>
      <button 
        @click="refreshStatus"
        class="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-600 transition-all duration-200 flex items-center gap-2"
        :disabled="loading"
      >
        <svg 
          :class="{ 'animate-spin': loading }" 
          class="w-4 h-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {{ loading ? 'Opdaterer...' : 'Opdater Status' }}
      </button>
    </div>

    <!-- Overall Status Banner -->
    <div 
      v-if="statusData" 
      class="mb-6 p-4 rounded-lg border-2"
      :class="{
        'bg-green-50 border-green-300': statusData.overall === 'healthy',
        'bg-yellow-50 border-yellow-300': statusData.overall === 'warning',
        'bg-red-50 border-red-300': statusData.overall === 'degraded'
      }"
    >
      <div class="flex items-center gap-3">
        <div 
          class="w-3 h-3 rounded-full"
          :class="{
            'bg-green-500': statusData.overall === 'healthy',
            'bg-yellow-500': statusData.overall === 'warning',
            'bg-red-500': statusData.overall === 'degraded'
          }"
        ></div>
        <span class="font-bold text-lg">
          <span v-if="statusData.overall === 'healthy'" class="text-green-700">Alle systemer kører normalt</span>
          <span v-else-if="statusData.overall === 'warning'" class="text-yellow-700">Nogle tjenester kræver konfiguration</span>
          <span v-else class="text-red-700">Der er problemer med nogle tjenester</span>
        </span>
      </div>
      <p class="text-xs text-gray-600 mt-1 ml-6">Sidste opdatering: {{ formatTimestamp(statusData.timestamp) }}</p>
    </div>

    <!-- Services Status Grid -->
    <div v-if="statusData" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Database Status -->
      <div class="border rounded-lg p-4" :class="getServiceCardClass(statusData.services.database?.status)">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getIconBgClass(statusData.services.database?.status)">
              <svg class="w-6 h-6" :class="getIconColorClass(statusData.services.database?.status)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-gray-900">{{ statusData.services.database?.name || 'Database' }}</h4>
              <span 
                class="px-2 py-0.5 text-xs font-semibold rounded-full"
                :class="getStatusBadgeClass(statusData.services.database?.status)"
              >
                {{ getStatusText(statusData.services.database?.status) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ statusData.services.database?.message }}</p>
          </div>
        </div>
      </div>

      <!-- PensoPay Status -->
      <div class="border rounded-lg p-4" :class="getServiceCardClass(statusData.services.pensopay?.status)">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getIconBgClass(statusData.services.pensopay?.status)">
              <svg class="w-6 h-6" :class="getIconColorClass(statusData.services.pensopay?.status)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-gray-900">{{ statusData.services.pensopay?.name || 'PensoPay' }}</h4>
              <span 
                class="px-2 py-0.5 text-xs font-semibold rounded-full"
                :class="getStatusBadgeClass(statusData.services.pensopay?.status)"
              >
                {{ getStatusText(statusData.services.pensopay?.status) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ statusData.services.pensopay?.message }}</p>
            <div v-if="statusData.services.pensopay?.details" class="mt-2 text-xs text-gray-500">
              <p v-if="statusData.services.pensopay.details.merchant">Merchant: {{ statusData.services.pensopay.details.merchant }}</p>
              <p v-if="statusData.services.pensopay.details.testMode !== undefined">
                Mode: <span class="font-semibold" :class="statusData.services.pensopay.details.testMode ? 'text-yellow-600' : 'text-green-600'">
                  {{ statusData.services.pensopay.details.testMode ? 'Test' : 'Live' }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Service Status -->
      <div class="border rounded-lg p-4" :class="getServiceCardClass(statusData.services.email?.status)">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getIconBgClass(statusData.services.email?.status)">
              <svg class="w-6 h-6" :class="getIconColorClass(statusData.services.email?.status)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-gray-900">{{ statusData.services.email?.name || 'Email Tjeneste' }}</h4>
              <span 
                class="px-2 py-0.5 text-xs font-semibold rounded-full"
                :class="getStatusBadgeClass(statusData.services.email?.status)"
              >
                {{ getStatusText(statusData.services.email?.status) }}
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ statusData.services.email?.message }}</p>
            <div v-if="statusData.services.email?.details" class="mt-2 text-xs text-gray-500 space-y-1">
              <p v-for="(detail, index) in statusData.services.email.details" :key="index" class="font-mono bg-gray-100 px-2 py-1 rounded">
                {{ detail }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- API Health -->
      <div class="border rounded-lg p-4 bg-green-50 border-green-200">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-gray-900">API Server</h4>
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-200 text-green-800">
                Aktiv
              </span>
            </div>
            <p class="text-sm text-gray-600 mt-1">Server kører normalt</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !statusData" class="flex items-center justify-center py-12">
      <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
      <div class="flex items-start gap-2">
        <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
        </svg>
        <div>
          <h4 class="font-semibold text-red-700">Kunne ikke hente status</h4>
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- PostNord Test Section -->
  <div class="bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-6">
    <h3 class="text-lg font-bold text-gray-900 mb-4">PostNord QR Test</h3>
    <div class="space-y-4">
      <p class="text-sm text-gray-600">Generer en test QR-kode til dokumentation/rapport formål.</p>
      <button 
        @click="generateTestQRCode"
        class="bg-yellow-600 text-white px-4 py-2 rounded font-semibold shadow hover:bg-yellow-700 transition"
      >
        📱 Generer Test QR-kode
      </button>
    </div>
  </div>

  <!-- Test QR Code Modal -->
  <div v-if="showTestQRModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="closeTestQRModal">
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900">PostNord Test QR-kode</h3>
        <button @click="closeTestQRModal" class="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
      </div>
      
      <div class="text-center space-y-4">
        <div v-if="testQRCodeData" class="bg-gray-50 p-6 rounded-lg">
          <img :src="testQRCodeData" alt="Test QR Code" class="mx-auto max-w-full" style="width: 300px; height: 300px;" />
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p class="text-sm text-blue-800 font-semibold">Tracking nummer:</p>
          <p class="text-lg text-blue-900 font-mono">12345678901234</p>
        </div>
        
        <p class="text-sm text-gray-600">Dette er en test QR-kode til dokumentation formål.</p>
        
        <button 
          @click="closeTestQRModal"
          class="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-700 transition"
        >
          Luk
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const statusData = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showTestQRModal = ref(false)
const testQRCodeData = ref<string | null>(null)
const toast = useToast()

const fetchStatus = async () => {
  loading.value = true
  error.value = null
  
  console.log('🔄 Fetching integration status...')
  const startTime = Date.now()
  
  try {
    const response = await $fetch('/api/integrations/status')
    const duration = Date.now() - startTime
    
    console.log('✅ Status fetched successfully in', duration + 'ms')
    console.log('📊 Status data:', response)
    console.log('Overall health:', response.overall)
    
    // Log each service status (excluding email for privacy)
    Object.entries(response.services).forEach(([key, service]: [string, any]) => {
      const emoji = service.status === 'up' ? '🟢' : service.status === 'warning' ? '🟡' : '🔴'
      console.log(`${emoji} ${service.name}: ${service.status} - ${service.message}`)
      // Skip logging email details for privacy
      if (service.details && key !== 'email') {
        console.log('  Details:', service.details)
      }
    })
    
    statusData.value = response
  } catch (err: any) {
    error.value = err.message || 'Kunne ikke hente status'
    console.error('❌ Error fetching integration status:', err)
  } finally {
    loading.value = false
  }
}

const refreshStatus = () => {
  console.log('🔃 Manual status refresh triggered')
  fetchStatus()
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'up': return 'Aktiv'
    case 'down': return 'Nede'
    case 'warning': return 'Advarsel'
    default: return 'Ukendt'
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'up': return 'bg-green-200 text-green-800'
    case 'down': return 'bg-red-200 text-red-800'
    case 'warning': return 'bg-yellow-200 text-yellow-800'
    default: return 'bg-gray-200 text-gray-800'
  }
}

const getServiceCardClass = (status: string) => {
  switch (status) {
    case 'up': return 'bg-green-50 border-green-200'
    case 'down': return 'bg-red-50 border-red-200'
    case 'warning': return 'bg-yellow-50 border-yellow-200'
    default: return 'bg-gray-50 border-gray-200'
  }
}

const getIconBgClass = (status: string) => {
  switch (status) {
    case 'up': return 'bg-green-100'
    case 'down': return 'bg-red-100'
    case 'warning': return 'bg-yellow-100'
    default: return 'bg-gray-100'
  }
}

const getIconColorClass = (status: string) => {
  switch (status) {
    case 'up': return 'text-green-600'
    case 'down': return 'text-red-600'
    case 'warning': return 'text-yellow-600'
    default: return 'text-gray-600'
  }
}

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  return date.toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const generateTestQRCode = async () => {
  try {
    // Import QRCode dynamically (client-side only)
    const QRCode = (await import('qrcode')).default
    
    // Generate a dummy PostNord tracking number
    const dummyTrackingNumber = '12345678901234'
    
    // Generate QR code as data URL
    testQRCodeData.value = await QRCode.toDataURL(dummyTrackingNumber, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    })
    
    showTestQRModal.value = true
    
  } catch (err: any) {
    console.error('Error generating test QR code:', err)
    toast.add({
      title: 'Fejl',
      description: 'Kunne ikke generere test QR-kode',
      color: 'error',
      ui: {
        title: 'text-gray-900 font-semibold',
        description: 'text-gray-700'
      }
    })
  }
}

const closeTestQRModal = () => {
  showTestQRModal.value = false
  testQRCodeData.value = null
}

// Fetch status on mount
onMounted(() => {
  fetchStatus()
})

// Auto-refresh every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  refreshInterval = setInterval(() => {
    fetchStatus()
  }, 30000) // 30 seconds
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
