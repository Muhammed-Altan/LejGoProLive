import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const supabase = createServerSupabaseClient()
    
    // Validate required fields for creation, but allow partial updates
    if (!body.id && (!body.fullName || !body.email || !body.startDate || !body.endDate)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Customer name, email, start date, and end date are required for new bookings'
      })
    }
    
    // Prepare the payload for Supabase - only include fields that are provided
    const payload: any = {}
    
    if (body.fullName) payload.fullName = body.fullName
    if (body.email) payload.email = body.email
    if (body.phone !== undefined) payload.phone = body.phone
    if (body.startDate) payload.startDate = body.startDate
    if (body.endDate) payload.endDate = body.endDate
    if (body.totalPrice !== undefined) payload.totalPrice = body.totalPrice
    if (body.status) payload.status = body.status
    if (body.cameraId !== undefined) payload.cameraId = body.cameraId
    if (body.accessoryInstanceIds !== undefined) payload.accessoryInstanceIds = body.accessoryInstanceIds
    if (body.productName) payload.productName = body.productName
    if (body.accessoryNames !== undefined) payload.accessoryNames = body.accessoryNames
    if (body.deliveryOption) payload.deliveryOption = body.deliveryOption
    if (body.address !== undefined) payload.address = body.address
    if (body.city !== undefined) payload.city = body.city
    if (body.postalCode !== undefined) payload.postalCode = body.postalCode
    if (body.return_processed !== undefined) payload.return_processed = body.return_processed
    
    if (body.id) {
      // Update existing booking
      const { data, error } = await supabase
        .from('Booking')
        .update(payload)
        .eq('id', body.id)
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to update booking: ${error.message}`
        })
      }
      
      return { success: true, data, message: 'Booking updated successfully' }
    } else {
      // Create new booking
      const { data: newBooking, error } = await supabase
        .from('Booking')
        .insert([payload])
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to create booking: ${error.message}`
        })
      }
      
      return { success: true, data: newBooking, message: 'Booking created successfully' }
    }
  } catch (error: any) {
    console.error('Booking creation/update error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to process booking request'
    })
  }
})