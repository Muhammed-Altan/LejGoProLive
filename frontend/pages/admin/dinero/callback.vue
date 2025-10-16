<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div v-if="processing" class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8082A] mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Behandler autorisation...</h2>
        <p class="text-gray-600">Du vil snart blive omdirigeret tilbage til admin panelet.</p>
      </div>
      
      <div v-else-if="success" class="text-center">
        <div class="text-green-500 text-5xl mb-4">✓</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Dinero forbundet!</h2>
        <p class="text-gray-600 mb-4">Din Dinero integration er nu klar til brug.</p>
        <button 
          @click="goToAdmin" 
          class="bg-[#B8082A] text-white px-6 py-2 rounded font-semibold hover:bg-[#a10725] transition"
        >
          Gå til Admin Panel
        </button>
      </div>
      
      <div v-else-if="error" class="text-center">
        <div class="text-red-500 text-5xl mb-4">✗</div>
        <h2 class="text-xl font-semibold text-gray-900 mb-2">Autorisationsfejl</h2>
        <p class="text-red-600 mb-4">{{ error }}</p>
        <button 
          @click="goToAdmin" 
          class="bg-gray-500 text-white px-6 py-2 rounded font-semibold hover:bg-gray-600 transition"
        >
          Tilbage til Admin Panel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const processing = ref(true)
const success = ref(false)
const error = ref('')

definePageMeta({
  layout: false
})

onMounted(async () => {
  try {
    // Handle both GET (URL params) and POST (form data) responses
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')
    const storedState = localStorage.getItem('dinero_auth_state')
    
    if (!code) {
      throw new Error('Ingen autorisationskode modtaget')
    }
    
    if (!state || state !== storedState) {
      throw new Error('Ugyldig state parameter - sikkerhedsfejl')
    }
    
    // Exchange code for token
    const config = useRuntimeConfig()
    const redirectUri = `${config.public.baseUrl}/admin/dinero/callback`
    
    const response = await fetch('/api/dinero/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        code, 
        redirectUri 
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Autorisationsfejl')
    }
    
    if (data.success) {
      success.value = true
      localStorage.removeItem('dinero_auth_state')
      
      // Redirect to admin after a short delay
      setTimeout(() => {
        goToAdmin()
      }, 2000)
    } else {
      throw new Error(data.error || 'Ukendt fejl')
    }
    
  } catch (err: any) {
    console.error('Authorization callback error:', err)
    error.value = err.message
  } finally {
    processing.value = false
  }
})

function goToAdmin() {
  navigateTo('/admin#integrations')
}
</script>

<style scoped>
/* Add any custom styles if needed */
</style>