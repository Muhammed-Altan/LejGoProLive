import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) throw new Error('Missing Supabase env vars');
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async (event: any) => {
  const url = new URL(event.req.url, `http://${event.req.headers.host}`);
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

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
  // Use server-side filtering to reduce bandwidth: bookings where startDate <= end AND endDate >= start
  const { data: bookings, error: bookingsError } = await supabase
    .from('Booking')
    .select('id, cameraId, productId, quantity, selectedModels, selectedAccessories, accessoryInstanceIds, startDate, endDate')
    .lte('startDate', end.toISOString())
    .gte('endDate', start.toISOString());

  if (bookingsError) {
    return {
      status: 500,
      body: { error: 'Error fetching bookings', details: bookingsError }
    };
  }

  // Build map of booked quantities (product-level) and booked camera ids
  const bookedMap: Record<number, number> = {};
  const bookedCameraIds = new Set<number>();
  const bookedAccessoryMap: Record<string, number> = {}; // accessory name -> booked quantity
  const bookedAccessoryInstanceIds = new Set<number>();
  
  (bookings || []).forEach((b: any) => {
    // If a booking references a specific camera, mark it as booked
    if (b.cameraId) bookedCameraIds.add(b.cameraId);

    // Legacy: if booking has productId and quantity, use it
    if (typeof b.productId === 'number') {
      bookedMap[b.productId] = (bookedMap[b.productId] || 0) + (b.quantity || 1);
    }

    // Modern: if booking has selectedModels JSONB array, iterate entries
    if (Array.isArray(b.selectedModels)) {
      b.selectedModels.forEach((m: any) => {
        const pid = m.productId ?? m.id;
        const qty = typeof m.quantity === 'number' ? m.quantity : (m.quantity ? Number(m.quantity) : 1);
        if (typeof pid === 'number') bookedMap[pid] = (bookedMap[pid] || 0) + (qty || 1);
      });
    }

    // Modern: if booking has selectedAccessories JSONB array, iterate entries
    if (Array.isArray(b.selectedAccessories)) {
      b.selectedAccessories.forEach((a: any) => {
        const name = (a.name || '').toString().trim().toLowerCase();
        const qty = typeof a.quantity === 'number' ? a.quantity : (a.quantity ? Number(a.quantity) : 1);
        if (name) bookedAccessoryMap[name] = (bookedAccessoryMap[name] || 0) + (qty || 1);
      });
    }

    // Track booked accessory instance IDs
    if (b.accessoryInstanceIds) {
      let instanceIds: number[] = [];
      if (Array.isArray(b.accessoryInstanceIds)) {
        instanceIds = b.accessoryInstanceIds.filter((x: any) => typeof x === 'number');
      } else if (typeof b.accessoryInstanceIds === 'string') {
        try {
          const parsed = JSON.parse(b.accessoryInstanceIds);
          if (Array.isArray(parsed)) {
            instanceIds = parsed.filter((x: any) => typeof x === 'number');
          }
        } catch (e) {
          // ignore parsing errors
        }
      }
      instanceIds.forEach(id => bookedAccessoryInstanceIds.add(id));
    }
  });

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
    .select('id, productId, isAvailable');

  if (camerasError) {
    // Not critical — return product availability but include cameras error info
    return {
      status: 200,
      body: { availability, cameraAvailability: null, error: 'Error fetching cameras', details: camerasError }
    };
  }

  const cameraAvailability: Record<number, { totalCameras: number; availableCameras: number; bookedCameraIds: number[] }> = {};
  (cameras || []).forEach((c: any) => {
    const pid = c.productId;
    if (!cameraAvailability[pid]) cameraAvailability[pid] = { totalCameras: 0, availableCameras: 0, bookedCameraIds: [] };
    cameraAvailability[pid].totalCameras += 1;
    const isBooked = bookedCameraIds.has(c.id) || c.isAvailable === false;
    if (!isBooked) cameraAvailability[pid].availableCameras += 1;
    if (bookedCameraIds.has(c.id)) cameraAvailability[pid].bookedCameraIds.push(c.id);
  });

  // Compute accessory availability
  const { data: accessories, error: accessoriesError } = await supabase
    .from('Accessory')
    .select('id, name, quantity');

  const accessoryAvailability: Record<string, { total: number; available: number; booked: number }> = {};
  
  if (!accessoriesError && accessories) {
    for (const acc of accessories) {
      const name = (acc.name || '').toString().trim().toLowerCase();
      const total = typeof acc.quantity === 'number' ? acc.quantity : 5;
      const booked = bookedAccessoryMap[name] || 0;
      const available = Math.max(0, total - booked);
      
      accessoryAvailability[name] = {
        total,
        available,
        booked
      };
    }
  }

  return {
    status: 200,
    body: { availability, cameraAvailability, accessoryAvailability }
  };
};
