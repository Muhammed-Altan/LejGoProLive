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
        <svg class="icon icon-small icon-margin-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Send Receipt Email
      </span>
      <span v-else>
        <svg class="icon icon-small icon-spin icon-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Sending...
      </span>
    </button>

    <!-- Mailto Button (Fallback) -->
    <button
      @click="openMailtoLink"
      class="btn btn-secondary btn-secondary-spacing"
    >
      <svg class="icon icon-small icon-margin-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7l10 10M17 7l-10 10"></path>
      </svg>
      Open in Email Client
    </button>

    <!-- Success/Error Messages -->
    <div v-if="emailSuccess" class="message message-success">
      <svg class="icon icon-small icon-margin-right" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
      </svg>
      Receipt sent successfully!
    </div>

    <div v-if="error" class="message message-error">
      <svg class="icon icon-small icon-margin-right" fill="currentColor" viewBox="0 0 20 20">
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
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn-primary {
  background-color: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #4b5563;
  color: white;
}

.btn-secondary:hover {
  background-color: #374151;
}

.loading {
  cursor: wait;
}

.btn-secondary-spacing {
  margin-left: 0.5rem;
}

.icon {
  display: inline-block;
}

.icon-small {
  width: 1rem;
  height: 1rem;
}

.icon-margin-right {
  margin-right: 0.5rem;
}

.icon-white {
  color: white;
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid;
}

.message-success {
  background-color: #f0f9ff;
  border-color: #22d3ee;
  color: #0e7490;
}

.message-error {
  background-color: #fef2f2;
  border-color: #f87171;
  color: #dc2626;
}
</style>