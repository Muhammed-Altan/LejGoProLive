import { createServerSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const supabase = createServerSupabaseClient()
  
  console.log('🧹 Running cleanup for old pending bookings...')
  
  // Calculate the date 1 day ago
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)
  
  try {
    // Find all pending bookings older than 1 day (using createdAt timestamp)
    const { data: oldBookings, error: fetchError } = await supabase
      .from('Booking')
      .select('id, email, createdAt')
      .eq('paymentStatus', 'pending')
      .lt('createdAt', oneDayAgo.toISOString())
      .order('createdAt', { ascending: true })
    
    if (fetchError) {
      console.error('❌ Error fetching old bookings:', fetchError)
      return {
        success: false,
        error: fetchError.message,
        cleaned: 0
      }
    }
    
    if (!oldBookings || oldBookings.length === 0) {
      console.log('✅ No old pending bookings to clean up')
      return {
        success: true,
        cleaned: 0,
        message: 'No old pending bookings found'
      }
    }
    
    console.log(`📅 Found ${oldBookings.length} old pending booking(s) to clean up`)
    
    const bookingIds = oldBookings.map(b => b.id)
    
    // Cancel the old bookings
    const { error: updateError } = await supabase
      .from('Booking')
      .update({ 
        paymentStatus: 'cancelled'
      })
      .in('id', bookingIds)
    
    if (updateError) {
      console.error('❌ Error cancelling old bookings:', updateError)
      return {
        success: false,
        error: updateError.message,
        cleaned: 0
      }
    }
    
    console.log(`✅ Successfully cleaned up ${oldBookings.length} old booking(s)`)
    
    return {
      success: true,
      cleaned: oldBookings.length,
      message: `Cancelled ${oldBookings.length} old pending booking(s)`,
      bookingIds: bookingIds
    }
    
  } catch (error: any) {
    console.error('❌ Cleanup error:', error)
    return {
      success: false,
      error: error?.message || 'Unknown error',
      cleaned: 0
    }
  }
})
