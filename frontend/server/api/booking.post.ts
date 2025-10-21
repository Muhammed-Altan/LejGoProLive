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

  const bookingData = {
    ...booking,
    models: enrichedModels,
    accessories: enrichedAccessories,
    ...pricing
  };

  // Insert booking with enforced pricing
  const { error: insertError } = await supabase
    .from('Booking')
    .insert([bookingData]);

  if (insertError) {
    return {
      status: 500,
      message: 'Failed to create booking',
    };
  }

  return {
    status: 200,
    message: 'Booking created successfully',
    ...pricing
  };
});
