import { createServerSupabaseClient } from '../../utils/supabase';
import { authenticateAdmin } from '../../utils/adminAuth';
import { defineEventHandler, readBody, createError } from 'h3';

// Helper function to get camera number from camera ID
function getCameraNumberFromId(cameraId: number): number {
    // This is a simple implementation - you might want to query the database
    // to get the actual camera index within its product
    return cameraId;
}

export default defineEventHandler(async (event) => {
    try {
        // Authenticate admin user
        const user = authenticateAdmin(event);
        
        const supabase = createServerSupabaseClient();
        const body = await readBody(event);

        const {
            baseOrderId,
            cameraId,
            productName,
            startDate,
            endDate,
            totalPrice,
            customerInfo
        } = body;

        // Validate required fields
        if (!baseOrderId || !cameraId || !productName || !startDate || !endDate || totalPrice === undefined) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required fields'
            });
        }

        // Check camera availability for the specified period
        const { data: existingBookings, error: availabilityError } = await supabase
            .from('Booking')
            .select('id, startDate, endDate')
            .eq('cameraId', cameraId)
            .or(`and(startDate.lte.${endDate},endDate.gte.${startDate})`);

        if (availabilityError) {
            console.error('Error checking camera availability:', availabilityError);
            throw createError({
                statusCode: 500,
                statusMessage: 'Error checking camera availability'
            });
        }

        if (existingBookings && existingBookings.length > 0) {
            throw createError({
                statusCode: 400,
                statusMessage: `Kamera ${cameraId} er allerede booket i den valgte periode`
            });
        }

        // Find existing bookings with the same base order ID to get the next sub-ID
        const { data: sameOrderBookings, error: fetchError } = await supabase
            .from('Booking')
            .select('orderId')
            .like('orderId', `${baseOrderId}%`)
            .order('orderId', { ascending: false });

        if (fetchError) {
            console.error('Error fetching existing order bookings:', fetchError);
            throw createError({
                statusCode: 500,
                statusMessage: 'Error fetching order information'
            });
        }

        // Calculate the next order ID suffix
        let nextSuffix = 1;
        if (sameOrderBookings && sameOrderBookings.length > 0) {
            const suffixes = sameOrderBookings
                .map(b => {
                    const match = b.orderId.match(/-(\d+)$/);
                    return match ? parseInt(match[1]) : 0;
                })
                .filter(n => !isNaN(n));
            
            if (suffixes.length > 0) {
                nextSuffix = Math.max(...suffixes) + 1;
            }
        }

        const newOrderId = `${baseOrderId}-${nextSuffix}`;

        // Create new booking
        const { data: newBooking, error: insertError } = await supabase
            .from('Booking')
            .insert({
                orderId: newOrderId,
                cameraId: parseInt(cameraId),
                cameraName: `Kamera ${getCameraNumberFromId(parseInt(cameraId))}`,
                productName: productName,
                fullName: customerInfo.fullName,
                email: customerInfo.email,
                phone: customerInfo.phone,
                address: customerInfo.address,
                apartment: customerInfo.apartment || '',
                city: customerInfo.city,
                postalCode: customerInfo.postalCode,
                startDate: startDate,
                endDate: endDate,
                totalPrice: parseInt(totalPrice),
                paymentStatus: 'pending', // New camera addition requires payment
                paymentId: '',
                paidAt: null,
                return_processed: false,
                accessoryInstanceIds: null,
                createdAt: new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating new booking:', insertError);
            throw createError({
                statusCode: 500,
                statusMessage: 'Error creating new booking: ' + insertError.message
            });
        }

        console.log('✅ Successfully added camera to order:', {
            baseOrderId,
            newOrderId,
            cameraId,
            productName,
            bookingId: newBooking.id
        });

        return {
            success: true,
            message: 'Camera added to order successfully',
            data: {
                bookingId: newBooking.id,
                orderId: newOrderId,
                baseOrderId: baseOrderId
            }
        };

    } catch (error: any) {
        console.error('Error in add-camera-to-order API:', error);
        
        // If it's already a createError, rethrow it
        if (error.statusCode) {
            throw error;
        }
        
        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Internal server error'
        });
    }
});
