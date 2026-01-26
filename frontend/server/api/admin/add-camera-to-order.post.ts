import { createServerSupabaseClient } from '../../utils/supabase';
import { authenticateAdmin } from '../../utils/adminAuth';
import { defineEventHandler, readBody, createError, getHeaders } from 'h3';

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

        // Create payment link for the new camera
        console.log('💳 Creating payment link for new camera...');
        const PENSOPAY_API_KEY = process.env.PENSOPAY_API_KEY;
        const PENSOPAY_BASE_URL = 'https://api.pensopay.com/v2';
        
        if (!PENSOPAY_API_KEY) {
            console.error('❌ PensoPay API key not configured');
            throw createError({
                statusCode: 500,
                statusMessage: 'Payment system not configured'
            });
        }

        // Get base URL for callbacks
        const headers = getHeaders(event);
        const host = headers.host || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        
        // Use production URL for both email and PensoPay
        const baseUrl = process.env.NUXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
        const pensopayBaseUrl = baseUrl; // Always use production URL for PensoPay

        // Determine test mode
        const isTestMode = process.env.NODE_ENV !== 'production';

        // Create unique payment order ID using booking ID (PensoPay max 36 chars)
        // Format: PAY-{bookingId}-{timestamp} to ensure uniqueness
        const uniquePaymentOrderId = `PAY-${newBooking.id}-${Date.now().toString().slice(-8)}`;

        const paymentData = {
            order_id: uniquePaymentOrderId,
            amount: parseInt(totalPrice), // Already in øre from database
            currency: 'DKK',
            testmode: isTestMode,
            autocapture: true,
            callback_url: `${pensopayBaseUrl}/api/payment/callback`,
            success_url: `${pensopayBaseUrl}/payment/success?orderId=${newOrderId}`,
            cancel_url: `${pensopayBaseUrl}/payment/cancelled?orderId=${newOrderId}`,
            expires_in: 600
        };

        console.log('Creating PensoPay payment:', { ...paymentData, apiKey: '***' });

        const paymentResponse = await fetch(`${PENSOPAY_BASE_URL}/payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PENSOPAY_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(paymentData)
        });

        if (!paymentResponse.ok) {
            const errorText = await paymentResponse.text();
            console.error('PensoPay payment creation failed:', errorText);
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to create payment link'
            });
        }

        const payment = await paymentResponse.json();
        
        if (!payment.link) {
            console.error('Payment created but no link provided');
            throw createError({
                statusCode: 500,
                statusMessage: 'Payment link not generated'
            });
        }

        console.log('✅ Payment link created:', payment.link);

        // Update booking with payment ID
        await supabase
            .from('Booking')
            .update({ paymentId: payment.id })
            .eq('id', newBooking.id);

        // Send email to customer with payment link
        console.log('📧 Sending payment request email to customer...');
        
        try {
            const emailData = {
                bookingData: {
                    orderNumber: newOrderId,
                    customerName: customerInfo.fullName,
                    customerEmail: customerInfo.email,
                    customerPhone: customerInfo.phone,
                    service: `${productName} - Tilføjet til ordre`,
                    startDate: startDate,
                    endDate: endDate,
                    totalAmount: parseInt(totalPrice) / 100, // Convert from øre to DKK
                    address: customerInfo.address,
                    apartment: customerInfo.apartment,
                    city: customerInfo.city,
                    postalCode: customerInfo.postalCode,
                    items: [{
                        name: productName,
                        quantity: 1,
                        unitPrice: parseInt(totalPrice) / 100,
                        totalPrice: parseInt(totalPrice) / 100
                    }],
                    isUpdate: true,
                    priceDifference: parseInt(totalPrice) / 100,
                    paymentUrl: payment.link
                }
            };

            console.log('📧 Email data being sent:', JSON.stringify(emailData, null, 2));
            console.log('📧 Payment URL in email data:', emailData.bookingData.paymentUrl);

            const emailResponse = await fetch(`${baseUrl}/api/email/send-receipt-pdf`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (emailResponse.ok) {
                console.log('✅ Payment request email sent successfully');
            } else {
                console.error('⚠️ Failed to send email, but booking was created');
            }
        } catch (emailError) {
            console.error('⚠️ Email sending error:', emailError);
            // Don't fail the request if email fails - booking and payment link were created
        }

        return {
            success: true,
            message: 'Camera added to order successfully. Payment link sent to customer.',
            data: {
                bookingId: newBooking.id,
                orderId: newOrderId,
                baseOrderId: baseOrderId,
                paymentUrl: payment.link,
                paymentRequired: true
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
