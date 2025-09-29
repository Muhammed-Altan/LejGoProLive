import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default defineEventHandler(async (event) => {
  try {
    // Test if Booking table exists by trying to select from it
    const { data, error } = await supabase
      .from('Booking')
      .select('*')
      .limit(1)

    if (error) {
      return {
        success: false,
        error: error.message,
        details: error,
        message: 'Booking table test failed'
      }
    }

    return {
      success: true,
      message: 'Booking table exists and is accessible',
      sampleData: data
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unknown error',
      message: 'Database connection failed'
    }
  }
})