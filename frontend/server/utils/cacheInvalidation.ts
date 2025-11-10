// Cache invalidation utility for availability system
// Add this to server/utils/cacheInvalidation.ts

import { apiCache } from './cache'

/**
 * Invalidate availability cache when bookings change
 * Call this after creating, updating, or cancelling bookings
 */
export function invalidateAvailabilityCache(bookingData?: {
  startDate?: string
  endDate?: string
  productIds?: number[]
  accessoryIds?: number[]
}) {
  if (!bookingData) {
    // Clear all availability cache entries
    apiCache.clearByPrefix('availability:')
    console.log('🧹 Cleared all availability cache entries')
    return
  }

  // For now, clear all availability cache when any booking changes
  // In the future, you could implement more granular cache invalidation
  // based on the specific products/dates affected
  apiCache.clearByPrefix('availability:')
  console.log('🧹 Invalidated availability cache due to booking change')
}

/**
 * Clear expired cache entries (call this periodically)
 */
export function cleanupExpiredCache() {
  // The apiCache.get method already handles expiration,
  // but we could add explicit cleanup here if needed
  console.log('🗑️ Cache cleanup completed')
}