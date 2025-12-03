import { apiCache, createCacheKey } from '../../utils/cache'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const query = getQuery(event)
    const { postalCode, countryCode = 'DK', numberOfServicePoints = '10' } = query

    // Validation
    if (!postalCode || typeof postalCode !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Postal code is required'
      })
    }

    // Validate Danish postal code format
    if (!/^\d{4}$/.test(postalCode)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid postal code format. Expected 4 digits.'
      })
    }

    // Check cache first (1 hour TTL for service points)
    const cacheKey = createCacheKey('postnord-servicepoints', postalCode, countryCode as string)
    const cachedData = apiCache.get(cacheKey)
    
    if (cachedData) {
      console.log(`📦 Returning cached service points for ${postalCode}`)
      return cachedData
    }

    // Call PostNord API
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

    console.log(`🔍 Fetching PostNord service points for postal code: ${postalCode}`)
    
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
