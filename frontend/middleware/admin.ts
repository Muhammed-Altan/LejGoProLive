export default defineNuxtRouteMiddleware((to, from) => {
  // Block all access to admin pages immediately
  console.log('Admin middleware triggered for:', to.path)
  
  // Throw error to block access
  throw createError({
    statusCode: 403,
    statusMessage: 'Adgang nægtet - Admin området er ikke tilgængeligt i øjeblikket'
  })
})