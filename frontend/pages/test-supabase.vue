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
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          :disabled="connectionStatus === 'loading'"
        >
          Test Connection
        </button>
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

// Test connection on page load
onMounted(() => {
  testConnection()
})
</script>