import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getRequestIP, sendError, createError } from 'h3';
import { calculatePricing } from './pricing';
import { enrichModelsWithPrices, enrichAccessoriesWithPrices } from './productUtils';
import { checkAvailability } from './availability';
import { enforceMaxQuantities, enforceMaxAccessoryQuantities, validateBookingPeriod, validateInsurance, validateAccessoryProductRelation } from './validation';
import { requireAuth } from './auth';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { apiCache } from '../utils/cache';

// Check accessory availability for a booking period
async function checkAccessoryAvailability(accessories: Array<{ name: string; quantity: number }>, startDate: string, endDate: string): Promise<boolean> {
  // If no accessories requested, no need to check
  if (!accessories || accessories.length === 0) {
    console.log('No accessories requested, skipping availability check');
    return true;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  console.log('Checking accessory availability for:', accessories);
  
  // For now, return true since the detailed accessory availability 
  // checking is handled in the payment API with accessory instances
  // This function mainly validates that the accessories exist
  for (const accessory of accessories) {
    const { data: dbAccessory, error } = await supabase
      .from('Accessory')
      .select('id, name, quantity')
      .eq('name', accessory.name)
      .single();
      
    if (error || !dbAccessory) {
      console.error(`Accessory not found: ${accessory.name}`, error);
      return false;
    }
    
    // Basic quantity check - detailed availability is done in payment API
    if (accessory.quantity > (dbAccessory.quantity || 0)) {
      console.error(`Insufficient quantity for ${accessory.name}: requested ${accessory.quantity}, available ${dbAccessory.quantity}`);
      return false;
    }
  }
  
  return true;
}

// Rate limiter setup: 10 requests per 60 seconds per IP (more reasonable for development/testing)
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Zod schema for booking validation
const bookingSchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid start date' }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Invalid end date' }),
  models: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
    productId: z.number().int(),
  })),
  accessories: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().min(1),
  })),
  insurance: z.boolean(),
  acceptedTerms: z.boolean().refine(val => val === true, { message: 'Rental conditions must be accepted' }),
});

