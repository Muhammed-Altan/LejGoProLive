import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Verify PensoPay callback signature
const verifySignature = (rawBody: string, signature: string, privateKey: string): boolean => {
  try {
    const calculated = crypto
      .createHmac('sha256', privateKey)
      .update(rawBody)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(calculated, 'hex')
    )
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const privateKey = process.env.PENSOPAY_PRIVATE_KEY
    
    if (!privateKey) {
      console.error('PENSOPAY_PRIVATE_KEY not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment system not properly configured'
      })
    }

    // Get raw body for signature verification
    const rawBody = await readRawBody(event)
    const body = JSON.parse(rawBody || '{}')
    
    console.log('PensoPay callback received:', {
      eventType: body.type,
      orderId: body.order_id,
      paymentId: body.id,
      accepted: body.accepted,
      state: body.state
    })

    // Verify the callback signature
    const signature = getHeader(event, 'pensopay-checksum-sha256')
    if (!signature || !verifySignature(rawBody || '', signature, privateKey)) {
      console.error('Invalid callback signature')
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid signature'
      })
    }

    // Only process "Payment" type callbacks that are "authorized"
    if (body.type !== 'Payment' || body.state !== 'authorized') {
      console.log('Ignoring non-authorized callback:', body.type, body.state)
      return { success: true, message: 'Callback ignored - not an authorized payment' }
    }

    console.log(`Payment authorized for order ${body.order_id}, payment ID: ${body.id}`)

    // Update booking status in database
    const { error } = await supabase
      .from('Booking')
      .update({
        paymentStatus: 'authorized',
        paymentId: body.id,
        authorizedAt: new Date().toISOString()
      })
      .eq('orderId', body.order_id)

    if (error) {
      console.error('Error updating booking payment status:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update booking status'
      })
    }

    console.log(`Successfully updated booking for order ${body.order_id} to authorized status`)

    // Always respond with 200 OK to acknowledge receipt
    return { 
      status: 'OK',
      message: 'Authorized payment callback processed successfully',
      orderId: body.order_id,
      paymentId: body.id
    }

  } catch (error: any) {
    console.error('Error processing PensoPay callback:', error)
    
    if (error.statusCode) {
      throw error // Re-throw HTTP errors
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Internal server error'
    })
  }
})