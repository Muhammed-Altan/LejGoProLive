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
        statusMessage: 'Product name is required'
      })
    }
    
    // Prepare the payload for Supabase (matching your actual table structure)
    const payload = {
      name: body.name,
      features: body.features || '',
      dailyPrice: body.dailyPrice || 0,
      weeklyPrice: body.weeklyPrice || 0,
      twoWeekPrice: body.twoWeekPrice || 0,
      popular: body.popular || false,
      quantity: body.quantity || 1,
      imageUrl: body.imageUrl || null
    }
    
    if (body.id) {
      // Update existing product
      const { data, error } = await supabase
        .from('Product')
        .update(payload)
        .eq('id', body.id)
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to update product: ${error.message}`
        })
      }
      
      // Synchronize cameras with the new quantity
      if (data && payload.quantity !== undefined) {
        // Get current cameras for this product
        const { data: currentCameras, error: camerasError } = await supabase
          .from('Camera')
          .select('id')
          .eq('productId', body.id)
          
        if (camerasError) {
          console.error('Failed to fetch current cameras:', camerasError)
        } else {
          const currentCameraCount = currentCameras?.length || 0
          const newQuantity = payload.quantity
          
          if (newQuantity > currentCameraCount) {
            // Add more cameras
            const camerasToAdd = []
            for (let i = currentCameraCount; i < newQuantity; i++) {
              camerasToAdd.push({
                productId: body.id,
                dailyPrice: payload.dailyPrice,
                weeklyPrice: payload.weeklyPrice,
                twoWeekPrice: payload.twoWeekPrice
              })
            }
            
            if (camerasToAdd.length > 0) {
              const { error: addCameraError } = await supabase
                .from('Camera')
                .insert(camerasToAdd)
                
              if (addCameraError) {
                console.error('Failed to add cameras:', addCameraError)
              }
            }
          } else if (newQuantity < currentCameraCount) {
            // Remove excess cameras (remove from the end)
            const camerasToRemove = currentCameras.slice(newQuantity)
            const cameraIdsToRemove = camerasToRemove.map(cam => cam.id)
            
            if (cameraIdsToRemove.length > 0) {
              const { error: removeCameraError } = await supabase
                .from('Camera')
                .delete()
                .in('id', cameraIdsToRemove)
                
              if (removeCameraError) {
                console.error('Failed to remove cameras:', removeCameraError)
              }
            }
          }
          
          // Update pricing for all remaining cameras
          const { error: updateCameraError } = await supabase
            .from('Camera')
            .update({
              dailyPrice: payload.dailyPrice,
              weeklyPrice: payload.weeklyPrice,
              twoWeekPrice: payload.twoWeekPrice
            })
            .eq('productId', body.id)
            
          if (updateCameraError) {
            console.error('Failed to update camera prices:', updateCameraError)
          }
        }
      }
      
      return { success: true, data, message: 'Product updated successfully' }
    } else {
      // Create new product
      const { data: newProduct, error } = await supabase
        .from('Product')
        .insert([payload])
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to create product: ${error.message}`
        })
      }
      
      // Create cameras for the new product
      if (newProduct && payload.quantity > 0) {
        const cameras = []
        for (let i = 1; i <= payload.quantity; i++) {
          cameras.push({
            productId: newProduct.id,
            dailyPrice: payload.dailyPrice,
            weeklyPrice: payload.weeklyPrice,
            twoWeekPrice: payload.twoWeekPrice
          })
        }
        
        const { error: cameraError } = await supabase
          .from('Camera')
          .insert(cameras)
          
        if (cameraError) {
          console.error('Failed to create cameras for product:', cameraError)
          // Don't throw error here, just log it since the product was created successfully
        }
      }
      
      return { success: true, data: newProduct, message: 'Product created successfully' }
    }
  } catch (error: any) {
    console.error('Product creation/update error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to process product request'
    })
  }
})