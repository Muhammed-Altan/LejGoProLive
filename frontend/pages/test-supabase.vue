<template>
  <div class="container mx-auto p-8">
    <h1 class="text-3xl font-bold mb-6">Supabase Connection Test</h1>
    
    <div class="bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">Connection Status</h2>
      
      <div v-if="connectionStatus === 'loading'" class="text-blue-600">
        Testing connection...
      </div>
      
      <div v-else-if="connectionStatus === 'success'" class="text-green-600">
        ✅ Successfully connected to Supabase!
      </div>
      
      <div v-else-if="connectionStatus === 'error'" class="text-red-600">
        ❌ Failed to connect to Supabase: {{ errorMessage }}
      </div>
      
      <div class="mt-4">
        <button 
          @click="testConnection" 
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
          :disabled="connectionStatus === 'loading'"
        >
          Test Connection
        </button>
        
        <button 
          @click="testToastSuccess" 
          class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Test Success Toast
        </button>
        
        <button 
          @click="testToastError" 
          class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Test Error Toast
        </button>
      </div>
    </div>

    <!-- PensoPay Test Section -->
    <div class="mt-6 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-xl font-semibold mb-4">PensoPay Subscription Test</h2>
      
      <div v-if="pensoPayStatus === 'loading'" class="text-blue-600">
        Testing PensoPay subscription...
      </div>
      
      <div v-else-if="pensoPayStatus === 'success'" class="text-green-600">
        ✅ PensoPay subscription test successful!
        <div class="mt-2 p-3 bg-gray-100 rounded text-sm">
          <pre>{{ JSON.stringify(pensoPayResponse, null, 2) }}</pre>
        </div>
      </div>
      
      <div v-else-if="pensoPayStatus === 'error'" class="text-red-600">
        ❌ PensoPay subscription test failed: {{ pensoPayError }}
        <div v-if="pensoPayErrorDetails" class="mt-2 p-3 bg-gray-100 rounded text-sm">
          <pre>{{ JSON.stringify(pensoPayErrorDetails, null, 2) }}</pre>
        </div>
      </div>
      
      <div class="mt-4">
        <button 
          @click="testPensoPaySubscription" 
          class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mr-2"
          :disabled="pensoPayStatus === 'loading'"
        >
          Test PensoPay Subscription (Direct)
        </button>
        
        <button 
          @click="testPensoPayViaServer" 
          class="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded"
          :disabled="pensoPayViaServerStatus === 'loading'"
        >
          Test PensoPay via Server
        </button>
      </div>
      
      <div v-if="pensoPayViaServerStatus === 'loading'" class="mt-4 text-blue-600">
        Testing PensoPay via server...
      </div>
      
      <div v-else-if="pensoPayViaServerStatus === 'success'" class="mt-4 text-green-600">
        ✅ Server-side PensoPay test successful!
        <div class="mt-2 p-3 bg-gray-100 rounded text-sm">
          <pre>{{ JSON.stringify(pensoPayViaServerResponse, null, 2) }}</pre>
        </div>
      </div>
      
      <div v-else-if="pensoPayViaServerStatus === 'error'" class="mt-4 text-red-600">
        ❌ Server-side PensoPay test failed: {{ pensoPayViaServerError }}
        <div v-if="pensoPayViaServerErrorDetails" class="mt-2 p-3 bg-gray-100 rounded text-sm">
          <pre>{{ JSON.stringify(pensoPayViaServerErrorDetails, null, 2) }}</pre>
        </div>
      </div>
    </div>
    
    <div class="mt-6 bg-gray-100 p-4 rounded">
      <h3 class="font-semibold mb-2">Next Steps:</h3>
      <ol class="list-decimal list-inside space-y-1 text-sm">
        <li>Update your .env file with actual Supabase URL and anon key</li>
        <li>Make sure your "products" table exists in Supabase</li>
        <li>Test this page by visiting /test-supabase</li>
        <li>Once working, integrate Supabase into your actual pages</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabase = createClient(
  config.public.supabaseUrl as string,
  config.public.supabaseAnonKey as string
)

// Toast testing - using the exact pattern from working project
const toast = useToast()

const testToastSuccess = () => {
  console.log('SUCCESS BUTTON CLICKED!')
  
  // Use the exact same pattern as the working project with additional styling options
  toast.add({ 
    title: 'Success', 
    description: 'This is a test success message.', 
    color: 'success',
    ui: {
      title: 'text-gray-900 font-semibold',
      description: 'text-gray-700'
    }
  })
  
  console.log('Success toast added')
}

const testToastError = () => {
  console.log('ERROR BUTTON CLICKED!')
  
  // Use the exact same pattern as the working project with additional styling options
  toast.add({ 
    title: 'Error', 
    description: 'This is a test error message.', 
    color: 'error',
    ui: {
      title: 'text-gray-900 font-semibold',
      description: 'text-gray-700'
    }
  })
  
  console.log('Error toast added')
}

