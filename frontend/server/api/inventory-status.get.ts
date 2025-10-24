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
        
        // Get current active bookings for cameras of this specific product
        const today = new Date().toISOString().split('T')[0]
        const productCameraIds = productCameras.map(camera => camera.id)
        
        let camerasInUse = 0
        
        if (productCameraIds.length === 0) {
          // No cameras for this product
          camerasInUse = 0
        } else {
          const { data: activeBookings, error: bookingsError } = await supabase
            .from('Booking')
            .select('cameraId, startDate, endDate, paymentStatus')
            .eq('paymentStatus', 'paid')
            .in('cameraId', productCameraIds)
            .lte('startDate', today)
            .gte('endDate', today)
          
          if (bookingsError) {
            console.error('Error fetching active bookings:', bookingsError)
            camerasInUse = 0
          } else {
            // Count unique cameras currently rented out for this product
            camerasInUse = new Set(
              activeBookings?.map(booking => booking.cameraId) || []
            ).size
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