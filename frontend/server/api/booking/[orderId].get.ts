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
    
    // Check if any booking has accessories and fetch them
    const bookingsWithAccessories = bookings.filter(b => b.accessoryInstanceIds && Array.isArray(b.accessoryInstanceIds) && b.accessoryInstanceIds.length > 0)
    let accessoryItems: Array<{productName: string, cameraName: string, accessoryId: number, price: number}> = []
    
    if (bookingsWithAccessories.length > 0) {
      console.log('📦 Found bookings with accessories, fetching accessory details...')
      
      // Get all accessory instance IDs from all bookings
      const allAccessoryInstanceIds = bookingsWithAccessories
        .flatMap(b => b.accessoryInstanceIds)
        .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
      
      if (allAccessoryInstanceIds.length > 0) {
        console.log(`🔍 Querying accessory instances with IDs: [${allAccessoryInstanceIds.join(', ')}]`)
        
        // First, get the accessory instances
        const { data: accessoryInstances, error: accessoryInstanceError } = await supabase
          .from('AccessoryInstance')
          .select('id, accessoryId')
          .in('id', allAccessoryInstanceIds)
          
        console.log(`🔍 AccessoryInstance query result:`, { accessoryInstances, accessoryInstanceError })
        
        if (!accessoryInstanceError && accessoryInstances && accessoryInstances.length > 0) {
          // Get unique accessory IDs
          const accessoryIds = [...new Set(accessoryInstances.map(instance => instance.accessoryId))]
          console.log(`🔍 Fetching accessory details for IDs: [${accessoryIds.join(', ')}]`)
          
          // Then get the accessory details separately
          const { data: accessories, error: accessoryError } = await supabase
            .from('Accessory')
            .select('id, name, price')
            .in('id', accessoryIds)
            
          console.log(`🔍 Accessory details query result:`, { accessories, accessoryError })
          
          if (!accessoryError && accessories && accessories.length > 0) {
            // Calculate accessory pricing
            const startDate = new Date(firstBooking.startDate || new Date())
            const endDate = new Date(firstBooking.endDate || new Date(Date.now() + 24*60*60*1000))
            const rentalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
            
            console.log(`🔍 Processing ${accessoryInstances.length} accessory instances for ${rentalDays} days`)
            
            // Match instances to accessory details
            accessoryItems = accessoryInstances.map((instance: any) => {
              const accessoryDetail = accessories.find(acc => acc.id === instance.accessoryId)
              return {
                productName: accessoryDetail?.name || 'Accessory',
                cameraName: accessoryDetail?.name || 'Accessory',
                accessoryId: instance.id,
                price: (accessoryDetail?.price || 0) * rentalDays * 100 // Convert to øre
              }
            })
            
            console.log(`📦 Found ${accessoryItems.length} accessories for order ${orderId}`)
          } else if (accessoryError) {
            console.error(`❌ Error fetching accessory details:`, accessoryError)
          } else {
            console.log(`⚠️ No accessory details found for IDs: [${accessoryIds.join(', ')}]`)
          }
        } else if (accessoryInstanceError) {
          console.error(`❌ Error fetching accessory instances:`, accessoryInstanceError)
        } else {
          console.log(`⚠️ No accessory instances found for IDs: [${allAccessoryInstanceIds.join(', ')}]`)
        }
      }
    }
    
    // Combine cameras and accessories
    const allItems = [...items, ...accessoryItems]
    
    console.log(`📦 Debug - Camera items:`, items)
    console.log(`📦 Debug - Accessory items:`, accessoryItems) 
    console.log(`📦 Debug - All items combined:`, allItems)
    
    // Return combined booking data
    const combinedBooking = {
      ...firstBooking, // Use first booking as base (customer info, dates, etc.)
      totalPrice, // Use combined total price
      items: JSON.stringify(allItems), // Store all items (cameras + accessories) as JSON for email generation
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