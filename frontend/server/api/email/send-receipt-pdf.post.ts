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
      customerEmail: bookingData.customerEmail,
      customerName: bookingData.customerName,
      service: bookingData.service,
      totalAmount: bookingData.totalAmount,
      items: bookingData.items ? bookingData.items.length : 0,
      hasStartDate: !!bookingData.startDate,
      hasEndDate: !!bookingData.endDate,
      isUpdate: bookingData.isUpdate,
      priceDifference: bookingData.priceDifference,
      paymentUrl: bookingData.paymentUrl,
      paymentUrlType: typeof bookingData.paymentUrl,
      paymentUrlLength: bookingData.paymentUrl ? bookingData.paymentUrl.length : 0
    })

    // Validate required fields with detailed error messages
    if (!bookingData) {
      console.error('❌ No booking data provided')
      throw createError({
        statusCode: 400,
        statusMessage: 'No booking data provided'
      })
    }

    if (!bookingData.customerEmail) {
      console.error('❌ Missing customer email in booking data:', bookingData)
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing customer email'
      })
    }

    if (!bookingData.orderNumber) {
      console.error('❌ Missing order number in booking data:', bookingData)
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing order number'
      })
    }

    // Validate essential data for PDF generation
    if (!bookingData.customerName) {
      console.warn('⚠️ Missing customer name, using fallback')
      bookingData.customerName = 'Kunde'
    }

    if (!bookingData.service) {
      console.warn('⚠️ Missing service description, using fallback')
      bookingData.service = 'GoPro leje'
    }

    if (typeof bookingData.totalAmount !== 'number' || bookingData.totalAmount <= 0) {
      console.error('❌ Invalid total amount:', bookingData.totalAmount)
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid total amount'
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

    console.log('📧 Starting PDF generation...')
    // Generate PDF
    const pdfBuffer = await getPDFBuffer(bookingData)
    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    console.log('📧 Configuring email transporter for SimplyMail...')
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

    console.log('📧 Generating HTML email content...')
    // Generate HTML email content
    const htmlContent = generateEmailHTML(bookingData)
    console.log('✅ Email HTML content generated, length:', htmlContent.length, 'characters')

    // Email options with PDF attachment
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LejGoPro Team'}" <${process.env.EMAIL_USER}>`,
      to: bookingData.customerEmail,
      bcc: process.env.EMAIL_USER, // Send copy to sender for records
      subject: bookingData.paymentUrl 
        ? `Betalingslink - Order #${bookingData.orderNumber}`
        : `Faktura - Order #${bookingData.orderNumber}`,
      html: htmlContent,
      attachments: [
        {
          filename: `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }

    console.log('📧 Email subject line:', mailOptions.subject);
    console.log('📧 Has payment URL?', !!bookingData.paymentUrl);

    console.log('📧 Email options configured:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      attachmentCount: mailOptions.attachments.length,
      attachmentSize: pdfBuffer.length
    })

    console.log('📤 Sending email...')
    // Send email
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    })

    return {
      success: true,
      message: 'PDF faktura sent successfully',
      messageId: info.messageId,
      filename: `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`
    }

  } catch (error) {
    console.error('💥 Email sending error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined
    })
    
    // Also log the original error for full context
    console.error('📋 Full error object:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send PDF faktura: ' + (error instanceof Error ? error.message : String(error))
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
        <h2>${booking.paymentUrl ? 'Betalingsanmodning' : 'Faktura'}</h2>
        <p>Order #${booking.orderNumber}</p>
      </div>
      
      <div class="content">
        <p>Kære ${booking.customerName},</p>
        
        ${booking.paymentUrl ? `
          <p style="font-weight: bold; color: #dc2626; background-color: #fee2e2; padding: 12px; border-radius: 5px; border-left: 4px solid #dc2626;">
            BETALING PÅKRÆVET: Denne email er en betalingsanmodning, ikke en kvittering. Du skal gennemføre betalingen via linket nedenfor.
          </p>
        ` : `
          <p>Tak for din booking hos LejGoPro! Du finder din faktura vedhæftet som PDF.</p>
        `}
        
        <div class="highlight">
          <h3>Booking detaljer:</h3>
          <p><strong>Kamera:</strong> ${booking.service || 'LejGoPro Service'}</p>
          <p><strong>Periode:</strong> ${booking.startDate && booking.endDate ? `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}` : booking.duration || 'Se vedhæftet PDF'}</p>
          <p><strong>Total beløb:</strong> ${formatCurrency(booking.totalAmount)}</p>
        </div>

        ${booking.isUpdate ? `
          <div class="highlight" style="border-left: 4px solid #3b82f6; background-color: #eff6ff;">
            <h3 style="color: #1e40af;">Booking opdatering</h3>
            ${booking.priceDifference && booking.priceDifference > 0 ? `
              <p style="color: #dc2626;"><strong>Yderligere betaling påkrævet:</strong> ${formatCurrency(booking.priceDifference)}</p>
            ` : ''}
            ${booking.priceDifference && booking.priceDifference < 0 ? `
              <p style="color: #059669;"><strong>Refunderingsbeløb:</strong> ${formatCurrency(Math.abs(booking.priceDifference))}</p>
            ` : ''}
            ${booking.paymentUrl ? `
              <div style="margin: 15px 0; padding: 20px; background-color: #eff6ff; border-radius: 8px; border: 3px solid #2563eb;">
                <h4 style="color: #000; margin: 0 0 10px 0; font-size: 18px;">Handling påkrævet - Betal nu</h4>
                <p style="margin: 5px 0; font-size: 15px; color: #333;">Din booking er <strong>ikke gennemført</strong> før betalingen er modtaget.</p>
                <p style="margin: 10px 0; font-size: 15px; color: #333;">Klik på knappen nedenfor for at gennemføre betalingen på <strong>${formatCurrency(booking.priceDifference || 0)}</strong>:</p>
                <p style="margin: 15px 0; text-align: center;">
                  <a href="${booking.paymentUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    Gennemfør betaling - ${formatCurrency(booking.priceDifference || 0)}
                  </a>
                </p>
                <p style="margin: 10px 0; color: #000; font-size: 14px; font-weight: bold; text-align: center;">Vigtigt: Betalingslinket udløber om 10 minutter!</p>
                <p style="margin: 5px 0; color: #666; font-size: 13px; text-align: center;">Du vil modtage en kvittering efter gennemført betaling.</p>
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
        
        ${booking.paymentUrl ? `
          <p style="color: #666;">Har du spørgsmål til betalingen? Kontakt os på <a href="mailto:kontakt@lejgopro.dk">kontakt@lejgopro.dk</a></p>
        ` : `
          <p>Hvis du har spørgsmål til din faktura, er du velkommen til at kontakte os.</p>
        `}
        
        <div class="footer">
          <p>Med venlig hilsen<br><strong>LejGoPro Team</strong></p>
          <p>Email: kontakt@lejgopro.dk</p>
        </div>
      </div>
    </body>
    </html>
  `
}