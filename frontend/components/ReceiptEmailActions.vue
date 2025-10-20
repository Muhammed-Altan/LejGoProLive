<template>
  <div class="receipt-email-actions">
    <!-- Send PDF Faktura Button -->
    <button
      @click="sendPDFReceipt"
      :disabled="isLoading"
      class="btn btn-primary"
      :class="{ 'loading': isLoading }"
    >
      <span v-if="!isLoading">
        <svg class="icon icon-small icon-margin-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        Send PDF Faktura
      </span>
      <span v-else>
        <svg class="icon icon-small icon-spin icon-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Sending PDF...
      </span>
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

const { 
  sendReceiptPDF,
  validateBookingData, 
  isLoading, 
  error, 
  clearError 
} = useEmail()
const emailSuccess = ref(false)

const sendPDFReceipt = async () => {
  clearError()
  emailSuccess.value = false

  // Validate data first
  if (!validateBookingData(props.bookingData)) {
    return
  }

  const success = await sendReceiptPDF(props.bookingData)
  
  if (success) {
    emailSuccess.value = true
    // Auto-hide success message after 5 seconds
    setTimeout(() => {
      emailSuccess.value = false
    }, 5000)
  }
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

.loading {
  cursor: wait;
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