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

    // Create OUTBOUND booking (Shop → Customer)
    const outboundBookingData = {
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
        orderNumber: orderId,
        reference: `Order ${orderId}`
      }
    }

    console.log('🔍 Creating PostNord outbound booking:', JSON.stringify(outboundBookingData, null, 2))

    // Call PostNord API to create booking (no label yet)
    const apiUrl = 'https://api2.postnord.com/rest/businessship/v5/shipments'
    
    const outboundResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': String(config.postNordApiKey),
        'Consumer-ID': String(config.postNordConsumerId)
      },
      body: JSON.stringify(outboundBookingData)
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
    console.log('✅ Outbound booking created:', outboundShipment)

    const outboundShipmentId = outboundShipment.items?.[0]?.shipmentNumber
    const outboundItemId = outboundShipment.items?.[0]?.itemId

    if (!outboundShipmentId) {
      throw createError({
        statusCode: 500,
        statusMessage: 'No shipment ID received from PostNord'
      })
    }

    // Create RETURN booking (Customer → Shop)
    const returnBookingData = {
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
      }
    }

    console.log('🔍 Creating PostNord return booking:', JSON.stringify(returnBookingData, null, 2))

    const returnResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': String(config.postNordApiKey),
        'Consumer-ID': String(config.postNordConsumerId)
      },
      body: JSON.stringify(returnBookingData)
    })

    let returnShipmentId = null
    let returnItemId = null

    if (returnResponse.ok) {
      const returnShipment = await returnResponse.json()
      console.log('✅ Return booking created:', returnShipment)
      returnShipmentId = returnShipment.items?.[0]?.shipmentNumber
      returnItemId = returnShipment.items?.[0]?.itemId
    } else {
      console.warn('⚠️ Return booking failed, continuing with outbound only')
    }

    // Generate QR codes for the shipment IDs
    const outboundQRCode = await QRCode.toDataURL(outboundShipmentId, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H'
    })

    let returnQRCode = null
    if (returnShipmentId) {
      returnQRCode = await QRCode.toDataURL(returnShipmentId, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H'
      })
    }

    // Send QR codes via email to admin
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
      subject: `PostNord Booking QR Codes - Order ${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>📦 PostNord Booking QR Codes</h2>
          <p>QR codes have been generated for order <strong>${orderId}</strong>.</p>
          
          <div style="background-color: #d1ecf1; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">✨ How to use:</h4>
            <p>Print these QR codes and attach them to the packages. When you bring the packages to the PostNord service point, staff will scan the QR codes and print the shipping labels directly.</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>📤 Outbound Shipment (Shop → Customer)</h3>
            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 15px 0;">
              <img src="${outboundQRCode}" alt="Outbound QR Code" style="max-width: 300px; width: 100%;"/>
              <p style="margin: 15px 0 5px 0; font-weight: bold;">Shipment ID: ${outboundShipmentId}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">Print this and attach to package</p>
            </div>
            
            ${returnQRCode ? `
            <h3>🔄 Return Shipment (Customer → Shop)</h3>
            <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 15px 0;">
              <img src="${returnQRCode}" alt="Return QR Code" style="max-width: 300px; width: 100%;"/>
              <p style="margin: 15px 0 5px 0; font-weight: bold;">Shipment ID: ${returnShipmentId}</p>
              <p style="margin: 0; color: #666; font-size: 14px;">Include this inside package for customer</p>
            </div>
            ` : '<p style="color: #856404; background: #fff3cd; padding: 10px; border-radius: 5px;">⚠️ Return booking failed. You may need to create it separately.</p>'}
          </div>

          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
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

          <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">📋 Step-by-Step Instructions:</h4>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Print</strong> both QR codes from this email</li>
              <li><strong>Outbound QR:</strong> Attach to the outside of the package</li>
              <li><strong>Return QR:</strong> Include inside the package for customer</li>
              <li><strong>Bring package</strong> to <strong>${servicePoint.name}</strong></li>
              <li><strong>PostNord staff scan</strong> the QR code and print the label</li>
              <li>They will attach the printed label to your package</li>
            </ol>
            <p style="margin: 10px 0 0 0;"><strong>No need to print labels yourself! 🎉</strong></p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated message from LejGoPro.
          </p>
        </div>
      `
    }

    const emailResult = await transporter.sendMail(mailOptions)
    console.log('✅ QR codes email sent:', emailResult.messageId)

    // Update booking with shipment IDs
    const trackingData: any = { 
      trackingNumber: outboundShipmentId,
      postNordItemId: outboundItemId
    }
    if (returnShipmentId) {
      trackingData.returnTrackingNumber = returnShipmentId
      trackingData.returnPostNordItemId = returnItemId
    }

    await supabase
      .from('Booking')
      .update(trackingData)
      .eq('orderId', orderId)

    return {
      success: true,
      message: returnQRCode 
        ? 'QR codes for outbound and return shipments sent to admin email'
        : 'QR code for outbound shipment sent to admin email (return booking failed)',
      outboundShipmentId,
      returnShipmentId,
      emailSent: true
    }

  } catch (error: any) {
    console.error('❌ Error creating booking:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || error.message || 'Failed to create booking'
    })
  }
})
