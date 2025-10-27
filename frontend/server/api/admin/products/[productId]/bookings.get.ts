import { createServerSupabaseClient } from '../../../../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const productId = getRouterParam(event, 'productId')
    
    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Product ID is required'
      })
    }

    const supabase = createServerSupabaseClient()
    
    // Get all cameras for this product
    const { data: cameras, error: camerasError } = await supabase
      .from('Camera')
      .select('id')
      .eq('productId', parseInt(productId))
    
    if (camerasError) {
      throw camerasError
    }
    
    if (!cameras || cameras.length === 0) {
      return {
        success: true,
        data: []
      }
    }
    
    const cameraIds = cameras.map((camera: any) => camera.id)
    
    // Get all bookings for these cameras
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .select(`
        id,
        cameraId,
        startDate,
        endDate,
        fullName,
        email,
        phone,
        paymentStatus,
        totalPrice
      `)
      .in('cameraId', cameraIds)
      .neq('paymentStatus', 'cancelled')
      .order('startDate', { ascending: true })
    
    if (bookingsError) {
      throw bookingsError
    }
    
    // Format the data for the calendar
    const formattedBookings = bookings?.map((booking: any) => ({
      id: booking.id,
      cameraId: booking.cameraId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      customerName: booking.fullName || 'Ukendt kunde',
      email: booking.email,
      phone: booking.phone,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice
    })) || []
    
    return {
      success: true,
      data: formattedBookings
    }
    
  } catch (error: any) {
    console.error('Error fetching product bookings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch product bookings'
    })
  }
})