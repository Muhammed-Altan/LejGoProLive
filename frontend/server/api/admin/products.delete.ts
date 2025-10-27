import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const productId = body.id
    
    if (!productId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Product ID is required'
      })
    }
    
    const supabase = createServerSupabaseClient()
    
    // First, delete all cameras associated with this product
    const { error: camerasError } = await supabase
      .from('Camera')
      .delete()
      .eq('productId', productId)
      
    if (camerasError) {
      console.warn('Error deleting cameras for product:', camerasError)
      // Continue anyway - maybe there were no cameras
    }
    
    // Then delete the product
    const { error } = await supabase
      .from('Product')
      .delete()
      .eq('id', productId)
      
    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to delete product: ${error.message}`
      })
    }
    
    return { success: true, message: 'Product deleted successfully' }
  } catch (error: any) {
    console.error('Product deletion error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to delete product'
    })
  }
})