import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

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
  const body = await readBody(event);
  const result = bookingSchema.safeParse(body);
  if (!result.success) {
    return {
      status: 400,
      errors: result.error.issues,
      message: 'Validation failed',
    };
  }
  const booking = result.data;

  // Availability check (prevent double booking)
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

  // If all checks pass, insert booking
  const { error: insertError } = await supabase
    .from('Booking')
    .insert([booking]);

  if (insertError) {
    return {
      status: 500,
      message: 'Failed to create booking',
    };
  }

  return {
    status: 200,
    message: 'Booking created successfully',
  };
});
