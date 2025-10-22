import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const supabase = createServerSupabaseClient()
    
    // Validate required fields
    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Accessory name is required'
      })
    }
    
    // Prepare the payload for Supabase
    const payload = {
      name: body.name,
      description: body.description || '',
      price: body.price || 0,
      quantity: body.quantity || 1
    }
    
    if (body.id) {
      // Update existing accessory
      const { data, error } = await supabase
        .from('Accessory')
        .update(payload)
        .eq('id', body.id)
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to update accessory: ${error.message}`
        })
      }
      
      return { success: true, data, message: 'Accessory updated successfully' }
    } else {
      // Create new accessory
      const { data: newAccessory, error } = await supabase
        .from('Accessory')
        .insert([payload])
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to create accessory: ${error.message}`
        })
      }
      
      // Create accessory instances based on quantity
      if (newAccessory && payload.quantity > 0) {
        const instances = []
        for (let i = 1; i <= payload.quantity; i++) {
          instances.push({
            accessoryId: newAccessory.id,
            isAvailable: true,
            serialNumber: `${payload.name} #${i}`
          })
        }
        
        const { error: instanceError } = await supabase
          .from('AccessoryInstance')
          .insert(instances)
          
        if (instanceError) {
          console.error('Failed to create accessory instances:', instanceError)
          // Don't throw error here, just log it since the accessory was created successfully
        }
      }
      
      return { success: true, data: newAccessory, message: 'Accessory created successfully' }
    }
  } catch (error: any) {
    console.error('Accessory creation/update error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to process accessory request'
    })
  }
})