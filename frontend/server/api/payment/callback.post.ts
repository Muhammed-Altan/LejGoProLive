import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const headers = getHeaders(event)
    
    // Log the callback for debugging
    console.log('PensoPay callback received:', {
      body,
      headers: {
        'pensopay-signature': headers['pensopay-signature'],
        'content-type': headers['content-type']
      }
    })

    // Verify the callback signature (you should implement this for security)
    // const signature = headers['pensopay-signature']
    // if (!verifySignature(body, signature)) {
    //   throw createError({
    //     statusCode: 400,
    //     statusMessage: 'Invalid signature'
    //   })
    // }

    // Process the payment callback
    if (body.accepted && body.state === 'processed') {
      // Payment was successful
      console.log(`Payment successful for order ${body.order_id}`)
      
      // Update booking status in database if needed
      const { error } = await supabase
        .from('Booking')
        .update({
          paymentStatus: 'paid',
          paymentId: body.id,
          paidAt: new Date().toISOString()
        })
        .eq('orderId', body.order_id)

      if (error) {
        console.error('Error updating booking payment status:', error)
      }
      
      // You might want to send confirmation email here
      // await sendConfirmationEmail(body.order_id)
      
    } else {
      // Payment failed or was cancelled
      console.log(`Payment failed/cancelled for order ${body.order_id}:`, body.state)
    }

    // Always respond with 200 OK to acknowledge receipt
    return { 
      status: 'OK',
      message: 'Callback received and processed'
    }

  } catch (error) {
    console.error('Error processing PensoPay callback:', error)
    
    // Still return 200 OK to prevent PensoPay from retrying
    return { 
      status: 'ERROR',
      message: 'Error processing callback'
    }
  }
})