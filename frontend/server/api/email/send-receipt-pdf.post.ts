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
  totalAmount: number
  items?: Array<{
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { bookingData }: { bookingData: BookingData } = body

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

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    // Generate HTML email content
    const htmlContent = generateEmailHTML(bookingData)

    // Email options with PDF attachment
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'LejGoPro Team'}" <${process.env.EMAIL_USER}>`,
      to: bookingData.customerEmail,
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
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount)
  }

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
          <p><strong>Service:</strong> ${booking.service}</p>
          <p><strong>Periode:</strong> ${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}</p>
          <p><strong>Total beløb:</strong> ${formatCurrency(booking.totalAmount)}</p>
        </div>

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