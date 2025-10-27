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

export const useAvailability = () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const availabilityResults = ref<AvailabilityResult[]>([])

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

    loading.value = true
    error.value = null

    try {
      const startDateStr = startDate instanceof Date ? startDate.toISOString() : startDate
      const endDateStr = endDate instanceof Date ? endDate.toISOString() : endDate

      const response = await $fetch<AvailabilityResponse>('/api/availability/check', {
        method: 'POST',
        body: {
          startDate: startDateStr,
          endDate: endDateStr,
          productIds,
          accessoryIds
        }
      })

      if (response.success) {
        availabilityResults.value = response.data
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