export interface BookingEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  service: string
  duration: string
  totalAmount: number
  bookingDate: string
  rentalPeriod?: {
    startDate: string
    endDate: string
  }
  deliveryAddress?: string
  items?: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  // Fields for booking updates with price differences
  priceDifference?: number
  paymentUrl?: string
  isUpdate?: boolean
}

export const useEmail = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Send a booking receipt email to the customer
   */
  const sendBookingReceipt = async (bookingData: BookingEmailData): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; message: string; messageId?: string }>('/api/email/send-receipt', {
        method: 'POST',
        body: {
          bookingData
        }
      })

      if (response.success) {
        return true
      } else {
        throw new Error('Failed to send receipt')
      }
    } catch (err: any) {
      console.error('Error sending receipt:', err)
      error.value = err.message || 'Failed to send receipt email'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Send a booking receipt as PDF attachment
   */
  const sendReceiptPDF = async (bookingData: BookingEmailData): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; message: string; messageId?: string; filename?: string }>('/api/email/send-receipt-pdf', {
        method: 'POST',
        body: {
          bookingData
        }
      })

      if (response.success) {
        return true
      } else {
        throw new Error('Failed to send PDF receipt')
      }
    } catch (err: any) {
      console.error('Error sending PDF receipt:', err)
      error.value = err.message || 'Failed to send PDF receipt'
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Download receipt as PDF
   */
  const downloadReceiptPDF = async (bookingData: BookingEmailData) => {
    if (process.client) {
      try {
        const { downloadPDF } = await import('~/utils/pdfGenerator')
        await downloadPDF(bookingData, `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`)
      } catch (err) {
        console.error('Error downloading PDF:', err)
        error.value = 'Failed to download PDF'
      }
    }
  }

  /**
   * Generate a mailto link for manual email sending
   */
  const generateMailtoLink = (bookingData: BookingEmailData): string => {
        const subject = encodeURIComponent(`LejGoPro ${bookingData.isUpdate ? 'Opdateret ' : ''}Faktura - Order ${bookingData.orderNumber}`)
    
    // Debug email template data
    console.log('📧 Email template debug:', {
      isUpdate: bookingData.isUpdate,
      priceDifference: bookingData.priceDifference,
      paymentUrl: bookingData.paymentUrl,
      willShowUpdate: bookingData.isUpdate,
      willShowPaymentLink: bookingData.paymentUrl,
      customerEmail: bookingData.customerEmail
    })
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK'
      }).format(amount)
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('da-DK')
    }
    
    const body = encodeURIComponent(`
Dear ${bookingData.customerName},

Thank you for your booking with LejGoPro!

BOOKING DETAILS:
================
Order Number: ${bookingData.orderNumber}
Booking Date: ${formatDate(bookingData.bookingDate)}
Service: ${bookingData.service}
Duration: ${bookingData.duration}
Total Amount: ${formatCurrency(bookingData.totalAmount)}

CUSTOMER INFORMATION:
====================
Name: ${bookingData.customerName}
Email: ${bookingData.customerEmail}
${bookingData.customerPhone ? `Phone: ${bookingData.customerPhone}` : ''}

${bookingData.rentalPeriod ? `
RENTAL PERIOD:
==============
Start Date: ${formatDate(bookingData.rentalPeriod.startDate)}
End Date: ${formatDate(bookingData.rentalPeriod.endDate)}
` : ''}

${bookingData.deliveryAddress ? `
DELIVERY:
=========
Address: ${bookingData.deliveryAddress}
` : ''}

${bookingData.items && bookingData.items.length > 0 ? `
ITEMS:
======
        ${bookingData.items.map(item => `${item.name} x${item.quantity} - ${formatCurrency(item.totalPrice)}`).join('\n')}
` : ''}

${bookingData.isUpdate ? `

====================
BOOKING UPDATE
====================
${bookingData.priceDifference && bookingData.priceDifference > 0 ? `ADDITIONAL PAYMENT REQUIRED: ${formatCurrency(bookingData.priceDifference)}` : ''}
${bookingData.priceDifference && bookingData.priceDifference < 0 ? `REFUND AMOUNT: ${formatCurrency(Math.abs(bookingData.priceDifference))}` : ''}
${bookingData.paymentUrl ? `

*** PAYMENT LINK ***
To complete payment for the additional amount, please click this secure link:

${bookingData.paymentUrl}

*** IMPORTANT ***
This link will expire in 10 minutes. Please complete your payment promptly.
` : ''}
====================
` : ''}

If you have any questions, please don't hesitate to contact us.

Best regards,
LejGoPro Team
    `.trim())

    return `mailto:${bookingData.customerEmail}?subject=${subject}&body=${body}`
  }

  /**
   * Open default email client with pre-filled receipt
   */
  const openEmailClient = (bookingData: BookingEmailData) => {
    const mailtoLink = generateMailtoLink(bookingData)
    window.location.href = mailtoLink
  }

  /**
   * Validate booking data before sending email
   */
  const validateBookingData = (data: Partial<BookingEmailData>): data is BookingEmailData => {
    const required = ['orderNumber', 'customerName', 'customerEmail', 'service', 'duration', 'totalAmount', 'bookingDate']
    
    for (const field of required) {
      if (!data[field as keyof BookingEmailData]) {
        error.value = `Missing required field: ${field}`
        return false
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.customerEmail!)) {
      error.value = 'Invalid email format'
      return false
    }

    return true
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Methods
    sendBookingReceipt,
    sendReceiptPDF,
    downloadReceiptPDF,
    generateMailtoLink,
    openEmailClient,
    validateBookingData,
    
    // Utilities
    clearError: () => {
      error.value = null
    }
  }
}