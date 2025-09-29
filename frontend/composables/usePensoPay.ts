import { ref } from 'vue'

interface PensoPayConfig {
  apiKey: string
  baseUrl: string
}

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
  const pensoPayConfig: PensoPayConfig = {
    apiKey: process.env.PENSOPAY_API_KEY || '',
    baseUrl: 'https://api.pensopay.com/v2'
  }

  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Enable test mode for development
  const isTestMode = process.env.NODE_ENV !== 'production'

  const createPayment = async (paymentData: CreatePaymentRequest): Promise<CreatePaymentResponse | null> => {
    loading.value = true
    error.value = null

    try {
      // Add testmode to payment data if in development
      const paymentPayload = {
        ...paymentData,
        testmode: isTestMode
      }
      
      console.log('Creating PensoPay payment:', { ...paymentPayload, testmode: isTestMode })

      const response = await fetch(`${pensoPayConfig.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pensoPayConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('PensoPay payment creation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createPaymentLink = async (paymentId: string, linkData: {
    amount: number
    continue_url: string
    cancel_url: string
    callback_url?: string
    payment_methods?: string
    auto_capture?: boolean
    branding_id?: string
  }): Promise<CreatePaymentResponse | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${pensoPayConfig.baseUrl}/payments/${paymentId}/link`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${pensoPayConfig.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(linkData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('PensoPay payment link creation error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const getPayment = async (paymentId: string): Promise<any | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(`${pensoPayConfig.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${pensoPayConfig.apiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('PensoPay get payment error:', err)
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