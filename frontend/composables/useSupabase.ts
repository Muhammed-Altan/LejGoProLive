import type { SupabaseClient } from '@supabase/supabase-js'

export const useSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}

// Alternative method for direct access
export const getSupabase = (): SupabaseClient => {
  const { $supabase } = useNuxtApp()
  return $supabase as SupabaseClient
}