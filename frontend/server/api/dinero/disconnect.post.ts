import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const supabase = useSupabase()
    if (!supabase) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Database connection failed'
      })
    }

    // Delete all Dinero integrations
    const { error } = await supabase
      .from('DineroIntegration')
      .delete()
      .gt('id', 0) // Delete all rows

    if (error) {
      console.error('Database delete error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to disconnect integration'
      })
    }

    return {
      success: true,
      message: 'Dinero integration disconnected successfully'
    }

  } catch (error: any) {
    console.error('Dinero disconnect error:', error)
    
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Disconnect failed'
    })
  }
})