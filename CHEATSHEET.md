# LejGoPro - Project Cheatsheet

## 📋 Projekt Oversigt
**Formål:** GoPro kamera udlejningssystem med online booking, betaling og admin panel  
**Type:** Full-stack web applikation (SSR + SPA)  
**Primære funktioner:** Produktvisning, booking flow, betaling, forsendelse, admin CRUD

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Nuxt 3 (Vue.js 3 med SSR)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Nuxt UI
- **State Management:** Pinia stores
- **Date Picker:** @vuepic/vue-datepicker
- **Build Tool:** Vite

### Backend
- **Runtime:** Nuxt Server Routes (h3)
- **API Style:** RESTful endpoints i `/server/api/`
- **Authentication:** JWT tokens (jsonwebtoken)
- **Validation:** Zod schemas

### Database
- **Provider:** Supabase (PostgreSQL BaaS)
- **ORM:** @supabase/supabase-js client
- **Features:** RLS (Row Level Security), Real-time subscriptions

### Eksterne APIs
- **Betaling:** PensoPay 
- **Email:** SMTP (nodemailer)

### Utilities
- **PDF Generator:** jspdf
- **QR Koder:** qrcode
- **HTML Sanitization:** dompurify + jsdom
- **Testing:** Vitest
- **Deployment:** Netlify
- **CI/CD:** GitHub Actions

---

## 📁 Projekt Struktur

```
frontend/
├── pages/               # Vue Router sider (auto-routing)
│   ├── index.vue       # Forside med hero + produkter
│   ├── checkout.vue    # Booking flow (3 steps)
│   ├── products.vue    # Produkt katalog
│   └── admin/          # Admin panel (JWT protected)
│       ├── index.vue   # Hovedpanel (5 tabs)
│       └── login.vue   # Admin login
├── components/         # Genbrugelige Vue komponenter
│   ├── booking/        # Booking flow komponenter
│   ├── admin/          # Admin specifikke komponenter
│   └── integrations/   # Integration status dashboards
├── server/
│   ├── api/            # Backend API endpoints
│   │   ├── admin/      # Admin CRUD operationer
│   │   ├── booking/    # Booking management
│   │   ├── email/      # Email forsendelse
│   │   ├── payment/    # PensoPay integration
│   └── utils/          # Server utilities (auth, supabase)
├── composables/        # Vue composables (reusable logic)
├── stores/             # Pinia state stores
├── types/              # TypeScript type definitions
└── public/             # Statiske assets (billeder)
```

---

## 🗄️ Database Schema (Supabase)

### **Product** (GoPro modeller)
```sql
id, name, features, dailyPrice, weeklyPrice, twoWeekPrice, 
popular, quantity, imageUrl
```
**1-to-many** → Camera

### **Camera** (Individuelle kameraer)
```sql
id, productId, dailyPrice, weeklyPrice, twoWeekPrice
```
**Relation:** Hver Camera tilhører én Product

### **Accessory** (Tilbehør som Grip, Mount)
```sql
id, name, description, price (øre), quantity, imageUrl
```
**1-to-many** → AccessoryInstance

### **AccessoryInstance** (Fysiske enheder)
```sql
id, accessoryId, serialNumber, isAvailable
```
**Eksempel:** "Grip #1", "Grip #2"

### **Booking** (Kunde ordrer)
```sql
id, orderId, cameraId, productName, cameraName,
fullName, email, phone, address, city, postalCode,
startDate, endDate, totalPrice (øre), paymentStatus,
paymentId, accessoryInstanceIds, trackingNumber
```
**Normalisering:** Base orderId (fx ORDER-123) + sub-IDs (ORDER-123-1, ORDER-123-2)

---

## 🔐 Authentication & Security

### Admin Authentication
- **Method:** JWT tokens (HS256)
- **Storage:** httpOnly cookies
- **Middleware:** `/server/utils/adminAuth.ts`
- **Protected Routes:** `/api/admin/*`

```typescript
// Backend validation
authenticateAdmin(event) // Throws error hvis ikke admin

// Frontend composable
const auth = useAuth()
auth.authenticatedFetch('/api/admin/products') // Auto JWT header
```

