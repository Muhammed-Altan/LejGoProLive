// Test endpoint to verify nested API routing works
export default defineEventHandler(async (event) => {
  return {
    success: true,
    message: 'Nested API route works',
    timestamp: new Date().toISOString()
  }
})