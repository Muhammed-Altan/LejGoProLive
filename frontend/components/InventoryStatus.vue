<template>
  <div class="bg-white rounded-2xl shadow-lg border p-6 mb-8">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">
        📦 Aktuel Lagerstatus
      </h2>
      <div class="flex items-center gap-4">
        <!-- View Toggle -->
        <div class="flex items-center gap-2">
          <button 
            @click="viewMode = 'grid'"
            :class="viewMode === 'grid' ? 'bg-[#B8082A] text-white' : 'bg-gray-200 text-gray-700'"
            class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            📊 Oversigt
          </button>
          <button 
            @click="viewMode = 'calendar'"
            :class="viewMode === 'calendar' ? 'bg-[#B8082A] text-white' : 'bg-gray-200 text-gray-700'"
            class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            📅 Kalender
          </button>
        </div>
        <!-- Refresh Button -->
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Opdateret: {{ formatTime(lastUpdated) }}</span>
          <button 
            @click="refreshInventory" 
            :disabled="loading"
            class="ml-2 p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !inventory.length" class="flex justify-center items-center py-8">
      <div class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B8082A] mx-auto mb-2"></div>
        <p class="text-gray-600 text-sm">Henter lagerstatus...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-700 mb-2">{{ error }}</p>
        <button @click="fetchInventory" class="text-red-600 hover:text-red-800 text-sm underline">
          Prøv igen
        </button>
      </div>
    </div>

    <!-- Grid View -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="item in inventory" 
        :key="item.productId"
        class="bg-gray-50 rounded-xl p-4 border"
        :class="{
          'border-green-200 bg-green-50': item.availabilityStatus === 'available',
          'border-red-200 bg-red-50': item.availabilityStatus === 'unavailable'
        }"
      >
        <!-- Product Image and Name -->
        <div class="flex items-center gap-3 mb-3">
          <NuxtImg 
            :src="item.imageUrl || '/placeholder-camera.svg'" 
            :alt="item.productName"
            class="w-12 h-12 object-cover rounded-lg flex-shrink-0"
            loading="lazy"
            format="webp"
            quality="75"
            width="48"
            height="48"
            @error="handleImageError"
          />
          <div class="min-w-0">
            <h3 class="font-semibold text-gray-900 text-sm truncate">{{ item.productName }}</h3>
            <div class="flex items-center gap-2 text-xs text-gray-600">
              <span>{{ item.dailyPrice }} kr/dag</span>
              <span class="text-gray-400">•</span>
              <span>{{ item.weeklyPrice }} kr/uge</span>
            </div>
          </div>
        </div>

        <!-- Availability Status -->
        <div class="mb-3">
          <div class="flex items-center gap-2 mb-2">
            <div 
              class="w-3 h-3 rounded-full"
              :class="{
                'bg-green-500': item.availabilityStatus === 'available',
                'bg-red-500': item.availabilityStatus === 'unavailable'
              }"
            ></div>
            <span 
              class="font-semibold text-sm"
              :class="{
                'text-green-700': item.availabilityStatus === 'available',
                'text-red-700': item.availabilityStatus === 'unavailable'
              }"
            >
              {{ item.availabilityStatus === 'available' ? 'Tilgængelig' : 'Ikke tilgængelig' }}
            </span>
          </div>
          
          <!-- Stock Numbers -->
          <div class="text-xs text-gray-600 space-y-1">
            <div class="flex justify-between">
              <span>Tilgængelige:</span>
              <span class="font-medium text-green-700">{{ item.inventory.available }} stk</span>
            </div>
            <div class="flex justify-between">
              <span>I brug:</span>
              <span class="font-medium text-orange-600">{{ item.inventory.inUse }} stk</span>
            </div>
            <div class="flex justify-between border-t pt-1 mt-1">
              <span>Total:</span>
              <span class="font-semibold text-gray-900">{{ item.inventory.total }} stk</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-else-if="viewMode === 'calendar'" class="space-y-6">
      <div 
        v-for="item in inventory" 
        :key="item.productId"
        class="bg-white rounded-xl border shadow-sm"
      >
        <!-- Product Header -->
        <div class="p-4 border-b bg-gray-50 rounded-t-xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <NuxtImg 
                :src="item.imageUrl || '/placeholder-camera.svg'" 
                :alt="item.productName"
                class="w-10 h-10 object-cover rounded-lg"
                loading="lazy"
                format="webp"
                quality="75"
                width="40"
                height="40"
                @error="handleImageError"
              />
              <div>
                <h3 class="font-semibold text-gray-900">{{ item.productName }}</h3>
                <p class="text-sm text-gray-600">
                  {{ item.inventory.available }}/{{ item.inventory.total }} tilgængelig
                </p>
              </div>
            </div>
            <div 
              class="px-3 py-1 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800': item.availabilityStatus === 'available',
                'bg-red-100 text-red-800': item.availabilityStatus === 'unavailable'
              }"
            >
              {{ item.availabilityStatus === 'available' ? 'Tilgængelig' : 'Optaget' }}
            </div>
          </div>
        </div>

        <!-- Calendar for this product -->
        <div class="p-4">
          <ProductAvailabilityCalendar :product-id="item.productId" />
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div v-if="inventory.length" class="mt-6 pt-4 border-t border-gray-200">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div class="bg-blue-50 rounded-lg p-3">
          <div class="text-2xl font-bold text-blue-700">{{ totalProducts }}</div>
          <div class="text-xs text-blue-600">Produkttyper</div>
        </div>
        <div class="bg-green-50 rounded-lg p-3">
          <div class="text-2xl font-bold text-green-700">{{ totalAvailable }}</div>
          <div class="text-xs text-green-600">Tilgængelige</div>
        </div>
        <div class="bg-orange-50 rounded-lg p-3">
          <div class="text-2xl font-bold text-orange-700">{{ totalInUse }}</div>
          <div class="text-xs text-orange-600">I brug</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-2xl font-bold text-gray-700">{{ totalStock }}</div>
          <div class="text-xs text-gray-600">Total lager</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface InventoryItem {
  productId: number
  productName: string
  imageUrl: string
  dailyPrice: number
  weeklyPrice: number
  inventory: {
    total: number
    available: number
    inUse: number
  }
  availabilityStatus: 'available' | 'unavailable'
  lastUpdated: string
}

