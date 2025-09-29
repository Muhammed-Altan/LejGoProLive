# PensoPay Integration Testing Guide

## 🚀 Quick Setup

### 1. Add Database Columns
Run the SQL script in your Supabase SQL Editor:
```sql
-- Copy and paste the content from database_payment_setup.sql
```

### 2. Verify Test Mode is Active
- Test mode is automatically enabled in development (`NODE_ENV !== 'production'`)
- You'll see a yellow "🧪 Test Mode Active" banner on the payment page
- A test helper widget appears in the top-right corner

## 🧪 Testing Steps

### Step 1: Fill Test Data (Easy Way)
1. Go to `/checkout` page
2. Click "Fill Test Data" in the yellow test helper widget (top-right)
3. This automatically fills:
   - Name: "Test Testersen"
   - Phone: "+45 12 34 56 78" 
   - Email: "test@example.com"
   - Address: "Testvej 123, 2. th"
   - Postal Code: "2100"
   - City: "København Ø"
   - Dates: Tomorrow to next week

### Step 2: Add Products/Accessories
1. Select at least one product or accessory
2. The payment section will appear when all required fields are filled

### Step 3: Test Different Payment Methods

#### 🎯 **Credit Card Testing**

**✅ Successful Payment Cards:**
```
Visa: 4000112401172221
Mastercard: 5500120801422221
Dankort: 5019555544445555
```

**❌ Failure Testing Cards:**
```
Authorization Fail: 4242120802091112
Capture Fail: 4000253302611113  
Cancel Fail: 5500113602321114
Refund Fail: 5100116202241115
```

**Card Details for Testing:**
- **CVV:** Any 3 digits (e.g., 123)
- **Expiry:** Any future date (e.g., 12/25)
- **Name:** Any name

#### 📱 **Google Pay Testing**
1. Use Chrome browser
2. Have a Google account with test payment methods
3. Select "Google Pay" option
4. Complete payment with Google Pay flow

#### 🍎 **Apple Pay Testing**
1. Use Safari on Mac/iPhone with Touch ID/Face ID
2. Have test payment methods in Apple Wallet
3. Select "Apple Pay" option  
4. Complete payment with Touch ID/Face ID

## 📊 Testing Scenarios

### Scenario 1: Successful Payment Flow
1. Fill form with test data
2. Select products/accessories
3. Choose payment method
4. Use successful test card (4000112401172221)
5. **Expected Result:** Redirected to success page, booking saved in database

### Scenario 2: Failed Payment Flow
1. Same as above, but use failure card (4242120802091112)
2. **Expected Result:** Payment fails, redirected to cancelled page

### Scenario 3: User Cancellation
1. Start payment process
2. Click "Cancel" or close payment window
3. **Expected Result:** Redirected to cancelled page

## 🔍 What to Check

### 1. Database Records
Check your Supabase `Booking` table for:
```sql
SELECT 
    "orderId",
    "paymentId", 
    "paymentStatus",
    "paidAt",
    "fullName",
    "email"
FROM "Booking" 
ORDER BY created_at DESC;
```

### 2. Console Logs
Look for these in browser console:
- `Creating PensoPay payment: {...}`
- `Payment successful for order ORDER-...`
- Any error messages

### 3. Network Tab
Check the Network tab for:
- POST to `/api/payment/callback` (webhook)
- Responses from PensoPay API calls

## 🎯 Expected Test Results

| Test Case | Expected Payment Status | Expected Redirect | Database Entry |
|-----------|------------------------|-------------------|----------------|
| Successful Card | `paid` | `/payment/success` | ✅ Created with `paymentStatus: 'paid'` |
| Failed Card | `failed` | `/payment/cancelled` | ❌ No booking created |
| User Cancel | `cancelled` | `/payment/cancelled` | ❌ No booking created |

## 🐛 Common Issues & Solutions

### Issue: "Supabase client not available"
- **Solution:** Check your `.env` file has correct Supabase credentials

### Issue: Payment creation fails
- **Solution:** Check API key is correct and has proper permissions

### Issue: Webhook not received
- **Solution:** Make sure your server is accessible (use ngrok for local testing)

### Issue: Test mode not showing
- **Solution:** Ensure `NODE_ENV !== 'production'` in your environment

## 🚀 Moving to Production

When ready for production:

1. **Get Production API Key** from PensoPay dashboard
2. **Set Environment Variables:**
   ```bash
   NODE_ENV=production
   PENSOPAY_API_KEY=your_production_key
   ```
3. **Configure Webhooks** in PensoPay dashboard:
   - Callback URL: `https://yourdomain.com/api/payment/callback`
   - Success URL: `https://yourdomain.com/payment/success`
   - Cancel URL: `https://yourdomain.com/payment/cancelled`

## 📞 Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Verify database columns were added correctly
4. Test with the exact card numbers provided

**PensoPay Test Cards Reference:**
- All test cards must pass LUHN validation
- Use any CVV and future expiry date
- Test mode automatically enabled in development