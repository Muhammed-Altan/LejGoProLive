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