# Error Handling Forbedringer til LejGoPro

## Nuværende Status

### ✅ Hvad der fungerer:
1. Try-catch blokke i frontend komponenter
2. Error states vises til brugere
3. Console logging til debugging
4. Validering før API kald

### ❌ Problemer:
1. **Ingen rollback-mekanisme** - Hvis PensoPay fejler efter bookinger er oprettet, bliver kameraer låst
2. **Ingen timeout håndtering** - Brugere kan vente i uendelighed
3. **Ingen retry-logik** - Midlertidige fejl kræver manuel retry
4. **Generiske fejlbeskeder** - Brugere ved ikke hvad de skal gøre
5. **Ingen error monitoring** - Fejl logges kun i console

---

## Foreslåede Forbedringer

### 1. **Rollback Mekanisme til Bookinger**

Hvis PensoPay fejler, skal bookinger annulleres automatisk.

**Implementation i `/api/payment/create.post.ts`:**

```typescript
export default defineEventHandler(async (event) => {
  const bookingIds: number[] = []
  
  try {
    // ... existing booking creation code ...
    
    // Save booking IDs for potential rollback
    bookingIds.push(...createdBookingIds)
    
    // Create PensoPay payment
    const payment = await createPensoPayPayment(...)
    
    if (!payment.id) {
      throw new Error('Payment creation failed')
    }
    
    return { success: true, paymentUrl: payment.link }
    
  } catch (error: any) {
    console.error('Payment creation failed, rolling back bookings:', error)
    
    // ROLLBACK: Cancel all created bookings
    if (bookingIds.length > 0) {
      await supabase
        .from('Booking')
        .update({ 
          paymentStatus: 'cancelled',
          notes: 'Auto-cancelled: Payment creation failed'
        })
        .in('id', bookingIds)
      
      console.log(`✅ Rolled back ${bookingIds.length} bookings`)
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Payment creation failed'
    })
  }
})
```

---

### 2. **Timeout Håndtering**

Tilføj timeouts til alle eksterne API kald.

**Implementation i `PensoPayment.vue`:**

```typescript
// Helper function for timeout
const fetchWithTimeout = async (url: string, options: any, timeoutMs = 30000) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const response = await $fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet connection.')
    }
    throw error
  }
}

// Usage
const bookingResponse = await fetchWithTimeout('/api/booking', {
  method: 'POST',
  body: bookingPayload
}, 30000) // 30 second timeout
```

---

### 3. **Retry Logik med Exponential Backoff**

Automatisk retry ved midlertidige netværksfejl.

**Implementation:**

```typescript
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries
      const isRetryableError = 
        error.statusCode >= 500 || 
        error.message?.includes('network') ||
        error.message?.includes('timeout')
      
      if (isLastAttempt || !isRetryableError) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const bookingResponse = await retryWithBackoff(
  () => $fetch('/api/booking', { method: 'POST', body: bookingPayload }),
  3
)
```

---

### 4. **Bedre Fejlbeskeder til Brugere**

Vis specifikke, handlingsbare fejlbeskeder.

**Implementation i `PensoPayment.vue`:**

```typescript
const getErrorMessage = (error: any): string => {
  const errorMsg = error.statusMessage || error.message || ''
  
  // Specific error cases with user-friendly Danish messages
  if (errorMsg.includes('ACCESSORY_UNAVAILABLE')) {
    const items = errorMsg.replace(/.*ACCESSORY_UNAVAILABLE:/, '').trim()
    return `Desværre er følgende udstyr ikke længere tilgængeligt: ${items}. Prøv at justere din booking.`
  }
  
  if (errorMsg.includes('CAMERA_UNAVAILABLE')) {
    return 'Desværre er der ikke flere kameraer tilgængelige i den valgte periode. Prøv en anden dato eller reducer antallet.'
  }
  
  if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
    return 'Anmodningen tog for lang tid. Tjek din internetforbindelse og prøv igen.'
  }
  
  if (errorMsg.includes('network') || errorMsg.includes('fetch failed')) {
    return 'Netværksfejl. Tjek din internetforbindelse og prøv igen.'
  }
  
  if (error.statusCode === 400) {
    return 'Ugyldig booking information. Tjek venligst alle felter og prøv igen.'
  }
  
  if (error.statusCode === 500) {
    return 'Der opstod en serverfejl. Prøv igen om lidt eller kontakt os hvis problemet fortsætter.'
  }
  
  // Generic fallback
  return 'Betalingen kunne ikke oprettes. Prøv igen om lidt. Hvis problemet fortsætter, kontakt os venligst.'
}
```

