import nodemailer from 'nodemailer'

interface BookingData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  service?: string
  productName?: string
  duration: string
  totalAmount: number
  bookingDate: string
  rentalPeriod?: {
    startDate: string
    endDate: string
  }
  deliveryAddress?: string
  items?: Array<{
    name: string
    quantity: number
    price: number
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

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('da-DK', {
        style: 'currency',
        currency: 'DKK'
      }).format(amount)
    }

    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #B90C2C; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">LejGoPro</h1>
          <h2 style="margin: 10px 0 0 0;">Booking Kvittering</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Kære ${bookingData.customerName},</p>
          <p>Tak for din booking hos LejGoPro! Din ordre er bekræftet.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Booking Detaljer</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px 0; font-weight: bold;">Ordre Nummer:</td>
                <td style="padding: 8px 0;">${bookingData.orderNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px 0; font-weight: bold;">Service:</td>
                <td style="padding: 8px 0;">${bookingData.service || bookingData.productName || 'LejGoPro Service'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px 0; font-weight: bold;">Periode:</td>
                <td style="padding: 8px 0;">${bookingData.duration}</td>
              </tr>
              ${bookingData.deliveryAddress ? `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 8px 0; font-weight: bold;">Levering:</td>
                  <td style="padding: 8px 0;">${bookingData.deliveryAddress}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; font-size: 18px;">Total Beløb:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #B90C2C;">${formatCurrency(bookingData.totalAmount)}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>✓ Din booking er bekræftet!</strong><br>
              Du vil modtage yderligere information om levering inden for 24 timer.
            </p>
          </div>

          <p>Har du spørgsmål til din booking? Du er velkommen til at svare på denne e-mail.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p>Med venlig hilsen,<br>
            <strong>LejGoPro Team</strong></p>
          </div>
        </div>
      </div>
    `

    // Create plain text content
    const textContent = `
Booking Kvittering - Ordre #${bookingData.orderNumber}

Kære ${bookingData.customerName},

Tak for din booking hos LejGoPro! Din ordre er bekræftet.

BOOKING DETALJER:
================
Ordre Nummer: ${bookingData.orderNumber}
Service: ${bookingData.service || bookingData.productName || 'LejGoPro Service'}
Periode: ${bookingData.duration}
${bookingData.deliveryAddress ? `Levering: ${bookingData.deliveryAddress}` : ''}
Total Beløb: ${formatCurrency(bookingData.totalAmount)}

✓ Din booking er bekræftet!
Du vil modtage yderligere information om levering inden for 24 timer.

Har du spørgsmål til din booking? Du er velkommen til at svare på denne e-mail.

Med venlig hilsen,
LejGoPro Team
    `.trim()

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
      to: bookingData.customerEmail,
      subject: `Booking Kvittering - Ordre #${bookingData.orderNumber}`,
      html: htmlContent,
      text: textContent
    })

    return {
      success: true,
      message: 'Receipt sent successfully',
      messageId: info.messageId
    }

  } catch (error) {
    console.error('Email sending error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send receipt email'
    })
  }
})

