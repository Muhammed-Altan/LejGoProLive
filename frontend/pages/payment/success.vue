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

        <!-- Success Message - Only show for valid orders -->
        <div v-if="orderDetails && !orderNotFound">
          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            {{ isDifferencePayment ? 'Ekstra Betaling Gennemført!' : 'Betaling Gennemført!' }}
          </h1>
          <p class="text-lg text-gray-600 mb-4">
            {{ isDifferencePayment 
              ? 'Tak for din ekstra betaling. Betalingen er nu gennemført og du vil modtage en opdateret bekræftelse.'
              : 'Tak for din betaling. Din booking er nu bekræftet og du vil modtage en email bekræftelse inden for få minutter.'
            }}
          </p>
          
          <!-- Auto email sending status -->
          <div v-if="emailSent" class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p class="text-green-700">
              📧 Din faktura er blevet sendt til din email automatisk!
            </p>
          </div>
        </div>

        <!-- Order Details -->
        <div v-if="orderDetails && !orderNotFound" class="bg-gray-50 rounded-lg p-6 mb-8 text-left">
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

            <div class="flex justify-between">
              <span class="text-gray-600">Mail:</span>
              <span class="font-medium">Du vil modtage en mail når din pakke bliver sendt</span>
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

        <!-- Order Not Found State -->
        <div v-else-if="orderNotFound" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <svg class="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-red-900 mb-2">Ordre findes ikke</h2>
            <p class="text-red-700 mb-4">Den angivne ordre kunne ikke findes i systemet.</p>
            <p class="text-sm text-red-600">Kontroller venligst ordre ID'et og prøv igen, eller kontakt kundeservice hvis problemet fortsætter.</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
          <p class="text-red-700">{{ error }}</p>
        </div>

        <!-- Automatic Email Status - Only show for valid orders -->
        <div v-if="emailLoading && orderDetails && !orderNotFound" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-blue-700">Sender din faktura automatisk...</p>
          </div>
        </div>
        
        <div v-if="emailError && orderDetails && !orderNotFound" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-700">❌ {{ emailError }}</p>
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
            v-if="orderDetails && !orderNotFound"
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
import { ref, onMounted, computed, watch } from 'vue'
import { usePensoPay } from '@/composables/usePensoPay'
import { useSupabase } from '@/composables/useSupabase'
import { useEmail } from '@/composables/useEmail'
import type { BookingEmailData } from '@/composables/useEmail'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

const route = useRoute()
const router = useRouter()
const { getPayment, loading } = usePensoPay()
const supabase = useSupabase()
const { sendReceiptPDF, validateBookingData, isLoading: emailLoading, error: emailError, clearError } = useEmail()

const orderDetails = ref<any>(null)
const bookingDetails = ref<any>(null)
const error = ref<string | null>(null)
const emailSent = ref(false)
const orderNotFound = ref(false)
const isDifferencePayment = ref(false)

// Prepare booking data for email
const bookingData = computed<BookingEmailData | null>(() => {
  if (!orderDetails.value || !bookingDetails.value) {
    return null
  }

  // Map the database field names to the expected email data structure
  const customerEmail = bookingDetails.value.email || bookingDetails.value.customer_email || ''
  const customerName = bookingDetails.value.fullName || bookingDetails.value.customer_name || bookingDetails.value.full_name || 'Kunde'
  const customerPhone = bookingDetails.value.phone || bookingDetails.value.customer_phone || ''
  
  // Skip if no email is available
  if (!customerEmail) {
    console.warn('No email found in booking data:', bookingDetails.value)
    return null
  }

  // Process items array to match PDF generator expectations
  let processedItems = undefined
  
  if (bookingDetails.value.items) {
    try {
      const rawItems = JSON.parse(bookingDetails.value.items)
      console.log('🔍 Raw items from booking API:', rawItems)
      
      processedItems = rawItems.map((item: any) => ({
        name: item.productName || item.cameraName || 'GoPro kamera', // Use productName first (e.g. "Hero 10", "Hero 11")
        quantity: 1, // Each camera booking is quantity 1
        unitPrice: (item.price || 0) / 100, // Convert from øre to kroner
        totalPrice: (item.price || 0) / 100 // Convert from øre to kroner
      }))
      
      console.log('🔍 Processed items for PDF:', processedItems)
    } catch (error) {
      console.error('Failed to parse booking items:', error)
      processedItems = undefined
    }
  }

  return {
    orderNumber: orderDetails.value.order_id,
    customerName,
    customerEmail,
    customerPhone,
    service: bookingDetails.value.productName || bookingDetails.value.service || bookingDetails.value.cameraName || 'LejGoPro Service',
    duration: `${bookingDetails.value.startDate ? new Date(bookingDetails.value.startDate).toLocaleDateString('da-DK') : ''} - ${bookingDetails.value.endDate ? new Date(bookingDetails.value.endDate).toLocaleDateString('da-DK') : ''}`,
    startDate: bookingDetails.value.startDate || new Date().toISOString(),
    endDate: bookingDetails.value.endDate || new Date(Date.now() + 24*60*60*1000).toISOString(),
    totalAmount: orderDetails.value.amount / 100, // Convert from øre to kroner
    bookingDate: bookingDetails.value.created_at || new Date().toISOString(),
    rentalPeriod: bookingDetails.value.startDate && bookingDetails.value.endDate ? {
      startDate: bookingDetails.value.startDate,
      endDate: bookingDetails.value.endDate
    } : undefined,
    deliveryAddress: bookingDetails.value.address ? `${bookingDetails.value.address}${bookingDetails.value.apartment ? ', ' + bookingDetails.value.apartment : ''}, ${bookingDetails.value.postalCode || ''} ${bookingDetails.value.city || ''}`.trim() : undefined,
    items: processedItems
  }
})

