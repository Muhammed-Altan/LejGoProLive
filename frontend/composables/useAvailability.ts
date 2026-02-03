/**
 * Availability Composable
 * 
 * Manages real-time product availability checking with client and server caching
 * 
 * Performance Features:
 * - Client-side cache (2 minutes TTL) - instant results for repeated checks
 * - Server-side cache (5 minutes TTL) - reduced database load
 * - Detailed timing metrics for performance monitoring
 * 
 * How It Works:
 * 1. User selects dates and products
 * 2. Check client cache first (fast)
 * 3. If not cached, call /api/availability/check
 * 4. Server checks cache, then queries database if needed
 * 5. Returns availability status + conflicting bookings
 * 
 * Used by:
 * - ProductStep.vue (date picker validation)
 * - ProductCalendar.vue (visual availability)
 * - Checkout flow (pre-booking validation)
 */

import { ref, computed } from 'vue'

/**
 * Availability result for a single product or accessory
 */
interface AvailabilityResult {
  productId?: number       // For GoPro cameras
  accessoryId?: number     // For accessories
  totalQuantity: number    // Total in inventory
  availableQuantity: number // Available for selected dates
  isAvailable: boolean     // True if any quantity available
  conflictingBookings?: Array<{  // Optional: show which bookings conflict
    startDate: string
    endDate: string
    quantity: number
  }>
}

/**
 * API response from /api/availability/check
 */
interface AvailabilityResponse {
  success: boolean
  data: AvailabilityResult[]
  timing?: {               // Optional performance metrics
    requestParsing: number
    cacheKeyGeneration: number
    cacheCheck: number
    cameraQuery: number
    bookingQuery: number
    accessoryInstanceQueries: number
    accessoryBookingQueries: number
    dataProcessing: number
    cacheStorage: number
    totalDbTime: number
    totalRequestTime: number
  }
}

/**
 * Client-side cache entry
 * Stores availability results with TTL for fast repeated checks
 */
interface CacheEntry {
  data: AvailabilityResult[]
  timestamp: number        // When cached (ms since epoch)
  ttl: number             // Time to live in milliseconds
}

/**
 * Generate cache key for client-side caching
 * Format: "client:availability:{startDate}:{endDate}:p{productIds}:a{accessoryIds}"
 * 
 * Example: "client:availability:2024-06-01:2024-06-07:p5,6:a1,2,3"
 * 
 * @param startDate - Rental start date
 * @param endDate - Rental end date
 * @param productIds - Array of GoPro product IDs
 * @param accessoryIds - Array of accessory IDs
 * @returns Unique cache key string
 */
function generateClientCacheKey(
  startDate: string | Date,
  endDate: string | Date,
  productIds: number[],
  accessoryIds: number[]
): string {
  // Normalize dates to YYYY-MM-DD format
  const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate
  const endStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate
  // Sort IDs to ensure consistent cache keys (e.g., [5,6] and [6,5] produce same key)
  const sortedProductIds = [...productIds].sort()
  const sortedAccessoryIds = [...accessoryIds].sort()
  
  return `client:availability:${startStr}:${endStr}:p${sortedProductIds.join(',')}:a${sortedAccessoryIds.join(',')}`
}

/**
 * Availability composable export
 */
