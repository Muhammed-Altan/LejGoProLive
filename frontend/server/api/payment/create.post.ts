import { createServerSupabaseClient } from '../../utils/supabase'

// Initialize Supabase client with service role (bypasses RLS for server operations)
const supabase = createServerSupabaseClient()

// Helper function to find available camera for a product
async function findAvailableCamera(productName: string, startDate: string, endDate: string): Promise<{ cameraId: number; cameraName: string; productId: number } | null> {
  console.log(`🔍 Finding available camera for product "${productName}" from ${startDate} to ${endDate}`)
  
  // First, find the product by name to get productId
  const { data: product, error: productError } = await supabase
    .from('Product')
    .select('id, name')
    .eq('name', productName)
    .single()
    
  if (productError || !product) {
    console.error('❌ Product not found:', productName, productError)
    return null
  }
  
  console.log(`📦 Found product: ${product.name} (ID: ${product.id})`)
  
  // Get all cameras for this specific product
  const { data: cameras, error: camerasError } = await supabase
    .from('Camera')
    .select('id, productId')
    .eq('productId', product.id)
    .order('id')
    
  if (camerasError || !cameras || cameras.length === 0) {
    console.error('❌ No cameras found for product:', product.id, camerasError)
    return null
  }
  
  console.log(`📷 Found ${cameras.length} cameras for product ${product.name}:`, cameras.map(c => `ID:${c.id} (Product:${c.productId})`))
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Check each camera for availability
  for (let i = 0; i < cameras.length; i++) {
    const camera = cameras[i]
    
    // Double-check that this camera belongs to the right product
    if (camera.productId !== product.id) {
      console.error(`🚨 CRITICAL: Camera ${camera.id} claims to belong to product ${camera.productId} but we're looking for ${product.id}`)
      continue
    }
    
    // Get existing bookings for this camera that overlap with requested dates
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from('Booking')
      .select('startDate, endDate, productName, paymentStatus')
      .eq('cameraId', camera.id)
      .neq('paymentStatus', 'cancelled')
      
    if (bookingsError) {
      console.error('Error checking bookings for camera:', camera.id, bookingsError)
      continue
    }
    
    console.log(`📋 Camera ${camera.id} has ${conflictingBookings?.length || 0} existing bookings`)
    
    // Check if this camera has any date conflicts
    const hasConflict = conflictingBookings?.some((booking: any) => {
      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      // Check if date ranges overlap
      const overlap = start <= bookingEnd && end >= bookingStart
      if (overlap) {
        console.log(`❌ Date conflict found on camera ${camera.id}: ${booking.startDate} - ${booking.endDate} (${booking.productName})`)
      }
      return overlap
    })
    
    if (!hasConflict) {
      // This camera is available!
      console.log(`✅ Camera ${camera.id} is available for ${product.name}, assigning as Kamera ${i + 1}`)
      return {
        cameraId: camera.id,
        cameraName: `Kamera ${i + 1}`,
        productId: product.id
      }
    }
  }
  
  console.log(`❌ No cameras available for product ${product.name} during ${startDate} - ${endDate}`)
  return null
}

