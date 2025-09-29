import type { SupabaseClient } from '@supabase/supabase-js'

export const useSupabase = (): SupabaseClient | null => {
  // Skip Supabase during SSR to avoid initialization issues
  if (process.server) {
    return null
  }
  
  try {
    const nuxtApp = useNuxtApp()
    const { $supabase } = nuxtApp
    
    if (!$supabase) {
      // Only log errors on client side to avoid SSR noise
      if (process.client) {
        console.error('Supabase client not found. Make sure to set up SUPABASE_URL and SUPABASE_ANON_KEY environment variables.')
      }
      return null
    }
    
    return $supabase as SupabaseClient
  } catch (error) {
    // Only log errors on client side to avoid SSR noise
    if (process.client) {
      console.error('Error accessing Supabase client:', error)
    }
    return null
  }
}

// Alternative method for direct access
export const getSupabase = (): SupabaseClient | null => {
  try {
    const { $supabase } = useNuxtApp()
    return $supabase as SupabaseClient || null
  } catch (error) {
    console.error('Error accessing Supabase client:', error)
    return null
  }
}