import { createServerSupabaseClient } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('Booking')
      .select('*')
      .order('id', { ascending: false })
      
    if (error) {
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch bookings'
    })
  }
})