import nodemailer from 'nodemailer'
import { getPDFBuffer } from '~/utils/pdfGenerator'

interface BookingData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  address?: string
  apartment?: string
  city?: string
  postalCode?: string
  service: string
  startDate: string
  endDate: string
  duration?: string
  totalAmount: number
  items?: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  // Booking update fields
  isUpdate?: boolean
  priceDifference?: number
  paymentUrl?: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { bookingData }: { bookingData: BookingData } = body

    // Debug: Log the booking data received
    console.log('📧 Server-side email API received booking data:', {
      orderNumber: bookingData.orderNumber,
      isUpdate: bookingData.isUpdate,
      priceDifference: bookingData.priceDifference,
      paymentUrl: bookingData.paymentUrl,
      customerEmail: bookingData.customerEmail
    })

    // Validate required fields
    if (!bookingData || !bookingData.customerEmail || !bookingData.orderNumber) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required booking data'
      })
    }

    // Check if we're in development mode and email is not properly configured
    const isDev = process.env.NODE_ENV === 'development'
    const hasValidEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && 
                                process.env.EMAIL_PASSWORD !== 'your-16-character-app-password-here'

    if (isDev && !hasValidEmailConfig) {
      console.log('📧 PDF Email would be sent to:', bookingData.customerEmail)
      console.log('📧 PDF Email subject: Faktura - Order #' + bookingData.orderNumber)
      console.log('📧 PDF would be generated and attached')
      
      return {
        success: true,
        message: 'PDF email sending simulated in development mode (check console)',
        messageId: 'dev-simulation',
        filename: `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`
      }
    }

    // Generate PDF
    const pdfBuffer = await getPDFBuffer(bookingData)

    // Configure email transporter for SimplyMail
    const transporter = nodemailer.createTransport({
      host: 'smtp.simply.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      },
      // Additional options for proper sent mail handling
      pool: true,
      maxConnections: 1,
      rateDelta: 1000,
      rateLimit: 5
    })

    // Generate HTML email content
    const htmlContent = generateEmailHTML(bookingData)

    // Email options with PDF attachment
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LejGoPro Team'}" <${process.env.EMAIL_USER}>`,
      to: bookingData.customerEmail,
      bcc: process.env.EMAIL_USER, // Send copy to sender for records
      subject: `Faktura - Order #${bookingData.orderNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      message: 'PDF faktura sent successfully',
      messageId: info.messageId,
      filename: `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`
    }

  } catch (error) {
    console.error('Email sending error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send PDF faktura'
    })
  }
})

function generateEmailHTML(booking: BookingData): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Ikke angivet'
    
    // Handle different date formats
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Return as-is if can't parse
      }
      return date.toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString // Return as-is if error
    }
  }

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'Ikke angivet'
    }
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount)
  }

  // Debug the actual data being used
  console.log('📧 Email template data:', {
    service: booking.service,
    startDate: booking.startDate,
    endDate: booking.endDate,
    totalAmount: booking.totalAmount,
    typeof_totalAmount: typeof booking.totalAmount,
    isUpdate: booking.isUpdate,
    priceDifference: booking.priceDifference,
    paymentUrl: booking.paymentUrl
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Faktura fra LejGoPro</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background-color: #B90C2C; 
          color: white; 
          padding: 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .content { 
          background-color: #f8fafc; 
          padding: 20px; 
          border-radius: 0 0 8px 8px; 
        }
        .highlight { 
          background-color: #fff; 
          padding: 15px; 
          border-radius: 5px; 
          margin: 15px 0; 
          border-left: 4px solid #B90C2C;
        }
        .footer { 
          margin-top: 30px; 
          padding-top: 20px; 
          border-top: 2px solid #e5e7eb; 
          text-align: center; 
          color: #6b7280; 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>lejgopro</h1>
        <h2>Faktura</h2>
        <p>Order #${booking.orderNumber}</p>
      </div>
      
      <div class="content">
        <p>Kære ${booking.customerName},</p>
        
        <p>Tak for din booking hos LejGoPro! Du finder din faktura vedhæftet som PDF.</p>
        
        <div class="highlight">
          <h3>Booking detaljer:</h3>
          <p><strong>Kamera:</strong> ${booking.service || 'LejGoPro Service'}</p>
          <p><strong>Periode:</strong> ${booking.startDate && booking.endDate ? `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}` : booking.duration || 'Se vedhæftet PDF'}</p>
          <p><strong>Total beløb:</strong> ${formatCurrency(booking.totalAmount)}</p>
        </div>

        ${booking.isUpdate ? `
          <div class="highlight" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
            <h3 style="color: #d97706;">📋 BOOKING OPDATERING</h3>
            ${booking.priceDifference && booking.priceDifference > 0 ? `
              <p style="color: #dc2626;"><strong>YDERLIGERE BETALING PÅKRÆVET:</strong> ${formatCurrency(booking.priceDifference)}</p>
            ` : ''}
            ${booking.priceDifference && booking.priceDifference < 0 ? `
              <p style="color: #059669;"><strong>REFUNDERINGSBELØB:</strong> ${formatCurrency(Math.abs(booking.priceDifference))}</p>
            ` : ''}
            ${booking.paymentUrl ? `
              <div style="margin: 15px 0; padding: 15px; background-color: #dbeafe; border-radius: 5px; border: 2px solid #3b82f6;">
                <h4 style="color: #1e40af; margin: 0 0 10px 0;">💳 BETALINGSLINK</h4>
                <p style="margin: 5px 0;">For at gennemføre betalingen af det yderligere beløb, brug venligst dette sikre link:</p>
                <p style="margin: 10px 0;">
                  <a href="${booking.paymentUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                    BETAL NU - ${formatCurrency(booking.priceDifference || 0)}
                  </a>
                </p>
                <p style="margin: 5px 0; color: #dc2626; font-size: 14px;"><strong>VIGTIGT:</strong> Dette link udløber om 10 minutter. Gennemfør venligst din betaling hurtigt.</p>
              </div>
            ` : ''}
          </div>
        ` : ''}

        ${booking.address ? `
          <div class="highlight">
            <h3>Leveringsadresse:</h3>
            <p>${booking.address}${booking.apartment ? ', ' + booking.apartment : ''}</p>
            <p>${booking.postalCode || ''} ${booking.city || ''}</p>
          </div>
        ` : ''}
        
        <p>Hvis du har spørgsmål til din faktura, er du velkommen til at kontakte os.</p>
        
        <div class="footer">
          <p>Med venlig hilsen<br><strong>LejGoPro Team</strong></p>
          <p>Email: admin@lejgopro.dk</p>
        </div>
      </div>
    </body>
    </html>
  `
}