async function findAvailableAccessoryInstances(selectedAccessories: any[], startDate: string, endDate: string): Promise<number[]> {
  console.log(`🔍 Finding available accessory instances from ${startDate} to ${endDate}`)
  console.log('Selected accessories:', selectedAccessories)
  
  if (!selectedAccessories || selectedAccessories.length === 0) {
    console.log('No accessories selected')
    return []
  }
  
  const assignedInstanceIds: number[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  console.log(`🔧 Processing ${selectedAccessories.length} selected accessories:`, selectedAccessories)
  
  const unavailableAccessories: string[] = []
  
  // Process each selected accessory
  for (let accessoryIndex = 0; accessoryIndex < selectedAccessories.length; accessoryIndex++) {
    const selectedAccessory = selectedAccessories[accessoryIndex]
    console.log(`🔧 [${accessoryIndex + 1}/${selectedAccessories.length}] Processing accessory: ${selectedAccessory.name}, quantity: ${selectedAccessory.quantity}`)
    
    // Find the accessory by name
    const { data: accessory, error: accessoryError } = await supabase
      .from('Accessory')
      .select('id, name')
      .eq('name', selectedAccessory.name)
      .single()
      
    if (accessoryError || !accessory) {
      console.error(`❌ [${accessoryIndex + 1}] Accessory not found:`, selectedAccessory.name, accessoryError)
      continue
    }
    
    console.log(`📦 [${accessoryIndex + 1}] Found accessory: ${accessory.name} (ID: ${accessory.id})`)
    
    // Get all instances for this accessory
    const { data: instances, error: instancesError } = await supabase
      .from('AccessoryInstance')
      .select('id, serialNumber, isAvailable')
      .eq('accessoryId', accessory.id)
      .eq('isAvailable', true)
      .order('id')
      
    if (instancesError || !instances || instances.length === 0) {
      console.error(`❌ [${accessoryIndex + 1}] No available instances found for accessory:`, accessory.id, instancesError)
      continue
    }
    
    console.log(`🔧 [${accessoryIndex + 1}] Found ${instances.length} available instances for ${accessory.name}`)
    
    let assignedCount = 0
    const neededQuantity = selectedAccessory.quantity || 1
    
    // Check each instance for availability
    for (const instance of instances) {
      if (assignedCount >= neededQuantity) break
      
      // Check if this instance is booked during the requested dates
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from('Booking')
        .select('startDate, endDate, paymentStatus, accessoryInstanceIds')
        .neq('paymentStatus', 'cancelled')
        
      if (bookingsError) {
        console.error('Error checking bookings for accessory instance:', instance.id, bookingsError)
        continue
      }
      
      console.log(`📋 Accessory instance ${instance.id} has ${conflictingBookings?.length || 0} existing bookings`)
      
      // Check if this instance has any date conflicts
      const hasConflict = conflictingBookings?.some((booking: any) => {
        // Check if this instance ID is in the accessoryInstanceIds array
        const hasInstanceId = booking.accessoryInstanceIds && 
          Array.isArray(booking.accessoryInstanceIds) && 
          booking.accessoryInstanceIds.includes(instance.id)
        
        if (!hasInstanceId) return false
        
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        // Check if date ranges overlap
        const overlap = start <= bookingEnd && end >= bookingStart
        if (overlap) {
          console.log(`❌ Date conflict found on accessory instance ${instance.id}: ${booking.startDate} - ${booking.endDate}`)
        }
        return overlap
      })
      
      if (!hasConflict) {
        // This instance is available!
        console.log(`✅ Accessory instance ${instance.id} (${instance.serialNumber}) is available`)
        assignedInstanceIds.push(instance.id)
        assignedCount++
      }
    }
    
    console.log(`📊 [${accessoryIndex + 1}] Summary for ${accessory.name}: Needed ${neededQuantity}, Assigned ${assignedCount}`)
    
    if (assignedCount < neededQuantity) {
      const shortfall = neededQuantity - assignedCount
      const shortfallMessage = `${accessory.name} (mangler ${shortfall} stk.)`
      unavailableAccessories.push(shortfallMessage)
      console.error(`❌ [${accessoryIndex + 1}] Could not find enough available instances for ${accessory.name}. Needed: ${neededQuantity}, Found: ${assignedCount}`)
    } else {
      console.log(`✅ [${accessoryIndex + 1}] Successfully assigned all ${assignedCount} instances for ${accessory.name}`)
    }
  }
  
  // Check if any accessories were unavailable
  if (unavailableAccessories.length > 0) {
    const errorMessage = `F\u00F8lgende tilbeh\u00F8r er ikke tilg\u00E6ngeligt i de valgte datoer: ${unavailableAccessories.join(', ')}. V\u00E6lg venligst andre datoer eller fjern det utilg\u00E6ngelige tilbeh\u00F8r.`
    console.error('❌ Booking failed due to unavailable accessories:', unavailableAccessories)
    throw new Error(errorMessage)
  }
  
  console.log(`✅ Assigned accessory instances:`, assignedInstanceIds)
  return assignedInstanceIds
}

// PensoPay configuration
const PENSOPAY_API_KEY = process.env.PENSOPAY_API_KEY
const PENSOPAY_BASE_URL = 'https://api.pensopay.com/v2'

export default defineEventHandler(async (event) => {
  // Only accept POST requests
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  // Validate environment variables
  if (!PENSOPAY_API_KEY) {
    console.error('PENSOPAY_API_KEY is missing from environment variables')
    throw createError({
      statusCode: 500,
      statusMessage: 'PENSOPAY_API_KEY environment variable is not set'
    })
  }

  console.log('PENSOPAY_API_KEY status:', PENSOPAY_API_KEY ? 'loaded' : 'missing')
  console.log('PENSOPAY_API_KEY length:', PENSOPAY_API_KEY?.length || 0)

  try {
    const body = await readBody(event)
    
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    const { bookingData, paymentMethods = 'creditcard' } = body
    
    console.log('Extracted bookingData:', JSON.stringify(bookingData, null, 2))
    
    if (!bookingData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Booking data is required'
      })
    }

    // Validate essential fields
    if (!bookingData.fullName || !bookingData.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Full name and email are required'
      })
    }

    // Trim and validate email format server-side using centralized validator
    if (typeof bookingData.email === 'string') {
      bookingData.email = bookingData.email.trim()
    }
  const { isValidEmail } = await import('../validation')
    if (!isValidEmail(bookingData.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email format'
      })
    }

    if (!bookingData.startDate || !bookingData.endDate) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Start date and end date are required'
      })
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    
    // Use the actual calculated price from checkout (convert from DKK to øre)
    // Ensure we handle both numbers and strings, and always get an integer in øre
    const priceInDKK = typeof bookingData.totalPrice === 'number' 
      ? bookingData.totalPrice 
      : parseFloat(bookingData.totalPrice) || 0
    
    // Convert to øre and ensure it's an integer (no decimals)
    let totalAmount = Math.round(priceInDKK * 100) // Convert DKK to øre and round to integer
    
    console.log('🔍 PRICE CALCULATION DEBUG:')
    console.log('- Raw bookingData.totalPrice:', bookingData.totalPrice)
    console.log('- Type of totalPrice:', typeof bookingData.totalPrice)
    console.log('- Parsed price in DKK:', priceInDKK)
    console.log('- Calculated totalAmount in øre (before Math.round):', priceInDKK * 100)
    console.log('- Final totalAmount in øre (integer):', totalAmount)
    console.log('- Final amount back to DKK:', totalAmount / 100)
    
    // Validate amount
    if (totalAmount <= 0) {
      console.error('💥 Invalid amount detected! Full booking data:', JSON.stringify(bookingData, null, 2))
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid total amount. Price must be greater than 0.'
      })
    }
    
    // Ensure the amount is definitely an integer (PensoPay requires this)
    if (!Number.isInteger(totalAmount)) {
      console.error('💥 Amount is not an integer!', totalAmount)
      totalAmount = Math.round(totalAmount)
      console.log('🔧 Rounded amount to integer:', totalAmount)
    }
    
    // Get current domain for callback URLs - handle Vercel deployment
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || `${protocol}://${host}`
    
    console.log('🔗 Callback URL Configuration:')
    console.log('Host:', host)
    console.log('Protocol:', protocol)
    console.log('Base URL for callbacks:', baseUrl)

    // Find the correct camera for this product and dates
    const assignedCamera = await findAvailableCamera(
      bookingData.productName,
      bookingData.startDate,
      bookingData.endDate
    )
    
    if (!assignedCamera) {
      console.error('❌ No available cameras for product:', bookingData.productName)
      throw createError({
        statusCode: 409,
        statusMessage: `No cameras available for ${bookingData.productName} during the selected dates. Please choose different dates.`
      })
    }
    
    console.log('🎯 Assigned camera:', assignedCamera)

    // Find available accessory instances for selected accessories
    let assignedAccessoryInstances: number[]
    try {
      assignedAccessoryInstances = await findAvailableAccessoryInstances(
        bookingData.selectedAccessories || [],
        bookingData.startDate,
        bookingData.endDate
      )
    } catch (accessoryError: any) {
      console.error('❌ Accessory assignment failed:', accessoryError.message)
      // Send simple error code and let frontend handle Danish message
      // Extract everything after the colon and before the final period (handling stk. properly)
      const accessories = accessoryError.message.match(/: (.+)\. V.lg/)?.[1] || 'accessories'
      throw createError({
        statusCode: 409,
        statusMessage: `ACCESSORY_UNAVAILABLE:${accessories}`
      })
    }
    
    console.log('🔧 Assigned accessory instances:', assignedAccessoryInstances)

    // Create booking in database with correct camera and accessory instance assignment
    const bookingPayload = {
      // Only include fields that exist in the Booking table
      productName: bookingData.productName,
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      fullName: bookingData.fullName,
      email: bookingData.email,
      phone: bookingData.phone,
      address: bookingData.address,
      apartment: bookingData.apartment,
      city: bookingData.city,
      postalCode: bookingData.postalCode,
      cameraId: assignedCamera.cameraId,
      cameraName: assignedCamera.cameraName,
      accessoryInstanceIds: assignedAccessoryInstances,
      totalPrice: totalAmount, // Store price in øre (integer) to match database schema
      orderId,
      paymentStatus: 'pending'
    }

    console.log('✅ Creating booking with correct camera and accessory assignment:', {
      productName: bookingPayload.productName,
      cameraId: bookingPayload.cameraId,
      cameraName: bookingPayload.cameraName,
      accessoryInstanceIds: bookingPayload.accessoryInstanceIds
    })
    
    const { data: booking, error: bookingError } = await supabase
      .from('Booking')
      .insert([bookingPayload])
      .select()
      .single()

    if (bookingError) {
      console.error('Detailed booking error:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      })
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to create booking: ${bookingError.message}`
      })
    }

    const isTestMode = true

    const paymentData = {
      order_id: orderId,
      amount: totalAmount,
      currency: 'DKK',
      testmode: isTestMode,
      callback_url: `${baseUrl}/api/payment/callback`,
      success_url: `${baseUrl}/payment/success?orderId=${orderId}`,
      cancel_url: `${baseUrl}/payment/cancelled?orderId=${orderId}`,
      expires_in: 600
    }

    console.log('🔍 DETAILED REQUEST CHECK:')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    console.log('isTestMode calculated as:', isTestMode)
    console.log('testmode value being sent:', paymentData.testmode)
    console.log('Success URL being sent:', paymentData.success_url)
    console.log('Cancel URL being sent:', paymentData.cancel_url)
    console.log('Callback URL being sent:', paymentData.callback_url)
    console.log('Payment expires in (seconds):', paymentData.expires_in)
    console.log('Full payment data being sent to PensoPay:', JSON.stringify(paymentData, null, 2))
    console.log('Payment methods requested:', paymentMethods)

    console.log('Creating PensoPay payment:', { ...paymentData, apiKey: PENSOPAY_API_KEY ? '***' : 'missing' })

    const paymentResponse = await fetch(`${PENSOPAY_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PENSOPAY_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(paymentData)
    })

    console.log('Payment response status:', paymentResponse.status)
    console.log('Payment response ok:', paymentResponse.ok)

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json().catch(() => ({}))
      console.error('PensoPay payment creation failed:', errorData)
      console.error('Payment response status:', paymentResponse.status, 'Status text:', paymentResponse.statusText)
      throw createError({
        statusCode: paymentResponse.status,
        statusMessage: errorData.message || 'Payment creation failed'
      })
    }

    const payment = await paymentResponse.json()
    console.log('✅ PensoPay Response - Payment Created:')
    console.log('Payment ID:', payment.id)
    console.log('Payment testmode from response:', payment.test_mode)
    console.log('Payment state:', payment.state)
    console.log('Payment link:', payment.link)

    if (!payment.id) {
      console.error('Payment creation succeeded but no ID returned')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment was created but no payment ID was returned'
      })
    }

    // Use the default payment link (PensoPay doesn't support redirect URLs)
    console.log('Using default payment link from PensoPay')
    const finalPaymentUrl = payment.link
    
    // Ensure we have a payment link before proceeding
    if (!payment.link) {
      console.error('Payment created but no payment link provided')
      throw createError({
        statusCode: 500,
        statusMessage: 'Payment was created but no payment link was provided'
      })
    }

    // Update booking with payment ID
    await supabase
      .from('Booking')
      .update({ paymentId: payment.id })
      .eq('id', booking.id)

    console.log(`Payment created successfully for order ${orderId}`)

    return {
      success: true,
      paymentUrl: finalPaymentUrl,
      orderId,
      paymentId: payment.id,
      bookingId: booking.id
    }

  } catch (error: any) {
    console.error('Payment creation error:', error)
    
    if (error.statusCode) {
      throw error // Re-throw HTTP errors
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error?.message || 'Internal server error'
    })
  }
})