// Parse booking items for display
const parsedItems = computed(() => {
  if (!bookingDetails.value?.items) return []
  
  try {
    const rawItems = JSON.parse(bookingDetails.value.items)
    return rawItems.map((item: any) => ({
      name: item.productName || item.cameraName || 'GoPro kamera', // Use productName first (e.g. "Hero 10", "Hero 11")
      quantity: 1, // Each camera booking is quantity 1
      unitPrice: (item.price || 0) / 100, // Convert from øre to kroner
      totalPrice: (item.price || 0) / 100 // Convert from øre to kroner
    }))
  } catch (error) {
    console.error('Failed to parse booking items:', error)
    return []
  }
})

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

// Go to home page
const goToHome = () => {
  router.push('/')
}

// Automatically send email receipt
const sendEmailAutomatically = async (bookingData: BookingEmailData) => {
  clearError()
  emailSent.value = false
  
  // Validate data first
  if (!validateBookingData(bookingData)) {
    console.error('Invalid booking data for email')
    return
  }

  console.log('🔄 Sending PDF receipt automatically...')
  const success = await sendReceiptPDF(bookingData)
  
  if (success) {
    emailSent.value = true
    console.log('✅ PDF receipt sent successfully!')
  } else {
    console.error('❌ Failed to send PDF receipt')
  }
}

// Print receipt
const printReceipt = () => {
  if (process.client) {
    window.print()
  }
}

// Update payment status from PensoPay
const updatePaymentStatus = async (orderId: string) => {
  try {
    const response = await fetch(`/api/payment/status?orderId=${orderId}`)
    
    if (!response.ok) {
      console.error('Failed to update payment status:', response.statusText)
      return false
    }
    
    const result = await response.json()
    return result.success
  } catch (error) {
    console.error('Error updating payment status:', error)
    return false
  }
}

// Load payment details on mount
onMounted(async () => {
  const orderId = route.query.orderId as string
  const paymentType = route.query.type as string
  const bookingId = route.query.booking as string
  
  // If no order ID in URL, redirect to home page
  if (!orderId) {
    console.log('No order ID in URL - redirecting to home')
    await navigateTo('/')
    return
  }

  try {
    // Handle difference payment success
    if (paymentType === 'difference' && bookingId) {
      console.log('🔍 Processing difference payment success for booking:', bookingId)
      
      // For difference payments, we don't need to fetch booking details from the original booking API
      // Instead, we show a simple success message
      orderDetails.value = {
        order_id: orderId,
        amount: 0, // We'll update this if needed
        state: 'Ekstra betaling modtaget',
        updated_at: new Date().toISOString()
      }
      
      // Update the success message for difference payments
      isDifferencePayment.value = true
      emailSent.value = true // Assume email was sent
      
      return
    }
    
    // Regular booking payment processing
    console.log('🔍 Fetching booking data for orderId:', orderId)
    const response = await $fetch(`/api/booking/${orderId}`)
    
    console.log('📋 Booking API response:', response)
    
    if (!response.success) {
      console.error('Order not found:', response)
      orderNotFound.value = true
      return
    }
    
    // Order exists - update payment status from PensoPay
    await updatePaymentStatus(orderId)
    
    // Set up the success data
    const booking = (response as any).data
    orderDetails.value = {
      order_id: orderId,
      amount: booking.totalPrice || 0, // Use actual price from database (in øre)
      state: booking.paymentStatus === 'paid' ? 'Betalt' : 'Bekræftet',
      updated_at: booking.paidAt || booking.created_at || new Date().toISOString()
    }
    bookingDetails.value = booking
    
  } catch (err: any) {
    console.error('Failed to load booking details:', err)
    
    // Check if it's a 404 error (order not found)
    if (err.statusCode === 404 || err.status === 404) {
      orderNotFound.value = true
    } else {
      // For other errors, set a general error message
      error.value = 'Der opstod en fejl ved indlæsning af ordre detaljer'
    }
  }
})

// Watch for bookingData to become available and automatically send email
watch(bookingData, async (newBookingData) => {
  if (newBookingData && !emailSent.value && !emailLoading.value) {
    await sendEmailAutomatically(newBookingData)
  }
}, { immediate: true })

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