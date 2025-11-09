import { createServerSupabaseClient } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    let orderId = getRouterParam(event, 'orderId')
    
    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID is required'
      })
    }
    
    // Handle case where orderId might be missing the "ORDER-" prefix
    const originalOrderId = orderId
    if (!orderId.startsWith('ORDER-')) {
      orderId = `ORDER-${orderId}`
      console.log(`🔧 Added ORDER- prefix: "${originalOrderId}" -> "${orderId}"`)
    }
    
    console.log(`🔍 Looking up bookings for orderId: "${orderId}"`)
    
    // Use server-side client with service role to bypass RLS for payment success page
    const supabase = createServerSupabaseClient()
    
    // First, let's see what orderIds exist in the database for debugging
    const { data: allOrders, error: debugError } = await supabase
      .from('Booking')
      .select('orderId')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (!debugError && allOrders) {
      console.log('📋 Recent order IDs in database:', allOrders.map(o => o.orderId))
    }
    
    // Look for all bookings that start with the orderId (to handle -1, -2, etc. suffixes)
    console.log(`🔍 Searching with pattern: "${orderId}%"`)
    const { data: bookings, error } = await supabase
      .from('Booking')
      .select('*')
      .like('orderId', `${orderId}%`) // This will match ORDER-123, ORDER-123-1, ORDER-123-2, etc.
      .order('orderId', { ascending: true })
    
    console.log(`📊 Query result: ${bookings?.length || 0} bookings found`)
    if (bookings && bookings.length > 0) {
      console.log('📋 Found bookings with orderIds:', bookings.map(b => b.orderId))
    }
      
    if (error) {
      console.error('Error fetching bookings:', error)
      throw createError({
        statusCode: 404,
        statusMessage: 'Booking not found'
      })
    }
    
    if (!bookings || bookings.length === 0) {
      // Try exact match as fallback
      console.log(`🔍 Trying exact match for orderId: "${orderId}"`)
      const { data: exactBookings, error: exactError } = await supabase
        .from('Booking')
        .select('*')
        .eq('orderId', orderId)
        
      if (exactBookings && exactBookings.length > 0) {
        console.log(`✅ Found ${exactBookings.length} booking(s) with exact match`)
        return { success: true, data: exactBookings[0] } // Return single booking for exact match
      }
      
      throw createError({
        statusCode: 404,
        statusMessage: `No bookings found for order ID: ${orderId}. Try using the full ORDER-xxx format.`
      })
    }
    
    // Combine all bookings into a single response
    // Use the first booking for customer details (they should all be the same)
    const firstBooking = bookings[0]
    
    // Calculate total price for all bookings
    const totalPrice = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0)
    
    // Combine all camera/product information
    const items = bookings.map(booking => ({
      productName: booking.productName,
      cameraName: booking.cameraName,
      cameraId: booking.cameraId,
      price: booking.totalPrice
    }))
    
    // Return combined booking data
    const combinedBooking = {
      ...firstBooking, // Use first booking as base (customer info, dates, etc.)
      totalPrice, // Use combined total price
      items: JSON.stringify(items), // Store items as JSON for email generation
      bookingCount: bookings.length,
      individualBookings: bookings // Include individual bookings if needed
    }
    
    console.log(`📦 Found ${bookings.length} bookings for order ${orderId}, combined total: ${totalPrice} øre`)
    
    return { success: true, data: combinedBooking }
  } catch (error: any) {
    console.error('Booking lookup error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to fetch booking'
    })
  }
})