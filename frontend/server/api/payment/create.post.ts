import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// PensoPay configuration
const PENSOPAY_API_KEY = process.env.PENSOPAY_API_KEY
const PENSOPAY_BASE_URL = 'https://api.pensopay.com/v2'

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  // Validate environment variables
  if (!PENSOPAY_API_KEY) {
    console.error('PENSOPAY_API_KEY is missing from environment variables')
    throw createError({
      statusCode: 500,
      statusMessage: 'PENSOPAY_API_KEY environment variable is not set'
    })
  }

  console.log('PENSOPAY_API_KEY status:', PENSOPAY_API_KEY ? 'loaded' : 'missing')
  console.log('PENSOPAY_API_KEY length:', PENSOPAY_API_KEY?.length || 0)

  try {
    const body = await readBody(event)
    
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    const { bookingData, paymentMethods = 'creditcard' } = body
    
    console.log('Extracted bookingData:', JSON.stringify(bookingData, null, 2))
    
    if (!bookingData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Booking data is required'
      })
    }

    // Validate essential fields
    if (!bookingData.fullName || !bookingData.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Full name and email are required'
      })
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Start date and end date are required'
      })
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const totalAmount = Math.round(bookingData.totalPrice * 100) // Convert to øre
    
    // Get current domain for callback URLs
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    // Create booking in database first
    const bookingPayload = {
      ...bookingData,
      orderId,
      paymentStatus: 'pending'
    }

    console.log('Attempting to create booking with payload:', bookingPayload)
    
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .insert([bookingPayload])
      .select()
      .single()

    if (bookingError) {
      console.error('Detailed booking error:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      })
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create booking: ${bookingError.message}`
      })
    }

    // Determine if we're in test mode
    const isTestMode = process.env.NODE_ENV !== 'production'

    // Create payment with PensoPay
    const paymentData = {
      order_id: orderId,
      amount: totalAmount,
      currency: 'DKK',
      testmode: isTestMode
    }

    console.log('Creating PensoPay payment:', { ...paymentData, apiKey: PENSOPAY_API_KEY ? '***' : 'missing' })

    const paymentResponse = await fetch(`${PENSOPAY_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PENSOPAY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    console.log('Payment response status:', paymentResponse.status)
    console.log('Payment response ok:', paymentResponse.ok)

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json().catch(() => ({}))
      console.error('PensoPay payment creation failed:', errorData)
      console.error('Payment response status:', paymentResponse.status, 'Status text:', paymentResponse.statusText)
      throw createError({
        statusCode: paymentResponse.status,
        statusMessage: errorData.message || 'Payment creation failed'
      })
    }

    const payment = await paymentResponse.json()
    console.log('Full payment response:', payment)
    console.log('Payment created successfully:', { id: payment.id, state: payment.state })

    if (!payment.id) {
      console.error('Payment creation succeeded but no ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment was created but no payment ID was returned'
      })
    }

    // PensoPay automatically creates the link, no need for separate API call
    if (!payment.link) {
      console.error('Payment created but no payment link provided')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment was created but no payment link was provided'
      })
    }

    console.log('Using payment link from creation response:', payment.link)

    // Update booking with payment ID
    await supabase
      .from('Booking')
      .update({ paymentId: payment.id })
      .eq('id', booking.id)

    console.log(`Payment created successfully for order ${orderId}`)

    return {
      success: true,
      paymentUrl: payment.link,
      orderId,
      paymentId: payment.id,
      bookingId: booking.id
    }

  } catch (error: any) {
    console.error('Payment creation error:', error)
    
    if (error.statusCode) {
      throw error // Re-throw HTTP errors
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Internal server error'
    })
  }
})