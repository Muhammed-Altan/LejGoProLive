import { createClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  
  if (!config.public.supabaseUrl || !config.public.supabaseAnonKey) {
    console.error('Missing Supabase configuration!')
    // Still create a client but it won't work
    const supabase = createClient('', '')
    return {
      provide: {
        supabase
      }
    }
  }
  
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseAnonKey as string
  )

  return {
    provide: {
      supabase
    }
  }
})