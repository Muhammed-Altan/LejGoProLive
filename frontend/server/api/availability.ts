// Check product availability for booking
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env vars');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function checkAvailability(models: Array<{ productId: number; quantity: number }>, startDate: string, endDate: string): Promise<boolean> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check each product to see if we have enough available cameras
  for (const model of models) {
    // Get all cameras for this product
    const { data: cameras, error: camerasError } = await supabase
      .from('Camera')
      .select('id')
      .eq('productId', model.productId);
      
    if (camerasError || !cameras) {
      console.error('Error fetching cameras for product:', model.productId);
      return false;
    }
    
    let availableCameras = 0;
    
    // Check each camera for availability during the requested period
    for (const camera of cameras) {
      const { data: conflictingBookings, error: bookingsError } = await supabase
        .from('Booking')
        .select('startDate, endDate')
        .eq('cameraId', camera.id);
        
      if (bookingsError) {
        console.error('Error checking bookings for camera:', camera.id);
        continue;
      }
      
      // Check if this camera has any date conflicts
      const hasConflict = conflictingBookings?.some((booking: any) => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);
        // Check if date ranges overlap
        return start <= bookingEnd && end >= bookingStart;
      });
      
      if (!hasConflict) {
        availableCameras++;
      }
    }
    
    // Check if we have enough available cameras for this model
    if (availableCameras < model.quantity) {
      console.log(`Not enough cameras available for product ${model.productId}: need ${model.quantity}, have ${availableCameras}`);
      return false;
    }
  }
  
  return true;
}
