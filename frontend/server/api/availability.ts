// Check product availability for booking
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env vars');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkAvailability(models: Array<{ productId: number; quantity: number }>, startDate: string, endDate: string): Promise<boolean> {
  const { data: bookings, error } = await supabase
    .from('Booking')
    .select('productId, quantity, startDate, endDate');
  if (error) throw error;
  const bookedMap: Record<number, number> = {};
  const start = new Date(startDate);
  const end = new Date(endDate);
  bookings?.forEach((booking: any) => {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);
    if (start <= bookingEnd && end >= bookingStart) {
      bookedMap[booking.productId] = (bookedMap[booking.productId] || 0) + (booking.quantity || 1);
    }
  });
  const ids = models.map(m => m.productId);
  const { data: products, error: prodError } = await supabase
    .from('Product')
    .select('id, quantity')
    .in('id', ids);
  if (prodError) throw prodError;
  for (const model of models) {
    const product = products?.find((p: any) => p.id === model.productId);
    const totalQty = product?.quantity ?? 5;
    const bookedQty = bookedMap[model.productId] || 0;
    const availableQty = Math.max(0, totalQty - bookedQty);
    if (model.quantity > availableQty) return false;
  }
  return true;
}
