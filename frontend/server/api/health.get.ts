import { createServerSupabaseClient } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const health: any = {
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    netlify: process.env.NETLIFY ? 'yes' : 'no',
    services: {
      api: 'up',
      supabase: 'unknown'
    }
  }

  // Check Supabase connection
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('Product')
      .select('id')
      .limit(1)
    
    if (error) {
      health.services.supabase = 'down'
      health.services.supabaseError = error.message
    } else {
      health.services.supabase = 'up'
    }
  } catch (err: any) {
    health.services.supabase = 'down'
    health.services.supabaseError = err.message
  }

  // Overall health status
  const allServicesUp = Object.values(health.services).every(
    status => status === 'up' || status === 'unknown'
  )
  
  if (!allServicesUp) {
    health.success = false
    health.message = 'Some services are down'
  }

  return health
})