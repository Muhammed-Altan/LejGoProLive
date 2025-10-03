<template>
  <div class="min-h-screen bg-gray-50">
    <Header />
    
    <div class="flex items-center justify-center px-4 py-16">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Log ind til admin panelet
          </p>
        </div>
        
        <div class="bg-white py-8 px-6 shadow-lg rounded-lg">
          <form @submit.prevent="handleLogin" class="space-y-6">
            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  v-model="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#B90C2C] focus:border-[#B90C2C] sm:text-sm"
                  placeholder="admin@lejgopro.dk"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Adgangskode
              </label>
              <div class="mt-1">
                <input
                  id="password"
                  v-model="password"
                  name="password"
                  type="password"
                  autocomplete="current-password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-[#B90C2C] focus:border-[#B90C2C] sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <!-- Remember Me -->
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-[#B90C2C] focus:ring-[#B90C2C] border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Husk mig
              </label>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-800">{{ error }}</p>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                :disabled="loading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#B90C2C] hover:bg-[#a10a25] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B90C2C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                {{ loading ? 'Logger ind...' : 'Log ind' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'

definePageMeta({
  middleware: 'admin'
})


// Form data
const email = ref('')
const password = ref('')
const rememberMe = ref(false)

// State
const loading = ref(false)
const error = ref<string | null>(null)

// Handle form submission
const handleLogin = async () => {
  error.value = null
  loading.value = true

  try {
    // TODO: Implement actual login logic here
    console.log('Login attempt:', {
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // For now, show a placeholder message
    alert('Login functionality will be implemented in backend phase')
    
  } catch (err) {
    error.value = 'Der opstod en fejl under login. Prøv igen.'
  } finally {
    loading.value = false
  }
}

// Set page title
useHead({
  title: 'Admin Login - LejGoPro',
  meta: [
    { name: 'description', content: 'Log ind til LejGoPro admin panel' }
  ]
})
</script>