### Environment Variables (.env)
```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Server-side only
ADMIN_JWT_SECRET=your-secret-key
PENSOPAY_API_KEY=xxx
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-password
```

---

## 💳 PensoPay Integration (Betaling)

### Flow
1. **Create Payment:** POST `/api/payment/create` → PensoPay API
2. **Redirect:** Kunde sendes til PensoPay hosted payment side
3. **Callback:** PensoPay kalder `/api/payment/callback` efter betaling
4. **Update:** Booking status opdateres til "paid"

### Endpoints
- `POST /api/payment/create` - Opretter betalingslink
- `POST /api/payment/callback` - Webhook fra PensoPay
- `/payment/success` - Success redirect side
- `/payment/cancelled` - Cancel redirect side

### Test Mode
```typescript
testmode: process.env.NODE_ENV !== 'production' // true i dev
```

---

## 📧 Email System

### SMTP Setup (nodemailer)
```typescript
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: 'xxx', pass: 'xxx' }
})
```

### Email Types
1. **Receipt Email** - Sendes efter booking (inkl. PDF faktura)
2. **Payment Request** - Ved tilføjelse af ekstra kamera
3. **Shipping Confirmation** - Med tracking nummer

### PDF Faktura Generator
**Library:** jspdf  
**Location:** `/utils/pdfGenerator.ts`

```typescript
import { generateReceiptPDF } from '@/utils/pdfGenerator'
const pdfBuffer = await generateReceiptPDF(bookingData)
```

**Inkluderer:**
- Logo, ordre nummer, kunde info
- Itemized list (produkt + tilbehør)
- Priser, total, datoer
- QR kode med tracking

---

## 🎨 Frontend Komponenter

### Key Components

**`/components/booking/ProductStep.vue`**
- Produkt valg, dato valg, tilbehør
- Availability checking
- Pris beregning baseret på periode

**`/components/booking/DeliveryStep.vue`**
- Kunde info formular
- Validering med Zod

**`/components/booking/PaymentStep.vue`**
- Ordre sammenfatning
- PensoPay betalingsintegration
- Send til betaling knap

**`/pages/admin/index.vue`** (3100+ linjer!)
- 5 tabs: Produkter, Tilbehør, Ordrer, Lager, Integrationer
- CRUD for alt
- Tilføj kamera til eksisterende ordre

---

## 🔄 Composables (Reusable Logic)

### `useAuth.ts`
```typescript
const auth = useAuth()
auth.login(email, password)  // JWT login
auth.logout()                // Clear token
auth.isAuthenticated()       // Check status
auth.authenticatedFetch()    // Auto JWT headers
```

### `useAvailability.ts`
```typescript
const { checkAvailability, isProductAvailable } = useAvailability()
await checkAvailability(startDate, endDate, productIds, accessoryIds)
const available = isProductAvailable(productId, quantity)
```

### `useSupabase.ts`
```typescript
const supabase = useSupabase()
const { data } = await supabase.from('Product').select('*')
```

---

## 📊 State Management (Pinia)

### `/stores/checkout.ts`
```typescript
const checkout = useCheckoutStore()
checkout.selectedModels = [...]
checkout.selectedAccessories = [...]
checkout.startDate = '2026-01-30'
checkout.calculateTotalPrice()
```

### `/stores/inventory.ts`
- Real-time inventory tracking
- Availability caching
- Booking overlap detection

---

## 🧪 Testing

### Vitest Setup
**Config:** `vitest.config.ts` (i rod eller inline i nuxt.config.ts)

**Test Fil:** `/server/api/pricing.test.ts`
```typescript
import { describe, it, expect } from 'vitest'

describe('Pricing API', () => {
  it('should calculate correct daily price', () => {
    expect(calculatePrice(5, 100)).toBe(500)
  })
})
```

**Run Tests:**
```bash
npm test           # Watch mode
npx vitest run     # Single run (CI)
npx vitest --coverage  # Med coverage
```

---

## 🚀 Deployment & CI/CD

