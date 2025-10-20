import { createServerSupabaseClient } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .order('id')
      
    if (error) {
      throw error
    }
    
    return { success: true, data }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch products'
    })
  }
})