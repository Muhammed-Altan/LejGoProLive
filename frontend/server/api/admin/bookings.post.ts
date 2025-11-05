import { createServerSupabaseClient } from '../../utils/supabase'
import { authenticateAdmin } from '../../utils/adminAuth'
import { calculatePricing } from '../pricing'
import { enrichModelsWithPrices, enrichAccessoriesWithPrices } from '../productUtils'

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    const user = authenticateAdmin(event)
    
    const body = await readBody(event)
    const supabase = createServerSupabaseClient()
    
    // Check if this is a calculate-only request
    const calculateOnly = body.calculateOnly === true
    
    // Validate required fields for creation, but allow partial updates
    if (!body.id && (!body.fullName || !body.email || !body.startDate || !body.endDate)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Customer name, email, start date, and end date are required for new bookings'
      })
    }
    
    // Prepare the payload for Supabase - only include fields that are provided
    const payload: any = {}
    
    if (body.fullName) payload.fullName = body.fullName
    if (body.email) payload.email = body.email
    if (body.phone !== undefined) payload.phone = body.phone
    if (body.startDate) payload.startDate = body.startDate
    if (body.endDate) payload.endDate = body.endDate
    if (body.totalPrice !== undefined) payload.totalPrice = body.totalPrice
    if (body.status) payload.status = body.status
    if (body.cameraId !== undefined) payload.cameraId = body.cameraId
    if (body.accessoryInstanceIds !== undefined) payload.accessoryInstanceIds = body.accessoryInstanceIds
    if (body.productName) payload.productName = body.productName
    if (body.accessoryNames !== undefined) payload.accessoryNames = body.accessoryNames
    if (body.deliveryOption) payload.deliveryOption = body.deliveryOption
    if (body.address !== undefined) payload.address = body.address
    if (body.city !== undefined) payload.city = body.city
    if (body.postalCode !== undefined) payload.postalCode = body.postalCode
    if (body.return_processed !== undefined) payload.return_processed = body.return_processed
    
    if (body.id) {
      // Get the existing booking data first
      const { data: existingBooking, error: fetchError } = await supabase
        .from('Booking')
        .select('*')
        .eq('id', body.id)
        .single()
        
      if (fetchError) {
        throw createError({
          statusCode: 404,
          statusMessage: `Booking not found: ${fetchError.message}`
        })
      }

      // Check if dates are being changed and recalculate price if needed
      let priceDifference = 0
      let newPriceInOre = 0 // Declare at a higher scope
      
      // Helper function to normalize dates for comparison (extract just YYYY-MM-DD)
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return '';
        // Handle both ISO format (YYYY-MM-DDTHH:MM:SS) and simple date format (YYYY-MM-DD)
        const dateOnly = dateStr.split('T')[0]; // Extract YYYY-MM-DD part
        // Validate that it's a proper date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
          console.warn('Invalid date format:', dateStr, 'extracted:', dateOnly);
          return '';
        }
        return dateOnly;
      };
      
      const existingStartDate = normalizeDate(existingBooking.startDate);
      const existingEndDate = normalizeDate(existingBooking.endDate);
      const newStartDate = normalizeDate(body.startDate) || existingStartDate;
      const newEndDate = normalizeDate(body.endDate) || existingEndDate;
      
      if ((body.startDate && normalizeDate(body.startDate) !== existingStartDate) || 
          (body.endDate && normalizeDate(body.endDate) !== existingEndDate)) {
        
        console.log('🐛 Date debugging:')
        console.log('- body.startDate (raw):', body.startDate)
        console.log('- body.endDate (raw):', body.endDate)
        console.log('- existingBooking.startDate (raw):', existingBooking.startDate)
        console.log('- existingBooking.endDate (raw):', existingBooking.endDate)
        console.log('- newStartDate (normalized):', newStartDate)
        console.log('- newEndDate (normalized):', newEndDate)
        
        console.log('📅 Dates changed, recalculating price...')
        console.log('Old dates:', existingStartDate, 'to', existingEndDate)
        console.log('New dates:', newStartDate, 'to', newEndDate)
        
        // Use the EXACT same models and accessories that were stored during booking creation
        let models = existingBooking.selectedModels || []
        let accessories = existingBooking.selectedAccessories || []
        
        // If selectedModels is missing, fall back to creating from productName (legacy bookings)
        if (!models || models.length === 0) {
          console.log('No selectedModels found, creating from productName (legacy booking)')
          const { data: product, error: productError } = await supabase
            .from('Product')
            .select('id, name, dailyPrice, weeklyPrice, twoWeekPrice')
            .eq('name', existingBooking.productName)
            .single()
            
          if (productError || !product) {
            console.error('Product not found for price recalculation:', existingBooking.productName)
            throw createError({
              statusCode: 400,
              statusMessage: `Product not found: ${existingBooking.productName}`
            })
          }
          
          models = [{
            name: product.name,
            quantity: 1,
            productId: product.id,
            price: product.dailyPrice,
            weeklyPrice: product.weeklyPrice,
            twoWeekPrice: product.twoWeekPrice
          }]
        }
        
        // Ensure accessories have current prices (enrich them just like in checkout)
        if (accessories && accessories.length > 0) {
          accessories = await enrichAccessoriesWithPrices(accessories)
        }
        
        // Use exact same insurance logic - check if insurance was included in original booking
        const hasInsurance = existingBooking.insuranceAmount && existingBooking.insuranceAmount > 0
        
        console.log('🔍 Using stored booking data:')
        console.log('- Models:', models)
        console.log('- Accessories:', accessories)
        console.log('- Has insurance:', hasInsurance)
        
        // Debug: Calculate rental days for both old and new periods
        const msPerDay = 24 * 60 * 60 * 1000;
        const oldStart = new Date(existingStartDate);
        const oldEnd = new Date(existingEndDate);
        const oldRentalDays = Math.round((oldEnd.getTime() - oldStart.getTime()) / msPerDay) + 1;
        
        const newStart = new Date(newStartDate);
        const newEnd = new Date(newEndDate);
        const newRentalDays = Math.round((newEnd.getTime() - newStart.getTime()) / msPerDay) + 1;
        
        console.log('📅 Rental period comparison:')
        console.log('- Old rental days:', oldRentalDays)
        console.log('- New rental days:', newRentalDays)
        console.log('- Days difference:', newRentalDays - oldRentalDays)
        console.log('🗓️ Date parsing debug:')
        console.log('- existingStartDate:', existingStartDate, '→ Date:', oldStart)
        console.log('- existingEndDate:', existingEndDate, '→ Date:', oldEnd)
        console.log('- newStartDate:', newStartDate, '→ Date:', newStart)
        console.log('- newEndDate:', newEndDate, '→ Date:', newEnd)
        
        // Safety check: If dates are invalid or rental days are negative, skip pricing calculation
        if (isNaN(oldStart.getTime()) || isNaN(oldEnd.getTime()) || isNaN(newStart.getTime()) || isNaN(newEnd.getTime())) {
          console.error('❌ Invalid dates detected, skipping price calculation')
          priceDifference = 0
        } else if (newRentalDays <= 0) {
          console.error('❌ Invalid rental period (negative or zero days), skipping price calculation')
          priceDifference = 0
        } else {
          // Calculate pricing using the EXACT same logic as checkout
          const newPricing = calculatePricing(models, accessories, hasInsurance, newStartDate, newEndDate)
        
        // Handle price comparison correctly
        // The stored totalPrice might be in øre (integer) or DKK (decimal)
        let oldPriceInDKK = 0
        if (existingBooking.totalPrice) {
          // If totalPrice is a large integer (>1000), it's likely in øre, convert to DKK
          const rawPrice = Number(existingBooking.totalPrice)
          if (rawPrice > 1000 && Number.isInteger(rawPrice)) {
            oldPriceInDKK = rawPrice / 100 // Convert øre to DKK
          } else {
            oldPriceInDKK = rawPrice // Already in DKK
          }
        }
        
        const newPriceInDKK = newPricing.total
        const priceDifferenceInDKK = newPriceInDKK - oldPriceInDKK
        
        // Convert to øre for storage and precise comparison
        const oldPriceInOre = Math.round(oldPriceInDKK * 100)
        newPriceInOre = Math.round(newPriceInDKK * 100)
        priceDifference = newPriceInOre - oldPriceInOre
        
        console.log('💰 Price calculation using exact checkout logic:')
        console.log('- Existing booking totalPrice (raw):', existingBooking.totalPrice, typeof existingBooking.totalPrice)
        console.log('- Old price in DKK:', oldPriceInDKK)
        console.log('- Old price in øre:', oldPriceInOre)
        console.log('- New price in DKK:', newPriceInDKK) 
        console.log('- New price in øre:', newPriceInOre)
        console.log('- Difference in DKK:', priceDifferenceInDKK.toFixed(2))
        console.log('- Difference in øre:', priceDifference)
        console.log('- Rental days comparison: old =', oldRentalDays, ', new =', newRentalDays)
        }
        
        // Only update if there's actually a difference
        if (Math.abs(priceDifference) < 1) { // Less than 1 øre difference
          console.log('🔄 Price difference negligible, not updating price')
          priceDifference = 0
        } else if (!calculateOnly) {
          // Update the payload with the new price in øre (only if not calculate-only)
          payload.totalPrice = newPriceInOre
        }
      }

      // If this is calculate-only, return price info without updating database
      if (calculateOnly) {
        const response: any = { 
          success: true, 
          calculateOnly: true,
          message: 'Price calculated successfully (not saved)',
          priceDifference: priceDifference / 100, // Convert øre to DKK for frontend (always include)
          priceDifferenceInOre: priceDifference, // Keep øre value for reference (always include)
          newTotalPrice: newPriceInOre // New total price in øre (always include)
        }
        
        if (priceDifference !== 0) {
          response.priceChangeMessage = priceDifference > 0 
            ? `Price would increase by ${(priceDifference / 100).toFixed(2)} DKK due to date change`
            : `Price would decrease by ${Math.abs(priceDifference / 100).toFixed(2)} DKK due to date change`
        } else {
          response.priceChangeMessage = 'No price change due to date change'
        }
        
        return response
      }

      // Update existing booking
      const { data, error } = await supabase
        .from('Booking')
        .update(payload)
        .eq('id', body.id)
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to update booking: ${error.message}`
        })
      }
      
      // Include price difference in response if dates were changed
      const response: any = { 
        success: true, 
        data, 
        message: 'Booking updated successfully'
      }
      
      if (priceDifference !== 0) {
        response.priceDifference = priceDifference / 100 // Convert øre to DKK for frontend
        response.priceDifferenceInOre = priceDifference // Keep øre value for reference
        response.priceChangeMessage = priceDifference > 0 
          ? `Price increased by ${(priceDifference / 100).toFixed(2)} DKK due to date change`
          : `Price decreased by ${Math.abs(priceDifference / 100).toFixed(2)} DKK due to date change`
      }
      
      return response
    } else {
      // Create new booking
      const { data: newBooking, error } = await supabase
        .from('Booking')
        .insert([payload])
        .select()
        .single()
        
      if (error) {
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to create booking: ${error.message}`
        })
      }
      
      return { success: true, data: newBooking, message: 'Booking created successfully' }
    }
  } catch (error: any) {
    console.error('Booking creation/update error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to process booking request'
    })
  }
})