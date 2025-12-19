<template>
  <div class="max-w-4xl mx-auto p-8">
    <h1 class="text-3xl font-bold mb-8">🧪 Error Handling Test Page</h1>
    
    <div class="space-y-4">
      <!-- Health Check Test -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">1. Health Check</h2>
        <button 
          @click="testHealthCheck" 
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Test Health Endpoint
        </button>
        <pre v-if="healthResult" class="mt-3 bg-gray-100 p-3 rounded text-sm overflow-auto">{{ healthResult }}</pre>
      </div>

      <!-- Rollback Test -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">2. Rollback Mechanism</h2>
        <p class="text-sm text-gray-600 mb-3">
          To test rollback: Create a booking, then uncomment the test line in payment/create.post.ts
        </p>
        <ol class="text-sm list-decimal ml-5 mb-3">
          <li>Go to checkout and create a booking</li>
          <li>Check pending bookings in admin panel</li>
          <li>Uncomment the "TEST: Simulated PensoPay failure" line in payment/create.post.ts</li>
          <li>Try to pay - it should fail and rollback</li>
          <li>Check that bookings are now cancelled in admin panel</li>
        </ol>
      </div>

      <!-- Network Timeout Test -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">3. Network Timeout</h2>
        <p class="text-sm text-gray-600 mb-3">
          Open Chrome DevTools → Network → Throttling → Set to "Slow 3G" or "Offline"
        </p>
        <button 
          @click="testSlowNetwork" 
          class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Test Slow API Call
        </button>
        <pre v-if="networkResult" class="mt-3 bg-gray-100 p-3 rounded text-sm overflow-auto">{{ networkResult }}</pre>
      </div>

      <!-- Database Error Test -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">4. Database Errors</h2>
        <button 
          @click="testInvalidData" 
          class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Test Invalid Booking Data
        </button>
        <pre v-if="dbResult" class="mt-3 bg-gray-100 p-3 rounded text-sm overflow-auto">{{ dbResult }}</pre>
      </div>

      <!-- Accessory Unavailable Test -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">5. Unavailable Accessories</h2>
        <ol class="text-sm list-decimal ml-5">
          <li>Go to admin panel and mark all instances of an accessory as unavailable</li>
          <li>Try to book that accessory in checkout</li>
          <li>Should see: "Følgende tilbehør er ikke tilgængeligt..."</li>
        </ol>
      </div>

      <!-- Camera Unavailable Test -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">6. No Cameras Available</h2>
        <ol class="text-sm list-decimal ml-5">
          <li>Create bookings for all cameras in a date range</li>
          <li>Try to book the same dates</li>
          <li>Should see camera unavailability error</li>
        </ol>
      </div>

      <!-- Console Errors -->
      <div class="border rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-3">7. Check Browser Console</h2>
        <p class="text-sm text-gray-600">
          Open DevTools Console (F12) and look for:
        </p>
        <ul class="text-sm list-disc ml-5 mt-2">
          <li>Error logging with timestamps</li>
          <li>User email and order details in error logs</li>
          <li>Rollback messages when payment fails</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const healthResult = ref<any>(null)
const networkResult = ref<any>(null)
const dbResult = ref<any>(null)

const testHealthCheck = async () => {
  healthResult.value = 'Loading...'
  try {
    const response = await $fetch('/api/health')
    healthResult.value = JSON.stringify(response, null, 2)
  } catch (error: any) {
    healthResult.value = `Error: ${error.message || error}`
  }
}

const testSlowNetwork = async () => {
  networkResult.value = 'Testing... (This should timeout if network is slow)'
  const startTime = Date.now()
  
  try {
    const response = await $fetch('/api/products')
    const duration = Date.now() - startTime
    networkResult.value = `Success in ${duration}ms\nProducts: ${JSON.stringify(response).substring(0, 200)}...`
  } catch (error: any) {
    const duration = Date.now() - startTime
    networkResult.value = `Failed after ${duration}ms\nError: ${error.message || error}`
  }
}

const testInvalidData = async () => {
  dbResult.value = 'Testing invalid data...'
  try {
    const response = await $fetch('/api/booking', {
      method: 'POST',
      body: {
        startDate: 'invalid-date',
        endDate: 'invalid-date',
        models: [],
        accessories: [],
        // Missing required fields
      }
    })
    dbResult.value = `Unexpected success: ${JSON.stringify(response)}`
  } catch (error: any) {
    dbResult.value = `Expected error caught:\nStatus: ${error.statusCode || 'N/A'}\nMessage: ${error.statusMessage || error.message || error}`
  }
}
</script>
