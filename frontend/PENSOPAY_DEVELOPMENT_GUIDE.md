# PensoPay Development Guide

## Problem
PensoPay requires HTTPS URLs for all callback URLs (callback_url, success_url, cancel_url) but localhost development typically uses HTTP. This causes a validation error:

```
Validation failed: callback_url: [ string doesn't match the regular expression "^https://" ]
```

## Solutions

### Current Implementation
The payment creation API now uses the `NUXT_PUBLIC_BASE_URL` environment variable which is set to `https://www.lejgopro.dk` in the `.env` file. This means:
- Callbacks will be sent to the live domain
- You can test payments but won't receive callbacks locally

### Solution 1: Use Production URLs (Current Setup)
**Pros:** Works immediately, no additional setup
**Cons:** Callbacks won't reach your local development environment

This is the current configuration and should work for payment testing.

### Solution 2: Use ngrok for Local HTTPS Tunnel
1. Install ngrok: https://ngrok.com/
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Add to `.env`:
```
DEV_CALLBACK_BASE_URL=https://abc123.ngrok.io
```
5. Restart your development server

**Pros:** Receive callbacks locally, full development testing
**Cons:** Requires additional tool, URLs change on restart

### Solution 3: Use Localhost with Self-Signed Certificate
1. Set up HTTPS for localhost with a self-signed certificate
2. Update your development configuration to use `https://localhost:3000`
3. Add to `.env`:
```
DEV_CALLBACK_BASE_URL=https://localhost:3000
```

**Pros:** Permanent local HTTPS setup
**Cons:** More complex setup, browser security warnings

### Solution 4: Use Test Mode with Mock Callbacks
For development, you can disable actual payment processing and mock the callbacks:
1. Ensure `isTestMode = true` in the payment creation
2. Test the UI flow without real payment processing
3. Mock callback responses for testing

## Environment Variables

The payment system checks for base URLs in this order:
1. `DEV_CALLBACK_BASE_URL` (development-specific override)
2. `NUXT_PUBLIC_BASE_URL` (current setting)
3. `BASE_URL` (fallback)
4. Auto-detection based on host

## Testing Payment Flow

1. **Create a booking** - This should work with current setup
2. **Payment creation** - Will use production callback URLs
3. **Payment processing** - Works with PensoPay test mode
4. **Callbacks** - Will be sent to production URL (not local)

## Recommended Development Approach

For full local development with callbacks:
1. Use ngrok (Solution 2) for temporary testing
2. Or use production URLs for basic payment testing
3. Set up proper HTTPS for localhost for permanent solution

## Current Configuration

Your `.env` file is set to:
```
NUXT_PUBLIC_BASE_URL=https://www.lejgopro.dk
```

This will resolve the HTTPS validation error and allow payment creation to succeed.