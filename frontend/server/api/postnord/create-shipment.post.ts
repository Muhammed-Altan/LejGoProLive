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

    console.log('🔍 Creating PostNord outbound shipment:', JSON.stringify(shipmentData, null, 2))

    // Call PostNord Business Shipping API for outbound label
    const apiUrl = 'https://api2.postnord.com/rest/businessship/v5/shipments'
    
    const outboundResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': String(config.postNordApiKey),
        'Consumer-ID': String(config.postNordConsumerId)
      },
      body: JSON.stringify(shipmentData)
    })

    if (!outboundResponse.ok) {
      const errorText = await outboundResponse.text()
      console.error('❌ PostNord API error (outbound):', errorText)
      throw createError({
        statusCode: outboundResponse.status,
        statusMessage: `PostNord API error: ${errorText}`
      })
    }

    const outboundShipment = await outboundResponse.json()
    console.log('✅ Outbound shipment created:', outboundShipment)

    // Extract outbound label data
    const outboundLabelData = outboundShipment.labels?.[0]?.labelData
    const trackingNumber = outboundShipment.items?.[0]?.shipmentNumber

    if (!outboundLabelData) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No outbound label data received from PostNord'
      })
    }

    // Create RETURN shipment (customer → shop)
    const returnShipmentData = {
      shipment: {
        sender: {
          name: mainBooking.fullName || mainBooking.customerName,
          address1: servicePoint.address.street + ' ' + servicePoint.address.streetNumber,
          city: servicePoint.address.city,
          postalCode: servicePoint.address.postalCode,
          countryCode: servicePoint.address.countryCode || "DK",
          email: mainBooking.email,
          phone: mainBooking.phone || ""
        },
        recipient: {
          name: process.env.SENDER_NAME || "LejGoPro",
          address1: process.env.SENDER_ADDRESS || "Your Shop Address",
          city: process.env.SENDER_CITY || "Copenhagen",
          postalCode: process.env.SENDER_POSTAL_CODE || "1000",
          countryCode: "DK",
          email: config.adminEmail || process.env.EMAIL_USER,
          phone: process.env.SENDER_PHONE || "+4512345678"
        },
        parcels: [
          {
            weight: 5000,
            length: 40,
            width: 30,
            height: 20,
            contents: bookings.map(b => b.productName || 'GoPro').join(', ')
          }
        ],
        serviceCode: "19",
        additionalService: {
          servicePointId: servicePoint.id
        },
        orderNumber: `${orderId}-RETURN`,
        reference: `Return ${orderId}`
      },
      labelFormat: "PDF",
      layout: "A4"
    }

    console.log('🔍 Creating PostNord return shipment:', JSON.stringify(returnShipmentData, null, 2))

    const returnResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': String(config.postNordApiKey),
        'Consumer-ID': String(config.postNordConsumerId)
      },
      body: JSON.stringify(returnShipmentData)
    })

    if (!returnResponse.ok) {
      const errorText = await returnResponse.text()
      console.error('❌ PostNord API error (return):', errorText)
      // Continue even if return label fails - we have the outbound label
      console.warn('⚠️ Return label failed, continuing with outbound label only')
    }

    let returnLabelData = null
    let returnTrackingNumber = null

    if (returnResponse.ok) {
      const returnShipment = await returnResponse.json()
      console.log('✅ Return shipment created:', returnShipment)
      returnLabelData = returnShipment.labels?.[0]?.labelData
      returnTrackingNumber = returnShipment.items?.[0]?.shipmentNumber
    }

    // Convert base64 to buffers
    const outboundLabelBuffer = Buffer.from(outboundLabelData, 'base64')
    const returnLabelBuffer = returnLabelData ? Buffer.from(returnLabelData, 'base64') : null

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

    // Prepare email attachments
    const attachments = [
      {
        filename: `postnord-outbound-${orderId}.pdf`,
        content: outboundLabelBuffer,
        contentType: 'application/pdf'
      }
    ]

    if (returnLabelBuffer) {
      attachments.push({
        filename: `postnord-return-${orderId}.pdf`,
        content: returnLabelBuffer,
        contentType: 'application/pdf'
      })
    }

    const mailOptions = {
      from: `"LejGoPro" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `PostNord Shipping Labels - Order ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>PostNord Shipping Labels</h2>
          <p>Shipping labels have been generated for order <strong>${orderId}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>📦 Outbound Label (Shop → Customer)</h3>
            <ul>
              <li><strong>Tracking Number:</strong> ${trackingNumber || 'N/A'}</li>
              <li><strong>Status:</strong> Ready to ship</li>
            </ul>
            
            ${returnTrackingNumber ? `
            <h3>🔄 Return Label (Customer → Shop)</h3>
            <ul>
              <li><strong>Tracking Number:</strong> ${returnTrackingNumber}</li>
              <li><strong>Status:</strong> Include in package for customer</li>
            </ul>
            ` : '<p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px;">⚠️ Return label generation failed. You may need to create it manually.</p>'}
            
            <h3>Order Details:</h3>
            <ul>
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
          
          <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">📋 Instructions:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li>Print both labels attached to this email</li>
              <li>Attach the <strong>outbound label</strong> to the outside of the package</li>
              <li>Include the <strong>return label</strong> inside the package for the customer</li>
              <li>Drop off at any PostNord location</li>
            </ol>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from LejGoPro.
          </p>
        </div>
      `,
      attachments
    }

    const emailResult = await transporter.sendMail(mailOptions)
    console.log('✅ Label email sent:', emailResult.messageId)

    // Update booking with tracking numbers
    const trackingData: any = { trackingNumber }
    if (returnTrackingNumber) {
      trackingData.returnTrackingNumber = returnTrackingNumber
    }

    await supabase
      .from('Booking')
      .update(trackingData)
      .eq('orderId', orderId)

    return {
      success: true,
      message: returnLabelBuffer 
        ? 'Outbound and return labels created and sent to admin email'
        : 'Outbound label created and sent to admin email (return label failed)',
      trackingNumber,
      returnTrackingNumber,
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
