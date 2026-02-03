/**
 * Email Composable
 * 
 * Handles all email-related functionality for the LejGoPro system
 * 
 * Features:
 * - Send booking receipts via email
 * - Generate and send PDF invoices
 * - Download PDF receipts locally
 * - Generate mailto links for manual email
 * - Validate booking data before sending
 * 
 * Used by:
 * - Checkout flow (send receipt after payment)
 * - Admin panel (resend receipts, update notifications)
 * - Booking updates (notify customers of changes)
 */

/**
 * Booking email data interface
 * Contains all information needed to generate and send booking emails
 */
export interface BookingEmailData {
  orderNumber: string        // Unique order identifier
  customerName: string       // Full name of customer
  customerEmail: string      // Email address for receipt
  customerPhone?: string     // Optional phone number
  service: string            // Service description (e.g., "GoPro Hero 12 Rental")
  startDate: string          // Rental start date (ISO format)
  endDate: string            // Rental end date (ISO format)
  duration: string           // Human-readable duration (e.g., "7 days")
  totalAmount: number        // Total price in DKK
  bookingDate: string        // Date booking was created
  rentalPeriod?: {           // Optional detailed rental period
    startDate: string
    endDate: string
  }
  deliveryAddress?: string   // Optional delivery address
  items?: Array<{            // Optional itemized list
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  // Fields for booking updates with price differences
  priceDifference?: number   // Price change (+/-) from original booking
  paymentUrl?: string        // Payment link for additional charges
  isUpdate?: boolean         // Flag indicating this is an update email
}

/**
 * Email composable export
 * Provides methods for sending emails and managing email state
 */
export const useEmail = () => {
  // Loading state - true when email is being sent
  const isLoading = ref(false)
  // Error message if email sending fails
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
    console.log('📨 useEmail.sendReceiptPDF called with data:', {
      orderNumber: bookingData.orderNumber,
      customerEmail: bookingData.customerEmail,
      customerName: bookingData.customerName,
      service: bookingData.service,
      totalAmount: bookingData.totalAmount,
      itemsCount: bookingData.items?.length || 0
    })

    isLoading.value = true
    error.value = null

    try {
      console.log('🌐 Making API call to /api/email/send-receipt-pdf...')
      
      const response = await $fetch<{ success: boolean; message: string; messageId?: string; filename?: string }>('/api/email/send-receipt-pdf', {
        method: 'POST',
        body: {
          bookingData
        }
      })

      console.log('📥 API response received:', {
        success: response.success,
        message: response.message,
        messageId: response.messageId,
        filename: response.filename
      })

      if (response.success) {
        console.log('✅ PDF email sent successfully!')
        return true
      } else {
        console.error('❌ API returned success: false')
        throw new Error(response.message || 'Failed to send PDF receipt')
      }
    } catch (err: any) {
      console.error('💥 Error in sendReceiptPDF:', err)
      console.error('🔍 Error details:', {
        name: err.name,
        message: err.message,
        statusCode: err.statusCode,
        statusMessage: err.statusMessage,
        data: err.data,
        stack: err.stack
      })
      
      error.value = err.message || 'Failed to send PDF receipt'
      return false
    } finally {
      isLoading.value = false
      console.log('🏁 sendReceiptPDF process completed')
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