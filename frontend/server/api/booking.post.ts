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

// Check accessory availability for a booking period
async function checkAccessoryAvailability(accessories: Array<{ name: string; quantity: number }>, startDate: string, endDate: string): Promise<boolean> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return false;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Get bookings that overlap with the requested period
  const { data: bookings, error: bookingsError } = await supabase
    .from('Booking')
    .select('selectedAccessories')
    .lte('startDate', endDate)
    .gte('endDate', startDate);
    
  if (bookingsError) {
    console.error('Error checking accessory availability:', bookingsError);
    return false;
  }
  
  // Calculate booked quantities per accessory
  const bookedQuantities: Record<string, number> = {};
  (bookings || []).forEach((booking: any) => {
    if (Array.isArray(booking.selectedAccessories)) {
      booking.selectedAccessories.forEach((acc: any) => {
        const name = (acc.name || '').toString().trim().toLowerCase();
        const qty = typeof acc.quantity === 'number' ? acc.quantity : 1;
        bookedQuantities[name] = (bookedQuantities[name] || 0) + qty;
      });
    }
  });
  
  // Get accessory total quantities from DB
  const { data: dbAccessories, error: accessoriesError } = await supabase
    .from('Accessory')
    .select('name, quantity');
    
  if (accessoriesError) {
    console.error('Error fetching accessories:', accessoriesError);
    return false;
  }
  
  // Check if requested quantities are available
  for (const reqAcc of accessories) {
    const name = reqAcc.name.toLowerCase();
    const requestedQty = reqAcc.quantity;
    const bookedQty = bookedQuantities[name] || 0;
    
    const dbAcc = dbAccessories?.find(a => a.name.toLowerCase() === name);
    const totalQty = dbAcc?.quantity || 5; // fallback
    
    const availableQty = totalQty - bookedQty;
    if (requestedQty > availableQty) {
      return false;
    }
  }
  
  return true;
=======
// Helper function to find available camera for a product
async function findAvailableCamera(productId: number, startDate: string, endDate: string): Promise<{ cameraId: number; cameraName: string } | null> {
  console.log(`Finding available camera for product ${productId} from ${startDate} to ${endDate}`);
  
  // Get all cameras for this product with their sequential order and verify product relationship
  const { data: cameras, error: camerasError } = await supabase
    .from('Camera')
    .select('id, productId')
    .eq('productId', productId)
    .order('id');
    
  if (camerasError || !cameras || cameras.length === 0) {
    console.error('No cameras found for product:', productId, camerasError);
    return null;
  }
  
  // Double-check that all cameras actually belong to this product
  const validCameras = cameras.filter(c => c.productId === productId);
  if (validCameras.length !== cameras.length) {
    console.error('Camera-product mismatch detected!', { requested: productId, cameras });
  }
  
  console.log(`Found ${validCameras.length} cameras for product ${productId}:`, validCameras.map(c => `ID:${c.id} (Product:${c.productId})`));
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check each camera for availability
  for (let i = 0; i < validCameras.length; i++) {
    const camera = validCameras[i];
    
    // Get existing bookings for this camera that overlap with requested dates
    const { data: conflictingBookings, error: bookingsError } = await supabase
      .from('Booking')
      .select('startDate, endDate, productName')
      .eq('cameraId', camera.id);
      
    if (bookingsError) {
      console.error('Error checking bookings for camera:', camera.id, bookingsError);
      continue;
    }
    
    console.log(`Camera ${camera.id} has ${conflictingBookings?.length || 0} existing bookings`);
    
    // Check if this camera has any date conflicts
    const hasConflict = conflictingBookings?.some((booking: any) => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      // Check if date ranges overlap
      const overlap = start <= bookingEnd && end >= bookingStart;
      if (overlap) {

}
// Rate limiter setup: 2 requests per 600 seconds per IP
const rateLimiter = new RateLimiterMemory({
  points: 2,
  duration: 600,
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
  if (!enforceMaxAccessoryQuantities(booking.accessories)) {
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

  // Find available cameras for each model
  const bookingsToInsert = [];
  
  for (const model of enrichedModels) {
    for (let i = 0; i < model.quantity; i++) {
      const availableCamera = await findAvailableCamera(model.productId, booking.startDate, booking.endDate);
      
      if (!availableCamera) {
        return sendError(event, createError({ 
          statusCode: 409, 
          statusMessage: `No available cameras for ${model.name} during requested dates` 
        }));
      }
      
      console.log(`Booking assignment: Product ${model.name} (ID: ${model.productId}) -> Camera ${availableCamera.cameraId} (${availableCamera.cameraName})`);
      
      // Verify camera belongs to correct product
      const { data: cameraVerification } = await supabase
        .from('Camera')
        .select('productId')
        .eq('id', availableCamera.cameraId)
        .single();
        
      if (cameraVerification?.productId !== model.productId) {
        console.error(`CRITICAL ERROR: Camera ${availableCamera.cameraId} belongs to product ${cameraVerification?.productId}, not ${model.productId}`);
        return sendError(event, createError({ 
          statusCode: 500, 
          statusMessage: `Camera assignment error for ${model.name}` 
        }));
      }
      
      const individualBooking = {
        ...booking,
        productId: model.productId,
        productName: model.name,
        cameraId: availableCamera.cameraId,
        cameraName: availableCamera.cameraName,
        quantity: 1, // Each booking is for one camera
        models: [{ ...model, quantity: 1 }],
        accessories: enrichedAccessories,
        ...pricing
      };
      
      bookingsToInsert.push(individualBooking);
    }
  }

  // Insert all bookings
  const { error: insertError } = await supabase
    .from('Booking')
    .insert(bookingsToInsert);

  if (insertError) {
    console.error('Booking insertion error:', insertError);
    return {
      status: 500,
      message: 'Failed to create booking',
    };
  }

  return {
    status: 200,
    message: 'Booking created successfully',
    bookingsCreated: bookingsToInsert.length,
    ...pricing
  };
});