const inventory = ref<InventoryItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const lastUpdated = ref<string | null>(null)
const viewMode = ref<'grid' | 'calendar'>('grid')

// Computed stats
const totalProducts = computed(() => inventory.value.length)
const totalAvailable = computed(() => inventory.value.reduce((sum, item) => sum + item.inventory.available, 0))
const totalInUse = computed(() => inventory.value.reduce((sum, item) => sum + item.inventory.inUse, 0))
const totalStock = computed(() => inventory.value.reduce((sum, item) => sum + item.inventory.total, 0))

// Fetch inventory data
const fetchInventory = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/inventory-status')
    
    if (response.success) {
      inventory.value = response.data as InventoryItem[]
      lastUpdated.value = response.timestamp
    } else {
      error.value = 'Kunne ikke hente lagerstatus'
    }
  } catch (err: any) {
    console.error('Error fetching inventory:', err)
    error.value = err.message || 'Der opstod en fejl ved indlæsning af lagerstatus'
  } finally {
    loading.value = false
  }
}

// Refresh inventory
const refreshInventory = () => {
  if (!loading.value) {
    fetchInventory()
  }
}

// Format timestamp
const formatTime = (timestamp: string | null): string => {
  if (!timestamp) return 'Ukendt'
  
  const date = new Date(timestamp)
  return date.toLocaleString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Handle image errors
const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/placeholder-camera.svg'
}

// Auto-refresh every 5 minutes
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  fetchInventory()
  
  // Set up auto-refresh
  refreshInterval = setInterval(() => {
    fetchInventory()
  }, 5 * 60 * 1000) // 5 minutes
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>