export default defineEventHandler(async (event) => {
  // --- Authentication ---
  // const user = requireAuth(event); // Uncomment if authentication is required
  // --- Rate limiting ---
  const ip = getRequestIP(event) || 'unknown';
  try {
    await rateLimiter.consume(ip);
  } catch {
    return sendError(event, createError({ statusCode: 429, statusMessage: 'Rate limit exceeded. Prøv igen senere.' }));
  }

  // --- Input Sanitization ---
  const body = await readBody(event);
  // Remove any unexpected fields, trim strings, and sanitize with DOMPurify
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);

  function sanitizeString(str: unknown): string {
    return typeof str === 'string' ? purify.sanitize(str.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) : '';
  }
  function sanitizeNumber(num: unknown): number {
    return typeof num === 'number' && !isNaN(num) ? num : 0;
  }
  // Sanitize models and accessories arrays
  const sanitizedModels = Array.isArray(body.models) ? body.models.map((m: any) => ({
    name: sanitizeString(m.name),
    quantity: sanitizeNumber(m.quantity),
    productId: sanitizeNumber(m.productId),
  })) : [];
  const sanitizedAccessories = Array.isArray(body.accessories) ? body.accessories.map((a: any) => ({
    name: sanitizeString(a.name),
    quantity: sanitizeNumber(a.quantity),
  })) : [];
  const sanitizedBody = {
    startDate: sanitizeString(body.startDate),
    endDate: sanitizeString(body.endDate),
    models: sanitizedModels,
    accessories: sanitizedAccessories,
    insurance: !!body.insurance,
    acceptedTerms: !!body.acceptedTerms,
  };

  // --- Zod Validation ---
  const result = bookingSchema.safeParse(sanitizedBody);
  if (!result.success) {
    return {
      status: 400,
      errors: result.error.issues,
      message: 'Validation failed',
    };
  }
  const booking = result.data;

  // --- Centralized Backend Validation ---
  if (!validateBookingPeriod(booking.startDate, booking.endDate)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Invalid booking period' }));
  }
  if (!enforceMaxQuantities(booking.models)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Too many products requested' }));
  }
  // Calculate total camera count for accessory validation
  const totalCameras = booking.models.reduce((sum, model) => sum + model.quantity, 0);
  if (!enforceMaxAccessoryQuantities(booking.accessories, totalCameras, totalCameras * 5)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Too many accessories requested' }));
  }
  if (!validateInsurance(booking.insurance, booking.models)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Insurance required for this booking' }));
  }
  if (!validateAccessoryProductRelation(booking.models, booking.accessories)) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Accessory not allowed for selected products' }));
  }

  // --- Centralized Availability Check ---
  const available = await checkAvailability(booking.models, booking.startDate, booking.endDate);
  if (!available) {
    return sendError(event, createError({ statusCode: 409, statusMessage: 'Not enough availability for requested products' }));
  }

  // --- Accessory Availability Check ---
  const accessoryAvailable = await checkAccessoryAvailability(booking.accessories, booking.startDate, booking.endDate);
  if (!accessoryAvailable) {
    return sendError(event, createError({ statusCode: 409, statusMessage: 'Not enough availability for requested accessories' }));
  }


  // --- Pricing & Discount Calculation (Business Logic Enforcement) ---
  // Enrich models and accessories with prices from DB
  const enrichedModels = await enrichModelsWithPrices(booking.models);
  const enrichedAccessories = await enrichAccessoriesWithPrices(booking.accessories);

  const pricing = calculatePricing(
    enrichedModels,
    enrichedAccessories,
    booking.insurance,
    booking.startDate,
    booking.endDate
  );

  // Find available cameras for each model and create individual bookings
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Server configuration error' }));
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Get all available cameras for the requested period
  const { data: allCameras, error: camerasError } = await supabase
    .from('Camera')
    .select('id, productId');

  if (camerasError) {
    console.error('Error fetching cameras:', camerasError);
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Failed to check camera availability' }));
  }

  // Get existing bookings that overlap with requested period
  const { data: existingBookings, error: bookingsError } = await supabase
    .from('Booking')
    .select('cameraId, startDate, endDate')
    .lte('startDate', booking.endDate)
    .gte('endDate', booking.startDate);

  if (bookingsError) {
    console.error('Error fetching existing bookings:', bookingsError);
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Failed to check existing bookings' }));
  }

  // Find which cameras are booked during the requested period
  const bookedCameraIds = new Set(
    (existingBookings || []).map((b: any) => b.cameraId).filter(Boolean)
  );

  // Find available cameras for each requested model
  const bookingRecords = [];
  
  for (const model of enrichedModels) {
    // Find cameras for this product
    const modelCameras = (allCameras || []).filter((c: any) => c.productId === model.productId);
    const availableCameras = modelCameras.filter((c: any) => !bookedCameraIds.has(c.id));
    
    if (availableCameras.length < model.quantity) {
      return sendError(event, createError({ 
        statusCode: 409, 
        statusMessage: `Not enough cameras available for ${model.name}. Requested: ${model.quantity}, Available: ${availableCameras.length}` 
      }));
    }

    // Create one booking record per camera
    for (let i = 0; i < model.quantity; i++) {
      const camera = availableCameras[i];
      const bookingRecord = {
        // Only include fields that exist in the Booking table (matching database schema)
        cameraId: camera.id,
        cameraName: `Kamera ${i + 1}`, // Generate proper camera names like "Kamera 1", "Kamera 2"
        productName: model.name, // Add the missing productName field
        startDate: booking.startDate,
        endDate: booking.endDate,
        address: '', // Will be set by payment API
        apartment: '', // Will be set by payment API
        email: '', // Will be set by payment API
        fullName: '', // Will be set by payment API
        phone: '', // Will be set by payment API
        totalPrice: enrichedModels.length > 1 || enrichedModels.some(m => m.quantity > 1) 
          ? Math.round((pricing.total / enrichedModels.reduce((sum, m) => sum + m.quantity, 0)) * 100) // Convert DKK to øre
          : Math.round(pricing.total * 100), // Convert DKK to øre
        city: '', // Will be set by payment API
        orderId: null, // NULL initially, will be set by payment API to same value for all bookings
        paymentId: '', // Will be set by payment API
        paymentStatus: 'pending',
        paidAt: null, // NULL until payment is confirmed
        postalCode: '', // Will be set by payment API
        return_processed: false // Boolean field for return process (corrected field name)
      };
      
      bookingRecords.push(bookingRecord);
      bookedCameraIds.add(camera.id); // Mark this camera as taken for subsequent iterations
    }
  }

  // Insert all booking records
  const { error: insertError } = await supabase
    .from('Booking')
    .insert(bookingRecords);

  if (insertError) {
    console.error('Booking insertion error:', insertError);
    return {
      status: 500,
      message: 'Failed to create booking',
    };
  }

  // Clear availability cache since new bookings affect availability
  console.log('🗑️ Clearing availability cache due to new booking')
  apiCache.clearByPrefix('availability')

  return {
    status: 200,
    message: `Booking created successfully (${bookingRecords.length} camera${bookingRecords.length > 1 ? 's' : ''} booked)`,
  };
});
