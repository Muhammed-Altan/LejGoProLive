import nodemailer from 'nodemailer'
import QRCode from 'qrcode'
import { authenticateAdmin } from '../../utils/adminAuth'
import { createServerSupabaseClient } from '../../utils/supabase'

interface ServicePoint {
  id: string
  name: string
  address: {
    street: string
    streetNumber: string
    postalCode: string
    city: string
    countryCode: string
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Authenticate admin user
    authenticateAdmin(event)

    const config = useRuntimeConfig()
    const body = await readBody(event)
    const { orderId } = body

    if (!orderId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Order ID is required'
      })
    }

    // Get order details from database
    const supabase = createServerSupabaseClient()
    
    // Fetch all bookings with this orderId (using LIKE pattern to match base order ID)
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .select('*')
      .like('orderId', `${orderId}%`)
      .order('id')

    if (bookingsError || !bookings || bookings.length === 0) {
      console.error('Error fetching bookings:', bookingsError)
      throw createError({
        statusCode: 404,
        statusMessage: 'Order not found'
      })
    }

    const mainBooking = bookings[0]
    
    // Parse service point from booking
    let servicePoint: ServicePoint | null = null
    if (mainBooking.selectedServicePoint) {
      try {
        servicePoint = typeof mainBooking.selectedServicePoint === 'string' 
          ? JSON.parse(mainBooking.selectedServicePoint)
          : mainBooking.selectedServicePoint
      } catch (e) {
        console.error('Failed to parse service point:', e)
      }
    }

    if (!servicePoint) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No service point selected for this order. Please select a pickup location.'
      })
    }

    console.log('📱 Generating local shipping QR codes for order:', orderId)

    // Generate local tracking numbers (PostNord format simulation)
    const timestamp = Date.now()
    const outboundTracking = `PNDK${timestamp}OUT`
    const returnTracking = `PNDK${timestamp}RET`
    
    console.log('Generated tracking numbers:')
    console.log(' - Outbound:', outboundTracking)
    console.log(' - Return:', returnTracking)

    // Generate QR codes
    const outboundQR = await QRCode.toDataURL(outboundTracking, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    })
    
    const returnQR = await QRCode.toDataURL(returnTracking, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    })

    // Update database with tracking numbers
    for (const booking of bookings) {
      await supabase
        .from('Booking')
        .update({
          trackingNumber: outboundTracking,
          returnTrackingNumber: returnTracking,
          postNordItemId: `ITEM-${timestamp}-${booking.id}`,
          returnPostNordItemId: `RETURN-ITEM-${timestamp}-${booking.id}`
        })
        .eq('id', booking.id)
    }

    // Send email with professional shipping labels
    const transporter = nodemailer.createTransport({
      host: 'smtp.simply.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .label { border: 2px solid #000; padding: 20px; margin: 20px 0; page-break-after: always; }
          .header { background: #B90C2C; color: white; padding: 15px; margin: -20px -20px 20px -20px; }
          .qr-section { text-align: center; margin: 20px 0; padding: 20px; background: #f5f5f5; }
          .tracking { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; font-family: monospace; }
          .service-code { background: #FFD700; padding: 10px; text-align: center; font-weight: bold; font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .note { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 20px 0; border-radius: 5px; }
          .info-label { font-weight: bold; color: #666; font-size: 12px; }
          .info-value { font-size: 16px; margin: 5px 0 15px 0; }
        </style>
      </head>
      <body>
        <h1 style="color: #B90C2C;">📦 PostNord Fragt Labels</h1>
        <p><strong>Ordre:</strong> ${orderId}</p>
        <p><strong>Genereret:</strong> ${new Date().toLocaleString('da-DK')}</p>
        
        <div class="note">
          <strong>ℹ️ Instruktioner:</strong> Print disse labels og tag dem med til PostNord.
        </div>

        <!-- OUTBOUND LABEL -->
        <div class="label">
          <div class="header">
            <h2 style="margin: 0;">📦 UDLEVERING - Shop til Kunde</h2>
          </div>
          
          <div class="service-code">
            PostNord MyPack Collect - Service Code 19
          </div>
          
          <div class="qr-section">
            <img src="${outboundQR}" alt="Outbound QR" style="width: 250px; height: 250px;" />
            <div class="tracking">${outboundTracking}</div>
          </div>

          <table>
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="info-label">FRA (Afsender):</div>
                <div class="info-value">
                  <strong>${process.env.SENDER_NAME || 'LejGoPro'}</strong><br>
                  ${process.env.SENDER_ADDRESS || 'Snorresgade 1'}<br>
                  ${process.env.SENDER_POSTAL_CODE || '2300'} ${process.env.SENDER_CITY || 'Copenhagen'}<br>
                  ${process.env.SENDER_PHONE || '+4512345678'}
                </div>
              </td>
              <td style="width: 50%; vertical-align: top;">
                <div class="info-label">TIL (Modtager):</div>
                <div class="info-value">
                  <strong>${mainBooking.fullName}</strong><br>
                  ${mainBooking.email}<br>
                  ${mainBooking.phone || ''}
                </div>
              </td>
            </tr>
          </table>

          <div style="background: #e3f2fd; padding: 15px; margin-top: 10px;">
            <div class="info-label">AFHENTNINGSSTED:</div>
            <div class="info-value">
              <strong>${servicePoint.name}</strong><br>
              ${servicePoint.address.street} ${servicePoint.address.streetNumber}<br>
              ${servicePoint.address.postalCode} ${servicePoint.address.city}
            </div>
          </div>

          <div style="margin: 15px 0;">
            <div class="info-label">INDHOLD:</div>
            <div class="info-value">${bookings.map(b => b.productName).join(', ')}</div>
          </div>
        </div>

        <!-- RETURN LABEL -->
        <div class="label">
          <div class="header">
            <h2 style="margin: 0;">🔄 RETUR - Kunde til Shop</h2>
          </div>
          
          <div class="service-code">
            PostNord Return - Service Code 19
          </div>
          
          <div class="qr-section">
            <img src="${returnQR}" alt="Return QR" style="width: 250px; height: 250px;" />
            <div class="tracking">${returnTracking}</div>
          </div>

          <table>
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <div class="info-label">FRA (Kunde):</div>
                <div class="info-value">
                  <strong>${mainBooking.fullName}</strong><br>
                  ${mainBooking.email}<br>
                  ${mainBooking.phone || ''}
                </div>
              </td>
              <td style="width: 50%; vertical-align: top;">
                <div class="info-label">TIL (Shop):</div>
                <div class="info-value">
                  <strong>${process.env.SENDER_NAME || 'LejGoPro'}</strong><br>
                  ${process.env.SENDER_ADDRESS || 'Snorresgade 1'}<br>
                  ${process.env.SENDER_POSTAL_CODE || '2300'} ${process.env.SENDER_CITY || 'Copenhagen'}<br>
                  ${process.env.SENDER_PHONE || '+4512345678'}
                </div>
              </td>
            </tr>
          </table>

          <div style="background: #e3f2fd; padding: 15px; margin-top: 10px;">
            <div class="info-label">AFLEVERING:</div>
            <div class="info-value">
              Kunden kan aflevere på en hvilken som helst PostNord pakkeshop
            </div>
          </div>
        </div>

        <div class="note">
          <strong>📋 Ordre Detaljer:</strong><br>
          Ordre ID: ${orderId}<br>
          Kunde: ${mainBooking.fullName} (${mainBooking.email})<br>
          Produkter: ${bookings.map(b => b.productName).join(', ')}<br>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: `"LejGoPro" <${process.env.EMAIL_USER}>`,
      to: config.adminEmail || process.env.EMAIL_USER,
      subject: `📦 PostNord Labels - Ordre ${orderId}`,
      html: emailHtml
    })

    console.log('✅ Shipping labels generated and sent')

    return {
      success: true,
      message: 'Shipping labels generated and sent to admin email',
      outboundTrackingNumber: outboundTracking,
      returnTrackingNumber: returnTracking
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to generate shipping labels'
    })
  }
})