### Netlify Deployment
**Config:** `netlify.toml`
```toml
[build]
  command = "cd frontend && npm run build"
  publish = "frontend/.output/public"
```

**Environment Variables:** Sættes i Netlify dashboard under Site Settings → Environment Variables

### GitHub Actions CI
**File:** `.github/workflows/ci.yml`

**Workflow:**
1. Checkout kode
2. Setup Node.js 22
3. Install dependencies (`npm ci`)
4. Run tests (`npx vitest run`)

**Triggers:** Push/PR til `main` branch

---

## 📝 Vigtige API Endpoints

### Public (Frontend)
```
GET  /api/products.get.ts          # Hent alle produkter + kameraer
GET  /api/availability.get.ts      # Check tilgængelighed
POST /api/booking.post.ts          # Opret booking
POST /api/payment/create           # Opret betaling
```

### Admin (JWT Protected)
```
GET  /api/admin/products           # Hent produkter
POST /api/admin/products           # Opret/opdater produkt
DELETE /api/admin/products         # Slet produkt
POST /api/admin/add-camera-to-order  # Tilføj ekstra kamera
POST /api/admin/accessories        # CRUD tilbehør
GET  /api/admin/bookings           # Hent alle bookings
```

---

## ⚙️ Konfiguration

### `nuxt.config.ts`
```typescript
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@pinia/nuxt', '@nuxt/image'],
  
  runtimeConfig: {
    // Server-side only
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminJwtSecret: process.env.ADMIN_JWT_SECRET,
    
    public: {
      // Client + Server
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      pensopayApiKey: process.env.PENSOPAY_API_KEY
    }
  }
})
```

### `tailwind.config.ts`
- Custom colors, fonts, responsive breakpoints
- Basis for Nuxt UI komponenter

---

## 🔧 Nyttige Kommandoer

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Building
npm run build            # Production build
npm run preview          # Preview production build

# Testing
npm test                 # Run tests (watch mode)
npx vitest run           # Run tests once
npx vitest --coverage    # Med code coverage

# Database
# Kør SQL queries i Supabase SQL Editor

# Deployment
git push origin main     # Auto-deploy via Netlify

# CI/CD
git push                 # Trigger GitHub Actions
```

---

## 🐛 Common Issues & Solutions

### "Could not find column in schema cache"
**Problem:** Supabase cache ikke opdateret  
**Fix:** Genstart Supabase projekt eller refresh schema

### "npm ci requires package-lock.json"
**Problem:** Manglende eller korrupt package-lock.json  
**Fix:** `npm install` → commit package-lock.json

### "Authentication required"
**Problem:** JWT token ugyldig/mangler  
**Fix:** Login igen eller tjek adminAuth middleware

### "Price shows 0.50 kr instead of 50 kr"
**Problem:** Pris ikke konverteret til øre  
**Fix:** Multiplicer med 100 før gem: `price * 100`

---

## 📚 Dokumentation Links

- **Nuxt 3:** https://nuxt.com/docs
- **Vue 3:** https://vuejs.org/guide
- **Supabase:** https://supabase.com/docs
- **Pinia:** https://pinia.vuejs.org
- **Tailwind CSS:** https://tailwindcss.com/docs
- **PensoPay API:** https://pensopay.com/docs/api
- **Vitest:** https://vitest.dev

---

## 🎓 Eksamen Nøglepunkter

### Separation of Concerns
- **Frontend:** UI/UX, bruger interaktion
- **Backend:** Business logic, validation, eksterne API calls
- **Database:** Data persistence, relationships

### BaaS Fordele (Supabase)
- Auto-scaling, backup, sikkerhed inkluderet
- Real-time subscriptions out-of-the-box
- PostgreSQL med admin GUI
- Reducerer DevOps overhead

### Database Normalisering
- 1-to-many relations (Product → Camera)
- Foreign keys for data integritet
- Indexes for performance (cameraId, orderId)

### CI/CD Benefits
- Automatisk test før deploy
- Fang fejl tidligt
- Konsistent deployment process
- Team collaboration forbedres

---

**Oprettet:** 2026-01-27  
**Projekt:** LejGoPro GoPro Rental System  
**Version:** 1.0
