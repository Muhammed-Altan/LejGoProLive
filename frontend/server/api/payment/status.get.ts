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
  // Only accept GET requests
  if (getMethod(event) !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  // Validate environment variables
  if (!PENSOPAY_API_KEY) {
    throw createError({
      statusCode: 500,
      statusMessage: 'PENSOPAY_API_KEY environment variable is not set'
    })
  }

  try {
    const query = getQuery(event)
    const { orderId, paymentId } = query

    if (!orderId && !paymentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Either orderId or paymentId is required'
      })
    }

    let booking = null
    let pensopayPaymentId = paymentId as string

    // If orderId is provided, get the booking and paymentId from database
    if (orderId) {
      const { data: bookingData, error: bookingError } = await supabase
        .from('Booking')
        .select('*')
        .eq('orderId', orderId)
        .single()

      if (bookingError) {
        throw createError({
          statusCode: 404,
          statusMessage: `Booking not found for orderId: ${orderId}`
        })
      }

      booking = bookingData
      pensopayPaymentId = booking.paymentId

      if (!pensopayPaymentId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'No paymentId found for this booking'
        })
      }
    }

    // Fetch payment details from PensoPay
    const paymentResponse = await fetch(`${PENSOPAY_BASE_URL}/payments/${pensopayPaymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PENSOPAY_API_KEY}`,
        'Accept': 'application/json'
      }
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json().catch(() => ({}))
      console.error('PensoPay payment fetch failed:', errorData)
      throw createError({
        statusCode: paymentResponse.status,
        statusMessage: errorData.message || 'Failed to fetch payment from PensoPay'
      })
    }

    const paymentData = await paymentResponse.json()

    // Determine payment status based on PensoPay response
    let paymentStatus = 'pending'
    let paidAt = null

    // PensoPay states: 'authorized' means payment is approved and captured
    // 'processed' means payment is fully completed
    if (paymentData.state === 'processed' || paymentData.state === 'authorized') {
      paymentStatus = 'paid'
      paidAt = new Date().toISOString()
    } else if (paymentData.state === 'cancelled') {
      paymentStatus = 'cancelled'
    } else if (paymentData.state === 'failed') {
      paymentStatus = 'failed'
    }

    // Update the booking in Supabase database
    const updateData: any = {
      paymentStatus,
      paymentId: paymentData.id
    }

    if (paidAt) {
      updateData.paidAt = paidAt
    }

    const updateCondition = orderId ? 'orderId' : 'paymentId'
    const updateValue = orderId || pensopayPaymentId

    console.log('🔄 Updating booking in Supabase...')
    console.log('- Update condition:', updateCondition, '=', updateValue)
    console.log('- Update data:', updateData)

    // First, let's check if the booking exists and what its current state is
    const { data: existingBooking, error: fetchError } = await supabase
      .from('Booking')
      .select('*')
      .eq(orderId ? 'orderId' : 'paymentId', orderId || pensopayPaymentId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching existing booking:', fetchError)
      console.error('- Condition used:', updateCondition, '=', updateValue)
    } else {
      console.log('✅ Found existing booking:', {
        id: existingBooking.id,
        orderId: existingBooking.orderId,
        paymentId: existingBooking.paymentId,
        currentPaymentStatus: existingBooking.paymentStatus,
        currentPaidAt: existingBooking.paidAt
      })
    }

    const { data: updatedBooking, error: updateError } = await supabase
      .from('Booking')
      .update(updateData)
      .eq(orderId ? 'orderId' : 'paymentId', orderId || pensopayPaymentId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating booking payment status:', updateError)
      console.error('- Error message:', updateError.message)
      console.error('- Error details:', updateError.details)
      console.error('- Error hint:', updateError.hint)
      console.error('- Error code:', updateError.code)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update booking in database'
      })
    }

    console.log('✅ Successfully updated booking in Supabase!')
    console.log('- Updated booking data:', updatedBooking)
    console.log('- New paymentStatus:', updatedBooking?.paymentStatus)
    console.log('- New paidAt:', updatedBooking?.paidAt)
    console.log('- New paymentId:', updatedBooking?.paymentId)

    // Double-check by fetching the record again
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('Booking')
      .select('paymentStatus, paidAt, paymentId')
      .eq(orderId ? 'orderId' : 'paymentId', orderId || pensopayPaymentId)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
    } else {
      console.log('🔍 Verification check - current database values:', verifyBooking)
    }

    return {
      success: true,
      paymentData: {
        id: paymentData.id,
        order_id: paymentData.order_id,
        state: paymentData.state,
        accepted: paymentData.accepted,
        amount: paymentData.amount,
        currency: paymentData.currency,
        test_mode: paymentData.test_mode
      },
      booking: updatedBooking,
      message: `Payment status updated to: ${paymentStatus}`
    }

  } catch (error: any) {
    console.error('Payment status check error:', error)
    
    if (error.statusCode) {
      throw error // Re-throw HTTP errors
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Internal server error'
    })
  }
})