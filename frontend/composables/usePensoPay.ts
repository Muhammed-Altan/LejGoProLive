/**
 * PensoPay Payment Composable
 * 
 * Handles PensoPay payment gateway integration for LejGoPro
 * 
 * Flow:
 * 1. Create payment on server (/api/payment/create)
 * 2. Redirect user to PensoPay payment window
 * 3. User completes payment
 * 4. PensoPay redirects back to success/cancel URL
 * 5. Callback webhook notifies server of payment status
 * 
 * Security:
 * - All API calls go through server proxy (never expose API key to client)
 * - Payment creation requires valid booking ID
 * - Webhook signature validation on callback
 * 
 * Test Mode:
 * - Uses PensoPay test environment when isTestMode = true
 * - Test card: 1000 0000 0000 0000, CVV: 123, any future expiry
 * 
 * Used by:
 * - PensoPayment.vue component in checkout flow
 */

import { ref, readonly } from 'vue'

/**
 * Payment creation request interface
 * Sent to /api/payment/create endpoint
 */
interface CreatePaymentRequest {
  order_id: string         // Unique booking ID from database
  amount: number           // Amount in øre (1 DKK = 100 øre)
  currency: string         // Currency code (always "DKK")
  description?: string     // Optional payment description
  callback_url?: string    // Webhook URL for payment status
  cancel_url?: string      // Redirect URL if user cancels
  success_url?: string     // Redirect URL after successful payment
  testmode?: boolean       // Enable test mode for development
}

/**
 * Payment creation response interface
 * Returned from PensoPay API via our server proxy
 */
interface CreatePaymentResponse {
  id: string              // PensoPay payment ID
  order_id: string        // Our booking ID (for reference)
  amount: number          // Payment amount in øre
  currency: string        // Currency code
  state: string           // Payment state (e.g., "initial")
  created_at: string      // ISO timestamp of creation
  updated_at: string      // ISO timestamp of last update
  link?: {                // Payment link object (if requested)
    url: string                          // Payment window URL
    agreement_id: string
    language: string
    amount: number
    continue_url: string
    cancel_url: string
    callback_url: string
    payment_methods: string
    auto_fee: boolean
    auto_capture: boolean
    branding_id: string
    google_analytics_tracking_id: string
    google_analytics_client_id: string
    acquirer: string
    deadline: string
    framed: boolean
    branding_config: any
  }
}

/**
 * PensoPay composable export
 */
export const usePensoPay = () => {

  // Loading state - true while creating payment
  const loading = ref(false)
  // Error message if payment creation fails
  const error = ref<string | null>(null)
  
  // Test mode flag - set to true for PensoPay test environment
  // Test mode uses test card numbers and doesn't process real payments
  // const isTestMode = process.env.NODE_ENV !== 'production' // Commented out for production
  const isTestMode = true // Production mode (still in testing)

  /**
   * Create a new PensoPay payment
   * 
   * @deprecated Use /api/payment/create server endpoint instead
   * This client-side function is kept for backwards compatibility
   * but all new code should call the server endpoint directly
   * 
   * @param paymentData - Payment creation parameters
   * @returns Payment response with payment window URL
   */
  const createPayment = async (paymentData: CreatePaymentRequest): Promise<CreatePaymentResponse | null> => {
    console.warn('usePensoPay.createPayment is deprecated. Use /api/payment/create endpoint instead.')
    loading.value = true
    error.value = null

    try {
      // Call server-side payment creation endpoint (proxy to PensoPay API)
      // Server handles API authentication and security
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingData: paymentData, // The server expects bookingData format
          paymentMethods: 'creditcard,googlepay,applepay'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Transform server response to match expected format
      return {
        id: result.paymentId,
        order_id: result.orderId,
        amount: 0, // Server doesn't return this
        currency: 'DKK',
        state: 'initial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        link: {
          url: result.paymentUrl,
          agreement_id: '',
          language: 'da',
          amount: 0,
          continue_url: '',
          cancel_url: '',
          callback_url: '',
          payment_methods: 'creditcard,googlepay,applepay',
          auto_fee: false,
          auto_capture: false,
          branding_id: '',
          google_analytics_tracking_id: '',
          google_analytics_client_id: '',
          acquirer: '',
          deadline: '',
          framed: false,
          branding_config: null
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Payment creation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Note: This function is deprecated - payment links are created automatically on server
  const createPaymentLink = async (paymentId: string, linkData: {
    amount: number
    continue_url: string
    cancel_url: string
    callback_url?: string
    payment_methods?: string
    auto_capture?: boolean
    branding_id?: string
  }): Promise<CreatePaymentResponse | null> => {
    console.warn('usePensoPay.createPaymentLink is deprecated. Payment links are created automatically by the server.')
    loading.value = true
    error.value = null

    try {
      // This functionality is now handled server-side in /api/payment/create
      // Return a mock response to maintain compatibility
      return {
        id: paymentId,
        order_id: '',
        amount: linkData.amount,
        currency: 'DKK',
        state: 'initial',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        link: {
          url: '',
          agreement_id: '',
          language: 'da',
          amount: linkData.amount,
          continue_url: linkData.continue_url,
          cancel_url: linkData.cancel_url,
          callback_url: linkData.callback_url || '',
          payment_methods: linkData.payment_methods || 'creditcard',
          auto_fee: false,
          auto_capture: linkData.auto_capture || false,
          branding_id: linkData.branding_id || '',
          google_analytics_tracking_id: '',
          google_analytics_client_id: '',
          acquirer: '',
          deadline: '',
          framed: false,
          branding_config: null
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Payment link creation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getPayment = async (paymentId: string): Promise<any | null> => {
    loading.value = true
    error.value = null

    try {
      // Use our server-side payment status endpoint instead of direct PensoPay API
      const response = await fetch(`/api/payment/status?paymentId=${paymentId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      // Return the payment data from our server response
      return result.paymentData || result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Get payment error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    createPayment,
    createPaymentLink,
    getPayment
  }
}