import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { sendError, createError } from 'h3';
import { calculatePricing } from '../pricing';
import { enrichModelsWithPrices, enrichAccessoriesWithPrices } from '../productUtils';
import { authenticateAdmin } from '../../utils/adminAuth';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { apiCache } from '../../utils/cache';

// Zod schema for admin booking validation
const adminBookingSchema = z.object({
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
  // Customer info
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  apartment: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  city: z.string().min(1, 'City is required'),
  // Optional fields
  insurance: z.boolean().optional(),
  notes: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  // --- Authentication - REQUIRED for admin endpoints ---
  const user = authenticateAdmin(event);

  // --- Input Sanitization ---
  const body = await readBody(event);
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);

  function sanitizeString(str: unknown): string {
    return typeof str === 'string' ? purify.sanitize(str.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) : '';
  }
  function sanitizeNumber(num: unknown): number {
    return typeof num === 'number' && !isNaN(num) ? num : 0;
  }

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
    fullName: sanitizeString(body.fullName),
    email: sanitizeString(body.email),
    phone: sanitizeString(body.phone),
    address: sanitizeString(body.address),
    apartment: sanitizeString(body.apartment || ''),
    postalCode: sanitizeString(body.postalCode),
    city: sanitizeString(body.city),
    insurance: !!body.insurance,
    notes: sanitizeString(body.notes || ''),
  };

  // --- Zod Validation ---
  const result = adminBookingSchema.safeParse(sanitizedBody);
  if (!result.success) {
    return {
      status: 400,
      errors: result.error.issues,
      message: 'Validation failed',
    };
  }
  const booking = result.data;

  // --- Basic validation ---
  const startDate = new Date(booking.startDate);
  const endDate = new Date(booking.endDate);
  
  if (endDate <= startDate) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'End date must be after start date' }));
  }

  // --- Use Supabase Service Role Key to bypass RLS ---
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Server configuration error' }));
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // --- Pricing Calculation ---
  const enrichedModels = await enrichModelsWithPrices(booking.models);
  const enrichedAccessories = await enrichAccessoriesWithPrices(booking.accessories);

  const pricing = calculatePricing(
    enrichedModels,
    enrichedAccessories,
    booking.insurance || false,
    booking.startDate,
    booking.endDate
  );

  // Generate unique order ID for this admin booking
  const orderId = `ADMIN-${Date.now()}`;

  // --- Get available cameras ---
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

  // --- Allocate accessory instances ---
  const bookingRecords = [];
  let allocatedAccessoryInstances: number[] = [];
  
  if (enrichedAccessories && enrichedAccessories.length > 0) {
    console.log('🎒 [Admin] Allocating accessory instances...');
    
    for (const accessory of enrichedAccessories) {
      const { data: accessoryData, error: accessoryLookupError } = await supabase
        .from('Accessory')
        .select('id')
        .eq('name', accessory.name)
        .single();
      
      if (accessoryLookupError || !accessoryData) {
        console.error(`❌ Accessory not found: ${accessory.name}`);
        return sendError(event, createError({ 
          statusCode: 400, 
          statusMessage: `Accessory not found: ${accessory.name}` 
        }));
      }
      
      // Find available accessory instances
      const { data: accessoryInstances, error: accessoryError } = await supabase
        .from('AccessoryInstance')
        .select('id, accessoryId, isAvailable')
        .eq('accessoryId', accessoryData.id)
        .eq('isAvailable', true)
        .limit(accessory.quantity);
      
      if (accessoryError || !accessoryInstances || accessoryInstances.length < accessory.quantity) {
        console.error(`❌ Not enough ${accessory.name} instances available`);
        return sendError(event, createError({ 
          statusCode: 409, 
          statusMessage: `Not enough ${accessory.name} available. Requested: ${accessory.quantity}, Available: ${accessoryInstances?.length || 0}` 
        }));
      }
      
      const instanceIds = accessoryInstances.slice(0, accessory.quantity).map(instance => instance.id);
      allocatedAccessoryInstances.push(...instanceIds);
      
      console.log(`✅ Allocated ${instanceIds.length} instances of ${accessory.name}`);
    }
  }
  
  // --- Allocate cameras and create booking records ---
  for (const model of enrichedModels) {
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
        cameraId: camera.id,
        cameraName: `Kamera ${i + 1}`,
        productName: model.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        address: booking.address,
        apartment: booking.apartment || '',
        email: booking.email,
        fullName: booking.fullName,
        phone: booking.phone,
        totalPrice: Math.round((pricing.total / enrichedModels.reduce((sum, m) => sum + m.quantity, 0)) * 100), // Convert to øre
        city: booking.city,
        orderId: orderId,
        paymentId: 'ADMIN-MANUAL', // Mark as admin manual booking
        paymentStatus: 'paid', // Admin bookings are considered paid
        paidAt: new Date().toISOString(),
        postalCode: booking.postalCode,
        return_processed: false,
        accessoryInstanceIds: allocatedAccessoryInstances.length > 0 ? allocatedAccessoryInstances : null
      };
      
      bookingRecords.push(bookingRecord);
      bookedCameraIds.add(camera.id);
    }
  }

  // --- Insert all booking records (bypassing RLS with service role key) ---
  const { data: insertedBookings, error: insertError } = await supabase
    .from('Booking')
    .insert(bookingRecords)
    .select();

  if (insertError) {
    console.error('Booking insertion error:', insertError);
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: 'Failed to create booking: ' + insertError.message 
    }));
  }

  // --- Mark accessory instances as unavailable ---
  if (allocatedAccessoryInstances.length > 0) {
    console.log(`🎒 [Admin] Marking ${allocatedAccessoryInstances.length} accessory instances as unavailable...`);
    
    const { error: accessoryUpdateError } = await supabase
      .from('AccessoryInstance')
      .update({ isAvailable: false })
      .in('id', allocatedAccessoryInstances);
    
    if (accessoryUpdateError) {
      console.error('Error marking accessory instances as unavailable:', accessoryUpdateError);
    } else {
      console.log(`✅ Successfully marked accessory instances as unavailable`);
    }
  }

  // --- Clear availability cache ---
  console.log('🗑️ [Admin] Clearing availability cache');
  apiCache.clearByPrefix('availability');

  return {
    status: 200,
    message: `Admin booking created successfully`,
    orderId: orderId,
    bookingCount: bookingRecords.length,
    totalPrice: pricing.total,
    bookings: insertedBookings,
  };
});
