<template>
  <div class="min-h-screen bg-gray-50">
    <Header />
    
    <div class="max-w-2xl mx-auto pt-16 pb-24 px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-lg shadow-sm p-8 text-center">
        <!-- Success Icon -->
        <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <!-- Success Message -->
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Betaling Gennemført!</h1>
        <p class="text-lg text-gray-600 mb-4">
          Tak for din betaling. Din booking er nu bekræftet og du vil modtage en email bekræftelse inden for få minutter.
        </p>
        
        <!-- Auto redirect countdown -->
        <div v-if="!redirectCancelled" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-blue-700">
            Du bliver automatisk omdirigeret til forsiden om <strong>{{ countdown }}</strong> sekunder.
          </p>
          <button 
            @click="cancelRedirect"
            class="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Annuller automatisk omdirigering
          </button>
        </div>

        <!-- Order Details -->
        <div v-if="orderDetails" class="bg-gray-50 rounded-lg p-6 mb-8 text-left">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Booking Detaljer:</h3>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Booking ID:</span>
              <span class="font-medium">{{ orderDetails.order_id }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Beløb:</span>
              <span class="font-medium">{{ formatAmount(orderDetails.amount) }} DKK</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Status:</span>
              <span class="font-medium text-green-600">{{ orderDetails.state }}</span>
            </div>
            
            <div class="flex justify-between">
              <span class="text-gray-600">Betaling dato:</span>
              <span class="font-medium">{{ formatDate(orderDetails.updated_at) }}</span>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="flex items-center justify-center py-8">
          <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-[#B90C2C]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-lg text-gray-600">Henter booking detaljer...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p class="text-red-700">{{ error }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-4">
          <button
            @click="goToHome"
            class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Gå til forsiden
          </button>
          
          <button
            @click="printReceipt"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Print kvittering
          </button>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePensoPay } from '@/composables/usePensoPay'
import { useSupabase } from '@/composables/useSupabase'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()
const { getPayment, loading } = usePensoPay()
const supabase = useSupabase()

const orderDetails = ref<any>(null)
const error = ref<string | null>(null)
const countdown = ref(10) // 10 seconds countdown
const redirectCancelled = ref(false)
let redirectTimer: NodeJS.Timeout | null = null

// Format amount from øre to kroner
const formatAmount = (amountInOre: number): string => {
  const amount = amountInOre / 100
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Cancel the automatic redirect
const cancelRedirect = () => {
  redirectCancelled.value = true
  if (redirectTimer) {
    clearInterval(redirectTimer)
    redirectTimer = null
  }
}

// Start countdown timer for automatic redirect
const startRedirectTimer = () => {
  redirectTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      goToHome()
    }
  }, 1000)
}

// Go to home page
const goToHome = () => {
  if (redirectTimer) {
    clearInterval(redirectTimer)
    redirectTimer = null
  }
  router.push('/')
}

// Print receipt
const printReceipt = () => {
  if (process.client) {
    window.print()
  }
}

// Load payment details on mount
onMounted(async () => {
  const orderId = route.query.orderId as string
  
  // If no order ID in URL, that's okay - we'll show a generic success message
  if (orderId) {
    console.log('Order ID found:', orderId)
    
    try {
      // Fetch the actual booking data from the database
      if (!supabase) {
        throw new Error('Supabase client not available')
      }
      
      const { data: booking, error } = await supabase
        .from('Booking')
        .select('*')
        .eq('orderId', orderId)
        .single()
      
      if (error) {
        console.error('Error fetching booking:', error)
        // Fallback to generic data if booking not found
        orderDetails.value = {
          order_id: orderId,
          amount: 0,
          state: 'Bekræftet',
          updated_at: new Date().toISOString()
        }
      } else {
        console.log('Booking data loaded:', booking)
        orderDetails.value = {
          order_id: orderId,
          amount: booking.totalPrice || 0, // Use actual price from database (in øre)
          state: 'Bekræftet',
          updated_at: booking.created_at || new Date().toISOString()
        }
      }
    } catch (err) {
      console.error('Failed to load booking details:', err)
      // Fallback to generic data
      orderDetails.value = {
        order_id: orderId,
        amount: 0,
        state: 'Bekræftet',
        updated_at: new Date().toISOString()
      }
    }
  } else {
    console.log('No order ID in URL - showing generic success')
    // Show generic success without specific order details
    orderDetails.value = {
      order_id: 'N/A',
      amount: 0,
      state: 'Bekræftet',
      updated_at: new Date().toISOString()
    }
  }
  
  // Start the automatic redirect timer after loading details
  startRedirectTimer()
})

// Set page title
useHead({
  title: 'Betaling Gennemført - LejGoPro',
  meta: [
    { name: 'description', content: 'Din betaling er gennemført og booking bekræftet' }
  ]
})
</script>

<style scoped>
@media print {
  .no-print {
    display: none;
  }
}
</style>