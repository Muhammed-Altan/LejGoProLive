<template>
  <div class="min-h-screen bg-gray-50">
    <Header />
    
    <div class="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow-sm p-8 text-center">
        <!-- Cancelled Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>

        <!-- Cancelled Message -->
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Betaling Annulleret</h1>
        <p class="text-lg text-gray-600 mb-8">
          Din betaling blev annulleret. Din booking er ikke blevet oprettet. Du kan prøve igen eller kontakte os hvis du har brug for hjælp.
        </p>

        <!-- Order Details -->
        <div v-if="orderId" class="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Ordre Information:</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Ordre ID:</span>
              <span class="font-medium">{{ orderId }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="font-medium text-red-600">Annulleret</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Dato:</span>
              <span class="font-medium">{{ currentDate }}</span>
            </div>
          </div>
        </div>

        <!-- Help Text -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
          <h4 class="font-semibold text-blue-900 mb-2">Hvad sker der nu?</h4>
          <ul class="text-blue-800 space-y-1 text-sm">
            <li>• Der er ikke oprettet nogen booking</li>
            <li>• Der er ikke trukket penge fra din konto</li>
            <li>• Du kan prøve at bestille igen</li>
            <li>• Kontakt os hvis du oplever problemer</li>
          </ul>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-4">
          <button
            @click="tryAgain"
            class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Prøv igen
          </button>
          
          <button
            @click="goToHome"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Gå til forsiden
          </button>
          
          <button
            @click="contactSupport"
            class="w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
          >
            Kontakt kundeservice
          </button>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()

const orderId = ref<string | null>(null)

// Current date formatted
const currentDate = computed(() => {
  return new Date().toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Try payment again
const tryAgain = () => {
  router.push('/checkout')
}

// Go to home page
const goToHome = () => {
  router.push('/')
}

// Contact support
const contactSupport = () => {
  router.push('/kontakt')
}

// Load order details on mount
onMounted(() => {
  orderId.value = route.query.order_id as string || null
})

// Set page title
useHead({
  title: 'Betaling Annulleret - LejGoPro',
  meta: [
    { name: 'description', content: 'Din betaling blev annulleret' }
  ]
})
</script>