export default defineEventHandler(async (event) => {
  // This is a test endpoint that requires authentication
  return {
    message: 'This endpoint is only accessible to authenticated admin users',
    timestamp: new Date().toISOString(),
    success: true
  }
})