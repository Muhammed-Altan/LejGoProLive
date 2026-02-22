import { apiCache, createCacheKey } from '../../utils/cache'

/**
 * GET /api/postnord/service-points
 * 
 * Find nearby PostNord service points (pakkeshops) based on address
 * 
 * Query Parameters:
 * - postalCode (required): 4-digit Danish postal code
 * - city (optional): City name for more precise results
 * - streetName (optional): Street name
 * - streetNumber (optional): Street number
 * - countryCode (optional): Default 'DK'
 * - numberOfServicePoints (optional): Default '10'
 * 
 * Features:
 * - Validates postal code format (4 digits)
 * - Caches results for 1 hour to reduce API calls
 * - Returns sorted list by distance
 * - Includes full address and opening hours
 * 
 * Used by:
 * - ServicePointSelector.vue in checkout flow
 * 
 * @returns Array of service points with addresses and distances
 */
export default defineEventHandler(async (event) => {
  try {
    // Get runtime config for PostNord API key
    const config = useRuntimeConfig()
    // Parse query parameters from request
    const query = getQuery(event)
    const { postalCode, city, streetName, streetNumber, countryCode = 'DK', numberOfServicePoints = '10' } = query

    // Validate required postal code parameter
    if (!postalCode || typeof postalCode !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Postal code is required'
      })
    }

    // Validate Danish postal code format (must be exactly 4 digits)
    // Example valid: 2300, 8000, 1000
    // Example invalid: 230, 23000, abcd
    if (!/^\d{4}$/.test(postalCode)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid postal code format. Expected 4 digits.'
      })
    }

    // Check server-side cache first (1 hour TTL)
    // Service points rarely change, so caching saves API calls and improves response time
    // Cache key includes address for location-specific results
    const cacheKey = createCacheKey('postnord-servicepoints', postalCode, city as string || '', streetName as string || '', countryCode as string)
    const cachedData = apiCache.get(cacheKey)
    
    if (cachedData) {
      console.log(`📦 Returning cached service points for ${postalCode}`)
      return cachedData
    }

    // Call PostNord Business Location API v5
    // Returns nearest service points sorted by distance
    const apiUrl = `https://api2.postnord.com/rest/businesslocation/v5/servicepoints/nearest/byaddress`
    const params = new URLSearchParams({
      apikey: String(config.postNordApiKey),
      returnType: 'json',
      countryCode: countryCode as string,
      postalCode: postalCode as string,
      numberOfServicePoints: numberOfServicePoints as string,
      srId: 'EPSG:4326',
      context: 'optionalservicepoint',
      responseFilter: 'public'
    })

    // Add optional address parameters for more precise location
    if (city) {
      params.append('city', String(city))
    }
    if (streetName) {
      params.append('streetName', String(streetName))
    }
    if (streetNumber) {
      params.append('streetNumber', String(streetNumber))
    }

    console.log(`🔍 Fetching PostNord service points for: ${streetName || ''} ${streetNumber || ''}, ${postalCode} ${city || ''}`)
    
    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Consumer-ID': String(config.postNordConsumerId)
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('PostNord API error:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `PostNord API error: ${response.statusText}`
      })
    }

    const data = await response.json()
    
    // Transform the response to a simpler format
    const servicePoints = data.servicePointInformationResponse?.servicePoints || []
    const simplified = servicePoints.map((sp: any) => ({
      id: sp.servicePointId,
      name: sp.name,
      address: {
        street: sp.visitingAddress?.streetName,
        streetNumber: sp.visitingAddress?.streetNumber,
        postalCode: sp.visitingAddress?.postalCode,
        city: sp.visitingAddress?.city,
        countryCode: sp.visitingAddress?.countryCode
      },
      coordinates: {
        latitude: sp.coordinate?.northing,
        longitude: sp.coordinate?.easting
      },
      openingHours: sp.openingHours || [],
      distance: sp.routeDistance // Distance in meters
    }))

    const result = {
      success: true,
      data: simplified
    }

    // Cache for 1 hour (3600 seconds)
    apiCache.set(cacheKey, result, 3600)
    console.log(`✅ Cached ${simplified.length} service points for ${postalCode}`)

    return result

  } catch (error: any) {
    console.error('Error fetching PostNord service points:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to fetch service points'
    })
  }
})
