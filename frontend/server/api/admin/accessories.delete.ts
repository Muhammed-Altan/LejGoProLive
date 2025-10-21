import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const accessoryId = body.id
    
    if (!accessoryId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Accessory ID is required'
      })
    }
    
    const supabase = createServerSupabaseClient()
    
    // First, delete all instances associated with this accessory
    const { error: instancesError } = await supabase
      .from('AccessoryInstance')
      .delete()
      .eq('accessoryId', accessoryId)
      
    if (instancesError) {
      console.warn('Error deleting accessory instances:', instancesError)
      // Continue anyway - maybe there were no instances
    }
    
    // Then delete the accessory
    const { error } = await supabase
      .from('Accessory')
      .delete()
      .eq('id', accessoryId)
      
    if (error) {
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to delete accessory: ${error.message}`
      })
    }
    
    return { success: true, message: 'Accessory deleted successfully' }
  } catch (error: any) {
    console.error('Accessory deletion error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to delete accessory'
    })
  }
})