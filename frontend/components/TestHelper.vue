<template>
  <div v-if="showTestHelper" class="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-4 shadow-lg z-50 max-w-sm">
    <div class="flex justify-between items-start mb-2">
      <h3 class="font-bold text-yellow-800">🧪 Test Mode Active</h3>
      <button @click="showTestHelper = false" class="text-yellow-600 hover:text-yellow-800">×</button>
    </div>
    
    <div class="text-sm text-yellow-700 mb-3">
      <p class="mb-2">Use these test cards for payment testing:</p>
      
      <div class="bg-white rounded p-2 mb-2">
        <p class="font-semibold">💳 Test Card Details:</p>
        <div class="text-xs">
          <p><strong>Card:</strong> 4000 1124 0117 2221</p>
          <p><strong>Expiry:</strong> 12/25 (any future date)</p>
          <p><strong>CVV:</strong> 123 (any 3 digits)</p>
          <p><strong>Name:</strong> Test User</p>
        </div>
      </div>
      
      <div class="bg-white rounded p-2 mb-2">
        <p class="font-semibold">✅ More Success Cards:</p>
        <div class="text-xs font-mono">
          <p>4000112401172221 (Visa)</p>
          <p>5500120801422221 (Mastercard)</p>
          <p>5555555555554444 (Mastercard)</p>
        </div>
      </div>
      
      <div class="bg-white rounded p-2 mb-2">
        <p class="font-semibold">❌ Failure Cards:</p>
        <div class="text-xs font-mono">
          <p>4242120802091112 (Auth fail)</p>
          <p>4000253302611113 (Capture fail)</p>
        </div>
      </div>
      
      <div class="bg-white rounded p-2">
        <p class="font-semibold">📱 Mobile Payments:</p>
        <div class="text-xs">
          <p>• Google Pay: Use test Google account</p>
          <p>• Apple Pay: Use Safari with test Touch ID</p>
        </div>
      </div>
    </div>
    
    <div class="flex gap-2">
      <button
        @click="fillTestData"
        class="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-2 py-1 rounded"
      >
        Fill Test Data
      </button>
      <button
        @click="clearData"
        class="bg-gray-500 hover:bg-gray-600 text-white text-xs px-2 py-1 rounded"
      >
        Clear Data
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCheckoutStore } from '@/stores/checkout'

const store = useCheckoutStore()
const showTestHelper = ref(false)

// Only show in development mode
onMounted(() => {
  if (process.env.NODE_ENV !== 'production') {
    showTestHelper.value = true
  }
})

// Fill form with test data
const fillTestData = () => {
  store.setDeliveryInfo({
    fullName: 'Test Testersen',
    phone: '+45 12 34 56 78',
    email: 'test@example.com',
    address: 'Testvej 123',
    apartment: '2. th',
    postalCode: '2100',
    city: 'København Ø'
  })
  
  // Set test dates (tomorrow to next week)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 8)
  
  store.setDates(tomorrow, nextWeek)
  
  console.log('✅ Test data filled')
}

// Clear all form data
const clearData = () => {
  store.reset()
  console.log('🗑️ Data cleared')
}
</script>

<style scoped>
/* Test helper specific styles */
.font-mono {
  font-family: 'Courier New', monospace;
}
</style>