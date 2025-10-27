import { createServerSupabaseClient } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const orderId = getRouterParam(event, 'orderId')
    
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID is required'
      })
    }
    
    // Use server-side client with service role to bypass RLS for payment success page
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('Booking')
      .select('*')
      .eq('orderId', orderId)
      .single()
      
    if (error) {
      console.error('Error fetching booking:', error)
      throw createError({
        statusCode: 404,
        statusMessage: 'Booking not found'
      })
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Booking lookup error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to fetch booking'
    })
  }
})