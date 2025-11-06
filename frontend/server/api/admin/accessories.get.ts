import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('Accessory')
      .select('*')
      .order('id')
      
    if (error) {
      throw error
    }

    // Debug: Log what we're returning
    console.log('🔧 Accessory GET API returning:', data?.map(item => ({
      id: item.id,
      name: item.name,
      hasImageUrl: !!item.imageUrl,
      imageUrl: item.imageUrl
    })))
    
    return { success: true, data }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch accessories'
    })
  }
})