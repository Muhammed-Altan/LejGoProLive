import { createServerSupabaseClient } from '../../utils/supabase'

interface AvailabilityRequest {
  startDate: string
  endDate: string
  productIds?: number[]
  accessoryIds?: number[]
}

interface AvailabilityResult {
  productId?: number
  accessoryId?: number
  totalQuantity: number
  availableQuantity: number
  isAvailable: boolean
  conflictingBookings?: Array<{
    startDate: string
    endDate: string
    quantity: number
  }>
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as AvailabilityRequest
    const { startDate, endDate, productIds = [], accessoryIds = [] } = body

    if (!startDate || !endDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Start date and end date are required'
      })
    }

    const supabase = createServerSupabaseClient()
    const results: AvailabilityResult[] = []

    // Check product availability
    for (const productId of productIds) {
      console.log(`🔍 Checking availability for product ${productId}`)
      
      // Get total cameras for this product
      const { data: cameras, error: camerasError } = await supabase
        .from('Camera')
        .select('id')
        .eq('productId', productId)

      if (camerasError) {
        console.error('Error fetching cameras:', camerasError)
        continue
      }

      const totalCameras = cameras?.length || 0
      const cameraIds = cameras?.map(c => c.id) || []
      
      console.log(`📊 Product ${productId}: ${totalCameras} total cameras, IDs: ${cameraIds}`)

      if (cameraIds.length === 0) {
        console.log(`⚠️ No cameras found for product ${productId}`)
        results.push({
          productId,
          totalQuantity: 0,
          availableQuantity: 0,
          isAvailable: false
        })
        continue
      }

      // Get conflicting bookings for this period
      const { data: bookings, error: bookingsError } = await supabase
        .from('Booking')
        .select('cameraId, startDate, endDate, paymentStatus')
        .in('cameraId', cameraIds)
        .neq('paymentStatus', 'cancelled') // Count all bookings except cancelled ones (includes pending, paid, etc.)

      console.log(`📅 Found ${bookings?.length || 0} bookings for cameras ${cameraIds} (excluding cancelled)`)

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
        continue
      }

      console.log(`📅 Found ${bookings?.length || 0} bookings for cameras ${cameraIds.join(',')} (excluding cancelled)`)
      console.log(`📋 Booking details:`, bookings?.map(b => ({
        cameraId: b.cameraId,
        startDate: b.startDate?.substring(0, 10),
        endDate: b.endDate?.substring(0, 10),
        paymentStatus: b.paymentStatus
      })))

      // Calculate how many cameras are booked during the requested period
      const start = new Date(startDate)
      const end = new Date(endDate)
      console.log(`🗓️ Checking period: ${start.toISOString()} to ${end.toISOString()}`)
      
      let bookedCameras = 0
      const conflictingBookings: Array<{ startDate: string; endDate: string; quantity: number }> = []

      bookings?.forEach((booking: any) => {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        
        console.log(`📋 Booking (${booking.paymentStatus}): ${bookingStart.toISOString()} to ${bookingEnd.toISOString()}`)
        
        // Check if booking overlaps with requested period
        if (start <= bookingEnd && end >= bookingStart) {
          // Each booking represents one camera being booked
          bookedCameras += 1
          conflictingBookings.push({
            startDate: booking.startDate,
            endDate: booking.endDate,
            quantity: 1
          })
          console.log(`❌ Conflict found! Booked cameras: ${bookedCameras}`)
        } else {
          console.log(`✅ No conflict with this booking`)
        }
      })

      const availableQuantity = Math.max(0, totalCameras - bookedCameras)
      
      console.log(`📈 Product ${productId} Summary: ${totalCameras} total, ${bookedCameras} booked, ${availableQuantity} available`)

      results.push({
        productId,
        totalQuantity: totalCameras,
        availableQuantity,
        isAvailable: availableQuantity > 0,
        conflictingBookings
      })
    }

    // Check accessory availability
    for (const accessoryId of accessoryIds) {
      console.log(`🔧 Checking availability for accessory ${accessoryId}`)
      
      // Get total accessory instances
      const { data: instances, error: instancesError } = await supabase
        .from('AccessoryInstance')
        .select('id, isAvailable')
        .eq('accessoryId', accessoryId)

      if (instancesError) {
        console.error('Error fetching accessory instances:', instancesError)
        continue
      }

      console.log(`🔧 Accessory ${accessoryId}: ${instances?.length || 0} total instances`)

      if (!instances || instances.length === 0) {
        console.log(`⚠️ No instances found for accessory ${accessoryId}`)
        results.push({
          accessoryId,
          totalQuantity: 0,
          availableQuantity: 0,
          isAvailable: false
        })
        continue
      }

      const availableInstances = instances.filter(i => i.isAvailable)
      const instanceIds = availableInstances.map(i => i.id)
      
      console.log(`🔧 Accessory ${accessoryId}: ${availableInstances.length} instances marked as available, IDs: ${instanceIds}`)

      if (instanceIds.length === 0) {
        console.log(`⚠️ No available instances for accessory ${accessoryId}`)
        results.push({
          accessoryId,
          totalQuantity: instances.length,
          availableQuantity: 0,
          isAvailable: false
        })
        continue
      }

      // Check for booking conflicts on these instances using the Booking table
      const { data: allBookings, error: bookingsError } = await supabase
        .from('Booking')
        .select('accessoryInstanceIds, startDate, endDate, paymentStatus')
        .neq('paymentStatus', 'cancelled')

      console.log(`🔧 Found ${allBookings?.length || 0} total bookings to check for accessory conflicts`)

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
        continue
      }

      // Calculate how many instances are booked during the requested period
      const start = new Date(startDate)
      const end = new Date(endDate)
      console.log(`🔧 Checking accessory period: ${start.toISOString()} to ${end.toISOString()}`)

      const bookedInstanceIds = new Set<number>()
      const conflictingBookings: Array<{ startDate: string; endDate: string; quantity: number }> = []

      allBookings?.forEach((booking: any) => {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        
        // Check if booking overlaps with requested period
        if (start <= bookingEnd && end >= bookingStart) {
          // Check if any of our accessory instances are in this booking's accessoryInstanceIds
          if (booking.accessoryInstanceIds && Array.isArray(booking.accessoryInstanceIds)) {
            instanceIds.forEach(instanceId => {
              if (booking.accessoryInstanceIds.includes(instanceId)) {
                bookedInstanceIds.add(instanceId)
                console.log(`❌ Accessory conflict found! Instance ${instanceId} is booked from ${bookingStart.toISOString()} to ${bookingEnd.toISOString()}`)
              }
            })
          }
        } else {
          console.log(`✅ No date conflict with booking from ${bookingStart.toISOString()} to ${bookingEnd.toISOString()}`)
        }
      })

      const availableQuantity = Math.max(0, availableInstances.length - bookedInstanceIds.size)
      
      console.log(`🔧 Accessory ${accessoryId} Summary: ${instances.length} total, ${availableInstances.length} marked available, ${bookedInstanceIds.size} booked, ${availableQuantity} final available`)

      results.push({
        accessoryId,
        totalQuantity: instances.length,
        availableQuantity,
        isAvailable: availableQuantity > 0,
        conflictingBookings
      })
    }

    return {
      success: true,
      data: results
    }

  } catch (error: any) {
    console.error('Availability check error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to check availability'
    })
  }
})