import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'
import { getHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const supabase = createServerSupabaseClient()
    
    // Validate required fields
    if (!body.bookingId || !body.differenceAmount || !body.customerEmail || !body.customerName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Booking ID, difference amount, customer email, and customer name are required'
      })
    }
    
    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .select('*')
      .eq('id', body.bookingId)
      .single()
      
    if (bookingError || !booking) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Booking not found'
      })
    }
    
    // Convert difference amount to øre (PensoPay expects amounts in smallest currency unit)
    const amountInOre = Math.round(Math.abs(body.differenceAmount) * 100)
    
    if (amountInOre <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Difference amount must be positive'
      })
    }
    
    // Create PensoPay payment data (v2 API format)
    // Get current domain for callback URLs - handle both localhost and deployment
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    
    console.log('🔗 Difference Payment URL Configuration:')
    console.log('Host:', host)
    console.log('Protocol:', protocol)
    console.log('Base URL for callbacks:', baseUrl)
    
    const paymentData = {
      order_id: `DIFF-${booking.id}-${Date.now()}`, // Unique order ID for the difference payment
      amount: amountInOre, // Amount in øre
      currency: 'DKK',
      testmode: true, // Set to false for production
      callback_url: `${baseUrl}/api/payment/callback`,
      success_url: `${baseUrl}/payment/success?type=difference&booking=${booking.id}`,
      cancel_url: `${baseUrl}/payment/cancelled?type=difference&booking=${booking.id}`,
      expires_in: 600 // 10 minutes
    }
    
    // Create payment with PensoPay
    const pensoPayApiKey = process.env.PENSOPAY_API_KEY
    if (!pensoPayApiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'PensoPay API key not configured'
      })
    }
    
    console.log('Creating PensoPay payment with data:', JSON.stringify(paymentData, null, 2))
    console.log('PensoPay API key exists:', !!pensoPayApiKey)
    console.log('PensoPay API key length:', pensoPayApiKey.length)
    
    // Create payment
    const paymentResponse = await fetch('https://api.pensopay.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pensoPayApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })
    
    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error('PensoPay payment creation failed:', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        headers: Object.fromEntries(paymentResponse.headers.entries()),
        body: errorText
      })
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create payment with PensoPay: ${paymentResponse.status} ${paymentResponse.statusText}`
      })
    }
    
    const responseText = await paymentResponse.text()
    console.log('PensoPay payment response:', responseText)
    
    let payment
    try {
      payment = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse PensoPay response as JSON:', responseText.substring(0, 200))
      throw createError({
        statusCode: 500,
        statusMessage: 'Invalid response from PensoPay payment service'
      })
    }
    
    // Check if payment has a link already (PensoPay v2 includes it in the payment response)
    if (!payment.link) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment created but no payment link received'
      })
    }
    
    console.log('Payment created successfully with link:', payment.link)
    
    // TODO: Create DifferencePayment table in database later
    // For now, we'll just return the payment URL without storing it
    /*
    // Store the difference payment information in the database for tracking
    const { error: insertError } = await supabase
      .from('DifferencePayment')
      .insert({
        bookingId: booking.id,
        pensoPayId: payment.id,
        orderId: paymentData.order_id,
        amount: amountInOre,
        currency: 'DKK',
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        status: 'pending',
        paymentUrl: payment.link,
        createdAt: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Failed to store difference payment:', insertError)
    }
    */
    
    return {
      success: true,
      paymentUrl: payment.link,
      paymentId: payment.id,
      orderId: paymentData.order_id,
      amount: body.differenceAmount,
      amountInOre: amountInOre,
      message: 'Difference payment created successfully'
    }
    
  } catch (error: any) {
    console.error('Difference payment creation error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to create difference payment'
    })
  }
})