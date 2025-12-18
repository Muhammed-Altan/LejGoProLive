import nodemailer from 'nodemailer'
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
    
    // Fetch all bookings with this orderId
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .select('*')
      .eq('orderId', orderId)
      .order('id')

    if (bookingsError || !bookings || bookings.length === 0) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Order not found'
      })
    }

    // Use first booking for customer and delivery info
    const mainBooking = bookings[0]
    
    // Parse service point from booking if available
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

    // Prepare shipment data for PostNord API
    const shipmentData = {
      shipment: {
        sender: {
          name: process.env.SENDER_NAME || "LejGoPro",
          address1: process.env.SENDER_ADDRESS || "Your Shop Address",
          city: process.env.SENDER_CITY || "Copenhagen",
          postalCode: process.env.SENDER_POSTAL_CODE || "1000",
          countryCode: "DK",
          email: config.adminEmail || process.env.EMAIL_USER,
          phone: process.env.SENDER_PHONE || "+4512345678"
        },
        recipient: {
          name: mainBooking.fullName || mainBooking.customerName,
          address1: servicePoint.address.street + ' ' + servicePoint.address.streetNumber,
          city: servicePoint.address.city,
          postalCode: servicePoint.address.postalCode,
          countryCode: servicePoint.address.countryCode || "DK",
          email: mainBooking.email,
          phone: mainBooking.phone || ""
        },
        parcels: [
          {
            weight: 5000, // Weight in grams (5kg default)
            length: 40,   // Dimensions in cm
            width: 30,
            height: 20,
            contents: bookings.map(b => b.productName || 'GoPro').join(', ')
          }
        ],
        serviceCode: "19", // PostNord MyPack Collect (to service point)
        additionalService: {
          servicePointId: servicePoint.id
        },
        orderNumber: orderId,
        reference: `Order ${orderId}`
      },
      labelFormat: "PDF",
      layout: "A4"
    }

    console.log('🔍 Creating PostNord shipment:', JSON.stringify(shipmentData, null, 2))

    // Call PostNord Business Shipping API
    const apiUrl = 'https://api2.postnord.com/rest/businessship/v5/shipments'
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': String(config.postNordApiKey),
        'Consumer-ID': String(config.postNordConsumerId)
      },
      body: JSON.stringify(shipmentData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ PostNord API error:', errorText)
      throw createError({
        statusCode: response.status,
        statusMessage: `PostNord API error: ${errorText}`
      })
    }

    const shipmentResponse = await response.json()
    console.log('✅ Shipment created:', shipmentResponse)

    // Extract label data (PDF base64)
    const labelData = shipmentResponse.labels?.[0]?.labelData
    const trackingNumber = shipmentResponse.items?.[0]?.shipmentNumber

    if (!labelData) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No label data received from PostNord'
      })
    }

    // Convert base64 to buffer
    const labelBuffer = Buffer.from(labelData, 'base64')

    // Send label via email to admin
    const transporter = nodemailer.createTransport({
      host: 'smtp.simply.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER

    const mailOptions = {
      from: `"LejGoPro" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `PostNord Shipping Label - Order ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>PostNord Shipping Label</h2>
          <p>A shipping label has been generated for order <strong>${orderId}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>Order Details:</h3>
            <ul>
              <li><strong>Tracking Number:</strong> ${trackingNumber || 'N/A'}</li>
              <li><strong>Customer:</strong> ${mainBooking.fullName}</li>
              <li><strong>Email:</strong> ${mainBooking.email}</li>
              <li><strong>Phone:</strong> ${mainBooking.phone}</li>
            </ul>
            
            <h3>Pickup Location:</h3>
            <ul>
              <li><strong>Name:</strong> ${servicePoint.name}</li>
              <li><strong>Address:</strong> ${servicePoint.address.street} ${servicePoint.address.streetNumber}</li>
              <li><strong>City:</strong> ${servicePoint.address.postalCode} ${servicePoint.address.city}</li>
            </ul>
            
            <h3>Items:</h3>
            <ul>
              ${bookings.map(b => `<li>${b.productName || 'GoPro'}</li>`).join('')}
            </ul>
          </div>
          
          <p>The shipping label is attached to this email as a PDF. Please print and attach it to the package.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from LejGoPro.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `postnord-label-${orderId}.pdf`,
          content: labelBuffer,
          contentType: 'application/pdf'
        }
      ]
    }

    const emailResult = await transporter.sendMail(mailOptions)
    console.log('✅ Label email sent:', emailResult.messageId)

    // Update booking with tracking number
    if (trackingNumber) {
      await supabase
        .from('Booking')
        .update({ trackingNumber })
        .eq('orderId', orderId)
    }

    return {
      success: true,
      message: 'Shipping label created and sent to admin email',
      trackingNumber,
      emailSent: true
    }

  } catch (error: any) {
    console.error('❌ Error creating shipment:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to create shipping label'
    })
  }
})
