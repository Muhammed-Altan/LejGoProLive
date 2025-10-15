# JWT Authentication System for Admin Panel

This document explains the JWT-based authentication system implemented for the LejGoPro admin panel.

## Overview

The authentication system follows security best practices:
- **Access tokens**: Short-lived (15 minutes), stored in memory for API requests
- **Refresh tokens**: Long-lived (7 days), stored in secure HTTP-only cookies
- **Automatic token refresh**: Seamless renewal without user intervention
- **Secure logout**: Clears all tokens and redirects to login

## Setup

### 1. Environment Variables

Create a `.env` file (copy from `.env.example`) with the following variables:

```env
# JWT Secrets - CHANGE THESE IN PRODUCTION!
JWT_ACCESS_SECRET=your-super-secret-access-token-key-change-in-production-123456789
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-in-production-987654321

# Admin Credentials - CHANGE THESE IN PRODUCTION!
ADMIN_EMAIL=admin@lejgopro.dk
ADMIN_PASSWORD=admin123
```

⚠️ **Security Note**: In production, use strong, randomly generated secrets and secure admin credentials.

### 2. Default Credentials

For development/testing:
- **Email**: `admin@lejgopro.dk`
- **Password**: `admin123`

## API Endpoints

### Authentication Endpoints

- **POST** `/api/auth/login` - Login with email/password
- **POST** `/api/auth/refresh` - Refresh access token using refresh token cookie
- **POST** `/api/auth/logout` - Logout and clear refresh token cookie
- **GET** `/api/auth/verify` - Verify access token validity

### Login Request/Response

**Request:**
```json
{
  "email": "admin@lejgopro.dk",
  "password": "admin123",
  "rememberMe": false
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin",
    "email": "admin@lejgopro.dk",
    "role": "admin"
  },
  "message": "Login successful"
}
```

## Client-Side Usage

### Using the Auth Composable

```typescript
// In your Vue component
<script setup>
const auth = useAuth()

// Login
const handleLogin = async () => {
  const result = await auth.login(email.value, password.value)
  if (result.success) {
    await navigateTo('/admin')
  }
}

// Logout
const handleLogout = async () => {
  await auth.logout()
}

// Check authentication state
const isLoggedIn = auth.isLoggedIn.value
const user = auth.user.value
</script>
```

### Making Authenticated API Calls

```typescript
// Use the authenticatedFetch method for protected endpoints
const auth = useAuth()

try {
  const data = await auth.authenticatedFetch('/api/admin/data')
  console.log(data)
} catch (error) {
  // Will automatically handle token refresh on 401 errors
  // If refresh fails, user will be redirected to login
}
```

## Security Features

### Token Storage
- **Access tokens**: Stored in memory (JavaScript variables) - Not accessible to XSS attacks
- **Refresh tokens**: Stored in HTTP-only cookies - Not accessible to JavaScript

### Automatic Token Refresh
- Access tokens are automatically refreshed when they expire
- Users stay logged in without interruption
- Failed refresh attempts redirect to login page

### Route Protection
- Admin middleware protects all `/admin/*` routes except `/admin/login`
- Automatically redirects unauthenticated users to login page
- Verifies user role permissions

### Cookie Security
- HTTP-only cookies prevent XSS access
- Secure flag enabled in production
- SameSite strict policy
- Path-restricted to root

## Architecture

### Files Structure

```
frontend/
├── server/
│   ├── utils/
│   │   └── jwt.ts                    # JWT utility functions
│   └── api/
│       └── auth/
│           ├── login.post.ts         # Login endpoint
│           ├── refresh.post.ts       # Token refresh endpoint
│           ├── logout.post.ts        # Logout endpoint
│           └── verify.get.ts         # Token verification endpoint
├── composables/
│   └── useAuth.ts                    # Authentication composable
├── middleware/
│   └── admin.ts                      # Route protection middleware
├── plugins/
│   └── auth.client.ts                # Authentication initialization
└── pages/
    └── admin/
        ├── login.vue                 # Login page
        └── index.vue                 # Protected admin panel
```

### Token Workflow

1. **Login**: User submits credentials → Server validates → Returns access token + sets refresh token cookie
2. **API Requests**: Client includes access token in Authorization header
3. **Token Expiry**: Server returns 401 → Client automatically refreshes → Retries original request
4. **Logout**: Client calls logout API → Server clears refresh token cookie

## Production Considerations

1. **Change Default Credentials**: Use strong, unique admin credentials
2. **Environment Secrets**: Use secure, randomly generated JWT secrets
3. **HTTPS Only**: Ensure all production traffic uses HTTPS
4. **Token Rotation**: Consider implementing refresh token rotation for enhanced security
5. **Rate Limiting**: Add rate limiting to login endpoints
6. **Audit Logging**: Log authentication events for security monitoring

## Testing

1. **Test Route Protection**:
   - Navigate directly to `/admin` while logged out - should redirect to `/admin/login`
   - Navigate to `/admin/login` - should be accessible without authentication
   
2. **Test Login Flow**:
   - Login with default credentials (`admin@lejgopro.dk` / `admin123`)
   - Should redirect to `/admin` after successful login
   - Should see admin panel content
   
3. **Test Session Persistence**:
   - Refresh the page while logged in - should stay on admin panel
   - Open new tab and go to `/admin` - should remain authenticated
   
4. **Test Logout**:
   - Click "Log ud" button - should redirect to `/admin/login`
   - Try accessing `/admin` again - should redirect to login
   
5. **Test Token Refresh**:
   - Stay logged in and wait 15+ minutes, then make API calls
   - Should automatically refresh tokens in background

## Troubleshooting

### Common Issues

1. **"useAuth is not defined"**: Restart the development server to clear TypeScript cache
2. **Token verification fails**: Check JWT secrets in environment variables
3. **Infinite redirect loops**: Verify middleware configuration and cookie settings
4. **401 errors**: Check that access tokens are being sent with requests

### Debug Mode

Add this to your component to debug authentication state:

```typescript
const auth = useAuth()
console.log('Auth state:', {
  isLoggedIn: auth.isLoggedIn.value,
  user: auth.user.value,
  hasToken: !!auth.getAccessToken()
})
```