import { createServerSupabaseClient } from '../../utils/supabase'
import { apiCache, createCacheKey } from '../../utils/cache'

interface AvailabilityRequest {
  startDate: string
  endDate: string
  productIds?: number[]
  accessoryIds?: number[]
  cacheBypass?: number // For testing purposes
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
  const requestStartTime = Date.now();
  console.log(`🚀 [${requestStartTime}] Availability check request started`);
  
  // Log request details for debugging
  console.log('📋 Request details:', {
    method: event.node.req.method,
    url: event.node.req.url,
    headers: {
      'content-type': event.node.req.headers['content-type'],
      'content-length': event.node.req.headers['content-length'],
      'user-agent': event.node.req.headers['user-agent']?.substring(0, 50) + '...',
      'host': event.node.req.headers['host'],
      'x-forwarded-for': event.node.req.headers['x-forwarded-for'],
      'origin': event.node.req.headers['origin']
    }
  });
  
  // Check if this request has any headers at all (might be internal/cached)
  const hasHeaders = Object.keys(event.node.req.headers || {}).length > 0;
  if (!hasHeaders) {
    console.error('❌ Request has no headers - likely internal/cached request');
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request - no headers present'
    });
  }
  
  // Check if this is a GET request (which would be cached and have no body)
  if (event.node.req.method !== 'POST') {
    console.error('❌ Invalid method for availability check:', event.node.req.method);
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed - POST required'
    });
  }
  
  // Track detailed timing for response
  const timingBreakdown = {
    requestParsing: 0,
    cacheKeyGeneration: 0,
    cacheCheck: 0,
    cameraQuery: 0,
    bookingQuery: 0,
    accessoryInstanceQueries: 0,
    accessoryBookingQueries: 0,
    dataProcessing: 0,
    cacheStorage: 0,
    totalDbTime: 0,
    totalRequestTime: 0
  };
  
  try {
    const parseStartTime = Date.now();
    
    // Check if the event is valid
    if (!event || !event.node || !event.node.req) {
      console.error('❌ Invalid event object');
      throw createError({
        statusCode: 500,
        statusMessage: 'Internal server error - invalid request event'
      });
    }
    
    // Log raw body for debugging
    let rawBody;
    try {
      rawBody = await readBody(event);
      console.log('📦 Raw request body:', JSON.stringify(rawBody, null, 2));
    } catch (bodyError) {
      console.error('❌ Failed to read request body:', bodyError);
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to parse request body'
      });
    }
    
    const body = rawBody as AvailabilityRequest
    
    // Validate that body exists and has required properties
    if (!body) {
      console.error('❌ Request body is undefined or null');
      throw createError({
        statusCode: 400,
        statusMessage: 'Request body is required'
      });
    }
    
    if (!body.startDate || !body.endDate) {
      console.error('❌ Missing required date parameters', { body });
      throw createError({
        statusCode: 400,
        statusMessage: 'startDate and endDate are required'
      });
    }
    
    const { startDate, endDate, productIds = [], accessoryIds = [], cacheBypass } = body
    const parseEndTime = Date.now();
    timingBreakdown.requestParsing = parseEndTime - parseStartTime;
    console.log(`📥 Request parsing: ${timingBreakdown.requestParsing}ms`);
    console.log(`📅 Date range: ${startDate} to ${endDate}`);
    console.log(`🎥 Product IDs: ${productIds.length ? productIds.join(', ') : 'none'}`);
    console.log(`🔧 Accessory IDs: ${accessoryIds.length ? accessoryIds.join(', ') : 'none'}`);

    if (!startDate || !endDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Start date and end date are required'
      })
    }

    // Create a cache key based on the request parameters
    const cacheKeyStartTime = Date.now();
    const cacheKey = createCacheKey(
      'availability',
      startDate,
      endDate,
      productIds.sort().join(','),
      accessoryIds.sort().join(',')
    )
    const cacheKeyEndTime = Date.now();
    timingBreakdown.cacheKeyGeneration = cacheKeyEndTime - cacheKeyStartTime;
    console.log(`🔑 Cache key generation: ${timingBreakdown.cacheKeyGeneration}ms`);

    // Check cache first (skip if cacheBypass is provided for testing)
    if (!cacheBypass) {
      const cacheCheckStartTime = Date.now();
      const cachedResult = apiCache.get<{ success: boolean; data: AvailabilityResult[] }>(cacheKey)
      const cacheCheckEndTime = Date.now();
      timingBreakdown.cacheCheck = cacheCheckEndTime - cacheCheckStartTime;
      console.log(`💾 Cache check: ${timingBreakdown.cacheCheck}ms`);
      
      if (cachedResult) {
        console.log(`🚀 Cache hit for availability check: ${cacheKey}`)
        timingBreakdown.totalRequestTime = Date.now() - requestStartTime;
        console.log(`⚡ Total request time (cached): ${timingBreakdown.totalRequestTime}ms`);
        return cachedResult
      }
    } else {
      console.log(`⏭️ Cache bypass requested for testing: ${cacheKey}`)
    }

    console.log(`🔍 Cache miss, performing availability check: ${cacheKey}`)
    const dbStartTime = Date.now();

    const supabase = createServerSupabaseClient()
    const results: AvailabilityResult[] = []

    // PARALLEL OPTIMIZATION: Run camera/booking queries and accessory queries in parallel
    const [productData, accessoryData] = await Promise.all([
      // Product queries (camera → booking dependent chain)
      (async () => {
        let allCameras: Array<{id: number, productId: number}> = [];
        let allBookings: Array<{cameraId: number, startDate: string, endDate: string, paymentStatus: string}> = [];
        
        if (productIds.length > 0) {
          const cameraQueryStart = Date.now();
          const { data: camerasData, error: camerasError } = await supabase
            .from('Camera')
            .select('id, productId')
            .in('productId', productIds);
          const cameraQueryEnd = Date.now();
          timingBreakdown.cameraQuery = cameraQueryEnd - cameraQueryStart;
            
          if (camerasError) {
            console.error('Error fetching cameras:', camerasError);
          } else {
            allCameras = camerasData || [];
            const allCameraIds = allCameras.map(c => c.id);
            
            if (allCameraIds.length > 0) {
              const bookingQueryStart = Date.now();
              const { data: bookingsData, error: bookingsError } = await supabase
                .from('Booking')
                .select('cameraId, startDate, endDate, paymentStatus')
                .in('cameraId', allCameraIds)
                .neq('paymentStatus', 'cancelled');
              const bookingQueryEnd = Date.now();
              timingBreakdown.bookingQuery = bookingQueryEnd - bookingQueryStart;
                
              if (bookingsError) {
                console.error('Error fetching bookings:', bookingsError);
              } else {
                allBookings = bookingsData || [];
              }
            }
          }
        }
        
        return { allCameras, allBookings };
      })(),
      
      // Accessory queries (instance → booking dependent chain)  
      (async () => {
        let allAccessoryInstances: Array<{id: number, accessoryId: number, isAvailable: boolean}> = [];
        let allAccessoryBookings: Array<{accessoryInstanceIds: number[], startDate: string, endDate: string, paymentStatus: string}> = [];
        
        if (accessoryIds.length > 0) {
          const accessoryInstanceQueryStart = Date.now();
          const { data: instancesData, error: instancesError } = await supabase
            .from('AccessoryInstance')
            .select('id, accessoryId, isAvailable')
            .in('accessoryId', accessoryIds);
          const accessoryInstanceQueryEnd = Date.now();
          timingBreakdown.accessoryInstanceQueries = accessoryInstanceQueryEnd - accessoryInstanceQueryStart;
            
          if (instancesError) {
            console.error('Error fetching accessory instances:', instancesError);
          } else {
            allAccessoryInstances = instancesData || [];
            
            const accessoryBookingQueryStart = Date.now();
            const { data: bookingsData, error: bookingsError } = await supabase
              .from('Booking')
              .select('accessoryInstanceIds, startDate, endDate, paymentStatus')
              .neq('paymentStatus', 'cancelled')
              .gte('endDate', startDate)
              .lte('startDate', endDate)
              .not('accessoryInstanceIds', 'is', null);
            const accessoryBookingQueryEnd = Date.now();
            timingBreakdown.accessoryBookingQueries = accessoryBookingQueryEnd - accessoryBookingQueryStart;
              
            if (bookingsError) {
              console.error('Error fetching accessory bookings:', bookingsError);
            } else {
              allAccessoryBookings = bookingsData || [];
            }
          }
        }
        
        return { allAccessoryInstances, allAccessoryBookings };
      })()
    ]);

    // Extract results from parallel execution
    const { allCameras, allBookings } = productData;
    const { allAccessoryInstances, allAccessoryBookings } = accessoryData;
    
    const processingStartTime = Date.now();
    console.log(`⚙️ Starting data processing...`);

    // Now process each product using the batched data
    for (const productId of productIds) {
      const cameras = allCameras.filter(c => c.productId === productId);
      const totalCameras = cameras.length;
      const cameraIds = cameras.map(c => c.id);

      if (cameraIds.length === 0) {
        results.push({
          productId,
          totalQuantity: 0,
          availableQuantity: 0,
          isAvailable: false
        })
        continue
      }

      // Use pre-fetched booking data instead of individual queries
      const bookings = allBookings.filter(b => cameraIds.includes(b.cameraId));

      // Calculate how many cameras are booked during the requested period
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      let bookedCameras = 0
      const conflictingBookings: Array<{ startDate: string; endDate: string; quantity: number }> = []

      // Optimized loop - removed verbose logging
      for (const booking of bookings) {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        
        // Check if booking overlaps with requested period
        if (start <= bookingEnd && end >= bookingStart) {
          bookedCameras += 1
          conflictingBookings.push({
            startDate: booking.startDate,
            endDate: booking.endDate,
            quantity: 1
          })
        }
      }

      const availableQuantity = Math.max(0, totalCameras - bookedCameras)

      results.push({
        productId,
        totalQuantity: totalCameras,
        availableQuantity,
        isAvailable: availableQuantity > 0,
        conflictingBookings
      })
    }

    // Now process each accessory using the batched data
    for (const accessoryId of accessoryIds) {
      // Use pre-fetched accessory instances instead of individual queries
      const instances = allAccessoryInstances.filter(i => i.accessoryId === accessoryId);

      if (!instances || instances.length === 0) {
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

      if (instanceIds.length === 0) {
        results.push({
          accessoryId,
          totalQuantity: instances.length,
          availableQuantity: 0,
          isAvailable: false
        })
        continue
      }

      // Calculate how many instances are booked during the requested period
      const start = new Date(startDate)
      const end = new Date(endDate)
      const bookedInstanceIds = new Set<number>()
      const conflictingBookings: Array<{ startDate: string; endDate: string; quantity: number }> = []

      // Optimized loop - removed verbose logging
      for (const booking of allAccessoryBookings) {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        
        // Check if booking overlaps with requested period
        if (start <= bookingEnd && end >= bookingStart) {
          // Check if any of our accessory instances are in this booking's accessoryInstanceIds
          if (booking.accessoryInstanceIds && Array.isArray(booking.accessoryInstanceIds)) {
            for (const instanceId of instanceIds) {
              if (booking.accessoryInstanceIds.includes(instanceId)) {
                bookedInstanceIds.add(instanceId)
              }
            }
          }
        }
      }

      const availableQuantity = Math.max(0, availableInstances.length - bookedInstanceIds.size)

      results.push({
        accessoryId,
        totalQuantity: instances.length,
        availableQuantity,
        isAvailable: availableQuantity > 0,
        conflictingBookings
      })
    }

    const processingEndTime = Date.now();
    timingBreakdown.dataProcessing = processingEndTime - processingStartTime;
    
    console.log(`⚙️ Data processing completed in: ${timingBreakdown.dataProcessing}ms`);

    const finalResult = {
      success: true,
      data: results,
      timing: timingBreakdown // Add timing info to response
    }

    // Cache the result for 2 minutes (120 seconds), but skip if cacheBypass is used
    const cacheStoreStartTime = Date.now();
    if (!cacheBypass) {
      apiCache.set(cacheKey, finalResult, 120)
      const cacheStoreEndTime = Date.now();
      timingBreakdown.cacheStorage = cacheStoreEndTime - cacheStoreStartTime;
      console.log(`💾 Cache storage: ${timingBreakdown.cacheStorage}ms`);
      console.log(`💾 Cached availability result: ${cacheKey}`)
    } else {
      console.log(`⏭️ Skipping cache storage due to bypass flag`)
    }

    timingBreakdown.totalDbTime = Date.now() - dbStartTime;
    timingBreakdown.totalRequestTime = Date.now() - requestStartTime;
    
    console.log(`🗄️ Total database operations: ${timingBreakdown.totalDbTime}ms`);
    console.log(`⚡ Total request time: ${timingBreakdown.totalRequestTime}ms`);

    return finalResult

  } catch (error: any) {
    console.error('Availability check error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to check availability'
    })
  }
})