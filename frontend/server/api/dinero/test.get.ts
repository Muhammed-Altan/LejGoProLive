import { defineEventHandler } from 'h3'

const DINERO_API_BASE = 'https://api.dinero.dk'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    // Get stored integration from database
    const supabase = useSupabase()
    if (!supabase) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    const { data: integrations, error } = await supabase
      .from('DineroIntegration')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Database query error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${error.message}`
      })
    }

    if (!integrations || integrations.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No Dinero integration found'
      })
    }

    const integration = integrations[0]

    // Check if token is expired
    if (integration.expiresAt && new Date(integration.expiresAt) <= new Date()) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Access token expired'
      })
    }

    // Test API call to verify connection
    const testResponse = await fetch(`${DINERO_API_BASE}/v1/organizations`, {
      headers: {
        'Authorization': `Bearer ${integration.accessToken}`,
        'Accept': 'application/json'
      }
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Dinero API test failed:', errorText)
      
      if (testResponse.status === 401) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Access token invalid or expired'
        })
      }
      
      throw createError({
        statusCode: 400,
        statusMessage: 'Connection test failed'
      })
    }

    const organizations = await testResponse.json()

    return {
      success: true,
      organizationName: integration.organizationName,
      organizationCount: organizations?.length || 0,
      connectedAt: integration.createdAt
    }

  } catch (error: any) {
    console.error('Dinero test error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Connection test failed'
    })
  }
})