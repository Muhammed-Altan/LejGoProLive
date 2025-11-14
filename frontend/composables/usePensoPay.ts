import { ref, readonly } from 'vue'

interface CreatePaymentRequest {
  order_id: string
  amount: number
  currency: string
  description?: string
  callback_url?: string
  cancel_url?: string
  success_url?: string
  testmode?: boolean
}

interface CreatePaymentResponse {
  id: string
  order_id: string
  amount: number
  currency: string
  state: string
  created_at: string
  updated_at: string
  link?: {
    url: string
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

export const usePensoPay = () => {

  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Enable test mode for development
  // const isTestMode = process.env.NODE_ENV !== 'production' // Commented out for production
  const isTestMode = false // Production mode

  // Note: This function is deprecated - use server-side /api/payment/create instead
  const createPayment = async (paymentData: CreatePaymentRequest): Promise<CreatePaymentResponse | null> => {
    console.warn('usePensoPay.createPayment is deprecated. Use /api/payment/create endpoint instead.')
    loading.value = true
    error.value = null

    try {
      // Call our server-side payment creation endpoint instead of PensoPay directly
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