// Supabase connection testing
const connectionStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const errorMessage = ref('')

const testConnection = async () => {
  connectionStatus.value = 'loading'
  errorMessage.value = ''
  
  try {
    // Check if environment variables are set
    if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
      throw new Error('Supabase URL or Anon Key not configured. Please check your .env file.')
    }
    
    // Simple test - check if we can connect and query
    const { error } = await supabase
      .from('Product')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      throw error
    }
    
    connectionStatus.value = 'success'
    
  } catch (error: any) {
    connectionStatus.value = 'error'
    errorMessage.value = error.message || 'Unknown error occurred'
  }
}

// PensoPay testing variables
const pensoPayStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const pensoPayError = ref('')
const pensoPayErrorDetails = ref<any>(null)
const pensoPayResponse = ref<any>(null)

const pensoPayViaServerStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const pensoPayViaServerError = ref('')
const pensoPayViaServerErrorDetails = ref<any>(null)
const pensoPayViaServerResponse = ref<any>(null)

// Test PensoPay subscription using the exact example they provided
const testPensoPaySubscription = async () => {
  pensoPayStatus.value = 'loading'
  pensoPayError.value = ''
  pensoPayErrorDetails.value = null
  pensoPayResponse.value = null
  
  console.log('🚀 Testing PensoPay subscription with exact example...')
  
  try {
    const url = 'https://api.pensopay.com/v2/subscriptions'
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: 'Bearer 8b5bbc0bb24e83524b09e2b8ec7ccb4ce04fe85141cf8f939f755e62003cdf80'
      },
      body: JSON.stringify({
        amount: 11200,
        reference: 'walk_100011',
        callback_url: 'https://www.google.com/search?q=callback',
        currency: 'DKK',
        description: 'Dogwalking subscription'
      })
    }

    console.log('📤 Sending request to:', url)
    console.log('📤 Request options:', options)

    const response = await fetch(url, options)
    
    console.log('📡 Response status:', response.status)
    console.log('📡 Response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PensoPay error response:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        pensoPayErrorDetails.value = errorJson
        pensoPayError.value = errorJson.message || `HTTP ${response.status}`
      } catch (e) {
        pensoPayError.value = errorText || `HTTP ${response.status}`
      }
      
      pensoPayStatus.value = 'error'
      return
    }
    
    const json = await response.json()
    console.log('✅ PensoPay success response:', json)
    
    pensoPayResponse.value = json
    pensoPayStatus.value = 'success'
    
  } catch (error: any) {
    console.error('💥 PensoPay fetch error:', error)
    pensoPayError.value = error.message || 'Network error'
    pensoPayStatus.value = 'error'
  }
}

// Test PensoPay via our server endpoint
const testPensoPayViaServer = async () => {
  pensoPayViaServerStatus.value = 'loading'
  pensoPayViaServerError.value = ''
  pensoPayViaServerErrorDetails.value = null
  pensoPayViaServerResponse.value = null
  
  console.log('🚀 Testing PensoPay via server endpoint...')
  
  try {
    const testData = {
      bookingData: {
        cameraId: 1,
        cameraName: 'Test Camera',
        productName: 'GoPro Hero 12',
        startDate: '2025-10-01T10:00:00.000Z',
        endDate: '2025-10-05T10:00:00.000Z',
        address: 'Test Address 123',
        apartment: '',
        email: 'test@example.com',
        fullName: 'Test User',
        phone: '+4512345678',
        city: 'Copenhagen',
        postalCode: '2100',
        totalPrice: 100,
        accessoryInstanceIds: []
      },
      paymentMethods: 'creditcard'
    }

    console.log('📤 Sending to server endpoint with data:', testData)

    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })

    console.log('📡 Server response status:', response.status)
    console.log('📡 Server response ok:', response.ok)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Server error response:', errorText)
      
      try {
        const errorJson = JSON.parse(errorText)
        pensoPayViaServerErrorDetails.value = errorJson
        pensoPayViaServerError.value = errorJson.message || `HTTP ${response.status}`
      } catch (e) {
        pensoPayViaServerError.value = errorText || `HTTP ${response.status}`
      }
      
      pensoPayViaServerStatus.value = 'error'
      return
    }
    
    const json = await response.json()
    console.log('✅ Server success response:', json)
    
    pensoPayViaServerResponse.value = json
    pensoPayViaServerStatus.value = 'success'
    
  } catch (error: any) {
    console.error('💥 Server fetch error:', error)
    pensoPayViaServerError.value = error.message || 'Network error'
    pensoPayViaServerStatus.value = 'error'
  }
}

// Test connection on page load
onMounted(() => {
  testConnection()
})
</script>