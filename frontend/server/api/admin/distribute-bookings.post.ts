import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user - this will throw 401 if token is expired
    const user = authenticateAdmin(event)
    console.log('🔐 Admin authenticated:', user.email)
    
    console.log('🔄 Starting booking distribution...')
    
    const supabase = createServerSupabaseClient()
    
    // Get all products first
    const { data: allProducts, error: productsError } = await supabase
      .from('Product')
      .select('id, name')
      .order('id')
      
    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch products'
      })
    }
    
    // Get all cameras
    const { data: allCameras, error: camerasError } = await supabase
      .from('Camera')
      .select('id, productId')
      .order('id')
      
    if (camerasError) {
      console.error('Error fetching cameras:', camerasError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch cameras'
      })
    }
    
    // Group cameras by productId
    const camerasByProduct: Record<number, any[]> = {}
    for (const camera of allCameras || []) {
      if (!camerasByProduct[camera.productId]) {
        camerasByProduct[camera.productId] = []
      }
      camerasByProduct[camera.productId].push(camera)
    }
    
    console.log('📦 Products:', allProducts?.length || 0)
    console.log('📷 Cameras by product:', Object.keys(camerasByProduct).length)
    
    // Get all bookings
    const { data: allBookings, error: bookingsError } = await supabase
      .from('Booking')
      .select('id, productName, cameraId, startDate, endDate')
      .order('startDate')
      
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch bookings'
      })
    }
    
    console.log('📋 All bookings:', allBookings?.length || 0)
    
    let updatedCount = 0
    
    // Group bookings by product name and redistribute
    for (const product of allProducts || []) {
      const productBookings = allBookings?.filter(b => b.productName === product.name) || []
      const productCameras = camerasByProduct[product.id] || []
      
      if (productBookings.length === 0) {
        console.log(`📦 ${product.name}: No bookings to redistribute`)
        continue
      }
      
      if (productCameras.length === 0) {
        console.log(`📦 ${product.name}: No cameras available`)
        continue
      }
      
      console.log(`📦 ${product.name}: Redistributing ${productBookings.length} bookings across ${productCameras.length} cameras`)
      
      // Sort bookings chronologically
      productBookings.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      
      // Redistribute using round-robin
      for (let i = 0; i < productBookings.length; i++) {
        const booking = productBookings[i]
        const cameraIndex = i % productCameras.length
        const targetCamera = productCameras[cameraIndex]
        
        if (booking.cameraId !== targetCamera.id) {
          console.log(`🔄 Moving booking ${booking.id} from camera ${booking.cameraId} to camera ${targetCamera.id} (${product.name})`)
          
          const { error: updateError } = await supabase
            .from('Booking')
            .update({
              cameraId: targetCamera.id,
              cameraName: `Kamera ${cameraIndex + 1}`
            })
            .eq('id', booking.id)
            
          if (updateError) {
            console.error(`❌ Failed to update booking ${booking.id}:`, updateError)
            throw createError({
              statusCode: 500,
              statusMessage: `Failed to update booking ${booking.id}: ${updateError.message}`
            })
          } else {
            console.log(`✅ Updated booking ${booking.id}`)
            updatedCount++
          }
        } else {
          console.log(`✓ Booking ${booking.id} already correctly assigned to camera ${targetCamera.id}`)
        }
      }
    }
    
    console.log('✅ Distribution complete!')
    
    return {
      success: true,
      message: 'Bookings redistributed successfully',
      updatedCount,
      totalProducts: allProducts?.length || 0,
      totalBookings: allBookings?.length || 0
    }
    
  } catch (error: any) {
    console.error('Error redistributing bookings:', error)
    
    // If it's already a createError, just re-throw it
    if (error.statusCode) {
      throw error
    }
    
    // Otherwise, create a generic server error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to redistribute bookings'
    })
  }
})