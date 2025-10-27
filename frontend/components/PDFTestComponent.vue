<template>
  <div class="pdf-test">
    <h2>PDF Test</h2>
    <button @click="testPDF" class="test-btn">
      Test PDF Generation
    </button>
    <p v-if="message" :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
const message = ref('')
const messageClass = ref('')

const testPDF = async () => {
  try {
    message.value = 'Generating PDF...'
    messageClass.value = 'message-info'
    
    const testData = {
      orderNumber: 'TEST-12345',
      customerName: 'Test Kunde',
      customerEmail: 'test@example.com',
      customerPhone: '+45 12345678',
      address: 'Test Vej 123',
      apartment: '2. th',
      city: 'København',
      postalCode: '2100',
      service: 'GoPro leje',
      startDate: '2025-10-20T00:00:00.000Z',
      endDate: '2025-10-23T00:00:00.000Z',
      totalAmount: 399,
      bookingDate: new Date().toISOString(),
      duration: '3 dage'
    }
    
    const { downloadPDF } = await import('~/utils/pdfGenerator')
    downloadPDF(testData)
    
    message.value = 'PDF generated successfully!'
    messageClass.value = 'message-success'
  } catch (error) {
    console.error('PDF test error:', error)
    message.value = `PDF generation failed: ${error}`
    messageClass.value = 'message-error'
  }
}
</script>

<style scoped>
.pdf-test {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px;
}

.test-btn {
  background-color: #2563eb;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.test-btn:hover {
  background-color: #1d4ed8;
}

.message-info {
  color: #0ea5e9;
}

.message-success {
  color: #10b981;
}

.message-error {
  color: #ef4444;
}
</style>