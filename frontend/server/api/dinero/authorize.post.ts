import { defineEventHandler, readBody, getQuery } from 'h3'

const DINERO_API_BASE = 'https://api.dinero.dk'
const VISMA_CONNECT_TOKEN_URL = 'https://connect.visma.com/connect/token'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const config = useRuntimeConfig()
    const DINERO_CLIENT_ID = config.public.dineroClientId
    const DINERO_CLIENT_SECRET = config.dineroClientSecret

    const body = await readBody(event)
    const { code, redirectUri } = body

    if (!code || !redirectUri) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing code or redirectUri'
      })
    }

    if (!DINERO_CLIENT_ID || !DINERO_CLIENT_SECRET) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Dinero credentials not configured'
      })
    }

    // Exchange authorization code for access token using Visma Connect
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: DINERO_CLIENT_ID,
      client_secret: DINERO_CLIENT_SECRET,
      code: code,
      redirect_uri: redirectUri
    })

    const tokenResponse = await fetch(VISMA_CONNECT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw createError({
        statusCode: 400,
        statusMessage: 'Token exchange failed'
      })
    }

    const tokens = await tokenResponse.json()

    // Get organization info using the access token
    const orgResponse = await fetch(`${DINERO_API_BASE}/v1/organizations`, {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Accept': 'application/json'
      }
    })

    if (!orgResponse.ok) {
      const errorText = await orgResponse.text()
      console.error('Organization fetch failed:', errorText)
      throw createError({
        statusCode: 400,
        statusMessage: 'Failed to fetch organization info'
      })
    }

    const organizations = await orgResponse.json()
    const organization = organizations[0] // Usually the first organization

    if (!organization) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No organization found'
      })
    }

    // Store integration data in Supabase
    const supabase = useSupabase()
    if (!supabase) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    const integrationData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
      organizationId: organization.Id,
      organizationName: organization.Name,
      expiresAt: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Delete any existing integration first (since we're not using RLS)
    const { error: deleteError } = await supabase
      .from('DineroIntegration')
      .delete()
      .gt('id', 0) // Delete all rows

    if (deleteError) {
      console.warn('Could not delete existing integrations:', deleteError.message)
      // Continue anyway - might be empty table
    }

    // Insert new integration
    const { error: insertError } = await supabase
      .from('DineroIntegration')
      .insert(integrationData)

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to save integration: ${insertError.message}`
      })
    }

    return {
      success: true,
      organizationName: organization.Name,
      organizationId: organization.Id
    }

  } catch (error: any) {
    console.error('Dinero authorization error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Authorization failed'
    })
  }
})