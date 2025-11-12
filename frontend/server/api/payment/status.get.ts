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
      console.log(`🔍 Looking for booking with orderId: ${orderId}`)
      
      // First try exact match
      let { data: bookingData, error: bookingError } = await supabase
        .from('Booking')
        .select('*')
        .eq('orderId', orderId)
        .single()

      // If exact match fails, try pattern matching (for multi-booking orders)
      if (bookingError && bookingError.code === 'PGRST116') {
        console.log(`🔍 Exact match failed, trying pattern match for orderId: ${orderId}`)
        
        const { data: multipleBookings, error: patternError } = await supabase
          .from('Booking')
          .select('*')
          .like('orderId', `${orderId}%`)
          .limit(1)
          .single()
          
        if (!patternError && multipleBookings) {
          console.log(`✅ Found booking with pattern match: ${multipleBookings.orderId}`)
          bookingData = multipleBookings
          bookingError = null
        }
      }

      if (bookingError) {
        console.error(`❌ Booking lookup failed for orderId: ${orderId}`, {
          error: bookingError,
          message: bookingError.message,
          code: bookingError.code,
          details: bookingError.details
        })
        
        // Additional debug: Check if any bookings exist with similar orderIds
        const orderIdStr = String(orderId)
        const { data: similarBookings, error: similarError } = await supabase
          .from('Booking')
          .select('id, orderId, paymentStatus, createdAt')
          .like('orderId', `%${orderIdStr.split('-').pop()}%`)
          .limit(5)
          
        if (!similarError && similarBookings) {
          console.log('🔍 Found similar bookings:', similarBookings)
        }
        
        throw createError({
          statusCode: 404,
          statusMessage: `Booking not found for orderId: ${orderId}`
        })
      }

      console.log(`✅ Found booking for orderId: ${orderId}`, {
        id: bookingData.id,
        actualOrderId: bookingData.orderId,
        paymentStatus: bookingData.paymentStatus,
        paymentId: bookingData.paymentId
      })

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

    // Log the PensoPay response for debugging
    console.log('📋 PensoPay payment data:', {
      id: paymentData.id,
      state: paymentData.state,
      accepted: paymentData.accepted,
      order_id: paymentData.order_id,
      amount: paymentData.amount,
      currency: paymentData.currency
    })

    // Determine payment status based on PensoPay response
    let paymentStatus = 'pending'
    let paidAt = null

    // PensoPay states: 
    // - 'captured' means payment has been captured/charged (PAID)
    // - 'authorized' means payment is approved and captured (PAID)
    // - 'processed' means payment is fully completed (PAID)
    if (paymentData.state === 'captured' || paymentData.state === 'processed' || paymentData.state === 'authorized') {
      paymentStatus = 'paid'
      paidAt = new Date().toISOString()
      console.log(`✅ Payment is ${paymentData.state} - setting status to PAID`)
    } else if (paymentData.state === 'cancelled') {
      paymentStatus = 'cancelled'
      console.log('❌ Payment was cancelled')
    } else if (paymentData.state === 'failed') {
      paymentStatus = 'failed'
      console.log('❌ Payment failed')
    } else {
      console.log(`⏳ Payment state is '${paymentData.state}' - setting status to PENDING`)
    }

    // Update the booking in Supabase database
    const updateData: any = {
      paymentStatus,
      paymentId: paymentData.id
    }

    if (paidAt) {
      updateData.paidAt = paidAt
    }

    // Use the base orderId to update ALL related bookings (not just the first one)
    let actualOrderId = booking.orderId
    let updateCondition = orderId ? 'orderId' : 'paymentId'
    let updateValue = actualOrderId || pensopayPaymentId
    
    // If we found a booking using pattern matching, we need to update all bookings with the same base orderId
    if (orderId && actualOrderId !== orderId) {
      console.log('🔄 Multiple bookings detected - updating all bookings with base orderId:', orderId)
      // Use LIKE pattern to update all related bookings (ORDER-123, ORDER-123-1, ORDER-123-2, etc.)
      updateCondition = 'orderId'
      updateValue = `${orderId}%`
    }

    console.log('🔄 Updating booking(s) in Supabase...')
    console.log('- Update condition:', updateCondition, '=', updateValue)
    console.log('- Original search orderId:', orderId)
    console.log('- Actual booking orderId:', actualOrderId)
    console.log('- Update data:', updateData)

    // First, let's check how many bookings will be affected
    let bookingsToUpdate = []
    if (updateCondition === 'orderId' && updateValue.includes('%')) {
      // Pattern matching - get all matching bookings
      const { data: multipleBookings, error: fetchMultipleError } = await supabase
        .from('Booking')
        .select('id, orderId, paymentStatus, paidAt')
        .like('orderId', updateValue)
      
      if (!fetchMultipleError && multipleBookings) {
        bookingsToUpdate = multipleBookings
        console.log(`✅ Found ${multipleBookings.length} booking(s) to update:`, multipleBookings.map(b => b.orderId))
      }
    } else {
      // Single booking update
      const { data: singleBooking, error: fetchError } = await supabase
        .from('Booking')
        .select('*')
        .eq(updateCondition, updateValue)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching existing booking:', fetchError)
        console.error('- Condition used:', updateCondition, '=', updateValue)
      } else {
        bookingsToUpdate = [singleBooking]
        console.log('✅ Found existing booking:', {
          id: singleBooking.id,
          orderId: singleBooking.orderId,
          paymentId: singleBooking.paymentId,
          currentPaymentStatus: singleBooking.paymentStatus,
          currentPaidAt: singleBooking.paidAt
        })
      }
    }

    // Update the booking(s) in Supabase database
    let updatedBooking = null
    if (updateCondition === 'orderId' && updateValue.includes('%')) {
      // Pattern-based update for multiple bookings
      const { data: updatedBookings, error: updateError } = await supabase
        .from('Booking')
        .update(updateData)
        .like('orderId', updateValue)
        .select()

      if (updateError) {
        console.error('❌ Error updating bookings payment status:', updateError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update bookings in database'
        })
      }

      console.log(`✅ Successfully updated ${updatedBookings?.length || 0} booking(s) in Supabase!`)
      updatedBookings?.forEach((booking, index) => {
        console.log(`- Updated booking ${index + 1}:`, {
          id: booking.id,
          orderId: booking.orderId,
          paymentStatus: booking.paymentStatus,
          paidAt: booking.paidAt,
          paymentId: booking.paymentId
        })
      })
      
      // Return the first updated booking for response consistency
      updatedBooking = updatedBookings?.[0] || null
    } else {
      // Single booking update
      const { data: singleUpdatedBooking, error: updateError } = await supabase
        .from('Booking')
        .update(updateData)
        .eq(updateCondition, updateValue)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Error updating booking payment status:', updateError)
        throw createError({
          statusCode: 500,
          statusMessage: 'Failed to update booking in database'
        })
      }

      console.log('✅ Successfully updated booking in Supabase!')
      console.log('✅ Successfully updated booking in Supabase!')
      console.log('- Updated booking data:', singleUpdatedBooking)
      updatedBooking = singleUpdatedBooking
    }

    // Double-check by fetching the record(s) again
    const baseOrderId = String(orderId).split('-')[0] + '-' + String(orderId).split('-')[1] + '-' + String(orderId).split('-')[2]
    const { data: verifyBookings, error: verifyError } = await supabase
      .from('Booking')
      .select('paymentStatus, paidAt, paymentId, orderId')
      .like('orderId', `${baseOrderId}%`)

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
    } else {
      console.log('🔍 Verification check - current database values:', verifyBookings)
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