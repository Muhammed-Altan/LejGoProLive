<template>
  <div class="w-full max-w-2xl mx-auto bg-white rounded-xl p-6 shadow-md">
    <!-- Test Mode Indicator -->
    <div v-if="isTestMode" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          🧪
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium text-yellow-800">
            Test Mode Active
          </p>
          <p class="text-xs text-yellow-600 mt-1">
            Use test card numbers. No real money will be charged.
          </p>
        </div>
      </div>
    </div>

    <h2 class="text-xl font-semibold mb-4">Betaling</h2>
    
    <!-- Payment Options -->
    <div class="space-y-4 mb-6">
      <!-- Google Pay Option -->
      <div class="border rounded-lg p-4 cursor-pointer hover:border-[#B90C2C] transition-colors" @click="selectedMethod = 'googlepay'">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-medium">Google Pay</h3>
              <p class="text-sm text-gray-500">Hurtig og sikker betaling</p>
            </div>
          </div>
          <input 
            type="radio" 
            name="payment-method" 
            value="googlepay" 
            v-model="selectedMethod"
            class="w-4 h-4 text-[#B90C2C] focus:ring-[#B90C2C] pointer-events-none"
          >
        </div>
      </div>

      <!-- Apple Pay Option -->
      <div class="border rounded-lg p-4 cursor-pointer hover:border-[#B90C2C] transition-colors" @click="selectedMethod = 'applepay'">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-black rounded flex items-center justify-center">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-medium">Apple Pay</h3>
              <p class="text-sm text-gray-500">Touch ID eller Face ID</p>
            </div>
          </div>
          <input 
            type="radio" 
            name="payment-method" 
            value="applepay" 
            v-model="selectedMethod"
            class="w-4 h-4 text-[#B90C2C] focus:ring-[#B90C2C] pointer-events-none"
          >
        </div>
      </div>

      <!-- Credit Card Option -->
      <div class="border rounded-lg p-4 cursor-pointer hover:border-[#B90C2C] transition-colors" @click="selectedMethod = 'creditcard'">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
            </div>
            <div>
              <h3 class="font-medium">Kreditkort</h3>
              <p class="text-sm text-gray-500">Visa, Mastercard, Dankort</p>
            </div>
          </div>
          <input 
            type="radio" 
            name="payment-method" 
            value="creditcard" 
            v-model="selectedMethod"
            class="w-4 h-4 text-[#B90C2C] focus:ring-[#B90C2C] pointer-events-none"
          >
        </div>
      </div>
    </div>

    <BookingConfirmation ref="bookingConfirmation" />

    <!-- Action Button -->
    <button
      @click="initiatePayment"
      :disabled="!selectedMethod || loading || !isTermsAccepted"
      class="w-full bg-[#B90C2C] hover:bg-[#a10a25] text-white text-lg font-semibold py-3 rounded-lg focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span v-if="loading" class="flex items-center justify-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Behandler...
      </span>
      <span v-else>
        Betal med {{ getPaymentMethodName(selectedMethod) }}
      </span>
    </button>

    <!-- Terms acceptance reminder -->
    <div v-if="!isTermsAccepted && selectedMethod" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p class="text-yellow-800 text-sm">Du skal acceptere lejebetingelserne for at fortsætte til betaling.</p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      <p class="font-medium">Fejl ved betaling:</p>
      <p class="text-sm">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCheckoutStore } from '@/stores/checkout'
import BookingConfirmation from './BookingConfirmation.vue'

const store = useCheckoutStore()

const selectedMethod = ref<'googlepay' | 'applepay' | 'creditcard' | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const bookingConfirmation = ref<any>(null)

// Check if we're in test mode
const isTestMode = computed(() => process.env.NODE_ENV !== 'production')

// Check if terms are accepted
const isTermsAccepted = computed(() => {
  return bookingConfirmation.value?.accepted || false
})

// Computed properties for pricing
const totalAmount = computed(() => {
  // Use the backendTotal from store which already includes insurance and all calculations
  return store.backendTotal || 0
})

// Format price helper
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price)
}

// Get payment method display name
const getPaymentMethodName = (method: string | null): string => {
  switch (method) {
    case 'googlepay':
      return 'Google Pay'
    case 'applepay':
      return 'Apple Pay'
    case 'creditcard':
      return 'Kreditkort'
    default:
      return 'valgt metode'
  }
}

// Initiate payment process
const initiatePayment = async () => {
  if (!selectedMethod.value) return

  loading.value = true
  error.value = null

  try {
    // Prepare booking data
    const bookingData = {
      cameraId: 1, // This should be properly selected
      cameraName: 'Selected Camera',
      productName: store.selectedModels[0]?.name || 'Selected Product',
      startDate: store.startDate,
      endDate: store.endDate,
      address: store.address,
      apartment: store.apartment,
      email: store.email,
      fullName: store.fullName,
      phone: store.phone,
      city: store.city,
      postalCode: store.postalCode,
      totalPrice: totalAmount.value,
      accessoryInstanceIds: [], // This should be populated with actual accessory instances
    }

    // Get payment methods parameter
    let paymentMethods = ''
    switch (selectedMethod.value) {
      case 'googlepay':
        paymentMethods = 'googlepay'
        break
      case 'applepay':
        paymentMethods = 'applepay'
        break
      case 'creditcard':
        paymentMethods = 'creditcard'
        break
    }

    console.log('Initiating payment with booking data:', bookingData)
    console.log('💳 Payment debugging:')
    console.log('- Total amount from store.backendTotal:', totalAmount.value)
    console.log('- Store backendTotal:', store.backendTotal)
    console.log('- Store selectedModels:', store.selectedModels)
    console.log('- Store selectedAccessories:', store.selectedAccessories)

    // Call our server-side API to create payment
    const response = await $fetch<{
      success: boolean
      paymentUrl: string
      orderId: string
      paymentId: string
      bookingId: string
    }>('/api/payment/create', {
      method: 'POST',
      body: {
        bookingData,
        paymentMethods
      }
    })

    if (!response.success || !response.paymentUrl) {
      throw new Error('Failed to create payment: No payment URL received')
    }

    console.log('Payment created successfully:', {
      success: response.success,
      orderId: response.orderId,
      paymentUrl: response.paymentUrl ? 'URL received' : 'No URL'
    })

    // Store order ID for tracking
    store.orderId = response.orderId

    // Add a small delay to ensure state is saved before redirect
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Redirect to PensoPay payment page (will redirect back to our success page automatically)
    console.log('Redirecting to payment page...')
    window.location.href = response.paymentUrl

  } catch (err: any) {
    console.error('Payment initiation error:', err)
    error.value = err.message || err.data?.message || 'Betalingen kunne ikke oprettes. Prøv igen.'
  } finally {
    loading.value = false
  }
}

// Auto-detect preferred payment method on mount
onMounted(() => {
  if (process.client) {
    // Check if Apple Pay is available
    if ((window as any).ApplePaySession && (window as any).ApplePaySession.canMakePayments()) {
      selectedMethod.value = 'applepay'
    }
    // Check if Google Pay is available (simplified check)
    else if (navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('Edg')) {
      selectedMethod.value = 'googlepay'
    }
    // Default to credit card
    else {
      selectedMethod.value = 'creditcard'
    }
  }
})
</script>

<style scoped>
/* Add any specific styles here if needed */
</style>