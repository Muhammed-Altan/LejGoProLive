<template>
  <div class="receipt-email-actions">
    <!-- Send Email Button -->
    <button
      @click="sendEmailReceipt"
      :disabled="isLoading"
      class="btn btn-primary"
      :class="{ 'loading': isLoading }"
    >
      <span v-if="!isLoading">
        <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Send Receipt Email
      </span>
      <span v-else>
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Sending...
      </span>
    </button>

    <!-- Mailto Button (Fallback) -->
    <button
      @click="openMailtoLink"
      class="btn btn-secondary ml-2"
    >
      <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7l10 10M17 7l-10 10"></path>
      </svg>
      Open in Email Client
    </button>

    <!-- Success/Error Messages -->
    <div v-if="emailSuccess" class="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
      <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      Receipt sent successfully!
    </div>

    <div v-if="error" class="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
      <svg class="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
      </svg>
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BookingEmailData } from '~/composables/useEmail'

interface Props {
  bookingData: BookingEmailData
}

const props = defineProps<Props>()

const { sendBookingReceipt, openEmailClient, validateBookingData, isLoading, error, clearError } = useEmail()
const emailSuccess = ref(false)

const sendEmailReceipt = async () => {
  clearError()
  emailSuccess.value = false

  // Validate data first
  if (!validateBookingData(props.bookingData)) {
    return
  }

  const success = await sendBookingReceipt(props.bookingData)
  
  if (success) {
    emailSuccess.value = true
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      emailSuccess.value = false
    }, 5000)
  }
}

const openMailtoLink = () => {
  clearError()
  
  if (!validateBookingData(props.bookingData)) {
    return
  }
  
  openEmailClient(props.bookingData)
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-primary:disabled {
  @apply bg-blue-300 cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}

.loading {
  @apply cursor-wait;
}
</style>