# Email Receipt Setup Guide

## Overview
The email functionality has been set up with nodemailer to automatically send booking receipts to customers. This includes both automatic server-side email sending and fallback mailto links.

## Files Added/Modified

### New Files:
- `server/api/email/send-receipt.post.ts` - API endpoint for sending emails
- `composables/useEmail.ts` - Email composable with utilities
- `components/ReceiptEmailActions.vue` - UI component for email actions

### Modified Files:
- `pages/payment/success.vue` - Added email functionality to success page
- `.env` - Added email configuration variables

## Setup Instructions

### 1. Configure Email Credentials

Edit your `.env` file with your email provider credentials:

#### For SimplyMail (Recommended for Danish businesses):
```env
EMAIL_USER=your-email@yourdomæne.dk
EMAIL_PASSWORD=your-simplymail-password
EMAIL_FROM_NAME=LejGoPro Team
```

**SimplyMail Setup**:
1. Log ind på din SimplyMail konto
2. Brug din fulde email-adresse som bruger (f.eks. kontakt@lejgopro.dk)
3. Brug dit normale SimplyMail kodeord
4. SMTP: smtp.simply.com, Port: 587
5. Kræver godkendelse med brugernavn og adgangskode

#### For Gmail:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM_NAME=LejGoPro Team
```

**Important**: For Gmail, you must use an App Password, not your regular password:
1. Go to Google Account settings
2. Enable 2-factor authentication
3. Go to Security > App passwords
4. Generate a new app password for "Mail"
5. Use this password in your .env file

#### For Outlook/Hotmail:
```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password-or-app-password
EMAIL_FROM_NAME=LejGoPro Team
```

#### For Other Providers:
You may need to modify the transporter configuration in `server/api/email/send-receipt.post.ts`:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})
```

### 2. Update Production Environment Variables

For production deployment (Vercel), make sure to set these environment variables:
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM_NAME`

### 3. Test the Functionality

1. Complete a test booking
2. Go to the success page
3. Click "Send Receipt Email" to test automatic sending
4. Click "Open in Email Client" to test mailto functionality

## Usage Examples

### In Components:
```vue
<template>
  <ReceiptEmailActions :booking-data="bookingData" />
</template>

<script setup>
import type { BookingEmailData } from '~/composables/useEmail'

const bookingData: BookingEmailData = {
  orderNumber: 'ORD-12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  service: 'GoPro Rental',
  duration: '3 days',
  totalAmount: 299,
  bookingDate: new Date().toISOString()
}
</script>
```

### Programmatically:
```javascript
const { sendBookingReceipt } = useEmail()

const success = await sendBookingReceipt(bookingData)
if (success) {
  console.log('Receipt sent successfully!')
}
```

## Email Template Features

The email includes:
- Professional HTML formatting
- Customer information
- Booking details
- Itemized costs (if applicable)
- Rental period information
- Delivery address (if applicable)
- Danish currency formatting
- Responsive design
- Plain text fallback

## Troubleshooting

### Common Issues:

1. **Authentication Error**: Check email credentials and app passwords
2. **Network Error**: Ensure SMTP ports aren't blocked
3. **Missing Data**: Verify all required booking data fields are present
4. **Styling Issues**: Check HTML email client compatibility

### Error Handling:
- The system gracefully falls back to mailto links if server-side sending fails
- Validation ensures required fields are present before sending
- User-friendly error messages are displayed

## Security Notes

- Never commit real email credentials to version control
- Use environment variables for all sensitive data
- Consider using email services like SendGrid or Mailgun for production
- Implement rate limiting to prevent spam

## Future Enhancements

Possible improvements:
- Email templates for different booking types
- Attachment support (PDF receipts)
- Email tracking and delivery confirmation
- Multi-language support
- Admin email notifications