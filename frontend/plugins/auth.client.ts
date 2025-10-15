export default defineNuxtPlugin(async () => {
  const auth = useAuth()
  
  // Initialize authentication state
  if (process.client) {
    await auth.initialize()
  }
})