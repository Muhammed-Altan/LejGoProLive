// Fallback/compatibility endpoint for availability checking
// This handles /api/check-availability requests and forwards to the main availability checker

export default defineEventHandler(async (event) => {
  console.log('🔄 Compatibility endpoint hit: /api/check-availability - forwarding to main availability checker')
  
  try {
    const body = await readBody(event)
    
    // Forward the request to the main availability checker
    // We'll import and use the same logic
    const { default: mainAvailabilityChecker } = await import('./availability/check.post')
    
    return await mainAvailabilityChecker(event)
  } catch (error) {
    console.error('Compatibility endpoint error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Availability check failed'
    })
  }
})