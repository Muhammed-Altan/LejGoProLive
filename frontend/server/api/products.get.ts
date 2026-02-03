import { createServerSupabaseClient } from '../utils/supabase'
import { apiCache, createCacheKey } from '../utils/cache'

/**
 * GET /api/products
 * 
 * Fetch all products from database
 * 
 * Features:
 * - Server-side caching (30 min TTL) - products rarely change
 * - Returns all product details (name, price, features, image)
 * 
 * Used by:
 * - Homepage product cards
 * - Checkout product selection
 * - Admin panel product management
 * 
 * @returns Array of products with success flag
 */
export default defineEventHandler(async (event) => {
  try {
    // Check server-side cache first (30 minute TTL)
    const cacheKey = createCacheKey('products')
    const cachedProducts = apiCache.get(cacheKey)
    
    if (cachedProducts) {
      console.log('📦 Returning cached products')
      return cachedProducts
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient()
    
    // Query all products from database, ordered by ID
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .order('id')
    
    // Handle database errors
    if (error) {
      throw error
    }

    // Build response object
    const result = {
      success: true,
      data: products || []
    }

    // Cache for 30 minutes (products don't change frequently)
    apiCache.set(cacheKey, result, 1800)
    console.log('📦 Cached products for 30 minutes')
    
    return result

  } catch (error: any) {
    console.error('Error fetching products:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to fetch products'
    })
  }
})