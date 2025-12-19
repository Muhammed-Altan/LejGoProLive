<template>
  <div class="max-w-4xl mx-auto py-12 px-4">
    <h1 class="text-3xl font-bold mb-8">Integration Status Test</h1>
    
    <!-- Direct API Response -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Rå API Respons</h2>
        <button 
          @click="fetchStatus"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          :disabled="loading"
        >
          {{ loading ? 'Indlæser...' : 'Hent Status' }}
        </button>
      </div>
      
      <div v-if="statusData" class="bg-gray-100 p-4 rounded">
        <pre class="text-sm overflow-auto">{{ JSON.stringify(statusData, null, 2) }}</pre>
      </div>
      
      <div v-if="error" class="bg-red-50 border border-red-200 p-4 rounded mt-4">
        <p class="text-red-700">{{ error }}</p>
      </div>
    </div>
    
    <!-- Service Status Details -->
    <div v-if="statusData" class="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 class="text-xl font-bold mb-4">Tjeneste Status Opdeling</h2>
      
      <div class="space-y-4">
        <div v-for="(service, key) in statusData.services" :key="key" class="border-l-4 p-4 rounded"
             :class="{
               'border-green-500 bg-green-50': service.status === 'up',
               'border-yellow-500 bg-yellow-50': service.status === 'warning',
               'border-red-500 bg-red-50': service.status === 'down'
             }">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold text-lg">{{ service.name }}</h3>
              <p class="text-sm mt-1">Status: <span class="font-semibold">{{ service.status }}</span></p>
              <p class="text-sm">Besked: {{ service.message }}</p>
              <div v-if="service.details" class="mt-2 text-xs">
                <p><strong>Detaljer:</strong></p>
                <pre class="mt-1">{{ JSON.stringify(service.details, null, 2) }}</pre>
              </div>
            </div>
            <span 
              class="px-3 py-1 rounded-full text-xs font-bold"
              :class="{
                'bg-green-200 text-green-800': service.status === 'up',
                'bg-yellow-200 text-yellow-800': service.status === 'warning',
                'bg-red-200 text-red-800': service.status === 'down'
              }"
            >
              {{ service.status.toUpperCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Testing Instructions -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 class="text-xl font-bold mb-4 text-blue-900">Sådan tester du</h2>
      <div class="space-y-4 text-sm">
        <div>
          <h3 class="font-bold text-blue-800">Test Database Forbindelse:</h3>
          <ol class="list-decimal ml-6 mt-2 space-y-1 text-blue-900">
            <li>Ændr midlertidigt SUPABASE_URL eller SUPABASE_KEY i din .env fil</li>
            <li>Genstart dev serveren</li>
            <li>Klik "Hent Status" - Database skulle vise RØD/NEDE</li>
            <li>Gendan korrekte værdier og genstart - skulle vise GRØN/AKTIV</li>
          </ol>
        </div>
        
        <div>
          <h3 class="font-bold text-blue-800">Test PensoPay Forbindelse:</h3>
          <ol class="list-decimal ml-6 mt-2 space-y-1 text-blue-900">
            <li>Kommentér PENSOPAY_API_KEY ud i .env</li>
            <li>Genstart dev serveren</li>
            <li>Klik "Hent Status" - PensoPay skulle vise GUL/ADVARSEL</li>
            <li>Sæt ugyldig API-nøgle - skulle vise RØD/NEDE</li>
            <li>Gendan korrekt nøgle - skulle vise GRØN/AKTIV med merchant detaljer</li>
          </ol>
        </div>
        
        <div>
          <h3 class="font-bold text-blue-800">Test Email Tjeneste:</h3>
          <ol class="list-decimal ml-6 mt-2 space-y-1 text-blue-900">
            <li>Fjern RESEND_API_KEY eller SMTP legitimationsoplysninger fra .env</li>
            <li>Genstart dev serveren</li>
            <li>Klik "Hent Status" - Email skulle vise GUL/ADVARSEL "Ikke konfigureret"</li>
            <li>Gendan legitimationsoplysninger - skulle vise GRØN/AKTIV</li>
          </ol>
        </div>
        
        <div class="bg-white p-3 rounded border border-blue-300">
          <p class="font-bold text-blue-900">💡 Pro Tip:</p>
          <p class="text-blue-800">Åbn browser DevTools → Network fanen for at se den faktiske API-anmodning og respons i realtid</p>
        </div>
      </div>
    </div>
    
    <!-- Auto-refresh toggle -->
    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-bold">Auto-opdatering</h3>
          <p class="text-sm text-gray-600">Hent automatisk status hvert 10. sekund</p>
        </div>
        <button 
          @click="toggleAutoRefresh"
          class="px-4 py-2 rounded font-semibold"
          :class="autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'"
        >
          {{ autoRefresh ? 'Aktiveret' : 'Deaktiveret' }}
        </button>
      </div>
      <p v-if="autoRefresh" class="text-xs text-gray-500 mt-2">Næste opdatering om: {{ countdown }}s</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const statusData = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const autoRefresh = ref(false)
const countdown = ref(10)
let intervalId: NodeJS.Timeout | null = null
let countdownId: NodeJS.Timeout | null = null

const fetchStatus = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/integrations/status')
    statusData.value = response
    console.log('Status hentet:', response)
  } catch (err: any) {
    error.value = err.message || 'Kunne ikke hente status'
    console.error('Fejl ved hentning af status:', err)
  } finally {
    loading.value = false
  }
}

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  fetchStatus() // Fetch immediately
  countdown.value = 10
  
  intervalId = setInterval(() => {
    fetchStatus()
    countdown.value = 10
  }, 10000) // 10 seconds
  
  countdownId = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    }
  }, 1000)
}

const stopAutoRefresh = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  if (countdownId) {
    clearInterval(countdownId)
    countdownId = null
  }
  countdown.value = 10
}

onMounted(() => {
  fetchStatus()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>
