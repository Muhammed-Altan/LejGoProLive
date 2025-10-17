<template>
  <div class="container">
    <Header />
    
    <div class="max-w-4xl mx-auto pt-16 pb-24 px-4">
      <h1 class="text-3xl font-bold mb-8">PDF Receipt Test</h1>
      
      <!-- PDF Test Component -->
      <PDFTestComponent />
      
      <!-- Email Actions Test -->
      <div class="mt-8 p-6 border rounded-lg">
        <h2 class="text-xl font-semibold mb-4">Email Receipt Actions</h2>
        <ReceiptEmailActions v-if="sampleBookingData" :booking-data="sampleBookingData" />
      </div>
    </div>
    
    <Footer />
  </div>
</template>

<script setup lang="ts">
import Header from '~/components/Header.vue'
import Footer from '~/components/Footer.vue'
import PDFTestComponent from '~/components/PDFTestComponent.vue'
import ReceiptEmailActions from '~/components/ReceiptEmailActions.vue'
import type { BookingEmailData } from '~/composables/useEmail'

// Sample booking data for testing
const sampleBookingData: BookingEmailData = {
  orderNumber: 'ORDER-1760685464221-837',
  customerName: 'Muhammed Altan',
  customerEmail: 'altan_8260@hotmail.com',
  customerPhone: '+45 50204127',
  service: 'Hero 10 GoPro Rental',
  duration: '3 dage (20/10/2025 - 23/10/2025)',
  totalAmount: 446,
  bookingDate: new Date().toISOString(),
  deliveryAddress: 'Borgmester Jørgensens Vej 3, stue. 138, 9000 Aalborg',
  rentalPeriod: {
    startDate: '2025-10-20T07:16:00.000Z',
    endDate: '2025-10-23T07:16:00.000Z'
  }
}

// Set page title
useHead({
  title: 'PDF Receipt Test - LejGoPro',
  meta: [
    { name: 'description', content: 'Test PDF receipt generation and email functionality' }
  ]
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>