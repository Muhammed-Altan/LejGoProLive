import { createClient } from '@supabase/supabase-js';
import { eventHandler, getQuery } from 'h3';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env vars');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const startDate = query.startDate as string;
  const endDate = query.endDate as string;

  if (!startDate || !endDate) {
    return {
      status: 400,
      body: { error: 'startDate and endDate are required' }
    };
  }

  // Parse dates and validate
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return {
      status: 400,
      body: { error: 'Invalid date range' }
    };
  }

  // Query bookings that overlap the given period and retrieve fields we need
  // Include 3-day buffer period after each booking ends (for cleaning, maintenance, etc.)
  // Logic: bookings where startDate <= requestedEnd AND (endDate + 3 days) >= requestedStart
  const startMinus3Days = new Date(start);
  startMinus3Days.setDate(startMinus3Days.getDate() - 3);
  
  const { data: bookings, error: bookingsError } = await supabase
    .from('Booking')
    .select('id, cameraId, startDate, endDate')
    .lte('startDate', end.toISOString())
    .gte('endDate', startMinus3Days.toISOString());

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError);
    // Continue with empty bookings array - still calculate availability based on total quantities
  }

  // Build map of booked quantities (product-level) and booked camera ids
  const bookedMap: Record<number, number> = {};
  const bookedCameraIds = new Set<number>();
  const bookedAccessoryMap: Record<string, number> = {}; // accessory name -> booked quantity
  
  // Only process bookings if we successfully fetched them
  if (!bookingsError && bookings) {
    (bookings || []).forEach((b: any) => {
      // If a booking references a specific camera, mark it as booked
      if (b.cameraId) bookedCameraIds.add(b.cameraId);
      
      // For now, since we don't have selectedModels/selectedAccessories columns,
      // we'll rely on the basic availability calculation from Product.quantity
      // TODO: Add proper JSONB column support when database schema is updated
    });
  }

  // Fetch product quantities for all products
  const { data: products, error: productsError } = await supabase
    .from('Product')
    .select('id, quantity');

  if (productsError) {
    return {
      status: 500,
      body: { error: 'Error fetching products', details: productsError }
    };
  }

  const availability: Record<number, number> = {};
  (products || []).forEach((p: any) => {
    const total = typeof p.quantity === 'number' ? p.quantity : 5;
    const booked = bookedMap[p.id] || 0;
    availability[p.id] = Math.max(0, total - booked);
  });

  // Now compute camera availability per product
  const { data: cameras, error: camerasError } = await supabase
    .from('Camera')
    .select('id, productId');

  const cameraAvailability: Record<number, { totalCameras: number; availableCameras: number; bookedCameraIds: number[] }> = {};
  
  if (!camerasError && cameras) {
    (cameras || []).forEach((c: any) => {
      const pid = c.productId;
      if (!cameraAvailability[pid]) cameraAvailability[pid] = { totalCameras: 0, availableCameras: 0, bookedCameraIds: [] };
      cameraAvailability[pid].totalCameras += 1;
      const isBooked = bookedCameraIds.has(c.id);
      if (!isBooked) cameraAvailability[pid].availableCameras += 1;
      if (bookedCameraIds.has(c.id)) cameraAvailability[pid].bookedCameraIds.push(c.id);
    });
  }

  // Compute accessory availability
  const { data: accessories, error: accessoriesError } = await supabase
    .from('Accessory')
    .select('id, name, quantity');

  const accessoryAvailability: Record<string, { total: number; available: number; booked: number }> = {};
  
  if (!accessoriesError && accessories) {
    for (const acc of accessories) {
      const name = (acc.name || '').toString().trim().toLowerCase();
      const total = typeof acc.quantity === 'number' && acc.quantity > 0 ? acc.quantity : 5;
      const booked = bookedAccessoryMap[name] || 0;
      const available = Math.max(0, total - booked);
      
      accessoryAvailability[name] = {
        total,
        available,
        booked
      };
    }
  }

  const responseBody = { 
    availability, 
    cameraAvailability: camerasError ? null : cameraAvailability, 
    accessoryAvailability,
    errors: {
      cameras: camerasError ? camerasError.message : null,
      accessories: accessoriesError ? accessoriesError.message : null
    }
  };
  
  return {
    status: 200,
    body: responseBody
  };
});