export const useAvailability = () => {
  // Loading state - true while checking availability
  const loading = ref(false)
  // Error message if availability check fails
  const error = ref<string | null>(null)
  // Array of availability results for all checked products/accessories
  const availabilityResults = ref<AvailabilityResult[]>([])
  
  // Client-side cache - Map provides O(1) lookup performance
  // Key: generated cache key, Value: {data, timestamp, ttl}
  const clientCache = new Map<string, CacheEntry>()
  const CACHE_TTL = 2 * 60 * 1000 // 2 minutes in milliseconds

  /**
   * Get data from client cache
   */
  const getFromCache = (cacheKey: string): AvailabilityResult[] | null => {
    const entry = clientCache.get(cacheKey)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      clientCache.delete(cacheKey)
      return null
    }

    return entry.data
  }

  /**
   * Set data in client cache
   */
  const setInCache = (cacheKey: string, data: AvailabilityResult[]): void => {
    clientCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    })
  }

  /**
   * Check availability for products and accessories
   */
  const checkAvailability = async (
    startDate: string | Date,
    endDate: string | Date,
    productIds: number[] = [],
    accessoryIds: number[] = []
  ): Promise<AvailabilityResult[]> => {
    if (!startDate || !endDate) {
      error.value = 'Start date and end date are required'
      return []
    }

    // Generate cache key
    const cacheKey = generateClientCacheKey(startDate, endDate, productIds, accessoryIds)
    
    // Check client cache first
    const cachedResult = getFromCache(cacheKey)
    if (cachedResult) {
      console.log('🚀 Client cache hit for availability check')
      availabilityResults.value = cachedResult
      return cachedResult
    }

    loading.value = true
    error.value = null

    try {
      const prepStartTime = performance.now()
      
      // Validate input parameters
      if (!startDate || !endDate) {
        console.error('❌ Missing date parameters:', { startDate, endDate })
        throw new Error('Start date and end date are required')
      }
      
      const startDateStr = startDate instanceof Date ? startDate.toISOString() : startDate
      const endDateStr = endDate instanceof Date ? endDate.toISOString() : endDate
      
      // Validate converted dates
      if (!startDateStr || !endDateStr) {
        console.error('❌ Failed to convert dates:', { 
          originalStart: startDate, 
          originalEnd: endDate,
          convertedStart: startDateStr,
          convertedEnd: endDateStr
        })
        throw new Error('Invalid date format')
      }

      const prepEndTime = performance.now()
      console.log(`🔧 Data preparation: ${(prepEndTime - prepStartTime).toFixed(2)}ms`)
      
      console.log('📡 Making API call for availability check')
      
      // Debug: Log all parameters being sent
      console.log('🔍 Request parameters:', {
        startDate: startDateStr,
        endDate: endDateStr,
        productIds,
        accessoryIds,
        startDateType: typeof startDateStr,
        endDateType: typeof endDateStr,
        productIdsType: typeof productIds,
        accessoryIdsType: typeof accessoryIds
      })
      
      const networkStartTime = performance.now()

      const response = await $fetch<AvailabilityResponse>('/api/availability/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: startDateStr,
          endDate: endDateStr,
          productIds,
          accessoryIds
        })
      })

      const networkEndTime = performance.now()
      const networkDuration = networkEndTime - networkStartTime
      console.log(`🌐 Network request: ${networkDuration.toFixed(2)}ms`)

      const processingStartTime = performance.now()
      
      if (response.success) {
        availabilityResults.value = response.data
        
        // Cache the result
        setInCache(cacheKey, response.data)
        
        const processingEndTime = performance.now()
        const processingDuration = processingEndTime - processingStartTime
        
        console.log(`⚙️ Response processing: ${processingDuration.toFixed(2)}ms`)
        console.log(`💾 Client-side caching completed`)
        console.log(`📡 API call completed in ${networkDuration.toFixed(2)}ms`)
        console.log(`🔄 Total client processing: ${(prepEndTime - prepStartTime + processingDuration).toFixed(2)}ms`)
        
        // Show detailed timing breakdown if available
        if (response.timing) {
          const timing = response.timing;
          
          // Calculate parallel execution analysis
          const productQueryTime = timing.cameraQuery + timing.bookingQuery;
          const accessoryQueryTime = timing.accessoryInstanceQueries + timing.accessoryBookingQueries;
          const actualParallelTime = Math.max(productQueryTime, accessoryQueryTime);
          const sequentialTime = productQueryTime + accessoryQueryTime;
          const parallelSavings = sequentialTime - actualParallelTime;
          
          console.log(`🕐 DETAILED TIMING BREAKDOWN:`);
          console.log(`CLIENT-SIDE: Data prep: ${(prepEndTime - prepStartTime).toFixed(2)}ms, Network: ${networkDuration.toFixed(2)}ms, Processing: ${processingDuration.toFixed(2)}ms`);
          console.log(`SERVER-SIDE: Camera: ${timing.cameraQuery}ms, Booking: ${timing.bookingQuery}ms, AccInstance: ${timing.accessoryInstanceQueries}ms, AccBooking: ${timing.accessoryBookingQueries}ms`);
          console.log(`PARALLEL ANALYSIS: Product queries: ${productQueryTime}ms, Accessory queries: ${accessoryQueryTime}ms`);
          console.log(`OPTIMIZATION: Parallel time: ${actualParallelTime}ms, Sequential would be: ${sequentialTime}ms, Saved: ${parallelSavings}ms`);
          console.log(`TOTALS: DB time: ${timing.totalDbTime}ms, Server time: ${timing.totalRequestTime}ms, Client time: ${networkDuration.toFixed(2)}ms`);
        }
        
        return response.data
      } else {
        throw new Error('Failed to check availability')
      }
    } catch (err: any) {
      console.error('Error checking availability:', err)
      error.value = err.message || 'Failed to check availability'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get availability for a specific product
   */
  const getProductAvailability = (productId: number): AvailabilityResult | null => {
    const result = availabilityResults.value.find(result => result.productId === productId) || null
    return result
  }

  /**
   * Get availability for a specific accessory
   */
  const getAccessoryAvailability = (accessoryId: number): AvailabilityResult | null => {
    const result = availabilityResults.value.find(result => result.accessoryId === accessoryId) || null
    return result
  }

  /**
   * Check if a product is available in the requested quantity
   */
  const isProductAvailable = (productId: number, requestedQuantity: number = 1): boolean => {
    const result = getProductAvailability(productId)
    return result ? result.availableQuantity >= requestedQuantity : false
  }

  /**
   * Check if an accessory is available in the requested quantity
   */
  const isAccessoryAvailable = (accessoryId: number, requestedQuantity: number = 1): boolean => {
    const result = getAccessoryAvailability(accessoryId)
    return result ? result.availableQuantity >= requestedQuantity : false
  }

  /**
   * Get maximum available quantity for a product
   */
  const getMaxProductQuantity = (productId: number): number => {
    const result = getProductAvailability(productId)
    return result ? result.availableQuantity : 0
  }

  /**
   * Get maximum available quantity for an accessory
   */
  const getMaxAccessoryQuantity = (accessoryId: number): number => {
    const result = getAccessoryAvailability(accessoryId)
    return result ? result.availableQuantity : 0
  }

  /**
   * Get detailed availability information for display
   */
  const getAvailabilityMessage = (productId: number): string => {
    const result = getProductAvailability(productId)
    if (!result) return 'Availability unknown'
    
    if (result.availableQuantity === 0) {
      return 'Not available for selected dates'
    } else if (result.availableQuantity === 1) {
      return `${result.availableQuantity} available`
    } else {
      return `${result.availableQuantity} available`
    }
  }

  /**
   * Clear all availability data
   */
  const clearAvailability = () => {
    availabilityResults.value = []
    error.value = null
    clientCache.clear()
    console.log('🧹 Cleared availability data and client cache')
  }

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    availabilityResults: readonly(availabilityResults),
    
    // Methods
    checkAvailability,
    getProductAvailability,
    getAccessoryAvailability,
    isProductAvailable,
    isAccessoryAvailable,
    getMaxProductQuantity,
    getMaxAccessoryQuantity,
    getAvailabilityMessage,
    clearAvailability
  }
}