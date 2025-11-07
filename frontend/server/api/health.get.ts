export default defineEventHandler(async (event) => {
  return {
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    netlify: process.env.NETLIFY ? 'yes' : 'no'
  }
})