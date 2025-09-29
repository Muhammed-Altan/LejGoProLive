export default defineEventHandler(async (event) => {
  return {
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'yes' : 'no'
  }
})