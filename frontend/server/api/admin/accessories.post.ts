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
      
      // Handle AccessoryInstance updates when quantity changes
      if (payload.quantity) {
        // Get current instances count
        const { data: currentInstances, error: instancesError } = await supabase
          .from('AccessoryInstance')
          .select('id')
          .eq('accessoryId', body.id)
          
        if (instancesError) {
          console.error('Failed to fetch current instances:', instancesError)
        } else {
          const currentCount = currentInstances?.length || 0
          const targetCount = payload.quantity
          
          if (targetCount > currentCount) {
            // Need to add more instances
            const instancesToAdd = []
            for (let i = currentCount + 1; i <= targetCount; i++) {
              instancesToAdd.push({
                accessoryId: body.id,
                isAvailable: true,
                serialNumber: `${payload.name} #${i}`
              })
            }
            
            const { error: addError } = await supabase
              .from('AccessoryInstance')
              .insert(instancesToAdd)
              
            if (addError) {
              console.error('Failed to add accessory instances:', addError)
            }
          } else if (targetCount < currentCount) {
            // Need to remove excess instances (remove available ones first)
            const instancesToRemove = currentCount - targetCount
            const { data: availableInstances, error: availableError } = await supabase
              .from('AccessoryInstance')
              .select('id')
              .eq('accessoryId', body.id)
              .eq('isAvailable', true)
              .limit(instancesToRemove)
              
            if (availableError) {
              console.error('Failed to fetch available instances:', availableError)
            } else if (availableInstances && availableInstances.length > 0) {
              const idsToRemove = availableInstances.map(instance => instance.id)
              const { error: removeError } = await supabase
                .from('AccessoryInstance')
                .delete()
                .in('id', idsToRemove)
                
              if (removeError) {
                console.error('Failed to remove accessory instances:', removeError)
              }
            }
          }
        }
      }
      
      // Update serialNumbers of existing instances when name changes
      if (payload.name) {
        // Get all current instances to update their serial numbers
        const { data: allInstances, error: allInstancesError } = await supabase
          .from('AccessoryInstance')
          .select('id')
          .eq('accessoryId', body.id)
          .order('id')
          
        if (allInstancesError) {
          console.error('Failed to fetch instances for name update:', allInstancesError)
        } else if (allInstances && allInstances.length > 0) {
          // Update each instance with new serial number
          for (let i = 0; i < allInstances.length; i++) {
            const { error: updateError } = await supabase
              .from('AccessoryInstance')
              .update({ 
                serialNumber: `${payload.name} #${i + 1}` 
              })
              .eq('id', allInstances[i].id)
              
            if (updateError) {
              console.error(`Failed to update serial number for instance ${allInstances[i].id}:`, updateError)
            }
          }
        }
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