function generateReceiptHTML(booking: BookingData): string {
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
      <title>Booking Receipt</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
        .section { margin-bottom: 20px; }
        .section h3 { color: #1e40af; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .info-table td { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-table td:first-child { font-weight: bold; width: 40%; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .items-table th { background-color: #f1f5f9; font-weight: bold; }
        .total { background-color: #2563eb; color: white; font-weight: bold; font-size: 1.1em; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; }
      </style>
    </head>
    <body>
      <!-- Noreply Notice -->
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #B90C2C;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>🤖 Dette er en automatisk besked - svar ikke på denne e-mail.</strong><br>
          For spørgsmål, kontakt os på: <a href="mailto:${process.env.EMAIL_SUPPORT}" style="color: #B90C2C;">${process.env.EMAIL_SUPPORT}</a>
        </p>
      </div>

      <div class="header">
        <h1>LejGoPro</h1>
        <h2>Booking Receipt</h2>
        <p>Order #${booking.orderNumber}</p>
      </div>
      
      <div class="content">
        <div class="section">
          <h3>Customer Information</h3>
          <table class="info-table">
            <tr><td>Name:</td><td>${booking.customerName}</td></tr>
            <tr><td>Email:</td><td>${booking.customerEmail}</td></tr>
            ${booking.customerPhone ? `<tr><td>Phone:</td><td>${booking.customerPhone}</td></tr>` : ''}
            <tr><td>Booking Date:</td><td>${formatDate(booking.bookingDate)}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>Service Details</h3>
          <table class="info-table">
            <tr><td>Service:</td><td>${booking.service}</td></tr>
            <tr><td>Duration:</td><td>${booking.duration}</td></tr>
            ${booking.rentalPeriod ? `
              <tr><td>Start Date:</td><td>${formatDate(booking.rentalPeriod.startDate)}</td></tr>
              <tr><td>End Date:</td><td>${formatDate(booking.rentalPeriod.endDate)}</td></tr>
            ` : ''}
            ${booking.deliveryAddress ? `<tr><td>Delivery Address:</td><td>${booking.deliveryAddress}</td></tr>` : ''}
          </table>
        </div>

        ${booking.items && booking.items.length > 0 ? `
          <div class="section">
            <h3>Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${booking.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.price)}</td>
                    <td>${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
                <tr class="total">
                  <td colspan="3">Total Amount</td>
                  <td>${formatCurrency(booking.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : `
          <div class="section">
            <h3>Payment Summary</h3>
            <table class="info-table">
              <tr class="total"><td>Total Amount:</td><td>${formatCurrency(booking.totalAmount)}</td></tr>
            </table>
          </div>
        `}

        <div class="footer">
          <p>Tak for at vælge LejGoPro!</p>
          
          <!-- Noreply Footer Notice -->
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 12px;">
            <p style="margin: 0; color: #666;">
              <strong>⚠️ Denne e-mail er sendt automatisk - svar ikke på denne besked.</strong><br>
              For support eller spørgsmål, kontakt os på: <a href="mailto:${process.env.EMAIL_SUPPORT}" style="color: #B90C2C;">${process.env.EMAIL_SUPPORT}</a>
            </p>
          </div>
          
          <p><strong>Med venlig hilsen,<br>LejGoPro Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `
}

function generateReceiptText(booking: BookingData): string {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount)
  }

  return `
*** AUTOMATISK BESKED - SVAR IKKE PÅ DENNE E-MAIL ***
For support, kontakt: ${process.env.EMAIL_SUPPORT}

LejGoPro - Booking Receipt
Order #${booking.orderNumber}

Kære ${booking.customerName},

Tak for din booking hos LejGoPro!

CUSTOMER INFORMATION:
====================
Name: ${booking.customerName}
Email: ${booking.customerEmail}
${booking.customerPhone ? `Phone: ${booking.customerPhone}` : ''}
Booking Date: ${formatDate(booking.bookingDate)}

SERVICE DETAILS:
================
Service: ${booking.service}
Duration: ${booking.duration}
${booking.rentalPeriod ? `Start Date: ${formatDate(booking.rentalPeriod.startDate)}` : ''}
${booking.rentalPeriod ? `End Date: ${formatDate(booking.rentalPeriod.endDate)}` : ''}
${booking.deliveryAddress ? `Delivery Address: ${booking.deliveryAddress}` : ''}

${booking.items && booking.items.length > 0 ? `
ITEMS:
======
${booking.items.map(item => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity)}`).join('\n')}
` : ''}

TOTAL AMOUNT: ${formatCurrency(booking.totalAmount)}

*** VIGTIG BESKED ***
Dette er en automatisk e-mail - svar ikke på denne besked.
For spørgsmål eller support, kontakt os på: ${process.env.EMAIL_SUPPORT}

Med venlig hilsen,
LejGoPro Team
  `.trim()
}