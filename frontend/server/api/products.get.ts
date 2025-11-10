import { createServerSupabaseClient } from '../utils/supabase'
import { apiCache, createCacheKey } from '../utils/cache'

export default defineEventHandler(async (event) => {
  try {
    // Check cache first (30 minute TTL for products - they rarely change)
    const cacheKey = createCacheKey('products')
    const cachedProducts = apiCache.get(cacheKey)
    
    if (cachedProducts) {
      console.log('📦 Returning cached products')
      return cachedProducts
    }

    const supabase = createServerSupabaseClient()
    
    const { data: products, error } = await supabase
      .from('Product')
      .select('*')
      .order('id')
    
    if (error) {
      throw error
    }

    const result = {
      success: true,
      data: products || []
    }

    // Cache for 30 minutes (1800 seconds)
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