import { defineEventHandler, readBody } from 'h3'

const DINERO_API_BASE = 'https://api.dinero.dk'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
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

    const { data: integrations, error: integrationError } = await supabase
      .from('DineroIntegration')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(1)

    if (integrationError) {
      console.error('Database query error:', integrationError)
      throw createError({
        statusCode: 500,
        statusMessage: `Database error: ${integrationError.message}`
      })
    }

    if (!integrations || integrations.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'No Dinero integration found'
      })
    }

    const integration = integrations[0]

    // Get all products from our database
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('*')

    if (productsError) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch products from database'
      })
    }

    if (!products || products.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'No products to sync'
      }
    }

    let syncedCount = 0

    // Sync each product to Dinero
    for (const product of products) {
      try {
        // Create product in Dinero
        const dineroProduct = {
          Name: product.name,
          Description: product.features || '',
          BaseAmountValue: product.dailyPrice, // Daily price as base price
          Unit: 'Dag', // Danish for "Day"
          PriceIncludingVat: false,
          AccountNumber: 1000, // Default sales account - adjust as needed
          VatRate: 25 // 25% VAT for Denmark - adjust as needed
        }

        const createResponse = await fetch(`${DINERO_API_BASE}/v1/${integration.organizationId}/products`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(dineroProduct)
        })

        if (createResponse.ok) {
          syncedCount++
        } else {
          const errorText = await createResponse.text()
          console.warn(`Failed to sync product ${product.name}:`, errorText)
          
          // If product already exists, try to update it
          if (createResponse.status === 409 || createResponse.status === 400) {
            // Try to find and update existing product
            // This would require additional logic to search for existing products
            console.log(`Product ${product.name} might already exist in Dinero`)
          }
        }
      } catch (error) {
        console.error(`Error syncing product ${product.name}:`, error)
      }
    }

    // Update last sync time
    await supabase
      .from('DineroIntegration')
      .update({ lastSync: new Date().toISOString() })
      .eq('id', integration.id)

    return {
      success: true,
      syncedCount,
      totalProducts: products.length,
      message: `${syncedCount} of ${products.length} products synced successfully`
    }

  } catch (error: any) {
    console.error('Product sync error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Product sync failed'
    })
  }
})