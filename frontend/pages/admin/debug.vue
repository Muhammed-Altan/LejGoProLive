<template>
  <div class="max-w-4xl mx-auto py-8">
    <h1 class="text-2xl font-bold mb-6">Authentication Debug</h1>
    
    <div class="space-y-4">
      <div class="p-4 border rounded">
        <h2 class="text-lg font-semibold mb-2">Current Auth State</h2>
        <p><strong>Is Logged In:</strong> {{ auth.isLoggedIn.value }}</p>
        <p><strong>User:</strong> {{ auth.user.value }}</p>
        <p><strong>Has Access Token:</strong> {{ !!auth.getAccessToken() }}</p>
        <p><strong>Refresh Token Cookie:</strong> {{ refreshTokenCookie }}</p>
      </div>
      
      <div class="space-x-4">
        <button @click="testRefresh" class="bg-blue-500 text-white px-4 py-2 rounded">
          Test Refresh Token
        </button>
        <button @click="testLogout" class="bg-red-500 text-white px-4 py-2 rounded">
          Test Logout
        </button>
      </div>
      
      <div v-if="debugResult" class="p-4 border rounded bg-gray-50">
        <h3 class="font-semibold mb-2">Debug Result:</h3>
        <pre>{{ debugResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const auth = useAuth()
const refreshTokenCookie = useCookie('refresh_token')
const debugResult = ref('')

const testRefresh = async () => {
  try {
    const result = await auth.refreshToken()
    debugResult.value = `Refresh result: ${result}`
  } catch (error) {
    debugResult.value = `Refresh error: ${error}`
  }
}

const testLogout = async () => {
  try {
    await auth.logout()
    debugResult.value = 'Logout successful'
  } catch (error) {
    debugResult.value = `Logout error: ${error}`
  }
}
</script>