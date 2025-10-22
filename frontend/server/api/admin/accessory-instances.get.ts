import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const query = getQuery(event)
    const accessoryId = query.accessoryId ? Number(query.accessoryId) : null
    
    const supabase = createServerSupabaseClient()
    
    let dbQuery = supabase
      .from('AccessoryInstance')
      .select('*')
      .order('serialNumber')
    
    // Filter by accessoryId if provided
    if (accessoryId) {
      dbQuery = dbQuery.eq('accessoryId', accessoryId)
    }
    
    const { data, error } = await dbQuery
    
    if (error) {
      // If AccessoryInstance table doesn't exist, return empty array
      console.warn('AccessoryInstance table error:', error)
      return { success: true, data: [] }
    }
    
    return { success: true, data }
  } catch (error: any) {
    console.error('Accessory instances fetch error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to fetch accessory instances'
    })
  }
})