---

### 5. **Error Monitoring & Logging**

Track fejl for at identificere problemer proaktivt.

**Option A: Simple Server-side Logging**

```typescript
// server/api/log-error.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: body.type,
    message: body.message,
    userEmail: body.userEmail,
    stack: body.stack,
    context: body.context
  }
  
  // Log to Supabase error_logs table
  await supabase
    .from('error_logs')
    .insert(errorLog)
  
  return { success: true }
})
```

**Option B: Integration med Sentry (anbefalet)**

```bash
npm install @sentry/vue
```

```typescript
// plugins/sentry.client.ts
import * as Sentry from '@sentry/vue'

export default defineNuxtPlugin((nuxtApp) => {
  Sentry.init({
    app: nuxtApp.vueApp,
    dsn: 'YOUR_SENTRY_DSN',
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  })
})
```

---

### 6. **Health Check Endpoint**

Overvåg om PensoPay og Supabase er tilgængelige.

**Implementation:**

```typescript
// server/api/health.get.ts
export default defineEventHandler(async (event) => {
  const health = {
    timestamp: new Date().toISOString(),
    services: {
      supabase: 'unknown',
      pensopay: 'unknown'
    }
  }
  
  // Check Supabase
  try {
    const { error } = await supabase.from('Product').select('id').limit(1)
    health.services.supabase = error ? 'down' : 'up'
  } catch {
    health.services.supabase = 'down'
  }
  
  // Check PensoPay (optional - only if needed)
  // ... similar check ...
  
  return health
})
```

---

### 7. **Graceful Degradation**

Hvis dele af systemet fejler, lad resten fungere.

**Example: Accessories optional hvis de fejler**

```typescript
try {
  const accessories = await fetchAccessories()
  booking.accessories = accessories
} catch (error) {
  console.error('Accessories fetch failed, continuing without them:', error)
  // Don't fail entire booking - just log and continue
  booking.accessories = []
  error.value = 'Bemærk: Nogle tilbehør kunne ikke indlæses.'
}
```

---

## Prioriteret Implementation Plan

### Fase 1 (Kritisk - Implementer NU):
- [ ] Rollback mekanisme til bookinger
- [ ] Timeout håndtering (30s timeout)
- [ ] Bedre fejlbeskeder på dansk

### Fase 2 (Vigtigt):
- [ ] Retry logik med exponential backoff
- [ ] Error logging til database
- [ ] Health check endpoint

### Fase 3 (Nice to have):
- [ ] Sentry integration
- [ ] Graceful degradation
- [ ] Email notifikationer ved kritiske fejl

---

## Testing Fejlscenarier

Test følgende situationer:

1. **PensoPay er nede** - Mock API failure
2. **Slow network** - Throttle network i DevTools
3. **Database fejl** - Simuler Supabase fejl
4. **Timeout** - Hold API request i >30s
5. **Ingen tilgængelige kameraer** - Book alle kameraer først
6. **Ingen internetforbindelse** - Gå offline mode

---

## Monitoring Dashboard (Fremtidig)

Overvej at bygge et simpelt admin dashboard der viser:
- Fejlrate over tid
- Mest almindelige fejl
- Gennemsnitlig responstid
- Success rate for bookinger
- PensoPay success rate

Dette kan bygges med data fra error_logs tabellen.
