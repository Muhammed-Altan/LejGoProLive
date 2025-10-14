import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { getRequestIP, sendError, createError } from 'h3';
import { calculatePricing } from './pricing';
import { enrichModelsWithPrices, enrichAccessoriesWithPrices } from './productUtils';
// Rate limiter setup: 2 requests per 600 sekunder per IP
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
});

export default defineEventHandler(async (event) => {
  // --- Rate limiting ---
  const ip = getRequestIP(event) || 'unknown';
  try {
    await rateLimiter.consume(ip);
  } catch {
    return sendError(event, createError({ statusCode: 429, statusMessage: 'Rate limit exceeded. Prøv igen senere.' }));
  }

  // --- Input Sanitization ---
  const body = await readBody(event);
  // Remove any unexpected fields and trim strings
  function sanitizeString(str: unknown): string {
    return typeof str === 'string' ? str.trim() : '';
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

  // --- Date Range Validation ---
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Minimum start date: 3 days from today
  const minStart = new Date(today);
  minStart.setDate(today.getDate() + 3);
  // Minimum rental period: 3 days
  const minEnd = new Date(start);
  minEnd.setDate(start.getDate() + 2); // +2 because start+2 = 3 days incl. start
  if (start < minStart) {
    return {
      status: 400,
      message: 'Start date must be at least 3 days from today',
    };
  }
  if (end < minEnd) {
    return {
      status: 400,
      message: 'Rental period must be at least 3 days',
    };
  }
  if (end < start) {
    return {
      status: 400,
      message: 'End date must be after start date',
    };
  }

  // --- Weekend Exclusion (start date cannot be Sat/Sun) ---
  if (start.getDay() === 0 || start.getDay() === 6) {
    return {
      status: 400,
      message: 'Start date cannot be a weekend',
    };
  }

  // --- Availability check (prevent double booking) ---
  const { data: bookings, error } = await supabase
    .from('Booking')
    .select('productId, quantity, startDate, endDate');

  if (error) {
    return {
      status: 500,
      message: 'Database error',
    };
  }

  // Check for overlapping bookings and available quantity
  for (const model of booking.models) {
    let available = model.quantity;
    let totalQty = model.quantity;
    // You may want to fetch the product's total quantity from Product table
    // For now, assume 5 as default
    totalQty = 5;
    const overlapping = bookings.filter((b: any) => {
      return b.productId === model.productId &&
        new Date(booking.startDate) <= new Date(b.endDate) &&
        new Date(booking.endDate) >= new Date(b.startDate);
    });
    const bookedQty = overlapping.reduce((sum: number, b: any) => sum + (b.quantity || 1), 0);
    if (bookedQty + model.quantity > totalQty) {
      return {
        status: 409,
        message: `Not enough availability for product ${model.name}`,
      };
    }
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
