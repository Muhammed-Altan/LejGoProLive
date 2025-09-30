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
    
    // Use the actual calculated price from checkout (convert from DKK to øre)
    let totalAmount = Math.round((bookingData.totalPrice || 0) * 100) // Convert DKK to øre
    
    console.log('🔍 PRICE CALCULATION DEBUG:')
    console.log('- Raw bookingData.totalPrice:', bookingData.totalPrice)
    console.log('- Type of totalPrice:', typeof bookingData.totalPrice)
    console.log('- Calculated totalAmount in øre:', totalAmount)
    console.log('- Final amount in DKK:', totalAmount / 100)
    
    // Validate amount
    if (totalAmount <= 0) {
      console.error('💥 Invalid amount detected! Full booking data:', JSON.stringify(bookingData, null, 2))
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid total amount. Price must be greater than 0.'
      })
    }
    
    // Get current domain for callback URLs - handle Vercel deployment
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    
    console.log('🔗 Callback URL Configuration:')
    console.log('Host:', host)
    console.log('Protocol:', protocol)
    console.log('Base URL for callbacks:', baseUrl)

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

    const isTestMode = true

    const paymentData = {
      order_id: orderId,
      amount: totalAmount,
      currency: 'DKK',
      testmode: isTestMode,
      callback_url: `${baseUrl}/api/payment/callback`,
      success_url: `${baseUrl}/payment/success?orderId=${orderId}`,
      cancel_url: `${baseUrl}/payment/cancelled?orderId=${orderId}`,
      expires_in: 600
    }

    console.log('🔍 DETAILED REQUEST CHECK:')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('isTestMode calculated as:', isTestMode)
    console.log('testmode value being sent:', paymentData.testmode)
    console.log('Success URL being sent:', paymentData.success_url)
    console.log('Cancel URL being sent:', paymentData.cancel_url)
    console.log('Callback URL being sent:', paymentData.callback_url)
    console.log('Payment expires in (seconds):', paymentData.expires_in)
    console.log('Full payment data being sent to PensoPay:', JSON.stringify(paymentData, null, 2))
    console.log('Payment methods requested:', paymentMethods)

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
    console.log('✅ PensoPay Response - Payment Created:')
    console.log('Payment ID:', payment.id)
    console.log('Payment testmode from response:', payment.test_mode)
    console.log('Payment state:', payment.state)
    console.log('Payment link:', payment.link)

    if (!payment.id) {
      console.error('Payment creation succeeded but no ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment was created but no payment ID was returned'
      })
    }

    // Use the default payment link (PensoPay doesn't support redirect URLs)
    console.log('Using default payment link from PensoPay')
    const finalPaymentUrl = payment.link
    
    // Ensure we have a payment link before proceeding
    if (!payment.link) {
      console.error('Payment created but no payment link provided')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment was created but no payment link was provided'
      })
    }

    // Update booking with payment ID
    await supabase
      .from('Booking')
      .update({ paymentId: payment.id })
      .eq('id', booking.id)

    console.log(`Payment created successfully for order ${orderId}`)

    return {
      success: true,
      paymentUrl: finalPaymentUrl,
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