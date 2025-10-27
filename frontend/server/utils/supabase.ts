import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with service role for admin operations
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Client-side Supabase client for user operations (uses anon key + RLS)
export function createClientSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase client environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}