# Dinero.dk Integration Setup Guide

This guide will help you set up the Dinero.dk integration for automatic invoicing and bookkeeping using Visma Connect OAuth.

## Prerequisites

1. A Dinero.dk account with administrator access
2. Your Nuxt.js application running
3. Supabase database configured

## Step 1: Create Visma Connect Application

1. Go to [Visma Connect Developer Portal](https://oauth.developers.visma.com/)
2. Log in with your Dinero/Visma account
3. Create a new application:
   - **Application Name**: LejGoPro Integration
   - **Description**: Integration for automatic invoicing and bookkeeping
   - **Redirect URI**: `http://localhost:3000/admin/dinero/callback` (for development)
   - **Scopes**: Select `dineropublicapi:read`, `dineropublicapi:write`, and `offline_access`

4. After creation, note down:
   - **Client ID** (will start with `isv_`)
   - **Client Secret**

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env` if you haven't already:
   ```bash
   cp .env.example .env
   ```

2. Add your Dinero credentials to `.env`:
   ```env
   DINERO_CLIENT_ID=your_client_id_from_dinero
   DINERO_CLIENT_SECRET=your_client_secret_from_dinero
   ```

## Step 3: Set Up Database

1. Run the database migration in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of database_dinero_integration.sql
   ```

2. Or import the file directly through the Supabase dashboard

## Step 4: Configure Redirect URI for Production

For production deployment, update your Visma Connect application settings:

1. Go back to Visma Connect Developer Portal
2. Edit your application
3. Update the Redirect URI to your production domain:
   ```
   https://yourdomain.com/admin/dinero/callback
   ```

## Important: Visma Connect OAuth Flow

Dinero now uses **Visma Connect** for OAuth authentication. Key differences:

- **Authorization URL**: `https://connect.visma.com/connect/authorize`
- **Token URL**: `https://connect.visma.com/connect/token`  
- **Scopes**: `dineropublicapi:read dineropublicapi:write offline_access`
- **Response Mode**: `form_post` (responses are sent via POST to your callback URL)

## Step 5: Test the Integration

1. Start your Nuxt development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/admin` and go to the "Integrationer" tab

3. Click "Forbind til Dinero"

4. You should be redirected to Dinero's authorization page

5. Grant permissions and you'll be redirected back

6. Test the connection using the "Test Forbindelse" button

## Usage

Once connected, the integration provides:

### Automatic Features
- **Customer Creation**: New customers are automatically created in Dinero when they place orders
- **Invoice Generation**: Invoices are automatically created when orders are completed
- **Product Sync**: Your products can be synced to Dinero's product catalog

### Manual Features
- **Product Sync**: Use the "Synk Produkter" button to manually sync products
- **Connection Test**: Verify the integration is working properly
- **Disconnect**: Remove the integration if needed

## API Endpoints

The integration creates the following API endpoints:

- `POST /api/dinero/authorize` - Exchange OAuth code for tokens
- `GET /api/dinero/test` - Test the connection
- `POST /api/dinero/disconnect` - Disconnect the integration
- `POST /api/dinero/sync-products` - Sync products to Dinero

## Troubleshooting

### Common Issues

1. **"Dinero Client ID ikke konfigureret"**
   - Check that `DINERO_CLIENT_ID` is set in your `.env` file
   - Restart your development server after adding environment variables

2. **"Token exchange failed"**
   - Verify your `DINERO_CLIENT_SECRET` is correct
   - Check that your redirect URI matches exactly in Dinero settings

3. **"No organization found"**
   - Ensure your Dinero account has at least one organization
   - Verify the account has the necessary permissions

4. **Database connection issues**
   - Check your Supabase configuration
   - Ensure the DineroIntegration table exists
   - Verify RLS policies allow the operations

### Debug Mode

Add this to your `.env` for more detailed logging:
```env
NODE_ENV=development
NUXT_LOG_LEVEL=debug
```

## Security Considerations

1. **Environment Variables**: Never commit your `.env` file to version control
2. **HTTPS**: Always use HTTPS in production for OAuth flows
3. **Token Storage**: Access tokens are stored securely in your database
4. **RLS Policies**: Adjust Row Level Security policies based on your auth requirements

## Support

For Dinero API documentation, visit: https://developer.dinero.dk/documentation/

For issues with this integration, check the browser console and server logs for detailed error messages.