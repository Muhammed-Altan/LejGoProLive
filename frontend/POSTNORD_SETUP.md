# PostNord Integration Guide

## Overview
This integration allows customers to select a PostNord pickup location (service point) for their orders and enables the shop owner to generate PostNord shipping labels automatically.

## Features

### Customer-Facing
- **Service Point Selection**: Customers enter their postal code and address, and the system shows nearby PostNord pickup locations sorted by distance
- **Real-time Search**: Service points are fetched from PostNord API based on the customer's full address for accurate results
- **Visual Selection**: Easy-to-use interface showing service point names, addresses, and distances

### Admin-Facing
- **One-Click Label Generation**: Generate shipping labels directly from the admin panel
- **Email Delivery**: Labels are automatically sent to the admin email as PDF attachments
- **Tracking Numbers**: Automatic tracking number storage in the database
- **Order Integration**: Labels include full order details and customer information

## Setup Instructions

### 1. Database Setup

Run the SQL migration in your Supabase SQL Editor:

```bash
# File: database_postnord_setup.sql
```

This adds the following columns to the `Booking` table:
- `postalCode` (TEXT)
- `deliveryMethod` (TEXT)
- `selectedServicePoint` (JSONB)
- `trackingNumber` (TEXT)

### 2. Environment Variables

Add the following to your `.env` file and Netlify environment variables:

```env
# PostNord API Credentials
POSTNORD_API_KEY=your_api_key_here
POSTNORD_CONSUMER_ID=your_consumer_id_here

# Sender Information for Shipping Labels
SENDER_NAME=LejGoPro
SENDER_ADDRESS=Your Shop Street 123
SENDER_CITY=Copenhagen
SENDER_POSTAL_CODE=2100
SENDER_PHONE=+4512345678
```

### 3. Get PostNord API Credentials

1. Visit [PostNord Developer Portal](https://developer.postnord.com/)
2. Create a business account
3. Subscribe to:
   - **Business Location API** (for service points)
   - **Business Shipping API** (for label generation)
4. Copy your API key and Consumer ID (Customer Number)

## API Endpoints

### Service Points Search
```
GET /api/postnord/service-points
```

**Query Parameters:**
- `postalCode` (required): 4-digit Danish postal code
- `city` (optional): City name for more accurate results
- `streetName` (optional): Street name
- `streetNumber` (optional): Street number
- `countryCode` (default: 'DK'): Country code
- `numberOfServicePoints` (default: '10'): Number of results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "name": "7-Eleven Nørrebro",
      "address": {
        "street": "Nørrebrogade",
        "streetNumber": "200",
        "postalCode": "2200",
        "city": "København N",
        "countryCode": "DK"
      },
      "coordinates": {
        "latitude": 55.6995,
        "longitude": 12.5549
      },
      "openingHours": [...],
      "distance": 1250
    }
  ]
}
```

### Create Shipping Label
```
POST /api/postnord/create-shipment
```

**Body:**
```json
{
  "orderId": 123
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shipping label created and sent to admin email",
  "trackingNumber": "PNDK00123456789",
  "emailSent": true
}
```

## Usage Guide

### For Customers

1. **Enter Delivery Information**
   - Fill in name, phone, email, and full address including postal code and city

2. **Select Pickup Location**
   - Once postal code is entered, nearby PostNord pickup locations appear automatically
   - Click on a location to select it
   - Selected location is highlighted in blue with a checkmark

3. **Complete Checkout**
   - Continue with payment as normal
   - Selected service point is saved with the order

### For Admin

1. **View Orders**
   - Go to Admin Panel → Orders tab
   - Orders are grouped by order ID

2. **Generate Shipping Label**
   - Click the "📦 Forsendelseslabel" button on any order
   - Label generation takes a few seconds
   - You'll see a success notification when complete

3. **Receive Label**
   - Label is sent to the admin email address
   - Email includes:
     - PDF label attachment
     - Order details
     - Customer information
     - Pickup location details
     - Tracking number

4. **Print and Ship**
   - Print the label from the email
   - Attach to the package
   - Drop off at any PostNord location

## Troubleshooting

### Service Points Not Loading
- **Check API credentials**: Ensure `POSTNORD_API_KEY` and `POSTNORD_CONSUMER_ID` are correct
- **Check postal code**: Must be exactly 4 digits
- **Check console**: Look for API error messages in browser console

### Label Generation Fails
- **Check service point**: Order must have a selected service point
- **Check email config**: Ensure `EMAIL_USER` and `EMAIL_PASSWORD` are configured
- **Check sender info**: Ensure all `SENDER_*` environment variables are set
- **API limits**: PostNord may have rate limits or service restrictions

### Label Not Received
- **Check spam folder**: Email might be filtered as spam
- **Check admin email**: Verify `ADMIN_EMAIL` or `EMAIL_USER` is correct
- **Check SMTP**: Ensure email service is working (test with invoices)

## Testing

### Test Mode
If using PostNord test/sandbox environment:
- Use test API credentials
- Labels will be marked as test
- No actual shipments will be created

### Production Mode
When using real credentials:
- Real labels are generated
- Shipments are tracked in PostNord's system
- You will be charged according to your PostNord agreement

## API Response Examples

### Successful Label Creation
```json
{
  "success": true,
  "message": "Shipping label created and sent to admin email",
  "trackingNumber": "PNDK00123456789",
  "emailSent": true
}
```

### Error: No Service Point Selected
```json
{
  "statusCode": 400,
  "statusMessage": "No service point selected for this order. Please select a pickup location."
}
```

### Error: Order Not Found
```json
{
  "statusCode": 404,
  "statusMessage": "Order not found"
}
```

## Support

For issues with:
- **Service point search**: Contact PostNord support for Business Location API
- **Label generation**: Contact PostNord support for Business Shipping API
- **Integration code**: Review code in `server/api/postnord/` folder

## Files Modified

- `server/api/postnord/service-points.get.ts` - Service point search
- `server/api/postnord/create-shipment.post.ts` - Label generation
- `composables/usePostNord.ts` - Client-side API wrapper
- `components/booking/ServicePointSelector.vue` - UI component
- `components/booking/DeliveryStep.vue` - Integration into checkout
- `stores/checkout.ts` - State management
- `pages/admin/index.vue` - Admin interface
- `database_postnord_setup.sql` - Database migration

## Notes

- Service points are cached for 1 hour to reduce API calls
- Labels include all items in an order as a single shipment
- Default parcel weight is 5kg (adjust in `create-shipment.post.ts` if needed)
- Service code "19" is used (MyPack Collect to service point)
