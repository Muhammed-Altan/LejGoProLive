import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'
import { apiCache } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const bookingId = body.id
    
    if (!bookingId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Booking ID is required'
      })
    }
    
    const supabase = createServerSupabaseClient()
    
    // Get the booking details first to release any reserved cameras/accessories
    const { data: booking, error: fetchError } = await supabase
      .from('Booking')
      .select('cameraId, accessoryInstanceIds')
      .eq('id', bookingId)
      .single()
      
    if (fetchError) {
      console.warn('Could not fetch booking details for cleanup:', fetchError)
    }
    
    // If booking has a camera, mark it as available again
    if (booking?.cameraId) {
      const { error: cameraError } = await supabase
        .from('Camera')
        .update({ isAvailable: true })
        .eq('id', booking.cameraId)
        
      if (cameraError) {
        console.warn('Error releasing camera:', cameraError)
      }
    }
    
    // If booking has accessories, mark them as available again
    if (booking?.accessoryInstanceIds && Array.isArray(booking.accessoryInstanceIds) && booking.accessoryInstanceIds.length > 0) {
      const { error: accessoryError } = await supabase
        .from('AccessoryInstance')
        .update({ isAvailable: true })
        .in('id', booking.accessoryInstanceIds)
        
      if (accessoryError) {
        console.warn('Error releasing accessories:', accessoryError)
      }
    }
    
    // Delete the booking
    const { error } = await supabase
      .from('Booking')
      .delete()
      .eq('id', bookingId)
      
    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to delete booking: ${error.message}`
      })
    }
    
    // Clear availability cache since booking deletion affects availability
    console.log('🗑️ Clearing availability cache due to booking deletion')
    apiCache.clearByPrefix('availability')
    
    return { success: true, message: 'Booking deleted successfully' }
  } catch (error: any) {
    console.error('Booking deletion error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to delete booking'
    })
  }
})