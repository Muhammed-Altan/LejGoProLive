import { ref, computed } from 'vue'

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

interface AvailabilityResponse {
  success: boolean
  data: AvailabilityResult[]
}

interface CacheEntry {
  data: AvailabilityResult[]
  timestamp: number
  ttl: number
}

// Generate cache key for client-side caching
function generateClientCacheKey(
  startDate: string | Date,
  endDate: string | Date,
  productIds: number[],
  accessoryIds: number[]
): string {
  const startStr = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate
  const endStr = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate
  const sortedProductIds = [...productIds].sort()
  const sortedAccessoryIds = [...accessoryIds].sort()
  
  return `client:availability:${startStr}:${endStr}:p${sortedProductIds.join(',')}:a${sortedAccessoryIds.join(',')}`
}

export const useAvailability = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const availabilityResults = ref<AvailabilityResult[]>([])
  
  // Client-side cache - using a Map for better performance
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
      const startDateStr = startDate instanceof Date ? startDate.toISOString() : startDate
      const endDateStr = endDate instanceof Date ? endDate.toISOString() : endDate

      console.log('📡 Making API call for availability check')
      const startTime = performance.now()

      const response = await $fetch<AvailabilityResponse>('/api/availability/check', {
        method: 'POST',
        body: {
          startDate: startDateStr,
          endDate: endDateStr,
          productIds,
          accessoryIds
        }
      })

      const endTime = performance.now()
      console.log(`📡 API call completed in ${Math.round(endTime - startTime)}ms`)

      if (response.success) {
        availabilityResults.value = response.data
        
        // Cache the result
        setInCache(cacheKey, response.data)
        console.log('💾 Cached client-side availability result')
        
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