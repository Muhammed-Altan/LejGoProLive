import nodemailer from 'nodemailer'
import { authenticateAdmin } from '../../utils/adminAuth'
import { createServerSupabaseClient } from '../../utils/supabase'
import QRCode from 'qrcode'

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

    const supabase = createServerSupabaseClient()
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .select('*')
      .like('orderId', `${orderId}%`)
      .order('id')

    if (bookingsError || !bookings || bookings.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Order not found'
      })
    }

    const mainBooking = bookings[0]
    
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
        statusMessage: 'No service point selected'
      })
    }

    console.log('🖨️ Generating shipping labels for:', orderId)

    // Generate tracking numbers if not already set
    let trackingNumber = mainBooking.trackingNumber
    if (!trackingNumber) {
      trackingNumber = `PNDK${Date.now()}SHIP`
      
      await supabase
        .from('Booking')
        .update({ trackingNumber })
        .like('orderId', `${orderId}%`)
    }

    // Generate QR code for label
    const labelQR = await QRCode.toDataURL(trackingNumber, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H'
    })

    const transporter = nodemailer.createTransport({
      host: 'smtp.simply.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    await transporter.sendMail({
      from: `"LejGoPro" <${process.env.EMAIL_USER}>`,
      to: config.adminEmail || process.env.EMAIL_USER,
      subject: `🖨️ Shipping Label - ${orderId}`,
      html: `
        <div style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #B90C2C;">🖨️ Shipping Label</h1>
          <div style="border: 2px solid #000; padding: 30px; margin: 20px 0; text-align: center;">
            <img src="${labelQR}" style="width: 300px; height: 300px;" />
            <h2 style="font-family: monospace;">${trackingNumber}</h2>
            <hr>
            <p><strong>Fra:</strong> ${process.env.SENDER_NAME}</p>
            <p><strong>Til:</strong> ${mainBooking.fullName}<br>
            Afhentes på ${servicePoint.name}</p>
            <p><strong>Indhold:</strong> ${bookings.map(b => b.productName).join(', ')}</p>
          </div>
        </div>
      `
    })

    console.log('✅ Label sent')

    return {
      success: true,
      message: 'Shipping label sent to admin email',
      trackingNumber
    }

  } catch (error: any) {
    console.error('❌ Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create shipment'
    })
  }
})
