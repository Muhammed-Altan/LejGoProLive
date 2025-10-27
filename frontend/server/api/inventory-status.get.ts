import { createServerSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get all products first
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, name, imageUrl, dailyPrice, weeklyPrice')
      .order('id')
    
    if (productsError) {
      throw productsError
    }
    
    // Get all cameras
    const { data: cameras, error: camerasError } = await supabase
      .from('Camera')
      .select('id, productId')
    
    if (camerasError) {
      throw camerasError
    }
    
    // Calculate current availability for each product
    const inventoryData = await Promise.all(
      products?.map(async (product: any) => {
        // Filter cameras for this product
        const productCameras = cameras?.filter(camera => camera.productId === product.id) || []
        const totalCameras = productCameras.length
        
        // Get all active bookings (current and future) for cameras of this specific product
        const today = new Date().toISOString().split('T')[0]
        const productCameraIds = productCameras.map(camera => camera.id)
        
        let camerasInUse = 0
        let camerasWithFutureBookings = 0
        
        if (productCameraIds.length === 0) {
          // No cameras for this product
          camerasInUse = 0
        } else {
          // Get all paid bookings for these cameras that haven't ended yet
          const { data: allBookings, error: bookingsError } = await supabase
            .from('Booking')
            .select('cameraId, startDate, endDate, paymentStatus')
            .eq('paymentStatus', 'paid')
            .in('cameraId', productCameraIds)
            .gte('endDate', today) // Any booking that ends today or in the future
          
          if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError)
            camerasInUse = 0
          } else {
            // Count cameras with any active or future bookings
            const camerasWithBookings = new Set(
              allBookings?.map(booking => booking.cameraId) || []
            )
            camerasInUse = camerasWithBookings.size
            
            console.log(`Product ${product.name}: ${totalCameras} total cameras, ${camerasInUse} with bookings, ${allBookings?.length || 0} total bookings`)
          }
        }
        
        // Available = Total - Currently in use
        const available = Math.max(0, totalCameras - camerasInUse)
        
        return {
          productId: product.id,
          productName: product.name,
          imageUrl: product.imageUrl,
          dailyPrice: product.dailyPrice,
          weeklyPrice: product.weeklyPrice,
          inventory: {
            total: totalCameras,
            available: available,
            inUse: camerasInUse
          },
          availabilityStatus: available > 0 ? 'available' : 'unavailable',
          lastUpdated: new Date().toISOString()
        }
      }) || []
    )
    
    return { 
      success: true, 
      data: inventoryData,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Inventory status error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch inventory status'
    })
  }
})