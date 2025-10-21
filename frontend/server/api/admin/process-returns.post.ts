import { createClient } from '@supabase/supabase-js'
import { authenticateAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  // Authenticate admin user
  const user = authenticateAdmin(event)
  
  // Use runtime config when available (Nuxt) but fall back to env
  const config = (typeof useRuntimeConfig === 'function') ? useRuntimeConfig() : (globalThis as any).__RUNTIME_CONFIG__ || {}
  const supabaseUrl = config.public?.supabaseUrl || process.env.SUPABASE_URL
  const serviceRoleKey = config.supabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    return createError({ statusCode: 500, statusMessage: 'Missing SUPABASE_URL' })
  }

  if (!serviceRoleKey) {
    return createError({ statusCode: 500, statusMessage: 'Missing Supabase service role key' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  // Cutoff: bookings that ended at least 3 days ago
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Find bookings that ended <= cutoff and are not yet processed
    // Allow return_processed = false OR null (not set)
    const { data: bookings, error: fetchErr } = await supabase
      .from('Booking')
      .select('id, cameraId, accessoryInstanceIds')
      .lte('endDate', cutoff)
      .or('return_processed.eq.false,return_processed.is.null')

    if (fetchErr) throw fetchErr

    if (!bookings || bookings.length === 0) {
      return { processedBookings: 0, message: 'No bookings to process' }
    }

    const bookingIds: any[] = []
    const cameraIds: number[] = []
    const accessoryInstanceIds: number[] = []

    for (const b of bookings) {
      bookingIds.push(b.id)
      if (b.cameraId) cameraIds.push(b.cameraId)
      // accessoryInstanceIds may be null, an array, or JSON string
      if (b.accessoryInstanceIds) {
        if (Array.isArray(b.accessoryInstanceIds)) {
          accessoryInstanceIds.push(...b.accessoryInstanceIds.filter((x: any) => !!x))
        } else if (typeof b.accessoryInstanceIds === 'string') {
          try {
            const parsed = JSON.parse(b.accessoryInstanceIds)
            if (Array.isArray(parsed)) accessoryInstanceIds.push(...parsed.filter((x: any) => !!x))
          } catch (e) {
            // ignore parse errors
          }
        }
      }
    }

    // Deduplicate ids
    const uniqCameraIds = Array.from(new Set(cameraIds))
    const uniqAccessoryInstanceIds = Array.from(new Set(accessoryInstanceIds))

    // Update Camera instances to be available again
    let camerasUpdated = 0
    if (uniqCameraIds.length) {
      const { error: camErr } = await supabase
        .from('Camera')
        .update({ isAvailable: true })
        .in('id', uniqCameraIds)
      if (camErr) throw camErr
      camerasUpdated = uniqCameraIds.length
    }

    // Update AccessoryInstance rows to be available again
    let accessoriesUpdated = 0
    if (uniqAccessoryInstanceIds.length) {
      const { error: accErr } = await supabase
        .from('AccessoryInstance')
        .update({ isAvailable: true })
        .in('id', uniqAccessoryInstanceIds)
      if (accErr) throw accErr
      accessoriesUpdated = uniqAccessoryInstanceIds.length
    }

    // Mark bookings as processed
    const { error: markErr } = await supabase
      .from('Booking')
      .update({ return_processed: true })
      .in('id', bookingIds)
    if (markErr) throw markErr

    return {
      processedBookings: bookingIds.length,
      camerasMadeAvailable: camerasUpdated,
      accessoryInstancesMadeAvailable: accessoriesUpdated,
    }
  } catch (err: any) {
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Error processing returns' })
  }
})
